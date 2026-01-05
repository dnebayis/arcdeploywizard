'use client';

import { useState } from 'react';
import { ContractType } from '@/lib/arcConfig';
import { OverviewTab } from './ControlCenter/OverviewTab';
import { MintTab } from './ControlCenter/MintTab';
import { RolesTab } from './ControlCenter/RolesTab';
import { ActivityTab } from './ControlCenter/ActivityTab';
import styles from '@/app/page.module.css';

interface ContractControlCenterProps {
    contractAddress: `0x${string}`;
    contractType: ContractType;
}

type Tab = 'overview' | 'mint' | 'roles' | 'activity';

export function ContractControlCenter({ contractAddress, contractType }: ContractControlCenterProps) {
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    const tabs: { id: Tab; label: string; icon: string }[] = [
        { id: 'overview', label: 'Overview', icon: 'dashboard' },
        { id: 'mint', label: 'Mint Tokens', icon: 'add_circle' },
        { id: 'roles', label: 'Roles', icon: 'admin_panel_settings' },
        { id: 'activity', label: 'Activity', icon: 'history' },
    ];

    return (
        <div className="fade-in">
            {/* Header */}
            <div className={styles.stepHeader} style={{ textAlign: 'left', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <a
                        href="/history"
                        className="btn btn-ghost"
                        style={{ padding: '8px', minWidth: 'auto' }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
                    </a>
                    <h2 className={styles.stepTitle} style={{ margin: 0 }}>Contract Control Center</h2>
                </div>
                <p className={styles.stepDescription} style={{ margin: '0 0 0 44px' }}>
                    Manage and monitor your deployed {contractType} contract
                </p>

                {/* Contract Address Badge */}
                <div style={{
                    marginTop: '16px',
                    marginLeft: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    color: 'var(--text-secondary)'
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>link</span>
                    <a
                        href={`https://testnet.arcscan.app/address/${contractAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--accent)', textDecoration: 'none' }}
                    >
                        {contractAddress}
                    </a>
                </div>
            </div>

            {/* Tab Navigation */}
            <div style={{
                display: 'flex',
                gap: '8px',
                borderBottom: '1px solid var(--border)',
                marginBottom: '32px',
                paddingLeft: '44px'
            }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '12px 20px',
                            background: activeTab === tab.id ? 'var(--bg-secondary)' : 'transparent',
                            border: 'none',
                            borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                            color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontWeight: 500,
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                            {tab.icon}
                        </span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div style={{ paddingLeft: '44px' }}>
                {activeTab === 'overview' && (
                    <OverviewTab
                        contractAddress={contractAddress}
                        contractType={contractType}
                    />
                )}
                {activeTab === 'mint' && (
                    <MintTab
                        contractAddress={contractAddress}
                        contractType={contractType}
                    />
                )}
                {activeTab === 'roles' && (
                    <RolesTab
                        contractAddress={contractAddress}
                        contractType={contractType}
                    />
                )}
                {activeTab === 'activity' && (
                    <ActivityTab
                        contractAddress={contractAddress}
                        contractType={contractType}
                    />
                )}
            </div>
        </div>
    );
}
