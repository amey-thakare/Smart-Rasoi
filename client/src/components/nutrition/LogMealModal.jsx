import React, { useState, useEffect } from 'react';
import {
  X,
  Utensils,
  Plus,
  Search,
  Flame,
  Dna,
  Wheat,
  Droplet,
  Save,
  AlertCircle,
  Check,
  Calendar,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  fetchRecipes,
  fetchRecipeNutrition,
  logMealConsumption,
  updateMealConsumption
} from '../../services/api.js';
import styles from './LogMealModal.module.css';

const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];

export default function LogMealModal({
  isOpen,
  onClose,
  initialDate,
  editingMeal,
  onSaved
}) {
  const [mode, setMode] = useState(editingMeal ? 'custom' : 'recipe'); // 'recipe' | 'custom'
  const [mealType, setMealType] = useState('LUNCH');
  const [date, setDate] = useState('');
  const [servings, setServings] = useState('1');
  const [notes, setNotes] = useState('');

  // Recipe selection mode
  const [recipes, setRecipes] = useState([]);
  const [recipeSearch, setRecipeSearch] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipeNutrition, setRecipeNutrition] = useState(null);
  const [loadingNutrition, setLoadingNutrition] = useState(false);

  // Custom entry mode
  const [customTitle, setCustomTitle] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbsTarget] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [sodium, setSodium] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Setup initial values on open
  useEffect(() => {
    if (!isOpen) return;

    setError('');
    const todayStr = initialDate || new Date().toISOString().split('T')[0];
    setDate(todayStr);

    if (editingMeal) {
      setMode('custom');
      setMealType(editingMeal.mealType || 'LUNCH');
      setCustomTitle(editingMeal.recipeTitle || '');
      setServings(String(editingMeal.servingsConsumed || 1));
      setCalories(String(editingMeal.calories || ''));
      setProtein(editingMeal.protein !== null ? String(editingMeal.protein) : '');
      setCarbsTarget(editingMeal.carbs !== null ? String(editingMeal.carbs) : '');
      setFat(editingMeal.fat !== null ? String(editingMeal.fat) : '');
      setFiber(editingMeal.fiber !== null ? String(editingMeal.fiber) : '');
      setSodium(editingMeal.sodium !== null ? String(editingMeal.sodium) : '');
      setNotes(editingMeal.notes || '');
      if (editingMeal.scheduledDate) {
        setDate(editingMeal.scheduledDate.split('T')[0]);
      }
    } else {
      setMode('recipe');
      setMealType('LUNCH');
      setServings('1');
      setCustomTitle('');
      setCalories('');
      setProtein('');
      setCarbsTarget('');
      setFat('');
      setFiber('');
      setSodium('');
      setNotes('');
      setSelectedRecipe(null);
      setRecipeNutrition(null);

      // Load recipes for dropdown
      loadRecipeList();
    }
  }, [isOpen, initialDate, editingMeal]);

  const loadRecipeList = async () => {
    setLoading(true);
    try {
      const res = await fetchRecipes();
      const list = res.data?.recipes || res.data || res.recipes || [];
      setRecipes(list);
    } catch (err) {
      console.error('Failed to load recipes:', err);
    } finally {
      setLoading(false);
    }
  };

  // When selected recipe or servings change in recipe mode, fetch calculated estimate
  useEffect(() => {
    if (!selectedRecipe) return;

    let isMounted = true;
    const fetchEst = async () => {
      setLoadingNutrition(true);
      try {
        const sVal = parseFloat(servings) || 1;
        const res = await fetchRecipeNutrition(selectedRecipe.id, sVal);
        if (isMounted) {
          const nut = res.data?.nutrition || res.data;
          setRecipeNutrition(nut);
        }
      } catch (err) {
        console.error('Failed to fetch recipe nutrition estimate:', err);
      } finally {
        if (isMounted) setLoadingNutrition(false);
      }
    };

    fetchEst();
    return () => {
      isMounted = false;
    };
  }, [selectedRecipe, servings]);

  if (!isOpen) return null;

  const handleSelectRecipe = (r) => {
    setSelectedRecipe(r);
    setRecipeSearch('');
  };

  const filteredRecipes = recipes.filter((r) =>
    r.title.toLowerCase().includes(recipeSearch.toLowerCase()) ||
    r.category?.toLowerCase().includes(recipeSearch.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const servNum = parseFloat(servings);
    if (isNaN(servNum) || servNum <= 0) {
      setError('Servings must be a positive number.');
      return;
    }

    if (!date) {
      setError('Please select a valid consumption date.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingMeal) {
        // Update existing record
        const payload = {
          servingsConsumed: servNum,
          mealType,
          notes,
          calories: calories === '' ? null : parseFloat(calories),
          protein: protein === '' ? null : parseFloat(protein),
          carbs: carbs === '' ? null : parseFloat(carbs),
          fat: fat === '' ? null : parseFloat(fat),
          fiber: fiber === '' ? null : parseFloat(fiber),
          sodium: sodium === '' ? null : parseFloat(sodium)
        };
        const res = await updateMealConsumption(editingMeal.id, payload);
        if (res.success) {
          if (onSaved) onSaved(res.data?.history || res.data);
          onClose();
        } else {
          setError(res.error || 'Failed to update meal record.');
        }
      } else {
        // Create new record
        let payload;
        if (mode === 'recipe') {
          if (!selectedRecipe) {
            setError('Please select a recipe from your kitchen collection.');
            setSubmitting(false);
            return;
          }
          payload = {
            recipeId: selectedRecipe.id,
            recipeTitle: selectedRecipe.title,
            mealType,
            date,
            servingsConsumed: servNum,
            notes,
            source: 'RECIPE'
          };
          if (recipeNutrition) {
            payload.calories = recipeNutrition.calories;
            payload.protein = recipeNutrition.protein;
            payload.carbs = recipeNutrition.carbs;
            payload.fat = recipeNutrition.fat;
            payload.fiber = recipeNutrition.fiber;
            payload.sodium = recipeNutrition.sodium;
          }
        } else {
          // Custom food entry
          if (!customTitle.trim()) {
            setError('Please enter a meal or food title.');
            setSubmitting(false);
            return;
          }
          if (calories === '' || isNaN(parseFloat(calories)) || parseFloat(calories) < 0) {
            setError('Please provide a valid calorie value (>= 0).');
            setSubmitting(false);
            return;
          }
          payload = {
            recipeTitle: customTitle.trim(),
            mealType,
            date,
            servingsConsumed: servNum,
            calories: parseFloat(calories),
            protein: protein === '' ? null : parseFloat(protein),
            carbs: carbs === '' ? null : parseFloat(carbs),
            fat: fat === '' ? null : parseFloat(fat),
            fiber: fiber === '' ? null : parseFloat(fiber),
            sodium: sodium === '' ? null : parseFloat(sodium),
            source: 'MANUAL',
            notes
          };
        }

        const res = await logMealConsumption(payload);
        if (res.success) {
          if (onSaved) onSaved(res.data?.history || res.data);
          onClose();
        } else {
          setError(res.error || 'Failed to log meal consumption.');
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Network error while recording meal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitleArea}>
            <div className={styles.iconCircle}>
              <Utensils size={22} className={styles.titleIcon} />
            </div>
            <div>
              <h2 className={styles.title}>
                {editingMeal ? 'Edit Consumed Meal' : 'Log Meal Consumption'}
              </h2>
              <p className={styles.subtitle}>
                Record eaten meals to update your daily calories, protein, and macronutrients
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab switch between Recipe selection and Custom food (only when not editing) */}
        {!editingMeal && (
          <div className={styles.tabsRow}>
            <button
              type="button"
              className={`${styles.tabBtn} ${mode === 'recipe' ? styles.tabBtnActive : ''}`}
              onClick={() => setMode('recipe')}
            >
              <Sparkles size={16} />
              <span>Log from Kitchen Recipe</span>
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${mode === 'custom' ? styles.tabBtnActive : ''}`}
              onClick={() => setMode('custom')}
            >
              <Plus size={16} />
              <span>Quick Custom Food</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.errorAlert}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Common fields: Date & Meal Type */}
          <div className={styles.gridTwo}>
            <div className={styles.field}>
              <label htmlFor="logMealDate" className={styles.label}>
                Date Consumed
              </label>
              <div className={styles.inputWithIcon}>
                <Calendar size={16} className={styles.fieldIcon} />
                <input
                  id="logMealDate"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="logMealType" className={styles.label}>
                Meal Slot
              </label>
              <select
                id="logMealType"
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className={styles.select}
              >
                {MEAL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0) + t.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mode 1: Log from Recipe */}
          {mode === 'recipe' && (
            <div className={styles.recipeSelectSection}>
              <label className={styles.label}>Select Recipe</label>

              {selectedRecipe ? (
                <div className={styles.selectedRecipeCard}>
                  <div className={styles.selectedRecipeInfo}>
                    <span className={styles.selectedRecipeBadge}>
                      {selectedRecipe.category}
                    </span>
                    <strong className={styles.selectedRecipeTitle}>
                      {selectedRecipe.title}
                    </strong>
                    <span className={styles.selectedRecipeServings}>
                      Default: {selectedRecipe.servings} servings
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRecipe(null);
                      setRecipeNutrition(null);
                    }}
                    className={styles.changeRecipeBtn}
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className={styles.recipeSearchWrap}>
                  <div className={styles.searchBar}>
                    <Search size={16} className={styles.searchIcon} />
                    <input
                      type="text"
                      placeholder="Search recipes (e.g. Dal Tadka, Paneer Bhurji)..."
                      value={recipeSearch}
                      onChange={(e) => setRecipeSearch(e.target.value)}
                      className={styles.searchInput}
                    />
                  </div>

                  <div className={styles.recipeListDropdown}>
                    {filteredRecipes.length === 0 ? (
                      <div className={styles.emptyDropdown}>
                        {loading ? 'Loading recipes...' : 'No recipes found matching search'}
                      </div>
                    ) : (
                      filteredRecipes.slice(0, 10).map((r) => (
                        <div
                          key={r.id}
                          className={styles.recipeDropdownItem}
                          onClick={() => handleSelectRecipe(r)}
                        >
                          <div>
                            <div className={styles.recipeItemTitle}>{r.title}</div>
                            <div className={styles.recipeItemMeta}>
                              {r.category} • {r.servings || 2} servings
                            </div>
                          </div>
                          <span className={styles.selectTag}>Select</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Servings scaler */}
              <div className={styles.field} style={{ marginTop: '14px' }}>
                <label htmlFor="logServings" className={styles.label}>
                  Portion / Servings Consumed
                </label>
                <div className={styles.servingsInputRow}>
                  <input
                    id="logServings"
                    type="number"
                    min="0.25"
                    max="20"
                    step="0.25"
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                    className={styles.input}
                    required
                  />
                  <div className={styles.quickServingsButtons}>
                    {['0.5', '1', '1.5', '2'].map((val) => (
                      <button
                        type="button"
                        key={val}
                        className={`${styles.quickServBtn} ${servings === val ? styles.quickServBtnActive : ''}`}
                        onClick={() => setServings(val)}
                      >
                        {val}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Scaled Nutrition Preview */}
              {selectedRecipe && (
                <div className={styles.nutritionPreviewCard}>
                  <div className={styles.previewHeader}>
                    <Sparkles size={16} className={styles.previewIcon} />
                    <strong>Estimated Nutrition for {servings} portion(s):</strong>
                  </div>
                  {loadingNutrition ? (
                    <div className={styles.calculatingText}>Computing accurate nutrition...</div>
                  ) : recipeNutrition ? (
                    <div className={styles.macroPillsGrid}>
                      <div className={styles.macroPill}>
                        <Flame size={14} className={styles.calIcon} />
                        <span className={styles.pillLabel}>Calories</span>
                        <strong className={styles.pillVal}>{recipeNutrition.calories} kcal</strong>
                      </div>
                      <div className={styles.macroPill}>
                        <Dna size={14} className={styles.proIcon} />
                        <span className={styles.pillLabel}>Protein</span>
                        <strong className={styles.pillVal}>{recipeNutrition.protein}g</strong>
                      </div>
                      <div className={styles.macroPill}>
                        <Wheat size={14} className={styles.carbIcon} />
                        <span className={styles.pillLabel}>Carbs</span>
                        <strong className={styles.pillVal}>{recipeNutrition.carbs}g</strong>
                      </div>
                      <div className={styles.macroPill}>
                        <Droplet size={14} className={styles.fatIcon} />
                        <span className={styles.pillLabel}>Fat</span>
                        <strong className={styles.pillVal}>{recipeNutrition.fat}g</strong>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Custom Food Entry */}
          {mode === 'custom' && (
            <div className={styles.customSection}>
              <div className={styles.field}>
                <label htmlFor="customTitle" className={styles.label}>
                  Food / Dish Name
                </label>
                <input
                  id="customTitle"
                  type="text"
                  placeholder="e.g. Masala Omelette, Curd Bowl, Roasted Chana"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.gridTwo}>
                <div className={styles.field}>
                  <label htmlFor="customCalories" className={styles.label}>
                    Calories (kcal) *
                  </label>
                  <input
                    id="customCalories"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g. 280"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="customServings" className={styles.label}>
                    Servings Consumed
                  </label>
                  <input
                    id="customServings"
                    type="number"
                    min="0.25"
                    max="20"
                    step="0.25"
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>
              </div>

              <div className={styles.gridThree}>
                <div className={styles.field}>
                  <label htmlFor="customProtein" className={styles.label}>
                    Protein (g)
                  </label>
                  <input
                    id="customProtein"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="e.g. 12"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    className={styles.input}
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="customCarbs" className={styles.label}>
                    Carbs (g)
                  </label>
                  <input
                    id="customCarbs"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="e.g. 35"
                    value={carbs}
                    onChange={(e) => setCarbsTarget(e.target.value)}
                    className={styles.input}
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="customFat" className={styles.label}>
                    Fat (g)
                  </label>
                  <input
                    id="customFat"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="e.g. 8"
                    value={fat}
                    onChange={(e) => setFat(e.target.value)}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.gridTwo}>
                <div className={styles.field}>
                  <label htmlFor="customFiber" className={styles.label}>
                    Fiber (g)
                  </label>
                  <input
                    id="customFiber"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="e.g. 5"
                    value={fiber}
                    onChange={(e) => setFiber(e.target.value)}
                    className={styles.input}
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="customSodium" className={styles.label}>
                    Sodium (mg)
                  </label>
                  <input
                    id="customSodium"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g. 450"
                    value={sodium}
                    onChange={(e) => setSodium(e.target.value)}
                    className={styles.input}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Optional Notes */}
          <div className={styles.field}>
            <label htmlFor="logMealNotes" className={styles.label}>
              Notes / Context (Optional)
            </label>
            <input
              id="logMealNotes"
              type="text"
              placeholder="e.g. Cooked with extra ghee, or half portion leftover"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={styles.input}
            />
          </div>

          {/* Footer Actions */}
          <div className={styles.footer}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Save size={16} />
              <span>
                {submitting
                  ? 'Saving...'
                  : editingMeal
                  ? 'Update Log'
                  : 'Record Meal'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
