'use client';

import { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { WalletConnect } from '@/components/WalletConnect';
import { ContractCard } from '@/components/ContractCard';
import { GasPreview } from '@/components/GasPreview';
import { ArcLogo } from '@/components/ArcLogo';
import { ContractType, CONTRACT_TEMPLATES, SHARED_NFT_METADATA } from '@/lib/arcConfig';
import { estimateDeploymentCost } from '@/lib/estimateGas';
import { deployContract } from '@/lib/deploy';
import { generateShareCard, downloadShareCard } from '@/lib/shareCard';
import { shareOnTwitter, generateTweetText } from '@/lib/twitter';
import { saveDeployment } from '@/lib/deployHistory';
import { WizardShareCard } from '@/components/WizardShareCard';
import { ConfigurationWizard } from '@/components/ConfigurationWizard';
import { RealityCheckStep } from '@/components/RealityCheckStep';
import { DeploymentData } from '@/lib/contractFactory';
import { useAllowanceScanner } from '@/hooks/useAllowanceScanner';
import styles from '@/app/page.module.css';

type Step = 'landing' | 'select' | 'configure' | 'reality-check' | 'preview' | 'deploying' | 'success' | 'scanner';

export function WizardFlow({ initialContract }: { initialContract?: ContractType }) {
    const { isConnected, address } = useAccount();
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();

    const [step, setStep] = useState<Step>(() => {
        if (initialContract === 'RISK_SCANNER') return 'scanner';
        if (initialContract) return 'configure';
        return 'landing';
    });
    const [selectedContract, setSelectedContract] = useState<ContractType | null>(initialContract || null);
    const [params, setParams] = useState<Record<string, string>>({});
    const [gasData, setGasData] = useState<any>(null);
    const [deployedData, setDeployedData] = useState<{ address: string; txHash: string } | null>(null);
    const [deploying, setDeploying] = useState(false);
    const [preparedDeployment, setPreparedDeployment] = useState<DeploymentData | null>(null);
    const [realityCheckAcknowledged, setRealityCheckAcknowledged] = useState(false);


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
        setPreparedDeployment(null);

        if (type === 'RISK_SCANNER') {
            if (!address) return;
            setStep('scanner');
        }
    };

    const handleContinueToParams = () => {
        if (selectedContract === 'RISK_SCANNER') {
            setStep('scanner');
        } else if (selectedContract) {
            setStep('configure');
        }
    };

    const handleConfigComplete = async (data: DeploymentData, options: any) => {
        setPreparedDeployment(data);
        setParams(options); // Store params for display/sharing

        // Move to reality check step instead of directly to preview
        setStep('reality-check');
    };

    const handleRealityCheckContinue = async () => {
        if (!publicClient || !preparedDeployment) return;

        // Calculate gas
        const estimation = await estimateDeploymentCost(publicClient, preparedDeployment.bytecode);
        setGasData(estimation);

        setStep('preview');
    };

    const handleDeploy = async () => {
        if (!selectedContract || !walletClient || !publicClient || !gasData || !preparedDeployment) return;

        setDeploying(true);
        setStep('deploying');

        try {
            const { abi, bytecode, args } = preparedDeployment;

            const result = await deployContract(
                walletClient,
                publicClient,
                selectedContract,
                abi,
                bytecode,
                args
            );

            setDeployedData(result);

            // Convert BigInt values to strings for storage
            const serializableArgs = args.map((arg: any) =>
                typeof arg === 'bigint' ? arg.toString() : arg
            );

            if (address) {
                saveDeployment({
                    txHash: result.txHash,
                    contractAddress: result.address,
                    timestamp: Date.now(),
                    wizardType: selectedContract,
                    contractName: params.name || 'Contract',
                    tokenSymbol: params.symbol,
                    initialSupply: params.initialSupply,
                    nftImageUrl: (selectedContract === 'ERC721' || selectedContract === 'ERC1155') ? params.image : undefined,
                    deployedBy: address,
                    network: 'Arc Testnet',
                    constructorArgs: serializableArgs, // Store for verification
                    wizardMetadata: (selectedContract === 'ERC721' || selectedContract === 'ERC1155') && params.uri ? {
                        uri: params.uri,
                        image: params.image || SHARED_NFT_METADATA.image,
                        name: params.name || '',
                        description: params.description || ''
                    } : undefined
                });
            }

            // Automatically verify contract on ArcScan
            // Run in background - don't block success screen
            setTimeout(async () => {
                try {
                    console.log('[Auto-Verify] Starting verification for', result.address);

                    const response = await fetch('/api/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contractAddress: result.address,
                            constructorArgs: serializableArgs  // Use same args as deployment
                        })
                    });
                    const data = await response.json();
                    if (data.success) {
                        console.log('[Auto-Verify] Success:', data.message);
                    } else {
                        console.warn('[Auto-Verify] Failed:', data.error);
                    }
                } catch (error) {
                    console.error('[Auto-Verify] Error:', error);
                }
            }, 5000); // Wait 5 seconds for blockchain indexing

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
        setPreparedDeployment(null);
        setRealityCheckAcknowledged(false);
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
            return (
                <ConfigurationWizard
                    contractType={selectedContract}
                    initialValues={params}
                    onBack={() => setStep('select')}
                    onComplete={handleConfigComplete}
                />
            );
        }

        if (step === 'reality-check' && selectedContract) {
            return (
                <RealityCheckStep
                    contractType={selectedContract}
                    params={params}
                    userAddress={address}
                    acknowledged={realityCheckAcknowledged}
                    onAcknowledgedChange={setRealityCheckAcknowledged}
                    onBack={() => setStep('configure')}
                    onContinue={handleRealityCheckContinue}
                />
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
                            onClick={() => setStep('reality-check')}
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
                                            type: selectedContract === 'ERC721' ? 'ERC721' : selectedContract === 'ERC1155' ? 'ERC1155' : 'ERC20',
                                            title: params.name || 'New Contract',
                                            symbol: params.symbol,
                                            address: deployedData.address,
                                            network: 'Arc Testnet'
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

                        {/* Public Mint Link - Show for NFTs with public minting */}
                        {(selectedContract === 'ERC721' || selectedContract === 'ERC1155') &&
                            (params.mintAccessMode === 'Public' || params.mintAccessMode === 'PublicWithWalletLimit') && (
                                <div className={styles.mintLinkSection}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--accent)' }}>link</span>
                                        <h3 className={styles.shareSectionTitle} style={{ margin: 0 }}>Public Mint Page</h3>
                                    </div>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
                                        Your collection allows public minting. Share this link for anyone to mint:
                                    </p>
                                    <div style={{
                                        padding: '12px 16px',
                                        background: 'var(--bg-secondary)',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        marginBottom: '12px'
                                    }}>
                                        <code style={{
                                            flex: 1,
                                            fontSize: '13px',
                                            color: 'var(--text-primary)',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {typeof window !== 'undefined' ? window.location.origin : ''}/mint/{deployedData.address}
                                        </code>
                                        <button
                                            className="btn btn-secondary"
                                            style={{ padding: '6px 12px', fontSize: '13px' }}
                                            onClick={() => {
                                                // Include metadata URI in the link to avoid RPC dependency
                                                const metadataParam = params.uri ? `?metadata=${encodeURIComponent(params.uri)}` : '';
                                                const mintUrl = `${window.location.origin}/mint/${deployedData.address}${metadataParam}`;
                                                navigator.clipboard.writeText(mintUrl);
                                            }}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>content_copy</span>
                                            Copy
                                        </button>
                                    </div>
                                    <button
                                        className="btn btn-secondary"
                                        style={{ width: '100%' }}
                                        onClick={() => {
                                            // Include metadata URI in the link to avoid RPC dependency
                                            const metadataParam = params.uri ? `?metadata=${encodeURIComponent(params.uri)}` : '';
                                            const mintUrl = `${window.location.origin}/mint/${deployedData.address}${metadataParam}`;
                                            const tweetText = `Mint is live 🚀\n${params.name || 'NFT Collection'}\nPublic mint now open on Arc Testnet\n\nMint here 👇\n${window.location.origin}/mint/${deployedData.address}\n\nBuilt with Arc Deploy Wizard`;
                                            shareOnTwitter(tweetText, mintUrl);
                                        }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                        </svg>
                                        Share Mint Link on X
                                    </button>
                                </div>
                            )}

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
                </div>
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
                        action={
                            selectedContract === 'ERC721' ? 'ERC721 NFT Deployed' : selectedContract === 'ERC1155' ? 'ERC1155 Multi-Token Deployed' : 'ERC20 Token Deployed'
                        }
                        title={params.name || 'New Contract'}
                        address={deployedData.address}
                        network="Arc Testnet"
                        imageUrl={(selectedContract === 'ERC721' || selectedContract === 'ERC1155') ? (params.image || SHARED_NFT_METADATA.image) : undefined}
                    />
                )}
            </div>
        </div>
    );
}
