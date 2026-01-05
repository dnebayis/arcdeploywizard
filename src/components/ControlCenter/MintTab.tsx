'use client';

import { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { ContractType } from '@/lib/arcConfig';
import { CONFIGURABLEERC20_ABI } from '@/lib/abis/ConfigurableERC20';
import { CONFIGURABLEERC721_ABI } from '@/lib/abis/ConfigurableERC721';
import { CONFIGURABLEERC1155_ABI } from '@/lib/abis/ConfigurableERC1155';
import styles from '@/app/page.module.css';

interface MintTabProps {
    contractAddress: `0x${string}`;
    contractType: ContractType;
}

export function MintTab({ contractAddress, contractType }: MintTabProps) {
    const { address } = useAccount();
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();

    const [canMint, setCanMint] = useState(false);
    const [isPublicMint, setIsPublicMint] = useState(false);
    const [checking, setChecking] = useState(true);
    const [minting, setMinting] = useState(false);

    // Form state
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [tokenId, setTokenId] = useState('');
    const [acknowledged, setAcknowledged] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!publicClient || !address) return;

        const checkMintPermission = async () => {
            try {
                setChecking(true);
                const abi = contractType === 'ERC20'
                    ? CONFIGURABLEERC20_ABI
                    : contractType === 'ERC721'
                        ? CONFIGURABLEERC721_ABI
                        : CONFIGURABLEERC1155_ABI;

                // Check if minting is enabled
                let mintingEnabled = false;
                if (contractType === 'ERC20' || contractType === 'ERC1155') {
                    mintingEnabled = await publicClient.readContract({
                        address: contractAddress,
                        abi,
                        functionName: 'mintable'
                    }) as boolean;
                } else {
                    mintingEnabled = true; // ERC721 always allows minting
                }

                if (!mintingEnabled) {
                    setCanMint(false);
                    setChecking(false);
                    return;
                }

                // Check mint access for NFTs
                if (contractType === 'ERC721' || contractType === 'ERC1155') {
                    try {
                        const mintAccessMode = await publicClient.readContract({
                            address: contractAddress,
                            abi,
                            functionName: 'mintAccessMode'
                        }) as number;

                        // 0 = OnlyOwner, 1 = Public, 2 = PublicWithWalletLimit
                        if (mintAccessMode === 1 || mintAccessMode === 2) {
                            setIsPublicMint(true);
                            setCanMint(true);
                        } else {
                            // Check if user is owner
                            const owner = await publicClient.readContract({
                                address: contractAddress,
                                abi,
                                functionName: 'owner'
                            }) as string;
                            setCanMint(owner.toLowerCase() === address.toLowerCase());
                        }
                    } catch (e) {
                        setCanMint(false);
                    }
                } else {
                    // For ERC20, check if user is owner (uses Ownable, not AccessControl)
                    try {
                        const owner = await publicClient.readContract({
                            address: contractAddress,
                            abi: CONFIGURABLEERC20_ABI,
                            functionName: 'owner'
                        }) as string;
                        setCanMint(owner.toLowerCase() === address.toLowerCase());
                    } catch (e) {
                        setCanMint(false);
                    }
                }
            } catch (e) {
                console.error('Failed to check mint permission:', e);
                setCanMint(false);
            } finally {
                setChecking(false);
            }
        };

        checkMintPermission();
    }, [publicClient, contractAddress, contractType, address]);

    const handleMint = async () => {
        if (!walletClient || !address) return;

        try {
            setMinting(true);
            setError('');
            setSuccess('');

            const abi = contractType === 'ERC20'
                ? CONFIGURABLEERC20_ABI
                : contractType === 'ERC721'
                    ? CONFIGURABLEERC721_ABI
                    : CONFIGURABLEERC1155_ABI;

            const to = (recipient || address) as `0x${string}`;

            let hash: `0x${string}`;

            if (contractType === 'ERC20') {
                const amountInWei = BigInt(amount) * BigInt(10 ** 18);
                hash = await walletClient.writeContract({
                    address: contractAddress,
                    abi: CONFIGURABLEERC20_ABI,
                    functionName: 'mint',
                    args: [to, amountInWei],
                    account: address
                });
            } else if (contractType === 'ERC721') {
                // ERC721 mint() has no args - mints to msg.sender
                hash = await walletClient.writeContract({
                    address: contractAddress,
                    abi: CONFIGURABLEERC721_ABI as any,
                    functionName: 'mint',
                    args: [],
                    account: address
                });
            } else {
                // ERC1155
                const id = BigInt(tokenId);
                const qty = BigInt(amount);
                hash = await walletClient.writeContract({
                    address: contractAddress,
                    abi: CONFIGURABLEERC1155_ABI,
                    functionName: 'mint',
                    args: [to, id, qty, '0x'],
                    account: address
                });
            }

            setSuccess(`Minting transaction submitted! Hash: ${hash.slice(0, 10)}...`);
            setRecipient('');
            setAmount('');
            setTokenId('');
            setAcknowledged(false);
        } catch (e: any) {
            console.error('Mint failed:', e);

            // Parse contract revert reasons
            let errorMessage = 'Minting failed';

            if (e.message) {
                if (e.message.includes('MaxSupplyReached')) {
                    errorMessage = 'Maximum supply reached - cannot mint more tokens';
                } else if (e.message.includes('TokenPaused')) {
                    errorMessage = 'Contract is paused - minting is disabled';
                } else if (e.message.includes('MintingNotAllowed')) {
                    errorMessage = 'Minting not allowed - check mint access settings';
                } else if (e.message.includes('WalletMintLimitReached')) {
                    errorMessage = 'You have reached your wallet mint limit';
                } else if (e.message.includes('user rejected')) {
                    errorMessage = 'Transaction rejected by user';
                } else {
                    errorMessage = e.message.substring(0, 200); // Show first 200 chars
                }
            }

            setError(errorMessage);
        } finally {
            setMinting(false);
        }
    };

    if (checking) {
        return (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div className={styles.spinner}>
                    <svg className={styles.spinnerSvg} viewBox="0 0 50 50">
                        <circle cx="25" cy="25" r="20" fill="none" strokeWidth="4" stroke="var(--accent)" />
                    </svg>
                </div>
                <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Checking minting permissions...</p>
            </div>
        );
    }

    if (!canMint) {
        return (
            <div style={{
                maxWidth: '600px',
                padding: '32px',
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                border: '1px solid var(--border)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#f59e0b' }}>lock</span>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Minting Not Available</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    You do not have permission to mint tokens from this contract. Minting is restricted to authorized addresses.
                </p>
            </div>
        );
    }

    const isFormValid = () => {
        if (!acknowledged) return false;
        if (contractType === 'ERC20') {
            return amount && Number(amount) > 0;
        }
        if (contractType === 'ERC721') {
            return true; // recipient is optional (defaults to user)
        }
        if (contractType === 'ERC1155') {
            return tokenId && amount && Number(amount) > 0;
        }
        return false;
    };

    return (
        <div style={{ maxWidth: '700px' }}>
            {/* Public Mint Badge */}
            {isPublicMint && (
                <div style={{
                    padding: '16px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '8px',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#f59e0b' }}>public</span>
                    <div>
                        <div style={{ fontWeight: 600, color: '#f59e0b', marginBottom: '4px' }}>Public Mint Enabled</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            Anyone can mint from this contract. Supply caps and limits apply.
                        </div>
                    </div>
                </div>
            )}

            {/* Mint Form */}
            <div style={{
                padding: '32px',
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
            }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                    Mint {contractType} Tokens
                </h3>

                {/* Recipient - Only for ERC20 */}
                {contractType === 'ERC20' && (
                    <div className="input-group">
                        <label className="input-label">Recipient Address (Optional)</label>
                        <input
                            className="input"
                            value={recipient}
                            onChange={e => setRecipient(e.target.value)}
                            placeholder={`Leave empty to mint to your address (${address?.slice(0, 6)}...)`}
                        />
                        <div className={styles.fieldHint}>
                            The address that will receive the minted tokens. Defaults to your wallet.
                        </div>
                    </div>
                )}

                {/* ERC20 Amount */}
                {contractType === 'ERC20' && (
                    <div className="input-group">
                        <label className="input-label">Amount</label>
                        <input
                            className="input"
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="1000"
                            min="0"
                        />
                        <div className={styles.fieldHint}>
                            Number of tokens to mint (in whole units, not wei).
                        </div>
                    </div>
                )}

                {/* ERC1155 Token ID and Amount */}
                {contractType === 'ERC1155' && (
                    <>
                        <div className="input-group">
                            <label className="input-label">Token ID</label>
                            <input
                                className="input"
                                type="number"
                                value={tokenId}
                                onChange={e => setTokenId(e.target.value)}
                                placeholder="1"
                                min="0"
                            />
                            <div className={styles.fieldHint}>
                                The token ID to mint. Each ID represents a distinct token type.
                            </div>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Amount</label>
                            <input
                                className="input"
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="10"
                                min="1"
                            />
                            <div className={styles.fieldHint}>
                                Number of tokens to mint for this token ID.
                            </div>
                        </div>
                    </>
                )}

                {/* Safety Warning */}
                <div style={{
                    padding: '16px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '8px',
                    display: 'flex',
                    gap: '12px'
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#ef4444' }}>warning</span>
                    <div style={{ flex: 1, fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <strong style={{ color: '#ef4444', display: 'block', marginBottom: '4px' }}>Irreversible Action</strong>
                        Minting creates new tokens on-chain and cannot be reversed. Verify recipient address and amounts before proceeding.
                    </div>
                </div>

                {/* Acknowledgment */}
                <label style={{ display: 'flex', alignItems: 'start', gap: '12px', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={acknowledged}
                        onChange={e => setAcknowledged(e.target.checked)}
                        style={{ marginTop: '2px' }}
                    />
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        I understand that minting is permanent and cannot be undone. I have verified the recipient address and amounts.
                    </span>
                </label>

                {/* Error/Success Messages */}
                {error && (
                    <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#ef4444', fontSize: '13px' }}>
                        {error}
                    </div>
                )}
                {success && (
                    <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', color: '#10b981', fontSize: '13px' }}>
                        {success}
                    </div>
                )}

                {/* Mint Button */}
                <button
                    className="btn btn-primary"
                    onClick={handleMint}
                    disabled={!isFormValid() || minting}
                    style={{ width: '100%' }}
                >
                    {minting ? 'Minting...' : `Mint ${contractType} Tokens`}
                </button>
            </div>
        </div>
    );
}
