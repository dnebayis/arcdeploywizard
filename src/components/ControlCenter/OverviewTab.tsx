'use client';

import { useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { ContractType } from '@/lib/arcConfig';
import { CONFIGURABLEERC20_ABI } from '@/lib/abis/ConfigurableERC20';
import { CONFIGURABLEERC721_ABI } from '@/lib/abis/ConfigurableERC721';
import { CONFIGURABLEERC1155_ABI } from '@/lib/abis/ConfigurableERC1155';
import styles from '@/app/page.module.css';

interface OverviewTabProps {
    contractAddress: `0x${string}`;
    contractType: ContractType;
}

interface ContractInfo {
    name: string;
    symbol?: string;
    totalSupply?: string;
    maxSupply?: string;
    paused: boolean;
    mintingEnabled: boolean;
    burnable: boolean;
}

export function OverviewTab({ contractAddress, contractType }: OverviewTabProps) {
    const publicClient = usePublicClient();
    const [info, setInfo] = useState<ContractInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!publicClient) return;

        const fetchContractInfo = async () => {
            try {
                setLoading(true);
                setError(null);

                const abi = contractType === 'ERC20'
                    ? CONFIGURABLEERC20_ABI
                    : contractType === 'ERC721'
                        ? CONFIGURABLEERC721_ABI
                        : CONFIGURABLEERC1155_ABI;

                const [name, paused] = await Promise.all([
                    publicClient.readContract({
                        address: contractAddress,
                        abi,
                        functionName: 'name'
                    }) as Promise<string>,
                    publicClient.readContract({
                        address: contractAddress,
                        abi,
                        functionName: 'paused'
                    }) as Promise<boolean>
                ]);

                let symbol: string | undefined;
                let totalSupply: string | undefined;
                let maxSupply: string | undefined;
                let mintingEnabled = false;
                let burnable = false;

                if (contractType !== 'ERC1155') {
                    symbol = await publicClient.readContract({
                        address: contractAddress,
                        abi,
                        functionName: 'symbol'
                    }) as string;
                }

                if (contractType === 'ERC20') {
                    const supply = await publicClient.readContract({
                        address: contractAddress,
                        abi: CONFIGURABLEERC20_ABI,
                        functionName: 'totalSupply'
                    }) as bigint;
                    totalSupply = (Number(supply) / 1e18).toLocaleString();

                    try {
                        const max = await publicClient.readContract({
                            address: contractAddress,
                            abi: CONFIGURABLEERC20_ABI,
                            functionName: 'maxSupply'
                        }) as bigint;
                        if (max > 0n) {
                            maxSupply = (Number(max) / 1e18).toLocaleString();
                        }
                    } catch (e) {
                        // maxSupply might not exist
                    }

                    mintingEnabled = await publicClient.readContract({
                        address: contractAddress,
                        abi: CONFIGURABLEERC20_ABI,
                        functionName: 'mintable'
                    }) as boolean;
                }

                if (contractType === 'ERC721') {
                    try {
                        const supply = await publicClient.readContract({
                            address: contractAddress,
                            abi: CONFIGURABLEERC721_ABI,
                            functionName: 'totalSupply'
                        }) as bigint;
                        totalSupply = supply.toString();
                    } catch (e) {
                        // totalSupply might not be available
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
                        // maxSupply might not exist
                    }

                    mintingEnabled = true; // ERC721 always supports minting
                }

                if (contractType === 'ERC1155') {
                    mintingEnabled = await publicClient.readContract({
                        address: contractAddress,
                        abi: CONFIGURABLEERC1155_ABI,
                        functionName: 'mintable'
                    }) as boolean;
                }

                setInfo({
                    name,
                    symbol,
                    totalSupply,
                    maxSupply,
                    paused,
                    mintingEnabled,
                    burnable
                });
            } catch (e: any) {
                console.error('Failed to fetch contract info:', e);
                setError('Failed to load contract information');
            } finally {
                setLoading(false);
            }
        };

        fetchContractInfo();
    }, [publicClient, contractAddress, contractType]);

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div className={styles.spinner}>
                    <svg className={styles.spinnerSvg} viewBox="0 0 50 50">
                        <circle cx="25" cy="25" r="20" fill="none" strokeWidth="4" stroke="var(--accent)" />
                    </svg>
                </div>
                <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading contract information...</p>
            </div>
        );
    }

    if (error || !info) {
        return (
            <div style={{
                padding: '32px',
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                textAlign: 'center'
            }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#ef4444' }}>error</span>
                <p style={{ marginTop: '16px', color: 'var(--text-primary)' }}>{error || 'Failed to load contract'}</p>
            </div>
        );
    }

    const InfoCard = ({ label, value, icon, status }: { label: string; value: string; icon: string; status?: 'active' | 'paused' | 'disabled' }) => (
        <div style={{
            padding: '20px',
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--text-secondary)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{icon}</span>
                <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>{label}</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {value}
                {status && (
                    <span style={{
                        fontSize: '11px',
                        padding: '4px 8px',
                        borderRadius: '99px',
                        background: status === 'active' ? 'rgba(16, 185, 129, 0.15)' : status === 'paused' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                        color: status === 'active' ? '#10b981' : status === 'paused' ? '#ef4444' : '#6b7280',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                    }}>
                        {status}
                    </span>
                )}
            </div>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px' }}>
            {/* Contract Identity */}
            <div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Contract Identity
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                    <InfoCard label="Contract Name" value={info.name} icon="label" />
                    {info.symbol && <InfoCard label="Symbol" value={info.symbol} icon="tag" />}
                    <InfoCard label="Token Standard" value={contractType} icon="code" />
                </div>
            </div>

            {/* Supply Information */}
            {info.totalSupply && (
                <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        Supply Metrics
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                        <InfoCard label="Current Supply" value={info.totalSupply} icon="inventory" />
                        <InfoCard label="Maximum Supply" value={info.maxSupply || 'Unlimited'} icon="trending_flat" />
                    </div>
                </div>
            )}

            {/* Contract Status */}
            <div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Contract Status
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                    <InfoCard
                        label="Transfer Status"
                        value={info.paused ? 'Paused' : 'Active'}
                        icon="swap_horiz"
                        status={info.paused ? 'paused' : 'active'}
                    />
                    <InfoCard
                        label="Minting Status"
                        value={info.mintingEnabled ? 'Enabled' : 'Disabled'}
                        icon="add_circle"
                        status={info.mintingEnabled ? 'active' : 'disabled'}
                    />
                </div>
            </div>
        </div>
    );
}
