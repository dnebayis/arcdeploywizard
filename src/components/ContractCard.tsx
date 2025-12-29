'use client';

import { CONTRACT_TEMPLATES, ContractType } from '@/lib/arcConfig';
import styles from './ContractCard.module.css';

interface ContractCardProps {
    type: ContractType;
    selected?: boolean;
    onSelect: (type: ContractType) => void;
}

export function ContractCard({ type, selected, onSelect }: ContractCardProps) {
    const template = CONTRACT_TEMPLATES[type];

    return (
        <button
            className={`${styles.card} ${selected ? styles.selected : ''}`}
            onClick={() => onSelect(type)}
        >
            <div className={styles.icon}>
                <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>{template.icon}</span>
            </div>
            <div className={styles.content}>
                <h3 className={styles.title}>{template.name}</h3>
                <p className={styles.description}>{template.description}</p>
            </div>
            <div className={styles.arrow}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_forward</span>
            </div>
        </button>
    );
}
