import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Profile, Match, BADGES, computeStats } from '../types';
import { getLevelInfo, getLevelColor } from '../lib/xp';
import Layout from '../components/Layout';
import { theme } from '../theme';

export default function PublicProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from('profiles').select('*').eq('id', id).single(),
      supabase.from('matches')
        .select('*, challenger:profiles!matches_challenger_id_fkey(*), opponent:profiles!matches_opponent_id_fkey(*)')
        .or(`challenger_id.eq.${id},opponent_id.eq.${id}`)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(8),
    ]).then(([p, m]) => {
      setProfile(p.data);
      setMatches(m.data ?? []);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <p style={{ color: theme.colors.textMuted, textAlign: 'center', padding: 48 }}>Chargement...</p>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>🤷</p>
          <p style={{ color: theme.colors.textMuted, fontSize: 16, marginBottom: 24 }}>Joueur introuvable.</p>
          <button onClick={() => navigate(-1)} style={{
            background: 'none', border: `1px solid ${theme.colors.border}`,
            borderRadius: 10, color: theme.colors.textSecondary,
            cursor: 'pointer', padding: '10px 20px',
          }}>← Retour</button>
        </div>
      </Layout>
    );
  }

  const stats = computeStats(matches, profile.id, !!profile.discord_id);
  const levelInfo = getLevelInfo(profile.xp ?? 0);
  const levelColor = getLevelColor(levelInfo.level);
  const winRate = stats.totalDuels > 0 ? Math.round((stats.wins / stats.totalDuels) * 100) : 0;

  return (
    <Layout maxWidth={640}>
      {/* Header */}
      <div style={{
        backgroundColor: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: 20, padding: '28px', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${levelColor}, ${theme.colors.primaryDark})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 900, fontSize: 28,
            boxShadow: `0 0 24px ${levelColor}40`,
          }}>
            {profile.username?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
              <h2 style={{ color: theme.colors.text, fontWeight: 800, fontSize: 20 }}>{profile.username}</h2>
              <span style={{
                backgroundColor: `${levelColor}20`, color: levelColor,
                border: `1px solid ${levelColor}40`,
                borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 700,
              }}>Niv. {levelInfo.level} · {levelInfo.title}</span>
            </div>
            <span style={{
              backgroundColor: `${theme.colors.primary}18`,
              border: `1px solid ${theme.colors.primary}35`,
              borderRadius: 8, padding: '4px 12px',
              color: theme.colors.primaryLight,
              fontWeight: 900, fontSize: 13, letterSpacing: 2,
            }}>#{profile.hashtag}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: theme.colors.textMuted, fontSize: 11, marginBottom: 2 }}>XP total</p>
            <p style={{ color: levelColor, fontWeight: 900, fontSize: 22 }}>{(profile.xp ?? 0).toLocaleString('fr-FR')}</p>
          </div>
        </div>

        {/* XP bar */}
        <div style={{ marginTop: 18 }}>
          <div style={{
            height: 6, backgroundColor: theme.colors.surfaceHigh,
            borderRadius: 99, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: `${levelInfo.progress}%`,
              background: `linear-gradient(90deg, ${levelColor}, ${levelColor}99)`,
              borderRadius: 99, transition: 'width 0.6s ease',
            }} />
          </div>
          <p style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 4 }}>
            {levelInfo.currentXp} / {levelInfo.neededXp} XP → Niv. {levelInfo.level + 1}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Duels',     value: stats.totalDuels, color: theme.colors.text },
          { label: 'Victoires', value: stats.wins,       color: theme.colors.success },
          { label: 'Défaites',  value: stats.losses,     color: theme.colors.error },
          { label: 'Win rate',  value: `${winRate}%`,    color: theme.colors.primary },
        ].map(s => (
          <div key={s.label} style={{
            backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: 14, padding: '16px 8px', textAlign: 'center',
          }}>
            <p style={{ color: s.color, fontSize: 22, fontWeight: 900, marginBottom: 3 }}>{s.value}</p>
            <p style={{ color: theme.colors.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div style={{
        backgroundColor: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: 16, padding: '20px', marginBottom: 16,
      }}>
        <h3 style={{ color: theme.colors.text, fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Badges</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
          {BADGES.map(badge => {
            const unlocked = badge.check(stats);
            return (
              <div key={badge.id} style={{
                backgroundColor: unlocked ? `${theme.colors.primary}08` : theme.colors.surfaceHigh,
                border: `1px solid ${unlocked ? `${theme.colors.primary}30` : theme.colors.border}`,
                borderRadius: 12, padding: '14px 10px', textAlign: 'center',
                opacity: unlocked ? 1 : 0.4,
              }}>
                <div style={{ fontSize: 24, marginBottom: 6, filter: unlocked ? 'none' : 'grayscale(1)' }}>{badge.icon}</div>
                <p style={{ color: unlocked ? theme.colors.text : theme.colors.textMuted, fontWeight: 700, fontSize: 11, marginBottom: 2 }}>{badge.name}</p>
                <p style={{ color: theme.colors.textMuted, fontSize: 10 }}>{badge.condition}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent matches */}
      {matches.length > 0 && (
        <div style={{
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: 16, padding: '20px',
        }}>
          <h3 style={{ color: theme.colors.text, fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
            Historique récent
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {matches.map(m => {
              const won = m.winner_id === profile.id;
              const isChallenger = m.challenger_id === profile.id;
              const opponent = isChallenger ? m.opponent : m.challenger;
              return (
                <div key={m.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  backgroundColor: theme.colors.surfaceHigh,
                  borderRadius: 10, padding: '10px 14px',
                  border: `1px solid ${theme.colors.border}`,
                }}>
                  <div>
                    <p style={{ color: theme.colors.text, fontWeight: 600, fontSize: 13 }}>{m.game}</p>
                    <p style={{ color: theme.colors.textMuted, fontSize: 12 }}>vs #{(opponent as Profile)?.hashtag}</p>
                  </div>
                  <p style={{ fontWeight: 800, fontSize: 14, color: won ? theme.colors.success : theme.colors.error }}>
                    {won ? `+${m.wager} cr` : `-${m.wager} cr`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Layout>
  );
}
