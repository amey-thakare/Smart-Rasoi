import React, { useEffect, useState } from 'react';
import {
  X,
  Clock,
  Users,
  Heart,
  CheckCircle2,
  AlertCircle,
  Flame,
  Sparkles,
  Utensils,
  Edit2,
  Trash2,
  Shuffle,
  Minus,
  Plus,
  RotateCcw,
  Calendar,
  ShoppingCart
} from 'lucide-react';
import RecipeNutritionCard from '../nutrition/RecipeNutritionCard.jsx';
import AddMissingToShoppingListModal from '../shopping/AddMissingToShoppingListModal.jsx';
import ErrorBoundary from '../common/ErrorBoundary.jsx';
import styles from './RecipeDetailModal.module.css';

export default function RecipeDetailModal({
  recipe,
  onClose,
  onToggleFavourite,
  onEdit,
  onDelete,
  onModifyWithAi,
  onSubstituteIngredient,
  onScheduleMeal
}) {
  const [favLoading, setFavLoading] = useState(false);
  const [currentServings, setCurrentServings] = useState(recipe?.servings || 2);
  const [isShoppingModalOpen, setIsShoppingModalOpen] = useState(false);
  const [activeMissingForShopping, setActiveMissingForShopping] = useState([]);
  const [shoppingNotice, setShoppingNotice] = useState('');

  useEffect(() => {
    if (recipe?.servings) {
      setCurrentServings(recipe.servings);
    }
  }, [recipe]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!recipe) return null;

  const handleFavouriteClick = async () => {
    if (favLoading) return;
    setFavLoading(true);
    try {
      await onToggleFavourite(recipe);
    } finally {
      setFavLoading(false);
    }
  };

  const match = recipe.matchDetails || recipe.match;
  const availableNames = (match?.availableIngredients || []).map((i) => i.name?.toLowerCase());
  const missingNames = (match?.missingIngredients || []).map((i) => (typeof i === 'string' ? i.toLowerCase() : i.name?.toLowerCase()));
  const expiringNames = (match?.expiringSoonIngredients || []).map((n) => n.toLowerCase());

  const scaleRatio = currentServings / (recipe.servings || 2);
  const allMissingIngredients = (recipe.ingredients || [])
    .filter((ing) => {
      const norm = ing.name.toLowerCase();
      if (availableNames.length > 0) {
        return !availableNames.includes(norm);
      }
      if (missingNames.length > 0) {
        return missingNames.includes(norm);
      }
      return match && !match.canCook && !ing.isOptional;
    })
    .map((ing) => {
      const isNonLinear = ['salt', 'pepper', 'chili', 'cayenne', 'clove', 'cinnamon'].some((kw) =>
        ing.name.toLowerCase().includes(kw)
      );
      const scaledQuantity = isNonLinear && scaleRatio > 1
        ? Number((ing.quantity * (1 + (scaleRatio - 1) * 0.7)).toFixed(2))
        : Number((ing.quantity * scaleRatio).toFixed(2));

      return {
        ...ing,
        scaledQuantity
      };
    });

  const hasMissingIngredients = allMissingIngredients.length > 0 || (match && !match.canCook);
  const totalTime = (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0);

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitleArea}>
            <div className={styles.headerBadges}>
              <span className={styles.categoryBadge}>{recipe.category}</span>
              {recipe.cuisine && (
                <span className={styles.cuisineBadge}>{recipe.cuisine}</span>
              )}
              {recipe.isOwner && (
                <span className={styles.ownerBadge}>My Recipe</span>
              )}
            </div>
            <h2 className={styles.title}>{recipe.title}</h2>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              onClick={handleFavouriteClick}
              className={`${styles.favouriteBtn} ${recipe.isFavourite ? styles.favouriteActive : ''}`}
              title={recipe.isFavourite ? 'Remove from favourites' : 'Add to favourites'}
              aria-label="Toggle favourite"
            >
              <Heart size={20} fill={recipe.isFavourite ? '#DC2626' : 'none'} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className={styles.closeBtn}
              aria-label="Close recipe details"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className={styles.body}>
          {/* Recipe Image if available */}
          {recipe.imageUrl && (
            <div className={styles.imageContainer}>
              <img src={recipe.imageUrl} alt={recipe.title} className={styles.image} />
            </div>
          )}

          {/* Description */}
          {recipe.description && (
            <p className={styles.description}>{recipe.description}</p>
          )}

          {/* Stats Bar */}
          <div className={styles.statsBar}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Prep Time</span>
              <span className={styles.statValue}>
                <Clock size={15} />
                <span>{recipe.prepTimeMinutes || 0} mins</span>
              </span>
            </div>

            <div className={styles.statItem}>
              <span className={styles.statLabel}>Cook Time</span>
              <span className={styles.statValue}>
                <Clock size={15} />
                <span>{recipe.cookTimeMinutes || 0} mins</span>
              </span>
            </div>

            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total Time</span>
              <span className={styles.statValue}>
                <Clock size={15} />
                <span>{totalTime} mins</span>
              </span>
            </div>

            <div className={styles.statItem}>
              <span className={styles.statLabel}>Servings</span>
              <div className={styles.servingScaler}>
                <button
                  type="button"
                  className={styles.scalerBtn}
                  disabled={currentServings <= 1}
                  onClick={() => setCurrentServings((s) => Math.max(1, s - 1))}
                  title="Decrease servings"
                  aria-label="Decrease servings"
                >
                  <Minus size={11} />
                </button>
                <span className={styles.scalerValue}>{currentServings}</span>
                <button
                  type="button"
                  className={styles.scalerBtn}
                  disabled={currentServings >= 20}
                  onClick={() => setCurrentServings((s) => Math.min(20, s + 1))}
                  title="Increase servings"
                  aria-label="Increase servings"
                >
                  <Plus size={11} />
                </button>
              </div>
            </div>

            <div className={styles.statItem}>
              <span className={styles.statLabel}>Difficulty</span>
              <span className={`${styles.diffTag} ${styles['diff' + recipe.difficulty]}`}>
                {recipe.difficulty}
              </span>
            </div>
          </div>

          {/* Inventory Matching Alert */}
          {match && (
            <div
              className={`${styles.matchAlert} ${
                match.canCook ? styles.matchAlertSuccess : styles.matchAlertWarning
              }`}
            >
              <div className={styles.matchAlertHeader}>
                {match.canCook ? (
                  <CheckCircle2 size={18} className={styles.matchSuccessIcon} />
                ) : (
                  <AlertCircle size={18} className={styles.matchWarningIcon} />
                )}
                <div>
                  <strong>
                    {match.canCook
                      ? 'You have all required ingredients in your kitchen!'
                      : `${match.matchPercentage}% of required ingredients available in your pantry`}
                  </strong>
                  <p className={styles.matchAlertText}>
                    {match.canCook
                      ? 'Ready to prepare without needing extra groceries.'
                      : 'Check missing ingredients below before starting to cook.'}
                  </p>
                </div>
              </div>

              {match.expiringSoonIngredients && match.expiringSoonIngredients.length > 0 && (
                <div className={styles.expiringNoticeBanner}>
                  <Flame size={15} className={styles.flameIcon} />
                  <span>
                    Priority alert: Utilizes{' '}
                    <strong>{match.expiringSoonIngredients.join(', ')}</strong> nearing expiry!
                  </span>
                </div>
              )}

              {/* Add Missing to Shopping List Banner Action */}
              {(!match.canCook || allMissingIngredients.length > 0) && (
                <div className={styles.matchAlertActions}>
                  <button
                    type="button"
                    className={styles.addMissingBannerBtn}
                    onClick={() => {
                      setActiveMissingForShopping(allMissingIngredients);
                      setIsShoppingModalOpen(true);
                    }}
                    title="Add missing ingredients directly to your shopping list"
                  >
                    <ShoppingCart size={14} />
                    <span>Add Missing to Shopping List</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Inline Shopping Success Toast/Banner */}
          {shoppingNotice && (
            <div className={styles.shoppingSuccessBanner}>
              <CheckCircle2 size={16} />
              <span>{shoppingNotice}</span>
              <button
                type="button"
                className={styles.closeNoticeBtn}
                onClick={() => setShoppingNotice('')}
                aria-label="Dismiss notice"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {/* Ingredients Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <Utensils size={18} className={styles.sectionIcon} />
              <h3 className={styles.sectionTitle}>
                Ingredients ({recipe.ingredients?.length || 0})
              </h3>
            </div>

            {/* Serving Scaling Notice */}
            {currentServings !== (recipe.servings || 2) && (
              <div className={styles.scalingNotice}>
                <span>
                  ⚖️ Scaled for <strong>{currentServings} servings</strong> (original: {recipe.servings}). Seasonings & salt should be adjusted to taste.
                </span>
                <button
                  type="button"
                  className={styles.resetScaleBtn}
                  onClick={() => setCurrentServings(recipe.servings || 2)}
                >
                  Reset
                </button>
              </div>
            )}

            <div className={styles.ingredientsGrid}>
              {recipe.ingredients?.map((ing) => {
                const normName = ing.name.toLowerCase();
                const isAvailable = availableNames.includes(normName);
                const isExpiring = expiringNames.includes(normName);

                // Compute scaled quantity
                const scaleRatio = currentServings / (recipe.servings || 2);
                const isNonLinear = ['salt', 'pepper', 'chili', 'cayenne', 'clove', 'cinnamon'].some((kw) =>
                  normName.includes(kw)
                );
                const scaledQty = isNonLinear && scaleRatio > 1
                  ? Number((ing.quantity * (1 + (scaleRatio - 1) * 0.7)).toFixed(2))
                  : Number((ing.quantity * scaleRatio).toFixed(2));

                return (
                  <div
                    key={ing.id || ing.name}
                    className={`${styles.ingredientItem} ${
                      isAvailable ? styles.ingInStock : styles.ingMissing
                    }`}
                  >
                    <div className={styles.ingLeft}>
                      <span className={styles.ingStatusIcon}>
                        {isAvailable ? (
                          <CheckCircle2 size={16} className={styles.iconInStock} />
                        ) : (
                          <span className={styles.bulletMissing}>•</span>
                        )}
                      </span>
                      <span className={styles.ingName}>
                        {ing.name}
                        {ing.isOptional && (
                          <span className={styles.optionalTag}>Optional</span>
                        )}
                      </span>

                      {/* Add Single Missing Ingredient to Shopping List */}
                      {!isAvailable && (
                        <button
                          type="button"
                          className={styles.addSingleToListBtn}
                          onClick={() => {
                            setActiveMissingForShopping([{ ...ing, scaledQuantity: scaledQty }]);
                            setIsShoppingModalOpen(true);
                          }}
                          title={`Add ${ing.name} to shopping list`}
                        >
                          <Plus size={11} />
                          <span>To List</span>
                        </button>
                      )}

                      {/* Substitution Assistant Button */}
                      {onSubstituteIngredient && (
                        <button
                          type="button"
                          className={styles.substituteBtn}
                          onClick={() => onSubstituteIngredient(ing.name, recipe.id)}
                          title={`Find substitutes for ${ing.name}`}
                        >
                          <Shuffle size={11} />
                          <span>Substitute</span>
                        </button>
                      )}
                    </div>

                    <div className={styles.ingRight}>
                      <span className={styles.ingQuantity}>
                        {scaledQty} {ing.unit}
                      </span>

                      {isExpiring && (
                        <span className={styles.expiringTag} title="In stock & expiring soon">
                          <Flame size={11} />
                          <span>Expiring soon</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Nutrition Analysis Card */}
          <ErrorBoundary>
            <RecipeNutritionCard
              recipeId={recipe.id}
              recipeServings={recipe.servings || 2}
              currentServings={currentServings}
            />
          </ErrorBoundary>

          {/* Instructions Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <Sparkles size={18} className={styles.sectionIcon} />
              <h3 className={styles.sectionTitle}>Cooking Instructions</h3>
            </div>

            <div className={styles.instructionsContent}>
              {recipe.instructions
                .split('\n')
                .filter((step) => step.trim())
                .map((step, idx) => (
                  <div key={idx} className={styles.stepRow}>
                    <span className={styles.stepNumber}>{idx + 1}</span>
                    <p className={styles.stepText}>
                      {step.replace(/^\d+[\.\)]\s*/, '')}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={styles.footer}>
          {hasMissingIngredients && (
            <button
              type="button"
              onClick={() => {
                setActiveMissingForShopping(allMissingIngredients);
                setIsShoppingModalOpen(true);
              }}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              title="Add missing recipe ingredients directly to your shopping list"
            >
              <ShoppingCart size={15} />
              <span>Add Missing to Shopping List</span>
            </button>
          )}

          {onModifyWithAi && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onModifyWithAi(recipe);
              }}
              className="btn btn-secondary"
              style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
            >
              <Sparkles size={15} />
              <span>Modify with AI</span>
            </button>
          )}

          {onScheduleMeal && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onScheduleMeal(recipe);
              }}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              title="Add this recipe to your weekly or monthly meal plan"
            >
              <Calendar size={15} style={{ color: 'var(--color-primary)' }} />
              <span>Add to Meal Plan</span>
            </button>
          )}

          {recipe.isOwner && (
            <div className={styles.ownerActions}>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(recipe);
                }}
                className="btn btn-secondary"
              >
                <Edit2 size={15} />
                <span>Edit Recipe</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(recipe);
                }}
                className={`btn ${styles.deleteBtn}`}
              >
                <Trash2 size={15} />
                <span>Delete</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ marginLeft: 'auto' }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Add Missing to Shopping List Modal */}
      <AddMissingToShoppingListModal
        isOpen={isShoppingModalOpen}
        onClose={() => setIsShoppingModalOpen(false)}
        recipe={recipe}
        currentServings={currentServings}
        missingIngredients={activeMissingForShopping.length > 0 ? activeMissingForShopping : allMissingIngredients}
        onSuccess={(result) => {
          setShoppingNotice(`Added ${result.addedCount} items to "${result.listName}"!`);
          setTimeout(() => setShoppingNotice(''), 5000);
        }}
      />
    </div>
  );
}
