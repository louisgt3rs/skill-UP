import { useNavigate } from 'react-router-dom';
import { GAMES } from '../types';
import { theme } from '../theme';

const STEPS = [
  { num: '01', icon: '🎮', title: 'Choisis un jeu', desc: 'Sélectionne parmi nos jeux disponibles. Brawl Stars est déjà en ligne.' },
  { num: '02', icon: '⚔️', title: 'Trouve un adversaire', desc: 'Défie un joueur via son hashtag unique ou attends qu\'un adversaire te propose un duel.' },
  { num: '03', icon: '🏆', title: 'Joue, prouve et gagne', desc: 'Joue le match, soumets ton résultat avec une preuve, et récupère tes gains instantanément.' },
];

const FEATURES = [
  { icon: '⚡', title: 'Duels rapides', desc: 'Lance un défi en moins de 2 minutes. Pas de tournoi, pas d\'attente — du 1v1 direct.' },
  { icon: '🔒', title: 'Crédits sécurisés', desc: 'Tes crédits sont bloqués pendant le duel et libérés automatiquement au résultat.' },
  { icon: '✅', title: 'Profils vérifiés', desc: 'Lie ton compte Discord pour prouver ton identité et débloquer le badge Vérifié.' },
  { icon: '🏅', title: 'Badges et progression', desc: 'Débloque des badges exclusifs au fil de tes victoires et ta régularité.' },
  { icon: '⚖️', title: 'Support litige', desc: 'En cas de désaccord, notre équipe analyse les preuves et tranche équitablement.' },
];

