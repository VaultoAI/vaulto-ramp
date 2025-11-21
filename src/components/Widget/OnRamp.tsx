import React, { useState, useEffect, useRef } from 'react';
import { useAccount, usePublicClient, useBlockNumber } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWallet } from '../../hooks/useWallet';
import { Button } from '../shared/Button';
import { TransactionStatusDisplay } from './TransactionStatus';
import { formatEther } from 'viem';

type OnRampTab = 'instructions' | 'address' | 'history';

export const OnRamp: React.FC = () => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: blockNumber } = useBlockNumber({ watch: true });
  const { wallet, addDetectedTransaction } = useWallet();
  const [activeTab, setActiveTab] = useState<OnRampTab>('instructions');
  const [copied, setCopied] = useState(false);
  const [monitoringActive, setMonitoringActive] = useState(false);
  const processedTxHashes = useRef<Set<string>>(new Set());
  const lastCheckedBlock = useRef<bigint | null>(null);

  // Monitor transactions when new blocks arrive
  useEffect(() => {
    if (!isConnected || !address || !monitoringActive || !publicClient || !blockNumber) return;

    const checkTransactions = async () => {
      try {
        // Start checking from the last checked block, or current block - 5 for initial check
        const startBlock = lastCheckedBlock.current 
          ? lastCheckedBlock.current + 1n 
          : blockNumber - 5n;
        
        if (startBlock > blockNumber) return;

        // Check blocks from startBlock to current blockNumber
        for (let blockNum = startBlock; blockNum <= blockNumber; blockNum++) {
          try {
            const block = await publicClient.getBlock({ blockNumber: blockNum, includeTransactions: true });
            
            if (!block.transactions) continue;

            // Check each transaction in the block
            for (const tx of block.transactions) {
              if (typeof tx === 'object' && tx.to && tx.to.toLowerCase() === address.toLowerCase()) {
                const txHash = tx.hash;
                
                // Skip if we've already processed this transaction
                if (processedTxHashes.current.has(txHash)) continue;
                
                // Get full transaction details
                try {
                  const txReceipt = await publicClient.getTransactionReceipt({ hash: txHash });
                  if (txReceipt.status === 'success' && tx.value) {
                    const ethAmount = parseFloat(formatEther(tx.value));
                    
                    // Add to processed set
                    processedTxHashes.current.add(txHash);
                    
                    // Add transaction to wallet context
                    addDetectedTransaction(txHash, ethAmount, address);
                  }
                } catch (err) {
                  // Transaction receipt might not be available yet, skip
                  continue;
                }
              }
            }
          } catch (err) {
            // Block might not be available yet, continue to next
            continue;
          }
        }

        lastCheckedBlock.current = blockNumber;
      } catch (error) {
        console.error('Error monitoring transactions:', error);
      }
    };

    checkTransactions();
  }, [blockNumber, isConnected, address, monitoringActive, publicClient, addDetectedTransaction]);

  // Start monitoring when wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      setMonitoringActive(true);
    } else {
      setMonitoringActive(false);
      processedTxHashes.current.clear();
    }
  }, [isConnected, address]);

  const handleCopyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  // Filter onramp transactions
  const onrampTransactions = wallet.transactions.filter((tx) => tx.type === 'onramp');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Buy Crypto</h2>
        <p className="text-gray-600">Purchase Ethereum with Venmo and send to your connected wallet</p>
      </div>

      {/* Step 1: Connect Wallet */}
      {!isConnected && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="mb-4">
            <svg
              className="w-12 h-12 mx-auto text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
          <p className="text-gray-600 mb-4">
            Please connect your wallet to get started. Your wallet address will be used as the receiving address for your crypto purchase.
          </p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      {isConnected && (
        <>
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('instructions')}
              className={`
                px-6 py-3 font-medium text-sm transition-colors duration-200
                ${
                  activeTab === 'instructions'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }
              `}
            >
              1. Instructions
            </button>
            <button
              onClick={() => setActiveTab('address')}
              className={`
                px-6 py-3 font-medium text-sm transition-colors duration-200
                ${
                  activeTab === 'address'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }
              `}
            >
              2. Address
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`
                px-6 py-3 font-medium text-sm transition-colors duration-200
                ${
                  activeTab === 'history'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }
              `}
            >
              3. History
            </button>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'instructions' && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-bold">
                    1
                  </span>
                  How to Buy Crypto with Venmo
                </h3>
                <ol className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                      1
                    </span>
                    <span>Open the Venmo app on your mobile device</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                      2
                    </span>
                    <span>Navigate to the Crypto section (tap the menu icon, then select "Crypto")</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                      3
                    </span>
                    <span>Select "Buy" and choose the amount of Ethereum you want to purchase</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                      4
                    </span>
                    <span>Complete your purchase using your preferred payment method</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                      5
                    </span>
                    <span>After purchasing, select "Send" and paste the receiving address shown below</span>
                  </li>
                </ol>
              </div>
            )}

            {activeTab === 'address' && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-bold">
                    2
                  </span>
                  Your Receiving Address
                </h3>
                <p className="text-gray-600 mb-3">
                  Send your purchased Ethereum to this address:
                </p>
                <div className="flex gap-2">
                  <div className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-3 font-mono text-sm text-gray-900">
                    {address}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyAddress}
                    className="whitespace-nowrap"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <p className="mt-3 text-sm text-gray-500">
                  ⚠️ Make sure to send only Ethereum (ETH) to this address. Sending other tokens may result in loss of funds.
                </p>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-bold">
                    3
                  </span>
                  Payment Tracking
                </h3>
                {monitoringActive && (
                  <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Monitoring for incoming transactions...</span>
                  </div>
                )}
                {onrampTransactions.length === 0 ? (
                  <p className="text-gray-600">
                    Once you send Ethereum to your receiving address, the transaction will appear here automatically.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {onrampTransactions.map((transaction) => (
                      <TransactionStatusDisplay key={transaction.id} transaction={transaction} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
