import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameDef } from '../types';
import { getGames } from '../lib/db';
import Layout from '../components/Layout';
import { theme } from '../theme';

export default function Games() {
  const [games, setGames] = useState<GameDef[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getGames().then(setGames);
  }, []);

  return (
    <Layout>
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ color: theme.colors.text, fontSize: 28, fontWeight: 900, letterSpacing: -1, marginBottom: 8 }}>
          Jeux disponibles
        </h1>
        <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>
          Choisis ton jeu, lis les règles et défie un adversaire.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        {games.map(game => (
          <GameCard
            key={game.slug}
            game={game}
            onClick={() => navigate(`/games/${game.slug}`)}
          />
        ))}
      </div>
    </Layout>
  );
}

function GameCard({ game, onClick }: { game: GameDef; onClick: () => void }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        backgroundColor: game.bg || theme.colors.surface,
        border: `2px solid ${hover && game.available ? game.color : `${game.color}25`}`,
        borderRadius: 18,
        cursor: game.available ? 'pointer' : 'default',
        opacity: game.available ? 1 : 0.65,
        transition: 'border-color 0.2s, transform 0.15s',
        transform: hover && game.available ? 'translateY(-3px)' : 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background image overlay */}
      {game.image_url && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${game.image_url})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.15,
        }} />
      )}

      <div style={{ position: 'relative', padding: '22px 20px' }}>
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

        <div style={{ fontSize: 38, marginBottom: 12 }}>{game.emoji}</div>
        <p style={{ color: game.color, fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{game.name}</p>
        <p style={{ color: theme.colors.textSecondary, fontSize: 12, marginBottom: 14, lineHeight: 1.5 }}>
          {game.description}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            backgroundColor: theme.colors.surfaceHigh,
            borderRadius: theme.radius.full,
            padding: '3px 10px', fontSize: 11, color: theme.colors.textMuted,
          }}>
            {game.platform}
          </span>
          {game.available && (
            <span style={{ color: game.color, fontSize: 12, fontWeight: 700 }}>
              Voir les règles →
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
