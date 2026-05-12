import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { verifyJWT } from './_auth';
import { sendEmail, emailWithdrawalSuccess } from './_email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2023-10-16' });
const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string,
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();
  const { userId, credits } = req.body as { userId: string; credits: number };

  const verifiedId = await verifyJWT(req);
  if (!verifiedId || verifiedId !== userId) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  if (!userId || !credits || credits < 100) {
    return res.status(400).json({ error: 'Montant minimum 100 crédits (1 €)' });
  }

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits, stripe_connect_id')
      .eq('id', userId)
      .single();

    if (!profile) return res.status(404).json({ error: 'Utilisateur introuvable' });
    if (!profile.stripe_connect_id) return res.status(400).json({ error: 'Compte bancaire non connecté' });
    if (profile.credits < credits) return res.status(400).json({ error: 'Crédits insuffisants' });

    const account = await stripe.accounts.retrieve(profile.stripe_connect_id);
    if (!account.payouts_enabled) {
      return res.status(400).json({ error: 'Finalise la vérification de ton compte bancaire d\'abord.' });
    }

    // 1 credit = 1 centime d'euro
    const amountCents = credits;

    // Deduct credits
    await supabase
      .from('profiles')
      .update({ credits: profile.credits - credits })
      .eq('id', userId);

    // Transaction record
    const { data: tx } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'withdrawal',
        amount: -credits,
        description: 'Retrait en cours',
        status: 'pending',
      })
      .select('id')
      .single();

    try {
      // Transfer from platform balance to user's connected account
      const transfer = await stripe.transfers.create({
        amount: amountCents,
        currency: 'eur',
        destination: profile.stripe_connect_id,
        metadata: { userId, credits: String(credits) },
      });

      // Trigger payout immediately — try instant, fall back to standard
      let payout: Stripe.Payout;
      try {
        payout = await stripe.payouts.create(
          { amount: amountCents, currency: 'eur', method: 'instant' },
          { stripeAccount: profile.stripe_connect_id },
        );
      } catch {
        payout = await stripe.payouts.create(
          { amount: amountCents, currency: 'eur', method: 'standard' },
          { stripeAccount: profile.stripe_connect_id },
        );
      }

      await supabase
        .from('transactions')
        .update({ status: 'completed', description: `Retrait Stripe ${transfer.id}` })
        .eq('id', tx?.id);

      const arrivalDate = new Date(payout.arrival_date * 1000).toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long',
      });

      // Send confirmation email
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);
      if (authUser.user?.email) {
        await sendEmail(
          authUser.user.email,
          '⚡ Ton virement SkillUp est en route',
          emailWithdrawalSuccess(credits, arrivalDate),
        );
      }

      return res.status(200).json({ success: true, arrivalDate });
    } catch (stripeErr: any) {
      // Rollback credits
      await supabase.from('profiles').update({ credits: profile.credits }).eq('id', userId);
      await supabase.from('transactions').update({ status: 'failed' }).eq('id', tx?.id);
      throw stripeErr;
    }
  } catch (err: any) {
    console.error('Withdrawal error:', err);
    return res.status(500).json({ error: err.message });
  }
}
