'use client';
import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { TerminalCard } from '@/components/TerminalCard';
import { listSoul, buySoul } from '@/lib/api-client';

export default function LandingWrapper() {
  return (
    <Suspense fallback={<main className="p-8 relative z-10">Loading...</main>}>
      <Landing />
    </Suspense>
  );
}

function Landing() {
  const params = useSearchParams();
  const router = useRouter();
  const { isConnected } = useAccount();

  const incomingToken = params.get('token');
  const [tokenId, setTokenId] = useState<string | null>(incomingToken);
  const [busy, setBusy] = useState(false);

  const onList = async () => {
    if (!tokenId) return;
    setBusy(true);
    try {
      await listSoul(tokenId, 0.1);
      alert('Listed for 0.1 OG.');
    } catch (e) {
      alert('List failed: ' + (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onBuy = async () => {
    if (!tokenId) return;
    setBusy(true);
    try {
      const r = await buySoul(tokenId, 0.1);
      alert('Drift complete. New owner: ' + r.owner);
      router.push(`/market?token=${tokenId}`);
    } catch (e) {
      alert('Buy failed: ' + (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onAwakenDirectly = () => {
    if (!tokenId) return;
    router.push(`/market?token=${tokenId}`);
  };

  return (
    <main className="min-h-screen p-6 relative z-10">
      <header className="mb-8">
        <h1 className="text-5xl glitch font-display tracking-wider">THE ECHO MARKET</h1>
        <p className="text-haze italic mt-2">
          // Listings update in real time. Drift in. Re-encrypt. Wake up new.
        </p>
      </header>

      <div className="mb-8"><ConnectButton /></div>

      {isConnected && (
        <TerminalCard className="max-w-2xl">
          <h2 className="text-rose mb-4 text-xl">// Soul Drift Console</h2>

          <label className="block mb-2 text-sm">Soul tokenId:</label>
          <input
            value={tokenId ?? ''}
            onChange={(e) => setTokenId(e.target.value)}
            placeholder="e.g. 1"
            className="w-full bg-void border border-neon px-3 py-2 mb-4 text-neon"
          />

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={onList}
              disabled={!tokenId || busy}
              className="px-4 py-2 border border-rose text-rose hover:shadow-rose disabled:opacity-50"
            >
              List for 0.1 OG
            </button>
            <button
              onClick={onBuy}
              disabled={!tokenId || busy}
              className="px-4 py-2 border border-amber text-amber hover:shadow-neon disabled:opacity-50"
            >
              Buy &amp; Drift In
            </button>
            <button
              onClick={onAwakenDirectly}
              disabled={!tokenId || busy}
              className="px-4 py-2 border border-neon hover:shadow-neon disabled:opacity-50"
            >
              Awaken (skip drift, dev only)
            </button>
          </div>

          {busy && <p className="mt-4 text-haze animate-pulse">Working...</p>}

          <p className="text-xs text-haze mt-6">
            Tip: list with one wallet, switch wallets, then buy. The Soul will re-encrypt
            to the new owner via the oracle. Then awaken in the Market.
          </p>
        </TerminalCard>
      )}
    </main>
  );
}
