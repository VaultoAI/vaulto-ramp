import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Transaction, TransactionStatus, WalletState } from '../types';
import { usdToEth } from '../utils/formatters';
import { useEthPrice } from '../hooks/useEthPrice';

interface WalletContextType {
  wallet: WalletState;
  buyCrypto: (usdAmount: number, externalAddress: string) => Promise<string>;
  receiveCrypto: (ethAmount: number) => Promise<string>;
  sendCrypto: (txHash: string, ethAmount: number, usdAmount: number, toAddress: string) => string;
  updateTransactionStatus: (txHash: string, status: TransactionStatus) => void;
  generateAddress: () => string;
  addDetectedTransaction: (txHash: string, amount: number, address: string) => string;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const generateMockAddress = (): string => {
  const chars = '0123456789abcdef';
  return '0x' + Array.from({ length: 40 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const generateTransactionId = (): string => {
  return 'tx_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { price: ethPrice } = useEthPrice();
  const [wallet, setWallet] = useState<WalletState>({
    balance: 0,
    address: generateMockAddress(),
    transactions: [],
  });

  const buyCrypto = useCallback(async (usdAmount: number, externalAddress: string): Promise<string> => {
    const ethAmount = usdToEth(usdAmount, ethPrice);
    const transactionId = generateTransactionId();

    const transaction: Transaction = {
      id: transactionId,
      type: 'onramp',
      amount: ethAmount,
      usdAmount,
      status: 'pending',
      timestamp: new Date(),
      address: externalAddress,
    };

    setWallet((prev) => ({
      ...prev,
      transactions: [transaction, ...prev.transactions],
    }));

    setTimeout(() => {
      setWallet((prev) => ({
        ...prev,
        transactions: prev.transactions.map((tx) =>
          tx.id === transactionId ? { ...tx, status: 'processing' } : tx
        ),
      }));
    }, 1000);

    setTimeout(() => {
      setWallet((prev) => ({
        ...prev,
        balance: prev.balance + ethAmount,
        transactions: prev.transactions.map((tx) =>
          tx.id === transactionId ? { ...tx, status: 'completed' } : tx
        ),
      }));
    }, 3000);

    return transactionId;
  }, [ethPrice]);

  const receiveCrypto = useCallback(async (ethAmount: number): Promise<string> => {
    const transactionId = generateTransactionId();

    const transaction: Transaction = {
      id: transactionId,
      type: 'offramp',
      amount: ethAmount,
      status: 'pending',
      timestamp: new Date(),
      address: wallet.address,
    };

    setWallet((prev) => ({
      ...prev,
      transactions: [transaction, ...prev.transactions],
    }));

    setTimeout(() => {
      setWallet((prev) => ({
        ...prev,
        transactions: prev.transactions.map((tx) =>
          tx.id === transactionId ? { ...tx, status: 'processing' } : tx
        ),
      }));
    }, 1000);

    setTimeout(() => {
      setWallet((prev) => ({
        ...prev,
        balance: prev.balance + ethAmount,
        transactions: prev.transactions.map((tx) =>
          tx.id === transactionId ? { ...tx, status: 'completed' } : tx
        ),
      }));
    }, 3000);

    return transactionId;
  }, [wallet.address]);

  const generateAddress = useCallback((): string => {
    const newAddress = generateMockAddress();
    setWallet((prev) => ({ ...prev, address: newAddress }));
    return newAddress;
  }, []);

  const sendCrypto = useCallback((txHash: string, ethAmount: number, usdAmount: number, toAddress: string): string => {
    const transactionId = generateTransactionId();
    
    const transaction: Transaction = {
      id: transactionId,
      type: 'offramp',
      amount: ethAmount,
      usdAmount,
      status: 'processing',
      timestamp: new Date(),
      address: toAddress,
      txHash,
    };

    setWallet((prev) => ({
      ...prev,
      transactions: [transaction, ...prev.transactions],
      balance: prev.balance - ethAmount,
    }));

    return transactionId;
  }, []);

  const updateTransactionStatus = useCallback((txHash: string, status: TransactionStatus): void => {
    setWallet((prev) => ({
      ...prev,
      transactions: prev.transactions.map((tx) =>
        tx.txHash === txHash ? { ...tx, status } : tx
      ),
    }));
  }, []);

  const addDetectedTransaction = useCallback((txHash: string, amount: number, address: string): string => {
    const transactionId = generateTransactionId();
    
    const transaction: Transaction = {
      id: transactionId,
      type: 'onramp',
      amount,
      status: 'processing',
      timestamp: new Date(),
      address,
      txHash,
    };

    setWallet((prev) => ({
      ...prev,
      transactions: [transaction, ...prev.transactions],
      balance: prev.balance + amount,
    }));

    // Update to completed after a short delay
    setTimeout(() => {
      setWallet((prev) => ({
        ...prev,
        transactions: prev.transactions.map((tx) =>
          tx.id === transactionId ? { ...tx, status: 'completed' } : tx
        ),
      }));
    }, 2000);

    return transactionId;
  }, []);

  return (
    <WalletContext.Provider value={{ wallet, buyCrypto, receiveCrypto, sendCrypto, updateTransactionStatus, generateAddress, addDetectedTransaction }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

