'use client';

import { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { WalletConnect } from '@/components/WalletConnect';
import { ContractCard } from '@/components/ContractCard';
import { GasPreview } from '@/components/GasPreview';
import { NftPreviewCard } from '@/components/NftPreviewCard';
import { ArcLogo } from '@/components/ArcLogo';
import { ContractType, CONTRACT_TEMPLATES, SHARED_NFT_METADATA } from '@/lib/arcConfig';
import { estimateDeploymentCost, formatConstructorParams } from '@/lib/estimateGas';
import { deployContract, getContractABI, getContractBytecode } from '@/lib/deploy';
import { generateShareCard, downloadShareCard } from '@/lib/shareCard';
import { shareOnTwitter, generateTweetText } from '@/lib/twitter';
import { saveDeployment } from '@/lib/deployHistory';
import { WizardShareCard } from '@/components/WizardShareCard';
import { useAllowanceScanner } from '@/hooks/useAllowanceScanner';
import styles from './page.module.css';

type Step = 'landing' | 'select' | 'configure' | 'preview' | 'deploying' | 'success' | 'scanner';

export default function Home() {
    const { isConnected, address } = useAccount();
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();

    const [step, setStep] = useState<Step>('landing');
    const [selectedContract, setSelectedContract] = useState<ContractType | null>(null);
    const [params, setParams] = useState<Record<string, string>>({});
    const [gasData, setGasData] = useState<any>(null);
    const [deployedData, setDeployedData] = useState<{ address: string; txHash: string } | null>(null);
    const [deploying, setDeploying] = useState(false);


    const {
        scan,
        results: scanResults,
        isScanning,
        revoke,
        revokingId,
        scanError
    } = useAllowanceScanner(address);


    useEffect(() => {
        if (step === 'scanner' && !scanResults && !isScanning && !scanError && address) {
            scan();
        }
    }, [step, address, scanResults, isScanning, scan, scanError]);

    const handleSelectContract = async (type: ContractType) => {
        setSelectedContract(type);
        setParams({});

        if (type === 'RISK_SCANNER') {
            if (!address) return;
            setStep('scanner');
        }
    };

    const handleContinueToParams = () => {
        if (selectedContract) {
            setStep('configure');
        }
    };

    const handleParamChange = (name: string, value: string) => {
        setParams(prev => ({ ...prev, [name]: value }));
    };

    const handlePreview = async () => {
        if (!selectedContract || !publicClient) return;

        setStep('preview');


        const bytecode = getContractBytecode(selectedContract) as `0x${string}`;


        const estimation = await estimateDeploymentCost(publicClient, bytecode);
        setGasData(estimation);
    };

    const handleDeploy = async () => {
        if (!selectedContract || !walletClient || !publicClient || !gasData) return;

        setDeploying(true);
        setStep('deploying');

        try {
            const abi = getContractABI(selectedContract);
            const bytecode = getContractBytecode(selectedContract);
            const constructorArgs = formatConstructorParams(selectedContract, params);

            const result = await deployContract(
                walletClient,
                publicClient,
                selectedContract,
                abi,
                bytecode,
                constructorArgs
            );

            setDeployedData(result);


            if (address) {
                saveDeployment({
                    txHash: result.txHash,
                    contractAddress: result.address,
                    timestamp: Date.now(),
                    wizardType: selectedContract,
                    contractName: params.name || 'Contract',
                    tokenSymbol: params.symbol,
                    initialSupply: params.initialSupply,
                    nftImageUrl: selectedContract === 'ERC721' ? SHARED_NFT_METADATA.image : undefined,
                    deployedBy: address,
                    network: 'Arc Testnet',
                });
            }

            setStep('success');
        } catch (error: any) {
            console.error('Deployment failed:', error);
            alert(`Deployment failed: ${error.message}`);
            setStep('preview');
        } finally {
            setDeploying(false);
        }
    };

    const handleReset = () => {
        setStep('select');
        setSelectedContract(null);
        setParams({});
        setGasData(null);
        setDeployedData(null);
    };

    const renderStep = () => {

        if (step === 'landing') {
            return (
                <div className={`${styles.stepContainer} fade-in`}>
                    <div className={styles.hero}>
                        <h1 className={styles.heroTitle}>Arc Deploy Wizard</h1>
                        <p className={styles.heroSubtitle}>
                            Deploy smart contracts on Arc Testnet in minutes
                        </p>
                        {isConnected ? (
                            <button className="btn btn-primary" onClick={() => setStep('select')}>
                                Get Started
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
                            </button>
                        ) : (
                            <div className={styles.connectPrompt}>
                                <p className={styles.connectText}>Connect your wallet to begin</p>
                            </div>
                        )}
                    </div>
                </div>
            );
        }


        if (step === 'select') {
            return (
                <div className={`${styles.stepContainer} fade-in`}>
                    <div className={styles.stepHeader}>
                        <h2 className={styles.stepTitle}>Select Contract Type</h2>
                        <p className={styles.stepDescription}>Choose what you want to deploy</p>
                    </div>
                    <div className={styles.contractGrid}>
                        {(Object.keys(CONTRACT_TEMPLATES) as ContractType[]).map((type) => (
                            <ContractCard
                                key={type}
                                type={type}
                                selected={selectedContract === type}
                                onSelect={handleSelectContract}
                            />
                        ))}
                    </div>
                    <div className={styles.stepActions}>
                        <button className="btn btn-ghost" onClick={() => setStep('landing')}>
                            Back
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleContinueToParams}
                            disabled={!selectedContract}
                        >
                            Continue
                        </button>
                    </div>
                </div>
            );
        }


        if (step === 'configure' && selectedContract) {
            const template = CONTRACT_TEMPLATES[selectedContract];
            const allFieldsFilled = template.params.every(param => params[param.name]?.trim());

            return (
                <div className={`${styles.stepContainer} fade-in`}>
                    <div className={styles.stepHeader}>
                        <h2 className={styles.stepTitle}>Configure {template.name}</h2>
                        <p className={styles.stepDescription}>Set constructor parameters</p>
                    </div>


                    <div className={selectedContract === 'ERC721' ? styles.configLayout : ''}>
                        <div className={styles.form}>
                            {template.params.map(param => (
                                <div key={param.name} className="input-group">
                                    <label className="input-label">
                                        {param.label}
                                        {param.tooltip && (
                                            <span className="tooltip" title={param.tooltip}>?</span>
                                        )}
                                    </label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder={param.placeholder}
                                        value={params[param.name] || ''}
                                        onChange={(e) => handleParamChange(param.name, e.target.value)}
                                    />
                                    {param.tooltip && (
                                        <div className={styles.fieldHint}>{param.tooltip}</div>
                                    )}
                                </div>
                            ))}
                            {'helperText' in template && template.helperText && (
                                <p className={styles.helperText}>{template.helperText}</p>
                            )}
                        </div>

                        {selectedContract === 'ERC721' && (
                            <div className={styles.previewSection}>
                                <NftPreviewCard
                                    name={params.name || 'Unnamed Collection'}
                                    metadata={SHARED_NFT_METADATA}
                                />
                            </div>
                        )}
                    </div>

                    <div className={styles.stepActions}>
                        <button className="btn btn-ghost" onClick={() => setStep('select')}>
                            Back
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handlePreview}
                            disabled={!allFieldsFilled}
                        >
                            Preview Deployment
                        </button>
                    </div>
                </div>
            );
        }


        if (step === 'preview' && gasData) {
            return (
                <div className={`${styles.stepContainer} fade-in`}>
                    <div className={styles.stepHeader}>
                        <h2 className={styles.stepTitle}>Review Deployment</h2>
                        <p className={styles.stepDescription}>Estimated gas cost for deployment</p>
                    </div>
                    <GasPreview
                        gasEstimate={gasData.gasEstimate}
                        gasCostUSDC={gasData.gasCostUSDC}
                        bytecodeSize={gasData.bytecodeSize}
                        onDeploy={handleDeploy}
                        deploying={deploying}
                    />
                    <div className={styles.stepActions}>
                        <button
                            className="btn btn-ghost"
                            onClick={() => setStep('configure')}
                            disabled={deploying}
                        >
                            Back
                        </button>
                    </div>
                </div>
            );
        }


        if (step === 'scanner') {
            return (
                <div className={`${styles.stepContainer} fade-in`}>
                    <div className={styles.scannerHeader}>
                        <h2 className={styles.stepTitle}>Allowance Risk Scanner</h2>
                        <p className={styles.stepDescription}>
                            {isScanning ? 'Scanning your allowances...' : 'Review and revoke risky allowances'}
                        </p>
                    </div>

                    {isScanning ? (
                        <div className={styles.deployingState}>
                            <div className={styles.spinner}>
                                <svg className={styles.spinnerSvg} viewBox="0 0 50 50">
                                    <circle cx="25" cy="25" r="20" fill="none" strokeWidth="4" stroke="var(--accent)" strokeDasharray="80, 200" strokeLinecap="round" />
                                </svg>
                            </div>
                            <p className={styles.deployingText}>Analyzing on-chain data...</p>
                        </div>
                    ) : scanError ? (
                        <div className={styles.emptyStateContainer}>
                            <div className={styles.emptyState}>
                                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#ef4444', marginBottom: '16px' }}>error</span>
                                <h3 className={styles.emptyTitle}>Scan Failed</h3>
                                <p style={{ margin: '0 0 24px 0' }}>{scanError}</p>
                                <button className="btn btn-secondary" onClick={() => scan()}>Retry Scan</button>
                            </div>
                            <div className={styles.stepActions}>
                                <button className="btn btn-ghost" onClick={() => setStep('landing')}>
                                    Return to Home
                                </button>
                            </div>
                        </div>
                    ) : (scanResults && scanResults.length > 0) ? (
                        <div className={styles.scannerContainer}>
                            <div className={styles.riskList}>
                                {scanResults.map((item) => (
                                    <div key={item.id} className={styles.riskCard}>
                                        <div className={styles.cardHeader}>
                                            <div className={styles.tokenInfo}>
                                                <span className={styles.tokenName}>
                                                    {item.token.symbol}
                                                    <span style={{
                                                        fontSize: '10px',
                                                        marginLeft: '6px',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        background: 'var(--bg-tertiary)',
                                                        color: 'var(--text-secondary)'
                                                    }}>
                                                        {item.token.type}
                                                    </span>
                                                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 400, marginLeft: '4px' }}>
                                                        {item.token.name}
                                                    </span>
                                                </span>
                                                <span className={styles.spenderInfo}>
                                                    Spender: {item.spender.name || (item.spender.address.slice(0, 6) + '...' + item.spender.address.slice(-4))}
                                                    {item.spender.type !== 'Unknown' && ` (${item.spender.type})`}
                                                </span>
                                            </div>
                                            <span className={`${styles.riskBadge} ${styles[item.riskLevel === 'HIGH' ? 'riskHigh' : item.riskLevel === 'MEDIUM' ? 'riskMedium' : 'riskLow']}`}>
                                                {item.riskLevel} RISK
                                            </span>
                                        </div>

                                        <div className={styles.allowanceDetail}>
                                            <span className={styles.allowanceLabel}>Allowance</span>
                                            <span>
                                                {item.riskLevel === 'HIGH' && (item.reason === 'Unlimited allowance' || item.reason === 'Full collection access')
                                                    ? 'Unlimited Access'
                                                    : item.token.type === 'ERC20'
                                                        ? `${parseFloat(item.normalizedAllowance).toLocaleString()} ${item.token.symbol}`
                                                        : 'Approved'}
                                            </span>
                                        </div>

                                        <div className={styles.cardActions}>
                                            <button
                                                className={styles.btnRevoke}
                                                disabled={revokingId === item.id}
                                                onClick={() => revoke(item)}
                                            >
                                                {revokingId === item.id ? 'Revoking...' : 'Revoke Access'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className={styles.stepActions} style={{ justifyContent: 'center', marginTop: '20px' }}>
                                <button className="btn btn-ghost" onClick={() => setStep('landing')}>
                                    Return to Home
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.emptyStateContainer}>
                            <div className={styles.emptyState}>
                                <h3 className={styles.emptyTitle}>You're all set!</h3>
                                <p style={{ margin: 0 }}>No risky active allowances detected for your account.</p>
                            </div>
                            <div className={styles.stepActions}>
                                <button className="btn btn-ghost" onClick={() => setStep('landing')}>
                                    Return to Home
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            );
        }


        if (step === 'deploying') {
            return (
                <div className={`${styles.stepContainer} fade-in`}>
                    <div className={styles.deployingState}>
                        <div className={styles.spinner}>
                            <svg className={styles.spinnerSvg} viewBox="0 0 50 50">
                                <circle cx="25" cy="25" r="20" fill="none" strokeWidth="4" stroke="var(--accent)" strokeDasharray="80, 200" strokeLinecap="round" />
                            </svg>
                        </div>
                        <h2 className={styles.deployingTitle}>Deploying to Arc Testnet</h2>
                        <p className={styles.deployingText}>Please confirm the transaction in your wallet...</p>
                    </div>
                </div>
            );
        }


        if (step === 'success' && deployedData) {
            return (
                <div className={`${styles.stepContainer} fade-in`}>
                    <div className={styles.successState}>
                        <div className={styles.successIcon}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>
                        <h2 className={styles.successTitle}>Contract Deployed!</h2>
                        <p className={styles.successText}>Your contract has been deployed to Arc Testnet</p>

                        <div className={styles.successDetails}>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Contract Address</span>
                                <div className={styles.addressContainer}>
                                    <code className={styles.address}>{deployedData.address}</code>
                                    <button
                                        className={styles.copyBtn}
                                        onClick={() => navigator.clipboard.writeText(deployedData.address)}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Transaction Hash</span>
                                <div className={styles.addressContainer}>
                                    <code className={styles.address}>{deployedData.txHash}</code>
                                    <button
                                        className={styles.copyBtn}
                                        onClick={() => navigator.clipboard.writeText(deployedData.txHash)}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>


                        <div className={styles.shareSection}>
                            <h3 className={styles.shareSectionTitle}>Share Your Deployment</h3>
                            <div className={styles.shareButtons}>
                                <button
                                    className="btn btn-secondary"
                                    onClick={async () => {
                                        try {
                                            const dataUrl = await generateShareCard('wizard-share-card');
                                            downloadShareCard(dataUrl, `arc-wizard-${deployedData.address.slice(0, 8)}.png`);
                                        } catch (error) {
                                            console.error('Failed to generate share card:', error);
                                            alert('Failed to generate share image');
                                        }
                                    }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                                    Download PNG
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        if (!selectedContract) return;
                                        const tweetText = generateTweetText({
                                            type: selectedContract === 'ERC721' ? 'ERC721' : 'ERC20',
                                            title: params.name || 'New Contract',
                                            symbol: params.symbol,
                                            address: deployedData.address,
                                            network: 'Arc Testnet',
                                        });
                                        shareOnTwitter(tweetText, 'https://arc-wizard.vercel.app/');
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                    Share on X
                                </button>
                            </div>
                        </div>

                        <div className={styles.successActions}>
                            <a
                                href={`https://testnet.arcscan.app/address/${deployedData.address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-ghost"
                            >
                                View on Explorer
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>open_in_new</span>
                            </a>
                            <button className="btn btn-primary" onClick={handleReset}>
                                Deploy Another Contract
                            </button>
                        </div>
                    </div>
                </div >
            );
        }

        return null;
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
                        <a href="/history" style={{ fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none' }}>History</a>
                        <WalletConnect />
                        <a href="https://faucet.circle.com/" target="_blank" rel="noopener noreferrer" className="btn btn-ghost" title="Get Testnet USDC" style={{ padding: '6px', height: 'auto', color: 'var(--text-primary)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>water_drop</span>
                        </a>
                    </div>
                </div>
            </header>

            <main className={styles.main}>
                <div className={styles.mainContainer}>
                    {renderStep()}
                </div>
            </main>


            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                {deployedData && selectedContract && (
                    <WizardShareCard
                        action={selectedContract === 'ERC721' ? 'ERC721 NFT Deployed' : 'ERC20 Token Deployed'}
                        title={params.name || 'New Contract'}
                        address={deployedData.address}
                        network="Arc Testnet"
                        imageUrl={selectedContract === 'ERC721' ? SHARED_NFT_METADATA.image : undefined}
                    />
                )}
            </div>
        </div>
    );
}
