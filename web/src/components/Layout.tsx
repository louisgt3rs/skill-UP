import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { theme } from '../theme';

interface Props {
  children: ReactNode;
  maxWidth?: number;
  padding?: string;
}

export default function Layout({ children, maxWidth = 920, padding = '32px 24px' }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ flex: 1, maxWidth, margin: '0 auto', width: '100%', padding }}>
        {children}
      </div>
      <footer style={{
        borderTop: `1px solid ${theme.colors.border}`,
        padding: '20px 24px',
        marginTop: 48,
      }}>
        <div style={{
          maxWidth: 920, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12,
        }}>
          <span style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: 700 }}>
            ⚡ SkillUp © {new Date().getFullYear()}
          </span>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[
              { to: '/cgu',     label: 'CGU' },
              { to: '/privacy', label: 'Confidentialité' },
              { to: '/legal',   label: 'Mentions légales' },
            ].map(({ to, label }) => (
              <Link key={to} to={to} style={{
                color: theme.colors.textMuted, fontSize: 12,
                textDecoration: 'none',
              }}
                onMouseEnter={e => (e.currentTarget.style.color = theme.colors.textSecondary)}
                onMouseLeave={e => (e.currentTarget.style.color = theme.colors.textMuted)}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
