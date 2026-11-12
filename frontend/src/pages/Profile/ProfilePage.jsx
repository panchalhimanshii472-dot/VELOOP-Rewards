import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import StreakHeader from '../../components/DailyStreak/StreakHeader';
import StreakLoader from '../../components/DailyStreak/StreakLoader';
import { useAuth } from '../../context/AuthContext';
import { extractApiError } from '../../services/apiClient';
import {
  changePasswordRequest,
  fetchCurrentUser,
  updateProfileRequest,
} from '../../services/authApi';
import { formatUtcDateTime } from '../../utils/formatters';
import styles from './ProfilePage.module.css';

export default function ProfilePage() {
  const { user, logout, updateSessionUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [nameInput, setNameInput] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetchCurrentUser();
        if (!active) return;
        setProfileData(res);
        setNameInput(res.user?.name || '');
      } catch (err) {
        if (!active) return;
        const parsed = extractApiError(err, 'Failed to load profile.');
        if (parsed.status === 401) {
          logout();
          return;
        }
        setLoadError(parsed.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [logout]);

  const handleProfileSave = async (event) => {
    event.preventDefault();
    if (profileSaving) return;
    setProfileSaving(true);
    setProfileFeedback(null);

    try {
      const res = await updateProfileRequest({ name: nameInput });
      updateSessionUser(res.user);
      setProfileData((prev) => (prev ? { ...prev, user: res.user } : prev));
      setProfileFeedback({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      const parsed = extractApiError(err, 'Unable to update profile.');
      setProfileFeedback({ type: 'error', text: parsed.message });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    if (passwordSaving) return;
    setPasswordSaving(true);
    setPasswordFeedback(null);

    try {
      const res = await changePasswordRequest({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setPasswordFeedback({
        type: 'success',
        text: res.message || 'Password updated successfully.',
      });
    } catch (err) {
      const parsed = extractApiError(err, 'Unable to change password.');
      setPasswordFeedback({ type: 'error', text: parsed.message });
    } finally {
      setPasswordSaving(false);
    }
  };

  const profileUser = profileData?.user || user;
  const wallet = profileData?.wallet;
  const streakSummary = profileData?.streakSummary;
  const initials = (profileUser?.name || 'VL')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  return (
    <div className={styles.pageWrap}>
      <div className={styles.container}>
        <StreakHeader
          title="User Profile"
          veBalance={wallet?.veBalance ?? 0}
          backTo="/daily-streak"
          onLogout={logout}
          userName={profileUser?.name}
        />

        {loading ? (
          <StreakLoader message="Loading your profile..." />
        ) : loadError ? (
          <div className="alert alert-danger">{loadError}</div>
        ) : (
          <>
            <section className={styles.profileHero}>
              <div className={styles.identityGroup}>
                <div className={styles.avatarCircle} aria-hidden="true">
                  {initials}
                </div>
                <div>
                  <h2 className={styles.userName}>{profileUser?.name}</h2>
                  <div className={styles.userEmail}>{profileUser?.email}</div>
                </div>
              </div>

              <span className={styles.roleBadge}>
                <ShieldCheck size={14} />
                <span>JWT Authenticated · {profileUser?.role}</span>
              </span>
            </section>

            <section className={styles.statsGrid} aria-label="Account Summary">
              <div className={styles.statBox}>
                <div className={styles.statLabel}>Current Streak</div>
                <div className={styles.statValue}>
                  {streakSummary?.currentStreak ?? 0} Days
                </div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statLabel}>Wallet VEs</div>
                <div className={styles.statValue}>{wallet?.veBalance ?? 0} VEs</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statLabel}>Gift Cards Earned</div>
                <div className={styles.statValue}>
                  ₹{wallet?.giftCardBalanceInr ?? 0}
                </div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statLabel}>Total Claims</div>
                <div className={styles.statValue}>
                  {streakSummary?.totalClaims ?? 0}
                </div>
              </div>
            </section>

            <div className="row g-3">
              <div className="col-12 col-lg-6">
                <section className={styles.sectionCard}>
                  <h3 className={styles.sectionTitle}>Profile Details</h3>
                  {profileFeedback && (
                    <div
                      className={
                        profileFeedback.type === 'success'
                          ? styles.successNotice
                          : styles.errorNotice
                      }
                      role="status"
                    >
                      {profileFeedback.text}
                    </div>
                  )}

                  <form onSubmit={handleProfileSave}>
                    <div className="mb-3">
                      <label htmlFor="profileName" className={styles.fieldLabel}>
                        Display Name
                      </label>
                      <input
                        id="profileName"
                        type="text"
                        className={`form-control ${styles.darkInput}`}
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        required
                        minLength={2}
                        maxLength={80}
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="profileEmail" className={styles.fieldLabel}>
                        Email (Verified Identity)
                      </label>
                      <input
                        id="profileEmail"
                        type="email"
                        className={`form-control ${styles.darkInput}`}
                        value={profileUser?.email || ''}
                        disabled
                      />
                    </div>

                    <button
                      type="submit"
                      className={styles.primaryBtn}
                      disabled={profileSaving}
                    >
                      {profileSaving ? 'Saving...' : 'Save Name'}
                    </button>
                  </form>
                </section>
              </div>

              <div className="col-12 col-lg-6">
                <section className={styles.sectionCard}>
                  <h3 className={styles.sectionTitle}>Account Security</h3>
                  {passwordFeedback && (
                    <div
                      className={
                        passwordFeedback.type === 'success'
                          ? styles.successNotice
                          : styles.errorNotice
                      }
                      role="status"
                    >
                      {passwordFeedback.text}
                    </div>
                  )}

                  <form onSubmit={handlePasswordChange}>
                    <div className="mb-3">
                      <label htmlFor="currentPassword" className={styles.fieldLabel}>
                        Current Password
                      </label>
                      <input
                        id="currentPassword"
                        type="password"
                        className={`form-control ${styles.darkInput}`}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="newPassword" className={styles.fieldLabel}>
                        New Password (min 6 characters)
                      </label>
                      <input
                        id="newPassword"
                        type="password"
                        className={`form-control ${styles.darkInput}`}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>

                    <button
                      type="submit"
                      className={styles.secondaryBtn}
                      disabled={passwordSaving}
                    >
                      {passwordSaving ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                </section>
              </div>
            </div>

            <section className={styles.sectionCard}>
              <h3 className={styles.sectionTitle}>Session &amp; Streak Metadata</h3>
              <div className={styles.metaRow}>
                <span className={styles.metaKey}>Active Cycle ID</span>
                <span className={styles.metaVal}>
                  {streakSummary?.activeCycleId || 'Not initialized'}
                </span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaKey}>Completed Cycles</span>
                <span className={styles.metaVal}>
                  {streakSummary?.completedCycles ?? 0} / {streakSummary?.totalCycles ?? 0}
                </span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaKey}>Last Login</span>
                <span className={styles.metaVal}>
                  {formatUtcDateTime(profileUser?.lastLoginAt)}
                </span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaKey}>Member Since</span>
                <span className={styles.metaVal}>
                  {formatUtcDateTime(profileUser?.createdAt)}
                </span>
              </div>

              <div className="mt-3">
                <button type="button" className={styles.logoutBtn} onClick={logout}>
                  Sign Out of VELoop Rewards
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

