'use client';

import { ArcLogo } from './ArcLogo';
import styles from './WizardShareCard.module.css';

export interface WizardShareCardProps {
    action: string;           // "NFT Deployed", "Token Created"
    title: string;            // NFT name or token name
    address: string;          // Contract address
    network: string;          // "Arc Testnet"
    imageUrl?: string;        // NFT image or visual
    timestamp?: Date;
}

export function WizardShareCard({
    action,
    title,
    address,
    network,
    imageUrl,
    timestamp,
}: WizardShareCardProps) {
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    const displayDate = timestamp ? timestamp.toLocaleDateString() : new Date().toLocaleDateString();

    return (
        <div className={styles.card} id="wizard-share-card">
            {/* Logo in top right */}
            <div className={styles.logo}>
                <ArcLogo width={40} height={42} />
            </div>

            {/* Main content */}
            <div className={styles.content}>
                {/* Image section: Only for ERC721 / NFTs */}
                {imageUrl && (
                    <div className={styles.imageContainer}>
                        <img src={imageUrl} alt={title} className={styles.image} />
                    </div>
                )}

                {/* Action label */}
                <div className={styles.action}>{action.toUpperCase()}</div>

                {/* Title */}
                <h1 className={styles.title}>{title}</h1>

                {/* Address */}
                <div className={styles.addressSection}>
                    <div className={styles.addressLabel}>Contract Address</div>
                    <div className={styles.address}>{shortAddress}</div>
                </div>

                {/* Network */}
                <div className={styles.network}>{network}</div>

                {/* Footer */}
                <div className={styles.footer}>
                    Built with Arc Deploy Wizard · @0xshawtyy
                </div>
            </div>
        </div>
    );
}
