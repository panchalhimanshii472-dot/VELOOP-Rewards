import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import ClaimResultModal from '../../components/DailyStreak/ClaimResultModal';
import CpaDemoModal from '../../components/DailyStreak/CpaDemoModal';
import HeroBanner from '../../components/DailyStreak/HeroBanner';
import RewardGrid from '../../components/DailyStreak/RewardGrid';
import StreakActionBar from '../../components/DailyStreak/StreakActionBar';
import StreakHeader from '../../components/DailyStreak/StreakHeader';
import StreakLoader from '../../components/DailyStreak/StreakLoader';
import StreakSkeleton from '../../components/DailyStreak/StreakSkeleton';
import StreakStats from '../../components/DailyStreak/StreakStats';
import TrustFooter from '../../components/DailyStreak/TrustFooter';
import UltimateReward from '../../components/DailyStreak/UltimateReward';
import WhyStreak from '../../components/DailyStreak/WhyStreak';
import { useAuth } from '../../context/AuthContext';
import { useServerCountdown } from '../../hooks/useServerCountdown';
import { extractApiError } from '../../services/apiClient';
import {
  claimStreak,
  getStreak,
  getStreakStatus,
  initiateClaim,
} from '../../services/streakApi';
import { createIdempotencyKey } from '../../utils/formatters';
import styles from './DailyStreak.module.css';

