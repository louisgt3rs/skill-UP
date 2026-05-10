import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16',
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amountEur, userId } = req.body as { amountEur: number; userId: string };

  if (!userId || !amountEur || amountEur < 1 || amountEur > 1000) {
    return res.status(400).json({ error: 'Montant invalide (1€ – 1000€) ou userId manquant' });
  }

  const credits = Math.round(amountEur * 100);
  const price_cents = Math.round(amountEur * 100);
  const origin = req.headers.origin || `https://${req.headers.host}`;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `${credits.toLocaleString('fr-FR')} crédits SkillUp`,
            description: `1 € = 100 crédits · Utilisables immédiatement pour vos duels`,
          },
          unit_amount: price_cents,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${origin}/wallet?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/wallet?payment=cancel`,
      metadata: {
        userId,
        credits: credits.toString(),
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe error:', err);
    return res.status(500).json({ error: err.message });
  }
}
