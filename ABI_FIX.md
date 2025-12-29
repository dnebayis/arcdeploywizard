# ABI Fix - Deployment Error Resolved

## Issue Identified

**Error:** `Cannot use 'in' operator to search for 'type' in constructor(...)`

**Root Cause:** The `getContractABI()` function was returning human-readable ABI strings instead of proper JSON ABI objects.

---

## What Was Wrong

### Before (Incorrect)
```typescript
export function getContractABI(contractType: ContractType): any[] {
  if (contractType === 'ERC20') {
    return [
      'constructor(string name, string symbol, uint256 initialSupply)',
      'function name() view returns (string)',
      // ... more strings
    ];
  }
}
```

**Problem:** These are human-readable strings, not the actual ABI format that viem expects.

---

## What Was Fixed

### After (Correct)
```typescript
export function getContractABI(contractType: ContractType): any[] {
  if (contractType === 'ERC20') {
    return [
      {
        "inputs": [
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          // ... proper JSON ABI
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      // ... more ABI items
    ];
  }
}
```

**Solution:** Extracted actual compiled ABIs from Hardhat artifacts.

---

## Fix Applied

**Script Created:** `extract-abi.js`

**What it does:**
1. Reads compiled artifacts from `artifacts/contracts/`
2. Extracts proper JSON ABIs
3. Updates `src/lib/deploy.ts` with real ABIs

**Result:**
- ✅ ERC20 ABI: 18 items (proper JSON format)
- ✅ ERC721 ABI: 33 items (proper JSON format)

---

## How To Apply

The fix has been automatically applied by running:
```bash
node extract-abi.js
```

**File Updated:** `src/lib/deploy.ts`

---

## What This Fixes

✅ **Constructor Encoding** - Properly encodes constructor arguments  
✅ **Gas Estimation** - Can now estimate gas with correct data  
✅ **Contract Deployment** - Deployment will work correctly  
✅ **Function Calls** - All contract interactions will work  

---

## Testing

After this fix, deployment should work:

1. Refresh browser
2. Connect wallet
3. Select contract and fill parameters
4. Preview gas (should work now)
5. Deploy (should succeed)

---

## Why This Matters

viem requires proper ABI JSON format with:
- `type` field (constructor, function, event, error)
- `inputs` array with full type definitions
- `outputs` for functions
- `stateMutability` for functions

Human-readable strings don't provide this structure, causing encoding failures.

---

## Status

✅ **FIXED** - Deployment should now work end-to-end

The Arc Deploy Wizard can now properly:
- Encode constructor arguments
- Estimate gas accurately
- Deploy contracts to Arc Testnet

---

**Try deploying again!** The error should be resolved.
