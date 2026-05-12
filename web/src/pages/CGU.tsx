import Layout from '../components/Layout';
import { theme } from '../theme';

const S = {
  h2: { color: theme.colors.text, fontSize: 18, fontWeight: 800, marginTop: 36, marginBottom: 10 } as React.CSSProperties,
  p:  { color: theme.colors.textSecondary, fontSize: 14, lineHeight: 1.8, marginBottom: 12 } as React.CSSProperties,
  li: { color: theme.colors.textSecondary, fontSize: 14, lineHeight: 1.8, marginBottom: 6 } as React.CSSProperties,
};

export default function CGU() {
  return (
    <Layout maxWidth={760}>
      <h1 style={{ color: theme.colors.text, fontSize: 28, fontWeight: 900, marginBottom: 6 }}>
        Conditions Générales d'Utilisation
      </h1>
      <p style={{ color: theme.colors.textMuted, fontSize: 13, marginBottom: 40 }}>
        Dernière mise à jour : mai 2025
      </p>

      <h2 style={S.h2}>1. Présentation du service</h2>
      <p style={S.p}>
        SkillUp est une plateforme de compétitions de jeux vidéo en ligne fondée sur le mérite et les compétences des joueurs. Les utilisateurs peuvent s'affronter en duel sur des jeux vidéo et miser des crédits virtuels sur l'issue de ces parties. SkillUp n'est pas un service de jeux de hasard : le résultat des duels dépend exclusivement des compétences des joueurs.
      </p>

      <h2 style={S.h2}>2. Conditions d'accès</h2>
      <p style={S.p}>Pour utiliser SkillUp, vous devez :</p>
      <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
        <li style={S.li}>Avoir au moins <strong>18 ans</strong> révolus.</li>
        <li style={S.li}>Résider dans un pays où l'utilisation de ce type de service est légalement autorisée.</li>
        <li style={S.li}>Créer un compte avec des informations exactes et à jour.</li>
        <li style={S.li}>Ne pas avoir été banni de la plateforme.</li>
      </ul>
      <p style={S.p}>
        En créant un compte, vous certifiez avoir plus de 18 ans et accepter l'intégralité des présentes CGU.
      </p>

      <h2 style={S.h2}>3. Système de crédits</h2>
      <p style={S.p}>
        Les crédits SkillUp sont une monnaie virtuelle utilisée exclusivement sur la plateforme. Le taux de conversion est fixe : <strong>1 € = 100 crédits</strong>. Les crédits peuvent être achetés via Stripe (carte bancaire, Apple Pay, Google Pay) et retirés sous forme de virement bancaire SEPA.
      </p>
      <p style={S.p}>
        Les crédits n'ont aucune valeur légale en dehors de la plateforme et ne constituent pas une monnaie électronique au sens de la directive européenne 2009/110/CE.
      </p>

      <h2 style={S.h2}>4. Duels et mises</h2>
      <p style={S.p}>
        Lorsque deux joueurs s'affrontent, la mise convenue est bloquée sur les deux comptes. Le vainqueur du duel récupère l'intégralité des mises. En cas de litige, un arbitre SkillUp examine les preuves soumises (captures d'écran) et rend une décision définitive. La décision de l'arbitre est sans appel.
      </p>
      <p style={S.p}>
        SkillUp se réserve le droit de prélever des frais de service sur les gains, conformément au barème affiché sur la plateforme au moment du duel.
      </p>

      <h2 style={S.h2}>5. Retraits</h2>
      <p style={S.p}>
        Les retraits sont effectués via Stripe Connect, directement sur le compte bancaire vérifié de l'utilisateur. SkillUp se réserve le droit de suspendre un retrait en cas de suspicion de fraude, de litige en cours, ou de violation des présentes CGU.
      </p>

      <h2 style={S.h2}>6. Comportements interdits</h2>
      <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
        <li style={S.li}>Tricher, utiliser des logiciels tiers ou des bots.</li>
        <li style={S.li}>Créer plusieurs comptes pour contourner des sanctions.</li>
        <li style={S.li}>Manipuler les résultats de duels (collusion).</li>
        <li style={S.li}>Harceler, menacer ou insulter d'autres utilisateurs.</li>
        <li style={S.li}>Blanchir des fonds via la plateforme.</li>
      </ul>
      <p style={S.p}>
        Tout manquement à ces règles peut entraîner la suspension immédiate du compte et la confiscation des crédits.
      </p>

      <h2 style={S.h2}>7. Responsabilité</h2>
      <p style={S.p}>
        SkillUp met tout en œuvre pour assurer la disponibilité du service mais ne saurait être tenu responsable des interruptions techniques, pertes de données, ou dommages indirects. L'utilisation de la plateforme se fait aux risques et périls de l'utilisateur dans les limites autorisées par la loi française.
      </p>

      <h2 style={S.h2}>8. Modification des CGU</h2>
      <p style={S.p}>
        SkillUp se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés par email. La poursuite de l'utilisation du service après notification vaut acceptation des nouvelles conditions.
      </p>

      <h2 style={S.h2}>9. Droit applicable</h2>
      <p style={S.p}>
        Les présentes CGU sont soumises au droit français. Tout litige relatif à leur interprétation ou exécution sera soumis aux tribunaux compétents de Paris.
      </p>

      <h2 style={S.h2}>10. Contact</h2>
      <p style={S.p}>
        Pour toute question relative aux présentes CGU : <strong>support@skillup.gg</strong>
      </p>
    </Layout>
  );
}
