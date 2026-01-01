# Arc Deploy Wizard

A professional contract deployment interface for the Arc L1 Testnet. Deploy ERC20, ERC721, and ERC1155 contracts with a premium, user-friendly experience.

## Features

- **Multi-Standard Support**: Deploy ERC20 (Tokens), ERC721 (NFTs), and ERC1155 (Multi-Token) contracts.
- **Embedded Metadata Studio**: Create and host NFT metadata directly within the wizard using Pinata/IPFS.
- **Instant Previews**: Visualized NFT cards and social sharing previews.
- **Gas Estimation**: Real-time deployment cost estimation in USDC.
- **One-Click Deployment**: Seamless wallet integration using RainbowKit and Wagmi.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Blockchain**: Viem, Wagmi, RainbowKit
- **Storage**: Pinata (IPFS)
- **Styling**: CSS Modules with modern design principles

## Getting Started

### Prerequisites

- Node.js 18+
- Use a wallet configured for Arc Testnet (Chain ID: 5042002)
- Get testnet USDC for gas

### Installation

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd arc-deploy-wizard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment:
   Create a `.env` file in the root directory (see `.env.example`):
   ```env
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_id_here
   PINATA_JWT=your_pinata_jwt_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

- `src/components`: UI components (Wizard, Previews, Wallet).
- `src/lib`: Utilities for contract factories, IPFS uploads, and deployment logic.
- `src/app`: Next.js 15 pages and API routes.
- `contracts`: Solidity source files (reference).

## License

MIT
