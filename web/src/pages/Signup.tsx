import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';
import Input from '../components/Input';
import { theme } from '../theme';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [done, setDone]         = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !email || !password || !confirm) { setError('Please fill in all fields'); return; }
    if (password !== confirm)   { setError('Passwords do not match'); return; }
    if (password.length < 6)    { setError('Password must be at least 6 characters'); return; }
    if (username.length < 3)    { setError('Username must be at least 3 characters'); return; }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { username: username.trim() } },
      });
      if (error) throw error;
      setDone(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div style={{
        minHeight: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        backgroundColor: theme.colors.background,
        textAlign: 'center',
      }}>
        <div>
          <div style={{ fontSize: 72, marginBottom: 24 }}>✉️</div>
          <h2 style={{ color: theme.colors.text, fontSize: 26, fontWeight: 700, marginBottom: 12 }}>
            Check your email!
          </h2>
          <p style={{ color: theme.colors.textSecondary, marginBottom: 32, maxWidth: 320, margin: '0 auto 32px' }}>
            We sent you a confirmation link. Verify your email then sign in.
          </p>
          <Button size="lg" onClick={() => navigate('/login')} fullWidth={false} style={{ margin: '0 auto', padding: '16px 48px' }}>
            Go to Sign In
          </Button>
        </div>
      </div>
    );
  }

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

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'none',
              border: 'none',
              color: theme.colors.primary,
              cursor: 'pointer',
              fontSize: 15,
              fontWeight: 500,
              marginBottom: 20,
              padding: 0,
            }}
          >
            ← Back
          </button>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: theme.colors.text, letterSpacing: -1, marginBottom: 6 }}>
            Join SkillUp
          </h1>
          <p style={{ color: theme.colors.accent, fontWeight: 600 }}>
            Start with 1,000 free credits
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
              label="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="ProGamer99"
              autoComplete="username"
              maxLength={30}
            />
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
              autoComplete="new-password"
            />
            <Input
              label="Confirm Password"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
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

            <Button type="submit" loading={loading} size="lg">
              Create Account
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
