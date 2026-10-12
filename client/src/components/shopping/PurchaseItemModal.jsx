import React, { useState } from 'react';
import { X, CheckCircle, Package, Calendar, MapPin, IndianRupee } from 'lucide-react';
import styles from './PurchaseItemModal.module.css';

export default function PurchaseItemModal({
  isOpen,
  onClose,
  item,
  onConfirmPurchase
}) {
  const [actualQuantity, setActualQuantity] = useState(
    item?.actualQuantity !== null && item?.actualQuantity !== undefined
      ? item.actualQuantity
      : item?.quantity || 1
  );
  const [actualPrice, setActualPrice] = useState(
    item?.actualPrice !== null && item?.actualPrice !== undefined
      ? item.actualPrice
      : item?.estimatedTotalPrice || ''
  );
  const [store, setStore] = useState('');
  const [addToInventory, setAddToInventory] = useState(false);
  const [location, setLocation] = useState('Pantry');
  const [expiryDate, setExpiryDate] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const qty = parseFloat(actualQuantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Actual quantity purchased must be greater than 0.');
      return;
    }

    const price = actualPrice === '' ? null : parseFloat(actualPrice);
    if (price !== null && (isNaN(price) || price < 0)) {
      setError('Actual total price must be a non-negative number.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await onConfirmPurchase({
        purchased: true,
        actualQuantity: qty,
        actualPrice: price,
        store: store.trim() || null,
        addToInventory,
        inventoryData: addToInventory
          ? {
              location,
              expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null
            }
          : null
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to record purchase.');
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
              <CheckCircle size={20} />
            </div>
            <div>
              <h3>Mark as Purchased</h3>
              <span className={styles.itemSubtitle}>{item.name} ({item.quantity} {item.unit} planned)</span>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.fieldGroup}>
              <label htmlFor="actual-qty" className={styles.label}>
                Actual Quantity Bought <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWithSuffix}>
                <input
                  id="actual-qty"
                  type="number"
                  step="any"
                  min="0.01"
                  className={styles.input}
                  value={actualQuantity}
                  onChange={(e) => setActualQuantity(e.target.value)}
                  required
                />
                <span className={styles.unitSuffix}>{item.unit}</span>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="actual-price" className={styles.label}>
                Actual Total Paid (INR ₹)
              </label>
              <div className={styles.inputWithIcon}>
                <span className={styles.currencyPrefix}>₹</span>
                <input
                  id="actual-price"
                  type="number"
                  step="0.01"
                  min="0"
                  className={styles.input}
                  placeholder={item.estimatedTotalPrice ? `Est: ₹${item.estimatedTotalPrice}` : 'e.g. 120'}
                  value={actualPrice}
                  onChange={(e) => setActualPrice(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="purchase-store" className={styles.label}>
              Store / Vendor <span className={styles.optional}>(Optional)</span>
            </label>
            <input
              id="purchase-store"
              type="text"
              className={styles.input}
              placeholder="e.g. Nature's Basket, Local Mandi, Blinkit"
              value={store}
              onChange={(e) => setStore(e.target.value)}
            />
            <span className={styles.hint}>Saving the price will automatically update your historical price tracking.</span>
          </div>

          {/* Explicit Add To Inventory Checkbox */}
          <div className={styles.inventorySection}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={addToInventory}
                onChange={(e) => setAddToInventory(e.target.checked)}
                className={styles.checkbox}
              />
              <div className={styles.checkboxText}>
                <strong>Add directly to Kitchen Inventory</strong>
                <span>Stock this item in your pantry/fridge right now without duplicate entry.</span>
              </div>
            </label>

            {addToInventory && (
              <div className={styles.inventoryFields}>
                <div className={styles.row}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="inv-location" className={styles.label}>
                      Storage Location
                    </label>
                    <select
                      id="inv-location"
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
                    <label htmlFor="inv-expiry" className={styles.label}>
                      Expiry Date <span className={styles.optional}>(Optional)</span>
                    </label>
                    <input
                      id="inv-expiry"
                      type="date"
                      className={styles.input}
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? 'Confirming...' : 'Confirm Purchase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
