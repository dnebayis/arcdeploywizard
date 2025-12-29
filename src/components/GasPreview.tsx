'use client';

import styles from './GasPreview.module.css';

interface GasPreviewProps {
    gasEstimate: bigint;
    gasCostUSDC: string;
    bytecodeSize: number;
    onDeploy: () => void;
    deploying: boolean;
}

export function GasPreview({
    gasEstimate,
    gasCostUSDC,
    bytecodeSize,
    onDeploy,
    deploying
}: GasPreviewProps) {
    const costNum = parseFloat(gasCostUSDC);
    const isExpensive = costNum > 10;

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Gas Estimation</h2>

            <div className={styles.stats}>
                <div className={styles.stat}>
                    <div className={styles.statLabel}>Estimated Gas</div>
                    <div className={styles.statValue}>{gasEstimate.toLocaleString()} units</div>
                </div>

                <div className={styles.stat}>
                    <div className={styles.statLabel}>Deployment Cost</div>
                    <div className={styles.statValue}>
                        <span className={styles.usdcAmount}>{gasCostUSDC}</span>
                        <span className={styles.usdcSymbol}>USDC</span>
                    </div>
                </div>

                <div className={styles.stat}>
                    <div className={styles.statLabel}>Bytecode Size</div>
                    <div className={styles.statValue}>{bytecodeSize.toLocaleString()} bytes</div>
                </div>
            </div>

            {isExpensive && (
                <div className={styles.warning}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <span>High deployment cost - consider optimizing contract</span>
                </div>
            )}

            <button
                className={styles.deployBtn}
                onClick={onDeploy}
                disabled={deploying}
            >
                {deploying ? (
                    <>
                        <div className="spinner" />
                        Deploying...
                    </>
                ) : (
                    <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        Deploy Contract
                    </>
                )}
            </button>
        </div>
    );
}
