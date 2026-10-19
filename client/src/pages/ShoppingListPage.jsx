import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShoppingCart,
  Plus,
  Sparkles,
  Calendar,
  PiggyBank,
  TrendingUp,
  History,
  CheckCircle2,
  Circle,
  PackageCheck,
  Edit2,
  Trash2,
  Search,
  Filter,
  AlertTriangle,
  HelpCircle,
  ChevronRight,
  MoreVertical,
  Check,
  Archive,
  RefreshCw,
  IndianRupee
} from 'lucide-react';
import {
  fetchShoppingLists,
  fetchShoppingListById,
  createShoppingList,
  updateShoppingList,
  deleteShoppingList,
  addShoppingListItem,
  updateShoppingListItem,
  deleteShoppingListItem,
  purchaseShoppingListItem,
  addPurchasedItemToInventory,
  generateShoppingListFromMealPlan
} from '../services/api.js';
import { formatCurrency, formatDateDisplay } from '../utils/formatters.js';

import CreateListModal from '../components/shopping/CreateListModal.jsx';
import AddShoppingItemModal from '../components/shopping/AddShoppingItemModal.jsx';
import PurchaseItemModal from '../components/shopping/PurchaseItemModal.jsx';
import AddToInventoryModal from '../components/shopping/AddToInventoryModal.jsx';
import GenerateFromMealPlanModal from '../components/shopping/GenerateFromMealPlanModal.jsx';
import CostOptimisationModal from '../components/shopping/CostOptimisationModal.jsx';
import BudgetSettingsModal from '../components/shopping/BudgetSettingsModal.jsx';
import PriceHistoryModal from '../components/shopping/PriceHistoryModal.jsx';

import styles from './ShoppingListPage.module.css';

