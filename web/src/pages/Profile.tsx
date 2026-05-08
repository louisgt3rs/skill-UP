import { useEffect, useState, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { Profile, Match, BADGES, BadgeDef, computeStats, PlayerStats } from '../types';
import { getMyMatches, isHashtagAvailable, updateHashtag } from '../lib/db';
import Layout from '../components/Layout';
import { theme } from '../theme';

interface Props {
  session: Session;
  profile: Profile | null;
  refreshProfile?: () => void;
}

// ── Shared button styles ──────────────────────────────────

function ActionBtn({
  onClick, children, variant = 'outline', disabled = false, fullWidth = false,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'outline' | 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  fullWidth?: boolean;
}) {
  const [hover, setHover] = useState(false);

  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '8px 18px', borderRadius: 8,
    fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none', transition: 'all 0.15s',
    width: fullWidth ? '100%' : undefined,
    opacity: disabled ? 0.45 : 1,
    letterSpacing: 0.1,
  };

  const styles: Record<string, React.CSSProperties> = {
    outline: {
      background: hover ? theme.colors.surfaceHigh : 'transparent',
      border: `1px solid ${theme.colors.border}`,
      color: hover ? theme.colors.text : theme.colors.textSecondary,
    },
    primary: {
      background: hover ? '#6D28D9' : theme.colors.primary,
      color: '#fff',
      boxShadow: hover ? '0 0 24px rgba(124,58,237,0.5)' : '0 0 14px rgba(124,58,237,0.3)',
    },
    ghost: {
      background: hover ? theme.colors.surfaceHigh : 'transparent',
      color: hover ? theme.colors.text : theme.colors.textMuted,
    },
    danger: {
      background: hover ? '#7F1D1D20' : 'transparent',
      border: `1px solid ${hover ? theme.colors.error + '60' : theme.colors.border}`,
      color: hover ? theme.colors.error : theme.colors.textMuted,
    },
  };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...base, ...styles[variant] }}
    >
      {children}
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────

