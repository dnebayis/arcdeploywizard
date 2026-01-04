'use client';

import { useState } from 'react';
import styles from '@/app/page.module.css';
import {
    deriveConfigFacts,
    generateConsequences,
    generateScenarioHints,
    getSeverityColor,
    getSeverityIcon,
    Consequence,
    ScenarioHint
} from '@/lib/realityCheck';
import { ContractType, SHARED_NFT_METADATA } from '@/lib/arcConfig';

interface RealityCheckStepProps {
    contractType: ContractType;
    params: any;
    userAddress?: string;
    acknowledged: boolean;
    onAcknowledgedChange: (value: boolean) => void;
    onBack: () => void;
    onContinue: () => void;
}

export function RealityCheckStep({
    contractType,
    params,
    userAddress,
    acknowledged,
    onAcknowledgedChange,
    onBack,
    onContinue
}: RealityCheckStepProps) {
    const [expandedTooltip, setExpandedTooltip] = useState<string | null>(null);

    // Enrich params with user address for comparison
    const enrichedParams = { ...params, userAddress };

    // Derive facts and generate consequences
    const facts = deriveConfigFacts(contractType, enrichedParams);
    const consequences = generateConsequences(facts);
    const hints = generateScenarioHints(facts);

    // Group consequences by severity
    const criticalConsequences = consequences.filter(c => c.severity === 'CRITICAL');
    const warningConsequences = consequences.filter(c => c.severity === 'WARNING');
    const infoConsequences = consequences.filter(c => c.severity === 'INFO');

    const ConsequenceCard = ({ consequence }: { consequence: Consequence }) => {
        const isExpanded = expandedTooltip === consequence.id;
        const color = getSeverityColor(consequence.severity);
        const icon = getSeverityIcon(consequence.severity);

        return (
            <div
                className={styles.featureRow}
                style={{
                    padding: '16px',
                    background: 'var(--bg-secondary)',
                    border: `1px solid ${color}20`,
                    borderLeft: `4px solid ${color}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
                onClick={() => setExpandedTooltip(isExpanded ? null : consequence.id)}
            >
                <div className={styles.featureContent} style={{ flex: 1 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '24px', color }}>
                        {icon}
                    </span>
                    <div className={styles.featureText}>
                        <span className={styles.featureTitle} style={{ color: 'var(--text-primary)' }}>
                            {consequence.title}
                        </span>
                        <span className={styles.featureDesc} style={{ marginTop: '4px' }}>
                            {consequence.explanation}
                        </span>
                        {isExpanded && (
                            <div
                                className="fade-in"
                                style={{
                                    marginTop: '8px',
                                    padding: '12px',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    color: 'var(--text-secondary)',
                                    borderLeft: `2px solid ${color}`
                                }}
                            >
                                <strong>Why this matters:</strong> {consequence.tooltip}
                            </div>
                        )}
                    </div>
                </div>
                <span
                    className="material-symbols-outlined"
                    style={{
                        fontSize: '20px',
                        color: 'var(--text-tertiary)',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s'
                    }}
                >
                    expand_more
                </span>
            </div>
        );
    };

    const ScenarioHintCard = ({ hint }: { hint: ScenarioHint }) => (
        <div
            style={{
                padding: '12px 16px',
                background: 'var(--bg-tertiary)',
                borderRadius: '8px',
                borderLeft: '3px solid var(--accent)',
                fontSize: '13px'
            }}
        >
            <div style={{ fontWeight: 600, color: 'var(--accent)', marginBottom: '4px' }}>
                {hint.condition}
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>{hint.hint}</div>
        </div>
    );

    const ConfigSummaryCard = () => {
        const getPreviewImage = () => {
            if (contractType === 'ERC721' || contractType === 'ERC1155') {
                return params.image || SHARED_NFT_METADATA.image;
            }
            return null;
        };

        const image = getPreviewImage();

        return (
            <div
                style={{
                    padding: '24px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    textAlign: 'center'
                }}
            >
                {image && (
                    <img
                        src={image}
                        alt="NFT Preview"
                        style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '12px',
                            marginBottom: '16px',
                            objectFit: 'cover',
                            border: '2px solid var(--border)'
                        }}
                    />
                )}

                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>
                    {params.name || 'Unnamed Contract'}
                </h3>

                {params.symbol && (
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        {params.symbol}
                    </div>
                )}

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px',
                        marginTop: '16px'
                    }}
                >
                    <div
                        style={{
                            padding: '12px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '8px'
                        }}
                    >
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                            TYPE
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent)' }}>
                            {contractType}
                        </div>
                    </div>

                    <div
                        style={{
                            padding: '12px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '8px'
                        }}
                    >
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                            {contractType === 'ERC20' ? 'INITIAL SUPPLY' : 'MAX SUPPLY'}
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {contractType === 'ERC20'
                                ? params.initialSupply
                                    ? Number(params.initialSupply).toLocaleString()
                                    : '0'
                                : params.maxSupply || '∞'}
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    How it will appear on Arc explorers
                </div>
            </div>
        );
    };

    return (
        <div className="wizard-container fade-in">
            <div className={styles.stepHeader}>
                <h2 className={styles.stepTitle}>
                    <span className="material-symbols-outlined" style={{ fontSize: '28px', verticalAlign: 'middle', marginRight: '8px' }}>
                        fact_check
                    </span>
                    Reality Check
                </h2>
                <p className={styles.stepDescription}>
                    Understand what your configuration means before deployment
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginTop: '24px' }}>
                {/* Left Column: Consequences */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Critical Section */}
                    {criticalConsequences.length > 0 && (
                        <div>
                            <h3
                                style={{
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    color: '#ef4444',
                                    marginBottom: '12px',
                                    letterSpacing: '0.5px'
                                }}
                            >
                                Critical Items
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {criticalConsequences.map(c => (
                                    <ConsequenceCard key={c.id} consequence={c} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Warning Section */}
                    {warningConsequences.length > 0 && (
                        <div>
                            <h3
                                style={{
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    color: '#f59e0b',
                                    marginBottom: '12px',
                                    letterSpacing: '0.5px'
                                }}
                            >
                                Important Considerations
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {warningConsequences.map(c => (
                                    <ConsequenceCard key={c.id} consequence={c} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Info Section */}
                    {infoConsequences.length > 0 && (
                        <div>
                            <h3
                                style={{
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    color: 'var(--accent)',
                                    marginBottom: '12px',
                                    letterSpacing: '0.5px'
                                }}
                            >
                                Configuration Summary
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {infoConsequences.map(c => (
                                    <ConsequenceCard key={c.id} consequence={c} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Scenario Hints */}
                    {hints.length > 0 && (
                        <div>
                            <h3
                                style={{
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    color: 'var(--text-secondary)',
                                    marginBottom: '12px',
                                    letterSpacing: '0.5px'
                                }}
                            >
                                Things to Consider
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {hints.map((hint, idx) => (
                                    <ScenarioHintCard key={idx} hint={hint} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Acknowledgment */}
                    <div
                        style={{
                            padding: '20px',
                            background: 'var(--bg-secondary)',
                            borderRadius: '12px',
                            border: '2px solid var(--border)',
                            marginTop: '8px'
                        }}
                    >
                        <label
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '12px',
                                cursor: 'pointer',
                                userSelect: 'none'
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={acknowledged}
                                onChange={(e) => onAcknowledgedChange(e.target.checked)}
                                style={{
                                    marginTop: '2px',
                                    width: '20px',
                                    height: '20px',
                                    cursor: 'pointer',
                                    accentColor: 'var(--accent)'
                                }}
                            />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                                    I understand these settings are permanent
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    Smart contracts are immutable. Configuration choices cannot be changed after deployment.
                                </div>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Right Column: Preview */}
                <div style={{ position: 'sticky', top: '24px', height: 'fit-content' }}>
                    <ConfigSummaryCard />
                </div>
            </div>

            {/* Actions */}
            <div className={styles.stepActions} style={{ marginTop: '32px' }}>
                <button className="btn btn-ghost" onClick={onBack}>
                    Back to Configuration
                </button>
                <button
                    className="btn btn-primary"
                    onClick={onContinue}
                    disabled={!acknowledged}
                    title={!acknowledged ? 'Please acknowledge the permanent nature of these settings' : ''}
                >
                    Continue to Review & Deploy
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
                </button>
            </div>
        </div>
    );
}
