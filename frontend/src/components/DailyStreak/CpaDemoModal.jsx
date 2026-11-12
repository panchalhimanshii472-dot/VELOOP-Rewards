import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { VeloopMonogramBadge } from '../../assets/RewardArtwork';
import styles from './CpaDemoModal.module.css';

export default function CpaDemoModal({ open, rewardPreview, durationMs = 2200 }) {
  if (!open) return null;

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Reward verification"
    >
      <motion.div
        className={styles.modalCard}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.22 }}
      >
        <div className={styles.tag}>
          <ShieldCheck size={14} />
          <span>Advertisement / Reward Verification</span>
        </div>

        <div>
          <VeloopMonogramBadge size={48} />
        </div>

        <h3 className={styles.title}>Preparing your reward...</h3>
        <p className={styles.subtitle}>
          Please wait while VELoop verifies your daily streak check-in.
        </p>

        {rewardPreview && (
          <div className={styles.previewBox}>
            Day {rewardPreview.day} Reward: {rewardPreview.displayAmount} ({rewardPreview.subtitle})
          </div>
        )}

        <div className={styles.progressTrack}>
          <motion.div
            className={styles.progressFill}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: Math.max(durationMs / 1000, 1.2), ease: 'easeInOut' }}
          />
        </div>

        <div className={styles.footnote}>
          Demo CPA verification placeholder — final reward validation is enforced by the backend.
        </div>
      </motion.div>
    </div>
  );
}

