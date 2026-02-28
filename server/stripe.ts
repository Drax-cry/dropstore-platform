import { Express, Request, Response } from "express";
import Stripe from "stripe";
import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { stores } from "../drizzle/schema";
import { ENV } from "./_core/env";

let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripe) {
    if (!ENV.stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }
    stripe = new Stripe(ENV.stripeSecretKey);
  }
  return stripe;
}

export async function registerStripeRoutes(app: Express) {
  // Create checkout session
  app.post("/api/create-checkout-session", async (req: Request, res: Response) => {
    try {
      const { storeId } = req.body;

      if (!storeId) {
        return res.status(400).json({ error: "storeId is required" });
      }

      // Get store from database
      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }

      const store = await db.select().from(stores).where(eq(stores.id, storeId));
      if (!store || store.length === 0) {
        return res.status(404).json({ error: "Store not found" });
      }

      // Create Stripe checkout session
      const session = await getStripe().checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: `DropStore - ${store[0].name}`,
                description: "Subscrição mensal para gerir a sua loja online",
              },
              unit_amount: 500, // €5.00 in cents
              recurring: {
                interval: "month",
                interval_count: 1,
              },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `https://dropstore-jdjmiuph.manus.space/checkout?session_id={CHECKOUT_SESSION_ID}&storeId=${storeId}`,
        cancel_url: `https://dropstore-jdjmiuph.manus.space/admin`,
        customer_email: "", // Will be set by frontend if needed
        metadata: {
          storeId: storeId.toString(),
        },
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Stripe error:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  // Webhook for Stripe events
  app.post("/api/stripe-webhook", async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = ENV.stripeWebhookSecret;

    try {
      const event = getStripe().webhooks.constructEvent(req.body, sig, webhookSecret);

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const storeId = parseInt(session.metadata?.storeId || "0");

        if (storeId) {
          // Update store subscription status
          const db = await getDb();
          if (db) {
            await db.update(stores).set({
              subscriptionStatus: "active",
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
            }).where(eq(stores.id, storeId));
          }
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(400).json({ error: "Webhook error" });
    }
  });
}
