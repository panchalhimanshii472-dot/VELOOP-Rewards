import { Check, Lock, Sparkles } from 'lucide-react';
import { CrownUltimateArt } from '../../assets/RewardArtwork';
import styles from './UltimateReward.module.css';

export default function UltimateReward({ ultimateReward }) {
  if (!ultimateReward) return null;

  const isClaimed = ultimateReward.status === 'CLAIMED';
  const isAvailable = ultimateReward.status === 'AVAILABLE';

  return (
    <section className={styles.ultimateCard} aria-label="Ultimate Reward">
      <div className={styles.leftCluster}>
        <div className={styles.crownWrap}>
          <CrownUltimateArt size={72} />
        </div>

        <div className={styles.infoCol}>
          <span className={styles.kicker}>{ultimateReward.title}</span>
          <div className={styles.amount}>{ultimateReward.displayAmount}</div>
          <div className={styles.brandRow}>
            <span className={styles.brandMark}>a</span>
            <span>{ultimateReward.subtitle}</span>
          </div>
        </div>
      </div>

      <div className={styles.statusSide}>
        <span
          className={`${styles.lockBadge} ${
            isClaimed
              ? styles.lockBadgeClaimed
              : isAvailable
                ? styles.lockBadgeAvailable
                : ''
          }`}
        >
          {isClaimed ? (
            <Check size={17} strokeWidth={2.5} />
          ) : isAvailable ? (
            <Sparkles size={17} />
          ) : (
            <Lock size={17} />
          )}
        </span>

        <span className={styles.unlockLabel}>
          {isClaimed ? (
            <>
              Status
              <span className={`${styles.unlockDay} ${styles.unlockDayClaimed}`}>
                Claimed
              </span>
            </>
          ) : isAvailable ? (
            <>
              Ready
              <span className={styles.unlockDay}>Claim Today!</span>
            </>
          ) : (
            <>
              Unlock on
              <span className={styles.unlockDay}>Day {ultimateReward.day}</span>
            </>
          )}
        </span>
      </div>
    </section>
  );
}

