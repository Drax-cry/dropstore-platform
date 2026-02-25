import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getStoresByUserId,
  getStoreBySlug,
  getStoreById,
  createStore,
  updateStore,
  deleteStore,
  getCategoriesByStore,
  createCategory,
  updateCategory,
  deleteCategory,
  getSubcategoriesByCategory,
  getSubcategoriesByStore,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  getProductsByStore,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  getBannersByStore,
  createBanner,
  deleteBanner,
  updateBannerOrder,
} from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ---- STORES ----
  stores: router({
    myStores: protectedProcedure.query(async ({ ctx }) => {
      return getStoresByUserId(ctx.user.id);
    }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const store = await getStoreBySlug(input.slug);
        if (!store) throw new TRPCError({ code: "NOT_FOUND", message: "Loja não encontrada" });
        return store;
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(2),
        slogan: z.string().optional(),
        logoUrl: z.string().optional(),
        whatsappNumber: z.string().optional(),
        primaryColor: z.string().optional(),
        country: z.string().optional(),
        currency: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verificar se o utilizador já tem uma loja
        const userStores = await getStoresByUserId(ctx.user.id);
        if (userStores && userStores.length > 0) {
          throw new TRPCError({ 
            code: "FORBIDDEN", 
            message: "Você já possui uma loja. Limite de uma loja por conta." 
          });
        }
        
        const baseSlug = slugify(input.name);
        let slug = baseSlug;
        let existing = await getStoreBySlug(slug);
        let attempt = 0;
        while (existing) {
          attempt++;
          slug = `${baseSlug}-${attempt}`;
          existing = await getStoreBySlug(slug);
        }
        await createStore({
          userId: ctx.user.id,
          name: input.name,
          slug,
          slogan: input.slogan,
          logoUrl: input.logoUrl,
          whatsappNumber: input.whatsappNumber,
          primaryColor: input.primaryColor ?? "#000000",
          country: input.country ?? "BR",
          currency: input.currency ?? "BRL",
        });
        return { slug };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(2).optional(),
        slogan: z.string().optional(),
        logoUrl: z.string().optional(),
        whatsappNumber: z.string().optional(),
        primaryColor: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const store = await getStoreById(input.id);
        if (!store || store.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const { id, ...data } = input;
        await updateStore(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const store = await getStoreById(input.id);
        if (!store || store.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await deleteStore(input.id);
        return { success: true };
      }),

    uploadLogo: protectedProcedure
      .input(z.object({
        fileBase64: z.string(),
        mimeType: z.string(),
        fileName: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.fileBase64, "base64");
        const ext = input.fileName.split(".").pop() || "png";
        const key = `logos/${ctx.user.id}-${nanoid(8)}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url };
      }),
  }),

  // ---- CATEGORIES ----
  categories: router({
    list: publicProcedure
      .input(z.object({ storeId: z.number() }))
      .query(async ({ input }) => {
        return getCategoriesByStore(input.storeId);
      }),

    create: protectedProcedure
      .input(z.object({
        storeId: z.number(),
        name: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const store = await getStoreById(input.storeId);
        if (!store || store.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await createCategory({
          storeId: input.storeId,
          name: input.name,
          slug: slugify(input.name),
        });
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        await updateCategory(input.id, { name: input.name, slug: slugify(input.name) });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteCategory(input.id);
        return { success: true };
      }),
  }),

  // ---- SUBCATEGORIES ----
  subcategories: router({
    listByCategory: publicProcedure
      .input(z.object({ categoryId: z.number() }))
      .query(async ({ input }) => {
        return getSubcategoriesByCategory(input.categoryId);
      }),

    listByStore: publicProcedure
      .input(z.object({ storeId: z.number() }))
      .query(async ({ input }) => {
        return getSubcategoriesByStore(input.storeId);
      }),

    create: protectedProcedure
      .input(z.object({
        storeId: z.number(),
        categoryId: z.number(),
        name: z.string().min(1),
        iconUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const store = await getStoreById(input.storeId);
        if (!store || store.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await createSubcategory({
          storeId: input.storeId,
          categoryId: input.categoryId,
          name: input.name,
          slug: slugify(input.name),
          iconUrl: input.iconUrl,
        });
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        iconUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const updateData: Record<string, unknown> = { ...data };
        if (data.name) updateData.slug = slugify(data.name);
        await updateSubcategory(id, updateData as Parameters<typeof updateSubcategory>[1]);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteSubcategory(input.id);
        return { success: true };
      }),
  }),

  // ---- PRODUCTS ----
  products: router({
    listByStore: publicProcedure
      .input(z.object({ storeId: z.number() }))
      .query(async ({ input }) => {
        return getProductsByStore(input.storeId);
      }),

    listByCategory: publicProcedure
      .input(z.object({ storeId: z.number(), categoryId: z.number() }))
      .query(async ({ input }) => {
        return getProductsByCategory(input.storeId, input.categoryId);
      }),

    create: protectedProcedure
      .input(z.object({
        storeId: z.number(),
        categoryId: z.number(),
        subcategoryId: z.number().optional(),
        name: z.string().min(1),
        brand: z.string().optional(),
        price: z.string(),
        imageUrl: z.string().optional(),
        sizes: z.array(z.string()).optional(),
        description: z.string().optional(),
        discountPercent: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const store = await getStoreById(input.storeId);
        if (!store || store.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await createProduct({
          storeId: input.storeId,
          categoryId: input.categoryId,
          subcategoryId: input.subcategoryId,
          name: input.name,
          brand: input.brand,
          price: input.price,
          imageUrl: input.imageUrl,
          sizes: input.sizes ? JSON.stringify(input.sizes) : "[]",
          description: input.description,
          discountPercent: input.discountPercent,
        });
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        storeId: z.number(),
        categoryId: z.number().optional(),
        subcategoryId: z.number().optional().nullable(),
        name: z.string().min(1).optional(),
        brand: z.string().optional(),
        price: z.string().optional(),
        imageUrl: z.string().optional().nullable(),
        sizes: z.array(z.string()).optional(),
        description: z.string().optional(),
        discountPercent: z.string().optional().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        const store = await getStoreById(input.storeId);
        if (!store || store.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const { id, storeId, sizes, ...rest } = input;
        const updateData: Record<string, unknown> = { ...rest };
        if (sizes !== undefined) updateData.sizes = JSON.stringify(sizes);
        await updateProduct(id, updateData as Parameters<typeof updateProduct>[1]);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number(), storeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const store = await getStoreById(input.storeId);
        if (!store || store.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await deleteProduct(input.id);
        return { success: true };
      }),

    uploadImage: protectedProcedure
      .input(z.object({
        fileBase64: z.string(),
        mimeType: z.string(),
        fileName: z.string(),
        storeId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const store = await getStoreById(input.storeId);
        if (!store || store.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const buffer = Buffer.from(input.fileBase64, "base64");
        const ext = input.fileName.split(".").pop() || "jpg";
        const key = `products/${input.storeId}-${nanoid(8)}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url };
      }),
  }),

  // ---- BANNERS ----
  banners: router({
    list: publicProcedure
      .input(z.object({ storeId: z.number() }))
      .query(async ({ input }) => {
        return getBannersByStore(input.storeId);
      }),

    create: protectedProcedure
      .input(z.object({
        storeId: z.number(),
        imageUrl: z.string(),
        title: z.string().optional(),
        linkUrl: z.string().optional(),
        order: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const store = await getStoreById(input.storeId);
        if (!store || store.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await createBanner({
          storeId: input.storeId,
          imageUrl: input.imageUrl,
          title: input.title,
          linkUrl: input.linkUrl,
          order: input.order ?? 0,
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number(), storeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const store = await getStoreById(input.storeId);
        if (!store || store.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await deleteBanner(input.id);
        return { success: true };
      }),

    reorder: protectedProcedure
      .input(z.object({ id: z.number(), storeId: z.number(), order: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const store = await getStoreById(input.storeId);
        if (!store || store.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await updateBannerOrder(input.id, input.order);
        return { success: true };
      }),

    uploadImage: protectedProcedure
      .input(z.object({
        fileBase64: z.string(),
        mimeType: z.string(),
        fileName: z.string(),
        storeId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const store = await getStoreById(input.storeId);
        if (!store || store.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const buffer = Buffer.from(input.fileBase64, "base64");
        const ext = input.fileName.split(".").pop() || "jpg";
        const key = `banners/${input.storeId}-${nanoid(8)}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url };
      }),
  }),
});

export type AppRouter = typeof appRouter;
