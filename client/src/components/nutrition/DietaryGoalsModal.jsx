import React, { useState, useEffect } from 'react';
import { X, Target, Save, ShieldAlert, Sparkles, Check, Plus, AlertCircle } from 'lucide-react';
import { fetchDietaryProfile, updateDietaryProfile } from '../../services/api.js';
import styles from './DietaryGoalsModal.module.css';

const COMMON_PREFERENCES = [
  'Vegetarian',
  'Vegan',
  'Eggetarian',
  'High-Protein',
  'Low-Carb',
  'Jain (No Root Veg)',
  'Diabetic-Friendly',
  'Keto',
  'Gluten-Free'
];

const COMMON_ALLERGIES = [
  'Peanuts',
  'Tree Nuts',
  'Dairy / Lactose',
  'Gluten / Wheat',
  'Soy',
  'Shellfish',
  'Eggs',
  'Mustard'
];

export default function DietaryGoalsModal({ isOpen, onClose, onUpdated }) {
  const [calorieTarget, setCalorieTarget] = useState('');
  const [proteinTarget, setProteinTarget] = useState('');
  const [carbsTarget, setCarbsTarget] = useState('');
  const [fatTarget, setFatTarget] = useState('');
  const [fiberTarget, setFiberTarget] = useState('');
  const [sodiumTarget, setSodiumTarget] = useState('');

  const [dietaryPreferences, setDietaryPreferences] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [excludedIngredients, setExcludedIngredients] = useState([]);
  const [customExcludeInput, setCustomExcludeInput] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetchDietaryProfile();
        const profile = res.data?.profile || res.data || res.profile;
        if (isMounted && profile) {
          setCalorieTarget(profile.calorieTarget ?? '');
          setProteinTarget(profile.proteinTarget ?? '');
          setCarbsTarget(profile.carbsTarget ?? '');
          setFatTarget(profile.fatTarget ?? '');
          setFiberTarget(profile.fiberTarget ?? '');
          setSodiumTarget(profile.sodiumTarget ?? '');
          const userAllergies = Array.isArray(profile.allergies)
            ? profile.allergies
            : Array.isArray(profile.allergiesList)
            ? profile.allergiesList
            : typeof profile.allergies === 'string' && profile.allergies.trim()
            ? profile.allergies.split(',').map((s) => s.trim()).filter(Boolean)
            : [];
          setAllergies(userAllergies);

          const userExcluded = Array.isArray(profile.excludedIngredients)
            ? profile.excludedIngredients
            : Array.isArray(profile.dislikedList)
            ? profile.dislikedList
            : Array.isArray(profile.dislikedIngredients)
            ? profile.dislikedIngredients
            : typeof profile.dislikedIngredients === 'string' && profile.dislikedIngredients.trim()
            ? profile.dislikedIngredients.split(',').map((s) => s.trim()).filter(Boolean)
            : [];
          setExcludedIngredients(userExcluded);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load dietary profile.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const togglePreference = (pref) => {
    setDietaryPreferences((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const toggleAllergy = (allergy) => {
    setAllergies((prev) =>
      prev.includes(allergy) ? prev.filter((a) => a !== allergy) : [...prev, allergy]
    );
  };

  const handleAddExcluded = (e) => {
    if (e) e.preventDefault();
    const clean = customExcludeInput.trim().toLowerCase();
    if (clean && !excludedIngredients.includes(clean)) {
      setExcludedIngredients((prev) => [...prev, clean]);
      setCustomExcludeInput('');
    }
  };

  const handleRemoveExcluded = (item) => {
    setExcludedIngredients((prev) => prev.filter((i) => i !== item));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const payload = {
      calorieTarget: calorieTarget === '' ? null : Math.round(Number(calorieTarget)),
      proteinTarget: proteinTarget === '' ? null : Number(proteinTarget),
      carbsTarget: carbsTarget === '' ? null : Number(carbsTarget),
      fatTarget: fatTarget === '' ? null : Number(fatTarget),
      fiberTarget: fiberTarget === '' ? null : Number(fiberTarget),
      sodiumTarget: sodiumTarget === '' ? null : Number(sodiumTarget),
      dietaryPreferences,
      allergies,
      excludedIngredients
    };

    // Validations
    if (payload.calorieTarget !== null && (payload.calorieTarget < 500 || payload.calorieTarget > 10000)) {
      setError('Daily calorie target should be between 500 and 10,000 kcal.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await updateDietaryProfile(payload);
      if (res.success) {
        setSuccessMsg('Dietary goals and preferences saved successfully!');
        const updated = res.data?.profile || res.data;
        if (onUpdated) onUpdated(updated);
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        setError(res.error || 'Failed to update dietary goals.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Server error while saving goals.');
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
              <Target size={22} className={styles.titleIcon} />
            </div>
            <div>
              <h2 className={styles.title}>Dietary Goals & Targets</h2>
              <p className={styles.subtitle}>
                Set daily nutritional targets, dietary preferences, and kitchen allergies
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

        {loading ? (
          <div className={styles.loadingState}>Loading profile goals...</div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            {error && (
              <div className={styles.errorAlert}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className={styles.successAlert}>
                <Check size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Daily Nutrition Targets Section */}
            <div className={styles.section}>
              <h3 className={styles.sectionHeading}>Daily Nutritional Targets (Optional)</h3>
              <p className={styles.sectionDesc}>
                Leave blank if you prefer tracking without fixed daily boundaries.
              </p>

              <div className={styles.gridTwo}>
                <div className={styles.field}>
                  <label htmlFor="calorieTarget" className={styles.label}>
                    Calories (kcal / day)
                  </label>
                  <input
                    id="calorieTarget"
                    type="number"
                    min="500"
                    max="10000"
                    step="10"
                    placeholder="e.g. 2000"
                    value={calorieTarget}
                    onChange={(e) => setCalorieTarget(e.target.value)}
                    className={styles.input}
                  />
                  <span className={styles.hint}>Recommended ICMR baseline: 1800 - 2400 kcal</span>
                </div>

                <div className={styles.field}>
                  <label htmlFor="proteinTarget" className={styles.label}>
                    Protein (g / day)
                  </label>
                  <input
                    id="proteinTarget"
                    type="number"
                    min="0"
                    max="500"
                    step="1"
                    placeholder="e.g. 75"
                    value={proteinTarget}
                    onChange={(e) => setProteinTarget(e.target.value)}
                    className={styles.input}
                  />
                  <span className={styles.hint}>Approx. 0.8g - 1.2g per kg body weight</span>
                </div>
              </div>

              <div className={styles.gridThree}>
                <div className={styles.field}>
                  <label htmlFor="carbsTarget" className={styles.label}>
                    Carbohydrates (g)
                  </label>
                  <input
                    id="carbsTarget"
                    type="number"
                    min="0"
                    max="800"
                    step="1"
                    placeholder="e.g. 250"
                    value={carbsTarget}
                    onChange={(e) => setCarbsTarget(e.target.value)}
                    className={styles.input}
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="fatTarget" className={styles.label}>
                    Fats (g)
                  </label>
                  <input
                    id="fatTarget"
                    type="number"
                    min="0"
                    max="300"
                    step="1"
                    placeholder="e.g. 60"
                    value={fatTarget}
                    onChange={(e) => setFatTarget(e.target.value)}
                    className={styles.input}
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="fiberTarget" className={styles.label}>
                    Dietary Fiber (g)
                  </label>
                  <input
                    id="fiberTarget"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    placeholder="e.g. 30"
                    value={fiberTarget}
                    onChange={(e) => setFiberTarget(e.target.value)}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="sodiumTarget" className={styles.label}>
                  Sodium Limit (mg / day)
                </label>
                <input
                  id="sodiumTarget"
                  type="number"
                  min="0"
                  max="10000"
                  step="50"
                  placeholder="e.g. 2000"
                  value={sodiumTarget}
                  onChange={(e) => setSodiumTarget(e.target.value)}
                  className={styles.input}
                />
                <span className={styles.hint}>WHO recommends &lt; 2000mg sodium daily (~5g salt)</span>
              </div>
            </div>

            {/* Dietary Preferences Section */}
            <div className={styles.section}>
              <h3 className={styles.sectionHeading}>Dietary Preferences & Lifestyle</h3>
              <p className={styles.sectionDesc}>
                Helps filter AI suggestions and tailor meal recommendations.
              </p>
              <div className={styles.chipsContainer}>
                {COMMON_PREFERENCES.map((pref) => {
                  const isSelected = dietaryPreferences.includes(pref);
                  return (
                    <button
                      type="button"
                      key={pref}
                      onClick={() => togglePreference(pref)}
                      className={`${styles.chip} ${isSelected ? styles.chipSelected : ''}`}
                    >
                      {isSelected && <Check size={14} className={styles.chipCheck} />}
                      <span>{pref}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Food Allergies Section */}
            <div className={styles.section}>
              <div className={styles.sectionHeadingWithIcon}>
                <ShieldAlert size={18} className={styles.allergyIcon} />
                <h3 className={styles.sectionHeading}>Allergies & Sensitivities</h3>
              </div>
              <p className={styles.sectionDesc}>
                Recipes containing these ingredients will be flagged with warning badges.
              </p>
              <div className={styles.chipsContainer}>
                {COMMON_ALLERGIES.map((allergy) => {
                  const isSelected = allergies.includes(allergy);
                  return (
                    <button
                      type="button"
                      key={allergy}
                      onClick={() => toggleAllergy(allergy)}
                      className={`${styles.chip} ${styles.allergyChip} ${isSelected ? styles.allergyChipSelected : ''}`}
                    >
                      {isSelected && <Check size={14} className={styles.chipCheck} />}
                      <span>{allergy}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Excluded Ingredients Section */}
            <div className={styles.section}>
              <h3 className={styles.sectionHeading}>Excluded Ingredients</h3>
              <p className={styles.sectionDesc}>
                Specific ingredients you dislike or avoid (e.g. bitter gourd, mushroom, onion).
              </p>
              <div className={styles.excludeInputRow}>
                <input
                  type="text"
                  placeholder="Add ingredient to exclude..."
                  value={customExcludeInput}
                  onChange={(e) => setCustomExcludeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddExcluded();
                    }
                  }}
                  className={styles.input}
                />
                <button
                  type="button"
                  onClick={handleAddExcluded}
                  className="btn btn-secondary"
                  disabled={!customExcludeInput.trim()}
                >
                  <Plus size={16} />
                  <span>Add</span>
                </button>
              </div>

              {excludedIngredients.length > 0 && (
                <div className={styles.excludedTagsWrap}>
                  {excludedIngredients.map((item) => (
                    <span key={item} className={styles.excludedTag}>
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveExcluded(item)}
                        className={styles.removeTagBtn}
                        aria-label={`Remove ${item}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
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
                <span>{submitting ? 'Saving Goals...' : 'Save Goals & Profile'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
