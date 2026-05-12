import Layout from '../components/Layout';
import { theme } from '../theme';

const S = {
  h2: { color: theme.colors.text, fontSize: 18, fontWeight: 800, marginTop: 32, marginBottom: 10 } as React.CSSProperties,
  p:  { color: theme.colors.textSecondary, fontSize: 14, lineHeight: 1.8, marginBottom: 8 } as React.CSSProperties,
};

export default function Legal() {
  return (
    <Layout maxWidth={760}>
      <h1 style={{ color: theme.colors.text, fontSize: 28, fontWeight: 900, marginBottom: 6 }}>
        Mentions légales
      </h1>
      <p style={{ color: theme.colors.textMuted, fontSize: 13, marginBottom: 40 }}>
        Conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance en l'économie numérique.
      </p>

      <h2 style={S.h2}>Éditeur du site</h2>
      <p style={S.p}><strong>Raison sociale :</strong> SkillUp</p>
      <p style={S.p}><strong>Contact :</strong> contact@skillup.gg</p>
      <p style={S.p}><strong>Directeur de la publication :</strong> L'équipe SkillUp</p>

      <h2 style={S.h2}>Hébergement</h2>
      <p style={S.p}><strong>Vercel Inc.</strong></p>
      <p style={S.p}>340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis</p>
      <p style={S.p}>Site : <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" style={{ color: theme.colors.primary }}>vercel.com</a></p>

      <h2 style={S.h2}>Base de données</h2>
      <p style={S.p}><strong>Supabase Inc.</strong></p>
      <p style={S.p}>Site : <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" style={{ color: theme.colors.primary }}>supabase.com</a></p>

      <h2 style={S.h2}>Paiements</h2>
      <p style={S.p}><strong>Stripe Payments Europe Ltd.</strong></p>
      <p style={S.p}>1 Grand Canal Street Lower, Grand Canal Dock, Dublin, Irlande</p>
      <p style={S.p}>Site : <a href="https://stripe.com/fr" target="_blank" rel="noopener noreferrer" style={{ color: theme.colors.primary }}>stripe.com</a></p>

      <h2 style={S.h2}>Propriété intellectuelle</h2>
      <p style={S.p}>
        L'ensemble des contenus présents sur SkillUp (textes, graphiques, logos, images) sont la propriété exclusive de SkillUp ou de ses partenaires et sont protégés par le droit de la propriété intellectuelle. Toute reproduction sans autorisation est interdite.
      </p>

      <h2 style={S.h2}>Limitation de responsabilité</h2>
      <p style={S.p}>
        SkillUp ne saurait être tenu responsable des dommages directs ou indirects causés au matériel de l'utilisateur lors de l'accès au site, résultant soit de l'utilisation d'un matériel ne répondant pas aux spécifications requises, soit de l'apparition d'un bug ou d'une incompatibilité.
      </p>

      <h2 style={S.h2}>Contact</h2>
      <p style={S.p}>
        Pour toute question : <strong>contact@skillup.gg</strong>
      </p>
    </Layout>
  );
}
