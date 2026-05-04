import { describe, it, expect } from 'vitest';
import { encryptString, decryptString, pubKeyFromPrivKey } from '../src/crypto.js';

const PRIV = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' as const;

describe('crypto', () => {
  it('roundtrips', () => {
    const pub = pubKeyFromPrivKey(PRIV);
    const ct = encryptString('hello soul', pub);
    expect(decryptString(ct, PRIV)).toBe('hello soul');
  });

  it('fails to decrypt with wrong key', () => {
    const pub = pubKeyFromPrivKey(PRIV);
    const ct = encryptString('hello soul', pub);
    expect(() =>
      decryptString(ct, '0x' + '1'.repeat(64) as any),
    ).toThrow();
  });
});
