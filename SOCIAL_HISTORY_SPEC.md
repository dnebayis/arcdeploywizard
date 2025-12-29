# Arc Deploy Wizard - Social & History Feature Specification

## Overview

This document specifies three interconnected features that transform the Arc Deploy Wizard into a social, traceable deployment platform:

1. **Wizard Share Card** - PNG generation for social sharing
2. **Twitter Integration** - One-click tweet sharing
3. **Deploy History** - Hybrid explorer + local storage tracking

---

## 🎨 Feature 1: Wizard Share Card (PNG Generation)

### Purpose

Generate beautiful, shareable PNG cards after each successful deployment to:
- Enable social proof and viral growth
- Provide downloadable deployment certificates
- Create memorable, branded artifacts

### Design Specification

#### Card Dimensions
- **Size:** 1200x1200px (square, optimal for Twitter/social)
- **Format:** PNG with transparency support
- **DPI:** 72 (web-optimized)

#### Visual Design

```
┌─────────────────────────────────────┐
│ [Arc Logo]                          │ ← Top right, 40x40px
│                                     │
│     ┌───────────────────┐          │
│     │                   │          │
│     │   NFT IMAGE       │          │
│     │   (if available)  │          │ ← 600x600px centered
│     │                   │          │
│     └───────────────────┘          │
│                                     │
│  NFT DEPLOYED ON ARC TESTNET       │ ← Action label
│                                     │
│  Cool Cats NFT Collection          │ ← NFT name (large)
│                                     │
│  0x1234...5678                     │ ← Short address
│                                     │
│  Built with Arc Deploy Wizard      │ ← Footer
└─────────────────────────────────────┘
```

#### Color Scheme
- **Background:** `#0a0a0a` (dark)
- **Text Primary:** `#ffffff` (white)
- **Text Secondary:** `#888888` (gray)
- **Accent:** `#3b82f6` (blue, for highlights)
- **Border:** `1px solid #1a1a1a` (subtle)

### Component Structure

**File:** `src/components/WizardShareCard.tsx`

```typescript
interface WizardShareCardProps {
  // Content
  action: string;           // "NFT Deployed", "Contract Created"
  title: string;            // NFT name or contract name
  address: string;          // Contract address
  network: string;          // "Arc Testnet"
  
  // Visual
  imageUrl?: string;        // NFT image or visual
  
  // Metadata
  timestamp?: Date;
}

export function WizardShareCard(props: WizardShareCardProps) {
  // Render card designed for PNG export
  // Off-screen rendering, hidden from view
}
```

### Arc Logo Integration

The Arc logo SVG should be embedded inline:

```typescript
function ArcLogoForCard() {
  return (
    <svg width="40" height="40" viewBox="0 0 297.74 311.98" style={{ fill: '#3b82f6' }}>
      <path d="M0,311.98c2.53-76.38,15.48-147.66,37.13-203.09C64.54,38.67,104.23,0,148.86,0s84.32,38.67,111.74,108.9c14.26,36.52,24.75,79.92,30.97,127.13.56,4.22,1.03,8.5,1.51,12.78.16.26.25.51.22.71,0,0,3.65,22.82,4.43,62.47h-.41c-5.42-4.45-69.33-54.66-175.27-40.12,1.6-17.93,3.8-35.37,6.64-52.09.15-.85.31-1.68.46-2.53,41.55-1.25,77.92,3.57,105.81,9.9-.1-.66-.19-1.34-.3-2-5.73-35.7-14.19-68.38-25.1-96.31-17.83-45.67-41.1-74.04-60.71-74.04s-42.88,28.37-60.71,74.04c-4.32,11.05-8.25,22.83-11.77,35.25-4.95,17.41-9.11,36.08-12.44,55.69-4.92,28.97-7.99,60.03-9.12,92.22H0Z"/>
    </svg>
  );
}
```

### PNG Generation Implementation

#### Dependencies Required

```bash
npm install html-to-image
```

#### Generation Function

**File:** `src/lib/shareCard.ts`

```typescript
import { toPng } from 'html-to-image';

export async function generateShareCard(elementId: string): Promise<string> {
  const element = document.getElementById(elementId);
  
  if (!element) {
    throw new Error('Share card element not found');
  }
  
  try {
    // Generate PNG data URL
    const dataUrl = await toPng(element, {
      cacheBust: true,
      pixelRatio: 2,  // High quality
      width: 1200,
      height: 1200,
    });
    
    return dataUrl;
  } catch (error) {
    console.error('Failed to generate share card:', error);
    throw error;
  }
}

export function downloadShareCard(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
```

### Usage Flow

