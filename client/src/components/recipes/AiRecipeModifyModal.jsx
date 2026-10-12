import React, { useState, useEffect } from 'react';
import {
  X,
  Wand2,
  Sparkles,
  Clock,
  Users,
  Flame,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Save,
  RotateCcw,
  Edit2
} from 'lucide-react';
import { modifyAiRecipeApi } from '../../services/api.js';
import styles from './AiRecipeModifyModal.module.css';

const PRESETS = [
  { id: 'vegetarian', label: '🥗 Make Vegetarian', desc: 'Swap meats with paneer, tofu, or mushrooms' },
  { id: 'high-protein', label: '💪 High Protein', desc: 'Boost protein with legumes, paneer, or soy' },
  { id: 'quicker', label: '⚡ Quicker (<20m)', desc: 'Streamline techniques to save time' },
  { id: 'less-spicy', label: '🌶️ Less Spicy / Mild', desc: 'Reduce heat for sensitive palates or kids' },
  { id: 'adapt-to-inventory', label: '🧺 Adapt to My Pantry', desc: 'Swap missing items with available stock' },
  { id: 'gluten-free', label: '🌾 Gluten-Free', desc: 'Eliminate wheat/maida with safe grains' }
];

export default function AiRecipeModifyModal({
  isOpen,
  recipe,
  onClose,
  onSaveAsNew,
  onUpdateOriginal,
  onEditBeforeSaving
}) {
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [customRequest, setCustomRequest] = useState('');
  const [targetServings, setTargetServings] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modificationResult, setModificationResult] = useState(null);
  const [showConfirmUpdate, setShowConfirmUpdate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedPreset(null);
      setCustomRequest('');
      setTargetServings(recipe?.servings ? String(recipe.servings) : '2');
      setModificationResult(null);
      setError(null);
      setShowConfirmUpdate(false);
    }
  }, [isOpen, recipe]);

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

  if (!isOpen || !recipe) return null;

  const handlePresetClick = (presetId) => {
    if (selectedPreset === presetId) {
      setSelectedPreset(null);
    } else {
      setSelectedPreset(presetId);
    }
  };

  const handleModifySubmit = async (e) => {
    e.preventDefault();
    if (!selectedPreset && !customRequest.trim()) {
      setError('Please choose a modification style or enter a custom request.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await modifyAiRecipeApi(recipe.id, {
        modificationType: selectedPreset || 'custom',
        customRequest: customRequest.trim() || undefined,
        targetServings: targetServings ? parseInt(targetServings, 10) : undefined
      });

      if (res.success) {
        setModificationResult(res);
      } else {
        throw new Error(res.message || 'Failed to modify recipe.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error communicating with AI service.');
    } finally {
      setLoading(false);
    }
  };

  const canUpdateOriginal = modificationResult?.originalRecipe?.canUpdateOriginal;

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <Wand2 size={20} />
            </div>
            <div>
              <h2 className={styles.title}>Modify Recipe with AI</h2>
              <p className={styles.subtitle}>Transform and customize dishes using Chef Gemini</p>
            </div>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Original Recipe Banner */}
          <div className={styles.originalCard}>
            <div>
              <div className={styles.originalTitle}>{recipe.title}</div>
              <div className={styles.originalMeta}>
                <span>{recipe.category}</span>
                <span>•</span>
                <span>{recipe.servings} Servings</span>
                <span>•</span>
                <span>{(recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)} mins</span>
              </div>
            </div>
            {recipe.isPublic && (
              <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>
                Shared Catalog Recipe
              </span>
            )}
          </div>

          {!modificationResult ? (
            /* Modification Input Form */
            <form onSubmit={handleModifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className={styles.presetSection}>
                <label className={styles.presetLabel}>Quick Transformation Styles</label>
                <div className={styles.presetGrid}>
                  {PRESETS.map((p) => {
                    const isActive = selectedPreset === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className={`${styles.presetChip} ${isActive ? styles.presetChipActive : ''}`}
                        onClick={() => handlePresetClick(p.id)}
                        title={p.desc}
                      >
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Custom Instructions or Ingredient Replacements</label>
                <textarea
                  className={styles.textarea}
                  value={customRequest}
                  onChange={(e) => setCustomRequest(e.target.value)}
                  placeholder="e.g. 'Replace paneer with firm tofu and reduce salt', 'Make it creamy without dairy', 'Include extra bell peppers'..."
                />
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '140px' }} className={styles.fieldGroup}>
                  <label className={styles.label}>Target Servings</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    className="form-input"
                    value={targetServings}
                    onChange={(e) => setTargetServings(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="alert alert-danger" style={{ fontSize: '0.85rem' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ alignSelf: 'flex-start' }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Chef Gemini is modifying recipe...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate Modified Recipe</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Modified Recipe Review */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Changes Summary Banner */}
              <div className={styles.summaryBanner}>
                <Sparkles size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div className={styles.summaryTitle}>Culinary Modifications Applied:</div>
                  <div>{modificationResult.changesSummary}</div>
                </div>
              </div>

              {/* Modified Recipe Preview Card */}
              <div className={styles.previewSection}>
                <div className={styles.previewHeader}>
                  <h3 className={styles.previewTitle}>
                    {modificationResult.modifiedRecipe.title}
                  </h3>
                  <div className={styles.previewBadges}>
                    <span className={styles.badge}>
                      <Clock size={12} style={{ marginRight: '4px', verticalAlign: '-1px' }} />
                      {modificationResult.modifiedRecipe.totalTimeMinutes} mins
                    </span>
                    <span className={styles.badge}>
                      <Users size={12} style={{ marginRight: '4px', verticalAlign: '-1px' }} />
                      {modificationResult.modifiedRecipe.servings} Servings
                    </span>
                    <span className={styles.badge}>
                      {modificationResult.modifiedRecipe.difficulty}
                    </span>
                  </div>
                </div>

                {modificationResult.modifiedRecipe.description && (
                  <p style={{ margin: '4px 0 8px 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {modificationResult.modifiedRecipe.description}
                  </p>
                )}

                <div>
                  <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, margin: '8px 0 4px 0' }}>
                    Modified Ingredients ({modificationResult.modifiedRecipe.ingredients?.length})
                  </h4>
                  <div className={styles.ingredientsGrid}>
                    {modificationResult.modifiedRecipe.ingredients.map((ing, idx) => (
                      <div key={idx} className={styles.ingredientChip}>
                        <span>{ing.name}</span>
                        <span style={{ fontWeight: 600 }}>{ing.quantity} {ing.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, margin: '8px 0 4px 0' }}>
                    Updated Cooking Instructions
                  </h4>
                  <div className={styles.instructionsBox}>
                    {modificationResult.modifiedRecipe.instructions}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          {!modificationResult ? (
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setModificationResult(null)}
              >
                <RotateCcw size={14} />
                <span>Change Request</span>
              </button>

              <div className={styles.footerActions}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onEditBeforeSaving(modificationResult.modifiedRecipe)}
                >
                  <Edit2 size={14} />
                  <span>Edit Details</span>
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => onSaveAsNew(modificationResult.modifiedRecipe)}
                >
                  <Save size={14} />
                  <span>Save as New Recipe</span>
                </button>

                {canUpdateOriginal && (
                  <>
                    {!showConfirmUpdate ? (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ borderColor: 'var(--color-warning)', color: 'var(--color-warning-text)' }}
                        onClick={() => setShowConfirmUpdate(true)}
                        title="Update existing recipe in place"
                      >
                        Update Existing
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => onUpdateOriginal(recipe.id, modificationResult.modifiedRecipe)}
                      >
                        Confirm In-Place Update
                      </button>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
