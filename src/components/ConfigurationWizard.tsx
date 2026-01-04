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
        return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    return url;
};

interface ConfigurationWizardProps {
    contractType: ContractType;
    initialValues?: Record<string, any>;
    onBack: () => void;
    onComplete: (data: DeploymentData, options: any) => void;
}

type Tab = 'basics' | 'ownership' | 'features';

export function ConfigurationWizard({ contractType, initialValues = {}, onBack, onComplete }: ConfigurationWizardProps) {
    const { address } = useAccount();
    const [activeTab, setActiveTab] = useState<Tab>(initialValues._activeTab || 'basics');

    // Common State
    const [name, setName] = useState(initialValues.name || '');
    const [symbol, setSymbol] = useState(initialValues.symbol || '');
    const [owner, setOwner] = useState(initialValues.owner || address || '');
    const [isCustomOwner, setIsCustomOwner] = useState(initialValues.isCustomOwner === 'true' || false);

    // Features
    const [burnable, setBurnable] = useState(
        initialValues.burnable !== undefined
            ? initialValues.burnable === true || initialValues.burnable === 'true'
            : contractType === 'ERC20'
    );
    const [pausable, setPausable] = useState(
        initialValues.pausable !== undefined
            ? initialValues.pausable === true || initialValues.pausable === 'true'
            : false
    );
    const [mintable, setMintable] = useState(
        initialValues.mintable !== undefined
            ? initialValues.mintable === true || initialValues.mintable === 'true'
            : true
    ); // ERC20 and ERC1155

    // Supply
    const [initialSupply, setInitialSupply] = useState(initialValues.initialSupply || '1000000'); // ERC20
    const [maxSupply, setMaxSupply] = useState(initialValues.maxSupply || ''); // Optional for ERC20 and ERC721

    // ERC721/ERC1155 Specific
    const [mintAccessMode, setMintAccessMode] = useState<MintAccessMode>(initialValues.mintAccessMode || 'Public');
    const [walletMintLimit, setWalletMintLimit] = useState(initialValues.walletMintLimit || '');

    // ERC1155 Specific

    const [uri, setUri] = useState(initialValues.uri || '');
    const [maxSupplyPerToken, setMaxSupplyPerToken] = useState(initialValues.maxSupplyPerToken || '');
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

        let isMounted = true;
        const fetchMetadata = async (attempt = 1) => {
            try {
                const resolvedUri = resolveIpfs(uri);
                if (!resolvedUri.startsWith('http')) return;

                const res = await fetch(resolvedUri);
                if (!res.ok) {
                    if (attempt < 3) {
                        console.log(`Metadata fetch attempt ${attempt} failed, retrying...`);
                        setTimeout(() => {
                            if (isMounted) fetchMetadata(attempt + 1);
                        }, 1000 * attempt);
                        return;
                    }
                    throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
                }
                const json = await res.json();
                if (json && isMounted) {
                    setPreviewMetadata({
                        ...json,
                        image: resolveIpfs(json.image)
                    });
                }
            } catch (e: any) {
                // Ignore AbortError and generic network errors (CORS) to avoid console noise
                if (e.name === 'AbortError') return;

                // Use warn instead of error to avoid Next.js overlay
                console.warn('Metadata fetch failed:', e.message || e);

                // Don't retry on fatal network/CORS errors
                if (e.message === 'Failed to fetch') return;
            }
        };

        const timeoutId = setTimeout(() => {
            fetchMetadata();
        }, 500);
        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
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
            onComplete(data, { ...options, _activeTab: activeTab });
        } else if (contractType === 'ERC1155') {
            const options: ERC1155Options = {
                name,
                uri,
                owner,
                tokenModel: 'shared',
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
                image: previewMetadata?.image || DEFAULT_METADATA_IMAGE,
                _activeTab: activeTab
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
                image: previewMetadata?.image || DEFAULT_METADATA_IMAGE,
                _activeTab: activeTab
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
                    placeholder="https://example.com/metadata.json"
                />
                <div className={styles.fieldHint}>
                    Base URI for the metadata (JSON)
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
                            <label className="input-label">{contractType === 'ERC20' ? 'Token Name' : 'Contract Name'}</label>
                            <input
                                className="input"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder={contractType === 'ERC20' ? "My Token" : "My Collection"}
                            />
                            {contractType === 'ERC20' && (
                                <div className={styles.fieldHint}>
                                    The human-readable name of your token.
                                </div>
                            )}
                            <div className={styles.fieldHint}>
                                <span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle' }}>lock</span>
                                {' '}Cannot be changed after deployment
                            </div>
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
                                {contractType === 'ERC20' && (
                                    <div className={styles.fieldHint}>
                                        The ticker symbol used to represent your token.
                                    </div>
                                )}
                                <div className={styles.fieldHint}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle' }}>lock</span>
                                    {' '}Cannot be changed after deployment
                                </div>
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
                                    min="0"
                                />
                                <div className={styles.fieldHint}>
                                    Number of tokens minted at deployment and sent to the owner address.
                                </div>
                                <div className={styles.fieldHint} style={{ marginTop: '4px' }}>
                                    Decimals are fixed at 18. {mintable && 'Owner can mint additional tokens later if mintable is enabled.'}
                                </div>
                            </div>
                        )}
                        {contractType === 'ERC1155' && renderUriInput()}
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
                                The address that owns this contract and has administrative privileges.
                            </div>
                            <div className={styles.fieldHint} style={{ marginTop: '4px' }}>
                                The owner can {contractType === 'ERC20' && mintable ? 'mint new tokens, ' : ''}{pausable ? 'pause transfers, ' : ''}and transfer ownership.
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
                                        description={contractType === 'ERC20' ? "Allows the owner to mint additional tokens after deployment" : "Allow creating new tokens after deployment"}
                                        icon="add_circle"
                                        checked={mintable}
                                        onChange={setMintable}
                                    />
                                )}
                                <FeatureToggle
                                    label="Burnable"
                                    description={contractType === 'ERC20' ? "Allows token holders to permanently destroy their tokens" : "Holders can destroy their tokens"}
                                    icon="local_fire_department"
                                    checked={burnable}
                                    onChange={setBurnable}
                                />
                                <FeatureToggle
                                    label="Pausable"
                                    description={contractType === 'ERC20' ? "Allows the owner to pause and unpause all token transfers" : "Owner can freeze all token transfers"}
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
                <div className={styles.configLayout}>
                    {renderFormContent()}
                    <div className={styles.previewSection}>
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            {(contractType === 'ERC721' || contractType === 'ERC1155') ? (
                                <div style={{
                                    position: 'sticky',
                                    top: '24px',
                                    width: '100%',
                                    maxWidth: '360px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '16px'
                                }}>
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
                                    <p className={styles.helperText} style={{ marginTop: '0', textAlign: 'center' }}>
                                        {contractType === 'ERC1155'
                                            ? 'Representative token from your multi-token collection'
                                            : 'All NFTs in this collection share the same preview and metadata'}
                                    </p>
                                </div>
                            ) : (
                                <div style={{
                                    position: 'sticky',
                                    top: '24px',
                                    padding: '24px',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border)',
                                    width: '100%',
                                    maxWidth: '320px'
                                }}>
                                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                                        <span className="material-symbols-outlined" style={{
                                            fontSize: '48px',
                                            color: 'var(--accent)',
                                            display: 'block',
                                            marginBottom: '12px'
                                        }}>
                                            token
                                        </span>
                                        <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {name || 'ERC20 Token'}
                                        </h4>
                                        {symbol && (
                                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                {symbol}
                                            </p>
                                        )}
                                    </div>

                                    {initialSupply && (
                                        <div style={{
                                            padding: '16px',
                                            background: 'var(--bg-tertiary)',
                                            borderRadius: '8px',
                                            marginBottom: '12px'
                                        }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
                                                Initial Supply
                                            </div>
                                            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent)' }}>
                                                {Number(initialSupply).toLocaleString()}
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                                        <div style={{
                                            padding: '12px 8px',
                                            background: 'var(--bg-tertiary)',
                                            borderRadius: '8px',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
                                                Mint
                                            </div>
                                            <div style={{ fontSize: '12px', fontWeight: 600, color: mintable ? 'var(--success)' : 'var(--text-tertiary)' }}>
                                                {mintable ? 'Yes' : 'No'}
                                            </div>
                                        </div>
                                        <div style={{
                                            padding: '12px 8px',
                                            background: 'var(--bg-tertiary)',
                                            borderRadius: '8px',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
                                                Burn
                                            </div>
                                            <div style={{ fontSize: '12px', fontWeight: 600, color: burnable ? 'var(--success)' : 'var(--text-tertiary)' }}>
                                                {burnable ? 'Yes' : 'No'}
                                            </div>
                                        </div>
                                        <div style={{
                                            padding: '12px 8px',
                                            background: 'var(--bg-tertiary)',
                                            borderRadius: '8px',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
                                                Pause
                                            </div>
                                            <div style={{ fontSize: '12px', fontWeight: 600, color: pausable ? 'var(--success)' : 'var(--text-tertiary)' }}>
                                                {pausable ? 'Yes' : 'No'}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{
                                        paddingTop: '16px',
                                        borderTop: '1px solid var(--border)',
                                        fontSize: '11px',
                                        color: 'var(--text-tertiary)',
                                        textAlign: 'center'
                                    }}>
                                        Configuration preview
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
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
