import { ContractType } from './arcConfig';

export type ConsequenceSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface Consequence {
    id: string;
    severity: ConsequenceSeverity;
    title: string;
    explanation: string;
    tooltip: string;
}

export interface ConfigFacts {
    contractType: ContractType;
    isMintable: boolean;
    isBurnable: boolean;
    isPausable: boolean;
    hasMaxSupply: boolean;
    maxSupply?: string;
    hasMetadataUri: boolean;
    isOwnerCustom: boolean;
    ownerAddress: string;
    hasWalletMintLimit: boolean;
    mintAccessMode?: string;
    contractName: string;
    symbol?: string;
    initialSupply?: string;
}

export interface ScenarioHint {
    condition: string;
    hint: string;
}

/**
 * Pure function to extract facts from deployment configuration
 */
export function deriveConfigFacts(contractType: ContractType, params: any): ConfigFacts {
    return {
        contractType,
        isMintable: params.mintable === true,
        isBurnable: params.burnable === true,
        isPausable: params.pausable === true,
        hasMaxSupply: !!params.maxSupply && params.maxSupply !== '',
        maxSupply: params.maxSupply,
        hasMetadataUri: !!params.uri && params.uri !== '',
        isOwnerCustom: params.owner !== params.userAddress,
        ownerAddress: params.owner,
        hasWalletMintLimit: params.mintAccessMode === 'PublicWithWalletLimit',
        mintAccessMode: params.mintAccessMode,
        contractName: params.name,
        symbol: params.symbol,
        initialSupply: params.initialSupply
    };
}

/**
 * Generate consequences based on configuration facts
 */
export function generateConsequences(facts: ConfigFacts): Consequence[] {
    const consequences: Consequence[] = [];

    // Minting consequences
    if (facts.isMintable && !facts.hasMaxSupply) {
        consequences.push({
            id: 'unlimited-minting',
            severity: 'WARNING',
            title: 'Unlimited minting enabled',
            explanation: 'The contract owner can mint any amount of tokens at any time.',
            tooltip: 'Without a max supply cap, the total supply can grow indefinitely. This affects token economics and scarcity.'
        });
    } else if (!facts.isMintable && facts.contractType === 'ERC20') {
        consequences.push({
            id: 'no-minting',
            severity: 'CRITICAL',
            title: 'Minting permanently disabled',
            explanation: 'No additional tokens can ever be created after initial supply.',
            tooltip: 'The total supply is fixed forever. You cannot add tokens later, even if needed.'
        });
    } else if (facts.isMintable && facts.hasMaxSupply) {
        consequences.push({
            id: 'capped-minting',
            severity: 'INFO',
            title: `Supply capped at ${facts.maxSupply}`,
            explanation: 'Minting is limited by a permanent maximum supply.',
            tooltip: 'This cap cannot be changed after deployment. Choose carefully.'
        });
    }

    // Pausing consequences
    if (!facts.isPausable) {
        consequences.push({
            id: 'no-pausing',
            severity: 'WARNING',
            title: 'Transfers cannot be paused',
            explanation: 'You will not be able to freeze transfers in case of emergencies.',
            tooltip: 'Without pause functionality, you cannot stop token transfers if something goes wrong.'
        });
    } else {
        consequences.push({
            id: 'pausable',
            severity: 'INFO',
            title: 'Emergency pause available',
            explanation: 'Contract owner can pause all transfers if needed.',
            tooltip: 'Useful for handling security incidents or unexpected issues.'
        });
    }

    // Metadata consequences (NFTs only)
    if ((facts.contractType === 'ERC721' || facts.contractType === 'ERC1155') && !facts.hasMetadataUri) {
        consequences.push({
            id: 'no-metadata',
            severity: 'CRITICAL',
            title: 'No metadata URI provided',
            explanation: 'NFTs will not display properly on marketplaces and explorers.',
            tooltip: 'Metadata defines the name, description, and image for your NFTs. Without it, they appear blank.'
        });
    }

    // Admin/Owner consequences
    if (facts.isOwnerCustom) {
        consequences.push({
            id: 'custom-owner',
            severity: 'WARNING',
            title: 'Admin role assigned to custom address',
            explanation: 'Control will be given to a different wallet than yours.',
            tooltip: 'Make absolutely sure you control this address and have verified it is correct.'
        });
    }

    // Mint access for NFTs
    if (facts.contractType === 'ERC721' || facts.contractType === 'ERC1155') {
        if (facts.mintAccessMode === 'Public') {
            consequences.push({
                id: 'public-minting',
                severity: 'WARNING',
                title: 'Public minting enabled',
                explanation: 'Anyone can mint tokens from this contract.',
                tooltip: 'Public minting means any wallet can create new NFTs without restrictions.'
            });
        } else if (facts.mintAccessMode === 'OnlyOwner') {
            consequences.push({
                id: 'owner-only-minting',
                severity: 'INFO',
                title: 'Owner-only minting',
                explanation: 'Only the contract owner can mint new tokens.',
                tooltip: 'This gives you full control over NFT creation but limits community participation.'
            });
        }
    }

    // Burning
    if (facts.isBurnable) {
        consequences.push({
            id: 'burnable',
            severity: 'INFO',
            title: 'Token holders can burn',
            explanation: 'Users can permanently destroy their own tokens.',
            tooltip: 'Burning reduces total supply. This is irreversible.'
        });
    }

    // Supply cap for NFTs
    if ((facts.contractType === 'ERC721' || facts.contractType === 'ERC1155') && facts.hasMaxSupply) {
        consequences.push({
            id: 'nft-supply-cap',
            severity: 'INFO',
            title: `Collection limited to ${facts.maxSupply} items`,
            explanation: 'This maximum cannot be increased later.',
            tooltip: 'Fixed supply creates scarcity but limits future expansion.'
        });
    }

    return consequences;
}

/**
 * Generate scenario-based hints
 */
export function generateScenarioHints(facts: ConfigFacts): ScenarioHint[] {
    const hints: ScenarioHint[] = [];

    if ((facts.contractType === 'ERC721' || facts.contractType === 'ERC1155') && !facts.hasMetadataUri) {
        hints.push({
            condition: 'If you plan to list on NFT marketplaces',
            hint: 'Metadata URI is required for proper display. Consider adding it before deployment.'
        });
    }

    if (facts.contractType === 'ERC20' && !facts.isMintable && !facts.hasMaxSupply) {
        hints.push({
            condition: 'If this token is for production use',
            hint: 'Fixed supply with no minting means you cannot adjust tokenomics later.'
        });
    }

    if (!facts.isPausable) {
        hints.push({
            condition: 'If something goes wrong after launch',
            hint: 'You will not be able to freeze transfers or prevent further damage.'
        });
    }

    if (facts.isOwnerCustom) {
        hints.push({
            condition: 'Before deploying',
            hint: 'Triple-check the custom owner address. Lost access = lost control forever.'
        });
    }

    return hints;
}

/**
 * Get severity color for UI rendering
 */
export function getSeverityColor(severity: ConsequenceSeverity): string {
    switch (severity) {
        case 'INFO':
            return 'var(--accent)';
        case 'WARNING':
            return '#f59e0b';
        case 'CRITICAL':
            return '#ef4444';
    }
}

/**
 * Get severity icon
 */
export function getSeverityIcon(severity: ConsequenceSeverity): string {
    switch (severity) {
        case 'INFO':
            return 'info';
        case 'WARNING':
            return 'warning';
        case 'CRITICAL':
            return 'error';
    }
}
