const fs = require('fs');

// Read artifacts
const erc20Artifact = require('./artifacts/contracts/ERC20Template.sol/SimpleERC20.json');
const erc721Artifact = require('./artifacts/contracts/ERC721Template.sol/SimpleERC721.json');

const content = `import { type WalletClient, type PublicClient } from 'viem';
import { ContractType } from './arcConfig';

/**
 * Deploy contract to Arc Testnet
 * Returns deployed contract address and transaction hash
 */
export async function deployContract(
  walletClient: WalletClient,
  publicClient: PublicClient,
  contractType: ContractType,
  abi: any[],
  bytecode: string,
  constructorArgs: any[]
): Promise<{
  address: string;
  txHash: string;
}> {
  try {
    // Get account
    const [account] = await walletClient.getAddresses();

    if (!account) {
      throw new Error('No account connected');
    }

    // Deploy using viem's deployContract
    const hash = await walletClient.deployContract({
      abi,
      account,
      bytecode: bytecode as \`0x\${string}\`,
      args: constructorArgs,
    });

    // Wait for transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (!receipt.contractAddress) {
      throw new Error('Contract deployment failed - no address returned');
    }

    return {
      address: receipt.contractAddress,
      txHash: hash,
    };
  } catch (error: any) {
    console.error('Deployment error:', error);
    throw new Error(error.message || 'Contract deployment failed');
  }
}

/**
 * Get contract ABI based on type
 */
export function getContractABI(contractType: ContractType): any[] {
  if (contractType === 'ERC20') {
    return ${JSON.stringify(erc20Artifact.abi, null, 4)};
  } else if (contractType === 'ERC721') {
    return ${JSON.stringify(erc721Artifact.abi, null, 4)};
  }
  return [];
}

/**
 * Get contract bytecode based on type
 */
export function getContractBytecode(contractType: ContractType): string {
  if (contractType === 'ERC20') {
    return '${erc20Artifact.bytecode}';
  } else if (contractType === 'ERC721') {
    return '${erc721Artifact.bytecode}';
  }
  return '0x';
}
`;

fs.writeFileSync('./src/lib/deploy.ts', content, 'utf8');

console.log('✅ deploy.ts recreated successfully!');
console.log('Functions included:');
console.log('  - deployContract()');
console.log('  - getContractABI()');
console.log('  - getContractBytecode()');
console.log('\nABI sizes:');
console.log('  ERC20:', erc20Artifact.abi.length, 'items');
console.log('  ERC721:', erc721Artifact.abi.length, 'items');
