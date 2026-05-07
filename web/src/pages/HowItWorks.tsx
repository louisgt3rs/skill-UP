import { useNavigate } from 'react-router-dom';
import { theme } from '../theme';

const STEPS = [
  {
    num: '1', icon: '📝', title: 'Créer un compte',
    desc: 'Inscris-toi gratuitement en 30 secondes. Tu reçois 100 crédits de bienvenue (= 1 €) pour commencer sans risque.',
  },
  {
    num: '2', icon: '💳', title: 'Déposer des crédits',
    desc: 'Recharge ton compte via virement bancaire ou carte. 100 crédits = 1 €. Minimum de dépôt : 500 crédits (5 €).',
  },
  {
    num: '3', icon: '⚔️', title: 'Défier un adversaire',
    desc: 'Entre le hashtag unique de ton adversaire (ex : #ALPHA42), choisis le jeu et la mise. Ton adversaire reçoit la notification.',
  },
  {
    num: '4', icon: '🎮', title: 'Jouer le match',
    desc: 'Une fois que les deux joueurs ont accepté, les mises sont bloquées et le duel commence. Jouez dans le jeu normalement.',
  },
  {
    num: '5', icon: '📸', title: 'Soumettre ta preuve',
    desc: 'À la fin du match, chaque joueur clique sur "Victoire" ou "Défaite". Si les résultats correspondent, le gagnant est automatiquement déclaré.',
  },
  {
    num: '6', icon: '💰', title: 'Recevoir tes gains',
    desc: 'Le vainqueur reçoit le double de la mise directement sur son solde SkillUp. Tu peux retirer tes crédits à tout moment.',
  },
];

const DISPUTE_RULES = [
  'Si les deux joueurs déclarent "Victoire", un litige est ouvert automatiquement.',
  'Notre équipe analyse les preuves soumises (screenshots, vidéos).',
  'Le joueur qui fournit la preuve la plus claire gagne.',
  'En cas de doute, les crédits sont remboursés aux deux joueurs.',
  'Les abus répétés entraînent la suspension du compte.',
];

