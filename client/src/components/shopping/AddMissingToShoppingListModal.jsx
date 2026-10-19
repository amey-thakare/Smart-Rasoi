import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  ListPlus,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  fetchShoppingLists,
  createShoppingList,
  addShoppingListItemsBulk
} from '../../services/api.js';
import styles from './AddMissingToShoppingListModal.module.css';

export default function AddMissingToShoppingListModal({
  isOpen,
  onClose,
  recipe,
  currentServings = 2,
  missingIngredients = [],
  onSuccess
}) {
  const navigate = useNavigate();

  // Shopping lists state
  const [lists, setLists] = useState([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [targetMode, setTargetMode] = useState('existing'); // 'existing' | 'new'
  const [selectedListId, setSelectedListId] = useState('');
  const [newListName, setNewListName] = useState('');
  const [newListBudget, setNewListBudget] = useState('');

  // Selected items state (keyed by item identifier)
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());

  // Form submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  // Initialize selected items from missing ingredients
  useEffect(() => {
    if (isOpen && missingIngredients.length > 0) {
      const allKeys = missingIngredients.map((item, idx) => item.id || `${item.name}-${idx}`);
      setSelectedItemIds(new Set(allKeys));
      setSuccessResult(null);
      setError('');
    }
  }, [isOpen, missingIngredients]);

  // Default list name based on recipe title
  useEffect(() => {
    if (recipe?.title) {
      setNewListName(`Groceries — ${recipe.title}`);
    }
  }, [recipe]);

  // Load existing shopping lists
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadLists = async () => {
      setLoadingLists(true);
      setError('');
      try {
        const res = await fetchShoppingLists();
        if (isMounted) {
          const fetched = res.data?.lists || [];
          setLists(fetched);

          const activeLists = fetched.filter((l) => l.status === 'ACTIVE');
          if (activeLists.length > 0) {
            setSelectedListId(activeLists[0].id);
            setTargetMode('existing');
          } else if (fetched.length > 0) {
            setSelectedListId(fetched[0].id);
            setTargetMode('existing');
          } else {
            setTargetMode('new');
          }
        }
      } catch (err) {
        if (isMounted) {
          setTargetMode('new');
        }
      } finally {
        if (isMounted) setLoadingLists(false);
      }
    };

    loadLists();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleItem = (key) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const allKeys = missingIngredients.map((item, idx) => item.id || `${item.name}-${idx}`);
    setSelectedItemIds(new Set(allKeys));
  };

  const handleDeselectAll = () => {
    setSelectedItemIds(new Set());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedItemIds.size === 0) {
      setError('Please select at least one missing ingredient to add.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      let finalTargetListId = selectedListId;
      let finalListName = '';

      // 1. Create new shopping list if requested or needed
      if (targetMode === 'new' || !finalTargetListId) {
        if (!newListName.trim()) {
          setError('Please provide a name for the new shopping list.');
          setSubmitting(false);
          return;
        }

        const createRes = await createShoppingList({
          name: newListName.trim(),
          budget: newListBudget ? Number(newListBudget) : null,
          notes: `Created from recipe: ${recipe?.title || 'Unknown'}`
        });

        const createdList = createRes.data?.list;
        if (!createdList || !createdList.id) {
          throw new Error('Failed to create new shopping list.');
        }

        finalTargetListId = createdList.id;
        finalListName = createdList.name;
      } else {
        const found = lists.find((l) => l.id === finalTargetListId);
        finalListName = found ? found.name : 'Shopping List';
      }

      // 2. Prepare items payload with scaled quantities
      const itemsToAdd = missingIngredients
        .filter((item, idx) => selectedItemIds.has(item.id || `${item.name}-${idx}`))
        .map((item) => ({
          ingredientName: item.name,
          quantity: item.scaledQuantity || item.quantity,
          unit: item.unit,
          notes: `Recipe: ${recipe?.title} (${currentServings} servings)`
        }));

      // 3. Add items in bulk
      const addRes = await addShoppingListItemsBulk(finalTargetListId, itemsToAdd);

      const resultPayload = {
        listId: finalTargetListId,
        listName: finalListName,
        addedCount: itemsToAdd.length,
        items: itemsToAdd
      };

      setSuccessResult(resultPayload);
      if (onSuccess) {
        onSuccess(resultPayload);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to add missing items to shopping list. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleNavigateToList = () => {
    if (successResult?.listId) {
      navigate(`/shopping-list?listId=${successResult.listId}`);
      onClose();
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <ShoppingCart size={20} />
          </div>
          <div className={styles.headerText}>
            <h3 className={styles.title}>Add Missing Ingredients</h3>
            <p className={styles.subtitle}>
              For <strong>{recipe?.title}</strong> ({currentServings} {currentServings === 1 ? 'serving' : 'servings'})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeBtn}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Success View */}
        {successResult ? (
          <div className={styles.successContainer}>
            <div className={styles.successIconBox}>
              <CheckCircle2 size={36} className={styles.successCheck} />
            </div>
            <h4 className={styles.successHeading}>Added to Shopping List!</h4>
            <p className={styles.successMessage}>
              Successfully added <strong>{successResult.addedCount} missing {successResult.addedCount === 1 ? 'ingredient' : 'ingredients'}</strong> to your shopping list <strong>"{successResult.listName}"</strong>.
            </p>

            <div className={styles.successActions}>
              <button
                type="button"
                onClick={handleNavigateToList}
                className={`btn btn-primary ${styles.viewListBtn}`}
              >
                <span>View in Shopping List</span>
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Form Content */
          <form onSubmit={handleSubmit} className={styles.form}>
            {error && (
              <div className={styles.errorAlert}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Target List Destination Choice */}
            <div className={styles.section}>
              <label className={styles.sectionLabel}>
                <Layers size={15} />
                <span>Choose Shopping List</span>
              </label>

              {loadingLists ? (
                <div className={styles.loadingPlaceholder}>Loading shopping lists...</div>
              ) : (
                <div className={styles.targetChoiceBox}>
                  {lists.length > 0 && (
                    <div className={styles.radioOption}>
                      <input
                        type="radio"
                        id="targetExisting"
                        name="targetMode"
                        value="existing"
                        checked={targetMode === 'existing'}
                        onChange={() => setTargetMode('existing')}
                      />
                      <label htmlFor="targetExisting" className={styles.radioLabel}>
                        <strong>Add to existing shopping list</strong>
                      </label>
                    </div>
                  )}

                  {targetMode === 'existing' && lists.length > 0 && (
                    <div className={styles.dropdownContainer}>
                      <select
                        className={styles.select}
                        value={selectedListId}
                        onChange={(e) => setSelectedListId(e.target.value)}
                        required
                      >
                        {lists.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name} ({l.status === 'ACTIVE' ? 'Active' : l.status}) • {l.items?.length || l.itemCount || 0} items
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className={styles.radioOption}>
                    <input
                      type="radio"
                      id="targetNew"
                      name="targetMode"
                      value="new"
                      checked={targetMode === 'new' || lists.length === 0}
                      onChange={() => setTargetMode('new')}
                    />
                    <label htmlFor="targetNew" className={styles.radioLabel}>
                      <strong>Create a new shopping list</strong>
                    </label>
                  </div>

                  {(targetMode === 'new' || lists.length === 0) && (
                    <div className={styles.newListFields}>
                      <div className={styles.fieldGroup}>
                        <label className={styles.inputLabel}>List Name *</label>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder="e.g. Weekend Groceries"
                          value={newListName}
                          onChange={(e) => setNewListName(e.target.value)}
                          required
                        />
                      </div>

                      <div className={styles.fieldGroup}>
                        <label className={styles.inputLabel}>Budget (Optional ₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className={styles.input}
                          placeholder="e.g. 500"
                          value={newListBudget}
                          onChange={(e) => setNewListBudget(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Missing Ingredients Checklist */}
            <div className={styles.section}>
              <div className={styles.checklistHeader}>
                <label className={styles.sectionLabel}>
                  <ShoppingCart size={15} />
                  <span>Missing Ingredients ({missingIngredients.length})</span>
                </label>
                <div className={styles.bulkCheckActions}>
                  <button
                    type="button"
                    className={styles.textActionBtn}
                    onClick={handleSelectAll}
                  >
                    Select All
                  </button>
                  <span className={styles.actionDivider}>•</span>
                  <button
                    type="button"
                    className={styles.textActionBtn}
                    onClick={handleDeselectAll}
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className={styles.ingredientsList}>
                {missingIngredients.map((item, idx) => {
                  const key = item.id || `${item.name}-${idx}`;
                  const isChecked = selectedItemIds.has(key);
                  const displayQty = item.scaledQuantity ?? item.quantity;

                  return (
                    <label
                      key={key}
                      className={`${styles.itemRow} ${isChecked ? styles.itemRowChecked : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleItem(key)}
                        className={styles.checkbox}
                      />
                      <div className={styles.itemInfo}>
                        <span className={styles.itemName}>{item.name}</span>
                        {item.isOptional && (
                          <span className={styles.optionalBadge}>Optional</span>
                        )}
                      </div>
                      <span className={styles.itemQty}>
                        {displayQty} {item.unit}
                      </span>
                    </label>
                  );
                })}
              </div>

              <p className={styles.servingHint}>
                ⚖️ Ingredient quantities are automatically scaled for <strong>{currentServings} {currentServings === 1 ? 'serving' : 'servings'}</strong>.
              </p>
            </div>

            {/* Footer Buttons */}
            <div className={styles.footer}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || selectedItemIds.size === 0}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={15} />
                <span>
                  {submitting
                    ? 'Adding to list...'
                    : `Add ${selectedItemIds.size} ${selectedItemIds.size === 1 ? 'Item' : 'Items'} to Shopping List`}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
