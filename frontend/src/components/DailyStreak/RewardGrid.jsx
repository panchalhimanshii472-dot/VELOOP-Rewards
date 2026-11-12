import RewardCard from './RewardCard';
import styles from './RewardGrid.module.css';

export default function RewardGrid({
  rewards = [],
  statusMessage,
  countdownText,
  onClaimClick,
  isClaimBusy,
}) {
  const isStandardSeven = rewards.length === 7;

  return (
    <section aria-label="7-Day Reward Schedule">
      <div className={styles.sectionDivider}>
        <span className={styles.dividerLine} />
        <span className={styles.dividerText}>
          <span className={styles.sparkle}>✦</span>
          <span>{statusMessage || 'Come back tomorrow for more rewards!'}</span>
          <span className={styles.sparkle}>✦</span>
        </span>
        <span className={styles.dividerLine} />
      </div>

      <div className={styles.gridSeven}>
        {rewards.map((card, index) => {
          let spanClass = '';
          if (isStandardSeven) {
            if (index < 4) {
              spanClass = styles.spanTopRow;
            } else if (index === 6) {
              spanClass = styles.spanFullMobile;
            } else {
              spanClass = styles.spanBottomRow;
            }
          }

          return (
            <RewardCard
              key={card.rewardId || card.day}
              card={card}
              countdownText={card.nextClaimAt ? countdownText : null}
              onClaimClick={onClaimClick}
              isClaimBusy={isClaimBusy}
              spanClass={spanClass}
            />
          );
        })}
      </div>
    </section>
  );
}

