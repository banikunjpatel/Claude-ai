/** expo-secure-store wrapper for Supabase session storage.
 *
 * expo-secure-store has a 2048-byte limit per key. Supabase sessions can exceed
 * this. We use a simple chunking strategy: values larger than 1800 bytes are
 * split into chunks stored as "<key>_chunk_0", "<key>_chunk_1", etc.
 * A metadata key "<key>_chunks" stores the number of chunks.
 *
 * For a clean interface we expose a `SBStorageAdapter` that conforms to the
 * `SupabaseClientOptions['auth']['storage']` interface so it can be passed
 * directly to `createClient`.
 */

import * as SecureStore from 'expo-secure-store'

const CHUNK_SIZE   = 1800   // bytes — conservative limit under 2048
const CHUNK_META   = '_chunks'

// ── Low-level helpers ─────────────────────────────────────────────────────────

async function setItemChunked(key: string, value: string): Promise<void> {
  if (value.length <= CHUNK_SIZE) {
    // No chunking needed
    await SecureStore.setItemAsync(key, value)
    // Clean up any leftover chunk metadata from a previous large value
    await SecureStore.deleteItemAsync(key + CHUNK_META).catch(() => null)
    return
  }

  const chunks: string[] = []
  for (let i = 0; i < value.length; i += CHUNK_SIZE) {
    chunks.push(value.slice(i, i + CHUNK_SIZE))
  }

  await Promise.all(
    chunks.map((chunk, idx) =>
      SecureStore.setItemAsync(`${key}_chunk_${idx}`, chunk),
    ),
  )
  await SecureStore.setItemAsync(key + CHUNK_META, String(chunks.length))
  // Remove any plain (non-chunked) value left over
  await SecureStore.deleteItemAsync(key).catch(() => null)
}

async function getItemChunked(key: string): Promise<string | null> {
  const chunkCountRaw = await SecureStore.getItemAsync(key + CHUNK_META)

  if (!chunkCountRaw) {
    // Try reading as a plain (non-chunked) value
    return SecureStore.getItemAsync(key)
  }

  const chunkCount = parseInt(chunkCountRaw, 10)
  const chunks = await Promise.all(
    Array.from({ length: chunkCount }, (_, idx) =>
      SecureStore.getItemAsync(`${key}_chunk_${idx}`),
    ),
  )

  if (chunks.some((c) => c === null)) return null
  return (chunks as string[]).join('')
}

async function removeItemChunked(key: string): Promise<void> {
  const chunkCountRaw = await SecureStore.getItemAsync(key + CHUNK_META)

  if (chunkCountRaw) {
    const chunkCount = parseInt(chunkCountRaw, 10)
    await Promise.all([
      ...Array.from({ length: chunkCount }, (_, idx) =>
        SecureStore.deleteItemAsync(`${key}_chunk_${idx}`).catch(() => null),
      ),
      SecureStore.deleteItemAsync(key + CHUNK_META).catch(() => null),
    ])
  }

  await SecureStore.deleteItemAsync(key).catch(() => null)
}

// ── Supabase Storage Adapter ──────────────────────────────────────────────────

/**
 * Drop this directly into `createClient` as the `auth.storage` option:
 *
 * ```ts
 * const supabase = createClient(url, key, {
 *   auth: { storage: SBStorageAdapter, ... }
 * })
 * ```
 */
export const SBStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await getItemChunked(key)
    } catch {
      return null
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    await setItemChunked(key, value)
  },

  async removeItem(key: string): Promise<void> {
    await removeItemChunked(key)
  },
}
