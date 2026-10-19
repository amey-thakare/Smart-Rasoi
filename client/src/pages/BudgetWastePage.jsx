import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Trash2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  TrendingDown,
  Calendar,
  Clock,
  CheckCircle2,
  Filter,
  Search,
  ArrowRight,
  ShieldAlert,
  Flame,
  ChefHat,
  Info,
  DollarSign,
  Utensils,
  Layers,
  BarChart3,
  CalendarDays,
  FileSpreadsheet
} from 'lucide-react';
import StatCard from '../components/common/StatCard.jsx';
import SectionHeader from '../components/common/SectionHeader.jsx';
import RecordWasteModal from '../components/waste/RecordWasteModal.jsx';
import WasteCorrectionModal from '../components/waste/WasteCorrectionModal.jsx';
import AiWasteAdvisorModal from '../components/waste/AiWasteAdvisorModal.jsx';
import RecipeDetailModal from '../components/recipes/RecipeDetailModal.jsx';
import {
  fetchExpiryOverview,
  fetchWasteRecords,
  fetchWasteAnalytics,
  fetchAtRiskInventory,
  fetchExpiryRecipeSuggestions
} from '../services/api.js';
import styles from './BudgetWastePage.module.css';

export default function BudgetWastePage() {
  const [activeTab, setActiveTab] = useState('expiry'); // 'expiry' | 'analytics' | 'log' | 'recipes'

  // Modals state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [preselectedInventoryItem, setPreselectedInventoryItem] = useState(null);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [recordToReverse, setRecordToReverse] = useState(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  // Expiry tab state
  const [expiryOverview, setExpiryOverview] = useState(null);
  const [expiryCategoryFilter, setExpiryCategoryFilter] = useState('ALL');
  const [expirySearch, setExpirySearch] = useState('');
  const [expiryLoading, setExpiryLoading] = useState(true);

  // At-Risk inventory state
  const [atRiskData, setAtRiskData] = useState(null);

  // Waste analytics state
  const [analyticsPeriod, setAnalyticsPeriod] = useState('month'); // 7d | 30d | month | all
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Waste records state
  const [wasteRecords, setWasteRecords] = useState([]);
  const [recordsReasonFilter, setRecordsReasonFilter] = useState('ALL');
  const [recordsSearch, setRecordsSearch] = useState('');
  const [recordsLoading, setRecordsLoading] = useState(true);

  // Recipe suggestions state
  const [recipeSuggestions, setRecipeSuggestions] = useState([]);
  const [recipesLoading, setRecipesLoading] = useState(true);

  // Global notification banner
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  // Load Expiry Overview & At-Risk Inventory
  const loadExpiryData = useCallback(async () => {
    setExpiryLoading(true);
    try {
      const [overviewRes, atRiskRes] = await Promise.all([
        fetchExpiryOverview(),
        fetchAtRiskInventory()
      ]);
      setExpiryOverview(overviewRes?.data || overviewRes);
      setAtRiskData(atRiskRes?.data || atRiskRes);
    } catch (err) {
      console.error('Failed to load expiry overview:', err);
    } finally {
      setExpiryLoading(false);
    }
  }, []);

  // Load Waste Analytics
  const loadAnalytics = useCallback(async (period) => {
    setAnalyticsLoading(true);
    try {
      const res = await fetchWasteAnalytics({ period });
      setAnalyticsData(res?.data || res);
    } catch (err) {
      console.error('Failed to load waste analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  // Load Waste Records
  const loadRecords = useCallback(async () => {
    setRecordsLoading(true);
    try {
      const res = await fetchWasteRecords({ limit: 100 });
      const records = res?.data?.records || res?.records || (Array.isArray(res) ? res : []);
      setWasteRecords(records);
    } catch (err) {
      console.error('Failed to load waste records:', err);
    } finally {
      setRecordsLoading(false);
    }
  }, []);

  // Load Recipe Rescue Suggestions
  const loadSuggestions = useCallback(async () => {
    setRecipesLoading(true);
    try {
      const res = await fetchExpiryRecipeSuggestions();
      const list = res?.data?.suggestions || res?.suggestions || (Array.isArray(res) ? res : []);
      setRecipeSuggestions(list);
    } catch (err) {
      console.error('Failed to load recipe suggestions:', err);
    } finally {
      setRecipesLoading(false);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    loadExpiryData();
    loadAnalytics(analyticsPeriod);
    loadRecords();
    loadSuggestions();
  }, [loadExpiryData, loadAnalytics, analyticsPeriod, loadRecords, loadSuggestions]);

  // Handle opening modal for a specific inventory item
  const handleRecordWasteForItem = (item) => {
    setPreselectedInventoryItem(item);
    setIsRecordModalOpen(true);
  };

  const handleRecordWasteSuccess = (newRecord) => {
    setFeedbackMessage({
      type: 'success',
      text: `Successfully recorded waste for "${newRecord?.ingredientName || 'item'}" and deducted stock.`
    });
    setTimeout(() => setFeedbackMessage(null), 5000);
    // Refresh all data tabs
    loadExpiryData();
    loadAnalytics(analyticsPeriod);
    loadRecords();
    loadSuggestions();
  };

  const handleReverseSuccess = (reversedRecord) => {
    setFeedbackMessage({
      type: 'success',
      text: `Reversal confirmed for "${reversedRecord?.ingredientName || 'item'}". Audit trail preserved.`
    });
    setTimeout(() => setFeedbackMessage(null), 5000);
    // Refresh all data tabs
    loadExpiryData();
    loadAnalytics(analyticsPeriod);
    loadRecords();
    loadSuggestions();
  };

  // Filtered expiry items
  const allCategorisedItems = expiryOverview?.items || [];
  const filteredExpiryItems = allCategorisedItems.filter((item) => {
    const itemStatus = item.status || item.urgencyCategory || 'NO_EXPIRY_DATE';
    if (expiryCategoryFilter !== 'ALL' && itemStatus !== expiryCategoryFilter) {
      return false;
    }
    if (expirySearch.trim()) {
      const query = expirySearch.toLowerCase();
      return (
        item.name.toLowerCase().includes(query) ||
        (item.category && item.category.toLowerCase().includes(query))
      );
    }
    return true;
  });

  // Filtered waste records
  const filteredRecords = wasteRecords.filter((rec) => {
    if (recordsReasonFilter !== 'ALL' && rec.reason !== recordsReasonFilter) {
      return false;
    }
    if (recordsSearch.trim()) {
      const query = recordsSearch.toLowerCase();
      return (
        rec.ingredientName.toLowerCase().includes(query) ||
        (rec.notes && rec.notes.toLowerCase().includes(query))
      );
    }
    return true;
  });

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.headerIcon}>
            <TrendingDown size={28} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Grocery Budget & Food Waste Analytics</h1>
            <p className={styles.pageSubtitle}>
              Monitor shelf life, identify root causes of avoidable food waste, and rescue near-expiry stock
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            className="btn btn-secondary"
            id="ai-waste-advisor-button"
          >
            <Sparkles size={16} />
            <span>AI Waste Advisor</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPreselectedInventoryItem(null);
              setIsRecordModalOpen(true);
            }}
            className="btn btn-primary"
            id="record-waste-button"
          >
            <Trash2 size={16} />
            <span>Record Food Waste</span>
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div
          className={`${styles.notificationBanner} ${
            feedbackMessage.type === 'success'
              ? styles.notificationSuccess
              : styles.notificationWarning
          }`}
        >
          <CheckCircle2 size={16} />
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className={styles.tabsBar} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'expiry'}
          className={`${styles.tabBtn} ${activeTab === 'expiry' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('expiry')}
        >
          <Clock size={16} />
          <span>Shelf Life & At-Risk Tracker</span>
          {expiryOverview?.summary?.expiringIn3DaysCount > 0 && (
            <span className={styles.tabBadge}>
              {expiryOverview.summary.expiringIn3DaysCount}
            </span>
          )}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'analytics'}
          className={`${styles.tabBtn} ${activeTab === 'analytics' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 size={16} />
          <span>Waste Analytics & Cost</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'log'}
          className={`${styles.tabBtn} ${activeTab === 'log' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('log')}
        >
          <FileSpreadsheet size={16} />
          <span>Waste Log & Audit Ledger</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'recipes'}
          className={`${styles.tabBtn} ${activeTab === 'recipes' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('recipes')}
        >
          <ChefHat size={16} />
          <span>Near-Expiry Recipe Rescuer</span>
          {recipeSuggestions.length > 0 && (
            <span className={styles.tabBadgeGreen}>{recipeSuggestions.length}</span>
          )}
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: Shelf Life & At-Risk Tracker */}
      {/* ============================================================ */}
      {activeTab === 'expiry' && (
        <div className={styles.tabContent}>
          {/* Expiry Overview Stat Cards */}
          <div className={styles.statsGrid}>
            <StatCard
              title="Expired Stock"
              value={expiryOverview?.summary?.expiredCount ?? 0}
              description="Items past consumption date"
              iconName="AlertTriangle"
              isWarning={expiryOverview?.summary?.expiredCount > 0}
            />
            <StatCard
              title="Expiring Today"
              value={expiryOverview?.summary?.expiringTodayCount ?? 0}
              description="Requires immediate cooking"
              iconName="Flame"
              isWarning={expiryOverview?.summary?.expiringTodayCount > 0}
            />
            <StatCard
              title="Expiring in ≤ 3 Days"
              value={expiryOverview?.summary?.expiringIn3DaysCount ?? 0}
              description="Critical kitchen rescue window"
              iconName="Clock"
              isWarning={expiryOverview?.summary?.expiringIn3DaysCount > 0}
            />
            <StatCard
              title="Longer Shelf Life"
              value={expiryOverview?.summary?.longerShelfLifeCount ?? 0}
              description="Safe & stable pantry inventory"
              iconName="CheckCircle2"
              isPositive={true}
            />
          </div>

          {/* At-Risk Inventory Cross-Referenced with Meal Plans */}
          {(() => {
            const atRiskList = atRiskData?.items || atRiskData?.atRiskItems || [];
            if (!atRiskData || atRiskList.length === 0) return null;
            const uncoveredCount = atRiskData.uncoveredCount ?? atRiskData.summary?.uncoveredHighRiskCount ?? 0;

            return (
              <div className={styles.atRiskCard}>
                <div className={styles.atRiskHeader}>
                  <div className={styles.atRiskTitleGroup}>
                    <ShieldAlert size={20} className={styles.atRiskIcon} />
                    <div>
                      <h3 className={styles.atRiskTitle}>
                        At-Risk Inventory Cross-Referenced with Upcoming Meals
                      </h3>
                      <p className={styles.atRiskSubtitle}>
                        {uncoveredCount > 0
                          ? `Warning: ${uncoveredCount} near-expiry ingredient(s) are NOT scheduled in any upcoming meal plan!`
                          : 'Great planning! Your near-expiry items are covered by planned meals.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('recipes')}
                    className="btn btn-secondary"
                  >
                    <ChefHat size={15} />
                    <span>View Rescue Recipes</span>
                  </button>
                </div>

                <div className={styles.atRiskList}>
                  {atRiskList.slice(0, 4).map((risk) => {
                    const riskTag = risk.riskLevel || risk.status || risk.urgencyCategory || 'AT_RISK';
                    const isDanger = riskTag === 'CRITICAL' || riskTag === 'EXPIRED';
                    const isWarning =
                      riskTag === 'HIGH' ||
                      riskTag === 'EXPIRING_TODAY' ||
                      riskTag === 'EXPIRING_IN_3_DAYS';

                    return (
                      <div key={risk.id} className={styles.atRiskItemRow}>
                        <div className={styles.atRiskItemInfo}>
                          <span className={styles.atRiskItemName}>{risk.name}</span>
                          <span className={styles.atRiskItemStock}>
                            {risk.quantity} {risk.unit} ({risk.category})
                          </span>
                        </div>

                        <div className={styles.atRiskItemStatus}>
                          <span
                            className={`${styles.urgencyBadge} ${
                              isDanger
                                ? styles.badgeDanger
                                : isWarning
                                ? styles.badgeWarning
                                : styles.badgeInfo
                            }`}
                          >
                            {String(riskTag).replace(/_/g, ' ')}
                          </span>

                          {risk.isCoveredByMealPlan ? (
                            <span className={styles.coverageBadgeCovered}>
                              <CheckCircle2 size={12} />
                              <span>
                                Covered in Meal Plan ({risk.plannedUsages?.length || risk.matchingMealPlans?.length || 1} meal)
                              </span>
                            </span>
                          ) : (
                            <span className={styles.coverageBadgeUncovered}>
                              <AlertTriangle size={12} />
                              <span>UNCOVERED RISK — No meal planned</span>
                            </span>
                          )}
                        </div>

                        <div className={styles.atRiskItemActions}>
                          <button
                            type="button"
                            onClick={() => handleRecordWasteForItem(risk)}
                            className={styles.smallActionBtn}
                            title="Record discard if already spoiled"
                          >
                            <Trash2 size={13} />
                            <span>Discard</span>
                          </button>
                          <Link
                            to={`/recipes?search=${encodeURIComponent(risk.name)}`}
                            className={styles.smallActionBtnPrimary}
                          >
                            <Utensils size={13} />
                            <span>Find Recipes</span>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Catalog Filter Bar */}
          <div className={styles.filterBar}>
            <div className={styles.searchWrapper}>
              <Search size={15} className={styles.searchIcon} />
              <input
                type="text"
                value={expirySearch}
                onChange={(e) => setExpirySearch(e.target.value)}
                placeholder="Search ingredients by name or category..."
                className={styles.searchInput}
              />
            </div>

            <div className={styles.chipFilterGroup}>
              {[
                { key: 'ALL', label: 'All Items' },
                { key: 'EXPIRED', label: 'Expired' },
                { key: 'EXPIRING_TODAY', label: 'Expiring Today' },
                { key: 'EXPIRING_IN_3_DAYS', label: '≤ 3 Days' },
                { key: 'EXPIRING_IN_7_DAYS', label: '≤ 7 Days' },
                { key: 'LONGER_SHELF_LIFE', label: 'Safe (> 7d)' },
                { key: 'NO_EXPIRY_DATE', label: 'No Date' }
              ].map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  className={`${styles.filterChip} ${
                    expiryCategoryFilter === chip.key ? styles.filterChipActive : ''
                  }`}
                  onClick={() => setExpiryCategoryFilter(chip.key)}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Expiry Items Table */}
          {expiryLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner} />
              <p>Analyzing kitchen shelf life...</p>
            </div>
          ) : filteredExpiryItems.length === 0 ? (
            <div className={styles.emptyContainer}>
              <CheckCircle2 size={36} className={styles.emptyIcon} />
              <h3>No ingredients match this shelf life filter</h3>
              <p>Try switching filter chips or clearing your search query.</p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Ingredient Name</th>
                    <th>Category</th>
                    <th>Current Stock</th>
                    <th>Expiry Date</th>
                    <th>Shelf Life Status</th>
                    <th className={styles.actionsCol}>Quick Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpiryItems.map((item) => (
                    <tr key={item.id}>
                      <td className={styles.nameCell}>
                        <span className={styles.boldName}>{item.name}</span>
                        {item.notes && (
                          <span className={styles.notesText}>{item.notes}</span>
                        )}
                      </td>
                      <td>
                        <span className={styles.categoryBadge}>{item.category}</span>
                      </td>
                      <td>
                        <strong>{item.quantity}</strong> {item.unit}
                      </td>
                      <td>
                        {item.expiryDate
                          ? new Date(item.expiryDate).toLocaleDateString()
                          : 'No Date Set'}
                      </td>
                      <td>
                        {(() => {
                          const itemStatus = item.status || item.urgencyCategory || 'NO_EXPIRY_DATE';
                          return (
                            <span
                              className={`${styles.urgencyBadge} ${
                                itemStatus === 'EXPIRED'
                                  ? styles.badgeDanger
                                  : itemStatus === 'EXPIRING_TODAY' ||
                                    itemStatus === 'EXPIRING_IN_3_DAYS'
                                  ? styles.badgeWarning
                                  : itemStatus === 'EXPIRING_IN_7_DAYS'
                                  ? styles.badgeAmber
                                  : itemStatus === 'LONGER_SHELF_LIFE'
                                  ? styles.badgeSuccess
                                  : styles.badgeNeutral
                              }`}
                            >
                              {String(itemStatus).replace(/_/g, ' ')}
                              {item.daysRemaining != null && (
                                <span className={styles.daysText}>
                                  ({item.daysRemaining > 0 ? `+${item.daysRemaining}d` : `${item.daysRemaining}d`})
                                </span>
                              )}
                            </span>
                          );
                        })()}
                      </td>
                      <td className={styles.actionsCol}>
                        <div className={styles.actionBtnRow}>
                          <button
                            type="button"
                            onClick={() => handleRecordWasteForItem(item)}
                            className={styles.rowDiscardBtn}
                            title={`Record waste for ${item.name}`}
                          >
                            <Trash2 size={13} />
                            <span>Discard</span>
                          </button>
                          <Link
                            to={`/recipes?search=${encodeURIComponent(item.name)}`}
                            className={styles.rowRecipeBtn}
                            title={`Find recipes using ${item.name}`}
                          >
                            <Utensils size={13} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: Waste Analytics & Trends */}
      {/* ============================================================ */}
      {activeTab === 'analytics' && (
        <div className={styles.tabContent}>
          {/* Period selector */}
          <div className={styles.periodHeader}>
            <span className={styles.periodLabel}>Analytics Window:</span>
            <div className={styles.periodBtnGroup}>
              {[
                { key: '7d', label: 'Last 7 Days' },
                { key: '30d', label: 'Last 30 Days' },
                { key: 'month', label: 'This Month' },
                { key: 'all', label: 'All Time' }
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  className={`${styles.periodBtn} ${
                    analyticsPeriod === p.key ? styles.periodBtnActive : ''
                  }`}
                  onClick={() => {
                    setAnalyticsPeriod(p.key);
                    loadAnalytics(p.key);
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {analyticsLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner} />
              <p>Computing waste metrics & financial loss...</p>
            </div>
          ) : analyticsData ? (
            (() => {
              const totalIncidents = analyticsData.recordsCount ?? analyticsData.totalIncidents ?? 0;
              const totalEstimatedCost = analyticsData.totalEstimatedCost ?? 0;
              const reasonsList = Array.isArray(analyticsData.reasonsBreakdown)
                ? analyticsData.reasonsBreakdown
                : analyticsData.byReason
                ? Object.entries(analyticsData.byReason).map(([reason, stat]) => ({ reason, ...stat }))
                : [];
              const mostFrequentReason =
                analyticsData.mostFrequentReason ||
                (reasonsList.length > 0
                  ? [...reasonsList].sort((a, b) => b.count - a.count)[0]?.reason
                  : 'None');
              const topList = analyticsData.topIngredients || analyticsData.topWastedIngredients || [];
              const unitsMap = analyticsData.quantitiesByUnit || analyticsData.safeUnits || {};

              return (
                <div className={styles.analyticsBody}>
                  {/* Stat Cards */}
                  <div className={styles.statsGrid}>
                    <StatCard
                      title="Waste Incidents"
                      value={totalIncidents}
                      description="Logged discards in selected period"
                      iconName="Trash2"
                      isWarning={totalIncidents > 0}
                    />
                    <StatCard
                      title="Estimated Financial Loss"
                      value={`₹${Number(totalEstimatedCost).toFixed(2)}`}
                      description="Grounded in grocery price records"
                      iconName="DollarSign"
                      isWarning={totalEstimatedCost > 0}
                    />
                    <StatCard
                      title="Most Frequent Cause"
                      value={mostFrequentReason ? String(mostFrequentReason).replace(/_/g, ' ') : 'None'}
                      description="Primary reason tagged"
                      iconName="AlertTriangle"
                      isNeutral={true}
                    />
                    <StatCard
                      title="Discarded Ingredients"
                      value={topList.length}
                      description="Distinct food items affected"
                      iconName="Layers"
                      isNeutral={true}
                    />
                  </div>

                  {/* Grid: Reason Breakdown & Safe Units */}
                  <div className={styles.analyticsGrid2}>
                    {/* Reasons Breakdown */}
                    <div className={styles.analyticsCard}>
                      <h3 className={styles.cardTitle}>Discards by Root Cause</h3>
                      <p className={styles.cardSubtitle}>
                        Avoidable waste categorization to identify kitchen habits
                      </p>

                      {reasonsList.length > 0 ? (
                        <div className={styles.reasonsList}>
                          {reasonsList.map((stat) => {
                            const total = totalIncidents || 1;
                            const pct = Math.round((stat.count / total) * 100);
                            return (
                              <div key={stat.reason} className={styles.reasonProgressItem}>
                                <div className={styles.reasonHeaderRow}>
                                  <span className={styles.reasonName}>
                                    {String(stat.reason).replace(/_/g, ' ')}
                                  </span>
                                  <span className={styles.reasonStats}>
                                    {stat.count} incident(s) ({pct}%)
                                    {stat.estimatedCost > 0 && ` • ₹${Number(stat.estimatedCost).toFixed(2)}`}
                                  </span>
                                </div>
                                <div className={styles.progressBarBg}>
                                  <div
                                    className={styles.progressBarFill}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className={styles.noDataBox}>No discard incidents recorded in this window.</div>
                      )}
                    </div>

                    {/* Safe Unit Aggregation */}
                    <div className={styles.analyticsCard}>
                      <h3 className={styles.cardTitle}>Total Quantity Discarded (Safe Units)</h3>
                      <p className={styles.cardSubtitle}>
                        Aggregated strictly by compatible measurement units without cross-mixing
                      </p>

                      {Object.keys(unitsMap).length > 0 ? (
                        <div className={styles.unitsGrid}>
                          {Object.entries(unitsMap).map(([unitKey, qty]) => (
                            <div key={unitKey} className={styles.unitChipCard}>
                              <span className={styles.unitValue}>
                                {typeof qty === 'number' ? qty.toFixed(2) : qty}
                              </span>
                              <span className={styles.unitLabel}>{unitKey}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={styles.noDataBox}>No quantities discarded in this window.</div>
                      )}

                      {/* Financial Insight */}
                      <div className={styles.financialInsightBox}>
                        <Info size={15} />
                        <span>
                          {totalEstimatedCost > 0
                            ? `A potential ₹${Number(totalEstimatedCost).toFixed(2)} could be saved monthly by cooking with recipes that utilize near-expiry items first.`
                            : 'No financial loss recorded. Keep tracking waste diligently to spot trends.'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Top 5 Wasted Ingredients */}
                  <div className={styles.analyticsCard}>
                    <h3 className={styles.cardTitle}>Top Discarded Ingredients</h3>
                    <p className={styles.cardSubtitle}>
                      Food items with the highest frequency and cost impact
                    </p>

                    {topList.length > 0 ? (
                      <div className={styles.topTableWrapper}>
                        <table className={styles.table}>
                          <thead>
                            <tr>
                              <th>Rank</th>
                              <th>Ingredient Name</th>
                              <th>Discarded Quantity</th>
                              <th>Financial Loss</th>
                              <th>Primary Reason</th>
                            </tr>
                          </thead>
                          <tbody>
                            {topList.map((item, idx) => (
                              <tr key={idx}>
                                <td>
                                  <span className={styles.rankBadge}>#{idx + 1}</span>
                                </td>
                                <td>
                                  <strong>{item.name || item.ingredientName}</strong>
                                </td>
                                <td>
                                  {item.quantity} {item.unit}
                                </td>
                                <td>
                                  <span className={styles.lossText}>
                                    ₹{(item.estimatedCost || item.estimatedTotalCost || 0).toFixed(2)}
                                  </span>
                                </td>
                                <td>
                                  <span className={styles.reasonBadgeSmall}>
                                    {String(item.primaryReason || item.reason || 'EXPIRED').replace(/_/g, ' ')}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className={styles.noDataBox}>No top wasted ingredients recorded.</div>
                    )}
                  </div>
                </div>
              );
            })()
          ) : null}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: Waste Log & Audit Ledger */}
      {/* ============================================================ */}
      {activeTab === 'log' && (
        <div className={styles.tabContent}>
          <div className={styles.filterBar}>
            <div className={styles.searchWrapper}>
              <Search size={15} className={styles.searchIcon} />
              <input
                type="text"
                value={recordsSearch}
                onChange={(e) => setRecordsSearch(e.target.value)}
                placeholder="Search waste records by item name or notes..."
                className={styles.searchInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="reason-filter" className={styles.filterLabel}>
                Reason:
              </label>
              <select
                id="reason-filter"
                value={recordsReasonFilter}
                onChange={(e) => setRecordsReasonFilter(e.target.value)}
                className={styles.selectInput}
              >
                <option value="ALL">All Reasons</option>
                <option value="EXPIRED">Expired</option>
                <option value="SPOILED">Spoiled / Mold</option>
                <option value="EXCESS_PREPARED">Excess Prepared</option>
                <option value="OVER_PURCHASED">Over-Purchased</option>
                <option value="COOKING_MISTAKE">Cooking Mistake</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {recordsLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner} />
              <p>Loading waste log & audit trail...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className={styles.emptyContainer}>
              <Trash2 size={36} className={styles.emptyIcon} />
              <h3>No waste records found</h3>
              <p>Your kitchen log is clean! Any recorded food discards will appear here.</p>
              <button
                type="button"
                onClick={() => setIsRecordModalOpen(true)}
                className="btn btn-primary"
              >
                <Trash2 size={15} />
                <span>Record Waste</span>
              </button>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date Discarded</th>
                    <th>Ingredient / Dish</th>
                    <th>Category</th>
                    <th>Quantity</th>
                    <th>Root Cause</th>
                    <th>Financial Loss</th>
                    <th>Audit Status</th>
                    <th className={styles.actionsCol}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((rec) => (
                    <tr
                      key={rec.id}
                      className={rec.isReversed ? styles.rowReversed : ''}
                    >
                      <td>
                        <span className={styles.dateCol}>
                          {new Date(rec.wastedAt || rec.discardedAt || rec.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className={styles.nameCell}>
                        <strong className={styles.recordName}>{rec.ingredientName}</strong>
                        {rec.notes && <span className={styles.notesText}>"{rec.notes}"</span>}
                        {rec.isReversed && rec.reversalReason && (
                          <span className={styles.reversalReasonText}>
                            Reversed: {rec.reversalReason}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={styles.categoryBadge}>{rec.category}</span>
                      </td>
                      <td>
                        <strong>{rec.quantityWasted}</strong> {rec.unit}
                      </td>
                      <td>
                        <span className={styles.reasonBadgeSmall}>
                          {String(rec.reason || 'OTHER').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <span className={styles.lossText}>
                          {rec.estimatedTotalCost != null
                            ? `₹${Number(rec.estimatedTotalCost).toFixed(2)}`
                            : 'N/A'}
                        </span>
                      </td>
                      <td>
                        {rec.isReversed ? (
                          <span className={styles.statusBadgeReversed}>
                            <RotateCcw size={11} />
                            <span>Reversed</span>
                          </span>
                        ) : (
                          <span className={styles.statusBadgeActive}>
                            <CheckCircle2 size={11} />
                            <span>Logged</span>
                          </span>
                        )}
                      </td>
                      <td className={styles.actionsCol}>
                        {!rec.isReversed ? (
                          <button
                            type="button"
                            onClick={() => {
                              setRecordToReverse(rec);
                              setIsCorrectionModalOpen(true);
                            }}
                            className={styles.reverseBtn}
                            title="Reverse or correct this entry"
                          >
                            <RotateCcw size={13} />
                            <span>Reverse</span>
                          </button>
                        ) : (
                          <span className={styles.reversedLabel}>Preserved</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: Near-Expiry Recipe Rescuer */}
      {/* ============================================================ */}
      {activeTab === 'recipes' && (
        <div className={styles.tabContent}>
          <div className={styles.rescuerBanner}>
            <div className={styles.rescuerIcon}>
              <ChefHat size={24} />
            </div>
            <div>
              <h3 className={styles.rescuerTitle}>
                Rescue Near-Expiry Produce with Targeted Recipes
              </h3>
              <p className={styles.rescuerSubtitle}>
                These curated recipes prioritize ingredients in your kitchen expiring within the next 3 to 7 days, excluding already expired stock.
              </p>
            </div>
          </div>

          {recipesLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner} />
              <p>Scanning recipes matching your near-expiry ingredients...</p>
            </div>
          ) : recipeSuggestions.length === 0 ? (
            <div className={styles.emptyContainer}>
              <CheckCircle2 size={36} className={styles.emptyIcon} />
              <h3>No ingredients require emergency rescue!</h3>
              <p>
                Your kitchen inventory has no near-expiry produce expiring in the next 7 days.
              </p>
              <Link to="/recipes" className="btn btn-secondary">
                <Utensils size={15} />
                <span>Browse All Recipes</span>
              </Link>
            </div>
          ) : (
            <div className={styles.recipeGrid}>
              {recipeSuggestions.map((item) => (
                <div key={item.recipe.id} className={styles.rescueCard}>
                  <div className={styles.rescueCardHeader}>
                    <div className={styles.rescueBadge}>
                      <Flame size={12} />
                      <span>Rescues {item.matchedExpiringIngredients?.length || 1} Item(s)</span>
                    </div>
                    <span className={styles.recipeCategory}>
                      {item.recipe.category}
                    </span>
                  </div>

                  <h4 className={styles.rescueRecipeTitle}>{item.recipe.title}</h4>
                  <p className={styles.rescueRecipeDesc}>
                    {item.recipe.description || 'Delicious home-cooked recipe.'}
                  </p>

                  {/* Rescued items chips */}
                  <div className={styles.rescuedItemsRow}>
                    <span className={styles.rescuedLabel}>Expiring ingredients used:</span>
                    <div className={styles.rescuedChips}>
                      {item.matchedExpiringIngredients?.map((ing, i) => (
                        <span key={i} className={styles.rescuedChip}>
                          {ing.name} ({ing.daysRemaining != null ? `${ing.daysRemaining}d left` : 'expiring'})
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className={styles.rescueCardFooter}>
                    <div className={styles.recipeMeta}>
                      <Clock size={13} />
                      <span>{item.recipe.cookingTime || 30} mins</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedRecipe(item.recipe)}
                      className="btn btn-secondary"
                    >
                      <Utensils size={14} />
                      <span>Cook This</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {isRecordModalOpen && (
        <RecordWasteModal
          isOpen={isRecordModalOpen}
          onClose={() => {
            setIsRecordModalOpen(false);
            setPreselectedInventoryItem(null);
          }}
          onSuccess={handleRecordWasteSuccess}
          preselectedItem={preselectedInventoryItem}
        />
      )}

      {isCorrectionModalOpen && recordToReverse && (
        <WasteCorrectionModal
          isOpen={isCorrectionModalOpen}
          onClose={() => {
            setIsCorrectionModalOpen(false);
            setRecordToReverse(null);
          }}
          onSuccess={handleReverseSuccess}
          record={recordToReverse}
        />
      )}

      {isAiModalOpen && (
        <AiWasteAdvisorModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          atRiskIngredients={atRiskData?.items || atRiskData?.atRiskItems || []}
        />
      )}

      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onToggleFavourite={() => {}}
          onEdit={() => {}}
          onDelete={() => {}}
        />
      )}
    </div>
  );
}
