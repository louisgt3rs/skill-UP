import { Session } from '@supabase/supabase-js';
import { Profile } from '../types';
import Layout from '../components/Layout';
import { theme } from '../theme';

interface Props {
  session: Session;
  profile: Profile | null;
}

export default function ProfilePage({ session, profile }: Props) {
  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Layout profile={profile}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 24px' }}>

        <h1 style={{ color: theme.colors.text, fontSize: 26, fontWeight: 800, marginBottom: 32 }}>Mon Profil</h1>

        {/* Avatar + info */}
        <div style={{
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: 20, padding: 32,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          textAlign: 'center', marginBottom: 20,
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            backgroundColor: theme.colors.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, marginBottom: 16,
          }}>
            ⚡
          </div>
          <h2 style={{ color: theme.colors.text, fontWeight: 800, fontSize: 22, marginBottom: 4 }}>
            {profile?.username || 'Joueur'}
          </h2>
          <p style={{ color: theme.colors.textSecondary, fontSize: 14, marginBottom: 4 }}>{session.user.email}</p>
        </div>

        {/* Hashtag card */}
        <div style={{
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: 20, padding: 24, marginBottom: 20,
        }}>
          <p style={{ color: theme.colors.textSecondary, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Ton hashtag unique
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ color: theme.colors.primary, fontWeight: 900, fontSize: 28, letterSpacing: 3 }}>
              #{profile?.hashtag}
            </p>
            <button
              onClick={() => copy(`#${profile?.hashtag || ''}`)}
              style={{
                background: 'none', border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.md, color: theme.colors.textSecondary,
                cursor: 'pointer', padding: '8px 16px', fontSize: 13,
              }}
            >
              📋 Copier
            </button>
          </div>
          <p style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 10 }}>
            Partage ce hashtag pour que d'autres joueurs puissent te défier.
          </p>
        </div>

        {/* Credits */}
        <div style={{
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: 20, padding: 24,
        }}>
          <p style={{ color: theme.colors.textSecondary, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Solde de crédits
          </p>
          <p style={{ color: theme.colors.accent, fontWeight: 900, fontSize: 32, marginBottom: 4 }}>
            {(profile?.credits || 0).toLocaleString()} cr
          </p>
          <p style={{ color: theme.colors.textMuted, fontSize: 14 }}>
            ≈ {((profile?.credits || 0) / 100).toFixed(2)} € — 100 crédits = 1€
          </p>
        </div>
      </div>
    </Layout>
  );
}
