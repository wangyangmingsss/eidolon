import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { resolve } from 'path';
import { randomBytes } from 'crypto';
import { env } from './env.js';
import { getEndpoints } from './constants.js';
import pino from 'pino';

const log = pino({ name: 'eidolon:storage' });

// ─── Log: upload bytes, return root hash
export async function uploadBlob(payload: Uint8Array): Promise<{ rootHash: string; tx: string }> {
  const tmp = resolve(tmpdir(), `eidolon-${Date.now()}-${randomBytes(4).toString('hex')}.bin`);
  writeFileSync(tmp, payload);

  try {
    const { ZgFile, Indexer } = await import('@0glabs/0g-ts-sdk');
    const ep = getEndpoints(env.OG_NETWORK);
    const indexer = new Indexer(env.OG_STORAGE_INDEXER || ep.storageIndexer);

    const file = await ZgFile.fromFilePath(tmp);
    const [tree, treeErr] = await file.merkleTree();
    if (treeErr) throw new Error(`merkleTree: ${treeErr}`);
    const rootHash = tree!.rootHash()!;

    const uploadResult = await indexer.upload(file, env.OG_RPC_URL || ep.rpcUrl, {
      privateKey: env.DEPLOYER_PRIVATE_KEY,
    } as any);
    const [tx, uploadErr] = Array.isArray(uploadResult) ? uploadResult : [uploadResult, null];
    if (uploadErr) throw new Error(`upload: ${uploadErr}`);

    log.info({ rootHash, tx }, 'uploaded');
    return { rootHash, tx: String(tx) };
  } finally {
    if (existsSync(tmp)) unlinkSync(tmp);
  }
}

// ─── Log: download by root hash
export async function downloadBlob(rootHash: string, retries = 3): Promise<Uint8Array> {
  const tmp = resolve(tmpdir(), `eidolon-dl-${Date.now()}-${randomBytes(4).toString('hex')}.bin`);
  const { Indexer } = await import('@0glabs/0g-ts-sdk');
  const ep = getEndpoints(env.OG_NETWORK);
  const indexer = new Indexer(env.OG_STORAGE_INDEXER || ep.storageIndexer);

  for (let i = 0; i < retries; i++) {
    try {
      const dlResult = await indexer.download(rootHash, tmp, true);
      const [, err] = Array.isArray(dlResult) ? dlResult : [dlResult, null];
      if (err) throw new Error(`download: ${err}`);
      const data = readFileSync(tmp);
      unlinkSync(tmp);
      return new Uint8Array(data);
    } catch (e) {
      log.warn({ err: (e as Error).message, attempt: i + 1 }, 'download retry');
      if (i === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, 3000 * (i + 1)));
    }
  }
  throw new Error('unreachable');
}

// ─── KV: best-effort wrapper
let _kvClient: any = null;
async function getKv() {
  if (_kvClient !== null) return _kvClient;
  try {
    const sdk: any = await import('@0glabs/0g-ts-sdk');
    if (!sdk.KvClient) { _kvClient = false; return false; }
    const ep = getEndpoints(env.OG_NETWORK);
    _kvClient = new sdk.KvClient(env.OG_STORAGE_INDEXER || ep.storageIndexer);
    return _kvClient;
  } catch { _kvClient = false; return false; }
}

export async function kvSet(key: string, value: string): Promise<boolean> {
  const kv = await getKv();
  if (!kv) return false;
  try {
    await kv.set(key, value, { privateKey: env.DEPLOYER_PRIVATE_KEY });
    return true;
  } catch (e) {
    log.warn({ err: (e as Error).message, key }, 'kvSet failed');
    return false;
  }
}

export async function kvGet(key: string): Promise<string | null> {
  const kv = await getKv();
  if (!kv) return null;
  try { return (await kv.get(key)) ?? null; } catch { return null; }
}
