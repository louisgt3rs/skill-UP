import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { theme } from '../theme';

interface Props {
  children: ReactNode;
  profile: Profile | null;
}

const NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { path: '/games',     label: 'Jeux',      icon: '🎮' },
  { path: '/profile',   label: 'Profil',    icon: '👤' },
];

export default function Layout({ children, profile }: Props) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', backgroundColor: theme.colors.background }}>

      {/* Top Nav */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: theme.colors.surface,
        borderBottom: `1px solid ${theme.colors.border}`,
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 60,
      }}>
        {/* Logo */}
        <button
          onClick={() => navigate('/dashboard')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <span style={{ fontSize: 22 }}>⚡</span>
          <span style={{ color: theme.colors.text, fontWeight: 800, fontSize: 18, letterSpacing: -0.5 }}>SkillUp</span>
        </button>

        {/* Nav links */}
        <nav style={{ display: 'flex', gap: 4 }}>
          {NAV.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px 14px',
                borderRadius: theme.radius.md,
                color: pathname === item.path ? theme.colors.primary : theme.colors.textSecondary,
                backgroundColor: pathname === item.path ? `${theme.colors.primary}18` : 'transparent',
                fontWeight: pathname === item.path ? 700 : 400,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Credits + sign out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {profile && (
            <div style={{
              backgroundColor: theme.colors.surfaceHigh,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.full,
              padding: '5px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <span style={{ color: theme.colors.accent, fontSize: 14 }}>💰</span>
              <span style={{ color: theme.colors.text, fontWeight: 700, fontSize: 14 }}>
                {profile.credits.toLocaleString()}
              </span>
              <span style={{ color: theme.colors.textMuted, fontSize: 12 }}>cr</span>
            </div>
          )}
          <button
            onClick={() => supabase.auth.signOut()}
            style={{
              background: 'none',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.md,
              color: theme.colors.textSecondary,
              cursor: 'pointer',
              padding: '5px 12px',
              fontSize: 13,
            }}
          >
            Quitter
          </button>
        </div>
      </header>

      {/* Page content */}
      <main style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  );
}
