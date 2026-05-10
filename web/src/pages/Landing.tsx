import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { theme } from '../theme';
import { useIsMobile } from '../hooks/useIsMobile';

/* ─── Fake live data ─────────────────────────── */
const LIVE_FEED = [
  { icon: '🏆', text: '#LUCA42 vient de gagner', amount: '+200 cr', sub: 'Brawl Stars · 1v1', time: '2 min' },
  { icon: '⚡', text: '#MARIO8 défie #SOFIA3', amount: '500 cr', sub: 'Brawl Stars · En cours', time: '4 min' },
  { icon: '💸', text: '#ZAP99 a retiré', amount: '45€', sub: 'Virement IBAN', time: '8 min' },
  { icon: '🏆', text: '#KING55 vient de gagner', amount: '+100 cr', sub: 'Brawl Stars · 1v1', time: '13 min' },
  { icon: '⚡', text: '#NEON77 défie #BLADE3', amount: '1 000 cr', sub: 'Brawl Stars · En attente', time: '18 min' },
  { icon: '🏆', text: '#ACE100 vient de gagner', amount: '+500 cr', sub: 'Brawl Stars · 1v1', time: '24 min' },
  { icon: '💸', text: '#WOLF22 a retiré', amount: '32€', sub: 'Virement IBAN', time: '31 min' },
];

const LIVE_MATCHES = [
  { p1: 'ALPHA42', p2: 'BETA88', wr1: 72, wr2: 68, wager: 500, game: '🌟 Brawl Stars', duration: '3 min' },
  { p1: 'NEON77', p2: 'VIPER9', wr1: 58, wr2: 81, wager: 200, game: '🌟 Brawl Stars', duration: '7 min' },
  { p1: 'KING55', p2: 'WOLF22', wr1: 91, wr2: 65, wager: 1000, game: '🌟 Brawl Stars', duration: '1 min' },
];

const NOTIFICATIONS = [
  { icon: '🏆', text: '#LUCA42 a gagné 15€' },
  { icon: '⚡', text: 'Match trouvé en 4 secondes' },
  { icon: '💸', text: '#ZAP99 a retiré 45€' },
  { icon: '👥', text: '482 joueurs en ligne' },
  { icon: '🔥', text: '#KING55 est en série de 5 wins' },
];

const TICKER_ITEMS = [
  '🏆 LUCA42 +200 cr sur Brawl Stars',
  '⚡ Match trouvé en 4s',
  '👥 482 joueurs en ligne',
  '💸 ZAP99 a retiré 45€',
  '🔥 KING55 — 5 victoires consécutives',
  '🏆 ACE100 +500 cr sur Brawl Stars',
  '⚡ 12 matchs actifs en ce moment',
  '💰 18 500 crédits distribués aujourd\'hui',
];

const FEATURES = [
  { icon: '⚡', title: 'Duels instantanés', desc: 'Lance un défi en 30 secondes. Partage ton hashtag, ton adversaire accepte, le duel commence.' },
  { icon: '🔒', title: 'Mises sécurisées', desc: 'Les crédits sont bloqués à l\'acceptation. Personne ne peut partir avec la mise sans résultat validé.' },
  { icon: '⚖️', title: 'Litiges arbitrés', desc: 'Résultats contradictoires ? Notre équipe tranche sous 24h sur la base des preuves soumises.' },
  { icon: '🏆', title: 'Progression & Badges', desc: 'Victoires, badges exclusifs, winrate, séries — suis ta progression en temps réel sur ton profil.' },
  { icon: '💸', title: 'Retraits réels', desc: '100 crédits = 1€. Retire sur ton compte bancaire quand tu veux, directement par virement IBAN.' },
  { icon: '🎮', title: 'Multi-jeux', desc: 'Brawl Stars disponible. Clash Royale, FC Mobile, Fortnite, Rocket League arrivent bientôt.' },
];

