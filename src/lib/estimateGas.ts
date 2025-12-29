import { parseEther, parseUnits, type PublicClient } from 'viem';
import { ContractType } from './arcConfig';

/**
 * Estimate gas cost in USDC for contract deployment
 * Arc Testnet uses USDC as native currency (6 decimals)
 * 
 * Note: This provides estimates based on bytecode size since we can't
 * accurately estimate gas without fully encoded constructor arguments.
 * The actual deployment will show precise gas usage.
 */
export async function estimateDeploymentCost(
    publicClient: PublicClient,
    bytecode: `0x${string}`,
): Promise<{
    gasEstimate: bigint;
    gasCostUSDC: string;
    bytecodeSize: number;
}> {
    try {
        // Calculate bytecode size
        const bytecodeSize = (bytecode.length - 2) / 2; // Remove 0x and divide by 2

        // Estimate gas based on bytecode size
        // Formula: ~200 gas per byte + 21000 base + 32000 contract creation
        const estimatedGas = BigInt(Math.ceil(bytecodeSize * 200 + 53000));

        // Get current gas price
        const gasPrice = await publicClient.getGasPrice();

        // Calculate total cost (gas * gasPrice)
        const totalCostWei = estimatedGas * gasPrice;

        // Convert to USDC (6 decimals)
        // Wei is 18 decimals, USDC is 6 decimals  
        const usdcAmount = Number(totalCostWei) / 1e18;

        return {
            gasEstimate: estimatedGas,
            gasCostUSDC: usdcAmount.toFixed(6),
            bytecodeSize,
        };
    } catch (error) {
        console.error('Gas estimation error:', error);
        // Return fallback estimates
        const bytecodeSize = bytecode ? (bytecode.length - 2) / 2 : 0;
        return {
            gasEstimate: BigInt(2500000),
            gasCostUSDC: '0.50',
            bytecodeSize,
        };
    }
}

/**
 * Format constructor parameters for deployment
 */
export function formatConstructorParams(
    contractType: ContractType,
    params: Record<string, string>
): any[] {
    if (contractType === 'ERC20') {
        return [
            params.name,
            params.symbol,
            parseEther(params.initialSupply || '0'), // Convert to wei (18 decimals)
        ];
    } else if (contractType === 'ERC721') {
        // Only name and symbol - metadata is auto-generated on-chain!
        return [
            params.name,
            params.symbol,
        ];
    }
    return [];
}