const CREDIT_STEPS = [
  { icon: '💳', label: 'Tu déposes', sub: 'Via virement ou carte' },
  { icon: '💰', label: 'Tu reçois des crédits', sub: '100 crédits = 1 €' },
  { icon: '🔒', label: 'Mise bloquée', sub: 'Pendant le duel' },
  { icon: '🏆', label: 'Le vainqueur gagne', sub: 'Crédits débloqués' },
  { icon: '🏦', label: 'Retrait', sub: 'Virement sous 48h' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ backgroundColor: theme.colors.background }}>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        minHeight: 'calc(100vh - 64px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '80px 24px 60px',
      }}>
        {/* Glow background */}
        <div style={{
          position: 'absolute', top: '15%', left: '50%',
          transform: 'translateX(-50%)',
          width: 700, height: 500,
          background: `radial-gradient(ellipse, ${theme.colors.primary}22 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', maxWidth: 760 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            backgroundColor: `${theme.colors.primary}18`,
            border: `1px solid ${theme.colors.primary}40`,
            borderRadius: theme.radius.full,
            padding: '6px 18px', marginBottom: 32,
          }}>
            <span style={{ fontSize: 13 }}>🎁</span>
            <span style={{ color: theme.colors.primaryLight, fontWeight: 600, fontSize: 13, letterSpacing: 0.3 }}>
              100 crédits offerts à l'inscription
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(34px, 7vw, 68px)',
            fontWeight: 900, letterSpacing: -2, lineHeight: 1.05,
            color: theme.colors.text, marginBottom: 20,
          }}>
            Affronte des joueurs.<br />
            Prouve ton skill.<br />
            <span style={{ color: theme.colors.primary }}>Gagne.</span>
          </h1>

          <p style={{
            color: theme.colors.textSecondary, fontSize: 18,
            lineHeight: 1.7, maxWidth: 520, margin: '0 auto 40px',
          }}>
            Défie d'autres joueurs en 1v1, mise des crédits,
            soumets ta preuve et récupère tes gains.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/signup')}
              style={{
                backgroundColor: theme.colors.primary, border: 'none',
                borderRadius: theme.radius.md, color: '#fff',
                cursor: 'pointer', padding: '15px 36px', fontSize: 16, fontWeight: 700,
                boxShadow: `0 0 40px ${theme.colors.primary}55`,
                letterSpacing: 0.3,
              }}
            >
              Commencer gratuitement
            </button>
            <button
              onClick={() => navigate('/games')}
              style={{
                background: 'none',
                border: `1.5px solid ${theme.colors.border}`,
                borderRadius: theme.radius.md, color: theme.colors.textSecondary,
                cursor: 'pointer', padding: '15px 28px', fontSize: 16,
              }}
            >
              Voir les jeux →
            </button>
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────── */}
      <section style={{
        padding: '80px 24px',
        borderTop: `1px solid ${theme.colors.border}`,
        backgroundColor: theme.colors.surface,
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <p style={{ color: theme.colors.primary, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginBottom: 12 }}>
            Simple et rapide
          </p>
          <h2 style={{ textAlign: 'center', color: theme.colors.text, fontSize: 32, fontWeight: 800, letterSpacing: -1, marginBottom: 56 }}>
            Comment ça fonctionne en 3 étapes
          </h2>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
            {STEPS.map((step, i) => (
              <div key={step.num} style={{
                flex: '1 1 260px', maxWidth: 300,
                backgroundColor: theme.colors.surfaceHigh,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: 20, padding: '28px 24px',
                position: 'relative',
              }}>
                <span style={{
                  display: 'block',
                  color: `${theme.colors.primary}60`, fontWeight: 900,
                  fontSize: 48, lineHeight: 1, marginBottom: 12,
                  letterSpacing: -2,
                }}>
                  {step.num}
                </span>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{step.icon}</div>
                <h3 style={{ color: theme.colors.text, fontWeight: 700, fontSize: 17, marginBottom: 8 }}>{step.title}</h3>
                <p style={{ color: theme.colors.textSecondary, fontSize: 14, lineHeight: 1.6 }}>{step.desc}</p>
                {i < STEPS.length - 1 && (
                  <div style={{ display: 'none' }} /> // arrow connector — simplified for inline styles
                )}
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 36 }}>
            <button
              onClick={() => navigate('/how-it-works')}
              style={{
                background: 'none', border: 'none',
                color: theme.colors.primary, cursor: 'pointer',
                fontSize: 14, fontWeight: 600,
                textDecoration: 'underline',
                textUnderlineOffset: 3,
              }}
            >
              En savoir plus sur le fonctionnement →
            </button>
          </div>
        </div>
      </section>

      {/* ── Why SkillUp ───────────────────────────────────── */}
      <section style={{ padding: '80px 24px', borderTop: `1px solid ${theme.colors.border}` }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <p style={{ color: theme.colors.primary, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginBottom: 12 }}>
            Pourquoi nous choisir
          </p>
          <h2 style={{ textAlign: 'center', color: theme.colors.text, fontSize: 32, fontWeight: 800, letterSpacing: -1, marginBottom: 48 }}>
            Pourquoi utiliser SkillUp ?
          </h2>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{
                flex: '1 1 200px', maxWidth: 260,
                padding: 24,
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: 16,
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  backgroundColor: `${theme.colors.primary}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, marginBottom: 14,
                }}>
                  {f.icon}
                </div>
                <h3 style={{ color: theme.colors.text, fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: theme.colors.textSecondary, fontSize: 13, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Games ─────────────────────────────────────────── */}
      <section style={{
        padding: '80px 24px',
        borderTop: `1px solid ${theme.colors.border}`,
        backgroundColor: theme.colors.surface,
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <p style={{ color: theme.colors.primary, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginBottom: 12 }}>
            Jeux disponibles
          </p>
          <h2 style={{ textAlign: 'center', color: theme.colors.text, fontSize: 32, fontWeight: 800, letterSpacing: -1, marginBottom: 48 }}>
            Jeux populaires
          </h2>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 32 }}>
            {GAMES.slice(0, 4).map(game => (
              <div
                key={game.slug}
                style={{
                  flex: '1 1 180px', maxWidth: 210,
                  backgroundColor: game.bg,
                  border: `1.5px solid ${game.color}30`,
                  borderRadius: 18, padding: '22px 18px',
                  position: 'relative',
                  opacity: game.available ? 1 : 0.7,
                }}
              >
                {!game.available && (
                  <span style={{
                    position: 'absolute', top: 10, right: 10,
                    backgroundColor: theme.colors.surfaceHigh,
                    borderRadius: theme.radius.full,
                    padding: '3px 9px', fontSize: 10,
                    color: theme.colors.textMuted, fontWeight: 700, letterSpacing: 0.5,
                    textTransform: 'uppercase',
                  }}>Bientôt</span>
                )}
                {game.available && (
                  <span style={{
                    position: 'absolute', top: 10, right: 10,
                    backgroundColor: `${theme.colors.success}20`,
                    border: `1px solid ${theme.colors.success}40`,
                    borderRadius: theme.radius.full,
                    padding: '3px 9px', fontSize: 10,
                    color: theme.colors.success, fontWeight: 700,
                  }}>Disponible</span>
                )}
                <div style={{ fontSize: 36, marginBottom: 10 }}>{game.emoji}</div>
                <p style={{ color: game.color, fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{game.name}</p>
                <p style={{ color: theme.colors.textMuted, fontSize: 12 }}>{game.platform}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => navigate('/games')}
              style={{
                border: `1.5px solid ${theme.colors.border}`,
                background: 'none', borderRadius: theme.radius.md,
                color: theme.colors.textSecondary, cursor: 'pointer',
                padding: '11px 28px', fontSize: 14, fontWeight: 500,
              }}
            >
              Voir tous les jeux →
            </button>
          </div>
        </div>
      </section>

      {/* ── Credits system ────────────────────────────────── */}
      <section style={{ padding: '80px 24px', borderTop: `1px solid ${theme.colors.border}` }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <p style={{ color: theme.colors.primary, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginBottom: 12 }}>
            Transparent et simple
          </p>
          <h2 style={{ textAlign: 'center', color: theme.colors.text, fontSize: 32, fontWeight: 800, letterSpacing: -1, marginBottom: 12 }}>
            Système de crédits
          </h2>
          <p style={{ textAlign: 'center', color: theme.colors.textSecondary, fontSize: 15, marginBottom: 48, lineHeight: 1.6 }}>
            Les crédits sont l'unité d'échange de SkillUp. <strong style={{ color: theme.colors.text }}>100 crédits = 1 €.</strong><br />
            Tout est tracé, sécurisé, et vérifiable.
          </p>

          {/* Flow */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 8 }}>
            {CREDIT_STEPS.map((step, i) => (
              <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: 14, padding: '16px 18px',
                  textAlign: 'center', minWidth: 110,
                }}>
                  <div style={{ fontSize: 26, marginBottom: 6 }}>{step.icon}</div>
                  <p style={{ color: theme.colors.text, fontWeight: 600, fontSize: 13 }}>{step.label}</p>
                  <p style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 2 }}>{step.sub}</p>
                </div>
                {i < CREDIT_STEPS.length - 1 && (
                  <span style={{ color: theme.colors.textMuted, fontSize: 18, flexShrink: 0 }}>→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────── */}
      <section style={{
        padding: '100px 24px',
        borderTop: `1px solid ${theme.colors.border}`,
        textAlign: 'center',
        background: `radial-gradient(ellipse at 50% 0%, ${theme.colors.primary}18 0%, transparent 70%)`,
      }}>
        <h2 style={{ color: theme.colors.text, fontSize: 36, fontWeight: 900, letterSpacing: -1.5, marginBottom: 12 }}>
          Prêt à montrer ton niveau ?
        </h2>
        <p style={{ color: theme.colors.textSecondary, fontSize: 16, marginBottom: 36, lineHeight: 1.6 }}>
          Crée ton compte en 30 secondes.<br />100 crédits offerts. Aucune carte requise.
        </p>
        <button
          onClick={() => navigate('/signup')}
          style={{
            backgroundColor: theme.colors.primary, border: 'none',
            borderRadius: theme.radius.md, color: '#fff',
            cursor: 'pointer', padding: '18px 52px',
            fontSize: 17, fontWeight: 700,
            boxShadow: `0 0 50px ${theme.colors.primary}55`,
            letterSpacing: 0.3,
          }}
        >
          Créer mon compte ⚡
        </button>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: `1px solid ${theme.colors.border}`,
        padding: '28px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 12,
        color: theme.colors.textMuted, fontSize: 13,
      }}>
        <span>⚡ SkillUp — Compete. Win. Dominate.</span>
        <div style={{ display: 'flex', gap: 20 }}>
          <button onClick={() => navigate('/how-it-works')} style={{ background: 'none', border: 'none', color: theme.colors.textMuted, cursor: 'pointer', fontSize: 13 }}>Comment ça marche</button>
          <button onClick={() => navigate('/games')} style={{ background: 'none', border: 'none', color: theme.colors.textMuted, cursor: 'pointer', fontSize: 13 }}>Jeux</button>
        </div>
        <span>© 2026 SkillUp</span>
      </footer>
    </div>
  );
}
