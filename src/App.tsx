import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WalletProvider } from './context/WalletContext';
import { ToastProvider } from './context/ToastContext';
import { Page } from './components/Layout/Page';
import { Widget } from './components/Widget/Widget';
import { config } from './config/wagmi';
import '@rainbow-me/rainbowkit/styles.css';
import './index.css';

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <WalletProvider>
            <ToastProvider>
              <Page>
                <Widget />
              </Page>
            </ToastProvider>
          </WalletProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;

