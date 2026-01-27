import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno';

const secretKey = Deno.env.get('STRIPE_SECRET_KEY');
if (!secretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY');
}

export const stripe = new Stripe(secretKey, {
  apiVersion: '2023-10-16',
});
