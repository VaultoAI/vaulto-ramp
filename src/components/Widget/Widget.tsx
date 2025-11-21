import React, { useState } from 'react';
import { ConnectButton, useAccountModal } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { Card } from '../shared/Card';
import { OnRamp } from './OnRamp';
import { OffRamp } from './OffRamp';
import { formatAddress } from '../../utils/formatters';

type TabType = 'onramp' | 'offramp';

export const Widget: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('onramp');
  const { address, isConnected } = useAccount();
  const { openAccountModal } = useAccountModal();

  return (
    <Card className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <img src="/favicon.png" alt="Ramp" className="w-8 h-8" />
            Ramp
          </h1>
          <div className="flex items-center gap-4">
            {isConnected && address ? (
              <button
                onClick={openAccountModal}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-mono text-sm text-gray-900 transition-colors"
              >
                {formatAddress(address)}
              </button>
            ) : (
              <ConnectButton />
            )}
          </div>
        </div>

        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('onramp')}
            className={`
              px-6 py-3 font-medium text-sm transition-colors duration-200
              ${
                activeTab === 'onramp'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            On-Ramp
          </button>
          <button
            onClick={() => setActiveTab('offramp')}
            className={`
              px-6 py-3 font-medium text-sm transition-colors duration-200
              ${
                activeTab === 'offramp'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            Off-Ramp
          </button>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === 'onramp' ? <OnRamp /> : <OffRamp />}
      </div>
    </Card>
  );
};

