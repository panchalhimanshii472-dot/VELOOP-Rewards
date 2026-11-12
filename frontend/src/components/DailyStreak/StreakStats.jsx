import { CalendarCheck2, CheckSquare, Star } from 'lucide-react';
import styles from './StreakStats.module.css';

function formatNextRewardLabel(nextReward) {
  if (!nextReward) return '—';
  if (nextReward.rewardType === 'GIFT_CARD') {
    return `${nextReward.displayAmount} Gift`;
  }
  return `+${nextReward.amount} VEs`;
}

export default function StreakStats({ streak }) {
  const totalRewards = streak?.totalRewards ?? '—';
  const checkedIn = streak?.checkedIn ?? '—';
  const nextRewardLabel = formatNextRewardLabel(streak?.nextReward);

  return (
    <section className={styles.statsGrid} aria-label="Streak Statistics">
      <div className={styles.statCard}>
        <span className={`${styles.iconBox} ${styles.iconPurple}`}>
          <CalendarCheck2 size={16} />
        </span>
        <div className={styles.textCol}>
          <span className={styles.statLabel}>Total Rewards</span>
          <span className={styles.statValue}>{totalRewards}</span>
        </div>
      </div>

      <div className={styles.statCard}>
        <span className={`${styles.iconBox} ${styles.iconGreen}`}>
          <CheckSquare size={16} />
        </span>
        <div className={styles.textCol}>
          <span className={styles.statLabel}>Checked In</span>
          <span className={styles.statValue}>{checkedIn}</span>
        </div>
      </div>

      <div className={styles.statCard}>
        <span className={`${styles.iconBox} ${styles.iconGold}`}>
          <Star size={16} fill="#FBBF24" />
        </span>
        <div className={styles.textCol}>
          <span className={styles.statLabel}>Next Reward</span>
          <span className={`${styles.statValue} ${styles.statValueGold}`}>
            {nextRewardLabel}
          </span>
        </div>
      </div>
    </section>
  );
}

