import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import { theme } from './theme';

function Loader() {
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
      color: theme.colors.primary,
      fontSize: 20,
      fontWeight: 700,
      letterSpacing: 2,
    }}>
      ⚡ SKILLUP
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <Loader />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"  element={!session ? <Login />  : <Navigate to="/" replace />} />
        <Route path="/signup" element={!session ? <Signup /> : <Navigate to="/" replace />} />
        <Route path="/"       element={session  ? <Home session={session} /> : <Navigate to="/login" replace />} />
        <Route path="*"       element={<Navigate to={session ? '/' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
