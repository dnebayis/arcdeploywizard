const fs = require('fs');
const path = require('path');

// Read the compiled contract artifact
const artifact = JSON.parse(
    fs.readFileSync(
        path.join(__dirname, '../artifacts/contracts/ConfigurableERC721.sol/ConfigurableERC721.json'),
        'utf8'
    )
);

// Generate the ABI and bytecode file
const output = `// Auto-generated from artifacts/contracts/ConfigurableERC721.sol/ConfigurableERC721.json
export const CONFIGURABLEERC721_ABI = ${JSON.stringify(artifact.abi, null, 2)} as const;

export const CONFIGURABLEERC721_BYTECODE = "${artifact.bytecode}";
`;

// Write to the target file
const outputPath = path.join(__dirname, '../src/lib/abis/ConfigurableERC721.ts');
fs.writeFileSync(outputPath, output);

console.log('✅ ConfigurableERC721 ABI and bytecode generated successfully!');
