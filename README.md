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

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to the URL shown in the terminal (typically `http://localhost:5173`)

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

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

## Mock Features

Since there's no Venmo API integration, the widget simulates:
- ETH/USD conversion (1 ETH = $2000 USD)
- Wallet address generation
- Transaction processing with status updates
- Balance tracking

## Customization

- **Styling**: Modify Tailwind classes in components or update `tailwind.config.js`
- **Conversion Rate**: Change `ETH_TO_USD_RATE` in `src/utils/formatters.ts`
- **Validation Rules**: Update validators in `src/utils/validators.ts`
- **Transaction Flow**: Modify transaction logic in `src/context/WalletContext.tsx`

## License

MIT

