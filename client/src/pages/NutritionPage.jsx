import React, { useState, useEffect, useCallback } from 'react';
import {
  Apple,
  Target,
  Sparkles,
  Plus,
  Flame,
  Dna,
  Wheat,
  Droplet,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  History,
  AlertCircle,
  CheckCircle2,
  Edit2,
  Trash2,
  Clock,
  ShieldAlert,
  Info,
  RotateCcw,
  Coffee,
  Sun,
  Moon,
  Cookie
} from 'lucide-react';
import {
  fetchDietaryProfile,
  fetchDailyNutrition,
  fetchWeeklyNutrition,
  fetchMealHistory,
  deleteMealConsumption
} from '../services/api.js';
import DietaryGoalsModal from '../components/nutrition/DietaryGoalsModal.jsx';
import LogMealModal from '../components/nutrition/LogMealModal.jsx';
import AiNutritionModal from '../components/nutrition/AiNutritionModal.jsx';
import styles from './NutritionPage.module.css';

const MEAL_SLOTS = [
  { key: 'BREAKFAST', label: 'Breakfast', icon: Coffee, color: '#D97706' },
  { key: 'LUNCH', label: 'Lunch', icon: Sun, color: '#EA580C' },
  { key: 'DINNER', label: 'Dinner', icon: Moon, color: '#4F46E5' },
  { key: 'SNACK', label: 'Snacks & Bites', icon: Cookie, color: '#059669' }
];

