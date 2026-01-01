'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ContractType, SHARED_NFT_METADATA } from '@/lib/arcConfig';
import { NftPreviewCard } from './NftPreviewCard';
import {
    getERC20DeploymentData,
    getERC721DeploymentData,
    getERC1155DeploymentData,
    ERC20Options,
    ERC721Options,
    ERC1155Options,
    MintAccessMode,
    TokenModel,
    DeploymentData
} from '@/lib/contractFactory';
import styles from '@/app/page.module.css';

const DEFAULT_METADATA_IMAGE = 'https://emerald-spotty-boar-761.mypinata.cloud/ipfs/bafybeic5wusdlmndycj6vbjigvle3qkdmbwbiqxtmn33m363dr6nd54q2i';

const resolveIpfs = (url: string) => {
    if (!url) return '';
    if (url.startsWith('ipfs://')) {
        return url.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
    }
    return url;
};

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
    const [mintable, setMintable] = useState(true); // ERC20 and ERC1155

    // Supply
    const [initialSupply, setInitialSupply] = useState('1000000'); // ERC20
    const [maxSupply, setMaxSupply] = useState(''); // Optional for ERC20 and ERC721

    // ERC721/ERC1155 Specific
    const [mintAccessMode, setMintAccessMode] = useState<MintAccessMode>('Public');
    const [walletMintLimit, setWalletMintLimit] = useState('');

    // ERC1155 Specific
    const [tokenModel, setTokenModel] = useState<TokenModel>('shared');
    const [uri, setUri] = useState('');
    const [maxSupplyPerToken, setMaxSupplyPerToken] = useState('');
    const [previewMetadata, setPreviewMetadata] = useState<any>(null);

    // Generator State
    const [showGenerator, setShowGenerator] = useState(false);
    const [genImage, setGenImage] = useState<File | null>(null);
    const [genName, setGenName] = useState('');
    const [genDescription, setGenDescription] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [genError, setGenError] = useState('');

    const handleGenerate = async () => {
        if (!genImage) {
            setGenError('Image is required');
            return;
        }
        setIsGenerating(true);
        setGenError('');

        try {
            const formData = new FormData();
            formData.append('image', genImage);
            formData.append('name', genName || name);
            formData.append('description', genDescription);

            const res = await fetch('/api/generate-metadata', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Generation failed');

            setUri(data.uri); // IPFS URI
            setPreviewMetadata({
                name: data.metadata.name,
                description: data.metadata.description,
                image: data.imageUrl // Gateway URL for preview
            });
            setShowGenerator(false);
        } catch (e: any) {
            console.error(e);
            setGenError(e.message || 'Failed to generate metadata');
        } finally {
            setIsGenerating(false);
        }
    };

    useEffect(() => {
        if (!uri) {
            setPreviewMetadata(null);
            return;
        }
        const timeoutId = setTimeout(async () => {
            try {
                const res = await fetch(resolveIpfs(uri));
                if (!res.ok) throw new Error('Failed to fetch');
                const json = await res.json();
                if (json) {
                    setPreviewMetadata({
                        ...json,
                        image: resolveIpfs(json.image)
                    });
                }
            } catch (e) {
                console.error('Metadata fetch failed:', e);
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [uri]);

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
        } else if (contractType === 'ERC1155') {
            const options: ERC1155Options = {
                name,
                uri,
                owner,
                tokenModel,
                mintable,
                burnable,
                pausable,
                mintAccessMode,
                walletMintLimit: mintAccessMode === 'PublicWithWalletLimit' ? walletMintLimit : undefined,
                maxSupplyPerToken: maxSupplyPerToken || undefined
            };
            const data = getERC1155DeploymentData(options);
            onComplete(data, {
                ...options,
                image: previewMetadata?.image || DEFAULT_METADATA_IMAGE
            });
        } else {
            const options: ERC721Options = {
                name,
                symbol,
                uri,
                owner,
                burnable,
                pausable,
                maxSupply: maxSupply || undefined,
                mintAccessMode,
                walletMintLimit: mintAccessMode === 'PublicWithWalletLimit' ? walletMintLimit : undefined
            };
            const data = getERC721DeploymentData(options);
            onComplete(data, {
                ...options,
                image: previewMetadata?.image || DEFAULT_METADATA_IMAGE
            });
        }
    };

    const isStepValid = () => {
        if (activeTab === 'basics') {
            if (!name) return false;
            if (contractType !== 'ERC1155' && !symbol) return false;
            if (contractType === 'ERC20' && !initialSupply) return false;
            return true;
        }
        if (activeTab === 'ownership') {
            return !!owner && owner.startsWith('0x') && owner.length === 42;
        }
        if (activeTab === 'features') {
            if (contractType === 'ERC20') return true;
            if (mintAccessMode === 'PublicWithWalletLimit' && !walletMintLimit) return false;
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

    const renderFormContent = () => {
        const renderUriInput = () => (
            <div className="input-group">
                <label className="input-label">Metadata URI (Optional)</label>
                <input
                    className="input"
                    value={uri}
                    onChange={e => setUri(e.target.value)}
                    placeholder={contractType === 'ERC1155' && tokenModel === 'perToken' ? 'https://example.com/metadata/{id}.json' : 'https://example.com/metadata.json'}
                />
                <div className={styles.fieldHint}>
                    {contractType === 'ERC1155' && tokenModel === 'perToken'
                        ? 'URI pattern where {id} is replaced with token ID'
                        : 'Base URI for the metadata (JSON)'}
                </div>

                <div style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                    <button
                        className="btn btn-ghost"
                        style={{ fontSize: '13px', padding: '6px 12px', height: 'auto', color: 'var(--accent)' }}
                        onClick={() => setShowGenerator(!showGenerator)}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '6px' }}>{showGenerator ? 'close' : 'auto_awesome'}</span>
                        {showGenerator ? 'Cancel Metadata Creator' : 'Create Metadata (Upload Image)'}
                    </button>

                    {showGenerator && (
                        <div className="fade-in" style={{ marginTop: '12px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Create Metadata</h4>

                            <div style={{ marginBottom: '12px' }}>
                                <label className="input-label" style={{ fontSize: '12px' }}>Image *</label>
                                <input
                                    type="file"
                                    accept="image/png, image/jpeg, image/gif"
                                    onChange={(e) => setGenImage(e.target.files?.[0] || null)}
                                    style={{ fontSize: '13px' }}
                                />
                            </div>

                            <div style={{ marginBottom: '12px' }}>
                                <label className="input-label" style={{ fontSize: '12px' }}>Name (Optional)</label>
                                <input
                                    className="input"
                                    style={{ fontSize: '13px', padding: '8px' }}
                                    value={genName}
                                    onChange={e => setGenName(e.target.value)}
                                    placeholder={name || "Token Name"}
                                />
                            </div>

                            <div style={{ marginBottom: '12px' }}>
                                <label className="input-label" style={{ fontSize: '12px' }}>Description (Optional)</label>
                                <textarea
                                    className="input"
                                    style={{ fontSize: '13px', padding: '8px', minHeight: '60px' }}
                                    value={genDescription}
                                    onChange={e => setGenDescription(e.target.value)}
                                    placeholder="Describe your asset..."
                                />
                            </div>

                            {genError && <div style={{ color: '#ef4444', fontSize: '12px', marginBottom: '12px' }}>{genError}</div>}

                            <button
                                className="btn btn-primary"
                                style={{ width: '100%', fontSize: '13px' }}
                                onClick={handleGenerate}
                                disabled={isGenerating || !genImage}
                            >
                                {isGenerating ? 'Uploading to IPFS...' : 'Generate & Fill URI'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );

        return (
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
                        {contractType !== 'ERC1155' && (
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
                        )}
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
                        {contractType === 'ERC1155' && (
                            <>
                                <div className={styles.featuresSection}>
                                    <h3 className={styles.sectionTitle}>Token Metadata Model</h3>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            flex: 1,
                                            padding: '16px',
                                            border: tokenModel === 'shared' ? '2px solid var(--accent)' : '1px solid var(--border)',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            background: tokenModel === 'shared' ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                                            transition: 'all 0.2s'
                                        }}>
                                            <input
                                                type="radio"
                                                name="tokenModel"
                                                value="shared"
                                                checked={tokenModel === 'shared'}
                                                onChange={() => setTokenModel('shared')}
                                                style={{ marginTop: '2px', marginRight: '12px' }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                                                    Shared Metadata
                                                </div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                                                    One base URI for all token IDs
                                                </div>
                                            </div>
                                        </label>
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            flex: 1,
                                            padding: '16px',
                                            border: tokenModel === 'perToken' ? '2px solid var(--accent)' : '1px solid var(--border)',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            background: tokenModel === 'perToken' ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                                            transition: 'all 0.2s'
                                        }}>
                                            <input
                                                type="radio"
                                                name="tokenModel"
                                                value="perToken"
                                                checked={tokenModel === 'perToken'}
                                                onChange={() => setTokenModel('perToken')}
                                                style={{ marginTop: '2px', marginRight: '12px' }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                                                    Per-ID Metadata
                                                </div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                                                    URI pattern with {'{id}'} placeholder
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                                {renderUriInput()}
                            </>
                        )}
                        {contractType === 'ERC721' && renderUriInput()}
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
                                {(contractType === 'ERC20' || contractType === 'ERC1155') && (
                                    <FeatureToggle
                                        label="Mintable"
                                        description={contractType === 'ERC20' ? "Owner can mint more tokens later" : "Allow creating new tokens after deployment"}
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

                        {contractType === 'ERC20' && (
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
                                {maxSupply && initialSupply && Number(maxSupply) < Number(initialSupply) && (
                                    <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                                        Max supply cannot be less than initial supply ({Number(initialSupply).toLocaleString()})
                                    </div>
                                )}
                            </div>
                        )}

                        {(contractType === 'ERC721' || contractType === 'ERC1155') && (
                            <>
                                <div className="input-group">
                                    <label className="input-label">Minting Access</label>
                                    <select
                                        className="input"
                                        value={mintAccessMode}
                                        onChange={e => setMintAccessMode(e.target.value as MintAccessMode)}
                                        disabled={contractType === 'ERC1155' && !mintable}
                                    >
                                        <option value="OnlyOwner">Only Owner</option>
                                        <option value="Public">Public (Anyone)</option>
                                        <option value="PublicWithWalletLimit">Public with Wallet Limit</option>
                                    </select>
                                    {contractType === 'ERC1155' && !mintable && (
                                        <div className={styles.fieldHint} style={{ color: 'var(--text-tertiary)' }}>
                                            Enable minting to configure access rules
                                        </div>
                                    )}
                                </div>

                                {mintAccessMode === 'PublicWithWalletLimit' && (
                                    <div className="input-group">
                                        <label className="input-label">Wallet Mint Limit</label>
                                        <input
                                            className="input"
                                            type="number"
                                            value={walletMintLimit}
                                            onChange={e => setWalletMintLimit(e.target.value)}
                                            placeholder="10"
                                        />
                                        <div className={styles.fieldHint}>Maximum tokens per wallet address</div>
                                    </div>
                                )}

                                {contractType === 'ERC721' && (
                                    <div className="input-group">
                                        <label className="input-label">Max Supply (Optional)</label>
                                        <input
                                            className="input"
                                            type="number"
                                            value={maxSupply}
                                            onChange={e => setMaxSupply(e.target.value)}
                                            placeholder="Leave empty for unlimited"
                                            min="0"
                                        />
                                    </div>
                                )}

                                {contractType === 'ERC1155' && (
                                    <div className="input-group">
                                        <label className="input-label">Max Supply Per Token ID (Optional)</label>
                                        <input
                                            className="input"
                                            type="number"
                                            value={maxSupplyPerToken}
                                            onChange={e => setMaxSupplyPerToken(e.target.value)}
                                            placeholder="Leave empty for unlimited"
                                            min="0"
                                        />
                                        <div className={styles.fieldHint}>Each token ID can be minted up to this amount</div>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        );
    };

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
                {(contractType === 'ERC721' || contractType === 'ERC1155') ? (
                    <div className={styles.configLayout}>
                        {renderFormContent()}
                        <div className={styles.previewSection}>
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                {contractType === 'ERC1155' && (
                                    <div style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        padding: '4px 8px',
                                        background: 'rgba(139, 92, 246, 0.15)',
                                        border: '1px solid rgba(139, 92, 246, 0.3)',
                                        borderRadius: '4px',
                                        color: 'var(--accent)',
                                        textAlign: 'center',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        marginBottom: '12px'
                                    }}>
                                        {tokenModel === 'shared' ? 'Shared Metadata' : 'Per-ID Metadata'}
                                    </div>
                                )}
                                <NftPreviewCard
                                    name={name || (contractType === 'ERC1155' ? 'Token Example' : 'Unnamed Collection')}
                                    metadata={{
                                        ...SHARED_NFT_METADATA,
                                        name: (contractType === 'ERC1155' || contractType === 'ERC721') && previewMetadata?.name ? previewMetadata.name : undefined,
                                        image: (contractType === 'ERC1155' || contractType === 'ERC721')
                                            ? (previewMetadata?.image || DEFAULT_METADATA_IMAGE)
                                            : SHARED_NFT_METADATA.image,
                                        description: (contractType === 'ERC1155' || contractType === 'ERC721')
                                            ? (previewMetadata?.description || 'Collection deployed on Arc.')
                                            : SHARED_NFT_METADATA.description
                                    }}
                                />
                                <p className={styles.helperText} style={{ marginTop: '16px', maxWidth: '300px', textAlign: 'center' }}>
                                    {contractType === 'ERC1155'
                                        ? 'Representative token from your multi-token collection'
                                        : 'All NFTs in this collection share the same preview and metadata'}
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
