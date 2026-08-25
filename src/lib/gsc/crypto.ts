import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const keyFromSecret = (secret: string) => createHash('sha256').update(secret).digest();

export function encryptJson<T>(value: T, secret: string) {
  const iv = randomBytes(12);
  const key = keyFromSecret(secret);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['v1', iv.toString('base64url'), tag.toString('base64url'), encrypted.toString('base64url')].join('.');
}

export function decryptJson<T>(token: string, secret: string): T | null {
  try {
    const [version, ivValue, tagValue, encryptedValue] = token.split('.');
    if (version !== 'v1' || !ivValue || !tagValue || !encryptedValue) return null;
    const decipher = createDecipheriv('aes-256-gcm', keyFromSecret(secret), Buffer.from(ivValue, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
    return JSON.parse(decrypted) as T;
  } catch {
    return null;
  }
}
