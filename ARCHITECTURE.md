# Arc Deploy Wizard - Architecture & Implementation Guide

## Table of Contents

1. [Overview](#overview)
2. [Solidity Contracts](#solidity-contracts)
3. [Frontend Architecture](#frontend-architecture)
4. [Deployment Flow](#deployment-flow)
5. [Folder Structure](#folder-structure)
6. [Next Steps](#next-steps)

---

## Overview

Arc Deploy Wizard is a production-ready dApp for deploying smart contracts to Arc L1 Testnet.

**Key Features:**
- ERC20 and ERC721 contract deployment
- Real-time gas estimation in USDC
- Custom RainbowKit wallet integration
- Clean, minimal UI (dark mode)
- No backend required (fully client-side)

**Tech Stack:**
- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Web3**: RainbowKit + wagmi + viem
- **Network**: Arc L1 Testnet (USDC gas token)
- **Styling**: CSS Modules (no Tailwind)

---

## Solidity Contracts

### ERC20 Template (`contracts/ERC20Template.sol`)

**Purpose**: Minimal fungible token with configurable parameters.

**Constructor Parameters:**
- `name` (string): Token name (e.g., "My Token")
- `symbol` (string): Ticker symbol (e.g., "MTK")
- `initialSupply` (uint256): Initial supply in wei (e.g., 1000000 * 10^18)

**Implementation:**
- Uses OpenZeppelin's `ERC20.sol`
- Mints `initialSupply` to deployer (`msg.sender`)
- Solidity ^0.8.20

**Example Deployment:**
```solidity
new SimpleERC20("My Token", "MTK", 1000000 * 10**18);
```

---

### ERC721 Template (`contracts/ERC721Template.sol`)

**Purpose**: Minimal NFT collection with public minting.

**Constructor Parameters:**
- `name` (string): Collection name (e.g., "My NFT Collection")
- `symbol` (string): Collection symbol (e.g., "MNFT")
- `baseURI` (string): Metadata base URI (e.g., "ipfs://Qm.../")

**Implementation:**
- Uses OpenZeppelin's `ERC721.sol` + `Ownable.sol`
- Auto-incrementing token IDs (starting at 0)
- Public `mint()` function
- Owner can update `baseURI`

**Example Deployment:**
```solidity
new SimpleERC721("My NFT", "MNFT", "ipfs://QmExample/");
```

**Minting:**
```solidity
uint256 tokenId = contract.mint(); // Returns 0, 1, 2, ...
```

---

## Frontend Architecture

### Technology Decisions

**Why Next.js?**
- Server-side rendering for better SEO
- App Router for modern routing
- Built-in optimization (images, fonts, code splitting)

**Why RainbowKit + wagmi + viem?**
- **RainbowKit**: Best-in-class wallet UI/UX
- **wagmi**: React hooks for Ethereum
- **viem**: Lightweight, type-safe alternative to ethers.js

**Why CSS Modules instead of Tailwind?**
- Full control over aesthetic
- Cleaner component code
- Better for custom, premium designs

---

### Core Libraries

#### 1. Arc Testnet Configuration (`src/lib/arcConfig.ts`)

Defines Arc Testnet chain with USDC as native currency:

```ts
export const arcTestnet = defineChain({
  id: 37_714_555_429,
  name: 'Arc Testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 6, // Important!
  },
  rpcUrls: { ... },
  blockExplorers: { ... },
});
```

**Contract Templates Config:**
- Defines UI metadata (name, description, icon)
- Defines constructor parameters with tooltips
- Used to dynamically generate forms

---

#### 2. Wagmi Configuration (`src/lib/wagmi.ts`)

Configures wallet connection:

```ts
export const wagmiConfig = getDefaultConfig({
  appName: 'Arc Deploy Wizard',
  projectId: 'YOUR_WALLET_CONNECT_PROJECT_ID',
  chains: [arcTestnet],
  ssr: true,
});
```

**Important**: Replace `YOUR_WALLET_CONNECT_PROJECT_ID` with actual ID from [WalletConnect Cloud](https://cloud.walletconnect.com).

---

#### 3. Gas Estimation (`src/lib/estimateGas.ts`)

**Key Function**: `estimateDeploymentCost()`

**Process:**
1. Estimate gas units using `publicClient.estimateGas()`
2. Get current gas price using `publicClient.getGasPrice()`
3. Calculate total cost: `gasUnits * gasPrice`
4. Convert from wei (18 decimals) to USDC (6 decimals)

**Implementation Detail:**
```ts
const totalCostWei = gasEstimate * gasPrice;
const usdcAmount = Number(totalCostWei) / 1e18;
```

**Fallback**: Returns default estimates if estimation fails.

---

#### 4. Contract Deployment (`src/lib/deploy.ts`)

**Key Function**: `deployContract()`

**Process:**
1. Get connected account from `walletClient`
2. Deploy using `walletClient.deployContract()` with:
   - ABI
   - Bytecode
   - Constructor arguments
3. Wait for transaction receipt
4. Return contract address and transaction hash

**Current Limitation**: Bytecode is placeholder. You must compile contracts and update `getContractBytecode()`.

---

### Components

#### 1. WalletConnect (`src/components/WalletConnect.tsx`)

**Purpose**: Custom wallet connection UI using RainbowKit's `ConnectButton.Custom`.

**States:**
- **Not connected**: Shows "Connect Wallet" button
- **Wrong network**: Shows "Wrong network" with red indicator
- **Connected**: Shows network name + account address

**Design**: Minimal buttons with subtle hover effects, no bright colors.

---

#### 2. ContractCard (`src/components/ContractCard.tsx`)

**Purpose**: Selectable card for ERC20/ERC721 contracts.

**Features:**
- Icon (emoji)
- Title and description
- Arrow indicator
- Selected state (blue border + background)

**Interaction**: Clicking selects the contract type.

---

#### 3. GasPreview (`src/components/GasPreview.tsx`)

**Purpose**: Display gas estimation and deploy button.

**Shows:**
- Estimated gas units
- Deployment cost in USDC (highlighted in blue)
- Bytecode size
- Warning if cost > 10 USDC

**Deploy Button:**
- Shows spinner when deploying
- Disabled during deployment

---

### Pages

#### Main Page (`src/app/page.tsx`)

**Single-page wizard with 6 steps:**

1. **Landing**
   - Title: "Arc Deploy Wizard"
   - Connect wallet prompt or "Get Started" button

2. **Select**
   - Two contract cards (ERC20, ERC721)
   - "Continue" button (disabled until selection)

3. **Configure**
   - Dynamic form based on contract type
   - Input validation (all fields required)
   - Tooltips for each parameter

4. **Preview**
   - Gas estimation display
   - Deploy button

5. **Deploying**
   - Loading spinner animation
   - "Deploying to Arc Testnet..." text

6. **Success**
   - Success icon (green checkmark)
   - Contract address with copy button
   - Transaction hash with copy button
   - "View on Explorer" link
   - "Deploy Another Contract" button

---

## Deployment Flow

### Step-by-Step Logic

```
1. User lands on page
   ↓
2. User connects wallet (RainbowKit modal)
   ↓
3. Check if Arc Testnet (if not, prompt to switch)
   ↓
4. User clicks "Get Started"
   ↓
5. User selects contract (ERC20 or ERC721)
   ↓
6. User fills constructor parameters
   - Validation: All fields required
   - Default owner = connected wallet
   ↓
7. User clicks "Preview Deployment"
   ↓
8. App estimates gas in background
   - Calls publicClient.estimateGas()
   - Calculates cost in USDC
   ↓
9. Gas preview shown
   - Shows gas units, USDC cost, bytecode size
   - Warning if expensive
   ↓
10. User clicks "Deploy Contract"
    ↓
11. Wallet prompts for signature
    ↓
12. Contract deploys on-chain
    - walletClient.deployContract()
    - Wait for receipt
    ↓
13. Success page shown
    - Contract address
    - Explorer link
    - Copy buttons
    - Download ABI option (future)
```

---

### Wallet Connection Flow

**Using RainbowKit:**
1. User clicks "Connect Wallet"
2. RainbowKit modal opens (shows available wallets)
3. User selects wallet (MetaMask, Coinbase, WalletConnect, etc.)
4. Wallet prompts for connection approval
5. Once connected, check network
6. If not Arc Testnet, show "Wrong network" button
7. Clicking "Wrong network" prompts network switch

**Network Check:**
- RainbowKit automatically detects unsupported chains
- Arc Testnet is the only configured chain
- Prompts user to add/switch to Arc Testnet

---

### Gas Estimation Process

**How It Works:**

1. **Get Bytecode**
   - Retrieve compiled contract bytecode
   - Append constructor arguments (ABI-encoded)

2. **Estimate Gas Units**
   ```ts
   const gasEstimate = await publicClient.estimateGas({
     data: bytecode,
   });
   ```

3. **Get Gas Price**
   ```ts
   const gasPrice = await publicClient.getGasPrice();
   ```

4. **Calculate Cost**
   ```ts
   const totalCostWei = gasEstimate * gasPrice;
   const usdcAmount = Number(totalCostWei) / 1e18;
   ```

5. **Display in UI**
   - Show gas units
   - Show USDC cost (formatted to 6 decimals)
   - Show bytecode size

**Edge Cases:**
- If estimation fails, use fallback (2M gas, $0.50)
- Show warning if cost > 10 USDC

---

### Deployment Execution

**Using viem's `deployContract`:**

```ts
const hash = await walletClient.deployContract({
  abi,
  account,
  bytecode,
  args: constructorArgs,
});

const receipt = await publicClient.waitForTransactionReceipt({ hash });
```

**Error Handling:**
- Show error message if deployment fails
- Return to preview step
- User can retry

**Success:**
- Extract contract address from receipt
- Show on success page
- Provide explorer link

---

## Folder Structure

```
/arc-deploy-wizard
│
├── /contracts/                    # Solidity smart contracts
│   ├── ERC20Template.sol          # ERC20 token template
│   └── ERC721Template.sol         # ERC721 NFT template
│
├── /src/
│   │
│   ├── /app/                      # Next.js App Router
│   │   ├── layout.tsx             # Root layout with providers
│   │   ├── page.tsx               # Main wizard page (all steps)
│   │   └── page.module.css        # Page-specific styles
│   │
│   ├── /components/               # React components
│   │   ├── WalletConnect.tsx      # Custom wallet button
│   │   ├── WalletConnect.module.css
│   │   ├── ContractCard.tsx       # Contract selection card
│   │   ├── ContractCard.module.css
│   │   ├── GasPreview.tsx         # Gas estimation display
│   │   └── GasPreview.module.css
│   │
│   ├── /lib/                      # Utility functions
│   │   ├── arcConfig.ts           # Arc Testnet chain config
│   │   ├── wagmi.ts               # Wagmi/RainbowKit config
│   │   ├── deploy.ts              # Contract deployment logic
│   │   └── estimateGas.ts         # Gas estimation logic
│   │
│   └── /styles/
│       └── globals.css            # Global CSS (design tokens)
│
├── /public/                       # Static assets (if needed)
│
├── .env.example                   # Environment template
├── .gitignore                     # Git ignore rules
├── next.config.js                 # Next.js configuration
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
└── README.md                      # Project documentation
```

---

### File Responsibilities

| File | Purpose |
|------|---------|
| `layout.tsx` | Wraps app with Web3 providers (Wagmi, RainbowKit, React Query) |
| `page.tsx` | Contains entire wizard flow (6 steps in one component) |
| `arcConfig.ts` | Defines Arc Testnet chain and contract metadata |
| `wagmi.ts` | Configures wallet connection (WalletConnect Project ID) |
| `deploy.ts` | Handles contract deployment via viem |
| `estimateGas.ts` | Estimates gas cost and formats constructor params |
| `globals.css` | Design system (colors, spacing, typography, utilities) |

---

## Next Steps

### 1. Compile Contracts

**You must compile the Solidity contracts to get bytecode.**

#### Option A: Hardhat

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
```

Copy contracts to `hardhat/contracts/`, then:

```bash
npx hardhat compile
```

Extract bytecode from `artifacts/contracts/ERC20Template.sol/SimpleERC20.json`:

```json
{
  "bytecode": "0x608060405234801561001057600080fd5b50..."
}
```

Update `src/lib/deploy.ts`:

```ts
export function getContractBytecode(contractType: ContractType): string {
  if (contractType === 'ERC20') {
    return '0x608060405234801561001057600080fd5b50...';
  } else {
    return '0x608060405234801561001057600080fd5b50...';
  }
}
```

#### Option B: Foundry

```bash
forge build
```

Bytecode is in `out/ERC20Template.sol/SimpleERC20.json`.

#### Option C: Remix

1. Open https://remix.ethereum.org
2. Paste contract code
3. Install OpenZeppelin via NPM (in Remix)
4. Compile
5. Copy bytecode from "Compilation Details"

---

### 2. Get WalletConnect Project ID

1. Visit https://cloud.walletconnect.com
2. Sign up / log in
3. Create a new project
4. Copy your **Project ID**
5. Update `src/lib/wagmi.ts`:

```ts
projectId: 'your_actual_project_id_here',
```

---

### 3. Test Locally

```bash
npm run dev
```

1. Open http://localhost:3000
2. Connect wallet
3. Switch to Arc Testnet
4. Try deploying a contract

---

### 4. Deploy to Production

#### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

Or connect your GitHub repo to Vercel.

#### Environment Variables

Set in Vercel dashboard:
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

---

## Design Philosophy

### Aesthetic Principles

1. **Dark Mode First**
   - Background: `#0a0a0a` (near black)
   - Cards: `#121212` (subtle lift)
   - Borders: `#2a2a2a` (minimal contrast)

2. **Minimal Color Palette**
   - Primary: Blue (`#3b82f6`)
   - Success: Green (`#10b981`)
   - Warning: Orange (`#f59e0b`)
   - Error: Red (`#ef4444`)

3. **Typography**
   - System font stack (no custom fonts for speed)
   - Large, bold headings
   - Subtle secondary text

4. **Spacing**
   - Generous whitespace
   - Consistent padding/margin scale
   - Clear visual hierarchy

5. **Interactions**
   - Subtle hover effects (border, background)
   - No flashy animations (except deploy spinner)
   - Fast, responsive transitions (200ms)

### Inspiration

- **Linear**: Clean cards, minimal borders
- **Stripe**: Clear typography, subtle shadows
- **Vercel**: Dark mode, flat design

---

## Advanced Features (Future)

1. **Contract Verification**
   - Auto-verify on Arc Explorer
   - Submit source code + constructor args

2. **IPFS Integration**
   - Upload NFT metadata to IPFS
   - Auto-generate baseURI

3. **More Templates**
   - ERC1155 (multi-token)
   - Governance tokens
   - Custom contracts

4. **Constructor Validation**
   - Check symbol length (3-5 chars)
   - Validate supply (max safe integers)
   - URI format validation

5. **Gas Optimization Tips**
   - Show optimization suggestions
   - Estimate savings from optimizations

6. **Multi-chain Support**
   - Add other EVM chains
   - Network switcher

7. **Download ABI**
   - Export ABI as JSON
   - Download contract source

8. **Deployment History**
   - Save deployed contracts (localStorage)
   - Show past deployments

---

## Common Issues

### Issue: "crypto.subtle must be defined"

**Solution**: This is a Next.js SSR issue. Ensure RainbowKit is client-side only:

```tsx
'use client';
```

### Issue: "Transaction reverted"

**Causes:**
- Insufficient USDC for gas
- Wrong network
- Invalid constructor params (e.g., supply too large)

**Solution**: Check wallet balance, ensure Arc Testnet, validate inputs.

### Issue: Gas estimation fails

**Solution**: The `estimateGas.ts` has fallback logic. If it fails, check:
- RPC is working
- Bytecode is valid
- Constructor args are correct

---

## Summary

Arc Deploy Wizard is a **production-ready MVP** for deploying ERC20 and ERC721 contracts to Arc L1 Testnet.

**What's Complete:**
- ✅ Full UI/UX flow (6 steps)
- ✅ Wallet integration (RainbowKit)
- ✅ Gas estimation (in USDC)
- ✅ Contract deployment logic
- ✅ Solidity templates (ERC20, ERC721)
- ✅ Dark mode aesthetic

**What's Needed:**
- ⚠️ Compile contracts → extract bytecode
- ⚠️ Add WalletConnect Project ID

**Deploy Flow:**
1. Connect wallet
2. Select contract
3. Configure params
4. Review gas
5. Deploy
6. View on explorer

**Perfect for:**
- Hackathon builders
- Testnet developers
- Quick contract deployments

---

**Ready to deploy? Let's ship it! 🚀**
