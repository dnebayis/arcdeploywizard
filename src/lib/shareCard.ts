import { toPng } from 'html-to-image';

/**
 * Generate a PNG image from a DOM element
 * @param elementId - ID of the element to convert
 * @returns Data URL of the generated PNG
 */
export async function generateShareCard(elementId: string): Promise<string> {
    const element = document.getElementById(elementId);

    if (!element) {
        throw new Error('Share card element not found');
    }

    try {
        // Generate high-quality PNG
        const dataUrl = await toPng(element, {
            cacheBust: true,
            pixelRatio: 2,  // 2x for high quality
            width: 1200,
            height: 1200,
            backgroundColor: '#0a0a0a',
        });

        return dataUrl;
    } catch (error) {
        console.error('Failed to generate share card:', error);
        throw error;
    }
}

/**
 * Download a data URL as a file
 * @param dataUrl - Data URL to download
 * @param filename - Name of the file to save
 */
export function downloadShareCard(dataUrl: string, filename: string) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
}

/**
 * Format contract address for display
 * @param address - Full contract address
 * @returns Shortened address (0x1234...5678)
 */
export function formatAddress(address: string): string {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
