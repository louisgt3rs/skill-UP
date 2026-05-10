import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { theme } from '../theme';
import { useIsMobile } from '../hooks/useIsMobile';

const NAV_LINKS_GUEST: { path: string; label: string }[] = [
  { path: '/',             label: 'Accueil'           },
  { path: '/games',        label: 'Jeux'              },
  { path: '/how-it-works', label: 'Comment ça marche' },
  { path: '/leaderboard',  label: '🏆 Classement'     },
];

const NAV_LINKS_AUTH: { path: string; label: string }[] = [
  { path: '/hub',          label: '🏠 Lobby'          },
  { path: '/games',        label: 'Jeux'              },
  { path: '/leaderboard',  label: '🏆 Classement'     },
  { path: '/chat',         label: '💬 Chat'           },
];

interface Props {
  session: Session | null;
  profile: Profile | null;
}

export default function Navbar({ session, profile }: Props) {
  const [open, setOpen]       = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isMobile = useIsMobile();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setOpen(false); setMenuOpen(false); }, [pathname]);

  const isActive = (path: string) =>
    path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(path + '/');

  const go = (path: string) => { navigate(path); setMenuOpen(false); };

  return (
    <>
      <header style={{
        position: 'sticky', top: 0, zIndex: 300,
        height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0 16px' : '0 32px',
        backgroundColor: `${theme.colors.background}e8`,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: `1px solid ${theme.colors.border}`,
        boxShadow: '0 1px 0 rgba(124,58,237,0.08)',
      }}>

        {/* Logo */}
        <button onClick={() => navigate('/')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8, padding: 0, flexShrink: 0,
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

        {/* Desktop nav */}
        {!isMobile && (
          <nav style={{ display: 'flex', gap: 2 }}>
            {(session ? NAV_LINKS_AUTH : NAV_LINKS_GUEST).map(link => (
              <NavBtn key={link.path} active={isActive(link.path)} onClick={() => navigate(link.path)}>
                {link.label}
              </NavBtn>
            ))}
          </nav>
        )}

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 10, flexShrink: 0 }}>
          {session && (
            <button onClick={() => navigate('/wallet')} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              backgroundColor: `${theme.colors.accent}12`,
              border: `1px solid ${theme.colors.accent}30`,
              borderRadius: theme.radius.full,
              padding: '5px 12px', cursor: 'pointer',
            }}>
              <span style={{ color: theme.colors.accent, fontWeight: 900, fontSize: 14 }}>
                {(profile?.credits ?? 0).toLocaleString('fr-FR')}
              </span>
              <span style={{ color: `${theme.colors.accent}80`, fontSize: 11, fontWeight: 600 }}>cr</span>
            </button>
          )}

          {/* Desktop avatar dropdown */}
          {!isMobile && session && (
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
                  <div style={{ padding: '12px 14px 14px', marginBottom: 4, borderBottom: `1px solid ${theme.colors.border}` }}>
                    <p style={{ color: theme.colors.text, fontWeight: 800, fontSize: 14 }}>{profile?.username}</p>
                    <span style={{
                      backgroundColor: `${theme.colors.primary}20`,
                      border: `1px solid ${theme.colors.primary}30`,
                      borderRadius: theme.radius.full, padding: '2px 10px',
                      color: theme.colors.primaryLight, fontSize: 11, fontWeight: 700,
                      display: 'inline-block', marginTop: 4,
                    }}>#{profile?.hashtag}</span>
                  </div>
                  <div style={{ padding: '4px 0' }}>
                    {[
                      { icon: '🏠', label: 'Lobby',        path: '/hub' },
                      { icon: '📋', label: 'Historique',   path: '/dashboard' },
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
          )}

          {/* Desktop login buttons */}
          {!isMobile && !session && (
            <>
              <button onClick={() => navigate('/login')} style={{
                background: 'none', border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.md, color: theme.colors.textSecondary,
                cursor: 'pointer', padding: '7px 18px', fontSize: 13,
              }}>Connexion</button>
              <button onClick={() => navigate('/signup')} style={{
                background: theme.gradients.primary, border: 'none',
                borderRadius: theme.radius.md, color: '#fff',
                cursor: 'pointer', padding: '7px 18px', fontSize: 13, fontWeight: 700,
                boxShadow: '0 0 20px rgba(124,58,237,0.4)',
              }}>Inscription</button>
            </>
          )}

          {/* Mobile hamburger */}
          {isMobile && (
            <button
              onClick={() => setMenuOpen(v => !v)}
              style={{
                width: 36, height: 36, borderRadius: 10, border: 'none',
                backgroundColor: menuOpen ? `${theme.colors.primary}25` : theme.colors.surfaceHigh,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 5, padding: '10px 9px',
              }}
            >
              <span style={{
                display: 'block', width: 18, height: 2, borderRadius: 1,
                backgroundColor: theme.colors.text,
                transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none',
                transition: 'transform 0.2s',
              }} />
              <span style={{
                display: 'block', width: 18, height: 2, borderRadius: 1,
                backgroundColor: theme.colors.text,
                opacity: menuOpen ? 0 : 1,
                transition: 'opacity 0.2s',
              }} />
              <span style={{
                display: 'block', width: 18, height: 2, borderRadius: 1,
                backgroundColor: theme.colors.text,
                transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none',
                transition: 'transform 0.2s',
              }} />
            </button>
          )}
        </div>
      </header>

      {/* Mobile menu drawer */}
      {isMobile && menuOpen && (
        <div style={{
          position: 'fixed', top: 64, left: 0, right: 0, bottom: 0,
          zIndex: 299,
          backgroundColor: `${theme.colors.background}f5`,
          backdropFilter: 'blur(16px)',
          display: 'flex', flexDirection: 'column',
          padding: '16px 16px 32px',
          overflowY: 'auto',
        }}>
          {/* Nav links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 20 }}>
            {(session ? NAV_LINKS_AUTH : NAV_LINKS_GUEST).map(link => (
              <button
                key={link.path}
                onClick={() => go(link.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px', borderRadius: 14, border: 'none',
                  backgroundColor: isActive(link.path) ? `${theme.colors.primary}18` : 'transparent',
                  color: isActive(link.path) ? theme.colors.text : theme.colors.textSecondary,
                  fontSize: 16, fontWeight: isActive(link.path) ? 700 : 400,
                  cursor: 'pointer', textAlign: 'left',
                  borderLeft: `3px solid ${isActive(link.path) ? theme.colors.primary : 'transparent'}`,
                }}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Account section */}
          {session ? (
            <div style={{
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 16, padding: '16px',
            }}>
              <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${theme.colors.border}` }}>
                <p style={{ color: theme.colors.text, fontWeight: 800, fontSize: 16 }}>{profile?.username}</p>
                <span style={{
                  color: theme.colors.primaryLight, fontSize: 13, fontWeight: 600,
                }}>#{profile?.hashtag}</span>
              </div>
              {[
                { icon: '🏠', label: 'Lobby',        path: '/hub' },
                { icon: '📋', label: 'Historique',   path: '/dashboard' },
                { icon: '👤', label: 'Mon profil',   path: '/profile' },
                { icon: '💳', label: 'Portefeuille', path: '/wallet' },
                ...(profile?.is_admin ? [{ icon: '⚙️', label: 'Admin Panel', path: '/admin' }] : []),
              ].map(item => (
                <button
                  key={item.path}
                  onClick={() => go(item.path)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    width: '100%', padding: '12px 4px', border: 'none',
                    background: 'none', color: theme.colors.textSecondary,
                    fontSize: 15, cursor: 'pointer', textAlign: 'left',
                    borderBottom: `1px solid ${theme.colors.border}20`,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => supabase.auth.signOut()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', padding: '12px 4px', border: 'none',
                  background: 'none', color: theme.colors.error,
                  fontSize: 15, cursor: 'pointer', textAlign: 'left', marginTop: 4,
                }}
              >
                <span style={{ fontSize: 18 }}>🚪</span>
                Se déconnecter
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => go('/login')} style={{
                padding: '14px', borderRadius: 14,
                background: 'none', border: `1.5px solid ${theme.colors.border}`,
                color: theme.colors.text, fontSize: 16, fontWeight: 600, cursor: 'pointer',
              }}>Connexion</button>
              <button onClick={() => go('/signup')} style={{
                padding: '14px', borderRadius: 14,
                background: theme.gradients.primary, border: 'none',
                color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 0 24px rgba(124,58,237,0.4)',
              }}>Inscription</button>
            </div>
          )}
        </div>
      )}
    </>
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
        fontWeight: active ? 600 : 400, fontSize: 14, transition: 'all 0.15s',
        position: 'relative' as const,
      }}
    >
      {children}
      {active && (
        <span style={{
          position: 'absolute', bottom: -1, left: '50%', transform: 'translateX(-50%)',
          width: 16, height: 2, borderRadius: 1, backgroundColor: theme.colors.primary,
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
        backgroundColor: hover ? (danger ? `${theme.colors.error}12` : theme.colors.surfaceHigh) : 'transparent',
        transition: 'all 0.1s',
      }}
    >
      <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
