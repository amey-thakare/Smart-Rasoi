import React, { useState, useEffect } from 'react';
import {
  X,
  Shuffle,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
  Loader2,
  Sparkles
} from 'lucide-react';
import { suggestSubstitutionsApi } from '../../services/api.js';
import styles from './AiSubstitutionModal.module.css';

const REASON_OPTIONS = [
  'Out of stock',
  'Vegetarian / Vegan',
  'Dairy allergy / Lactose intolerance',
  'Gluten allergy / Celiac',
  'Nut allergy',
  'Lower calorie / Healthy alternative',
  'Personal preference'
];

export default function AiSubstitutionModal({
  isOpen,
  onClose,
  initialIngredient = '',
  recipeId = null
}) {
  const [ingredientName, setIngredientName] = useState(initialIngredient || '');
  const [reason, setReason] = useState('Out of stock');
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (initialIngredient) {
      setIngredientName(initialIngredient);
      // Auto-trigger search if initialIngredient is provided
      fetchSubstitutions(initialIngredient, reason);
    } else {
      setResult(null);
      setError(null);
    }
  }, [initialIngredient, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const fetchSubstitutions = async (nameToSearch, currentReason) => {
    const trimmed = (nameToSearch || ingredientName).trim();
    if (!trimmed) {
      setError('Please enter an ingredient name.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await suggestSubstitutionsApi({
        ingredientName: trimmed,
        recipeId,
        reason: currentReason || reason,
        dietaryRestrictions: dietaryRestrictions.trim() || undefined
      });

      if (res.success) {
        setResult(res);
      } else {
        throw new Error(res.message || 'Failed to fetch substitutions.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error communicating with AI service.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    fetchSubstitutions(ingredientName, reason);
  };

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <Shuffle size={20} />
            </div>
            <div>
              <h2 className={styles.title}>Ingredient Substitutions</h2>
              <p className={styles.subtitle}>Smart, culinary-tested alternatives powered by AI</p>
            </div>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          <form onSubmit={handleFormSubmit} className={styles.formArea}>
            <div className={styles.inputGrid}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Ingredient to Replace</label>
                <input
                  type="text"
                  className={styles.input}
                  value={ingredientName}
                  onChange={(e) => setIngredientName(e.target.value)}
                  placeholder="e.g. Buttermilk, Heavy Cream, Egg..."
                  required
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Primary Reason</label>
                <select
                  className={styles.select}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                >
                  {REASON_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
              <button
                type="submit"
                className={styles.searchBtn}
                disabled={loading || !ingredientName.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Analyzing culinary substitutes...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Find Substitutions</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="alert alert-danger" style={{ margin: '8px 0', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div className={styles.resultsList}>
              {result.culinaryRole && (
                <div className={styles.roleCard}>
                  <div className={styles.roleTitle}>Culinary Function of {result.ingredient}:</div>
                  <div>{result.culinaryRole}</div>
                </div>
              )}

              {result.substitutions?.length > 0 ? (
                result.substitutions.map((sub, idx) => (
                  <div key={idx} className={styles.subCard}>
                    <div className={styles.subHeader}>
                      <span className={styles.subName}>{sub.substitute}</span>
                      {sub.inInventory && (
                        <span className={styles.pantryBadge}>
                          <CheckCircle2 size={12} />
                          <span>In Your Pantry</span>
                        </span>
                      )}
                    </div>

                    <div className={styles.ratioBadge}>
                      Conversion: {sub.ratio}
                    </div>

                    <div className={styles.subDetails}>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Taste & Texture:</span>
                        <span>{sub.tasteAndTextureImpact}</span>
                      </div>

                      {sub.cookingAdjustments && sub.cookingAdjustments !== 'None' && (
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Adjustments:</span>
                          <span>{sub.cookingAdjustments}</span>
                        </div>
                      )}

                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Dietary Match:</span>
                        <span>{sub.dietarySuitability}</span>
                      </div>

                      {sub.allergyWarnings && (
                        <div className={styles.allergyAlert}>
                          <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                          <span>{sub.allergyWarnings}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px 0' }}>
                  No common substitutes found for this ingredient.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
