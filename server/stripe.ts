import { Express, Request, Response } from "express";
import Stripe from "stripe";
import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { stores } from "../drizzle/schema";

// Lazy-initialize Stripe to avoid startup crash when key is not yet set
let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
    _stripe = new Stripe(key);
  }
  return _stripe;
}

export async function registerStripeRoutes(app: Express) {
  // Create checkout session — called by frontend when user clicks "Subscribe"
  app.post("/api/create-checkout-session", async (req: Request, res: Response) => {
    try {
      const { storeId } = req.body;

      if (!storeId) {
        return res.status(400).json({ error: "storeId is required" });
      }

      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database not available" });

      const store = await db.select().from(stores).where(eq(stores.id, storeId));
      if (!store || store.length === 0) {
        return res.status(404).json({ error: "Store not found" });
      }

      // Build dynamic origin for success/cancel URLs
      const origin = req.headers.origin || `https://dropstore-jdjmiuph.manus.space`;

      const session = await getStripe().checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: `DropStore — ${store[0].name}`,
                description: "Subscrição mensal para gerir a sua loja online",
              },
              unit_amount: 500, // €5.00 in cents
              recurring: { interval: "month", interval_count: 1 },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        allow_promotion_codes: true,
        success_url: `${origin}/checkout?session_id={CHECKOUT_SESSION_ID}&storeId=${storeId}`,
        cancel_url: `${origin}/admin`,
        metadata: {
          storeId: storeId.toString(),
        },
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Stripe checkout error:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  // Webhook — Stripe calls this after successful payment
  app.post("/api/stripe/webhook", async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

    let event: Stripe.Event;
    try {
      event = getStripe().webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (error) {
      console.error("Webhook signature error:", error);
      return res.status(400).json({ error: "Webhook signature verification failed" });
    }

    // Handle test events (for webhook verification)
    if (event.id.startsWith("evt_test_")) {
      console.log("[Webhook] Test event detected, returning verification response");
      return res.json({ verified: true });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const storeId = parseInt(session.metadata?.storeId || "0");

      if (storeId) {
        const db = await getDb();
        if (db) {
          await db.update(stores).set({
            subscriptionStatus: "active",
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
          }).where(eq(stores.id, storeId));
          console.log(`[Webhook] Store ${storeId} subscription activated`);
        }
      }
    }

    res.json({ received: true });
  });

  // Legacy webhook path (keep for backwards compatibility)
  app.post("/api/stripe-webhook", async (req: Request, res: Response) => {
    res.redirect(307, "/api/stripe/webhook");
  });
}
