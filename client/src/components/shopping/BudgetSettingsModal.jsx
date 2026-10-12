import React, { useState, useEffect } from 'react';
import { X, PiggyBank, IndianRupee, Save } from 'lucide-react';
import { fetchBudgetSettings, updateBudgetSettings } from '../../services/api.js';
import styles from './BudgetSettingsModal.module.css';

export default function BudgetSettingsModal({ isOpen, onClose, onUpdated }) {
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [weeklyBudget, setWeeklyBudget] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadSettings = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetchBudgetSettings();
        if (isMounted && res.success && res.data?.settings) {
          const s = res.data.settings;
          setMonthlyBudget(s.monthlyBudget !== null && s.monthlyBudget !== undefined ? s.monthlyBudget : '');
          setWeeklyBudget(s.weeklyBudget !== null && s.weeklyBudget !== undefined ? s.weeklyBudget : '');
        }
      } catch (err) {
        if (isMounted) setError('Failed to load budget settings.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSettings();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const monthlyVal = monthlyBudget === '' ? null : parseFloat(monthlyBudget);
    const weeklyVal = weeklyBudget === '' ? null : parseFloat(weeklyBudget);

    if (monthlyVal !== null && (isNaN(monthlyVal) || monthlyVal < 0)) {
      setError('Monthly budget must be a non-negative number.');
      return;
    }

    if (weeklyVal !== null && (isNaN(weeklyVal) || weeklyVal < 0)) {
      setError('Weekly budget must be a non-negative number.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await updateBudgetSettings({
        monthlyBudget: monthlyVal,
        weeklyBudget: weeklyVal
      });
      if (res.success) {
        setSuccessMsg('Budget settings updated successfully.');
        if (onUpdated) onUpdated(res.data?.settings);
        setTimeout(() => {
          onClose();
        }, 600);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to update budget settings.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <div className={styles.headerIcon}>
              <PiggyBank size={20} />
            </div>
            <div>
              <h3>Grocery Budget Limits</h3>
              <span className={styles.subtitle}>Configure household monthly and weekly grocery limits</span>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}
        {successMsg && <div className={styles.successBox}>{successMsg}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          {loading ? (
            <div className={styles.loadingBox}>Loading budget settings...</div>
          ) : (
            <>
              <div className={styles.fieldGroup}>
                <label htmlFor="monthly-budget" className={styles.label}>
                  Monthly Grocery Budget (INR ₹)
                </label>
                <div className={styles.inputWithIcon}>
                  <span className={styles.currencyPrefix}>₹</span>
                  <input
                    id="monthly-budget"
                    type="number"
                    min="0"
                    step="1"
                    className={styles.input}
                    placeholder="e.g. 10000"
                    value={monthlyBudget}
                    onChange={(e) => setMonthlyBudget(e.target.value)}
                  />
                </div>
                <span className={styles.hint}>
                  Used by the Dashboard to track total monthly spend across all completed shopping lists.
                </span>
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="weekly-budget" className={styles.label}>
                  Weekly Target Limit (INR ₹)
                </label>
                <div className={styles.inputWithIcon}>
                  <span className={styles.currencyPrefix}>₹</span>
                  <input
                    id="weekly-budget"
                    type="number"
                    min="0"
                    step="1"
                    className={styles.input}
                    placeholder="e.g. 2500"
                    value={weeklyBudget}
                    onChange={(e) => setWeeklyBudget(e.target.value)}
                  />
                </div>
                <span className={styles.hint}>Recommended target ceiling when generating weekly meal plan shopping lists.</span>
              </div>

              <div className={styles.actions}>
                <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                  <Save size={15} />
                  <span>{submitting ? 'Saving...' : 'Save Settings'}</span>
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
