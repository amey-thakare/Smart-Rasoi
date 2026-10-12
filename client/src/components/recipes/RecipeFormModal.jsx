import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle, Utensils } from 'lucide-react';
import styles from './RecipeFormModal.module.css';

const CATEGORIES = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snacks',
  'Vegetarian',
  'Quick Meals',
  'Other'
];

const COMMON_UNITS = [
  'cups',
  'g',
  'kg',
  'tbsp',
  'tsp',
  'pcs',
  'ml',
  'L',
  'cloves',
  'leaves',
  'packets'
];

export default function RecipeFormModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  loading = false,
  serverError = null
}) {
  const isEditMode = Boolean(initialData);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [category, setCategory] = useState('Dinner');
  const [cuisine, setCuisine] = useState('');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(15);
  const [cookTimeMinutes, setCookTimeMinutes] = useState(20);
  const [servings, setServings] = useState(2);
  const [difficulty, setDifficulty] = useState('Easy');
  const [imageUrl, setImageUrl] = useState('');

  // Dynamic ingredient rows
  const [ingredients, setIngredients] = useState([
    { name: '', quantity: 1, unit: 'cups', isOptional: false }
  ]);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setInstructions(initialData.instructions || '');
      setCategory(initialData.category || 'Dinner');
      setCuisine(initialData.cuisine || '');
      setPrepTimeMinutes(initialData.prepTimeMinutes !== undefined ? initialData.prepTimeMinutes : 15);
      setCookTimeMinutes(initialData.cookTimeMinutes !== undefined ? initialData.cookTimeMinutes : 20);
      setServings(initialData.servings || 2);
      setDifficulty(initialData.difficulty || 'Easy');
      setImageUrl(initialData.imageUrl || '');

      if (initialData.ingredients && initialData.ingredients.length > 0) {
        setIngredients(
          initialData.ingredients.map((ing) => ({
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            isOptional: Boolean(ing.isOptional)
          }))
        );
      } else {
        setIngredients([{ name: '', quantity: 1, unit: 'cups', isOptional: false }]);
      }
    } else {
      setTitle('');
      setDescription('');
      setInstructions('');
      setCategory('Dinner');
      setCuisine('');
      setPrepTimeMinutes(15);
      setCookTimeMinutes(20);
      setServings(2);
      setDifficulty('Easy');
      setImageUrl('');
      setIngredients([{ name: '', quantity: 1, unit: 'cups', isOptional: false }]);
    }
    setErrors({});
  }, [initialData, isOpen]);

  // Handle ingredient row changes
  const handleIngredientChange = (index, field, value) => {
    setIngredients((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Add new ingredient row
  const handleAddIngredientRow = () => {
    setIngredients((prev) => [
      ...prev,
      { name: '', quantity: 1, unit: 'g', isOptional: false }
    ]);
  };

  // Remove an ingredient row
  const handleRemoveIngredientRow = (index) => {
    if (ingredients.length <= 1) return;
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const errs = {};
    if (!title.trim()) errs.title = 'Recipe title is required';
    if (!instructions.trim()) errs.instructions = 'Cooking instructions are required';
    if (!category.trim()) errs.category = 'Category is required';
    if (servings <= 0) errs.servings = 'Servings must be at least 1';
    if (prepTimeMinutes < 0) errs.prepTimeMinutes = 'Prep time cannot be negative';
    if (cookTimeMinutes < 0) errs.cookTimeMinutes = 'Cook time cannot be negative';

    const validIngs = ingredients.filter((ing) => ing.name.trim() !== '');
    if (validIngs.length === 0) {
      errs.ingredients = 'Please provide at least one ingredient with a name';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      instructions: instructions.trim(),
      category: category.trim(),
      cuisine: cuisine.trim() || undefined,
      prepTimeMinutes: Number(prepTimeMinutes),
      cookTimeMinutes: Number(cookTimeMinutes),
      servings: Number(servings),
      difficulty,
      imageUrl: imageUrl.trim() || undefined,
      ingredients: ingredients
        .filter((ing) => ing.name.trim() !== '')
        .map((ing) => ({
          name: ing.name.trim(),
          quantity: Number(ing.quantity) > 0 ? Number(ing.quantity) : 1,
          unit: ing.unit.trim() || 'pcs',
          isOptional: Boolean(ing.isOptional)
        }))
    };

    onSave(payload);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitleArea}>
            <div className={styles.headerBadge}>
              <Utensils size={13} />
              <span>{isEditMode ? 'Modify Recipe' : 'New Recipe'}</span>
            </div>
            <h2 className={styles.title}>
              {isEditMode ? 'Edit Recipe' : 'Create Custom Recipe'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeBtn}
            disabled={loading}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className={styles.serverError}>
            <AlertCircle size={16} />
            <span>{serverError}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formScroll}>
            {/* Title */}
            <div className={styles.formGroup}>
              <label htmlFor="recipe-title" className={styles.label}>
                Recipe Title <span className={styles.required}>*</span>
              </label>
              <input
                id="recipe-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Grandma's Special Dal Khichdi"
                className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
                disabled={loading}
              />
              {errors.title && <span className={styles.errorText}>{errors.title}</span>}
            </div>

            {/* Description */}
            <div className={styles.formGroup}>
              <label htmlFor="recipe-desc" className={styles.label}>
                Short Description
              </label>
              <input
                id="recipe-desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary or story behind this dish"
                className={styles.input}
                disabled={loading}
              />
            </div>

            {/* Category & Cuisine Row */}
            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label htmlFor="recipe-cat" className={styles.label}>
                  Category <span className={styles.required}>*</span>
                </label>
                <select
                  id="recipe-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={styles.select}
                  disabled={loading}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="recipe-cuisine" className={styles.label}>
                  Cuisine
                </label>
                <input
                  id="recipe-cuisine"
                  type="text"
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  placeholder="e.g. Indian, Italian, Mexican"
                  className={styles.input}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Prep Time, Cook Time, Servings, Difficulty */}
            <div className={styles.row4}>
              <div className={styles.formGroup}>
                <label htmlFor="prep-time" className={styles.label}>
                  Prep (mins)
                </label>
                <input
                  id="prep-time"
                  type="number"
                  min="0"
                  value={prepTimeMinutes}
                  onChange={(e) => setPrepTimeMinutes(e.target.value)}
                  className={styles.input}
                  disabled={loading}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="cook-time" className={styles.label}>
                  Cook (mins)
                </label>
                <input
                  id="cook-time"
                  type="number"
                  min="0"
                  value={cookTimeMinutes}
                  onChange={(e) => setCookTimeMinutes(e.target.value)}
                  className={styles.input}
                  disabled={loading}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="servings" className={styles.label}>
                  Servings
                </label>
                <input
                  id="servings"
                  type="number"
                  min="1"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  className={styles.input}
                  disabled={loading}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="difficulty" className={styles.label}>
                  Difficulty
                </label>
                <select
                  id="difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className={styles.select}
                  disabled={loading}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            {/* Optional Image URL */}
            <div className={styles.formGroup}>
              <label htmlFor="image-url" className={styles.label}>
                Image URL (Optional)
              </label>
              <input
                id="image-url"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className={styles.input}
                disabled={loading}
              />
            </div>

            {/* Dynamic Ingredients Section */}
            <div className={styles.ingredientsSection}>
              <div className={styles.ingSectionHeader}>
                <div>
                  <h4 className={styles.ingSectionTitle}>
                    Ingredients <span className={styles.required}>*</span>
                  </h4>
                  <p className={styles.ingSectionSub}>
                    List the ingredients needed so Smart Rasoi can match with your pantry.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddIngredientRow}
                  className="btn btn-secondary"
                  disabled={loading}
                  style={{ padding: '6px 12px', fontSize: '0.84rem' }}
                >
                  <Plus size={14} />
                  <span>Add Row</span>
                </button>
              </div>

              {errors.ingredients && (
                <span className={styles.errorText}>{errors.ingredients}</span>
              )}

              <div className={styles.ingRowsContainer}>
                {ingredients.map((ing, idx) => (
                  <div key={idx} className={styles.ingRow}>
                    <input
                      type="text"
                      placeholder="Ingredient name (e.g. Tomatoes)"
                      value={ing.name}
                      onChange={(e) => handleIngredientChange(idx, 'name', e.target.value)}
                      className={`${styles.input} ${styles.ingNameInput}`}
                      disabled={loading}
                    />

                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      placeholder="Qty"
                      value={ing.quantity}
                      onChange={(e) => handleIngredientChange(idx, 'quantity', e.target.value)}
                      className={`${styles.input} ${styles.ingQtyInput}`}
                      disabled={loading}
                    />

                    <input
                      type="text"
                      placeholder="Unit"
                      list="common-units"
                      value={ing.unit}
                      onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                      className={`${styles.input} ${styles.ingUnitInput}`}
                      disabled={loading}
                    />

                    <label className={styles.optionalCheckboxLabel} title="Is this ingredient optional?">
                      <input
                        type="checkbox"
                        checked={ing.isOptional}
                        onChange={(e) => handleIngredientChange(idx, 'isOptional', e.target.checked)}
                        disabled={loading}
                      />
                      <span>Opt.</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleRemoveIngredientRow(idx)}
                      disabled={ingredients.length <= 1 || loading}
                      className={styles.removeRowBtn}
                      title="Remove ingredient"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}

                <datalist id="common-units">
                  {COMMON_UNITS.map((u) => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Instructions */}
            <div className={styles.formGroup}>
              <label htmlFor="instructions" className={styles.label}>
                Cooking Instructions <span className={styles.required}>*</span>
              </label>
              <textarea
                id="instructions"
                rows={5}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="1. Wash and chop vegetables.&#10;2. Heat oil and add whole spices.&#10;3. Simmer on low heat..."
                className={`${styles.textarea} ${errors.instructions ? styles.inputError : ''}`}
                disabled={loading}
              />
              {errors.instructions && (
                <span className={styles.errorText}>{errors.instructions}</span>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className={styles.footer}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading
                ? isEditMode ? 'Updating...' : 'Saving...'
                : isEditMode ? 'Save Changes' : 'Create Recipe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
