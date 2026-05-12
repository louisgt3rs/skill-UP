export async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // skip silently if not configured

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'SkillUp <noreply@skillup.gg>',
      to: [to],
      subject,
      html,
    }),
  });
}

export function emailWithdrawalSuccess(amount: number, arrivalDate: string) {
  const eur = (amount / 100).toFixed(2);
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0A0A0F;color:#F9FAFB;padding:32px;border-radius:16px;">
      <h1 style="color:#7C3AED;font-size:24px;margin-bottom:8px;">⚡ SkillUp</h1>
      <h2 style="font-size:20px;margin-bottom:20px;">Ton virement est en route !</h2>
      <p style="color:#9CA3AF;line-height:1.6;">Un virement de <strong style="color:#F9FAFB;">${eur} €</strong> a été déclenché depuis ton compte SkillUp.</p>
      <div style="background:#1A1A2E;border-radius:12px;padding:20px;margin:24px 0;">
        <p style="margin:0;color:#9CA3AF;font-size:13px;">Arrivée estimée</p>
        <p style="margin:6px 0 0;font-size:22px;font-weight:900;color:#A78BFA;">${arrivalDate}</p>
      </div>
      <p style="color:#6B7280;font-size:12px;">Si tu n'es pas à l'origine de ce retrait, contacte-nous immédiatement à support@skillup.gg</p>
    </div>
  `;
}

export function emailDepositSuccess(credits: number) {
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0A0A0F;color:#F9FAFB;padding:32px;border-radius:16px;">
      <h1 style="color:#7C3AED;font-size:24px;margin-bottom:8px;">⚡ SkillUp</h1>
      <h2 style="font-size:20px;margin-bottom:20px;">Paiement confirmé !</h2>
      <p style="color:#9CA3AF;line-height:1.6;"><strong style="color:#F9FAFB;">${credits.toLocaleString('fr-FR')} crédits</strong> ont été ajoutés à ton compte. Tu peux jouer immédiatement !</p>
      <div style="margin-top:24px;">
        <a href="https://skillup.gg/hub" style="background:#7C3AED;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;">Jouer maintenant →</a>
      </div>
    </div>
  `;
}

export function emailDuelProposed(challengerName: string, game: string, wager: number) {
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0A0A0F;color:#F9FAFB;padding:32px;border-radius:16px;">
      <h1 style="color:#7C3AED;font-size:24px;margin-bottom:8px;">⚡ SkillUp</h1>
      <h2 style="font-size:20px;margin-bottom:20px;">Tu as reçu un défi !</h2>
      <p style="color:#9CA3AF;line-height:1.6;"><strong style="color:#F9FAFB;">${challengerName}</strong> te défie en <strong style="color:#F9FAFB;">${game}</strong> pour une mise de <strong style="color:#A78BFA;">${wager} crédits</strong>.</p>
      <div style="margin-top:24px;">
        <a href="https://skillup.gg/hub" style="background:#7C3AED;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;">Répondre au défi →</a>
      </div>
    </div>
  `;
}
