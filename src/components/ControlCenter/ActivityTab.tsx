'use client';

import { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { ContractType } from '@/lib/arcConfig';
import { CONFIGURABLEERC20_ABI } from '@/lib/abis/ConfigurableERC20';
import { CONFIGURABLEERC721_ABI } from '@/lib/abis/ConfigurableERC721';
import { CONFIGURABLEERC1155_ABI } from '@/lib/abis/ConfigurableERC1155';
import styles from '@/app/page.module.css';

interface ActivityTabProps {
    contractAddress: `0x${string}`;
    contractType: ContractType;
}

interface Event {
    type: 'Transfer' | 'Paused' | 'Unpaused';
    blockNumber: bigint;
    transactionHash: string;
    from?: string;
    to?: string;
    value?: string;
    tokenId?: string;
}

export function ActivityTab({ contractAddress, contractType }: ActivityTabProps) {
    const publicClient = usePublicClient();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!publicClient) return;

        const fetchEvents = async () => {
            try {
                setLoading(true);
                const abi = contractType === 'ERC20'
                    ? CONFIGURABLEERC20_ABI
                    : contractType === 'ERC721'
                        ? CONFIGURABLEERC721_ABI
                        : CONFIGURABLEERC1155_ABI;

                const currentBlock = await publicClient.getBlockNumber();
                const fromBlock = currentBlock - 10000n; // Last ~10k blocks

                // Fetch Transfer events
                const transferLogs = await publicClient.getLogs({
                    address: contractAddress,
                    event: contractType === 'ERC1155'
                        ? {
                            type: 'event',
                            name: 'TransferSingle',
                            inputs: [
                                { type: 'address', name: 'operator', indexed: true },
                                { type: 'address', name: 'from', indexed: true },
                                { type: 'address', name: 'to', indexed: true },
                                { type: 'uint256', name: 'id' },
                                { type: 'uint256', name: 'value' }
                            ]
                        }
                        : {
                            type: 'event',
                            name: 'Transfer',
                            inputs: [
                                { type: 'address', name: 'from', indexed: true },
                                { type: 'address', name: 'to', indexed: true },
                                contractType === 'ERC721'
                                    ? { type: 'uint256', name: 'tokenId', indexed: true }
                                    : { type: 'uint256', name: 'value' }
                            ]
                        },
                    fromBlock,
                    toBlock: 'latest'
                });

                const parsedEvents: Event[] = transferLogs.slice(-20).map(log => {
                    if (contractType === 'ERC1155') {
                        return {
                            type: 'Transfer' as const,
                            blockNumber: log.blockNumber,
                            transactionHash: log.transactionHash,
                            from: (log.args as any).from,
                            to: (log.args as any).to,
                            tokenId: (log.args as any).id?.toString(),
                            value: (log.args as any).value?.toString()
                        };
                    } else if (contractType === 'ERC721') {
                        return {
                            type: 'Transfer' as const,
                            blockNumber: log.blockNumber,
                            transactionHash: log.transactionHash,
                            from: (log.args as any).from,
                            to: (log.args as any).to,
                            tokenId: (log.args as any).tokenId?.toString()
                        };
                    } else {
                        const val = (log.args as any).value;
                        return {
                            type: 'Transfer' as const,
                            blockNumber: log.blockNumber,
                            transactionHash: log.transactionHash,
                            from: (log.args as any).from,
                            to: (log.args as any).to,
                            value: val ? (Number(val) / 1e18).toLocaleString() : '0'
                        };
                    }
                }).reverse();

                setEvents(parsedEvents);
            } catch (e) {
                console.error('Failed to fetch events:', e);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [publicClient, contractAddress, contractType]);

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div className={styles.spinner}>
                    <svg className={styles.spinnerSvg} viewBox="0 0 50 50">
                        <circle cx="25" cy="25" r="20" fill="none" strokeWidth="4" stroke="var(--accent)" />
                    </svg>
                </div>
                <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading recent activity...</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '900px' }}>
            <div style={{
                marginBottom: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <h3 style={{
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: 'var(--text-secondary)'
                }}>
                    Recent Events
                </h3>
                <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                    Showing last {events.length} events
                </div>
            </div>

            {events.length === 0 ? (
                <div style={{
                    padding: '60px 20px',
                    textAlign: 'center',
                    background: 'var(--bg-secondary)',
                    borderRadius: '12px',
                    border: '1px solid var(--border)'
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-tertiary)' }}>
                        event_busy
                    </span>
                    <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>
                        No recent activity found
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {events.map((event, idx) => (
                        <div
                            key={`${event.transactionHash}-${idx}`}
                            style={{
                                padding: '20px',
                                background: 'var(--bg-secondary)',
                                borderRadius: '12px',
                                border: '1px solid var(--border)',
                                display: 'flex',
                                gap: '16px'
                            }}
                        >
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '8px',
                                background: event.type === 'Transfer' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <span className="material-symbols-outlined" style={{
                                    fontSize: '20px',
                                    color: event.type === 'Transfer' ? '#3b82f6' : '#f59e0b'
                                }}>
                                    {event.type === 'Transfer' ? 'swap_horiz' : 'pause_circle'}
                                </span>
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                                    <div style={{ fontWeight: 600, fontSize: '15px' }}>
                                        {event.type === 'Transfer' ? 'Transfer' : event.type}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                                        Block #{event.blockNumber.toString()}
                                    </div>
                                </div>

                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                    {event.from && (
                                        <div>From: <code style={{ fontSize: '12px' }}>{event.from.slice(0, 10)}...</code></div>
                                    )}
                                    {event.to && (
                                        <div>To: <code style={{ fontSize: '12px' }}>{event.to.slice(0, 10)}...</code></div>
                                    )}
                                    {event.value && (
                                        <div>Amount: {event.value}</div>
                                    )}
                                    {event.tokenId && (
                                        <div>Token ID: {event.tokenId}</div>
                                    )}
                                </div>

                                <a
                                    href={`https://testnet.arcscan.app/tx/${event.transactionHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        fontSize: '12px',
                                        color: 'var(--accent)',
                                        textDecoration: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    View transaction
                                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>open_in_new</span>
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
