'use client';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ParchmentCard } from '@/components/ParchmentCard';
import { mintSoulFromBrowser } from '@/lib/api-client';

export default function Landing() {
  const { isConnected, address } = useAccount();
  const router = useRouter();
  const [minting, setMinting] = useState(false);
  const [tokenId, setTokenId] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    const stored = window.localStorage.getItem(`eidolon:soul:${address.toLowerCase()}`);
    if (stored) setTokenId(stored);
  }, [address]);

  const onMint = async () => {
    if (!address) return;
    setMinting(true);
    try {
      const r = await mintSoulFromBrowser(address);
      window.localStorage.setItem(`eidolon:soul:${address.toLowerCase()}`, r.tokenId);
      setTokenId(r.tokenId);
    } catch (e) {
      alert('Mint failed: ' + (e as Error).message);
    } finally {
      setMinting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <ParchmentCard className="max-w-xl">
        <h1 className="text-4xl mb-4">The Crooked Lantern</h1>
        <p className="italic mb-6">
          A tavern at the edge of a forgotten kingdom. Step inside and forge a soul that will
          outlive the night — and remember everything.
        </p>
        <div className="mb-6"><ConnectButton /></div>
        {isConnected && !tokenId && (
          <button
            onClick={onMint}
            disabled={minting}
            className="px-6 py-3 bg-ember text-parchment rounded shadow hover:scale-105 transition disabled:opacity-50"
          >
            {minting ? 'Forging your Soul...' : 'Forge a Soul'}
          </button>
        )}
        {isConnected && tokenId && (
          <button
            onClick={() => router.push(`/tavern?token=${tokenId}`)}
            className="px-6 py-3 bg-ink text-parchment rounded shadow hover:scale-105 transition"
          >
            Enter the tavern as Soul #{tokenId}
          </button>
        )}
      </ParchmentCard>
    </main>
  );
}
