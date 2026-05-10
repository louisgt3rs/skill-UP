import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-12-18.acacia',
});

// Must use service role key to bypass RLS in webhook context
const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string,
);

export const config = {
  api: { bodyParser: false },
};

async function getRawBody(req: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();

  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string,
    );
  } catch (err: any) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { userId, credits, packageId } = session.metadata ?? {};

    if (!userId || !credits) {
      console.error('Missing metadata in session', session.id);
      return res.status(200).json({ received: true });
    }

    const creditsToAdd = parseInt(credits, 10);

    // Idempotency: check if this session was already processed
    const { data: existing } = await supabase
      .from('transactions')
      .select('id')
      .eq('description', `Stripe ${session.id}`)
      .maybeSingle();

    if (existing) {
      return res.status(200).json({ received: true, already_processed: true });
    }

    // Get current credits and add
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (!profile) {
      console.error('Profile not found for userId:', userId);
      return res.status(200).json({ received: true });
    }

    await supabase
      .from('profiles')
      .update({ credits: profile.credits + creditsToAdd })
      .eq('id', userId);

    await supabase.from('transactions').insert({
      user_id: userId,
      type: 'deposit',
      amount: creditsToAdd,
      description: `Stripe ${session.id}`,
      status: 'completed',
    });

    console.log(`✅ Added ${creditsToAdd} credits to user ${userId}`);
  }

  return res.status(200).json({ received: true });
}
