import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';
import { theme } from '../theme';

interface Props {
  session: Session;
}

const username = (session: Session) =>
  session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'Gamer';

export default function Home({ session }: Props) {
  return (
    <div style={{
      minHeight: '100%',
      backgroundColor: theme.colors.background,
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 64, lineHeight: 1, marginBottom: 12 }}>⚡</div>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: theme.colors.text, letterSpacing: -1, marginBottom: 4 }}>
          SkillUp
        </h1>
        <p style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
          Welcome back, <span style={{ color: theme.colors.primary, fontWeight: 700 }}>{username(session)}</span>
        </p>
      </div>

      {/* Stats row */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginBottom: 24,
        width: '100%',
        maxWidth: 480,
      }}>
        {[
          { label: 'Credits', value: '1,000', color: theme.colors.accent },
          { label: 'Wins', value: '0', color: theme.colors.success },
          { label: 'Matches', value: '0', color: theme.colors.primary },
        ].map(stat => (
          <div key={stat.label} style={{
            flex: 1,
            backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: 14,
            padding: '16px 12px',
            textAlign: 'center',
          }}>
            <p style={{ color: stat.color, fontSize: 22, fontWeight: 800 }}>{stat.value}</p>
            <p style={{ color: theme.colors.textSecondary, fontSize: 11, marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Coming soon card */}
      <div style={{
        width: '100%',
        maxWidth: 480,
        backgroundColor: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: 20,
        padding: 28,
        marginBottom: 24,
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 32, marginBottom: 12 }}>🏆</p>
        <h2 style={{ color: theme.colors.text, fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          Matches Coming Soon
        </h2>
        <p style={{ color: theme.colors.textSecondary, fontSize: 14, lineHeight: 1.6 }}>
          Challenge other players, submit results, and win real money. The arena opens soon.
        </p>
      </div>

      {/* Sign out */}
      <div style={{ width: '100%', maxWidth: 200 }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => supabase.auth.signOut()}
          style={{ color: theme.colors.textMuted, fontSize: 13 }}
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
