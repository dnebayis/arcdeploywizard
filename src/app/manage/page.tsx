'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { WalletConnect } from '@/components/WalletConnect';
import { ContractControlCenter } from '@/components/ContractControlCenter';
import { ArcLogo } from '@/components/ArcLogo';
import { GlobalFooter } from '@/components/GlobalFooter';
import styles from '@/app/page.module.css';

function ManageContent() {
    const { isConnected } = useAccount();
    const searchParams = useSearchParams();
    const address = searchParams.get('address');
    const type = searchParams.get('type') as 'ERC20' | 'ERC721' | 'ERC1155' | null;

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.headerContainer}>
                    <a href="/" className={styles.logo}>
                        <ArcLogo />
                        <span className={styles.logoText}>Arc Deploy Wizard</span>
                    </a>
                    <WalletConnect />
                </div>
            </header>

            <main className={styles.main} style={{ alignItems: 'flex-start', paddingTop: '40px' }}>
                <div style={{ width: '100%', maxWidth: '1200px' }}>
                    {!isConnected ? (
                        <div className={styles.stepContainer}>
                            <div className={styles.hero}>
                                <h1 className={styles.heroTitle} style={{ fontSize: '32px' }}>Contract Management</h1>
                                <p className={styles.heroSubtitle}>
                                    Connect your wallet to manage your deployed contracts
                                </p>
                                <div className={styles.connectPrompt}>
                                    <p className={styles.connectText}>Connect your wallet to continue</p>
                                </div>
                            </div>
                        </div>
                    ) : !address || !type ? (
                        <div className={styles.stepContainer}>
                            <div className={styles.hero}>
                                <h1 className={styles.heroTitle} style={{ fontSize: '32px' }}>Contract Not Found</h1>
                                <p className={styles.heroSubtitle}>
                                    No contract address specified. Return to <a href="/history" className={styles.footerLink}>deployment history</a>.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <ContractControlCenter
                            contractAddress={address as `0x${string}`}
                            contractType={type}
                        />
                    )}
                </div>
            </main>

            <GlobalFooter />
        </div>
    );
}

export default function ManagePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ManageContent />
        </Suspense>
    );
}
