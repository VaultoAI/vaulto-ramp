const ETH_DECIMALS = 6;
const USD_DECIMALS = 2;
const FALLBACK_ETH_PRICE = 2000; // Fallback price if not provided

export const formatETH = (amount: number): string => {
  return amount.toFixed(ETH_DECIMALS);
};

export const formatUSD = (amount: number): string => {
  return amount.toFixed(USD_DECIMALS);
};

export const formatAddress = (address: string): string => {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * @deprecated Use usdToEth with price parameter instead
 * Kept for backward compatibility
 */
export const ETH_TO_USD_RATE = FALLBACK_ETH_PRICE;

/**
 * Converts USD amount to ETH using the current market price
 * @param usdAmount - Amount in USD
 * @param ethPriceUsd - Current ETH price in USD (defaults to fallback price)
 * @returns Equivalent amount in ETH
 */
export const usdToEth = (usdAmount: number, ethPriceUsd: number = FALLBACK_ETH_PRICE): number => {
  if (ethPriceUsd <= 0) {
    console.warn('Invalid ETH price, using fallback');
    ethPriceUsd = FALLBACK_ETH_PRICE;
  }
  return usdAmount / ethPriceUsd;
};

/**
 * Converts ETH amount to USD using the current market price
 * @param ethAmount - Amount in ETH
 * @param ethPriceUsd - Current ETH price in USD (defaults to fallback price)
 * @returns Equivalent amount in USD
 */
export const ethToUsd = (ethAmount: number, ethPriceUsd: number = FALLBACK_ETH_PRICE): number => {
  if (ethPriceUsd <= 0) {
    console.warn('Invalid ETH price, using fallback');
    ethPriceUsd = FALLBACK_ETH_PRICE;
  }
  return ethAmount * ethPriceUsd;
};

/**
 * Formats error messages to be user-friendly and professional
 * Removes technical details and provides concise, actionable messages
 * @param error - Error object or error message string
 * @returns User-friendly error message
 */
export const formatErrorMessage = (error: unknown): string => {
  if (!error) {
    return 'An unexpected error occurred';
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  // User rejection errors
  if (
    lowerMessage.includes('user rejected') ||
    lowerMessage.includes('user denied') ||
    lowerMessage.includes('user cancelled') ||
    lowerMessage.includes('rejected the request')
  ) {
    return 'Transaction cancelled';
  }

  // Insufficient funds errors
  if (
    lowerMessage.includes('insufficient funds') ||
    lowerMessage.includes('insufficient balance') ||
    lowerMessage.includes('exceeds balance')
  ) {
    return 'Insufficient balance';
  }

  // Network errors
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('connection') ||
    lowerMessage.includes('timeout')
  ) {
    return 'Network error. Please try again';
  }

  // Gas/transaction errors
  if (
    lowerMessage.includes('gas') ||
    lowerMessage.includes('transaction underpriced') ||
    lowerMessage.includes('replacement fee too low')
  ) {
    return 'Transaction failed. Please try again';
  }

  // Invalid address errors
  if (
    lowerMessage.includes('invalid address') ||
    lowerMessage.includes('invalid ethereum address')
  ) {
    return 'Invalid address';
  }

  // Generic transaction failure
  if (lowerMessage.includes('transaction failed') || lowerMessage.includes('transaction reverted')) {
    return 'Transaction failed. Please try again';
  }

  // If it's a short, user-friendly message already, return it
  if (errorMessage.length < 100 && !errorMessage.includes('Request Arguments') && !errorMessage.includes('Version:')) {
    return errorMessage;
  }

  // Default fallback for verbose technical errors
  return 'Transaction failed. Please try again';
};

