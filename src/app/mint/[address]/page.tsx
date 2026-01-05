import { Metadata } from 'next';
import { PublicMintPage } from '@/components/PublicMint/PublicMintPage';
import { createPublicClient, http } from 'viem';
import { arcTestnet } from '@/lib/arcConfig';
import { CONFIGURABLEERC721_ABI } from '@/lib/abis/ConfigurableERC721';
import { CONFIGURABLEERC1155_ABI } from '@/lib/abis/ConfigurableERC1155';

const DEFAULT_CARD_IMAGE = 'https://emerald-spotty-boar-761.mypinata.cloud/ipfs/bafybeic5wusdlmndycj6vbjigvle3qkdmbwbiqxtmn33m363dr6nd54q2i/arc-nft.png';

// Helper to normalize IPFS URIs
function normalizeIpfsUri(uri: string): string {
    if (!uri) return '';
    if (uri.startsWith('ipfs://')) {
        return uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    return uri;
}

// Helper to fetch metadata
async function fetchMetadataImage(metadataUri: string): Promise<string | null> {
    try {
        const normalizedUri = normalizeIpfsUri(metadataUri);
        const response = await fetch(normalizedUri, { next: { revalidate: 3600 } }); // Cache for 1 hour
        if (!response.ok) return null;

        const metadata = await response.json();
        if (metadata.image) {
            return normalizeIpfsUri(metadata.image);
        }
        return null;
    } catch {
        return null;
    }
}

interface PageProps {
    params: Promise<{ address: string }>;
    searchParams: Promise<{ metadata?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
    const { address } = await params;
    const { metadata: metadataUri } = await searchParams;

    // Default values
    let title = 'NFT Mint Page | Arc Deploy Wizard';
    let description = 'Mint NFTs deployed with Arc Deploy Wizard on Arc Testnet.';
    let image = DEFAULT_CARD_IMAGE;
    let contractName = 'NFT Collection';

    try {
        // Create public client
        const publicClient = createPublicClient({
            chain: arcTestnet,
            transport: http('https://rpc.testnet.arc.network')
        });

        // Try to detect contract type and get name
        let contractType: 'ERC721' | 'ERC1155' | 'unknown' = 'unknown';

        try {
            const name = await publicClient.readContract({
                address: address as `0x${string}`,
                abi: CONFIGURABLEERC721_ABI,
                functionName: 'name'
            }) as string;
            contractName = name;
            contractType = 'ERC721';
        } catch {
            try {
                const name = await publicClient.readContract({
                    address: address as `0x${string}`,
                    abi: CONFIGURABLEERC1155_ABI,
                    functionName: 'name'
                }) as string;
                contractName = name;
                contractType = 'ERC1155';
            } catch {
                // Could not determine type
            }
        }

        // Set title and description based on contract type
        if (contractType === 'ERC721') {
            title = `${contractName} | ERC721 NFT Mint`;
            description = `Mint ${contractName} NFTs on Arc Testnet. Built with Arc Deploy Wizard.`;
        } else if (contractType === 'ERC1155') {
            title = `${contractName} | ERC1155 Multi-Token Mint`;
            description = `Mint ${contractName} multi-tokens on Arc Testnet. Built with Arc Deploy Wizard.`;
        }

        // Try to get image from URL metadata parameter first
        if (metadataUri) {
            const metadataImage = await fetchMetadataImage(metadataUri);
            if (metadataImage) {
                image = metadataImage;
            }
        }
        // Fallback: Try to get image from contract metadata
        else if (contractType !== 'unknown') {
            try {
                let contractMetadataUri: string | undefined;

                if (contractType === 'ERC721') {
                    contractMetadataUri = await publicClient.readContract({
                        address: address as `0x${string}`,
                        abi: CONFIGURABLEERC721_ABI,
                        functionName: 'tokenURI',
                        args: [1n]
                    }) as string;
                } else if (contractType === 'ERC1155') {
                    contractMetadataUri = await publicClient.readContract({
                        address: address as `0x${string}`,
                        abi: CONFIGURABLEERC1155_ABI,
                        functionName: 'uri',
                        args: [1n]
                    }) as string;
                }

                if (contractMetadataUri) {
                    const contractImage = await fetchMetadataImage(contractMetadataUri);
                    if (contractImage) {
                        image = contractImage;
                    }
                }
            } catch {
                // Use default image
            }
        }
    } catch {
        // Use default values
    }

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: [image],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [image],
        },
    };
}

export default async function MintPage({ params }: { params: Promise<{ address: string }> }) {
    const { address } = await params;
    return <PublicMintPage contractAddress={address as `0x${string}`} />;
}
