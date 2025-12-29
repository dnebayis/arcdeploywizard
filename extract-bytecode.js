const fs = require('fs');
const path = require('path');

// Read compiled artifacts
const erc20Artifact = require('./artifacts/contracts/ERC20Template.sol/SimpleERC20.json');
const erc721Artifact = require('./artifacts/contracts/ERC721Template.sol/SimpleERC721.json');

// Extract bytecode
const erc20Bytecode = erc20Artifact.bytecode;
const erc721Bytecode = erc721Artifact.bytecode;

console.log('ERC20 Bytecode length:', erc20Bytecode.length);
console.log('ERC721 Bytecode length:', erc721Bytecode.length);

// Read current deploy.ts
const deployPath = path.join(__dirname, 'src', 'lib', 'deploy.ts');
let deployContent = fs.readFileSync(deployPath, 'utf8');

// Replace placeholder bytecode
const updatedContent = deployContent.replace(
    /export function getContractBytecode\(contractType: ContractType\): string \{[\s\S]*?return '0x'; \/\/ This will need to be replaced\n\}/,
    `export function getContractBytecode(contractType: ContractType): string {
  if (contractType === 'ERC20') {
    return '${erc20Bytecode}';
  } else if (contractType === 'ERC721') {
    return '${erc721Bytecode}';
  }
  return '0x';
}`
);

// Write updated file
fs.writeFileSync(deployPath, updatedContent, 'utf8');

console.log('\n✅ Bytecode successfully added to src/lib/deploy.ts!');
console.log('\nERC20 bytecode:', erc20Bytecode.substring(0, 66) + '...');
console.log('ERC721 bytecode:', erc721Bytecode.substring(0, 66) + '...');
