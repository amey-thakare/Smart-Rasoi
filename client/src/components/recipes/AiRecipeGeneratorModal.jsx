import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Clock,
  Users,
  Flame,
  CheckCircle2,
  ShoppingCart,
  Save,
  RotateCcw,
  Edit2,
  Package,
  Loader2,
  Plus
} from 'lucide-react';
import { generateAiRecipeApi, fetchInventoryItems } from '../../services/api.js';
import styles from './AiRecipeGeneratorModal.module.css';

const CUISINES = ['Any', 'Indian', 'Italian', 'Asian', 'Western', 'Mexican', 'Mediterranean', 'Continental'];
const MEAL_TYPES = ['Any', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Quick Meals'];
const DIETARY_OPTIONS = ['None', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'High-Protein', 'Low-Carb'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export default function AiRecipeGeneratorModal({
  isOpen,
  onClose,
  onSaveRecipe,
  onEditBeforeSaving
}) {
  // Form inputs
  const [selectedPantryItems, setSelectedPantryItems] = useState([]);
  const [manualIngredients, setManualIngredients] = useState('');
  const [avoidIngredients, setAvoidIngredients] = useState('');
  const [cuisine, setCuisine] = useState('Any');
  const [mealType, setMealType] = useState('Dinner');
  const [dietaryPreference, setDietaryPreference] = useState('None');
  const [maxPrepTime, setMaxPrepTime] = useState('30');
  const [difficulty, setDifficulty] = useState('Easy');
  const [servings, setServings] = useState('2');
  const [customNotes, setCustomNotes] = useState('');

  // Pantry items for selection
  const [pantryInventory, setPantryInventory] = useState([]);
  const [loadingPantry, setLoadingPantry] = useState(false);

  // Generation state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedRecipe, setGeneratedRecipe] = useState(null);

  // Load user pantry inventory when modal opens
  useEffect(() => {
    if (isOpen) {
      loadPantry();
      setGeneratedRecipe(null);
      setError(null);
      setSelectedPantryItems([]);
      setManualIngredients('');
      setAvoidIngredients('');
      setCustomNotes('');
    }
  }, [isOpen]);

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

  const loadPantry = async () => {
    try {
      setLoadingPantry(true);
      const res = await fetchInventoryItems();
      if (res.data?.items) {
        setPantryInventory(res.data.items);
      }
    } catch (err) {
      console.warn('Failed to load pantry for AI generator:', err);
    } finally {
      setLoadingPantry(false);
    }
  };

  const togglePantryItem = (itemName) => {
    setSelectedPantryItems((prev) =>
      prev.includes(itemName)
        ? prev.filter((n) => n !== itemName)
        : [...prev, itemName]
    );
  };

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    const manualList = manualIngredients
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean);

    const allToUse = [...new Set([...selectedPantryItems, ...manualList])];

    const avoidList = avoidIngredients
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean);

    try {
      const res = await generateAiRecipeApi({
        ingredientsToUse: allToUse,
        ingredientsToAvoid: avoidList,
        cuisine: cuisine !== 'Any' ? cuisine : undefined,
        mealType: mealType !== 'Any' ? mealType : undefined,
        dietaryPreference: dietaryPreference !== 'None' ? dietaryPreference : undefined,
        maxPrepTime: maxPrepTime ? parseInt(maxPrepTime, 10) : undefined,
        difficulty,
        servings: parseInt(servings, 10) || 2,
        instructions: customNotes.trim() || undefined
      });

      if (res.success && res.recipe) {
        setGeneratedRecipe(res.recipe);
      } else {
        throw new Error(res.message || 'Failed to generate recipe.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error communicating with AI service.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className={styles.title}>AI Recipe Generator</h2>
              <p className={styles.subtitle}>Craft custom recipes tailored to your pantry and preferences</p>
            </div>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner} />
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 4px 0' }}>
                  Chef Gemini is cooking up your recipe...
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                  Analyzing your pantry inventory, balancing flavors, and structuring steps.
                </p>
              </div>
            </div>
          ) : !generatedRecipe ? (
            /* Input Form */
            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Pantry Selection */}
              <div className={styles.pantrySection}>
                <div className={styles.pantryHeader}>
                  <span className={styles.pantryTitle}>
                    Select ingredients from your pantry to use:
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {selectedPantryItems.length} selected
                  </span>
                </div>

                <div className={styles.pantryChips}>
                  {loadingPantry ? (
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Loading pantry stock...</span>
                  ) : pantryInventory.length > 0 ? (
                    pantryInventory.map((item) => {
                      const isSelected = selectedPantryItems.includes(item.name);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={`${styles.pantryChip} ${isSelected ? styles.pantryChipSelected : ''}`}
                          onClick={() => togglePantryItem(item.name)}
                        >
                          <span>{item.name}</span>
                          <span style={{ opacity: 0.8, fontSize: '0.6875rem' }}>({item.quantity} {item.unit})</span>
                        </button>
                      );
                    })
                  ) : (
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>No pantry items found. Add ingredients below!</span>
                  )}
                </div>
              </div>

              {/* Form Grid */}
              <div className={styles.formGrid}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Meal Type</label>
                  <select className={styles.select} value={mealType} onChange={(e) => setMealType(e.target.value)}>
                    {MEAL_TYPES.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Cuisine</label>
                  <select className={styles.select} value={cuisine} onChange={(e) => setCuisine(e.target.value)}>
                    {CUISINES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Dietary Preference</label>
                  <select className={styles.select} value={dietaryPreference} onChange={(e) => setDietaryPreference(e.target.value)}>
                    {DIETARY_OPTIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Max Prep Time (mins)</label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    className={styles.input}
                    value={maxPrepTime}
                    onChange={(e) => setMaxPrepTime(e.target.value)}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Difficulty</label>
                  <select className={styles.select} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Servings</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    className={styles.input}
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Additional Ingredients to Include (comma-separated)</label>
                <input
                  type="text"
                  className={styles.input}
                  value={manualIngredients}
                  onChange={(e) => setManualIngredients(e.target.value)}
                  placeholder="e.g. Garlic, Lemon, Bell pepper, Cilantro..."
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Ingredients to Strictly Avoid (comma-separated)</label>
                <input
                  type="text"
                  className={styles.input}
                  value={avoidIngredients}
                  onChange={(e) => setAvoidIngredients(e.target.value)}
                  placeholder="e.g. Onions, Mushrooms, Peanuts..."
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Special Chef Notes / Requests</label>
                <textarea
                  className={styles.textarea}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="e.g. 'Make it kid-friendly and not too oily', 'One-pot recipe', 'Serve with rice'..."
                />
              </div>

              {error && (
                <div className="alert alert-danger" style={{ fontSize: '0.85rem' }}>
                  {error}
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                <Sparkles size={16} />
                <span>Generate Recipe with AI</span>
              </button>
            </form>
          ) : (
            /* Generated Recipe Preview */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className={styles.previewCard}>
                <div className={styles.previewHeader}>
                  <div>
                    <h3 className={styles.previewTitle}>{generatedRecipe.title}</h3>
                    {generatedRecipe.description && (
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {generatedRecipe.description}
                      </p>
                    )}
                  </div>

                  <div className={styles.previewBadges}>
                    <span className={styles.badge}>
                      <Clock size={12} style={{ marginRight: '4px', verticalAlign: '-1px' }} />
                      {generatedRecipe.totalTimeMinutes} mins
                    </span>
                    <span className={styles.badge}>
                      <Users size={12} style={{ marginRight: '4px', verticalAlign: '-1px' }} />
                      {generatedRecipe.servings} Servings
                    </span>
                    <span className={styles.badge}>{generatedRecipe.difficulty}</span>
                    <span className={styles.badge}>{generatedRecipe.cuisine}</span>
                  </div>
                </div>

                {generatedRecipe.explanation && (
                  <div className={styles.explanationCard}>
                    <strong>Why this works for your kitchen: </strong>
                    <span>{generatedRecipe.explanation}</span>
                  </div>
                )}

                {/* Ingredients list with availability status */}
                <div>
                  <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, margin: '8px 0 4px 0' }}>
                    Ingredients Required ({generatedRecipe.ingredients.length})
                  </h4>
                  <div className={styles.ingredientsList}>
                    {generatedRecipe.ingredients.map((ing, idx) => {
                      const isAvailable = ing.inventoryStatus === 'available';
                      return (
                        <div
                          key={idx}
                          className={`${styles.ingItem} ${isAvailable ? styles.ingAvailable : styles.ingMissing}`}
                        >
                          <div>
                            <span style={{ fontWeight: 500 }}>{ing.name}</span>
                            {ing.isOptional && (
                              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
                                (Optional)
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 600 }}>{ing.quantity} {ing.unit}</span>
                            {isAvailable ? (
                              <CheckCircle2 size={14} style={{ color: 'var(--color-success)' }} title="Available in pantry" />
                            ) : (
                              <ShoppingCart size={14} style={{ color: 'var(--color-warning)' }} title="Missing from pantry" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Step by step instructions */}
                <div>
                  <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, margin: '8px 0 4px 0' }}>
                    Cooking Instructions
                  </h4>
                  <div className={styles.instructionsList}>
                    {generatedRecipe.instructions}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={styles.footer}>
          {!generatedRecipe ? (
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setGeneratedRecipe(null)}
              >
                <RotateCcw size={14} />
                <span>Adjust Criteria</span>
              </button>

              <div className={styles.footerActions}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  <Sparkles size={14} />
                  <span>Regenerate</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onEditBeforeSaving(generatedRecipe)}
                >
                  <Edit2 size={14} />
                  <span>Edit Details</span>
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => onSaveRecipe(generatedRecipe)}
                >
                  <Save size={14} />
                  <span>Save to My Recipes</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
