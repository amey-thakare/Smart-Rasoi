import React from 'react';
import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import styles from './PlaceholderPage.module.css';

export default function PlaceholderPage({
  title,
  description,
  iconName = 'Layers',
  upcomingFeatures = [],
  phase = 'Phase 2'
}) {
  const IconComponent = Icons[iconName] || Icons.Layers;

  return (
    <div className={styles.container}>
      <div className={styles.iconWrapper}>
        <IconComponent size={32} />
      </div>

      <div className={styles.phaseBadge}>
        <Icons.Clock size={13} />
        <span>Planned for {phase}</span>
      </div>

      <h1 className={styles.title}>{title}</h1>
      <p className={styles.description}>{description}</p>

      {upcomingFeatures && upcomingFeatures.length > 0 && (
        <div className={styles.featuresCard}>
          <div className={styles.featuresHeading}>Upcoming Capabilities</div>
          <ul className={styles.featuresList}>
            {upcomingFeatures.map((feat, index) => (
              <li key={index} className={styles.featureItem}>
                <Icons.CheckCircle2 size={16} className={styles.featureCheck} />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.actions}>
        <Link to="/dashboard" className="btn btn-primary">
          <Icons.LayoutDashboard size={16} />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
