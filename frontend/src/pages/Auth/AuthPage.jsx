import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VeloopMonogramBadge } from '../../assets/RewardArtwork';
import { useAuth } from '../../context/AuthContext';
import { extractApiError } from '../../services/apiClient';
import styles from './AuthPage.module.css';

const DEMO_ACCOUNTS = [
  {
    email: 'demo@velooprewards.in',
    label: 'Demo User — Day 2 Ready (120 VEs)',
    desc: 'Day 1 claimed · Day 2 claimable now',
  },
  {
    email: 'fresh@velooprewards.in',
    label: 'Fresh User — Day 1 Start (0 VEs)',
    desc: 'Brand-new cycle starting at Day 1',
  },
  {
    email: 'missed@velooprewards.in',
    label: 'Missed-Day Demo — Auto Reset',
    desc: 'Missed Day 3 window · resets to Day 1 on login',
  },
];

export default function AuthPage({ initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setMode(initialMode);
    setError(null);
  }, [initialMode]);

  const handleModeSwitch = (nextMode) => {
    setMode(nextMode);
    setError(null);
    navigate(nextMode === 'register' ? '/register' : '/login', { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);

    try {
      if (mode === 'register') {
        await register({ name, email, password });
      } else {
        await login({ email, password });
      }
      navigate('/daily-streak', { replace: true });
    } catch (err) {
      const parsed = extractApiError(err, 'Authentication failed. Please verify your details.');
      setError(parsed.message);
    } finally {
      setSubmitting(false);
    }
  };

  const applyDemoCredentials = (demoEmail) => {
    setMode('login');
    setEmail(demoEmail);
    setPassword('VeloopDemo@2026');
    setError(null);
  };

  return (
    <main className={styles.authScreen}>
      <section className={styles.authCard} aria-label="VELoop Authentication">
        <div className={styles.brandTop}>
          <VeloopMonogramBadge size={40} />
          <h1 className={styles.brandTitle}>
            VELoop <span className={styles.brandGold}>Rewards</span>
          </h1>
        </div>

        <div className={styles.tabRow} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={`${styles.tabBtn} ${mode === 'login' ? styles.tabBtnActive : ''}`}
            onClick={() => handleModeSwitch('login')}
          >
            Login
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={`${styles.tabBtn} ${mode === 'register' ? styles.tabBtnActive : ''}`}
            onClick={() => handleModeSwitch('register')}
          >
            Register
          </button>
        </div>

        {error && (
          <div className={styles.errorAlert} role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="mb-3">
              <label htmlFor="authName" className={styles.fieldLabel}>
                Full Name
              </label>
              <input
                id="authName"
                type="text"
                className={`form-control ${styles.darkInput}`}
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
              />
            </div>
          )}

          <div className="mb-3">
            <label htmlFor="authEmail" className={styles.fieldLabel}>
              Email Address
            </label>
            <input
              id="authEmail"
              type="email"
              className={`form-control ${styles.darkInput}`}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="authPassword" className={styles.fieldLabel}>
              Password
            </label>
            <input
              id="authPassword"
              type="password"
              className={`form-control ${styles.darkInput}`}
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            {submitting
              ? 'Authenticating...'
              : mode === 'register'
                ? 'Create VELoop Account'
                : 'Sign In to Daily Streak'}
          </button>
        </form>

        {mode === 'login' && (
          <div className={styles.demoBox}>
            <div className={styles.demoTitle}>Seeded Development Demo Accounts</div>
            <div className={styles.demoBtns}>
              {DEMO_ACCOUNTS.map((acct) => (
                <button
                  key={acct.email}
                  type="button"
                  className={styles.demoBtn}
                  onClick={() => applyDemoCredentials(acct.email)}
                >
                  <strong>{acct.label}</strong>
                  <span className={styles.demoDesc}>{acct.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

