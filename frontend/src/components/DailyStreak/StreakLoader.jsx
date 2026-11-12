import { motion } from 'framer-motion';
import { VeloopMonogramBadge } from '../../assets/RewardArtwork';
import styles from './StreakLoader.module.css';

export default function StreakLoader({ message = 'Loading your streak...' }) {
  return (
    <div className={styles.loaderWrap} role="status" aria-live="polite">
      <motion.div
        className={styles.orb}
        animate={{ scale: [1, 1.06, 1], opacity: [0.9, 1, 0.9] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <VeloopMonogramBadge size={44} />
      </motion.div>
      <div className={styles.loaderTitle}>{message}</div>
      <div className={styles.loaderHint}>Syncing reward state with VELoop server...</div>
    </div>
  );
}

