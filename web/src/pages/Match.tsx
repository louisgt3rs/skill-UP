import { useEffect, useRef, useState, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { Match, Message, Profile, GAMES } from '../types';
import { getMatch, getMessages, sendMessage, submitResult, acceptMatch, declineMatch } from '../lib/db';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import { theme } from '../theme';

interface Props {
  session: Session;
  profile: Profile | null;
  refreshProfile: () => void;
}

export default function MatchPage({ session, profile, refreshProfile }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch]         = useState<Match | null>(null);
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading]     = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const uid = session.user.id;

  const loadMatch = async () => {
    if (!id) return;
    const m = await getMatch(id);
    setMatch(m);
  };

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getMatch(id).then(setMatch),
      getMessages(id).then(setMessages),
    ]).finally(() => setLoading(false));

    // Realtime: new messages
    const msgChannel = supabase
      .channel(`msgs-${id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `match_id=eq.${id}`,
      }, async payload => {
        const { data } = await supabase
          .from('messages')
          .select('*, sender:profiles!sender_id(*)')
          .eq('id', (payload.new as Message).id)
          .single();
        if (data) setMessages(prev => [...prev, data]);
      })
      .subscribe();

    // Realtime: match updates
    const matchChannel = supabase
      .channel(`match-${id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'matches',
        filter: `id=eq.${id}`,
      }, () => loadMatch())
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(matchChannel);
    };
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !id) return;
    const text = input.trim();
    setInput('');
    await sendMessage(id, uid, text);
  };

  const handleResult = async (result: 'win' | 'loss') => {
    if (!match) return;
    setSubmitting(true);
    try {
      await submitResult(match, uid, result);
      await loadMatch();
      refreshProfile();
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async () => {
    if (!match || !profile || profile.credits < match.wager) {
      alert('Crédits insuffisants'); return;
    }
    await acceptMatch(match);
    await loadMatch();
    refreshProfile();
  };

  if (loading) {
    return (
      <Layout profile={profile}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: theme.colors.textSecondary }}>
          Chargement...
        </div>
      </Layout>
    );
  }

  if (!match) {
    return (
      <Layout profile={profile}>
        <div style={{ textAlign: 'center', padding: 60 }}>
          <p style={{ color: theme.colors.textSecondary }}>Duel introuvable</p>
          <button onClick={() => navigate('/dashboard')} style={{ marginTop: 16, color: theme.colors.primary, background: 'none', border: 'none', cursor: 'pointer' }}>
            Retour
          </button>
        </div>
      </Layout>
    );
  }

  const isChallenger = match.challenger_id === uid;
  const me = isChallenger ? match.challenger : match.opponent;
  const opponent = isChallenger ? match.opponent : match.challenger;
  const myResult = isChallenger ? match.challenger_result : match.opponent_result;
  const game = GAMES.find(g => g.slug === match.game);
  const isParticipant = match.challenger_id === uid || match.opponent_id === uid;

  return (
    <Layout profile={profile}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px' }}>

        {/* Match header */}
        <div style={{
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: 20, padding: 24, marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ color: theme.colors.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                {game?.emoji} {game?.name || match.game}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ color: theme.colors.text, fontWeight: 800, fontSize: 18 }}>
                  #{me?.hashtag}
                </span>
                <span style={{ color: theme.colors.textMuted, fontSize: 20 }}>⚔️</span>
                <span style={{ color: opponent ? theme.colors.primaryLight : theme.colors.textMuted, fontWeight: 800, fontSize: 18 }}>
                  #{opponent?.hashtag || '???'}
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: theme.colors.accent, fontWeight: 900, fontSize: 24 }}>{match.wager} cr</p>
              <p style={{ color: theme.colors.textMuted, fontSize: 12 }}>= {(match.wager / 100).toFixed(2)} €</p>
            </div>
          </div>

          {/* Status badge */}
          <div style={{ marginTop: 16 }}>
            {match.status === 'pending' && match.opponent_id === uid && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={() => declineMatch(match.id).then(() => navigate('/dashboard'))}
                  style={{
                    border: `1px solid ${theme.colors.border}`, background: 'none',
                    borderRadius: theme.radius.md, color: theme.colors.textSecondary,
                    cursor: 'pointer', padding: '10px 20px', fontWeight: 600,
                  }}
                >Refuser</button>
                <button
                  onClick={handleAccept}
                  style={{
                    backgroundColor: theme.colors.success, border: 'none',
                    borderRadius: theme.radius.md, color: '#fff',
                    cursor: 'pointer', padding: '10px 24px', fontWeight: 700, fontSize: 15,
                  }}
                >Accepter le duel ✓</button>
              </div>
            )}
            {match.status === 'pending' && match.challenger_id === uid && (
              <p style={{ color: theme.colors.accent, fontSize: 14, fontWeight: 600 }}>
                ⏳ En attente que <strong>#{opponent?.hashtag}</strong> accepte le duel...
              </p>
            )}
            {match.status === 'active' && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                backgroundColor: `${theme.colors.success}20`,
                border: `1px solid ${theme.colors.success}40`,
                borderRadius: theme.radius.full, padding: '6px 16px',
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: theme.colors.success, display: 'inline-block' }} />
                <span style={{ color: theme.colors.success, fontWeight: 700, fontSize: 13 }}>Duel en cours — jouez maintenant !</span>
              </div>
            )}
            {match.status === 'finished' && (
              <p style={{ color: theme.colors.accent, fontWeight: 600, fontSize: 14 }}>
                ⏳ En attente du résultat de l'adversaire...
              </p>
            )}
            {match.status === 'completed' && (
              <div style={{ padding: '12px 20px', backgroundColor: match.winner_id === uid ? `${theme.colors.success}20` : '#EF444415', borderRadius: 12 }}>
                <p style={{ color: match.winner_id === uid ? theme.colors.success : theme.colors.error, fontWeight: 800, fontSize: 18 }}>
                  {match.winner_id === uid ? '🏆 Victoire ! +' + match.wager + ' crédits' : '💀 Défaite — -' + match.wager + ' crédits'}
                </p>
              </div>
            )}
            {match.status === 'disputed' && (
              <div style={{ padding: '12px 20px', backgroundColor: `${theme.colors.error}15`, borderRadius: 12 }}>
                <p style={{ color: theme.colors.error, fontWeight: 700 }}>⚠️ Litige — les deux joueurs ont soumis des résultats contradictoires. Un admin va trancher.</p>
              </div>
            )}
          </div>
        </div>

        {/* Submit result buttons */}
        {['active', 'finished'].includes(match.status) && isParticipant && !myResult && (
          <div style={{
            backgroundColor: theme.colors.surface,
            border: `1.5px solid ${theme.colors.primary}40`,
            borderRadius: 20, padding: 24, marginBottom: 20,
            textAlign: 'center',
          }}>
            <p style={{ color: theme.colors.text, fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
              Le duel est terminé ?
            </p>
            <p style={{ color: theme.colors.textSecondary, fontSize: 13, marginBottom: 20 }}>
              Soumets ton résultat honnêtement. L'adversaire doit confirmer.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <button
                onClick={() => handleResult('win')}
                disabled={submitting}
                style={{
                  backgroundColor: theme.colors.success, border: 'none',
                  borderRadius: theme.radius.md, color: '#fff',
                  cursor: 'pointer', padding: '16px 40px',
                  fontSize: 17, fontWeight: 800,
                  boxShadow: `0 0 30px ${theme.colors.success}50`,
                }}
              >
                🏆 Victoire
              </button>
              <button
                onClick={() => handleResult('loss')}
                disabled={submitting}
                style={{
                  backgroundColor: theme.colors.error, border: 'none',
                  borderRadius: theme.radius.md, color: '#fff',
                  cursor: 'pointer', padding: '16px 40px',
                  fontSize: 17, fontWeight: 800,
                }}
              >
                💀 Défaite
              </button>
            </div>
          </div>
        )}

        {myResult && match.status !== 'completed' && match.status !== 'disputed' && (
          <div style={{
            backgroundColor: `${theme.colors.accent}15`,
            border: `1px solid ${theme.colors.accent}30`,
            borderRadius: 12, padding: 16, marginBottom: 20, textAlign: 'center',
          }}>
            <p style={{ color: theme.colors.accent, fontWeight: 600 }}>
              Tu as déclaré : <strong>{myResult === 'win' ? '🏆 Victoire' : '💀 Défaite'}</strong> — en attente de l'adversaire...
            </p>
          </div>
        )}

        {/* Chat */}
        {['active', 'finished', 'completed', 'disputed'].includes(match.status) && (
          <div style={{
            backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: 20, overflow: 'hidden',
          }}>
            <div style={{
              padding: '14px 20px',
              borderBottom: `1px solid ${theme.colors.border}`,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 16 }}>💬</span>
              <span style={{ color: theme.colors.text, fontWeight: 700 }}>Chat du duel</span>
            </div>

            {/* Messages */}
            <div style={{ height: 320, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.length === 0 && (
                <p style={{ color: theme.colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 40 }}>
                  Aucun message — dites bonjour !
                </p>
              )}
              {messages.map(msg => {
                const isMe = msg.sender_id === uid;
                return (
                  <div key={msg.id} style={{
                    display: 'flex',
                    justifyContent: isMe ? 'flex-end' : 'flex-start',
                  }}>
                    <div style={{
                      maxWidth: '75%',
                      backgroundColor: isMe ? theme.colors.primary : theme.colors.surfaceHigh,
                      borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      padding: '10px 14px',
                    }}>
                      {!isMe && (
                        <p style={{ color: theme.colors.primaryLight, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
                          #{msg.sender?.hashtag}
                        </p>
                      )}
                      <p style={{ color: '#fff', fontSize: 14, lineHeight: 1.5 }}>{msg.content}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            {isParticipant && (
              <form onSubmit={handleSend} style={{
                borderTop: `1px solid ${theme.colors.border}`,
                display: 'flex', gap: 12, padding: 16,
              }}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Écrire un message..."
                  style={{
                    flex: 1, backgroundColor: theme.colors.surfaceHigh,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.radius.md, color: theme.colors.text,
                    fontSize: 14, padding: '10px 14px', outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  style={{
                    backgroundColor: theme.colors.primary, border: 'none',
                    borderRadius: theme.radius.md, color: '#fff',
                    cursor: input.trim() ? 'pointer' : 'not-allowed',
                    padding: '10px 20px', fontWeight: 700, fontSize: 14,
                    opacity: input.trim() ? 1 : 0.5,
                  }}
                >
                  Envoyer
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
