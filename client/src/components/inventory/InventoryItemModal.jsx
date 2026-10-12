import React, { useState, useEffect } from 'react';
import { X, Save, PlusCircle, AlertCircle, Loader2 } from 'lucide-react';
import styles from './InventoryItemModal.module.css';

const CATEGORIES = [
  'Vegetables',
  'Fruits',
  'Dairy',
  'Grains',
  'Pulses',
  'Spices',
  'Meat',
  'Seafood',
  'Beverages',
  'Frozen Foods',
  'Other'
];

const UNITS = [
  'kg',
  'g',
  'L',
  'ml',
  'pieces',
  'packets',
  'bottles'
];

export default function InventoryItemModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null
}) {
  const isEditing = Boolean(initialData && initialData.id);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Vegetables',
    quantity: '',
    unit: 'pieces',
    minimumQuantity: '1',
    purchaseDate: '',
    expiryDate: '',
    notes: ''
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Format date helper for HTML date input (YYYY-MM-DD)
  const toDateInputString = (dateVal) => {
    if (!dateVal) return '';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        category: initialData.category || 'Vegetables',
        quantity: initialData.quantity !== undefined ? String(initialData.quantity) : '',
        unit: initialData.unit || 'pieces',
        minimumQuantity: initialData.minimumQuantity !== undefined ? String(initialData.minimumQuantity) : '1',
        purchaseDate: toDateInputString(initialData.purchaseDate),
        expiryDate: toDateInputString(initialData.expiryDate),
        notes: initialData.notes || ''
      });
    } else {
      setFormData({
        name: '',
        category: 'Vegetables',
        quantity: '',
        unit: 'pieces',
        minimumQuantity: '1',
        purchaseDate: toDateInputString(new Date()),
        expiryDate: '',
        notes: ''
      });
    }
    setFieldErrors({});
    setServerError('');
  }, [initialData, isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Ingredient name is required';
    }

    if (!formData.category.trim()) {
      errors.category = 'Category is required';
    }

    if (formData.quantity === '' || isNaN(Number(formData.quantity))) {
      errors.quantity = 'Valid quantity is required';
    } else if (Number(formData.quantity) < 0) {
      errors.quantity = 'Quantity cannot be negative';
    }

    if (!formData.unit.trim()) {
      errors.unit = 'Unit is required';
    }

    if (formData.minimumQuantity !== '' && (isNaN(Number(formData.minimumQuantity)) || Number(formData.minimumQuantity) < 0)) {
      errors.minimumQuantity = 'Minimum quantity must be 0 or greater';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        category: formData.category.trim(),
        quantity: parseFloat(formData.quantity),
        unit: formData.unit.trim(),
        minimumQuantity: formData.minimumQuantity !== '' ? parseFloat(formData.minimumQuantity) : 1,
        purchaseDate: formData.purchaseDate || null,
        expiryDate: formData.expiryDate || null,
        notes: formData.notes.trim() || null
      };

      await onSubmit(payload);
      onClose();
    } catch (err) {
      setServerError(err.response?.data?.message || err.message || 'Failed to save inventory item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <h2 className={styles.title}>
              {isEditing ? 'Edit Inventory Item' : 'Add Kitchen Ingredient'}
            </h2>
            <span className={styles.subtitle}>
              {isEditing ? 'Update stock quantity, threshold, or expiry' : 'Log a new item in your pantry or fridge'}
            </span>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.body}>
            {serverError && (
              <div className={styles.errorBanner} role="alert">
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{serverError}</span>
              </div>
            )}

            <div className={styles.formGrid}>
              {/* Ingredient Name */}
              <div className={styles.formGroupFull}>
                <label htmlFor="inv-name" className={styles.label}>
                  Ingredient Name *
                </label>
                <input
                  id="inv-name"
                  type="text"
                  placeholder="e.g. Tomatoes, Basmati Rice, Milk"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={`${styles.input} ${fieldErrors.name ? styles.inputError : ''}`}
                  disabled={isSubmitting}
                  autoFocus
                  required
                />
                {fieldErrors.name && <span className={styles.fieldError}>{fieldErrors.name}</span>}
              </div>

              {/* Category */}
              <div className={styles.formGroup}>
                <label htmlFor="inv-category" className={styles.label}>
                  Category *
                </label>
                <select
                  id="inv-category"
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className={styles.select}
                  disabled={isSubmitting}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div className={styles.formGroup}>
                <label htmlFor="inv-quantity" className={styles.label}>
                  Quantity *
                </label>
                <input
                  id="inv-quantity"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="e.g. 500 or 2"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', e.target.value)}
                  className={`${styles.input} ${fieldErrors.quantity ? styles.inputError : ''}`}
                  disabled={isSubmitting}
                  required
                />
                {fieldErrors.quantity && <span className={styles.fieldError}>{fieldErrors.quantity}</span>}
              </div>

              {/* Unit */}
              <div className={styles.formGroup}>
                <label htmlFor="inv-unit" className={styles.label}>
                  Unit of Measurement *
                </label>
                <select
                  id="inv-unit"
                  value={formData.unit}
                  onChange={(e) => handleChange('unit', e.target.value)}
                  className={styles.select}
                  disabled={isSubmitting}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              {/* Minimum Threshold */}
              <div className={styles.formGroup}>
                <label htmlFor="inv-min-qty" className={styles.label}>
                  Low Stock Alert Threshold
                </label>
                <input
                  id="inv-min-qty"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Default: 1"
                  value={formData.minimumQuantity}
                  onChange={(e) => handleChange('minimumQuantity', e.target.value)}
                  className={`${styles.input} ${fieldErrors.minimumQuantity ? styles.inputError : ''}`}
                  disabled={isSubmitting}
                />
                {fieldErrors.minimumQuantity && (
                  <span className={styles.fieldError}>{fieldErrors.minimumQuantity}</span>
                )}
              </div>

              {/* Purchase Date */}
              <div className={styles.formGroup}>
                <label htmlFor="inv-purchase-date" className={styles.label}>
                  Purchase Date
                </label>
                <input
                  id="inv-purchase-date"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => handleChange('purchaseDate', e.target.value)}
                  className={styles.input}
                  disabled={isSubmitting}
                />
              </div>

              {/* Expiry Date */}
              <div className={styles.formGroup}>
                <label htmlFor="inv-expiry-date" className={styles.label}>
                  Expiry Date
                </label>
                <input
                  id="inv-expiry-date"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => handleChange('expiryDate', e.target.value)}
                  className={styles.input}
                  disabled={isSubmitting}
                />
              </div>

              {/* Notes */}
              <div className={styles.formGroupFull}>
                <label htmlFor="inv-notes" className={styles.label}>
                  Notes / Storage Compartment
                </label>
                <textarea
                  id="inv-notes"
                  placeholder="e.g. Fridge top shelf, crisper drawer, airtight container..."
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  className={styles.textarea}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Saving...</span>
                </>
              ) : isEditing ? (
                <>
                  <Save size={16} />
                  <span>Save Changes</span>
                </>
              ) : (
                <>
                  <PlusCircle size={16} />
                  <span>Add Ingredient</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
