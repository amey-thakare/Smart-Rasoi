import React from 'react';
import {
  Utensils,
  CheckCircle2,
  Users,
  Clock,
  RotateCcw,
  SkipForward,
  Ban,
  Trash2,
  Edit2,
  Eye,
  MoreVertical
} from 'lucide-react';
import styles from './MealCard.module.css';

export default function MealCard({
  meal,
  onCookClick,
  onRevertClick,
  onEditClick,
  onSkipClick,
  onCancelClick,
  onDeleteClick,
  onViewRecipe
}) {
  const isCooked = meal.status === 'COOKED';
  const isSkipped = meal.status === 'SKIPPED';
  const isCancelled = meal.status === 'CANCELLED';
  const isPlanned = meal.status === 'PLANNED';

  const getMealTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'breakfast': return styles.badgeBreakfast;
      case 'lunch': return styles.badgeLunch;
      case 'dinner': return styles.badgeDinner;
      case 'snacks': return styles.badgeSnacks;
      default: return styles.badgeDefault;
    }
  };

  return (
    <div className={`${styles.card} ${isCooked ? styles.cardCooked : ''} ${isSkipped ? styles.cardSkipped : ''} ${isCancelled ? styles.cardCancelled : ''}`}>
      {/* Top row: Meal Type & Status */}
      <div className={styles.topRow}>
        <span className={`${styles.typeBadge} ${getMealTypeColor(meal.mealType)}`}>
          {meal.mealType}
        </span>

        {isCooked ? (
          <span className={styles.statusCooked} title="Cooked & inventory deducted">
            <CheckCircle2 size={12} />
            <span>Cooked</span>
          </span>
        ) : isSkipped ? (
          <span className={styles.statusSkipped} title="Skipped">
            <SkipForward size={12} />
            <span>Skipped</span>
          </span>
        ) : isCancelled ? (
          <span className={styles.statusCancelled} title="Cancelled">
            <Ban size={12} />
            <span>Cancelled</span>
          </span>
        ) : (
          <span className={styles.statusPlanned}>
            Planned
          </span>
        )}
      </div>

      {/* Recipe Title & Meta */}
      <div
        className={styles.titleArea}
        onClick={() => onViewRecipe && onViewRecipe(meal.recipe)}
        title="View recipe details"
      >
        <span className={styles.recipeTitle}>{meal.recipe?.title}</span>
        <div className={styles.metaRow}>
          <span className={styles.metaItem}>
            <Users size={12} />
            <span>{meal.servings} Servings</span>
          </span>
          {meal.recipe?.prepTimeMinutes ? (
            <span className={styles.metaItem}>
              <Clock size={12} />
              <span>{(meal.recipe.prepTimeMinutes || 0) + (meal.recipe.cookTimeMinutes || 0)}m</span>
            </span>
          ) : null}
        </div>
      </div>

      {meal.notes && (
        <div className={styles.notesText} title={meal.notes}>
          "{meal.notes}"
        </div>
      )}

      {/* Action Footer */}
      <div className={styles.actionsFooter}>
        {isPlanned && (
          <>
            <button
              type="button"
              className={styles.cookBtn}
              onClick={() => onCookClick && onCookClick(meal)}
              title="Cook meal & deduct inventory"
            >
              <Utensils size={13} />
              <span>Cook</span>
            </button>

            <div className={styles.secondaryActions}>
              <button
                type="button"
                className={styles.iconActionBtn}
                onClick={() => onEditClick && onEditClick(meal)}
                title="Edit planned meal"
              >
                <Edit2 size={13} />
              </button>
              <button
                type="button"
                className={styles.iconActionBtn}
                onClick={() => onSkipClick && onSkipClick(meal)}
                title="Skip this meal"
              >
                <SkipForward size={13} />
              </button>
              <button
                type="button"
                className={styles.iconActionBtn}
                onClick={() => onCancelClick && onCancelClick(meal)}
                title="Cancel meal"
              >
                <Ban size={13} />
              </button>
              <button
                type="button"
                className={`${styles.iconActionBtn} ${styles.btnDelete}`}
                onClick={() => onDeleteClick && onDeleteClick(meal)}
                title="Remove from plan"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </>
        )}

        {isCooked && (
          <>
            <button
              type="button"
              className={styles.revertBtn}
              onClick={() => onRevertClick && onRevertClick(meal)}
              title="Revert cooking & restore deducted stock"
            >
              <RotateCcw size={12} />
              <span>Undo Cooking</span>
            </button>
            <button
              type="button"
              className={styles.iconActionBtn}
              onClick={() => onViewRecipe && onViewRecipe(meal.recipe)}
              title="View recipe details"
            >
              <Eye size={13} />
            </button>
          </>
        )}

        {(isSkipped || isCancelled) && (
          <div className={styles.secondaryActions} style={{ marginLeft: 'auto' }}>
            <button
              type="button"
              className={styles.iconActionBtn}
              onClick={() => onEditClick && onEditClick(meal)}
              title="Reschedule / Edit"
            >
              <Edit2 size={13} />
            </button>
            <button
              type="button"
              className={`${styles.iconActionBtn} ${styles.btnDelete}`}
              onClick={() => onDeleteClick && onDeleteClick(meal)}
              title="Remove from plan"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
