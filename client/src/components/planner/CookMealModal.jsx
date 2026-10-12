import React, { useState, useEffect } from 'react';
import {
  X,
  Utensils,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Loader2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { getCookPreview, cookMealPlan } from '../../services/api.js';
import styles from './CookMealModal.module.css';

export default function CookMealModal({
  isOpen,
  meal,
  onClose,
  onCooked
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);

  const [allowPartial, setAllowPartial] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && meal) {
      loadPreview();
      setAllowPartial(false);
    }
  }, [isOpen, meal]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, submitting]);

  if (!isOpen || !meal) return null;

  const loadPreview = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getCookPreview(meal.id);
      if (res.success && res.preview) {
        setPreview(res.preview);
        // If there is a shortfall, auto-suggest partial option
        if (res.preview.hasShortfall) {
          setAllowPartial(true);
        }
      } else {
        throw new Error(res.message || 'Failed to generate cook preview.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not load inventory preview.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCook = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await cookMealPlan(meal.id, { allowPartial });
      if (res.success) {
        if (onCooked) onCooked(res.mealPlan, res.deductions);
        onClose();
      } else {
        throw new Error(res.message || 'Failed to record cooked meal.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to deduct inventory.');
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
              <Utensils size={20} />
            </div>
            <div>
              <h2 className={styles.title}>Mark Meal as Cooked</h2>
              <p className={styles.subtitle}>Review inventory deductions before consuming stock</p>
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
          {/* Meal Info Card */}
          <div className={styles.mealSummaryCard}>
            <div>
              <h3 className={styles.mealRecipeTitle}>{meal.recipe?.title}</h3>
              <div className={styles.mealRecipeMeta}>
                <span>{meal.mealType}</span>
                <span>•</span>
                <span>{meal.scheduledDateStr || meal.scheduledDate?.split('T')[0]}</span>
                <span>•</span>
                <span>{meal.servings} Servings</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className={styles.loadingBox}>
              <Loader2 size={24} className="animate-spin" />
              <span>Checking pantry stock levels & ingredient requirements...</span>
            </div>
          ) : error && !preview ? (
            <div className={styles.errorAlert} role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          ) : preview ? (
            <div className={styles.previewContent}>
              {/* Overall Stock Status Banner */}
              {preview.canCookCompletely ? (
                <div className={styles.statusBannerSuccess}>
                  <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Pantry Fully Stocked!</strong> All {preview.ingredients?.length} required ingredients are available.
                  </div>
                </div>
              ) : preview.hasShortfall ? (
                <div className={styles.statusBannerWarning}>
                  <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Insufficient Pantry Stock.</strong> Some ingredients have a shortfall. You can choose partial deduction or restock first.
                  </div>
                </div>
              ) : (
                <div className={styles.statusBannerInfo}>
                  <HelpCircle size={18} style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Manual Review Needed.</strong> Unit measurements differ between recipe and pantry.
                  </div>
                </div>
              )}

              {/* Ingredient Deduction Table */}
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Ingredient</th>
                      <th>Needed</th>
                      <th>In Pantry</th>
                      <th>Will Deduct</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.ingredients.map((ing, idx) => {
                      return (
                        <tr key={idx} className={!ing.isSufficient ? styles.rowWarning : ''}>
                          <td>
                            <div className={styles.ingName}>
                              <span>{ing.name}</span>
                              {ing.isOptional && <span className={styles.optionalBadge}>Optional</span>}
                            </div>
                          </td>
                          <td>
                            <strong>{ing.requiredQuantity}</strong> {ing.unit}
                          </td>
                          <td>
                            {ing.inventoryItemId ? (
                              <span>
                                {ing.inventoryQuantity} {ing.inventoryUnit}
                              </span>
                            ) : (
                              <span className={styles.textMuted}>Not stocked</span>
                            )}
                          </td>
                          <td>
                            <span className={styles.willDeductBadge}>
                              -{ing.willDeduct} {ing.inventoryUnit || ing.unit}
                            </span>
                          </td>
                          <td>
                            {ing.isSufficient ? (
                              <span className={styles.badgeSuccess}>In Stock</span>
                            ) : ing.requiresReview ? (
                              <span className={styles.badgeReview}>Review Units</span>
                            ) : (
                              <span className={styles.badgeShortfall}>
                                Short: {ing.shortfall} {ing.unit}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Partial Fulfillment Checkbox */}
              {preview.hasShortfall && (
                <label className={styles.partialCheckboxLabel}>
                  <input
                    type="checkbox"
                    checked={allowPartial}
                    onChange={(e) => setAllowPartial(e.target.checked)}
                  />
                  <span>
                    Allow partial fulfillment (consume currently available pantry stock without failing)
                  </span>
                </label>
              )}

              {error && (
                <div className={styles.errorAlert} role="alert">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
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
            onClick={handleConfirmCook}
            disabled={loading || submitting || (preview?.hasShortfall && !allowPartial)}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Deducting Stock...</span>
              </>
            ) : (
              <>
                <Utensils size={15} />
                <span>Confirm & Deduct Inventory</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
