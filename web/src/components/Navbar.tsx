import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { theme } from '../theme';

const NAV_LINKS = [
  { path: '/',              label: 'Accueil' },
  { path: '/games',         label: 'Jeux' },
  { path: '/how-it-works',  label: 'Comment ça marche' },
];

interface Props {
  session: Session | null;
  profile: Profile | null;
}

export default function Navbar({ session, profile }: Props) {
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  const isActive = (path: string) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path);

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 300,
      height: 64,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px',
      backgroundColor: `${theme.colors.surface}f2`,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: `1px solid ${theme.colors.border}`,
    }}>

      {/* Logo */}
      <button onClick={() => navigate('/')} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 8, padding: 0,
      }}>
        <span style={{ fontSize: 22 }}>⚡</span>
        <span style={{ fontWeight: 900, fontSize: 19, letterSpacing: -0.5, color: theme.colors.text }}>
          Skill<span style={{ color: theme.colors.primary }}>Up</span>
        </span>
      </button>

      {/* Center nav — hidden on small screens via inline breakpoint trick */}
      <nav style={{ display: 'flex', gap: 2 }}>
        {NAV_LINKS.map(link => (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '7px 14px', borderRadius: theme.radius.md,
              color: isActive(link.path) ? theme.colors.text : theme.colors.textSecondary,
              fontWeight: isActive(link.path) ? 600 : 400,
              fontSize: 14,
              backgroundColor: isActive(link.path) ? `${theme.colors.primary}18` : 'transparent',
              transition: 'color 0.15s, background-color 0.15s',
            }}
            onMouseEnter={e => { if (!isActive(link.path)) (e.currentTarget as HTMLElement).style.color = theme.colors.text; }}
            onMouseLeave={e => { if (!isActive(link.path)) (e.currentTarget as HTMLElement).style.color = theme.colors.textSecondary; }}
          >
            {link.label}
          </button>
        ))}
      </nav>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {session ? (
          <>
            {/* Credits pill → wallet */}
            <button
              onClick={() => navigate('/wallet')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                backgroundColor: theme.colors.surfaceHigh,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.full,
                padding: '5px 14px', cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = theme.colors.accent)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = theme.colors.border)}
            >
              <span style={{ fontSize: 13 }}>💰</span>
              <span style={{ color: theme.colors.accent, fontWeight: 800, fontSize: 14 }}>
                {(profile?.credits ?? 0).toLocaleString('fr-FR')}
              </span>
              <span style={{ color: theme.colors.textMuted, fontSize: 11 }}>cr</span>
            </button>

            {/* Avatar dropdown */}
            <div ref={dropRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setOpen(v => !v)}
                style={{
                  width: 38, height: 38, borderRadius: '50%',
                  backgroundColor: theme.colors.primary,
                  border: `2px solid ${open ? theme.colors.primaryLight : 'transparent'}`,
                  cursor: 'pointer', color: '#fff', fontWeight: 800, fontSize: 15,
                  transition: 'border-color 0.15s',
                }}
              >
                {profile?.username?.[0]?.toUpperCase() ?? '?'}
              </button>

              {open && (
                <div style={{
                  position: 'absolute', top: 46, right: 0, minWidth: 210,
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: 14,
                  padding: '6px',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                }}>
                  {/* User info */}
                  <div style={{ padding: '10px 14px 10px', marginBottom: 4, borderBottom: `1px solid ${theme.colors.border}` }}>
                    <p style={{ color: theme.colors.text, fontWeight: 700, fontSize: 14 }}>{profile?.username}</p>
                    <p style={{ color: theme.colors.primary, fontSize: 12, fontWeight: 600, marginTop: 2 }}>
                      #{profile?.hashtag}
                    </p>
                  </div>
                  {[
                    { icon: '🏠', label: 'Dashboard',    path: '/dashboard' },
                    { icon: '👤', label: 'Mon profil',   path: '/profile' },
                    { icon: '💳', label: 'Portefeuille', path: '/wallet' },
                  ].map(item => (
                    <DropItem key={item.path} icon={item.icon} label={item.label} onClick={() => navigate(item.path)} />
                  ))}
                  <div style={{ borderTop: `1px solid ${theme.colors.border}`, marginTop: 4, paddingTop: 4 }}>
                    <DropItem
                      icon="🚪"
                      label="Se déconnecter"
                      onClick={() => supabase.auth.signOut()}
                      danger
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => navigate('/login')}
              style={{
                background: 'none',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.md,
                color: theme.colors.textSecondary,
                cursor: 'pointer', padding: '7px 18px', fontSize: 14,
              }}
            >
              Connexion
            </button>
            <button
              onClick={() => navigate('/signup')}
              style={{
                backgroundColor: theme.colors.primary, border: 'none',
                borderRadius: theme.radius.md, color: '#fff',
                cursor: 'pointer', padding: '7px 18px', fontSize: 14, fontWeight: 700,
                boxShadow: `0 0 20px ${theme.colors.primary}50`,
              }}
            >
              Inscription
            </button>
          </>
        )}
      </div>
    </header>
  );
}

function DropItem({ icon, label, onClick, danger = false }: {
  icon: string; label: string; onClick: () => void; danger?: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', textAlign: 'left', background: 'none', border: 'none',
        cursor: 'pointer', padding: '9px 12px',
        borderRadius: 8,
        color: danger ? theme.colors.error : theme.colors.textSecondary,
        fontSize: 14,
        backgroundColor: hover ? theme.colors.surfaceHigh : 'transparent',
        transition: 'background-color 0.1s',
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
