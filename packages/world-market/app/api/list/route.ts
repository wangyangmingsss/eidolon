import { NextRequest } from 'next/server';
import { listOnMarket, approveMarketplace } from '@eidolon/sdk';
import { parseEther } from 'viem';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { tokenId, priceOG } = await req.json();
  try {
    // Approve marketplace (idempotent)
    await approveMarketplace();
    const tx = await listOnMarket(BigInt(tokenId), parseEther(String(priceOG)));
    return Response.json({ tx, listed: true });
  } catch (e) {
    return new Response((e as Error).message, { status: 500 });
  }
}
