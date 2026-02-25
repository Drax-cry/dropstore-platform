import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Tabela de lojas
export const stores = mysqlTable("stores", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  slogan: text("slogan"),
  logoUrl: text("logoUrl"),
  whatsappNumber: varchar("whatsappNumber", { length: 30 }),
  primaryColor: varchar("primaryColor", { length: 20 }).default("#000000"),
  country: varchar("country", { length: 10 }).default("BR"),
  currency: varchar("currency", { length: 10 }).default("BRL"),
  address: text("address"),
  phone: varchar("phone", { length: 32 }),
  email: varchar("email", { length: 320 }),
  instagram: varchar("instagram", { length: 128 }),
  facebook: varchar("facebook", { length: 128 }),
  tiktok: varchar("tiktok", { length: 128 }),
  youtube: varchar("youtube", { length: 255 }),
  isActive: int("isActive").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Store = typeof stores.$inferSelect;
export type InsertStore = typeof stores.$inferInsert;

// Tabela de categorias
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

// Tabela de subcategorias (marcas)
export const subcategories = mysqlTable("subcategories", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull(),
  storeId: int("storeId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  iconUrl: text("iconUrl"),
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Subcategory = typeof subcategories.$inferSelect;
export type InsertSubcategory = typeof subcategories.$inferInsert;

// Tabela de produtos
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  categoryId: int("categoryId").notNull(),
  subcategoryId: int("subcategoryId"),
  name: varchar("name", { length: 255 }).notNull(),
  brand: varchar("brand", { length: 255 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("imageUrl"),
  sizes: varchar("sizes", { length: 500 }),
  discountPercent: decimal("discountPercent", { precision: 5, scale: 2 }),
  description: text("description"),
  isActive: int("isActive").default(1),
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// Tabela de banners da loja
export const storeBanners = mysqlTable("store_banners", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  imageUrl: text("imageUrl").notNull(),
  linkUrl: text("linkUrl"),
  title: varchar("title", { length: 255 }),
  order: int("order").default(0),
  isActive: int("isActive").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StoreBanner = typeof storeBanners.$inferSelect;
export type InsertStoreBanner = typeof storeBanners.$inferInsert;
