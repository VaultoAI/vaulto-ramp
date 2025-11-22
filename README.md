# Venmo Crypto On-Ramp/Off-Ramp Widget

A modular React widget application for Ethereum on-ramp and off-ramp functionality, designed to simulate Venmo's crypto features. This widget is built to be easily copyable and integrable into other applications.

## Features

- **On-Ramp**: Buy Ethereum with USD and send to external wallet addresses
- **Off-Ramp**: Receive Ethereum to your Venmo address
- **Transaction Tracking**: Real-time transaction status updates
- **Modular Design**: Easy to copy components into other projects
- **Clean UI**: Simple, modern interface built with Tailwind CSS
- **TypeScript**: Full type safety throughout the application

## Project Structure

```
src/
├── components/
│   ├── Widget/          # Main widget components
│   ├── shared/          # Reusable UI components
│   └── Layout/          # Page layout components
├── context/             # React Context for state management
├── hooks/               # Custom React hooks
├── utils/               # Utility functions (formatters, validators)
└── types/               # TypeScript type definitions
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   - Create a `.env` file in the root directory
   - Add your environment variables (all optional):
   ```
   VITE_ETHERSCAN_API_KEY=your_api_key_here
   VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
   ```
   - **VITE_ETHERSCAN_API_KEY**: Get a free API key from [Etherscan API Key Management](https://info.etherscan.com/etherscan-developer-api-key)
     - If not provided, the app will use CoinGecko API as a fallback, or a default price of $2000
   - **VITE_WALLETCONNECT_PROJECT_ID**: Get your Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com)
     - If not provided, defaults to a placeholder value

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to the URL shown in the terminal (typically `http://localhost:5173`)

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Deploy to Netlify

This project is configured for easy deployment to Netlify:

1. **Push your code to a Git repository** (GitHub, GitLab, or Bitbucket)

2. **Connect your repository to Netlify**:
   - Go to [Netlify](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your Git repository

3. **Configure environment variables** in Netlify:
   - Go to Site settings → Environment variables
   - Add the following variables:
     - `VITE_ETHERSCAN_API_KEY`: Your Etherscan API key (optional, fallback price will be used if not set)
     - `VITE_WALLETCONNECT_PROJECT_ID`: Your WalletConnect Project ID (optional, defaults to placeholder)

4. **Build settings** (automatically configured via `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `dist`

5. **Deploy**: Netlify will automatically build and deploy your site

The `netlify.toml` file includes SPA routing configuration, so all routes will redirect to `index.html` for proper client-side routing.

## Usage

### Running Locally

The application runs on a blank page with the widget centered. Simply start the dev server and interact with the widget.

### Copying to Other Applications

This project is designed to be modular. You can copy entire folders or individual components:

1. **Copy the entire widget**: Copy the `src/components/Widget/` folder
2. **Copy shared components**: Copy `src/components/shared/` for reusable UI elements
3. **Copy context**: Copy `src/context/WalletContext.tsx` for state management
4. **Copy utilities**: Copy `src/utils/` for formatting and validation functions

### Key Components

- **Widget.tsx**: Main container with tabbed interface
- **OnRamp.tsx**: Buy crypto flow
- **OffRamp.tsx**: Receive crypto flow
- **WalletContext.tsx**: Global state management for wallet and transactions

## Technical Details

- **React 18+** with TypeScript
- **Tailwind CSS** for styling
- **Vite** as build tool
- **React Context API** for state management
- Mock data simulation (no real API integration)

## Features

- **Real-time ETH Price**: Fetches current Ethereum market price from Etherscan API
- **USD to ETH Conversion**: Accurate conversion using live market rates
- **Price Caching**: ETH price is cached for 60 seconds to minimize API calls
- **Fallback Price**: Uses fallback price ($2000) if API is unavailable

## Mock Features

Since there's no Venmo API integration, the widget simulates:
- Wallet address generation
- Transaction processing with status updates
- Balance tracking

## Customization

- **Styling**: Modify Tailwind classes in components or update `tailwind.config.js`
- **ETH Price**: Price is fetched from Etherscan API. Fallback price can be changed in `src/hooks/useEthPrice.ts`
- **Price Cache Duration**: Adjust cache duration (default 60 seconds) in `src/hooks/useEthPrice.ts`
- **Validation Rules**: Update validators in `src/utils/validators.ts`
- **Transaction Flow**: Modify transaction logic in `src/context/WalletContext.tsx`

## License

MIT

