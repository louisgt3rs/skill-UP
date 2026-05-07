import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { theme } from '../theme';

const FEATURES = [
  { icon: '⚡', title: 'Duels instantanés', desc: 'Lance un défi en 30 secondes. Partage ton hashtag, ton adversaire accepte, le duel commence immédiatement.' },
  { icon: '🔒', title: 'Mises sécurisées', desc: 'Les crédits sont bloqués dès l\'acceptation. Personne ne peut partir avec la mise sans résultat validé.' },
  { icon: '⚖️', title: 'Litiges arbitrés', desc: 'En cas de désaccord sur le résultat, notre équipe tranche sous 24h sur la base des preuves soumises.' },
  { icon: '🏆', title: 'Badges & progression', desc: 'Accumule des victoires, débloque des badges exclusifs et suis ta progression en temps réel sur ton profil.' },
  { icon: '💸', title: 'Retraits réels', desc: 'Tes crédits valent de vrais euros. Retire quand tu veux directement sur ton compte bancaire (IBAN).' },
  { icon: '🎮', title: 'Multi-jeux', desc: 'Brawl Stars disponible dès maintenant. Clash Royale, FC Mobile, Fortnite et plus arrivent très bientôt.' },
];

const STEPS = [
  { num: '01', icon: '👤', title: 'Crée ton compte', desc: 'Inscription gratuite en moins d\'une minute. Tu reçois 100 crédits de bienvenue (= 1€) pour démarrer sans risque.' },
  { num: '02', icon: '⚔️', title: 'Défie un joueur', desc: 'Choisis un jeu, entre le hashtag de ton adversaire et fixe la mise. Il reçoit une notification immédiatement.' },
  { num: '03', icon: '🏆', title: 'Joue et empoche', desc: 'Jouez en dehors de SkillUp. Soumettez vos résultats avec preuves. Le gagnant empoche le double de la mise.' },
];

