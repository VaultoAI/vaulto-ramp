import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Transaction, TransactionStatus, WalletState } from '../types';
import { usdToEth, ethToUsd } from '../utils/formatters';
import { useEthPrice } from '../hooks/useEthPrice';

interface WalletContextType {
  wallet: WalletState;
  buyCrypto: (usdAmount: number, externalAddress: string) => Promise<string>;
  receiveCrypto: (ethAmount: number) => Promise<string>;
  sendCrypto: (txHash: string, ethAmount: number, usdAmount: number, toAddress: string) => string;
  updateTransactionStatus: (txHash: string, status: TransactionStatus) => void;
  generateAddress: () => string;
  addDetectedTransaction: (txHash: string, amount: number, address: string, status: TransactionStatus) => string;
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
    let transactionId: string;
    
    setWallet((prev) => {
      // Check if a transaction with this hash already exists
      const existingTransaction = prev.transactions.find(
        (tx) => tx.txHash && tx.txHash.toLowerCase() === txHash.toLowerCase()
      );

      // If transaction already exists, return its ID without modifying state
      if (existingTransaction) {
        transactionId = existingTransaction.id;
        return prev;
      }

      // Create new transaction
      const newTransactionId = generateTransactionId();
      transactionId = newTransactionId;
      
      const transaction: Transaction = {
        id: newTransactionId,
        type: 'offramp',
        amount: ethAmount,
        usdAmount,
        status: 'processing',
        timestamp: new Date(),
        address: toAddress,
        txHash,
      };

      return {
        ...prev,
        transactions: [transaction, ...prev.transactions],
        balance: prev.balance - ethAmount,
      };
    });

    return transactionId!;
  }, []);

  const updateTransactionStatus = useCallback((txHash: string, status: TransactionStatus): void => {
    setWallet((prev) => ({
      ...prev,
      transactions: prev.transactions.map((tx) =>
        tx.txHash === txHash ? { ...tx, status } : tx
      ),
    }));
  }, []);

  const addDetectedTransaction = useCallback((txHash: string, amount: number, address: string, status: TransactionStatus): string => {
    const transactionId = generateTransactionId();
    const usdAmount = ethToUsd(amount, ethPrice);
    
    const transaction: Transaction = {
      id: transactionId,
      type: 'onramp',
      amount,
      usdAmount,
      status,
      timestamp: new Date(),
      address,
      txHash,
    };

    setWallet((prev) => ({
      ...prev,
      transactions: [transaction, ...prev.transactions],
      balance: prev.balance + amount,
    }));

    return transactionId;
  }, [ethPrice]);

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

