import { useEffect, useState, FormEvent } from 'react';
import { Session } from '@supabase/supabase-js';
import { Profile, Transaction, WithdrawalRequest } from '../types';
import { getTransactions, getWithdrawalRequests, requestWithdrawal } from '../lib/db';
import Layout from '../components/Layout';
import Input from '../components/Input';
import Button from '../components/Button';
import { theme } from '../theme';

interface Props {
  session: Session;
  profile: Profile | null;
  refreshProfile: () => void;
}

const DEPOSIT_AMOUNTS = [
  { credits: 500,  eur: 5,   label: '5 €' },
  { credits: 1000, eur: 10,  label: '10 €' },
  { credits: 2500, eur: 25,  label: '25 €' },
  { credits: 5000, eur: 50,  label: '50 €' },
];

const TX_ICONS: Record<string, string> = {
  deposit:     '💳',
  withdrawal:  '🏦',
  match_win:   '🏆',
  match_loss:  '💀',
  match_wager: '🔒',
  refund:      '↩️',
};

const TX_LABELS: Record<string, string> = {
  deposit:     'Dépôt',
  withdrawal:  'Retrait',
  match_win:   'Gain duel',
  match_loss:  'Défaite duel',
  match_wager: 'Mise bloquée',
  refund:      'Remboursement',
};

type Tab = 'overview' | 'deposit' | 'withdraw' | 'history';