const GAMES_PREVIEW = [
  { name: 'Brawl Stars', emoji: '🌟', platform: 'Mobile', color: '#FFDE59', available: true },
  { name: 'Clash Royale', emoji: '👑', platform: 'Mobile', color: '#60A5FA', available: false },
  { name: 'FC Mobile', emoji: '⚽', platform: 'Mobile', color: '#34D399', available: false },
  { name: 'EA FC 25', emoji: '🏟️', platform: 'PC / Console', color: '#22D3EE', available: false },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ backgroundColor: theme.colors.background, color: theme.colors.text, overflowX: 'hidden' }}>

      {/* ── HERO ── */}
      <section style={{
        position: 'relative',
        minHeight: '92vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
        padding: '80px 24px 60px',
      }}>
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'radial-gradient(ellipse 80% 60% at 50% -5%, rgba(124,58,237,0.35) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: `linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px)`,
          backgroundSize: '52px 52px',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 820 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            backgroundColor: `${theme.colors.primary}18`,
            border: `1px solid ${theme.colors.primary}40`,
            borderRadius: theme.radius.full,
            padding: '7px 18px', marginBottom: 40,
          }}>
            <span style={{ fontSize: 14 }}>🎁</span>
            <span style={{ color: theme.colors.primaryLight, fontSize: 13, fontWeight: 600 }}>
              100 crédits offerts à l'inscription — sans conditions
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(42px, 7vw, 76px)',
            fontWeight: 900, lineHeight: 1.05, letterSpacing: -2.5,
            marginBottom: 28,
            background: theme.gradients.heroText,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Affronte des joueurs.<br />
            Prouve ton skill.<br />
            Gagne des crédits.
          </h1>

          <p style={{
            color: theme.colors.textSecondary,
            fontSize: 'clamp(16px, 2.5vw, 20px)',
            lineHeight: 1.7, maxWidth: 560, margin: '0 auto 48px',
          }}>
            SkillUp est la première plateforme de duels gaming avec mises réelles.
            Défie des joueurs à ton niveau et fais valoir ton talent.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <HeroBtn primary onClick={() => navigate('/signup')}>
              Commencer gratuitement →
            </HeroBtn>
            <HeroBtn onClick={() => navigate('/how-it-works')}>
              Comment ça marche
            </HeroBtn>
          </div>

          <div style={{
            display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap',
            marginTop: 60, paddingTop: 44,
            borderTop: `1px solid ${theme.colors.border}`,
          }}>
            {['Inscription gratuite', 'Retraits réels', 'Litiges arbitrés', 'Disponible 24/7'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 18, height: 18, borderRadius: '50%',
                  backgroundColor: `${theme.colors.success}20`,
                  border: `1px solid ${theme.colors.success}50`,
                  color: theme.colors.success, fontSize: 10, fontWeight: 900,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>✓</span>
                <span style={{ color: theme.colors.textMuted, fontSize: 13 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '100px 24px', background: `linear-gradient(180deg, transparent, ${theme.colors.surface}70, transparent)` }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <SectionLabel color={theme.colors.primary}>SIMPLE & RAPIDE</SectionLabel>
          <SectionTitle>Prêt à jouer en 3 étapes</SectionTitle>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 20, marginTop: 56 }}>
            {STEPS.map(step => (
              <div key={step.num} style={{
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.xl, padding: '32px 28px',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                  background: theme.gradients.primary, opacity: 0.7,
                }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                  <span style={{
                    fontSize: 26, width: 50, height: 50, borderRadius: 14, flexShrink: 0,
                    backgroundColor: `${theme.colors.primary}18`,
                    border: `1px solid ${theme.colors.primary}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{step.icon}</span>
                  <span style={{ color: theme.colors.primary, fontSize: 11, fontWeight: 800, letterSpacing: 2, opacity: 0.8 }}>
                    ÉTAPE {step.num}
                  </span>
                </div>
                <h3 style={{ color: theme.colors.text, fontWeight: 800, fontSize: 18, marginBottom: 10 }}>{step.title}</h3>
                <p style={{ color: theme.colors.textSecondary, fontSize: 14, lineHeight: 1.75 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <SectionLabel color={theme.colors.accent}>POURQUOI SKILLUP</SectionLabel>
          <SectionTitle>La plateforme pensée pour les vrais gamers</SectionTitle>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginTop: 56 }}>
            {FEATURES.map(f => <FeatureCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── GAMES ── */}
      <section style={{ padding: '80px 24px', backgroundColor: `${theme.colors.surface}50` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 44 }}>
            <div>
              <SectionLabel color={theme.colors.primary}>JEUX</SectionLabel>
              <h2 style={{ color: theme.colors.text, fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 900, letterSpacing: -1, marginTop: 10 }}>
                Plusieurs jeux, un seul endroit
              </h2>
            </div>
            <button onClick={() => navigate('/games')} style={{
              background: 'none', border: `1.5px solid ${theme.colors.border}`,
              borderRadius: theme.radius.md, color: theme.colors.textSecondary,
              cursor: 'pointer', padding: '10px 22px', fontSize: 14,
            }}>
              Voir tous →
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 14 }}>
            {GAMES_PREVIEW.map(g => <GamePreviewCard key={g.name} game={g} onClick={() => navigate('/games')} />)}
          </div>
        </div>
      </section>

      {/* ── CREDITS FLOW ── */}
      <section style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <SectionLabel color={theme.colors.success}>CRÉDITS</SectionLabel>
          <h2 style={{ color: theme.colors.text, fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, letterSpacing: -1, margin: '12px 0 14px' }}>
            100 crédits = 1 €
          </h2>
          <p style={{ color: theme.colors.textSecondary, fontSize: 16, maxWidth: 500, margin: '0 auto 60px', lineHeight: 1.7 }}>
            Transparent, simple, sans frais cachés. Dépose, joue, retire.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 10 }}>
            {([
              { label: 'Dépôt', sub: '5 € = 500 cr', icon: '💳', color: theme.colors.secondary },
              null,
              { label: 'Mise bloquée', sub: 'pendant le duel', icon: '🔒', color: theme.colors.accent },
              null,
              { label: 'Victoire', sub: '+100% de la mise', icon: '🏆', color: theme.colors.success },
              null,
              { label: 'Retrait IBAN', sub: 'en 24-48h', icon: '💸', color: theme.colors.primary },
            ] as const).map((step, i) =>
              step === null ? (
                <span key={i} style={{ color: theme.colors.textMuted, fontSize: 22, fontWeight: 200 }}>→</span>
              ) : (
                <div key={i} style={{
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.lg, padding: '18px 20px',
                  minWidth: 120, textAlign: 'center',
                }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{step.icon}</div>
                  <p style={{ color: step.color, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{step.label}</p>
                  <p style={{ color: theme.colors.textMuted, fontSize: 11 }}>{step.sub}</p>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ padding: '100px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(124,58,237,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h2 style={{
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 900, letterSpacing: -1.5, marginBottom: 18,
            background: theme.gradients.heroText,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Prêt à montrer ce que tu vaux ?
          </h2>
          <p style={{ color: theme.colors.textSecondary, fontSize: 18, marginBottom: 44, lineHeight: 1.65 }}>
            Rejoins SkillUp gratuitement et reçois{' '}
            <strong style={{ color: theme.colors.accent }}>100 crédits</strong>{' '}
            pour commencer à défier des joueurs dès aujourd'hui.
          </p>
          <HeroBtn primary onClick={() => navigate('/signup')}>
            ⚡ Créer mon compte SkillUp
          </HeroBtn>
          <p style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 18 }}>
            Gratuit · Aucune carte bancaire requise
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${theme.colors.border}`, padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 18 }}>⚡</span>
          <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: -0.5 }}>
            Skill<span style={{ color: theme.colors.primary }}>Up</span>
          </span>
        </div>
        <p style={{ color: theme.colors.textMuted, fontSize: 12, marginBottom: 16 }}>
          La plateforme de duels gaming avec mises réelles.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
          {[
            { label: 'Comment ça marche', href: '/how-it-works' },
            { label: 'Jeux disponibles', href: '/games' },
            { label: 'Créer un compte', href: '/signup' },
          ].map(l => (
            <a key={l.href} href={l.href} style={{
              color: theme.colors.textMuted, fontSize: 12, textDecoration: 'none',
              transition: 'color 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = theme.colors.textSecondary)}
              onMouseLeave={e => (e.currentTarget.style.color = theme.colors.textMuted)}
            >{l.label}</a>
          ))}
        </div>
        <p style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 24, opacity: 0.5 }}>
          © 2025 SkillUp — Tous droits réservés
        </p>
      </footer>
    </div>
  );
}

function HeroBtn({ children, onClick, primary }: { children: React.ReactNode; onClick: () => void; primary?: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: primary ? theme.gradients.primary : 'none',
        border: primary ? 'none' : `1.5px solid ${hover ? theme.colors.primary : theme.colors.borderLight}`,
        borderRadius: theme.radius.lg,
        color: primary ? '#fff' : hover ? theme.colors.text : theme.colors.textSecondary,
        cursor: 'pointer',
        padding: '16px 36px', fontSize: 16, fontWeight: primary ? 800 : 500,
        boxShadow: primary ? (hover ? '0 0 60px rgba(124,58,237,0.5)' : theme.shadows.primary) : 'none',
        transform: hover ? 'translateY(-2px)' : 'none',
        transition: 'all 0.15s',
      }}
    >{children}</button>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        backgroundColor: hover ? theme.colors.surfaceHigh : theme.colors.surface,
        border: `1px solid ${hover ? theme.colors.primary + '40' : theme.colors.border}`,
        borderRadius: theme.radius.xl, padding: '28px 24px',
        transition: 'all 0.2s',
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 14, fontSize: 22,
        backgroundColor: `${theme.colors.primary}18`,
        border: `1px solid ${theme.colors.primary}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
      }}>{icon}</div>
      <h3 style={{ color: theme.colors.text, fontWeight: 700, fontSize: 16, marginBottom: 10 }}>{title}</h3>
      <p style={{ color: theme.colors.textSecondary, fontSize: 14, lineHeight: 1.75 }}>{desc}</p>
    </div>
  );
}

function GamePreviewCard({ game, onClick }: {
  game: { name: string; emoji: string; platform: string; color: string; available: boolean };
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        backgroundColor: theme.colors.surface,
        border: `1.5px solid ${hover ? game.color + '70' : game.color + '25'}`,
        borderRadius: theme.radius.xl, padding: '22px 20px',
        cursor: 'pointer',
        transform: hover ? 'translateY(-4px)' : 'none',
        transition: 'all 0.2s',
        opacity: game.available ? 1 : 0.6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 34 }}>{game.emoji}</span>
        <span style={{
          backgroundColor: game.available ? `${theme.colors.success}20` : theme.colors.surfaceHigh,
          border: `1px solid ${game.available ? theme.colors.success + '40' : theme.colors.border}`,
          color: game.available ? theme.colors.success : theme.colors.textMuted,
          borderRadius: theme.radius.full, padding: '3px 9px',
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const,
        }}>
          {game.available ? 'Dispo' : 'Bientôt'}
        </span>
      </div>
      <p style={{ color: game.color, fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{game.name}</p>
      <p style={{ color: theme.colors.textMuted, fontSize: 12 }}>{game.platform} · 1v1</p>
    </div>
  );
}

function SectionLabel({ children, color }: { children: string; color: string }) {
  return (
    <p style={{ color, fontSize: 11, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', textAlign: 'center' }}>
      {children}
    </p>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 style={{
      color: theme.colors.text,
      fontSize: 'clamp(28px, 4vw, 40px)',
      fontWeight: 900, letterSpacing: -1,
      textAlign: 'center', marginTop: 12,
    }}>{children}</h2>
  );
}
