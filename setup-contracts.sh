#!/bin/bash

echo "🔧 Arc Deploy Wizard - Contract Setup Script"
echo "=============================================="
echo ""

# Check if Hardhat is installed
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js first."
    exit 1
fi

echo "📦 Installing Hardhat and dependencies..."
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts

echo ""
echo "🚀 Initializing Hardhat..."
npx hardhat init --yes || true

echo ""
echo "📁 Setting up contract directories..."
mkdir -p hardhat/contracts
cp contracts/ERC20Template.sol hardhat/contracts/
cp contracts/ERC721Template.sol hardhat/contracts/

echo ""
echo "🔨 Compiling contracts..."
cd hardhat
npx hardhat compile

echo ""
echo "✅ Compilation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Extract bytecode from hardhat/artifacts/contracts/"
echo "2. Update src/lib/deploy.ts with the bytecode"
echo "3. Get WalletConnect Project ID from https://cloud.walletconnect.com"
echo "4. Update src/lib/wagmi.ts with your Project ID"
echo ""
echo "🚀 Then run: npm run dev"
