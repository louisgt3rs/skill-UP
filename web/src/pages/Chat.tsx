import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  Profile, Conversation, ChatMessage, Match, MatchProof, GAMES,
} from '../types';
import { useIsMobile } from '../hooks/useIsMobile';
import {
  getMyConversations, getChatMessages,
  getOrCreateConversation, sendChatMessage, sendDuelProposal, uploadChatImage,
  updateDuelProposalStatus, createMatch, acceptMatch, getMatch,
  findByHashtag, submitResult,
  getActiveMatchForConversation, uploadMatchProof, getMatchProofs,
} from '../lib/db';
import { theme } from '../theme';

interface Props {
  session: Session;
  profile: Profile | null;
  refreshProfile: () => void;
}

// ── Helpers ───────────────────────────────────────────────

function hashColor(str: string) {
  let h = 0;
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return `hsl(${(h * 137) % 360}, 65%, 55%)`;
}

function Avatar({ name, size = 38 }: { name: string; size?: number }) {
  const color = hashColor(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, ${color}, ${theme.colors.primaryDark})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 800, fontSize: size * 0.38,
      border: `2px solid ${color}40`,
    }}>
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return 'À l\'instant';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} h`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// ── Duel Proposal Modal ───────────────────────────────────

interface DuelModalProps {
  profile: Profile;
  onSend: (game: string, wager: number) => void;
  onClose: () => void;
}

const WAGER_PRESETS = [50, 100, 250, 500];

function DuelModal({ profile, onSend, onClose }: DuelModalProps) {
  const [game, setGame] = useState(GAMES.find(g => g.available)?.name ?? GAMES[0].name);
  const [wager, setWager] = useState(100);
  const [custom, setCustom] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const finalWager = useCustom ? (parseInt(custom) || 0) : wager;
  const canSend = finalWager > 0 && finalWager <= profile.credits && game;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(8px)',
    }} onClick={onClose}>
      <div style={{
        backgroundColor: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: 24, padding: 32, width: '100%', maxWidth: 440,
        boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,58,237,0.15)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ color: theme.colors.text, fontSize: 20, fontWeight: 900 }}>⚔️ Proposer un duel</h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: theme.colors.textMuted,
            cursor: 'pointer', fontSize: 20, lineHeight: 1,
          }}>✕</button>
        </div>

        <div style={{ marginBottom: 24 }}>
          <p style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
            Jeu
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {GAMES.filter(g => g.available).map(g => (
              <button key={g.slug} onClick={() => setGame(g.name)} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderRadius: 12,
                background: game === g.name ? `${theme.colors.primary}20` : theme.colors.surfaceHigh,
                border: `1.5px solid ${game === g.name ? theme.colors.primary : theme.colors.border}`,
                cursor: 'pointer', color: theme.colors.text, textAlign: 'left',
                transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: 22 }}>{g.emoji}</span>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14 }}>{g.name}</p>
                  <p style={{ color: theme.colors.textMuted, fontSize: 12 }}>{g.platform}</p>
                </div>
                {game === g.name && (
                  <span style={{ marginLeft: 'auto', color: theme.colors.primary, fontWeight: 800 }}>✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <p style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
            Mise
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {WAGER_PRESETS.map(p => (
              <button key={p} onClick={() => { setWager(p); setUseCustom(false); }} style={{
                flex: 1, minWidth: 72, padding: '10px 4px',
                borderRadius: 10, fontWeight: 800, fontSize: 14,
                background: !useCustom && wager === p ? theme.gradients.primary : theme.colors.surfaceHigh,
                border: `1.5px solid ${!useCustom && wager === p ? theme.colors.primary : theme.colors.border}`,
                color: !useCustom && wager === p ? '#fff' : theme.colors.text,
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {p} cr
              </button>
            ))}
          </div>
          <input
            value={custom}
            onChange={e => { setCustom(e.target.value); setUseCustom(true); }}
            onFocus={() => setUseCustom(true)}
            placeholder="Montant personnalisé…"
            type="number"
            min={1}
            style={{
              width: '100%', boxSizing: 'border-box',
              backgroundColor: useCustom ? `${theme.colors.primary}12` : theme.colors.surfaceHigh,
              border: `1.5px solid ${useCustom ? theme.colors.primary : theme.colors.border}`,
              borderRadius: 10, padding: '10px 14px',
              color: theme.colors.text, fontSize: 14, outline: 'none',
              transition: 'all 0.15s',
            }}
          />
          <p style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 6 }}>
            Ton solde : <span style={{ color: theme.colors.accent, fontWeight: 700 }}>{profile.credits} cr</span>
            {finalWager > profile.credits && (
              <span style={{ color: theme.colors.error }}> — Solde insuffisant</span>
            )}
          </p>
        </div>

        {canSend && (
          <div style={{
            backgroundColor: `${theme.colors.primary}10`,
            border: `1px solid ${theme.colors.primary}30`,
            borderRadius: 12, padding: '12px 16px', marginBottom: 20,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
              {game} — {finalWager} cr
            </span>
            <span style={{ color: theme.colors.accent, fontWeight: 800, fontSize: 14 }}>
              Gain potentiel : {finalWager * 2} cr
            </span>
          </div>
        )}

        <button
          onClick={() => canSend && onSend(game, finalWager)}
          disabled={!canSend}
          style={{
            width: '100%', padding: '14px',
            background: canSend ? theme.gradients.primary : theme.colors.surfaceHigh,
            border: 'none', borderRadius: 14,
            color: canSend ? '#fff' : theme.colors.textMuted,
            fontSize: 16, fontWeight: 800, cursor: canSend ? 'pointer' : 'not-allowed',
            boxShadow: canSend ? '0 0 24px rgba(124,58,237,0.5)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          ⚔️ Envoyer la proposition
        </button>
      </div>
    </div>
  );
}

// ── Duel Proposal Message ─────────────────────────────────

interface DuelMsgProps {
  msg: ChatMessage;
  isMine: boolean;
  myProfile: Profile;
  conversationId: string;
  otherId: string;
  onAccepted: (match: Match) => void;
}

function DuelProposalMsg({ msg, isMine, myProfile, conversationId, otherId, onAccepted }: DuelMsgProps) {
  const [acting, setActing] = useState(false);
  const meta = msg.metadata ?? {};
  const status = meta.status ?? 'pending';
  const game = meta.game ?? '';
  const wager = meta.wager ?? 0;
  const gameInfo = GAMES.find(g => g.name === game);

  const handleAccept = async () => {
    setActing(true);
    try {
      const challenger = msg.sender_id;
      const opponent = challenger === myProfile.id ? otherId : myProfile.id;
      const match = await createMatch(challenger, opponent, game, wager, conversationId);
      await acceptMatch(match);
      await updateDuelProposalStatus(msg.id, 'accepted', match.id);
      const fullMatch = await getMatch(match.id);
      onAccepted(fullMatch ?? match);
    } finally {
      setActing(false);
    }
  };

  const handleDecline = async () => {
    setActing(true);
    try {
      await updateDuelProposalStatus(msg.id, 'declined');
    } finally {
      setActing(false);
    }
  };

  const statusColor =
    status === 'accepted' ? theme.colors.success :
    status === 'declined' ? theme.colors.error :
    theme.colors.accent;

  const statusLabel =
    status === 'accepted' ? '✅ Accepté' :
    status === 'declined' ? '❌ Refusé' :
    '⏳ En attente';

  return (
    <div style={{
      backgroundColor: isMine ? `${theme.colors.primary}15` : theme.colors.surfaceHigh,
      border: `1.5px solid ${isMine ? `${theme.colors.primary}40` : theme.colors.border}`,
      borderRadius: 16, padding: '14px 16px',
      maxWidth: 280, width: '100%',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 24 }}>{gameInfo?.emoji ?? '⚔️'}</span>
        <div>
          <p style={{ color: theme.colors.text, fontWeight: 800, fontSize: 14 }}>Défi de duel</p>
          <p style={{ color: theme.colors.textMuted, fontSize: 12 }}>{game}</p>
        </div>
        <span style={{
          marginLeft: 'auto',
          fontSize: 11, fontWeight: 700,
          color: statusColor, backgroundColor: `${statusColor}15`,
          padding: '3px 8px', borderRadius: 999,
          border: `1px solid ${statusColor}30`,
        }}>{statusLabel}</span>
      </div>

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        backgroundColor: theme.colors.surface, borderRadius: 10,
        padding: '8px 12px', marginBottom: status === 'pending' && !isMine ? 12 : 0,
      }}>
        <span style={{ color: theme.colors.textMuted, fontSize: 13 }}>Mise</span>
        <span style={{ color: theme.colors.accent, fontWeight: 900, fontSize: 14 }}>{wager} cr</span>
      </div>

      {status === 'pending' && !isMine && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={handleDecline} disabled={acting} style={{
            flex: 1, padding: '8px', borderRadius: 9, fontSize: 13, fontWeight: 700,
            background: 'none', border: `1.5px solid ${theme.colors.error}50`,
            color: theme.colors.error, cursor: acting ? 'wait' : 'pointer', transition: 'all 0.15s',
          }}>Refuser</button>
          <button onClick={handleAccept} disabled={acting} style={{
            flex: 2, padding: '8px', borderRadius: 9, fontSize: 13, fontWeight: 800,
            background: theme.gradients.primary, border: 'none',
            color: '#fff', cursor: acting ? 'wait' : 'pointer',
            boxShadow: '0 0 16px rgba(124,58,237,0.4)', transition: 'all 0.15s',
          }}>⚡ Accepter</button>
        </div>
      )}
    </div>
  );
}

// ── Duel Mode Banner ──────────────────────────────────────

interface DuelBannerProps {
  match: Match;
  userId: string;
  proofs: MatchProof[];
  onDeclare: (result: 'win' | 'loss') => void;
  onUploadProof: (file: File) => void;
  declaring: boolean;
  uploading: boolean;
  onDismiss: () => void;
}

function DuelModeBanner({
  match, userId, proofs, onDeclare, onUploadProof, declaring, uploading, onDismiss,
}: DuelBannerProps) {
  const proofRef = useRef<HTMLInputElement>(null);
  const isChallenger = userId === match.challenger_id;
  const myResult = isChallenger ? match.challenger_result : match.opponent_result;
  const theirResult = isChallenger ? match.opponent_result : match.challenger_result;
  const otherPlayer = isChallenger ? match.opponent : match.challenger;
  const gameInfo = GAMES.find(g => g.name === match.game);

  const iDeclared = myResult !== null;
  const theyDeclared = theirResult !== null;

  const resultLabel = (r: string | null) =>
    r === 'win' ? '🏆 Victoire' : r === 'loss' ? '💀 Défaite' : '?';

  if (match.status === 'completed') {
    const iWon = match.winner_id === userId;
    const isDraw = match.winner_id === null;
    return (
      <div style={{
        margin: '0 0 0 0',
        background: isDraw
          ? `linear-gradient(90deg, ${theme.colors.primary}20, ${theme.colors.surface})`
          : iWon
            ? 'linear-gradient(90deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))'
            : 'linear-gradient(90deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))',
        borderBottom: `2px solid ${isDraw ? theme.colors.primary : iWon ? theme.colors.success : theme.colors.error}40`,
        padding: '12px 24px',
        display: 'flex', alignItems: 'center', gap: 14,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 28 }}>
          {isDraw ? '🤝' : iWon ? '🏆' : '💀'}
        </span>
        <div style={{ flex: 1 }}>
          <p style={{
            color: isDraw ? theme.colors.text : iWon ? theme.colors.success : theme.colors.error,
            fontWeight: 900, fontSize: 15,
          }}>
            {isDraw ? 'Remboursement' : iWon ? 'Victoire !' : 'Défaite'}
          </p>
          <p style={{ color: theme.colors.textMuted, fontSize: 12 }}>
            {match.game} · {match.wager} cr
            {!isDraw && (iWon ? ` · +${match.wager * 2} cr encaissés` : ` · -${match.wager} cr`)}
          </p>
        </div>
        <button onClick={onDismiss} style={{
          background: 'none', border: 'none', color: theme.colors.textMuted,
          cursor: 'pointer', fontSize: 16, padding: 4,
        }}>✕</button>
      </div>
    );
  }

  if (match.status === 'disputed') {
    return (
      <div style={{
        background: 'linear-gradient(90deg, rgba(239,68,68,0.12), rgba(239,68,68,0.04))',
        borderBottom: `2px solid ${theme.colors.error}50`,
        padding: '14px 24px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 22 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <p style={{ color: theme.colors.error, fontWeight: 900, fontSize: 14 }}>LITIGE OUVERT</p>
            <p style={{ color: theme.colors.textMuted, fontSize: 12 }}>
              Toi : {resultLabel(myResult)} · {otherPlayer?.username} : {resultLabel(theirResult)}
            </p>
          </div>
        </div>
        <p style={{ color: theme.colors.textSecondary, fontSize: 13, marginBottom: 10 }}>
          Les résultats ne correspondent pas. Envoie un screenshot pour prouver ta victoire. L'admin va arbitrer.
        </p>
        {proofs.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {proofs.map(p => (
              <a key={p.id} href={p.proof_url} target="_blank" rel="noopener noreferrer">
                <img
                  src={p.proof_url}
                  alt="preuve"
                  style={{
                    width: 64, height: 64, objectFit: 'cover',
                    borderRadius: 8, border: `2px solid ${theme.colors.border}`,
                  }}
                />
              </a>
            ))}
          </div>
        )}
        <input
          ref={proofRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={async e => {
            const file = e.target.files?.[0];
            if (file) onUploadProof(file);
            e.target.value = '';
          }}
        />
        <button
          onClick={() => proofRef.current?.click()}
          disabled={uploading}
          style={{
            padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            backgroundColor: `${theme.colors.error}20`,
            border: `1.5px solid ${theme.colors.error}50`,
            color: theme.colors.error, cursor: uploading ? 'wait' : 'pointer',
          }}
        >
          {uploading ? 'Envoi…' : '📸 Envoyer un screenshot'}
        </button>
      </div>
    );
  }

  // active or finished
  const waitingForThem = iDeclared && !theyDeclared;
  const waitingForMe = !iDeclared && theyDeclared;

  return (
    <div style={{
      background: 'linear-gradient(90deg, rgba(124,58,237,0.12), rgba(124,58,237,0.04))',
      borderBottom: `2px solid ${theme.colors.primary}40`,
      padding: '12px 24px',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>{gameInfo?.emoji ?? '⚔️'}</span>
        <div style={{ flex: 1 }}>
          <p style={{ color: theme.colors.primary, fontWeight: 900, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' }}>
            Duel en cours
          </p>
          <p style={{ color: theme.colors.textMuted, fontSize: 12 }}>
            {match.game} · Mise : <span style={{ color: theme.colors.accent, fontWeight: 700 }}>{match.wager} cr</span>
            {' · Gain : '}<span style={{ color: theme.colors.success, fontWeight: 700 }}>{match.wager * 2} cr</span>
          </p>
        </div>
      </div>

      {waitingForThem && (
        <p style={{
          color: theme.colors.textSecondary, fontSize: 13,
          backgroundColor: `${theme.colors.primary}10`,
          border: `1px solid ${theme.colors.primary}20`,
          borderRadius: 8, padding: '8px 12px',
        }}>
          ✓ Tu as déclaré {myResult === 'win' ? 'une victoire' : 'une défaite'}. En attente de {otherPlayer?.username}…
        </p>
      )}

      {!waitingForThem && (
        <div style={{ display: 'flex', gap: 8 }}>
          {waitingForMe && (
            <p style={{ color: theme.colors.accent, fontSize: 12, fontWeight: 600, alignSelf: 'center', marginRight: 4 }}>
              {otherPlayer?.username} a déclaré !
            </p>
          )}
          <button
            onClick={() => !declaring && onDeclare('win')}
            disabled={declaring}
            style={{
              flex: 1, padding: '9px 12px', borderRadius: 10, fontSize: 13, fontWeight: 800,
              background: 'linear-gradient(135deg, #10B981, #059669)',
              border: 'none', color: '#fff',
              cursor: declaring ? 'wait' : 'pointer',
              boxShadow: '0 0 16px rgba(16,185,129,0.4)',
              transition: 'all 0.15s',
            }}
          >
            🏆 J'ai gagné
          </button>
          <button
            onClick={() => !declaring && onDeclare('loss')}
            disabled={declaring}
            style={{
              flex: 1, padding: '9px 12px', borderRadius: 10, fontSize: 13, fontWeight: 800,
              backgroundColor: `${theme.colors.error}15`,
              border: `1.5px solid ${theme.colors.error}40`,
              color: theme.colors.error,
              cursor: declaring ? 'wait' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            💀 J'ai perdu
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Chat Page ────────────────────────────────────────

export default function Chat({ session, profile, refreshProfile }: Props) {
  const { conversationId: urlConvId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();

  const [conversations, setConversations]   = useState<Conversation[]>([]);
  const [activeId, setActiveId]             = useState<string | null>(urlConvId ?? null);
  const [messages, setMessages]             = useState<ChatMessage[]>([]);
  const [input, setInput]                   = useState('');
  const [showDuel, setShowDuel]             = useState(false);
  const [searchTag, setSearchTag]           = useState('');
  const [searchResult, setSearchResult]     = useState<Profile | null | 'not-found'>(null);
  const [searching, setSearching]           = useState(false);
  const [convLoading, setConvLoading]       = useState(true);
  const [msgLoading, setMsgLoading]         = useState(false);

  // Duel mode
  const [activeMatch, setActiveMatch]       = useState<Match | null>(null);
  const [matchProofs, setMatchProofs]       = useState<MatchProof[]>([]);
  const [declaring, setDeclaring]           = useState(false);
  const [uploading, setUploading]           = useState(false);
  const [dismissedId, setDismissedId]       = useState<string | null>(null);
  const [sendingImage, setSendingImage]     = useState(false);
  const [showSidebar, setShowSidebar]       = useState(true);

  const isMobile = useIsMobile();
  const bottomRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const matchChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const activeConv = conversations.find(c => c.id === activeId);

  const loadConversations = useCallback(async () => {
    if (!session) return;
    const data = await getMyConversations(session.user.id);
    setConversations(data);
    setConvLoading(false);
  }, [session]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Load messages when active conv changes
  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    setMsgLoading(true);
    getChatMessages(activeId).then(data => {
      setMessages(data);
      setMsgLoading(false);
    });
  }, [activeId]);

  // Load active match when conv changes
  useEffect(() => {
    if (!activeId) { setActiveMatch(null); setMatchProofs([]); return; }
    getActiveMatchForConversation(activeId).then(async match => {
      setActiveMatch(match);
      if (match?.status === 'disputed') {
        const p = await getMatchProofs(match.id);
        setMatchProofs(p);
      }
    });
  }, [activeId]);

  // Realtime — chat messages
  useEffect(() => {
    if (!activeId) return;
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const channel = supabase
      .channel(`chat-${activeId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'chat_messages',
        filter: `conversation_id=eq.${activeId}`,
      }, payload => {
        setMessages(prev => {
          if (prev.find(m => m.id === (payload.new as ChatMessage).id)) return prev;
          return [...prev, payload.new as ChatMessage];
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'chat_messages',
        filter: `conversation_id=eq.${activeId}`,
      }, payload => {
        setMessages(prev => prev.map(m =>
          m.id === (payload.new as ChatMessage).id ? { ...m, ...(payload.new as ChatMessage) } : m
        ));
      })
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [activeId]);

  // Realtime — active match updates
  useEffect(() => {
    if (!activeMatch?.id) return;
    if (matchChannelRef.current) supabase.removeChannel(matchChannelRef.current);

    const matchId = activeMatch.id;
    const ch = supabase
      .channel(`match-${matchId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'matches',
        filter: `id=eq.${matchId}`,
      }, async () => {
        const updated = await getMatch(matchId);
        if (updated) {
          setActiveMatch(updated);
          if (updated.status === 'disputed') {
            const p = await getMatchProofs(matchId);
            setMatchProofs(p);
          }
          if (updated.status === 'completed') {
            refreshProfile();
          }
        }
      })
      .subscribe();

    matchChannelRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [activeMatch?.id]);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Search user by hashtag
  const handleSearch = async () => {
    const tag = searchTag.replace('#', '').trim().toUpperCase();
    if (!tag) return;
    setSearching(true);
    setSearchResult(null);
    const found = await findByHashtag(tag);
    setSearchResult(found ?? 'not-found');
    setSearching(false);
  };

  const openConversation = async (otherId: string) => {
    if (!session) return;
    const id = await getOrCreateConversation(session.user.id, otherId);
    await loadConversations();
    setActiveId(id);
    setSearchTag('');
    setSearchResult(null);
    if (isMobile) setShowSidebar(false);
    navigate(`/chat/${id}`, { replace: true });
  };

  const handleSend = async () => {
    if (!input.trim() || !activeId || !session) return;
    const content = input.trim();
    setInput('');
    await sendChatMessage(activeId, session.user.id, content);
  };

  const handleDuelSend = async (game: string, wager: number) => {
    if (!activeId || !session) return;
    setShowDuel(false);
    await sendDuelProposal(activeId, session.user.id, game, wager);
  };

  const handleImageSelect = async (file: File) => {
    if (!activeId || !session) return;
    setSendingImage(true);
    try {
      await uploadChatImage(activeId, session.user.id, file);
    } catch (e: any) {
      alert(`Erreur envoi image : ${e.message}`);
    } finally {
      setSendingImage(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleDuelAccepted = async (match: Match) => {
    setActiveMatch(match);
    setMatchProofs([]);
    setDismissedId(null);
    await loadConversations();
  };

  const handleDeclare = async (result: 'win' | 'loss') => {
    if (!activeMatch || !session) return;
    setDeclaring(true);
    try {
      await submitResult(activeMatch, session.user.id, result);
      const updated = await getMatch(activeMatch.id);
      if (updated) {
        setActiveMatch(updated);
        if (updated.status === 'disputed') {
          const p = await getMatchProofs(activeMatch.id);
          setMatchProofs(p);
        }
        if (updated.status === 'completed') refreshProfile();
      }
    } finally {
      setDeclaring(false);
    }
  };

  const handleUploadProof = async (file: File) => {
    if (!activeMatch || !session) return;
    setUploading(true);
    try {
      await uploadMatchProof(activeMatch.id, session.user.id, file);
      const p = await getMatchProofs(activeMatch.id);
      setMatchProofs(p);
    } catch (e: any) {
      alert(`Erreur upload : ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  const otherId = activeConv
    ? (activeConv.user1_id === session.user.id ? activeConv.user2_id : activeConv.user1_id)
    : '';

  const showBanner = activeMatch && activeMatch.id !== dismissedId;

  const handleSelectConv = (convId: string) => {
    setActiveId(convId);
    setActiveMatch(null);
    setMatchProofs([]);
    setDismissedId(null);
    if (isMobile) setShowSidebar(false);
    navigate(`/chat/${convId}`, { replace: true });
  };

  return (
    <div style={{
      display: 'flex', height: 'calc(100vh - 64px)',
      backgroundColor: theme.colors.background,
      overflow: 'hidden',
    }}>
      {/* ── Sidebar ── */}
      <div style={{
        width: isMobile ? '100%' : 320,
        flexShrink: 0,
        borderRight: isMobile ? 'none' : `1px solid ${theme.colors.border}`,
        display: isMobile && !showSidebar ? 'none' : 'flex',
        flexDirection: 'column',
        backgroundColor: theme.colors.surface,
      }}>
        <div style={{ padding: '20px 16px 12px', borderBottom: `1px solid ${theme.colors.border}` }}>
          <h2 style={{ color: theme.colors.text, fontSize: 18, fontWeight: 900, marginBottom: 14 }}>
            💬 Messages
          </h2>

          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                color: theme.colors.primaryLight, fontWeight: 900, fontSize: 14,
                pointerEvents: 'none',
              }}>#</span>
              <input
                value={searchTag}
                onChange={e => { setSearchTag(e.target.value); setSearchResult(null); }}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="XXXXX"
                maxLength={5}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  backgroundColor: theme.colors.surfaceHigh,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: 10, padding: '9px 10px 9px 24px',
                  color: theme.colors.text, fontSize: 13, fontWeight: 700,
                  letterSpacing: 3, textTransform: 'uppercase', outline: 'none',
                }}
              />
            </div>
            <button onClick={handleSearch} style={{
              padding: '9px 14px', borderRadius: 10, fontSize: 13,
              background: theme.gradients.primary, border: 'none',
              color: '#fff', cursor: 'pointer', fontWeight: 700,
              boxShadow: '0 0 14px rgba(124,58,237,0.4)',
            }}>
              {searching ? '…' : '🔍'}
            </button>
          </div>

          {searchResult && searchResult !== 'not-found' && (
            <button onClick={() => openConversation((searchResult as Profile).id)} style={{
              marginTop: 10, width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 12,
              backgroundColor: `${theme.colors.primary}15`,
              border: `1.5px solid ${theme.colors.primary}40`,
              cursor: 'pointer', textAlign: 'left',
            }}>
              <Avatar name={(searchResult as Profile).username} size={36} />
              <div style={{ flex: 1 }}>
                <p style={{ color: theme.colors.text, fontWeight: 700, fontSize: 14 }}>
                  {(searchResult as Profile).username}
                </p>
                <p style={{ color: theme.colors.primaryLight, fontSize: 12 }}>
                  #{(searchResult as Profile).hashtag}
                </p>
              </div>
              <span style={{ color: theme.colors.primaryLight, fontSize: 18 }}>→</span>
            </button>
          )}
          {searchResult === 'not-found' && (
            <p style={{ color: theme.colors.error, fontSize: 13, marginTop: 10, textAlign: 'center' }}>
              Aucun joueur trouvé
            </p>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {convLoading ? (
            <div style={{ padding: 24, textAlign: 'center', color: theme.colors.textMuted, fontSize: 14 }}>
              Chargement…
            </div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>💬</p>
              <p style={{ color: theme.colors.textMuted, fontSize: 14 }}>
                Aucune conversation.<br />Recherche un joueur par hashtag.
              </p>
            </div>
          ) : (
            conversations.map(conv => {
              const other = conv.other_user;
              const isActive = conv.id === activeId;
              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConv(conv.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px', textAlign: 'left',
                    backgroundColor: isActive ? `${theme.colors.primary}15` : 'transparent',
                    borderLeft: `3px solid ${isActive ? theme.colors.primary : 'transparent'}`,
                    border: 'none', cursor: 'pointer',
                    borderBottom: `1px solid ${theme.colors.border}20`,
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = theme.colors.surfaceHigh; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <Avatar name={other?.username ?? '?'} size={42} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ color: theme.colors.text, fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {other?.username ?? 'Joueur'}
                      </p>
                      <p style={{ color: theme.colors.textMuted, fontSize: 11, flexShrink: 0, marginLeft: 8 }}>
                        {timeAgo(conv.last_message_at)}
                      </p>
                    </div>
                    <p style={{ color: theme.colors.primaryLight, fontSize: 12, fontWeight: 600 }}>
                      #{other?.hashtag}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Chat area ── */}
      <div style={{
        flex: 1, display: isMobile && showSidebar ? 'none' : 'flex',
        flexDirection: 'column', minWidth: 0,
      }}>
        {activeId && activeConv ? (
          <>
            {/* Chat header */}
            <div style={{
              height: 64, padding: isMobile ? '0 12px' : '0 24px',
              display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14,
              borderBottom: `1px solid ${theme.colors.border}`,
              backgroundColor: theme.colors.surface,
              flexShrink: 0,
            }}>
              {/* Back button on mobile */}
              {isMobile && (
                <button
                  onClick={() => setShowSidebar(true)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: theme.colors.primary, fontSize: 22, padding: '4px 8px 4px 0',
                    flexShrink: 0,
                  }}
                >
                  ‹
                </button>
              )}
              <Avatar name={activeConv.other_user?.username ?? '?'} size={40} />
              <div>
                <p style={{ color: theme.colors.text, fontWeight: 800, fontSize: 16 }}>
                  {activeConv.other_user?.username ?? 'Joueur'}
                </p>
                <p style={{ color: theme.colors.primaryLight, fontSize: 12, fontWeight: 600 }}>
                  #{activeConv.other_user?.hashtag}
                </p>
              </div>
              {showBanner && activeMatch && (
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    backgroundColor: activeMatch.status === 'disputed' ? theme.colors.error : theme.colors.accent,
                    animation: 'live-dot 2s ease-in-out infinite',
                  }} />
                  <span style={{
                    color: activeMatch.status === 'disputed' ? theme.colors.error : theme.colors.accent,
                    fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
                  }}>
                    {activeMatch.status === 'disputed' ? 'Litige' : 'Duel en cours'}
                  </span>
                </div>
              )}
            </div>

            {/* Duel mode banner */}
            {showBanner && activeMatch && (
              <DuelModeBanner
                match={activeMatch}
                userId={session.user.id}
                proofs={matchProofs}
                onDeclare={handleDeclare}
                onUploadProof={handleUploadProof}
                declaring={declaring}
                uploading={uploading}
                onDismiss={() => setDismissedId(activeMatch.id)}
              />
            )}

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: 'auto',
              padding: '24px 24px 16px',
              display: 'flex', flexDirection: 'column', gap: 12,
              backgroundImage: `
                radial-gradient(ellipse at 20% 20%, rgba(124,58,237,0.04) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 80%, rgba(167,139,250,0.03) 0%, transparent 50%)
              `,
            }}>
              {msgLoading ? (
                <div style={{ textAlign: 'center', color: theme.colors.textMuted, fontSize: 14, margin: 'auto' }}>
                  Chargement…
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', margin: 'auto' }}>
                  <p style={{ fontSize: 48, marginBottom: 16 }}>⚡</p>
                  <p style={{ color: theme.colors.textMuted, fontSize: 14 }}>
                    Début de la conversation.<br />Dis bonjour ou propose un duel !
                  </p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMine = msg.sender_id === session.user.id;
                  const senderName = msg.sender?.username ?? (isMine ? profile?.username : activeConv.other_user?.username) ?? '?';
                  return (
                    <div key={msg.id} style={{
                      display: 'flex',
                      flexDirection: isMine ? 'row-reverse' : 'row',
                      alignItems: 'flex-end', gap: 10,
                    }}>
                      {!isMine && <Avatar name={senderName} size={30} />}
                      <div style={{ maxWidth: '70%' }}>
                        {msg.type === 'duel_proposal' ? (
                          <DuelProposalMsg
                            msg={msg}
                            isMine={isMine}
                            myProfile={profile!}
                            conversationId={activeId}
                            otherId={otherId}
                            onAccepted={handleDuelAccepted}
                          />
                        ) : msg.type === 'image' ? (
                          <a href={msg.content} target="_blank" rel="noopener noreferrer">
                            <img
                              src={msg.content}
                              alt="photo"
                              style={{
                                maxWidth: 260, maxHeight: 320,
                                borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                display: 'block',
                                boxShadow: isMine
                                  ? '0 4px 20px rgba(124,58,237,0.4)'
                                  : '0 2px 8px rgba(0,0,0,0.3)',
                                border: `2px solid ${isMine ? theme.colors.primary + '60' : theme.colors.border}`,
                                cursor: 'zoom-in',
                              }}
                            />
                          </a>
                        ) : (
                          <div style={{
                            padding: '10px 14px',
                            background: isMine ? theme.gradients.primary : theme.colors.surfaceHigh,
                            borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            boxShadow: isMine
                              ? '0 4px 20px rgba(124,58,237,0.3)'
                              : '0 2px 8px rgba(0,0,0,0.2)',
                          }}>
                            <p style={{
                              color: '#fff', fontSize: 14, lineHeight: 1.5,
                              wordBreak: 'break-word', whiteSpace: 'pre-wrap',
                            }}>
                              {msg.content}
                            </p>
                          </div>
                        )}
                        <p style={{
                          color: theme.colors.textMuted, fontSize: 11,
                          textAlign: isMine ? 'right' : 'left',
                          marginTop: 4, paddingLeft: isMine ? 0 : 4,
                        }}>
                          {timeAgo(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div style={{
              padding: '12px 16px',
              borderTop: `1px solid ${theme.colors.border}`,
              backgroundColor: theme.colors.surface,
              display: 'flex', alignItems: 'flex-end', gap: 10,
            }}>
              {/* Hidden image input */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleImageSelect(file);
                  e.target.value = '';
                }}
              />

              {/* Duel button */}
              <button
                onClick={() => setShowDuel(true)}
                title="Proposer un duel"
                style={{
                  width: 44, height: 44, flexShrink: 0, borderRadius: '50%',
                  background: theme.gradients.primary,
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, boxShadow: '0 0 20px rgba(124,58,237,0.5)',
                  transition: 'box-shadow 0.15s, transform 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 32px rgba(124,58,237,0.7)'; e.currentTarget.style.transform = 'scale(1.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 20px rgba(124,58,237,0.5)'; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                ⚔️
              </button>

              {/* Photo button */}
              <button
                onClick={() => imageInputRef.current?.click()}
                disabled={sendingImage}
                title="Envoyer une photo"
                style={{
                  width: 44, height: 44, flexShrink: 0, borderRadius: '50%',
                  backgroundColor: sendingImage ? theme.colors.surfaceHigh : `${theme.colors.secondary}20`,
                  border: `1.5px solid ${theme.colors.secondary}40`,
                  cursor: sendingImage ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!sendingImage) e.currentTarget.style.backgroundColor = `${theme.colors.secondary}35`; }}
                onMouseLeave={e => { if (!sendingImage) e.currentTarget.style.backgroundColor = `${theme.colors.secondary}20`; }}
              >
                {sendingImage ? '⏳' : '📷'}
              </button>

              <div style={{ flex: 1, position: 'relative' }}>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="Envoie un message…"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    backgroundColor: theme.colors.surfaceHigh,
                    border: `1.5px solid ${theme.colors.border}`,
                    borderRadius: 22, padding: '11px 18px',
                    color: theme.colors.text, fontSize: 14,
                    resize: 'none', outline: 'none', lineHeight: 1.5,
                    maxHeight: 120, overflowY: 'auto',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = theme.colors.primary}
                  onBlur={e => e.currentTarget.style.borderColor = theme.colors.border}
                />
              </div>

              <button
                onClick={handleSend}
                disabled={!input.trim()}
                style={{
                  width: 44, height: 44, flexShrink: 0, borderRadius: '50%',
                  background: input.trim() ? theme.gradients.primary : theme.colors.surfaceHigh,
                  border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, boxShadow: input.trim() ? '0 0 14px rgba(124,58,237,0.4)' : 'none',
                  transition: 'all 0.15s',
                  color: input.trim() ? '#fff' : theme.colors.textMuted,
                }}
              >
                ➤
              </button>
            </div>
          </>
        ) : (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            color: theme.colors.textMuted,
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: 24, marginBottom: 20,
              background: `${theme.colors.primary}15`,
              border: `1px solid ${theme.colors.primary}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36,
            }}>💬</div>
            <p style={{ color: theme.colors.text, fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              Tes messages
            </p>
            <p style={{ fontSize: 14, textAlign: 'center', maxWidth: 280 }}>
              Sélectionne une conversation ou cherche un joueur par hashtag pour commencer.
            </p>
          </div>
        )}
      </div>

      {showDuel && profile && (
        <DuelModal
          profile={profile}
          onSend={handleDuelSend}
          onClose={() => setShowDuel(false)}
        />
      )}
    </div>
  );
}
