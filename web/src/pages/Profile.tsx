import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { Profile, Match, BADGES, BadgeDef, computeStats, PlayerStats } from '../types';
import { getMyMatches } from '../lib/db';
import Layout from '../components/Layout';
import { theme } from '../theme';

interface Props {
  session: Session;
  profile: Profile | null;
}

export default function ProfilePage({ session, profile }: Props) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState<PlayerStats | null>(null);

  useEffect(() => {
    getMyMatches(session.user.id).then(data => {
      setMatches(data);
      setStats(computeStats(data, session.user.id, !!profile?.discord_id));
    });
  }, [session.user.id, profile?.discord_id]);

  const copy = (text: string) => navigator.clipboard.writeText(text);

  const recentHistory = matches.filter(m => m.status === 'completed' || m.status === 'disputed').slice(0, 8);
  const winRate = stats && stats.totalDuels > 0
    ? Math.round((stats.wins / stats.totalDuels) * 100)
    : 0;

  return (
    <Layout>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h1 style={{ color: theme.colors.text, fontSize: 26, fontWeight: 900, marginBottom: 28 }}>Mon Profil</h1>

        {/* ── Avatar + Info ── */}
        <div style={{
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: 20, padding: 28, marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
        }}>
          {/* Avatar */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 900, fontSize: 32,
            boxShadow: `0 0 30px ${theme.colors.primary}40`,
          }}>
            {profile?.username?.[0]?.toUpperCase() ?? '?'}
          </div>

          <div style={{ flex: 1 }}>
            <h2 style={{ color: theme.colors.text, fontWeight: 800, fontSize: 22, marginBottom: 4 }}>
              {profile?.username ?? 'Chargement...'}
            </h2>
            <p style={{ color: theme.colors.textSecondary, fontSize: 13, marginBottom: 8 }}>
              {session.user.email}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                backgroundColor: `${theme.colors.primary}20`,
                border: `1px solid ${theme.colors.primary}40`,
                borderRadius: theme.radius.full,
                padding: '4px 14px',
                color: theme.colors.primary, fontWeight: 800, fontSize: 14, letterSpacing: 2,
              }}>
                #{profile?.hashtag}
              </span>
              <button
                onClick={() => copy(`#${profile?.hashtag ?? ''}`)}
                style={{
                  background: 'none', border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.md, color: theme.colors.textMuted,
                  cursor: 'pointer', padding: '4px 10px', fontSize: 12,
                }}
                title="Copier le hashtag"
              >
                📋
              </button>
            </div>
          </div>

          {/* Credits */}
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: theme.colors.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Crédits</p>
            <p style={{ color: theme.colors.accent, fontWeight: 900, fontSize: 26 }}>
              {(profile?.credits ?? 0).toLocaleString('fr-FR')}
            </p>
            <p style={{ color: theme.colors.textMuted, fontSize: 12 }}>
              ≈ {((profile?.credits ?? 0) / 100).toFixed(2)} €
            </p>
          </div>
        </div>

        {/* ── Stats ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20,
        }}>
          {[
            { label: 'Duels joués', value: stats?.totalDuels ?? 0, color: theme.colors.text },
            { label: 'Victoires',   value: stats?.wins ?? 0,       color: theme.colors.success },
            { label: 'Défaites',    value: stats?.losses ?? 0,     color: theme.colors.error },
            { label: 'Taux de win', value: `${winRate}%`,          color: theme.colors.primary },
          ].map(s => (
            <div key={s.label} style={{
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 14, padding: '16px 12px', textAlign: 'center',
            }}>
              <p style={{ color: s.color, fontSize: 24, fontWeight: 900, marginBottom: 4 }}>{s.value}</p>
              <p style={{ color: theme.colors.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Discord ── */}
        <div style={{
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: 20, padding: 24, marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                backgroundColor: '#5865F220',
                border: '1px solid #5865F240',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
              }}>
                🎮
              </div>
              <div>
                <p style={{ color: theme.colors.text, fontWeight: 700, fontSize: 15 }}>Discord</p>
                {profile?.discord_username ? (
                  <p style={{ color: '#5865F2', fontSize: 13, fontWeight: 600 }}>@{profile.discord_username}</p>
                ) : (
                  <p style={{ color: theme.colors.textMuted, fontSize: 13 }}>Non lié — débloque le badge Vérifié</p>
                )}
              </div>
            </div>
            <DiscordButton profile={profile} />
          </div>
        </div>

        {/* ── Badges ── */}
        <div style={{
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: 20, padding: 24, marginBottom: 20,
        }}>
          <h3 style={{ color: theme.colors.text, fontWeight: 700, fontSize: 16, marginBottom: 20 }}>
            Badges {stats ? `(${BADGES.filter(b => b.check(stats)).length}/${BADGES.length})` : ''}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {BADGES.map(badge => (
              <BadgeCard key={badge.id} badge={badge} unlocked={stats ? badge.check(stats) : false} />
            ))}
          </div>
        </div>

        {/* ── Recent matches ── */}
        {recentHistory.length > 0 && (
          <div style={{
            backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: 20, padding: 24,
          }}>
            <h3 style={{ color: theme.colors.text, fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
              Historique récent
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentHistory.map(m => {
                const won = m.winner_id === session.user.id;
                const isChallenger = m.challenger_id === session.user.id;
                const opponent = isChallenger ? m.opponent : m.challenger;
                return (
                  <div key={m.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: theme.colors.surfaceHigh,
                    borderRadius: 12, padding: '12px 16px',
                    border: `1px solid ${m.status === 'disputed' ? `${theme.colors.error}30` : theme.colors.border}`,
                  }}>
                    <div>
                      <p style={{ color: theme.colors.text, fontWeight: 600, fontSize: 14 }}>{m.game}</p>
                      <p style={{ color: theme.colors.textMuted, fontSize: 12 }}>vs #{opponent?.hashtag}</p>
                    </div>
                    <p style={{
                      fontWeight: 800, fontSize: 15,
                      color: m.status === 'disputed' ? theme.colors.error : won ? theme.colors.success : theme.colors.error,
                    }}>
                      {m.status === 'disputed' ? '⚖️ Litige' : won ? `+${m.wager} cr` : `-${m.wager} cr`}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function BadgeCard({ badge, unlocked }: { badge: BadgeDef; unlocked: boolean }) {
  return (
    <div style={{
      backgroundColor: unlocked ? `${theme.colors.primary}10` : theme.colors.surfaceHigh,
      border: `1.5px solid ${unlocked ? `${theme.colors.primary}40` : theme.colors.border}`,
      borderRadius: 14, padding: '16px 12px',
      textAlign: 'center',
      opacity: unlocked ? 1 : 0.5,
      transition: 'opacity 0.2s',
      position: 'relative',
    }}>
      {!unlocked && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          fontSize: 10, color: theme.colors.textMuted,
        }}>🔒</div>
      )}
      <div style={{ fontSize: 32, marginBottom: 8, filter: unlocked ? 'none' : 'grayscale(1)' }}>{badge.icon}</div>
      <p style={{ color: unlocked ? theme.colors.text : theme.colors.textMuted, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
        {badge.name}
      </p>
      <p style={{ color: theme.colors.textMuted, fontSize: 11, lineHeight: 1.4 }}>{badge.condition}</p>
    </div>
  );
}

function DiscordButton({ profile }: { profile: Profile | null }) {
  const discordClientId = process.env.DISCORD_CLIENT_ID;
  const isLinked = !!profile?.discord_username;

  if (isLinked) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          backgroundColor: `${theme.colors.success}20`,
          border: `1px solid ${theme.colors.success}40`,
          borderRadius: theme.radius.full, padding: '5px 14px',
          color: theme.colors.success, fontSize: 13, fontWeight: 600,
        }}>✅ Lié</span>
      </div>
    );
  }

  if (!discordClientId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <button disabled style={{
          backgroundColor: '#5865F230', border: '1px solid #5865F250',
          borderRadius: theme.radius.md, color: '#5865F2',
          padding: '8px 18px', fontSize: 13, fontWeight: 700,
          cursor: 'not-allowed', opacity: 0.6,
        }}>
          🎮 Lier mon Discord
        </button>
        <p style={{ color: theme.colors.textMuted, fontSize: 11 }}>Bientôt disponible</p>
      </div>
    );
  }

  const redirectUri = encodeURIComponent(`${window.location.origin}/auth/discord/callback`);
  const discordUrl = `https://discord.com/api/oauth2/authorize?client_id=${discordClientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify`;

  return (
    <a href={discordUrl} style={{ textDecoration: 'none' }}>
      <button style={{
        backgroundColor: '#5865F2', border: 'none',
        borderRadius: theme.radius.md, color: '#fff',
        padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
      }}>
        🎮 Lier mon Discord
      </button>
    </a>
  );
}
