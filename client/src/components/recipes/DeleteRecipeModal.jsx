import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import styles from './DeleteRecipeModal.module.css';

export default function DeleteRecipeModal({
  isOpen,
  onClose,
  onConfirm,
  recipeTitle = '',
  loading = false,
  serverError = null
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, loading]);

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={!loading ? onClose : undefined} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.warningIconWrapper}>
            <AlertTriangle size={24} className={styles.warningIcon} />
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

        <div className={styles.content}>
          <h3 className={styles.title}>Delete Recipe</h3>
          <p className={styles.message}>
            Are you sure you want to permanently delete{' '}
            <strong>"{recipeTitle}"</strong>? This will remove its ingredients and any saved favourites. This action cannot be undone.
          </p>

          {serverError && (
            <div className={styles.errorAlert} role="alert">
              <span>{serverError}</span>
            </div>
          )}
        </div>

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
            type="button"
            onClick={onConfirm}
            className={`btn ${styles.deleteBtn}`}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete Recipe'}
          </button>
        </div>
      </div>
    </div>
  );
}
