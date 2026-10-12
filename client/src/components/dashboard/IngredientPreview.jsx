import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, AlertTriangle, AlertCircle, Plus, Refrigerator } from 'lucide-react';
import { getItemExpiryStatus, getExpiryStatusMeta, getItemStockStatus } from '../../utils/formatters.js';
import styles from './IngredientPreview.module.css';

export default function IngredientPreview({ items = [], loading = false, error = null }) {
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.stateContainer}>
          <div className={styles.spinner} />
          <span>Loading kitchen inventory...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.stateContainer}>
          <AlertCircle size={24} className={styles.errorIcon} />
          <span>{error}</span>
          <Link to="/inventory" className="btn btn-secondary" style={{ marginTop: '8px' }}>
            Open Inventory
          </Link>
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyContainer}>
          <Refrigerator size={32} className={styles.emptyIcon} />
          <h4 className={styles.emptyTitle}>No ingredients logged yet</h4>
          <p className={styles.emptySubtitle}>
            Track pantry and fridge stock levels to receive automated expiry notifications.
          </p>
          <Link to="/inventory" className="btn btn-primary" style={{ marginTop: '8px' }}>
            <Plus size={16} />
            <span>Add First Ingredient</span>
          </Link>
        </div>
        <div className={styles.footer}>
          <span>Real-time kitchen inventory</span>
          <Link to="/inventory" className={styles.viewAllLink}>
            <span>Manage Inventory</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Ingredient</th>
              <th className={styles.th}>Category</th>
              <th className={styles.th}>Quantity</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Expiry</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              // Handle both DB item format (expiryDate) and mock item format (daysRemaining)
              const statusMeta = item.expiryDate !== undefined
                ? getItemExpiryStatus(item.expiryDate)
                : getExpiryStatusMeta(item.daysRemaining);

              const stockMeta = getItemStockStatus(item.quantity, item.minimumQuantity || 1);

              return (
                <tr key={item.id} className={styles.tr}>
                  <td className={styles.td}>
                    <div className={styles.itemName}>
                      <span
                        className={styles.statusIndicatorDot}
                        style={{ backgroundColor: statusMeta.color || statusMeta.indicatorColor }}
                        title={statusMeta.label}
                      />
                      <span>{item.name}</span>
                    </div>
                  </td>

                  <td className={styles.td}>
                    <span className={styles.categoryTag}>{item.category}</span>
                  </td>

                  <td className={styles.td}>
                    <span className={styles.quantity}>
                      {item.quantity} {item.unit}
                    </span>
                  </td>

                  <td className={styles.td}>
                    <span className={`badge ${stockMeta.isLow ? 'badge-danger' : 'badge-neutral'}`}>
                      {stockMeta.isLow && <AlertCircle size={10} />}
                      {stockMeta.label}
                    </span>
                  </td>

                  <td className={styles.td}>
                    <span className={`badge ${statusMeta.badgeClass}`}>
                      {statusMeta.urgent && <AlertTriangle size={12} />}
                      {statusMeta.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={styles.footer}>
        <span>Live inventory ({items.length} items shown)</span>
        <Link to="/inventory" className={styles.viewAllLink}>
          <span>View all inventory</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
