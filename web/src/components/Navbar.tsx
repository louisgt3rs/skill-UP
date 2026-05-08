import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { theme } from '../theme';

const NAV_LINKS: { path: string; label: string; auth: boolean }[] = [
  { path: '/',             label: 'Accueil',           auth: false },
  { path: '/games',        label: 'Jeux',              auth: false },
  { path: '/how-it-works', label: 'Comment ça marche', auth: false },
  { path: '/chat',         label: '💬 Chat',           auth: true  },
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
    path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(path + '/');

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 300,
      height: 64,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px',
      backgroundColor: `${theme.colors.background}e8`,
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: `1px solid ${theme.colors.border}`,
      boxShadow: '0 1px 0 rgba(124,58,237,0.08)',
    }}>

      {/* Logo */}
      <button onClick={() => navigate('/')} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 8, padding: 0,
        flexShrink: 0,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9,
          background: theme.gradients.primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, boxShadow: '0 0 16px rgba(124,58,237,0.4)',
        }}>⚡</div>
        <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: -0.8, color: theme.colors.text }}>
          Skill<span style={{ color: theme.colors.primaryLight }}>Up</span>
        </span>
      </button>

      {/* Center nav */}
      <nav style={{ display: 'flex', gap: 2 }}>
        {NAV_LINKS.filter(link => !link.auth || !!session).map(link => (
          <NavBtn
            key={link.path}
            active={isActive(link.path)}
            onClick={() => navigate(link.path)}
          >
            {link.label}
          </NavBtn>
        ))}
      </nav>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {session ? (
          <>
            {/* Credits */}
            <button
              onClick={() => navigate('/wallet')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                backgroundColor: `${theme.colors.accent}12`,
                border: `1px solid ${theme.colors.accent}30`,
                borderRadius: theme.radius.full,
                padding: '5px 14px', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = `${theme.colors.accent}20`;
                e.currentTarget.style.borderColor = `${theme.colors.accent}60`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = `${theme.colors.accent}12`;
                e.currentTarget.style.borderColor = `${theme.colors.accent}30`;
              }}
            >
              <span style={{ color: theme.colors.accent, fontWeight: 900, fontSize: 14 }}>
                {(profile?.credits ?? 0).toLocaleString('fr-FR')}
              </span>
              <span style={{ color: `${theme.colors.accent}80`, fontSize: 11, fontWeight: 600 }}>cr</span>
            </button>

            {/* Avatar dropdown */}
            <div ref={dropRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setOpen(v => !v)}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: open ? theme.gradients.primary : `${theme.colors.primary}30`,
                  border: `1.5px solid ${open ? theme.colors.primaryLight : theme.colors.primary + '60'}`,
                  cursor: 'pointer', color: '#fff', fontWeight: 900, fontSize: 14,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = theme.gradients.primary; }}
                onMouseLeave={e => {
                  if (!open) e.currentTarget.style.background = `${theme.colors.primary}30`;
                }}
              >
                {profile?.username?.[0]?.toUpperCase() ?? '?'}
              </button>

              {open && (
                <div style={{
                  position: 'absolute', top: 44, right: 0, minWidth: 220,
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: 16, padding: '6px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.1)',
                }}>
                  {/* User info */}
                  <div style={{
                    padding: '12px 14px 14px',
                    marginBottom: 4,
                    borderBottom: `1px solid ${theme.colors.border}`,
                  }}>
                    <p style={{ color: theme.colors.text, fontWeight: 800, fontSize: 14 }}>{profile?.username}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <span style={{
                        backgroundColor: `${theme.colors.primary}20`,
                        border: `1px solid ${theme.colors.primary}30`,
                        borderRadius: theme.radius.full, padding: '2px 10px',
                        color: theme.colors.primaryLight, fontSize: 11, fontWeight: 700,
                      }}>#{profile?.hashtag}</span>
                    </div>
                  </div>

                  <div style={{ padding: '4px 0' }}>
                    {[
                      { icon: '🏠', label: 'Dashboard',    path: '/dashboard' },
                      { icon: '👤', label: 'Mon profil',   path: '/profile' },
                      { icon: '💳', label: 'Portefeuille', path: '/wallet' },
                      ...(profile?.is_admin ? [{ icon: '⚙️', label: 'Admin Panel', path: '/admin' }] : []),
                    ].map(item => (
                      <DropItem key={item.path} icon={item.icon} label={item.label} onClick={() => navigate(item.path)} />
                    ))}
                  </div>

                  <div style={{ borderTop: `1px solid ${theme.colors.border}`, paddingTop: 4, marginTop: 2 }}>
                    <DropItem icon="🚪" label="Se déconnecter" onClick={() => supabase.auth.signOut()} danger />
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <button onClick={() => navigate('/login')} style={{
              background: 'none',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.md,
              color: theme.colors.textSecondary,
              cursor: 'pointer', padding: '7px 18px', fontSize: 13,
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = theme.colors.borderLight;
                e.currentTarget.style.color = theme.colors.text;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = theme.colors.border;
                e.currentTarget.style.color = theme.colors.textSecondary;
              }}
            >
              Connexion
            </button>
            <button onClick={() => navigate('/signup')} style={{
              background: theme.gradients.primary, border: 'none',
              borderRadius: theme.radius.md, color: '#fff',
              cursor: 'pointer', padding: '7px 18px', fontSize: 13, fontWeight: 700,
              boxShadow: '0 0 20px rgba(124,58,237,0.4)',
              transition: 'box-shadow 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 32px rgba(124,58,237,0.6)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 20px rgba(124,58,237,0.4)'}
            >
              Inscription
            </button>
          </>
        )}
      </div>
    </header>
  );
}

function NavBtn({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: active ? `${theme.colors.primary}18` : hover ? `${theme.colors.primary}0d` : 'none',
        border: 'none', cursor: 'pointer',
        padding: '7px 14px', borderRadius: theme.radius.md,
        color: active ? theme.colors.text : hover ? theme.colors.textSecondary : theme.colors.textMuted,
        fontWeight: active ? 600 : 400,
        fontSize: 14,
        transition: 'all 0.15s',
        position: 'relative' as const,
      }}
    >
      {children}
      {active && (
        <span style={{
          position: 'absolute', bottom: -1, left: '50%',
          transform: 'translateX(-50%)',
          width: 16, height: 2, borderRadius: 1,
          backgroundColor: theme.colors.primary,
        }} />
      )}
    </button>
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
        cursor: 'pointer', padding: '9px 12px', borderRadius: 10,
        color: danger
          ? (hover ? theme.colors.error : theme.colors.textMuted)
          : (hover ? theme.colors.text : theme.colors.textSecondary),
        fontSize: 13, fontWeight: hover ? 500 : 400,
        backgroundColor: hover
          ? (danger ? `${theme.colors.error}12` : theme.colors.surfaceHigh)
          : 'transparent',
        transition: 'all 0.1s',
      }}
    >
      <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
