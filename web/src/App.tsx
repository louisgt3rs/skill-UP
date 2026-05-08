import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { useProfile } from './hooks/useProfile';
import { Profile } from './types';
import { theme } from './theme';

import Navbar      from './components/Navbar';
import Landing     from './pages/Landing';
import Login       from './pages/Login';
import Signup      from './pages/Signup';
import HowItWorks  from './pages/HowItWorks';
import Dashboard   from './pages/Dashboard';
import Games       from './pages/Games';
import GameDetail  from './pages/GameDetail';
import MatchPage   from './pages/Match';
import ProfilePage from './pages/Profile';
import Wallet      from './pages/Wallet';
import Admin       from './pages/Admin';
import Onboarding  from './pages/Onboarding';
import Chat        from './pages/Chat';

// Pages that should not show the navbar
const NO_NAV_PAGES = ['/onboarding'];

function Loader() {
  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: theme.colors.background,
      color: theme.colors.primary, fontSize: 22, fontWeight: 900, letterSpacing: 3,
    }}>
      ⚡ SKILLUP
    </div>
  );
}

function ConditionalNavbar({ session, profile }: { session: Session | null; profile: Profile | null }) {
  const { pathname } = useLocation();
  if (NO_NAV_PAGES.includes(pathname)) return null;
  return <Navbar session={session} profile={profile} />;
}

interface AppRouterProps {
  session: Session | null;
  profile: Profile | null;
  refresh: () => void;
}

function AppRouter({ session, profile, refresh }: AppRouterProps) {
  const protectedProps = { session: session!, profile, refreshProfile: refresh };
  const needsOnboarding = session && profile && !profile.onboarding_done;

  const guard = (element: JSX.Element) => {
    if (!session) return <Navigate to="/login" replace />;
    if (needsOnboarding) return <Navigate to="/onboarding" replace />;
    return element;
  };

  return (
    <>
      <ConditionalNavbar session={session} profile={profile} />
      <Routes>
        {/* Public */}
        <Route path="/"              element={<Landing />} />
        <Route path="/how-it-works"  element={<HowItWorks />} />
        <Route path="/login"         element={!session ? <Login /> : <Navigate to="/dashboard" replace />} />
        <Route path="/signup"        element={!session ? <Signup /> : <Navigate to="/dashboard" replace />} />

        {/* Onboarding */}
        <Route path="/onboarding" element={
          !session ? <Navigate to="/login" replace />
          : (profile && profile.onboarding_done) ? <Navigate to="/dashboard" replace />
          : profile ? <Onboarding {...protectedProps} />
          : <Loader />
        } />

        {/* Protected */}
        <Route path="/dashboard"           element={guard(<Dashboard {...protectedProps} />)} />
        <Route path="/games"               element={guard(<Games />)} />
        <Route path="/games/:slug"         element={guard(<GameDetail {...protectedProps} />)} />
        <Route path="/match/:id"           element={guard(<MatchPage {...protectedProps} />)} />
        <Route path="/profile"             element={guard(<ProfilePage session={session!} profile={profile} />)} />
        <Route path="/wallet"              element={guard(<Wallet {...protectedProps} />)} />
        <Route path="/admin"               element={guard(<Admin session={session!} profile={profile} />)} />
        <Route path="/chat"                element={guard(<Chat {...protectedProps} />)} />
        <Route path="/chat/:conversationId" element={guard(<Chat {...protectedProps} />)} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile, refresh }  = useProfile(session);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <Loader />;

  return (
    <BrowserRouter>
      <AppRouter session={session} profile={profile} refresh={refresh} />
    </BrowserRouter>
  );
}
