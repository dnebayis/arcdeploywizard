'use client';

import { useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { ContractType } from '@/lib/arcConfig';
import { CONFIGURABLEERC20_ABI } from '@/lib/abis/ConfigurableERC20';
import { CONFIGURABLEERC721_ABI } from '@/lib/abis/ConfigurableERC721';
import { CONFIGURABLEERC1155_ABI } from '@/lib/abis/ConfigurableERC1155';
import styles from '@/app/page.module.css';

interface RolesTabProps {
    contractAddress: `0x${string}`;
    contractType: ContractType;
}

interface RoleInfo {
    name: string;
    description: string;
    hash: string;
    held: boolean;
}

export function RolesTab({ contractAddress, contractType }: RolesTabProps) {
    const { address } = useAccount();
    const publicClient = usePublicClient();
    const [roles, setRoles] = useState<RoleInfo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!publicClient || !address) return;

        const checkRoles = async () => {
            try {
                setLoading(true);

                // ERC20 and ERC721 use Ownable, not AccessControl
                if (contractType === 'ERC20' || contractType === 'ERC721') {
                    const abi = contractType === 'ERC20' ? CONFIGURABLEERC20_ABI : CONFIGURABLEERC721_ABI;
                    const owner = await publicClient.readContract({
                        address: contractAddress,
                        abi,
                        functionName: 'owner'
                    }) as string;

                    const isOwner = owner.toLowerCase() === address?.toLowerCase();

                    setRoles([{
                        name: 'CONTRACT_OWNER',
                        description: 'Full administrative control over the contract. Can mint, pause, and transfer ownership.',
                        hash: 'Ownable',
                        held: isOwner
                    }]);
                    return;
                }

                // ERC1155 uses AccessControl
                const abi = CONFIGURABLEERC1155_ABI;

                const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
                const MINTER_ROLE = '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6';
                const PAUSER_ROLE = '0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a';

                const roleDefinitions = [
                    {
                        name: 'DEFAULT_ADMIN_ROLE',
                        description: 'Can grant and revoke roles. Full administrative control over the contract.',
                        hash: DEFAULT_ADMIN_ROLE
                    },
                    {
                        name: 'MINTER_ROLE',
                        description: 'Can create new tokens. Required for minting operations.',
                        hash: MINTER_ROLE
                    },
                    {
                        name: 'PAUSER_ROLE',
                        description: 'Can pause and unpause token transfers. Emergency control capability.',
                        hash: PAUSER_ROLE
                    }
                ];

                const roleChecks = await Promise.all(
                    roleDefinitions.map(async (role) => {
                        try {
                            const hasRole = await publicClient.readContract({
                                address: contractAddress,
                                abi: abi as any,
                                functionName: 'hasRole',
                                args: [role.hash as `0x${string}`, address]
                            }) as boolean;
                            return { ...role, held: hasRole };
                        } catch (e) {
                            return { ...role, held: false };
                        }
                    })
                );

                setRoles(roleChecks);
            } catch (e) {
                console.error('Failed to check roles:', e);
            } finally {
                setLoading(false);
            }
        };

        checkRoles();
    }, [publicClient, contractAddress, contractType, address]);

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div className={styles.spinner}>
                    <svg className={styles.spinnerSvg} viewBox="0 0 50 50">
                        <circle cx="25" cy="25" r="20" fill="none" strokeWidth="4" stroke="var(--accent)" />
                    </svg>
                </div>
                <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Checking role permissions...</p>
            </div>
        );
    }

    const heldRoles = roles.filter(r => r.held);

    return (
        <div style={{ maxWidth: '900px' }}>
            {/* User's Roles Summary */}
            <div style={{
                padding: '20px',
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                marginBottom: '32px'
            }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Your Permissions</h3>
                {heldRoles.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {heldRoles.map(role => (
                            <div
                                key={role.name}
                                style={{
                                    padding: '8px 16px',
                                    background: 'rgba(16, 185, 129, 0.15)',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                    borderRadius: '99px',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: '#10b981',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                                {role.name}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        You do not hold any roles on this contract.
                    </div>
                )}
            </div>

            {/* All Roles */}
            <div>
                <h3 style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: 'var(--text-secondary)',
                    marginBottom: '16px'
                }}>
                    Contract Roles
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {roles.map(role => (
                        <div
                            key={role.name}
                            style={{
                                padding: '24px',
                                background: 'var(--bg-secondary)',
                                borderRadius: '12px',
                                border: `1px solid ${role.held ? 'rgba(16, 185, 129, 0.3)' : 'var(--border)'}`
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '24px', color: role.held ? '#10b981' : 'var(--text-tertiary)' }}>
                                        {role.held ? 'verified_user' : 'shield'}
                                    </span>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{role.name}</h4>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                            {role.description}
                                        </p>
                                    </div>
                                </div>
                                <div style={{
                                    padding: '4px 10px',
                                    background: role.held ? 'rgba(16, 185, 129, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                                    color: role.held ? '#10b981' : '#6b7280',
                                    borderRadius: '99px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase'
                                }}>
                                    {role.held ? 'Granted' : 'Not Granted'}
                                </div>
                            </div>
                            <div style={{
                                padding: '12px',
                                background: 'var(--bg-primary)',
                                borderRadius: '6px',
                                fontFamily: 'monospace',
                                fontSize: '11px',
                                color: 'var(--text-tertiary)',
                                wordBreak: 'break-all'
                            }}>
                                {role.hash}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Info Note */}
            <div style={{
                marginTop: '32px',
                padding: '16px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '8px',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                display: 'flex',
                gap: '12px'
            }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#3b82f6' }}>info</span>
                <div>
                    Role management is read-only in this interface. To grant or revoke roles, use a contract interaction tool like Etherscan or directly call the contract's grantRole() function.
                </div>
            </div>
        </div>
    );
}
