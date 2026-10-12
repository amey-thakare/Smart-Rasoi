import React from 'react';
import * as Icons from 'lucide-react';
import styles from './StatCard.module.css';

export default function StatCard({
  title,
  value,
  description,
  iconName = 'PackageOpen',
  trend,
  isPositive,
  isWarning,
  isNeutral,
  badge = null
}) {
  const IconComponent = Icons[iconName] || Icons.CircleDot;

  let iconStyle = styles.iconWrapper;
  if (isWarning) iconStyle += ` ${styles.iconWarning}`;
  else if (isPositive) iconStyle += ` ${styles.iconPositive}`;
  else if (isNeutral) iconStyle += ` ${styles.iconNeutral}`;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={iconStyle}>
          <IconComponent size={22} strokeWidth={2.2} />
        </div>
        {badge && <span className={styles.demoBadge}>{badge}</span>}
      </div>

      <div className={styles.content}>
        <span className={styles.title}>{title}</span>
        <div className={styles.value}>{value}</div>
      </div>

      <div className={styles.footer}>
        <span>{description}</span>
        {trend && (
          <span
            className={`${styles.trendText} ${
              isWarning ? styles.trendWarning : isPositive ? styles.trendPositive : ''
            }`}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
