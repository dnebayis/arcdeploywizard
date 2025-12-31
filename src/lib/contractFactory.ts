import { CONFIGURABLEERC20_ABI, CONFIGURABLEERC20_BYTECODE } from './abis/ConfigurableERC20';
import { CONFIGURABLEERC721_ABI, CONFIGURABLEERC721_BYTECODE } from './abis/ConfigurableERC721';
import { parseUnits } from 'viem';

export type MintAccessMode = 'OnlyOwner' | 'Public' | 'PublicWithWalletLimit';

export interface ERC20Options {
    name: string;
    symbol: string;
    initialSupply: string; // User input as string
    owner: string;
    mintable: boolean;
    burnable: boolean;
    pausable: boolean;
    maxSupply?: string; // Optional
}

export interface ERC721Options {
    name: string;
    symbol: string;
    owner: string;
    burnable: boolean;
    pausable: boolean;
    maxSupply?: string; // Optional
    mintAccessMode: MintAccessMode;
    walletMintLimit?: string; // Required if PublicWithWalletLimit
}

export interface DeploymentData {
    abi: any[];
    bytecode: `0x${string}`;
    args: any[];
}

/**
 * Prepares deployment arguments for ConfigurableERC20
 */
export function getERC20DeploymentData(options: ERC20Options): DeploymentData {
    const initialSupplyEndpoint = parseUnits(options.initialSupply || '0', 18); // Assuming 18 decimals fixed for now, as typical
    const maxSupply = options.maxSupply ? parseUnits(options.maxSupply, 18) : 0n;

    return {
        abi: CONFIGURABLEERC20_ABI as unknown as any[],
        bytecode: CONFIGURABLEERC20_BYTECODE as `0x${string}`,
        args: [
            options.name,
            options.symbol,
            initialSupplyEndpoint,
            options.owner,
            options.mintable,
            options.burnable,
            options.pausable,
            maxSupply
        ]
    };
}

/**
 * Prepares deployment arguments for ConfigurableERC721
 */
export function getERC721DeploymentData(options: ERC721Options): DeploymentData {
    const maxSupply = options.maxSupply ? BigInt(options.maxSupply) : 0n;
    const walletMintLimit = options.walletMintLimit ? BigInt(options.walletMintLimit) : 0n;

    // Map string enum to integer for Solidity
    // 0: OnlyOwner, 1: Public, 2: PublicWithWalletLimit
    let modeInt = 0;
    switch (options.mintAccessMode) {
        case 'OnlyOwner': modeInt = 0; break;
        case 'Public': modeInt = 1; break;
        case 'PublicWithWalletLimit': modeInt = 2; break;
    }

    return {
        abi: CONFIGURABLEERC721_ABI as unknown as any[],
        bytecode: CONFIGURABLEERC721_BYTECODE as `0x${string}`,
        args: [
            options.name,
            options.symbol,
            options.owner,
            options.burnable,
            options.pausable,
            maxSupply,
            modeInt,
            walletMintLimit
        ]
    };
}
