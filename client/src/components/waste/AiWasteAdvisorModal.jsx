import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Send,
  Bot,
  User,
  ShieldAlert,
  Lightbulb,
  RotateCcw,
  AlertTriangle,
  Leaf,
  CheckCircle2
} from 'lucide-react';
import { fetchAiWasteAdvice } from '../../services/api.js';
import styles from './AiWasteAdvisorModal.module.css';

const QUICK_PROMPTS = [
  'How can I safely rescue and preserve near-expiry tomatoes?',
  'Creative ways to repurpose stale bread or leftover rotis',
  'Best storage hacks to stop coriander, mint, and spinach from wilting',
  'How to make zero-waste aromatic vegetable stock from kitchen scraps'
];

export default function AiWasteAdvisorModal({
  isOpen,
  onClose,
  atRiskIngredients = []
}) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Namaste! I am your Smart Rasoi Waste Reduction & Preservation Advisor. I can recommend safe preservation methods, low-waste Indian culinary repurposing techniques, and smart storage strategies to rescue your ingredients before they spoil. How can I assist your kitchen today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSend = async (textToSend) => {
    const question = (textToSend || input).trim();
    if (!question || loading) return;

    setError('');
    const newMessages = [...messages, { role: 'user', content: question }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const atRiskNames = atRiskIngredients.map((i) => i.name).filter(Boolean);
      const res = await fetchAiWasteAdvice({
        prompt: question,
        queryType: 'PRESERVATION',
        currentInventory: atRiskNames.length > 0 ? atRiskNames : undefined
      });

      const advice =
        res?.data?.advice ||
        res?.advice ||
        'Inspect ingredients for signs of spoilage. If wholesome, prioritize cooking into curries, pickles, or vegetable broth.';
      const actionItems = res?.data?.actionItems || res?.actionItems || [];
      const safetyNote = res?.data?.safetyNote || res?.safetyNote;

      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: advice,
          actionItems,
          safetyNote
        }
      ]);
    } catch (err) {
      console.error('Error fetching AI waste advice:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to get advice from AI Waste Advisor.';
      setError(msg);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content:
            'I encountered a temporary connection issue. For immediate kitchen preservation: freeze pureed ripe tomatoes, submerge herb stems in a glass of water, and ensure raw dairy is kept at ≤ 4°C.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetConversation = () => {
    setMessages([
      {
        role: 'assistant',
        content:
          'Conversation reset. Ask any question about preventing waste, preserving ingredients, or repurposing leftovers!'
      }
    ]);
    setError('');
  };

  return (
    <div
      className={styles.backdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-advisor-title"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerIconWrapper}>
              <Sparkles size={20} />
            </div>
            <div>
              <div className={styles.headerBadgeRow}>
                <h2 id="ai-advisor-title" className={styles.title}>
                  Smart AI Waste Advisor
                </h2>
                <span className={styles.aiBadge}>Zero-Waste AI</span>
              </div>
              <p className={styles.subtitle}>
                Culinary preservation techniques & safe surplus repurposing
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              onClick={handleResetConversation}
              className={styles.iconBtn}
              title="Reset conversation"
            >
              <RotateCcw size={16} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className={styles.closeBtn}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Food Safety Banner */}
        <div className={styles.safetyBanner}>
          <ShieldAlert size={16} className={styles.safetyIcon} />
          <span>
            <strong>Food Safety Principle:</strong> Reheating or cooking does <em>not</em> eliminate bacterial enterotoxins (e.g. <em>B. cereus</em> in day-old rice). If food shows mold, slime, or foul odors, always discard safely.
          </span>
        </div>

        {error && (
          <div className={styles.alertError}>
            <AlertTriangle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Chat / Content stream */}
        <div className={styles.messagesContainer}>
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`${styles.messageRow} ${
                msg.role === 'user' ? styles.userRow : styles.assistantRow
              }`}
            >
              <div className={styles.avatar}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={styles.bubble}>
                <div className={styles.bubbleContent}>{msg.content}</div>

                {msg.actionItems && msg.actionItems.length > 0 && (
                  <div className={styles.actionItemsBox}>
                    <div className={styles.actionItemsHeader}>
                      <Leaf size={14} />
                      <span>Recommended Steps</span>
                    </div>
                    <ul className={styles.actionList}>
                      {msg.actionItems.map((item, idx) => (
                        <li key={idx} className={styles.actionListItem}>
                          <CheckCircle2 size={13} className={styles.checkIcon} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {msg.safetyNote && (
                  <div className={styles.safetyNoteBox}>
                    <ShieldAlert size={13} />
                    <span>{msg.safetyNote}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className={`${styles.messageRow} ${styles.assistantRow}`}>
              <div className={styles.avatar}>
                <Bot size={16} />
              </div>
              <div className={`${styles.bubble} ${styles.loadingBubble}`}>
                <div className={styles.typingDots}>
                  <span />
                  <span />
                  <span />
                </div>
                <span className={styles.thinkingText}>AI Advisor is formulating preservation steps...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick prompt suggestions */}
        <div className={styles.quickPrompts}>
          <div className={styles.quickPromptsLabel}>
            <Lightbulb size={13} />
            <span>Quick Suggestions:</span>
          </div>
          <div className={styles.promptChips}>
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                className={styles.chip}
                onClick={() => handleSend(prompt)}
                disabled={loading}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className={styles.inputForm}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about preserving, freezing, or repurposing kitchen surplus..."
            className={styles.input}
            disabled={loading}
          />
          <button
            type="submit"
            className={`btn btn-primary ${styles.sendBtn}`}
            disabled={!input.trim() || loading}
            aria-label="Send query"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
