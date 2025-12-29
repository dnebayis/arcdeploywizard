import React from 'react';
import styles from './GlobalFooter.module.css';

export function GlobalFooter() {
    return (
        <footer className={styles.footer}>
            <p className={styles.text}>
                Built with Arc Deploy Wizard · <a href="https://x.com/0xshawtyy" target="_blank" rel="noopener noreferrer" className={styles.link}>@0xshawtyy</a> · <a href="https://docs.arc.network/arc/concepts/welcome-to-arc" target="_blank" rel="noopener noreferrer" className={styles.link}>Learn Arc</a>
            </p>
        </footer>
    );
}
