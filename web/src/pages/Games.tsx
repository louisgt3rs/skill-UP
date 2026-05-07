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

  const wagerNum = parseInt(wager || '0', 10);

  const handleChallenge = async () => {
    if (!selected || !profile) return;
    setError('');
    if (!hashtag.trim())    { setError('Entre le hashtag de ton adversaire'); return; }
    if (wagerNum < 10)      { setError('Mise minimum : 10 crédits'); return; }
    if (wagerNum > profile.credits) { setError('Crédits insuffisants'); return; }

    setLoading(true);
    try {
      const opponent = await findByHashtag(hashtag.trim());
      if (!opponent)                       { setError('Joueur introuvable — vérifie le hashtag'); return; }
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
    <Layout>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ color: theme.colors.text, fontSize: 28, fontWeight: 900, letterSpacing: -1, marginBottom: 8 }}>
          Jeux disponibles
        </h1>
        <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>
          Choisis ton jeu, entre le hashtag de ton adversaire et mis des crédits.
        </p>
      </div>

      {/* Game grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 40 }}>
        {GAMES.map(game => (
          <GameCard
            key={game.slug}
            game={game}
            selected={selected?.slug === game.slug}
            onSelect={() => {
              if (!game.available) return;
              setSelected(selected?.slug === game.slug ? null : game);
              setError('');
            }}
          />
        ))}
      </div>

      {/* Challenge form */}
      {selected && (
        <div style={{
          backgroundColor: theme.colors.surface,
          border: `1.5px solid ${theme.colors.primary}40`,
          borderRadius: 20, padding: 32, maxWidth: 500,
          boxShadow: `0 0 40px ${theme.colors.primary}15`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 24 }}>{selected.emoji}</span>
            <h2 style={{ color: theme.colors.text, fontWeight: 800, fontSize: 20 }}>
              Défier un joueur
            </h2>
          </div>
          <p style={{ color: theme.colors.textSecondary, fontSize: 13, marginBottom: 24 }}>
            {selected.name} · {selected.rules}
          </p>

          <Input
            label="Hashtag adversaire"
            value={hashtag}
            onChange={e => setHashtag(e.target.value.toUpperCase())}
            placeholder="#XXXXXX"
            style={{ letterSpacing: 2, fontWeight: 700, textTransform: 'uppercase' }}
          />

          {/* Wager */}
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block', color: theme.colors.textSecondary,
              fontSize: 12, fontWeight: 600, marginBottom: 8,
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
                    padding: '8px 18px', fontSize: 14, fontWeight: 700,
                    border: `1.5px solid ${wager === String(amt) ? theme.colors.primary : theme.colors.border}`,
                    borderRadius: theme.radius.md, cursor: 'pointer',
                    backgroundColor: wager === String(amt) ? `${theme.colors.primary}25` : 'transparent',
                    color: wager === String(amt) ? theme.colors.primary : theme.colors.textSecondary,
                    transition: 'all 0.15s',
                  }}
                >
                  {amt} cr
                </button>
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
                borderRadius: theme.radius.md, color: theme.colors.text,
                fontSize: 15, outline: 'none',
              }}
            />
            <p style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
              <span>= {(wagerNum / 100).toFixed(2)} €</span>
              <span>Disponible : <strong style={{ color: theme.colors.accent }}>{profile?.credits ?? 0} cr</strong></span>
            </p>
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', marginBottom: 16,
              backgroundColor: `${theme.colors.error}18`,
              border: `1px solid ${theme.colors.error}40`,
              borderRadius: 10,
              color: theme.colors.error, fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <Button onClick={handleChallenge} loading={loading} size="lg"
            disabled={!profile || wagerNum > (profile?.credits ?? 0) || wagerNum < 10}>
            ⚡ Envoyer le défi
          </Button>
        </div>
      )}
    </Layout>
  );
}

function GameCard({ game, selected, onSelect }: { game: GameDef; selected: boolean; onSelect: () => void }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        backgroundColor: game.bg || theme.colors.surface,
        border: `2px solid ${selected ? game.color : hover && game.available ? `${game.color}60` : `${game.color}25`}`,
        borderRadius: 18, padding: '22px 20px',
        cursor: game.available ? 'pointer' : 'not-allowed',
        opacity: game.available ? 1 : 0.6,
        transition: 'border-color 0.2s, transform 0.15s',
        transform: selected ? 'scale(1.02)' : 'scale(1)',
        position: 'relative',
      }}
    >
      {/* Status badge */}
      <span style={{
        position: 'absolute', top: 12, right: 12,
        backgroundColor: game.available ? `${theme.colors.success}20` : theme.colors.surfaceHigh,
        border: `1px solid ${game.available ? `${theme.colors.success}40` : theme.colors.border}`,
        borderRadius: theme.radius.full,
        padding: '3px 10px', fontSize: 10, fontWeight: 700,
        color: game.available ? theme.colors.success : theme.colors.textMuted,
        textTransform: 'uppercase', letterSpacing: 0.5,
      }}>
        {game.available ? 'Disponible' : 'Bientôt'}
      </span>

      {/* Selected check */}
      {selected && (
        <div style={{
          position: 'absolute', top: -10, left: -10,
          width: 26, height: 26, borderRadius: '50%',
          backgroundColor: game.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 900, color: '#000',
        }}>✓</div>
      )}

      <div style={{ fontSize: 38, marginBottom: 12 }}>{game.emoji}</div>
      <p style={{ color: game.color, fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{game.name}</p>
      <p style={{ color: theme.colors.textSecondary, fontSize: 12, marginBottom: 10, lineHeight: 1.5 }}>{game.description}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          backgroundColor: theme.colors.surfaceHigh,
          borderRadius: theme.radius.full,
          padding: '3px 10px', fontSize: 11, color: theme.colors.textMuted,
        }}>
          {game.platform}
        </span>
        <span style={{ color: theme.colors.textMuted, fontSize: 11 }}>1v1</span>
      </div>
    </div>
  );
}
