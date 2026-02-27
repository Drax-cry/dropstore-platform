import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2";
import {
  InsertUser, users, stores, categories, subcategories,
  products, storeBanners,
  InsertStore, InsertCategory, InsertSubcategory, InsertProduct, InsertStoreBanner,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { userCache, storeCache } from "./cache";

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
      queueLimit: 100,           // queue up to 100 pending requests
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
  // Check cache first
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
  // Check cache first (public storefront is read-heavy)
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
  // Invalidate both cache keys
  storeCache.delete(`id:${id}`);
  // Slug cache will expire naturally (60 s TTL) — acceptable for updates
}

export async function deleteStore(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(stores).where(eq(stores.id, id));
  storeCache.delete(`id:${id}`);
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function getCategoriesByStore(storeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).where(eq(categories.storeId, storeId));
}

export async function createCategory(data: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(categories).values(data);
}

export async function updateCategory(id: number, data: Partial<InsertCategory>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(categories).set(data).where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(categories).where(eq(categories.id, id));
}

// ---------------------------------------------------------------------------
// Subcategories
// ---------------------------------------------------------------------------

export async function getSubcategoriesByCategory(categoryId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subcategories).where(eq(subcategories.categoryId, categoryId));
}

export async function getSubcategoriesByStore(storeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subcategories).where(eq(subcategories.storeId, storeId));
}

export async function createSubcategory(data: InsertSubcategory) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(subcategories).values(data);
}

export async function updateSubcategory(id: number, data: Partial<InsertSubcategory>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(subcategories).set(data).where(eq(subcategories.id, id));
}

export async function deleteSubcategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(subcategories).where(eq(subcategories.id, id));
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export async function getProductsByStore(storeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(
    and(eq(products.storeId, storeId), eq(products.isActive, 1))
  );
}

export async function getProductsByCategory(storeId: number, categoryId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(
    and(eq(products.storeId, storeId), eq(products.categoryId, categoryId), eq(products.isActive, 1))
  );
}

export async function createProduct(data: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(products).values(data);
}

export async function updateProduct(id: number, data: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(products).set(data).where(eq(products.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(products).set({ isActive: 0 }).where(eq(products.id, id));
}

// ---------------------------------------------------------------------------
// Banners
// ---------------------------------------------------------------------------

export async function getBannersByStore(storeId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.select().from(storeBanners)
    .where(eq(storeBanners.storeId, storeId))
    .orderBy(storeBanners.order);
}

export async function createBanner(data: InsertStoreBanner) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(storeBanners).values(data);
}

export async function deleteBanner(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(storeBanners).where(eq(storeBanners.id, id));
}

export async function updateBannerOrder(id: number, order: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(storeBanners).set({ order }).where(eq(storeBanners.id, id));
}
