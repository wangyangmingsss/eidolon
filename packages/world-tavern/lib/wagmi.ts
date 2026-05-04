import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import type { Chain } from 'viem';

const ogTestnet = {
  id: 16601,
  name: '0G Testnet',
  nativeCurrency: { name: 'OG', symbol: 'OG', decimals: 18 },
  rpcUrls: { default: { http: ['https://evmrpc-testnet.0g.ai'] } },
  blockExplorers: { default: { name: '0G Chainscan', url: 'https://chainscan-newton.0g.ai' } },
} as const satisfies Chain;

const ogMainnet = {
  id: 16661,
  name: '0G Mainnet',
  nativeCurrency: { name: 'OG', symbol: 'OG', decimals: 18 },
  rpcUrls: { default: { http: ['https://evmrpc.0g.ai'] } },
  blockExplorers: { default: { name: '0G Chainscan', url: 'https://chainscan.0g.ai' } },
} as const satisfies Chain;

const network = process.env.NEXT_PUBLIC_OG_NETWORK ?? 'testnet';
const chains = (network === 'mainnet' ? [ogMainnet] : [ogTestnet]) as readonly [Chain, ...Chain[]];

export const wagmiConfig = getDefaultConfig({
  appName: 'Eidolon — The Crooked Lantern',
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'eidolon-tavern',
  chains,
  ssr: true,
});
