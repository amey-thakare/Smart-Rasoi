import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Plus, CheckCircle2 } from 'lucide-react';
import styles from './MealSchedulePreview.module.css';

export default function MealSchedulePreview({ schedule = [], loading = false, isLive = false }) {
  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Loading planned meals...
        </div>
      </div>
    );
  }

  if (schedule.length === 0) {
    return (
      <div className={styles.container}>
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <CalendarDays size={32} style={{ color: 'var(--text-muted)', opacity: 0.7 }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            No meals scheduled for this week
          </span>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '280px' }}>
            Plan breakfast, lunch, and dinner to automatically monitor ingredient requirements.
          </p>
          <Link to="/meal-planner" className="btn btn-primary" style={{ marginTop: '4px', fontSize: '0.8rem', padding: '6px 14px' }}>
            <Plus size={14} />
            <span>Open Meal Planner</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {schedule.map((dayGroup, idx) => (
        <div key={idx} className={styles.dayBlock}>
          <div className={styles.dayHeader}>
            <span className={styles.dayTitle}>{dayGroup.day}</span>
            <span className={styles.dateLabel}>{dayGroup.dateLabel}</span>
          </div>

          <div className={styles.mealsList}>
            {dayGroup.meals.map((meal, mIdx) => (
              <div key={mIdx} className={styles.mealCard}>
                <div className={styles.mealLeft}>
                  <span className={styles.typeBadge}>{meal.mealType}</span>
                  <div className={styles.mealInfo}>
                    <span className={styles.mealName}>{meal.title}</span>
                    <span className={styles.mealMeta}>
                      {meal.servings ? `${meal.servings} Servings` : meal.time || 'Planned'}
                    </span>
                  </div>
                </div>

                <div className={styles.mealRight}>
                  {meal.status === 'COOKED' ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--color-success)', fontSize: '0.75rem', fontWeight: 600 }}>
                      <CheckCircle2 size={12} />
                      <span>Cooked</span>
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Planned</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className={styles.footer}>
        <span>{isLive ? 'Live Weekly Schedule' : 'Weekly Meal Schedule'}</span>
        <Link to="/meal-planner" className={styles.planLink}>
          <span>Open Meal Planner</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
