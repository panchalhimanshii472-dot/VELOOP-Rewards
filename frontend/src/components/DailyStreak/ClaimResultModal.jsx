import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import styles from './ClaimResultModal.module.css';

export default function ClaimResultModal({ result, onClose }) {
  if (!result) return null;

  const { claim, transaction } = result;
  const reward = claim?.reward;

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Claim confirmation"
    >
      <motion.div
        className={styles.modalCard}
        initial={{ opacity: 0, y: 10, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22 }}
      >
        <div className={styles.successIcon}>
          <CheckCircle2 size={28} />
        </div>

        <h3 className={styles.title}>Day {claim?.day} Claimed!</h3>
        <p className={styles.subtitle}>
          {reward?.rewardType === 'GIFT_CARD'
            ? `₹${reward.amount} Amazon Gift Card added to your account.`
            : `+${reward?.amount} VEs credited to your backend wallet.`}
        </p>

        <div className={styles.detailBox}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Reference ID</span>
            <span className={styles.detailValue}>{claim?.referenceId}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Transaction ID</span>
            <span className={styles.detailValue}>{claim?.transactionId}</span>
          </div>
          {transaction && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Wallet Balance</span>
              <span className={styles.detailValue}>
                {transaction.balanceBefore} → {transaction.balanceAfter} {transaction.currency}
              </span>
            </div>
          )}
          {claim?.voucher?.voucherCode && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Voucher Code</span>
              <span className={`${styles.detailValue} ${styles.voucherHighlight}`}>
                {claim.voucher.voucherCode}
              </span>
            </div>
          )}
        </div>

        <button type="button" className={styles.closeBtn} onClick={onClose}>
          Continue
        </button>
      </motion.div>
    </div>
  );
}

