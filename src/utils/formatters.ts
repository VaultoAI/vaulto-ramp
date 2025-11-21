const ETH_DECIMALS = 6;
const USD_DECIMALS = 2;

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

export const ETH_TO_USD_RATE = 2000;

export const usdToEth = (usdAmount: number): number => {
  return usdAmount / ETH_TO_USD_RATE;
};

export const ethToUsd = (ethAmount: number): number => {
  return ethAmount * ETH_TO_USD_RATE;
};

