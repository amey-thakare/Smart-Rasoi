import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Package,
  ShoppingCart,
  Flame,
  Search,
  Filter,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import styles from './MealRequirementsView.module.css';

export default function MealRequirementsView({
  requirements = [],
  summary = {},
  loading = false,
  dateRangeLabel = ''
}) {
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'shortfall', 'expiring', 'sufficient'
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = requirements.filter((item) => {
    // Tab filter
    if (filterTab === 'shortfall') {
      if (item.status !== 'shortfall' && item.status !== 'missing' && item.status !== 'review_needed') return false;
    } else if (filterTab === 'expiring') {
      if (!item.mayExpireBeforeMeal) return false;
    } else if (filterTab === 'sufficient') {
      if (item.status !== 'sufficient') return false;
    }

    // Search query
    if (searchQuery.trim()) {
      return item.name.toLowerCase().includes(searchQuery.toLowerCase());
    }

    return true;
  });

  return (
    <div className={styles.container}>
      {/* Header Metric Cards */}
      <div className={styles.metricGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
            <Calendar size={18} />
          </div>
          <div className={styles.metricInfo}>
            <span className={styles.metricValue}>{summary.plannedMealsCount || 0}</span>
            <span className={styles.metricLabel}>Planned Meals</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
            <Layers size={18} />
          </div>
          <div className={styles.metricInfo}>
            <span className={styles.metricValue}>{summary.totalItemsNeeded || 0}</span>
            <span className={styles.metricLabel}>Ingredients Needed</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
            <CheckCircle2 size={18} />
          </div>
          <div className={styles.metricInfo}>
            <span className={styles.metricValue}>{summary.sufficientItemsCount || 0}</span>
            <span className={styles.metricLabel}>In Stock</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
            <ShoppingCart size={18} />
          </div>
          <div className={styles.metricInfo}>
            <span className={styles.metricValue}>{summary.shortfallItemsCount || 0}</span>
            <span className={styles.metricLabel}>Missing / Shortfall</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
            <Flame size={18} />
          </div>
          <div className={styles.metricInfo}>
            <span className={styles.metricValue}>{summary.expiringSoonCount || 0}</span>
            <span className={styles.metricLabel}>Expiring Ahead</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.tabGroup}>
          <button
            type="button"
            className={`${styles.tabBtn} ${filterTab === 'all' ? styles.tabActive : ''}`}
            onClick={() => setFilterTab('all')}
          >
            All Items ({requirements.length})
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${filterTab === 'shortfall' ? styles.tabActive : ''}`}
            onClick={() => setFilterTab('shortfall')}
          >
            <ShoppingCart size={13} />
            <span>Shortfalls to Buy ({summary.shortfallItemsCount || 0})</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${filterTab === 'expiring' ? styles.tabActive : ''}`}
            onClick={() => setFilterTab('expiring')}
          >
            <Flame size={13} />
            <span>Expiring Ahead ({summary.expiringSoonCount || 0})</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${filterTab === 'sufficient' ? styles.tabActive : ''}`}
            onClick={() => setFilterTab('sufficient')}
          >
            <span>In Stock ({summary.sufficientItemsCount || 0})</span>
          </button>
        </div>

        <div className={styles.toolbarRight}>
          <div className={styles.searchBox}>
            <Search size={15} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Filter ingredient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Link to="/shopping-list" className={styles.createShoppingListBtn}>
            <Sparkles size={14} />
            <span>Generate Shopping List</span>
          </Link>
        </div>
      </div>

      {/* Requirements Table */}
      {loading ? (
        <div className={styles.loadingBox}>
          <div className={styles.spinner} />
          <span>Calculating aggregated ingredient requirements...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className={styles.emptyBox}>
          <Package size={36} style={{ color: 'var(--text-muted)' }} />
          <h3>No ingredient requirements found</h3>
          <p>
            {requirements.length === 0
              ? 'No meals are currently scheduled in this period. Schedule meals in the Calendar view to see ingredient requirements.'
              : 'No items match your active search and filter criteria.'}
          </p>
        </div>
      ) : (
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Ingredient & Associated Meals</th>
                <th>Total Needed</th>
                <th>In Pantry</th>
                <th>Shortfall</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, idx) => (
                <tr key={idx} className={item.status === 'shortfall' || item.status === 'missing' ? styles.rowAlert : ''}>
                  <td>
                    <div className={styles.ingCol}>
                      <span className={styles.ingName}>{item.name}</span>
                      <div className={styles.mealsBadgeList}>
                        {item.meals?.map((m, mIdx) => (
                          <span key={mIdx} className={styles.mealBadge}>
                            {m.recipeTitle} ({m.quantity} {m.unit})
                          </span>
                        ))}
                      </div>
                      {item.mayExpireBeforeMeal && (
                        <div className={styles.expiryAlertRow}>
                          <Flame size={12} />
                          <span>Pantry item may expire before the planned meal date!</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <strong>{item.totalRequired}</strong> {item.unit}
                  </td>
                  <td>
                    <span>
                      {item.availableQuantity} {item.unit}
                    </span>
                    {item.inStockUnits?.length > 1 && (
                      <span className={styles.mixedUnits}>({item.inStockUnits.join(', ')})</span>
                    )}
                  </td>
                  <td>
                    {item.shortfall > 0 ? (
                      <span className={styles.shortfallValue}>
                        +{item.shortfall} {item.unit}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>0</span>
                    )}
                  </td>
                  <td>
                    {item.status === 'sufficient' ? (
                      <span className={styles.statusSuccess}>
                        <CheckCircle2 size={12} />
                        <span>In Stock</span>
                      </span>
                    ) : item.status === 'review_needed' ? (
                      <span className={styles.statusReview}>
                        <HelpCircle size={12} />
                        <span>Review Units</span>
                      </span>
                    ) : item.status === 'missing' ? (
                      <span className={styles.statusMissing}>
                        <ShoppingCart size={12} />
                        <span>Need to Buy</span>
                      </span>
                    ) : (
                      <span className={styles.statusShortfall}>
                        <AlertTriangle size={12} />
                        <span>Shortfall</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
