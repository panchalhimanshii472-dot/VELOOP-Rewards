import { useEffect, useState } from 'react';
import StreakHeader from '../../components/DailyStreak/StreakHeader';
import StreakLoader from '../../components/DailyStreak/StreakLoader';
import { useAuth } from '../../context/AuthContext';
import { extractApiError } from '../../services/apiClient';
import { getAuditLogs, getHistory, getWallet } from '../../services/streakApi';
import { formatUtcDateTime } from '../../utils/formatters';
import styles from './HistoryPage.module.css';

export default function HistoryPage() {
  const { user, logout } = useAuth();
  const [history, setHistory] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [veBalance, setVeBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [historyRes, walletRes, auditRes] = await Promise.all([
          getHistory(1, 30),
          getWallet(1, 5),
          getAuditLogs(15),
        ]);
        if (!active) return;
        setHistory(historyRes);
        setVeBalance(walletRes?.wallet?.veBalance ?? 0);
        setAuditLogs(auditRes?.logs || []);
      } catch (err) {
        if (!active) return;
        const parsed = extractApiError(err, 'Failed to load streak history.');
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

  return (
    <div className={styles.pageWrap}>
      <div className={styles.container}>
        <StreakHeader
          title="Streak Calendar & History"
          veBalance={veBalance}
          backTo="/daily-streak"
          onLogout={logout}
          userName={user?.name}
        />

        {loading ? (
          <StreakLoader message="Loading streak history..." />
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <>
            <section className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>Streak Cycles</h2>
              <div className="d-flex flex-column gap-2">
                {(history?.cycles || []).length === 0 ? (
                  <p className={styles.emptyText}>No streak cycles recorded yet.</p>
                ) : (
                  history.cycles.map((cycle) => {
                    const badgeClass =
                      cycle.status === 'ACTIVE'
                        ? styles.statusActive
                        : cycle.status === 'COMPLETED'
                          ? styles.statusCompleted
                          : styles.statusReset;
                    return (
                      <div key={cycle.cycleId} className={styles.cycleCard}>
                        <div>
                          <div className={styles.itemPrimary}>
                            Cycle #{cycle.cycleNumber} ({cycle.cycleId})
                          </div>
                          <div className={styles.itemMeta}>
                            Streak progress: {cycle.currentStreak} / {cycle.totalDays} days · Started{' '}
                            {formatUtcDateTime(cycle.startedAt)}
                          </div>
                        </div>
                        <span className={`${styles.statusBadge} ${badgeClass}`}>
                          {cycle.status}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <section className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>Claim History</h2>
              <div className="d-flex flex-column gap-2">
                {(history?.claims || []).length === 0 ? (
                  <p className={styles.emptyText}>
                    You have not claimed any daily rewards yet. Visit Daily Streak to start!
                  </p>
                ) : (
                  history.claims.map((claim) => (
                    <div key={claim.claimId} className={styles.listItem}>
                      <div>
                        <div className={styles.itemPrimary}>
                          Day {claim.day} — {claim.rewardSnapshot?.title}
                        </div>
                        <div className={styles.itemMeta}>
                          Ref: {claim.referenceId} · Claimed {formatUtcDateTime(claim.claimedAt)}
                        </div>
                      </div>
                      <span className={styles.itemReward}>
                        {claim.rewardSnapshot?.currency === 'INR'
                          ? `₹${claim.rewardSnapshot.amount} Amazon Gift Card`
                          : `+${claim.rewardSnapshot?.amount} VEs`}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>Security &amp; Audit Events</h2>
              <div className="d-flex flex-column gap-2">
                {auditLogs.length === 0 ? (
                  <p className={styles.emptyText}>No recent audit events logged.</p>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log._id} className={styles.listItem}>
                      <div>
                        <div className={styles.itemPrimary}>{log.event}</div>
                        <div className={styles.itemMeta}>
                          {log.reason || 'Recorded server event'} ·{' '}
                          {formatUtcDateTime(log.createdAt)}
                        </div>
                      </div>
                      {log.actualDay && (
                        <span className={styles.itemMeta}>Day {log.actualDay}</span>
                      )}
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

