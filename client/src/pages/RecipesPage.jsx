import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Search,
  Filter,
  RotateCcw,
  Heart,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  X,
  SlidersHorizontal,
  Flame,
  ArrowUpDown
} from 'lucide-react';
import RecipeCard from '../components/recipes/RecipeCard.jsx';
import RecipeDetailModal from '../components/recipes/RecipeDetailModal.jsx';
import RecipeFormModal from '../components/recipes/RecipeFormModal.jsx';
import DeleteRecipeModal from '../components/recipes/DeleteRecipeModal.jsx';
import AiRecipeGeneratorModal from '../components/recipes/AiRecipeGeneratorModal.jsx';
import AiRecipeModifyModal from '../components/recipes/AiRecipeModifyModal.jsx';
import AiSubstitutionModal from '../components/recipes/AiSubstitutionModal.jsx';
import ScheduleMealModal from '../components/planner/ScheduleMealModal.jsx';
import {
  fetchRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  addRecipeFavourite,
  removeRecipeFavourite
} from '../services/api.js';
import styles from './RecipesPage.module.css';

const CATEGORIES = [
  'All',
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snacks',
  'Vegetarian',
  'Quick Meals'
];

const CUISINES = [
  'All',
  'Indian',
  'Italian',
  'Asian',
  'Western',
  'Continental'
];

const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];

