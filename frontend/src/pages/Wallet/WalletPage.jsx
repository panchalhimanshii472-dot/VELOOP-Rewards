import { useEffect, useState } from 'react';
import StreakHeader from '../../components/DailyStreak/StreakHeader';
import StreakLoader from '../../components/DailyStreak/StreakLoader';
import { useAuth } from '../../context/AuthContext';
import { extractApiError } from '../../services/apiClient';
import { getWallet } from '../../services/streakApi';
import { formatUtcDateTime } from '../../utils/formatters';
import styles from './WalletPage.module.css';

export default function WalletPage() {
  const { user, logout } = useAuth();
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await getWallet(1, 30);
        if (!active) return;
        setWalletData(res);
      } catch (err) {
        if (!active) return;
        const parsed = extractApiError(err, 'Failed to load wallet ledger.');
        if (parsed.status === 401) {
          logout();
          return;
        }
        setError(parsed.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [logout]);

  const wallet = walletData?.wallet;
  const transactions = walletData?.transactions || [];
  const vouchers = wallet?.giftCardVouchers || [];

  return (
    <div className={styles.pageWrap}>
      <div className={styles.container}>
        <StreakHeader
          title="VELoop Wallet"
          veBalance={wallet?.veBalance ?? 0}
          backTo="/daily-streak"
          onLogout={logout}
          userName={user?.name}
        />

        {loading ? (
          <StreakLoader message="Loading wallet ledger..." />
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <>
            <section className={styles.summaryGrid}>
              <div className={styles.summaryCard}>
                <div className={styles.summaryLabel}>Available VEs Balance</div>
                <div className={styles.summaryValue}>{wallet?.veBalance ?? 0} VEs</div>
              </div>
              <div className={styles.summaryCard}>
                <div className={styles.summaryLabel}>Amazon Gift Cards Earned</div>
                <div className={styles.summaryValue}>
                  ₹{wallet?.giftCardBalanceInr ?? 0}
                </div>
              </div>
              <div className={styles.summaryCard}>
                <div className={styles.summaryLabel}>Lifetime VEs Earned</div>
                <div className={styles.summaryValue}>
                  {wallet?.totalVEsEarned ?? 0} VEs
                </div>
              </div>
            </section>

            <section className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>Amazon Gift Card Vouchers</h2>
              <div className="d-flex flex-column gap-2">
                {vouchers.length === 0 ? (
                  <p className={styles.emptyText}>
                    Reach Day 4, Day 5, or Day 7 in your Daily Streak to unlock Amazon Gift Cards!
                  </p>
                ) : (
                  vouchers.map((v) => (
                    <div key={v.voucherCode} className={styles.rowItem}>
                      <div>
                        <div className={styles.primaryText}>
                          {v.brand} Gift Card — ₹{v.amountInr}
                        </div>
                        <div className={styles.metaText}>
                          Ref: {v.referenceId} · Issued {formatUtcDateTime(v.issuedAt)}
                        </div>
                      </div>
                      <span className={styles.voucherCode}>{v.voucherCode}</span>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>Reward Transaction Ledger</h2>
              <div className="d-flex flex-column gap-2">
                {transactions.length === 0 ? (
                  <p className={styles.emptyText}>No wallet transactions recorded yet.</p>
                ) : (
                  transactions.map((txn) => (
                    <div key={txn.transactionId} className={styles.rowItem}>
                      <div>
                        <div className={styles.primaryText}>
                          Streak Claim — Day {txn.streakDay} ({txn.source})
                        </div>
                        <div className={styles.metaText}>
                          {txn.transactionId} · Ref: {txn.referenceId} · Balance:{' '}
                          {txn.balanceBefore} → {txn.balanceAfter} {txn.currency} ·{' '}
                          {formatUtcDateTime(txn.createdAt)}
                        </div>
                      </div>
                      <span className={styles.amountCredit}>
                        +{txn.amount} {txn.currency}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

