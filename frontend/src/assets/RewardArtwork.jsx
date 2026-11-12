import { motion } from 'framer-motion';
import styles from './RewardArtwork.module.css';

export function VeloopGemIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="vlGemGrad" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E9D5FF" />
          <stop offset="50%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#6D28D9" />
        </linearGradient>
      </defs>
      <path
        d="M12 2L20.5 7.5V16.5L12 22L3.5 16.5V7.5L12 2Z"
        fill="url(#vlGemGrad)"
        stroke="#DDD6FE"
        strokeWidth="1.1"
      />
      <path d="M12 2V22M3.5 7.5L12 12.5L20.5 7.5" stroke="rgba(255,255,255,0.45)" strokeWidth="1" />
    </svg>
  );
}

export function VeloopMonogramBadge({ size = 34 }) {
  return (
    <span
      className={styles.monogramBadge}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      VR
    </span>
  );
}

export function CalendarHeroArt({ className = '' }) {
  return (
    <motion.div
      className={`${styles.artWrapper} ${styles.softGlowPurple} ${className}`}
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg width="96" height="96" viewBox="0 0 110 110" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="calBody" x1="16" y1="22" x2="86" y2="94" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#DDD6FE" />
          </linearGradient>
          <linearGradient id="calTop" x1="18" y1="18" x2="84" y2="42" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#6D28D9" />
          </linearGradient>
          <linearGradient id="coinFace" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="55%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
        </defs>
        <g transform="rotate(-10 55 55)">
          <rect x="20" y="24" width="64" height="62" rx="14" fill="url(#calBody)" />
          <path
            d="M20 38C20 30.268 26.268 24 34 24H70C77.732 24 84 30.268 84 38V44H20V38Z"
            fill="url(#calTop)"
          />
          <rect x="33" y="16" width="8" height="14" rx="4" fill="#E9D5FF" />
          <rect x="63" y="16" width="8" height="14" rx="4" fill="#E9D5FF" />
          <path
            d="M40 62L49 71L67 52"
            stroke="#F59E0B"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <circle cx="23" cy="79" r="14" fill="url(#coinFace)" stroke="#FEF3C7" strokeWidth="1.5" />
        <text x="23" y="83" textAnchor="middle" fill="#78350F" fontSize="10" fontWeight="800" fontFamily="sans-serif">
          VR
        </text>
        <circle cx="88" cy="70" r="8" fill="url(#coinFace)" stroke="#FEF3C7" strokeWidth="1" />
        <circle cx="77" cy="22" r="2.2" fill="#FDE68A" />
        <circle cx="94" cy="40" r="1.8" fill="#DDD6FE" />
      </svg>
    </motion.div>
  );
}

export function GiftHeroArt({ className = '' }) {
  return (
    <motion.div
      className={`${styles.artWrapper} ${styles.softGlowPurple} ${className}`}
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
    >
      <svg width="92" height="92" viewBox="0 0 110 110" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="heroBox" x1="22" y1="36" x2="88" y2="92" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#9333EA" />
            <stop offset="100%" stopColor="#4C1D95" />
          </linearGradient>
          <linearGradient id="heroRibbon" x1="30" y1="18" x2="80" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="55%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
        </defs>
        <ellipse cx="55" cy="92" rx="30" ry="6" fill="rgba(168,85,247,0.38)" />
        <rect x="24" y="45" width="62" height="44" rx="10" fill="url(#heroBox)" stroke="rgba(216,180,254,0.35)" />
        <rect x="19" y="34" width="72" height="15" rx="6" fill="#7E22CE" stroke="rgba(233,213,255,0.4)" />
        <rect x="49" y="34" width="12" height="55" fill="url(#heroRibbon)" />
        <rect x="24" y="61" width="62" height="10" fill="url(#heroRibbon)" />
        <path
          d="M55 34C46 21 31 21 34 31C36 37 49 36 55 34ZM55 34C64 21 79 21 76 31C74 37 61 36 55 34Z"
          fill="url(#heroRibbon)"
        />
        <circle cx="88" cy="28" r="2.5" fill="#FDE68A" />
        <circle cx="20" cy="30" r="2" fill="#E9D5FF" />
        <circle cx="93" cy="60" r="2" fill="#FBBF24" />
      </svg>
    </motion.div>
  );
}

