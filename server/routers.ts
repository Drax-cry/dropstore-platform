import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import bcrypt from 'bcryptjs';
import { nanoid as nanoidFn } from 'nanoid';
import {
  getUserByEmail,
  createUserWithPassword,
  getStoresByUserId,
  getStoreBySlug,
  getStoreById,
  createStore,
  updateStore,
  deleteStore,
  isStoreTrialActive,
  getStoreTrialStatus,
  updateStoreSubscription,
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
  getAllProductsByStore,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  getBannersByStore,
  createBanner,
  deleteBanner,
  updateBannerOrder,
  getStorefrontData,
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

    register: publicProcedure
      .input(z.object({
        name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
        email: z.string().email('Email inválido'),
        password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
      }))
      .mutation(async ({ ctx, input }) => {
        const existing = await getUserByEmail(input.email);
        if (existing) {
          throw new TRPCError({ code: 'CONFLICT', message: 'Este email já está em uso' });
        }
        const passwordHash = await bcrypt.hash(input.password, 10);
        const openId = `email_${nanoidFn(16)}`;
        const user = await createUserWithPassword({
          name: input.name,
          email: input.email,
          passwordHash,
          openId,
        });
        if (!user) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const token = await sdk.createSessionToken(user.openId, { name: user.name ?? '' });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
      }),

    login: publicProcedure
      .input(z.object({
        email: z.string().email('Email inválido'),
        password: z.string().min(1, 'Senha é obrigatória'),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await getUserByEmail(input.email);
        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Email ou senha incorretos' });
        }
        const valid = await bcrypt.compare(input.password, user.passwordHash);
        if (!valid) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Email ou senha incorretos' });
        }
        const token = await sdk.createSessionToken(user.openId, { name: user.name ?? '' });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
      }),

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

    // Aggregate endpoint: returns store + categories + subcategories + products + banners
    // in a single request. Reduces N+1 queries on the storefront page.
    storefront: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const data = await getStorefrontData(input.slug);
        if (!data) throw new TRPCError({ code: "NOT_FOUND", message: "Loja não encontrada" });
        
        // Verificar se o trial expirou
        const isTrialActive = await isStoreTrialActive(data.store.id);
        if (!isTrialActive && data.store.subscriptionStatus !== "active") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Trial expirado. Subscreva para continuar." });
        }
        
        return data;
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
        checkoutType: z.enum(["whatsapp_cart", "whatsapp_direct", "external_link"]).optional(),
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

        // Trial de 3 dias para novas lojas
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 3);

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
          checkoutType: input.checkoutType ?? "whatsapp_cart",
          trialEndsAt,
          subscriptionStatus: "trial",
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
        currency: z.string().optional(),
        address: z.string().optional().nullable(),
        phone: z.string().optional().nullable(),
        email: z.string().optional().nullable(),
        instagram: z.string().optional().nullable(),
        facebook: z.string().optional().nullable(),
        tiktok: z.string().optional().nullable(),
        youtube: z.string().optional().nullable(),
        whatsappMessage: z.string().optional().nullable(),
        checkoutType: z.enum(["whatsapp_cart", "whatsapp_direct", "external_link"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const store = await getStoreById(input.id);

        if (!store || store.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const { id, ...data } = input;
        const updateData: Record<string, unknown> = { ...data };

        if (input.name && input.name.trim() !== store.name) {
          const baseSlug = slugify(input.name);
          let slug = baseSlug;
          let existing = await getStoreBySlug(slug);
          let attempt = 0;

          while (existing && existing.id !== input.id) {
            attempt++;
            slug = `${baseSlug}-${attempt}`;
            existing = await getStoreBySlug(slug);
          }

          updateData.slug = slug;
        }

        await updateStore(id, updateData as Parameters<typeof updateStore>[1]);

        return {
          success: true,
          slug: typeof updateData.slug === "string" ? updateData.slug : store.slug,
        };
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

    cancelSubscription: protectedProcedure
      .input(z.object({ storeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const store = await getStoreById(input.storeId);
        if (!store || store.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const { getStripe } = await import("./stripe");
        const stripe = getStripe();

        let subscriptionId = store.stripeSubscriptionId;

        // Se não temos o ID da subscrição na BD, tentar recuperar via Stripe API
        if (!subscriptionId && store.stripeCustomerId) {
          console.log(`[Cancel] stripeSubscriptionId em falta, a recuperar via customer ${store.stripeCustomerId}`);
          try {
            const subs = await stripe.subscriptions.list({
              customer: store.stripeCustomerId,
              status: "active",
              limit: 1,
            });
            if (subs.data.length > 0) {
              subscriptionId = subs.data[0].id;
              // Guardar na BD para uso futuro
              await updateStoreSubscription(input.storeId, { stripeSubscriptionId: subscriptionId });
              console.log(`[Cancel] Recuperado subscriptionId: ${subscriptionId}`);
            }
          } catch (e) {
            console.error(`[Cancel] Erro ao recuperar subscrições:`, e);
          }
        }

        if (!subscriptionId) {
          // Sem subscrição no Stripe — apenas marcar como cancelado na BD
          console.warn(`[Cancel] Nenhuma subscrição Stripe encontrada para loja ${input.storeId}, a marcar como cancelado localmente`);
          await updateStoreSubscription(input.storeId, { subscriptionStatus: "cancelled" });
          return { success: true };
        }

        try {
          console.log(`[Cancel] Cancelando subscrição ${subscriptionId} imediatamente`);
          const cancelled = await stripe.subscriptions.cancel(subscriptionId);
          console.log(`[Cancel] Status no Stripe: ${cancelled.status}`);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error(`[Cancel] Erro ao cancelar subscrição no Stripe:`, errorMsg);
          // Se a subscrição já não existe no Stripe, marcar como cancelado na BD
          if (errorMsg.includes("No such subscription") || errorMsg.includes("resource_missing")) {
            await updateStoreSubscription(input.storeId, { subscriptionStatus: "cancelled" });
            return { success: true };
          }
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Erro Stripe: ${errorMsg}` });
        }

        // Atualizar BD local após cancelamento confirmado no Stripe
        await updateStoreSubscription(input.storeId, {
          subscriptionStatus: "cancelled",
          stripeSubscriptionId: undefined,
        });
        return { success: true };
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

    listAllByStore: protectedProcedure
      .input(z.object({ storeId: z.number() }))
      .query(async ({ ctx, input }) => {
        const store = await getStoreById(input.storeId);
        if (!store || store.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return getAllProductsByStore(input.storeId);
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
        showPrice: z.number().optional(),
        externalLink: z.string().optional(),
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
          showPrice: input.showPrice ?? 1,
          externalLink: input.externalLink,
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
        showPrice: z.number().optional(),
        externalLink: z.string().optional(),
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

    toggleBlock: protectedProcedure
      .input(z.object({ id: z.number(), storeId: z.number(), isActive: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const store = await getStoreById(input.storeId);
        if (!store || store.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await updateProduct(input.id, { isActive: input.isActive });
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

  // ---- TRIAL & SUBSCRIPTION ----
  trial: router({
    checkStatus: protectedProcedure
      .input(z.object({ storeId: z.number() }))
      .query(async ({ ctx, input }) => {
        const store = await getStoreById(input.storeId);
        if (!store || store.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const isActive = await isStoreTrialActive(input.storeId);
        const status = await getStoreTrialStatus(input.storeId);
        return { isActive, status };
      }),

    activateSubscription: protectedProcedure
      .input(z.object({ storeId: z.number(), stripeSessionId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const store = await getStoreById(input.storeId);
        if (!store || store.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await updateStoreSubscription(input.storeId, {
          subscriptionStatus: "active",
        });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
