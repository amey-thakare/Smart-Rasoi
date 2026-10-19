import React from 'react';
import { Link } from 'react-router-dom';
import { Apple, Flame, Dna, ArrowRight, Target, Plus, CheckCircle2 } from 'lucide-react';
import styles from './NutritionSummaryCard.module.css';

export default function NutritionSummaryCard({ summary, loading }) {
  if (loading) {
    return (
      <div className={styles.loadingCard}>
        <Apple size={20} className={styles.loadingIcon} />
        <span>Loading daily nutritional intake...</span>
      </div>
    );
  }

  const calToday = summary?.caloriesToday || 0;
  const proToday = summary?.proteinToday || 0;
  const calTarget = summary?.calorieTarget;
  const proTarget = summary?.proteinTarget;
  const calPct = summary?.calorieProgressPercent ?? (calTarget ? Math.min(100, Math.round((calToday / calTarget) * 100)) : null);
  const mealsCount = summary?.mealsLoggedToday || 0;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.titleGroup}>
          <div className={styles.iconCircle}>
            <Apple size={20} className={styles.appleIcon} />
          </div>
          <div>
            <h3 className={styles.cardTitle}>Today's Nutrition & Intake</h3>
            <span className={styles.cardSubtitle}>
              {mealsCount > 0
                ? `${mealsCount} meal${mealsCount !== 1 ? 's' : ''} recorded today`
                : 'No meals logged yet today'}
            </span>
          </div>
        </div>

        <Link to="/nutrition" className={styles.viewLink}>
          <span>Details</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className={styles.metricsRow}>
        {/* Calorie Card */}
        <div className={styles.metricBlock}>
          <div className={styles.metricLabelRow}>
            <div className={styles.metricIconWrap}>
              <Flame size={15} className={styles.flameIcon} />
              <span className={styles.metricLabel}>Energy</span>
            </div>
            {calPct !== null && (
              <span className={styles.pctBadge}>{calPct}%</span>
            )}
          </div>

          <div className={styles.metricValueWrap}>
            <strong className={styles.metricBigVal}>{calToday}</strong>
            <span className={styles.metricUnit}>kcal</span>
            {calTarget && (
              <span className={styles.targetSub}>/ {calTarget}</span>
            )}
          </div>

          {calTarget ? (
            <div className={styles.barBg}>
              <div
                className={styles.barFill}
                style={{
                  width: `${Math.min(100, calPct)}%`,
                  backgroundColor: calToday > calTarget + 100 ? '#F59E0B' : '#1B4332'
                }}
              />
            </div>
          ) : (
            <span className={styles.noGoalNote}>No goal set</span>
          )}
        </div>

        {/* Protein Card */}
        <div className={styles.metricBlock}>
          <div className={styles.metricLabelRow}>
            <div className={styles.metricIconWrap}>
              <Dna size={15} className={styles.dnaIcon} />
              <span className={styles.metricLabel}>Protein</span>
            </div>
            {proTarget && (
              <span className={styles.pctBadge}>
                {Math.min(100, Math.round((proToday / proTarget) * 100))}%
              </span>
            )}
          </div>

          <div className={styles.metricValueWrap}>
            <strong className={styles.metricBigVal}>{proToday}</strong>
            <span className={styles.metricUnit}>g</span>
            {proTarget && (
              <span className={styles.targetSub}>/ {proTarget}g</span>
            )}
          </div>

          {proTarget ? (
            <div className={styles.barBg}>
              <div
                className={styles.barFill}
                style={{
                  width: `${Math.min(100, (proToday / proTarget) * 100)}%`,
                  backgroundColor: '#3B82F6'
                }}
              />
            </div>
          ) : (
            <span className={styles.noGoalNote}>No goal set</span>
          )}
        </div>
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.footerNote}>
          {mealsCount > 0 ? (
            <span>Snapshot automatically recorded from cooking & food logs</span>
          ) : (
            <span>Cooking planned meals will automatically snapshot calories & macros</span>
          )}
        </div>
        <Link to="/nutrition" className={styles.logActionBtn}>
          <Plus size={13} />
          <span>Log Meal</span>
        </Link>
      </div>
    </div>
  );
}
