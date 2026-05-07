import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { Profile, Match, GAMES } from '../types';
import { getMyMatches, acceptMatch, declineMatch } from '../lib/db';
import Layout from '../components/Layout';
import { theme } from '../theme';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
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
    getMyMatches(session.user.id).then(data => {
      setMatches(data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [session.user.id]);

  const pending  = matches.filter(m => m.status === 'pending' && m.opponent_id === session.user.id);
  const active   = matches.filter(m => ['active', 'finished'].includes(m.status));
  const history  = matches.filter(m => ['completed', 'disputed'].includes(m.status));

  const gameName = (slug: string) => GAMES.find(g => g.slug === slug)?.name || slug;

  const handleAccept = async (match: Match) => {
    if (!profile || profile.credits < match.wager) {
      alert('Crédits insuffisants');
      return;
    }
    await acceptMatch(match);
    refreshProfile();
    load();
  };

  return (
    <Layout profile={profile}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 style={{ color: theme.colors.text, fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
              Bonjour, {profile?.username || 'Joueur'} 👋
            </h1>
            <p style={{ color: theme.colors.textMuted, fontSize: 13 }}>
              Hashtag : <span style={{ color: theme.colors.primary, fontWeight: 700 }}>#{profile?.hashtag}</span>
            </p>
          </div>
          <button
            onClick={() => navigate('/games')}
            style={{
              backgroundColor: theme.colors.primary, border: 'none',
              borderRadius: theme.radius.md, color: '#fff',
              cursor: 'pointer', padding: '12px 24px',
              fontSize: 15, fontWeight: 700,
            }}
          >
            ⚡ Nouveau duel
          </button>
        </div>

        {/* Credits card */}
        <div style={{
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: 20, padding: '24px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 28,
          background: `linear-gradient(135deg, ${theme.colors.surface} 0%, ${theme.colors.surfaceHigh} 100%)`,
        }}>
          <div>
            <p style={{ color: theme.colors.textSecondary, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              Mes crédits
            </p>
            <p style={{ color: theme.colors.accent, fontSize: 36, fontWeight: 900, letterSpacing: -1 }}>
              {(profile?.credits || 0).toLocaleString()}
            </p>
            <p style={{ color: theme.colors.textMuted, fontSize: 13, marginTop: 4 }}>
              ≈ {((profile?.credits || 0) / 100).toFixed(2)} €
            </p>
          </div>
          <div style={{ fontSize: 48 }}>💰</div>
        </div>

        {/* Pending challenges */}
        {pending.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: theme.colors.text, fontSize: 16, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                backgroundColor: theme.colors.error,
                color: '#fff', fontSize: 12, fontWeight: 800,
                borderRadius: theme.radius.full, padding: '2px 8px',
              }}>{pending.length}</span>
              Défis reçus
            </h2>
            {pending.map(match => (
              <div key={match.id} style={{
                backgroundColor: theme.colors.surface,
                border: `1.5px solid ${theme.colors.accent}50`,
                borderRadius: 16, padding: 20, marginBottom: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
              }}>
                <div>
                  <p style={{ color: theme.colors.text, fontWeight: 700, marginBottom: 4 }}>
                    {gameName(match.game)}
                  </p>
                  <p style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
                    De <span style={{ color: theme.colors.primary }}>#{match.challenger?.hashtag}</span>
                    {' '} · Mise : <span style={{ color: theme.colors.accent, fontWeight: 700 }}>{match.wager} cr</span>
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => declineMatch(match.id).then(load)}
                    style={{
                      background: 'none', border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.radius.md, color: theme.colors.textSecondary,
                      cursor: 'pointer', padding: '8px 16px', fontSize: 13,
                    }}
                  >
                    Refuser
                  </button>
                  <button
                    onClick={() => handleAccept(match)}
                    style={{
                      backgroundColor: theme.colors.success, border: 'none',
                      borderRadius: theme.radius.md, color: '#fff',
                      cursor: 'pointer', padding: '8px 20px', fontSize: 13, fontWeight: 700,
                    }}
                  >
                    Accepter ✓
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Active matches */}
        {active.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: theme.colors.text, fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
              Duels en cours ({active.length})
            </h2>
            {active.map(match => {
              const isChallenger = match.challenger_id === session.user.id;
              const opponent = isChallenger ? match.opponent : match.challenger;
              const status = STATUS_LABEL[match.status] || STATUS_LABEL.active;
              return (
                <div
                  key={match.id}
                  onClick={() => navigate(`/match/${match.id}`)}
                  style={{
                    backgroundColor: theme.colors.surface,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: 16, padding: 20, marginBottom: 12,
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = theme.colors.primary)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = theme.colors.border)}
                >
                  <div>
                    <p style={{ color: theme.colors.text, fontWeight: 700, marginBottom: 4 }}>{gameName(match.game)}</p>
                    <p style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
                      vs <span style={{ color: theme.colors.primaryLight }}>#{opponent?.hashtag}</span>
                      {' '} · <span style={{ color: theme.colors.accent }}>{match.wager} cr</span>
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{
                      backgroundColor: `${status.color}20`,
                      color: status.color,
                      border: `1px solid ${status.color}40`,
                      borderRadius: theme.radius.full,
                      padding: '4px 12px', fontSize: 12, fontWeight: 600,
                    }}>
                      {status.label}
                    </span>
                    <span style={{ color: theme.colors.textMuted, fontSize: 18 }}>→</span>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* Empty state */}
        {!loading && matches.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 24px',
            backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: 20,
          }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>🎮</p>
            <h3 style={{ color: theme.colors.text, fontWeight: 700, marginBottom: 8 }}>Aucun duel pour l'instant</h3>
            <p style={{ color: theme.colors.textSecondary, marginBottom: 24, fontSize: 14 }}>
              Lance ton premier défi et commence à gagner.
            </p>
            <button
              onClick={() => navigate('/games')}
              style={{
                backgroundColor: theme.colors.primary, border: 'none',
                borderRadius: theme.radius.md, color: '#fff',
                cursor: 'pointer', padding: '12px 28px', fontSize: 15, fontWeight: 700,
              }}
            >
              Choisir un jeu
            </button>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <section style={{ marginTop: 32 }}>
            <h2 style={{ color: theme.colors.text, fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
              Historique
            </h2>
            {history.map(match => {
              const won = match.winner_id === session.user.id;
              const status = STATUS_LABEL[match.status];
              const isChallenger = match.challenger_id === session.user.id;
              const opponent = isChallenger ? match.opponent : match.challenger;
              return (
                <div key={match.id} style={{
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: 16, padding: '16px 20px', marginBottom: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.8,
                }}>
                  <div>
                    <p style={{ color: theme.colors.text, fontWeight: 600, fontSize: 14 }}>{gameName(match.game)}</p>
                    <p style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
                      vs #{opponent?.hashtag}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{
                      color: match.status === 'disputed' ? theme.colors.error : won ? theme.colors.success : theme.colors.error,
                      fontWeight: 700, fontSize: 14,
                    }}>
                      {match.status === 'disputed' ? 'Litige' : won ? `+${match.wager} cr` : `-${match.wager} cr`}
                    </p>
                    <p style={{ color: status.color, fontSize: 12 }}>{status.label}</p>
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </div>
    </Layout>
  );
}
