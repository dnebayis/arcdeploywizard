'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from '@/lib/wagmi';
import '@/styles/globals.css';
import { useState } from 'react';
import { Analytics } from '@vercel/analytics/next';

import { GlobalFooter } from '@/components/GlobalFooter';

// ... imports

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <html lang="en">
            <head>
                <title>Arc Deploy Wizard</title>
                <meta name="description" content="Deploy smart contracts on Arc Testnet in minutes" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap" crossOrigin="anonymous" />
            </head>
            <body>
                <WagmiProvider config={wagmiConfig}>
                    <QueryClientProvider client={queryClient}>
                        <RainbowKitProvider
                            theme={darkTheme({
                                accentColor: '#3b82f6',
                                accentColorForeground: 'white',
                                borderRadius: 'medium',
                                fontStack: 'system',
                                overlayBlur: 'small',
                            })}
                            modalSize="compact"
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                                <div style={{ flex: 1 }}>
                                    {children}
                                </div>
                                <GlobalFooter />
                            </div>
                        </RainbowKitProvider>
                    </QueryClientProvider>
                </WagmiProvider>
                <Analytics />
            </body>
        </html>
    );
}
