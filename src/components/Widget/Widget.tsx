import React, { useState, useRef, useEffect } from 'react';
import { useAccountModal } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect, useChainId } from 'wagmi';
import { Card } from '../shared/Card';
import { OnRamp } from './OnRamp';
import { OffRamp } from './OffRamp';
import { formatAddress, formatUSD } from '../../utils/formatters';
import { useEthPrice } from '../../hooks/useEthPrice';

type TabType = 'onramp' | 'offramp';

const getEtherscanAddressUrl = (address: string, chainId: number): string => {
  // Mainnet chain ID is 1, Sepolia is 11155111
  if (chainId === 1) {
    return `https://etherscan.io/address/${address}`;
  } else if (chainId === 11155111) {
    return `https://sepolia.etherscan.io/address/${address}`;
  }
  // Default to mainnet if unknown chain
  return `https://etherscan.io/address/${address}`;
};

export const Widget: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('onramp');
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { openAccountModal } = useAccountModal();
  const { price: ethPrice, isLoading: isPriceLoading } = useEthPrice();
  const onrampButtonRef = useRef<HTMLButtonElement>(null);
  const offrampButtonRef = useRef<HTMLButtonElement>(null);
  const [underlineStyle, setUnderlineStyle] = useState<{ translateX: number; width: number }>({ translateX: 0, width: 0 });

  const updateUnderline = (tab: TabType) => {
    const activeButton = tab === 'onramp' ? onrampButtonRef.current : offrampButtonRef.current;
    if (activeButton) {
      const { offsetLeft, offsetWidth } = activeButton;
      setUnderlineStyle({ translateX: offsetLeft, width: offsetWidth });
    }
  };

  useEffect(() => {
    updateUnderline(activeTab);
    window.addEventListener('resize', () => updateUnderline(activeTab));
    return () => {
      window.removeEventListener('resize', () => updateUnderline(activeTab));
    };
  }, [activeTab, isConnected]);

  // Format current date
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Card className="max-w-2xl mx-auto">
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0 mb-3 sm:mb-4">
          <div className="flex flex-col items-center sm:items-start">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
              <img src="/favicon.png" alt="Vaulto Ramp" className="w-7 h-7 sm:w-8 sm:h-8" />
              Vaulto Ramp
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Buy and sell crypto with Venmo</p>
          </div>
          {isConnected && address ? (
            <div className="flex flex-col items-center sm:items-end gap-2 relative z-10">
              <div className="text-xs sm:text-sm font-medium text-gray-700">
                {currentDate}
              </div>
              <button
                onClick={openAccountModal}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-mono text-xs sm:text-sm text-gray-900 transition-colors"
              >
                {formatAddress(address)}
              </button>
              <div className="flex gap-1.5 w-full sm:w-auto max-w-fit relative z-10">
                <a
                  href={getEtherscanAddressUrl(address, chainId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 text-xs bg-blue-200 hover:bg-blue-300 text-blue-700 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap relative z-10 pointer-events-auto"
                >
                  <svg
                    className="w-3 h-3 pointer-events-none"
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
                  Etherscan
                </a>
                <button
                  onClick={() => disconnect()}
                  className="px-2 py-1 text-xs bg-red-200 hover:bg-red-300 text-red-700 rounded-lg transition-colors flex items-center justify-center relative z-10 pointer-events-auto"
                  title="Disconnect"
                >
                  <img 
                    src="/power.png" 
                    alt="Disconnect" 
                    className="w-3.5 h-3.5 pointer-events-none"
                  />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center sm:items-end gap-1">
              <div className="text-xs sm:text-sm font-medium text-gray-700">
                {currentDate}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                {isPriceLoading ? (
                  <span className="text-gray-400">Loading...</span>
                ) : (
                  <span>ETH: ${formatUSD(ethPrice)}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {!isConnected && (
          <div className="flex border-b border-gray-200 relative">
            <button
              ref={onrampButtonRef}
              onClick={() => {
                setActiveTab('onramp');
                updateUnderline('onramp');
              }}
              className={`
                px-4 sm:px-6 py-2.5 sm:py-3 font-medium text-xs sm:text-sm transition-colors duration-200 flex-1 sm:flex-none
                ${
                  activeTab === 'onramp'
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }
              `}
            >
              On-Ramp
            </button>
            <button
              ref={offrampButtonRef}
              onClick={() => {
                setActiveTab('offramp');
                updateUnderline('offramp');
              }}
              className={`
                px-4 sm:px-6 py-2.5 sm:py-3 font-medium text-xs sm:text-sm transition-colors duration-200 flex-1 sm:flex-none
                ${
                  activeTab === 'offramp'
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }
              `}
            >
              Off-Ramp
            </button>
            <span
              className="absolute bottom-0 h-0.5 bg-blue-600 will-change-[transform,width]"
              style={{
                transform: `translateX(${underlineStyle.translateX}px)`,
                width: `${underlineStyle.width}px`,
                transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), width 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </div>
        )}
      </div>

      {isConnected && (
        <div className="flex border-b border-gray-200 -mt-8 sm:-mt-10 mb-4 sm:mb-6 relative z-0">
          <button
            ref={onrampButtonRef}
            onClick={() => {
              setActiveTab('onramp');
              updateUnderline('onramp');
            }}
            className={`
              px-4 sm:px-6 py-2.5 sm:py-3 font-medium text-xs sm:text-sm transition-colors duration-200 flex-1 sm:flex-none
              ${
                activeTab === 'onramp'
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            On-Ramp
          </button>
          <button
            ref={offrampButtonRef}
            onClick={() => {
              setActiveTab('offramp');
              updateUnderline('offramp');
            }}
            className={`
              px-4 sm:px-6 py-2.5 sm:py-3 font-medium text-xs sm:text-sm transition-colors duration-200 flex-1 sm:flex-none
              ${
                activeTab === 'offramp'
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            Off-Ramp
          </button>
          <span
            className="absolute bottom-0 h-0.5 bg-blue-600 will-change-[transform,width]"
            style={{
              transform: `translateX(${underlineStyle.translateX}px)`,
              width: `${underlineStyle.width}px`,
              transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), width 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </div>
      )}

      <div className={isConnected ? '' : 'mt-6'}>
        {activeTab === 'onramp' ? <OnRamp /> : <OffRamp />}
      </div>

      <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
        <div className="flex items-center justify-center gap-1">
          <span className="text-xs sm:text-sm text-gray-400">Powered by</span>
          <img src="/footerimage.png" alt="Vaulto Rails" className="h-4 sm:h-5" />
        </div>
      </div>
    </Card>
  );
};
