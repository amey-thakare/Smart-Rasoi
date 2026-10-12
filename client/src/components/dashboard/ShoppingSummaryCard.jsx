import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  PiggyBank,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
  Sparkles,
  IndianRupee
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters.js';
import styles from './ShoppingSummaryCard.module.css';

export default function ShoppingSummaryCard({ summary = {}, loading = false }) {
  if (loading) {
    return (
      <div className={styles.card}>
        <div className={styles.loadingBox}>
          <div className={styles.spinner} />
          <span>Loading grocery budget & shopping metrics...</span>
        </div>
      </div>
    );
  }

  const activeList = summary.activeShoppingList;
  const monthlySpent = summary.monthlySpent || 0;
  const monthlyBudget = summary.monthlyBudget;
  const pendingCount = summary.pendingItemsCount || 0;
  const estimatedCost = summary.estimatedPendingCost || 0;
  const recentPurchases = summary.recentPurchases || [];

  const budgetPct = monthlyBudget ? Math.min(Math.round((monthlySpent / monthlyBudget) * 100), 100) : 0;
  const isOverMonthly = monthlyBudget && monthlySpent > monthlyBudget;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.iconWrapper}>
            <ShoppingCart size={18} />
          </div>
          <div>
            <h3 className={styles.title}>Grocery Budget & Shopping</h3>
            <span className={styles.subtitle}>Current cycle expenses and pending shopping runs</span>
          </div>
        </div>

        <Link to="/shopping-list" className={styles.viewLink}>
          <span>View Lists</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className={styles.content}>
        {/* Metric stat pill row */}
        <div className={styles.metricsRow}>
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>To Purchase</span>
            <strong className={styles.metricValue}>{pendingCount} items</strong>
            <span className={styles.metricSub}>Est: {formatCurrency(estimatedCost)}</span>
          </div>

          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Monthly Spent</span>
            <strong className={styles.metricValue}>{formatCurrency(monthlySpent)}</strong>
            <span className={styles.metricSub}>
              {monthlyBudget ? `of ${formatCurrency(monthlyBudget)} limit` : 'No monthly limit'}
            </span>
          </div>

          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Active Lists</span>
            <strong className={styles.metricValue}>{summary.activeListsCount || 0} active</strong>
            <span className={styles.metricSub}>{summary.completedListsCount || 0} completed</span>
          </div>
        </div>

        {/* Monthly Budget Bar if monthly budget set */}
        {monthlyBudget && (
          <div className={styles.budgetProgressSection}>
            <div className={styles.budgetProgressHeader}>
              <span>Monthly Budget Utilisation</span>
              <strong style={{ color: isOverMonthly ? '#dc2626' : '#059669' }}>
                {budgetPct}% {isOverMonthly ? '(Exceeded)' : ''}
              </strong>
            </div>
            <div className={styles.progressBarWrapper}>
              <div
                className={`${styles.progressBar} ${
                  isOverMonthly ? styles.barDanger : budgetPct > 80 ? styles.barWarning : styles.barSuccess
                }`}
                style={{ width: `${budgetPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Active list focus / recent items */}
        {activeList ? (
          <div className={styles.activeListSection}>
            <div className={styles.activeListHeader}>
              <div>
                <span className={styles.activeTag}>Current List</span>
                <strong className={styles.activeListName}>{activeList.name}</strong>
              </div>
              <Link to="/shopping-list" className={styles.openListBtn}>
                <span>Manage</span>
                <ArrowRight size={13} />
              </Link>
            </div>
            <div className={styles.activeListStats}>
              <span>{activeList.pendingCount || 0} items remaining to buy</span>
              <span>Est: {formatCurrency(activeList.estimatedTotal)}</span>
              <span>Spent: {formatCurrency(activeList.actualSpent)}</span>
            </div>
          </div>
        ) : (
          <div className={styles.noActiveSection}>
            <p>No active shopping lists. Generate items from your meal schedule to stay on top of ingredients.</p>
            <Link to="/shopping-list" className={styles.createBtn}>
              <Sparkles size={14} />
              <span>Create / Generate List</span>
            </Link>
          </div>
        )}

        {/* Recent purchases preview */}
        {recentPurchases.length > 0 && (
          <div className={styles.recentSection}>
            <span className={styles.recentTitle}>Recently Purchased</span>
            <div className={styles.recentChips}>
              {recentPurchases.slice(0, 4).map((item, idx) => (
                <span key={idx} className={styles.recentChip}>
                  <CheckCircle2 size={12} className={styles.recentIcon} />
                  {item.name} ({item.quantity} {item.unit})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
