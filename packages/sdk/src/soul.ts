import { ulid } from 'ulid';
import {
  type Soul, SoulSchema, type WorldContext, TRAITS, type Trait, type Memory, type ActionResult,
} from './types.js';
import { uploadBlob, downloadBlob, kvSet } from './storage.js';
import { encryptString, decryptString, pubKeyFromPrivKey } from './crypto.js';
import { buildActPrompt, buildAwakeningPrompt } from './prompts.js';
import { infer } from './inference.js';
import { imprint, applyImprint } from './imprint.js';
import { relevantMemories } from './memory.js';
import { mintSoul, updateMetadata, metadataRootOf } from './chain.js';
import { env } from './env.js';
import pino from 'pino';

const log = pino({ name: 'eidolon:soul' });

/// Creates a new Soul with random personality, encrypts, uploads, and mints.
export async function mintNewSoul(opts: {
  ownerAddress: `0x${string}`;
  ownerPubKeyHex: string;
  birthWorld: string;
}): Promise<{ tokenId: bigint; soul: Soul }> {
  const personality = randomPersonality();
  const now = Math.floor(Date.now() / 1000);

  const soul: Soul = {
    tokenId: 0n,
    owner: opts.ownerAddress,
    birthWorld: opts.birthWorld,
    worldHistory: [opts.birthWorld],
    personality,
    memories: [],
    skills: [],
    createdAt: now,
    updatedAt: now,
    version: 1,
  };

  const blob = serialize(soul);
  const encrypted = encryptString(blob, opts.ownerPubKeyHex);
  const { rootHash } = await uploadBlob(new TextEncoder().encode(encrypted));
  const uri = `og-storage://${rootHash}`;

  const tokenId = await mintSoul(opts.ownerAddress, ('0x' + rootHash) as `0x${string}`, uri);

  const final = { ...soul, tokenId };
  log.info({ tokenId: tokenId.toString() }, 'minted Soul');
  return { tokenId, soul: final };
}

/// Load Soul from chain -> storage -> decrypt.
export async function summon(opts: {
  tokenId: bigint;
  ownerPrivKey: `0x${string}`;
}): Promise<Soul> {
  const root = await metadataRootOf(opts.tokenId);
  const cleanRoot = root.startsWith('0x') ? root.slice(2) : root;
  const ciphertext = new TextDecoder().decode(await downloadBlob(cleanRoot));
  const plaintext = decryptString(ciphertext, opts.ownerPrivKey);
  const parsed = SoulSchema.parse(JSON.parse(plaintext));
  return { ...parsed, tokenId: opts.tokenId };
}

/// A single in-world turn.
export async function act(opts: {
  soul: Soul;
  ctx: WorldContext;
  userInput: string;
  ownerPubKeyHex: string;
  ownerPrivKey: `0x${string}`;
}): Promise<{ result: ActionResult; updatedSoul: Soul }> {
  const isAwakening = !opts.soul.worldHistory.includes(opts.ctx.worldId);
  const memories = relevantMemories(opts.soul.memories, opts.ctx, opts.userInput, 6);
  const { system, user } = isAwakening
    ? buildAwakeningPrompt(opts.soul, opts.ctx, memories)
    : buildActPrompt(opts.soul, opts.ctx, memories, opts.userInput);

  const { result, signatureValid, providerId } = await infer({ system, user });
  if (!signatureValid) {
    log.warn({ providerId }, 'TEE signature invalid — proceeding but flagging');
  }

  const out = imprint({ soul: opts.soul, ctx: opts.ctx, userInput: opts.userInput, result });
  let updatedSoul = applyImprint(opts.soul, out);

  if (isAwakening && !updatedSoul.worldHistory.includes(opts.ctx.worldId)) {
    updatedSoul = { ...updatedSoul, worldHistory: [...updatedSoul.worldHistory, opts.ctx.worldId] };
  }

  const blob = serialize(updatedSoul);
  const encrypted = encryptString(blob, opts.ownerPubKeyHex);
  const { rootHash } = await uploadBlob(new TextEncoder().encode(encrypted));
  await updateMetadata(opts.soul.tokenId, ('0x' + rootHash) as `0x${string}`, `og-storage://${rootHash}`);

  if (out.newMemory) {
    await kvSet(
      `soul:${opts.soul.tokenId}:mem:${out.newMemory.id}`,
      JSON.stringify({ summary: out.newMemory.summary, worldId: out.newMemory.worldId }),
    );
  }

  return { result, updatedSoul };
}

function randomPersonality() {
  const out = {} as Record<Trait, number>;
  for (const t of TRAITS) {
    const r = (Math.random() + Math.random() + Math.random()) / 3 * 2 - 1;
    out[t] = Math.round(r * 100) / 100;
  }
  return out;
}

function serialize(soul: Soul): string {
  return JSON.stringify(soul, (_, v) => (typeof v === 'bigint' ? v.toString() : v));
}

export { TRAITS } from './types.js';
export type { Soul, Memory, WorldContext, ActionResult, Trait } from './types.js';
export { pubKeyFromPrivKey } from './crypto.js';
