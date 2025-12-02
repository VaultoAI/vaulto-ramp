import React, { useState, useEffect, useRef } from 'react';
import { useAccount, usePublicClient, useBlockNumber } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWallet } from '../../hooks/useWallet';
import { Button } from '../shared/Button';
import { TransactionStatusDisplay } from './TransactionStatus';
import { formatEther } from 'viem';
import { QRCodeSVG } from 'qrcode.react';

type OnRampTab = 'instructions' | 'address' | 'history';

export const OnRamp: React.FC = () => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: blockNumber } = useBlockNumber({ watch: true });
  const { wallet, addDetectedTransaction } = useWallet();
  const [activeTab, setActiveTab] = useState<OnRampTab>('instructions');
  const [copied, setCopied] = useState(false);
  const [monitoringActive, setMonitoringActive] = useState(false);
  const [topBackgroundColor, setTopBackgroundColor] = useState<string>('#ffffff');
  const [bottomBackgroundColor, setBottomBackgroundColor] = useState<string>('#ffffff');
  const processedTxHashes = useRef<Set<string>>(new Set());
  const lastCheckedBlock = useRef<bigint | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const topBackgroundRef = useRef<HTMLDivElement>(null);
  const bottomBackgroundRef = useRef<HTMLDivElement>(null);
  const isLockedToGray = useRef<boolean>(false);

  // Get walletAddress from URL parameters
  const [urlWalletAddress, setUrlWalletAddress] = useState<string | null>(null);
  
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const walletAddressParam = searchParams.get('walletAddress');
    if (walletAddressParam) {
      // Validate that it's a valid Ethereum address format
      if (/^0x[a-fA-F0-9]{40}$/.test(walletAddressParam)) {
        setUrlWalletAddress(walletAddressParam);
      }
    }
  }, []);

  // Use URL address if available, otherwise use connected wallet address
  const receivingAddress = urlWalletAddress || address;
  const shouldShowContent = isConnected || urlWalletAddress !== null;

  // Monitor transactions when new blocks arrive
  useEffect(() => {
    if (!receivingAddress || !monitoringActive || !publicClient || !blockNumber) return;

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
              if (typeof tx === 'object' && tx.to && tx.to.toLowerCase() === receivingAddress.toLowerCase()) {
                const txHash = tx.hash;
                
                // Skip if we've already processed this transaction
                if (processedTxHashes.current.has(txHash)) continue;
                
                // Get full transaction details
                try {
                  const txReceipt = await publicClient.getTransactionReceipt({ hash: txHash });
                  if (tx.value) {
                    const ethAmount = parseFloat(formatEther(tx.value));
                    
                    // Determine transaction status based on receipt status
                    const status = txReceipt.status === 'success' ? 'completed' : 'failed';
                    
                    // Add to processed set
                    processedTxHashes.current.add(txHash);
                    
                    // Add transaction to wallet context
                    addDetectedTransaction(txHash, ethAmount, receivingAddress, status);
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
  }, [blockNumber, receivingAddress, monitoringActive, publicClient, addDetectedTransaction]);

  // Start monitoring when wallet is connected or URL address is provided
  useEffect(() => {
    if (receivingAddress) {
      setMonitoringActive(true);
    } else {
      setMonitoringActive(false);
      processedTxHashes.current.clear();
    }
  }, [receivingAddress]);

  // Ensure video plays for color sampling
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const ensurePlaying = async () => {
      if (video.paused && video.readyState >= 3) {
        try {
          await video.play();
        } catch (err) {
          // Autoplay might be blocked, but that's okay - user interaction will start it
          console.debug('Video autoplay prevented:', err);
        }
      }
    };

    const handleCanPlay = () => {
      ensurePlaying();
    };

    video.addEventListener('canplay', handleCanPlay);
    ensurePlaying(); // Try immediately if video is already ready

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  // Handle video time update to crop last 1.5 seconds
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.duration && video.currentTime >= video.duration - 1.5) {
        video.currentTime = 0;
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, []);

  // Sample colors from video for dynamic backgrounds
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastSampleTime = 0;
    let hasStartedSampling = false;
    const sampleInterval = 100; // Sample every 100ms to avoid performance issues

    const sampleColors = () => {
      // Ensure video has valid dimensions before sampling
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      
      // Only start sampling if video has valid dimensions and is ready
      if (!videoWidth || !videoHeight || videoWidth === 0 || videoHeight === 0) {
        animationFrameId = requestAnimationFrame(sampleColors);
        return;
      }

      // Mark that we've started sampling (video is ready)
      if (!hasStartedSampling) {
        hasStartedSampling = true;
      }

      const currentTime = Date.now();
      if (currentTime - lastSampleTime < sampleInterval) {
        animationFrameId = requestAnimationFrame(sampleColors);
        return;
      }
      lastSampleTime = currentTime;

      // Set canvas size to match video
      canvas.width = videoWidth;
      canvas.height = videoHeight;

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Account for clipPath: 'inset(5% 0 3% 0)'
      // Top clip is 5%, so sample just below that (around 6-7% from top)
      // Bottom clip is 3%, so sample just above that (around 2-3% from bottom)
      const topSampleY = Math.floor(canvas.height * 0.06);
      const bottomSampleY = Math.floor(canvas.height * 0.97);
      const sampleX = Math.floor(canvas.width / 2); // Sample from center horizontally

      // Sample multiple pixels horizontally for better color accuracy
      const sampleWidth = Math.min(20, Math.floor(canvas.width * 0.1));
      const startX = Math.max(0, sampleX - Math.floor(sampleWidth / 2));
      const endX = Math.min(canvas.width, sampleX + Math.floor(sampleWidth / 2));

      // Sample top color (average across horizontal line)
      let topR = 0, topG = 0, topB = 0, topCount = 0;
      for (let x = startX; x < endX; x++) {
        const imageData = ctx.getImageData(x, topSampleY, 1, 1);
        const [r, g, b] = imageData.data;
        topR += r;
        topG += g;
        topB += b;
        topCount++;
      }
      if (topCount > 0) {
        const avgR = Math.round(topR / topCount);
        const avgG = Math.round(topG / topCount);
        const avgB = Math.round(topB / topCount);
        
        // Check if color is white or gray
        const isWhite = avgR > 200 && avgG > 200 && avgB > 200;
        const rgbVariance = Math.max(
          Math.abs(avgR - avgG),
          Math.abs(avgG - avgB),
          Math.abs(avgR - avgB)
        );
        const isGray = !isWhite && avgR < 200 && avgG < 200 && avgB < 200 && rgbVariance < 30;
        
        if (isLockedToGray.current) {
          // If locked to gray, check if white is detected to unlock
          if (isWhite) {
            isLockedToGray.current = false;
            setTopBackgroundColor(`rgb(${avgR}, ${avgG}, ${avgB})`);
          } else {
            // Stay locked to gray to prevent flickering
            setTopBackgroundColor('rgb(114, 114, 114)');
          }
        } else {
          // Not locked - check if gray should be applied
          if (isGray) {
            // Lock to gray once detected to prevent flickering
            isLockedToGray.current = true;
            setTopBackgroundColor('rgb(114, 114, 114)');
          } else {
            // Use sampled color (white)
            setTopBackgroundColor(`rgb(${avgR}, ${avgG}, ${avgB})`);
          }
        }
      }

      // Sample bottom color (average across horizontal line)
      let bottomR = 0, bottomG = 0, bottomB = 0, bottomCount = 0;
      for (let x = startX; x < endX; x++) {
        const imageData = ctx.getImageData(x, bottomSampleY, 1, 1);
        const [r, g, b] = imageData.data;
        bottomR += r;
        bottomG += g;
        bottomB += b;
        bottomCount++;
      }
      if (bottomCount > 0) {
        const avgR = Math.round(bottomR / bottomCount);
        const avgG = Math.round(bottomG / bottomCount);
        const avgB = Math.round(bottomB / bottomCount);
        const bottomColor = `rgb(${avgR}, ${avgG}, ${avgB})`;
        setBottomBackgroundColor(bottomColor);
      }

      animationFrameId = requestAnimationFrame(sampleColors);
    };

    // Start sampling only when video has loaded metadata and can play
    const handleCanPlay = () => {
      // Wait a bit to ensure video frame is ready, then start sampling
      setTimeout(() => {
        if (!hasStartedSampling && video.videoWidth > 0 && video.videoHeight > 0) {
          animationFrameId = requestAnimationFrame(sampleColors);
        }
      }, 100);
    };

    const handleLoadedMetadata = () => {
      // Video metadata is loaded, try to start sampling
      if (!hasStartedSampling && video.videoWidth > 0 && video.videoHeight > 0) {
        setTimeout(() => {
          if (!hasStartedSampling) {
            animationFrameId = requestAnimationFrame(sampleColors);
          }
        }, 100);
      }
    };

    // Set up event listeners
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    // If video is already ready, start sampling
    if (video.readyState >= 3 && video.videoWidth > 0 && video.videoHeight > 0) {
      // Video can play
      setTimeout(() => {
        if (!hasStartedSampling) {
          animationFrameId = requestAnimationFrame(sampleColors);
        }
      }, 100);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  const handleCopyAddress = async () => {
    if (!receivingAddress) return;
    try {
      await navigator.clipboard.writeText(receivingAddress);
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

      {/* Step 1: Connect Wallet - Only show if no URL address provided */}
      {!shouldShowContent && (
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
          <h3 className="text-base font-semibold text-gray-900 mb-2">Ready to Buy Crypto</h3>
          <p className="text-gray-600 mb-4 text-sm">
            Receive Ethereum from Venmo purchases.
          </p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>
      )}

      {/* Content */}
      {shouldShowContent && (
        <>
          <div>
            {activeTab === 'instructions' && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="flex gap-6 items-start">
                  <div className="flex-1 pt-4 flex flex-col">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">How to Buy Crypto with Venmo</h3>
                    <ol className="space-y-4 text-gray-700 mb-6">
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                          1
                        </span>
                        <span>
                          <span className="md:hidden">Open Venmo app</span>
                          <span className="hidden md:inline">Open the Venmo app on your mobile device</span>
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                          2
                        </span>
                        <span>
                          <span className="md:hidden">Tap <strong>Crypto</strong> icon</span>
                          <span className="hidden md:inline">Tap the <strong>Crypto</strong> icon in the bottom navigation bar</span>
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                          3
                        </span>
                        <span>
                          <span className="md:hidden">Select <strong>"Buy"</strong> and choose amount</span>
                          <span className="hidden md:inline">Select <strong>"Buy"</strong> and choose the amount of Ethereum you want to purchase</span>
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                          4
                        </span>
                        <span>
                          <span className="md:hidden">Tap <strong>"Send"</strong> in Venmo and scan QR code or paste address</span>
                          <span className="hidden md:inline">After purchasing, tap <strong>"Send"</strong> in Venmo and scan the QR code or paste the receiving address shown below</span>
                        </span>
                      </li>
                    </ol>
                    <div className="mt-auto">
                      <Button
                        variant="primary"
                        onClick={() => setActiveTab('address')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 flex justify-center">
                    {/* iPhone-style phone frame */}
                    <div className="relative bg-black rounded-[2rem] shadow-2xl" style={{ maxWidth: '208px', padding: '6.5px' }}>
                      {/* Dynamic Island with camera and microphone */}
                      <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-16 h-4 bg-black rounded-full z-10 flex items-center justify-center gap-1.5 px-2">
                        {/* Front-facing camera */}
                        <div className="w-1.5 h-1.5 bg-gray-700 rounded-full"></div>
                        {/* Microphone */}
                        <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                      </div>
                      
                      {/* Screen area */}
                      <div className="relative bg-black rounded-[1.75rem] overflow-hidden" style={{ aspectRatio: '9 / 19.5' }}>
                        {/* White background placeholder - maintains size before video loads */}
                        <div className="absolute inset-0 bg-white rounded-[1.75rem] z-0"></div>
                        
                        {/* Hidden canvas for color sampling */}
                        <canvas
                          ref={canvasRef}
                          style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none' }}
                        />
                        
                        {/* Dynamic background behind dynamic island */}
                        <div
                          ref={topBackgroundRef}
                          className="absolute top-0 left-0 right-0 min-h-[10%] h-[10%] rounded-t-[1.75rem] z-0"
                          style={{ backgroundColor: topBackgroundColor, height: '10%' }}
                        ></div>
                        
                        {/* Dynamic background behind home indicator */}
                        <div
                          ref={bottomBackgroundRef}
                          className="absolute bottom-0 left-0 right-0 min-h-[10%] h-[10%] rounded-b-[1.75rem] z-0"
                          style={{ backgroundColor: bottomBackgroundColor, height: '10%' }}
                        ></div>
                        
                        <video
                          ref={videoRef}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover rounded-[1.75rem] relative z-[1]"
                          style={{ clipPath: 'inset(5% 0 3% 0)' }}
                        >
                          <source src="/Onramp demo.mp4" type="video/mp4" />
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

            {activeTab === 'address' && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-bold">
                    2
                  </span>
                  Your Receiving Address
                </h3>
                <p className="text-gray-600 mb-4">
                  Send your purchased Ethereum to this address:
                </p>
                
                {/* QR Code Display */}
                <div className="flex justify-center mb-6">
                  <div className="bg-white border border-gray-300 rounded-lg p-4 inline-block">
                    {receivingAddress && (
                      <QRCodeSVG
                        value={receivingAddress}
                        size={200}
                        level="H"
                        includeMargin={true}
                      />
                    )}
                  </div>
                </div>
                <p className="text-center text-sm text-gray-600 mb-4">
                  Scan this QR code with Venmo to send funds to your wallet
                </p>

                <div className="flex gap-2 mb-6">
                  <div className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-3 font-mono text-sm text-gray-900">
                    {receivingAddress}
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleCopyAddress}
                    className="whitespace-nowrap flex items-center justify-center px-3 py-2 md:px-4 md:py-2.5"
                  >
                    <svg
                      className="w-4 h-4 md:mr-2 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {copied ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      )}
                    </svg>
                    <span className="hidden md:inline text-white">{copied ? 'Copied!' : 'Copy'}</span>
                  </Button>
                </div>
                <p className="mb-6 text-sm text-gray-500 font-bold">
                  Send only Ethereum (ETH) to this address. Other tokens may result in loss of funds.
                </p>
                <div>
                  <Button
                    variant="primary"
                    onClick={() => setActiveTab('history')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-bold">
                      3
                    </span>
                    Deposit Tracking
                  </h3>
                  {monitoringActive && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Monitoring for incoming transactions</span>
                    </div>
                  )}
                </div>
                {onrampTransactions.length > 0 ? (
                  <div className="space-y-4">
                    {onrampTransactions.map((transaction) => (
                      <TransactionStatusDisplay key={transaction.id} transaction={transaction} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-2">No deposits yet</p>
                    <p className="text-sm text-gray-500">
                      {monitoringActive 
                        ? 'Waiting for incoming transactions...' 
                        : 'Your incoming transactions will appear here'}
                    </p>
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
