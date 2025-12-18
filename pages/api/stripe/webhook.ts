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

  // Handle specific event types here
  // case 'checkout.session.completed':
  // ... update DB

  res.status(200).json({ received: true });
}