import React, { useState, useEffect } from 'react';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWallet } from '../../hooks/useWallet';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';
import { validateUsdAmount, validateEthAddress } from '../../utils/validators';
import { TransactionStatusDisplay } from './TransactionStatus';
import { parseEther } from 'viem';
import { usdToEth } from '../../utils/formatters';

type OffRampTab = 'instructions' | 'send' | 'history';

export const OffRamp: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { wallet, sendCrypto, updateTransactionStatus } = useWallet();
  const [activeTab, setActiveTab] = useState<OffRampTab>('instructions');
  const [venmoAddress, setVenmoAddress] = useState('');
  const [usdAmount, setUsdAmount] = useState('');
  const [addressError, setAddressError] = useState<string | undefined>();
  const [amountError, setAmountError] = useState<string | undefined>();
  const [lastTransactionId, setLastTransactionId] = useState<string | null>(null);

  const {
    data: hash,
    sendTransaction,
    isPending: isSending,
    error: sendError,
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed, isError: isFailed } = useWaitForTransactionReceipt({
    hash,
  });

  // Handle transaction confirmation
  useEffect(() => {
    if (hash) {
      if (isConfirmed) {
        updateTransactionStatus(hash, 'completed');
        const transaction = wallet.transactions.find((tx) => tx.txHash === hash);
        if (transaction) {
          setLastTransactionId(transaction.id);
        }
      } else if (isFailed) {
        updateTransactionStatus(hash, 'failed');
      }
    }
  }, [isConfirmed, isFailed, hash, wallet.transactions, updateTransactionStatus]);

  const handleVenmoAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setVenmoAddress(value);
    const validation = validateEthAddress(value);
    setAddressError(validation.error);
  };

  const handleUsdAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsdAmount(value);
    const validation = validateUsdAmount(value);
    setAmountError(validation.error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const addressValidation = validateEthAddress(venmoAddress);
    const amountValidation = validateUsdAmount(usdAmount);

    if (!addressValidation.isValid) {
      setAddressError(addressValidation.error);
      return;
    }

    if (!amountValidation.isValid) {
      setAmountError(amountValidation.error);
      return;
    }

    if (!isConnected || !address) {
      return;
    }

    try {
      // Convert USD to ETH
      const ethAmount = usdToEth(parseFloat(usdAmount));
      // Send transaction
      sendTransaction({
        to: venmoAddress.trim() as `0x${string}`,
        value: parseEther(ethAmount.toString()),
      });
    } catch (err) {
      console.error('Failed to send transaction:', err);
    }
  };

  // Track transaction when hash is available
  useEffect(() => {
    if (hash && venmoAddress && usdAmount) {
      const ethAmount = usdToEth(parseFloat(usdAmount));
      const usdValue = parseFloat(usdAmount);
      const transactionId = sendCrypto(hash, ethAmount, usdValue, venmoAddress.trim());
      setLastTransactionId(transactionId);
      // Clear form after successful send
      setVenmoAddress('');
      setUsdAmount('');
    }
  }, [hash, venmoAddress, usdAmount, sendCrypto]);

  // Filter offramp transactions
  const offrampTransactions = wallet.transactions.filter((tx) => tx.type === 'offramp');

  // Get the last transaction if available
  const lastTransaction = lastTransactionId
    ? wallet.transactions.find((tx) => tx.id === lastTransactionId)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Send Crypto</h2>
        <p className="text-gray-600">Send Ethereum from your wallet to your Venmo address</p>
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
            Please connect your wallet to send Ethereum to your Venmo address.
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
              onClick={() => setActiveTab('send')}
              className={`
                px-6 py-3 font-medium text-sm transition-colors duration-200
                ${
                  activeTab === 'send'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }
              `}
            >
              2. Send
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
                  How to Find Your Venmo Ethereum Address
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
                    <span>Tap on "Receive" or look for your Ethereum receiving address</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                      4
                    </span>
                    <span>Copy your Ethereum address (it should start with "0x")</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                      5
                    </span>
                    <span>Paste the address in the field below</span>
                  </li>
                </ol>
              </div>
            )}

            {activeTab === 'send' && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-bold">
                    2
                  </span>
                  Send Ethereum to Venmo
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Your Venmo Ethereum Address"
                    type="text"
                    placeholder="0x..."
                    value={venmoAddress}
                    onChange={handleVenmoAddressChange}
                    error={addressError}
                    helperText="Paste your Venmo Ethereum receiving address here"
                  />
                  <p className="text-sm text-gray-500 -mt-2">
                    ⚠️ Make sure this is your Ethereum (ETH) address. Sending to other token addresses may result in loss of funds.
                  </p>

                  <Input
                    label="Amount to Send (USD)"
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="100"
                    value={usdAmount}
                    onChange={handleUsdAmountChange}
                    error={amountError}
                    helperText="Enter the amount in USD you want to send"
                  />

                  {sendError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-600">
                        Transaction failed: {sendError.message || 'Unknown error occurred'}
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSending || isConfirming}
                    className="w-full"
                    disabled={!venmoAddress || !usdAmount || !!addressError || !!amountError || isSending || isConfirming}
                  >
                    {isSending ? 'Sending...' : isConfirming ? 'Confirming...' : 'Send Ethereum'}
                  </Button>
                </form>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-bold">
                    3
                  </span>
                  Transaction History
                </h3>
                {offrampTransactions.length === 0 ? (
                  <p className="text-gray-600">
                    Your sent transactions will appear here.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {offrampTransactions.map((transaction) => (
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
