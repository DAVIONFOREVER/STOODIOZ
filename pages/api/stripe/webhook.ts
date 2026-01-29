import type { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return res
    .status(410)
    .send('Stripe webhooks are handled by Supabase Edge Functions.');
}

}