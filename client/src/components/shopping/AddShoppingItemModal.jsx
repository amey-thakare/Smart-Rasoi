import React, { useState } from 'react';
import { X, Plus, Package, IndianRupee } from 'lucide-react';
import styles from './AddShoppingItemModal.module.css';

const COMMON_UNITS = [
  'piece',
  'kg',
  'g',
  'l',
  'ml',
  'cup',
  'tbsp',
  'tsp',
  'bunch',
  'pinch',
  'packet',
  'can'
];

const COMMON_CATEGORIES = [
  'Produce',
  'Dairy',
  'Grains',
  'Spices',
  'Pantry',
  'Bakery',
  'Meat & Seafood',
  'Condiments',
  'Snacks',
  'Beverages',
  'Other'
];

export default function AddShoppingItemModal({
  isOpen,
  onClose,
  onSave,
  initialData = null
}) {
  const [name, setName] = useState(initialData?.name || '');
  const [category, setCategory] = useState(initialData?.category || 'Produce');
  const [quantity, setQuantity] = useState(initialData?.quantity !== undefined ? initialData.quantity : 1);
  const [unit, setUnit] = useState(initialData?.unit || 'piece');
  const [estimatedUnitPrice, setEstimatedUnitPrice] = useState(
    initialData?.estimatedUnitPrice !== null && initialData?.estimatedUnitPrice !== undefined
      ? initialData.estimatedUnitPrice
      : ''
  );
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Item name is required.');
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }

    const price = estimatedUnitPrice === '' ? null : parseFloat(estimatedUnitPrice);
    if (price !== null && (isNaN(price) || price < 0)) {
      setError('Estimated unit price must be a non-negative number.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        category,
        quantity: qty,
        unit: unit.trim().toLowerCase(),
        estimatedUnitPrice: price,
        notes: notes.trim() || null
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to save item.');
    } finally {
      setSubmitting(false);
    }
  };

  const estimatedTotal =
    parseFloat(quantity) > 0 && estimatedUnitPrice !== '' && !isNaN(parseFloat(estimatedUnitPrice))
      ? (parseFloat(quantity) * parseFloat(estimatedUnitPrice)).toFixed(2)
      : null;

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <div className={styles.headerIcon}>
              <Plus size={20} />
            </div>
            <h3>{initialData ? 'Edit Shopping Item' : 'Add Item to Shopping List'}</h3>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.fieldGroup}>
            <label htmlFor="item-name" className={styles.label}>
              Ingredient Name <span className={styles.required}>*</span>
            </label>
            <input
              id="item-name"
              type="text"
              className={styles.input}
              placeholder="e.g. Basmati Rice, Paneer, Tomatoes"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className={styles.row}>
            <div className={styles.fieldGroup}>
              <label htmlFor="item-qty" className={styles.label}>
                Quantity <span className={styles.required}>*</span>
              </label>
              <input
                id="item-qty"
                type="number"
                step="any"
                min="0.01"
                className={styles.input}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="item-unit" className={styles.label}>
                Unit <span className={styles.required}>*</span>
              </label>
              <select
                id="item-unit"
                className={styles.select}
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              >
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.fieldGroup}>
              <label htmlFor="item-category" className={styles.label}>
                Category
              </label>
              <select
                id="item-category"
                className={styles.select}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {COMMON_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="item-price" className={styles.label}>
                Estimated Unit Price (₹)
              </label>
              <div className={styles.inputWithIcon}>
                <span className={styles.currencyPrefix}>₹</span>
                <input
                  id="item-price"
                  type="number"
                  step="0.01"
                  min="0"
                  className={styles.input}
                  placeholder="Auto or enter"
                  value={estimatedUnitPrice}
                  onChange={(e) => setEstimatedUnitPrice(e.target.value)}
                />
              </div>
            </div>
          </div>

          {estimatedTotal && (
            <div className={styles.calcPreview}>
              <span>Estimated Cost:</span>
              <strong>
                {quantity} {unit} × ₹{estimatedUnitPrice} = ₹{estimatedTotal}
              </strong>
            </div>
          )}

          <div className={styles.fieldGroup}>
            <label htmlFor="item-notes" className={styles.label}>
              Notes / Brand Preference <span className={styles.optional}>(Optional)</span>
            </label>
            <input
              id="item-notes"
              type="text"
              className={styles.input}
              placeholder="e.g. Organic, long grain preferred"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? 'Saving...' : initialData ? 'Update Item' : 'Add to List'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
