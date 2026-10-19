import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  AlertTriangle,
  ShieldAlert,
  Info,
  CheckCircle2,
  PackageCheck
} from 'lucide-react';
import { reverseFoodWaste } from '../../services/api.js';
import styles from './WasteCorrectionModal.module.css';

export default function WasteCorrectionModal({
  isOpen,
  onClose,
  onSuccess,
  record
}) {
  const [restoreToInventory, setRestoreToInventory] = useState(Boolean(record?.inventoryItemId));
  const [reversalReason, setReversalReason] = useState('Logged by mistake');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !record) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!confirmed) {
      setError('Please check the confirmation box to confirm this reversal.');
      return;
    }

    if (!reversalReason.trim()) {
      setError('Please provide a brief justification for the audit trail.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await reverseFoodWaste(record.id, {
        confirm: true,
        restoreToInventory,
        reversalReason: reversalReason.trim()
      });

      if (onSuccess) {
        onSuccess(res?.data?.record || res?.record || res);
      }
      onClose();
    } catch (err) {
      console.error('Error reversing waste record:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to reverse waste record.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={styles.backdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="correction-modal-title"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerIconWrapper}>
              <RotateCcw size={20} />
            </div>
            <div>
              <h2 id="correction-modal-title" className={styles.title}>
                Reverse Waste Record
              </h2>
              <p className={styles.subtitle}>
                Correct an accidental discard log while preserving the audit history
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeBtn}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className={styles.alertError}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className={styles.body}>
          {/* Record Details Card */}
          <div className={styles.detailsCard}>
            <div className={styles.detailsHeader}>
              <span className={styles.itemName}>{record.ingredientName}</span>
              <span className={styles.categoryBadge}>{record.category}</span>
            </div>

            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Quantity Discarded</span>
                <span className={styles.detailValue}>
                  {record.quantityWasted} {record.unit}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Estimated Cost</span>
                <span className={styles.detailValue}>
                  {record.estimatedTotalCost != null
                    ? `₹${Number(record.estimatedTotalCost).toFixed(2)}`
                    : 'N/A'}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Logged Reason</span>
                <span className={styles.detailValue}>{record.reason}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Discard Date</span>
                <span className={styles.detailValue}>
                  {new Date(record.discardedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {record.notes && (
              <p className={styles.recordNotes}>
                <strong>Original Note:</strong> "{record.notes}"
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Inventory Restoration Option */}
            {record.inventoryItemId ? (
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={restoreToInventory}
                  onChange={(e) => setRestoreToInventory(e.target.checked)}
                  className={styles.checkbox}
                />
                <div className={styles.checkboxText}>
                  <span className={styles.checkboxTitle}>
                    Restore +{record.quantityWasted} {record.unit} back into active kitchen inventory
                  </span>
                  <span className={styles.checkboxDesc}>
                    Recommended if the item was not actually discarded or was successfully repurposed.
                  </span>
                </div>
              </label>
            ) : (
              <div className={styles.infoNotice}>
                <Info size={14} />
                <span>
                  This item was logged as an unlisted dish. Restoring inventory is unavailable because no original inventory record was linked.
                </span>
              </div>
            )}

            {/* Reversal Reason */}
            <div className={styles.formGroup}>
              <label htmlFor="reversal-reason" className={styles.label}>
                Reason for Correction <span className={styles.required}>*</span>
              </label>
              <input
                id="reversal-reason"
                type="text"
                placeholder="e.g. Logged wrong quantity, rescued into vegetable broth"
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                className={styles.input}
                required
              />
            </div>

            {/* Explicit Confirmation Check */}
            <div className={styles.confirmBox}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className={styles.checkbox}
                  required
                />
                <div className={styles.checkboxText}>
                  <span className={styles.checkboxTitleDanger}>
                    I confirm that this discard log should be marked as reversed
                  </span>
                  <span className={styles.checkboxDesc}>
                    The record will be flagged as reversed in your audit log, excluding its financial loss and quantity from waste analytics.
                  </span>
                </div>
              </label>
            </div>

            <div className={styles.footer}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`btn btn-primary ${styles.submitBtn}`}
                disabled={loading || !confirmed}
              >
                {loading ? (
                  <>
                    <span className={styles.spinner} />
                    <span>Processing Reversal...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw size={15} />
                    <span>Confirm & Reverse Record</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
