import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2";
import {
  InsertUser, users, stores, categories, subcategories,
  products, storeBanners,
  InsertStore, InsertCategory, InsertSubcategory, InsertProduct, InsertStoreBanner,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import {
  userCache, storeCache, productsCache, categoryCache,
  subcategoryCache, bannerCache, storefrontCache, invalidateStoreData,
} from "./cache";

// ---------------------------------------------------------------------------
// Connection pool — shared across all requests in this process.
// Pool size is tuned for ~10 k concurrent users across multiple pods.
// Each pod holds up to 20 connections; scale horizontally to add more.
// ---------------------------------------------------------------------------

let _pool: ReturnType<typeof createPool> | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function getPool(): ReturnType<typeof createPool> {
  if (!_pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("[Database] DATABASE_URL is not set");
    }
    _pool = createPool({
      uri: process.env.DATABASE_URL,
      connectionLimit: 20,       // max connections per pod
      queueLimit: 200,           // queue up to 200 pending requests (up from 100)
      waitForConnections: true,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10_000,
      connectTimeout: 10_000,
    });
  }
  return _pool;
}

export async function getDb() {
  if (!_db) {
    try {
      _db = drizzle(getPool());
    } catch (error) {
      console.warn("[Database] Failed to initialise drizzle:", error);
      _db = null;
    }
  }
  return _db;
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });

    // Invalidate cache so next read gets fresh data
    userCache.delete(user.openId);
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const cached = userCache.get(`openId:${openId}`);
  if (cached) return cached;

  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  const user = result.length > 0 ? result[0] : undefined;
  if (user) userCache.set(`openId:${openId}`, user);
  return user;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUserWithPassword(data: {
  name: string;
  email: string;
  passwordHash: string;
  openId: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(users).values({
    openId: data.openId,
    name: data.name,
    email: data.email,
    passwordHash: data.passwordHash,
    loginMethod: "email",
    lastSignedIn: new Date(),
  });
  return getUserByEmail(data.email);
}

// ---------------------------------------------------------------------------
// Stores
// ---------------------------------------------------------------------------

export async function getStoresByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(stores).where(eq(stores.userId, userId));
}

export async function getStoreBySlug(slug: string) {
  const cached = storeCache.get(`slug:${slug}`);
  if (cached) return cached;

  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(stores).where(eq(stores.slug, slug)).limit(1);
  const store = result[0];
  if (store) storeCache.set(`slug:${slug}`, store);
  return store;
}

export async function getStoreById(id: number) {
  const cached = storeCache.get(`id:${id}`);
  if (cached) return cached;

  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(stores).where(eq(stores.id, id)).limit(1);
  const store = result[0];
  if (store) storeCache.set(`id:${id}`, store);
  return store;
}

export async function createStore(data: InsertStore) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(stores).values(data);
  return result;
}

export async function updateStore(id: number, data: Partial<InsertStore>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(stores).set(data).where(eq(stores.id, id));
  invalidateStoreData(id);
}

export async function deleteStore(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(stores).where(eq(stores.id, id));
  invalidateStoreData(id);
}

export async function isStoreTrialActive(storeId: number): Promise<boolean> {
  const store = await getStoreById(storeId);
  if (!store) return false;
  if (store.subscriptionStatus === "active") return true;
  if (!store.trialEndsAt) return true;
  if (store.subscriptionStatus === "trial") {
    return new Date() < store.trialEndsAt;
  }
  return false;
}

export async function getStoreTrialStatus(storeId: number) {
  const store = await getStoreById(storeId);
  if (!store) return null;
  return {
    status: store.subscriptionStatus,
    trialEndsAt: store.trialEndsAt,
    stripeCustomerId: store.stripeCustomerId,
    stripeSubscriptionId: store.stripeSubscriptionId,
  };
}

