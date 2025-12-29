/**
 * Local deployment record stored in browser
 */
export interface DeploymentRecord {
    // Core data
    txHash: string;
    contractAddress: string;
    timestamp: number;

    // Wizard context
    wizardType: string;
    contractName: string;

    // ERC20 specific
    tokenSymbol?: string;
    initialSupply?: string;

    // ERC721 specific
    nftImageUrl?: string;

    // Metadata
    deployedBy: string;  // Wallet address
    network: string;     // "Arc Testnet"
}

const HISTORY_KEY = 'arc-wizard-deploy-history';

/**
 * Save a deployment to local storage
 */
export function saveDeployment(record: DeploymentRecord): void {
    try {
        const history = getLocalHistory();
        history.unshift(record); // Add to beginning (most recent first)
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
        console.error('Failed to save deployment history:', error);
    }
}

/**
 * Get all local deployment records
 */
export function getLocalHistory(): DeploymentRecord[] {
    try {
        const data = localStorage.getItem(HISTORY_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Failed to load deployment history:', error);
        return [];
    }
}

/**
 * Get local history for a specific wallet address
 */
export function getHistoryForAddress(address: string): DeploymentRecord[] {
    const allHistory = getLocalHistory();
    return allHistory.filter(record =>
        record.deployedBy.toLowerCase() === address.toLowerCase()
    );
}

/**
 * Clear all deployment history
 */
export function clearHistory(): void {
    localStorage.removeItem(HISTORY_KEY);
}

/**
 * Find a specific deployment by contract address
 */
export function findDeployment(contractAddress: string): DeploymentRecord | undefined {
    const history = getLocalHistory();
    return history.find(record =>
        record.contractAddress.toLowerCase() === contractAddress.toLowerCase()
    );
}
