import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Utensils, Refrigerator, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import StatCard from '../components/common/StatCard.jsx';
import SectionHeader from '../components/common/SectionHeader.jsx';
import QuickActionCard from '../components/dashboard/QuickActionCard.jsx';
import IngredientPreview from '../components/dashboard/IngredientPreview.jsx';
import RecipeCard from '../components/recipes/RecipeCard.jsx';
import RecipeDetailModal from '../components/recipes/RecipeDetailModal.jsx';
import MealSchedulePreview from '../components/dashboard/MealSchedulePreview.jsx';
import WasteAwarenessCard from '../components/dashboard/WasteAwarenessCard.jsx';
import ShoppingSummaryCard from '../components/dashboard/ShoppingSummaryCard.jsx';
import {
  fetchInventorySummary,
  fetchInventoryItems,
  fetchRecipeMatches,
  addRecipeFavourite,
  removeRecipeFavourite,
  fetchDashboardMealSummary,
  fetchDashboardShoppingSummary
} from '../services/api.js';
import {
  mockUpcomingMeals,
  mockQuickActions
} from '../data/mockDashboardData.js';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [summary, setSummary] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState(null);

  const [matchedRecipes, setMatchedRecipes] = useState([]);
  const [recipesLoading, setRecipesLoading] = useState(true);

  // Phase 7: Live Upcoming Meal Schedule
  const [upcomingMealSchedule, setUpcomingMealSchedule] = useState([]);
  const [mealsLoading, setMealsLoading] = useState(true);

  // Phase 8: Live Shopping & Grocery Budget Summary
  const [shoppingSummary, setShoppingSummary] = useState({});
  const [shoppingLoading, setShoppingLoading] = useState(true);

  const { user } = useAuth();
  const firstName = user?.name ? user.name.split(' ')[0] : null;

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      setInventoryLoading(true);
      setRecipesLoading(true);
      setMealsLoading(true);
      setShoppingLoading(true);

      try {
        const [sumData, itemsData, matchesData, mealSumData, shopSumData] = await Promise.all([
          fetchInventorySummary(),
          fetchInventoryItems({ sortBy: 'expiryDate', sortOrder: 'asc' }),
          fetchRecipeMatches(),
          fetchDashboardMealSummary().catch(() => null),
          fetchDashboardShoppingSummary().catch(() => null)
        ]);

        if (isMounted) {
          setSummary(sumData);
          setInventoryItems(itemsData?.items ? itemsData.items.slice(0, 5) : []);

          // Top matched recipes
          const matches = matchesData?.data?.matches || [];
          setMatchedRecipes(matches.slice(0, 3));

          // Phase 8: Shopping Summary
          if (shopSumData?.success && shopSumData?.data) {
            setShoppingSummary(shopSumData.data);
          }

          // Format live meal plans for dashboard
          if (mealSumData?.todayMeals?.length > 0 || mealSumData?.nextUpcomingMeal) {
            const groups = [];
            if (mealSumData.todayMeals?.length > 0) {
              groups.push({
                day: 'Today',
                dateLabel: 'Today’s Menu',
                meals: mealSumData.todayMeals.map((m) => ({
                  mealType: m.mealType,
                  title: m.recipe?.title,
                  servings: m.servings,
                  status: m.status
                }))
              });
            }
            if (mealSumData.nextUpcomingMeal && (!mealSumData.todayMeals || !mealSumData.todayMeals.some((m) => m.id === mealSumData.nextUpcomingMeal.id))) {
              groups.push({
                day: 'Upcoming',
                dateLabel: mealSumData.nextUpcomingMeal.scheduledDateStr,
                meals: [{
                  mealType: mealSumData.nextUpcomingMeal.mealType,
                  title: mealSumData.nextUpcomingMeal.recipe?.title,
                  servings: mealSumData.nextUpcomingMeal.servings,
                  status: mealSumData.nextUpcomingMeal.status
                }]
              });
            }
            setUpcomingMealSchedule(groups);
          } else {
            setUpcomingMealSchedule([]);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load dashboard data:', err);
          setInventoryError('Unable to load live kitchen data');
        }
      } finally {
        if (isMounted) {
          setInventoryLoading(false);
          setRecipesLoading(false);
          setMealsLoading(false);
          setShoppingLoading(false);
        }
      }
    }

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleFavourite = async (recipe) => {
    const isFav = recipe.isFavourite;
    setMatchedRecipes((prev) =>
      prev.map((r) => (r.id === recipe.id ? { ...r, isFavourite: !isFav } : r))
    );
    if (selectedRecipe?.id === recipe.id) {
      setSelectedRecipe((prev) => ({ ...prev, isFavourite: !isFav }));
    }

    try {
      if (isFav) {
        await removeRecipeFavourite(recipe.id);
      } else {
        await addRecipeFavourite(recipe.id);
      }
    } catch {
      // Revert
      setMatchedRecipes((prev) =>
        prev.map((r) => (r.id === recipe.id ? { ...r, isFavourite: isFav } : r))
      );
      if (selectedRecipe?.id === recipe.id) {
        setSelectedRecipe((prev) => ({ ...prev, isFavourite: isFav }));
      }
    }
  };

  const dashboardMetrics = [
    {
      id: 'ingredients-tracked',
      title: 'Ingredients Tracked',
      value: summary ? `${summary.totalItems} items` : '0 items',
      description: 'Cataloged in your kitchen inventory',
      iconName: 'PackageOpen',
      trend: summary?.totalItems > 0 ? `${summary.totalItems} active records` : 'Start by adding stock',
      isPositive: (summary?.totalItems || 0) > 0,
      isNeutral: !summary || summary.totalItems === 0
    },
    {
      id: 'expiring-soon',
      title: 'Expiring Soon',
      value: summary ? `${summary.expiringSoonItems} items` : '0 items',
      description: 'Require attention within 7 days',
      iconName: 'AlertTriangle',
      trend: (summary?.expiringSoonItems || 0) > 0 ? 'Urgent priority' : 'Fresh stock',
      isWarning: (summary?.expiringSoonItems || 0) > 0,
      isPositive: summary && summary.expiringSoonItems === 0
    },
    {
      id: 'meals-planned',
      title: 'Meals Planned',
      value: '7 meals',
      description: 'Scheduled for the next 3 days',
      iconName: 'CalendarCheck',
      trend: 'Schedule on track',
      isPositive: true,
      badge: 'Preview'
    },
    {
      id: 'waste-avoided',
      title: 'Estimated Waste Avoided',
      value: '~1.8 kg',
      description: 'Saved via timely ingredient use',
      iconName: 'Leaf',
      trend: 'Based on consumption log',
      isNeutral: true,
      badge: 'Preview'
    }
  ];

  return (
    <div className={styles.pageContainer}>
      {/* A. Welcome Banner Section */}
      <section className={styles.welcomeBanner} aria-label="Welcome Overview">
        <div className={styles.welcomeContent}>
          <div className={styles.welcomeBadge}>
            <Sparkles size={14} />
            <span>Smart Kitchen Assistant • Phase 4 Active</span>
          </div>
          <h2 className={styles.welcomeTitle}>
            Your kitchen, a little smarter{firstName ? `, ${firstName}` : ''}.
          </h2>
          <p className={styles.welcomeText}>
            Make the most of what you have, discover something delicious, and waste less. Monitor fresh produce freshness windows and discover inspiring recipes tailored to your pantry.
          </p>
          <div className={styles.welcomeActions}>
            <Link to="/recipes" className={styles.welcomeBtnPrimary}>
              <Utensils size={16} />
              <span>Explore Recipes</span>
            </Link>
            <Link to="/inventory" className={styles.welcomeBtnSecondary}>
              <Refrigerator size={16} />
              <span>View Inventory</span>
            </Link>
          </div>
        </div>
      </section>

      {/* B. Summary Cards */}
      <section aria-label="Kitchen Summary Metrics">
        <div className={styles.metricsGrid}>
          {dashboardMetrics.map((metric) => (
            <StatCard
              key={metric.id}
              title={metric.title}
              value={metric.value}
              description={metric.description}
              iconName={metric.iconName}
              trend={metric.trend}
              isPositive={metric.isPositive}
              isWarning={metric.isWarning}
              isNeutral={metric.isNeutral}
              badge={metric.badge}
            />
          ))}
        </div>
      </section>

      {/* F. Quick Actions Grid */}
      <section aria-label="Quick Actions">
        <SectionHeader
          title="Quick Actions"
          subtitle="Direct shortcuts to core kitchen workflows"
        />
        <div className={styles.quickActionsGrid}>
          {mockQuickActions.map((action) => (
            <QuickActionCard
              key={action.id}
              title={action.title}
              description={action.description}
              path={action.path}
              iconName={action.iconName}
              badgeText={action.badgeText}
            />
          ))}
        </div>
      </section>

      {/* C & E. Kitchen Inventory Preview & Upcoming Meals (Split Layout) */}
      <section className={styles.splitSection} aria-label="Kitchen Stock & Meal Schedule">
        <div className={styles.leftCol}>
          <SectionHeader
            title="Kitchen Inventory"
            subtitle="Current stock levels and approaching expiry windows"
            actionText="View all inventory"
            actionTo="/inventory"
            badge="Live Database"
          />
          <IngredientPreview
            items={inventoryItems}
            loading={inventoryLoading}
            error={inventoryError}
          />
        </div>

        <div className={styles.rightCol}>
          <SectionHeader
            title="Upcoming Meals"
            subtitle="Planned daily menu schedule"
            actionText="Meal Planner"
            actionTo="/meal-planner"
            badge="Live Planner"
          />
          <MealSchedulePreview
            schedule={upcomingMealSchedule}
            loading={mealsLoading}
            isLive={true}
          />
        </div>
      </section>

      {/* D. Recipe Discovery Preview (Live Database & Inventory Matched) */}
      <section aria-label="Recommended Recipes">
        <SectionHeader
          title="Discover Recipes"
          subtitle="Real-time recipes matched against your pantry stock"
          actionText="View all recipes"
          actionTo="/recipes"
          badge="Live Matches"
        />
        {recipesLoading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Matching pantry ingredients with recipe database...
          </div>
        ) : matchedRecipes.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No recipes found in the database.
          </div>
        ) : (
          <div className={styles.recipesGrid}>
            {matchedRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={{
                  ...recipe,
                  match: {
                    matchPercentage: recipe.matchPercentage,
                    canCook: recipe.canCook,
                    expiringSoonIngredients: recipe.expiringSoonIngredients
                  }
                }}
                onOpenDetails={(item) => setSelectedRecipe(item)}
                onToggleFavourite={handleToggleFavourite}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            ))}
          </div>
        )}
      </section>

      {/* H. Smart Grocery Shopping & Budget Summary */}
      <section aria-label="Grocery Shopping & Budget">
        <SectionHeader
          title="Smart Grocery Shopping & Budget"
          subtitle="Real-time grocery expenditure tracking and pending shopping shortfalls"
          actionText="Manage Shopping Lists"
          actionTo="/shopping-list"
          badge="Live Grocery"
        />
        <ShoppingSummaryCard summary={shoppingSummary} loading={shoppingLoading} />
      </section>

      {/* G. Food-waste awareness informational section */}
      <section aria-label="Food Waste Awareness">
        <WasteAwarenessCard />
      </section>

      {/* Recipe Details Interactive Modal */}
      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onToggleFavourite={handleToggleFavourite}
          onEdit={() => {}}
          onDelete={() => {}}
        />
      )}
    </div>
  );
}

