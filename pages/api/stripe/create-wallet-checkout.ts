import Stripe from 'stripe';
import type { NextApiRequest, NextApiResponse } from 'next';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { amountCents, payerProfileId, successUrl, cancelUrl } = req.body as {
      amountCents: number;
      payerProfileId: string;
      successUrl: string;
      cancelUrl: string;
    };

    if (!payerProfileId) return res.status(400).json({ error: 'Missing payerProfileId' });
    if (!amountCents || amountCents < 50) return res.status(400).json({ error: 'Amount too low' });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            product_data: { name: 'Wallet Top-Up' },
            unit_amount: amountCents,
          },
        },
      ],
      metadata: {
        type: 'wallet_topup',
        payer_profile_id: payerProfileId,
      },
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL || ''}/?stripe=success`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL || ''}/?stripe=cancel`,
    });

    return res.status(200).json({ sessionId: session.id });
  } catch (e: any) {
    console.error('create-wallet-checkout error:', e);
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}
