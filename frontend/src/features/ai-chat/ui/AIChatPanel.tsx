import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, X, Loader2, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { apiClient } from '../../../shared/api/client';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
}

interface AIChatPanelProps {
  materialIds: string[];
  materialTitles: string[];
  onClose?: () => void;
}

export function AIChatPanel({ materialIds, materialTitles, onClose }: AIChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!loading) inputRef.current?.focus();
  }, [loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await apiClient.askAssistant({
        query: text,
        document_ids: materialIds,
        history: history,
      });
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: `Ошибка: ${err.message || 'Не удалось получить ответ'}. Попробуйте ещё раз.`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-white/10 px-1 rounded text-accent-cyan text-xs">$1</code>')
      .replace(/^> (.+)$/gm, '<blockquote class="border-l-2 border-accent-green/50 pl-3 text-white/60 italic">$1</blockquote>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="flex flex-col h-full bg-surface-900/60 backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-green to-accent-cyan flex items-center justify-center flex-shrink-0">
          <Bot size={16} className="text-surface-900" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold">AI Ассистент</h3>
          <p className="text-[11px] text-white/40 truncate">
            {materialTitles.length > 0
              ? materialTitles.slice(0, 2).join(', ') + (materialTitles.length > 2 ? ` +${materialTitles.length - 2}` : '')
              : 'Выберите материал'}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-green/20 to-accent-cyan/20 border border-accent-green/20 flex items-center justify-center mx-auto mb-3">
              <BookOpen size={20} className="text-accent-green" />
            </div>
            <p className="text-sm text-white/50 font-medium mb-1">Задайте вопрос по материалу</p>
            <p className="text-xs text-white/30 max-w-xs mx-auto">
              Ассистент проанализирует содержимое документа и ответит на основе его содержания
            </p>
            <div className="mt-4 space-y-2">
              {[
                'Как выводится основная формула?',
                'Объясни ключевые концепции',
                'Приведи примеры из материала',
              ].map((hint) => (
                <button
                  key={hint}
                  onClick={() => setInput(hint)}
                  className="block w-full text-left text-xs px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/40 hover:text-white hover:bg-white/[0.06] hover:border-white/10 transition-all"
                >
                  {hint}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center ${
                  msg.role === 'user'
                    ? 'bg-accent-cyan/20'
                    : 'bg-gradient-to-br from-accent-green/30 to-accent-cyan/30'
                }`}
              >
                {msg.role === 'user' ? (
                  <User size={13} className="text-accent-cyan" />
                ) : (
                  <Bot size={13} className="text-accent-green" />
                )}
              </div>

              {/* Bubble */}
              <div className={`flex-1 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div
                  className={`px-3 py-2.5 rounded-xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-accent-cyan/15 border border-accent-cyan/20 text-white ml-auto'
                      : 'bg-white/[0.04] border border-white/[0.06] text-white/90'
                  }`}
                  dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
                />

                {/* Sources toggle */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="w-full">
                    <button
                      onClick={() => setExpandedSources(expandedSources === idx ? null : idx)}
                      className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/50 transition-colors mt-0.5"
                    >
                      <BookOpen size={10} />
                      {msg.sources.length} источник{msg.sources.length > 1 ? 'а' : ''}
                      {expandedSources === idx ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                    </button>
                    <AnimatePresence>
                      {expandedSources === idx && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-1 space-y-1 overflow-hidden"
                        >
                          {msg.sources.map((sourceId, si) => (
                            <div
                              key={si}
                              className="px-2.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[11px] text-white/40"
                            >
                              <span className="text-accent-green/60 font-medium">
                                [{si + 1}]
                              </span>{' '}
                              Документ: {sourceId}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-green/30 to-accent-cyan/30 flex items-center justify-center flex-shrink-0">
              <Bot size={13} className="text-accent-green" />
            </div>
            <div className="px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center gap-2">
              <Loader2 size={13} className="text-accent-green animate-spin" />
              <span className="text-xs text-white/40">Анализирую материал…</span>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/[0.06]">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Задайте вопрос по материалу… (Enter — отправить)"
            rows={1}
            disabled={loading || materialIds.length === 0}
            className="flex-1 resize-none bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-accent-green/30 transition-all disabled:opacity-40 custom-scrollbar max-h-28"
            style={{ minHeight: '42px' }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 112) + 'px';
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading || materialIds.length === 0}
            className="p-2.5 rounded-xl bg-accent-green/15 border border-accent-green/30 text-accent-green hover:bg-accent-green/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0"
          >
            <Send size={15} />
          </button>
        </div>
        <p className="text-[10px] text-white/20 mt-1.5 text-center">
          Shift+Enter — новая строка · ответы основаны на содержании документа
        </p>
      </div>
    </div>
  );
}
