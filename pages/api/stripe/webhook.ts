// FIX: Import Buffer from 'buffer' to fix the "Cannot find name 'Buffer'" TypeScript error by explicitly declaring its source.
import { Buffer } from 'buffer';
import Stripe from "stripe";
import type { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const sig = req.headers["stripe-signature"];

  if (!sig) {
    return res.status(400).send("Missing Stripe signature");
  }

  const chunks: any[] = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const body = Buffer.concat(chunks).toString("utf8");

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig as string,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log("✅ Stripe event received:", event.type);

  // 🔎 Intent-only routing (NO side effects)
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log("🧾 INTENT: checkout.session.completed");
      console.log("→ session.id:", session.id);
      console.log("→ mode:", session.mode);
      console.log("→ amount_total:", session.amount_total);
      console.log("→ metadata:", session.metadata);

      if (session.metadata?.booking_id) {
        console.log(
          `→ WOULD confirm booking ${session.metadata.booking_id}`
        );
      }

      if (session.metadata?.wallet_topup === "true") {
        console.log(
          `→ WOULD credit wallet for user ${session.metadata.user_id}`
        );
      }

      break;
    }

    case "customer.subscription.created": {
      const sub = event.data.object as Stripe.Subscription;

      console.log("📦 INTENT: customer.subscription.created");
      console.log("→ subscription.id:", sub.id);
      console.log("→ status:", sub.status);
      console.log("→ price:", sub.items.data[0]?.price.id);
      console.log("→ customer:", sub.customer);

      console.log("→ WOULD store plan + status on user profile");
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;

      console.log("💰 INTENT: invoice.paid");
      console.log("→ invoice.id:", invoice.id);
      console.log("→ subscription:", invoice.subscription);
      console.log("→ amount_paid:", invoice.amount_paid);

      console.log("→ WOULD ensure access remains enabled");
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;

      console.log("❌ INTENT: invoice.payment_failed");
      console.log("→ invoice.id:", invoice.id);
      console.log("→ subscription:", invoice.subscription);

      console.log("→ WOULD restrict paid features immediately");
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;

      console.log("🧨 INTENT: customer.subscription.deleted");
      console.log("→ subscription.id:", sub.id);

      console.log("→ WOULD downgrade user to free");
      break;
    }

    default: {
      console.log("ℹ️ Stripe event ignored:", event.type);
    }
  }

  res.status(200).json({ received: true });
}