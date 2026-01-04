# Arc Deploy Wizard

A professional smart contract deployment interface for Arc Testnet. Deploy ERC20, ERC721, and ERC1155 contracts with an intuitive, production-ready user experience.

![Arc Deploy Wizard](https://img.shields.io/badge/Next.js-15-black) ![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Features

### 🎯 Core Capabilities
- **Multi-Standard Support**: Deploy ERC20 (Tokens), ERC721 (NFTs), and ERC1155 (Multi-Token) contracts
- **Reality Check System**: Pre-deployment analysis that explains the consequences of your configuration
- **Risk Scanner**: Analyze and revoke risky token allowances with one click
- **Smart Configuration**: Toggle features like minting, burning, pausing, supply caps, and access control
- **Gas Estimation**: Real-time deployment cost estimates in USDC

### 🎨 Metadata & NFTs
- **Embedded Metadata Studio**: Create and host NFT metadata directly in the wizard
- **IPFS Integration**: Automatic upload to Pinata/IPFS with retry logic
- **Live Previews**: Instant NFT card previews as you configure
- **Social Sharing**: Generate shareable cards for your deployments

### 🔒 Security & UX
- **Pre-Deploy Reality Check**: Understand permanent consequences before deployment
- **Deployment History**: Track all your contract deployments
- **Auto-Verification**: Contracts automatically verified on ArcScan
- **Seamless Wallet Integration**: RainbowKit with Arc Testnet pre-configured

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18 or higher
- **Wallet** configured for Arc Testnet (Chain ID: `5042002`)
- **Testnet USDC** for gas fees ([Get from faucet](https://faucet.circle.com/))

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd arc-deploy-wizard

# Install dependencies
npm install

# Configure environment (see .env.example)
cp .env.example .env

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env` file in the project root:

```env
# WalletConnect (required)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Pinata for IPFS (required for NFT metadata)
PINATA_JWT=your_pinata_jwt_token

# ArcScan API (optional - for contract verification)
ARCSCAN_API_KEY=your_arcscan_api_key
```

**Get your keys:**
- WalletConnect: [https://cloud.walletconnect.com](https://cloud.walletconnect.com)
- Pinata: [https://pinata.cloud](https://pinata.cloud)
- ArcScan: [https://testnet.arcscan.app](https://testnet.arcscan.app)

## 📖 Usage

### Deploying an ERC20 Token

1. **Connect Wallet**: Click "Connect Wallet" and select your wallet
2. **Select Contract**: Choose "ERC20"
3. **Configure**:
   - Set token name and symbol
   - Define initial supply
   - Enable/disable minting, burning, pausing
   - Set max supply cap (optional)
4. **Reality Check**: Review consequences and acknowledge
5. **Deploy**: Confirm gas estimation and deploy

### Deploying NFTs (ERC721 / ERC1155)

1. **Select Contract Type**: Choose ERC721 or ERC1155
2. **Configure Basics**: Name, symbol, metadata URI
3. **Use Metadata Studio** (optional):
   - Upload NFT image
   - Add name and description
   - Automatically uploads to IPFS
4. **Set Features**:
   - Minting access (Owner Only / Public / Public with Limit)
   - Burnable, Pausable options
   - Max supply caps
5. **Reality Check**: Review and confirm
6. **Deploy & Share**: Deploy and share on social media

### Risk Scanner

Navigate to `/allowance` or use the "Risk Scanner" option to:
- Scan your wallet for risky token allowances
- View unlimited approvals and their risk levels
- Revoke dangerous permissions with one click

## 🏗️ Project Structure

```
arc-deploy-wizard/
├── src/
│   ├── app/              # Next.js 15 App Router
│   │   ├── api/          # API routes (metadata, verification)
│   │   ├── history/      # Deployment history page
│   │   ├── allowance/    # Risk scanner page
│   │   └── layout.tsx    # Root layout with providers
│   ├── components/       # React components
│   │   ├── WizardFlow.tsx           # Main wizard orchestration
│   │   ├── ConfigurationWizard.tsx  # Contract configuration UI
│   │   ├── RealityCheckStep.tsx     # Pre-deploy analysis
│   │   ├── WalletConnect.tsx        # Wallet connection
│   │   └── ...
│   ├── lib/              # Utilities and logic
│   │   ├── contractFactory.ts   # Contract deployment preparation
│   │   ├── realityCheck.ts      # Consequence analysis
│   │   ├── deploy.ts            # On-chain deployment
│   │   ├── arcConfig.ts         # Chain configuration
│   │   └── ...
│   └── hooks/            # React hooks
│       └── useAllowanceScanner.ts
├── contracts/            # Solidity smart contracts
│   ├── ConfigurableERC20.sol
│   ├── ConfigurableERC721.sol
│   └── ConfigurableERC1155.sol
├── public/               # Static assets
└── package.json
```

## 🔧 Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Blockchain** | Viem, Wagmi, RainbowKit |
| **Styling** | CSS Modules |
| **Storage** | Pinata (IPFS) |
| **Smart Contracts** | Solidity, Hardhat |

## 📝 Smart Contracts

All contracts are fully configurable at deployment time:

### ConfigurableERC20
- Mintable (optional)
- Burnable (optional)
- Pausable (optional)
- Max supply cap (optional)
- Owner-controlled

### ConfigurableERC721
- Burnable (optional)
- Pausable (optional)
- Mint access modes: Owner Only, Public, Public with Wallet Limit
- Max supply cap (optional)
- Metadata URI base

### ConfigurableERC1155
- Mintable (optional)
- Burnable (optional)
- Pausable (optional)
- Mint access modes
- Max supply per token ID (optional)
- Shared metadata model

## 🛠️ Development

### Build for Production

```bash
npm run build
```

### Run Production Build

```bash
npm start
```

### Compile Contracts

```bash
npx hardhat compile
```

## 🌐 Network Configuration

**Arc Testnet**
- Chain ID: `5042002`
- RPC: `https://rpc-testnet.arcscan.app`
- Explorer: [https://testnet.arcscan.app](https://testnet.arcscan.app)
- Currency: USDC (for gas)

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🔗 Links

- [Arc Network](https://arc.network)
- [ArcScan Explorer](https://testnet.arcscan.app)
- [Documentation](https://docs.arc.network)

---

Built with ❤️ for the Arc ecosystem
