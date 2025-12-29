# RPC Connection Error - Troubleshooting Guide

## Error Reported

```
TransactionExecutionError: Version of JSON-RPC protocol is not supported.
Details: Unauthorized.
```

---

## ✅ Verified Working

1. **RPC Endpoint:** `https://rpc.testnet.arc.network` ✅ (responds correctly)
2. **Chain ID:** `5042002` ✅ (matches configuration)
3. **Network Configuration:** ✅ (all settings correct)

---

## Possible Causes & Solutions

### 1. Wallet Not Connected to Arc Testnet

**Symptoms:**
- "Unauthorized" error
- "Version of JSON-RPC protocol is not supported"

**Solution:**
1. Open your wallet (MetaMask, etc.)
2. Click on the network dropdown
3. Look for "Arc Testnet"
4. If not present, add it manually:
   ```
   Network name: Arc Testnet
   RPC URL: https://rpc.testnet.arc.network
   Chain ID: 5042002
   Currency symbol: USDC
   Block explorer: https://testnet.arcscan.app
   ```
5. Switch to Arc Testnet

---

### 2. Wallet Not Connected

**Solution:**
1. Click "Connect Wallet" in the wizard
2. Select your wallet
3. Approve the connection
4. Ensure you're on Arc Testnet

---

### 3. Browser Extension Issue

**Solution:**
1. Refresh the page
2. Disconnect and reconnect wallet
3. Try clearing browser cache
4. Restart browser if needed

---

### 4. Insufficient USDC for Gas

**Symptoms:**
- Transaction fails
- "Unauthorized" error

**Solution:**
- You need USDC in your wallet for gas fees
- Get Arc Testnet USDC from the faucet (if available)
- Check your wallet balance

---

### 5. Network Congestion

**Solution:**
- Wait a few moments and try again
- The testnet might be experiencing high load

---

## 🔍 Debugging Steps

### Step 1: Check Wallet Connection

1. Open browser console (F12)
2. Look for wallet connection logs
3. Verify wallet is connected to the correct address

### Step 2: Verify Network

In browser console:
```javascript
// Check current chain ID
ethereum.request({ method: 'eth_chainId' })
  .then(chainId => console.log('Current Chain ID:', parseInt(chainId, 16)))
```

Expected output: `5042002`

### Step 3: Check Account

```javascript
// Check connected account
ethereum.request({ method: 'eth_accounts' })
  .then(accounts => console.log('Connected Account:', accounts[0]))
```

### Step 4: Manual Network Add

If Arc Testnet doesn't appear in your wallet:

**For MetaMask:**
1. Click network dropdown
2. Click "Add Network"
3. Click "Add a network manually"
4. Enter details:
   - Network name: `Arc Testnet`
   - RPC URL: `https://rpc.testnet.arc.network`
   - Chain ID: `5042002`
   - Currency symbol: `USDC`
   - Block explorer: `https://testnet.arcscan.app`
5. Click "Save"
6. Switch to Arc Testnet

---

## 🎯 Most Common Fix

**90% of the time, this error means:**

You're connected to the wrong network (e.g., Ethereum Mainnet, Sepolia, etc.) instead of Arc Testnet.

**Quick Fix:**
1. Open your wallet
2. Look at the current network (top of wallet)
3. If it says anything OTHER than "Arc Testnet", click it
4. Select "Arc Testnet" (or add it if missing)
5. Try deploying again

---

## 📊 Current Configuration

Your Arc Deploy Wizard is configured with:

```typescript
// src/lib/arcConfig.ts
export const arcTestnet = defineChain({
  id: 5042002,  // ✅ Correct
  name: 'Arc Testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 6,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.arc.network'],  // ✅ Verified working
    },
  },
  blockExplorers: {
    default: {
      name: 'Arc Explorer',
      url: 'https://testnet.arcscan.app',  // ✅ Correct
    },
  },
  testnet: true,
});
```

All settings are **correct and verified**.

---

## 🔄 Try This Now

1. **Disconnect wallet** from the dApp
2. **Open MetaMask** (or your wallet)
3. **Manually add Arc Testnet** (see details above)
4. **Switch to Arc Testnet** in your wallet
5. **Reconnect wallet** to the dApp
6. **Try deploying again**

---

## 💡 Alternative: Test RPC Directly

To verify your setup can reach Arc Testnet:

```bash
# Test chain ID
curl -X POST https://rpc.testnet.arc.network \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'

# Expected: {"jsonrpc":"2.0","id":1,"result":"0x4cef52"}
# 0x4cef52 = 5042002 in decimal
```

---

## 🆘 If Still Not Working

1. **Check RPC Status:**
   - Visit https://status.arc.network (if available)
   - Check Arc Discord/Twitter for network updates

2. **Try Alternative RPC:**
   - If Arc provides backup RPC endpoints, try those

3. **Clear Browser State:**
   ```bash
   # In browser console:
   localStorage.clear()
   sessionStorage.clear()
   # Then refresh page
   ```

4. **Try Different Browser/Wallet:**
   - Test in incognito mode
   - Try a different wallet if available

---

## 📝 Next Steps After Fix

Once you successfully connect:

1. You should see your address in the wizard header
2. Click "Get Started"
3. Select contract type
4. Fill parameters
5. Deploy!

---

## ✅ Success Indicators

When everything is working correctly:

- ✅ Wallet shows "Arc Testnet" as current network
- ✅ Wizard header shows your connected address
- ✅ You can proceed through all wizard steps
- ✅ Gas estimation works
- ✅ Deployment succeeds

---

**Most Likely Issue:** Wallet not switched to Arc Testnet

**Quick Fix:** Switch network in your wallet to "Arc Testnet"

**If Arc Testnet not in wallet:** Add it manually using the details above
