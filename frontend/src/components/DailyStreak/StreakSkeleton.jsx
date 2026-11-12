import styles from './StreakSkeleton.module.css';

export default function StreakSkeleton() {
  return (
    <div className={styles.skeletonPage} aria-busy="true" aria-label="Loading streak content">
      <div className={styles.headerRow}>
        <div className={`${styles.shimmer} ${styles.circle}`} />
        <div className={`${styles.shimmer} ${styles.pill}`} />
      </div>

      <div className={`${styles.shimmer} ${styles.heroBlock}`} />

      <div className={styles.statsRow}>
        <div className={`${styles.shimmer} ${styles.statBlock}`} />
        <div className={`${styles.shimmer} ${styles.statBlock}`} />
        <div className={`${styles.shimmer} ${styles.statBlock}`} />
      </div>

      <div className={`${styles.shimmer} ${styles.ultimateBlock}`} />

      <div className={styles.cardsGrid}>
        {[1, 2, 3, 4, 5, 6, 7].map((item) => (
          <div key={item} className={`${styles.shimmer} ${styles.cardBlock}`} />
        ))}
      </div>

      <div className={styles.infoGrid}>
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className={`${styles.shimmer} ${styles.infoBlock}`} />
        ))}
      </div>
    </div>
  );
}