const GAMES_PREVIEW = [
  { slug: 'brawl-stars', name: 'Brawl Stars', emoji: '🌟', platform: 'Mobile', color: '#FFDE59', bg: 'linear-gradient(135deg, #1A1200, #2A1F00)', players: '1 240', available: true },
  { slug: 'clash-royale', name: 'Clash Royale', emoji: '👑', platform: 'Mobile', color: '#60A5FA', bg: 'linear-gradient(135deg, #0A1520, #0F1F35)', players: '—', available: false },
  { slug: 'fc-mobile', name: 'FC Mobile', emoji: '⚽', platform: 'Mobile', color: '#34D399', bg: 'linear-gradient(135deg, #001A0A, #002210)', players: '—', available: false },
  { slug: 'ea-fc', name: 'EA FC 25', emoji: '🏟️', platform: 'PC / Console', color: '#22D3EE', bg: 'linear-gradient(135deg, #001520, #001E2A)', players: '—', available: false },
];

/* ─── Ease ────────────────────────────────────── */
const ease = [0.22, 1, 0.36, 1] as const;
const fadeUp = { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease } } };
const stagger = (delay = 0) => ({ hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: delay } } });

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ backgroundColor: theme.colors.background, color: theme.colors.text, overflowX: 'hidden', maxWidth: '100%' }}>
      <HeroSection navigate={navigate} />
      <LiveTicker />
      <StepsSection />
      <FeaturesSection />
      <GamesSection navigate={navigate} />
      <LiveActivitySection />
      <CTASection navigate={navigate} />
      <Footer navigate={navigate} />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   HERO
