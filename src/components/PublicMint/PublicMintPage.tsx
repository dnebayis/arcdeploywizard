'use client';

import { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { WalletConnect } from '@/components/WalletConnect';
import { ArcLogo } from '@/components/ArcLogo';
import { CONFIGURABLEERC721_ABI } from '@/lib/abis/ConfigurableERC721';
import { CONFIGURABLEERC1155_ABI } from '@/lib/abis/ConfigurableERC1155';
import styles from './PublicMintPage.module.css';

interface PublicMintPageProps {
    contractAddress: `0x${string}`;
}

interface ContractInfo {
    name: string;
    symbol?: string;
    totalSupply?: string;
    maxSupply?: string;
    paused: boolean;
    mintAccessMode: number;
    walletMintLimit?: number;
    walletMinted?: number;
    contractType: 'ERC721' | 'ERC1155';
    metadataUri?: string;
    metadataImage?: string;
}

export function PublicMintPage({ contractAddress }: PublicMintPageProps) {
    const { address, isConnected } = useAccount();
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();

    const [info, setInfo] = useState<ContractInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [minting, setMinting] = useState(false);
    const [mintError, setMintError] = useState('');
    const [mintSuccess, setMintSuccess] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [tokenId, setTokenId] = useState('1');

    // SINGLE SOURCE OF TRUTH for preview image
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [previewLoading, setPreviewLoading] = useState(true);

    // Get metadata URI from URL parameter (RPC-free!) - MUST DECODE
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const metadataFromUrl = searchParams?.get('metadata') ? decodeURIComponent(searchParams.get('metadata')!) : null;

    // Fetch and set preview image independently of contract info
    useEffect(() => {
        const loadPreview = async () => {
            setPreviewLoading(true);

            // PRIORITY 1: URL metadata (RPC-FREE)
            if (metadataFromUrl) {
                console.log('✅ Loading preview from URL metadata (RPC-free):', metadataFromUrl);

                try {
                    const { fetchMetadata, extractImageFromMetadata } = await import('@/lib/ipfs');
                    const metadata = await fetchMetadata(metadataFromUrl);

                    if (metadata) {
                        const imageUrl = extractImageFromMetadata(metadata);
                        if (imageUrl) {
                            console.log('✅ Preview image loaded:', imageUrl);
                            setPreviewImage(imageUrl);
                            setPreviewLoading(false);
                            return; // SUCCESS - stop here
                        }
                    }
                    console.warn('⚠️ URL metadata found but no image field');
                } catch (e) {
                    console.warn('⚠️ Failed to load preview from URL metadata:', e);
                }
            }

            // If URL metadata failed or doesn't exist, we'll try RPC fallback in main useEffect
            // Don't set preview image yet - let the contract info fetch handle it
            setPreviewLoading(false);
        };

        loadPreview();
    }, [metadataFromUrl]);

    useEffect(() => {
        if (!publicClient) return;

        const fetchContractInfo = async () => {
            try {
                setLoading(true);
                setError(null);

                // First check if contract exists at this address
                const bytecode = await publicClient.getBytecode({ address: contractAddress });
                if (!bytecode || bytecode === '0x') {
                    setError('No contract found at this address. Please verify the contract address.');
                    setLoading(false);
                    return;
                }


                // Detect contract type by trying to read from each ABI
                let contractType: 'ERC721' | 'ERC1155' = 'ERC721';
                let abi: any = CONFIGURABLEERC721_ABI;

                // Try ERC721 first by checking for a unique ERC721 function
                try {
                    await publicClient.readContract({
                        address: contractAddress,
                        abi: CONFIGURABLEERC721_ABI as any,
                        functionName: 'tokenURI',
                        args: [1n]
                    });
                    // If we get here, it's likely ERC721
                    contractType = 'ERC721';
                    abi = CONFIGURABLEERC721_ABI;
                } catch {
                    // If that fails, try ERC1155
                    try {
                        await publicClient.readContract({
                            address: contractAddress,
                            abi: CONFIGURABLEERC1155_ABI as any,
                            functionName: 'uri',
                            args: [1n]
                        });
                        contractType = 'ERC1155';
                        abi = CONFIGURABLEERC1155_ABI;
                    } catch {
                        // Try one more check with supportsInterface
                        try {
                            const supports721 = await publicClient.readContract({
                                address: contractAddress,
                                abi: CONFIGURABLEERC721_ABI as any,
                                functionName: 'supportsInterface',
                                args: ['0x80ac58cd'] // ERC721 interface ID
                            }) as boolean;

                            if (supports721) {
                                contractType = 'ERC721';
                                abi = CONFIGURABLEERC721_ABI;
                            } else {
                                contractType = 'ERC1155';
                                abi = CONFIGURABLEERC1155_ABI;
                            }
                        } catch (e) {
                            // Default to ERC721
                            contractType = 'ERC721';
                            abi = CONFIGURABLEERC721_ABI;
                        }
                    }
                }


                const [name, paused, mintAccessMode] = await Promise.all([
                    publicClient.readContract({
                        address: contractAddress,
                        abi,
                        functionName: 'name'
                    }) as Promise<string>,
                    publicClient.readContract({
                        address: contractAddress,
                        abi,
                        functionName: 'paused'
                    }) as Promise<boolean>,
                    publicClient.readContract({
                        address: contractAddress,
                        abi,
                        functionName: 'mintAccessMode'
                    }) as Promise<number>
                ]);

                // 0 = OnlyOwner, 1 = Public, 2 = PublicWithWalletLimit
                if (mintAccessMode === 0) {
                    setError('This collection does not allow public minting.');
                    setLoading(false);
                    return;
                }

                let symbol: string | undefined;
                let totalSupply: string | undefined;
                let maxSupply: string | undefined;
                let walletMintLimit: number | undefined;
                let walletMinted: number | undefined;
                let metadataUri: string | undefined;

                if (contractType === 'ERC721') {
                    try {
                        symbol = await publicClient.readContract({
                            address: contractAddress,
                            abi: CONFIGURABLEERC721_ABI,
                            functionName: 'symbol'
                        }) as string;
                    } catch (e) {
                        // Symbol might not exist
                    }

                    try {
                        const supply = await publicClient.readContract({
                            address: contractAddress,
                            abi: CONFIGURABLEERC721_ABI,
                            functionName: 'totalSupply'
                        }) as bigint;
                        totalSupply = supply.toString();
                    } catch (e) {
                        // totalSupply might not exist
                    }

                    try {
                        const max = await publicClient.readContract({
                            address: contractAddress,
                            abi: CONFIGURABLEERC721_ABI,
                            functionName: 'maxSupply'
                        }) as bigint;
                        if (max > 0n) {
                            maxSupply = max.toString();
                        }
                    } catch (e) {
                    }

                    // PRIORITY 1: Use metadata URI from URL (RPC-FREE!)
                    // This prevents RPC rate limiting from breaking previews
                    if (metadataFromUrl) {
                        metadataUri = metadataFromUrl;
                        console.log('✅ Using metadata URI from URL (RPC-free):', metadataUri);
                    }
                    // PRIORITY 2: Fallback to RPC only if URL param not provided
                    // Wrapped in try-catch to gracefully handle rate limiting
                    else {
                        console.log('⚠️ No metadata in URL, attempting RPC fallback (may hit rate limits)');

                        if (contractType === 'ERC721') {
                            try {
                                metadataUri = await publicClient.readContract({
                                    address: contractAddress,
                                    abi: CONFIGURABLEERC721_ABI,
                                    functionName: 'tokenURI',
                                    args: [1n]
                                }) as string;
                                console.log('📝 Fetched ERC721 tokenURI via RPC:', metadataUri);
                            } catch (e: any) {
                                // RPC failure is expected and graceful - don't break UI
                                if (e.message?.includes('429') || e.message?.includes('rate')) {
                                    console.warn('RPC rate limited (429) - preview will use fallback image');
                                } else {
                                    console.warn('Could not fetch tokenURI (this is normal if baseURI not set)');
                                }
                            }
                        } else if (contractType === 'ERC1155') {
                            try {
                                metadataUri = await publicClient.readContract({
                                    address: contractAddress,
                                    abi: CONFIGURABLEERC1155_ABI as any,
                                    functionName: 'uri',
                                    args: [1n]
                                }) as string;
                                console.log('📝 Fetched ERC1155 URI via RPC:', metadataUri);
                            } catch (e: any) {
                                // RPC failure is expected and graceful
                                if (e.message?.includes('429') || e.message?.includes('rate')) {
                                    console.warn('RPC rate limited (429) - preview will use fallback image');
                                } else {
                                    console.warn('Could not fetch URI for ERC1155');
                                }
                            }
                        }
                    }
                        
                        // PRIORITY 2.5: If we got metadata URI from contract, fetch and set preview
                        if (metadataUri && !previewImage) {
                            console.log('🔄 Falling back to contract metadata for preview');
                            try {
                                const { fetchMetadata, extractImageFromMetadata } = await import('@/lib/ipfs');
                                const metadata = await fetchMetadata(metadataUri);
                                
                                if (metadata) {
                                    const imageUrl = extractImageFromMetadata(metadata);
                                    if (imageUrl) {
                                        console.log('✅ Contract metadata preview loaded:', imageUrl);
                                        setPreviewImage(imageUrl);
                                    } else {
                                        console.warn('⚠️ Contract metadata exists but no image field');
                                    }
                                } else {
                                    console.warn('⚠️ Could not parse contract metadata');
                                }
                            } catch (e) {
                                console.warn('⚠️ Failed to fetch contract metadata for preview:', e);
                            }
                        }



                    if (mintAccessMode === 2 && address) {
                        try {
                            const limit = await publicClient.readContract({
                                address: contractAddress,
                                abi: CONFIGURABLEERC721_ABI,
                                functionName: 'walletMintLimit'
                            }) as bigint;
                            walletMintLimit = Number(limit);

                            const minted = await publicClient.readContract({
                                address: contractAddress,
                                abi: CONFIGURABLEERC721_ABI,
                                functionName: 'walletMints',
                                args: [address]
                            }) as bigint;
                            walletMinted = Number(minted);
                        } catch (e) {
                            console.warn('Could not fetch wallet mint limits:', e);
                        }
                    }
                }

                // Fetch and parse metadata to extract image
                let metadataImage: string | undefined;

                if (metadataUri) {
                    const { fetchMetadata, extractImageFromMetadata } = await import('@/lib/ipfs');

                    const metadata = await fetchMetadata(metadataUri);

                    if (metadata) {
                        const imageUrl = extractImageFromMetadata(metadata);
                        if (imageUrl) {
                            metadataImage = imageUrl;
                            console.log('✅ Successfully loaded NFT image:', imageUrl);
                        } else {
                            console.warn('⚠️ Metadata found but no image field');
                        }
                    } else {
                        console.warn('⚠️ Failed to fetch metadata from URI');
                    }
                }

                // Fallback to Arc's default NFT image if no metadata image found
                if (!metadataImage) {
                    console.log('📦 Using Arc fallback image');
                    metadataImage = 'https://emerald-spotty-boar-761.mypinata.cloud/ipfs/bafybeic5wusdlmndycj6vbjigvle3qkdmbwbiqxtmn33m363dr6nd54q2i/arc-nft.png';
                }



                setInfo({
                    name,
                    symbol,
                    totalSupply,
                    maxSupply,
                    paused,
                    mintAccessMode,
                    walletMintLimit,
                    walletMinted,
                    contractType,
                    metadataUri,
                    metadataImage
                });
            } catch (e: any) {
                console.error('Failed to fetch contract info:', e);
                setError('Failed to load collection information. Please check the contract address.');
            } finally {
                setLoading(false);
            }
        };

        fetchContractInfo();
    }, [publicClient, contractAddress, address]);

    const handleMint = async () => {
        if (!walletClient || !address || !info) return;

        try {
            setMinting(true);
            setMintError('');
            setMintSuccess('');

            const abi = info.contractType === 'ERC721' ? CONFIGURABLEERC721_ABI : CONFIGURABLEERC1155_ABI;

            let hash: `0x${string}`;

            if (info.contractType === 'ERC721') {
                // ERC721 mint() has no args - mints to msg.sender
                hash = await walletClient.writeContract({
                    address: contractAddress,
                    abi: abi as any,
                    functionName: 'mint',
                    args: [],
                    account: address
                });
            } else {
                // ERC1155 requires token ID and quantity
                const id = BigInt(tokenId);
                const qty = BigInt(quantity);
                hash = await walletClient.writeContract({
                    address: contractAddress,
                    abi: abi as any,
                    functionName: 'mint',
                    args: [address, id, qty, '0x'],
                    account: address
                });
            }

            setMintSuccess(`Mint successful! Transaction: ${hash.slice(0, 10)}...`);

            // Refresh info after successful mint
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (e: any) {
            console.error('Mint failed:', e);
            setMintError(e.message || 'Minting failed. Please try again.');
        } finally {
            setMinting(false);
        }
    };

    const canMint = () => {
        if (!info || !isConnected) return false;
        if (info.paused) return false;
        if (info.maxSupply && info.totalSupply && Number(info.totalSupply) >= Number(info.maxSupply)) return false;
        if (info.walletMintLimit && info.walletMinted && info.walletMinted >= info.walletMintLimit) return false;
        return true;
    };

    const getMintButtonText = () => {
        if (minting) return 'Minting...';
        if (!isConnected) return 'Connect Wallet to Mint';
        if (info?.paused) return 'Minting Paused';
        if (info?.maxSupply && info?.totalSupply && Number(info.totalSupply) >= Number(info.maxSupply)) {
            return 'Sold Out';
        }
        if (info?.walletMintLimit && info?.walletMinted && info.walletMinted >= info.walletMintLimit) {
            return `Limit Reached (${info.walletMintLimit} max)`;
        }
        return `Mint ${info?.contractType === 'ERC721' ? 'NFT' : `${quantity} Token(s)`}`;
    };

    const shareOnTwitter = () => {
        const cleanUrl = `${window.location.origin}/mint/${contractAddress}`;
        const text = `Mint is live 🚀\n${info?.name || 'NFT Collection'}\nPublic mint now open on Arc Testnet\n\nMint here 👇\n${cleanUrl}\n\nBuilt with Arc Deploy Wizard`;

        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading collection...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>error</span>
                    <h2>Unable to Load Collection</h2>
                    <p>{error}</p>
                    <a href="/" className="btn btn-primary" style={{ marginTop: '20px' }}>
                        Return to Deploy Wizard
                    </a>
                </div>
            </div>
        );
    }

    if (!info) return null;

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <a href="/" className={styles.logo}>
                        <ArcLogo />
                        <span>Arc Deploy Wizard</span>
                    </a>
                    <WalletConnect />
                </div>
            </header>

            {/* Main Content */}
            <main className={styles.main}>
                <div className={styles.content}>
                    {/* Left: NFT Preview */}
                    <div className={styles.previewSection}>
                        <div className={styles.imageContainer}>
                            {previewLoading ? (
                                <div className={styles.placeholderImage}>
                                    <div className={styles.spinner}></div>
                                </div>
                            ) : previewImage ? (
                                <img
                                    src={previewImage}
                                    alt={info?.name || 'NFT Preview'}
                                    className={styles.nftImage}
                                    onError={(e) => {
                                        // Final fallback if image fails to load
                                        const target = e.target as HTMLImageElement;
                                        const fallback = 'https://emerald-spotty-boar-761.mypinata.cloud/ipfs/bafybeic5wusdlmndycj6vbjigvle3qkdmbwbiqxtmn33m363dr6nd54q2i/arc-nft.png';
                                        if (target.src !== fallback) {
                                            console.warn('⚠️ Image failed to load, using Arc fallback');
                                            target.src = fallback;
                                        }
                                    }}
                                />
                            ) : (
                                <img
                                    src="https://emerald-spotty-boar-761.mypinata.cloud/ipfs/bafybeic5wusdlmndycj6vbjigvle3qkdmbwbiqxtmn33m363dr6nd54q2i/arc-nft.png"
                                    alt="Arc NFT"
                                    className={styles.nftImage}
                                />
                            )}
                        </div>

                        {/* Share Button */}
                        <button onClick={shareOnTwitter} className={styles.shareButton}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                            Share on X
                        </button>
                    </div>

                    {/* Right: Mint Panel */}
                    <div className={styles.mintSection}>
                        {/* Collection Info */}
                        <div className={styles.collectionInfo}>
                            <div className={styles.networkBadge}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>link</span>
                                Arc Testnet
                            </div>
                            <h1 className={styles.collectionName}>{info.name}</h1>
                            {info.symbol && (
                                <p className={styles.collectionSymbol}>{info.symbol}</p>
                            )}
                        </div>

                        {/* Stats */}
                        <div className={styles.stats}>
                            {info.totalSupply && (
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Minted</span>
                                    <span className={styles.statValue}>
                                        {info.totalSupply}{info.maxSupply ? ` / ${info.maxSupply}` : ''}
                                    </span>
                                </div>
                            )}
                            {info.mintAccessMode === 2 && info.walletMintLimit && (
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Your Mints</span>
                                    <span className={styles.statValue}>
                                        {info.walletMinted || 0} / {info.walletMintLimit}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* ERC1155 Inputs */}
                        {info.contractType === 'ERC1155' && isConnected && canMint() && (
                            <div className={styles.inputGroup}>
                                <label>Token ID</label>
                                <input
                                    type="number"
                                    value={tokenId}
                                    onChange={e => setTokenId(e.target.value)}
                                    min="1"
                                    className={styles.input}
                                />
                                <label style={{ marginTop: '16px' }}>Quantity</label>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={e => setQuantity(Number(e.target.value))}
                                    min="1"
                                    max="10"
                                    className={styles.input}
                                />
                            </div>
                        )}

                        {/* Messages */}
                        {mintError && (
                            <div className={styles.errorMessage}>
                                <span className="material-symbols-outlined">error</span>
                                {mintError}
                            </div>
                        )}
                        {mintSuccess && (
                            <div className={styles.successMessage}>
                                <span className="material-symbols-outlined">check_circle</span>
                                {mintSuccess}
                            </div>
                        )}

                        {/* Mint Button */}
                        <button
                            onClick={isConnected ? handleMint : undefined}
                            disabled={!canMint() || minting}
                            className={styles.mintButton}
                        >
                            {getMintButtonText()}
                        </button>

                        {/* Info Section */}
                        <div className={styles.infoSection}>
                            <div className={styles.infoItem}>
                                <span className="material-symbols-outlined">info</span>
                                <div>
                                    <strong>Mint Rules</strong>
                                    <p>
                                        {info.mintAccessMode === 1 ? 'Open to everyone' : `${info.walletMintLimit} per wallet`}
                                        {info.maxSupply ? `. Limited to ${info.maxSupply} total` : '. Unlimited supply'}
                                    </p>
                                </div>
                            </div>
                            <div className={styles.infoItem}>
                                <span className="material-symbols-outlined">contract</span>
                                <div>
                                    <strong>Contract</strong>
                                    <p>
                                        <a
                                            href={`https://testnet.arcscan.app/address/${contractAddress}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.addressLink}
                                        >
                                            {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
                                        </a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className={styles.footer}>
                <p>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', verticalAlign: 'middle' }}>auto_awesome</span>
                    {' '}Deployed with <a href="/" className={styles.footerLink}>Arc Deploy Wizard</a>
                </p>
            </footer>
        </div>
    );
}
