# ERC721 with Shared IPFS Metadata - Implementation Guide

## 🎯 Concept

This implementation uses a **single shared IPFS metadata file** for ALL NFTs in a collection.

**Key Behavior:**
- `tokenURI(1)` → returns metadata.json
- `tokenURI(999)` → returns metadata.json
- ALL tokens → SAME metadata and image

This is perfect for:
- Uniform collections (all NFTs look the same)
- Membership tokens
- Access passes
- Event tickets
- Simple branded NFTs

---

## 📝 Smart Contract

### Contract: `SimpleERC721`

```solidity
// All NFTs share this metadata
string private constant SHARED_METADATA_URI = 
    "https://emerald-spotty-boar-761.mypinata.cloud/ipfs/bafybeic5wusdlmndycj6vbjigvle3qkdmbwbiqxtmn33m363dr6nd54q2i/metadata.json";

function tokenURI(uint256 tokenId) public view override returns (string memory) {
    _requireOwned(tokenId);  // Token must exist
    return SHARED_METADATA_URI;  // BUT all return same URI
}
```

###Human: Key Features

1. **Constructor:** Only needs `name` and `symbol`
2. **No baseURI parameter:** Metadata URI is hardcoded
3. **Public mint():** Anyone can mint
4. **totalSupply():** Track minted count
5. **Shared metadata:** All NFTs identical

---

## 🎨 NFT Preview Component

### Component: `NftPreviewCard`

**Purpose:** Show users what their NFT collection will look like before deployment.

**Features:**
- Fetches metadata from IPFS
- Displays NFT image
- Shows collection name (updates live)
- Clean, minimal design

**Props:**
```typescript
interface NftPreviewCardProps {
    name: string;              // Collection name from user input
    metadataUri?: string;      // IPFS metadata URL
}
```

**Behavior:**
1. Fetch metadata.json from IPFS
2. Extract image URL
3. Convert ipfs:// to https:// if needed
4. Display image in card with name
5. Show loading state while fetching

---

## 🖼️ Wizard UI Changes

### Configuration Form

**Before:** 3 fields (name, symbol, baseURI)
**After:** 2 fields (name, symbol)

**New Layout:**
```
┌─────────────────────────────────┐
│ Configure ERC721 NFT            │
├─────────────────────────────────┤
│ Collection Name: [My NFTs    ]  │
│ Symbol:          [MNFT       ]  │
│                                 │
│ ℹ️  All NFTs in this collection│
│    share the same preview and   │
│    metadata.                    │
└─────────────────────────────────┘

┌─────────────────┐
│   NFT PREVIEW   │
├─────────────────┤
│  ┌───────────┐  │
│  │           │  │
│  │   IMAGE   │  │
│  │           │  │
│  └───────────┘  │
│  My NFTs        │
│  Description... │
└─────────────────┘
```

### Preview Updates Live

As the user types the collection name:
```typescript
Input: "Cool Cats"
Preview shows: "Cool Cats" (instantly)

Input: "Wizard NFTs"
Preview shows: "Wizard NFTs" (instantly)
```

---

## 📊 Metadata Structure

### Example metadata.json

```json
{
  "name": "Arc Wizard NFT",
  "description": "An NFT deployed using Arc Deploy Wizard on Arc Testnet.",
  "image": "ipfs://QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/image.png",
  "attributes": [
    {
      "trait_type": "Type",
      "value": "Membership"
    },
    {
      "trait_type": "Deployed Via",
      "value": "Arc Deploy Wizard"
    }
  ]
}
```

**Key Fields:**
- `name`: Collection name (overridden by user input in UI)
- `description`: Short description
- `image`: IPFS or HTTP image URL
- `attributes`: Optional traits array

---

## 🔗 IPFS Gateway Conversion

The component automatically converts IPFS URIs:

```typescript
// Input formats supported:
ipfs://QmHash...           → https://ipfs.io/ipfs/QmHash...
https://emerald-spotty... → Used as-is (already HTTP)
```

This ensures images display in wallets and explorers.

---

## 🎨 UI Design Principles

### Card Design
- **Width:** 320-360px
- **Aspect:** Square image (1:1)
- **Colors:** Dark theme, subtle borders
- **Shadow:** Soft, elevated feel
- **Corners:** Large radius (14px)

### Typography
- **Name:** 18px, bold, prominent
- **Description:** 14px, gray, line-clamped to 2 lines

### States
- **Loading:** Show spinner
- **Loaded:** Display image + metadata
- **Error/No image:** Show placeholder icon

---

## 🚀 Deployment Flow

### User Journey

1. **Select ERC721** → Shows preview card
2. **Enter name:** "Wizard NFTs"
   - Preview updates instantly
   - Shows shared IPFS image
3. **Enter symbol:** "WIZ"
4. **See preview** → Builds confidence
5. **Deploy** → One click!

**Time to deploy:** ~30 seconds

---

## 💡 How Shared Metadata Works

### Traditional (Different URIs)

