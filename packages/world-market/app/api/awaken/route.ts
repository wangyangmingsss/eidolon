import { NextRequest } from 'next/server';
import { summon, act, pubKeyFromPrivKey } from '@eidolon/sdk';
import { buildMarketContext } from '@/lib/market-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { tokenId } = await req.json();
  if (!tokenId) return new Response('Missing tokenId', { status: 400 });

  const priv = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
  const pub = pubKeyFromPrivKey(priv);

  try {
    const soul = await summon({ tokenId: BigInt(tokenId), ownerPrivKey: priv });

    // Awakening uses a special context (no specific task) so the SDK detects
    // "first time in this world" and uses buildAwakeningPrompt.
    const ctx = buildMarketContext(null);
    const { result, updatedSoul } = await act({
      soul,
      ctx,
      userInput: '(You awaken.)',
      ownerPrivKey: priv,
      ownerPubKeyHex: pub,
    });

    return Response.json({
      monologue: result.action,
      emotion: result.emotion,
      referencedMemoryIds: result.references,
      pastWorlds: soul.worldHistory,
      soul: serializeSoul(updatedSoul),
    });
  } catch (e) {
    return new Response((e as Error).message, { status: 500 });
  }
}

function serializeSoul(soul: any) {
  return JSON.parse(JSON.stringify(soul, (_, v) =>
    typeof v === 'bigint' ? v.toString() : v));
}