1. **User deploys contract** → Success screen appears
2. **Share card renders off-screen** (hidden div)
3. **User clicks "Download Share Image"**
4. **PNG is generated** from the hidden card
5. **Download triggers** automatically

### Example Integration

```typescript
// In success screen
const [shareCardReady, setShareCardReady] = useState(false);

const handleDownloadShareCard = async () => {
  try {
    const dataUrl = await generateShareCard('wizard-share-card');
    downloadShareCard(dataUrl, `arc-wizard-${deployedData.address}.png`);
  } catch (error) {
    alert('Failed to generate share card');
  }
};

return (
  <>
    {/* Visible success UI */}
    <button onClick={handleDownloadShareCard}>
      Download Share Image
    </button>
    
    {/* Hidden share card for PNG generation */}
    <div id="wizard-share-card" style={{ position: 'absolute', left: '-9999px' }}>
      <WizardShareCard
        action="NFT Deployed"
        title={params.name}
        address={deployedData.address}
        network="Arc Testnet"
        imageUrl={SHARED_NFT_METADATA.image}
      />
    </div>
  </>
);
```

---

## 🐦 Feature 2: Twitter Sharing System

### Purpose

Enable one-click Twitter sharing of deployment achievements using Twitter Web Intents (no API required).

### Tweet Generation

#### Tweet Template

```typescript
interface TweetContent {
  action: string;      // "NFT deployed"
  title: string;       // NFT name
  address: string;     // Contract address
  network: string;     // "Arc Testnet"
  url?: string;        // Explorer link
}

function generateTweetText(content: TweetContent): string {
  const shortAddress = `${content.address.slice(0, 6)}...${content.address.slice(-4)}`;
  
  return `🚀 ${content.action} on ${content.network}

🧩 ${content.title}
📜 ${shortAddress}

Built with Arc Deploy Wizard

${content.url || ''}`;
}
```

#### Example Output

```
🚀 NFT deployed on Arc Testnet

🧩 Cool Cats NFT Collection
📜 0x1234...5678

Built with Arc Deploy Wizard

https://testnet.arcscan.app/address/0x1234567890abcdef
```

### Twitter Intent Implementation

**File:** `src/lib/twitter.ts`

```typescript
export function shareOnTwitter(text: string, url?: string) {
  const encodedText = encodeURIComponent(text);
  const encodedUrl = url ? encodeURIComponent(url) : '';
  
  const intentUrl = `https://twitter.com/intent/tweet?text=${encodedText}${encodedUrl ? `&url=${encodedUrl}` : ''}`;
  
  // Open in new window
  window.open(
    intentUrl,
    'twitter-share',
    'width=550,height=420,menubar=no,toolbar=no'
  );
}
```

### UI Integration

```typescript
// In success screen
const handleShareTwitter = () => {
  const tweetText = generateTweetText({
    action: 'NFT deployed',
    title: params.name,
    address: deployedData.address,
    network: 'Arc Testnet',
    url: `https://testnet.arcscan.app/address/${deployedData.address}`
  });
  
  shareOnTwitter(tweetText);
};

return (
  <div className={styles.successActions}>
    <button onClick={handleDownloadShareCard}>
      📥 Download Share Image
    </button>
    <button onClick={handleShareTwitter}>
      🐦 Share on Twitter
    </button>
  </div>
);
```

### Share Button Styles

```css
/* Matching wizard aesthetic */
.shareButton {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  transition: var(--transition);
}

.shareButton:hover {
  background: var(--bg-hover);
  border-color: var(--accent);
}
```

---

## 📜 Feature 3: Deploy History (Hybrid System)

### Purpose

Provide users with a complete view of their deployment history by combining:
- **Arc Scan API data** (all deployments from wallet)
- **Local wizard metadata** (enriched context for wizard-created contracts)

### Data Architecture

#### Local Storage Schema

**File:** `src/lib/deployHistory.ts`

```typescript
interface DeploymentRecord {
  // Core data
  txHash: string;
  contractAddress: string;
  timestamp: number;
  
  // Wizard context
  wizardType: 'ERC20' | 'ERC721';
  contractName: string;
  
  // ERC20 specific
  tokenSymbol?: string;
  initialSupply?: string;
  
  // ERC721 specific
  nftImageUrl?: string;
  
  // Metadata
  deployedBy: string;  // Wallet address
  network: string;     // "Arc Testnet"
}

// LocalStorage key
const HISTORY_KEY = 'arc-wizard-deploy-history';

