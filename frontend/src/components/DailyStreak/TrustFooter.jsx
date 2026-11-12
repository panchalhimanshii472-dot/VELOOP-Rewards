import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { VeloopMonogramBadge } from '../../assets/RewardArtwork';
import styles from './TrustFooter.module.css';

export default function TrustFooter() {
  return (
    <Link to="/wallet" className={styles.footerBar} aria-label="VELoop Rewards Trust and Wallet">
      <div className={styles.leftPart}>
        <VeloopMonogramBadge size={36} />
        <div className={styles.textGroup}>
          <div className={styles.primaryLine}>
            Official rewards only on{' '}
            <span className={styles.domainHighlight}>VeloopRewards.in</span>
          </div>
          <div className={styles.secondaryLine}>Stay active, stay rewarded!</div>
        </div>
      </div>

      <ChevronRight size={18} className={styles.chevron} />
    </Link>
  );
}

