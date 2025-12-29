export interface ScanDeployment {
    hash: string;
    contractAddress: string;
    timeStamp: string;  // Unix timestamp as string
    from: string;
    to: string;  // null or empty for contract creation
}

export interface ArcTransaction {
    hash: string;
    from: string;
    to: string;
    input: string;
    timeStamp: string;
    isError: string;
    contractAddress: string;
    methodId?: string;
    functionName?: string;
}

export interface ArcTokenTransfer {
    hash: string;
    from: string;
    to: string;
    contractAddress: string; // Token Address
    tokenName: string;
    tokenSymbol: string;
    tokenDecimal: string;
    value: string;
    timeStamp: string;
}

const ARC_API_BASE = 'https://testnet.arcscan.app/api';

/**
 * Fetch contract deployments from Arc Scan API
 */
export async function fetchDeployments(address: string): Promise<ScanDeployment[]> {
    if (!address) return [];

    try {
        const response = await fetch(
            `${ARC_API_BASE}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc`
        );
        const data = await response.json();

        if (data.status !== '1' || !Array.isArray(data.result)) {
            if (data.message === 'No transactions found') return [];
            console.warn('Arc Scan API returned unexpected status:', data);
            return [];
        }

        return data.result.filter((tx: any) => {
            const isContractCreation = (!tx.to || tx.to === '') && tx.contractAddress;
            const isSuccess = tx.isError === '0';
            return isContractCreation && isSuccess;
        });
    } catch (error) {
        console.error('Failed to fetch deployments from Arc Scan:', error);
        return [];
    }
}

/**
 * Fetch generic transactions to find interactions (approvals)
 */
export async function fetchTransactions(address: string): Promise<ArcTransaction[]> {
    if (!address) return [];

    try {
        const response = await fetch(
            `${ARC_API_BASE}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc`
        );
        const data = await response.json();

        if (data.status !== '1' || !Array.isArray(data.result)) return [];
        return data.result;
    } catch (error) {
        console.error('Failed to fetch transactions:', error);
        return [];
    }
}

/**
 * Fetch ERC20 Token Transfers to identify tokens the user holds/held
 */
export async function fetchTokenTransfers(address: string): Promise<ArcTokenTransfer[]> {
    if (!address) return [];

    try {
        const response = await fetch(
            `${ARC_API_BASE}?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&sort=desc`
        );
        const data = await response.json();

        if (data.status !== '1' || !Array.isArray(data.result)) return [];
        return data.result;
    } catch (error) {
        console.error('Failed to fetch token transfers:', error);
        return [];
    }
}

/**
 * Fetch ERC721 Token Transfers
 */
export async function fetchNFTTransfers(address: string): Promise<ArcTokenTransfer[]> {
    if (!address) return [];

    try {
        const response = await fetch(
            `${ARC_API_BASE}?module=account&action=tokennfttx&address=${address}&startblock=0&endblock=99999999&sort=desc`
        );
        const data = await response.json();

        if (data.status !== '1' || !Array.isArray(data.result)) return [];
        return data.result;
    } catch (error) {
        console.error('Failed to fetch NFT transfers:', error);
        return [];
    }
}
