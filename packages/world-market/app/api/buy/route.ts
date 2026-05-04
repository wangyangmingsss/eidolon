import { NextRequest } from 'next/server';
import { buyOnMarket, ownerOf } from '@eidolon/sdk';
import { parseEther } from 'viem';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 90;

export async function POST(req: NextRequest) {
  const { tokenId, priceOG } = await req.json();
  try {
    const tx = await buyOnMarket(BigInt(tokenId), parseEther(String(priceOG)));

    // Poll for ownership change up to 60s
    const deadline = Date.now() + 60_000;
    let owner: string | null = null;
    while (Date.now() < deadline) {
      owner = await ownerOf(BigInt(tokenId));
      if (owner.toLowerCase() === (process.env.DEPLOYER_ADDRESS as string).toLowerCase()) {
        break;
      }
      await new Promise((r) => setTimeout(r, 3000));
    }

    return Response.json({ tx, owner });
  } catch (e) {
    return new Response((e as Error).message, { status: 500 });
  }
}
