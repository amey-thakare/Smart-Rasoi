import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Users,
  UtensilsCrossed,
  BookOpen,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { fetchRecipes, createMealPlan, updateMealPlan } from '../../services/api.js';
import styles from './ScheduleMealModal.module.css';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

export default function ScheduleMealModal({
  isOpen,
  onClose,
  onMealSaved,
  initialDate = null,
  initialRecipe = null,
  initialMealType = 'Dinner',
  mealPlanToEdit = null
}) {
  const isEditing = Boolean(mealPlanToEdit);

  // Form states
  const [recipes, setRecipes] = useState([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [searchRecipeText, setSearchRecipeText] = useState('');
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [mealType, setMealType] = useState('Dinner');
  const [servings, setServings] = useState(2);
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Load recipes on modal open
  useEffect(() => {
    if (isOpen) {
      loadRecipes();
      setError(null);

      if (mealPlanToEdit) {
        setSelectedRecipeId(mealPlanToEdit.recipeId || mealPlanToEdit.recipe?.id || '');
        setScheduledDate(mealPlanToEdit.scheduledDateStr || mealPlanToEdit.scheduledDate?.split('T')[0] || '');
        setMealType(mealPlanToEdit.mealType || 'Dinner');
        setServings(mealPlanToEdit.servings || 2);
        setNotes(mealPlanToEdit.notes || '');
      } else {
        const todayStr = new Date().toISOString().split('T')[0];
        setScheduledDate(initialDate || todayStr);
        setMealType(initialMealType || 'Dinner');
        if (initialRecipe) {
          setSelectedRecipeId(initialRecipe.id);
          setServings(initialRecipe.servings || 2);
        } else {
          setSelectedRecipeId('');
          setServings(2);
        }
        setNotes('');
      }
    }
  }, [isOpen, mealPlanToEdit, initialDate, initialRecipe, initialMealType]);

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

  const loadRecipes = async () => {
    try {
      setLoadingRecipes(true);
      const res = await fetchRecipes();
      const list = res.data?.recipes || [];
      setRecipes(list);

      // If initial recipe passed, ensure it is set
      if (initialRecipe && !selectedRecipeId) {
        setSelectedRecipeId(initialRecipe.id);
      }
    } catch (err) {
      console.warn('Failed to fetch recipes for meal planner:', err);
    } finally {
      setLoadingRecipes(false);
    }
  };

  const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId) || (initialRecipe?.id === selectedRecipeId ? initialRecipe : null);

  const filteredRecipes = recipes.filter((r) =>
    r.title.toLowerCase().includes(searchRecipeText.toLowerCase()) ||
    (r.category && r.category.toLowerCase().includes(searchRecipeText.toLowerCase()))
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRecipeId) {
      setError('Please choose a recipe for this meal.');
      return;
    }
    if (!scheduledDate) {
      setError('Please choose a scheduled date.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isEditing) {
        const res = await updateMealPlan(mealPlanToEdit.id, {
          scheduledDate,
          mealType,
          servings: parseInt(servings, 10),
          notes,
          recipeId: selectedRecipeId
        });
        if (onMealSaved) onMealSaved(res.mealPlan, 'updated');
      } else {
        const res = await createMealPlan({
          recipeId: selectedRecipeId,
          scheduledDate,
          mealType,
          servings: parseInt(servings, 10),
          notes
        });
        if (onMealSaved) onMealSaved(res.mealPlan, 'created');
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save meal plan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <Calendar size={20} />
            </div>
            <div>
              <h2 className={styles.title}>
                {isEditing ? 'Edit Planned Meal' : 'Schedule a Meal'}
              </h2>
              <p className={styles.subtitle}>
                Assign recipe, servings, and date to your household menu
              </p>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className={styles.body}>
          {error && (
            <div className={styles.errorAlert} role="alert">
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Date & Meal Type Row */}
          <div className={styles.row}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <Calendar size={13} />
                <span>Scheduled Date</span>
              </label>
              <input
                type="date"
                className={styles.input}
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <Clock size={13} />
                <span>Meal Type</span>
              </label>
              <select
                className={styles.select}
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
              >
                {MEAL_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Recipe Selection */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <UtensilsCrossed size={13} />
              <span>Select Recipe</span>
            </label>

            {/* Selected Recipe Banner */}
            {selectedRecipe ? (
              <div className={styles.selectedRecipeCard}>
                <div className={styles.selectedRecipeInfo}>
                  <span className={styles.selectedRecipeTitle}>{selectedRecipe.title}</span>
                  <div className={styles.selectedRecipeMeta}>
                    <span>{selectedRecipe.category || 'General'}</span>
                    <span>•</span>
                    <span>Base: {selectedRecipe.servings} Servings</span>
                    <span>•</span>
                    <span>{(selectedRecipe.prepTimeMinutes || 0) + (selectedRecipe.cookTimeMinutes || 0)} mins</span>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.changeRecipeBtn}
                  onClick={() => setSelectedRecipeId('')}
                >
                  Change
                </button>
              </div>
            ) : (
              <div className={styles.recipePickerWrapper}>
                <div className={styles.searchBox}>
                  <Search size={15} className={styles.searchIcon} />
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search catalogue by name or category..."
                    value={searchRecipeText}
                    onChange={(e) => setSearchRecipeText(e.target.value)}
                  />
                </div>

                <div className={styles.recipeList}>
                  {loadingRecipes ? (
                    <div className={styles.loadingBox}>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Loading recipe catalogue...</span>
                    </div>
                  ) : filteredRecipes.length > 0 ? (
                    filteredRecipes.map((r) => (
                      <div
                        key={r.id}
                        className={`${styles.recipeItem} ${selectedRecipeId === r.id ? styles.recipeItemSelected : ''}`}
                        onClick={() => {
                          setSelectedRecipeId(r.id);
                          setServings(r.servings || 2);
                        }}
                      >
                        <div className={styles.recipeItemInfo}>
                          <span className={styles.recipeItemTitle}>{r.title}</span>
                          <span className={styles.recipeItemMeta}>
                            {r.category} • {r.servings} Servings
                          </span>
                        </div>
                        {selectedRecipeId === r.id && (
                          <CheckCircle2 size={16} className={styles.checkIcon} />
                        )}
                      </div>
                    ))
                  ) : (
                    <div className={styles.emptyBox}>No recipes found matching query.</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Servings Row */}
          <div className={styles.row}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <Users size={13} />
                <span>Planned Servings</span>
              </label>
              <div className={styles.servingsInputWrapper}>
                <input
                  type="number"
                  min="1"
                  max="50"
                  className={styles.input}
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  required
                />
                <span className={styles.servingsNote}>
                  {selectedRecipe
                    ? `(Recipe base: ${selectedRecipe.servings} portions)`
                    : 'Portions for this meal'}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <BookOpen size={13} />
              <span>Meal Notes (Optional)</span>
            </label>
            <textarea
              className={styles.textarea}
              placeholder="e.g. Prep rice the night before, guest coming over..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Footer Actions */}
          <div className={styles.footer}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving || !selectedRecipeId}>
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditing ? 'Save Changes' : 'Confirm & Schedule Meal'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