export default function Wallet({ session, profile, refreshProfile }: Props) {
  const [tab, setTab]         = useState<Tab>('overview');
  const [transactions, setTx] = useState<Transaction[]>([]);
  const [requests, setReqs]   = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Withdrawal form
  const [wAmount, setWAmount]   = useState('');
  const [wName, setWName]       = useState('');
  const [wIban, setWIban]       = useState('');
  const [wLoading, setWLoading] = useState(false);
  const [wSuccess, setWSuccess] = useState(false);
  const [wError, setWError]     = useState('');

  useEffect(() => {
    Promise.all([
      getTransactions(session.user.id).then(setTx),
      getWithdrawalRequests(session.user.id).then(setReqs),
    ]).finally(() => setLoading(false));
  }, [session.user.id]);

  const handleWithdraw = async (e: FormEvent) => {
    e.preventDefault();
    setWError('');
    const amount = parseInt(wAmount, 10);
    if (!amount || amount < 500) { setWError('Montant minimum : 500 crédits (5 €)'); return; }
    if (!wName.trim())           { setWError('Nom complet requis'); return; }
    if (!wIban.trim())           { setWError('IBAN requis'); return; }
    if (!profile || amount > profile.credits) { setWError('Crédits insuffisants'); return; }

    setWLoading(true);
    try {
      await requestWithdrawal(session.user.id, amount, wName.trim(), wIban.trim());
      setWSuccess(true);
      refreshProfile();
      getTransactions(session.user.id).then(setTx);
      getWithdrawalRequests(session.user.id).then(setReqs);
    } catch (e: any) {
      setWError(e.message || 'Erreur lors de la demande');
    } finally {
      setWLoading(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Solde',      icon: '💰' },
    { id: 'deposit',  label: 'Déposer',    icon: '💳' },
    { id: 'withdraw', label: 'Retirer',    icon: '🏦' },
    { id: 'history',  label: 'Historique', icon: '📋' },
  ];

  return (
    <Layout>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <h1 style={{ color: theme.colors.text, fontSize: 26, fontWeight: 900, marginBottom: 28 }}>Portefeuille</h1>

        {/* Balance banner */}
        <div style={{
          background: `linear-gradient(135deg, ${theme.colors.primary}20, ${theme.colors.surface})`,
          border: `1px solid ${theme.colors.primary}30`,
          borderRadius: 20, padding: '28px 32px', marginBottom: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <p style={{ color: theme.colors.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Solde disponible</p>
            <p style={{ color: theme.colors.accent, fontSize: 42, fontWeight: 900, letterSpacing: -2, lineHeight: 1 }}>
              {(profile?.credits ?? 0).toLocaleString('fr-FR')}
            </p>
            <p style={{ color: theme.colors.textSecondary, fontSize: 15, marginTop: 6 }}>
              crédits · ≈ <strong>{((profile?.credits ?? 0) / 100).toFixed(2)} €</strong>
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: theme.colors.textMuted, fontSize: 12, marginBottom: 4 }}>Taux de change</p>
            <p style={{ color: theme.colors.text, fontWeight: 700, fontSize: 16 }}>100 cr = 1 €</p>
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
                flex: 1, padding: '9px 8px',
                borderRadius: 10, border: 'none', cursor: 'pointer',
                backgroundColor: tab === t.id ? theme.colors.primary : 'transparent',
                color: tab === t.id ? '#fff' : theme.colors.textSecondary,
                fontWeight: tab === t.id ? 700 : 400,
                fontSize: 13, transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
              <button
                onClick={() => setTab('deposit')}
                style={{
                  backgroundColor: theme.colors.primary, border: 'none',
                  borderRadius: 16, color: '#fff', cursor: 'pointer',
                  padding: '20px', textAlign: 'left', fontWeight: 700,
                  fontSize: 16,
                  boxShadow: `0 0 30px ${theme.colors.primary}30`,
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>💳</div>
                Déposer des crédits
              </button>
              <button
                onClick={() => setTab('withdraw')}
                style={{
                  backgroundColor: theme.colors.surface,
                  border: `1.5px solid ${theme.colors.border}`,
                  borderRadius: 16, color: theme.colors.text, cursor: 'pointer',
                  padding: '20px', textAlign: 'left', fontWeight: 700,
                  fontSize: 16,
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>🏦</div>
                Demander un retrait
              </button>
            </div>

            {/* Pending withdrawals */}
            {requests.filter(r => r.status === 'pending').length > 0 && (
              <div style={{
                backgroundColor: `${theme.colors.accent}0d`,
                border: `1px solid ${theme.colors.accent}30`,
                borderRadius: 14, padding: 16, marginBottom: 20,
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

            {/* Recent transactions (last 5) */}
            <h3 style={{ color: theme.colors.text, fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Dernières transactions</h3>
            {loading ? (
              <p style={{ color: theme.colors.textMuted, fontSize: 14 }}>Chargement...</p>
            ) : transactions.length === 0 ? (
              <p style={{ color: theme.colors.textMuted, fontSize: 14 }}>Aucune transaction pour l'instant.</p>
            ) : (
              transactions.slice(0, 5).map(tx => <TxRow key={tx.id} tx={tx} />)
            )}
            {transactions.length > 5 && (
              <button onClick={() => setTab('history')} style={{ background: 'none', border: 'none', color: theme.colors.primary, cursor: 'pointer', fontSize: 13, marginTop: 8 }}>
                Voir tout l'historique →
              </button>
            )}
          </div>
        )}

        {/* ── Deposit ── */}
        {tab === 'deposit' && (
          <div>
            <div style={{
              backgroundColor: `${theme.colors.secondary}10`,
              border: `1px solid ${theme.colors.secondary}30`,
              borderRadius: 14, padding: 16, marginBottom: 24,
              display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>ℹ️</span>
              <p style={{ color: theme.colors.textSecondary, fontSize: 13, lineHeight: 1.6 }}>
                Le paiement en ligne sera bientôt disponible. En attendant, contacte notre support pour effectuer un dépôt manuel.
                <br /><strong style={{ color: theme.colors.text }}>Email : support@skillup.gg</strong>
              </p>
            </div>

            <h3 style={{ color: theme.colors.text, fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Choisir un montant</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
              {DEPOSIT_AMOUNTS.map(d => (
                <div key={d.credits} style={{
                  backgroundColor: theme.colors.surface,
                  border: `1.5px solid ${theme.colors.border}`,
                  borderRadius: 16, padding: '20px',
                  display: 'flex', flexDirection: 'column', gap: 6,
                  opacity: 0.7,
                }}>
                  <p style={{ color: theme.colors.text, fontWeight: 900, fontSize: 22 }}>{d.credits.toLocaleString()} cr</p>
                  <p style={{ color: theme.colors.textSecondary, fontSize: 14 }}>{d.label}</p>
                  <p style={{
                    backgroundColor: theme.colors.surfaceHigh,
                    borderRadius: theme.radius.full,
                    padding: '3px 10px', fontSize: 11,
                    color: theme.colors.textMuted, width: 'fit-content',
                    marginTop: 4,
                  }}>Bientôt disponible</p>
                </div>
              ))}
            </div>
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
                <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
                <h3 style={{ color: theme.colors.success, fontWeight: 800, fontSize: 22, marginBottom: 12 }}>
                  Demande envoyée !
                </h3>
                <p style={{ color: theme.colors.textSecondary, lineHeight: 1.7, marginBottom: 24 }}>
                  Ton retrait est en cours de traitement.<br />
                  Compte 24 à 48h ouvrées pour le virement bancaire.
                </p>
                <button onClick={() => { setWSuccess(false); setTab('overview'); }} style={{
                  backgroundColor: theme.colors.primary, border: 'none',
                  borderRadius: theme.radius.md, color: '#fff',
                  cursor: 'pointer', padding: '12px 28px', fontWeight: 700,
                }}>
                  Retour au portefeuille
                </button>
              </div>
            ) : (
              <form onSubmit={handleWithdraw}>
                <div style={{
                  backgroundColor: `${theme.colors.accent}0d`,
                  border: `1px solid ${theme.colors.accent}30`,
                  borderRadius: 14, padding: 16, marginBottom: 24,
                  display: 'flex', gap: 10,
                }}>
                  <span>⚠️</span>
                  <p style={{ color: theme.colors.textSecondary, fontSize: 13, lineHeight: 1.6 }}>
                    <strong style={{ color: theme.colors.accent }}>Les retraits seront vérifiés manuellement avant validation.</strong>
                    {' '}Délai habituel : 24 à 48h ouvrées. Minimum : 500 crédits (5 €).
                  </p>
                </div>

                <Input
                  label="Montant à retirer (crédits)"
                  type="number"
                  value={wAmount}
                  onChange={e => setWAmount(e.target.value)}
                  placeholder="500"
                  min={500}
                />
                {wAmount && parseInt(wAmount) >= 500 && (
                  <p style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: -10, marginBottom: 16 }}>
                    = {(parseInt(wAmount) / 100).toFixed(2)} € · Disponible : {(profile?.credits ?? 0)} cr
                  </p>
                )}

                <Input
                  label="Méthode de retrait"
                  value="Virement bancaire (SEPA)"
                  readOnly
                  style={{ color: theme.colors.textMuted, cursor: 'not-allowed' }}
                />

                <Input
                  label="Nom complet (titulaire du compte)"
                  value={wName}
                  onChange={e => setWName(e.target.value)}
                  placeholder="Jean Dupont"
                  autoComplete="name"
                />

                <Input
                  label="IBAN"
                  value={wIban}
                  onChange={e => setWIban(e.target.value.toUpperCase())}
                  placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                  style={{ letterSpacing: 1, fontFamily: 'monospace' }}
                />

                {wError && (
                  <div style={{
                    padding: '10px 14px', marginBottom: 16,
                    backgroundColor: `${theme.colors.error}15`,
                    border: `1px solid ${theme.colors.error}30`,
                    borderRadius: 10, color: theme.colors.error, fontSize: 13,
                  }}>{wError}</div>
                )}

                <Button type="submit" loading={wLoading} size="lg">
                  Demander un retrait
                </Button>
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

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: theme.colors.surface,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: 12, padding: '12px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          backgroundColor: theme.colors.surfaceHigh,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>
          {TX_ICONS[tx.type] ?? '💱'}
        </div>
        <div>
          <p style={{ color: theme.colors.text, fontWeight: 600, fontSize: 14 }}>{TX_LABELS[tx.type] ?? tx.type}</p>
          <p style={{ color: theme.colors.textMuted, fontSize: 12 }}>
            {tx.description || ''} · {new Date(tx.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
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
