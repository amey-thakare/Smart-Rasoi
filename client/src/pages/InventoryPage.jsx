import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Minus,
  Search,
  Filter,
  X,
  RotateCcw,
  Edit2,
  Trash2,
  AlertTriangle,
  Clock,
  PackageCheck,
  AlertCircle,
  CheckCircle2,
  ArrowUpDown,
  Refrigerator,
  Layers,
  Sparkles,
  Utensils
} from 'lucide-react';
import StatCard from '../components/common/StatCard.jsx';
import InventoryItemModal from '../components/inventory/InventoryItemModal.jsx';
import DeleteConfirmModal from '../components/inventory/DeleteConfirmModal.jsx';
import RecordWasteModal from '../components/waste/RecordWasteModal.jsx';
import {
  fetchInventoryItems,
  fetchInventorySummary,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem
} from '../services/api.js';
import {
  formatDateDisplay,
  getItemExpiryStatus,
  getItemStockStatus
} from '../utils/formatters.js';
import styles from './InventoryPage.module.css';

const CATEGORIES = [
  'All',
  'Vegetables',
  'Fruits',
  'Dairy',
  'Grains',
  'Pulses',
  'Spices',
  'Meat',
  'Seafood',
  'Beverages',
  'Frozen Foods',
  'Other'
];

