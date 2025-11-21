import { isAddress } from 'viem';

export const validateAmount = (amount: string): { isValid: boolean; error?: string } => {
  if (!amount || amount.trim() === '') {
    return { isValid: false, error: 'Amount is required' };
  }

  const numAmount = parseFloat(amount);
  
  if (isNaN(numAmount)) {
    return { isValid: false, error: 'Invalid number' };
  }

  if (numAmount <= 0) {
    return { isValid: false, error: 'Amount must be greater than 0' };
  }

  if (numAmount > 1000000) {
    return { isValid: false, error: 'Amount exceeds maximum limit' };
  }

  return { isValid: true };
};

export const validateEthAmount = (amount: string): { isValid: boolean; error?: string } => {
  const result = validateAmount(amount);
  if (!result.isValid) return result;

  const numAmount = parseFloat(amount);
  if (numAmount < 0.000001) {
    return { isValid: false, error: 'Amount too small (minimum 0.000001 ETH)' };
  }

  return { isValid: true };
};

export const validateUsdAmount = (amount: string): { isValid: boolean; error?: string } => {
  const result = validateAmount(amount);
  if (!result.isValid) return result;

  const numAmount = parseFloat(amount);
  if (numAmount < 1) {
    return { isValid: false, error: 'Minimum amount is $1' };
  }

  return { isValid: true };
};

export const validateEthAddress = (address: string): { isValid: boolean; error?: string } => {
  if (!address || address.trim() === '') {
    return { isValid: false, error: 'Ethereum address is required' };
  }

  const trimmedAddress = address.trim();
  
  // Use viem's isAddress for proper validation
  if (!isAddress(trimmedAddress)) {
    return { isValid: false, error: 'Invalid Ethereum address format' };
  }
  
  return { isValid: true };
};

