import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Send,
  Bot,
  User,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  RotateCcw
} from 'lucide-react';
import { askNutritionAssistant } from '../../services/api.js';
import styles from './AiNutritionModal.module.css';

const SUGGESTED_QUESTIONS = [
  'Analyze my macro distribution today and suggest improvements',
  'Suggest high-protein Indian snacks to help me hit my daily goal',
  'How can I increase dietary fiber with my current pantry items?',
  'What are some healthy, low-sodium dinner options from my recipes?'
];

export default function AiNutritionModal({
  isOpen,
  onClose,
  todayStats,
  profile
}) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Namaste! I am your Smart Rasoi Culinary & Nutrition Assistant. I can analyze your daily meals, evaluate macro balance, suggest nutritious Indian ingredient swaps, and help you reach your dietary goals. What would you like guidance on today?'
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
      const res = await askNutritionAssistant({
        prompt: question,
        mode: 'ASSISTANT',
        conversationHistory: newMessages.slice(-6)
      });

      const reply = res.data?.advice || res.advice || 'I analyzed your nutritional data and recommend keeping a balanced ratio of legumes, vegetables, and whole grains.';
      const tips = res.data?.quickTips || [];

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: reply,
          quickTips: tips,
          source: res.data?.source || 'AI Assistant'
        }
      ]);
    } catch (err) {
      console.error('AI nutrition advisor error:', err);
      setError('Unable to reach AI Nutritionist at the moment. Please try again.');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'I experienced a connection issue, but here is a rule-of-thumb recommendation: prioritize whole pulses (dal, chana, rajma), seasonal vegetables, and moderate healthy fats (ghee/mustard oil) to sustain balanced energy.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        role: 'assistant',
        content:
          'Namaste! I am your Smart Rasoi Culinary & Nutrition Assistant. I can analyze your daily meals, evaluate macro balance, suggest nutritious Indian ingredient swaps, and help you reach your dietary goals. What would you like guidance on today?'
      }
    ]);
    setInput('');
    setError('');
  };

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitleArea}>
            <div className={styles.iconCircle}>
              <Sparkles size={22} className={styles.titleIcon} />
            </div>
            <div>
              <h2 className={styles.title}>AI Nutrition & Dietary Coach</h2>
              <p className={styles.subtitle}>
                Powered by Smart AI • Contextual to your meals, recipes & dietary goals
              </p>
            </div>
          </div>
          <div className={styles.headerRightActions}>
            <button
              type="button"
              className={styles.resetBtn}
              onClick={handleReset}
              title="Reset conversation"
            >
              <RotateCcw size={16} />
            </button>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Disclaimer Bar */}
        <div className={styles.disclaimerBar}>
          <ShieldCheck size={15} className={styles.shieldIcon} />
          <span>
            <strong>Culinary & Dietary Guidance:</strong> Nutritional insights are estimated for meal planning. Always consult a healthcare specialist or clinical dietitian for medical diets.
          </span>
        </div>

        {/* Chat message stream */}
        <div className={styles.chatArea}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`${styles.messageRow} ${
                m.role === 'user' ? styles.userRow : styles.assistantRow
              }`}
            >
              <div className={styles.avatar}>
                {m.role === 'user' ? (
                  <User size={16} />
                ) : (
                  <Bot size={16} className={styles.botIcon} />
                )}
              </div>
              <div className={styles.bubble}>
                <div className={styles.messageContent}>
                  {m.content.split('\n').map((paragraph, pIdx) => {
                    if (!paragraph.trim()) return null;
                    // Format bullet lines nicely
                    if (paragraph.trim().startsWith('*') || paragraph.trim().startsWith('-')) {
                      return (
                        <div key={pIdx} className={styles.bulletPoint}>
                          <span className={styles.bulletDot}>•</span>
                          <span>{paragraph.replace(/^[\*\-]\s*/, '')}</span>
                        </div>
                      );
                    }
                    return <p key={pIdx} className={styles.paragraph}>{paragraph}</p>;
                  })}
                </div>

                {m.quickTips && m.quickTips.length > 0 && (
                  <div className={styles.quickTipsBox}>
                    <div className={styles.tipsTitle}>
                      <Lightbulb size={13} />
                      <span>Key Nutritional Takeaways:</span>
                    </div>
                    <ul className={styles.tipsList}>
                      {m.quickTips.map((tip, tIdx) => (
                        <li key={tIdx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {m.source && (
                  <div className={styles.sourceTag}>Model: {m.source}</div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className={`${styles.messageRow} ${styles.assistantRow}`}>
              <div className={styles.avatar}>
                <Bot size={16} className={styles.botIcon} />
              </div>
              <div className={styles.loadingBubble}>
                <div className={styles.dotFlashing}></div>
                <span>Analyzing your meals and guidelines...</span>
              </div>
            </div>
          )}
        </div>

        {/* Suggestions chips */}
        {messages.length <= 2 && (
          <div className={styles.suggestionsContainer}>
            <span className={styles.suggestionsLabel}>Suggested Queries:</span>
            <div className={styles.chipsWrap}>
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(q)}
                  className={styles.suggestionChip}
                  disabled={loading}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className={styles.inputBar}>
          <input
            type="text"
            placeholder="Ask anything about your calories, protein, or diet..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
              }
            }}
            className={styles.input}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className={styles.sendBtn}
            title="Send query"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
