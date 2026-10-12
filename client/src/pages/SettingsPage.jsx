import React, { useState, useEffect } from 'react';
import { User, CheckCircle2, AlertCircle, Save, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import SectionHeader from '../components/common/SectionHeader.jsx';
import styles from './SettingsPage.module.css';

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Name cannot be empty');
      return;
    }

    if (name.trim().length < 2) {
      setErrorMsg('Name must be at least 2 characters');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({ name: name.trim() });
      setSuccessMsg('Profile updated successfully!');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    try {
      return new Date(isoStr).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className={styles.container}>
      <SectionHeader
        title="Kitchen & Household Settings"
        subtitle="Manage your profile information and configure kitchen preferences"
      />

      {/* Profile Management Section */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.titleArea}>
            <h3 className={styles.cardTitle}>Chef Profile Details</h3>
            <p className={styles.cardSubtitle}>
              Update your display name and review account information
            </p>
          </div>
          <span className="badge badge-success">Active Session</span>
        </div>

        {successMsg && (
          <div className={styles.alertSuccess} role="status">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className={styles.alertError} role="alert">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="settings-name" className={styles.label}>
                Display Name
              </label>
              <input
                id="settings-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.input}
                disabled={isSaving}
                required
              />
              <span className={styles.helpText}>Visible on dashboard greeting and shared meal plans</span>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="settings-email" className={styles.label}>
                Email Address
              </label>
              <input
                id="settings-email"
                type="email"
                value={user?.email || ''}
                readOnly
                className={`${styles.input} ${styles.inputReadOnly}`}
              />
              <span className={styles.helpText}>Email address cannot be changed in Phase 2</span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Account Created</label>
            <input
              type="text"
              value={formatDate(user?.createdAt)}
              readOnly
              className={`${styles.input} ${styles.inputReadOnly}`}
            />
          </div>

          <div className={styles.actions}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving || name.trim() === user?.name}
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Household & Culinary Preferences Preview */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.titleArea}>
            <h3 className={styles.cardTitle}>Culinary & Household Preferences</h3>
            <p className={styles.cardSubtitle}>
              Portion size scaling, spice tolerance, and dietary restriction defaults
            </p>
          </div>
          <span className="badge badge-warning">Planned for Phase 3</span>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
          In upcoming phases, you will be able to customize default portion sizes (e.g. 2 adults, 1 child), establish regional spice levels, configure expiry alert thresholds (e.g. notify 48h vs 24h prior), and toggle metric versus imperial kitchen units.
        </p>
      </div>
    </div>
  );
}