export default function ProfilePage({ session, profile, refreshProfile }: Props) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats]     = useState<PlayerStats | null>(null);

  const [editingTag, setEditingTag]     = useState(false);
  const [newTag, setNewTag]             = useState('');
  const [tagAvail, setTagAvail]         = useState<null | boolean>(null);
  const [tagChecking, setTagChecking]   = useState(false);
  const [tagSaving, setTagSaving]       = useState(false);
  const [tagError, setTagError]         = useState('');
  const [tagSuccess, setTagSuccess]     = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getMyMatches(session.user.id).then(data => {
      setMatches(data);
      setStats(computeStats(data, session.user.id, !!profile?.discord_id));
    });
  }, [session.user.id, profile?.discord_id]);

  const copy = (text: string) => navigator.clipboard.writeText(text);

  const recentHistory = matches
    .filter(m => m.status === 'completed' || m.status === 'disputed')
    .slice(0, 8);
  const winRate = stats && stats.totalDuels > 0
    ? Math.round((stats.wins / stats.totalDuels) * 100) : 0;

  const openEditor = () => {
    setNewTag(profile?.hashtag ?? '');
    setTagAvail(null);
    setTagError('');
    setEditingTag(true);
  };

  const cancelEdit = () => {
    setEditingTag(false);
    setNewTag('');
    setTagAvail(null);
    setTagError('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
  };

  const handleTagInput = (raw: string) => {
    const val = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
    setNewTag(val);
    setTagAvail(null);
    setTagError('');
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.length === 5 && val !== profile?.hashtag) {
      setTagChecking(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const ok = await isHashtagAvailable(val, session.user.id);
          setTagAvail(ok);
        } catch {
          // On network error, let Supabase enforce uniqueness at save time
          setTagAvail(true);
        } finally {
          setTagChecking(false);
        }
      }, 450);
    } else if (val === profile?.hashtag) {
      setTagAvail(null); // same as current — treated as valid
    }
  };

  const handleTagSave = async () => {
    setTagError('');
    const tag = newTag.trim().toUpperCase();

    if (tag.length !== 5) { setTagError('Le hashtag doit faire exactement 5 caractères.'); return; }
    if (tag === profile?.hashtag) { setEditingTag(false); return; }
    if (tagAvail === false) { setTagError('Ce hashtag est déjà pris.'); return; }

    // If check hasn't run yet (tagAvail === null), do a final synchronous check
    if (tagAvail === null && tag !== profile?.hashtag) {
      setTagChecking(true);
      try {
        const ok = await isHashtagAvailable(tag, session.user.id);
        setTagAvail(ok);
        if (!ok) { setTagError('Ce hashtag est déjà pris.'); setTagChecking(false); return; }
      } catch {
        // proceed and let DB enforce
      }
      setTagChecking(false);
    }

    setTagSaving(true);
    try {
      await updateHashtag(session.user.id, tag);
      setEditingTag(false);
      setTagSuccess(true);
      refreshProfile?.();
      setTimeout(() => setTagSuccess(false), 4000);
    } catch (e: any) {
      console.error('updateHashtag error:', e);
      if (e?.code === '23505' || e?.message?.toLowerCase().includes('unique')) {
        setTagError('Ce hashtag est déjà pris par un autre joueur.');
      } else {
        setTagError(`Erreur : ${e?.message || e?.code || 'inconnue'}`);
      }
    } finally {
      setTagSaving(false);
    }
  };

  const tagBorderColor = () => {
    if (newTag.length < 5) return theme.colors.border;
    if (tagChecking) return theme.colors.primary;
    if (tagAvail === true) return theme.colors.success;
    if (tagAvail === false) return theme.colors.error;
    return theme.colors.primary;
  };

  const isTagReady = !tagChecking && newTag.length === 5 && tagAvail !== false;

  return (
    <Layout>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* ── Header card ── */}
        <div style={{
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: 20, padding: '28px 28px 24px', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>

            {/* Avatar */}
            <div style={{
              width: 76, height: 76, borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 900, fontSize: 30,
              boxShadow: `0 0 28px ${theme.colors.primary}35`,
            }}>
              {profile?.username?.[0]?.toUpperCase() ?? '?'}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ color: theme.colors.text, fontWeight: 800, fontSize: 20, marginBottom: 2 }}>
                {profile?.username ?? '—'}
              </h2>
              <p style={{ color: theme.colors.textMuted, fontSize: 13, marginBottom: 14 }}>
                {session.user.email}
              </p>

              {/* Hashtag row */}
              {!editingTag ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{
                    backgroundColor: `${theme.colors.primary}18`,
                    border: `1px solid ${theme.colors.primary}35`,
                    borderRadius: 8,
                    padding: '5px 14px',
                    color: theme.colors.primaryLight,
                    fontWeight: 900, fontSize: 14, letterSpacing: 3,
                  }}>
                    #{profile?.hashtag ?? '—'}
                  </span>

                  <ActionBtn onClick={() => copy(`#${profile?.hashtag ?? ''}`)}>
                    Copier
                  </ActionBtn>

                  <ActionBtn onClick={openEditor} variant="outline">
                    Modifier
                  </ActionBtn>

                  {tagSuccess && (
                    <span style={{ color: theme.colors.success, fontSize: 13, fontWeight: 600 }}>
                      ✓ Hashtag mis à jour
                    </span>
                  )}
                </div>
              ) : (
                /* ── Hashtag editor ── */
                <div style={{ maxWidth: 380 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    {/* Input */}
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span style={{
                        position: 'absolute', left: 12, top: '50%',
                        transform: 'translateY(-50%)',
                        color: theme.colors.primaryLight, fontWeight: 900, fontSize: 15,
                        pointerEvents: 'none',
                      }}>#</span>
                      <input
                        autoFocus
                        value={newTag}
                        onChange={e => handleTagInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleTagSave(); if (e.key === 'Escape') cancelEdit(); }}
                        maxLength={5}
                        placeholder="XXXXX"
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          backgroundColor: theme.colors.surfaceHigh,
                          border: `1.5px solid ${tagBorderColor()}`,
                          borderRadius: 8,
                          padding: '9px 36px 9px 28px',
                          color: theme.colors.text,
                          fontSize: 16, fontWeight: 900, letterSpacing: 4,
                          textTransform: 'uppercase', outline: 'none',
                          transition: 'border-color 0.2s',
                        }}
                      />
                      <span style={{
                        position: 'absolute', right: 10, top: '50%',
                        transform: 'translateY(-50%)', fontSize: 13,
                      }}>
                        {tagChecking ? '⏳' : tagAvail === true ? '✅' : tagAvail === false ? '❌' : ''}
                      </span>
                    </div>

                    {/* Save */}
                    <ActionBtn
                      onClick={handleTagSave}
                      variant="primary"
                      disabled={!isTagReady || tagSaving}
                    >
                      {tagSaving ? '…' : 'Sauvegarder'}
                    </ActionBtn>

                    {/* Cancel */}
                    <ActionBtn onClick={cancelEdit} variant="ghost">
                      Annuler
                    </ActionBtn>
                  </div>

                  {/* Feedback */}
                  <div style={{ minHeight: 18, paddingLeft: 2 }}>
                    {tagError ? (
                      <p style={{ color: theme.colors.error, fontSize: 12, fontWeight: 600 }}>{tagError}</p>
                    ) : newTag.length === 5 && !tagChecking ? (
                      tagAvail === false
                        ? <p style={{ color: theme.colors.error, fontSize: 12, fontWeight: 600 }}>Déjà pris — choisis-en un autre.</p>
                        : tagAvail === true
                          ? <p style={{ color: theme.colors.success, fontSize: 12, fontWeight: 600 }}>Disponible !</p>
                          : null
                    ) : newTag.length > 0 && newTag.length < 5 ? (
                      <p style={{ color: theme.colors.textMuted, fontSize: 12 }}>
                        {5 - newTag.length} caractère{5 - newTag.length > 1 ? 's' : ''} restant{5 - newTag.length > 1 ? 's' : ''}
                      </p>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            {/* Credits */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ color: theme.colors.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Crédits</p>
              <p style={{ color: theme.colors.accent, fontWeight: 900, fontSize: 24, lineHeight: 1 }}>
                {(profile?.credits ?? 0).toLocaleString('fr-FR')}
              </p>
              <p style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 4 }}>
                ≈ {((profile?.credits ?? 0) / 100).toFixed(2)} €
              </p>
            </div>
          </div>
        </div>

        {/* ── Stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Duels',      value: stats?.totalDuels ?? 0, color: theme.colors.text },
            { label: 'Victoires',  value: stats?.wins ?? 0,       color: theme.colors.success },
            { label: 'Défaites',   value: stats?.losses ?? 0,     color: theme.colors.error },
            { label: 'Win rate',   value: `${winRate}%`,          color: theme.colors.primary },
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

        {/* ── Discord ── */}
        <div style={{
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: 16, padding: '18px 20px', marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              backgroundColor: '#5865F218', border: '1px solid #5865F230',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>🎮</div>
            <div>
              <p style={{ color: theme.colors.text, fontWeight: 700, fontSize: 14 }}>Discord</p>
              {profile?.discord_username
                ? <p style={{ color: '#5865F2', fontSize: 13 }}>@{profile.discord_username}</p>
                : <p style={{ color: theme.colors.textMuted, fontSize: 13 }}>Non lié</p>
              }
            </div>
          </div>
          <DiscordButton profile={profile} />
        </div>

        {/* ── Badges ── */}
        <div style={{
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: 16, padding: '20px', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ color: theme.colors.text, fontWeight: 700, fontSize: 15 }}>Badges</h3>
            {stats && (
              <span style={{
                color: theme.colors.textMuted, fontSize: 12,
                backgroundColor: theme.colors.surfaceHigh,
                padding: '3px 10px', borderRadius: 999,
                border: `1px solid ${theme.colors.border}`,
              }}>
                {BADGES.filter(b => b.check(stats)).length} / {BADGES.length}
              </span>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
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
            borderRadius: 16, padding: '20px',
          }}>
            <h3 style={{ color: theme.colors.text, fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
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
                    borderRadius: 10, padding: '10px 14px',
                    border: `1px solid ${m.status === 'disputed' ? `${theme.colors.error}25` : theme.colors.border}`,
                  }}>
                    <div>
                      <p style={{ color: theme.colors.text, fontWeight: 600, fontSize: 14 }}>{m.game}</p>
                      <p style={{ color: theme.colors.textMuted, fontSize: 12 }}>vs #{opponent?.hashtag}</p>
                    </div>
                    <p style={{
                      fontWeight: 800, fontSize: 14,
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
      backgroundColor: unlocked ? `${theme.colors.primary}08` : theme.colors.surfaceHigh,
      border: `1px solid ${unlocked ? `${theme.colors.primary}30` : theme.colors.border}`,
      borderRadius: 12, padding: '14px 12px', textAlign: 'center',
      opacity: unlocked ? 1 : 0.45, transition: 'opacity 0.2s', position: 'relative',
    }}>
      {!unlocked && (
        <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 10, color: theme.colors.textMuted }}>🔒</span>
      )}
      <div style={{ fontSize: 28, marginBottom: 6, filter: unlocked ? 'none' : 'grayscale(1)' }}>{badge.icon}</div>
      <p style={{ color: unlocked ? theme.colors.text : theme.colors.textMuted, fontWeight: 700, fontSize: 12, marginBottom: 3 }}>
        {badge.name}
      </p>
      <p style={{ color: theme.colors.textMuted, fontSize: 11, lineHeight: 1.4 }}>{badge.condition}</p>
    </div>
  );
}

