require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        arcTestnet: {
            url: "https://rpc.testnet.arc.network",
            chainId: 5042002,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        },
    },
    etherscan: {
        apiKey: {
            arcTestnet: "empty" // Blockscout instances often don't need a key or accept any key
        },
        customChains: [
            {
                network: "arcTestnet",
                chainId: 5042002,
                urls: {
                    apiURL: "https://testnet.arcscan.app/api",
                    browserURL: "https://testnet.arcscan.app"
                }
            }
        ]
    },
    sourcify: {
        enabled: false
    }
};
