import { NextRequest } from 'next/server';
import { summon, act, pubKeyFromPrivKey } from '@eidolon/sdk';
import { buildTavernContext, TASKS } from '@/lib/tavern-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { tokenId, taskId, userInput } = await req.json();
  if (!tokenId || !taskId || !userInput) {
    return new Response('Missing fields', { status: 400 });
  }
  const task = TASKS.find((t) => t.id === taskId);
  if (!task) return new Response('Unknown task', { status: 400 });

  const priv = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
  const pub = pubKeyFromPrivKey(priv);

  try {
    const soul = await summon({ tokenId: BigInt(tokenId), ownerPrivKey: priv });
    const ctx = buildTavernContext(taskId);
    const { result, updatedSoul } = await act({
      soul, ctx, userInput, ownerPrivKey: priv, ownerPubKeyHex: pub,
    });
    return Response.json({
      action: result.action,
      emotion: result.emotion,
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
