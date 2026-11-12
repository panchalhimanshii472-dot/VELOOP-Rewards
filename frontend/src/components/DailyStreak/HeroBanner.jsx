import { CalendarHeroArt, GiftHeroArt } from '../../assets/RewardArtwork';
import styles from './HeroBanner.module.css';

export default function HeroBanner() {
  return (
    <section className={styles.heroCard} aria-label="Daily Streak Hero Banner">
      <div className={styles.heroInner}>
        <div className={styles.leftArt}>
          <CalendarHeroArt />
        </div>

        <div className={styles.centerText}>
          <h2 className={styles.heroTitle}>
            Login Daily &amp; Earn
            <span className={styles.heroTitleHighlight}>Bigger Rewards!</span>
          </h2>
          <p className={styles.heroSubtitle}>
            Maintain your streak and unlock{' '}
            <span className={styles.subtitleAccent}>exciting rewards</span> every day.
          </p>
        </div>

        <div className={styles.rightArt}>
          <GiftHeroArt />
        </div>
      </div>
    </section>
  );
}

