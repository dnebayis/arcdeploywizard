'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ContractType, SHARED_NFT_METADATA } from '@/lib/arcConfig';
import { NftPreviewCard } from './NftPreviewCard';
import {
    getERC20DeploymentData,
    getERC721DeploymentData,
    ERC20Options,
    ERC721Options,
    MintAccessMode,
    DeploymentData
} from '@/lib/contractFactory';
import styles from '@/app/page.module.css';

interface ConfigurationWizardProps {
    contractType: ContractType;
    onBack: () => void;
    onComplete: (data: DeploymentData, options: any) => void;
}

type Tab = 'basics' | 'ownership' | 'features';

export function ConfigurationWizard({ contractType, onBack, onComplete }: ConfigurationWizardProps) {
    const { address } = useAccount();
    const [activeTab, setActiveTab] = useState<Tab>('basics');

    // Common State
    const [name, setName] = useState('');
    const [symbol, setSymbol] = useState('');
    const [owner, setOwner] = useState(address || '');
    const [isCustomOwner, setIsCustomOwner] = useState(false);

    // Features
    const [burnable, setBurnable] = useState(contractType === 'ERC20');
    const [pausable, setPausable] = useState(false);
    const [mintable, setMintable] = useState(true); // ERC20 only

    // Supply
    const [initialSupply, setInitialSupply] = useState('1000000'); // ERC20
    const [maxSupply, setMaxSupply] = useState(''); // Optional for both

    // ERC721 Specific
    const [mintAccessMode, setMintAccessMode] = useState<MintAccessMode>('Public');
    const [walletMintLimit, setWalletMintLimit] = useState('');

    useEffect(() => {
        if (address && !isCustomOwner) {
            setOwner(address);
        }
    }, [address, isCustomOwner]);

    const handleNext = () => {
        if (activeTab === 'basics') setActiveTab('ownership');
        else if (activeTab === 'ownership') setActiveTab('features');
        else handleFinish();
    };

    const handleFinish = () => {
        if (contractType === 'ERC20') {
            const options: ERC20Options = {
                name,
                symbol,
                initialSupply,
                owner,
                mintable,
                burnable,
                pausable,
                maxSupply: maxSupply || undefined
            };
            const data = getERC20DeploymentData(options);
            onComplete(data, options);
        } else {
            const options: ERC721Options = {
                name,
                symbol,
                owner,
                burnable,
                pausable,
                maxSupply: maxSupply || undefined,
                mintAccessMode,
                walletMintLimit: mintAccessMode === 'PublicWithWalletLimit' ? walletMintLimit : undefined
            };
            const data = getERC721DeploymentData(options);
            onComplete(data, options);
        }
    };

    const isStepValid = () => {
        if (activeTab === 'basics') {
            if (!name || !symbol) return false;
            if (contractType === 'ERC20' && !initialSupply) return false;
            return true;
        }
        if (activeTab === 'ownership') {
            return !!owner && owner.startsWith('0x') && owner.length === 42;
        }
        if (activeTab === 'features') {
            if (contractType === 'ERC20' && maxSupply && initialSupply && Number(maxSupply) < Number(initialSupply)) return false;
            if (contractType === 'ERC721' && mintAccessMode === 'PublicWithWalletLimit' && !walletMintLimit) return false;
            return true;
        }
        return true;
    };

    const FeatureToggle = ({
        label,
        description,
        icon,
        checked,
        onChange
    }: {
        label: string;
        description: string;
        icon: string;
        checked: boolean;
        onChange: (checked: boolean) => void;
    }) => (
        <div className={styles.featureRow}>
            <div className={styles.featureContent}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>{icon}</span>
                <div className={styles.featureText}>
                    <span className={styles.featureTitle}>{label}</span>
                    <span className={styles.featureDesc}>{description}</span>
                </div>
            </div>
            <label className={styles.switch}>
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={e => onChange(e.target.checked)}
                />
                <span className={styles.slider}></span>
            </label>
        </div>
    );

    const renderFormContent = () => (
        <div className={styles.form}>
            {activeTab === 'basics' && (
                <>
                    <div className="input-group">
                        <label className="input-label">Contract Name</label>
                        <input
                            className="input"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder={contractType === 'ERC20' ? "My Token" : "My Collection"}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Symbol</label>
                        <input
                            className="input"
                            value={symbol}
                            onChange={e => setSymbol(e.target.value.toUpperCase())}
                            placeholder={contractType === 'ERC20' ? "MTK" : "NFT"}
                            maxLength={5}
                        />
                    </div>
                    {contractType === 'ERC20' && (
                        <div className="input-group">
                            <label className="input-label">Initial Supply</label>
                            <input
                                className="input"
                                type="number"
                                value={initialSupply}
                                onChange={e => setInitialSupply(e.target.value)}
                                placeholder="1000000"
                            />
                            <div className={styles.fieldHint}>Tokens to mint to owner immediately</div>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'ownership' && (
                <>
                    <div className="input-group">
                        <label className="input-label">Contract Owner</label>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                            <button
                                className={`btn ${!isCustomOwner ? 'btn-secondary' : 'btn-ghost'}`}
                                onClick={() => { setIsCustomOwner(false); setOwner(address || ''); }}
                                style={{ flex: 1, fontSize: '13px' }}
                            >
                                Me ({address?.slice(0, 6)}...)
                            </button>
                            <button
                                className={`btn ${isCustomOwner ? 'btn-secondary' : 'btn-ghost'}`}
                                onClick={() => { setIsCustomOwner(true); setOwner(''); }}
                                style={{ flex: 1, fontSize: '13px' }}
                            >
                                Custom Address
                            </button>
                        </div>
                        {isCustomOwner && (
                            <input
                                className="input"
                                value={owner}
                                onChange={e => setOwner(e.target.value)}
                                placeholder="0x..."
                            />
                        )}
                        <div className={styles.fieldHint}>
                            The owner has special administrative privileges.
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'features' && (
                <>
                    <div className="input-group">
                        <label className="input-label">Token Features</label>
                        <div className={styles.featureCard}>
                            {contractType === 'ERC20' && (
                                <FeatureToggle
                                    label="Mintable"
                                    description="Owner can mint more tokens later"
                                    icon="add_circle"
                                    checked={mintable}
                                    onChange={setMintable}
                                />
                            )}
                            <FeatureToggle
                                label="Burnable"
                                description="Holders can destroy their tokens"
                                icon="local_fire_department"
                                checked={burnable}
                                onChange={setBurnable}
                            />
                            <FeatureToggle
                                label="Pausable"
                                description="Owner can freeze all token transfers"
                                icon="pause_circle"
                                checked={pausable}
                                onChange={setPausable}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Max Supply Cap (Optional)</label>
                        <input
                            className="input"
                            type="number"
                            value={maxSupply}
                            onChange={e => setMaxSupply(e.target.value)}
                            placeholder="Leave empty for unlimited"
                            min="0"
                        />
                        {contractType === 'ERC20' && maxSupply && initialSupply && Number(maxSupply) < Number(initialSupply) && (
                            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                                Max supply cannot be less than initial supply ({Number(initialSupply).toLocaleString()})
                            </div>
                        )}
                    </div>

                    {contractType === 'ERC721' && (
                        <div className="input-group">
                            <label className="input-label">Minting Rules</label>
                            <select
                                className="input"
                                value={mintAccessMode}
                                onChange={e => setMintAccessMode(e.target.value as MintAccessMode)}
                            >
                                <option value="OnlyOwner">Only Owner can mint</option>
                                <option value="Public">Public (Anyone can mint)</option>
                                <option value="PublicWithWalletLimit">Public with Limit per Wallet</option>
                            </select>
                        </div>
                    )}

                    {contractType === 'ERC721' && mintAccessMode === 'PublicWithWalletLimit' && (
                        <div className="input-group">
                            <label className="input-label">Mint Limit per Wallet</label>
                            <input
                                className="input"
                                type="number"
                                value={walletMintLimit}
                                onChange={e => setWalletMintLimit(e.target.value)}
                                placeholder="e.g. 5"
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );

    return (
        <div className="wizard-container fade-in">
            <div className={styles.stepHeader}>
                <h2 className={styles.stepTitle}>Configure {contractType}</h2>
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    {(['basics', 'ownership', 'features'] as Tab[]).map((tab, idx) => (
                        <div
                            key={tab}
                            style={{
                                flex: 1,
                                height: '4px',
                                background: activeTab === tab || (idx < ['basics', 'ownership', 'features'].indexOf(activeTab))
                                    ? 'var(--accent)'
                                    : 'var(--border)',
                                borderRadius: '2px',
                                transition: 'all 0.3s'
                            }}
                        />
                    ))}
                </div>
            </div>

            <div style={{ marginTop: '24px' }}>
                {contractType === 'ERC721' ? (
                    <div className={styles.configLayout}>
                        {renderFormContent()}
                        <div className={styles.previewSection}>
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <NftPreviewCard
                                    name={name || 'Unnamed Collection'}
                                    metadata={SHARED_NFT_METADATA}
                                />
                                <p className={styles.helperText} style={{ marginTop: '16px', maxWidth: '300px', textAlign: 'center' }}>
                                    All NFTs in this collection share the same preview and metadata.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    renderFormContent()
                )}
            </div>

            <div className={styles.stepActions}>
                <button className="btn btn-ghost" onClick={() => {
                    if (activeTab === 'basics') onBack();
                    else if (activeTab === 'ownership') setActiveTab('basics');
                    else setActiveTab('ownership');
                }}>
                    Back
                </button>
                <button
                    className="btn btn-primary"
                    onClick={handleNext}
                    disabled={!isStepValid()}
                >
                    {activeTab === 'features' ? 'Review & Preview' : 'Next'}
                </button>
            </div>
        </div>
    );
}
