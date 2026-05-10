import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { Profile, Match, GAMES } from '../types';
import { getMyMatches, acceptMatch, declineMatch } from '../lib/db';
import { getLevelInfo, getLevelColor } from '../lib/xp';
import Layout from '../components/Layout';
import { theme } from '../theme';

const STATUS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'En attente',   color: theme.colors.accent },
  active:    { label: 'En cours',     color: theme.colors.success },
  finished:  { label: 'À confirmer',  color: theme.colors.secondary },
  completed: { label: 'Terminé',      color: theme.colors.textMuted },
  disputed:  { label: 'Litige',       color: theme.colors.error },
};

interface Props {
  session: Session;
  profile: Profile | null;
  refreshProfile: () => void;
}

export default function Dashboard({ session, profile, refreshProfile }: Props) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = () => {
    getMyMatches(session.user.id).then(data => { setMatches(data); setLoading(false); });
  };

  useEffect(() => { load(); }, [session.user.id]);

  const pending = matches.filter(m => m.status === 'pending' && m.opponent_id === session.user.id);
  const active  = matches.filter(m => ['active', 'finished'].includes(m.status));
  const history = matches.filter(m => ['completed', 'disputed'].includes(m.status));

  const gameName  = (slug: string) => GAMES.find(g => g.slug === slug)?.name ?? slug;
  const gameEmoji = (slug: string) => GAMES.find(g => g.slug === slug)?.emoji ?? '🎮';

  const handleAccept = async (match: Match) => {
    if (!profile || profile.credits < match.wager) { alert('Crédits insuffisants'); return; }
    await acceptMatch(match);
    refreshProfile();
    load();
  };

  const xp = profile?.xp ?? 0;
  const lvl = getLevelInfo(xp);
  const levelColor = getLevelColor(lvl.level);
  const completedMatches = history.filter(m => m.status === 'completed');
  const wins = completedMatches.filter(m => m.winner_id === session.user.id).length;
  const losses = completedMatches.filter(m => m.winner_id !== null && m.winner_id !== session.user.id).length;
  const winRate = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;

  return (
    <Layout>
      {/* ── XP + Level header ── */}
      <div style={{
        background: `linear-gradient(135deg, ${theme.colors.surface}, ${theme.colors.background})`,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.xl, padding: '22px 24px', marginBottom: 24,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* bg glow */}
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 160, height: 160, borderRadius: '50%',
          background: `radial-gradient(${levelColor}20, transparent)`,
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{
                backgroundColor: `${levelColor}20`,
                border: `1.5px solid ${levelColor}50`,
                borderRadius: theme.radius.full, padding: '3px 12px',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ color: levelColor, fontSize: 11, fontWeight: 900, letterSpacing: 1 }}>
                  NV. {lvl.level}
                </span>
                <span style={{ color: `${levelColor}90`, fontSize: 10, fontWeight: 600 }}>
                  {lvl.title}
                </span>
              </div>
              {(profile?.win_streak ?? 0) >= 3 && (
                <div style={{
                  backgroundColor: `${theme.colors.error}15`,
                  border: `1px solid ${theme.colors.error}30`,
                  borderRadius: theme.radius.full, padding: '3px 10px',
                }}>
                  <span style={{ color: theme.colors.error, fontSize: 11, fontWeight: 700 }}>
                    🔥 {profile?.win_streak} victoires d'affilée
                  </span>
                </div>
              )}
            </div>
            <h1 style={{ color: theme.colors.text, fontSize: 24, fontWeight: 900, letterSpacing: -0.5, marginBottom: 4 }}>
              Bonjour, {profile?.username ?? 'Joueur'} 👋
            </h1>
            <p style={{ color: theme.colors.textMuted, fontSize: 13 }}>
              Ton hashtag :{' '}
              <span style={{
                color: theme.colors.primaryLight, fontWeight: 700,
                backgroundColor: `${theme.colors.primary}15`,
                border: `1px solid ${theme.colors.primary}25`,
                borderRadius: 6, padding: '1px 8px', fontSize: 12, letterSpacing: 1,
              }}>#{profile?.hashtag}</span>
              {' '}— partage-le pour recevoir des défis
            </p>
          </div>
          <button
            onClick={() => navigate('/games')}
            style={{
              background: theme.gradients.primary, border: 'none',
              borderRadius: theme.radius.md, color: '#fff', cursor: 'pointer',
              padding: '11px 22px', fontSize: 14, fontWeight: 700,
              boxShadow: theme.shadows.primary, flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
          >⚡ Nouveau duel</button>
        </div>

        {/* XP bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: theme.colors.textMuted, fontSize: 11 }}>
              {lvl.currentXp} / {lvl.neededXp} XP
            </span>
            <span style={{ color: levelColor, fontSize: 11, fontWeight: 700 }}>
              → Niveau {lvl.level + 1}
            </span>
          </div>
          <div style={{
            height: 8, borderRadius: 4,
            backgroundColor: `${levelColor}20`,
            border: `1px solid ${levelColor}25`,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 4,
              width: `${lvl.progress}%`,
              background: `linear-gradient(90deg, ${levelColor}80, ${levelColor})`,
              boxShadow: `0 0 8px ${levelColor}60`,
              transition: 'width 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
            }} />
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div onClick={() => navigate('/wallet')} style={{
          background: `linear-gradient(135deg, ${theme.colors.accent}18, ${theme.colors.surface})`,
          border: `1.5px solid ${theme.colors.accent}30`,
          borderRadius: theme.radius.xl, padding: '18px 20px', cursor: 'pointer',
          position: 'relative', overflow: 'hidden',
        }}
          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = `${theme.colors.accent}60`}
          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = `${theme.colors.accent}30`}
        >
          <p style={{ color: theme.colors.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Crédits</p>
          <p style={{ color: theme.colors.accent, fontSize: 28, fontWeight: 900, lineHeight: 1, marginBottom: 3 }}>
            {(profile?.credits ?? 0).toLocaleString('fr-FR')}
          </p>
          <p style={{ color: theme.colors.textMuted, fontSize: 11 }}>≈ {((profile?.credits ?? 0) / 100).toFixed(2)} €</p>
        </div>

        <div style={{
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.xl, padding: '18px 20px',
        }}>
          <p style={{ color: theme.colors.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Victoires</p>
          <p style={{ color: theme.colors.success, fontSize: 28, fontWeight: 900 }}>{profile?.wins ?? 0}</p>
          <p style={{ color: theme.colors.textMuted, fontSize: 11 }}>winrate {winRate}%</p>
        </div>

        <div style={{
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.xl, padding: '18px 20px',
        }}>
          <p style={{ color: theme.colors.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Série</p>
          <p style={{ color: (profile?.win_streak ?? 0) >= 3 ? theme.colors.error : theme.colors.text, fontSize: 28, fontWeight: 900 }}>
            {profile?.win_streak ?? 0}
          </p>
          <p style={{ color: theme.colors.textMuted, fontSize: 11 }}>victoires d'affilée</p>
        </div>

        {pending.length > 0 && (
          <div style={{
            background: `linear-gradient(135deg, ${theme.colors.error}15, ${theme.colors.surface})`,
            border: `1.5px solid ${theme.colors.error}30`,
            borderRadius: theme.radius.xl, padding: '18px 20px',
            position: 'relative',
          }}>
            <span style={{
              position: 'absolute', top: 12, right: 12,
              width: 8, height: 8, borderRadius: '50%',
              backgroundColor: theme.colors.error,
              boxShadow: `0 0 8px ${theme.colors.error}`,
            }} />
            <p style={{ color: theme.colors.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Défis reçus</p>
            <p style={{ color: theme.colors.error, fontSize: 28, fontWeight: 900 }}>{pending.length}</p>
            <p style={{ color: theme.colors.textMuted, fontSize: 11 }}>en attente</p>
          </div>
        )}
      </div>

      {/* ── Quick actions ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 28 }}>
        {[
          { icon: '🎮', label: 'Choisir un jeu', sub: 'Lancer un duel', color: theme.colors.primary, path: '/games' },
          { icon: '🏆', label: 'Classement',     sub: 'Voir ton rang', color: theme.colors.accent,  path: '/leaderboard' },
          { icon: '💬', label: 'Chat',            sub: 'Tes amis',      color: theme.colors.success, path: '/chat' },
        ].map(a => (
          <button key={a.path} onClick={() => navigate(a.path)} style={{
            backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.xl, padding: '16px 14px',
            cursor: 'pointer', textAlign: 'left',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = `${a.color}50`;
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = theme.colors.surfaceHigh;
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = theme.colors.border;
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = theme.colors.surface;
              (e.currentTarget as HTMLButtonElement).style.transform = 'none';
            }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: 12, fontSize: 18,
              backgroundColor: `${a.color}15`, border: `1px solid ${a.color}25`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10,
            }}>{a.icon}</div>
            <p style={{ color: theme.colors.text, fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{a.label}</p>
            <p style={{ color: theme.colors.textMuted, fontSize: 11 }}>{a.sub}</p>
          </button>
        ))}
      </div>

      {/* ── Pending challenges ── */}
      {pending.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <h2 style={{ color: theme.colors.text, fontWeight: 800, fontSize: 15 }}>Défis reçus</h2>
            <span style={{
              background: theme.gradients.primary, color: '#fff',
              fontSize: 11, fontWeight: 900,
              borderRadius: theme.radius.full, padding: '2px 9px',
              boxShadow: `0 0 12px ${theme.colors.primary}60`,
            }}>{pending.length}</span>
          </div>
          {pending.map(match => (
            <div key={match.id} style={{
              background: `linear-gradient(135deg, ${theme.colors.accent}06, ${theme.colors.surface})`,
              border: `1.5px solid ${theme.colors.accent}30`,
              borderRadius: theme.radius.xl, padding: '16px 20px', marginBottom: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, fontSize: 24,
                  backgroundColor: `${theme.colors.accent}15`,
                  border: `1px solid ${theme.colors.accent}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{gameEmoji(match.game)}</div>
                <div>
                  <p style={{ color: theme.colors.text, fontWeight: 700, fontSize: 14 }}>{gameName(match.game)}</p>
                  <p style={{ color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                    De <span style={{ color: theme.colors.primary, fontWeight: 700 }}>#{match.challenger?.hashtag}</span>
                    {' '}· <span style={{ color: theme.colors.accent, fontWeight: 700 }}>{match.wager} cr</span>
                    <span style={{ color: theme.colors.textMuted }}> ({(match.wager / 100).toFixed(2)} €)</span>
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => declineMatch(match.id).then(load)}
                  style={{
                    background: 'none', border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.radius.md, color: theme.colors.textMuted,
                    cursor: 'pointer', padding: '8px 16px', fontSize: 13,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = theme.colors.error; e.currentTarget.style.color = theme.colors.error; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = theme.colors.border; e.currentTarget.style.color = theme.colors.textMuted; }}
                >Refuser</button>
                <button
                  onClick={() => handleAccept(match)}
                  style={{
                    backgroundColor: theme.colors.success, border: 'none',
                    borderRadius: theme.radius.md, color: '#fff',
                    cursor: 'pointer', padding: '8px 20px', fontSize: 13, fontWeight: 700,
                    boxShadow: `0 0 14px ${theme.colors.success}40`,
                  }}
                >✓ Accepter</button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ── Active matches ── */}
      {active.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ color: theme.colors.text, fontWeight: 800, fontSize: 15, marginBottom: 14 }}>Duels en cours</h2>
          {active.map(match => {
            const isChallenger = match.challenger_id === session.user.id;
            const opponent = isChallenger ? match.opponent : match.challenger;
            const s = STATUS[match.status];
            return (
              <div
                key={match.id}
                onClick={() => navigate(`/match/${match.id}`)}
                style={{
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.xl, padding: '14px 20px', marginBottom: 8,
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: 12,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = theme.colors.primary + '60'; (e.currentTarget as HTMLDivElement).style.backgroundColor = theme.colors.surfaceHigh; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = theme.colors.border; (e.currentTarget as HTMLDivElement).style.backgroundColor = theme.colors.surface; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12, fontSize: 20,
                    backgroundColor: theme.colors.surfaceHigh,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{gameEmoji(match.game)}</div>
                  <div>
                    <p style={{ color: theme.colors.text, fontWeight: 700, fontSize: 14 }}>{gameName(match.game)}</p>
                    <p style={{ color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                      vs{' '}
                      <span style={{ color: theme.colors.primaryLight, fontWeight: 600 }}>#{opponent?.hashtag}</span>
                      {' '}· <span style={{ color: theme.colors.accent, fontWeight: 600 }}>{match.wager} cr</span>
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {match.status === 'active' && (
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%',
                      backgroundColor: theme.colors.success,
                      boxShadow: `0 0 8px ${theme.colors.success}`,
                      display: 'inline-block',
                    }} />
                  )}
                  <span style={{
                    backgroundColor: `${s.color}18`, color: s.color,
                    border: `1px solid ${s.color}35`,
                    borderRadius: theme.radius.full, padding: '4px 12px',
                    fontSize: 12, fontWeight: 600,
                  }}>{s.label}</span>
                  <span style={{ color: theme.colors.textMuted, fontSize: 16 }}>›</span>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* ── Empty state ── */}
      {!loading && matches.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '60px 24px',
          background: `linear-gradient(135deg, ${theme.colors.surface}, ${theme.colors.background})`,
          border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.xxl,
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', fontSize: 32,
            background: `${theme.colors.primary}15`,
            border: `1.5px solid ${theme.colors.primary}25`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 18px',
          }}>⚡</div>
          <h3 style={{ color: theme.colors.text, fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Lance ton premier duel</h3>
          <p style={{ color: theme.colors.textSecondary, fontSize: 14, marginBottom: 24, maxWidth: 300, margin: '0 auto 24px' }}>
            Chaque match te rapporte de l'XP — même en perdant. Commence à progresser maintenant.
          </p>
          <button onClick={() => navigate('/games')} style={{
            background: theme.gradients.primary, border: 'none',
            borderRadius: theme.radius.md, color: '#fff',
            cursor: 'pointer', padding: '12px 28px', fontSize: 14, fontWeight: 700,
            boxShadow: theme.shadows.primary,
          }}>⚡ Choisir un jeu</button>
        </div>
      )}

      {/* ── History ── */}
      {history.length > 0 && (
        <section>
          <h2 style={{ color: theme.colors.text, fontWeight: 800, fontSize: 15, marginBottom: 14 }}>Historique</h2>
          {history.slice(0, 10).map(match => {
            const won = match.winner_id === session.user.id;
            const isChallenger = match.challenger_id === session.user.id;
            const opponent = isChallenger ? match.opponent : match.challenger;
            const xpGained = match.status === 'completed' ? (won ? `+${150} XP` : `+${30} XP`) : null;
            return (
              <div
                key={match.id}
                onClick={() => navigate(`/match/${match.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.lg, padding: '12px 18px', marginBottom: 6,
                  cursor: 'pointer', transition: 'opacity 0.15s', opacity: 0.9,
                }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.opacity = '1'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.opacity = '0.9'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{gameEmoji(match.game)}</span>
                  <div>
                    <p style={{ color: theme.colors.text, fontWeight: 600, fontSize: 13 }}>{gameName(match.game)}</p>
                    <p style={{ color: theme.colors.textMuted, fontSize: 11 }}>vs #{opponent?.hashtag}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{
                    fontWeight: 800, fontSize: 13,
                    color: match.status === 'disputed' ? theme.colors.error : won ? theme.colors.success : theme.colors.error,
                  }}>
                    {match.status === 'disputed' ? '⚖️ Litige' : won ? `+${match.wager} cr` : `-${match.wager} cr`}
                  </p>
                  {xpGained && (
                    <p style={{ color: theme.colors.primary, fontSize: 10, fontWeight: 700 }}>{xpGained}</p>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}
    </Layout>
  );
}
