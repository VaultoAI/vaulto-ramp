export type TransactionType = 'onramp' | 'offramp';

export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  usdAmount?: number;
  status: TransactionStatus;
  timestamp: Date;
  address?: string;
  txHash?: string;
}

export interface WalletState {
  balance: number;
  address: string;
  transactions: Transaction[];
}

