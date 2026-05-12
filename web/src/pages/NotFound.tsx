import { useNavigate } from 'react-router-dom';
import { theme } from '../theme';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: theme.colors.background, padding: '0 24px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 72, marginBottom: 16 }}>⚡</div>
      <h1 style={{ color: theme.colors.text, fontSize: 80, fontWeight: 900, lineHeight: 1, marginBottom: 8 }}>404</h1>
      <p style={{ color: theme.colors.textMuted, fontSize: 18, marginBottom: 32 }}>
        Cette page n'existe pas (ou plus).
      </p>
      <button
        onClick={() => navigate('/')}
        style={{
          background: theme.gradients.primary, border: 'none',
          borderRadius: 14, color: '#fff', cursor: 'pointer',
          padding: '14px 32px', fontWeight: 800, fontSize: 15,
          boxShadow: `0 0 24px ${theme.colors.primary}40`,
        }}
      >
        Retour à l'accueil
      </button>
    </div>
  );
}
