import { useNavigate } from 'react-router-dom';
import { GAMES } from '../types';
import { theme } from '../theme';

const STEPS = [
  { icon: '🎮', title: 'Défiez', desc: 'Trouvez un adversaire via son hashtag unique et choisissez votre mise.' },
  { icon: '💰', title: 'Misez', desc: 'Choisissez le montant. 100 crédits = 1€. La mise est bloquée jusqu\'à la fin du duel.' },
  { icon: '🏆', title: 'Gagnez', desc: 'Le vainqueur remporte la totalité de la mise. Soumettez votre preuve et encaissez.' },
];

const STATS = [
  { value: '1 247', label: 'Joueurs actifs' },
  { value: '8 432', label: 'Duels joués' },
  { value: '2.5M', label: 'Crédits distribués' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ backgroundColor: theme.colors.background, minHeight: '100vh', overflowX: 'hidden' }}>

      {/* Navbar */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: 64,
        backgroundColor: `${theme.colors.background}ee`,
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${theme.colors.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24 }}>⚡</span>
          <span style={{ color: theme.colors.text, fontWeight: 800, fontSize: 20, letterSpacing: -0.5 }}>SkillUp</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => navigate('/login')} style={{
            background: 'none', border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.md, color: theme.colors.textSecondary,
            cursor: 'pointer', padding: '8px 20px', fontSize: 14, fontWeight: 500,
          }}>
            Connexion
          </button>
          <button onClick={() => navigate('/signup')} style={{
            background: theme.colors.primary, border: 'none',
            borderRadius: theme.radius.md, color: '#fff',
            cursor: 'pointer', padding: '8px 20px', fontSize: 14, fontWeight: 700,
          }}>
            Commencer
          </button>
        </div>
      </header>

      {/* Hero */}
      <section style={{
        textAlign: 'center',
        padding: '100px 24px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Glow */}
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 400,
          background: `radial-gradient(ellipse, ${theme.colors.primary}25 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        <div style={{
          display: 'inline-block',
          backgroundColor: `${theme.colors.primary}20`,
          border: `1px solid ${theme.colors.primary}50`,
          borderRadius: theme.radius.full,
          padding: '6px 18px',
          fontSize: 13,
          color: theme.colors.primaryLight,
          fontWeight: 600,
          letterSpacing: 1,
          marginBottom: 28,
        }}>
          ⚡ 100 crédits offerts à l'inscription
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 8vw, 72px)',
          fontWeight: 900,
          color: theme.colors.text,
          letterSpacing: -2,
          lineHeight: 1.05,
          marginBottom: 20,
          maxWidth: 800,
          margin: '0 auto 20px',
        }}>
          Gagnez de l'argent<br />
          <span style={{ color: theme.colors.primary }}>grâce à votre skill</span>
        </h1>

        <p style={{
          color: theme.colors.textSecondary,
          fontSize: 18,
          maxWidth: 520,
          margin: '0 auto 40px',
          lineHeight: 1.7,
        }}>
          Défiez d'autres joueurs en 1v1, misez des crédits,
          et prouvez que vous êtes le meilleur.
        </p>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/signup')} style={{
            backgroundColor: theme.colors.primary,
            border: 'none', borderRadius: theme.radius.md,
            color: '#fff', cursor: 'pointer',
            padding: '16px 40px', fontSize: 16, fontWeight: 700,
            boxShadow: `0 0 40px ${theme.colors.primary}60`,
          }}>
            Jouer maintenant — gratuit
          </button>
          <button onClick={() => { document.getElementById('games')?.scrollIntoView({ behavior: 'smooth' }); }} style={{
            background: 'none',
            border: `1.5px solid ${theme.colors.border}`,
            borderRadius: theme.radius.md, color: theme.colors.textSecondary,
            cursor: 'pointer', padding: '16px 32px', fontSize: 16, fontWeight: 500,
          }}>
            Voir les jeux ↓
          </button>
        </div>
      </section>

      {/* Stats */}
      <section style={{
        display: 'flex', justifyContent: 'center', flexWrap: 'wrap',
        gap: 0, borderTop: `1px solid ${theme.colors.border}`, borderBottom: `1px solid ${theme.colors.border}`,
        backgroundColor: theme.colors.surface,
      }}>
        {STATS.map((s, i) => (
          <div key={s.label} style={{
            flex: '1 1 160px', textAlign: 'center',
            padding: '28px 24px',
            borderRight: i < STATS.length - 1 ? `1px solid ${theme.colors.border}` : 'none',
          }}>
            <p style={{ color: theme.colors.primary, fontSize: 28, fontWeight: 900, letterSpacing: -1 }}>{s.value}</p>
            <p style={{ color: theme.colors.textSecondary, fontSize: 13, marginTop: 4 }}>{s.label}</p>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section style={{ padding: '80px 24px', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', color: theme.colors.text, fontSize: 32, fontWeight: 800, letterSpacing: -1, marginBottom: 8 }}>
          Comment ça marche ?
        </h2>
        <p style={{ textAlign: 'center', color: theme.colors.textSecondary, marginBottom: 56, fontSize: 15 }}>
          Trois étapes. Quelques minutes. Un vrai gain.
        </p>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
          {STEPS.map((step, i) => (
            <div key={step.title} style={{
              flex: '1 1 240px', maxWidth: 280,
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 20, padding: 28,
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', top: -16, left: 24,
                width: 32, height: 32,
                backgroundColor: theme.colors.primary,
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: 14,
              }}>{i + 1}</div>
              <div style={{ fontSize: 36, marginBottom: 12, marginTop: 8 }}>{step.icon}</div>
              <h3 style={{ color: theme.colors.text, fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{step.title}</h3>
              <p style={{ color: theme.colors.textSecondary, fontSize: 14, lineHeight: 1.6 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Games */}
      <section id="games" style={{ padding: '0 24px 80px', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', color: theme.colors.text, fontSize: 32, fontWeight: 800, letterSpacing: -1, marginBottom: 8 }}>
          Jeux disponibles
        </h2>
        <p style={{ textAlign: 'center', color: theme.colors.textSecondary, marginBottom: 48, fontSize: 15 }}>
          Choisissez votre jeu, trouvez un adversaire, et battez-vous.
        </p>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
          {GAMES.map(game => (
            <div
              key={game.slug}
              onClick={() => !game.comingSoon && navigate('/signup')}
              style={{
                flex: '1 1 220px', maxWidth: 260,
                backgroundColor: game.bg,
                border: `1.5px solid ${game.color}40`,
                borderRadius: 20, padding: 28,
                cursor: game.comingSoon ? 'default' : 'pointer',
                opacity: game.comingSoon ? 0.6 : 1,
                transition: 'transform 0.2s, border-color 0.2s',
                position: 'relative',
              }}
              onMouseEnter={e => { if (!game.comingSoon) (e.currentTarget as HTMLElement).style.borderColor = game.color; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `${game.color}40`; }}
            >
              {game.comingSoon && (
                <div style={{
                  position: 'absolute', top: 12, right: 12,
                  backgroundColor: `${theme.colors.border}`,
                  borderRadius: theme.radius.full,
                  padding: '3px 10px', fontSize: 11, color: theme.colors.textMuted, fontWeight: 600,
                }}>Bientôt</div>
              )}
              <div style={{ fontSize: 40, marginBottom: 12 }}>{game.emoji}</div>
              <h3 style={{ color: game.color, fontWeight: 800, fontSize: 18, marginBottom: 6 }}>{game.name}</h3>
              <p style={{ color: theme.colors.textSecondary, fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>{game.description}</p>
              <span style={{ color: theme.colors.textMuted, fontSize: 12 }}>{game.players}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA finale */}
      <section style={{
        textAlign: 'center', padding: '80px 24px',
        borderTop: `1px solid ${theme.colors.border}`,
        background: `radial-gradient(ellipse at 50% 0%, ${theme.colors.primary}15 0%, transparent 70%)`,
      }}>
        <h2 style={{ color: theme.colors.text, fontSize: 36, fontWeight: 900, letterSpacing: -1, marginBottom: 12 }}>
          Prêt à dominer ?
        </h2>
        <p style={{ color: theme.colors.textSecondary, fontSize: 16, marginBottom: 32 }}>
          Crée ton compte en 30 secondes. 1 000 crédits offerts.
        </p>
        <button onClick={() => navigate('/signup')} style={{
          backgroundColor: theme.colors.primary, border: 'none',
          borderRadius: theme.radius.md, color: '#fff',
          cursor: 'pointer', padding: '18px 48px',
          fontSize: 17, fontWeight: 700,
          boxShadow: `0 0 40px ${theme.colors.primary}50`,
        }}>
          Commencer gratuitement ⚡
        </button>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: `1px solid ${theme.colors.border}`,
        padding: '24px', textAlign: 'center',
        color: theme.colors.textMuted, fontSize: 13,
      }}>
        © 2026 SkillUp — Compete. Win. Dominate.
      </footer>
    </div>
  );
}
