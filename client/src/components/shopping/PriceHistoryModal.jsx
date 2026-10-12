import React, { useState, useEffect } from 'react';
import {
  X,
  History,
  TrendingUp,
  Plus,
  IndianRupee,
  Search,
  Calendar,
  Store,
  CheckCircle2
} from 'lucide-react';
import { fetchIngredientPrices, recordIngredientPrice, fetchIngredientPriceTrends } from '../../services/api.js';
import { formatCurrency, formatDateDisplay } from '../../utils/formatters.js';
import styles from './PriceHistoryModal.module.css';

const COMMON_UNITS = ['kg', 'g', 'l', 'ml', 'piece', 'packet', 'bunch', 'cup', 'can'];

export default function PriceHistoryModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('prices'); // 'prices', 'trends', 'add'
  const [prices, setPrices] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  // Add price form state
  const [addName, setAddName] = useState('');
  const [addQuantity, setAddQuantity] = useState(1);
  const [addUnit, setAddUnit] = useState('kg');
  const [addTotalPrice, setAddTotalPrice] = useState('');
  const [addStore, setAddStore] = useState('');
  const [addNotes, setAddNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [pricesRes, trendsRes] = await Promise.all([
        fetchIngredientPrices({ search }),
        fetchIngredientPriceTrends()
      ]);
      if (pricesRes.success) setPrices(pricesRes.data?.prices || []);
      if (trendsRes.success) setTrends(trendsRes.data?.trends || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load price history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    loadData();
  }, [isOpen, search]);

  if (!isOpen) return null;

  const handleRecordPrice = async (e) => {
    e.preventDefault();
    if (!addName.trim()) {
      setError('Ingredient name is required.');
      return;
    }
    const qty = parseFloat(addQuantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }
    const price = parseFloat(addTotalPrice);
    if (isNaN(price) || price < 0) {
      setError('Total price must be a valid non-negative number.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMsg('');
    try {
      await recordIngredientPrice({
        ingredientName: addName.trim(),
        quantity: qty,
        unit: addUnit,
        totalPrice: price,
        store: addStore.trim() || null,
        notes: addNotes.trim() || null
      });
      setSuccessMsg(`Recorded price for "${addName.trim()}".`);
      setAddName('');
      setAddTotalPrice('');
      setAddStore('');
      setAddNotes('');
      await loadData();
      setActiveTab('prices');
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to record price.');
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
              <History size={20} />
            </div>
            <div>
              <h3>Ingredient Price History</h3>
              <span className={styles.subtitle}>Verified user-recorded prices and historical trends</span>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className={styles.tabsBar}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'prices' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('prices')}
          >
            Recent Prices ({prices.length})
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'trends' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('trends')}
          >
            Price Trends ({trends.length})
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'add' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('add')}
          >
            <Plus size={14} />
            <span>Record Price</span>
          </button>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}
        {successMsg && <div className={styles.successBox}>{successMsg}</div>}

        <div className={styles.body}>
          {activeTab === 'prices' && (
            <div className={styles.pricesTab}>
              <div className={styles.searchBox}>
                <Search size={15} className={styles.searchIcon} />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Filter by ingredient name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {loading ? (
                <div className={styles.loadingBox}>Loading price history...</div>
              ) : prices.length === 0 ? (
                <div className={styles.emptyNotice}>
                  No prices recorded yet. Prices are automatically tracked when you mark shopping list items as purchased,
                  or you can record them manually.
                </div>
              ) : (
                <div className={styles.tableCard}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Ingredient</th>
                        <th>Purchase Detail</th>
                        <th>Calculated Unit Price</th>
                        <th>Date & Store</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prices.map((p) => (
                        <tr key={p.id}>
                          <td>
                            <strong>{p.ingredientName}</strong>
                          </td>
                          <td>
                            {p.quantity} {p.unit} for {formatCurrency(p.totalPrice)}
                          </td>
                          <td>
                            <span className={styles.unitPriceBadge}>
                              {formatCurrency(p.unitPrice)} / {p.unit}
                            </span>
                          </td>
                          <td>
                            <div className={styles.dateCol}>
                              <span>{formatDateDisplay(p.purchaseDate || p.createdAt)}</span>
                              {p.store && <span className={styles.storeTag}>{p.store}</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'trends' && (
            <div className={styles.trendsTab}>
              {loading ? (
                <div className={styles.loadingBox}>Loading price trends...</div>
              ) : trends.length === 0 ? (
                <div className={styles.emptyNotice}>
                  Price trends will appear after you record multiple purchases for ingredients over time.
                </div>
              ) : (
                <div className={styles.trendsGrid}>
                  {trends.map((t, idx) => (
                    <div key={idx} className={styles.trendCard}>
                      <div className={styles.trendHeader}>
                        <strong>{t.ingredientName}</strong>
                        <span className={styles.trendCount}>{t.sampleCount} purchases</span>
                      </div>
                      <div className={styles.trendStats}>
                        <div className={styles.trendStat}>
                          <span>Latest</span>
                          <strong>{formatCurrency(t.latestUnitPrice)} / {t.unit}</strong>
                        </div>
                        <div className={styles.trendStat}>
                          <span>Average</span>
                          <strong>{formatCurrency(t.averageUnitPrice)} / {t.unit}</strong>
                        </div>
                      </div>
                      <div className={styles.trendFooter}>
                        <span>Range: {formatCurrency(t.minUnitPrice)} – {formatCurrency(t.maxUnitPrice)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'add' && (
            <form onSubmit={handleRecordPrice} className={styles.addForm}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Ingredient Name *</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Basmati Rice, Mustard Oil, Paneer"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  required
                />
              </div>

              <div className={styles.row}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Quantity *</label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    className={styles.input}
                    value={addQuantity}
                    onChange={(e) => setAddQuantity(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Unit *</label>
                  <select
                    className={styles.select}
                    value={addUnit}
                    onChange={(e) => setAddUnit(e.target.value)}
                  >
                    {COMMON_UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Total Price Paid (INR ₹) *</label>
                  <div className={styles.inputWithIcon}>
                    <span className={styles.currencyPrefix}>₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={styles.input}
                      placeholder="e.g. 180"
                      value={addTotalPrice}
                      onChange={(e) => setAddTotalPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Store / Source (Optional)</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. BigBasket, Local Market"
                    value={addStore}
                    onChange={(e) => setAddStore(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Notes / Brand (Optional)</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Fortune Biryani Special"
                  value={addNotes}
                  onChange={(e) => setAddNotes(e.target.value)}
                />
              </div>

              <div className={styles.actions}>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={submitting}
                >
                  <CheckCircle2 size={16} />
                  <span>{submitting ? 'Recording...' : 'Record Price'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.closeFooterBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
