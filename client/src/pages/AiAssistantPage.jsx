import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Send,
  RotateCcw,
  RefreshCw,
  UtensilsCrossed,
  Clock,
  Flame,
  HelpCircle,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  User,
  Bot,
  Package,
  BookOpen
} from 'lucide-react';
import { sendAiChatMessage, fetchAiContext } from '../services/api.js';
import styles from './AiAssistantPage.module.css';

const SUGGESTED_PROMPTS = [
  { text: 'What can I cook with my ingredients?', icon: UtensilsCrossed },
  { text: 'Which ingredients should I use before they expire?', icon: Clock },
  { text: 'Suggest a quick vegetarian dinner.', icon: Flame },
  { text: 'What can I substitute for an ingredient?', icon: HelpCircle },
  { text: 'Help me cook a simple meal.', icon: Sparkles }
];

/**
 * Parses bold text and inline code without dangerous innerHTML
 */
function parseInlineMarkdown(text) {
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={`b-${match.index}`} className={styles.boldText}>
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={`c-${match.index}`} className={styles.codeText}>
          {token.slice(1, -1)}
        </code>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

/**
 * Lightweight safe markdown renderer for assistant responses
 */
function FormattedMessage({ text }) {
  if (!text) return null;

  const lines = text.split('\n');
  const blocks = [];
  let currentList = null;

  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();

    // Empty line separates blocks
    if (!trimmed) {
      if (currentList) {
        blocks.push(currentList);
        currentList = null;
      }
      return;
    }

    // Heading (e.g. ### Recipe Title or ## Section)
    if (trimmed.startsWith('#')) {
      if (currentList) {
        blocks.push(currentList);
        currentList = null;
      }
      const headingText = trimmed.replace(/^#+\s*/, '');
      blocks.push(
        <div key={`h-${lineIndex}`} className={styles.formattedHeading}>
          {parseInlineMarkdown(headingText)}
        </div>
      );
      return;
    }

    // Bullet list item (- or *)
    if (/^[-*]\s+/.test(trimmed)) {
      const itemText = trimmed.replace(/^[-*]\s+/, '');
      const itemElement = (
        <li key={`li-${lineIndex}`} className={styles.formattedListItem}>
          {parseInlineMarkdown(itemText)}
        </li>
      );

      if (!currentList || currentList.type !== 'ul') {
        if (currentList) blocks.push(currentList);
        currentList = {
          type: 'ul',
          items: [itemElement]
        };
      } else {
        currentList.items.push(itemElement);
      }
      return;
    }

    // Numbered list item (e.g. 1. Step)
    if (/^\d+\.\s+/.test(trimmed)) {
      const itemText = trimmed.replace(/^\d+\.\s+/, '');
      const itemElement = (
        <li key={`nli-${lineIndex}`} className={styles.formattedListItem}>
          {parseInlineMarkdown(itemText)}
        </li>
      );

      if (!currentList || currentList.type !== 'ol') {
        if (currentList) blocks.push(currentList);
        currentList = {
          type: 'ol',
          items: [itemElement]
        };
      } else {
        currentList.items.push(itemElement);
      }
      return;
    }

    // Standard paragraph line
    if (currentList) {
      blocks.push(currentList);
      currentList = null;
    }

    blocks.push(
      <p key={`p-${lineIndex}`} className={styles.formattedParagraph}>
        {parseInlineMarkdown(trimmed)}
      </p>
    );
  });

  if (currentList) {
    blocks.push(currentList);
  }

  return (
    <div className={styles.formattedContent}>
      {blocks.map((block, idx) => {
        if (block.type === 'ul') {
          return (
            <ul key={`ul-${idx}`} className={styles.formattedList}>
              {block.items}
            </ul>
          );
        }
        if (block.type === 'ol') {
          return (
            <ol key={`ol-${idx}`} className={styles.formattedList}>
              {block.items}
            </ol>
          );
        }
        return block;
      })}
    </div>
  );
}

