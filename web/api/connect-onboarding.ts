import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { verifyJWT } from './_auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2023-10-16' });
const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string,
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();
  const { userId } = req.body as { userId: string };
  if (!userId) return res.status(400).json({ error: 'userId requis' });

  const verifiedId = await verifyJWT(req);
  if (!verifiedId || verifiedId !== userId) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  const origin = req.headers.origin || `https://${req.headers.host}`;

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_connect_id')
      .eq('id', userId)
      .single();

    let accountId: string = profile?.stripe_connect_id;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'FR',
        capabilities: { transfers: { requested: true } },
        settings: {
          payouts: { schedule: { interval: 'manual' } },
        },
      });
      accountId = account.id;
      await supabase.from('profiles').update({ stripe_connect_id: accountId }).eq('id', userId);
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/wallet?connect=refresh`,
      return_url: `${origin}/wallet?connect=success`,
      type: 'account_onboarding',
    });

    return res.status(200).json({ url: accountLink.url });
  } catch (err: any) {
    console.error('Connect onboarding error:', err);
    return res.status(500).json({ error: err.message });
  }
}
