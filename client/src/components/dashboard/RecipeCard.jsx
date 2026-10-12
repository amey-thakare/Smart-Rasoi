import React, { useState } from 'react';
import { Clock, Flame, IndianRupee, Eye, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters.js';
import styles from './RecipeCard.module.css';

export default function RecipeCard({ recipe, onOpenDetails }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className={styles.card}>
      <div className={styles.imageWrapper}>
        {!imageError && recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className={styles.image}
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className={styles.imageFallback} aria-label={recipe.title}>
            <span>{recipe.fallbackEmoji || '🍳'}</span>
          </div>
        )}

        <span className={styles.categoryBadge}>{recipe.category}</span>
        {recipe.dietary && (
          <span className={styles.dietaryBadge}>{recipe.dietary}</span>
        )}
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{recipe.title}</h3>
        <p className={styles.description}>{recipe.description}</p>

        {recipe.utilizedFromStock && recipe.utilizedFromStock.length > 0 && (
          <div className={styles.stockMatch}>
            <CheckCircle2 size={13} />
            <span>Uses {recipe.utilizedFromStock.join(', ')} from your stock</span>
          </div>
        )}

        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Cook Time</span>
            <span className={styles.metaValue}>
              <Clock size={12} />
              {recipe.prepTime}
            </span>
          </div>

          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Est. Calories</span>
            <span className={styles.metaValue}>
              <Flame size={12} />
              ~{recipe.calories} kcal
            </span>
          </div>

          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Est. Cost</span>
            <span className={styles.metaValue}>
              <IndianRupee size={12} />
              {formatCurrency(recipe.estimatedCost)}
            </span>
          </div>
        </div>

        <button
          type="button"
          className={styles.actionButton}
          onClick={() => onOpenDetails && onOpenDetails(recipe)}
        >
          <Eye size={15} />
          <span>View Recipe Preview</span>
        </button>
      </div>
    </div>
  );
}