export default function DailyStreakPage() {
  const { user, logout } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [phase, setPhase] = useState('initial-loader'); // 'initial-loader' | 'skeleton' | 'ready' | 'error'
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [resetBannerDismissed, setResetBannerDismissed] = useState(false);

  const [isClaimBusy, setIsClaimBusy] = useState(false);
  const [cpaState, setCpaState] = useState({
    open: false,
    rewardPreview: null,
    durationMs: 2200,
  });
  const [claimResult, setClaimResult] = useState(null);

  const claimLockRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchDashboard = useCallback(async ({ showSkeleton = false } = {}) => {
    if (showSkeleton) {
      setPhase('skeleton');
    }
    setLoadError(null);

    try {
      const data = await getStreak();
      if (!mountedRef.current) return;
      setDashboard(data);
      setPhase('ready');
      if (data.streakResetInfo?.wasReset) {
        setResetBannerDismissed(false);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      const parsed = extractApiError(err, 'Unable to load your daily streak right now.');
      if (parsed.status === 401) {
        logout();
        return;
      }
      setLoadError(parsed.message);
      setPhase('error');
    }
  }, [logout]);

  // Branded initial loader -> skeleton -> authoritative backend data
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (mountedRef.current) {
        fetchDashboard({ showSkeleton: true });
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [fetchDashboard]);

  // Keep multi-tab browser windows synced with backend state on focus (throttled)
  useEffect(() => {
    let lastRefreshTime = 0;
    const handleFocusRefresh = () => {
      const now = Date.now();
      if (now - lastRefreshTime < 15000) return;
      if (document.visibilityState === 'visible' && phase === 'ready' && !claimLockRef.current) {
        lastRefreshTime = now;
        fetchDashboard({ showSkeleton: false });
      }
    };
    window.addEventListener('focus', handleFocusRefresh);
    document.addEventListener('visibilitychange', handleFocusRefresh);
    return () => {
      window.removeEventListener('focus', handleFocusRefresh);
      document.removeEventListener('visibilitychange', handleFocusRefresh);
    };
  }, [fetchDashboard, phase]);

  const isRefreshingExpiredRef = useRef(false);
  const handleCountdownExpired = useCallback(async () => {
    if (isRefreshingExpiredRef.current) return;
    isRefreshingExpiredRef.current = true;
    try {
      const statusData = await getStreakStatus();
      if (!mountedRef.current) return;
      if (statusData?.streak?.canClaim || statusData?.streakResetInfo?.wasReset) {
        await fetchDashboard({ showSkeleton: false });
      }
    } catch {
      // Silent retry handled by manual refresh or next interaction.
    } finally {
      window.setTimeout(() => {
        isRefreshingExpiredRef.current = false;
      }, 15000);
    }
  }, [fetchDashboard]);

  const isCountdownActive = Boolean(
    dashboard?.streak &&
    !dashboard.streak.canClaim &&
    dashboard.streak.nextClaimAt &&
    dashboard.serverTime &&
    Date.parse(dashboard.streak.nextClaimAt) > Date.parse(dashboard.serverTime)
  );

  const { formattedTime } = useServerCountdown({
    serverTime: isCountdownActive ? dashboard?.serverTime : null,
    nextClaimAt: isCountdownActive ? dashboard?.streak?.nextClaimAt : null,
    onExpired: handleCountdownExpired,
  });

  const handleClaimClick = async (card) => {
    if (claimLockRef.current || isClaimBusy) return;
    claimLockRef.current = true;
    setIsClaimBusy(true);
    setActionError(null);

    const idempotencyKey = createIdempotencyKey(card.day);

    try {
      // Step 1: Pre-flight validation on backend (grants nothing)
      const prep = await initiateClaim(card.day);
      if (!mountedRef.current) return;

      // Step 2: Polished CPA Advertisement Demo state
      if (prep?.cpaDemo?.enabled !== false) {
        const duration = Number(prep?.cpaDemo?.durationMs) || 2200;
        setCpaState({
          open: true,
          rewardPreview: prep.rewardPreview || null,
          durationMs: duration,
        });

        await new Promise((resolve) => window.setTimeout(resolve, duration));
      }

      if (!mountedRef.current) return;

      // Step 3: Authoritative backend claim execution
      const claimResponse = await claimStreak(card.day, idempotencyKey);
      if (!mountedRef.current) return;

      setCpaState({ open: false, rewardPreview: null, durationMs: 2200 });

      // Step 4: Refresh entire UI state directly from backend
      const latestDashboard = await getStreak();
      if (!mountedRef.current) return;

      setDashboard(latestDashboard);
      setClaimResult(claimResponse);
    } catch (err) {
      if (!mountedRef.current) return;
      setCpaState({ open: false, rewardPreview: null, durationMs: 2200 });

      const parsed = extractApiError(err, 'Unable to process your reward. Please try again.');
      if (parsed.status === 401) {
        logout();
        return;
      }

      setActionError(parsed.message);
      // Re-sync UI with authoritative server state on rejection (e.g., another tab claimed or streak reset)
      await fetchDashboard({ showSkeleton: false });
    } finally {
      claimLockRef.current = false;
      if (mountedRef.current) {
        setIsClaimBusy(false);
      }
    }
  };

  if (phase === 'initial-loader') {
    return (
      <div className={styles.pageBackdrop}>
        <div className={styles.pageContainer}>
          <StreakLoader />
        </div>
      </div>
    );
  }

  if (phase === 'skeleton') {
    return (
      <div className={styles.pageBackdrop}>
        <div className={styles.pageContainer}>
          <StreakSkeleton />
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className={styles.pageBackdrop}>
        <div className={styles.pageContainer}>
          <StreakHeader veBalance={0} onLogout={logout} userName={user?.name} />
          <div className={styles.errorCard} role="alert">
            <h2 className={styles.errorCardTitle}>Could Not Load Daily Streak</h2>
            <p className={styles.errorCardMsg}>{loadError}</p>
            <button
              type="button"
              className={styles.retryBtn}
              onClick={() => fetchDashboard({ showSkeleton: true })}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const streak = dashboard?.streak;
  const wallet = dashboard?.wallet;
  const resetInfo = dashboard?.streakResetInfo;

  return (
    <div className={styles.pageBackdrop}>
      <div className={styles.pageContainer}>
        <StreakHeader
          title="Daily Streak"
          veBalance={wallet?.veBalance ?? 0}
          backTo="/wallet"
          onLogout={logout}
          userName={user?.name}
        />

        <div className={styles.mobileNavStrip}>
          <Link to="/history" className={styles.mobileNavChip}>
            History
          </Link>
          <Link to="/wallet" className={styles.mobileNavChip}>
            Wallet
          </Link>
          <Link to="/profile" className={styles.mobileNavChip}>
            Profile
          </Link>
        </div>

        {resetInfo?.wasReset && !resetBannerDismissed && (
          <div className={styles.resetBanner} role="status">
            <span className="d-flex align-items-center gap-2">
              <RotateCcw size={16} />
              <span>{resetInfo.message}</span>
            </span>
            <button
              type="button"
              className={styles.bannerDismiss}
              onClick={() => setResetBannerDismissed(true)}
            >
              Dismiss
            </button>
          </div>
        )}

        {actionError && (
          <div className={styles.errorBanner} role="alert">
            <span className="d-flex align-items-center gap-2">
              <AlertTriangle size={16} />
              <span>{actionError}</span>
            </span>
            <button
              type="button"
              className={styles.bannerDismiss}
              onClick={() => setActionError(null)}
            >
              Close
            </button>
          </div>
        )}

        <HeroBanner />
        <StreakActionBar
          currentStreak={streak?.currentStreak ?? 0}
          countdownText={formattedTime}
          canClaim={Boolean(streak?.canClaim)}
        />
        <StreakStats streak={streak} />
        <UltimateReward ultimateReward={dashboard?.ultimateReward} />

        <RewardGrid
          rewards={dashboard?.rewards || []}
          statusMessage={streak?.statusMessage}
          countdownText={formattedTime}
          onClaimClick={handleClaimClick}
          isClaimBusy={isClaimBusy}
        />

        <WhyStreak />
        <TrustFooter />
      </div>

      <CpaDemoModal
        open={cpaState.open}
        rewardPreview={cpaState.rewardPreview}
        durationMs={cpaState.durationMs}
      />

      <ClaimResultModal
        result={claimResult}
        onClose={() => setClaimResult(null)}
      />
    </div>
  );
}

