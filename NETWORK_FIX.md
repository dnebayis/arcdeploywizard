# Arc Testnet Configuration Fix

## Issue Identified

The initial Arc Testnet configuration had incorrect network details, causing RPC connection failures.

### Errors Encountered

```
EstimateGasExecutionError: HTTP request failed.
URL: https://rpc-testnet.arcvm.org
Details: Failed to fetch (ERR_NAME_NOT_RESOLVED)
```

---

## Root Cause

Incorrect Arc Testnet network configuration:

| Setting | Incorrect Value | Correct Value |
|---------|----------------|---------------|
| **Chain ID** | 37,714,555,429 | **5042002** |
| **RPC URL** | https://rpc-testnet.arcvm.org | **https://rpc.testnet.arc.network** |
| **Explorer** | https://testnet.arcscan.net | **https://testnet.arcscan.app** |

---

## Files Fixed

### 1. `src/lib/arcConfig.ts` ✅

**Changes:**
```typescript
// Before
id: 37_714_555_429,
http: ['https://rpc-testnet.arcvm.org'],
url: 'https://testnet.arcscan.net',

// After
id: 5042002,
http: ['https://rpc.testnet.arc.network'],
url: 'https://testnet.arcscan.app',
```

### 2. `README.md` ✅

Updated Arc Testnet Details section with correct values.

### 3. `QUICK_REFERENCE.md` ✅

Updated Arc Testnet configuration reference.

---

## Correct Arc Testnet Configuration

```typescript
export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 6,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.arc.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Arc Explorer',
      url: 'https://testnet.arcscan.app',
    },
  },
  testnet: true,
});
```

---

## Add to MetaMask

If you need to manually add Arc Testnet to your wallet:

```
Network name: Arc Testnet
New RPC URL: https://rpc.testnet.arc.network
Chain ID: 5042002
Currency symbol: USDC
Explorer URL: https://testnet.arcscan.app
```

---

## Testing

The app should now:
- ✅ Connect to Arc Testnet RPC successfully
- ✅ Estimate gas properly
- ✅ Display correct explorer links
- ✅ Deploy contracts (once bytecode is added)

---

## Next Steps

The network configuration is now correct. You still need to:

1. **Compile Contracts** — Get bytecode for ERC20 and ERC721
2. **WalletConnect ID** — Add your Project ID from cloud.walletconnect.com

Once these are done, the full deployment flow will work end-to-end.

---

**Status: Network Configuration Fixed ✅**

The Arc Deploy Wizard can now connect to Arc Testnet correctly!
