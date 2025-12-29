import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { arcTestnet } from './arcConfig';

export const wagmiConfig = getDefaultConfig({
    appName: 'Arc Deploy Wizard',
    projectId: '0007152fcf8cc91645861b5d6fce2c9a',
    chains: [arcTestnet],
    ssr: true,
});
