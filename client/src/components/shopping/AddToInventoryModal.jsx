import React, { useState } from 'react';
import { X, PackageCheck, MapPin, Calendar, CheckCircle } from 'lucide-react';
import styles from './AddToInventoryModal.module.css';

export default function AddToInventoryModal({
  isOpen,
  onClose,
  item,
  onConfirmAdd
}) {
  const [location, setLocation] = useState('Pantry');
  const [expiryDate, setExpiryDate] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onConfirmAdd({
        location,
        expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to add item to kitchen inventory.');
    } finally {
      setSubmitting(false);
    }
  };

  const qty = item.actualQuantity || item.quantity;

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <div className={styles.headerIcon}>
              <PackageCheck size={20} />
            </div>
            <div>
              <h3>Add to Kitchen Inventory</h3>
              <span className={styles.itemSubtitle}>
                {item.name} ({qty} {item.unit})
              </span>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.previewBox}>
            <div className={styles.previewRow}>
              <span>Ingredient:</span>
              <strong>{item.name}</strong>
            </div>
            <div className={styles.previewRow}>
              <span>Quantity to Add:</span>
              <strong>{qty} {item.unit}</strong>
            </div>
            <div className={styles.previewRow}>
              <span>Category:</span>
              <span>{item.category || 'Produce'}</span>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="modal-location" className={styles.label}>
              Storage Location <span className={styles.required}>*</span>
            </label>
            <select
              id="modal-location"
              className={styles.select}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="Pantry">Pantry</option>
              <option value="Fridge">Fridge</option>
              <option value="Freezer">Freezer</option>
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="modal-expiry" className={styles.label}>
              Expiry Date <span className={styles.optional}>(Optional)</span>
            </label>
            <input
              id="modal-expiry"
              type="date"
              className={styles.input}
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
            <span className={styles.hint}>Helps Smart Rasoi alert you before this ingredient spoils.</span>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? 'Adding...' : 'Add to Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
