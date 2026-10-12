import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CalendarDays,
  Calendar,
  Grid,
  ChevronLeft,
  ChevronRight,
  Plus,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  Sparkles,
  Layers,
  Utensils
} from 'lucide-react';
import {
  fetchMealPlans,
  deleteMealPlan,
  skipMealPlan,
  cancelMealPlan,
  fetchMealPlanRequirements
} from '../services/api.js';
import ScheduleMealModal from '../components/planner/ScheduleMealModal.jsx';
import CookMealModal from '../components/planner/CookMealModal.jsx';
import ReverseConsumptionModal from '../components/planner/ReverseConsumptionModal.jsx';
import MealCard from '../components/planner/MealCard.jsx';
import MealRequirementsView from '../components/planner/MealRequirementsView.jsx';
import RecipeDetailModal from '../components/recipes/RecipeDetailModal.jsx';
import styles from './MealPlannerPage.module.css';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function MealPlannerPage() {
  // Navigation & View Mode
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState('weekly'); // 'weekly' | 'monthly' | 'requirements'

  // Data states
  const [mealPlans, setMealPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successBanner, setSuccessBanner] = useState(null);

  // Requirements state
  const [requirementsData, setRequirementsData] = useState({ requirements: [], summary: {} });
  const [loadingRequirements, setLoadingRequirements] = useState(false);

  // Modals state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [targetDateForSchedule, setTargetDateForSchedule] = useState(null);
  const [mealToEdit, setMealToEdit] = useState(null);

  const [mealToCook, setMealToCook] = useState(null);
  const [mealToRevert, setMealToRevert] = useState(null);
  const [selectedRecipeForDetails, setSelectedRecipeForDetails] = useState(null);

  // Auto-dismiss success notification
  useEffect(() => {
    if (successBanner) {
      const t = setTimeout(() => setSuccessBanner(null), 4000);
      return () => clearTimeout(t);
    }
  }, [successBanner]);

  // Calculate start and end dates based on view mode
  const { fromIso, toIso, dateRangeLabel, weekDays } = useMemo(() => {
    const d = new Date(currentDate);

    if (viewMode === 'monthly') {
      const year = d.getFullYear();
      const month = d.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      const fromStr = firstDay.toISOString().split('T')[0];
      const toStr = lastDay.toISOString().split('T')[0];
      const monthLabel = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      // Generate calendar grid days for month (including lead/trail days)
      const daysInMonth = lastDay.getDate();
      const startDayIndex = (firstDay.getDay() + 6) % 7; // Monday = 0

      return {
        fromIso: fromStr,
        toIso: toStr,
        dateRangeLabel: monthLabel,
        weekDays: [],
        daysInMonth,
        startDayIndex,
        year,
        month
      };
    }

    // Weekly view (Monday to Sunday)
    const dayOfWeek = (d.getDay() + 6) % 7; // 0 for Monday, 6 for Sunday
    const monday = new Date(d);
    monday.setDate(d.getDate() - dayOfWeek);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const fromStr = monday.toISOString().split('T')[0];
    const toStr = sunday.toISOString().split('T')[0];

    // Array of 7 days
    const daysArr = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      const isoStr = dayDate.toISOString().split('T')[0];
      const isToday = isoStr === new Date().toISOString().split('T')[0];
      daysArr.push({
        date: dayDate,
        isoStr,
        dayName: DAYS_OF_WEEK[i],
        dayNumber: dayDate.getDate(),
        isToday
      });
    }

    const rangeLabel = `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    return {
      fromIso: fromStr,
      toIso: toStr,
      dateRangeLabel: rangeLabel,
      weekDays: daysArr
    };
  }, [currentDate, viewMode]);

  // Load meal plans from backend
  const loadMealPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchMealPlans({ from: fromIso, to: toIso });
      setMealPlans(res.mealPlans || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load meal plans.');
    } finally {
      setLoading(false);
    }
  }, [fromIso, toIso]);

  // Load requirements when requirements tab is active
  const loadRequirements = useCallback(async () => {
    try {
      setLoadingRequirements(true);
      const res = await fetchMealPlanRequirements({ from: fromIso, to: toIso });
      setRequirementsData({
        requirements: res.requirements || [],
        summary: res.summary || {}
      });
    } catch (err) {
      console.warn('Failed to load requirements:', err);
    } finally {
      setLoadingRequirements(false);
    }
  }, [fromIso, toIso]);

  useEffect(() => {
    loadMealPlans();
    if (viewMode === 'requirements') {
      loadRequirements();
    }
  }, [loadMealPlans, loadRequirements, viewMode]);

  // Date Navigation Handlers
  const handlePrev = () => {
    const nextD = new Date(currentDate);
    if (viewMode === 'monthly') {
      nextD.setMonth(nextD.getMonth() - 1);
    } else {
      nextD.setDate(nextD.getDate() - 7);
    }
    setCurrentDate(nextD);
  };

  const handleNext = () => {
    const nextD = new Date(currentDate);
    if (viewMode === 'monthly') {
      nextD.setMonth(nextD.getMonth() + 1);
    } else {
      nextD.setDate(nextD.getDate() + 7);
    }
    setCurrentDate(nextD);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Schedule Modal Triggers
  const handleOpenScheduleModal = (dateStr = null) => {
    setMealToEdit(null);
    setTargetDateForSchedule(dateStr);
    setIsScheduleModalOpen(true);
  };

  const handleOpenEditModal = (meal) => {
    setMealToEdit(meal);
    setTargetDateForSchedule(meal.scheduledDateStr);
    setIsScheduleModalOpen(true);
  };

  // Skip Meal
  const handleSkipMeal = async (meal) => {
    try {
      await skipMealPlan(meal.id);
      setSuccessBanner(`Meal "${meal.recipe?.title}" was marked as skipped.`);
      await loadMealPlans();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to skip meal.');
    }
  };

  // Cancel Meal
  const handleCancelMeal = async (meal) => {
    try {
      await cancelMealPlan(meal.id);
      setSuccessBanner(`Meal "${meal.recipe?.title}" was cancelled.`);
      await loadMealPlans();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel meal.');
    }
  };

  // Delete Meal
  const handleDeleteMeal = async (meal) => {
    if (!window.confirm(`Remove "${meal.recipe?.title}" from your meal plan?`)) return;
    try {
      await deleteMealPlan(meal.id);
      setSuccessBanner(`Removed "${meal.recipe?.title}" from meal plan.`);
      await loadMealPlans();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete planned meal.');
    }
  };

  // Group meals by scheduled date string (YYYY-MM-DD)
  const mealsByDate = useMemo(() => {
    const map = {};
    for (const meal of mealPlans) {
      const dateKey = meal.scheduledDateStr || meal.scheduledDate?.split('T')[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(meal);
    }
    return map;
  }, [mealPlans]);

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerBadge}>
            <CalendarDays size={14} />
            <span>Weekly & Monthly Menu Planner</span>
          </div>
          <h1 className={styles.title}>Household Meal Planner</h1>
          <p className={styles.subtitle}>
            Schedule dishes in advance, review pantry requirements, and automatically deduct stock when meals are cooked.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => handleOpenScheduleModal()}
          id="plan-meal-button"
        >
          <Plus size={18} />
          <span>Plan a Meal</span>
        </button>
      </div>

      {/* Notifications */}
      {successBanner && (
        <div className={styles.successBanner} role="status">
          <CheckCircle2 size={18} style={{ color: 'var(--color-success)' }} />
          <span>{successBanner}</span>
        </div>
      )}

      {error && (
        <div className={styles.errorBanner} role="alert">
          <AlertCircle size={18} style={{ color: 'var(--color-danger)' }} />
          <span>{error}</span>
          <button type="button" onClick={loadMealPlans} className={styles.retryBtn}>
            Retry
          </button>
        </div>
      )}

      {/* Navigation Toolbar */}
      <div className={styles.toolbarCard}>
        <div className={styles.dateNavGroup}>
          <div className={styles.navArrows}>
            <button
              type="button"
              className={styles.navBtn}
              onClick={handlePrev}
              aria-label="Previous period"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className={styles.navBtn}
              onClick={handleNext}
              aria-label="Next period"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button type="button" className={styles.todayBtn} onClick={handleToday}>
            Today
          </button>

          <span className={styles.dateRangeText}>{dateRangeLabel}</span>
        </div>

        {/* View Mode Switcher */}
        <div className={styles.viewModeGroup}>
          <button
            type="button"
            className={`${styles.viewBtn} ${viewMode === 'weekly' ? styles.viewBtnActive : ''}`}
            onClick={() => setViewMode('weekly')}
          >
            <CalendarDays size={15} />
            <span>Weekly</span>
          </button>

          <button
            type="button"
            className={`${styles.viewBtn} ${viewMode === 'monthly' ? styles.viewBtnActive : ''}`}
            onClick={() => setViewMode('monthly')}
          >
            <Grid size={15} />
            <span>Monthly</span>
          </button>

          <button
            type="button"
            className={`${styles.viewBtn} ${viewMode === 'requirements' ? styles.viewBtnActive : ''}`}
            onClick={() => setViewMode('requirements')}
          >
            <ShoppingCart size={15} />
            <span>Ingredients & Shortfalls</span>
          </button>
        </div>
      </div>

      {/* Main Content Areas */}
      {viewMode === 'requirements' ? (
        /* Requirements / Shortfalls View */
        <MealRequirementsView
          requirements={requirementsData.requirements}
          summary={requirementsData.summary}
          loading={loadingRequirements}
          dateRangeLabel={dateRangeLabel}
        />
      ) : viewMode === 'weekly' ? (
        /* Weekly Calendar View */
        <div className={styles.weeklyGrid}>
          {weekDays.map((day) => {
            const dayMeals = mealsByDate[day.isoStr] || [];

            return (
              <div
                key={day.isoStr}
                className={`${styles.dayColumn} ${day.isToday ? styles.dayColumnToday : ''}`}
              >
                {/* Day Header */}
                <div className={styles.dayColHeader}>
                  <div className={styles.dayColTitle}>
                    <span className={styles.dayName}>{day.dayName}</span>
                    <span className={`${styles.dayNumber} ${day.isToday ? styles.dayNumberToday : ''}`}>
                      {day.dayNumber}
                    </span>
                  </div>

                  <button
                    type="button"
                    className={styles.addMealDayBtn}
                    onClick={() => handleOpenScheduleModal(day.isoStr)}
                    title={`Add meal for ${day.dayName}`}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Meals List */}
                <div className={styles.dayMealsList}>
                  {dayMeals.length === 0 ? (
                    <div className={styles.emptyDayBox}>
                      <span className={styles.emptyDayText}>No meals planned</span>
                      <button
                        type="button"
                        className={styles.quickAddLink}
                        onClick={() => handleOpenScheduleModal(day.isoStr)}
                      >
                        + Add dish
                      </button>
                    </div>
                  ) : (
                    dayMeals.map((meal) => (
                      <MealCard
                        key={meal.id}
                        meal={meal}
                        onCookClick={(m) => setMealToCook(m)}
                        onRevertClick={(m) => setMealToRevert(m)}
                        onEditClick={(m) => handleOpenEditModal(m)}
                        onSkipClick={handleSkipMeal}
                        onCancelClick={handleCancelMeal}
                        onDeleteClick={handleDeleteMeal}
                        onViewRecipe={(recipe) => setSelectedRecipeForDetails(recipe)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Monthly Calendar View */
        <div className={styles.monthlyContainer}>
          <div className={styles.monthlyDaysHeader}>
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} className={styles.monthDayHeaderCell}>
                {d}
              </div>
            ))}
          </div>

          <div className={styles.monthlyGrid}>
            {/* Generate calendar cells for the month */}
            {Array.from({ length: 35 }).map((_, i) => {
              // Basic monthly cell mapping
              const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
              const startDayIdx = (d.getDay() + 6) % 7;
              const cellDateNum = i - startDayIdx + 1;
              const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), cellDateNum);
              const isCurrentMonth = cellDate.getMonth() === currentDate.getMonth();
              const isoStr = cellDate.toISOString().split('T')[0];
              const cellMeals = mealsByDate[isoStr] || [];
              const isToday = isoStr === new Date().toISOString().split('T')[0];

              return (
                <div
                  key={i}
                  className={`${styles.monthCell} ${!isCurrentMonth ? styles.monthCellMuted : ''} ${isToday ? styles.monthCellToday : ''}`}
                  onClick={() => handleOpenScheduleModal(isoStr)}
                >
                  <div className={styles.monthCellHeader}>
                    <span className={`${styles.monthCellDay} ${isToday ? styles.monthCellDayToday : ''}`}>
                      {cellDate.getDate()}
                    </span>
                    {cellMeals.length > 0 && (
                      <span className={styles.monthMealCount}>{cellMeals.length}</span>
                    )}
                  </div>

                  <div className={styles.monthCellMeals}>
                    {cellMeals.slice(0, 3).map((m) => (
                      <div
                        key={m.id}
                        className={`${styles.monthMealPill} ${m.status === 'COOKED' ? styles.pillCooked : ''}`}
                        title={`${m.mealType}: ${m.recipe?.title} (${m.status})`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecipeForDetails(m.recipe);
                        }}
                      >
                        <span className={styles.pillType}>{m.mealType.slice(0, 1)}</span>
                        <span className={styles.pillTitle}>{m.recipe?.title}</span>
                      </div>
                    ))}
                    {cellMeals.length > 3 && (
                      <span className={styles.morePill}>+{cellMeals.length - 3} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      <ScheduleMealModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        initialDate={targetDateForSchedule}
        mealPlanToEdit={mealToEdit}
        onMealSaved={(savedMeal, action) => {
          setSuccessBanner(`Meal "${savedMeal.recipe?.title}" was ${action === 'updated' ? 'updated' : 'scheduled'}.`);
          loadMealPlans();
        }}
      />

      {mealToCook && (
        <CookMealModal
          isOpen={Boolean(mealToCook)}
          meal={mealToCook}
          onClose={() => setMealToCook(null)}
          onCooked={(cookedMeal, deductions) => {
            setSuccessBanner(`"${cookedMeal.recipe?.title}" was marked cooked! Deducted ${deductions?.length || 0} items from pantry stock.`);
            loadMealPlans();
          }}
        />
      )}

      {mealToRevert && (
        <ReverseConsumptionModal
          isOpen={Boolean(mealToRevert)}
          meal={mealToRevert}
          onClose={() => setMealToRevert(null)}
          onReversed={(revertedMeal) => {
            setSuccessBanner(`Cooking reverted for "${revertedMeal.recipe?.title}". Quantities restored to pantry.`);
            loadMealPlans();
          }}
        />
      )}

      {selectedRecipeForDetails && (
        <RecipeDetailModal
          recipe={selectedRecipeForDetails}
          onClose={() => setSelectedRecipeForDetails(null)}
          onScheduleMeal={(rec) => {
            setSelectedRecipeForDetails(null);
            handleOpenScheduleModal();
          }}
        />
      )}
    </div>
  );
}