function DiscordButton({ profile }: { profile: Profile | null }) {
  const discordClientId = process.env.DISCORD_CLIENT_ID;

  if (profile?.discord_username) {
    return (
      <span style={{
        backgroundColor: `${theme.colors.success}15`,
        border: `1px solid ${theme.colors.success}30`,
        borderRadius: 8, padding: '6px 14px',
        color: theme.colors.success, fontSize: 13, fontWeight: 600,
      }}>✓ Lié</span>
    );
  }

  if (!discordClientId) {
    return (
      <div style={{ textAlign: 'right' }}>
        <button disabled style={{
          backgroundColor: '#5865F215', border: '1px solid #5865F230',
          borderRadius: 8, color: '#5865F2',
          padding: '7px 16px', fontSize: 13, fontWeight: 600,
          cursor: 'not-allowed', opacity: 0.5,
        }}>Lier Discord</button>
        <p style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 4 }}>Bientôt disponible</p>
      </div>
    );
  }

  const redirectUri = encodeURIComponent(`${window.location.origin}/auth/discord/callback`);
  const discordUrl  = `https://discord.com/api/oauth2/authorize?client_id=${discordClientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify`;

  return (
    <a href={discordUrl} style={{ textDecoration: 'none' }}>
      <button style={{
        backgroundColor: '#5865F2', border: 'none', borderRadius: 8,
        color: '#fff', padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
      }}>Lier Discord</button>
    </a>
  );
}