═══════════════════════════════════════════════ */
function HeroSection({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const isMobile = useIsMobile();
  return (
    <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>
      {/* Animated background */}
      <AnimatedBackground />

      {/* Main content */}
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: isMobile ? '80px 20px 40px' : '80px 32px 60px', width: '100%', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 460px', gap: isMobile ? 40 : 48, alignItems: 'center' }}>

          {/* Left: text */}
          <motion.div variants={stagger(0.1)} initial="hidden" animate="visible">
            <motion.div variants={fadeUp} style={{ marginBottom: 28 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                backgroundColor: `${theme.colors.primary}18`,
                border: `1px solid ${theme.colors.primary}45`,
                borderRadius: theme.radius.full, padding: '7px 16px',
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: theme.colors.success, display: 'inline-block', animation: 'live-dot 1.6s ease-in-out infinite' }} />
                <span style={{ color: theme.colors.primaryLight, fontSize: 13, fontWeight: 600 }}>
                  482 joueurs en ligne · 100 crédits offerts
                </span>
              </div>
            </motion.div>

            <motion.h1 variants={fadeUp} style={{
              fontSize: 'clamp(44px, 5.5vw, 80px)',
              fontWeight: 900, lineHeight: 1.02, letterSpacing: -3,
              marginBottom: 24,
            }}>
              <span style={{
                background: theme.gradients.heroText,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                display: 'block',
              }}>Affronte des joueurs.</span>
              <span style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #C4B5FD 70%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                display: 'block',
              }}>Prouve ton skill.</span>
              <span style={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                display: 'block',
              }}>Gagne des crédits.</span>
            </motion.h1>

            <motion.p variants={fadeUp} style={{
              color: theme.colors.textSecondary, fontSize: 18, lineHeight: 1.7,
              maxWidth: 500, marginBottom: 40,
            }}>
              La première plateforme de duels gaming avec mises réelles. Défie des joueurs, soumets tes preuves, empoche tes gains.
            </motion.p>

            <motion.div variants={fadeUp} style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 40 }}>
              <PrimaryBtn onClick={() => navigate('/signup')}>⚡ Commencer — c'est gratuit</PrimaryBtn>
              <GhostBtn onClick={() => navigate('/how-it-works')}>Comment ça marche →</GhostBtn>
            </motion.div>

            <motion.div variants={fadeUp} style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
              {['Inscription gratuite', 'Retraits réels', 'Litiges arbitrés'].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    backgroundColor: `${theme.colors.success}20`,
                    border: `1px solid ${theme.colors.success}50`,
                    color: theme.colors.success, fontSize: 10, fontWeight: 900,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>✓</span>
                  <span style={{ color: theme.colors.textMuted, fontSize: 13 }}>{t}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: Matchmaking card */}
          <motion.div initial={{ opacity: 0, x: 40, y: 10 }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ duration: 0.9, delay: 0.3, ease }}>
            <MatchmakingCard navigate={navigate} />
          </motion.div>
        </div>
      </div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
        style={{
          position: 'relative', zIndex: 2,
          borderTop: `1px solid ${theme.colors.border}`,
          backgroundColor: `${theme.colors.surface}80`,
          backdropFilter: 'blur(20px)',
        }}
      >
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: isMobile ? '16px 20px' : '20px 32px', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 16 }}>
          {[
            { value: '482', label: 'joueurs en ligne', color: theme.colors.success },
            { value: '1 240', label: 'matchs aujourd\'hui', color: theme.colors.primary },
            { value: '18 500', label: 'crédits distribués', color: theme.colors.accent },
            { value: '< 5s', label: 'pour lancer un défi', color: theme.colors.secondary },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <p style={{ color: s.color, fontSize: 22, fontWeight: 900, lineHeight: 1 }}>{s.value}</p>
              <p style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 4 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

/* ─── Animated Background ─────────────────────── */
function AnimatedBackground() {
  return (
    <>
      {/* Grid */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: `linear-gradient(rgba(124,58,237,0.06) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(124,58,237,0.06) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />
      {/* Top glow */}
      <div style={{
        position: 'absolute', top: -200, left: '50%', transform: 'translateX(-50%)',
        width: 900, height: 600, borderRadius: '50%',
        background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.3) 0%, transparent 70%)',
        zIndex: 0, pointerEvents: 'none',
        animation: 'orb-drift-1 18s ease-in-out infinite',
      }} />
      {/* Orb 2 */}
      <div style={{
        position: 'absolute', top: '30%', right: 0,
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.12) 0%, transparent 70%)',
        zIndex: 0, pointerEvents: 'none',
        animation: 'orb-drift-2 22s ease-in-out infinite',
        transform: 'translateX(30%)',
      }} />
      {/* Orb 3 bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: '20%',
        width: 400, height: 300,
        background: 'radial-gradient(ellipse at center, rgba(245,158,11,0.06) 0%, transparent 70%)',
        zIndex: 0, pointerEvents: 'none',
        animation: 'orb-drift-3 25s ease-in-out infinite',
      }} />
      {/* Scanline */}
      <div style={{
        position: 'absolute', left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.15), transparent)',
        zIndex: 0, pointerEvents: 'none',
        animation: 'scan-line 8s linear infinite',
      }} />
    </>
  );
}

/* ─── Matchmaking Card ────────────────────────── */
function MatchmakingCard({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const isMobile = useIsMobile();
  const [idx, setIdx] = useState(0);
  const [notifIdx, setNotifIdx] = useState(0);

  useEffect(() => {
    const t1 = setInterval(() => setIdx(i => (i + 1) % LIVE_MATCHES.length), 6000);
    const t2 = setInterval(() => setNotifIdx(i => (i + 1) % NOTIFICATIONS.length), 4000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, []);

  const match = LIVE_MATCHES[idx];

  return (
    <div style={{ position: 'relative' }}>
      {/* Floating notification */}
      <AnimatePresence mode="wait">
        <motion.div
          key={notifIdx}
          initial={{ opacity: 0, x: 20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -10, scale: 0.97 }}
          transition={{ duration: 0.4, ease }}
          style={{
            position: 'absolute', top: -18, left: isMobile ? 0 : -20, zIndex: 10,
            backgroundColor: `${theme.colors.surface}f0`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.lg, padding: '9px 14px',
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            maxWidth: 'calc(100% - 20px)',
          }}
        >
          <span style={{ fontSize: 16 }}>{NOTIFICATIONS[notifIdx].icon}</span>
          <span style={{ color: theme.colors.text, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
            {NOTIFICATIONS[notifIdx].text}
          </span>
        </motion.div>
      </AnimatePresence>

      {/* Main card */}
      <div style={{
        backgroundColor: theme.colors.surface,
        border: `1.5px solid ${theme.colors.border}`,
        borderRadius: 24, overflow: 'hidden',
        boxShadow: `0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.1)`,
        animation: 'float-card 6s ease-in-out infinite',
        position: 'relative',
      }}>
        {/* Top bar */}
        <div style={{
          background: `linear-gradient(135deg, ${theme.colors.surfaceHigh}, ${theme.colors.surface})`,
          padding: '14px 20px',
          borderBottom: `1px solid ${theme.colors.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: theme.colors.success, display: 'inline-block', animation: 'live-dot 1.4s ease-in-out infinite', position: 'relative' }}>
              <span style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                backgroundColor: theme.colors.success,
                animation: 'pulse-ring 2s ease-out infinite',
              }} />
            </span>
            <span style={{ color: theme.colors.success, fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              En direct
            </span>
          </div>
          <AnimatePresence mode="wait">
            <motion.span
              key={idx}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: 500 }}
            >
              {match.game} · {match.duration}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* VS section */}
        <div style={{ padding: '28px 24px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}
            >
              <PlayerAvatar hashtag={match.p1} wr={match.wr1} isLeft />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 900, color: '#fff',
                  boxShadow: `0 0 24px ${theme.colors.primary}60`,
                  animation: 'vs-flash 2.5s ease-in-out infinite',
                }}>⚡</div>
                <span style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase' }}>VS</span>
              </div>
              <PlayerAvatar hashtag={match.p2} wr={match.wr2} />
            </motion.div>
          </AnimatePresence>

          {/* Wager */}
          <div style={{
            background: `linear-gradient(135deg, ${theme.colors.accent}15, ${theme.colors.surfaceHigh})`,
            border: `1px solid ${theme.colors.accent}30`,
            borderRadius: theme.radius.lg, padding: '12px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 16,
          }}>
            <div>
              <p style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>Mise en jeu</p>
              <p style={{ color: theme.colors.accent, fontSize: 20, fontWeight: 900 }}>
                {match.wager.toLocaleString('fr-FR')} cr
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: theme.colors.textMuted, fontSize: 10, marginBottom: 2 }}>= euros</p>
              <p style={{ color: theme.colors.text, fontSize: 15, fontWeight: 700 }}>
                {(match.wager / 100).toFixed(2)} €
              </p>
            </div>
          </div>

          <button onClick={() => navigate('/signup')} style={{
            width: '100%', padding: '13px 0',
            background: theme.gradients.primary, border: 'none',
            borderRadius: theme.radius.md, color: '#fff',
            fontSize: 14, fontWeight: 800, cursor: 'pointer',
            boxShadow: `0 0 24px ${theme.colors.primary}40`,
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 0 40px ${theme.colors.primary}60`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 0 24px ${theme.colors.primary}40`; }}
          >
            ⚡ Créer mon compte et jouer
          </button>
        </div>

        {/* Match count indicator */}
        <div style={{
          borderTop: `1px solid ${theme.colors.border}`,
          padding: '10px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          backgroundColor: `${theme.colors.surfaceHigh}80`,
        }}>
          <span style={{ color: theme.colors.textMuted, fontSize: 11 }}>Match</span>
          {LIVE_MATCHES.map((_, i) => (
            <div key={i} style={{
              width: i === idx ? 16 : 6, height: 6, borderRadius: 3,
              backgroundColor: i === idx ? theme.colors.primary : theme.colors.border,
              transition: 'all 0.3s ease',
            }} />
          ))}
          <span style={{ color: theme.colors.textMuted, fontSize: 11 }}>sur {LIVE_MATCHES.length}</span>
        </div>
      </div>

      {/* Bottom right label */}
      <div style={{
        position: 'absolute', bottom: -16, right: 16,
        backgroundColor: `${theme.colors.surfaceHigh}f0`,
        backdropFilter: 'blur(12px)',
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md, padding: '6px 12px',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ color: theme.colors.primary, fontSize: 12 }}>🎯</span>
        <span style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: 500 }}>12 matchs actifs en ce moment</span>
      </div>
    </div>
  );
}

