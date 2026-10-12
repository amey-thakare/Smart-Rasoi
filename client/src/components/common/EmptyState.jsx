import React from 'react';
import { Sparkles } from 'lucide-react';
import styles from './EmptyState.module.css';

export default function EmptyState({
  icon: Icon = Sparkles,
  title = 'No items found',
  description = 'There are currently no items to display in this section.',
  actionText,
  onAction
}) {
  return (
    <div className={styles.container}>
      <div className={styles.iconWrapper}>
        <Icon size={26} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {actionText && onAction && (
        <button type="button" className="btn btn-secondary" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
}
