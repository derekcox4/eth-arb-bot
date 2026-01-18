/**
 * NexusChain - Cryptographic Utilities
 * Implements Ed25519 signatures and SHA-256 hashing
 */

import crypto from 'crypto';

/**
 * Generate a new key pair for wallet/validator
 */
export function generateKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  return { publicKey, privateKey };
}

/**
 * Derive address from public key
 */
export function publicKeyToAddress(publicKey) {
  const hash = crypto.createHash('sha256').update(publicKey).digest();
  return '0x' + hash.slice(-20).toString('hex');
}

/**
 * Sign data with private key
 */
export function sign(data, privateKey) {
  const dataBuffer = Buffer.from(JSON.stringify(data));
  const signature = crypto.sign(null, dataBuffer, privateKey);
  return signature.toString('base64');
}

/**
 * Verify signature
 */
export function verify(data, signature, publicKey) {
  try {
    const dataBuffer = Buffer.from(JSON.stringify(data));
    const signatureBuffer = Buffer.from(signature, 'base64');
    return crypto.verify(null, dataBuffer, publicKey, signatureBuffer);
  } catch (error) {
    return false;
  }
}

/**
 * Hash data with SHA-256
 */
export function hash(data) {
  const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('sha256').update(dataStr).digest('hex');
}

/**
 * Generate Merkle root from array of hashes
 */
export function merkleRoot(hashes) {
  if (hashes.length === 0) return hash('');
  if (hashes.length === 1) return hashes[0];

  const newLevel = [];
  for (let i = 0; i < hashes.length; i += 2) {
    const left = hashes[i];
    const right = i + 1 < hashes.length ? hashes[i + 1] : hashes[i];
    newLevel.push(hash(left + right));
  }

  return merkleRoot(newLevel);
}

export default {
  generateKeyPair,
  publicKeyToAddress,
  sign,
  verify,
  hash,
  merkleRoot
};