export default function ShoppingListPage() {
  const [searchParams] = useSearchParams();
  const urlListId = searchParams.get('listId');

  const [lists, setLists] = useState([]);
  const [selectedListId, setSelectedListId] = useState(null);
  const [activeList, setActiveList] = useState(null);
  const [loadingLists, setLoadingLists] = useState(true);
  const [loadingListDetail, setLoadingListDetail] = useState(false);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');

  // Filtering & search for items within active list
  const [itemFilter, setItemFilter] = useState('all'); // 'all', 'pending', 'purchased'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal visibility states
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [editingListData, setEditingListData] = useState(null);

  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [editingItemData, setEditingItemData] = useState(null);

  const [purchaseModalItem, setPurchaseModalItem] = useState(null);
  const [addToInventoryModalItem, setAddToInventoryModalItem] = useState(null);

  const [isMealPlanGenOpen, setIsMealPlanGenOpen] = useState(false);
  const [isCostOptOpen, setIsCostOptOpen] = useState(false);
  const [isBudgetSettingsOpen, setIsBudgetSettingsOpen] = useState(false);
  const [isPriceHistoryOpen, setIsPriceHistoryOpen] = useState(false);

  // Notify helper
  const notify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  // Load all lists
  const loadLists = useCallback(async (selectId = null) => {
    setLoadingLists(true);
    setError('');
    try {
      const res = await fetchShoppingLists();
      if (res.success && res.data?.lists) {
        const fetchedLists = res.data.lists;
        setLists(fetchedLists);

        if (fetchedLists.length > 0) {
          const nextSelectedId = selectId || selectedListId || fetchedLists[0].id;
          setSelectedListId(nextSelectedId);
        } else {
          setSelectedListId(null);
          setActiveList(null);
        }
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load shopping lists.');
    } finally {
      setLoadingLists(false);
    }
  }, [selectedListId]);

  // Load active list detail
  const loadActiveList = useCallback(async (id) => {
    if (!id) return;
    setLoadingListDetail(true);
    try {
      const res = await fetchShoppingListById(id);
      if (res.success && res.data?.list) {
        setActiveList(res.data.list);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load shopping list details.');
    } finally {
      setLoadingListDetail(false);
    }
  }, []);

  useEffect(() => {
    loadLists(urlListId);
  }, [urlListId]);

  useEffect(() => {
    if (selectedListId) {
      loadActiveList(selectedListId);
    }
  }, [selectedListId, loadActiveList]);

  // List CRUD actions
  const handleSaveList = async (data) => {
    if (editingListData) {
      const res = await updateShoppingList(editingListData.id, data);
      notify('Shopping list updated.');
      await loadLists(res.data?.list?.id);
      await loadActiveList(res.data?.list?.id);
    } else {
      const res = await createShoppingList(data);
      notify('New shopping list created.');
      const newId = res.data?.list?.id;
      await loadLists(newId);
      setSelectedListId(newId);
    }
    setEditingListData(null);
  };

  const handleDeleteList = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await deleteShoppingList(id);
      notify(`Deleted shopping list "${name}".`);
      await loadLists();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete shopping list.');
    }
  };

  const handleToggleListStatus = async (status) => {
    if (!activeList) return;
    try {
      const res = await updateShoppingList(activeList.id, { status });
      notify(`List marked as ${status.toLowerCase()}.`);
      await loadLists(activeList.id);
      await loadActiveList(activeList.id);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update list status.');
    }
  };

  // Item CRUD actions
  const handleSaveItem = async (data) => {
    if (!activeList) return;
    const itemName = data.ingredientName || data.name || 'Item';
    const payload = {
      ...data,
      name: itemName,
      ingredientName: itemName
    };
    if (editingItemData) {
      await updateShoppingListItem(activeList.id, editingItemData.id, payload);
      notify(`Updated item "${itemName}".`);
    } else {
      await addShoppingListItem(activeList.id, payload);
      notify(`Added "${itemName}" to shopping list.`);
    }
    setEditingItemData(null);
    await loadActiveList(activeList.id);
    await loadLists(activeList.id);
  };

  const handleDeleteItem = async (itemId, itemName) => {
    if (!activeList) return;
    const displayName = itemName || 'this item';
    if (!window.confirm(`Remove "${displayName}" from this shopping list?`)) return;
    try {
      await deleteShoppingListItem(activeList.id, itemId);
      notify(`Removed "${displayName}".`);
      await loadActiveList(activeList.id);
      await loadLists(activeList.id);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to remove item.');
    }
  };

  // Purchase Actions
  const handleConfirmPurchase = async (purchaseData) => {
    if (!activeList || !purchaseModalItem) return;
    try {
      const itemName = purchaseModalItem.ingredientName || purchaseModalItem.name || 'Item';
      // 1. Mark as purchased
      await purchaseShoppingListItem(activeList.id, purchaseModalItem.id, {
        isPurchased: true,
        purchased: true,
        purchasedQuantity: purchaseData.actualQuantity,
        actualQuantity: purchaseData.actualQuantity,
        actualTotalPrice: purchaseData.actualPrice,
        actualPrice: purchaseData.actualPrice,
        store: purchaseData.store,
        notes: purchaseData.store
      });

      // 2. If user also requested adding to inventory
      if (purchaseData.addToInventory) {
        await addPurchasedItemToInventory(
          activeList.id,
          purchaseModalItem.id,
          {
            category: purchaseData.inventoryData?.location || 'Pantry',
            location: purchaseData.inventoryData?.location || 'Pantry',
            expiryDate: purchaseData.inventoryData?.expiryDate || null
          }
        );
        notify(`Purchased "${itemName}" and added to kitchen inventory!`);
      } else {
        notify(`Marked "${itemName}" as purchased.`);
      }

      setPurchaseModalItem(null);
      await loadActiveList(activeList.id);
      await loadLists(activeList.id);
    } catch (err) {
      throw err;
    }
  };

  const handleUnpurchaseItem = async (item) => {
    if (!activeList) return;
    const itemName = item.ingredientName || item.name || 'Item';
    try {
      await purchaseShoppingListItem(activeList.id, item.id, { isPurchased: false, purchased: false });
      notify(`Marked "${itemName}" as pending.`);
      await loadActiveList(activeList.id);
      await loadLists(activeList.id);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to unmark item.');
    }
  };

  const handleConfirmAddToInventory = async (inventoryData) => {
    if (!activeList || !addToInventoryModalItem) return;
    const itemName = addToInventoryModalItem.ingredientName || addToInventoryModalItem.name || 'Item';
    try {
      await addPurchasedItemToInventory(activeList.id, addToInventoryModalItem.id, {
        category: inventoryData.location || inventoryData.category || 'Pantry',
        location: inventoryData.location || inventoryData.category || 'Pantry',
        expiryDate: inventoryData.expiryDate || null
      });
      notify(`Added "${itemName}" to kitchen inventory!`);
      setAddToInventoryModalItem(null);
      await loadActiveList(activeList.id);
    } catch (err) {
      throw err;
    }
  };

  const handleMealPlanGenerate = async (payload) => {
    try {
      const res = await generateShoppingListFromMealPlan(payload);
      notify(`Successfully generated shopping list with ${res.data?.addedCount || 0} items!`);
      const targetId = res.data?.shoppingList?.id || selectedListId;
      await loadLists(targetId);
      if (targetId) await loadActiveList(targetId);
    } catch (err) {
      throw err;
    }
  };

  // Filter items of the active list
  const filteredItems = (activeList?.items || []).filter((item) => {
    const isItemPurchased = Boolean(item.isPurchased ?? item.purchased);
    // Status filter
    if (itemFilter === 'pending' && isItemPurchased) return false;
    if (itemFilter === 'purchased' && !isItemPurchased) return false;

    // Category filter
    if (categoryFilter !== 'all' && (item.category || 'Other') !== categoryFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const itemName = (item.ingredientName || item.name || '').toLowerCase();
      const matchName = itemName.includes(q);
      const matchCat = (item.category || '').toLowerCase().includes(q);
      if (!matchName && !matchCat) return false;
    }

    return true;
  });

  // Calculate distinct categories in active list
  const activeCategories = Array.from(
    new Set((activeList?.items || []).map((i) => i.category || 'Other'))
  );

  const budgetSummary = {
    budget: activeList?.budget ?? activeList?.budgetSummary?.budget,
    estimatedTotal: activeList?.estimatedTotal ?? activeList?.budgetSummary?.estimatedTotal ?? 0,
    actualSpent: activeList?.actualTotal ?? activeList?.budgetSummary?.actualSpent ?? 0,
    remainingBudget: activeList?.remainingBudget ?? activeList?.budgetSummary?.remainingBudget,
    totalItemsCount: activeList?.itemsCount ?? activeList?.items?.length ?? 0,
    purchasedItemsCount: activeList?.purchasedCount ?? (activeList?.items || []).filter(i => (i.isPurchased ?? i.purchased)).length,
    pendingItemsCount: activeList?.pendingCount ?? (activeList?.items || []).filter(i => !(i.isPurchased ?? i.purchased)).length,
    budgetUtilization: activeList?.budgetUtilisationPercent ?? activeList?.budgetSummary?.budgetUtilization ?? 0,
    isOverBudget: activeList?.isOverBudget ?? false,
    hasMissingPrices: activeList?.hasUnknownPrices ?? activeList?.budgetSummary?.hasMissingPrices ?? false,
    overBudgetAmount: activeList?.budget && (activeList?.actualTotal || 0) > activeList.budget
      ? Number(((activeList.actualTotal || 0) - activeList.budget).toFixed(2))
      : 0
  };
  const isOverBudget = budgetSummary.isOverBudget;
  const budgetUtilization = Math.min(budgetSummary.budgetUtilization || 0, 100);

  return (
    <div className={styles.container}>
      {/* Top Page Header */}
      <header className={styles.pageHeader}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.headerIcon}>
            <ShoppingCart size={24} />
          </div>
          <div>
            <h1 className={styles.title}>Smart Shopping Lists & Grocery Budgets</h1>
            <p className={styles.subtitle}>
              Plan grocery runs, convert shortfalls from meal schedules, track actual spending in INR (₹), and stock items directly into your pantry.
            </p>
          </div>
        </div>

        <div className={styles.topActions}>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
            onClick={() => setIsMealPlanGenOpen(true)}
          >
            <Sparkles size={16} />
            <span>Generate from Meal Plan</span>
          </button>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => setIsBudgetSettingsOpen(true)}
            title="Configure monthly and weekly grocery budgets"
          >
            <PiggyBank size={16} />
            <span>Budget Limits</span>
          </button>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => setIsPriceHistoryOpen(true)}
            title="View price history and trends"
          >
            <History size={16} />
            <span>Price Tracking</span>
          </button>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => {
              setEditingListData(null);
              setIsCreateListOpen(true);
            }}
          >
            <Plus size={16} />
            <span>New List</span>
          </button>
        </div>
      </header>

      {notification && <div className={styles.notificationBanner}>{notification}</div>}
      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* Main 2-Column Layout */}
      <div className={styles.layoutGrid}>
        {/* Left Sidebar: Lists Selector */}
        <aside className={styles.sidebarCard}>
          <div className={styles.sidebarHeader}>
            <h3>Your Shopping Lists ({lists.length})</h3>
            <button
              type="button"
              className={styles.iconAddBtn}
              onClick={() => {
                setEditingListData(null);
                setIsCreateListOpen(true);
              }}
              title="Create new shopping list"
            >
              <Plus size={16} />
            </button>
          </div>

          {loadingLists ? (
            <div className={styles.sidebarLoading}>Loading shopping lists...</div>
          ) : lists.length === 0 ? (
            <div className={styles.sidebarEmpty}>
              <ShoppingCart size={32} className={styles.emptyIcon} />
              <p>No shopping lists yet.</p>
              <button
                type="button"
                className={styles.createFirstBtn}
                onClick={() => setIsCreateListOpen(true)}
              >
                Create your first list
              </button>
            </div>
          ) : (
            <div className={styles.listsScroll}>
              {lists.map((l) => {
                const isSelected = l.id === selectedListId;
                const isCompleted = l.status === 'COMPLETED';
                const isArchived = l.status === 'ARCHIVED';

                return (
                  <div
                    key={l.id}
                    className={`${styles.listItemRow} ${isSelected ? styles.listItemActive : ''}`}
                    onClick={() => setSelectedListId(l.id)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className={styles.listItemMain}>
                      <div className={styles.listItemNameRow}>
                        <strong className={styles.listName}>{l.name}</strong>
                        {isCompleted && <span className={styles.statusCompletedBadge}>Done</span>}
                        {isArchived && <span className={styles.statusArchivedBadge}>Archived</span>}
                      </div>

                      <div className={styles.listItemMeta}>
                        <span>{l.itemsCount || 0} items</span>
                        {l.budget !== null && l.budget !== undefined && (
                          <span>Budget: {formatCurrency(l.budget)}</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={16} className={styles.chevron} />
                  </div>
                );
              })}
            </div>
          )}
        </aside>

        {/* Right Main Panel: Active List Details & Items */}
        <main className={styles.mainContent}>
          {loadingListDetail ? (
            <div className={styles.detailLoading}>
              <div className={styles.spinner} />
              <span>Loading shopping list details...</span>
            </div>
          ) : !activeList ? (
            <div className={styles.emptyStateContainer}>
              <ShoppingCart size={48} className={styles.emptyStateIcon} />
              <h2>No Shopping List Selected</h2>
              <p>Select a shopping list from the left or generate a new list from your upcoming meal schedule.</p>
              <div className={styles.emptyStateActions}>
                <button
                  type="button"
                  className={styles.emptyPrimaryBtn}
                  onClick={() => setIsMealPlanGenOpen(true)}
                >
                  <Sparkles size={16} />
                  <span>Generate from Meal Plan</span>
                </button>
                <button
                  type="button"
                  className={styles.emptySecondaryBtn}
                  onClick={() => setIsCreateListOpen(true)}
                >
                  <Plus size={16} />
                  <span>Create Empty List</span>
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.activeListCard}>
              {/* Active List Top Bar */}
              <div className={styles.activeListHeader}>
                <div>
                  <div className={styles.activeTitleRow}>
                    <h2>{activeList.name}</h2>
                    <span
                      className={`${styles.listBadge} ${
                        activeList.status === 'COMPLETED'
                          ? styles.badgeSuccess
                          : activeList.status === 'ARCHIVED'
                          ? styles.badgeNeutral
                          : styles.badgeActive
                      }`}
                    >
                      {activeList.status}
                    </span>
                  </div>
                  {activeList.notes && <p className={styles.activeNotes}>{activeList.notes}</p>}
                </div>

                <div className={styles.activeHeaderActions}>
                  <button
                    type="button"
                    className={styles.optBtn}
                    onClick={() => setIsCostOptOpen(true)}
                    title="View cost breakdown, missing prices, and AI shopping advice"
                  >
                    <TrendingUp size={15} />
                    <span>Cost Optimisation</span>
                  </button>

                  <button
                    type="button"
                    className={styles.addItemBtn}
                    onClick={() => {
                      setEditingItemData(null);
                      setIsAddItemOpen(true);
                    }}
                  >
                    <Plus size={15} />
                    <span>Add Item</span>
                  </button>

                  <button
                    type="button"
                    className={styles.iconSecondaryBtn}
                    onClick={() => {
                      setEditingListData(activeList);
                      setIsCreateListOpen(true);
                    }}
                    title="Edit list details & budget"
                  >
                    <Edit2 size={15} />
                  </button>

                  {activeList.status === 'ACTIVE' ? (
                    <button
                      type="button"
                      className={styles.iconSecondaryBtn}
                      onClick={() => handleToggleListStatus('COMPLETED')}
                      title="Mark entire list as completed"
                    >
                      <Check size={15} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.iconSecondaryBtn}
                      onClick={() => handleToggleListStatus('ACTIVE')}
                      title="Reopen list as active"
                    >
                      <RefreshCw size={15} />
                    </button>
                  )}

                  <button
                    type="button"
                    className={styles.iconDangerBtn}
                    onClick={() => handleDeleteList(activeList.id, activeList.name)}
                    title="Delete shopping list"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Budget & Spend Overview Card */}
              <div className={styles.budgetCard}>
                <div className={styles.budgetMetricsGrid}>
                  <div className={styles.budgetMetricItem}>
                    <span className={styles.bLabel}>List Budget</span>
                    <strong className={styles.bValue}>
                      {formatCurrency(budgetSummary.budget, 'No limit')}
                    </strong>
                  </div>

                  <div className={styles.budgetMetricItem}>
                    <span className={styles.bLabel}>Estimated Total</span>
                    <strong className={styles.bValue}>
                      {formatCurrency(budgetSummary.estimatedTotal, '₹0')}
                      {budgetSummary.hasMissingPrices && (
                        <span className={styles.partialTag} title="Some items have missing prices">
                          *
                        </span>
                      )}
                    </strong>
                  </div>

                  <div className={styles.budgetMetricItem}>
                    <span className={styles.bLabel}>Actual Spent</span>
                    <strong className={styles.bValue}>
                      {formatCurrency(budgetSummary.actualSpent, '₹0')}
                    </strong>
                  </div>

                  <div className={styles.budgetMetricItem}>
                    <span className={styles.bLabel}>Remaining Budget</span>
                    <strong
                      className={styles.bValue}
                      style={{ color: isOverBudget ? '#dc2626' : '#059669' }}
                    >
                      {formatCurrency(budgetSummary.remainingBudget, 'N/A')}
                    </strong>
                  </div>

                  <div className={styles.budgetMetricItem}>
                    <span className={styles.bLabel}>Progress</span>
                    <strong className={styles.bValue}>
                      {budgetSummary.purchasedItemsCount || 0} / {budgetSummary.totalItemsCount || 0} Bought
                    </strong>
                  </div>
                </div>

                {/* Progress bar if budget exists */}
                {budgetSummary.budget !== null && budgetSummary.budget !== undefined && (
                  <div className={styles.progressBarWrapper}>
                    <div
                      className={`${styles.progressBar} ${
                        isOverBudget ? styles.barDanger : budgetUtilization > 80 ? styles.barWarning : styles.barSuccess
                      }`}
                      style={{ width: `${budgetUtilization}%` }}
                    />
                  </div>
                )}

                {/* Over-budget alert */}
                {isOverBudget && (
                  <div className={styles.overBudgetAlert}>
                    <AlertTriangle size={15} />
                    <span>
                      Estimated cost exceeds your allocated budget by{' '}
                      <strong>{formatCurrency(budgetSummary.overBudgetAmount)}</strong>.
                    </span>
                  </div>
                )}
              </div>

              {/* Toolbar: Filter Tabs & Search */}
              <div className={styles.toolbar}>
                <div className={styles.tabGroup}>
                  <button
                    type="button"
                    className={`${styles.tabBtn} ${itemFilter === 'all' ? styles.tabActive : ''}`}
                    onClick={() => setItemFilter('all')}
                  >
                    All Items ({activeList.items?.length || 0})
                  </button>
                  <button
                    type="button"
                    className={`${styles.tabBtn} ${itemFilter === 'pending' ? styles.tabActive : ''}`}
                    onClick={() => setItemFilter('pending')}
                  >
                    To Buy ({budgetSummary.pendingItemsCount || 0})
                  </button>
                  <button
                    type="button"
                    className={`${styles.tabBtn} ${itemFilter === 'purchased' ? styles.tabActive : ''}`}
                    onClick={() => setItemFilter('purchased')}
                  >
                    Purchased ({budgetSummary.purchasedItemsCount || 0})
                  </button>
                </div>

                <div className={styles.filterRight}>
                  {activeCategories.length > 1 && (
                    <select
                      className={styles.categorySelect}
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option value="all">All Categories</option>
                      {activeCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  )}

                  <div className={styles.searchWrapper}>
                    <Search size={14} className={styles.searchIcon} />
                    <input
                      type="text"
                      className={styles.searchInput}
                      placeholder="Filter items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Items List Table / Checklist */}
              {filteredItems.length === 0 ? (
                <div className={styles.emptyItemsBox}>
                  <p>
                    {activeList.items?.length === 0
                      ? 'This shopping list is currently empty.'
                      : 'No items match your active filter.'}
                  </p>
                  {activeList.items?.length === 0 && (
                    <div className={styles.emptyItemActions}>
                      <button
                        type="button"
                        className={styles.addItemBtn}
                        onClick={() => setIsAddItemOpen(true)}
                      >
                        <Plus size={15} />
                        <span>Add an Item</span>
                      </button>
                      <button
                        type="button"
                        className={styles.optBtn}
                        onClick={() => setIsMealPlanGenOpen(true)}
                      >
                        <Sparkles size={15} />
                        <span>Populate from Meal Plan</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.itemsTableWrapper}>
                  <table className={styles.itemsTable}>
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>Status</th>
                        <th>Ingredient</th>
                        <th>Required Qty</th>
                        <th>Estimated Price</th>
                        <th>Actual Purchase</th>
                        <th>Inventory Status</th>
                        <th style={{ width: '90px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item) => {
                        const isPurchased = Boolean(item.isPurchased ?? item.purchased);
                        const itemName = item.ingredientName || item.name || 'Item';
                        const actualPrice = item.actualTotalPrice ?? item.actualPrice;
                        const actualQty = item.purchasedQuantity ?? item.actualQuantity ?? item.quantity;
                        const actualUnit = item.purchasedUnit || item.unit;
                        const isStocked = Boolean(item.addedToInventory || item.inventoryItemId);

                        return (
                          <tr
                            key={item.id}
                            className={`${styles.itemRow} ${isPurchased ? styles.rowPurchased : ''}`}
                          >
                            {/* Checkbox / Purchase Toggle */}
                            <td>
                              <button
                                type="button"
                                className={styles.checkToggleBtn}
                                onClick={() => {
                                  if (isPurchased) {
                                    handleUnpurchaseItem(item);
                                  } else {
                                    setPurchaseModalItem(item);
                                  }
                                }}
                                title={isPurchased ? 'Click to unpurchase' : 'Mark as purchased'}
                              >
                                {isPurchased ? (
                                  <CheckCircle2 size={18} className={styles.checkedIcon} />
                                ) : (
                                  <Circle size={18} className={styles.uncheckedIcon} />
                                )}
                              </button>
                            </td>

                            {/* Ingredient & Category */}
                            <td>
                              <div className={styles.itemCol}>
                                <strong className={`${styles.itemName} ${isPurchased ? styles.nameStrikethrough : ''}`}>
                                  {itemName}
                                </strong>
                                <div className={styles.itemSubRow}>
                                  {item.category && <span className={styles.itemCategory}>{item.category}</span>}
                                  {item.notes && <span className={styles.itemNotes}>• {item.notes}</span>}
                                </div>
                              </div>
                            </td>

                            {/* Planned Quantity */}
                            <td>
                              <span className={styles.qtyText}>
                                {item.quantity} {item.unit}
                              </span>
                            </td>

                            {/* Estimated Price */}
                            <td>
                              {item.estimatedTotalPrice !== null && item.estimatedTotalPrice !== undefined ? (
                                <div className={styles.priceCol}>
                                  <strong>{formatCurrency(item.estimatedTotalPrice)}</strong>
                                  {item.estimatedUnitPrice && (
                                    <span className={styles.unitSubPrice}>
                                      ₹{item.estimatedUnitPrice}/{item.unit}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className={styles.missingPriceTag}>Missing Price</span>
                              )}
                            </td>

                            {/* Actual Purchase Info */}
                            <td>
                              {isPurchased ? (
                                <div className={styles.actualCol}>
                                  <strong className={styles.actualTotal}>
                                    {formatCurrency(actualPrice, '₹0 paid')}
                                  </strong>
                                  <span className={styles.actualQty}>
                                    Bought: {actualQty} {actualUnit}
                                  </span>
                                </div>
                              ) : (
                                <span className={styles.pendingText}>Pending</span>
                              )}
                            </td>

                            {/* Add to Inventory Action / Status */}
                            <td>
                              {isPurchased ? (
                                isStocked ? (
                                  <span className={styles.inInventoryBadge} title="Added to pantry stock">
                                    <PackageCheck size={14} />
                                    <span>In Pantry</span>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    className={styles.addToInvBtn}
                                    onClick={() => setAddToInventoryModalItem(item)}
                                    title="Add purchased quantity into kitchen inventory stock"
                                  >
                                    <PackageCheck size={14} />
                                    <span>Add to Inventory</span>
                                  </button>
                                )
                              ) : (
                                <span className={styles.dashText}>—</span>
                              )}
                            </td>

                            {/* Actions */}
                            <td style={{ textAlign: 'right' }}>
                              <div className={styles.itemActionGroup}>
                                <button
                                  type="button"
                                  className={styles.itemIconBtn}
                                  onClick={() => {
                                    setEditingItemData(item);
                                    setIsAddItemOpen(true);
                                  }}
                                  title="Edit item"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  type="button"
                                  className={`${styles.itemIconBtn} ${styles.itemIconDanger}`}
                                  onClick={() => handleDeleteItem(item.id, itemName)}
                                  title="Delete item"
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
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <CreateListModal
        isOpen={isCreateListOpen}
        onClose={() => {
          setIsCreateListOpen(false);
          setEditingListData(null);
        }}
        onSave={handleSaveList}
        initialData={editingListData}
      />

      <AddShoppingItemModal
        isOpen={isAddItemOpen}
        onClose={() => {
          setIsAddItemOpen(false);
          setEditingItemData(null);
        }}
        onSave={handleSaveItem}
        initialData={editingItemData}
      />

      <PurchaseItemModal
        isOpen={Boolean(purchaseModalItem)}
        onClose={() => setPurchaseModalItem(null)}
        item={purchaseModalItem}
        onConfirmPurchase={handleConfirmPurchase}
      />

      <AddToInventoryModal
        isOpen={Boolean(addToInventoryModalItem)}
        onClose={() => setAddToInventoryModalItem(null)}
        item={addToInventoryModalItem}
        onConfirmAdd={handleConfirmAddToInventory}
      />

      <GenerateFromMealPlanModal
        isOpen={isMealPlanGenOpen}
        onClose={() => setIsMealPlanGenOpen(false)}
        onGenerate={handleMealPlanGenerate}
        existingLists={lists}
        activeListId={selectedListId}
      />

      <CostOptimisationModal
        isOpen={isCostOptOpen}
        onClose={() => setIsCostOptOpen(false)}
        listId={activeList?.id}
        listName={activeList?.name}
      />

      <BudgetSettingsModal
        isOpen={isBudgetSettingsOpen}
        onClose={() => setIsBudgetSettingsOpen(false)}
        onUpdated={() => {
          if (activeList) loadActiveList(activeList.id);
        }}
      />

      <PriceHistoryModal
        isOpen={isPriceHistoryOpen}
        onClose={() => setIsPriceHistoryOpen(false)}
      />
    </div>
  );
}
