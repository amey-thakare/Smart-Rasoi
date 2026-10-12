import React, { useState } from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import styles from './DeleteConfirmModal.module.css';

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  itemName
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.iconWrapper}>
          <AlertTriangle size={24} />
        </div>

        <h3 className={styles.title}>Delete Inventory Item</h3>
        <p className={styles.message}>
          Are you sure you want to remove <span className={styles.itemName}>"{itemName}"</span> from your kitchen inventory? This action cannot be undone.
        </p>

        <div className={styles.actions}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.deleteBtn}
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 size={16} />
                <span>Delete Item</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
