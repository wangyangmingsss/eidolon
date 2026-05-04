import { encrypt, decrypt, PrivateKey, PublicKey } from 'eciesjs';

/// Convert a 0x-prefixed private key to an ECIES public key (hex).
export function pubKeyFromPrivKey(priv: `0x${string}`): string {
  const cleanPriv = priv.startsWith('0x') ? priv.slice(2) : priv;
  const sk = new PrivateKey(Buffer.from(cleanPriv, 'hex'));
  return sk.publicKey.toHex();
}

/// Encrypt a UTF-8 string with the given public key. Returns base64 ciphertext.
export function encryptString(plaintext: string, pubKeyHex: string): string {
  const cipher = encrypt(pubKeyHex, Buffer.from(plaintext, 'utf-8'));
  return Buffer.from(cipher).toString('base64');
}

/// Decrypt with private key.
export function decryptString(ciphertextB64: string, priv: `0x${string}` | string): string {
  const cleanPriv = priv.startsWith('0x') ? priv.slice(2) : priv;
  const buf = Buffer.from(ciphertextB64, 'base64');
  return Buffer.from(decrypt(cleanPriv, buf)).toString('utf-8');
}
