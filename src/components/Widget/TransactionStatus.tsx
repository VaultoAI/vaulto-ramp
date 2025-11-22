import React from 'react';
import { useChainId } from 'wagmi';
import { Transaction, TransactionStatus } from '../../types';
import { formatETH, formatUSD, formatAddress } from '../../utils/formatters';

interface TransactionStatusProps {
  transaction: Transaction;
}

const statusConfig: Record<TransactionStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  processing: { label: 'Sent - Pending Confirmation', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  completed: { label: 'Confirmed', color: 'text-green-600', bgColor: 'bg-green-100' },
  failed: { label: 'Failed', color: 'text-red-600', bgColor: 'bg-red-100' },
};

const getEtherscanUrl = (txHash: string, chainId: number): string => {
  // Mainnet chain ID is 1, Sepolia is 11155111
  if (chainId === 1) {
    return `https://etherscan.io/tx/${txHash}`;
  } else if (chainId === 11155111) {
    return `https://sepolia.etherscan.io/tx/${txHash}`;
  }
  // Default to mainnet if unknown chain
  return `https://etherscan.io/tx/${txHash}`;
};

export const TransactionStatusDisplay: React.FC<TransactionStatusProps> = ({ transaction }) => {
  const config = statusConfig[transaction.status];
  const chainId = useChainId();
  const etherscanUrl = transaction.txHash ? getEtherscanUrl(transaction.txHash, chainId) : null;

  return (
    <div className={`${config.bgColor} rounded-lg p-4 mb-4 border-2 ${config.color.replace('text-', 'border-')} border-opacity-30`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`font-bold text-base ${config.color}`}>{config.label}</span>
          {transaction.status === 'processing' && (
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          )}
          {transaction.status === 'completed' && (
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <span className="text-sm text-gray-600">
          {transaction.timestamp.toLocaleTimeString()}
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-700 font-medium">Amount:</span>
          <span className="font-semibold text-gray-900">{formatETH(transaction.amount)} ETH</span>
        </div>
        {transaction.usdAmount && (
          <div className="flex justify-between">
            <span className="text-gray-700 font-medium">USD Value:</span>
            <span className="font-semibold text-gray-900">${formatUSD(transaction.usdAmount)}</span>
          </div>
        )}
        {transaction.address && (
          <div className="flex justify-between">
            <span className="text-gray-700 font-medium">Address:</span>
            <span className="font-mono text-sm text-gray-900">{formatAddress(transaction.address)}</span>
          </div>
        )}
        {etherscanUrl && (
          <div className="mt-4 pt-3 border-t-2 border-gray-300">
            <a
              href={etherscanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              View on Etherscan
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

