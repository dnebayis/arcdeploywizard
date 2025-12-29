# Deploy History UI - Shadcn + Tailwind Implementation Spec

## 🎯 Design Philosophy

The Deploy History UI transforms from a simple grid to a **timeline-based feed** that emphasizes the user's journey.

**Key Goals:**
1. **Distinction:** Immediately separate "Wizard" (Premium) vs "External" (Standard) deployments.
2. **Clarity:** Scannable list with clear typography and hierarchy.
3. **Aesthetics:** Minimal, "Linear-style" design using Shadcn principles.

---

## 🎨 Token & Badge System

### 1. Wizard Deployments (Premium)
*Deployed via this app. Metadata is available.*

- **Badge:** `[ ✨ Wizard Deploy ]`
- **Style:** 
  - Background: `bg-blue-500/10` (Subtle tint)
  - Text: `text-blue-500`
  - Border: `border-blue-200/20`
  - Shape: `rounded-full`
  - Icon: ✨ (Sparkles)
- **Card Highlight:** Subtle colored border on hover.

### 2. External Deployments (Standard)
*Deployed via other tools (Remix, Hardhat, etc). Only on-chain data.*

- **Badge:** None (or "External" label)
- **Label:** `text-gray-500` "External Deployment"
- **Style:** Neutral monochrome.
- **Icon:** 📄 (Generic Contract)

---

## 📐 Layout Structure

### Container
- **Width:** `max-w-2xl` (672px)
- **Alignment:** Centered
- **Spacing:** Vertical stack, `gap-4`

### Card Component (`DeploymentCard`)

```
┌────────────────────────────────────────────────────────┐
│  ┌─────┐                                               │
│  │ ICON│   Token Name / Contract Name      [ BADGE ]   │
│  └─────┘   0x1234...5678                               │
│                                                        │
│            12 mins ago             View on Explorer ↗  │
└────────────────────────────────────────────────────────┘
```

**Row 1 (Header):**
- **Left:** Icon (Type based: NFT vs Token vs Contract)
- **Middle:** Name & Address
- **Right:** Badge (if Wizard)

**Row 2 (Meta):**
- **Left:** Relative timestamp (e.g. "2 hours ago")
- **Right:** Explorer External Link

---

## 🛠️ Implementation Approach (CSS Modules)

*Note: Implementing Shadcn visuals using existing CSS Modules stack to maintain project consistency.*

### Card Styles
- **Background:** `var(--card)` (Dark gray/black)
- **Border:** `1px solid var(--border)`
- **Radius:** `var(--radius)` (0.5rem)
- **Shadow:** `none` (or subtle `shadow-sm`)

### Typography
- **Name:** `font-weight: 600`, `size: 1.125rem`
- **Address:** `font-family: monospace`, `color: var(--muted)`
- **Meta:** `size: 0.875rem`, `color: var(--muted-foreground)`

### Badge Styles
- **Base:** `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold`
- **Variant:** `bg-primary/10 text-primary`

---

## 🧩 Visual Distinction Rules

| Feature | Wizard Deploy | External Deploy |
| :--- | :--- | :--- |
| **Icon** | 🎨 (NFT) or 🪙 (Token) | 📄 (Contract) |
| **Name** | User-defined Name (e.g. "Cool Cats") | "External Contract" |
| **Badge** | Visible (`Wizard Deploy`) | Hidden |
| **Border** | Hover: `border-blue-500` | Hover: `border-gray-500` |
| **Preview** | Show Token Image (if NFT) | No Preview |

---

## 🔄 Data Merging Logic

1. **Fetch:** Get all transactions from ArcScan.
2. **Match:** Check local storage for matching `contractAddress`.
3. **Enrich:**
   - If Match: Add local name, image, wizard type. Set `isWizard=true`.
   - If No Match: Use default name. Set `isWizard=false`.
4. **Sort:** Chronological (Newest first).