```
Token #1 → metadata/1.json → unique image
Token #2 → metadata/2.json → unique image
Token #3 → metadata/3.json → unique image
```

**Requires:**
- Generating N metadata files
- Uploading N images
- Complex IPFS folder structure

### Shared Metadata (This Implementation)

```
Token #1 → metadata.json → shared image
Token #2 → metadata.json → shared image
Token #3 → metadata.json → shared image
```

**Requires:**
- ONE metadata file
- ONE image
- Simple IPFS link

---

## ⚙️ Configuration

### Update Metadata URI

To change the shared metadata:

**1. Update the contract:**
```solidity
// contracts/ERC721Template.sol
string private constant SHARED_METADATA_URI = 
    "YOUR_NEW_IPFS_URL_HERE";
```

**2. Update the config:**
```typescript
// src/lib/arcConfig.ts
export const SHARED_NFT_METADATA_URI = 
    'YOUR_NEW_IPFS_URL_HERE';
```

**3. Recompile:**
```bash
npx hardhat compile
node recreate-deploy.js
```

---

## 📁 Files Created/Modified

### New Files
1. **`src/components/NftPreviewCard.tsx`**
   - React component for NFT preview
   - Fetches metadata from IPFS
   - Displays image and collection info

2. **`src/components/NftPreviewCard.module.css`**
   - Dark-themed styles
   - Minimal, clean design
   - Matches Arc Wizard aesthetic

### Modified Files
1. **`contracts/ERC721Template.sol`**
   - Simplified to 2 parameters
   - Shared metadata URI (hardcoded)
   - Public mint function

2. **`src/lib/arcConfig.ts`**
   - Added `SHARED_NFT_METADATA_URI` constant
   - Added `helperText` to ERC721 config
   - Removed baseURI parameter

3. **`src/lib/deploy.ts`**
   - Auto-updated with new ABI/bytecode

---

## 🧪 Usage in Wizard

### Integration Example

```typescript
// In the ERC721 configuration step
import { NftPreviewCard } from '@/components/NftPreviewCard';
import { SHARED_NFT_METADATA_URI } from '@/lib/arcConfig';

function ERC721ConfigStep() {
  const [name, setName] = useState('');
  
  return (
    <div>
      <input 
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Collection Name"
      />
      
      <p className="helper-text">
        All NFTs in this collection share the same preview and metadata.
      </p>
      
      {/* Preview updates as user types */}
      <NftPreviewCard 
        name={name || 'Unnamed Collection'}
        metadataUri={SHARED_NFT_METADATA_URI}
      />
    </div>
  );
}
```

---

## ✅ Benefits

### For Users
- ✅ **Simpler:** No IPFS knowledge required
- ✅ **Faster:** 30-second deployment
- ✅ **Visual:** See NFT before deploying
- ✅ **Confident:** Preview builds trust

### For Developers
- ✅ **Minimal:** 2 constructor parameters
- ✅ **Predictable:** All NFTs identical
- ✅ **Maintainable:** Single metadata file
- ✅ **Flexible:** Easy to update URI

---

## 🎯 Use Cases

Perfect for:
- **Membership passes** (all members get same NFT)
- **Event tickets** (uniform appearance)
- **Access tokens** (same benefits)
- **Branded collections** (consistent branding)
- **Simple deployments** (fast & easy)

Not ideal for:
- Generative art (unique traits per NFT)
- PFP collections (different images per token)
- Numbered editions (unique metadata per token)

---

## 🔮 Future Enhancements

Possible additions:
1. **Multiple preset metadata** (let users choose from templates)
2. **Custom image upload** (upload to IPFS, generate metadata)
3. **Dynamic attributes** (tokenId-based traits)
4. **Metadata editor** (UI to customize JSON)

But for now: **simple is better!**

---

## 📊 Summary

### What Changed

| Aspect | Before | After |
|--------|--------|-------|
| **Constructor params** | 3 (name, symbol, baseURI) | 2 (name, symbol) |
| **Metadata** | On-chain generated | Shared IPFS file |
| **tokenURI logic** | Returns base64 data URI | Returns IPFS URL |
| **UI fields** | 3 inputs | 2 inputs + preview |
| **User experience** | Technical | Visual & simple |

### Contract Behavior

```solidity
// All tokens return the same URI
tokenURI(0)   → "https://emerald-spotty.../metadata.json"
tokenURI(1)   → "https://emerald-spotty.../metadata.json"
tokenURI(999) → "https://emerald-spotty.../metadata.json"
```

### UI Flow

```
1. User enters "Cool Cats" → Preview shows "Cool Cats" with image
2. User enters "CATS" → Form complete
3. User sees preview → Knows exactly what NFTs will look like
4. User deploys → Collection goes live
5. Anyone mints → Gets same image/metadata
```

---

## 🎉 Result

A **dramatically simpler** ERC721 deployment with:
- ✅ Visual preview
- ✅ Shared metadata
- ✅ 2-field form
- ✅ 30-second deployment
- ✅ Perfect for uniform collections

**The Arc Deploy Wizard just got even more magical!** ✨
