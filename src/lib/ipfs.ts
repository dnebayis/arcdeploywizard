/**
 * IPFS URI normalization utilities
 * Ensures consistent resolution of IPFS URIs to HTTP gateways
 */

const DEFAULT_GATEWAY = 'https://ipfs.io/ipfs/';

/**
 * Normalizes an IPFS URI to an HTTP gateway URL
 * @param uri - The URI to normalize (can be ipfs://, http://, or gateway URL)
 * @returns Normalized HTTP URL
 */
export function normalizeIpfsUri(uri: string): string {
    if (!uri) return '';

    // Already an HTTP URL
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
        return uri;
    }

    // IPFS protocol
    if (uri.startsWith('ipfs://')) {
        const hash = uri.replace('ipfs://', '');
        return `${DEFAULT_GATEWAY}${hash}`;
    }

    // Just a hash
    if (uri.startsWith('Qm') || uri.startsWith('bafy')) {
        return `${DEFAULT_GATEWAY}${uri}`;
    }

    // Return as-is if we can't determine the format
    return uri;
}

/**
 * Fetches and parses JSON metadata from a URI
 * Handles IPFS normalization automatically
 * @param uri - Metadata URI (IPFS or HTTP)
 * @returns Parsed metadata object or null if failed
 */
export async function fetchMetadata(uri: string): Promise<any | null> {
    try {
        const normalizedUri = normalizeIpfsUri(uri);
        console.log('Fetching metadata from:', normalizedUri);

        const response = await fetch(normalizedUri);

        if (!response.ok) {
            console.warn(`Metadata fetch failed with status: ${response.status}`);
            return null;
        }

        const metadata = await response.json();
        console.log('Successfully fetched metadata:', metadata);

        return metadata;
    } catch (error) {
        console.error('Failed to fetch metadata:', error);
        return null;
    }
}

/**
 * Extracts the image URL from metadata
 * Normalizes IPFS URIs to HTTP
 * @param metadata - Parsed metadata object
 * @returns Image URL or null
 */
export function extractImageFromMetadata(metadata: any): string | null {
    if (!metadata) return null;

    // Try standard 'image' field
    if (metadata.image) {
        return normalizeIpfsUri(metadata.image);
    }

    // Try 'image_url' as fallback
    if (metadata.image_url) {
        return normalizeIpfsUri(metadata.image_url);
    }

    // Try 'animation_url' as last resort (for animated NFTs)
    if (metadata.animation_url && metadata.animation_url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        return normalizeIpfsUri(metadata.animation_url);
    }

    return null;
}
