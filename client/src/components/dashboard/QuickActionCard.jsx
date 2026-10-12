import React from 'react';
import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import styles from './QuickActionCard.module.css';

export default function QuickActionCard({
  title,
  description,
  path,
  iconName = 'PlusCircle',
  badgeText
}) {
  const IconComponent = Icons[iconName] || Icons.ArrowRight;

  return (
    <Link to={path} className={styles.card}>
      <div className={styles.iconWrapper}>
        <IconComponent size={22} />
      </div>

      <div className={styles.content}>
        <div className={styles.headerRow}>
          <span className={styles.title}>{title}</span>
          {badgeText && <span className={styles.badge}>{badgeText}</span>}
        </div>
        <p className={styles.description}>{description}</p>
      </div>

      <Icons.ChevronRight size={18} className={styles.arrow} />
    </Link>
  );
}
