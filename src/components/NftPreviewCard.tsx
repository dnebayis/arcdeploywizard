'use client';

import { useState, useEffect } from 'react';
import styles from './NftPreviewCard.module.css';

interface NftPreviewCardProps {
    name: string;
    metadata?: {
        name?: string;
        description?: string;
        image?: string;
    };
}

export function NftPreviewCard({ name, metadata }: NftPreviewCardProps) {
    // Convert IPFS URI to HTTP gateway if needed
    const getImageUrl = (imageUri: string | undefined): string => {
        if (!imageUri) return '';

        // If already HTTP, return as-is
        if (imageUri.startsWith('http')) return imageUri;

        // Convert ipfs:// to gateway URL
        if (imageUri.startsWith('ipfs://')) {
            const hash = imageUri.replace('ipfs://', '');
            return `https://ipfs.io/ipfs/${hash}`;
        }

        return imageUri;
    };

    const imageUrl = getImageUrl(metadata?.image);

    return (
        <div className={styles.card}>
            <div className={styles.imageContainer}>
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={name || 'NFT Preview'}
                        className={styles.image}
                        onError={(e) => {
                            // Hide broken image, show placeholder
                            e.currentTarget.style.display = 'none';
                            const placeholder = e.currentTarget.parentElement?.querySelector(`.${styles.placeholder}`);
                            if (placeholder) {
                                (placeholder as HTMLElement).style.display = 'flex';
                            }
                        }}
                    />
                ) : null}
                <div className={styles.placeholder} style={{ display: imageUrl ? 'none' : 'flex' }}>
                    <svg
                        width="64"
                        height="64"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                    >
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                    </svg>
                </div>
            </div>

            <div className={styles.content}>
                <h3 className={styles.name}>{name || 'Unnamed Collection'}</h3>
                {metadata?.description && (
                    <p className={styles.description}>{metadata.description}</p>
                )}
            </div>
        </div>
    );
}
