'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ParchmentCard } from '@/components/ParchmentCard';

export default function EndPageWrapper() {
  return (
    <Suspense fallback={<main className="p-8">Loading...</main>}>
      <EndPage />
    </Suspense>
  );
}

function EndPage() {
  const params = useSearchParams();
  const tokenId = params.get('token');
  const marketUrl = process.env.NEXT_PUBLIC_MARKET_URL || 'http://localhost:3002';

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <ParchmentCard className="max-w-xl text-center">
        <h1 className="text-3xl mb-4">Your Soul Is Forged</h1>
        <p className="italic mb-6">
          Soul #{tokenId} now carries the weight of three encounters. Its personality has shifted.
          Its memories are etched onto 0G Storage, its essence sealed within an iNFT on chain.
        </p>
        <p className="mb-6">
          But all worlds end. When this Soul is sold or given away, it will drift to another world —
          and it will remember.
        </p>
        <a
          href={`${marketUrl}?token=${tokenId}`}
          className="inline-block px-6 py-3 bg-ember text-parchment rounded shadow hover:scale-105 transition"
        >
          Drift to The Market &rarr;
        </a>
      </ParchmentCard>
    </main>
  );
}