export default function RecipesPage() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Active view tab: 'all', 'canCook', 'myRecipes', 'favourites'
  const [activeTab, setActiveTab] = useState('all');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [maxPrepTime, setMaxPrepTime] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals state
  const [selectedRecipeForDetails, setSelectedRecipeForDetails] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [recipeToEdit, setRecipeToEdit] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Phase 6 AI Modals state
  const [isAiGeneratorOpen, setIsAiGeneratorOpen] = useState(false);
  const [recipeToModify, setRecipeToModify] = useState(null);
  const [substitutionTarget, setSubstitutionTarget] = useState(null);

  // Phase 7 Meal Planner Modal state
  const [recipeToSchedule, setRecipeToSchedule] = useState(null);

  const requestIdRef = useRef(0);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load recipes with active filters
  const loadRecipes = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const params = {
        search: debouncedSearch.trim() || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        cuisine: selectedCuisine !== 'All' ? selectedCuisine : undefined,
        difficulty: selectedDifficulty !== 'All' ? selectedDifficulty : undefined,
        maxPrepTime: maxPrepTime ? Number(maxPrepTime) : undefined,
        sortBy,
        sortOrder,
        favouritesOnly: favouritesOnly || activeTab === 'favourites' ? 'true' : undefined,
        availableOnly: availableOnly || activeTab === 'canCook' ? 'true' : undefined
      };

      const res = await fetchRecipes(params);

      if (currentRequestId === requestIdRef.current) {
        let items = res.data?.recipes || [];

        // In-memory tab filtering for "My Recipes"
        if (activeTab === 'myRecipes') {
          items = items.filter((r) => r.isOwner);
        }

        setRecipes(items);
      }
    } catch (err) {
      if (currentRequestId === requestIdRef.current) {
        setError(err.response?.data?.message || 'Failed to load recipes. Please try again.');
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [
    debouncedSearch,
    selectedCategory,
    selectedCuisine,
    selectedDifficulty,
    maxPrepTime,
    sortBy,
    sortOrder,
    availableOnly,
    favouritesOnly,
    activeTab
  ]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  // Auto-dismiss success notification
  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [successMessage]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedCategory('All');
    setSelectedCuisine('All');
    setSelectedDifficulty('All');
    setMaxPrepTime('');
    setAvailableOnly(false);
    setFavouritesOnly(false);
    setSortBy('createdAt');
    setSortOrder('desc');
    setActiveTab('all');
  };

  const hasActiveFilters =
    debouncedSearch.trim() !== '' ||
    selectedCategory !== 'All' ||
    selectedCuisine !== 'All' ||
    selectedDifficulty !== 'All' ||
    maxPrepTime !== '' ||
    availableOnly ||
    favouritesOnly ||
    activeTab !== 'all' ||
    sortBy !== 'createdAt' ||
    sortOrder !== 'desc';

  // Toggle favourite
  const handleToggleFavourite = async (recipe) => {
    const isFav = recipe.isFavourite;
    // Optimistic UI update
    setRecipes((prev) =>
      prev.map((r) => (r.id === recipe.id ? { ...r, isFavourite: !isFav } : r))
    );

    if (selectedRecipeForDetails?.id === recipe.id) {
      setSelectedRecipeForDetails((prev) => ({ ...prev, isFavourite: !isFav }));
    }

    try {
      if (isFav) {
        await removeRecipeFavourite(recipe.id);
      } else {
        await addRecipeFavourite(recipe.id);
      }
    } catch (err) {
      // Revert on error
      setRecipes((prev) =>
        prev.map((r) => (r.id === recipe.id ? { ...r, isFavourite: isFav } : r))
      );
      if (selectedRecipeForDetails?.id === recipe.id) {
        setSelectedRecipeForDetails((prev) => ({ ...prev, isFavourite: isFav }));
      }
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setRecipeToEdit(null);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (recipe) => {
    setRecipeToEdit(recipe);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (recipe) => {
    setRecipeToDelete(recipe);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  // Save recipe (create or update)
  const handleSaveRecipe = async (payload) => {
    setFormLoading(true);
    setFormError(null);

    try {
      if (recipeToEdit) {
        await updateRecipe(recipeToEdit.id, payload);
        setSuccessMessage(`"${payload.title}" was updated successfully.`);
      } else {
        await createRecipe(payload);
        setSuccessMessage(`"${payload.title}" was created and saved to your recipes.`);
      }

      setIsFormModalOpen(false);
      setRecipeToEdit(null);
      await loadRecipes();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Unable to save recipe. Please check details.');
    } finally {
      setFormLoading(false);
    }
  };

  // Confirm delete recipe
  const handleConfirmDelete = async () => {
    if (!recipeToDelete) return;
    setDeleteLoading(true);
    setDeleteError(null);

    try {
      await deleteRecipe(recipeToDelete.id);
      setSuccessMessage(`"${recipeToDelete.title}" was deleted.`);
      setIsDeleteModalOpen(false);
      setRecipeToDelete(null);
      if (selectedRecipeForDetails?.id === recipeToDelete.id) {
        setSelectedRecipeForDetails(null);
      }
      await loadRecipes();
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete recipe.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Phase 6 AI Handlers
  const handleSaveAiGeneratedRecipe = async (recipeData) => {
    try {
      const payload = {
        title: recipeData.title,
        description: recipeData.description || '',
        instructions: Array.isArray(recipeData.instructions)
          ? recipeData.instructions.join('\n')
          : (recipeData.instructions || ''),
        prepTimeMinutes: Number(recipeData.prepTimeMinutes) || 15,
        cookTimeMinutes: Number(recipeData.cookTimeMinutes) || 20,
        servings: Number(recipeData.servings) || 2,
        difficulty: recipeData.difficulty || 'medium',
        cuisine: recipeData.cuisine || 'Indian',
        category: recipeData.category || recipeData.mealType || 'Dinner',
        imageUrl: recipeData.imageUrl || '',
        isPublic: false,
        ingredients: (recipeData.ingredients || []).map((ing) => ({
          name: ing.name,
          quantity: Number(ing.quantity) || 1,
          unit: ing.unit || 'unit',
          optional: Boolean(ing.optional || ing.isOptional)
        }))
      };
      await createRecipe(payload);
      setSuccessMessage(`"${payload.title}" was saved to your recipes.`);
      setIsAiGeneratorOpen(false);
      await loadRecipes();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save generated recipe.');
    }
  };

  const handleSaveModifiedAsNew = async (modifiedRecipe) => {
    try {
      const payload = {
        title: modifiedRecipe.title,
        description: modifiedRecipe.description || '',
        instructions: Array.isArray(modifiedRecipe.instructions)
          ? modifiedRecipe.instructions.join('\n')
          : (modifiedRecipe.instructions || ''),
        prepTimeMinutes: Number(modifiedRecipe.prepTimeMinutes) || 15,
        cookTimeMinutes: Number(modifiedRecipe.cookTimeMinutes) || 20,
        servings: Number(modifiedRecipe.servings) || 2,
        difficulty: modifiedRecipe.difficulty || 'medium',
        cuisine: modifiedRecipe.cuisine || 'Indian',
        category: modifiedRecipe.category || 'Dinner',
        imageUrl: modifiedRecipe.imageUrl || '',
        isPublic: false,
        ingredients: (modifiedRecipe.ingredients || []).map((ing) => ({
          name: ing.name,
          quantity: Number(ing.quantity) || 1,
          unit: ing.unit || 'unit',
          optional: Boolean(ing.optional || ing.isOptional)
        }))
      };
      await createRecipe(payload);
      setSuccessMessage(`"${payload.title}" was saved as a new recipe.`);
      setRecipeToModify(null);
      await loadRecipes();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save modified recipe.');
    }
  };

  const handleUpdateOriginalRecipe = async (recipeId, modifiedRecipe) => {
    try {
      const payload = {
        title: modifiedRecipe.title,
        description: modifiedRecipe.description || '',
        instructions: Array.isArray(modifiedRecipe.instructions)
          ? modifiedRecipe.instructions.join('\n')
          : (modifiedRecipe.instructions || ''),
        prepTimeMinutes: Number(modifiedRecipe.prepTimeMinutes) || 15,
        cookTimeMinutes: Number(modifiedRecipe.cookTimeMinutes) || 20,
        servings: Number(modifiedRecipe.servings) || 2,
        difficulty: modifiedRecipe.difficulty || 'medium',
        cuisine: modifiedRecipe.cuisine || 'Indian',
        category: modifiedRecipe.category || 'Dinner',
        imageUrl: modifiedRecipe.imageUrl || '',
        isPublic: false,
        ingredients: (modifiedRecipe.ingredients || []).map((ing) => ({
          name: ing.name,
          quantity: Number(ing.quantity) || 1,
          unit: ing.unit || 'unit',
          optional: Boolean(ing.optional || ing.isOptional)
        }))
      };
      await updateRecipe(recipeId, payload);
      setSuccessMessage(`"${payload.title}" was updated successfully.`);
      setRecipeToModify(null);
      if (selectedRecipeForDetails?.id === recipeId) {
        setSelectedRecipeForDetails(null);
      }
      await loadRecipes();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update recipe in place.');
    }
  };

  const handleEditBeforeSaving = (recipeData) => {
    const initialRecipe = {
      title: recipeData.title,
      description: recipeData.description || '',
      instructions: Array.isArray(recipeData.instructions)
        ? recipeData.instructions.join('\n')
        : (recipeData.instructions || ''),
      prepTimeMinutes: Number(recipeData.prepTimeMinutes) || 15,
      cookTimeMinutes: Number(recipeData.cookTimeMinutes) || 20,
      servings: Number(recipeData.servings) || 2,
      difficulty: recipeData.difficulty || 'medium',
      cuisine: recipeData.cuisine || 'Indian',
      category: recipeData.category || recipeData.mealType || 'Dinner',
      imageUrl: recipeData.imageUrl || '',
      isPublic: false,
      ingredients: (recipeData.ingredients || []).map((ing) => ({
        name: ing.name,
        quantity: Number(ing.quantity) || 1,
        unit: ing.unit || 'unit',
        optional: Boolean(ing.optional || ing.isOptional)
      }))
    };
    setIsAiGeneratorOpen(false);
    setRecipeToModify(null);
    setRecipeToEdit(initialRecipe);
    setIsFormModalOpen(true);
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerBadge}>
            <UtensilsCrossed size={14} />
            <span>Recipe Discovery & Inventory Matching</span>
          </div>
          <h1 className={styles.title}>Recipes & Kitchen Matching</h1>
          <p className={styles.subtitle}>
            Explore chef-crafted meals, create family favorites, and instantly see what you can cook with your on-hand kitchen stock.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={() => setIsAiGeneratorOpen(true)}
            className="btn btn-secondary"
            id="ai-recipe-generator-button"
          >
            <Sparkles size={18} style={{ color: 'var(--color-primary)' }} />
            <span>AI Recipe Studio</span>
          </button>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="btn btn-primary"
            id="add-recipe-button"
          >
            <Plus size={18} />
            <span>Create Recipe</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className={styles.successBanner} role="status">
          <CheckCircle2 size={18} className={styles.successIcon} />
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className={styles.dismissBtn}
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className={styles.errorBanner} role="alert">
          <AlertCircle size={18} className={styles.errorIcon} />
          <div className={styles.errorContent}>
            <p>{error}</p>
            <button type="button" onClick={loadRecipes} className={styles.retryBtn}>
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Quick View Filter Tabs */}
      <div className={styles.tabBar}>
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`${styles.tabBtn} ${activeTab === 'all' ? styles.tabActive : ''}`}
        >
          All Recipes
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('canCook')}
          className={`${styles.tabBtn} ${activeTab === 'canCook' ? styles.tabActive : ''}`}
        >
          <CheckCircle2 size={14} />
          <span>Can Cook Now</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('favourites')}
          className={`${styles.tabBtn} ${activeTab === 'favourites' ? styles.tabActive : ''}`}
        >
          <Heart size={14} />
          <span>Favourites</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('myRecipes')}
          className={`${styles.tabBtn} ${activeTab === 'myRecipes' ? styles.tabActive : ''}`}
        >
          <span>My Recipes</span>
        </button>
      </div>

      {/* Toolbar: Search, Filters & Sorting */}
      <section className={styles.toolbarSection} aria-label="Recipe Filters">
        <div className={styles.toolbarCard}>
          <div className={styles.searchRow}>
            {/* Search Input */}
            <div className={styles.searchInputWrapper}>
              <Search size={18} className={styles.searchIcon} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recipe title or ingredient..."
                className={styles.searchInput}
                id="recipe-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className={styles.clearSearchBtn}
                  aria-label="Clear search text"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className={styles.filterGroup}>
              <label htmlFor="recipe-cat-filter" className={styles.filterLabel}>
                Category
              </label>
              <select
                id="recipe-cat-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={styles.selectInput}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'All' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Cuisine Filter */}
            <div className={styles.filterGroup}>
              <label htmlFor="recipe-cuisine-filter" className={styles.filterLabel}>
                Cuisine
              </label>
              <select
                id="recipe-cuisine-filter"
                value={selectedCuisine}
                onChange={(e) => setSelectedCuisine(e.target.value)}
                className={styles.selectInput}
              >
                {CUISINES.map((c) => (
                  <option key={c} value={c}>
                    {c === 'All' ? 'All Cuisines' : c}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div className={styles.filterGroup}>
              <label htmlFor="recipe-diff-filter" className={styles.filterLabel}>
                Difficulty
              </label>
              <select
                id="recipe-diff-filter"
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className={styles.selectInput}
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d === 'All' ? 'All Difficulties' : d}
                  </option>
                ))}
              </select>
            </div>

            {/* Max Prep Time Filter */}
            <div className={styles.filterGroup}>
              <label htmlFor="recipe-time-filter" className={styles.filterLabel}>
                Max Prep Time
              </label>
              <select
                id="recipe-time-filter"
                value={maxPrepTime}
                onChange={(e) => setMaxPrepTime(e.target.value)}
                className={styles.selectInput}
              >
                <option value="">Any Prep Time</option>
                <option value="15">≤ 15 mins</option>
                <option value="30">≤ 30 mins</option>
                <option value="45">≤ 45 mins</option>
                <option value="60">≤ 60 mins</option>
              </select>
            </div>
          </div>

          {/* Secondary Sorting & Clear Controls */}
          <div className={styles.sortRow}>
            <div className={styles.sortControls}>
              <div className={styles.sortGroup}>
                <ArrowUpDown size={15} className={styles.sortIcon} />
                <span className={styles.sortLabel}>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={styles.sortSelect}
                >
                  <option value="createdAt">Date Added</option>
                  <option value="title">Recipe Title</option>
                  <option value="prepTimeMinutes">Prep Time</option>
                  <option value="cookTimeMinutes">Cook Time</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className={styles.sortOrderBtn}
              >
                <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
              </button>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className={styles.resetFiltersBtn}
              >
                <RotateCcw size={14} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Recipes Catalog Grid */}
      <section className={styles.gridSection} aria-label="Recipe List">
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p>Matching kitchen ingredients & loading recipes...</p>
          </div>
        ) : recipes.length === 0 ? (
          <div className={styles.emptyContainer}>
            {hasActiveFilters ? (
              <div className={styles.emptyContent}>
                <Filter size={40} className={styles.emptyIcon} />
                <h3 className={styles.emptyTitle}>No recipes match your criteria</h3>
                <p className={styles.emptySubtitle}>
                  Try clearing some filters or searching with different keywords.
                </p>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="btn btn-secondary"
                >
                  <RotateCcw size={16} />
                  <span>Clear All Filters</span>
                </button>
              </div>
            ) : activeTab === 'myRecipes' ? (
              <div className={styles.emptyContent}>
                <UtensilsCrossed size={44} className={styles.emptyIcon} />
                <h3 className={styles.emptyTitle}>You haven't added any custom recipes yet</h3>
                <p className={styles.emptySubtitle}>
                  Add family secret dishes, healthy smoothies, or quick snacks to track pantry requirements.
                </p>
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="btn btn-primary"
                >
                  <Plus size={16} />
                  <span>Create Your First Recipe</span>
                </button>
              </div>
            ) : activeTab === 'canCook' ? (
              <div className={styles.emptyContent}>
                <UtensilsCrossed size={44} className={styles.emptyIcon} />
                <h3 className={styles.emptyTitle}>No 100% matched recipes available right now</h3>
                <p className={styles.emptySubtitle}>
                  Add more ingredients to your Kitchen Inventory to discover ready-to-cook meals.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className="btn btn-secondary"
                >
                  <span>Browse All Recipes</span>
                </button>
              </div>
            ) : (
              <div className={styles.emptyContent}>
                <UtensilsCrossed size={44} className={styles.emptyIcon} />
                <h3 className={styles.emptyTitle}>No recipes in the catalog</h3>
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="btn btn-primary"
                >
                  <Plus size={16} />
                  <span>Create Recipe</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.recipesGrid}>
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onOpenDetails={(r) => setSelectedRecipeForDetails(r)}
                onToggleFavourite={handleToggleFavourite}
                onEdit={handleOpenEditModal}
                onDelete={handleOpenDeleteModal}
              />
            ))}
          </div>
        )}
      </section>

      {/* Recipe Detail Modal */}
      {selectedRecipeForDetails && (
        <RecipeDetailModal
          recipe={selectedRecipeForDetails}
          onClose={() => setSelectedRecipeForDetails(null)}
          onToggleFavourite={handleToggleFavourite}
          onEdit={handleOpenEditModal}
          onDelete={handleOpenDeleteModal}
          onModifyWithAi={(recipe) => {
            setSelectedRecipeForDetails(null);
            setRecipeToModify(recipe);
          }}
          onSubstituteIngredient={(ingredientName, recipeId) => {
            setSubstitutionTarget({ ingredientName, recipeId });
          }}
          onScheduleMeal={(recipe) => {
            setSelectedRecipeForDetails(null);
            setRecipeToSchedule(recipe);
          }}
        />
      )}

      {/* Add / Edit Recipe Modal */}
      <RecipeFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          if (!formLoading) {
            setIsFormModalOpen(false);
            setRecipeToEdit(null);
          }
        }}
        onSave={handleSaveRecipe}
        initialData={recipeToEdit}
        loading={formLoading}
        serverError={formError}
      />

      {/* Delete Confirmation Modal */}
      <DeleteRecipeModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!deleteLoading) {
            setIsDeleteModalOpen(false);
            setRecipeToDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        recipeTitle={recipeToDelete?.title}
        loading={deleteLoading}
        serverError={deleteError}
      />

      {/* Phase 6 AI Recipe Generator Modal */}
      <AiRecipeGeneratorModal
        isOpen={isAiGeneratorOpen}
        onClose={() => setIsAiGeneratorOpen(false)}
        onSaveRecipe={handleSaveAiGeneratedRecipe}
        onEditBeforeSaving={handleEditBeforeSaving}
      />

      {/* Phase 6 AI Recipe Modify Modal */}
      <AiRecipeModifyModal
        isOpen={Boolean(recipeToModify)}
        recipe={recipeToModify}
        onClose={() => setRecipeToModify(null)}
        onSaveAsNew={handleSaveModifiedAsNew}
        onUpdateOriginal={handleUpdateOriginalRecipe}
        onEditBeforeSaving={handleEditBeforeSaving}
      />

      {/* Phase 6 AI Ingredient Substitution Modal */}
      <AiSubstitutionModal
        isOpen={Boolean(substitutionTarget)}
        onClose={() => setSubstitutionTarget(null)}
        initialIngredient={substitutionTarget?.ingredientName || ''}
        recipeId={substitutionTarget?.recipeId || null}
      />

      {/* Phase 7 Schedule Meal from Recipe Modal */}
      <ScheduleMealModal
        isOpen={Boolean(recipeToSchedule)}
        onClose={() => setRecipeToSchedule(null)}
        initialRecipe={recipeToSchedule}
        onMealSaved={(savedMeal) => {
          setSuccessMessage(`"${savedMeal.recipe?.title}" was added to your meal plan.`);
        }}
      />
    </div>
  );
}
