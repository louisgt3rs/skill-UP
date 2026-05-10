import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2023-10-16' });
const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string,
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).end();
  const { userId } = req.query as { userId: string };
  if (!userId) return res.status(400).json({ error: 'userId requis' });

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_connect_id')
      .eq('id', userId)
      .single();

    if (!profile?.stripe_connect_id) {
      return res.status(200).json({ status: 'none' });
    }

    const account = await stripe.accounts.retrieve(profile.stripe_connect_id);
    return res.status(200).json({
      status: account.payouts_enabled ? 'ready' : 'pending',
    });
  } catch (err: any) {
    console.error('Connect status error:', err);
    return res.status(500).json({ error: err.message });
  }
}
