# Arc Deploy Wizard

A developer-focused contract deployment assistant for Arc L1 Testnet.

Deploy ERC20 and ERC721 contracts with a clean, minimal UI in minutes.

## Features

- 🚀 **One-Click Deploy** — Deploy contracts with minimal configuration
- 💰 **Gas Estimation** — See deployment costs in USDC before deploying
- 🔗 **Wallet Integration** — Connect with RainbowKit + wagmi
- 📱 **Responsive Design** — Works on desktop and mobile
- 🎨 **Premium UI** — Inspired by Linear, Stripe, and Vercel

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Wallet**: RainbowKit, wagmi, viem
- **Blockchain**: Arc L1 Testnet (USDC as gas token)
- **Styling**: CSS Modules (no frameworks)

## Quick Start

### Prerequisites

- Node.js 18+
- A wallet with Arc Testnet configured
- Arc Testnet USDC for gas

### Installation

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local and add your WalletConnect Project ID

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Configuration

### WalletConnect Project ID

1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com)
2. Create a new project
3. Copy your Project ID
4. Add to `src/lib/wagmi.ts`:

```ts
projectId: 'YOUR_WALLET_CONNECT_PROJECT_ID',
```

### Arc Testnet Details

- **Chain ID**: 5042002
- **RPC**: https://rpc.testnet.arc.network
- **Explorer**: https://testnet.arcscan.app
- **Gas Token**: USDC (6 decimals)

## Project Structure

```
/arc-deploy-wizard
  /contracts              # Solidity templates
    ERC20Template.sol     # Simple ERC20 token
    ERC721Template.sol    # Simple ERC721 NFT
  /src
    /app                  # Next.js app directory
      layout.tsx          # Root layout with providers
      page.tsx            # Main wizard page
      page.module.css     # Page styles
    /components           # React components
      WalletConnect.tsx   # Custom wallet button
      ContractCard.tsx    # Contract selection card
      GasPreview.tsx      # Gas estimation display
    /lib                  # Utilities
      arcConfig.ts        # Arc Testnet config
      wagmi.ts            # Wagmi configuration
      deploy.ts           # Contract deployment
      estimateGas.ts      # Gas estimation
    /styles
      globals.css         # Global styles
```

## Usage Flow

1. **Connect Wallet** — Connect your wallet and ensure you're on Arc Testnet
2. **Select Contract** — Choose ERC20 or ERC721
3. **Configure Parameters** — Set name, symbol, and other constructor params
4. **Preview Gas** — Review estimated deployment cost in USDC
5. **Deploy** — Confirm transaction in wallet
6. **Success** — View contract address and explorer link

## Compiling Contracts

The Solidity templates need to be compiled before deployment works.

### Option 1: Using Hardhat

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

npx hardhat init

# Add contracts to hardhat/contracts
# Compile
npx hardhat compile

# Copy ABIs and bytecode to src/lib/deploy.ts
```

### Option 2: Using Foundry

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Compile
forge build

# Extract ABIs and bytecode from out/
```

### Option 3: Using Remix

1. Open [Remix IDE](https://remix.ethereum.org)
2. Paste contract code
3. Compile and copy ABI + bytecode
4. Update `src/lib/deploy.ts`

## Important Notes

⚠️ **Contract Bytecode Required**: The current implementation uses placeholder bytecode. You must compile the Solidity contracts and update `getContractBytecode()` in `src/lib/deploy.ts` with actual compiled bytecode.

⚠️ **WalletConnect Project ID**: Replace the placeholder in `src/lib/wagmi.ts` with your actual WalletConnect Project ID.

## Deployment

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

### Environment Variables

Set these in your production environment:

- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - Your WalletConnect Project ID

## Development

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## Contributing

This is an MVP for Arc Testnet deployment. Contributions welcome:

- Add more contract templates (ERC1155, etc.)
- Improve gas estimation accuracy
- Add constructor parameter validation
- Integrate with IPFS for metadata
- Add contract verification on explorer

## License

MIT

## Links

- [Arc Testnet Docs](https://docs.arc.xyz)
- [RainbowKit Docs](https://rainbowkit.com)
- [wagmi Docs](https://wagmi.sh)
- [viem Docs](https://viem.sh)
