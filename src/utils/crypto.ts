/**
 * Production-ready Web Crypto API Implementation
 * Zero external bloat: uses standard window.crypto.subtle
 * Enforces AES-256-GCM + PBKDF2 key derivation (100,000 rounds)
 * HMAC-SHA256 signatures for P2P authorization tokens & Model Grants
 */

const SALT_SIZE = 16;
const IV_SIZE = 12; // Standard 96-bit IV for AES-GCM
const PBKDF2_ITERATIONS = 100_000;

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derives an AES-GCM 256-bit CryptoKey from a user passphrase and salt.
 */
export async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plaintext string with AES-256-GCM using a passphrase.
 * Returns a compact base64 payload: [salt 16B] + [IV 12B] + [ciphertext + tag]
 */
export async function encryptData(plaintext: string, passphrase: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(SALT_SIZE));
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_SIZE));
  const key = await deriveKey(passphrase, salt);

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    enc.encode(plaintext)
  );

  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

  return bufferToBase64(combined);
}

/**
 * Decrypts a base64 payload created by encryptData.
 */
export async function decryptData(encryptedPayload: string, passphrase: string): Promise<string> {
  const data = base64ToBuffer(encryptedPayload);
  if (data.length < SALT_SIZE + IV_SIZE) {
    throw new Error('Encrypted payload too short or malformed');
  }

  const salt = data.slice(0, SALT_SIZE);
  const iv = data.slice(SALT_SIZE, SALT_SIZE + IV_SIZE);
  const ciphertext = data.slice(SALT_SIZE + IV_SIZE);

  const key = await deriveKey(passphrase, salt);
  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    ciphertext
  );

  const dec = new TextDecoder();
  return dec.decode(decrypted);
}

/**
 * Signs a Model Grant payload using HMAC-SHA256 to prevent unauthorized peer invocation.
 */
export async function signGrantToken(payload: object, secretKey: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const rawData = enc.encode(JSON.stringify(payload));
  const signature = await window.crypto.subtle.sign('HMAC', key, rawData);
  return bufferToBase64(signature);
}

/**
 * Verifies a Model Grant signature.
 */
export async function verifyGrantToken(payload: object, signatureBase64: string, secretKey: string): Promise<boolean> {
  try {
    const enc = new TextEncoder();
    const key = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(secretKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const rawData = enc.encode(JSON.stringify(payload));
    const signature = base64ToBuffer(signatureBase64);
    return await window.crypto.subtle.verify('HMAC', key, signature as any, rawData);
  } catch (e) {
    console.error('Signature verification error', e);
    return false;
  }
}
