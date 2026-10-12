import React from 'react';
import { Leaf } from 'lucide-react';
import styles from './WasteAwarenessCard.module.css';

export default function WasteAwarenessCard() {
  return (
    <div className={styles.card}>
      <div className={styles.iconWrapper}>
        <Leaf size={26} />
      </div>

      <div className={styles.content}>
        <div className={styles.headerRow}>
          <h3 className={styles.title}>Mindful Kitchen: Prioritise Expiry First</h3>
          <span className={styles.badge}>Sustainable Habit</span>
        </div>

        <p className={styles.text}>
          Household kitchens frequently discard perfectly good ingredients simply because they are forgotten in the crisper drawer or rear pantry shelves. By actively monitoring freshness windows and planning meals around items with the shortest remaining shelf life, you keep ingredients in rotation and minimize preventable household waste.
        </p>

        <div className={styles.tipsGrid}>
          <div className={styles.tipItem}>
            <div className={styles.tipDot} />
            <span>Plan weekly menus around short-shelf-life produce</span>
          </div>
          <div className={styles.tipItem}>
            <div className={styles.tipDot} />
            <span>Store herbs and greens with proper moisture control</span>
          </div>
          <div className={styles.tipItem}>
            <div className={styles.tipDot} />
            <span>Turn ripe vegetables into soups, stews, and purees</span>
          </div>
        </div>
      </div>
    </div>
  );
}
