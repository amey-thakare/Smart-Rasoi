import React, { useState } from 'react';
import {
  Clock,
  Users,
  Heart,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Utensils,
  Flame
} from 'lucide-react';
import styles from './RecipeCard.module.css';

export default function RecipeCard({
  recipe,
  onOpenDetails,
  onToggleFavourite,
  onEdit,
  onDelete
}) {
  const [imageError, setImageError] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  const handleFavouriteClick = async (e) => {
    e.stopPropagation();
    if (favLoading) return;
    setFavLoading(true);
    try {
      await onToggleFavourite(recipe);
    } finally {
      setFavLoading(false);
    }
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    onEdit(recipe);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete(recipe);
  };

  const match = recipe.match;
  const hasMatchInfo = match && typeof match.matchPercentage === 'number';
  const totalTime = (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0);

  return (
    <div className={styles.card} onClick={() => onOpenDetails(recipe)}>
      {/* Recipe Header / Image */}
      <div className={styles.imageWrapper}>
        {!imageError && recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className={styles.image}
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className={styles.fallbackContainer}>
            <Utensils size={36} className={styles.fallbackIcon} />
            <span className={styles.fallbackCategory}>{recipe.category}</span>
          </div>
        )}

        {/* Badges Overlay */}
        <div className={styles.topBadges}>
          <span className={styles.categoryBadge}>{recipe.category}</span>
          {recipe.isOwner && (
            <span className={styles.myRecipeBadge}>My Recipe</span>
          )}
        </div>

        {/* Favourite Button */}
        <button
          type="button"
          onClick={handleFavouriteClick}
          className={`${styles.favouriteBtn} ${recipe.isFavourite ? styles.favouriteActive : ''}`}
          aria-label={recipe.isFavourite ? 'Remove from favourites' : 'Add to favourites'}
          title={recipe.isFavourite ? 'Saved in favourites' : 'Save to favourites'}
        >
          <Heart size={18} fill={recipe.isFavourite ? '#DC2626' : 'none'} />
        </button>
      </div>

      {/* Card Content */}
      <div className={styles.content}>
        <div className={styles.mainInfo}>
          <h3 className={styles.title}>{recipe.title}</h3>
          {recipe.description && (
            <p className={styles.description}>{recipe.description}</p>
          )}
        </div>

        {/* Inventory Match Status Pill */}
        {hasMatchInfo && (
          <div className={styles.matchSection}>
            <div className={styles.matchBarWrapper}>
              <div
                className={`${styles.matchBarFill} ${
                  match.canCook ? styles.matchBarComplete : ''
                }`}
                style={{ width: `${Math.min(100, Math.max(0, match.matchPercentage))}%` }}
              />
            </div>
            <div className={styles.matchDetails}>
              {match.canCook ? (
                <span className={styles.canCookBadge}>
                  <CheckCircle2 size={13} />
                  <span>Ready to Cook (100% in stock)</span>
                </span>
              ) : (
                <span className={styles.partialMatchBadge}>
                  <AlertCircle size={13} />
                  <span>{match.matchPercentage}% ingredients available</span>
                </span>
              )}

              {match.expiringSoonIngredients && match.expiringSoonIngredients.length > 0 && (
                <span className={styles.expiringNotice} title="Utilizes ingredients nearing expiry">
                  <Flame size={12} />
                  <span>Uses expiring stock</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Recipe Meta Footer */}
        <div className={styles.metaRow}>
          <div className={styles.metaItem} title="Total Time">
            <Clock size={13} />
            <span>{totalTime > 0 ? `${totalTime}m` : `${recipe.prepTimeMinutes || 0}m`}</span>
          </div>

          <div className={styles.metaItem} title="Servings">
            <Users size={13} />
            <span>{recipe.servings} {recipe.servings === 1 ? 'serving' : 'servings'}</span>
          </div>

          <span className={`${styles.difficultyBadge} ${styles['diff' + recipe.difficulty]}`}>
            {recipe.difficulty}
          </span>

          {recipe.cuisine && (
            <span className={styles.cuisineTag}>{recipe.cuisine}</span>
          )}
        </div>

        {/* Action Controls */}
        <div className={styles.footerActions}>
          <span className={styles.ingredientCount}>
            {recipe.ingredients?.length || 0} ingredients
          </span>

          {recipe.isOwner && (
            <div className={styles.ownerControls}>
              <button
                type="button"
                onClick={handleEditClick}
                className={styles.editBtn}
                title="Edit your recipe"
                aria-label={`Edit ${recipe.title}`}
              >
                <Edit2 size={14} />
              </button>
              <button
                type="button"
                onClick={handleDeleteClick}
                className={styles.deleteBtn}
                title="Delete your recipe"
                aria-label={`Delete ${recipe.title}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
