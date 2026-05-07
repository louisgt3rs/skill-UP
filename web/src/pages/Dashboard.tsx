import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { Profile, Match, GAMES } from '../types';
import { getMyMatches, acceptMatch, declineMatch } from '../lib/db';
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
    getMyMatches(session.user.id)
      .then(data => { setMatches(data); setLoading(false); });
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

  return (
    <Layout>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ color: theme.colors.text, fontSize: 26, fontWeight: 900, letterSpacing: -0.5, marginBottom: 6 }}>
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
            padding: '12px 24px', fontSize: 15, fontWeight: 700,
            boxShadow: theme.shadows.primary,
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 0 48px rgba(124,58,237,0.5)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = theme.shadows.primary;
          }}
        >
          ⚡ Nouveau duel
        </button>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, marginBottom: 32 }}>
        {/* Credits card */}
        <div
          onClick={() => navigate('/wallet')}
          style={{
            background: `linear-gradient(135deg, ${theme.colors.primary}22, ${theme.colors.surface})`,
            border: `1.5px solid ${theme.colors.primary}30`,
            borderRadius: theme.radius.xl, padding: '22px 24px', cursor: 'pointer',
            position: 'relative', overflow: 'hidden',
            transition: 'border-color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = `${theme.colors.primary}60`}
          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = `${theme.colors.primary}30`}
        >
          <div style={{
            position: 'absolute', top: -20, right: -20,
            width: 80, height: 80, borderRadius: '50%',
            background: `radial-gradient(${theme.colors.primary}30, transparent)`,
          }} />
          <p style={{ color: theme.colors.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Crédits</p>
          <p style={{ color: theme.colors.accent, fontSize: 32, fontWeight: 900, lineHeight: 1, marginBottom: 4 }}>
            {(profile?.credits ?? 0).toLocaleString('fr-FR')}
          </p>
          <p style={{ color: theme.colors.textMuted, fontSize: 12 }}>≈ {((profile?.credits ?? 0) / 100).toFixed(2)} €</p>
        </div>

        {[
          { label: 'Duels joués',  value: matches.filter(m => m.status !== 'pending').length, highlight: false },
          { label: 'En attente',   value: pending.length, highlight: pending.length > 0 },
          { label: 'En cours',     value: active.length, highlight: false },
        ].map(s => (
          <div key={s.label} style={{
            backgroundColor: theme.colors.surface,
            border: `1px solid ${s.highlight ? `${theme.colors.error}40` : theme.colors.border}`,
            borderRadius: theme.radius.xl, padding: '22px 24px',
            position: 'relative',
          }}>
            {s.highlight && (
              <span style={{
                position: 'absolute', top: 14, right: 14,
                width: 8, height: 8, borderRadius: '50%',
                backgroundColor: theme.colors.error,
                boxShadow: `0 0 8px ${theme.colors.error}`,
              }} />
            )}
            <p style={{ color: theme.colors.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{s.label}</p>
            <p style={{ color: s.highlight ? theme.colors.error : theme.colors.text, fontSize: 32, fontWeight: 900 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Pending challenges ── */}
      {pending.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <h2 style={{ color: theme.colors.text, fontWeight: 800, fontSize: 16 }}>Défis reçus</h2>
            <span style={{
              background: theme.gradients.primary, color: '#fff',
              fontSize: 11, fontWeight: 900,
              borderRadius: theme.radius.full, padding: '2px 9px',
              boxShadow: `0 0 12px ${theme.colors.primary}60`,
            }}>{pending.length}</span>
          </div>
          {pending.map(match => (
            <div key={match.id} style={{
              backgroundColor: theme.colors.surface,
              border: `1.5px solid ${theme.colors.accent}30`,
              borderRadius: theme.radius.xl, padding: '18px 22px', marginBottom: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
              background: `linear-gradient(135deg, ${theme.colors.accent}06, ${theme.colors.surface})`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14, fontSize: 26,
                  backgroundColor: `${theme.colors.accent}15`,
                  border: `1px solid ${theme.colors.accent}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{gameEmoji(match.game)}</div>
                <div>
                  <p style={{ color: theme.colors.text, fontWeight: 700, fontSize: 15 }}>{gameName(match.game)}</p>
                  <p style={{ color: theme.colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                    De <span style={{ color: theme.colors.primary, fontWeight: 700 }}>#{match.challenger?.hashtag}</span>
                    {' '}· <span style={{ color: theme.colors.accent, fontWeight: 700 }}>{match.wager} cr</span>
                    {' '}<span style={{ color: theme.colors.textMuted }}>({(match.wager / 100).toFixed(2)} €)</span>
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => declineMatch(match.id).then(load)}
                  style={{
                    background: 'none', border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.radius.md, color: theme.colors.textMuted,
                    cursor: 'pointer', padding: '9px 18px', fontSize: 13,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = theme.colors.error;
                    e.currentTarget.style.color = theme.colors.error;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = theme.colors.border;
                    e.currentTarget.style.color = theme.colors.textMuted;
                  }}
                >Refuser</button>
                <button
                  onClick={() => handleAccept(match)}
                  style={{
                    backgroundColor: theme.colors.success, border: 'none',
                    borderRadius: theme.radius.md, color: '#fff',
                    cursor: 'pointer', padding: '9px 22px', fontSize: 13, fontWeight: 700,
                    boxShadow: `0 0 16px ${theme.colors.success}40`,
                  }}
                >✓ Accepter</button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ── Active matches ── */}
      {active.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: theme.colors.text, fontWeight: 800, fontSize: 16, marginBottom: 16 }}>Duels en cours</h2>
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
                  borderRadius: theme.radius.xl, padding: '16px 22px', marginBottom: 10,
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: 12,
                  transition: 'border-color 0.2s, background-color 0.2s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = theme.colors.primary + '60';
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = theme.colors.surfaceHigh;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = theme.colors.border;
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = theme.colors.surface;
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, fontSize: 22,
                    backgroundColor: theme.colors.surfaceHigh,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{gameEmoji(match.game)}</div>
                  <div>
                    <p style={{ color: theme.colors.text, fontWeight: 700 }}>{gameName(match.game)}</p>
                    <p style={{ color: theme.colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                      vs{' '}
                      <span style={{ color: theme.colors.primaryLight, fontWeight: 600 }}>#{opponent?.hashtag}</span>
                      {' '}· <span style={{ color: theme.colors.accent, fontWeight: 600 }}>{match.wager} cr</span>
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {match.status === 'active' && (
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%',
                      backgroundColor: theme.colors.success,
                      boxShadow: `0 0 8px ${theme.colors.success}`,
                      display: 'inline-block',
                    }} />
                  )}
                  <span style={{
                    backgroundColor: `${s.color}18`,
                    color: s.color,
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
          textAlign: 'center', padding: '72px 24px',
          background: `linear-gradient(135deg, ${theme.colors.surface}, ${theme.colors.background})`,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.xxl,
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', fontSize: 36,
            background: `${theme.colors.primary}15`,
            border: `1.5px solid ${theme.colors.primary}25`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>🎮</div>
          <h3 style={{ color: theme.colors.text, fontWeight: 800, fontSize: 20, marginBottom: 10 }}>Aucun duel pour l'instant</h3>
          <p style={{ color: theme.colors.textSecondary, fontSize: 14, marginBottom: 28, maxWidth: 340, margin: '0 auto 28px' }}>
            Lance ton premier défi et commence à montrer ce que tu vaux.
          </p>
          <button onClick={() => navigate('/games')} style={{
            background: theme.gradients.primary, border: 'none',
            borderRadius: theme.radius.md, color: '#fff',
            cursor: 'pointer', padding: '13px 32px', fontSize: 15, fontWeight: 700,
            boxShadow: theme.shadows.primary,
          }}>⚡ Choisir un jeu</button>
        </div>
      )}

      {/* ── History ── */}
      {history.length > 0 && (
        <section style={{ marginTop: active.length > 0 || pending.length > 0 ? 0 : 0 }}>
          <h2 style={{ color: theme.colors.text, fontWeight: 800, fontSize: 16, marginBottom: 16 }}>Historique</h2>
          {history.slice(0, 10).map(match => {
            const won = match.winner_id === session.user.id;
            const isChallenger = match.challenger_id === session.user.id;
            const opponent = isChallenger ? match.opponent : match.challenger;
            return (
              <div
                key={match.id}
                onClick={() => navigate(`/match/${match.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.lg, padding: '12px 20px', marginBottom: 8,
                  cursor: 'pointer', opacity: 0.85,
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.opacity = '1'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.opacity = '0.85'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20 }}>{gameEmoji(match.game)}</span>
                  <div>
                    <p style={{ color: theme.colors.text, fontWeight: 600, fontSize: 14 }}>{gameName(match.game)}</p>
                    <p style={{ color: theme.colors.textMuted, fontSize: 12 }}>vs #{opponent?.hashtag}</p>
                  </div>
                </div>
                <p style={{
                  fontWeight: 800, fontSize: 14,
                  color: match.status === 'disputed' ? theme.colors.error : won ? theme.colors.success : theme.colors.error,
                }}>
                  {match.status === 'disputed' ? '⚖️ Litige' : won ? `+${match.wager} cr` : `-${match.wager} cr`}
                </p>
              </div>
            );
          })}
        </section>
      )}
    </Layout>
  );
}
