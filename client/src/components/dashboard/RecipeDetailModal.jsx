import React, { useEffect } from 'react';
import { X, Sparkles, Clock, Flame, IndianRupee } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters.js';
import styles from './RecipeDetailModal.module.css';

export default function RecipeDetailModal({ recipe, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!recipe) return null;

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <h2 className={styles.title}>{recipe.title}</h2>
            <span className={styles.categoryTag}>{recipe.category} • {recipe.dietary}</span>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close recipe preview"
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          {/* Clear Phase 1 Scope Boundary Notice */}
          <div className={styles.bannerNotice}>
            <Sparkles size={20} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>Phase 1 Recipe Preview:</strong> This preview provides demonstration metadata.
              Full step-by-step interactive cooking guides, dynamic portion adjustment, and Gemini AI recipe variations will be integrated in Phase 2.
            </div>
          </div>

          <p>{recipe.description}</p>

          <div className={styles.estimateGrid}>
            <div className={styles.estimateItem}>
              <span>Est. Prep Time</span>
              <span>{recipe.prepTime}</span>
            </div>
            <div className={styles.estimateItem}>
              <span>Est. Calories</span>
              <span>~{recipe.calories} kcal</span>
            </div>
            <div className={styles.estimateItem}>
              <span>Est. Cost</span>
              <span>{formatCurrency(recipe.estimatedCost)}</span>
            </div>
          </div>

          <div>
            <h4 className={styles.sectionHeading}>Key Ingredients Included</h4>
            <div className={styles.ingredientsList}>
              {recipe.keyIngredients && recipe.keyIngredients.map((ing, i) => (
                <span key={i} className={styles.ingredientTag}>{ing}</span>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
