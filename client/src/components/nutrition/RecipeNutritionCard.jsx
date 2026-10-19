import React, { useState, useEffect } from 'react';
import {
  Flame,
  Dna,
  Wheat,
  Droplet,
  Sparkles,
  Info,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Scale
} from 'lucide-react';
import { fetchRecipeNutrition, calculateRecipeNutrition } from '../../services/api.js';
import styles from './RecipeNutritionCard.module.css';

export default function RecipeNutritionCard({
  recipeId,
  recipeServings = 2,
  currentServings = 2
}) {
  const [nutrition, setNutrition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [viewMode, setViewMode] = useState('serving'); // 'serving' | 'total'
  const [error, setError] = useState('');

  useEffect(() => {
    if (!recipeId) return;

    let isMounted = true;
    const loadNutrition = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch nutrition scaled to currentServings
        const res = await fetchRecipeNutrition(recipeId, currentServings);
        const data = res.data?.nutrition || res.data;
        if (isMounted && data) {
          setNutrition(data);
        }
      } catch (err) {
        if (isMounted) {
          setError('Nutritional data unavailable for this recipe.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadNutrition();
    return () => {
      isMounted = false;
    };
  }, [recipeId, currentServings]);

  const handleRecalculate = async () => {
    setRecalculating(true);
    setError('');
    try {
      const res = await calculateRecipeNutrition(recipeId, {
        forceRecalculate: true,
        servings: currentServings
      });
      const data = res.data?.nutrition || res.data;
      if (data) setNutrition(data);
    } catch (err) {
      setError('Failed to recalculate nutrition.');
    } finally {
      setRecalculating(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingCard}>
        <RefreshCw size={16} className={styles.spinningIcon} />
        <span>Calculating authentic nutritional breakdown...</span>
      </div>
    );
  }

  if (error || !nutrition) {
    return (
      <div className={styles.emptyCard}>
        <div className={styles.emptyHeader}>
          <Sparkles size={16} />
          <span>Nutrition Analysis</span>
        </div>
        <p className={styles.emptyText}>
          {error || 'Nutrition profile not yet generated.'}
        </p>
        <button
          type="button"
          onClick={handleRecalculate}
          className={styles.calcBtn}
          disabled={recalculating}
        >
          <RefreshCw size={13} className={recalculating ? styles.spinningIcon : ''} />
          <span>{recalculating ? 'Analyzing...' : 'Generate Nutrition Estimate'}</span>
        </button>
      </div>
    );
  }

  // Multiplier for display
  const isTotal = viewMode === 'total';
  const mult = isTotal ? (currentServings || 1) : 1;

  const rawCal = Number(nutrition.perServing?.calories ?? nutrition.calories ?? 0);
  const rawProtein = Number(nutrition.perServing?.proteinGrams ?? nutrition.proteinGrams ?? nutrition.protein ?? 0);
  const rawCarbs = Number(nutrition.perServing?.carbohydratesGrams ?? nutrition.carbohydratesGrams ?? nutrition.carbs ?? 0);
  const rawFat = Number(nutrition.perServing?.fatGrams ?? nutrition.fatGrams ?? nutrition.fat ?? 0);
  const rawFiber = nutrition.perServing?.fiberGrams ?? nutrition.fiberGrams ?? nutrition.fiber;
  const rawSugar = nutrition.perServing?.sugarGrams ?? nutrition.sugarGrams ?? nutrition.sugar;
  const rawSodium = nutrition.perServing?.sodiumMilligrams ?? nutrition.sodiumMilligrams ?? nutrition.sodium;

  const displayCal = isNaN(rawCal) ? 0 : Math.round(rawCal * mult);
  const displayProtein = isNaN(rawProtein) ? '0.0' : (rawProtein * mult).toFixed(1);
  const displayCarbs = isNaN(rawCarbs) ? '0.0' : (rawCarbs * mult).toFixed(1);
  const displayFat = isNaN(rawFat) ? '0.0' : (rawFat * mult).toFixed(1);
  const displayFiber = rawFiber != null && !isNaN(Number(rawFiber)) ? (Number(rawFiber) * mult).toFixed(1) : '—';
  const displaySugar = rawSugar != null && !isNaN(Number(rawSugar)) ? (Number(rawSugar) * mult).toFixed(1) : '—';
  const displaySodium = rawSodium != null && !isNaN(Number(rawSodium)) ? Math.round(Number(rawSodium) * mult) : '—';

  // Macro Energy Ratios (4 kcal/g protein, 4 kcal/g carbs, 9 kcal/g fat)
  const calFromPro = Number(displayProtein) * 4;
  const calFromCarb = Number(displayCarbs) * 4;
  const calFromFat = Number(displayFat) * 9;
  const totalMacroCal = calFromPro + calFromCarb + calFromFat || 1;

  const pctPro = Math.round((calFromPro / totalMacroCal) * 100);
  const pctCarb = Math.round((calFromCarb / totalMacroCal) * 100);
  const pctFat = Math.max(0, 100 - pctPro - pctCarb);

  const completeness = nutrition.completenessScore ?? 100;
  const isHighAccuracy = completeness >= 80;

  return (
    <div className={styles.card}>
      {/* Header with serving/total toggle */}
      <div className={styles.cardHeader}>
        <div className={styles.titleArea}>
          <Sparkles size={18} className={styles.sparkleIcon} />
          <div>
            <h4 className={styles.title}>Nutritional Analysis</h4>
            <span className={styles.subtitle}>
              IFCT / USDA Deterministic Breakdown
            </span>
          </div>
        </div>

        <div className={styles.headerControls}>
          <div className={styles.toggleGroup}>
            <button
              type="button"
              className={`${styles.toggleBtn} ${!isTotal ? styles.toggleBtnActive : ''}`}
              onClick={() => setViewMode('serving')}
            >
              Per Serving
            </button>
            <button
              type="button"
              className={`${styles.toggleBtn} ${isTotal ? styles.toggleBtnActive : ''}`}
              onClick={() => setViewMode('total')}
            >
              Total ({currentServings} serv)
            </button>
          </div>

          <button
            type="button"
            onClick={handleRecalculate}
            disabled={recalculating}
            className={styles.refreshBtn}
            title="Recalculate nutritional estimates"
          >
            <RefreshCw size={13} className={recalculating ? styles.spinningIcon : ''} />
          </button>
        </div>
      </div>

      {/* Main Macro Cards */}
      <div className={styles.macroGrid}>
        <div className={`${styles.macroItem} ${styles.calItem}`}>
          <div className={styles.macroIconWrap}>
            <Flame size={18} className={styles.calIcon} />
          </div>
          <div className={styles.macroInfo}>
            <span className={styles.macroLabel}>Energy</span>
            <div className={styles.macroValWrap}>
              <strong className={styles.macroValue}>{displayCal}</strong>
              <span className={styles.macroUnit}>kcal</span>
            </div>
          </div>
        </div>

        <div className={`${styles.macroItem} ${styles.proItem}`}>
          <div className={styles.macroIconWrap}>
            <Dna size={18} className={styles.proIcon} />
          </div>
          <div className={styles.macroInfo}>
            <span className={styles.macroLabel}>Protein</span>
            <div className={styles.macroValWrap}>
              <strong className={styles.macroValue}>{displayProtein}</strong>
              <span className={styles.macroUnit}>g</span>
            </div>
          </div>
        </div>

        <div className={`${styles.macroItem} ${styles.carbItem}`}>
          <div className={styles.macroIconWrap}>
            <Wheat size={18} className={styles.carbIcon} />
          </div>
          <div className={styles.macroInfo}>
            <span className={styles.macroLabel}>Carbs</span>
            <div className={styles.macroValWrap}>
              <strong className={styles.macroValue}>{displayCarbs}</strong>
              <span className={styles.macroUnit}>g</span>
            </div>
          </div>
        </div>

        <div className={`${styles.macroItem} ${styles.fatItem}`}>
          <div className={styles.macroIconWrap}>
            <Droplet size={18} className={styles.fatIcon} />
          </div>
          <div className={styles.macroInfo}>
            <span className={styles.macroLabel}>Fats</span>
            <div className={styles.macroValWrap}>
              <strong className={styles.macroValue}>{displayFat}</strong>
              <span className={styles.macroUnit}>g</span>
            </div>
          </div>
        </div>
      </div>

      {/* Macro Split Bar */}
      <div className={styles.splitBarSection}>
        <div className={styles.splitLabels}>
          <span className={styles.splitCarb}>Carbs {pctCarb}%</span>
          <span className={styles.splitPro}>Protein {pctPro}%</span>
          <span className={styles.splitFat}>Fat {pctFat}%</span>
        </div>
        <div className={styles.splitBar}>
          <div className={styles.splitSegmentCarb} style={{ width: `${pctCarb}%` }} />
          <div className={styles.splitSegmentPro} style={{ width: `${pctPro}%` }} />
          <div className={styles.splitSegmentFat} style={{ width: `${pctFat}%` }} />
        </div>
      </div>

      {/* Micronutrients Row */}
      <div className={styles.microRow}>
        <div className={styles.microItem}>
          <span className={styles.microLabel}>Fiber:</span>
          <strong className={styles.microValue}>{displayFiber} g</strong>
        </div>
        <div className={styles.microDivider} />
        <div className={styles.microItem}>
          <span className={styles.microLabel}>Sugars:</span>
          <strong className={styles.microValue}>{displaySugar} g</strong>
        </div>
        <div className={styles.microDivider} />
        <div className={styles.microItem}>
          <span className={styles.microLabel}>Sodium:</span>
          <strong className={styles.microValue}>{displaySodium} mg</strong>
        </div>
      </div>

      {/* Completeness & Verification Details */}
      <div className={styles.verificationRow}>
        <div className={styles.completenessBadge}>
          {isHighAccuracy ? (
            <CheckCircle2 size={13} className={styles.checkIcon} />
          ) : (
            <AlertCircle size={13} className={styles.warnIcon} />
          )}
          <span>{completeness}% Ingredients Mapped</span>
        </div>

        {nutrition.missingIngredients && nutrition.missingIngredients.length > 0 && (
          <span className={styles.missingNotice}>
            (Excluded: {nutrition.missingIngredients.slice(0, 2).join(', ')}
            {nutrition.missingIngredients.length > 2 ? '...' : ''})
          </span>
        )}

        <span className={styles.disclaimerText}>
          Estimated values for kitchen guidance.
        </span>
      </div>
    </div>
  );
}
