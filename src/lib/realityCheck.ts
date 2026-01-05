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
            title: 'No maximum supply enforced',
            explanation: 'Contract owner can create unlimited tokens at any time after deployment.',
            tooltip: 'Total supply can grow indefinitely. This permanently affects token scarcity and economics. Consider setting a max supply cap if token value depends on limited supply.'
        });
    } else if (!facts.isMintable && facts.contractType === 'ERC20') {
        consequences.push({
            id: 'no-minting',
            severity: 'CRITICAL',
            title: 'Token supply is permanently fixed',
            explanation: `Total supply locked at ${facts.initialSupply || 'initial amount'}. No additional tokens can ever be created.`,
            tooltip: 'Minting is permanently disabled. If you need more tokens later for any reason (growth, partnerships, liquidity), you cannot create them. This decision is irreversible.'
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
            severity: 'CRITICAL',
            title: 'Emergency pause not available',
            explanation: 'Transfers cannot be frozen. No way to stop activity if security issues are discovered.',
            tooltip: 'If an exploit is found or security issue emerges, you will not be able to pause token transfers. This is considered critical risk for production deployments.'
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
            severity: 'CRITICAL',
            title: 'Administrative control assigned to different address',
            explanation: `Contract ownership transferring to ${facts.ownerAddress?.slice(0, 10)}...`,
            tooltip: 'You are deploying this contract but giving control to a different address. Verify you control this address. Loss of access to the owner address means permanent loss of admin privileges.'
        });
    }

    // Mint access for NFTs
    if (facts.contractType === 'ERC721' || facts.contractType === 'ERC1155') {
        if (facts.mintAccessMode === 'Public') {
            consequences.push({
                id: 'public-minting',
                severity: 'CRITICAL',
                title: 'Public minting enabled without restrictions',
                explanation: `Anyone can mint ${facts.contractType === 'ERC1155' ? 'tokens for all token IDs' : 'NFTs'} from this contract.`,
                tooltip: 'Public minting means any address can create new tokens. Without max supply caps, this creates unlimited supply risk. Only use for open access projects like POAPs or badges.'
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
            condition: 'For marketplace integrations',
            hint: 'OpenSea, Rarible, and other marketplaces require metadata URI to display token information. Tokens without metadata appear blank or broken.'
        });
    }

    if (facts.contractType === 'ERC20' && !facts.isMintable && !facts.hasMaxSupply) {
        hints.push({
            condition: 'For production token economics',
            hint: 'Fixed supply with no minting capability means you cannot respond to demand changes or add liquidity later. Ensure initial supply meets all future needs.'
        });
    }

    if (!facts.isPausable) {
        hints.push({
            condition: 'If security incidents occur',
            hint: 'Without pause capability, you cannot stop malicious activity or freeze transfers during vulnerability disclosure. Consider enabling pause for production deployments.'
        });
    }

    if (facts.isOwnerCustom) {
        hints.push({
            condition: 'Before finalizing deployment',
            hint: 'Verify the owner address multiple times. Use an address from a hardware wallet or multisig for production contracts. Loss of access = permanent loss of control.'
        });
    }

    if (facts.mintAccessMode === 'Public' && !facts.hasMaxSupply) {
        hints.push({
            condition: 'For public minting without caps',
            hint: 'This configuration allows unlimited minting by anyone. Only appropriate for free, unlimited access projects (badges, POAPs, attendance tokens).'
        });
    }

    if (facts.contractType === 'ERC1155' && facts.mintAccessMode === 'Public') {
        hints.push({
            condition: 'For ERC-1155 public minting',
            hint: 'Public mint access applies to ALL token IDs in this contract. Anyone can mint unlimited quantities unless per-token caps are set.'
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
