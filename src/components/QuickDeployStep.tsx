'use client';

import styles from './QuickDeployStep.module.css';

interface QuickDeployStepProps {
    contractName: string;
    description: string;
    defaults: Record<string, string>;
    paramLabels: readonly { readonly name: string; readonly label: string; readonly type?: string; readonly placeholder?: string; readonly tooltip?: string }[];
    onQuickDeploy: () => void;
    onCustomize: () => void;
    onBack: () => void;
}

export function QuickDeployStep({
    contractName,
    description,
    defaults,
    paramLabels,
    onQuickDeploy,
    onCustomize,
    onBack
}: QuickDeployStepProps) {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>{contractName}</h2>
                <p className={styles.description}>{description}</p>
            </div>

            <div className={styles.card}>
                <div className={styles.badge}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                    Recommended defaults
                </div>

                <div className={styles.defaultsList}>
                    {Object.entries(defaults).map(([key, value]) => {
                        const param = paramLabels.find(p => p.name === key);
                        return (
                            <div key={key} className={styles.defaultItem}>
                                <span className={styles.label}>{param?.label || key}</span>
                                <span className={styles.value}>{value}</span>
                            </div>
                        );
                    })}
                </div>

                <button
                    className="btn btn-primary"
                    onClick={onQuickDeploy}
                    style={{ width: '100%', marginTop: '24px' }}
                >
                    Deploy with default settings
                </button>

                <button
                    className="btn btn-ghost"
                    onClick={onCustomize}
                    style={{ width: '100%', marginTop: '12px' }}
                >
                    Customize settings
                </button>
            </div>

            <div className={styles.actions}>
                <button className="btn btn-ghost" onClick={onBack}>
                    Back
                </button>
            </div>
        </div>
    );
}
