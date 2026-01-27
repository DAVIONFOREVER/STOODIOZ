import Stripe from 'stripe';
import type { NextApiRequest, NextApiResponse } from 'next';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { bookingId, amountCents, payerProfileId, payeeProfileId, description, successUrl, cancelUrl } = req.body as {
      bookingId: string;
      amountCents: number;
      payerProfileId: string;
      payeeProfileId: string;
      description?: string;
      successUrl: string;
      cancelUrl: string;
    };

    if (!bookingId) return res.status(400).json({ error: 'Missing bookingId' });
    if (!payerProfileId || !payeeProfileId) return res.status(400).json({ error: 'Missing payer/payee' });
    if (!amountCents || amountCents < 50) return res.status(400).json({ error: 'Amount too low' });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            product_data: { name: description || 'Booking Payment' },
            unit_amount: amountCents,
          },
        },
      ],
      metadata: {
        type: 'booking',
        booking_id: bookingId,
        payer_profile_id: payerProfileId,
        payee_profile_id: payeeProfileId,
      },
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL || ''}/?stripe=success&booking=${bookingId}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL || ''}/?stripe=cancel&booking=${bookingId}`,
    });

    return res.status(200).json({ sessionId: session.id });
  } catch (e: any) {
    console.error('create-booking-checkout error:', e);
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}
