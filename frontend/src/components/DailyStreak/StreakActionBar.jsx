import { Link } from 'react-router-dom';
import { CalendarDays, ChevronRight, Clock, Flame } from 'lucide-react';
import styles from './StreakActionBar.module.css';

export default function StreakActionBar({ currentStreak = 0, countdownText = null, canClaim = false }) {
  const streakLabel = `${currentStreak} Day Streak`;

  return (
    <div className={styles.actionRow}>
      <div className={styles.streakPill}>
        <Flame size={16} className={styles.streakFlame} fill="#F97316" />
        <span>{streakLabel}</span>
        <span className={styles.keepGoingTag}>
          {currentStreak > 0 ? 'Keep it going!' : 'Start today!'}
        </span>
      </div>

      <div className={styles.rightActions}>
        {!canClaim && countdownText && (
          <div
            className={styles.countdownBadge}
            title="Server-controlled 24-hour unlock timer"
          >
            <Clock size={14} />
            <span>Next unlock: {countdownText}</span>
          </div>
        )}

        <Link to="/history" className={styles.calendarBtn}>
          <CalendarDays size={15} className={styles.calendarIcon} />
          <span>Streak Calendar</span>
          <ChevronRight size={15} />
        </Link>
      </div>
    </div>
  );
}
