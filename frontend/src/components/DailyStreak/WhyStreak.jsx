import { Calendar, Gift, ShieldCheck, TrendingUp } from 'lucide-react';
import styles from './WhyStreak.module.css';

const BENEFITS = [
  {
    key: 'active',
    title: 'Stay Active',
    description: 'Keep your streak alive & earn more!',
    Icon: Calendar,
    toneClass: styles.tilePurple,
  },
  {
    key: 'bigger',
    title: 'Bigger Streak',
    description: 'More consecutive logins, bigger rewards!',
    Icon: TrendingUp,
    toneClass: styles.tileGold,
  },
  {
    key: 'exclusive',
    title: 'Exclusive Rewards',
    description: 'Get coins, gift cards & special bonuses!',
    Icon: Gift,
    toneClass: styles.tilePurple,
  },
  {
    key: 'miss-out',
    title: "Don't Miss Out",
    description: 'Come back every day & unlock all rewards!',
    Icon: ShieldCheck,
    toneClass: styles.tileGreen,
  },
];

export default function WhyStreak() {
  return (
    <section className={styles.sectionWrap} aria-label="Why Maintain Your Streak">
      <div className={styles.headingRow}>
        <span className={styles.headingLine} />
        <h2 className={styles.headingText}>
          <span className={styles.sparkle}>✦</span>
          <span>Why Maintain Your Streak?</span>
          <span className={styles.sparkle}>✦</span>
        </h2>
        <span className={styles.headingLine} />
      </div>

      <div className={styles.cardsGrid}>
        {BENEFITS.map(({ key, title, description, Icon, toneClass }) => (
          <article key={key} className={styles.benefitCard}>
            <span className={`${styles.iconTile} ${toneClass}`}>
              <Icon size={17} />
            </span>
            <div className={styles.cardTitle}>{title}</div>
            <p className={styles.cardDesc}>{description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

