import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { Profile } from '../types';
import { getLeaderboard, getWeeklyLeaderboard } from '../lib/db';
import { getLevelInfo, getLevelColor } from '../lib/xp';
import Layout from '../components/Layout';
import { theme } from '../theme';

interface Props {
  session: Session;
  profile: Profile | null;
}

type Tab = 'xp' | 'weekly';

const MEDAL = ['🥇', '🥈', '🥉'];

export default function Leaderboard({ session, profile }: Props) {
  const [tab, setTab] = useState<Tab>('xp');
  const [allTime, setAllTime] = useState<Profile[]>([]);
  const [weekly, setWeekly] = useState<{ profile: Profile; weeklyWins: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getLeaderboard(), getWeeklyLeaderboard()]).then(([a, w]) => {
      setAllTime(a);
      setWeekly(w);
      setLoading(false);
    });
  }, []);

  const entries = tab === 'xp'
    ? allTime.map(p => ({ profile: p, score: p.xp, label: `${p.xp} XP` }))
    : weekly.map(e => ({ profile: e.profile, score: e.weeklyWins, label: `${e.weeklyWins} victoire${e.weeklyWins > 1 ? 's' : ''}` }));

  const myRank = tab === 'xp'
    ? allTime.findIndex(p => p.id === session.user.id) + 1
    : weekly.findIndex(e => e.profile.id === session.user.id) + 1;

  const myEntry = tab === 'xp'
    ? allTime.find(p => p.id === session.user.id)
    : weekly.find(e => e.profile.id === session.user.id)?.profile;

  return (
    <Layout>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>🏆</span>
          <h1 style={{ color: theme.colors.text, fontSize: 26, fontWeight: 900, letterSpacing: -0.5 }}>Classement</h1>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 6,
            backgroundColor: `${theme.colors.success}15`,
            border: `1px solid ${theme.colors.success}30`,
            borderRadius: theme.radius.full, padding: '3px 10px',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: theme.colors.success, display: 'inline-block' }} />
            <span style={{ color: theme.colors.success, fontSize: 11, fontWeight: 700 }}>Live</span>
          </span>
        </div>
        <p style={{ color: theme.colors.textMuted, fontSize: 13 }}>Prouve que tu es le meilleur — monte dans le classement</p>
      </div>

      {/* My rank card */}
      {profile && (
        <div style={{
          background: `linear-gradient(135deg, ${theme.colors.primary}20, ${theme.colors.surface})`,
          border: `1.5px solid ${theme.colors.primary}35`,
          borderRadius: theme.radius.xl, padding: '16px 22px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: theme.gradients.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 900, color: '#fff',
              boxShadow: `0 0 16px ${theme.colors.primary}50`,
            }}>
              {profile.username[0]?.toUpperCase()}
            </div>
            <div>
              <p style={{ color: theme.colors.text, fontWeight: 800, fontSize: 15 }}>{profile.username}</p>
              <p style={{ color: theme.colors.primaryLight, fontSize: 12, fontWeight: 600 }}>#{profile.hashtag}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: theme.colors.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Rang</p>
              <p style={{ color: myRank > 0 ? theme.colors.accent : theme.colors.textMuted, fontSize: 22, fontWeight: 900 }}>
                {myRank > 0 ? `#${myRank}` : '—'}
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: theme.colors.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>XP</p>
              <p style={{ color: theme.colors.primary, fontSize: 22, fontWeight: 900 }}>{profile.xp ?? 0}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: theme.colors.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Victoires</p>
              <p style={{ color: theme.colors.success, fontSize: 22, fontWeight: 900 }}>{profile.wins}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {([
          { id: 'xp' as Tab, label: '⭐ Par XP (Tous temps)' },
          { id: 'weekly' as Tab, label: '📅 Cette semaine' },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '9px 18px', borderRadius: theme.radius.md, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: tab === t.id ? 700 : 400,
              backgroundColor: tab === t.id ? theme.colors.primary : theme.colors.surfaceHigh,
              color: tab === t.id ? '#fff' : theme.colors.textSecondary,
              boxShadow: tab === t.id ? `0 0 20px ${theme.colors.primary}40` : 'none',
              transition: 'all 0.15s',
            }}
          >{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: theme.colors.textMuted }}>Chargement...</div>
      ) : entries.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 24px',
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.xl,
        }}>
          <p style={{ fontSize: 40, marginBottom: 16 }}>🏆</p>
          <p style={{ color: theme.colors.text, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Classement vide</p>
          <p style={{ color: theme.colors.textMuted, fontSize: 14 }}>
            {tab === 'weekly' ? 'Aucun duel joué cette semaine — sois le premier !' : 'Lance ton premier duel pour apparaître ici.'}
          </p>
        </div>
      ) : (
        <>
          {/* Podium top 3 */}
          {entries.length >= 3 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr 1fr', gap: 12, marginBottom: 20, alignItems: 'flex-end' }}>
              {[1, 0, 2].map(i => {
                const e = entries[i];
                const isMe = e.profile.id === session.user.id;
                const lvl = getLevelInfo(e.profile.xp ?? 0);
                const podiumOrder = i === 0 ? 1 : i === 1 ? 0 : 2;
                const heights = [88, 110, 72];
                return (
                  <div key={e.profile.id} style={{
                    backgroundColor: isMe ? `${theme.colors.primary}20` : theme.colors.surface,
                    border: `1.5px solid ${isMe ? theme.colors.primary + '50' : i === 0 ? '#F59E0B40' : theme.colors.border}`,
                    borderRadius: 20, padding: '20px 14px',
                    textAlign: 'center', position: 'relative',
                    paddingBottom: heights[podiumOrder],
                    boxShadow: i === 0 ? `0 0 30px rgba(245,158,11,0.15)` : 'none',
                  }}>
                    <div style={{ fontSize: 28, marginBottom: 10 }}>{MEDAL[podiumOrder]}</div>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%', margin: '0 auto 10px',
                      background: `linear-gradient(135deg, ${getLevelColor(lvl.level)}60, ${getLevelColor(lvl.level)}20)`,
                      border: `2px solid ${getLevelColor(lvl.level)}80`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20, fontWeight: 900, color: getLevelColor(lvl.level),
                    }}>
                      {e.profile.username[0]?.toUpperCase()}
                    </div>
                    <p style={{ color: theme.colors.text, fontWeight: 800, fontSize: 13, marginBottom: 2 }}>{e.profile.username}</p>
                    <p style={{ color: theme.colors.textMuted, fontSize: 11, marginBottom: 8 }}>#{e.profile.hashtag}</p>
                    <p style={{ color: theme.colors.accent, fontWeight: 900, fontSize: 14 }}>{e.label}</p>
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      height: heights[podiumOrder],
                      background: i === 0
                        ? `linear-gradient(to top, ${theme.colors.accent}20, transparent)`
                        : i === 1
                        ? `linear-gradient(to top, ${theme.colors.primary}25, transparent)`
                        : `linear-gradient(to top, ${theme.colors.surfaceHigh}80, transparent)`,
                      borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
                      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                      paddingBottom: 12,
                    }}>
                      <span style={{
                        color: i === 0 ? theme.colors.accent : i === 1 ? theme.colors.primaryLight : theme.colors.textMuted,
                        fontWeight: 900, fontSize: 22,
                      }}>#{podiumOrder + 1}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Ranks 4+ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {entries.slice(3).map((e, i) => {
              const rank = i + 4;
              const isMe = e.profile.id === session.user.id;
              const lvl = getLevelInfo(e.profile.xp ?? 0);
              return (
                <div key={e.profile.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  backgroundColor: isMe ? `${theme.colors.primary}15` : theme.colors.surface,
                  border: `1px solid ${isMe ? theme.colors.primary + '40' : theme.colors.border}`,
                  borderRadius: theme.radius.lg, padding: '12px 18px',
                  transition: 'border-color 0.2s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{
                      width: 32, textAlign: 'center',
                      color: theme.colors.textMuted, fontSize: 14, fontWeight: 700,
                    }}>#{rank}</span>
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%',
                      background: `linear-gradient(135deg, ${getLevelColor(lvl.level)}40, ${getLevelColor(lvl.level)}10)`,
                      border: `1.5px solid ${getLevelColor(lvl.level)}60`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 900, color: getLevelColor(lvl.level),
                    }}>
                      {e.profile.username[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <p style={{ color: theme.colors.text, fontWeight: 700, fontSize: 14 }}>{e.profile.username}</p>
                        {isMe && <span style={{
                          backgroundColor: `${theme.colors.primary}20`,
                          color: theme.colors.primaryLight,
                          fontSize: 10, fontWeight: 700, borderRadius: 4, padding: '1px 6px',
                        }}>Toi</span>}
                      </div>
                      <p style={{ color: theme.colors.textMuted, fontSize: 12 }}>
                        Niv. {lvl.level} · #{e.profile.hashtag}
                      </p>
                    </div>
                  </div>
                  <p style={{ color: theme.colors.accent, fontWeight: 800, fontSize: 14 }}>{e.label}</p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Layout>
  );
}
