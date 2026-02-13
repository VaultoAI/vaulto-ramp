# Vaulto Ramp

Secure on-ramp and off-ramp widget for fiat-to-crypto transactions. Part of VaultoAI's product suite.

## Overview

Vaulto Ramp is a modular widget application that provides on-ramp (buy crypto with USD and send to an external wallet) and off-ramp (receive crypto to a designated address) flows. It is built for easy integration into other applications and offers a clean, modern UI with real-time transaction status. It is maintained by VaultoAI for use across VaultoAI properties and partners.

## Features

- **On-ramp** — Buy Ethereum (or supported assets) with USD and send to external wallet addresses
- **Off-ramp** — Receive crypto to a configured address
- **Transaction tracking** — Real-time transaction status updates
- **Modular design** — Widget and components can be copied or embedded into other projects
- **TypeScript** — Full type safety
- **Wallet connection** — RainbowKit, Wagmi, Viem for Ethereum

## Technology Stack

- **Languages:** TypeScript
- **Frameworks / libraries:** React 18, Vite, Tailwind CSS, RainbowKit, Wagmi, Viem, TanStack Query, qrcode.react

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Running

1. Optionally set environment variables (e.g. `.env`): `VITE_ETHERSCAN_API_KEY`, `VITE_WALLETCONNECT_PROJECT_ID` for price and wallet features.
2. Start the development server:

```bash
npm run dev
```

3. Open the URL shown (typically http://localhost:5173). Build for production with `npm run build`; output is in `dist/`.

## Configuration

Optional: `VITE_ETHERSCAN_API_KEY` (Etherscan API for price; fallback used if unset), `VITE_WALLETCONNECT_PROJECT_ID` (WalletConnect Cloud). For Netlify, set the same variables in the site environment; `netlify.toml` configures build and SPA routing.

## Project Structure

- `src/components/Widget/` — Main widget and on-ramp/off-ramp flows
- `src/components/shared/` — Reusable UI components
- `src/context/` — Wallet and transaction state
- `src/hooks/` — Custom hooks (e.g. price)
- `src/utils/` — Formatters, validators
- `src/types/` — TypeScript definitions

## Contributing

See CONTRIBUTING.md for guidelines, or contact VaultoAI engineering.

## License

MIT

## Contact

VaultoAI Engineering. For support or questions, see the repository or organization documentation.
