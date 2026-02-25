/**
 * In-process LRU cache for hot data.
 *
 * In a multi-instance (autoscaling) deployment each pod has its own cache.
 * This is intentional: the cache only stores short-lived, read-only data
 * (user records, public store data) so stale entries expire quickly and
 * cross-pod inconsistency is never a correctness issue.
 *
 * For write-invalidation across pods, use the TTL values below — they are
 * deliberately short so that any mutation is visible within seconds.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class LRUCache<T> {
  private readonly map = new Map<string, CacheEntry<T>>();
  private readonly maxSize: number;
  private readonly defaultTtlMs: number;

  constructor(maxSize: number, defaultTtlMs: number) {
    this.maxSize = maxSize;
    this.defaultTtlMs = defaultTtlMs;
  }

  get(key: string): T | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return undefined;
    }
    // Move to end (most recently used)
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    if (this.map.has(key)) this.map.delete(key);
    if (this.map.size >= this.maxSize) {
      // Evict least recently used (first entry)
      const firstKey = this.map.keys().next().value;
      if (firstKey !== undefined) this.map.delete(firstKey);
    }
    this.map.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
    });
  }

  delete(key: string): void {
    this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }
}

// User cache: 5 000 entries, 30-second TTL
// Each authenticated request reads from here instead of hitting the DB.
export const userCache = new LRUCache<import("../drizzle/schema").User>(
  5_000,
  30_000
);

// Public store cache: 2 000 entries, 60-second TTL
// Storefront pages are read-heavy and mostly public.
export const storeCache = new LRUCache<import("../drizzle/schema").Store>(
  2_000,
  60_000
);
