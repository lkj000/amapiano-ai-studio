/**
 * Stable hashing for CTL objects and job specs.
 * Uses SubtleCrypto SHA-256 with deterministic JSON serialization.
 */

/** Deterministic JSON.stringify — sorts object keys recursively */
export function stableStringify(obj: unknown): string {
  if (obj === null || obj === undefined) return JSON.stringify(obj);
  if (typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return "[" + obj.map(stableStringify).join(",") + "]";
  }
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const parts = keys.map(k => JSON.stringify(k) + ":" + stableStringify((obj as any)[k]));
  return "{" + parts.join(",") + "}";
}

/** SHA-256 hash of a stable-stringified object. Returns hex string. */
export async function stableHash(obj: unknown): Promise<string> {
  const data = new TextEncoder().encode(stableStringify(obj));
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Synchronous hash for environments without SubtleCrypto — uses djb2 (non-cryptographic) */
export function stableHashSync(obj: unknown): string {
  const str = stableStringify(obj);
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}
