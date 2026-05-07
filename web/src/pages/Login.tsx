import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';
import Input from '../components/Input';
import { theme } from '../theme';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      backgroundColor: theme.colors.background,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 72, lineHeight: 1, marginBottom: 12 }}>⚡</div>
          <h1 style={{
            fontSize: 36,
            fontWeight: 800,
            color: theme.colors.text,
            letterSpacing: -1.5,
            marginBottom: 8,
          }}>
            SkillUp
          </h1>
          <p style={{ color: theme.colors.textSecondary, letterSpacing: 2, fontSize: 13, textTransform: 'uppercase' }}>
            Compete. Win. Dominate.
          </p>
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: 20,
          padding: 32,
        }}>
          <form onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="gamer@email.com"
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />

            {error && (
              <p style={{
                color: theme.colors.error,
                fontSize: 13,
                marginBottom: 16,
                padding: '10px 14px',
                backgroundColor: '#EF444420',
                borderRadius: 8,
                border: `1px solid ${theme.colors.error}40`,
              }}>
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} size="lg" style={{ marginBottom: 20 }}>
              Sign In
            </Button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }} />
              <span style={{ color: theme.colors.textMuted, fontSize: 13 }}>New here?</span>
              <div style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }} />
            </div>

            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => navigate('/signup')}
            >
              Create Account
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
