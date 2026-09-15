const PBKDF2_ITERATIONS = 150000;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

async function pbkdf2Hash(password: string, saltBytes: Uint8Array, iterations: number): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return bytesToHex(new Uint8Array(derivedBits));
}

// Produces the current, salted hash format: pbkdf2:<iterations>:<salt-hex>:<hash-hex>.
// A random salt means two users with the same password get different
// stored hashes, and the iteration count makes brute-forcing meaningfully
// slower than a bare SHA-256 digest.
export async function hashPassword(password: string): Promise<string> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const hashHex = await pbkdf2Hash(password, saltBytes, PBKDF2_ITERATIONS);
  return `pbkdf2:${PBKDF2_ITERATIONS}:${bytesToHex(saltBytes)}:${hashHex}`;
}

// Verifies a password against either the current salted format, or the
// old unsalted SHA-256 format (plain 64-character hex) that earlier
// accounts still have on file. Old-format accounts get transparently
// upgraded to the new format on their next successful login — see
// needsRehash below.
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (storedHash.startsWith('pbkdf2:')) {
    const parts = storedHash.split(':');
    if (parts.length !== 4) return false;
    const iterations = parseInt(parts[1], 10);
    const saltBytes = hexToBytes(parts[2]);
    const expectedHashHex = parts[3];
    const computedHashHex = await pbkdf2Hash(password, saltBytes, iterations);
    return computedHashHex === expectedHashHex;
  }

  // Legacy unsalted SHA-256 format
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(password));
  const computedHex = bytesToHex(new Uint8Array(digest));
  return computedHex === storedHash;
}

export function needsRehash(storedHash: string): boolean {
  return !storedHash.startsWith('pbkdf2:');
}

export function generateSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return bytesToHex(bytes);
}
