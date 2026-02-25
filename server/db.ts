import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, stores, categories, subcategories, products, InsertStore, InsertCategory, InsertSubcategory, InsertProduct } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "passwordHash"] as const;
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
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ---- STORES ----

export async function getStoresByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(stores).where(eq(stores.userId, userId));
}

export async function getStoreBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(stores).where(eq(stores.slug, slug)).limit(1);
  return result[0];
}

export async function getStoreById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(stores).where(eq(stores.id, id)).limit(1);
  return result[0];
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
}

export async function deleteStore(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(stores).where(eq(stores.id, id));
}

// ---- CATEGORIES ----

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

// ---- SUBCATEGORIES ----

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

// ---- PRODUCTS ----

export async function getProductsByStore(storeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(and(eq(products.storeId, storeId), eq(products.isActive, 1)));
}

export async function getProductsByCategory(storeId: number, categoryId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(and(eq(products.storeId, storeId), eq(products.categoryId, categoryId), eq(products.isActive, 1)));
}

export async function createProduct(data: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(products).values(data);
  return result;
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
