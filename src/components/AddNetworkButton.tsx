'use client';

import { useState, useEffect } from 'react';

export function AddNetworkButton() {
    const [hasProvider, setHasProvider] = useState(false);

    useEffect(() => {
        setHasProvider(typeof window !== 'undefined' && typeof window.ethereum !== 'undefined');
    }, []);

    const handleFixNetwork = async () => {
        if (!window.ethereum) {
            alert('No wallet provider found. Please install MetaMask or another Web3 wallet.');
            return;
        }

        try {
            // First, try to remove any existing Arc Network configuration
            console.log('Attempting to switch to Arc Network Testnet...');

            // Try switching first - if the network already exists
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0x4D6A22' }],
                });
                console.log('Switched to existing Arc Network Testnet');
                alert('Switched to Arc Network Testnet!');
                // Force page reload to update RainbowKit state
                window.location.reload();
                return;
            } catch (switchError: any) {
                // Network doesn't exist or switch failed - we'll add it
                console.log('Switch failed, will add network:', switchError.code);
            }

            // If switch failed, add the network with correct parameters
            console.log('Adding Arc Network Testnet with updated configuration...');
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: '0x4D6A22',
                    chainName: 'Arc Network Testnet',
                    nativeCurrency: {
                        name: 'USDC',
                        symbol: 'USDC',
                        decimals: 18,
                    },
                    rpcUrls: ['https://rpc.testnet.arc.network'],
                    blockExplorerUrls: ['https://testnet.arcscan.app'],
                }],
            });

            console.log('Network added successfully');
            alert('Arc Network Testnet configured! Refreshing page...');

            // Reload the page to ensure RainbowKit picks up the change
            setTimeout(() => window.location.reload(), 1000);

        } catch (error: any) {
            if (error.code === 4001) {
                console.log('User rejected');
            } else {
                console.error('Error:', error);
                alert(`Error: ${error.message || 'Failed to configure network'}`);
            }
        }
    };

    return (
        <button
            onClick={handleFixNetwork}
            className="btn btn-secondary"
            style={{ fontSize: '13px' }}
            disabled={!hasProvider}
        >
            Fix Arc Network
        </button>
    );
}
