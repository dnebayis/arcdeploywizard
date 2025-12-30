import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'viem';
import { arcTestnet } from './arcConfig';

export const wagmiConfig = getDefaultConfig({
    appName: 'Arc Deploy Wizard',
    projectId: '0007152fcf8cc91645861b5d6fce2c9a',
    chains: [arcTestnet],
    transports: {
        [arcTestnet.id]: http('https://rpc.testnet.arc.network', {
            timeout: 30_000,
        }),
    },
    ssr: true,
});