export async function updateStoreSubscription(id: number, data: {
  subscriptionStatus?: "trial" | "active" | "expired" | "cancelled";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(stores).set(data as any).where(eq(stores.id, id));
  invalidateStoreData(id);
}

// ---------------------------------------------------------------------------
// Categories (cached for public reads)
// ---------------------------------------------------------------------------

export async function getCategoriesByStore(storeId: number) {
  const cacheKey = `store:${storeId}`;
  const cached = categoryCache.get(cacheKey);
  if (cached) return cached;

  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(categories).where(eq(categories.storeId, storeId));
  categoryCache.set(cacheKey, result);
  return result;
}

export async function createCategory(data: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(categories).values(data);
  categoryCache.delete(`store:${data.storeId}`);
  invalidateStoreData(data.storeId);
}

export async function updateCategory(id: number, data: Partial<InsertCategory>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(categories).set(data).where(eq(categories.id, id));
  // Invalidate — we don't know the storeId here, so clear by prefix
  categoryCache.clear();
  storefrontCache.clear();
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(categories).where(eq(categories.id, id));
  categoryCache.clear();
  storefrontCache.clear();
}

// ---------------------------------------------------------------------------
// Subcategories (cached for public reads)
// ---------------------------------------------------------------------------

export async function getSubcategoriesByCategory(categoryId: number) {
  const cacheKey = `cat:${categoryId}`;
  const cached = subcategoryCache.get(cacheKey);
  if (cached) return cached;

  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(subcategories).where(eq(subcategories.categoryId, categoryId));
  subcategoryCache.set(cacheKey, result);
  return result;
}

export async function getSubcategoriesByStore(storeId: number) {
  const cacheKey = `store:${storeId}`;
  const cached = subcategoryCache.get(cacheKey);
  if (cached) return cached;

  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(subcategories).where(eq(subcategories.storeId, storeId));
  subcategoryCache.set(cacheKey, result);
  return result;
}

export async function createSubcategory(data: InsertSubcategory) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(subcategories).values(data);
  subcategoryCache.deleteByPrefix(`store:${data.storeId}`);
  subcategoryCache.deleteByPrefix(`cat:${data.categoryId}`);
  invalidateStoreData(data.storeId);
}

export async function updateSubcategory(id: number, data: Partial<InsertSubcategory>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(subcategories).set(data).where(eq(subcategories.id, id));
  subcategoryCache.clear();
  storefrontCache.clear();
}

export async function deleteSubcategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(subcategories).where(eq(subcategories.id, id));
  subcategoryCache.clear();
  storefrontCache.clear();
}

// ---------------------------------------------------------------------------
// Products (cached for public reads)
// ---------------------------------------------------------------------------

export async function getProductsByStore(storeId: number) {
  const cacheKey = `store:${storeId}`;
  const cached = productsCache.get(cacheKey);
  if (cached) return cached;

  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(products).where(
    and(eq(products.storeId, storeId), eq(products.isActive, 1))
  );
  productsCache.set(cacheKey, result);
  return result;
}

// Admin version: returns ALL products including blocked ones (no cache)
export async function getAllProductsByStore(storeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(eq(products.storeId, storeId));
}

export async function getProductsByCategory(storeId: number, categoryId: number) {
  const cacheKey = `store:${storeId}:cat:${categoryId}`;
  const cached = productsCache.get(cacheKey);
  if (cached) return cached;

  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(products).where(
    and(eq(products.storeId, storeId), eq(products.categoryId, categoryId), eq(products.isActive, 1))
  );
  productsCache.set(cacheKey, result);
  return result;
}

export async function createProduct(data: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = db.insert(products).values(data);
  productsCache.deleteByPrefix(`store:${data.storeId}`);
  invalidateStoreData(data.storeId);
  return result;
}

export async function updateProduct(id: number, data: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(products).set(data).where(eq(products.id, id));
  // Clear all product caches (we don't know storeId from just id)
  productsCache.clear();
  storefrontCache.clear();
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(products).set({ isActive: 0 }).where(eq(products.id, id));
  productsCache.clear();
  storefrontCache.clear();
}

// ---------------------------------------------------------------------------
// Banners (cached for public reads)
// ---------------------------------------------------------------------------

export async function getBannersByStore(storeId: number) {
  const cacheKey = `store:${storeId}`;
  const cached = bannerCache.get(cacheKey);
  if (cached) return cached;

  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.select().from(storeBanners)
    .where(eq(storeBanners.storeId, storeId))
    .orderBy(storeBanners.order);
  bannerCache.set(cacheKey, result);
  return result;
}

export async function createBanner(data: InsertStoreBanner) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(storeBanners).values(data);
  bannerCache.delete(`store:${data.storeId}`);
  invalidateStoreData(data.storeId);
}

export async function deleteBanner(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(storeBanners).where(eq(storeBanners.id, id));
  bannerCache.clear();
  storefrontCache.clear();
}

export async function updateBannerOrder(id: number, order: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(storeBanners).set({ order }).where(eq(storeBanners.id, id));
  bannerCache.clear();
  storefrontCache.clear();
}

// ---------------------------------------------------------------------------
// Storefront Aggregate (single query for the entire public page)
// ---------------------------------------------------------------------------

export async function getStorefrontData(slug: string) {
  const cacheKey = `slug:${slug}`;
  const cached = storefrontCache.get(cacheKey);
  if (cached) return cached;

  const store = await getStoreBySlug(slug);
  if (!store) return null;

  // Fetch all data in parallel for maximum throughput
  const [cats, subcats, prods, bnrs] = await Promise.all([
    getCategoriesByStore(store.id),
    getSubcategoriesByStore(store.id),
    getProductsByStore(store.id),
    getBannersByStore(store.id),
  ]);

  const result = {
    store,
    categories: cats,
    subcategories: subcats,
    products: prods,
    banners: bnrs,
  };

  storefrontCache.set(cacheKey, result);
  return result;
}
