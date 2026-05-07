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
  const [match, setMatch]           = useState<Match | null>(null);
  const [messages, setMessages]     = useState<Message[]>([]);
  const [input, setInput]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading]       = useState(true);
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
      <Layout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: theme.colors.textSecondary }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
            <p style={{ fontSize: 14 }}>Chargement du duel...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!match) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: 60 }}>
          <p style={{ color: theme.colors.textSecondary, marginBottom: 16 }}>Duel introuvable</p>
          <button onClick={() => navigate('/dashboard')} style={{
            background: 'none', border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.md, color: theme.colors.textMuted,
            cursor: 'pointer', padding: '8px 20px', fontSize: 14,
          }}>← Retour</button>
        </div>
      </Layout>
    );
  }

  const isChallenger = match.challenger_id === uid;
  const me           = isChallenger ? match.challenger : match.opponent;
  const opponent     = isChallenger ? match.opponent   : match.challenger;
  const myResult     = isChallenger ? match.challenger_result : match.opponent_result;
  const game         = GAMES.find(g => g.slug === match.game);
  const isParticipant = match.challenger_id === uid || match.opponent_id === uid;

  const statusColor: Record<string, string> = {
    pending:   theme.colors.accent,
    active:    theme.colors.success,
    finished:  theme.colors.secondary,
    completed: theme.colors.success,
    disputed:  theme.colors.error,
  };

  return (
    <Layout maxWidth={800}>
      {/* Back */}
      <button onClick={() => navigate('/dashboard')} style={{
        background: 'none', border: 'none', color: theme.colors.textMuted,
        cursor: 'pointer', fontSize: 13, marginBottom: 20, padding: 0,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        ← Dashboard
      </button>

      {/* ── Match header card ── */}
      <div style={{
        background: `linear-gradient(135deg, ${theme.colors.surface}, ${theme.colors.surfaceHigh})`,
        border: `1px solid ${statusColor[match.status]}30`,
        borderRadius: theme.radius.xxl, padding: '28px 28px 24px',
        marginBottom: 16, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -30, right: -30, width: 120, height: 120,
          borderRadius: '50%',
          background: `radial-gradient(${statusColor[match.status]}20, transparent)`,
          pointerEvents: 'none',
        }} />

        {/* Game info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase',
            color: theme.colors.textMuted,
          }}>
            {game?.emoji} {game?.name || match.game}
          </span>
        </div>

        {/* VS section */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <PlayerBadge hashtag={me?.hashtag} isMe />
            <span style={{ color: theme.colors.textMuted, fontSize: 20, fontWeight: 300 }}>⚔️</span>
            <PlayerBadge hashtag={opponent?.hashtag ?? '???'} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: theme.colors.accent, fontWeight: 900, fontSize: 28, lineHeight: 1 }}>{match.wager} cr</p>
            <p style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 4 }}>= {(match.wager / 100).toFixed(2)} €</p>
          </div>
        </div>

        {/* Status */}
        <div style={{ marginTop: 20 }}>
          {match.status === 'pending' && match.opponent_id === uid && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => declineMatch(match.id).then(() => navigate('/dashboard'))}
                style={{
                  border: `1px solid ${theme.colors.border}`, background: 'none',
                  borderRadius: theme.radius.md, color: theme.colors.textSecondary,
                  cursor: 'pointer', padding: '10px 22px', fontWeight: 500, fontSize: 14,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = theme.colors.error; e.currentTarget.style.color = theme.colors.error; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = theme.colors.border; e.currentTarget.style.color = theme.colors.textSecondary; }}
              >Refuser</button>
              <button
                onClick={handleAccept}
                style={{
                  background: theme.gradients.primary, border: 'none',
                  borderRadius: theme.radius.md, color: '#fff',
                  cursor: 'pointer', padding: '10px 28px', fontWeight: 700, fontSize: 14,
                  boxShadow: theme.shadows.primary,
                }}
              >✓ Accepter le duel</button>
            </div>
          )}
          {match.status === 'pending' && match.challenger_id === uid && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              backgroundColor: `${theme.colors.accent}15`,
              border: `1px solid ${theme.colors.accent}30`,
              borderRadius: theme.radius.full, padding: '8px 16px',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: theme.colors.accent, display: 'inline-block' }} />
              <span style={{ color: theme.colors.accent, fontSize: 13, fontWeight: 600 }}>
                En attente que <strong>#{opponent?.hashtag}</strong> accepte...
              </span>
            </div>
          )}
          {match.status === 'active' && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              backgroundColor: `${theme.colors.success}15`,
              border: `1px solid ${theme.colors.success}30`,
              borderRadius: theme.radius.full, padding: '8px 16px',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: theme.colors.success, boxShadow: `0 0 8px ${theme.colors.success}`, display: 'inline-block' }} />
              <span style={{ color: theme.colors.success, fontWeight: 700, fontSize: 13 }}>Duel en cours — jouez maintenant !</span>
            </div>
          )}
          {match.status === 'finished' && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              backgroundColor: `${theme.colors.secondary}15`,
              border: `1px solid ${theme.colors.secondary}30`,
              borderRadius: theme.radius.full, padding: '8px 16px',
            }}>
              <span style={{ color: theme.colors.secondary, fontWeight: 600, fontSize: 13 }}>
                ⏳ En attente du résultat de l'adversaire...
              </span>
            </div>
          )}
          {match.status === 'completed' && (
            <div style={{
              padding: '14px 20px',
              backgroundColor: match.winner_id === uid ? `${theme.colors.success}15` : `${theme.colors.error}12`,
              border: `1px solid ${match.winner_id === uid ? theme.colors.success : theme.colors.error}30`,
              borderRadius: theme.radius.lg,
            }}>
              <p style={{ color: match.winner_id === uid ? theme.colors.success : theme.colors.error, fontWeight: 900, fontSize: 20 }}>
                {match.winner_id === uid
                  ? `🏆 Victoire ! +${match.wager} crédits`
                  : `💀 Défaite · -${match.wager} crédits`}
              </p>
            </div>
          )}
          {match.status === 'disputed' && (
            <div style={{
              padding: '14px 20px',
              backgroundColor: `${theme.colors.error}12`,
              border: `1px solid ${theme.colors.error}30`,
              borderRadius: theme.radius.lg,
            }}>
              <p style={{ color: theme.colors.error, fontWeight: 700 }}>
                ⚖️ Litige — résultats contradictoires soumis. Un admin va trancher sous 24h.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Submit result ── */}
      {['active', 'finished'].includes(match.status) && isParticipant && !myResult && (
        <div style={{
          background: `linear-gradient(135deg, ${theme.colors.surface}, ${theme.colors.surfaceHigh})`,
          border: `1.5px solid ${theme.colors.primary}35`,
          borderRadius: theme.radius.xl, padding: '28px 24px',
          marginBottom: 16, textAlign: 'center',
        }}>
          <p style={{ color: theme.colors.text, fontWeight: 800, fontSize: 17, marginBottom: 8 }}>
            Le duel est terminé ?
          </p>
          <p style={{ color: theme.colors.textSecondary, fontSize: 13, marginBottom: 24, maxWidth: 380, margin: '0 auto 24px' }}>
            Soumets ton résultat honnêtement. Joins une capture d'écran dans le chat si possible.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <button
              onClick={() => handleResult('win')}
              disabled={submitting}
              style={{
                background: `linear-gradient(135deg, ${theme.colors.success}, #059669)`,
                border: 'none', borderRadius: theme.radius.lg, color: '#fff',
                cursor: 'pointer', padding: '16px 44px',
                fontSize: 17, fontWeight: 900,
                boxShadow: `0 0 32px ${theme.colors.success}50`,
                transition: 'transform 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              🏆 Victoire
            </button>
            <button
              onClick={() => handleResult('loss')}
              disabled={submitting}
              style={{
                background: `linear-gradient(135deg, ${theme.colors.error}, #DC2626)`,
                border: 'none', borderRadius: theme.radius.lg, color: '#fff',
                cursor: 'pointer', padding: '16px 44px',
                fontSize: 17, fontWeight: 900,
                transition: 'transform 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              💀 Défaite
            </button>
          </div>
        </div>
      )}

      {myResult && !['completed', 'disputed'].includes(match.status) && (
        <div style={{
          backgroundColor: `${theme.colors.accent}12`,
          border: `1px solid ${theme.colors.accent}25`,
          borderRadius: theme.radius.lg, padding: '14px 20px', marginBottom: 16, textAlign: 'center',
        }}>
          <p style={{ color: theme.colors.accent, fontWeight: 600, fontSize: 14 }}>
            Tu as déclaré : <strong>{myResult === 'win' ? '🏆 Victoire' : '💀 Défaite'}</strong> — en attente de la confirmation de l'adversaire...
          </p>
        </div>
      )}

      {/* ── Chat ── */}
      {['active', 'finished', 'completed', 'disputed'].includes(match.status) && (
        <div style={{
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.xl, overflow: 'hidden',
        }}>
          <div style={{
            padding: '14px 20px',
            borderBottom: `1px solid ${theme.colors.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>💬</span>
              <span style={{ color: theme.colors.text, fontWeight: 700, fontSize: 14 }}>Chat du duel</span>
            </div>
            <span style={{ color: theme.colors.textMuted, fontSize: 12 }}>
              {messages.length} message{messages.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Messages */}
          <div style={{ height: 340, overflowY: 'auto', padding: '20px 20px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.length === 0 && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: theme.colors.textMuted, fontSize: 13, textAlign: 'center' }}>
                  Aucun message pour l'instant.<br />
                  <span style={{ opacity: 0.6 }}>Salue ton adversaire !</span>
                </p>
              </div>
            )}
            {messages.map(msg => {
              const isMe = msg.sender_id === uid;
              return (
                <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '72%',
                    background: isMe
                      ? theme.gradients.primary
                      : theme.colors.surfaceHigh,
                    borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    padding: '10px 14px',
                    boxShadow: isMe ? `0 4px 16px ${theme.colors.primary}30` : 'none',
                  }}>
                    {!isMe && (
                      <p style={{ color: theme.colors.primaryLight, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
                        #{msg.sender?.hashtag}
                      </p>
                    )}
                    <p style={{ color: '#fff', fontSize: 14, lineHeight: 1.5 }}>{msg.content}</p>
                    <p style={{ color: isMe ? 'rgba(255,255,255,0.5)' : theme.colors.textMuted, fontSize: 10, marginTop: 4, textAlign: 'right' }}>
                      {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
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
              display: 'flex', gap: 10, padding: '14px 16px',
              backgroundColor: theme.colors.surfaceHigh,
            }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Écrire un message..."
                style={{
                  flex: 1, backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.full, color: theme.colors.text,
                  fontSize: 14, padding: '10px 18px', outline: 'none',
                }}
                onFocus={e => e.currentTarget.style.borderColor = theme.colors.primary + '60'}
                onBlur={e => e.currentTarget.style.borderColor = theme.colors.border}
              />
              <button
                type="submit"
                disabled={!input.trim()}
                style={{
                  background: input.trim() ? theme.gradients.primary : theme.colors.border,
                  border: 'none', borderRadius: theme.radius.full, color: '#fff',
                  cursor: input.trim() ? 'pointer' : 'not-allowed',
                  padding: '10px 20px', fontWeight: 700, fontSize: 13,
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                Envoyer ↑
              </button>
            </form>
          )}
        </div>
      )}
    </Layout>
  );
}

function PlayerBadge({ hashtag, isMe }: { hashtag?: string; isMe?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: isMe ? theme.gradients.primary : theme.colors.surfaceHigh,
        border: `2px solid ${isMe ? theme.colors.primaryLight : theme.colors.borderLight}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 900, fontSize: 16, flexShrink: 0,
      }}>
        {hashtag?.[0] ?? '?'}
      </div>
      <div>
        <p style={{ color: isMe ? theme.colors.text : theme.colors.textSecondary, fontWeight: isMe ? 800 : 600, fontSize: 17 }}>
          #{hashtag ?? '???'}
        </p>
        {isMe && <p style={{ color: theme.colors.textMuted, fontSize: 11 }}>Toi</p>}
      </div>
    </div>
  );
}
