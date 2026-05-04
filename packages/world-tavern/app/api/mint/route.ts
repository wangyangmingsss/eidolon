import { NextRequest } from 'next/server';
import { mintNewSoul, pubKeyFromPrivKey } from '@eidolon/sdk';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { ownerAddress } = await req.json();
  if (!ownerAddress?.match(/^0x[a-fA-F0-9]{40}$/)) {
    return new Response('Invalid address', { status: 400 });
  }
  const priv = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
  const pub = pubKeyFromPrivKey(priv);

  const { tokenId } = await mintNewSoul({
    ownerAddress: ownerAddress as `0x${string}`,
    ownerPubKeyHex: pub,
    birthWorld: 'tavern',
  });

  // Register pubkey for oracle (for future drift)
  const pubkeysPath = resolve(process.cwd(), '../../oracle-pubkeys.json');
  mkdirSync(dirname(pubkeysPath), { recursive: true });
  const existing = existsSync(pubkeysPath)
    ? JSON.parse(readFileSync(pubkeysPath, 'utf-8'))
    : {};
  existing[ownerAddress.toLowerCase()] = pub;
  writeFileSync(pubkeysPath, JSON.stringify(existing, null, 2));

  return Response.json({ tokenId: tokenId.toString(), ownerAddress });
}
