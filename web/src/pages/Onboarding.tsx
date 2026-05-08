import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { Profile } from '../types';
import { isHashtagAvailable, completeOnboarding } from '../lib/db';
import { theme } from '../theme';

interface Props {
  session: Session;
  profile: Profile | null;
  refreshProfile: () => void;
}

const VALID_RE = /^[A-Z0-9]{1,5}$/;

function hashColor(str: string) {
  let h = 0;
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  const hue = (h * 137) % 360;
  return `hsl(${hue}, 70%, 55%)`;
}

export default function Onboarding({ session, profile, refreshProfile }: Props) {
  const [hashtag, setHashtag]   = useState('');
  const [username, setUsername] = useState(profile?.username ?? '');
  const [avail, setAvail]       = useState<null | boolean>(null);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (profile?.username) setUsername(profile.username);
  }, [profile?.username]);

  const handleHashtagChange = (raw: string) => {
    const val = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
    setHashtag(val);
    setAvail(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length === 5) {
      setChecking(true);
      debounceRef.current = setTimeout(async () => {
        const ok = await isHashtagAvailable(val);
        setAvail(ok);
        setChecking(false);
      }, 500);
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (hashtag.length !== 5) { setError('Le hashtag doit faire exactement 5 caractères.'); return; }
    if (!VALID_RE.test(hashtag)) { setError('Lettres (A-Z) et chiffres (0-9) uniquement.'); return; }
    if (avail === false) { setError('Ce hashtag est déjà pris.'); return; }
    if (!username.trim()) { setError('Entre un nom d\'utilisateur.'); return; }
    setLoading(true);
    try {
      await completeOnboarding(session.user.id, hashtag, username.trim());
      refreshProfile();
      navigate('/dashboard', { replace: true });
    } catch {
      setError('Erreur lors de l\'enregistrement, réessaie.');
    } finally {
      setLoading(false);
    }
  };

  const isReady = hashtag.length === 5 && avail === true && username.trim().length >= 2;
  const avatarColor = hashtag.length > 0 ? hashColor(hashtag) : theme.colors.primary;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.colors.background,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* background orbs */}
      <div style={{
        position: 'absolute', top: '10%', left: '5%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
        pointerEvents: 'none', animation: 'orb-drift-1 18s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '5%',
        width: 320, height: 320, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)',
        pointerEvents: 'none', animation: 'orb-drift-2 22s ease-in-out infinite',
      }} />

      <div style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 18, margin: '0 auto 16px',
            background: theme.gradients.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, boxShadow: '0 0 32px rgba(124,58,237,0.5)',
          }}>⚡</div>
          <h1 style={{ color: theme.colors.text, fontSize: 28, fontWeight: 900, letterSpacing: -1, marginBottom: 6 }}>
            Bienvenue sur <span style={{ color: theme.colors.primaryLight }}>SkillUp</span>
          </h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>
            Choisis ton identité de joueur pour commencer
          </p>
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: 24, padding: 36,
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}>
          {/* Avatar preview */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: `linear-gradient(135deg, ${avatarColor}, ${theme.colors.primaryDark})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 900, fontSize: 28,
              boxShadow: `0 0 32px ${avatarColor}60`,
              transition: 'box-shadow 0.3s, background 0.3s',
              border: `3px solid ${avatarColor}50`,
            }}>
              {hashtag.length > 0 ? hashtag[0] : username[0]?.toUpperCase() ?? '?'}
            </div>
          </div>

          {/* Username */}
          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block', color: theme.colors.textSecondary,
              fontSize: 12, fontWeight: 600, letterSpacing: 0.8,
              textTransform: 'uppercase', marginBottom: 8,
            }}>
              Nom d'affichage
            </label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              maxLength={30}
              placeholder="ProGamer99"
              style={{
                width: '100%', boxSizing: 'border-box',
                backgroundColor: theme.colors.surfaceHigh,
                border: `1.5px solid ${theme.colors.border}`,
                borderRadius: 12, padding: '12px 16px',
                color: theme.colors.text, fontSize: 15,
                outline: 'none', transition: 'border-color 0.2s',
              }}
              onFocus={e => e.currentTarget.style.borderColor = theme.colors.primary}
              onBlur={e => e.currentTarget.style.borderColor = theme.colors.border}
            />
          </div>

          {/* Hashtag */}
          <div style={{ marginBottom: 8 }}>
            <label style={{
              display: 'block', color: theme.colors.textSecondary,
              fontSize: 12, fontWeight: 600, letterSpacing: 0.8,
              textTransform: 'uppercase', marginBottom: 8,
            }}>
              Ton hashtag (5 caractères)
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                color: theme.colors.primaryLight, fontSize: 18, fontWeight: 900,
                pointerEvents: 'none',
              }}>#</span>
              <input
                value={hashtag}
                onChange={e => handleHashtagChange(e.target.value)}
                maxLength={5}
                placeholder="AB3CD"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  backgroundColor: theme.colors.surfaceHigh,
                  border: `1.5px solid ${
                    hashtag.length === 5
                      ? avail === true ? theme.colors.success
                      : avail === false ? theme.colors.error
                      : theme.colors.primary
                    : theme.colors.border
                  }`,
                  borderRadius: 12,
                  padding: '14px 48px 14px 38px',
                  color: theme.colors.text,
                  fontSize: 22, fontWeight: 900, letterSpacing: 6,
                  textTransform: 'uppercase',
                  outline: 'none', transition: 'border-color 0.2s',
                }}
                onFocus={e => {
                  if (hashtag.length < 5) e.currentTarget.style.borderColor = theme.colors.primary;
                }}
                onBlur={e => {
                  if (avail === null) e.currentTarget.style.borderColor = theme.colors.border;
                }}
              />
              {/* Status icon */}
              <span style={{
                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                fontSize: 18,
              }}>
                {checking ? '⏳' : avail === true ? '✅' : avail === false ? '❌' : ''}
              </span>
            </div>
          </div>

          {/* Availability message */}
          <div style={{ minHeight: 22, marginBottom: 24, paddingLeft: 4 }}>
            {hashtag.length === 5 && !checking && (
              <p style={{
                fontSize: 13, fontWeight: 600,
                color: avail ? theme.colors.success : theme.colors.error,
              }}>
                {avail ? '✓ Disponible — à toi !' : '✗ Déjà pris, essaie un autre.'}
              </p>
            )}
            {hashtag.length > 0 && hashtag.length < 5 && (
              <p style={{ fontSize: 13, color: theme.colors.textMuted }}>
                {5 - hashtag.length} caractère{5 - hashtag.length > 1 ? 's' : ''} restant{5 - hashtag.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {error && (
            <div style={{
              backgroundColor: `${theme.colors.error}15`,
              border: `1px solid ${theme.colors.error}40`,
              borderRadius: 10, padding: '10px 14px',
              color: theme.colors.error, fontSize: 13, marginBottom: 20,
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!isReady || loading}
            style={{
              width: '100%', padding: '15px',
              background: isReady ? theme.gradients.primary : theme.colors.surfaceHigh,
              border: 'none', borderRadius: 14,
              color: isReady ? '#fff' : theme.colors.textMuted,
              fontSize: 16, fontWeight: 800, cursor: isReady ? 'pointer' : 'not-allowed',
              boxShadow: isReady ? '0 0 32px rgba(124,58,237,0.5)' : 'none',
              transition: 'all 0.2s',
              letterSpacing: 0.5,
            }}
          >
            {loading ? 'Enregistrement…' : 'Commencer à jouer ⚡'}
          </button>

          <p style={{
            textAlign: 'center', color: theme.colors.textMuted, fontSize: 12, marginTop: 18,
          }}>
            Tu pourras modifier ton nom d'utilisateur dans ton profil.
            Le hashtag est permanent.
          </p>
        </div>

        {/* Hint */}
        <p style={{
          textAlign: 'center', color: theme.colors.textMuted, fontSize: 13, marginTop: 20,
        }}>
          Les autres joueurs te trouveront via ton hashtag unique <span style={{ color: theme.colors.primaryLight }}>#XXXXX</span>
        </p>
      </div>
    </div>
  );
}
