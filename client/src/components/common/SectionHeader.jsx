import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import styles from './SectionHeader.module.css';

export default function SectionHeader({
  title,
  subtitle,
  actionText,
  actionTo,
  onActionClick,
  badge
}) {
  return (
    <div className={styles.container}>
      <div className={styles.textGroup}>
        <h2 className={styles.title}>
          {title}
          {badge && <span className="badge badge-neutral">{badge}</span>}
        </h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>

      {actionText && actionTo && (
        <Link to={actionTo} className={styles.action}>
          <span>{actionText}</span>
          <ArrowRight size={16} />
        </Link>
      )}

      {actionText && !actionTo && onActionClick && (
        <button type="button" onClick={onActionClick} className={styles.action}>
          <span>{actionText}</span>
          <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
}