export default function InventoryPage() {
  // State for inventory items and summary
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({
    totalItems: 0,
    expiredItems: 0,
    expiringSoonItems: 0,
    lowStockItems: 0
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Filters and sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expiryFilter, setExpiryFilter] = useState('all'); // all, expired, expiring-soon, fresh
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [itemModalLoading, setItemModalLoading] = useState(false);
  const [itemModalError, setItemModalError] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Phase 10: Food waste logging modal state
  const [isWasteModalOpen, setIsWasteModalOpen] = useState(false);
  const [itemForWaste, setItemForWaste] = useState(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Track active request ID to avoid race conditions with out-of-order network responses
  const requestIdRef = useRef(0);

  // Load summary statistics
  const loadSummary = useCallback(async () => {
    try {
      const data = await fetchInventorySummary();
      setSummary(data?.data || data || {});
    } catch (err) {
      console.error('Failed to load inventory summary:', err);
    }
  }, []);

  // Load inventory items with active filters and sorting
  const loadItems = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const params = {
        search: debouncedSearch.trim() || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        expiry: expiryFilter !== 'all' ? expiryFilter : undefined,
        lowStock: lowStockFilter ? 'true' : undefined,
        sortBy,
        sortOrder
      };

      const data = await fetchInventoryItems(params);

      // Prevent race conditions: only update if this is the latest request
      if (currentRequestId === requestIdRef.current) {
        const itemsList = data?.data?.items || data?.items || (Array.isArray(data) ? data : []);
        setItems(itemsList);
      }
    } catch (err) {
      if (currentRequestId === requestIdRef.current) {
        setError(err.response?.data?.message || 'Failed to load inventory items. Please try again.');
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [debouncedSearch, selectedCategory, expiryFilter, lowStockFilter, sortBy, sortOrder]);

  // Quick inline quantity adjustment (+ / -)
  const handleQuickAdjustQuantity = async (item, delta, e) => {
    e?.stopPropagation();
    const newQty = Math.max(0, Math.round((Number(item.quantity) + delta) * 100) / 100);
    // Optimistically update local state for instant tactile UI responsiveness
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, quantity: newQty } : i))
    );
    try {
      await updateInventoryItem(item.id, { quantity: newQty });
      loadSummary();
    } catch (err) {
      console.error('Failed to update item quantity:', err);
      // Revert if server fails
      loadItems();
    }
  };

  // Initial load and whenever filters change
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // Clear success notification after 4 seconds
  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => {
        setActionSuccess(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedCategory('All');
    setExpiryFilter('all');
    setLowStockFilter(false);
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  const hasActiveFilters =
    debouncedSearch.trim() !== '' ||
    selectedCategory !== 'All' ||
    expiryFilter !== 'all' ||
    lowStockFilter ||
    sortBy !== 'createdAt' ||
    sortOrder !== 'desc';

  // Open modal to add item
  const handleOpenAddModal = () => {
    setItemToEdit(null);
    setItemModalError(null);
    setIsItemModalOpen(true);
  };

  // Open modal to edit item
  const handleOpenEditModal = (item) => {
    setItemToEdit(item);
    setItemModalError(null);
    setIsItemModalOpen(true);
  };

  // Open delete confirmation modal
  const handleOpenDeleteModal = (item) => {
    setItemToDelete(item);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  // Handle save (create or update)
  const handleSaveItem = async (formData) => {
    setItemModalLoading(true);
    setItemModalError(null);

    try {
      if (itemToEdit) {
        await updateInventoryItem(itemToEdit.id, formData);
        setActionSuccess(`"${formData.name}" was successfully updated.`);
      } else {
        await createInventoryItem(formData);
        setActionSuccess(`"${formData.name}" was added to your inventory.`);
      }

      setIsItemModalOpen(false);
      setItemToEdit(null);
      await Promise.all([loadItems(), loadSummary()]);
    } catch (err) {
      setItemModalError(
        err.response?.data?.message ||
        'Unable to save inventory item. Please check the form and try again.'
      );
    } finally {
      setItemModalLoading(false);
    }
  };

  // Handle delete
  const handleDeleteItem = async () => {
    if (!itemToDelete) return;

    setDeleteLoading(true);
    setDeleteError(null);

    try {
      await deleteInventoryItem(itemToDelete.id);
      setActionSuccess(`"${itemToDelete.name}" was removed from your inventory.`);
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      await Promise.all([loadItems(), loadSummary()]);
    } catch (err) {
      setDeleteError(
        err.response?.data?.message || 'Unable to delete this item. Please try again.'
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // Phase 10: Handle Waste logging
  const handleOpenWasteModal = (item) => {
    setItemForWaste(item);
    setIsWasteModalOpen(true);
  };

  const handleWasteRecorded = async (record) => {
    setActionSuccess(`Recorded food waste for "${record?.ingredientName || 'item'}". Stock updated.`);
    setIsWasteModalOpen(false);
    setItemForWaste(null);
    await Promise.all([loadItems(), loadSummary()]);
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerBadge}>
            <Refrigerator size={14} />
            <span>Kitchen Inventory Management</span>
          </div>
          <h1 className={styles.title}>Inventory Management</h1>
          <p className={styles.subtitle}>
            Track pantry stock levels, monitor freshness windows, and receive alerts before ingredients expire.
          </p>
        </div>

        <div className={styles.headerActions}>
          <Link
            to="/recipes?tab=canCook"
            className={`btn btn-secondary ${styles.headerLinkBtn}`}
            title="See which recipes you can cook with your inventory"
            id="cook-with-inventory-header-button"
          >
            <Utensils size={16} />
            <span>Cook with Inventory</span>
          </Link>
          <Link
            to="/ai-assistant?prompt=What%20dishes%20can%20I%20cook%20right%20now%20with%20my%20available%20kitchen%20inventory%20items%3F"
            className={`btn btn-secondary ${styles.headerLinkBtn}`}
            title="Ask AI Chef to plan meals from your current stock"
            id="ask-chef-ai-header-button"
          >
            <Sparkles size={16} />
            <span>Ask Chef AI</span>
          </Link>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className={`btn btn-primary ${styles.addBtn}`}
            id="add-inventory-item-button"
          >
            <Plus size={18} />
            <span>Add Ingredient</span>
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionSuccess && (
        <div className={styles.successBanner} role="status">
          <CheckCircle2 size={18} className={styles.successIcon} />
          <span>{actionSuccess}</span>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
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
            <button
              type="button"
              onClick={() => {
                loadItems();
                loadSummary();
              }}
              className={styles.retryBtn}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Section A: Live Overview Cards */}
      <section className={styles.statsSection} aria-label="Inventory Summary Statistics">
        <div className={styles.statsGrid}>
          <StatCard
            title="Total Items"
            value={summary.totalItems}
            description="Cataloged kitchen ingredients"
            iconName="PackageOpen"
            isNeutral={true}
          />

          <StatCard
            title="Expired Items"
            value={summary.expiredItems}
            description="Exceeded expiry date"
            iconName="AlertTriangle"
            isWarning={summary.expiredItems > 0}
            trend={summary.expiredItems > 0 ? 'Requires attention' : 'None expired'}
          />

          <StatCard
            title="Expiring Soon"
            value={summary.expiringSoonItems}
            description="Expiring within 7 days"
            iconName="Clock"
            isWarning={summary.expiringSoonItems > 0}
            trend={summary.expiringSoonItems > 0 ? 'Use soon' : 'Fresh stock'}
          />

          <StatCard
            title="Low Stock"
            value={summary.lowStockItems}
            description="At or below minimum threshold"
            iconName="AlertCircle"
            isWarning={summary.lowStockItems > 0}
            trend={summary.lowStockItems > 0 ? 'Restock needed' : 'Sufficient stock'}
          />
        </div>
      </section>

      {/* Section F: Search & Filters Toolbar */}
      <section className={styles.toolbarSection} aria-label="Search and Filter Controls">
        <div className={styles.toolbarCard}>
          <div className={styles.searchRow}>
            {/* Search Input */}
            <div className={styles.searchInputWrapper}>
              <Search size={18} className={styles.searchIcon} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ingredients by name..."
                className={styles.searchInput}
                id="inventory-search-input"
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
              <label htmlFor="category-filter" className={styles.filterLabel}>
                Category
              </label>
              <select
                id="category-filter"
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

            {/* Expiry Window Filter */}
            <div className={styles.filterGroup}>
              <label htmlFor="expiry-filter" className={styles.filterLabel}>
                Shelf Life
              </label>
              <select
                id="expiry-filter"
                value={expiryFilter}
                onChange={(e) => setExpiryFilter(e.target.value)}
                className={styles.selectInput}
              >
                <option value="all">All Dates</option>
                <option value="expiring-soon">Expiring Soon (≤ 7d)</option>
                <option value="expired">Expired</option>
                <option value="fresh">Fresh (&gt; 7d)</option>
              </select>
            </div>

            {/* Low Stock Toggle */}
            <button
              type="button"
              onClick={() => setLowStockFilter(!lowStockFilter)}
              className={`${styles.toggleFilterBtn} ${
                lowStockFilter ? styles.toggleFilterActive : ''
              }`}
              id="low-stock-filter-button"
            >
              <AlertCircle size={15} />
              <span>Low Stock Only</span>
            </button>
          </div>

          {/* Secondary Sorting & Reset Controls */}
          <div className={styles.sortRow}>
            <div className={styles.sortControls}>
              <div className={styles.sortGroup}>
                <ArrowUpDown size={15} className={styles.sortIcon} />
                <span className={styles.sortLabel}>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={styles.sortSelect}
                  id="inventory-sort-by-select"
                >
                  <option value="createdAt">Date Added</option>
                  <option value="name">Ingredient Name</option>
                  <option value="expiryDate">Expiry Date</option>
                  <option value="quantity">Quantity</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className={styles.sortOrderBtn}
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                <span>{sortOrder === 'asc' ? 'Ascending (A-Z / Oldest)' : 'Descending (Z-A / Newest)'}</span>
              </button>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className={styles.resetFiltersBtn}
                id="clear-filters-button"
              >
                <RotateCcw size={14} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Section B & G: Inventory List / UI States */}
      <section className={styles.listSection} aria-label="Inventory Item Catalog">
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p>Loading your kitchen inventory...</p>
          </div>
        ) : items.length === 0 ? (
          <div className={styles.emptyStateContainer}>
            {hasActiveFilters ? (
              <div className={styles.emptyContent}>
                <Filter size={40} className={styles.emptyIcon} />
                <h3 className={styles.emptyTitle}>No ingredients match your filters</h3>
                <p className={styles.emptySubtitle}>
                  We couldn't find any items matching your active search or filter criteria.
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
            ) : (
              <div className={styles.emptyContent}>
                <Refrigerator size={44} className={styles.emptyIcon} />
                <h3 className={styles.emptyTitle}>Your kitchen inventory is empty</h3>
                <p className={styles.emptySubtitle}>
                  Start cataloging ingredients in your pantry, refrigerator, or spice rack to receive automated expiry alerts.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="btn btn-primary"
                  id="empty-state-add-button"
                >
                  <Plus size={16} />
                  <span>Add Your First Ingredient</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.tableCard}>
            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Ingredient</th>
                    <th>Category</th>
                    <th>Quantity</th>
                    <th>Min. Threshold</th>
                    <th>Expiry Date</th>
                    <th>Stock Status</th>
                    <th>Expiry Status</th>
                    <th className={styles.actionsHeader}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const expiryMeta = getItemExpiryStatus(item.expiryDate);
                    const stockMeta = getItemStockStatus(item.quantity, item.minimumQuantity);

                    return (
                      <tr key={item.id} className={styles.tableRow}>
                        <td className={styles.nameCell}>
                          <div className={styles.itemName}>
                            <span className={styles.itemNameText}>{item.name}</span>
                            {item.notes && (
                              <span className={styles.itemNotes} title={item.notes}>
                                {item.notes}
                              </span>
                            )}
                          </div>
                        </td>

                        <td>
                          <span className={styles.categoryBadge}>{item.category}</span>
                        </td>

                        <td className={styles.quantityCell}>
                          <div className={styles.qtyStepper}>
                            <button
                              type="button"
                              onClick={(e) => handleQuickAdjustQuantity(item, -1, e)}
                              disabled={item.quantity <= 0}
                              className={styles.qtyStepperBtn}
                              title="Decrease quantity by 1"
                              aria-label={`Decrease quantity of ${item.name}`}
                            >
                              <Minus size={12} />
                            </button>
                            <span className={styles.quantityValue}>
                              {item.quantity} <span className={styles.unitText}>{item.unit}</span>
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleQuickAdjustQuantity(item, 1, e)}
                              className={styles.qtyStepperBtn}
                              title="Increase quantity by 1"
                              aria-label={`Increase quantity of ${item.name}`}
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </td>

                        <td className={styles.thresholdCell}>
                          <span className={styles.thresholdText}>
                            {item.minimumQuantity} {item.unit}
                          </span>
                        </td>

                        <td>
                          <span className={styles.dateText}>
                            {formatDateDisplay(item.expiryDate)}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`badge ${
                              stockMeta.isLow ? 'badge-danger' : 'badge-neutral'
                            } ${styles.badge}`}
                          >
                            {stockMeta.isLow ? (
                              <AlertCircle size={12} />
                            ) : (
                              <CheckCircle2 size={12} />
                            )}
                            <span>{stockMeta.label}</span>
                          </span>
                        </td>

                        <td>
                          <span
                            className={`badge ${expiryMeta.badgeClass} ${styles.badge}`}
                          >
                            {expiryMeta.urgent && <AlertTriangle size={12} />}
                            <span>{expiryMeta.label}</span>
                          </span>
                        </td>

                        <td className={styles.actionsCell}>
                          <div className={styles.actionButtons}>
                            <Link
                              to={`/recipes?search=${encodeURIComponent(item.name)}`}
                              className={styles.actionBtnRecipe}
                              title={`Find recipes using ${item.name}`}
                              aria-label={`Find recipes using ${item.name}`}
                            >
                              <Utensils size={14} />
                            </Link>
                            <Link
                              to={`/ai-assistant?prompt=${encodeURIComponent(`What delicious recipes or dishes can I cook using my available ${item.name} (${item.quantity} ${item.unit})?`)}`}
                              className={styles.actionBtnAi}
                              title={`Ask AI Chef what to cook with ${item.name}`}
                              aria-label={`Ask AI Chef about ${item.name}`}
                            >
                              <Sparkles size={14} />
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(item)}
                              className={styles.actionBtnEdit}
                              title={`Edit ${item.name}`}
                              aria-label={`Edit ${item.name}`}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenWasteModal(item)}
                              className={styles.actionBtnWaste}
                              title={`Record food waste for ${item.name}`}
                              aria-label={`Record waste for ${item.name}`}
                            >
                              <AlertTriangle size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDeleteModal(item)}
                              className={styles.actionBtnDelete}
                              title={`Delete ${item.name}`}
                              aria-label={`Delete ${item.name}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={styles.tableFooter}>
              <span>Showing {items.length} {items.length === 1 ? 'ingredient' : 'ingredients'}</span>
            </div>
          </div>
        )}
      </section>

      {/* Add / Edit Ingredient Modal */}
      <InventoryItemModal
        isOpen={isItemModalOpen}
        onClose={() => {
          if (!itemModalLoading) {
            setIsItemModalOpen(false);
            setItemToEdit(null);
          }
        }}
        onSubmit={handleSaveItem}
        onSave={handleSaveItem}
        initialData={itemToEdit}
        loading={itemModalLoading}
        serverError={itemModalError}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!deleteLoading) {
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
          }
        }}
        onConfirm={handleDeleteItem}
        itemName={itemToDelete?.name}
        loading={deleteLoading}
        serverError={deleteError}
      />

      {/* Phase 10: Food Waste Recording Modal */}
      {isWasteModalOpen && (
        <RecordWasteModal
          isOpen={isWasteModalOpen}
          onClose={() => {
            setIsWasteModalOpen(false);
            setItemForWaste(null);
          }}
          onSuccess={handleWasteRecorded}
          preselectedItem={itemForWaste}
        />
      )}
    </div>
  );
}
