import { Check, ChevronRight, Clock, Lock } from 'lucide-react';
import { renderRewardAsset } from '../../assets/rewardAssets';
import styles from './RewardCard.module.css';

export default function RewardCard({
  card,
  countdownText,
  onClaimClick,
  isClaimBusy,
  spanClass = '',
}) {
  const isClaimed = card.status === 'CLAIMED';
  const isAvailable = card.status === 'AVAILABLE';
  const isVip = Boolean(card.isUltimate);
  const showCountdown = Boolean(card.nextClaimAt && countdownText && !isAvailable && !isClaimed);

  const cardClasses = [
    styles.card,
    spanClass,
    isClaimed ? styles.cardClaimed : '',
    isAvailable ? styles.cardToday : '',
    !isClaimed && !isAvailable && isVip ? styles.cardVip : '',
  ]
    .filter(Boolean)
    .join(' ');

  const amountClasses = [
    styles.rewardAmount,
    isClaimed
      ? styles.amountClaimed
      : isAvailable
        ? styles.amountToday
        : isVip
          ? styles.amountVip
          : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={cardClasses} aria-label={`Day ${card.day} reward`}>
      <div className={styles.cardTop}>
        <span className={`${styles.dayLabel} ${isVip ? styles.dayLabelVip : ''}`}>
          Day {card.day}
        </span>

        {isClaimed ? (
          <span className={styles.checkCircle} aria-label="Claimed">
            <Check size={11} strokeWidth={3} />
          </span>
        ) : isAvailable ? (
          <span className={`${styles.pillBadge} ${styles.badgeToday}`}>Today</span>
        ) : card.badge ? (
          <span
            className={`${styles.pillBadge} ${
              card.badge === 'VIP' ? styles.badgeVip : styles.badgePurple
            }`}
          >
            {card.badge}
          </span>
        ) : null}
      </div>

      <div className={styles.artSlot}>
        {renderRewardAsset(card.assetType, isVip ? 56 : 50)}
      </div>

      <div className={styles.metaBlock}>
        <div className={styles.rewardTitle}>{card.title}</div>
        <div className={amountClasses}>{card.displayAmount}</div>
        <div className={styles.rewardSubtitle}>{card.subtitle}</div>

        {isClaimed ? (
          <div className={`${styles.actionPill} ${styles.claimedPill}`}>
            <Check size={12} strokeWidth={2.7} />
            <span>Claimed</span>
          </div>
        ) : isAvailable ? (
          <button
            type="button"
            className={styles.claimButton}
            disabled={isClaimBusy}
            onClick={() => onClaimClick(card)}
          >
            <span>{isClaimBusy ? 'Processing...' : 'Claim Now'}</span>
            {!isClaimBusy && <ChevronRight size={13} strokeWidth={2.6} />}
          </button>
        ) : showCountdown ? (
          <div
            className={`${styles.actionPill} ${styles.timerPill}`}
            title="Controlled by backend server time"
          >
            <Clock size={11} />
            <span>{countdownText}</span>
          </div>
        ) : (
          <div className={`${styles.actionPill} ${styles.lockedPill}`}>
            <Lock size={11} />
            <span>Locked</span>
          </div>
        )}
      </div>
    </article>
  );
}

