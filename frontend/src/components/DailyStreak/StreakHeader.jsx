import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Flame, History, LogOut, User, Wallet } from 'lucide-react';
import { VeloopGemIcon } from '../../assets/RewardArtwork';
import styles from './StreakHeader.module.css';

export default function StreakHeader({
  title = 'Daily Streak',
  veBalance = 0,
  backTo = '/wallet',
  onLogout,
  userName,
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1 && backTo === null) {
      navigate(-1);
      return;
    }
    navigate(backTo || '/daily-streak');
  };

  return (
    <header className={styles.headerBar}>
      <div className={styles.leftGroup}>
        <button
          type="button"
          className={styles.backButton}
          onClick={handleBack}
          aria-label="Go back"
        >
          <ChevronLeft size={19} strokeWidth={2.4} />
        </button>

        <div className={styles.titleGroup}>
          <h1 className={styles.pageTitle}>{title}</h1>
          <Flame size={19} className={styles.flameIcon} fill="#F97316" />
        </div>
      </div>

      <div className={styles.rightGroup}>
        <Link to="/history" className={styles.navAction}>
          <History size={15} />
          <span>History</span>
        </Link>

        <Link to="/wallet" className={styles.navAction}>
          <Wallet size={15} />
          <span>Wallet</span>
        </Link>

        <Link to="/profile" className={styles.navAction}>
          <User size={15} />
          <span>Profile</span>
        </Link>

        <Link
          to="/wallet"
          className={styles.balancePill}
          title={userName ? `${userName}'s VE Balance` : 'View Wallet'}
        >
          <VeloopGemIcon size={18} />
          <span>{veBalance}</span>
        </Link>

        {onLogout && (
          <>
            <button
              type="button"
              className={styles.navAction}
              onClick={onLogout}
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>

            <button
              type="button"
              className={styles.logoutIconBtn}
              onClick={onLogout}
              aria-label="Log out"
              title="Log out"
            >
              <LogOut size={15} />
            </button>
          </>
        )}
      </div>
    </header>
  );
}

