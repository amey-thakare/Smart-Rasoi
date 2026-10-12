import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Package
} from 'lucide-react';
import { reverseMealPlanConsumption } from '../../services/api.js';
import styles from './ReverseConsumptionModal.module.css';

export default function ReverseConsumptionModal({
  isOpen,
  meal,
  onClose,
  onReversed
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !meal) return null;

  const consumptions = meal.consumptions?.filter((c) => !c.isReversed) || [];

  const handleConfirmReversal = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await reverseMealPlanConsumption(meal.id);
      if (res.success) {
        if (onReversed) onReversed(res.mealPlan, res.restoredSummary);
        onClose();
      } else {
        throw new Error(res.message || 'Failed to reverse meal consumption.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error reversing consumption.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={() => !submitting && onClose()} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <RotateCcw size={20} />
            </div>
            <div>
              <h2 className={styles.title}>Revert Cooked Meal</h2>
              <p className={styles.subtitle}>Restore deducted quantities back to pantry stock</p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            disabled={submitting}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          <div className={styles.warningBanner}>
            <AlertTriangle size={20} style={{ flexShrink: 0 }} />
            <div>
              <strong>Are you sure you want to revert this cooked meal?</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem' }}>
                This will restore the deducted ingredients back to your pantry stock and change the meal status back to <strong>PLANNED</strong>.
              </p>
            </div>
          </div>

          <div className={styles.mealCard}>
            <div className={styles.mealTitle}>{meal.recipe?.title}</div>
            <div className={styles.mealMeta}>
              <span>{meal.mealType}</span>
              <span>•</span>
              <span>{meal.scheduledDateStr || meal.scheduledDate?.split('T')[0]}</span>
              <span>•</span>
              <span>{meal.servings} Servings</span>
            </div>
          </div>

          {consumptions.length > 0 && (
            <div className={styles.deductionsBox}>
              <h4 className={styles.deductionsTitle}>
                <Package size={14} />
                <span>Ingredients to be Restored to Pantry:</span>
              </h4>
              <ul className={styles.deductionsList}>
                {consumptions.map((c, idx) => (
                  <li key={idx} className={styles.deductionItem}>
                    <span>{c.ingredientName}</span>
                    <strong style={{ color: 'var(--color-success)' }}>
                      +{c.quantityDeducted} {c.unit}
                    </strong>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <div className="alert alert-danger" style={{ fontSize: '0.85rem' }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConfirmReversal}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Restoring Stock...</span>
              </>
            ) : (
              <>
                <RotateCcw size={15} />
                <span>Restore to Pantry & Revert</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
