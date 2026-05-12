import Layout from '../components/Layout';
import { theme } from '../theme';

const S = {
  h2: { color: theme.colors.text, fontSize: 18, fontWeight: 800, marginTop: 36, marginBottom: 10 } as React.CSSProperties,
  p:  { color: theme.colors.textSecondary, fontSize: 14, lineHeight: 1.8, marginBottom: 12 } as React.CSSProperties,
  li: { color: theme.colors.textSecondary, fontSize: 14, lineHeight: 1.8, marginBottom: 6 } as React.CSSProperties,
};

export default function Privacy() {
  return (
    <Layout maxWidth={760}>
      <h1 style={{ color: theme.colors.text, fontSize: 28, fontWeight: 900, marginBottom: 6 }}>
        Politique de confidentialité
      </h1>
      <p style={{ color: theme.colors.textMuted, fontSize: 13, marginBottom: 40 }}>
        Dernière mise à jour : mai 2025 — Conforme RGPD
      </p>

      <h2 style={S.h2}>1. Responsable du traitement</h2>
      <p style={S.p}>
        Le responsable du traitement des données personnelles est l'éditeur de la plateforme SkillUp. Contact : <strong>privacy@skillup.gg</strong>
      </p>

      <h2 style={S.h2}>2. Données collectées</h2>
      <p style={S.p}>Nous collectons les données suivantes :</p>
      <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
        <li style={S.li}><strong>Compte :</strong> adresse email, nom d'utilisateur, hashtag.</li>
        <li style={S.li}><strong>Paiements :</strong> données de transaction (montants, dates). Les données bancaires sont gérées exclusivement par Stripe et ne transitent jamais par nos serveurs.</li>
        <li style={S.li}><strong>Jeu :</strong> historique des duels, résultats, crédits, XP, niveau.</li>
        <li style={S.li}><strong>Technique :</strong> adresse IP, logs de connexion, type d'appareil.</li>
        <li style={S.li}><strong>Optionnel :</strong> compte Discord si vous choisissez de le lier.</li>
      </ul>

      <h2 style={S.h2}>3. Finalités du traitement</h2>
      <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
        <li style={S.li}>Fourniture et amélioration du service.</li>
        <li style={S.li}>Gestion des comptes, paiements et retraits.</li>
        <li style={S.li}>Prévention de la fraude et de la triche.</li>
        <li style={S.li}>Envoi de notifications transactionnelles (confirmation de paiement, retrait, défi).</li>
        <li style={S.li}>Obligations légales et réglementaires.</li>
      </ul>

      <h2 style={S.h2}>4. Base légale</h2>
      <p style={S.p}>
        Le traitement de vos données repose sur : l'exécution du contrat (CGU) pour les données de compte et de jeu, votre consentement pour les communications marketing, et nos obligations légales pour les données de paiement.
      </p>

      <h2 style={S.h2}>5. Durée de conservation</h2>
      <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
        <li style={S.li}>Données de compte : durée de vie du compte + 3 ans après suppression.</li>
        <li style={S.li}>Données de transaction : 10 ans (obligation comptable).</li>
        <li style={S.li}>Logs techniques : 12 mois.</li>
      </ul>

      <h2 style={S.h2}>6. Partage des données</h2>
      <p style={S.p}>Vos données peuvent être partagées avec :</p>
      <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
        <li style={S.li}><strong>Supabase</strong> (hébergement base de données) — serveurs en UE.</li>
        <li style={S.li}><strong>Stripe</strong> (paiements) — conforme PCI-DSS.</li>
        <li style={S.li}><strong>Vercel</strong> (hébergement) — serveurs en UE.</li>
        <li style={S.li}>Autorités légales sur réquisition judiciaire.</li>
      </ul>
      <p style={S.p}>Aucune donnée n'est vendue à des tiers.</p>

      <h2 style={S.h2}>7. Vos droits (RGPD)</h2>
      <p style={S.p}>Conformément au RGPD, vous disposez des droits suivants :</p>
      <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
        <li style={S.li}><strong>Accès</strong> — obtenir une copie de vos données.</li>
        <li style={S.li}><strong>Rectification</strong> — corriger des données inexactes.</li>
        <li style={S.li}><strong>Effacement</strong> — demander la suppression de votre compte.</li>
        <li style={S.li}><strong>Portabilité</strong> — recevoir vos données dans un format structuré.</li>
        <li style={S.li}><strong>Opposition</strong> — vous opposer à certains traitements.</li>
      </ul>
      <p style={S.p}>
        Pour exercer ces droits : <strong>privacy@skillup.gg</strong>. Vous pouvez également introduire une réclamation auprès de la <strong>CNIL</strong> (www.cnil.fr).
      </p>

      <h2 style={S.h2}>8. Cookies</h2>
      <p style={S.p}>
        SkillUp utilise uniquement des cookies strictement nécessaires au fonctionnement du service (session d'authentification). Aucun cookie publicitaire ou de tracking tiers n'est utilisé.
      </p>

      <h2 style={S.h2}>9. Sécurité</h2>
      <p style={S.p}>
        Vos données sont protégées par chiffrement TLS en transit et au repos. L'accès aux données est limité aux seuls membres autorisés de l'équipe. Les mots de passe ne sont jamais stockés en clair.
      </p>
    </Layout>
  );
}