function PlayerAvatar({ hashtag, wr, isLeft }: { hashtag: string; wr: number; isLeft?: boolean }) {
  const colors = ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
  const color = colors[hashtag.charCodeAt(0) % colors.length];
  return (
    <div style={{ textAlign: isLeft ? 'left' : 'right', flex: 1 }}>
      <div style={{
        width: 52, height: 52, borderRadius: '50%',
        background: `linear-gradient(135deg, ${color}30, ${color}10)`,
        border: `2px solid ${color}60`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, fontWeight: 900, color,
        margin: isLeft ? '0 0 8px 0' : '0 0 8px auto',
        boxShadow: `0 0 16px ${color}30`,
      }}>
        {hashtag[0]}
      </div>
      <p style={{ color: theme.colors.text, fontWeight: 800, fontSize: 14 }}>#{hashtag}</p>
      <p style={{ color: wr >= 70 ? theme.colors.success : theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>WR {wr}%</p>
    </div>
  );
}

/* ─── Ticker ──────────────────────────────────── */
function LiveTicker() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div style={{
      borderTop: `1px solid ${theme.colors.border}`,
      borderBottom: `1px solid ${theme.colors.border}`,
      backgroundColor: `${theme.colors.surface}90`,
      backdropFilter: 'blur(10px)',
      overflow: 'hidden', padding: '12px 0',
    }}>
      <div style={{
        display: 'flex', gap: 60,
        animation: 'ticker 30s linear infinite',
        whiteSpace: 'nowrap',
      }}>
        {doubled.map((item, i) => (
          <span key={i} style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: 500, flexShrink: 0 }}>
            {item}
            <span style={{ color: theme.colors.border, margin: '0 24px' }}>·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Steps section ──────────────────────────── */
function StepsSection() {
  const isMobile = useIsMobile();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} style={{ padding: isMobile ? '60px 20px' : '100px 24px', position: 'relative' }}>
      <div style={{ maxWidth: 1060, margin: '0 auto' }}>
        <motion.div variants={stagger()} initial="hidden" animate={inView ? 'visible' : 'hidden'}>
          <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 64 }}>
            <Chip color={theme.colors.primary}>SIMPLE & RAPIDE</Chip>
            <h2 style={{ color: theme.colors.text, fontSize: 'clamp(30px, 4vw, 44px)', fontWeight: 900, letterSpacing: -1.5, marginTop: 14 }}>
              Prêt à jouer en 3 étapes
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? 16 : 24 }}>
            {[
              { num: '01', icon: '👤', title: 'Crée ton compte', desc: 'Inscription gratuite, 100 crédits offerts. Reçois ton hashtag unique pour recevoir des défis.' },
              { num: '02', icon: '⚔️', title: 'Défie un joueur', desc: 'Entre le hashtag de ton adversaire, choisis la mise. Il reçoit le défi immédiatement.' },
              { num: '03', icon: '🏆', title: 'Joue & empoche', desc: 'Jouez, soumettez vos preuves. Le gagnant remporte le double de la mise automatiquement.' },
            ].map((step, i) => (
              <motion.div key={step.num} variants={fadeUp}>
                <div style={{
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: 22, padding: '32px 28px', height: '100%',
                  position: 'relative', overflow: 'hidden',
                  transition: 'border-color 0.25s, transform 0.25s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${theme.colors.primary}50`; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = theme.colors.border; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
                >
                  {/* Number watermark */}
                  <div style={{
                    position: 'absolute', bottom: -20, right: 12,
                    fontSize: 80, fontWeight: 900, color: `${theme.colors.primary}08`,
                    lineHeight: 1, pointerEvents: 'none', userSelect: 'none',
                  }}>{step.num}</div>
                  {/* Top accent */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: i === 0 ? theme.gradients.primary : i === 1 ? theme.gradients.accent : `linear-gradient(90deg, ${theme.colors.success}, #059669)`, opacity: 0.8 }} />

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 15, fontSize: 24, flexShrink: 0,
                      backgroundColor: `${theme.colors.primary}15`,
                      border: `1.5px solid ${theme.colors.primary}25`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{step.icon}</div>
                    <span style={{ color: theme.colors.primary, fontSize: 11, fontWeight: 800, letterSpacing: 2, opacity: 0.7 }}>ÉTAPE {step.num}</span>
                  </div>
                  <h3 style={{ color: theme.colors.text, fontWeight: 800, fontSize: 18, marginBottom: 10 }}>{step.title}</h3>
                  <p style={{ color: theme.colors.textSecondary, fontSize: 14, lineHeight: 1.75 }}>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Features ────────────────────────────────── */
function FeaturesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} style={{ padding: '80px 24px', backgroundColor: `${theme.colors.surface}40` }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <motion.div variants={stagger()} initial="hidden" animate={inView ? 'visible' : 'hidden'}>
          <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 56 }}>
            <Chip color={theme.colors.accent}>POURQUOI SKILLUP</Chip>
            <h2 style={{ color: theme.colors.text, fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, letterSpacing: -1.5, marginTop: 14 }}>
              La plateforme pensée pour les vrais gamers
            </h2>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {FEATURES.map(f => (
              <motion.div key={f.title} variants={fadeUp}>
                <FeatureCard {...f} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
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
        borderRadius: 20, padding: '28px 24px', height: '100%',
        transform: hover ? 'translateY(-4px)' : 'none',
        boxShadow: hover ? `0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px ${theme.colors.primary}20` : 'none',
        transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <div style={{
        width: 50, height: 50, borderRadius: 15, fontSize: 22,
        backgroundColor: hover ? `${theme.colors.primary}25` : `${theme.colors.primary}15`,
        border: `1.5px solid ${hover ? theme.colors.primary + '40' : theme.colors.primary + '20'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 18, transition: 'all 0.25s',
      }}>{icon}</div>
      <h3 style={{ color: theme.colors.text, fontWeight: 700, fontSize: 16, marginBottom: 10 }}>{title}</h3>
      <p style={{ color: theme.colors.textSecondary, fontSize: 14, lineHeight: 1.75 }}>{desc}</p>
    </div>
  );
}

/* ─── Games section ───────────────────────────── */
function GamesSection({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} style={{ padding: '96px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <motion.div variants={stagger()} initial="hidden" animate={inView ? 'visible' : 'hidden'}>
          <motion.div variants={fadeUp} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 44 }}>
            <div>
              <Chip color={theme.colors.primary}>JEUX</Chip>
              <h2 style={{ color: theme.colors.text, fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 900, letterSpacing: -1, marginTop: 12 }}>
                Plusieurs jeux, un seul endroit
              </h2>
            </div>
            <GhostBtn onClick={() => navigate('/games')}>Voir tous les jeux →</GhostBtn>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {GAMES_PREVIEW.map((game, i) => (
              <motion.div key={game.slug} variants={fadeUp}>
                <GamePreviewCard game={game} onClick={() => navigate('/games')} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function GamePreviewCard({ game, onClick }: { game: typeof GAMES_PREVIEW[0]; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: game.bg,
        border: `1.5px solid ${hover && game.available ? game.color + '80' : game.color + '25'}`,
        borderRadius: 22, overflow: 'hidden',
        cursor: game.available ? 'pointer' : 'default',
        transform: hover && game.available ? 'translateY(-6px) scale(1.01)' : 'none',
        boxShadow: hover && game.available ? `0 20px 60px rgba(0,0,0,0.5), 0 0 30px ${game.color}20` : '0 4px 20px rgba(0,0,0,0.3)',
        transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        opacity: game.available ? 1 : 0.6,
        position: 'relative',
      }}
    >
      {/* Shine on hover */}
      {hover && game.available && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: `linear-gradient(135deg, ${game.color}08, transparent 50%, ${game.color}04)`,
        }} />
      )}
      <div style={{ padding: '24px 22px', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <span style={{ fontSize: 38 }}>{game.emoji}</span>
          <span style={{
            backgroundColor: game.available ? `${theme.colors.success}20` : `${game.color}12`,
            border: `1px solid ${game.available ? theme.colors.success + '40' : game.color + '25'}`,
            color: game.available ? theme.colors.success : game.color,
            borderRadius: theme.radius.full, padding: '3px 10px',
            fontSize: 10, fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: 0.8,
          }}>
            {game.available ? '● Disponible' : 'Bientôt'}
          </span>
        </div>
        <p style={{ color: game.color, fontWeight: 900, fontSize: 17, marginBottom: 4 }}>{game.name}</p>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 14 }}>{game.platform} · 1v1</p>

        {game.available && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: theme.colors.success, display: 'inline-block' }} />
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{game.players} joueurs</span>
            </div>
            <span style={{ color: game.color, fontSize: 12, fontWeight: 700, opacity: hover ? 1 : 0.6, transition: 'opacity 0.2s' }}>
              Jouer →
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Live Activity ───────────────────────────── */
function LiveActivitySection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let n = 0;
    const target = 482;
    const interval = setInterval(() => {
      n = Math.min(n + Math.ceil(target / 40), target);
      setCounter(n);
      if (n >= target) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [inView]);

  return (
    <section ref={ref} style={{ padding: '96px 24px', backgroundColor: `${theme.colors.surface}50` }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <motion.div variants={stagger()} initial="hidden" animate={inView ? 'visible' : 'hidden'}>
          {/* Header */}
          <motion.div variants={fadeUp} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: theme.colors.success, display: 'inline-block', animation: 'live-dot 1.4s ease-in-out infinite' }} />
                <Chip color={theme.colors.success}>ACTIVITÉ EN DIRECT</Chip>
              </div>
              <h2 style={{ color: theme.colors.text, fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 900, letterSpacing: -1 }}>
                Ça se passe en ce moment
              </h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: theme.colors.success, fontSize: 36, fontWeight: 900, lineHeight: 1 }}>{counter}</p>
              <p style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 4 }}>joueurs en ligne</p>
            </div>
          </motion.div>

          {/* Feed */}
          <motion.div variants={stagger(0.05)} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {LIVE_FEED.map((item, i) => (
              <motion.div key={i} variants={fadeUp}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: 16, padding: '14px 20px',
                  transition: 'border-color 0.2s, background-color 0.2s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${theme.colors.primary}40`; (e.currentTarget as HTMLDivElement).style.backgroundColor = theme.colors.surfaceHigh; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = theme.colors.border; (e.currentTarget as HTMLDivElement).style.backgroundColor = theme.colors.surface; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, fontSize: 20, flexShrink: 0,
                      backgroundColor: `${theme.colors.surfaceHigh}`,
                      border: `1px solid ${theme.colors.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{item.icon}</div>
                    <div>
                      <p style={{ color: theme.colors.text, fontWeight: 600, fontSize: 14 }}>
                        {item.text}{' '}
                        <strong style={{ color: item.icon === '🏆' ? theme.colors.success : item.icon === '💸' ? theme.colors.accent : theme.colors.primary }}>
                          {item.amount}
                        </strong>
                      </p>
                      <p style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>{item.sub}</p>
                    </div>
                  </div>
                  <span style={{ color: theme.colors.textMuted, fontSize: 12, flexShrink: 0 }}>il y a {item.time}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── CTA Section ─────────────────────────────── */
function CTASection({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section ref={ref} style={{ padding: '100px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 70% 80% at 50% 50%, rgba(124,58,237,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <motion.div variants={stagger()} initial="hidden" animate={inView ? 'visible' : 'hidden'}>
          <motion.div variants={fadeUp}>
            <Chip color={theme.colors.primary}>REJOINS LA COMMUNAUTÉ</Chip>
          </motion.div>
          <motion.h2 variants={fadeUp} style={{
            fontSize: 'clamp(34px, 5vw, 60px)',
            fontWeight: 900, letterSpacing: -2, marginBottom: 18, marginTop: 16,
            background: theme.gradients.heroText,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Prêt à montrer ce que tu vaux ?
          </motion.h2>
          <motion.p variants={fadeUp} style={{ color: theme.colors.textSecondary, fontSize: 18, lineHeight: 1.7, marginBottom: 44 }}>
            Rejoins SkillUp gratuitement et reçois{' '}
            <strong style={{ color: theme.colors.accent }}>100 crédits</strong>{' '}
            pour commencer à défier des joueurs dès aujourd'hui.
          </motion.p>
          <motion.div variants={fadeUp} style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <PrimaryBtn onClick={() => navigate('/signup')}>⚡ Créer mon compte SkillUp</PrimaryBtn>
            <GhostBtn onClick={() => navigate('/games')}>Explorer les jeux</GhostBtn>
          </motion.div>
          <motion.p variants={fadeUp} style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 18 }}>
            Gratuit · Aucune carte bancaire requise · 100 crédits offerts
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Footer ──────────────────────────────────── */
function Footer({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const isMobile = useIsMobile();
  return (
    <footer style={{
      borderTop: `1px solid ${theme.colors.border}`,
      background: `linear-gradient(180deg, transparent, ${theme.colors.surface}60)`,
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '40px 20px 32px' : '56px 32px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr auto auto', gap: isMobile ? 32 : 48, marginBottom: 48 }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: theme.gradients.primary,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, boxShadow: '0 0 16px rgba(124,58,237,0.4)',
              }}>⚡</div>
              <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: -0.8 }}>
                Skill<span style={{ color: theme.colors.primaryLight }}>Up</span>
              </span>
            </div>
            <p style={{ color: theme.colors.textMuted, fontSize: 13, lineHeight: 1.7, maxWidth: 260 }}>
              La première plateforme de duels gaming avec mises réelles. Prouve ton skill, gagne des crédits.
            </p>
          </div>

          {/* Links 1 */}
          <div>
            <p style={{ color: theme.colors.textSecondary, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>Plateforme</p>
            {[
              { label: 'Comment ça marche', path: '/how-it-works' },
              { label: 'Jeux disponibles', path: '/games' },
              { label: 'Créer un compte', path: '/signup' },
            ].map(l => (
              <FooterLink key={l.path} label={l.label} onClick={() => navigate(l.path)} />
            ))}
          </div>

          {/* Links 2 */}
          <div>
            <p style={{ color: theme.colors.textSecondary, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>Compte</p>
            {[
              { label: 'Connexion', path: '/login' },
              { label: 'Inscription', path: '/signup' },
              { label: 'Portefeuille', path: '/wallet' },
            ].map(l => (
              <FooterLink key={l.path} label={l.label} onClick={() => navigate(l.path)} />
            ))}
          </div>
        </div>

        <div style={{
          borderTop: `1px solid ${theme.colors.border}`,
          paddingTop: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 12,
        }}>
          <p style={{ color: theme.colors.textMuted, fontSize: 12 }}>
            © 2025 SkillUp — Tous droits réservés
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: theme.colors.success, display: 'inline-block', animation: 'live-dot 2s ease-in-out infinite' }} />
            <span style={{ color: theme.colors.textMuted, fontSize: 12 }}>Tous les systèmes opérationnels</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ label, onClick }: { label: string; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'block', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
        color: hover ? theme.colors.text : theme.colors.textMuted,
        fontSize: 13, textAlign: 'left', transition: 'color 0.15s',
        marginBottom: 6,
      }}>
      {label}
    </button>
  );
}

/* ─── Shared components ───────────────────────── */
function Chip({ children, color }: { children: string; color: string }) {
  return (
    <span style={{
      display: 'inline-block',
      color, fontSize: 11, fontWeight: 800,
      letterSpacing: 2.5, textTransform: 'uppercase',
    }}>{children}</span>
  );
}

function PrimaryBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: theme.gradients.primary, border: 'none',
        borderRadius: theme.radius.lg, color: '#fff', cursor: 'pointer',
        padding: '16px 32px', fontSize: 16, fontWeight: 800,
        boxShadow: hover ? '0 0 64px rgba(124,58,237,0.6)' : theme.shadows.primary,
        transform: hover ? 'translateY(-2px) scale(1.01)' : 'none',
        transition: 'all 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
        whiteSpace: 'nowrap',
      }}>
      {children}
    </button>
  );
}

function GhostBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: 'none',
        border: `1.5px solid ${hover ? theme.colors.primary : theme.colors.borderLight}`,
        borderRadius: theme.radius.lg, color: hover ? theme.colors.text : theme.colors.textSecondary,
        cursor: 'pointer', padding: '16px 28px', fontSize: 15, fontWeight: 500,
        transition: 'all 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
        transform: hover ? 'translateY(-1px)' : 'none',
        whiteSpace: 'nowrap',
      }}>
      {children}
    </button>
  );
}
