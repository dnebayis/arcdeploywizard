'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { getLocalHistory, DeploymentRecord } from '@/lib/deployHistory';
import { fetchDeployments, ScanDeployment } from '@/lib/arcScan';
import { formatAddress } from '@/lib/shareCard';
import styles from './page.module.css';
import { ArcLogo } from '@/components/ArcLogo';
import { WalletConnect } from '@/components/WalletConnect';

interface EnrichedDeployment {
    hash: string;
    contractAddress: string;
    timestamp: number;

    // From local
    wizardType?: string;
    contractName?: string;
    nftImageUrl?: string;
    isWizardDeployed: boolean;
}

export default function HistoryPage() {
    const { address, isConnected } = useAccount();
    const [deployments, setDeployments] = useState<EnrichedDeployment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadHistory() {
            if (!address) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);


                const localHistory = getLocalHistory();
                const localMap = new Map<string, DeploymentRecord>();

                localHistory.forEach(record => {
                    if (record.contractAddress) {
                        localMap.set(record.contractAddress.toLowerCase(), record);
                    }
                });


                const scanDeployments = await fetchDeployments(address);


                // Use a map to prevent duplicates if both API and local have record
                const mergedMap = new Map<string, EnrichedDeployment>();

                // Add scan deployments first
                scanDeployments.forEach(scan => {
                    const local = localMap.get(scan.contractAddress.toLowerCase());
                    mergedMap.set(scan.contractAddress.toLowerCase(), {
                        hash: scan.hash,
                        contractAddress: scan.contractAddress,
                        timestamp: parseInt(scan.timeStamp) * 1000,
                        wizardType: local?.wizardType,
                        contractName: local?.contractName,
                        nftImageUrl: local?.nftImageUrl,
                        isWizardDeployed: !!local
                    });
                });

                // Add any local deployments not found in scan (yet) to the list
                localHistory.forEach(local => {
                    if (!local.contractAddress) return;
                    const key = local.contractAddress.toLowerCase();
                    if (!mergedMap.has(key)) {
                        mergedMap.set(key, {
                            hash: local.txHash,
                            contractAddress: local.contractAddress,
                            timestamp: local.timestamp,
                            wizardType: local.wizardType,
                            contractName: local.contractName,
                            nftImageUrl: local.nftImageUrl,
                            isWizardDeployed: true
                        });
                    }
                });

                const sorted = Array.from(mergedMap.values()).sort((a, b) => b.timestamp - a.timestamp);
                setDeployments(sorted);

            } catch (error) {
                console.error('Failed to load history:', error);
            } finally {
                setLoading(false);
            }
        }

        loadHistory();
    }, [address]);


    const getRelativeTime = (timestamp: number) => {
        const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
        const diff = (timestamp - Date.now()) / 1000; // seconds

        if (Math.abs(diff) < 60) return 'just now';
        if (Math.abs(diff) < 3600) return rtf.format(Math.ceil(diff / 60), 'minute');
        if (Math.abs(diff) < 86400) return rtf.format(Math.ceil(diff / 3600), 'hour');
        return rtf.format(Math.ceil(diff / 86400), 'day');
    };

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.headerContainer}>
                    <div className={styles.logo}>
                        <div className={styles.logoIcon}>
                            <ArcLogo width={24} height={26} />
                        </div>
                        <span className={styles.logoText}>Arc Deploy Wizard</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <WalletConnect />
                        <a href="https://faucet.circle.com/" target="_blank" rel="noopener noreferrer" className={styles.faucetLink} title="Get Testnet USDC" style={{ color: 'white' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>water_drop</span>
                        </a>
                    </div>
                </div>
            </header>

            <main className={styles.main}>
                <div className={styles.container}>
                    <div className={styles.pageHeader}>
                        <a href="/" className={styles.backLink}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '4px' }}>arrow_back</span>
                            Back to Wizard
                        </a>
                        <div className={styles.headerContent}>
                            <h1 className={styles.title}>Deployment History</h1>
                            <p className={styles.subtitle}>
                                Contracts deployed by {address ? formatAddress(address) : 'connected wallet'}
                            </p>
                        </div>
                    </div>

                    {!isConnected ? (
                        <div className={styles.emptyState}>
                            <h2>Connect Wallet</h2>
                            <p>Connect your wallet to view deployment history</p>
                        </div>
                    ) : loading ? (
                        <div className={styles.loading}>
                            <div className={styles.spinner}></div>
                            <p>Loading history...</p>
                        </div>
                    ) : deployments.length === 0 ? (
                        <div className={styles.emptyState}>
                            <h2>No Deployments Found</h2>
                            <p>You haven't deployed any contracts yet.</p>
                            <a href="/" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>
                                Deploy Your First Contract
                            </a>
                        </div>
                    ) : (
                        <div className={styles.list}>
                            {deployments.map((deployment) => (
                                <div
                                    key={deployment.contractAddress}
                                    className={`${styles.card} ${deployment.isWizardDeployed ? styles.wizardCard : ''}`}
                                >
                                    {/* Left: Icon/Image */}
                                    <div className={styles.cardIcon}>
                                        {deployment.nftImageUrl ? (
                                            <img src={deployment.nftImageUrl} alt="NFT" className={styles.nftThumbnail} />
                                        ) : (
                                            <div className={`${styles.iconPlaceholder} ${deployment.isWizardDeployed ? styles.wizardIcon : ''}`}>
                                                {deployment.isWizardDeployed ? (
                                                    // Wizard Sparkle Icon
                                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>auto_awesome</span>
                                                ) : (
                                                    // Generic Contract Icon
                                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>description</span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Middle: Content */}
                                    <div className={styles.cardBody}>
                                        <div className={styles.cardTopRow}>
                                            <h3 className={styles.contractName}>
                                                {deployment.isWizardDeployed ? (
                                                    deployment.contractName || 'Untitled Contract'
                                                ) : (
                                                    'External Contract'
                                                )}
                                            </h3>
                                            {deployment.isWizardDeployed && (
                                                <span className={styles.badge}>
                                                    ✨ Wizard Deploy
                                                </span>
                                            )}
                                        </div>

                                        <div className={styles.cardMetaRow}>
                                            <code className={styles.code}>
                                                {formatAddress(deployment.contractAddress)}
                                            </code>
                                            <span className={styles.separator}>•</span>
                                            <span className={styles.typeLabel}>
                                                {deployment.isWizardDeployed
                                                    ? `${deployment.wizardType}`
                                                    : 'Manual'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className={styles.cardActions}>
                                        <span className={styles.timeStr}>
                                            {getRelativeTime(deployment.timestamp)}
                                        </span>
                                        <a
                                            href={`https://testnet.arcscan.app/address/${deployment.contractAddress}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.explorerBtn}
                                            title="View on Explorer"
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>open_in_new</span>
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
