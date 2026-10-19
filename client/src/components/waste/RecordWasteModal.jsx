import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { fetchInventoryItems, recordFoodWaste } from '../../services/api.js';
import styles from './RecordWasteModal.module.css';

const REASON_OPTIONS = [
  { value: 'EXPIRED', label: 'Expired (Past safe consumption window)' },
  { value: 'SPOILED', label: 'Spoiled / Moldy / Off-odor / Sour' },
  { value: 'EXCESS_PREPARED', label: 'Excess Prepared (Cooked leftovers unconsumed)' },
  { value: 'OVER_PURCHASED', label: 'Over-Purchased (Surplus pantry stock)' },
  { value: 'COOKING_MISTAKE', label: 'Cooking Mistake (Burnt, over-salted, curdled)' },
  { value: 'OTHER', label: 'Other Root Cause' }
];

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

const COMMON_UNITS = ['g', 'kg', 'ml', 'l', 'piece', 'cup', 'tbsp', 'tsp', 'packet', 'bunch'];

export default function RecordWasteModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedItem = null
}) {
  const [mode, setMode] = useState(preselectedItem ? 'inventory' : 'inventory');
  const [inventoryList, setInventoryList] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);

  // Form State
  const [selectedInventoryId, setSelectedInventoryId] = useState(preselectedItem?.id || '');
  const [customItemName, setCustomItemName] = useState('');
  const [category, setCategory] = useState(preselectedItem?.category || 'Vegetables');
  const [quantityWasted, setQuantityWasted] = useState('');
  const [unit, setUnit] = useState(preselectedItem?.unit || 'g');
  const [reason, setReason] = useState('EXPIRED');
  const [discardedAt, setDiscardedAt] = useState(() => {
    const now = new Date();
    // format YYYY-MM-DDTHH:mm
    return now.toISOString().slice(0, 16);
  });
  const [estimatedTotalCost, setEstimatedTotalCost] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load user inventory if mode is 'inventory'
  useEffect(() => {
    if (!isOpen) return;

    if (preselectedItem) {
      setSelectedInventoryId(preselectedItem.id);
      setUnit(preselectedItem.unit);
      setCategory(preselectedItem.category || 'Vegetables');
      setMode('inventory');
    }

    async function loadInventory() {
      setInventoryLoading(true);
      try {
        const res = await fetchInventoryItems({ limit: 200, sortBy: 'name', sortOrder: 'asc' });
        const items = res?.data?.items || res?.items || (Array.isArray(res) ? res : []);
        setInventoryList(items);

        if (!preselectedItem && items.length > 0 && !selectedInventoryId) {
          setSelectedInventoryId(items[0].id);
          setUnit(items[0].unit);
          setCategory(items[0].category);
        }
      } catch (err) {
        console.error('Failed to load inventory for waste logging:', err);
      } finally {
        setInventoryLoading(false);
      }
    }

    loadInventory();
  }, [isOpen, preselectedItem]);

  // When selected inventory item changes
  const activeInventoryItem = inventoryList.find((i) => i.id === selectedInventoryId) || preselectedItem;

  const handleInventorySelect = (e) => {
    const id = e.target.value;
    setSelectedInventoryId(id);
    const item = inventoryList.find((i) => i.id === id);
    if (item) {
      setUnit(item.unit);
      setCategory(item.category || 'Vegetables');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const qty = parseFloat(quantityWasted);
    if (isNaN(qty) || qty <= 0) {
      setError('Please specify a valid quantity greater than 0.');
      return;
    }

    if (mode === 'inventory') {
      if (!selectedInventoryId) {
        setError('Please select an ingredient from your inventory.');
        return;
      }
      if (activeInventoryItem && qty > activeInventoryItem.quantity) {
        setError(
          `Quantity cannot exceed available stock (${activeInventoryItem.quantity} ${activeInventoryItem.unit}).`
        );
        return;
      }
    } else {
      if (!customItemName.trim()) {
        setError('Please provide an item or ingredient name.');
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        inventoryItemId: mode === 'inventory' ? selectedInventoryId : null,
        customItemName: mode === 'custom' ? customItemName.trim() : null,
        category: mode === 'custom' ? category : activeInventoryItem?.category,
        quantityWasted: qty,
        unit: mode === 'inventory' ? activeInventoryItem?.unit || unit : unit,
        reason,
        notes: notes.trim() || undefined,
        discardedAt: new Date(discardedAt).toISOString(),
        estimatedTotalCost: estimatedTotalCost ? parseFloat(estimatedTotalCost) : undefined
      };

      const res = await recordFoodWaste(payload);
      if (onSuccess) {
        onSuccess(res?.data?.record || res?.record || res);
      }
      onClose();
    } catch (err) {
      console.error('Error recording food waste:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to record food waste.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="waste-modal-title">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerIconWrapper}>
              <Trash2 size={20} />
            </div>
            <div>
              <h2 id="waste-modal-title" className={styles.title}>
                Record Food Waste
              </h2>
              <p className={styles.subtitle}>
                Log discarded food to track root causes and prevent financial loss
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

        {/* Source Toggle */}
        <div className={styles.sourceToggleRow}>
          <button
            type="button"
            className={`${styles.toggleBtn} ${mode === 'inventory' ? styles.toggleBtnActive : ''}`}
            onClick={() => setMode('inventory')}
          >
            <Layers size={14} />
            <span>From Kitchen Inventory</span>
          </button>
          <button
            type="button"
            className={`${styles.toggleBtn} ${mode === 'custom' ? styles.toggleBtnActive : ''}`}
            onClick={() => setMode('custom')}
          >
            <Sparkles size={14} />
            <span>Unlisted / Prepared Dish</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {mode === 'inventory' ? (
            <div className={styles.formGroup}>
              <label htmlFor="inventory-item-select" className={styles.label}>
                Select Inventory Ingredient <span className={styles.required}>*</span>
              </label>
              <select
                id="inventory-item-select"
                value={selectedInventoryId}
                onChange={handleInventorySelect}
                className={styles.input}
                disabled={inventoryLoading || preselectedItem !== null}
              >
                {inventoryList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.quantity} {item.unit} available) — {item.category}
                  </option>
                ))}
              </select>
              {activeInventoryItem && (
                <div className={styles.stockNotice}>
                  <Info size={13} />
                  <span>
                    Current stock: <strong>{activeInventoryItem.quantity} {activeInventoryItem.unit}</strong>.
                    Recording waste will atomically deduct from this balance.
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.grid2}>
              <div className={styles.formGroup}>
                <label htmlFor="custom-item-name" className={styles.label}>
                  Item / Dish Name <span className={styles.required}>*</span>
                </label>
                <input
                  id="custom-item-name"
                  type="text"
                  placeholder="e.g. Leftover Dal Tadka, White Rice"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="item-category" className={styles.label}>
                  Category
                </label>
                <select
                  id="item-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={styles.input}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Quantity & Unit */}
          <div className={styles.grid2}>
            <div className={styles.formGroup}>
              <label htmlFor="quantity-wasted" className={styles.label}>
                Discarded Quantity <span className={styles.required}>*</span>
              </label>
              <input
                id="quantity-wasted"
                type="number"
                step="any"
                min="0.01"
                placeholder="0.00"
                value={quantityWasted}
                onChange={(e) => setQuantityWasted(e.target.value)}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="unit-select" className={styles.label}>
                Unit of Measure
              </label>
              {mode === 'inventory' && activeInventoryItem ? (
                <input
                  id="unit-select"
                  type="text"
                  value={activeInventoryItem.unit}
                  disabled
                  className={`${styles.input} ${styles.inputDisabled}`}
                />
              ) : (
                <select
                  id="unit-select"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className={styles.input}
                >
                  {COMMON_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Waste Reason & Estimated Cost */}
          <div className={styles.grid2}>
            <div className={styles.formGroup}>
              <label htmlFor="waste-reason" className={styles.label}>
                Root Cause / Reason <span className={styles.required}>*</span>
              </label>
              <select
                id="waste-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={styles.input}
              >
                {REASON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="estimated-cost" className={styles.label}>
                Financial Loss (₹ INR) <span className={styles.optional}>Optional</span>
              </label>
              <div className={styles.currencyInputWrapper}>
                <span className={styles.currencyPrefix}>₹</span>
                <input
                  id="estimated-cost"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Auto-calculated if blank"
                  value={estimatedTotalCost}
                  onChange={(e) => setEstimatedTotalCost(e.target.value)}
                  className={`${styles.input} ${styles.inputWithCurrency}`}
                />
              </div>
              <span className={styles.fieldHint}>
                Auto-computed from latest grocery price records if left empty.
              </span>
            </div>
          </div>

          {/* Discarded Date & Notes */}
          <div className={styles.formGroup}>
            <label htmlFor="discarded-at" className={styles.label}>
              Discarded Date & Time
            </label>
            <input
              id="discarded-at"
              type="datetime-local"
              value={discardedAt}
              onChange={(e) => setDiscardedAt(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="waste-notes" className={styles.label}>
              Notes / Context <span className={styles.optional}>Optional</span>
            </label>
            <textarea
              id="waste-notes"
              rows="2"
              placeholder="e.g. Left at back of fridge, sour odor noticed"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={styles.textarea}
            />
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
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className={styles.spinner} />
                  <span>Logging Waste...</span>
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  <span>Confirm Discard & Deduct</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
