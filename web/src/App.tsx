import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { useProfile } from './hooks/useProfile';
import { theme } from './theme';

import Landing   from './pages/Landing';
import Login     from './pages/Login';
import Signup    from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Games     from './pages/Games';
import MatchPage from './pages/Match';
import ProfilePage from './pages/Profile';

function Loader() {
  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: theme.colors.background, color: theme.colors.primary,
      fontSize: 20, fontWeight: 800, letterSpacing: 3,
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

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"       element={<Landing />} />
        <Route path="/login"  element={!session ? <Login />  : <Navigate to="/dashboard" replace />} />
        <Route path="/signup" element={!session ? <Signup /> : <Navigate to="/dashboard" replace />} />

        {/* Protected */}
        <Route path="/dashboard" element={
          session ? <Dashboard session={session} profile={profile} refreshProfile={refresh} />
                  : <Navigate to="/login" replace />
        } />
        <Route path="/games" element={
          session ? <Games session={session} profile={profile} refreshProfile={refresh} />
                  : <Navigate to="/login" replace />
        } />
        <Route path="/match/:id" element={
          session ? <MatchPage session={session} profile={profile} refreshProfile={refresh} />
                  : <Navigate to="/login" replace />
        } />
        <Route path="/profile" element={
          session ? <ProfilePage session={session} profile={profile} />
                  : <Navigate to="/login" replace />
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
