import React, { useState } from 'react';
import { X, ShoppingBag, IndianRupee, FileText } from 'lucide-react';
import styles from './CreateListModal.module.css';

export default function CreateListModal({ isOpen, onClose, onSave, initialData = null }) {
  const [name, setName] = useState(initialData?.name || '');
  const [budget, setBudget] = useState(initialData?.budget !== null && initialData?.budget !== undefined ? initialData.budget : '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name for this shopping list.');
      return;
    }

    const budgetVal = budget === '' ? null : parseFloat(budget);
    if (budgetVal !== null && (isNaN(budgetVal) || budgetVal < 0)) {
      setError('Budget must be a non-negative number.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        budget: budgetVal,
        notes: notes.trim() || null
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to save shopping list.');
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
              <ShoppingBag size={20} />
            </div>
            <h3>{initialData ? 'Edit Shopping List' : 'Create Shopping List'}</h3>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.fieldGroup}>
            <label htmlFor="list-name" className={styles.label}>
              List Name <span className={styles.required}>*</span>
            </label>
            <input
              id="list-name"
              type="text"
              className={styles.input}
              placeholder="e.g. Weekly Groceries (15 Oct - 22 Oct)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="list-budget" className={styles.label}>
              Allocated Budget (INR ₹) <span className={styles.optional}>(Optional)</span>
            </label>
            <div className={styles.inputWithIcon}>
              <span className={styles.currencyPrefix}>₹</span>
              <input
                id="list-budget"
                type="number"
                min="0"
                step="1"
                className={styles.input}
                placeholder="e.g. 1500"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>
            <span className={styles.hint}>Set a target ceiling to track expenses and receive over-budget warnings.</span>
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="list-notes" className={styles.label}>
              Notes / Store <span className={styles.optional}>(Optional)</span>
            </label>
            <textarea
              id="list-notes"
              rows="3"
              className={styles.textarea}
              placeholder="e.g. Buy spices from organic store, dairy from local market"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? 'Saving...' : initialData ? 'Update List' : 'Create List'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
