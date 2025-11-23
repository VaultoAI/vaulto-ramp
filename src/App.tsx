import { useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { RainbowKitProvider, AvatarComponent } from '@rainbow-me/rainbowkit';
import { lightTheme } from '@rainbow-me/rainbowkit';
import { WalletProvider } from './context/WalletContext';
import { ToastProvider } from './context/ToastContext';
import { Page } from './components/Layout/Page';
import { Widget } from './components/Widget/Widget';
import { config } from './config/wagmi';
import '@rainbow-me/rainbowkit/styles.css';
import './index.css';

const queryClient = new QueryClient();

// Custom Avatar Component
// You can customize this to use your own image or design
const CustomAvatar: AvatarComponent = ({ address, ensImage, size }) => {
  const [imageError, setImageError] = useState(false);
  
  // Option 1: Use ENS avatar if available
  if (ensImage && !imageError) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
        }}
      >
        <img
          src={ensImage}
          width={size}
          height={size}
          style={{ 
            borderRadius: '50%',
            objectFit: 'contain',
            width: '100%',
            height: '100%',
          }}
          alt="ENS Avatar"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Option 2: Use a custom image (change the path to your desired image)
  // You can use your favicon or any other image
  const customImageUrl = '/favicon.png'; // Change this to your desired image path
  
  // If custom image fails, show a fallback
  if (imageError || !customImageUrl) {
    // Fallback: Generate a colored circle based on the address
    const color = `#${address.slice(2, 8)}`;
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: size * 0.3,
        }}
      >
        {address.slice(2, 4).toUpperCase()}
      </div>
    );
  }
  
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        padding: size * 0.1, // Add padding to ensure nothing is cut off
      }}
    >
      <img
        src={customImageUrl}
        style={{ 
          width: '100%',
          height: '100%',
          objectFit: 'contain', // Use 'contain' instead of 'cover' to prevent cropping
        }}
        alt="Wallet Avatar"
        onError={() => setImageError(true)}
      />
    </div>
  );
};

// Customize the RainbowKit theme
const customTheme = lightTheme({
  accentColor: '#2563eb', // Blue accent color
  accentColorForeground: 'white',
  borderRadius: 'medium',
  fontStack: 'system',
  overlayBlur: 'small',
});

// You can also use darkTheme if preferred:
// const customTheme = darkTheme({
//   accentColor: '#2563eb',
//   accentColorForeground: 'white',
//   borderRadius: 'medium',
//   fontStack: 'system',
//   overlayBlur: 'small',
// });

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={customTheme}
          avatar={CustomAvatar}
          appInfo={{
            appName: 'Vaulto Ramp',
            learnMoreUrl: 'https://vaulto.com',
          }}
        >
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

