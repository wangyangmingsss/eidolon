/**
 * Oracle service.
 *
 * Watches SoulNFT.DriftRequested events. For each:
 *   1. Reads encrypted metadata via SDK with the OLD owner's privkey
 *      (in MVP we use deployer key; in real life the oracle would have its own).
 *   2. Decrypts -> re-encrypts to NEW owner's pubkey (we resolve newOwner's pubkey
 *      from a registered mapping; for MVP, we ASSUME oracle holds owner pubkeys).
 *   3. Uploads to 0G Storage -> newRoot
 *   4. Signs (chainid, contract, tokenId, newOwner, newRoot, nonce)
 *   5. Calls SoulNFT.completeDrift(...).
 *
 * For hackathon MVP, we simplify by reusing the deployer key as the oracle's
 * decryption key. The new owner pubkey is provided via an off-chain registry
 * (a JSON file at ./oracle-pubkeys.json) populated when users mint.
 */
import { JsonRpcProvider, Wallet, Contract, ethers } from 'ethers';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import pino from 'pino';
import {
  encryptString,
  decryptString,
  uploadBlob,
  downloadBlob,
  addresses,
  env,
} from '@eidolon/sdk';

const log = pino({ name: 'eidolon:oracle' });

const ABI = [
  'event DriftRequested(uint256 indexed tokenId, address indexed from, address indexed to)',
  'function metadataRootOf(uint256) view returns (bytes32)',
  'function encryptedURIOf(uint256) view returns (string)',
  'function driftNonce(uint256) view returns (uint256)',
  'function completeDrift(uint256 tokenId, address newOwner, bytes32 newMetadataRoot, string newEncryptedURI, uint256 nonce, bytes oracleSignature)',
];

async function main() {
  const provider = new JsonRpcProvider(env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai');
  const oracleWallet = new Wallet(env.ORACLE_PRIVATE_KEY!, provider);
  log.info({ oracle: oracleWallet.address }, 'Oracle started');

  const c = new Contract(addresses.SoulNFT, ABI, oracleWallet);

  c.on('DriftRequested', async (tokenId: bigint, from: string, to: string) => {
    log.info({ tokenId: tokenId.toString(), from, to }, 'DriftRequested');
    try {
      // 1. Fetch ciphertext
      const root: string = await c.metadataRootOf(tokenId);
      const cleanRoot = root.startsWith('0x') ? root.slice(2) : root;
      const blob = new TextDecoder().decode(await downloadBlob(cleanRoot));

      // 2. Decrypt with seller's key. For MVP, we use deployer key (same as seller).
      const sellerPriv = env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
      const plaintext = decryptString(blob, sellerPriv);

      // 3. Look up new owner's pubkey.
      const pubkeysFile = resolve(process.cwd(), 'oracle-pubkeys.json');
      if (!existsSync(pubkeysFile)) {
        throw new Error('oracle-pubkeys.json missing - populate at mint time');
      }
      const pubkeys = JSON.parse(readFileSync(pubkeysFile, 'utf-8')) as Record<string, string>;
      const newPub = pubkeys[to.toLowerCase()];
      if (!newPub) throw new Error(`No pubkey registered for ${to}`);

      // 4. Re-encrypt
      const newCipher = encryptString(plaintext, newPub);
      const { rootHash } = await uploadBlob(new TextEncoder().encode(newCipher));
      const newURI = `og-storage://${rootHash}`;

      // 5. Sign and submit
      const nonce: bigint = await c.driftNonce(tokenId);
      const network = await provider.getNetwork();
      const chainId = network.chainId;
      const digest = ethers.solidityPackedKeccak256(
        ['uint256', 'address', 'uint256', 'address', 'bytes32', 'uint256'],
        [chainId, addresses.SoulNFT, tokenId, to, '0x' + rootHash, nonce],
      );
      const sig = await oracleWallet.signMessage(ethers.getBytes(digest));

      const tx = await c.completeDrift(tokenId, to, '0x' + rootHash, newURI, nonce, sig);
      log.info({ tx: tx.hash }, 'completeDrift submitted');
      await tx.wait();
      log.info({ tx: tx.hash }, 'drift complete');
    } catch (e) {
      log.error({ err: (e as Error).message, tokenId: tokenId.toString() }, 'drift failed');
    }
  });

  log.info('Listening for DriftRequested...');
  // Keep process alive
  await new Promise(() => {});
}

main().catch((e) => {
  log.error(e);
  process.exit(1);
});
