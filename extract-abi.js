const fs = require('fs');
const path = require('path');

// Read compiled artifacts
const erc20Artifact = require('./artifacts/contracts/ERC20Template.sol/SimpleERC20.json');
const erc721Artifact = require('./artifacts/contracts/ERC721Template.sol/SimpleERC721.json');

// Extract ABIs
const erc20ABI = JSON.stringify(erc20Artifact.abi, null, 2);
const erc721ABI = JSON.stringify(erc721Artifact.abi, null, 2);

console.log('ERC20 ABI items:', erc20Artifact.abi.length);
console.log('ERC721 ABI items:', erc721Artifact.abi.length);

// Read current deploy.ts
const deployPath = path.join(__dirname, 'src', 'lib', 'deploy.ts');
let deployContent = fs.readFileSync(deployPath, 'utf8');

// Create new ABI section
const newABIFunction = `/**
 * Get contract ABI based on type
 */
export function getContractABI(contractType: ContractType): any[] {
  if (contractType === 'ERC20') {
    return ${erc20ABI};
  } else if (contractType === 'ERC721') {
    return ${erc721ABI};
  }
  return [];
}`;

// Replace the getContractABI function
const updatedContent = deployContent.replace(
    /\/\*\*[\s\S]*?Get contract ABI based on type[\s\S]*?\*\/[\s\S]*?export function getContractABI\(contractType: ContractType\): any\[\] \{[\s\S]*?\n\}/,
    newABIFunction
);

// Write updated file
fs.writeFileSync(deployPath, updatedContent, 'utf8');

console.log('\n✅ ABIs successfully updated in src/lib/deploy.ts!');
console.log('\nERC20 ABI items:', erc20Artifact.abi.length);
console.log('ERC721 ABI items:', erc721Artifact.abi.length);
