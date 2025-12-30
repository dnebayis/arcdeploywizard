import { defineChain } from 'viem';

/**
 * Arc L1 Testnet Configuration
 * Gas token: USDC (native currency)
 */
export const arcTestnet = defineChain({
    id: 5042002,
    name: 'Arc Network Testnet',
    nativeCurrency: {
        name: 'USDC',
        symbol: 'USDC',
        decimals: 18,
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

/**
 * Shared NFT metadata for ERC721 collections
 * All NFTs in the collection share this metadata and preview image
 */
const NFT_METADATA = {
    name: "Arc Wizard NFT",
    description: "A unique NFT deployed using the Arc Deploy Wizard on Arc Testnet.",
    image: "https://emerald-spotty-boar-761.mypinata.cloud/ipfs/bafybeic5wusdlmndycj6vbjigvle3qkdmbwbiqxtmn33m363dr6nd54q2i",
    attributes: [
        {
            trait_type: "Deployed Via",
            value: "Arc Deploy Wizard"
        },
        {
            trait_type: "Network",
            value: "Arc Testnet"
        }
    ]
};

// Inline metadata as data URI to avoid external fetch issues
export const SHARED_NFT_METADATA_URI = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(NFT_METADATA))}`;


export const SHARED_NFT_METADATA = NFT_METADATA;

/**
 * Contract bytecode templates
 */
export const CONTRACT_TEMPLATES = {
    ERC20: {
        name: 'ERC20 Token',
        description: 'Fungible token standard for currencies and points',
        icon: 'token',
        params: [
            { name: 'name', type: 'string', label: 'Token Name', placeholder: 'My Token', tooltip: 'Full name of your token' },
            { name: 'symbol', type: 'string', label: 'Symbol', placeholder: 'MTK', tooltip: 'Ticker symbol (3-5 characters)' },
            { name: 'initialSupply', type: 'uint256', label: 'Initial Supply', placeholder: '1000000', tooltip: 'Total tokens to mint (in whole units)' },
        ],
    },
    ERC721: {
        name: 'ERC721 NFT',
        description: 'Non-fungible token standard for unique digital assets',
        icon: 'image',
        helperText: 'All NFTs in this collection share the same preview and metadata.',
        params: [
            { name: 'name', type: 'string', label: 'Collection Name', placeholder: 'My NFT Collection', tooltip: 'Name of your NFT collection' },
            { name: 'symbol', type: 'string', label: 'Symbol', placeholder: 'MNFT', tooltip: 'Collection ticker symbol (3-5 characters)' },
        ],
    },
    RISK_SCANNER: {
        name: 'Allowance Scanner',
        description: 'Scan and revoke risky ERC20 token allowances',
        icon: 'shield',
        params: [], // No deployment params needed
    },
} as const;

export type ContractType = keyof typeof CONTRACT_TEMPLATES;