export default function AiAssistantPage() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [lastFailedMessage, setLastFailedMessage] = useState(null);

  // Pantry context state
  const [kitchenContext, setKitchenContext] = useState(null);
  const [loadingContext, setLoadingContext] = useState(true);
  const [showPantryDrawer, setShowPantryDrawer] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Fetch verified kitchen context
  const loadKitchenContext = useCallback(async () => {
    try {
      setLoadingContext(true);
      const res = await fetchAiContext();
      if (res.success && res.context) {
        setKitchenContext(res.context);
      }
    } catch (err) {
      console.warn('Failed to load kitchen context for AI assistant:', err);
    } finally {
      setLoadingContext(false);
    }
  }, []);

  useEffect(() => {
    loadKitchenContext();
  }, [loadKitchenContext]);

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSubmitting]);

  // Auto-resize textarea
  const handleTextareaChange = (e) => {
    setInputMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  // Dispatch message to backend
  const handleSendMessage = async (textToSend) => {
    const trimmed = (textToSend || inputMessage).trim();
    if (!trimmed || isSubmitting) return;

    setError(null);
    setLastFailedMessage(null);

    const userMessageItem = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Keep conversation history bounded to last 8 turns (16 messages) for backend
    const currentHistory = messages.map((m) => ({
      role: m.role,
      content: m.content
    })).slice(-8);

    // Optimistically update conversation
    setMessages((prev) => [...prev, userMessageItem]);
    setInputMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setIsSubmitting(true);

    try {
      const res = await sendAiChatMessage({
        message: trimmed,
        conversationHistory: currentHistory
      });

      if (res.success && res.reply) {
        const assistantMessageItem = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          role: 'assistant',
          content: res.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          meta: res.meta
        };
        setMessages((prev) => [...prev, assistantMessageItem]);
      } else {
        throw new Error(res.message || 'No response returned from AI Assistant.');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to communicate with AI Assistant.';
      setError(errMsg);
      setLastFailedMessage(trimmed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
    setLastFailedMessage(null);
  };

  const handleRetry = () => {
    if (lastFailedMessage) {
      // Remove the last user message from state so it isn't duplicated
      setMessages((prev) => prev.slice(0, -1));
      handleSendMessage(lastFailedMessage);
    }
  };

  const availableCount = kitchenContext?.summary?.availableItemsCount ?? 0;
  const expiringCount = kitchenContext?.summary?.expiringSoonItemsCount ?? 0;
  const cookableCount = kitchenContext?.summary?.readyToCookRecipesCount ?? 0;

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <Sparkles size={24} />
          </div>
          <div>
            <h1 className={styles.title}>AI Kitchen Assistant</h1>
            <p className={styles.subtitle}>
              Culinary copilot powered by Google Gemini, tailored to your live pantry inventory and recipe catalog.
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.actionButton}
            onClick={loadKitchenContext}
            disabled={loadingContext}
            title="Refresh pantry status from database"
          >
            <RefreshCw size={14} className={loadingContext ? 'animate-spin' : ''} />
            <span>Sync Pantry</span>
          </button>
          <button
            type="button"
            className={styles.actionButton}
            onClick={handleClearChat}
            disabled={messages.length === 0}
            title="Clear active conversation"
          >
            <RotateCcw size={14} />
            <span>Clear Chat</span>
          </button>
        </div>
      </header>

      {/* Live Pantry Context Indicator */}
      <section className={styles.contextBar} aria-label="Live Pantry Context">
        <div className={styles.contextStatus}>
          <span className={styles.liveDot} />
          <span>Live Pantry Connected</span>
        </div>

        <div className={styles.contextStats}>
          <span className={styles.contextBadge}>
            <Package size={13} />
            {availableCount} Available Items
          </span>

          {expiringCount > 0 && (
            <span className={`${styles.contextBadge} ${styles.expiringBadge}`}>
              <AlertTriangle size={13} />
              {expiringCount} Expiring Soon
            </span>
          )}

          {cookableCount > 0 && (
            <span className={styles.contextBadge}>
              <BookOpen size={13} />
              {cookableCount} Ready to Cook
            </span>
          )}

          <button
            type="button"
            className={styles.contextToggleBtn}
            onClick={() => setShowPantryDrawer(!showPantryDrawer)}
          >
            {showPantryDrawer ? (
              <>
                <span>Hide Pantry Peek</span>
                <ChevronUp size={14} />
              </>
            ) : (
              <>
                <span>Pantry Peek</span>
                <ChevronDown size={14} />
              </>
            )}
          </button>
        </div>
      </section>

      {/* Collapsible Pantry Drawer */}
      {showPantryDrawer && kitchenContext && (
        <div className={styles.contextDrawer}>
          {kitchenContext.expiringSoon?.length > 0 && (
            <div>
              <div className={styles.drawerTitle}>Ingredients Nearing Expiry (Priority):</div>
              <div className={styles.drawerChips}>
                {kitchenContext.expiringSoon.map((item) => (
                  <span key={item.id} className={`${styles.drawerChip} ${styles.drawerChipExpiring}`}>
                    <Clock size={11} />
                    {item.name} ({item.quantity} {item.unit} · {item.expiryDate || 'Soon'})
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className={styles.drawerTitle}>Current Kitchen Ingredients:</div>
            <div className={styles.drawerChips}>
              {kitchenContext.inventory?.length > 0 ? (
                kitchenContext.inventory.map((item) => (
                  <span key={item.id} className={styles.drawerChip}>
                    {item.name} ({item.quantity} {item.unit})
                  </span>
                ))
              ) : (
                <span className={styles.drawerChip}>No inventory recorded yet</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chat Area Card */}
      <main className={styles.chatCard}>
        <div className={styles.messageStream}>
          {/* Welcome Screen when conversation is empty */}
          {messages.length === 0 ? (
            <div className={styles.welcomeCard}>
              <div className={styles.welcomeIconWrapper}>
                <Sparkles size={32} />
              </div>
              <h2 className={styles.welcomeTitle}>Welcome to Chef Gemini</h2>
              <p className={styles.welcomeText}>
                I'm your Smart Rasoi kitchen assistant. I have real-time visibility into your pantry to help you cook
                creative meals, minimize food waste, and suggest smart ingredient substitutions.
              </p>

              <div className={styles.suggestionsSection}>
                <div className={styles.suggestionsLabel}>Suggested Questions</div>
                <div className={styles.suggestionsGrid}>
                  {SUGGESTED_PROMPTS.map((prompt, idx) => {
                    const Icon = prompt.icon;
                    return (
                      <button
                        key={idx}
                        type="button"
                        className={styles.suggestionButton}
                        onClick={() => handleSendMessage(prompt.text)}
                        disabled={isSubmitting}
                      >
                        <Icon size={14} />
                        <span>{prompt.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            // Message List
            messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`${styles.messageRow} ${isUser ? styles.messageRowUser : styles.messageRowAssistant}`}
                >
                  <div className={`${styles.avatar} ${isUser ? styles.avatarUser : styles.avatarAssistant}`}>
                    {isUser ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleAssistant}`}>
                    {isUser ? (
                      <div>{msg.content}</div>
                    ) : (
                      <FormattedMessage text={msg.content} />
                    )}
                    <div className={styles.timestamp}>{msg.timestamp}</div>
                  </div>
                </div>
              );
            })
          )}

          {/* Typing indicator */}
          {isSubmitting && (
            <div className={`${styles.messageRow} ${styles.messageRowAssistant}`}>
              <div className={`${styles.avatar} ${styles.avatarAssistant}`}>
                <Bot size={16} />
              </div>
              <div className={`${styles.bubble} ${styles.bubbleAssistant}`}>
                <div className={styles.typingIndicator} aria-label="Chef Gemini is typing">
                  <div className={styles.typingDot} />
                  <div className={styles.typingDot} />
                  <div className={styles.typingDot} />
                </div>
              </div>
            </div>
          )}

          {/* Error Banner with Retry */}
          {error && (
            <div className={styles.errorCard} role="alert">
              <div className={styles.errorContent}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
              {lastFailedMessage && (
                <button
                  type="button"
                  className={styles.retryButton}
                  onClick={handleRetry}
                  disabled={isSubmitting}
                >
                  <RotateCcw size={12} />
                  <span>Retry</span>
                </button>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Inline Suggestion Chips when conversation is active */}
        {messages.length > 0 && (
          <div className={styles.inlineSuggestions}>
            {SUGGESTED_PROMPTS.slice(0, 3).map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                className={styles.inlineChip}
                onClick={() => handleSendMessage(prompt.text)}
                disabled={isSubmitting}
              >
                {prompt.text}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className={styles.inputContainer}>
          <form
            className={styles.inputForm}
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputMessage}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask Chef Gemini... (e.g. 'What can I cook with my paneer?', 'Substitute for buttermilk')"
              className={styles.textarea}
              disabled={isSubmitting}
              aria-label="Message to AI Kitchen Assistant"
            />
            <button
              type="submit"
              className={styles.sendButton}
              disabled={!inputMessage.trim() || isSubmitting}
              title="Send message (Enter)"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>

          <div className={styles.inputFooter}>
            <span>Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for a new line.</span>
            <span>Gemini uses your verified pantry data.</span>
          </div>
        </div>
      </main>
    </div>
  );
}
