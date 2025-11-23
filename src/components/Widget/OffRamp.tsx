import React, { useState, useEffect, useRef } from 'react';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWallet } from '../../hooks/useWallet';
import { useEthPrice } from '../../hooks/useEthPrice';
import { useToast } from '../../context/ToastContext';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';
import { validateUsdAmount, validateEthAddress } from '../../utils/validators';
import { TransactionStatusDisplay } from './TransactionStatus';
import { parseEther } from 'viem';
import { usdToEth, formatErrorMessage, formatUSD, formatETH } from '../../utils/formatters';

type OffRampTab = 'instructions' | 'send' | 'history';

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

export const OffRamp: React.FC = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { wallet, sendCrypto, updateTransactionStatus } = useWallet();
  const { price: ethPrice, isLoading: isPriceLoading, error: priceError } = useEthPrice();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<OffRampTab>('instructions');
  const [venmoAddress, setVenmoAddress] = useState('');
  const [usdAmount, setUsdAmount] = useState('');
  const [addressError, setAddressError] = useState<string | undefined>();
  const [amountError, setAmountError] = useState<string | undefined>();
  const [selectedAmountType, setSelectedAmountType] = useState<'preset' | 'custom' | null>(null);
  const [selectedPresetAmount, setSelectedPresetAmount] = useState<string | null>(null);
  const [notifiedHashes, setNotifiedHashes] = useState<Set<string>>(new Set());
  const videoRef = useRef<HTMLVideoElement>(null);
  const customAmountInputRef = useRef<HTMLInputElement>(null);

  const {
    data: hash,
    sendTransaction,
    isPending: isSending,
    error: sendError,
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed, isError: isFailed } = useWaitForTransactionReceipt({
    hash,
  });

  // Handle transaction confirmation and show notification only when confirmed
  useEffect(() => {
    if (hash) {
      if (isConfirmed) {
        updateTransactionStatus(hash, 'completed');
        const transaction = wallet.transactions.find((tx) => tx.txHash === hash);
        if (transaction) {
          // Show notification only once when transaction is confirmed (transaction is posted and confirmed)
          if (!notifiedHashes.has(hash)) {
            const etherscanUrl = getEtherscanUrl(hash, chainId);
            const ethAmount = transaction.amount;
            const usdValue = transaction.usdAmount || 0;
            showToast(
              'success',
              `Transaction confirmed! ${formatETH(ethAmount)} ETH ($${formatUSD(usdValue)})`,
              { etherscanLink: etherscanUrl, duration: 8000 }
            );
            setNotifiedHashes((prev) => new Set(prev).add(hash));
          }
        }
      } else if (isFailed) {
        updateTransactionStatus(hash, 'failed');
        // Only show error notification if we haven't already notified about this hash
        if (!notifiedHashes.has(hash)) {
          showToast('error', 'Transaction failed. Please try again.', { duration: 5000 });
          setNotifiedHashes((prev) => new Set(prev).add(hash));
        }
      }
    }
  }, [isConfirmed, isFailed, hash, wallet.transactions, updateTransactionStatus, chainId, showToast, notifiedHashes]);

  const handleVenmoAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setVenmoAddress(value);
    const validation = validateEthAddress(value);
    setAddressError(validation.error);
  };

  const handleUsdAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsdAmount(value);
    setSelectedAmountType('custom');
    setSelectedPresetAmount(null);
    const validation = validateUsdAmount(value);
    setAmountError(validation.error);
  };

  const handlePresetClick = (amount: string) => {
    setUsdAmount(amount);
    setSelectedAmountType('preset');
    setSelectedPresetAmount(amount);
    setAmountError(undefined);
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
      // Convert USD to ETH using current market price
      const ethAmount = usdToEth(parseFloat(usdAmount), ethPrice);
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
      const ethAmount = usdToEth(parseFloat(usdAmount), ethPrice);
      const usdValue = parseFloat(usdAmount);
      sendCrypto(hash, ethAmount, usdValue, venmoAddress.trim());
      
      // Clear form after successful send
      setVenmoAddress('');
      setUsdAmount('');
      setSelectedAmountType(null);
      setSelectedPresetAmount(null);
    }
  }, [hash, venmoAddress, usdAmount, ethPrice, sendCrypto]);

  // Handle video time update to crop last 2.5 seconds
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.duration && video.currentTime >= video.duration - 2.5) {
        video.currentTime = 0;
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, []);

  // Filter offramp transactions
  const offrampTransactions = wallet.transactions.filter((tx) => tx.type === 'offramp');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Send Crypto</h2>
        <p className="text-gray-600">Send Ethereum from your wallet to your Venmo address</p>
      </div>

      {/* Step 1: Connect Wallet */}
      {!isConnected && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 text-center">
          <div className="mb-3">
            <svg
              className="w-10 h-10 mx-auto text-blue-600"
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
          <h3 className="text-base font-semibold text-gray-900 mb-2">Ready to Send Crypto</h3>
          <p className="text-gray-600 mb-4 text-sm">
            Send Ethereum to your Venmo address.
          </p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>
      )}

      {/* Content */}
      {isConnected && (
        <>
          {activeTab === 'instructions' && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="flex gap-6 items-start">
                <div className="flex-1 pt-4 flex flex-col">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">How to Send Crypto with Venmo</h3>
                  <ol className="space-y-4 text-gray-700 mb-6">
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
                      <span>Tap the <strong>Crypto</strong> icon in the bottom navigation bar</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        3
                      </span>
                      <span>Tap <strong>"Receive"</strong> to view your Ethereum receiving address</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        4
                      </span>
                      <span>Copy your Ethereum address (it will start with <strong>"0x"</strong>)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        5
                      </span>
                      <span>Click <strong>"Next"</strong> below and paste your address in the form</span>
                    </li>
                  </ol>
                  <div className="mt-auto">
                    <Button
                      variant="primary"
                      onClick={() => setActiveTab('send')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Next
                    </Button>
                  </div>
                </div>
                <div className="flex-1 flex justify-center">
                  {/* iPhone-style phone frame */}
                  <div className="relative bg-black rounded-[2.5rem] p-2 shadow-2xl" style={{ maxWidth: '227.5px' }}>
                    {/* Dynamic Island with camera and microphone */}
                    <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-16 h-4 bg-black rounded-full z-10 flex items-center justify-center gap-1.5 px-2">
                      {/* Front-facing camera */}
                      <div className="w-1.5 h-1.5 bg-gray-700 rounded-full"></div>
                      {/* Microphone */}
                      <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                    </div>
                    
                    {/* Screen area */}
                    <div className="relative bg-black rounded-[2rem] overflow-hidden" style={{ aspectRatio: '9 / 19.5' }}>
                      {/* White background placeholder - maintains size before video loads */}
                      <div className="absolute inset-0 bg-white rounded-[2rem] z-0"></div>
                      
                      {/* White background behind dynamic island */}
                      <div className="absolute top-0 left-0 right-0 h-8 bg-white rounded-t-[2rem] z-0"></div>
                      
                      {/* White background behind home indicator */}
                      <div className="absolute bottom-0 left-0 right-0 h-8 bg-white rounded-b-[2rem] z-0"></div>
                      
                      <video
                        ref={videoRef}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover rounded-[2rem] relative z-[1]"
                        style={{ clipPath: 'inset(5% 0 3% 0)' }}
                      >
                        <source src="/Offramp demo.mp4" type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                      
                      {/* Home indicator */}
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gray-400 rounded-full z-10"></div>
                    </div>
                  </div>
                </div>
              </div>
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
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <span>Current ETH Price:</span>
                      <span className="font-semibold text-gray-900">
                        {isPriceLoading ? 'Loading...' : `$${formatUSD(ethPrice)}`}
                      </span>
                    </div>
                    {priceError && (
                      <span className="text-xs text-yellow-600" title={priceError}>
                        ⚠️ Price may be inaccurate
                      </span>
                    )}
                  </div>
                </div>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount to Send (USD)
                    </label>
                    <div className="flex flex-wrap gap-3 mb-3">
                      <button
                        type="button"
                        onClick={() => handlePresetClick('20')}
                        className={`
                          px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200
                          ${
                            selectedPresetAmount === '20' && selectedAmountType === 'preset'
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                          }
                        `}
                      >
                        $20
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePresetClick('50')}
                        className={`
                          px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200
                          ${
                            selectedPresetAmount === '50' && selectedAmountType === 'preset'
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                          }
                        `}
                      >
                        $50
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePresetClick('100')}
                        className={`
                          px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200
                          ${
                            selectedPresetAmount === '100' && selectedAmountType === 'preset'
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                          }
                        `}
                      >
                        $100
                      </button>
                      <div className="relative inline-flex items-center">
                        <span className={`absolute left-3 font-medium text-sm z-10 ${
                          selectedAmountType === 'custom' && usdAmount
                            ? 'text-white'
                            : 'text-gray-700'
                        }`}>$</span>
                        <input
                          ref={customAmountInputRef}
                          type="number"
                          step="0.01"
                          min="1"
                          placeholder="____"
                          value={usdAmount}
                          onChange={handleUsdAmountChange}
                          onFocus={() => {
                            setSelectedAmountType('custom');
                            setSelectedPresetAmount(null);
                          }}
                          className={`
                            px-4 py-3 pl-7 pr-4 rounded-lg font-medium text-sm transition-all duration-200
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                            ${
                              selectedAmountType === 'custom' && usdAmount
                                ? 'bg-blue-600 text-white shadow-md border-2 border-blue-600'
                                : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                            }
                            ${amountError ? 'border-red-500 focus:ring-red-500' : ''}
                            placeholder:text-gray-400
                          `}
                          style={{
                            width: '110px',
                          }}
                        />
                      </div>
                    </div>
                    {amountError && (
                      <p className="mt-1 text-sm text-red-600">{amountError}</p>
                    )}
                    {usdAmount && !amountError && ethPrice > 0 && !isNaN(parseFloat(usdAmount)) && parseFloat(usdAmount) > 0 && (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">You will send:</span>
                          <span className="font-semibold text-gray-900">
                            {formatETH(usdToEth(parseFloat(usdAmount), ethPrice))} ETH
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          Based on current price: ${formatUSD(ethPrice)}/ETH
                        </div>
                      </div>
                    )}
                  </div>

                  {sendError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-600">
                        {formatErrorMessage(sendError)}
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
        </>
      )}
    </div>
  );
};
