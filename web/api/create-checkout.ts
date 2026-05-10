import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16',
});

const PACKAGES: Record<string, { credits: number; price_cents: number; name: string }> = {
  starter:  { credits: 500,  price_cents: 500,  name: 'Pack Starter — 500 crédits'  },
  standard: { credits: 1100, price_cents: 900,  name: 'Pack Standard — 1 100 crédits (+100 bonus)' },
  pro:      { credits: 2500, price_cents: 2000, name: 'Pack Pro — 2 500 crédits (+500 bonus)'      },
  elite:    { credits: 6000, price_cents: 4000, name: 'Pack Elite — 6 000 crédits (+2 000 bonus)'  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { packageId, userId } = req.body as { packageId: string; userId: string };
  const pkg = PACKAGES[packageId];

  if (!pkg || !userId) {
    return res.status(400).json({ error: 'Invalid package or missing userId' });
  }

  const origin = req.headers.origin || `https://${req.headers.host}`;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: pkg.name,
            description: `100 crédits = 1 € · Utilisables immédiatement sur SkillUp`,
          },
          unit_amount: pkg.price_cents,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${origin}/wallet?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/wallet?payment=cancel`,
      metadata: {
        userId,
        packageId,
        credits: pkg.credits.toString(),
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe error:', err);
    return res.status(500).json({ error: err.message });
  }
}
