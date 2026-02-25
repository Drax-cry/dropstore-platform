import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db module
vi.mock("./db", () => ({
  getStoresByUserId: vi.fn().mockResolvedValue([
    { id: 1, userId: 1, name: "Minha Loja", slug: "minha-loja", slogan: "O melhor drop", logoUrl: null, whatsappNumber: "11999999999", primaryColor: "#000000", isActive: 1, createdAt: new Date(), updatedAt: new Date() }
  ]),
  getStoreBySlug: vi.fn().mockImplementation(async (slug: string) => {
    if (slug === "minha-loja") {
      return { id: 1, userId: 1, name: "Minha Loja", slug: "minha-loja", slogan: "O melhor drop", logoUrl: null, whatsappNumber: "11999999999", primaryColor: "#000000", isActive: 1, createdAt: new Date(), updatedAt: new Date() };
    }
    return undefined;
  }),
  getStoreById: vi.fn().mockResolvedValue({ id: 1, userId: 1, name: "Minha Loja", slug: "minha-loja" }),
  createStore: vi.fn().mockResolvedValue({ insertId: 2 }),
  updateStore: vi.fn().mockResolvedValue(undefined),
  deleteStore: vi.fn().mockResolvedValue(undefined),
  getCategoriesByStore: vi.fn().mockResolvedValue([]),
  createCategory: vi.fn().mockResolvedValue(undefined),
  updateCategory: vi.fn().mockResolvedValue(undefined),
  deleteCategory: vi.fn().mockResolvedValue(undefined),
  getSubcategoriesByCategory: vi.fn().mockResolvedValue([]),
  getSubcategoriesByStore: vi.fn().mockResolvedValue([]),
  createSubcategory: vi.fn().mockResolvedValue(undefined),
  updateSubcategory: vi.fn().mockResolvedValue(undefined),
  deleteSubcategory: vi.fn().mockResolvedValue(undefined),
  getProductsByStore: vi.fn().mockResolvedValue([]),
  getProductsByCategory: vi.fn().mockResolvedValue([]),
  createProduct: vi.fn().mockResolvedValue({ insertId: 1 }),
  updateProduct: vi.fn().mockResolvedValue(undefined),
  deleteProduct: vi.fn().mockResolvedValue(undefined),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://cdn.example.com/test.png", key: "test.png" }),
}));

function createAuthContext(userId = 1): TrpcContext {
  return {
    user: {
      id: userId,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("stores.myStores", () => {
  it("retorna as lojas do utilizador autenticado", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.stores.myStores();
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty("name", "Minha Loja");
  });
});

describe("stores.getBySlug", () => {
  it("retorna a loja pelo slug", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.stores.getBySlug({ slug: "minha-loja" });
    expect(result).toHaveProperty("slug", "minha-loja");
  });

  it("lança erro NOT_FOUND para slug inexistente", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.stores.getBySlug({ slug: "nao-existe" })).rejects.toThrow();
  });
});

describe("stores.create", () => {
  it("cria uma nova loja com nome válido", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.stores.create({ name: "Nova Loja", slogan: "Teste" });
    expect(result).toHaveProperty("slug");
  });
});

describe("categories.list", () => {
  it("retorna categorias de uma loja", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.categories.list({ storeId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("products.listByStore", () => {
  it("retorna produtos de uma loja", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.products.listByStore({ storeId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("auth.logout", () => {
  it("limpa o cookie e retorna sucesso", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
  });
});
