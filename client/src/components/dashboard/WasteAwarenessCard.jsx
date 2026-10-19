import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Leaf,
  AlertTriangle,
  Clock,
  TrendingDown,
  ArrowRight,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import { fetchDashboardWasteSummary } from '../../services/api.js';
import styles from './WasteAwarenessCard.module.css';

export default function WasteAwarenessCard({ summary: propSummary = null }) {
  const [summary, setSummary] = useState(propSummary);
  const [loading, setLoading] = useState(!propSummary);

  useEffect(() => {
    if (propSummary) {
      setSummary(propSummary);
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function loadSummary() {
      try {
        const res = await fetchDashboardWasteSummary();
        if (isMounted && res?.data) {
          setSummary(res.data);
        }
      } catch (err) {
        console.error('Failed to load waste awareness summary:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSummary();
    return () => {
      isMounted = false;
    };
  }, [propSummary]);

  const hasUrgent = summary?.hasUrgentAttention;
  const expiredCount = summary?.expiredCount || 0;
  const expiringIn3Days = summary?.expiringIn3DaysCount || 0;
  const uncoveredCount = summary?.uncoveredAtRiskCount || 0;
  const monthCost = summary?.monthCost || 0;

  return (
    <div className={`${styles.card} ${hasUrgent ? styles.cardUrgent : ''}`}>
      <div className={`${styles.iconWrapper} ${hasUrgent ? styles.iconWrapperUrgent : ''}`}>
        {hasUrgent ? <AlertTriangle size={26} /> : <Leaf size={26} />}
      </div>

      <div className={styles.content}>
        <div className={styles.headerRow}>
          <h3 className={styles.title}>
            {hasUrgent
              ? 'Urgent Expiry Attention: Ingredients at Risk'
              : 'Mindful Kitchen: Prioritise Expiry First'}
          </h3>
          <span className={`${styles.badge} ${hasUrgent ? styles.badgeUrgent : ''}`}>
            {hasUrgent ? 'Action Required' : 'Sustainable Habit'}
          </span>
        </div>

        <p className={styles.text}>
          {hasUrgent
            ? `You have ingredients nearing or past expiry in your kitchen inventory. Cook with expiring ingredients first to prevent food waste and reduce grocery loss.`
            : `Household kitchens frequently discard good ingredients simply because they are forgotten. By actively monitoring freshness windows and planning meals around items with the shortest remaining shelf life, you keep ingredients in rotation and minimize preventable household waste.`}
        </p>

        {/* Live Metrics Row */}
        {summary && (
          <div className={styles.metricsGrid}>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Expired Stock</span>
              <span className={`${styles.metricVal} ${expiredCount > 0 ? styles.valDanger : ''}`}>
                {expiredCount} item(s)
              </span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Expiring in ≤ 3 Days</span>
              <span className={`${styles.metricVal} ${expiringIn3Days > 0 ? styles.valWarning : ''}`}>
                {expiringIn3Days} item(s)
              </span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Uncovered by Meal Plans</span>
              <span className={`${styles.metricVal} ${uncoveredCount > 0 ? styles.valWarning : ''}`}>
                {uncoveredCount} item(s)
              </span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>This Month's Waste Loss</span>
              <span className={styles.metricVal}>
                ₹{monthCost.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <div className={styles.footerRow}>
          <div className={styles.tipsGrid}>
            <div className={styles.tipItem}>
              <div className={styles.tipDot} />
              <span>Plan weekly menus around short-shelf-life produce</span>
            </div>
            <div className={styles.tipItem}>
              <div className={styles.tipDot} />
              <span>Store herbs and greens with proper moisture control</span>
            </div>
          </div>

          <Link to="/budget-waste" className={styles.viewHubBtn}>
            <span>Manage Expiry & Food Waste</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
