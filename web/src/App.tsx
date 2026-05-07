import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { useProfile } from './hooks/useProfile';
import { theme } from './theme';

import Navbar      from './components/Navbar';
import Landing     from './pages/Landing';
import Login       from './pages/Login';
import Signup      from './pages/Signup';
import HowItWorks  from './pages/HowItWorks';
import Dashboard   from './pages/Dashboard';
import Games       from './pages/Games';
import MatchPage   from './pages/Match';
import ProfilePage from './pages/Profile';
import Wallet      from './pages/Wallet';

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

  const protectedProps = { session: session!, profile, refreshProfile: refresh };

  return (
    <BrowserRouter>
      <Navbar session={session} profile={profile} />
      <Routes>
        {/* Public */}
        <Route path="/"              element={<Landing />} />
        <Route path="/how-it-works"  element={<HowItWorks />} />
        <Route path="/login"         element={!session ? <Login />  : <Navigate to="/dashboard" replace />} />
        <Route path="/signup"        element={!session ? <Signup /> : <Navigate to="/dashboard" replace />} />

        {/* Protected */}
        <Route path="/dashboard" element={session ? <Dashboard {...protectedProps} /> : <Navigate to="/login" replace />} />
        <Route path="/games"     element={session ? <Games     {...protectedProps} /> : <Navigate to="/login" replace />} />
        <Route path="/match/:id" element={session ? <MatchPage {...protectedProps} /> : <Navigate to="/login" replace />} />
        <Route path="/profile"   element={session ? <ProfilePage session={session!} profile={profile} /> : <Navigate to="/login" replace />} />
        <Route path="/wallet"    element={session ? <Wallet    {...protectedProps} /> : <Navigate to="/login" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
