# Arc Deploy Wizard - Quick Reference

## 🚀 Start Development

```bash
npm install
npm run dev
# Open http://localhost:3000
```

---

## ⚙️ Required Configuration

### 1. Compile Contracts & Extract Bytecode

**File**: `src/lib/deploy.ts`

```typescript
export function getContractBytecode(contractType: ContractType): string {
  if (contractType === 'ERC20') {
    return '0x60806040...'; // ← Paste ERC20 bytecode here
  } else {
    return '0x60806040...'; // ← Paste ERC721 bytecode here
  }
}
```

**Get bytecode from:**
- Hardhat: `artifacts/contracts/[Contract].sol/[Contract].json` → `bytecode` field
- Foundry: `out/[Contract].sol/[Contract].json` → `bytecode.object` field
- Remix: Compilation Details → Bytecode

---

### 2. Add WalletConnect Project ID

**File**: `src/lib/wagmi.ts`

```typescript
export const wagmiConfig = getDefaultConfig({
  appName: 'Arc Deploy Wizard',
  projectId: 'abc123...', // ← Paste your Project ID here
  chains: [arcTestnet],
  ssr: true,
});
```

**Get Project ID from**: https://cloud.walletconnect.com

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Main wizard UI (6 steps) |
| `src/lib/deploy.ts` | Contract deployment logic |
| `src/lib/estimateGas.ts` | Gas estimation in USDC |
| `src/lib/arcConfig.ts` | Arc Testnet config |
| `src/lib/wagmi.ts` | Wallet connection setup |
| `src/styles/globals.css` | Design system tokens |
| `contracts/ERC20Template.sol` | ERC20 contract |
| `contracts/ERC721Template.sol` | ERC721 contract |

---

## 🎨 Design Tokens

```css
/* Colors */
--bg-primary: #0a0a0a
--bg-secondary: #121212
--accent: #3b82f6
--success: #10b981
--warning: #f59e0b

/* Spacing */
--radius-sm: 6px
--radius-md: 10px
--radius-lg: 14px

/* Transitions */
--transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1)
```

---

## 🔗 Arc Testnet Details

```
Chain ID: 5042002
RPC: https://rpc.testnet.arc.network
Explorer: https://testnet.arcscan.app
Gas Token: USDC (6 decimals)
```

---

## 🛠 Common Tasks

### Add New Contract Template

1. Create Solidity file in `contracts/`
2. Add to `CONTRACT_TEMPLATES` in `src/lib/arcConfig.ts`
3. Update `getContractABI()` in `src/lib/deploy.ts`
4. Compile and add bytecode to `getContractBytecode()`

### Update Styles

- **Global styles**: `src/styles/globals.css`
- **Component styles**: `src/components/[Component].module.css`
- **Page styles**: `src/app/page.module.css`

### Deploy to Production

```bash
npm install -g vercel
vercel
```

Set environment variable:
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

---

## 🐛 Troubleshooting

### "Module type is not specified"
**Solution**: Add `"type": "module"` to `package.json`

### "Transaction reverted"
**Causes**:
- Insufficient USDC for gas
- Wrong network
- Invalid parameters

### Gas estimation fails
**Solution**: Check `estimateGas.ts` fallback logic

### Wallet won't connect
**Check**:
- WalletConnect Project ID is set
- Browser wallet extension installed
- Arc Testnet is configured

---

## 📚 Documentation

- `README.md` — Setup & usage guide
- `ARCHITECTURE.md` — Technical deep-dive
- `BUILD_SUMMARY.md` — Feature overview
- `PROJECT_OVERVIEW.md` — Visual summary

---

## 🎯 User Flow

```
Landing
  → Connect Wallet
  → Select Contract (ERC20/ERC721)
  → Configure Parameters
  → Preview Gas (USDC)
  → Deploy
  → Success (Contract Address)
```

---

## 💡 Tips

- Use `console.log` in components for debugging
- Check browser console for Web3 errors
- Test with small amounts first
- Keep Arc Testnet USDC in wallet

---

## 🚢 Ship Checklist

- [ ] Bytecode configured
- [ ] WalletConnect ID added
- [ ] Tested locally
- [ ] Deployed to Vercel
- [ ] Environment variables set
- [ ] Tested in production

---

**Ready to go! 🚀**
