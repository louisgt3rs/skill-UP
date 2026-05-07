import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { Profile, GameDef } from '../types';
import { getGameBySlug, findByHashtag, createMatch } from '../lib/db';
import Layout from '../components/Layout';
import Input from '../components/Input';
import Button from '../components/Button';
import { theme } from '../theme';

interface Props {
  session: Session;
  profile: Profile | null;
  refreshProfile: () => void;
}

export default function GameDetail({ session, profile, refreshProfile }: Props) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [game, setGame] = useState<GameDef | null>(null);
  const [loading, setLoading] = useState(true);

  // Challenge form
  const [hashtag, setHashtag] = useState('');
  const [wager, setWager] = useState('100');
  const [error, setError] = useState('');
  const [challenging, setChallenging] = useState(false);

  useEffect(() => {
    if (!slug) return;
    getGameBySlug(slug).then(g => {
      setGame(g);
      setLoading(false);
    });
  }, [slug]);

  const wagerNum = parseInt(wager || '0', 10);

  const handleChallenge = async () => {
    if (!game || !profile) return;
    setError('');
    if (!hashtag.trim()) { setError('Entre le hashtag de ton adversaire'); return; }
    if (wagerNum < 10) { setError('Mise minimum : 10 crédits'); return; }
    if (wagerNum > profile.credits) { setError('Crédits insuffisants'); return; }

    setChallenging(true);
    try {
      const opponent = await findByHashtag(hashtag.trim());
      if (!opponent) { setError('Joueur introuvable — vérifie le hashtag'); return; }
      if (opponent.id === session.user.id) { setError('Tu ne peux pas te défier toi-même !'); return; }

      const match = await createMatch(session.user.id, opponent.id, game.slug, wagerNum);
      navigate(`/match/${match.id}`);
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la création du duel');
    } finally {
      setChallenging(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: 80, color: theme.colors.textMuted }}>Chargement...</div>
      </Layout>
    );
  }

  if (!game) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: 80 }}>
          <p style={{ color: theme.colors.error, fontWeight: 700 }}>Jeu introuvable</p>
          <button onClick={() => navigate('/games')} style={{ marginTop: 16, ...backBtnStyle }}>← Retour aux jeux</button>
        </div>
      </Layout>
    );
  }

  const rules = (game.rules || 'Règles à venir.').split('\n');

  return (
    <Layout>
      {/* Back */}
      <button onClick={() => navigate('/games')} style={backBtnStyle}>
        ← Tous les jeux
      </button>

      {/* ── Banner ── */}
      <div style={{
        borderRadius: 22,
        overflow: 'hidden',
        marginBottom: 28,
        position: 'relative',
        minHeight: 220,
        background: game.image_url
          ? `url(${game.image_url}) center/cover no-repeat`
          : `linear-gradient(135deg, ${game.bg || '#0D0A1F'}, #000)`,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)',
        }} />
        <div style={{
          position: 'relative', padding: '40px 36px',
          display: 'flex', alignItems: 'flex-end', gap: 20,
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: `${game.color}25`,
            border: `2px solid ${game.color}60`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 44, flexShrink: 0,
            backdropFilter: 'blur(8px)',
          }}>
            {game.emoji}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h1 style={{ color: '#fff', fontSize: 30, fontWeight: 900 }}>{game.name}</h1>
              <span style={{
                backgroundColor: game.available ? `${theme.colors.success}25` : '#ffffff15',
                border: `1px solid ${game.available ? `${theme.colors.success}50` : '#ffffff20'}`,
                borderRadius: theme.radius.full,
                padding: '4px 12px', fontSize: 11, fontWeight: 700,
                color: game.available ? theme.colors.success : '#ffffffaa',
                textTransform: 'uppercase', letterSpacing: 0.5,
              }}>
                {game.available ? '● Disponible' : 'Bientôt'}
              </span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
              {game.platform} · 1v1
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 380px', gap: 24, alignItems: 'start' }}>

        {/* ── Left: description + rules ── */}
        <div>
          {/* Description */}
          <div style={{
            backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: 18, padding: 24, marginBottom: 16,
          }}>
            <h2 style={{ color: theme.colors.text, fontWeight: 800, fontSize: 16, marginBottom: 12 }}>
              À propos
            </h2>
            <p style={{ color: theme.colors.textSecondary, fontSize: 14, lineHeight: 1.7 }}>
              {game.description || 'Description à venir.'}
            </p>
          </div>

          {/* Rules */}
          <div style={{
            backgroundColor: theme.colors.surface,
            border: `1.5px solid ${game.color}30`,
            borderRadius: 18, padding: 24,
          }}>
            <h2 style={{ color: theme.colors.text, fontWeight: 800, fontSize: 16, marginBottom: 16 }}>
              📋 Règles du duel
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {rules.map((line, i) => {
                const isHeader = line.endsWith(':') && !line.startsWith('•') && !line.startsWith('-');
                const isEmpty = line.trim() === '';
                return (
                  <p
                    key={i}
                    style={{
                      color: isEmpty ? 'transparent' : isHeader ? game.color : theme.colors.textSecondary,
                      fontSize: isHeader ? 13 : 14,
                      fontWeight: isHeader ? 700 : 400,
                      lineHeight: 1.65,
                      letterSpacing: isHeader ? 0.3 : 0,
                      textTransform: isHeader ? 'uppercase' : 'none',
                      marginTop: isHeader ? 8 : 0,
                      paddingLeft: line.startsWith('•') || line.startsWith('-') ? 4 : 0,
                      userSelect: 'none',
                    }}
                  >
                    {isEmpty ? '|' : line}
                  </p>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Right: challenge form ── */}
        <div style={{
          backgroundColor: theme.colors.surface,
          border: `1.5px solid ${game.available ? `${theme.colors.primary}40` : theme.colors.border}`,
          borderRadius: 18, padding: 28,
          boxShadow: game.available ? `0 0 40px ${theme.colors.primary}10` : 'none',
        }}>
          {game.available ? (
            <>
              <h2 style={{ color: theme.colors.text, fontWeight: 800, fontSize: 18, marginBottom: 6 }}>
                ⚡ Lancer un duel
              </h2>
              <p style={{ color: theme.colors.textSecondary, fontSize: 13, marginBottom: 22 }}>
                Entre le hashtag de ton adversaire et choisis ta mise.
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
                }}>Mise (crédits)</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                  {[50, 100, 200, 500].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setWager(String(amt))}
                      style={{
                        padding: '8px 16px', fontSize: 14, fontWeight: 700,
                        border: `1.5px solid ${wager === String(amt) ? game.color : theme.colors.border}`,
                        borderRadius: theme.radius.md, cursor: 'pointer',
                        backgroundColor: wager === String(amt) ? `${game.color}20` : 'transparent',
                        color: wager === String(amt) ? game.color : theme.colors.textSecondary,
                        transition: 'all 0.15s',
                      }}
                    >{amt} cr</button>
                  ))}
                </div>
                <input
                  type="number"
                  value={wager}
                  onChange={e => setWager(e.target.value)}
                  min={10}
                  style={{
                    display: 'block', width: '100%', padding: '11px 14px',
                    backgroundColor: theme.colors.surfaceHigh,
                    border: `1.5px solid ${theme.colors.border}`,
                    borderRadius: theme.radius.md, color: theme.colors.text,
                    fontSize: 15, outline: 'none', boxSizing: 'border-box',
                  }}
                />
                <p style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                  <span>= {(wagerNum / 100).toFixed(2)} €</span>
                  <span>Disponible : <strong style={{ color: theme.colors.accent }}>{profile?.credits ?? 0} cr</strong></span>
                </p>
              </div>

              {error && (
                <div style={{
                  padding: '10px 14px', marginBottom: 14,
                  backgroundColor: `${theme.colors.error}18`,
                  border: `1px solid ${theme.colors.error}40`,
                  borderRadius: 10, color: theme.colors.error, fontSize: 13,
                }}>{error}</div>
              )}

              <Button
                onClick={handleChallenge}
                loading={challenging}
                size="lg"
                disabled={!profile || wagerNum > (profile?.credits ?? 0) || wagerNum < 10}
              >
                ⚡ Envoyer le défi
              </Button>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 14 }}>🔜</div>
              <h3 style={{ color: theme.colors.text, fontWeight: 800, fontSize: 17, marginBottom: 8 }}>
                Bientôt disponible
              </h3>
              <p style={{ color: theme.colors.textSecondary, fontSize: 13, lineHeight: 1.6 }}>
                Ce jeu n'est pas encore ouvert aux duels.<br />
                Revenez bientôt !
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

const backBtnStyle: React.CSSProperties = {
  background: 'none',
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.radius.md,
  color: theme.colors.textMuted,
  cursor: 'pointer',
  padding: '7px 16px',
  fontSize: 13,
  marginBottom: 24,
  display: 'inline-block',
};