export default function NutritionPage() {
  // Date State (default to today YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Data States
  const [profile, setProfile] = useState(null);
  const [dailyData, setDailyData] = useState(null);
  const [weeklyData, setWeeklyData] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('ALL');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'trends' | 'history'

  // Modals
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);

  // Load Profile & Core Data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [profileRes, dailyRes, weeklyRes] = await Promise.all([
        fetchDietaryProfile().catch(() => null),
        fetchDailyNutrition(selectedDate).catch(() => null),
        fetchWeeklyNutrition().catch(() => null)
      ]);

      if (profileRes?.success) {
        setProfile(profileRes.data?.profile || profileRes.data);
      }
      if (dailyRes?.success) {
        setDailyData(dailyRes.data);
      }
      if (weeklyRes?.success) {
        setWeeklyData(weeklyRes.data);
      }
    } catch (err) {
      console.error('Failed to load nutrition data:', err);
      setError('Unable to load nutrition intake records.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load Full History when History tab is selected
  useEffect(() => {
    if (activeTab === 'history') {
      const loadHistory = async () => {
        setHistoryLoading(true);
        try {
          const params = historyFilter !== 'ALL' ? { mealType: historyFilter } : {};
          const res = await fetchMealHistory(params);
          if (res.success) {
            setHistoryItems(res.data?.history || res.history || []);
          }
        } catch (err) {
          console.error('Failed to load meal history:', err);
        } finally {
          setHistoryLoading(false);
        }
      };
      loadHistory();
    }
  }, [activeTab, historyFilter]);

  // Date Navigation Helpers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const handleDeleteMeal = async (mealId) => {
    if (!window.confirm('Are you sure you want to remove this logged meal?')) {
      return;
    }
    try {
      const res = await deleteMealConsumption(mealId);
      if (res.success) {
        loadData();
        if (activeTab === 'history') {
          setHistoryItems((prev) => prev.filter((m) => m.id !== mealId));
        }
      }
    } catch (err) {
      alert('Failed to delete meal record.');
    }
  };

  const handleEditMeal = (meal) => {
    setEditingMeal(meal);
    setIsLogModalOpen(true);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const dateObj = new Date(selectedDate + 'T00:00:00');
  const dateFormatted = dateObj.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  // Extract totals and targets from dailyData
  const totals = dailyData?.totals || {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sodium: 0
  };

  const targets = dailyData?.targets || profile || {};
  const consumedMeals = dailyData?.consumedMeals || [];

  // Macro progress calculation helper
  const calcProgress = (val, target) => {
    if (!target || target <= 0) return null;
    return Math.min(100, Math.round((val / target) * 100));
  };

  const calProgress = calcProgress(totals.calories, targets.calorieTarget);
  const proProgress = calcProgress(totals.protein, targets.proteinTarget);
  const carbProgress = calcProgress(totals.carbs, targets.carbsTarget);
  const fatProgress = calcProgress(totals.fat, targets.fatTarget);
  const fiberProgress = calcProgress(totals.fiber, targets.fiberTarget);
  const sodiumProgress = calcProgress(totals.sodium, targets.sodiumTarget);

  // Group consumed meals by slot
  const mealsBySlot = {
    BREAKFAST: consumedMeals.filter((m) => m.mealType === 'BREAKFAST'),
    LUNCH: consumedMeals.filter((m) => m.mealType === 'LUNCH'),
    DINNER: consumedMeals.filter((m) => m.mealType === 'DINNER'),
    SNACK: consumedMeals.filter((m) => m.mealType === 'SNACK')
  };

  return (
    <div className={styles.pageContainer}>
      {/* Top Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.badgeRow}>
            <span className={styles.phaseBadge}>Phase 9 • Live Intake Ledger</span>
            {profile?.dietaryPreferences?.map((pref) => (
              <span key={pref} className={styles.prefBadge}>
                {pref}
              </span>
            ))}
          </div>
          <h1 className={styles.pageTitle}>Nutrition & Dietary Intake</h1>
          <p className={styles.pageSubtitle}>
            Deterministic nutritional tracking, daily macro targets, and historical meal consumption
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsGoalsModalOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Target size={16} />
            <span>Set Dietary Goals</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsAiModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              borderColor: 'var(--color-primary)',
              color: 'var(--color-primary)'
            }}
          >
            <Sparkles size={16} />
            <span>AI Nutritionist</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setEditingMeal(null);
              setIsLogModalOpen(true);
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            <span>Log Meal</span>
          </button>
        </div>
      </div>

      {/* Allergies & Sensitivities Alert Banner */}
      {(() => {
        const allergiesList = Array.isArray(profile?.allergies)
          ? profile.allergies
          : Array.isArray(profile?.allergiesList)
          ? profile.allergiesList
          : typeof profile?.allergies === 'string' && profile.allergies.trim()
          ? profile.allergies.split(',').map((s) => s.trim()).filter(Boolean)
          : [];
        const excludedList = Array.isArray(profile?.excludedIngredients)
          ? profile.excludedIngredients
          : Array.isArray(profile?.dislikedList)
          ? profile.dislikedList
          : Array.isArray(profile?.dislikedIngredients)
          ? profile.dislikedIngredients
          : typeof profile?.dislikedIngredients === 'string' && profile.dislikedIngredients.trim()
          ? profile.dislikedIngredients.split(',').map((s) => s.trim()).filter(Boolean)
          : [];

        if (allergiesList.length === 0 && excludedList.length === 0) return null;

        return (
          <div className={styles.allergiesAlert}>
            <ShieldAlert size={18} className={styles.allergyIcon} />
            <div>
              {allergiesList.length > 0 && (
                <>
                  <strong>Active Allergy Guard:</strong>{' '}
                  <span>{allergiesList.join(', ')}</span>
                </>
              )}
              {excludedList.length > 0 && (
                <span style={{ marginLeft: allergiesList.length > 0 ? '12px' : '0', opacity: 0.9 }}>
                  {allergiesList.length > 0 ? '• ' : ''}Excluded items: {excludedList.join(', ')}
                </span>
              )}
            </div>
          </div>
        );
      })()}

      {/* Tab Controls */}
      <div className={styles.tabsNav}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Apple size={16} />
          <span>Daily Tracker</span>
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'trends' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('trends')}
        >
          <TrendingUp size={16} />
          <span>Weekly Trends & Averages</span>
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'history' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={16} />
          <span>Consumption Ledger ({historyItems.length || consumedMeals.length})</span>
        </button>
      </div>

      {/* TAB 1: DAILY OVERVIEW */}
      {activeTab === 'overview' && (
        <div className={styles.tabContent}>
          {/* Date Selector Strip */}
          <div className={styles.dateStrip}>
            <div className={styles.dateNavButtons}>
              <button
                type="button"
                onClick={handlePrevDay}
                className={styles.dateArrowBtn}
                title="Previous Day"
              >
                <ChevronLeft size={18} />
              </button>
              <div className={styles.dateDisplay}>
                <Calendar size={16} className={styles.calIcon} />
                <span className={styles.dateText}>
                  {isToday ? `Today • ${dateFormatted}` : dateFormatted}
                </span>
              </div>
              <button
                type="button"
                onClick={handleNextDay}
                className={styles.dateArrowBtn}
                title="Next Day"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className={styles.dateActions}>
              {!isToday && (
                <button
                  type="button"
                  onClick={handleToday}
                  className={styles.todayBtn}
                >
                  Jump to Today
                </button>
              )}
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={styles.dateInput}
              />
            </div>
          </div>

          {/* Daily Progress Overview Grid */}
          <div className={styles.dailyOverviewGrid}>
            {/* Calorie Hero Card */}
            <div className={styles.calorieHeroCard}>
              <div className={styles.calorieHeroHeader}>
                <div className={styles.calorieIconCircle}>
                  <Flame size={24} className={styles.flameIcon} />
                </div>
                <div>
                  <span className={styles.heroCardLabel}>Daily Energy Intake</span>
                  <div className={styles.heroCalRow}>
                    <strong className={styles.heroCalValue}>{totals.calories}</strong>
                    <span className={styles.heroCalUnit}>kcal</span>
                    {targets.calorieTarget && (
                      <span className={styles.heroTargetText}>
                        / {targets.calorieTarget} target
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {targets.calorieTarget ? (
                <div className={styles.heroProgressArea}>
                  <div className={styles.heroProgressBarWrap}>
                    <div
                      className={styles.heroProgressBar}
                      style={{
                        width: `${Math.min(100, (totals.calories / targets.calorieTarget) * 100)}%`,
                        backgroundColor:
                          totals.calories > targets.calorieTarget + 150
                            ? 'var(--color-warning)'
                            : 'var(--color-primary)'
                      }}
                    />
                  </div>
                  <div className={styles.heroStatusText}>
                    {totals.calories <= targets.calorieTarget ? (
                      <span>
                        <strong>{targets.calorieTarget - totals.calories} kcal</strong> remaining for today
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-warning-text)' }}>
                        Exceeded target by <strong>{totals.calories - targets.calorieTarget} kcal</strong>
                      </span>
                    )}
                    <span>{calProgress}%</span>
                  </div>
                </div>
              ) : (
                <div className={styles.noTargetNotice}>
                  <span>No calorie goal configured.</span>
                  <button
                    type="button"
                    onClick={() => setIsGoalsModalOpen(true)}
                    className={styles.inlineGoalLink}
                  >
                    Set Daily Target
                  </button>
                </div>
              )}
            </div>

            {/* Core Macros Grid */}
            <div className={styles.macrosFourGrid}>
              {/* Protein Card */}
              <div className={`${styles.macroCard} ${styles.macroCardPro}`}>
                <div className={styles.macroCardHead}>
                  <div className={styles.macroTitleGroup}>
                    <Dna size={16} className={styles.proIcon} />
                    <span className={styles.macroName}>Protein</span>
                  </div>
                  {proProgress !== null && (
                    <span className={styles.progressPctBadge}>{proProgress}%</span>
                  )}
                </div>
                <div className={styles.macroNumbers}>
                  <strong className={styles.macroBigNum}>{totals.protein}</strong>
                  <span className={styles.macroUnit}>g</span>
                  {targets.proteinTarget && (
                    <span className={styles.macroTargetText}>/ {targets.proteinTarget}g</span>
                  )}
                </div>
                {proProgress !== null && (
                  <div className={styles.macroBarBg}>
                    <div
                      className={styles.macroBarPro}
                      style={{ width: `${Math.min(100, proProgress)}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Carbohydrates Card */}
              <div className={`${styles.macroCard} ${styles.macroCardCarb}`}>
                <div className={styles.macroCardHead}>
                  <div className={styles.macroTitleGroup}>
                    <Wheat size={16} className={styles.carbIcon} />
                    <span className={styles.macroName}>Carbohydrates</span>
                  </div>
                  {carbProgress !== null && (
                    <span className={styles.progressPctBadge}>{carbProgress}%</span>
                  )}
                </div>
                <div className={styles.macroNumbers}>
                  <strong className={styles.macroBigNum}>{totals.carbs}</strong>
                  <span className={styles.macroUnit}>g</span>
                  {targets.carbsTarget && (
                    <span className={styles.macroTargetText}>/ {targets.carbsTarget}g</span>
                  )}
                </div>
                {carbProgress !== null && (
                  <div className={styles.macroBarBg}>
                    <div
                      className={styles.macroBarCarb}
                      style={{ width: `${Math.min(100, carbProgress)}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Fats Card */}
              <div className={`${styles.macroCard} ${styles.macroCardFat}`}>
                <div className={styles.macroCardHead}>
                  <div className={styles.macroTitleGroup}>
                    <Droplet size={16} className={styles.fatIcon} />
                    <span className={styles.macroName}>Fats</span>
                  </div>
                  {fatProgress !== null && (
                    <span className={styles.progressPctBadge}>{fatProgress}%</span>
                  )}
                </div>
                <div className={styles.macroNumbers}>
                  <strong className={styles.macroBigNum}>{totals.fat}</strong>
                  <span className={styles.macroUnit}>g</span>
                  {targets.fatTarget && (
                    <span className={styles.macroTargetText}>/ {targets.fatTarget}g</span>
                  )}
                </div>
                {fatProgress !== null && (
                  <div className={styles.macroBarBg}>
                    <div
                      className={styles.macroBarFat}
                      style={{ width: `${Math.min(100, fatProgress)}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Dietary Fiber Card */}
              <div className={`${styles.macroCard} ${styles.macroCardFiber}`}>
                <div className={styles.macroCardHead}>
                  <div className={styles.macroTitleGroup}>
                    <Apple size={16} className={styles.fiberIcon} />
                    <span className={styles.macroName}>Dietary Fiber</span>
                  </div>
                  {fiberProgress !== null && (
                    <span className={styles.progressPctBadge}>{fiberProgress}%</span>
                  )}
                </div>
                <div className={styles.macroNumbers}>
                  <strong className={styles.macroBigNum}>{totals.fiber}</strong>
                  <span className={styles.macroUnit}>g</span>
                  {targets.fiberTarget && (
                    <span className={styles.macroTargetText}>/ {targets.fiberTarget}g</span>
                  )}
                </div>
                {fiberProgress !== null && (
                  <div className={styles.macroBarBg}>
                    <div
                      className={styles.macroBarFiber}
                      style={{ width: `${Math.min(100, fiberProgress)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Consumed Meals by Meal Slot */}
          <div className={styles.mealsSection}>
            <div className={styles.sectionTitleRow}>
              <div>
                <h3 className={styles.sectionTitle}>
                  Meals Recorded for {isToday ? 'Today' : dateFormatted}
                </h3>
                <p className={styles.sectionSubtitle}>
                  Includes meals marked as cooked from your meal planner and manual food logs
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setEditingMeal(null);
                  setIsLogModalOpen(true);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={15} />
                <span>Quick Log Meal</span>
              </button>
            </div>

            <div className={styles.mealSlotsContainer}>
              {MEAL_SLOTS.map((slot) => {
                const SlotIcon = slot.icon;
                const slotMeals = mealsBySlot[slot.key] || [];
                const slotCalories = slotMeals.reduce((acc, m) => acc + (m.calories || 0), 0);

                return (
                  <div key={slot.key} className={styles.slotBlock}>
                    <div className={styles.slotHeader}>
                      <div className={styles.slotTitleGroup}>
                        <div
                          className={styles.slotIconWrap}
                          style={{ backgroundColor: `${slot.color}15`, color: slot.color }}
                        >
                          <SlotIcon size={18} />
                        </div>
                        <span className={styles.slotLabel}>{slot.label}</span>
                        <span className={styles.slotCount}>
                          ({slotMeals.length} item{slotMeals.length !== 1 ? 's' : ''})
                        </span>
                      </div>

                      {slotCalories > 0 && (
                        <span className={styles.slotCalSummary}>
                          {slotCalories} kcal
                        </span>
                      )}
                    </div>

                    {slotMeals.length === 0 ? (
                      <div className={styles.emptySlot}>
                        <span className={styles.emptySlotText}>No {slot.label.toLowerCase()} logged yet.</span>
                        <button
                          type="button"
                          className={styles.emptySlotAddBtn}
                          onClick={() => {
                            setEditingMeal(null);
                            setIsLogModalOpen(true);
                          }}
                        >
                          <Plus size={13} />
                          <span>Add {slot.label}</span>
                        </button>
                      </div>
                    ) : (
                      <div className={styles.slotMealsList}>
                        {slotMeals.map((meal) => (
                          <div key={meal.id} className={styles.mealItemCard}>
                            <div className={styles.mealMainInfo}>
                              <div className={styles.mealTitleRow}>
                                <strong className={styles.mealTitle}>
                                  {meal.recipeTitle}
                                </strong>
                                <span className={`${styles.sourceBadge} ${styles['source' + meal.source]}`}>
                                  {meal.source === 'COOKED_PLAN'
                                    ? 'Cooked Meal Plan'
                                    : meal.source === 'RECIPE'
                                    ? 'Recipe Log'
                                    : 'Manual Log'}
                                </span>
                              </div>

                              <div className={styles.mealMetaRow}>
                                <span>{meal.servingsConsumed} serving(s)</span>
                                {meal.notes && (
                                  <>
                                    <span>•</span>
                                    <span className={styles.mealNotes}>{meal.notes}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className={styles.mealNutrientsGroup}>
                              <div className={styles.mealNutrientCol}>
                                <span className={styles.mealNutrientLabel}>Calories</span>
                                <strong className={styles.mealNutrientVal}>{meal.calories}</strong>
                              </div>
                              <div className={styles.mealNutrientCol}>
                                <span className={styles.mealNutrientLabel}>Protein</span>
                                <strong>{meal.protein ?? '—'}g</strong>
                              </div>
                              <div className={styles.mealNutrientCol}>
                                <span className={styles.mealNutrientLabel}>Carbs</span>
                                <strong>{meal.carbs ?? '—'}g</strong>
                              </div>
                              <div className={styles.mealNutrientCol}>
                                <span className={styles.mealNutrientLabel}>Fat</span>
                                <strong>{meal.fat ?? '—'}g</strong>
                              </div>
                            </div>

                            <div className={styles.mealItemActions}>
                              <button
                                type="button"
                                className={styles.actionIconBtn}
                                onClick={() => handleEditMeal(meal)}
                                title="Edit meal portion or notes"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                type="button"
                                className={`${styles.actionIconBtn} ${styles.deleteIconBtn}`}
                                onClick={() => handleDeleteMeal(meal.id)}
                                title="Delete meal entry"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WEEKLY TRENDS & AVERAGES */}
      {activeTab === 'trends' && (
        <div className={styles.tabContent}>
          {weeklyData ? (
            <div className={styles.weeklyContainer}>
              {/* Weekly Stat Metric Cards */}
              <div className={styles.weeklyStatsGrid}>
                <div className={styles.weeklyStatCard}>
                  <span className={styles.weeklyStatLabel}>Weekly Total Calories</span>
                  <strong className={styles.weeklyStatVal}>
                    {weeklyData.weeklyTotals?.calories || 0}
                  </strong>
                  <span className={styles.weeklyStatSub}>Across active tracked days</span>
                </div>

                <div className={styles.weeklyStatCard}>
                  <span className={styles.weeklyStatLabel}>Daily Average Energy</span>
                  <strong className={styles.weeklyStatVal}>
                    {weeklyData.dailyAverages?.calories || 0} kcal
                  </strong>
                  <span className={styles.weeklyStatSub}>
                    Calculated over {weeklyData.activeDaysCount || 0} recorded day(s)
                  </span>
                </div>

                <div className={styles.weeklyStatCard}>
                  <span className={styles.weeklyStatLabel}>Daily Average Protein</span>
                  <strong className={styles.weeklyStatVal}>
                    {weeklyData.dailyAverages?.protein || 0} g
                  </strong>
                  <span className={styles.weeklyStatSub}>
                    Target: {targets.proteinTarget ? `${targets.proteinTarget}g` : 'Not set'}
                  </span>
                </div>

                <div className={styles.weeklyStatCard}>
                  <span className={styles.weeklyStatLabel}>Active Days Tracked</span>
                  <strong className={styles.weeklyStatVal}>
                    {weeklyData.activeDaysCount || 0} / 7
                  </strong>
                  <span className={styles.weeklyStatSub}>Past 7 days activity</span>
                </div>
              </div>

              {/* 7-Day CSS Bar Chart */}
              <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <div>
                    <h3 className={styles.chartTitle}>7-Day Caloric Intake Pattern</h3>
                    <p className={styles.chartSubtitle}>
                      Hover over any day to see full macronutrient breakdowns
                    </p>
                  </div>
                  {targets.calorieTarget && (
                    <div className={styles.targetLegend}>
                      <span className={styles.legendLine}></span>
                      <span>Target: {targets.calorieTarget} kcal</span>
                    </div>
                  )}
                </div>

                <div className={styles.barsContainer}>
                  {weeklyData.days?.map((day) => {
                    const maxVal = Math.max(
                      targets.calorieTarget || 2200,
                      ...weeklyData.days.map((d) => d.calories || 0),
                      1800
                    );
                    const barHeightPct = Math.min(100, Math.round(((day.calories || 0) / maxVal) * 100));
                    const isTargetMet = targets.calorieTarget
                      ? Math.abs((day.calories || 0) - targets.calorieTarget) <= 150
                      : true;

                    return (
                      <div key={day.date} className={styles.barCol}>
                        <div className={styles.barWrap}>
                          {day.calories > 0 ? (
                            <div
                              className={styles.barFill}
                              style={{
                                height: `${Math.max(6, barHeightPct)}%`,
                                backgroundColor: isTargetMet
                                  ? 'var(--color-primary)'
                                  : (day.calories > (targets.calorieTarget || 2500))
                                  ? 'var(--color-warning)'
                                  : 'var(--color-secondary)'
                              }}
                            >
                              <span className={styles.barTooltip}>
                                <strong>{day.date}</strong>
                                <div>{day.calories} kcal</div>
                                <div>Protein: {day.protein}g</div>
                                <div>Carbs: {day.carbs}g • Fat: {day.fat}g</div>
                              </span>
                            </div>
                          ) : (
                            <div className={styles.emptyBarFill} title="No consumption recorded" />
                          )}
                        </div>
                        <div className={styles.barXLabel}>
                          <span>{day.dayOfWeek}</span>
                          <span className={styles.barDateSub}>{day.date.split('-').slice(1).join('/')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.loadingBox}>Loading weekly trend patterns...</div>
          )}
        </div>
      )}

      {/* TAB 3: CONSUMPTION HISTORY LEDGER */}
      {activeTab === 'history' && (
        <div className={styles.tabContent}>
          <div className={styles.historyCard}>
            <div className={styles.historyHeader}>
              <div>
                <h3 className={styles.sectionTitle}>Full Consumption Ledger</h3>
                <p className={styles.sectionSubtitle}>
                  Immutable audit trail of all cooked meals, portions, and manual nutritional logs
                </p>
              </div>

              {/* Filter by meal slot */}
              <div className={styles.historyFilters}>
                {['ALL', 'BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`${styles.filterBtn} ${historyFilter === f ? styles.filterBtnActive : ''}`}
                    onClick={() => setHistoryFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {historyLoading ? (
              <div className={styles.loadingBox}>Loading historical consumption ledger...</div>
            ) : historyItems.length === 0 ? (
              <div className={styles.emptyHistory}>
                <History size={32} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                <strong>No consumption logs found</strong>
                <p>Meals recorded as cooked or logged manually will appear here.</p>
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.historyTable}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Meal Slot</th>
                      <th>Dish / Food</th>
                      <th>Servings</th>
                      <th>Calories</th>
                      <th>Protein</th>
                      <th>Carbs</th>
                      <th>Fat</th>
                      <th>Source</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyItems.map((item) => (
                      <tr
                        key={item.id}
                        className={item.isReversed ? styles.rowReversed : ''}
                      >
                        <td>
                          {new Date(item.scheduledDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td>
                          <span className={styles.slotTag}>{item.mealType}</span>
                        </td>
                        <td>
                          <strong>{item.recipeTitle}</strong>
                          {item.isReversed && (
                            <span className={styles.reversedBadge}>
                              Reversed
                            </span>
                          )}
                        </td>
                        <td>{item.servingsConsumed}</td>
                        <td>
                          <strong>{item.calories} kcal</strong>
                        </td>
                        <td>{item.protein !== null ? `${item.protein}g` : '—'}</td>
                        <td>{item.carbs !== null ? `${item.carbs}g` : '—'}</td>
                        <td>{item.fat !== null ? `${item.fat}g` : '—'}</td>
                        <td>
                          <span className={styles.sourceTag}>{item.source}</span>
                        </td>
                        <td>
                          <div className={styles.tableActions}>
                            <button
                              type="button"
                              className={styles.tableActionBtn}
                              onClick={() => handleEditMeal(item)}
                              title="Edit record"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              className={`${styles.tableActionBtn} ${styles.deleteIconBtn}`}
                              onClick={() => handleDeleteMeal(item.id)}
                              title="Delete record"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODALS */}
      <DietaryGoalsModal
        isOpen={isGoalsModalOpen}
        onClose={() => setIsGoalsModalOpen(false)}
        onUpdated={() => loadData()}
      />

      <LogMealModal
        isOpen={isLogModalOpen}
        onClose={() => {
          setIsLogModalOpen(false);
          setEditingMeal(null);
        }}
        initialDate={selectedDate}
        editingMeal={editingMeal}
        onSaved={() => loadData()}
      />

      <AiNutritionModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        todayStats={dailyData}
        profile={profile}
      />
    </div>
  );
}
