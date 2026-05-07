import { useEffect, useRef, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { Profile, GameDef, WithdrawalRequest } from '../types';
import {
  getGames, updateGame, uploadGameImage,
  getAdminStats, getAllWithdrawalRequests, updateWithdrawalStatus,
} from '../lib/db';
import Layout from '../components/Layout';
import { theme } from '../theme';

type Tab = 'overview' | 'games' | 'withdrawals';

interface Props {
  session: Session;
  profile: Profile | null;
}

type WithdrawalFull = WithdrawalRequest & { profile?: Profile };

export default function Admin({ profile }: Props) {
  const [tab, setTab] = useState<Tab>('overview');
  const [games, setGames] = useState<GameDef[]>([]);
  const [stats, setStats] = useState<{ totalUsers: number; activeMatches: number; pendingWithdrawals: number } | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalFull[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameDef | null>(null);
  const [editForm, setEditForm] = useState<Partial<GameDef>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const [g, s, w] = await Promise.all([
      getGames(),
      getAdminStats(),
      getAllWithdrawalRequests(),
    ]);
    setGames(g);
    setStats(s);
    setWithdrawals(w);
  };

  useEffect(() => { load(); }, []);

  const selectGame = (game: GameDef) => {
    setSelectedGame(game);
    setEditForm({ ...game });
    setImageFile(null);
    setImagePreview(null);
    setSaveMsg('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!selectedGame?.id) return;
    setSaving(true);
    setSaveMsg('');
    try {
      let image_url = editForm.image_url;
      if (imageFile) {
        image_url = await uploadGameImage(selectedGame.slug, imageFile);
      }
      await updateGame(selectedGame.id, { ...editForm, image_url });
      await load();
      setSaveMsg('Sauvegardé ✓');
      setImageFile(null);
    } catch (e: any) {
      setSaveMsg(`Erreur : ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleWithdrawal = async (id: string, status: 'approved' | 'rejected') => {
    await updateWithdrawalStatus(id, status);
    await load();
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: '📊 Aperçu' },
    { id: 'games', label: '🎮 Jeux' },
    { id: 'withdrawals', label: `💸 Retraits${stats?.pendingWithdrawals ? ` (${stats.pendingWithdrawals})` : ''}` },
  ];

  return (
    <Layout maxWidth={1100}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <h1 style={{ color: theme.colors.text, fontSize: 26, fontWeight: 900 }}>⚙️ Admin Panel</h1>
        <span style={{
          backgroundColor: `${theme.colors.error}20`, color: theme.colors.error,
          border: `1px solid ${theme.colors.error}40`,
          borderRadius: theme.radius.full, padding: '3px 12px', fontSize: 12, fontWeight: 700,
        }}>ADMIN</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, borderBottom: `1px solid ${theme.colors.border}`, paddingBottom: 0 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '10px 18px', fontSize: 14, fontWeight: 600,
              color: tab === t.id ? theme.colors.primary : theme.colors.textMuted,
              borderBottom: `2px solid ${tab === t.id ? theme.colors.primary : 'transparent'}`,
              marginBottom: -1, transition: 'color 0.15s',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* ── Aperçu ── */}
      {tab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 32 }}>
            {[
              { label: 'Utilisateurs', value: stats?.totalUsers ?? '—', icon: '👥', color: theme.colors.primary },
              { label: 'Matchs actifs', value: stats?.activeMatches ?? '—', icon: '⚡', color: theme.colors.success },
              { label: 'Retraits en attente', value: stats?.pendingWithdrawals ?? '—', icon: '💸', color: theme.colors.accent },
              { label: 'Jeux disponibles', value: games.filter(g => g.available).length, icon: '🎮', color: theme.colors.secondary },
            ].map(s => (
              <div key={s.label} style={{
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: 16, padding: '22px 24px',
              }}>
                <p style={{ color: theme.colors.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                  {s.icon} {s.label}
                </p>
                <p style={{ color: s.color, fontSize: 32, fontWeight: 900 }}>{s.value}</p>
              </div>
            ))}
          </div>
          <div style={{
            backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: 16, padding: 24,
          }}>
            <h3 style={{ color: theme.colors.text, fontWeight: 700, marginBottom: 16 }}>Actions rapides</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={() => setTab('games')} style={quickBtn(theme.colors.primary)}>🎮 Gérer les jeux</button>
              <button onClick={() => setTab('withdrawals')} style={quickBtn(theme.colors.accent)}>💸 Voir les retraits</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Jeux ── */}
      {tab === 'games' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedGame ? '320px 1fr' : '1fr', gap: 20 }}>
          {/* Game list */}
          <div>
            <p style={{ color: theme.colors.textMuted, fontSize: 12, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
              Sélectionne un jeu pour l'éditer
            </p>
            {games.map(game => (
              <div
                key={game.slug}
                onClick={() => selectGame(game)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  backgroundColor: selectedGame?.slug === game.slug ? `${theme.colors.primary}15` : theme.colors.surface,
                  border: `1.5px solid ${selectedGame?.slug === game.slug ? theme.colors.primary : theme.colors.border}`,
                  borderRadius: 14, padding: '14px 16px', marginBottom: 8, cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
              >
                {game.image_url
                  ? <img src={game.image_url} alt={game.name} style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }} />
                  : <div style={{
                      width: 40, height: 40, borderRadius: 10, fontSize: 22,
                      background: game.bg || '#1a1a2e',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{game.emoji}</div>
                }
                <div style={{ flex: 1 }}>
                  <p style={{ color: theme.colors.text, fontWeight: 700, fontSize: 14 }}>{game.name}</p>
                  <p style={{ color: theme.colors.textMuted, fontSize: 12 }}>{game.platform}</p>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                  color: game.available ? theme.colors.success : theme.colors.textMuted,
                  backgroundColor: game.available ? `${theme.colors.success}15` : theme.colors.surfaceHigh,
                  borderRadius: theme.radius.full, padding: '3px 8px',
                  border: `1px solid ${game.available ? `${theme.colors.success}30` : theme.colors.border}`,
                }}>
                  {game.available ? 'Actif' : 'Bientôt'}
                </span>
              </div>
            ))}
          </div>

          {/* Edit form */}
          {selectedGame && (
            <div style={{
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 18, padding: 28,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h2 style={{ color: theme.colors.text, fontWeight: 800, fontSize: 18 }}>
                  {selectedGame.emoji} {selectedGame.name}
                </h2>
                <button
                  onClick={() => { setSelectedGame(null); setSaveMsg(''); }}
                  style={{ background: 'none', border: 'none', color: theme.colors.textMuted, cursor: 'pointer', fontSize: 20 }}
                >✕</button>
              </div>

              {/* Image preview + upload */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Image du jeu</label>
                <div style={{
                  borderRadius: 12, overflow: 'hidden', marginBottom: 10, height: 160,
                  background: imagePreview || editForm.image_url
                    ? 'none'
                    : `linear-gradient(135deg, ${editForm.bg || '#1a1a2e'}, #000)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1.5px solid ${theme.colors.border}`,
                }}>
                  {imagePreview || editForm.image_url
                    ? <img
                        src={imagePreview || editForm.image_url}
                        alt="preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    : <span style={{ fontSize: 52, filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.3))' }}>{editForm.emoji}</span>
                  }
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => fileRef.current?.click()} style={quickBtn(theme.colors.primary)}>
                    📷 Choisir une image
                  </button>
                  {(imagePreview || editForm.image_url) && (
                    <button
                      onClick={() => { setImageFile(null); setImagePreview(null); setEditForm(p => ({ ...p, image_url: '' })); }}
                      style={quickBtn(theme.colors.error)}
                    >🗑️ Supprimer</button>
                  )}
                </div>
              </div>

              {/* Row: Nom + Emoji */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Nom du jeu</label>
                  <input
                    value={editForm.name || ''}
                    onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Emoji</label>
                  <input
                    value={editForm.emoji || ''}
                    onChange={e => setEditForm(p => ({ ...p, emoji: e.target.value }))}
                    style={{ ...inputStyle, textAlign: 'center', fontSize: 22 }}
                  />
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Description courte</label>
                <input
                  value={editForm.description || ''}
                  onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                  style={inputStyle}
                  placeholder="Duels 1v1 en mode Showdown..."
                />
              </div>

              {/* Platform */}
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Plateforme</label>
                <input
                  value={editForm.platform || ''}
                  onChange={e => setEditForm(p => ({ ...p, platform: e.target.value }))}
                  style={inputStyle}
                  placeholder="Mobile / PC / Console"
                />
              </div>

              {/* Row: Color + BG */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Couleur accent</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="color"
                      value={editForm.color || '#7C3AED'}
                      onChange={e => setEditForm(p => ({ ...p, color: e.target.value }))}
                      style={{ width: 40, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer', padding: 2, backgroundColor: 'transparent' }}
                    />
                    <input
                      value={editForm.color || ''}
                      onChange={e => setEditForm(p => ({ ...p, color: e.target.value }))}
                      style={{ ...inputStyle, flex: 1 }}
                      placeholder="#7C3AED"
                    />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Couleur fond</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="color"
                      value={editForm.bg || '#0D0A1F'}
                      onChange={e => setEditForm(p => ({ ...p, bg: e.target.value }))}
                      style={{ width: 40, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer', padding: 2, backgroundColor: 'transparent' }}
                    />
                    <input
                      value={editForm.bg || ''}
                      onChange={e => setEditForm(p => ({ ...p, bg: e.target.value }))}
                      style={{ ...inputStyle, flex: 1 }}
                      placeholder="#0D0A1F"
                    />
                  </div>
                </div>
              </div>

              {/* Available toggle */}
              <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
                <label style={{ color: theme.colors.textSecondary, fontSize: 13, fontWeight: 600 }}>
                  Disponible
                </label>
                <button
                  onClick={() => setEditForm(p => ({ ...p, available: !p.available }))}
                  style={{
                    width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
                    backgroundColor: editForm.available ? theme.colors.success : theme.colors.border,
                    position: 'relative', transition: 'background-color 0.2s',
                  }}
                >
                  <span style={{
                    position: 'absolute', top: 4,
                    left: editForm.available ? 28 : 4,
                    width: 20, height: 20, borderRadius: '50%',
                    backgroundColor: '#fff', transition: 'left 0.2s',
                  }} />
                </button>
                <span style={{ color: editForm.available ? theme.colors.success : theme.colors.textMuted, fontSize: 13, fontWeight: 600 }}>
                  {editForm.available ? 'Actif — jouable' : 'Bientôt disponible'}
                </span>
              </div>

              {/* Rules */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Règles du jeu <span style={{ color: theme.colors.textMuted, fontWeight: 400 }}>(une règle par ligne)</span></label>
                <textarea
                  value={editForm.rules || ''}
                  onChange={e => setEditForm(p => ({ ...p, rules: e.target.value }))}
                  rows={8}
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                    fontFamily: 'monospace',
                    fontSize: 13,
                    lineHeight: 1.6,
                  }}
                  placeholder="Mode : 1v1&#10;• Règle 1&#10;• Règle 2"
                />
              </div>

              {/* Save */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    backgroundColor: saving ? theme.colors.border : theme.colors.primary,
                    border: 'none', borderRadius: theme.radius.md, color: '#fff',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    padding: '12px 28px', fontSize: 14, fontWeight: 700,
                  }}
                >
                  {saving ? 'Sauvegarde...' : '💾 Sauvegarder'}
                </button>
                {saveMsg && (
                  <span style={{
                    color: saveMsg.startsWith('Erreur') ? theme.colors.error : theme.colors.success,
                    fontSize: 13, fontWeight: 600,
                  }}>{saveMsg}</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Retraits ── */}
      {tab === 'withdrawals' && (
        <div>
          <p style={{ color: theme.colors.textMuted, fontSize: 13, marginBottom: 20 }}>
            {withdrawals.length} demande{withdrawals.length !== 1 ? 's' : ''} au total
          </p>
          {withdrawals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: theme.colors.textMuted }}>
              Aucune demande de retrait
            </div>
          ) : (
            withdrawals.map(w => (
              <WithdrawalRow key={w.id} w={w} onAction={handleWithdrawal} />
            ))
          )}
        </div>
      )}
    </Layout>
  );
}

function WithdrawalRow({ w, onAction }: {
  w: WithdrawalFull;
  onAction: (id: string, status: 'approved' | 'rejected') => void;
}) {
  const statusColor = {
    pending:  theme.colors.accent,
    approved: theme.colors.success,
    rejected: theme.colors.error,
  }[w.status];

  return (
    <div style={{
      backgroundColor: theme.colors.surface,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: 14, padding: '18px 22px', marginBottom: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 12,
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <p style={{ color: theme.colors.text, fontWeight: 700, fontSize: 15 }}>
            {w.full_name}
          </p>
          {w.profile && (
            <span style={{ color: theme.colors.primary, fontSize: 12 }}>#{(w.profile as Profile).hashtag}</span>
          )}
          <span style={{
            backgroundColor: `${statusColor}20`, color: statusColor,
            border: `1px solid ${statusColor}40`,
            borderRadius: theme.radius.full, padding: '2px 10px', fontSize: 11, fontWeight: 700,
          }}>
            {w.status === 'pending' ? 'En attente' : w.status === 'approved' ? 'Approuvé' : 'Refusé'}
          </span>
        </div>
        <p style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
          <strong style={{ color: theme.colors.accent }}>{w.amount_credits} cr</strong>
          {' '}≈ <strong>{Number(w.amount_eur).toFixed(2)} €</strong>
          {' '}· IBAN : <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{w.iban || '—'}</span>
        </p>
        <p style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 4 }}>
          {new Date(w.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      {w.status === 'pending' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onAction(w.id, 'rejected')}
            style={{
              background: 'none', border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.md, color: theme.colors.textSecondary,
              cursor: 'pointer', padding: '8px 16px', fontSize: 13, fontWeight: 500,
            }}
          >✕ Refuser</button>
          <button
            onClick={() => onAction(w.id, 'approved')}
            style={{
              backgroundColor: theme.colors.success, border: 'none',
              borderRadius: theme.radius.md, color: '#fff',
              cursor: 'pointer', padding: '8px 20px', fontSize: 13, fontWeight: 700,
            }}
          >✓ Approuver</button>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: theme.colors.textSecondary,
  fontSize: 12, fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: 0.8,
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  display: 'block', width: '100%', padding: '10px 14px',
  backgroundColor: theme.colors.surfaceHigh,
  border: `1.5px solid ${theme.colors.border}`,
  borderRadius: theme.radius.md,
  color: theme.colors.text,
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

function quickBtn(color: string): React.CSSProperties {
  return {
    backgroundColor: `${color}20`, border: `1px solid ${color}40`,
    borderRadius: theme.radius.md, color: color,
    cursor: 'pointer', padding: '8px 16px', fontSize: 13, fontWeight: 600,
  };
}