export function CoinStackArt({ size = 56 }) {
  return (
    <motion.div
      className={`${styles.artWrapper} ${styles.softGlowGold}`}
      animate={{ y: [0, -2.5, 0] }}
      transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg width={size} height={size} viewBox="0 0 72 72" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="goldCoinTop" x1="12" y1="8" x2="58" y2="54" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
          <linearGradient id="goldCoinRim" x1="12" y1="36" x2="60" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>
        </defs>
        {/* Bottom stacked coins */}
        <ellipse cx="36" cy="54" rx="22" ry="9" fill="url(#goldCoinRim)" />
        <ellipse cx="36" cy="49" rx="22" ry="8.5" fill="url(#goldCoinTop)" />
        <ellipse cx="36" cy="43" rx="22" ry="9" fill="url(#goldCoinRim)" />
        <ellipse cx="36" cy="38" rx="22" ry="8.5" fill="url(#goldCoinTop)" />
        {/* Front hero coin */}
        <circle cx="38" cy="28" r="19" fill="url(#goldCoinRim)" />
        <circle cx="38" cy="27" r="17" fill="url(#goldCoinTop)" stroke="#FEF3C7" strokeWidth="1.4" />
        <circle cx="38" cy="27" r="13" fill="none" stroke="rgba(146,64,14,0.35)" strokeWidth="1.2" />
        <text x="38" y="31.5" textAnchor="middle" fill="#78350F" fontSize="11.5" fontWeight="800" fontFamily="sans-serif">
          VR
        </text>
      </svg>
    </motion.div>
  );
}

export function GiftBoxArt({ size = 56 }) {
  return (
    <motion.div
      className={`${styles.artWrapper} ${styles.softGlowPurple}`}
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg width={size} height={size} viewBox="0 0 72 72" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="boxGrad" x1="14" y1="22" x2="58" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#4C1D95" />
          </linearGradient>
          <linearGradient id="ribbonGrad" x1="20" y1="12" x2="52" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="55%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
        </defs>
        <rect x="14" y="29" width="44" height="31" rx="7" fill="url(#boxGrad)" stroke="rgba(233,213,255,0.35)" />
        <rect x="11" y="22" width="50" height="10" rx="4" fill="#7E22CE" stroke="rgba(233,213,255,0.45)" />
        <rect x="32" y="22" width="8" height="38" fill="url(#ribbonGrad)" />
        <rect x="14" y="40" width="44" height="7" fill="url(#ribbonGrad)" />
        <path
          d="M36 22C30 13 20 13 22 19C23.5 23 32 23 36 22ZM36 22C42 13 52 13 50 19C48.5 23 40 23 36 22Z"
          fill="url(#ribbonGrad)"
        />
      </svg>
    </motion.div>
  );
}

export function AmazonGiftCardArt({ size = 56 }) {
  return (
    <motion.div
      className={styles.artWrapper}
      animate={{ y: [0, -2, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg width={size} height={size} viewBox="0 0 72 72" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="amzCard" x1="10" y1="14" x2="62" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#090D16" />
          </linearGradient>
        </defs>
        <rect
          x="10"
          y="16"
          width="52"
          height="40"
          rx="9"
          fill="url(#amzCard)"
          stroke="rgba(168,85,247,0.45)"
          strokeWidth="1.4"
        />
        <text
          x="36"
          y="39"
          textAnchor="middle"
          fill="#F8FAFC"
          fontSize="22"
          fontWeight="800"
          fontFamily="sans-serif"
        >
          a
        </text>
        <path
          d="M24 44.5C30 48.5 42 48.5 48 44.5"
          stroke="#F59E0B"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path d="M45 43.2L49 44.3L47.2 47.8" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </motion.div>
  );
}

export function CrownUltimateArt({ size = 68 }) {
  return (
    <motion.div
      className={`${styles.artWrapper} ${styles.softGlowGold}`}
      animate={{ y: [0, -3.5, 0], rotate: [-0.8, 0.8, -0.8] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg width={size} height={size} viewBox="0 0 88 88" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="crownGold" x1="18" y1="18" x2="70" y2="62" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
          <radialGradient id="pedestalGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(168,85,247,0.75)" />
            <stop offset="100%" stopColor="rgba(168,85,247,0)" />
          </radialGradient>
        </defs>
        <ellipse cx="44" cy="67" rx="34" ry="12" fill="url(#pedestalGlow)" />
        <ellipse cx="44" cy="66" rx="28" ry="8" stroke="rgba(192,132,252,0.55)" strokeWidth="1.5" fill="rgba(88,28,135,0.35)" />
        <ellipse cx="44" cy="65" rx="20" ry="5.5" stroke="rgba(216,180,254,0.7)" strokeWidth="1.2" fill="none" />
        <path
          d="M21 56L16 28L32 41L44 21L56 41L72 28L67 56H21Z"
          fill="url(#crownGold)"
          stroke="#FEF3C7"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <rect x="21" y="55" width="46" height="7" rx="3.5" fill="#D97706" stroke="#FEF3C7" strokeWidth="1" />
        <circle cx="16" cy="26" r="3.2" fill="#FEF08A" />
        <circle cx="44" cy="19" r="3.8" fill="#FEF08A" />
        <circle cx="72" cy="26" r="3.2" fill="#FEF08A" />
        <circle cx="44" cy="46" r="3" fill="#7C3AED" stroke="#FEF08A" strokeWidth="1.2" />
      </svg>
    </motion.div>
  );
}

