import { useEffect, useState, FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { Profile, Transaction, WithdrawalRequest } from '../types';
import { getTransactions, getWithdrawalRequests } from '../lib/db';
import Layout from '../components/Layout';
import Input from '../components/Input';
import Button from '../components/Button';
import { theme } from '../theme';
import { useIsMobile } from '../hooks/useIsMobile';

interface Props {
  session: Session;
  profile: Profile | null;
  refreshProfile: () => void;
}

const QUICK_AMOUNTS = [5, 10, 20, 50, 100, 200];

const TX_ICONS: Record<string, string> = {
  deposit:     '💳',
  withdrawal:  '🏦',
  match_win:   '🏆',
  match_loss:  '💀',
  match_wager: '🔒',
  refund:      '↩️',
};

const TX_LABELS: Record<string, string> = {
  deposit:     'Achat de crédits',
  withdrawal:  'Retrait',
  match_win:   'Gain duel',
  match_loss:  'Défaite duel',
  match_wager: 'Mise bloquée',
  refund:      'Remboursement',
};

type Tab = 'overview' | 'deposit' | 'withdraw' | 'history';

export default function Wallet({ session, profile, refreshProfile }: Props) {
  const [tab, setTab]           = useState<Tab>('overview');
  const [transactions, setTx]   = useState<Transaction[]>([]);
  const [requests, setReqs]     = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading]   = useState(true);
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyAmount, setBuyAmount]   = useState('');
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();

  // Withdrawal form
  const [wAmount, setWAmount]       = useState('');
  const [wLoading, setWLoading]     = useState(false);
  const [wSuccess, setWSuccess]     = useState(false);
  const [wError, setWError]         = useState('');
  const [wArrivalDate, setWArrivalDate] = useState('');
  const [connectStatus, setConnectStatus] = useState<'loading' | 'none' | 'pending' | 'ready'>('loading');
  const [connectLoading, setConnectLoading] = useState(false);

  const paymentStatus  = searchParams.get('payment');
  const connectParam   = searchParams.get('connect');

  useEffect(() => {
    Promise.all([
      getTransactions(session.user.id).then(setTx),
      getWithdrawalRequests(session.user.id).then(setReqs),
    ]).finally(() => setLoading(false));

    if (paymentStatus === 'success') {
      refreshProfile();
      setTab('overview');
    }
    if (connectParam === 'success' || connectParam === 'refresh') {
      setTab('withdraw');
      refreshProfile();
    }
  }, [session.user.id, paymentStatus, connectParam]);

  useEffect(() => {
    if (tab !== 'withdraw') return;
    setConnectStatus('loading');
    fetch(`/api/connect-status?userId=${session.user.id}`)
      .then(r => r.json())
      .then(d => setConnectStatus(d.status ?? 'none'))
      .catch(() => setConnectStatus('none'));
  }, [tab, session.user.id]);

  const handleConnect = async () => {
    setConnectLoading(true);
    try {
      const res = await fetch('/api/connect-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert('Erreur : ' + (data.error || 'inconnu'));
    } catch {
      alert('Erreur réseau.');
    } finally {
      setConnectLoading(false);
    }
  };

  const handleBuy = async () => {
    const amountEur = parseFloat(buyAmount);
    if (!amountEur || amountEur < 1 || amountEur > 1000) return;
    setBuyLoading(true);
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountEur, userId: session.user.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Erreur : ' + (data.error || 'inconnu'));
      }
    } catch {
      alert('Erreur réseau. Réessaie dans un moment.');
    } finally {
      setBuyLoading(false);
    }
  };

  const handleWithdraw = async (e: FormEvent) => {
    e.preventDefault();
    setWError('');
    const credits = parseInt(wAmount, 10);
    if (!credits || credits < 500)              { setWError('Montant minimum : 500 crédits (5 €)'); return; }
    if (!profile || credits > profile.credits)  { setWError('Crédits insuffisants'); return; }
    setWLoading(true);
    try {
      const res = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id, credits }),
      });
      const data = await res.json();
      if (!res.ok) { setWError(data.error || 'Erreur lors du retrait'); return; }
      setWArrivalDate(data.arrivalDate ?? '');
      setWSuccess(true);
      refreshProfile();
      getTransactions(session.user.id).then(setTx);
    } catch {
      setWError('Erreur réseau. Réessaie dans un moment.');
    } finally {
      setWLoading(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Solde',      icon: '💰' },
    { id: 'deposit',  label: 'Acheter',    icon: '💳' },
    { id: 'withdraw', label: 'Retirer',    icon: '🏦' },
    { id: 'history',  label: 'Historique', icon: '📋' },
  ];

  return (
    <Layout>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Payment success banner */}
        {paymentStatus === 'success' && (
          <div style={{
            background: `linear-gradient(135deg, ${theme.colors.success}20, ${theme.colors.surface})`,
            border: `1.5px solid ${theme.colors.success}40`,
            borderRadius: 16, padding: '16px 22px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <span style={{ fontSize: 28 }}>🎉</span>
            <div>
              <p style={{ color: theme.colors.success, fontWeight: 800, fontSize: 15 }}>Paiement confirmé !</p>
              <p style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
                Tes crédits ont été ajoutés à ton compte. Ils apparaîtront dans quelques secondes.
              </p>
            </div>
          </div>
        )}

        {paymentStatus === 'cancel' && (
          <div style={{
            backgroundColor: `${theme.colors.error}10`,
            border: `1px solid ${theme.colors.error}30`,
            borderRadius: 16, padding: '14px 20px', marginBottom: 20,
          }}>
            <p style={{ color: theme.colors.error, fontWeight: 600, fontSize: 14 }}>
              Paiement annulé — aucun montant débité.
            </p>
          </div>
        )}

        <h1 style={{ color: theme.colors.text, fontSize: 26, fontWeight: 900, marginBottom: 24 }}>Portefeuille</h1>

        {/* Balance banner */}
        <div style={{
          background: `linear-gradient(135deg, ${theme.colors.primary}18, ${theme.colors.surface})`,
          border: `1.5px solid ${theme.colors.primary}30`,
          borderRadius: 22, padding: '24px 28px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16,
          boxShadow: `0 0 40px ${theme.colors.primary}12`,
        }}>
          <div>
            <p style={{ color: theme.colors.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Solde disponible</p>
            <p style={{ color: theme.colors.accent, fontSize: isMobile ? 38 : 48, fontWeight: 900, letterSpacing: -2, lineHeight: 1 }}>
              {(profile?.credits ?? 0).toLocaleString('fr-FR')}
            </p>
            <p style={{ color: theme.colors.textSecondary, fontSize: 14, marginTop: 6 }}>
              crédits · ≈ <strong style={{ color: theme.colors.text }}>{((profile?.credits ?? 0) / 100).toFixed(2)} €</strong>
            </p>
          </div>
          <div style={{
            textAlign: 'right',
            backgroundColor: `${theme.colors.accent}10`,
            border: `1px solid ${theme.colors.accent}20`,
            borderRadius: 14, padding: '14px 18px',
          }}>
            <p style={{ color: theme.colors.textMuted, fontSize: 11, marginBottom: 4 }}>Taux de change</p>
            <p style={{ color: theme.colors.text, fontWeight: 900, fontSize: 18 }}>100 cr = 1 €</p>
            <p style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 4 }}>Retrait min. 500 cr</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 24,
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: 14, padding: 4,
        }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: '9px 6px',
                borderRadius: 10, border: 'none', cursor: 'pointer',
                backgroundColor: tab === t.id ? theme.colors.primary : 'transparent',
                color: tab === t.id ? '#fff' : theme.colors.textSecondary,
                fontWeight: tab === t.id ? 700 : 400,
                fontSize: isMobile ? 11 : 13, transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                boxShadow: tab === t.id ? `0 0 16px ${theme.colors.primary}40` : 'none',
              }}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {tab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              <button onClick={() => setTab('deposit')} style={{
                background: theme.gradients.primary, border: 'none',
                borderRadius: 18, color: '#fff', cursor: 'pointer',
                padding: '22px 20px', textAlign: 'left', fontWeight: 700, fontSize: 15,
                boxShadow: `0 0 30px ${theme.colors.primary}30`,
                transition: 'transform 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              >
                <div style={{ fontSize: 28, marginBottom: 10 }}>💳</div>
                Acheter des crédits
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 400, marginTop: 4 }}>
                  Paiement sécurisé par carte
                </p>
              </button>
              <button onClick={() => setTab('withdraw')} style={{
                backgroundColor: theme.colors.surface,
                border: `1.5px solid ${theme.colors.border}`,
                borderRadius: 18, color: theme.colors.text, cursor: 'pointer',
                padding: '22px 20px', textAlign: 'left', fontWeight: 700, fontSize: 15,
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = theme.colors.accent + '60'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = theme.colors.border; }}
              >
                <div style={{ fontSize: 28, marginBottom: 10 }}>🏦</div>
                Retirer mes gains
                <p style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: 400, marginTop: 4 }}>
                  Virement automatique ⚡
                </p>
              </button>
            </div>

            {/* Pending withdrawals */}
            {requests.filter(r => r.status === 'pending').length > 0 && (
              <div style={{
                backgroundColor: `${theme.colors.accent}0d`,
                border: `1px solid ${theme.colors.accent}30`,
                borderRadius: 14, padding: '14px 18px', marginBottom: 20,
              }}>
                <p style={{ color: theme.colors.accent, fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
                  ⏳ Retraits en attente de validation
                </p>
                {requests.filter(r => r.status === 'pending').map(r => (
                  <div key={r.id} style={{
                    display: 'flex', justifyContent: 'space-between',
                    color: theme.colors.textSecondary, fontSize: 13, paddingTop: 8,
                    borderTop: `1px solid ${theme.colors.border}`,
                  }}>
                    <span>{r.amount_credits.toLocaleString()} cr = {r.amount_eur.toFixed(2)} €</span>
                    <span>{new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                ))}
              </div>
            )}

            <h3 style={{ color: theme.colors.text, fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Dernières transactions</h3>
            {loading ? (
              <p style={{ color: theme.colors.textMuted, fontSize: 14 }}>Chargement...</p>
            ) : transactions.length === 0 ? (
              <p style={{ color: theme.colors.textMuted, fontSize: 14 }}>Aucune transaction pour l'instant.</p>
            ) : (
              transactions.slice(0, 5).map(tx => <TxRow key={tx.id} tx={tx} />)
            )}
            {transactions.length > 5 && (
              <button onClick={() => setTab('history')} style={{
                background: 'none', border: 'none', color: theme.colors.primary,
                cursor: 'pointer', fontSize: 13, marginTop: 8,
              }}>
                Voir tout l'historique →
              </button>
            )}
          </div>
        )}

        {/* ── Deposit ── */}
        {tab === 'deposit' && (
          <div>
            {/* Rate info */}
            <div style={{
              background: `linear-gradient(135deg, ${theme.colors.primary}18, ${theme.colors.surface})`,
              border: `1.5px solid ${theme.colors.primary}30`,
              borderRadius: 18, padding: '20px 24px', marginBottom: 24,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 32 }}>💎</span>
                <div>
                  <p style={{ color: theme.colors.text, fontWeight: 900, fontSize: 18 }}>1 € = 100 crédits</p>
                  <p style={{ color: theme.colors.textMuted, fontSize: 12 }}>Taux fixe · Pas de frais cachés</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14 }}>🔒</span>
                <span style={{ color: theme.colors.textMuted, fontSize: 12 }}>Paiement sécurisé Stripe</span>
              </div>
            </div>

            {/* Amount input */}
            <div style={{
              backgroundColor: theme.colors.surface,
              border: `1.5px solid ${theme.colors.border}`,
              borderRadius: 20, padding: '24px',
              marginBottom: 16,
            }}>
              <p style={{ color: theme.colors.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
                Montant à déposer
              </p>

              {/* Quick amounts */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {QUICK_AMOUNTS.map(a => (
                  <button
                    key={a}
                    onClick={() => setBuyAmount(String(a))}
                    style={{
                      padding: '7px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: 600,
                      backgroundColor: buyAmount === String(a) ? theme.colors.primary : theme.colors.surfaceHigh,
                      color: buyAmount === String(a) ? '#fff' : theme.colors.textSecondary,
                      boxShadow: buyAmount === String(a) ? `0 0 14px ${theme.colors.primary}40` : 'none',
                      transition: 'all 0.15s',
                    }}
                  >{a} €</button>
                ))}
              </div>

              {/* Custom input */}
              <div style={{ position: 'relative', marginBottom: 20 }}>
                <span style={{
                  position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                  color: theme.colors.textMuted, fontSize: 18, fontWeight: 700, pointerEvents: 'none',
                }}>€</span>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={buyAmount}
                  onChange={e => setBuyAmount(e.target.value)}
                  placeholder="Montant libre (1 – 1 000)"
                  style={{
                    width: '100%', padding: '14px 16px 14px 36px',
                    backgroundColor: theme.colors.surfaceHigh,
                    border: `1.5px solid ${buyAmount ? theme.colors.primary + '60' : theme.colors.border}`,
                    borderRadius: 12, color: theme.colors.text,
                    fontSize: 18, fontWeight: 700, outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Credits preview */}
              {parseFloat(buyAmount) >= 1 && parseFloat(buyAmount) <= 1000 && (
                <div style={{
                  backgroundColor: `${theme.colors.accent}10`,
                  border: `1px solid ${theme.colors.accent}25`,
                  borderRadius: 12, padding: '12px 18px', marginBottom: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ color: theme.colors.textMuted, fontSize: 14 }}>Tu recevras</span>
                  <span style={{ color: theme.colors.accent, fontSize: 22, fontWeight: 900 }}>
                    {(Math.round(parseFloat(buyAmount) * 100)).toLocaleString('fr-FR')} crédits
                  </span>
                </div>
              )}

              <button
                onClick={handleBuy}
                disabled={buyLoading || !buyAmount || parseFloat(buyAmount) < 1 || parseFloat(buyAmount) > 1000}
                style={{
                  width: '100%', padding: '14px',
                  background: buyLoading || !buyAmount || parseFloat(buyAmount) < 1 ? theme.colors.surfaceHigh : theme.gradients.primary,
                  border: 'none', borderRadius: 14,
                  color: buyLoading || !buyAmount || parseFloat(buyAmount) < 1 ? theme.colors.textMuted : '#fff',
                  fontSize: 15, fontWeight: 800,
                  cursor: buyLoading || !buyAmount || parseFloat(buyAmount) < 1 ? 'not-allowed' : 'pointer',
                  boxShadow: !buyLoading && buyAmount && parseFloat(buyAmount) >= 1 ? `0 0 24px ${theme.colors.primary}40` : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {buyLoading
                  ? '⏳ Redirection vers Stripe...'
                  : buyAmount && parseFloat(buyAmount) >= 1
                    ? `💳 Payer ${parseFloat(buyAmount).toFixed(2)} €`
                    : '💳 Choisir un montant'}
              </button>
            </div>

            <p style={{ color: theme.colors.textMuted, fontSize: 12, textAlign: 'center' }}>
              Visa · Mastercard · CB · Apple Pay · Google Pay · Les crédits sont ajoutés automatiquement après confirmation.
            </p>
          </div>
        )}

        {/* ── Withdraw ── */}
        {tab === 'withdraw' && (
          <div>
            {wSuccess ? (
              <div style={{
                textAlign: 'center', padding: '48px 24px',
                backgroundColor: `${theme.colors.success}10`,
                border: `1px solid ${theme.colors.success}30`,
                borderRadius: 20,
              }}>
                <div style={{ fontSize: 56, marginBottom: 20 }}>⚡</div>
                <h3 style={{ color: theme.colors.success, fontWeight: 800, fontSize: 22, marginBottom: 12 }}>
                  Virement déclenché !
                </h3>
                <p style={{ color: theme.colors.textSecondary, lineHeight: 1.7, marginBottom: 24 }}>
                  {(parseInt(wAmount) / 100).toFixed(2)} € en route vers ton compte bancaire.<br />
                  {wArrivalDate
                    ? <>Arrivée estimée : <strong style={{ color: theme.colors.text }}>{wArrivalDate}</strong></>
                    : 'Arrivée estimée : prochaine journée ouvrée.'}
                </p>
                <button onClick={() => { setWSuccess(false); setTab('overview'); }} style={{
                  background: theme.gradients.primary, border: 'none',
                  borderRadius: theme.radius.md, color: '#fff',
                  cursor: 'pointer', padding: '12px 28px', fontWeight: 700,
                }}>
                  Retour au portefeuille
                </button>
              </div>
            ) : connectStatus === 'loading' ? (
              <p style={{ color: theme.colors.textMuted, fontSize: 14, textAlign: 'center', padding: 32 }}>
                Chargement...
              </p>
            ) : connectStatus === 'none' ? (
              <div style={{ textAlign: 'center', padding: '40px 24px' }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>🏦</div>
                <h3 style={{ color: theme.colors.text, fontWeight: 800, fontSize: 20, marginBottom: 12 }}>
                  Connecte ton compte bancaire
                </h3>
                <p style={{ color: theme.colors.textSecondary, fontSize: 14, lineHeight: 1.7, marginBottom: 28, maxWidth: 380, margin: '0 auto 28px' }}>
                  Pour recevoir tes gains directement sur ton compte en banque,
                  connecte-le via <strong>Stripe</strong> — sécurisé, rapide, sans intermédiaire.
                </p>
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center',
                  backgroundColor: `${theme.colors.accent}0d`,
                  border: `1px solid ${theme.colors.accent}25`,
                  borderRadius: 14, padding: '16px 20px', marginBottom: 28,
                  fontSize: 13, color: theme.colors.textSecondary, lineHeight: 1.8,
                }}>
                  <p style={{ margin: 0 }}>✅ Vérification d'identité sécurisée par Stripe</p>
                  <p style={{ margin: 0 }}>⚡ Virement automatique dès que tu retires</p>
                  <p style={{ margin: 0 }}>🔒 Tes données bancaires ne passent jamais par SkillUp</p>
                </div>
                <button
                  onClick={handleConnect}
                  disabled={connectLoading}
                  style={{
                    background: theme.gradients.primary, border: 'none',
                    borderRadius: 14, color: '#fff', cursor: connectLoading ? 'not-allowed' : 'pointer',
                    padding: '14px 32px', fontWeight: 800, fontSize: 15,
                    boxShadow: `0 0 24px ${theme.colors.primary}40`,
                    opacity: connectLoading ? 0.7 : 1,
                  }}
                >
                  {connectLoading ? '⏳ Redirection...' : '🏦 Connecter mon compte bancaire'}
                </button>
              </div>
            ) : connectStatus === 'pending' ? (
              <div style={{ textAlign: 'center', padding: '40px 24px' }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>⏳</div>
                <h3 style={{ color: theme.colors.accent, fontWeight: 800, fontSize: 20, marginBottom: 12 }}>
                  Vérification en cours
                </h3>
                <p style={{ color: theme.colors.textSecondary, fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
                  Tu n'as pas encore finalisé la vérification de ton compte bancaire.<br />
                  Complète les étapes sur Stripe pour activer les retraits.
                </p>
                <button
                  onClick={handleConnect}
                  disabled={connectLoading}
                  style={{
                    background: theme.gradients.primary, border: 'none',
                    borderRadius: 14, color: '#fff', cursor: connectLoading ? 'not-allowed' : 'pointer',
                    padding: '14px 32px', fontWeight: 800, fontSize: 15,
                    opacity: connectLoading ? 0.7 : 1,
                  }}
                >
                  {connectLoading ? '⏳ Redirection...' : '🔄 Finaliser la vérification'}
                </button>
              </div>
            ) : (
              /* connectStatus === 'ready' */
              <form onSubmit={handleWithdraw}>
                <div style={{
                  backgroundColor: `${theme.colors.success}0d`,
                  border: `1px solid ${theme.colors.success}30`,
                  borderRadius: 14, padding: '12px 18px', marginBottom: 24,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span>✅</span>
                  <p style={{ color: theme.colors.textSecondary, fontSize: 13, lineHeight: 1.5 }}>
                    <strong style={{ color: theme.colors.success }}>Compte bancaire vérifié.</strong>
                    {' '}Virement automatique · Minimum 500 cr (5 €) ·{' '}
                    Solde : <strong style={{ color: theme.colors.text }}>{(profile?.credits ?? 0).toLocaleString()} cr</strong>
                  </p>
                </div>

                <div style={{
                  backgroundColor: theme.colors.surface,
                  border: `1.5px solid ${theme.colors.border}`,
                  borderRadius: 20, padding: '24px', marginBottom: 16,
                }}>
                  <p style={{ color: theme.colors.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
                    Montant à retirer
                  </p>
                  <div style={{ position: 'relative', marginBottom: 12 }}>
                    <input
                      type="number"
                      min={500}
                      max={profile?.credits ?? 0}
                      value={wAmount}
                      onChange={e => setWAmount(e.target.value)}
                      placeholder="500"
                      style={{
                        width: '100%', padding: '14px 16px',
                        backgroundColor: theme.colors.surfaceHigh,
                        border: `1.5px solid ${wAmount ? theme.colors.primary + '60' : theme.colors.border}`,
                        borderRadius: 12, color: theme.colors.text,
                        fontSize: 20, fontWeight: 700, outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  {wAmount && parseInt(wAmount) >= 100 && (
                    <div style={{
                      backgroundColor: `${theme.colors.accent}10`,
                      border: `1px solid ${theme.colors.accent}25`,
                      borderRadius: 10, padding: '10px 16px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <span style={{ color: theme.colors.textMuted, fontSize: 13 }}>Tu recevras</span>
                      <span style={{ color: theme.colors.accent, fontWeight: 900, fontSize: 20 }}>
                        {(parseInt(wAmount) / 100).toFixed(2)} €
                      </span>
                    </div>
                  )}
                </div>

                {wError && (
                  <div style={{
                    padding: '10px 14px', marginBottom: 16,
                    backgroundColor: `${theme.colors.error}15`,
                    border: `1px solid ${theme.colors.error}30`,
                    borderRadius: 10, color: theme.colors.error, fontSize: 13,
                  }}>{wError}</div>
                )}

                <Button type="submit" loading={wLoading} size="lg">
                  ⚡ Virer maintenant
                </Button>
                <p style={{ color: theme.colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 12 }}>
                  Le virement est déclenché immédiatement · Arrivée J+1 ouvré (SEPA Instant si dispo)
                </p>
              </form>
            )}
          </div>
        )}

        {/* ── History ── */}
        {tab === 'history' && (
          <div>
            <h3 style={{ color: theme.colors.text, fontWeight: 700, fontSize: 15, marginBottom: 16 }}>
              Toutes les transactions ({transactions.length})
            </h3>
            {loading ? (
              <p style={{ color: theme.colors.textMuted }}>Chargement...</p>
            ) : transactions.length === 0 ? (
              <p style={{ color: theme.colors.textMuted, fontSize: 14 }}>Aucune transaction pour l'instant.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {transactions.map(tx => <TxRow key={tx.id} tx={tx} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

function TxRow({ tx }: { tx: Transaction }) {
  const isPositive = tx.amount > 0;
  const isPending  = tx.status === 'pending';
  const label = tx.type === 'deposit' && tx.description?.startsWith('Stripe')
    ? 'Achat Stripe'
    : TX_LABELS[tx.type] ?? tx.type;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: theme.colors.surface,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: 12, padding: '12px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          backgroundColor: theme.colors.surfaceHigh,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>
          {TX_ICONS[tx.type] ?? '💱'}
        </div>
        <div>
          <p style={{ color: theme.colors.text, fontWeight: 600, fontSize: 14 }}>{label}</p>
          <p style={{ color: theme.colors.textMuted, fontSize: 12 }}>
            {new Date(tx.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{
          fontWeight: 800, fontSize: 15,
          color: isPending ? theme.colors.accent : isPositive ? theme.colors.success : theme.colors.error,
        }}>
          {isPositive ? '+' : ''}{tx.amount.toLocaleString()} cr
        </p>
        {isPending && <p style={{ color: theme.colors.accent, fontSize: 11 }}>En attente</p>}
      </div>
    </div>
  );
}
