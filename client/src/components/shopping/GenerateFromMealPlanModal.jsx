import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ShoppingCart,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { fetchMealPlanRequirements } from '../../services/api.js';
import styles from './GenerateFromMealPlanModal.module.css';

export default function GenerateFromMealPlanModal({
  isOpen,
  onClose,
  onGenerate,
  existingLists = [],
  activeListId = null
}) {
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getSevenDaysAheadStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  };

  const [startDate, setStartDate] = useState(getTodayStr());
  const [endDate, setEndDate] = useState(getSevenDaysAheadStr());
  const [mode, setMode] = useState(activeListId ? 'existing' : 'new'); // 'new' or 'existing'
  const [targetListId, setTargetListId] = useState(activeListId || (existingLists[0]?.id || ''));
  const [newListName, setNewListName] = useState(`Meal Plan Groceries (${new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })})`);
  const [budget, setBudget] = useState('');

  // Preview state
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewError, setPreviewError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Auto-fetch preview on open or date change
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadPreview = async () => {
      setPreviewLoading(true);
      setPreviewError('');
      try {
        const res = await fetchMealPlanRequirements({ startDate, endDate });
        if (isMounted) {
          if (res.success && res.data) {
            setPreviewData(res.data);
          } else {
            setPreviewData(null);
          }
        }
      } catch (err) {
        if (isMounted) {
          setPreviewError(err?.response?.data?.message || 'Failed to calculate ingredient requirements for date range.');
        }
      } finally {
        if (isMounted) setPreviewLoading(false);
      }
    };

    loadPreview();
    return () => {
      isMounted = false;
    };
  }, [isOpen, startDate, endDate]);

  if (!isOpen) return null;

  const handleGenerateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setPreviewError('');
    try {
      const payload = {
        startDate,
        endDate
      };

      if (mode === 'existing') {
        if (!targetListId) {
          setPreviewError('Please select a target shopping list.');
          setSubmitting(false);
          return;
        }
        payload.targetListId = targetListId;
      } else {
        if (!newListName.trim()) {
          setPreviewError('Please specify a name for the new shopping list.');
          setSubmitting(false);
          return;
        }
        payload.listName = newListName.trim();
        if (budget !== '') {
          payload.budget = parseFloat(budget) || null;
        }
      }

      await onGenerate(payload);
      onClose();
    } catch (err) {
      setPreviewError(err?.response?.data?.message || err.message || 'Failed to generate shopping list.');
    } finally {
      setSubmitting(false);
    }
  };

  const shortfalls = previewData?.requirements?.filter(
    (r) => r.status === 'shortfall' || r.status === 'missing' || r.status === 'review_needed'
  ) || [];

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <div className={styles.headerIcon}>
              <Sparkles size={20} />
            </div>
            <div>
              <h3>Compile List from Meal Plan</h3>
              <span className={styles.subtitle}>
                Automatically calculate shortfalls from scheduled meals without duplicating pantry stock.
              </span>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {previewError && <div className={styles.errorBox}>{previewError}</div>}

        <form onSubmit={handleGenerateSubmit} className={styles.form}>
          {/* Date range picker */}
          <div className={styles.dateRow}>
            <div className={styles.fieldGroup}>
              <label htmlFor="gen-start-date" className={styles.label}>
                Start Date
              </label>
              <input
                id="gen-start-date"
                type="date"
                className={styles.input}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className={styles.fieldGroup}>
              <label htmlFor="gen-end-date" className={styles.label}>
                End Date
              </label>
              <input
                id="gen-end-date"
                type="date"
                className={styles.input}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Shortfalls preview card */}
          <div className={styles.previewContainer}>
            <div className={styles.previewHeader}>
              <span className={styles.previewTitle}>Shortfall Analysis Preview</span>
              {previewLoading && <span className={styles.loadingChip}>Calculating...</span>}
            </div>

            {previewLoading ? (
              <div className={styles.skeletonBox}>
                <div className={styles.spinner} />
                <span>Aggregating scheduled recipe ingredient requirements against live pantry...</span>
              </div>
            ) : previewData ? (
              <div className={styles.previewStats}>
                <div className={styles.statPill}>
                  <Calendar size={14} />
                  <span>{previewData.summary?.plannedMealsCount || 0} Planned Meals</span>
                </div>
                <div className={styles.statPill}>
                  <CheckCircle2 size={14} style={{ color: '#059669' }} />
                  <span>{previewData.summary?.sufficientItemsCount || 0} in Pantry</span>
                </div>
                <div className={`${styles.statPill} ${styles.statPillAlert}`}>
                  <ShoppingCart size={14} />
                  <strong>{previewData.summary?.shortfallItemsCount || 0} to Purchase</strong>
                </div>
              </div>
            ) : (
              <div className={styles.emptyPreview}>No meal plan requirements found for this date range.</div>
            )}

            {/* List preview of shortfalls */}
            {shortfalls.length > 0 && (
              <div className={styles.shortfallChipsList}>
                {shortfalls.slice(0, 8).map((item, idx) => (
                  <span
                    key={idx}
                    className={`${styles.shortfallChip} ${
                      item.status === 'review_needed' ? styles.chipReview : ''
                    }`}
                  >
                    {item.name}: +{item.shortfall || item.totalRequired} {item.unit}
                    {item.status === 'review_needed' && ' (Check unit)'}
                  </span>
                ))}
                {shortfalls.length > 8 && (
                  <span className={styles.moreChip}>+{shortfalls.length - 8} more items</span>
                )}
              </div>
            )}
          </div>

          {/* Target destination selector */}
          <div className={styles.targetSection}>
            <label className={styles.label}>Destination List</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="listMode"
                  value="new"
                  checked={mode === 'new'}
                  onChange={() => setMode('new')}
                />
                <span>Create New Shopping List</span>
              </label>

              {existingLists.length > 0 && (
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="listMode"
                    value="existing"
                    checked={mode === 'existing'}
                    onChange={() => setMode('existing')}
                  />
                  <span>Merge into Existing List</span>
                </label>
              )}
            </div>

            {mode === 'new' ? (
              <div className={styles.newListFields}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="new-list-name" className={styles.label}>
                    New List Name
                  </label>
                  <input
                    id="new-list-name"
                    type="text"
                    className={styles.input}
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label htmlFor="new-list-budget" className={styles.label}>
                    Budget (₹) <span className={styles.optional}>(Optional)</span>
                  </label>
                  <input
                    id="new-list-budget"
                    type="number"
                    min="0"
                    step="1"
                    className={styles.input}
                    placeholder="e.g. 2000"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className={styles.fieldGroup}>
                <label htmlFor="target-list-select" className={styles.label}>
                  Select List
                </label>
                <select
                  id="target-list-select"
                  className={styles.select}
                  value={targetListId}
                  onChange={(e) => setTargetListId(e.target.value)}
                >
                  {existingLists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.itemsCount || 0} items)
                    </option>
                  ))}
                </select>
                <span className={styles.hint}>
                  Existing items and manual prices will be safely preserved. Duplicates are merged automatically.
                </span>
              </div>
            )}
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitting || previewLoading || shortfalls.length === 0}
            >
              {submitting ? 'Compiling List...' : 'Generate Shopping List'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
