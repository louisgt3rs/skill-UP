import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Session } from '@supabase/supabase-js';
import { Profile, Match, GAMES } from '../types';
import { getMyMatches, acceptMatch, declineMatch, getLeaderboard } from '../lib/db';
import { getLevelInfo, getLevelColor } from '../lib/xp';
import { theme } from '../theme';
import { useIsMobile } from '../hooks/useIsMobile';

const LIVE_TICKER = [
  '🏆 ALPHA42 vient de gagner +500 cr sur Brawl Stars',
  '⚡ NEON77 défie VIPER9 — mise 200 cr',
  '🔥 KING55 est en série de 5 victoires',
  '💸 ZAP99 a retiré 45€ par virement',
  '⚡ Match trouvé en 3 secondes',
  '🏆 BOSS1 vient de gagner +300 cr',
  '👥 482 joueurs en ligne maintenant',
  '⚡ 12 matchs actifs en ce moment',
];

interface Props {
  session: Session;
  profile: Profile | null;
  refreshProfile: () => void;
}

export default function Hub({ session, profile, refreshProfile }: Props) {
  const [matches, setMatches]     = useState<Match[]>([]);
  const [topPlayers, setTopPlayers] = useState<Profile[]>([]);
  const [tickerIdx, setTickerIdx] = useState(0);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const load = () => getMyMatches(session.user.id).then(setMatches);

  useEffect(() => {
    load();
    getLeaderboard().then(data => setTopPlayers(data.slice(0, 5)));
  }, [session.user.id]);

  useEffect(() => {
    const t = setInterval(() => setTickerIdx(i => (i + 1) % LIVE_TICKER.length), 3500);
    return () => clearInterval(t);
  }, []);

  const pending  = matches.filter(m => m.status === 'pending' && m.opponent_id === session.user.id);
  const active   = matches.filter(m => ['active', 'finished'].includes(m.status));
  const history  = matches.filter(m => m.status === 'completed').slice(0, 5);

  const xp = profile?.xp ?? 0;
  const lvl = getLevelInfo(xp);
  const levelColor = getLevelColor(lvl.level);
  const wins  = matches.filter(m => m.status === 'completed' && m.winner_id === session.user.id).length;
  const totalCompleted = matches.filter(m => m.status === 'completed').length;
  const winRate = totalCompleted > 0 ? Math.round((wins / totalCompleted) * 100) : 0;
  const myRank  = topPlayers.findIndex(p => p.id === session.user.id) + 1;

  const gameName  = (slug: string) => GAMES.find(g => g.slug === slug)?.name ?? slug;
  const gameEmoji = (slug: string) => GAMES.find(g => g.slug === slug)?.emoji ?? '🎮';

  const handleAccept = async (match: Match) => {
    if (!profile || profile.credits < match.wager) { alert('Crédits insuffisants'); return; }
    await acceptMatch(match);
    refreshProfile();
    load();
  };

  return (
    <div style={{ backgroundColor: theme.colors.background, minHeight: 'calc(100vh - 64px)' }}>

      {/* ── LIVE TICKER ── */}
      <div style={{
        backgroundColor: `${theme.colors.primary}12`,
        borderBottom: `1px solid ${theme.colors.primary}20`,
        padding: '8px 0', overflow: 'hidden',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
            backgroundColor: theme.colors.error,
            borderRadius: 4, padding: '2px 8px',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#fff', display: 'inline-block', animation: 'live-dot 1s ease-in-out infinite' }} />
            <span style={{ color: '#fff', fontSize: 10, fontWeight: 900, letterSpacing: 1 }}>LIVE</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.span
              key={tickerIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              style={{ color: theme.colors.textSecondary, fontSize: 13, fontWeight: 500 }}
            >
              {LIVE_TICKER[tickerIdx]}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* ── BALANCE HERO ── */}
      <div style={{
        background: `linear-gradient(180deg, ${theme.colors.surface}80 0%, transparent 100%)`,
        borderBottom: `1px solid ${theme.colors.border}`,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '20px 16px' : '28px 32px' }}>

          {/* Top row: user info + balance */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Avatar */}
              <div style={{
                width: isMobile ? 48 : 56, height: isMobile ? 48 : 56, borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${levelColor}60, ${levelColor}20)`,
                border: `2.5px solid ${levelColor}80`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: isMobile ? 22 : 26, fontWeight: 900, color: levelColor,
                boxShadow: `0 0 20px ${levelColor}40`,
              }}>
                {profile?.username?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ color: theme.colors.text, fontWeight: 900, fontSize: isMobile ? 16 : 18 }}>
                    {profile?.username}
                  </span>
                  <span style={{
                    backgroundColor: `${levelColor}20`, border: `1px solid ${levelColor}40`,
                    borderRadius: theme.radius.full, padding: '2px 10px',
                    color: levelColor, fontSize: 11, fontWeight: 800,
                  }}>Nv. {lvl.level} · {lvl.title}</span>
                  {(profile?.win_streak ?? 0) >= 3 && (
                    <span style={{
                      backgroundColor: `${theme.colors.error}15`, border: `1px solid ${theme.colors.error}30`,
                      borderRadius: theme.radius.full, padding: '2px 10px',
                      color: theme.colors.error, fontSize: 11, fontWeight: 700,
                    }}>🔥 {profile?.win_streak} série</span>
                  )}
                </div>
                <span style={{ color: theme.colors.textMuted, fontSize: 12 }}>#{profile?.hashtag}</span>
              </div>
            </div>

            {/* Balance */}
            <div style={{
              background: `linear-gradient(135deg, ${theme.colors.accent}18, ${theme.colors.surface})`,
              border: `1.5px solid ${theme.colors.accent}35`,
              borderRadius: 18, padding: isMobile ? '14px 18px' : '16px 24px',
              textAlign: isMobile ? 'left' : 'right', cursor: 'pointer',
              boxShadow: `0 0 30px ${theme.colors.accent}15`,
            }} onClick={() => navigate('/wallet')}>
              <p style={{ color: theme.colors.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Solde</p>
              <p style={{ color: theme.colors.accent, fontSize: isMobile ? 28 : 36, fontWeight: 900, lineHeight: 1, letterSpacing: -1 }}>
                {(profile?.credits ?? 0).toLocaleString('fr-FR')}
                <span style={{ fontSize: 14, fontWeight: 600, marginLeft: 4, opacity: 0.7 }}>cr</span>
              </p>
              <p style={{ color: `${theme.colors.accent}80`, fontSize: 12, marginTop: 4 }}>
                ≈ {((profile?.credits ?? 0) / 100).toFixed(2)} € · <span style={{ textDecoration: 'underline' }}>Retirer</span>
              </p>
            </div>
          </div>

          {/* XP bar + stats strip */}
          <div style={{
            backgroundColor: `${theme.colors.surfaceHigh}60`,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: 16, padding: '14px 20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 24, flexWrap: 'wrap' }}>
              {/* XP bar */}
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: levelColor, fontSize: 11, fontWeight: 700 }}>
                    {lvl.currentXp} / {lvl.neededXp} XP
                  </span>
                  <span style={{ color: theme.colors.textMuted, fontSize: 11 }}>→ Nv.{lvl.level + 1}</span>
                </div>
                <div style={{ height: 7, borderRadius: 4, backgroundColor: `${levelColor}20`, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${lvl.progress}%` }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      height: '100%', borderRadius: 4,
                      background: `linear-gradient(90deg, ${levelColor}70, ${levelColor})`,
                      boxShadow: `0 0 8px ${levelColor}60`,
                    }}
                  />
                </div>
              </div>
              {/* Stats mini */}
              {[
                { label: 'Victoires', value: profile?.wins ?? 0, color: theme.colors.success },
                { label: 'WinRate', value: `${winRate}%`, color: theme.colors.primary },
                { label: 'Rang', value: myRank > 0 ? `#${myRank}` : '—', color: theme.colors.accent },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center', minWidth: 52 }}>
                  <p style={{ color: s.color, fontSize: isMobile ? 16 : 20, fontWeight: 900 }}>{s.value}</p>
                  <p style={{ color: theme.colors.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '20px 16px' : '28px 32px' }}>

        {/* ── PENDING CHALLENGES — PRIORITY ALERT ── */}
        <AnimatePresence>
          {pending.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              style={{
                background: `linear-gradient(135deg, ${theme.colors.error}18, ${theme.colors.surface})`,
                border: `2px solid ${theme.colors.error}50`,
                borderRadius: 20, padding: '18px 22px', marginBottom: 24,
                boxShadow: `0 0 40px ${theme.colors.error}20`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{
                  width: 10, height: 10, borderRadius: '50%', backgroundColor: theme.colors.error,
                  boxShadow: `0 0 12px ${theme.colors.error}`, display: 'inline-block',
                  animation: 'live-dot 1s ease-in-out infinite',
                }} />
                <span style={{ color: theme.colors.error, fontWeight: 900, fontSize: 14 }}>
                  {pending.length} défi{pending.length > 1 ? 's' : ''} en attente !
                </span>
              </div>
              {pending.map(match => (
                <div key={match.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  flexWrap: 'wrap', gap: 10, marginBottom: 8,
                  padding: '12px 16px', backgroundColor: `${theme.colors.surface}80`,
                  borderRadius: 14, border: `1px solid ${theme.colors.error}25`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{gameEmoji(match.game)}</span>
                    <div>
                      <p style={{ color: theme.colors.text, fontWeight: 700, fontSize: 14 }}>
                        #{match.challenger?.hashtag} te défie — {gameName(match.game)}
                      </p>
                      <p style={{ color: theme.colors.accent, fontSize: 13, fontWeight: 700 }}>
                        {match.wager} cr <span style={{ color: theme.colors.textMuted, fontWeight: 400 }}>({(match.wager / 100).toFixed(2)} €)</span>
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => declineMatch(match.id).then(load)} style={{
                      background: 'none', border: `1px solid ${theme.colors.border}`,
                      borderRadius: 10, color: theme.colors.textMuted,
                      cursor: 'pointer', padding: '8px 16px', fontSize: 13,
                    }}>Refuser</button>
                    <button onClick={() => handleAccept(match)} style={{
                      background: theme.gradients.primary, border: 'none',
                      borderRadius: 10, color: '#fff', cursor: 'pointer',
                      padding: '8px 20px', fontSize: 13, fontWeight: 700,
                      boxShadow: `0 0 16px ${theme.colors.primary}50`,
                    }}>⚡ Accepter</button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── TWO COLUMNS: Games + Right sidebar ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 300px',
          gap: 24,
          marginBottom: 24,
        }}>
          {/* LEFT: Game lobby */}
          <div>
            <SectionTitle icon="🎮" label="Jouer maintenant" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
              {GAMES.map(game => (
                <GameCard key={game.slug} game={game} onClick={() => navigate(`/games/${game.slug}`)} />
              ))}
            </div>

            {/* Active matches */}
            {active.length > 0 && (
              <>
                <SectionTitle icon="⚔️" label="Mes duels en cours" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
                  {active.map(match => {
                    const isChallenger = match.challenger_id === session.user.id;
                    const opp = isChallenger ? match.opponent : match.challenger;
                    return (
                      <div key={match.id} onClick={() => navigate(`/match/${match.id}`)} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        backgroundColor: theme.colors.surface,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: 14, padding: '13px 18px', cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${theme.colors.primary}50`; (e.currentTarget as HTMLDivElement).style.backgroundColor = theme.colors.surfaceHigh; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = theme.colors.border; (e.currentTarget as HTMLDivElement).style.backgroundColor = theme.colors.surface; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 20 }}>{gameEmoji(match.game)}</span>
                          <div>
                            <p style={{ color: theme.colors.text, fontWeight: 700, fontSize: 14 }}>
                              vs <span style={{ color: theme.colors.primaryLight }}>#{opp?.hashtag}</span>
                            </p>
                            <p style={{ color: theme.colors.accent, fontSize: 12, fontWeight: 600 }}>{match.wager} cr</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {match.status === 'active' && (
                            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: theme.colors.success, boxShadow: `0 0 8px ${theme.colors.success}`, display: 'inline-block' }} />
                          )}
                          <span style={{
                            backgroundColor: match.status === 'active' ? `${theme.colors.success}18` : `${theme.colors.secondary}18`,
                            color: match.status === 'active' ? theme.colors.success : theme.colors.secondary,
                            border: `1px solid ${match.status === 'active' ? theme.colors.success : theme.colors.secondary}30`,
                            borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600,
                          }}>
                            {match.status === 'active' ? 'En cours' : 'À confirmer'}
                          </span>
                          <span style={{ color: theme.colors.textMuted }}>›</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Recent history */}
            {history.length > 0 && (
              <>
                <SectionTitle icon="📋" label="Derniers résultats" action={{ label: 'Voir tout', onClick: () => navigate('/dashboard') }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {history.map(match => {
                    const won = match.winner_id === session.user.id;
                    const isChallenger = match.challenger_id === session.user.id;
                    const opp = isChallenger ? match.opponent : match.challenger;
                    return (
                      <div key={match.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        backgroundColor: theme.colors.surface, borderRadius: 12,
                        border: `1px solid ${won ? theme.colors.success + '25' : theme.colors.border}`,
                        padding: '10px 16px', opacity: 0.85,
                        transition: 'opacity 0.15s', cursor: 'pointer',
                      }}
                        onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.opacity = '1'}
                        onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.opacity = '0.85'}
                        onClick={() => navigate(`/match/${match.id}`)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{
                            width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backgroundColor: won ? `${theme.colors.success}18` : `${theme.colors.error}12`,
                            fontSize: 13, fontWeight: 900,
                            color: won ? theme.colors.success : theme.colors.error,
                          }}>{won ? 'W' : 'L'}</span>
                          <div>
                            <p style={{ color: theme.colors.text, fontSize: 13, fontWeight: 600 }}>{gameName(match.game)}</p>
                            <p style={{ color: theme.colors.textMuted, fontSize: 11 }}>vs #{opp?.hashtag}</p>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ color: won ? theme.colors.success : theme.colors.error, fontSize: 13, fontWeight: 800 }}>
                            {won ? `+${match.wager}` : `-${match.wager}`} cr
                          </p>
                          <p style={{ color: theme.colors.primary, fontSize: 10, fontWeight: 600 }}>
                            {won ? '+150' : '+30'} XP
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Empty state */}
            {!active.length && !pending.length && !history.length && (
              <div style={{
                textAlign: 'center', padding: '40px 24px',
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`, borderRadius: 20, marginTop: 8,
              }}>
                <p style={{ fontSize: 40, marginBottom: 12 }}>⚡</p>
                <p style={{ color: theme.colors.text, fontWeight: 800, fontSize: 16, marginBottom: 8 }}>
                  Lance ton premier duel
                </p>
                <p style={{ color: theme.colors.textMuted, fontSize: 14, marginBottom: 20 }}>
                  Chaque match te rapporte de l'XP — même en perdant.
                </p>
                <button onClick={() => navigate('/games')} style={{
                  background: theme.gradients.primary, border: 'none', borderRadius: 12,
                  color: '#fff', cursor: 'pointer', padding: '11px 24px', fontSize: 14, fontWeight: 700,
                  boxShadow: theme.shadows.primary,
                }}>Choisir un jeu</button>
              </div>
            )}
          </div>

          {/* RIGHT: Leaderboard + Quick nav */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Quick nav */}
            <div style={{
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 18, overflow: 'hidden',
            }}>
              {[
                { icon: '💳', label: 'Portefeuille', sub: `${(profile?.credits ?? 0).toLocaleString('fr-FR')} cr`, path: '/wallet', color: theme.colors.accent },
                { icon: '💬', label: 'Chat & Défis', sub: 'Discuter · Défier', path: '/chat', color: theme.colors.success },
                { icon: '👤', label: 'Mon profil', sub: `#${profile?.hashtag}`, path: '/profile', color: theme.colors.primary },
              ].map((item, i, arr) => (
                <button key={item.path} onClick={() => navigate(item.path)} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', padding: '14px 18px', border: 'none',
                  background: 'none', cursor: 'pointer', textAlign: 'left',
                  borderBottom: i < arr.length - 1 ? `1px solid ${theme.colors.border}` : 'none',
                  transition: 'background-color 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = theme.colors.surfaceHigh}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 11, fontSize: 18, flexShrink: 0,
                    backgroundColor: `${item.color}15`, border: `1px solid ${item.color}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: theme.colors.text, fontWeight: 600, fontSize: 13 }}>{item.label}</p>
                    <p style={{ color: theme.colors.textMuted, fontSize: 11 }}>{item.sub}</p>
                  </div>
                  <span style={{ color: theme.colors.textMuted, fontSize: 14 }}>›</span>
                </button>
              ))}
            </div>

            {/* Leaderboard preview */}
            <div style={{
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 18, overflow: 'hidden',
            }}>
              <div style={{
                padding: '14px 18px 10px',
                borderBottom: `1px solid ${theme.colors.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ color: theme.colors.text, fontWeight: 800, fontSize: 14 }}>🏆 Classement</span>
                <button onClick={() => navigate('/leaderboard')} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: theme.colors.primaryLight, fontSize: 12, fontWeight: 600,
                }}>Voir tout →</button>
              </div>
              {topPlayers.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: theme.colors.textMuted, fontSize: 13 }}>
                  Aucun classement disponible
                </div>
              ) : (
                topPlayers.map((p, i) => {
                  const isMe = p.id === session.user.id;
                  const lvlInfo = getLevelInfo(p.xp ?? 0);
                  const color = getLevelColor(lvlInfo.level);
                  return (
                    <div key={p.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '11px 18px',
                      backgroundColor: isMe ? `${theme.colors.primary}12` : 'transparent',
                      borderBottom: i < topPlayers.length - 1 ? `1px solid ${theme.colors.border}30` : 'none',
                    }}>
                      <span style={{
                        width: 22, color: i < 3 ? ['#F59E0B', '#94A3B8', '#CD7C3A'][i] : theme.colors.textMuted,
                        fontSize: 13, fontWeight: 900, textAlign: 'center', flexShrink: 0,
                      }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                      </span>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                        background: `linear-gradient(135deg, ${color}40, ${color}10)`,
                        border: `1.5px solid ${color}60`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 900, color,
                      }}>{p.username[0]?.toUpperCase()}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: isMe ? theme.colors.primaryLight : theme.colors.text, fontWeight: 700, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.username}{isMe ? ' (Toi)' : ''}
                        </p>
                        <p style={{ color: theme.colors.textMuted, fontSize: 10 }}>Nv.{lvlInfo.level}</p>
                      </div>
                      <span style={{ color: theme.colors.accent, fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{p.xp} XP</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Game Card ──────────────────────────────────── */
function GameCard({ game, onClick }: { game: typeof GAMES[0]; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={game.available ? onClick : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: game.bg,
        border: `1.5px solid ${hover && game.available ? game.color + '70' : game.color + '25'}`,
        borderRadius: 18, overflow: 'hidden',
        cursor: game.available ? 'pointer' : 'default',
        transform: hover && game.available ? 'translateY(-4px) scale(1.02)' : 'none',
        boxShadow: hover && game.available ? `0 16px 40px rgba(0,0,0,0.5), 0 0 20px ${game.color}20` : '0 2px 12px rgba(0,0,0,0.3)',
        transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
        opacity: game.available ? 1 : 0.55,
        position: 'relative',
      }}
    >
      {hover && game.available && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: `linear-gradient(135deg, ${game.color}10, transparent 50%)`,
        }} />
      )}
      <div style={{ padding: '18px 16px', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <span style={{ fontSize: 30 }}>{game.emoji}</span>
          <span style={{
            backgroundColor: game.available ? `${theme.colors.success}20` : `${game.color}12`,
            border: `1px solid ${game.available ? theme.colors.success + '40' : game.color + '25'}`,
            color: game.available ? theme.colors.success : game.color,
            borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: 0.8,
          }}>
            {game.available ? '● Live' : 'Bientôt'}
          </span>
        </div>
        <p style={{ color: game.color, fontWeight: 900, fontSize: 14, marginBottom: 2 }}>{game.name}</p>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: game.available ? 10 : 0 }}>{game.platform}</p>
        {game.available && (
          <div style={{
            backgroundColor: game.color,
            borderRadius: 8, padding: '6px 0', textAlign: 'center',
            color: '#000', fontSize: 12, fontWeight: 900,
            opacity: hover ? 1 : 0.85, transition: 'opacity 0.15s',
          }}>
            JOUER ⚡
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Section Title ──────────────────────────────── */
function SectionTitle({ icon, label, action }: { icon: string; label: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ color: theme.colors.text, fontWeight: 800, fontSize: 15 }}>{label}</span>
      </div>
      {action && (
        <button onClick={action.onClick} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: theme.colors.primaryLight, fontSize: 12, fontWeight: 600,
        }}>{action.label}</button>
      )}
    </div>
  );
}
