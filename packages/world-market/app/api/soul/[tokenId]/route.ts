import { NextRequest } from 'next/server';
import { summon } from '@eidolon/sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { tokenId: string } }) {
  const priv = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
  try {
    const soul = await summon({ tokenId: BigInt(params.tokenId), ownerPrivKey: priv });
    return Response.json(JSON.parse(JSON.stringify(soul, (_, v) =>
      typeof v === 'bigint' ? v.toString() : v)));
  } catch (e) {
    return new Response((e as Error).message, { status: 500 });
  }
}