export function saveDeployment(record: DeploymentRecord) {
  const history = getLocalHistory();
  history.push(record);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function getLocalHistory(): DeploymentRecord[] {
  const data = localStorage.getItem(HISTORY_KEY);
  return data ? JSON.parse(data) : [];
}
```

#### Arc Scan API Integration

**File:** `src/lib/arcScan.ts`

```typescript
interface ScanDeployment {
  hash: string;
  contractAddress: string;
  timeStamp: string;  // Unix timestamp as string
  from: string;
  to: string;  // null for contract creation
}

export async function fetchDeployments(address: string): Promise<ScanDeployment[]> {
  try {
    // Arc Scan API endpoint (adjust based on actual API)
    const response = await fetch(
      `https://api.testnet.arcscan.app/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc`
    );
    
    const data = await response.json();
    
    if (data.status !== '1') {
      throw new Error('API error');
    }
    
    // Filter contract deployments (to = null or empty)
    return data.result.filter((tx: any) => 
      !tx.to || tx.to === '' || tx.contractAddress
    );
  } catch (error) {
    console.error('Failed to fetch deployments from Arc Scan:', error);
    return [];
  }
}
```

#### Merge Strategy

```typescript
interface EnrichedDeployment extends ScanDeployment {
  // From local storage
  wizardType?: 'ERC20' | 'ERC721';
  contractName?: string;
  tokenSymbol?: string;
  nftImageUrl?: string;
  
  // Computed
  isWizardDeployed: boolean;
}

export async function getEnrichedHistory(
  walletAddress: string
): Promise<EnrichedDeployment[]> {
  // 1. Fetch from Arc Scan
  const scanDeployments = await fetchDeployments(walletAddress);
  
  // 2. Get local wizard history
  const localHistory = getLocalHistory();
  
  // 3. Create lookup map
  const localMap = new Map(
    localHistory.map(record => [record.contractAddress.toLowerCase(), record])
  );
  
  // 4. Merge
  const enriched: EnrichedDeployment[] = scanDeployments.map(scan => {
    const local = localMap.get(scan.contractAddress?.toLowerCase() || '');
    
    return {
      ...scan,
      wizardType: local?.wizardType,
      contractName: local?.contractName,
      tokenSymbol: local?.tokenSymbol,
      nftImageUrl: local?.nftImageUrl,
      isWizardDeployed: !!local,
    };
  });
  
  return enriched;
}
```

### Deploy History UI

#### Route Setup

**File:** `src/app/history/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { getEnrichedHistory, EnrichedDeployment } from '@/lib/deployHistory';

export default function HistoryPage() {
  const { address } = useAccount();
  const [deployments, setDeployments] = useState<EnrichedDeployment[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!address) return;
    
    getEnrichedHistory(address)
      .then(setDeployments)
      .finally(() => setLoading(false));
  }, [address]);
  
  if (!address) {
    return <div>Connect wallet to view history</div>;
  }
  
  if (loading) {
    return <div>Loading deployment history...</div>;
  }
  
  return (
    <div>
      <h1>Deploy History</h1>
      {deployments.map(deployment => (
        <DeploymentCard key={deployment.hash} deployment={deployment} />
      ))}
    </div>
  );
}
```

#### Deployment Card Component

```typescript
function DeploymentCard({ deployment }: { deployment: EnrichedDeployment }) {
  const date = new Date(parseInt(deployment.timeStamp) * 1000);
  
  return (
    <div className={styles.deploymentCard}>
      {deployment.nftImageUrl && (
        <img src={deployment.nftImageUrl} alt="NFT" className={styles.preview} />
      )}
      
      <div className={styles.content}>
        <div className={styles.header}>
          <h3>
            {deployment.isWizardDeployed ? (
              <>
                {deployment.wizardType} · {deployment.contractName}
              </>
            ) : (
              'External Deployment'
            )}
          </h3>
          <span className={styles.date}>
            {date.toLocaleDateString()}
          </span>
        </div>
        
        <div className={styles.details}>
          <code>{deployment.contractAddress}</code>
        </div>
        
        <a
          href={`https://testnet.arcscan.app/address/${deployment.contractAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.explorerLink}
        >
          View on Explorer →
        </a>
      </div>
    </div>
  );
}
```

### Integration with Success Screen

```typescript
// After successful deployment, save to local history
const handleDeploy = async () => {
  // ... deployment logic ...
  
  const result = await deployContract(/* ... */);
  
  // Save to local history
  saveDeployment({
    txHash: result.txHash,
    contractAddress: result.address,
    timestamp: Date.now(),
    wizardType: selectedContract,
    contractName: params.name,
    tokenSymbol: params.symbol,
    nftImageUrl: selectedContract === 'ERC721' ? SHARED_NFT_METADATA.image : undefined,
    deployedBy: address!,
    network: 'Arc Testnet',
  });
  
  setDeployedData(result);
  setStep('success');
};
```

---

## 🎯 Complete User Journey

### Deployment Flow

1. **User deploys contract** (ERC20 or ERC721)
2. **Wizard shows success screen** with:
   - Contract address
   - Transaction hash
   - **"Download Share Image" button**
   - **"Share on Twitter" button**
   - "View on Explorer" link

3. **User clicks "Download Share Image":**
   - Hidden share card renders with deployment info
   - PNG generated (1200x1200)
   - Download starts automatically
   - File saved as `arc-wizard-{address}.png`

4. **User clicks "Share on Twitter":**
   - Tweet pre-filled with deployment details
   - Twitter opens in popup
   - User can add more text or post immediately

5. **Deployment saved to local history**
   - Contract address
   - Wizard type (ERC20/ERC721)
   - NFT name
   - Image URL (for ERC721)
   - Timestamp

### History Page Flow

1. **User navigates to /history**
2. **App fetches:**
   - All contract deployments from Arc Scan API
   - Local wizard metadata from localStorage
3. **Data merged** on txHash/contractAddress
4. **List displays** with:
   - Wizard-deployed items (enriched with metadata)
   - External deployments (basic info only)
5. **Each item shows:**
   - NFT preview (if wizard-deployed ERC721)
   - Contract name (if wizard-deployed)
   - Contract address
   - Timestamp
   - Explorer link

---

## 📦 Implementation Checklist

### Phase 1: Share Card
- [ ] Install html-to-image
- [ ] Create WizardShareCard component
- [ ] Add generateShareCard function
- [ ] Add download button to success screen
- [ ] Test PNG generation

### Phase 2: Twitter Integration
- [ ] Create twitter.ts utility
- [ ] Add generateTweetText function
- [ ] Add "Share on Twitter" button
- [ ] Test Twitter intent

### Phase 3: Deploy History
- [ ] Create deployHistory.ts (local storage)
- [ ] Create arcScan.ts (API integration)
- [ ] Implement merge logic
- [ ] Create /history route
- [ ] Create DeploymentCard component
- [ ] Save deployment on success
- [ ] Test history page

---

## 🎨 Visual Preview

### Success Screen (Updated)

```
┌────────────────────────────────────┐
│  ✓  Contract Deployed!             │
│                                    │
│  Contract Address:                 │
│  0x1234567890abcdef                │
│  [Copy]                            │
│                                    │
│  Transaction Hash:                 │
│  0xabcdef1234567890                │
│  [Copy]                            │
│                                    │
│  ┌──────────────┐ ┌─────────────┐ │
│  │ 📥 Download  │ │ 🐦 Share on │ │
│  │ Share Image  │ │  Twitter    │ │
│  └──────────────┘ └─────────────┘ │
│                                    │
│  [View on Explorer] [Deploy Another]│
└────────────────────────────────────┘
```

### History Page

```
┌────────────────────────────────────┐
│  Deploy History                    │
├────────────────────────────────────┤
│  ┌────────────────────────────┐   │
│  │ [IMG] ERC721 · Cool Cats   │   │
│  │       0x1234...5678        │   │
│  │       Dec 29, 2025         │   │
│  │       View on Explorer →   │   │
│  └────────────────────────────┘   │
│                                    │
│  ┌────────────────────────────┐   │
│  │       ERC20 · My Token     │   │
│  │       0xabcd...ef01        │   │
│  │       Dec 28, 2025         │   │
│  │       View on Explorer →   │   │
│  └────────────────────────────┘   │
└────────────────────────────────────┘
```

---

## 🔧 Technical Notes

### localStorage Considerations
- Max size: ~5-10MB per domain
- Store only essential data
- Compress if needed
- Consider IndexedDB for larger datasets

### API Rate Limiting
- Cache Arc Scan responses
- Implement request throttling
- Show loading states

### PNG Generation Performance
- Render card off-screen
- Use requestAnimationFrame for timing
- Show progress indicator for large images

### Twitter Intent Limitations
- Max tweet length: 280 characters
- URL shortening handled by Twitter
- No upload capability (user must attach PNG manually)

---

## 🎉 Expected Impact

### User Benefits
- **Social Proof:** Shareable deployment certificates
- **History Tracking:** Never lose deployed contracts
- **Viral Growth:** Beautiful share cards encourage sharing
- **Professional:** Branded, polished artifacts

### Technical Benefits
- **No Backend:** Pure client-side solution
- **Hybrid Data:** Best of both (API + local)
- **Portable:** localStorage works offline
- **Scalable:** API handles historical data

---

This completes the specification for the Social & History features!
