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
 *
 * ─── Capacity Planning (10 000 clients/day) ───────────────────────
 * Assuming ~700 concurrent users at peak (10k/day ÷ 14h active window),
 * each visiting 1–3 storefronts with ~50 products each:
 *   - userCache:     5 000 entries × ~0.5 KB ≈ 2.5 MB
 *   - storeCache:    2 000 entries × ~1 KB   ≈ 2 MB
 *   - productsCache: 5 000 entries × ~5 KB   ≈ 25 MB  (arrays of products)
 *   - categoryCache: 5 000 entries × ~0.5 KB ≈ 2.5 MB
 *   - bannerCache:   2 000 entries × ~1 KB   ≈ 2 MB
 *   Total: ~34 MB — well within a 512 MB pod.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class LRUCache<T> {
  private readonly map = new Map<string, CacheEntry<T>>();
  private readonly maxSize: number;
  private readonly defaultTtlMs: number;
  private hits = 0;
  private misses = 0;

  constructor(maxSize: number, defaultTtlMs: number) {
    this.maxSize = maxSize;
    this.defaultTtlMs = defaultTtlMs;
  }

  get(key: string): T | undefined {
    const entry = this.map.get(key);
    if (!entry) {
      this.misses++;
      return undefined;
    }
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      this.misses++;
      return undefined;
    }
    // Move to end (most recently used)
    this.map.delete(key);
    this.map.set(key, entry);
    this.hits++;
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

  /** Delete all entries whose key starts with the given prefix */
  deleteByPrefix(prefix: string): void {
    const keysToDelete: string[] = [];
    this.map.forEach((_, key) => {
      if (key.startsWith(prefix)) keysToDelete.push(key);
    });
    keysToDelete.forEach(key => this.map.delete(key));
  }

  clear(): void {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }

  get stats() {
    const total = this.hits + this.misses;
    return {
      size: this.map.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? ((this.hits / total) * 100).toFixed(1) + "%" : "N/A",
    };
  }
}

// ─── Cache Instances ──────────────────────────────────────────────

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

// Products cache: 5 000 entries, 45-second TTL
// Keyed by "store:{storeId}" or "store:{storeId}:cat:{categoryId}"
// This is the heaviest cache — each entry is an array of products.
export const productsCache = new LRUCache<import("../drizzle/schema").Product[]>(
  5_000,
  45_000
);

// Categories cache: 5 000 entries, 60-second TTL
// Keyed by "store:{storeId}"
export const categoryCache = new LRUCache<import("../drizzle/schema").Category[]>(
  5_000,
  60_000
);

// Subcategories cache: 5 000 entries, 60-second TTL
// Keyed by "store:{storeId}" or "cat:{categoryId}"
export const subcategoryCache = new LRUCache<import("../drizzle/schema").Subcategory[]>(
  5_000,
  60_000
);

// Banners cache: 2 000 entries, 120-second TTL (banners change rarely)
// Keyed by "store:{storeId}"
export const bannerCache = new LRUCache<import("../drizzle/schema").StoreBanner[]>(
  2_000,
  120_000
);

// ─── Storefront aggregate cache ───────────────────────────────────
// Caches the full storefront payload (store + categories + subcategories +
// products + banners) so a single tRPC call serves the entire page.
// 2 000 entries, 30-second TTL — short because it aggregates multiple tables.
export const storefrontCache = new LRUCache<any>(
  2_000,
  30_000
);

// ─── Cache Invalidation Helpers ───────────────────────────────────

/** Invalidate all caches related to a specific store */
export function invalidateStoreData(storeId: number): void {
  storeCache.delete(`id:${storeId}`);
  productsCache.deleteByPrefix(`store:${storeId}`);
  categoryCache.delete(`store:${storeId}`);
  subcategoryCache.deleteByPrefix(`store:${storeId}`);
  bannerCache.delete(`store:${storeId}`);
  storefrontCache.deleteByPrefix(`slug:`);
}

/** Get aggregated cache stats for monitoring */
export function getCacheStats() {
  return {
    user: userCache.stats,
    store: storeCache.stats,
    products: productsCache.stats,
    categories: categoryCache.stats,
    subcategories: subcategoryCache.stats,
    banners: bannerCache.stats,
    storefront: storefrontCache.stats,
  };
}
