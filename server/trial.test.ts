import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { stores } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Trial System", () => {
  let testStoreId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const testSlug = `test-store-trial-${Date.now()}`;

    // Create a test store
    try {
      await db
        .insert(stores)
        .values({
          userId: 1, // Use a test user ID
          name: "Test Store",
          slug: testSlug,
          country: "PT",
          trialEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          subscriptionStatus: "trial",
        });
    } catch (e) {
      console.error("Insert error:", e);
      throw e;
    }

    // Get the created store
    const result = await db
      .select()
      .from(stores)
      .where(eq(stores.slug, testSlug));

    console.log("Query result:", result);

    if (result.length === 0) throw new Error("Failed to create test store");
    testStoreId = result[0].id;
  });

  afterAll(async () => {
    if (testStoreId) {
      const db = await getDb();
      if (!db) return;

      // Clean up test store
      try {
        await db.delete(stores).where(eq(stores.id, testStoreId));
      } catch (e) {
        console.error("Cleanup error:", e);
      }
    }
  });

  it("should have an active trial", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const store = await db.select().from(stores).where(eq(stores.id, testStoreId));
    expect(store.length).toBeGreaterThan(0);
    expect(store[0].subscriptionStatus).toBe("trial");
    expect(store[0].trialEndsAt).toBeDefined();
  });

  it("should be able to activate subscription", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Update store subscription
    await db
      .update(stores)
      .set({
        subscriptionStatus: "active",
        stripeSubscriptionId: "sub_test_123",
      })
      .where(eq(stores.id, testStoreId));

    const store = await db.select().from(stores).where(eq(stores.id, testStoreId));
    expect(store[0].subscriptionStatus).toBe("active");
    expect(store[0].stripeSubscriptionId).toBe("sub_test_123");
  });
});
