import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { Profile, Match, GAMES } from '../types';
import { getMyMatches, acceptMatch, declineMatch } from '../lib/db';
import Layout from '../components/Layout';
import { theme } from '../theme';

const STATUS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'En attente',  color: theme.colors.accent },
  active:    { label: 'En cours',    color: theme.colors.success },
  finished:  { label: 'À confirmer', color: theme.colors.secondary },
  completed: { label: 'Terminé',     color: theme.colors.textMuted },
  disputed:  { label: 'Litige',      color: theme.colors.error },
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

  const gameName = (slug: string) => GAMES.find(g => g.slug === slug)?.name ?? slug;
  const gameEmoji = (slug: string) => GAMES.find(g => g.slug === slug)?.emoji ?? '🎮';

  const handleAccept = async (match: Match) => {
    if (!profile || profile.credits < match.wager) { alert('Crédits insuffisants'); return; }
    await acceptMatch(match);
    refreshProfile();
    load();
  };

  return (
    <Layout>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ color: theme.colors.text, fontSize: 26, fontWeight: 900, letterSpacing: -0.5, marginBottom: 4 }}>
            Bonjour, {profile?.username ?? 'Joueur'} 👋
          </h1>
          <p style={{ color: theme.colors.textMuted, fontSize: 13 }}>
            Ton hashtag : <span style={{ color: theme.colors.primary, fontWeight: 700 }}>#{profile?.hashtag}</span>
            {' '}— partage-le pour recevoir des défis
          </p>
        </div>
        <button
          onClick={() => navigate('/games')}
          style={{
            backgroundColor: theme.colors.primary, border: 'none',
            borderRadius: theme.radius.md, color: '#fff', cursor: 'pointer',
            padding: '12px 24px', fontSize: 15, fontWeight: 700,
            boxShadow: `0 0 24px ${theme.colors.primary}40`,
          }}
        >
          ⚡ Nouveau duel
        </button>
      </div>

      {/* Credits + quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 32 }}>
        <div
          onClick={() => navigate('/wallet')}
          style={{
            background: `linear-gradient(135deg, ${theme.colors.primary}25, ${theme.colors.surface})`,
            border: `1.5px solid ${theme.colors.primary}35`,
            borderRadius: 18, padding: '22px 24px', cursor: 'pointer',
          }}
        >
          <p style={{ color: theme.colors.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Crédits</p>
          <p style={{ color: theme.colors.accent, fontSize: 30, fontWeight: 900, lineHeight: 1, marginBottom: 4 }}>
            {(profile?.credits ?? 0).toLocaleString('fr-FR')}
          </p>
          <p style={{ color: theme.colors.textMuted, fontSize: 12 }}>≈ {((profile?.credits ?? 0) / 100).toFixed(2)} €</p>
        </div>
        {[
          { label: 'Duels joués',    value: matches.filter(m => m.status !== 'pending').length },
          { label: 'En attente',     value: pending.length,  highlight: pending.length > 0 },
          { label: 'En cours',       value: active.length },
        ].map(s => (
          <div key={s.label} style={{
            backgroundColor: theme.colors.surface,
            border: `1px solid ${s.highlight ? `${theme.colors.error}50` : theme.colors.border}`,
            borderRadius: 18, padding: '22px 24px',
          }}>
            <p style={{ color: theme.colors.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{s.label}</p>
            <p style={{ color: s.highlight ? theme.colors.error : theme.colors.text, fontSize: 30, fontWeight: 900 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Pending challenges */}
      {pending.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <h2 style={{ color: theme.colors.text, fontWeight: 700, fontSize: 16 }}>Défis reçus</h2>
            <span style={{
              backgroundColor: theme.colors.error, color: '#fff',
              fontSize: 11, fontWeight: 800,
              borderRadius: theme.radius.full, padding: '2px 8px',
            }}>{pending.length}</span>
          </div>
          {pending.map(match => (
            <div key={match.id} style={{
              backgroundColor: theme.colors.surface,
              border: `1.5px solid ${theme.colors.accent}40`,
              borderRadius: 16, padding: '18px 22px', marginBottom: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 28 }}>{gameEmoji(match.game)}</span>
                <div>
                  <p style={{ color: theme.colors.text, fontWeight: 700 }}>{gameName(match.game)}</p>
                  <p style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
                    De <span style={{ color: theme.colors.primary, fontWeight: 700 }}>#{match.challenger?.hashtag}</span>
                    {' '}· Mise : <span style={{ color: theme.colors.accent, fontWeight: 700 }}>{match.wager} cr</span>
                    {' '}({(match.wager / 100).toFixed(2)} €)
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => declineMatch(match.id).then(load)}
                  style={{
                    background: 'none', border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.radius.md, color: theme.colors.textSecondary,
                    cursor: 'pointer', padding: '8px 16px', fontSize: 13, fontWeight: 500,
                  }}
                >Refuser</button>
                <button
                  onClick={() => handleAccept(match)}
                  style={{
                    backgroundColor: theme.colors.success, border: 'none',
                    borderRadius: theme.radius.md, color: '#fff',
                    cursor: 'pointer', padding: '8px 22px', fontSize: 13, fontWeight: 700,
                  }}
                >Accepter ✓</button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Active */}
      {active.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: theme.colors.text, fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Duels en cours</h2>
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
                  borderRadius: 16, padding: '16px 22px', marginBottom: 10,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = theme.colors.primary)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = theme.colors.border)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 26 }}>{gameEmoji(match.game)}</span>
                  <div>
                    <p style={{ color: theme.colors.text, fontWeight: 700 }}>{gameName(match.game)}</p>
                    <p style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
                      vs <span style={{ color: theme.colors.primaryLight }}>#{opponent?.hashtag}</span>
                      {' '}· <span style={{ color: theme.colors.accent }}>{match.wager} cr</span>
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    backgroundColor: `${s.color}20`, color: s.color,
                    border: `1px solid ${s.color}40`,
                    borderRadius: theme.radius.full, padding: '4px 12px', fontSize: 12, fontWeight: 600,
                  }}>{s.label}</span>
                  <span style={{ color: theme.colors.textMuted }}>→</span>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Empty */}
      {!loading && matches.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '64px 24px',
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: 20,
        }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🎮</div>
          <h3 style={{ color: theme.colors.text, fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Aucun duel pour l'instant</h3>
          <p style={{ color: theme.colors.textSecondary, fontSize: 14, marginBottom: 24 }}>
            Lance ton premier défi et commence à gagner des crédits.
          </p>
          <button onClick={() => navigate('/games')} style={{
            backgroundColor: theme.colors.primary, border: 'none',
            borderRadius: theme.radius.md, color: '#fff',
            cursor: 'pointer', padding: '12px 28px', fontSize: 15, fontWeight: 700,
          }}>Choisir un jeu</button>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <section>
          <h2 style={{ color: theme.colors.text, fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Historique</h2>
          {history.slice(0, 10).map(match => {
            const won = match.winner_id === session.user.id;
            const isChallenger = match.challenger_id === session.user.id;
            const opponent = isChallenger ? match.opponent : match.challenger;
            return (
              <div key={match.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: 12, padding: '12px 20px', marginBottom: 8, opacity: 0.85,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{gameEmoji(match.game)}</span>
                  <div>
                    <p style={{ color: theme.colors.text, fontWeight: 600, fontSize: 14 }}>{gameName(match.game)}</p>
                    <p style={{ color: theme.colors.textMuted, fontSize: 12 }}>vs #{opponent?.hashtag}</p>
                  </div>
                </div>
                <p style={{
                  fontWeight: 800, fontSize: 15,
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
