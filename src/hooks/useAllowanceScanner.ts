import { useState, useCallback } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import { fetchTokenTransfers, fetchNFTTransfers, fetchTransactions, ArcTransaction } from '../lib/arcScan';
import { getAddress, formatUnits, parseAbiItem, parseAbi } from 'viem';

export type TokenType = 'ERC20' | 'ERC721';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Token {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    type: TokenType;
}

export interface SpenderInfo {
    address: string;
    name?: string;
    type?: 'DEX' | 'Bridge' | 'Marketplace' | 'Unknown';
}

export interface AllowanceEntry {
    id: string;
    token: Token;
    spender: SpenderInfo;
    allowance: bigint;      // ERC20 value or ERC721 boolean (1n/0n)
    balance: bigint;
    normalizedAllowance: string;
    riskLevel: RiskLevel;
    reason: string;
}

const KNOWN_SPENDERS: Record<string, SpenderInfo> = {
    "0x0000000000000000000000000000000000000000": { address: "0x00...0000", name: "Null Address", type: "Unknown" },
    // Add known testnet addresses here
};

export function useAllowanceScanner(userAddress: string | undefined) {
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();

    const [results, setResults] = useState<AllowanceEntry[] | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [revokingId, setRevokingId] = useState<string | null>(null);

    // 1. Discovery Hook Logic (Inline for orchestration)
    const scan = useCallback(async () => {
        if (!userAddress || !publicClient) return;

        setIsScanning(true);
        setScanError(null);
        setResults(null);

        try {
            // A. Discovery
            const [erc20Txs, erc721Txs, transactions] = await Promise.all([
                fetchTokenTransfers(userAddress),
                fetchNFTTransfers(userAddress),
                fetchTransactions(userAddress)
            ]);

            const tokens = new Map<string, Token>();

            // Process ERC20
            erc20Txs.forEach(tx => {
                const addr = getAddress(tx.contractAddress);
                if (!tokens.has(addr)) {
                    tokens.set(addr, {
                        address: addr,
                        name: tx.tokenName,
                        symbol: tx.tokenSymbol,
                        decimals: parseInt(tx.tokenDecimal),
                        type: 'ERC20'
                    });
                }
            });

            // Process ERC721
            erc721Txs.forEach(tx => {
                const addr = getAddress(tx.contractAddress);
                if (!tokens.has(addr)) {
                    tokens.set(addr, {
                        address: addr,
                        name: tx.tokenName,
                        symbol: tx.tokenSymbol,
                        decimals: 0,
                        type: 'ERC721'
                    });
                }
            });

            // B. Identify Spenders (Heuristic from History)
            const tokenSpenders = new Map<string, Set<string>>();
            const APPROVE_METHOD = '0x095ea7b3'; // ERC20 approve
            const SET_APPROVAL_ALL = '0xa22cb465'; // ERC721 setApprovalForAll

            transactions.forEach(tx => {
                if (!tx.to || tx.isError === '1' || !tx.input) return;
                const toAddr = getAddress(tx.to); // Token Contract

                if (tokens.has(toAddr)) {
                    if (tx.input.startsWith(APPROVE_METHOD)) {
                        // ERC20 Approve: spender is param 1
                        if (tx.input.length >= 74) {
                            try {
                                const spender = getAddress('0x' + tx.input.substring(34, 74));
                                if (!tokenSpenders.has(toAddr)) tokenSpenders.set(toAddr, new Set());
                                tokenSpenders.get(toAddr)?.add(spender);
                            } catch { }
                        }
                    } else if (tx.input.startsWith(SET_APPROVAL_ALL)) {
                        // ERC721 setApprovalForAll: operator is param 1
                        if (tx.input.length >= 74) {
                            try {
                                const spender = getAddress('0x' + tx.input.substring(34, 74));
                                if (!tokenSpenders.has(toAddr)) tokenSpenders.set(toAddr, new Set());
                                tokenSpenders.get(toAddr)?.add(spender);
                            } catch { }
                        }
                    }
                }
            });

            // C. On-Chain Verification
            const entries: AllowanceEntry[] = [];
            const erc20Abi = [
                parseAbiItem('function allowance(address, address) view returns (uint256)'),
                parseAbiItem('function balanceOf(address) view returns (uint256)'),
            ];
            const erc721Abi = [
                parseAbiItem('function isApprovedForAll(address, address) view returns (bool)'),
            ];

            for (const token of tokens.values()) {
                const spenders = tokenSpenders.get(token.address);
                if (!spenders) continue;

                if (token.type === 'ERC20') {
                    // ERC20 Logic
                    let balance = 0n;
                    try {
                        balance = await publicClient.readContract({
                            address: token.address as `0x${string}`,
                            abi: erc20Abi,
                            functionName: 'balanceOf',
                            args: [userAddress as `0x${string}`]
                        }) as bigint;
                    } catch (e) { console.warn(`Failed balance ${token.symbol}`); }

                    for (const spender of spenders) {
                        try {
                            const allowance = await publicClient.readContract({
                                address: token.address as `0x${string}`,
                                abi: erc20Abi,
                                functionName: 'allowance',
                                args: [userAddress as `0x${string}`, spender as `0x${string}`]
                            }) as bigint;

                            if (allowance > 0n) {
                                entries.push(calculateRiskEntry(token, spender, allowance, balance));
                            }
                        } catch { }
                    }
                } else {
                    // ERC721 Logic
                    for (const spender of spenders) {
                        try {
                            const isApproved = await publicClient.readContract({
                                address: token.address as `0x${string}`,
                                abi: erc721Abi,
                                functionName: 'isApprovedForAll',
                                args: [userAddress as `0x${string}`, spender as `0x${string}`]
                            }) as boolean;

                            if (isApproved) {
                                entries.push(calculateRiskEntry(token, spender, 1n, 0n));
                            }
                        } catch { }
                    }
                }
            }

            // D. Sort
            entries.sort((a, b) => {
                const score = (r: RiskLevel) => r === 'HIGH' ? 3 : r === 'MEDIUM' ? 2 : 1;
                return score(b.riskLevel) - score(a.riskLevel);
            });

            setResults(entries);

        } catch (error: any) {
            console.error('Scan error:', error);
            setScanError('Failed to complete scan. Please try again.');
        } finally {
            setIsScanning(false);
        }
    }, [userAddress, publicClient]);

    // 2. Revoke Hook Logic
    const revoke = async (entry: AllowanceEntry) => {
        if (!walletClient || !publicClient || !userAddress) return;
        setRevokingId(entry.id);

        try {
            let hash: `0x${string}`;
            if (entry.token.type === 'ERC20') {
                hash = await walletClient.writeContract({
                    address: entry.token.address as `0x${string}`,
                    abi: parseAbi(['function approve(address spender, uint256 amount) returns (bool)']),
                    functionName: 'approve',
                    args: [entry.spender.address as `0x${string}`, 0n],
                    account: userAddress as `0x${string}`
                });
            } else {
                hash = await walletClient.writeContract({
                    address: entry.token.address as `0x${string}`,
                    abi: parseAbi(['function setApprovalForAll(address operator, bool approved)']),
                    functionName: 'setApprovalForAll',
                    args: [entry.spender.address as `0x${string}`, false],
                    account: userAddress as `0x${string}`
                });
            }

            await publicClient.waitForTransactionReceipt({ hash });

            // Re-scan (Optimistic update possible, but re-scan strictly requested for safety)
            await scan();

        } catch (error) {
            console.error('Revoke failed', error);
            // Optionally set error state
        } finally {
            setRevokingId(null);
        }
    };

    return {
        scan,
        results,
        isScanning,
        scanError,
        revoke,
        revokingId
    };
}

