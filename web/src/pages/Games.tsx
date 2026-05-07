import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { Profile, GAMES, GameDef } from '../types';
import { findByHashtag, createMatch } from '../lib/db';
import Layout from '../components/Layout';
import Input from '../components/Input';
import Button from '../components/Button';
import { theme } from '../theme';

interface Props {
  session: Session;
  profile: Profile | null;
  refreshProfile: () => void;
}

export default function Games({ session, profile, refreshProfile }: Props) {
  const [selected, setSelected] = useState<GameDef | null>(null);
  const [hashtag, setHashtag]   = useState('');
  const [wager, setWager]       = useState('100');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const navigate = useNavigate();

  const handleChallenge = async () => {
    if (!selected || !profile) return;
    setError('');

    const wagerNum = parseInt(wager, 10);
    if (!hashtag.trim()) { setError('Entre le hashtag de ton adversaire'); return; }
    if (!wagerNum || wagerNum < 10) { setError('Mise minimum : 10 crédits'); return; }

    setLoading(true);
    try {
      const opponent = await findByHashtag(hashtag.trim());
      if (!opponent) { setError('Joueur introuvable — vérifie le hashtag'); return; }
      if (opponent.id === session.user.id) { setError('Tu ne peux pas te défier toi-même !'); return; }

      const match = await createMatch(session.user.id, opponent.id, selected.slug, wagerNum);
      navigate(`/match/${match.id}`);
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la création du duel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout profile={profile}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>

        <h1 style={{ color: theme.colors.text, fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Choisir un jeu</h1>
        <p style={{ color: theme.colors.textSecondary, fontSize: 14, marginBottom: 32 }}>
          Sélectionne le jeu, entre le hashtag de ton adversaire et mise tes crédits.
        </p>

        {/* Game selection */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 40 }}>
          {GAMES.map(game => (
            <div
              key={game.slug}
              onClick={() => !game.comingSoon && setSelected(game.slug === selected?.slug ? null : game)}
              style={{
                flex: '1 1 200px', maxWidth: 240,
                backgroundColor: game.bg,
                border: `2px solid ${selected?.slug === game.slug ? game.color : `${game.color}30`}`,
                borderRadius: 18, padding: 24,
                cursor: game.comingSoon ? 'not-allowed' : 'pointer',
                opacity: game.comingSoon ? 0.5 : 1,
                transition: 'border-color 0.2s, transform 0.15s',
                transform: selected?.slug === game.slug ? 'scale(1.03)' : 'scale(1)',
                position: 'relative',
              }}
            >
              {game.comingSoon && (
                <span style={{
                  position: 'absolute', top: 10, right: 10,
                  fontSize: 10, fontWeight: 700,
                  color: theme.colors.textMuted,
                  textTransform: 'uppercase', letterSpacing: 1,
                }}>Bientôt</span>
              )}
              {selected?.slug === game.slug && (
                <div style={{
                  position: 'absolute', top: -10, right: -10,
                  width: 24, height: 24,
                  backgroundColor: game.color,
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800, color: '#000',
                }}>✓</div>
              )}
              <div style={{ fontSize: 36, marginBottom: 10 }}>{game.emoji}</div>
              <p style={{ color: game.color, fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{game.name}</p>
              <p style={{ color: theme.colors.textSecondary, fontSize: 12 }}>{game.description}</p>
            </div>
          ))}
        </div>

        {/* Challenge form */}
        {selected && (
          <div style={{
            backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: 20, padding: 32,
            maxWidth: 480,
          }}>
            <h2 style={{ color: theme.colors.text, fontWeight: 700, fontSize: 18, marginBottom: 6 }}>
              {selected.emoji} Défier un joueur — {selected.name}
            </h2>
            <p style={{ color: theme.colors.textSecondary, fontSize: 13, marginBottom: 24 }}>
              Entre son hashtag (ex: <span style={{ color: theme.colors.primary }}>#ALPHA42</span>)
            </p>

            <Input
              label="Hashtag adversaire"
              value={hashtag}
              onChange={e => setHashtag(e.target.value)}
              placeholder="#XXXXXX"
              style={{ letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700 }}
            />

            <div>
              <label style={{
                display: 'block', color: theme.colors.textSecondary,
                fontSize: 12, fontWeight: 600, marginBottom: 6,
                textTransform: 'uppercase', letterSpacing: 0.8,
              }}>
                Mise (crédits)
              </label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                {[50, 100, 200, 500].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setWager(String(amt))}
                    style={{
                      padding: '8px 16px', fontSize: 14, fontWeight: 700,
                      border: `1.5px solid ${wager === String(amt) ? theme.colors.primary : theme.colors.border}`,
                      borderRadius: theme.radius.md,
                      backgroundColor: wager === String(amt) ? `${theme.colors.primary}20` : 'transparent',
                      color: wager === String(amt) ? theme.colors.primary : theme.colors.textSecondary,
                      cursor: 'pointer',
                    }}
                  >{amt}</button>
                ))}
              </div>
              <input
                type="number"
                value={wager}
                onChange={e => setWager(e.target.value)}
                min={10}
                style={{
                  display: 'block', width: '100%', padding: '12px 16px',
                  backgroundColor: theme.colors.surfaceHigh,
                  border: `1.5px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.md, color: theme.colors.text, fontSize: 15, outline: 'none',
                }}
              />
              <p style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 6 }}>
                = {(parseInt(wager || '0') / 100).toFixed(2)} € · Tes crédits : {profile?.credits || 0}
              </p>
            </div>

            {error && (
              <p style={{
                color: theme.colors.error, fontSize: 13, marginTop: 16,
                padding: '10px 14px', backgroundColor: '#EF444415',
                borderRadius: 8, border: `1px solid ${theme.colors.error}30`,
              }}>{error}</p>
            )}

            <Button
              onClick={handleChallenge}
              loading={loading}
              disabled={!profile || profile.credits < parseInt(wager || '0')}
              style={{ marginTop: 24 }}
              size="lg"
            >
              ⚡ Envoyer le défi
            </Button>

            {profile && profile.credits < parseInt(wager || '0') && (
              <p style={{ color: theme.colors.error, fontSize: 12, textAlign: 'center', marginTop: 8 }}>
                Crédits insuffisants
              </p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
