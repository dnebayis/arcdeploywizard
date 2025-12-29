/**
 * Tweet content structure
 */
export interface TweetContent {
    type: 'ERC20' | 'ERC721';
    title: string;       // Name
    symbol?: string;     // Symbol (for ERC20)
    address: string;     // Contract address
    network: string;     // "Arc Testnet"
    url?: string;        // Explorer link
}

/**
 * Generate tweet text from deployment data
 */
export function generateTweetText(content: TweetContent): string {
    const shortAddress = `${content.address.slice(0, 6)}...${content.address.slice(-4)}`;

    // Define Action Label
    const actionLabel = content.type === 'ERC20'
        ? 'ERC20 Token Deployed'
        : 'ERC721 NFT Deployed';

    // Define Primary Line
    const primaryLine = content.type === 'ERC20'
        ? `🪙 ${content.title} (${content.symbol || ''})`
        : `🖼️ ${content.title}`;

    const tweet = `🚀 ${actionLabel} on ${content.network}

${primaryLine}
📜 ${shortAddress}

Built with Arc Deploy Wizard`;

    return tweet;
}

/**
 * Open Twitter share dialog using Web Intent
 * No API key required - uses native Twitter sharing
 */
export function shareOnTwitter(text: string, url?: string) {
    const encodedText = encodeURIComponent(text);
    const encodedUrl = url ? encodeURIComponent(url) : '';

    const params = new URLSearchParams();
    params.append('text', text);
    if (url) {
        params.append('url', url);
    }

    const intentUrl = `https://twitter.com/intent/tweet?${params.toString()}`;

    // Open in popup window
    const width = 550;
    const height = 420;
    const left = window.innerWidth / 2 - width / 2;
    const top = window.innerHeight / 2 - height / 2;

    window.open(
        intentUrl,
        'twitter-share',
        `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no`
    );
}