// Logic Helper: Risk Score & Classification
function calculateRiskEntry(token: Token, spenderAddr: string, allowance: bigint, balance: bigint): AllowanceEntry {
    const spenderInfo = KNOWN_SPENDERS[spenderAddr] || {
        address: spenderAddr,
        name: undefined,
        type: 'Unknown'
    };

    let riskLevel: RiskLevel = 'LOW';
    let reason = 'Standard allowance';
    const normalized = token.type === 'ERC20'
        ? formatUnits(allowance, token.decimals)
        : 'All'; // ERC721

    if (token.type === 'ERC20') {
        const MAX_UINT = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
        if (allowance === MAX_UINT || allowance > (MAX_UINT / 2n)) {
            riskLevel = 'HIGH';
            reason = 'Unlimited allowance';
        } else if (balance > 0n && allowance > (balance * 2n)) {
            riskLevel = 'HIGH';
            reason = 'Allowance significantly exceeds balance';
        } else if (balance > 0n && allowance > balance) {
            riskLevel = 'MEDIUM';
            reason = 'Allowance exceeds balance';
        }
    } else {
        // ERC721 'ApprovedForAll' is technically High Risk (permission to move everything)
        // But functionally standard for Marketplaces. We label as Medium/High contextually.
        // For simplicity/safety: High
        riskLevel = 'HIGH';
        reason = 'Full collection access';
    }

    return {
        id: `${token.address}-${spenderAddr}`,
        token,
        spender: spenderInfo,
        allowance,
        balance,
        normalizedAllowance: normalized,
        riskLevel,
        reason
    };
}