const ANTICHEAT = [
  'Toute tentative de manipulation des résultats entraîne une suspension.',
  'Les preuves doivent être authentiques : nom d\'utilisateur visible, score lisible, date récente.',
  'Éditer ou falsifier un screenshot est une violation grave des conditions d\'utilisation.',
  'SkillUp se réserve le droit de vérifier l\'authenticité de toute preuve soumise.',
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 56 }}>
      <h2 style={{
        color: theme.colors.text, fontSize: 22, fontWeight: 800,
        letterSpacing: -0.5, marginBottom: 20,
        paddingBottom: 12,
        borderBottom: `2px solid ${theme.colors.primary}`,
        display: 'inline-block',
      }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function HowItWorks() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '48px 24px 80px' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <p style={{ color: theme.colors.primary, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
          Guide complet
        </p>
        <h1 style={{ color: theme.colors.text, fontSize: 36, fontWeight: 900, letterSpacing: -1.5, marginBottom: 16 }}>
          Comment fonctionne SkillUp ?
        </h1>
        <p style={{ color: theme.colors.textSecondary, fontSize: 16, maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
          Tout ce que tu dois savoir pour commencer à jouer, miser des crédits et gagner sur SkillUp.
        </p>
      </div>

      {/* Steps */}
      <Section title="Guide pas à pas">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {STEPS.map((step, i) => (
            <div key={step.num} style={{
              display: 'flex', gap: 20,
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 16, padding: '20px 24px',
              alignItems: 'flex-start',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                backgroundColor: `${theme.colors.primary}20`,
                border: `2px solid ${theme.colors.primary}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: theme.colors.primary, fontWeight: 900, fontSize: 16,
              }}>
                {step.num}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 20 }}>{step.icon}</span>
                  <h3 style={{ color: theme.colors.text, fontWeight: 700, fontSize: 16 }}>{step.title}</h3>
                </div>
                <p style={{ color: theme.colors.textSecondary, fontSize: 14, lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Credits */}
      <Section title="Système de crédits">
        <div style={{
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: 16, padding: 28,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { icon: '💳', title: 'Dépôt', desc: 'Minimum 500 crédits (5 €). Traité sous 24h ouvrées.' },
              { icon: '💰', title: 'Taux de change', desc: '100 crédits = 1 €. Le taux est fixe et garanti.' },
              { icon: '🔒', title: 'Sécurité', desc: 'Les mises sont bloquées dès l\'acceptation du duel. Impossible de jouer sans fonds.' },
              { icon: '🏦', title: 'Retrait', desc: 'Minimum 500 crédits. Virement bancaire sous 48h après validation manuelle.' },
            ].map(item => (
              <div key={item.title} style={{ padding: 16, backgroundColor: theme.colors.surfaceHigh, borderRadius: 12 }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
                <p style={{ color: theme.colors.text, fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{item.title}</p>
                <p style={{ color: theme.colors.textSecondary, fontSize: 13, lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Proof */}
      <Section title="Preuves de victoire">
        <div style={{
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: 16, padding: 24,
        }}>
          <p style={{ color: theme.colors.textSecondary, fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>
            Après chaque match, tu dois soumettre ton résultat (Victoire ou Défaite). Si les deux joueurs
            s'accordent, le résultat est validé automatiquement. En cas de désaccord, les preuves sont examinées.
          </p>
          <p style={{ color: theme.colors.text, fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
            ✅ Ce qu'une bonne preuve doit contenir :
          </p>
          <ul style={{ paddingLeft: 20 }}>
            {[
              'Ton pseudo de joueur clairement visible',
              'Le score final ou l\'écran de résultat',
              'L\'heure et la date du match si possible',
              'Une capture d\'écran ou une vidéo non éditée',
            ].map(item => (
              <li key={item} style={{ color: theme.colors.textSecondary, fontSize: 14, marginBottom: 6 }}>{item}</li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Disputes */}
      <Section title="Gestion des litiges">
        <div style={{
          backgroundColor: `${theme.colors.error}0d`,
          border: `1px solid ${theme.colors.error}30`,
          borderRadius: 16, padding: 24,
        }}>
          <p style={{ color: theme.colors.text, fontWeight: 600, marginBottom: 16, fontSize: 14 }}>
            ⚖️ Comment se déroule un litige ?
          </p>
          <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
            {DISPUTE_RULES.map((rule, i) => (
              <li key={i} style={{
                color: theme.colors.textSecondary, fontSize: 14,
                marginBottom: 10, display: 'flex', gap: 10, alignItems: 'flex-start',
              }}>
                <span style={{ color: theme.colors.error, fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                {rule}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Anti-cheat */}
      <Section title="Règles anti-triche">
        <div style={{
          backgroundColor: `${theme.colors.accent}0d`,
          border: `1px solid ${theme.colors.accent}30`,
          borderRadius: 16, padding: 24,
        }}>
          <p style={{ color: theme.colors.accent, fontWeight: 700, marginBottom: 16, fontSize: 14 }}>
            ⚠️ Tolérance zéro pour la triche
          </p>
          <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
            {ANTICHEAT.map((rule, i) => (
              <li key={i} style={{
                color: theme.colors.textSecondary, fontSize: 14,
                marginBottom: 10, display: 'flex', gap: 10, alignItems: 'flex-start',
              }}>
                <span style={{ color: theme.colors.accent, flexShrink: 0 }}>•</span>
                {rule}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* CTA */}
      <div style={{ textAlign: 'center', paddingTop: 20 }}>
        <p style={{ color: theme.colors.textSecondary, marginBottom: 24, fontSize: 15 }}>
          Tu as compris le fonctionnement ? Lance-toi !
        </p>
        <button
          onClick={() => navigate('/signup')}
          style={{
            backgroundColor: theme.colors.primary, border: 'none',
            borderRadius: theme.radius.md, color: '#fff',
            cursor: 'pointer', padding: '14px 40px',
            fontSize: 16, fontWeight: 700,
          }}
        >
          Créer mon compte — 100 crédits offerts ⚡
        </button>
      </div>
    </div>
  );
}
