import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  PieChart,
  DollarSign,
  Send,
  HelpCircle,
  Package
} from 'lucide-react';
import { fetchShoppingListOptimisation, fetchAiShoppingAdvice } from '../../services/api.js';
import { formatCurrency } from '../../utils/formatters.js';
import styles from './CostOptimisationModal.module.css';

export default function CostOptimisationModal({
  isOpen,
  onClose,
  listId,
  listName
}) {
  const [activeTab, setActiveTab] = useState('insights'); // 'insights' or 'ai'
  const [loading, setLoading] = useState(true);
  const [optimisationData, setOptimisationData] = useState(null);
  const [error, setError] = useState('');

  // AI Advice state
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    if (!isOpen || !listId) return;

    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetchShoppingListOptimisation(listId);
        if (isMounted) {
          if (res.success && res.data) {
            setOptimisationData(res.data);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.response?.data?.message || 'Failed to load cost optimisation analysis.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [isOpen, listId]);

  if (!isOpen) return null;

  const handleAskAi = async (customPrompt = null) => {
    const q = customPrompt || aiQuery;
    if (!q.trim() || aiLoading) return;

    setAiLoading(true);
    setAiError('');
    try {
      const res = await fetchAiShoppingAdvice(listId, { query: q.trim() });
      if (res.success && res.advice) {
        setAiResult(res);
      } else {
        throw new Error(res.message || 'No AI advice returned.');
      }
    } catch (err) {
      setAiError(err?.response?.data?.message || err.message || 'AI service unavailable. Please check your internet connection.');
    } finally {
      setAiLoading(false);
    }
  };

  const costDrivers = optimisationData?.costDrivers || [];
  const missingPrices = optimisationData?.missingPrices || [];
  const tips = optimisationData?.optimisationTips || [];
  const summary = optimisationData?.summary || {};

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <div className={styles.headerIcon}>
              <TrendingUp size={20} />
            </div>
            <div>
              <h3>Cost Optimisation & Smart Advice</h3>
              <span className={styles.subtitle}>{listName || 'Active Shopping List'}</span>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Tab switch */}
        <div className={styles.tabsBar}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'insights' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('insights')}
          >
            <PieChart size={15} />
            <span>Deterministic Insights</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'ai' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            <Sparkles size={15} />
            <span>Chef Gemini AI Advice</span>
          </button>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        <div className={styles.body}>
          {activeTab === 'insights' ? (
            loading ? (
              <div className={styles.loadingBox}>
                <div className={styles.spinner} />
                <span>Analysing budget, cost drivers, and pantry savings...</span>
              </div>
            ) : (
              <div className={styles.insightsContent}>
                {/* Summary stat cards */}
                <div className={styles.summaryGrid}>
                  <div className={styles.summaryCard}>
                    <span className={styles.cardLabel}>Allocated Budget</span>
                    <strong className={styles.cardValue}>{formatCurrency(summary.budget, 'Not set')}</strong>
                  </div>
                  <div className={styles.summaryCard}>
                    <span className={styles.cardLabel}>Estimated Total</span>
                    <strong className={styles.cardValue}>
                      {formatCurrency(summary.estimatedTotal, '₹0')}
                      {summary.hasMissingPrices && <span className={styles.incompleteFlag}> (Partial)</span>}
                    </strong>
                  </div>
                  <div className={styles.summaryCard}>
                    <span className={styles.cardLabel}>Actual Spent</span>
                    <strong className={styles.cardValue}>{formatCurrency(summary.actualSpent, '₹0')}</strong>
                  </div>
                  <div className={styles.summaryCard}>
                    <span className={styles.cardLabel}>Remaining Budget</span>
                    <strong
                      className={styles.cardValue}
                      style={{ color: summary.isOverBudget ? '#dc2626' : '#059669' }}
                    >
                      {formatCurrency(summary.remainingBudget, 'N/A')}
                    </strong>
                  </div>
                </div>

                {/* Over-budget alert */}
                {summary.isOverBudget && (
                  <div className={styles.alertBanner}>
                    <AlertTriangle size={18} />
                    <div>
                      <strong>Budget Ceiling Exceeded!</strong>
                      <p>
                        Estimated shopping cost exceeds your allocated budget by{' '}
                        {formatCurrency(summary.overBudgetAmount)}. Review the cost drivers below for adjustments.
                      </p>
                    </div>
                  </div>
                )}

                {/* Top Cost Drivers */}
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <h4>Top Cost Drivers</h4>
                    <span className={styles.sectionSub}>Highest contributing ingredients to estimated grocery bill</span>
                  </div>

                  {costDrivers.length === 0 ? (
                    <div className={styles.emptyNotice}>
                      No price data recorded yet to compute cost drivers. Enter estimated or actual prices to see breakdown.
                    </div>
                  ) : (
                    <div className={styles.driversList}>
                      {costDrivers.map((item, idx) => (
                        <div key={idx} className={styles.driverRow}>
                          <div className={styles.driverInfo}>
                            <span className={styles.driverName}>{item.name}</span>
                            <span className={styles.driverQty}>
                              {item.quantity} {item.unit} @ ₹{item.unitPrice}/{item.unit}
                            </span>
                          </div>
                          <div className={styles.driverCostCol}>
                            <strong className={styles.driverCost}>{formatCurrency(item.totalCost)}</strong>
                            <div className={styles.driverBarWrapper}>
                              <div
                                className={styles.driverBar}
                                style={{ width: `${Math.min(item.percentageOfTotal || 10, 100)}%` }}
                              />
                            </div>
                            <span className={styles.driverPct}>{item.percentageOfTotal || 0}% of total</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Missing Price Indicators */}
                {missingPrices.length > 0 && (
                  <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                      <h4>Missing Prices ({missingPrices.length})</h4>
                      <span className={styles.sectionSub}>Items lacking estimated unit price data</span>
                    </div>
                    <div className={styles.missingChipsList}>
                      {missingPrices.map((m, idx) => (
                        <span key={idx} className={styles.missingChip}>
                          <HelpCircle size={12} />
                          {m.name} ({m.quantity} {m.unit})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actionable Tips */}
                {tips.length > 0 && (
                  <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                      <h4>Budget & Pantry Recommendations</h4>
                    </div>
                    <div className={styles.tipsList}>
                      {tips.map((t, idx) => (
                        <div key={idx} className={styles.tipCard}>
                          <Lightbulb size={16} className={styles.tipIcon} />
                          <div className={styles.tipBody}>
                            <strong>{t.title}</strong>
                            <p>{t.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
            /* AI Advice Tab */
            <div className={styles.aiContent}>
              <div className={styles.aiPromptSection}>
                <p className={styles.aiNotice}>
                  Ask Chef Gemini for culinary budget guidance based on your verified shopping list and pantry inventory.
                </p>

                <div className={styles.quickPromptChips}>
                  {[
                    'How can I reduce my grocery cost using my current pantry?',
                    'Suggest affordable substitutes for high-cost ingredients',
                    'How to prepare this week’s meals under a tighter budget?'
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={styles.quickChip}
                      onClick={() => {
                        setAiQuery(p);
                        handleAskAi(p);
                      }}
                      disabled={aiLoading}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <div className={styles.aiInputRow}>
                  <input
                    type="text"
                    className={styles.aiInput}
                    placeholder="Ask Gemini for smart shopping advice..."
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAskAi();
                    }}
                    disabled={aiLoading}
                  />
                  <button
                    type="button"
                    className={styles.aiSendBtn}
                    onClick={() => handleAskAi()}
                    disabled={!aiQuery.trim() || aiLoading}
                  >
                    <Send size={15} />
                    <span>{aiLoading ? 'Thinking...' : 'Ask AI'}</span>
                  </button>
                </div>
              </div>

              {aiError && <div className={styles.errorBox}>{aiError}</div>}

              {aiLoading ? (
                <div className={styles.loadingBox}>
                  <div className={styles.spinner} />
                  <span>Chef Gemini is analysing your ingredients and budget opportunities...</span>
                </div>
              ) : aiResult ? (
                <div className={styles.aiResponseCard}>
                  <div className={styles.aiResponseHeader}>
                    <Sparkles size={16} />
                    <span>Chef Gemini Recommendations</span>
                  </div>
                  <div className={styles.aiAdviceText}>{aiResult.advice}</div>

                  {aiResult.meta && (
                    <div className={styles.aiMetaFooter}>
                      <span>Powered by {aiResult.meta.model || 'Gemini'}</span>
                      <span>List: {aiResult.meta.listName}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.aiEmptyState}>
                  <Sparkles size={32} style={{ color: '#059669', opacity: 0.6 }} />
                  <p>Select a question above or type your question to receive personalized grocery advice.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.closeFooterBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
