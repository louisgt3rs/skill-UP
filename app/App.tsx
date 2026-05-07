import React, { useState, useEffect } from 'react';

export default function App() {
  const [status, setStatus] = useState('Chargement...');
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      require('./src/navigation');
      setStatus('OK');
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  }, []);

  return React.createElement('div', {
    style: {
      background: '#0A0A0F',
      color: '#fff',
      padding: 20,
      minHeight: '100vh',
      fontFamily: 'monospace',
    }
  },
    React.createElement('h2', { style: { color: '#7C3AED' } }, '⚡ SkillUp'),
    React.createElement('p', null, status),
    error && React.createElement('pre', { style: { color: '#ff4444', whiteSpace: 'pre-wrap' } }, error)
  );
}
