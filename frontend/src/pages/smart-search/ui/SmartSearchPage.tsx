import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Send, Sparkles, ArrowLeft,
  BookOpen, Brain, ChevronRight, X, Bot, User, Check, MessageSquare,
} from 'lucide-react';
import { PageTransition, GlassCard, Button, Skeleton } from '../../../shared/ui';
import { apiClient } from '../../../shared/api/client';
import { cn } from '../../../shared/lib';

interface SearchResult {
  chunk_id: string;
  document_id: string;
  document_title: string;
  score: number;
  snippet: string;
  source_type: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function SmartSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  /** Document IDs to scope RAG; empty = hybrid over full catalog (materials). */
  const [ragDocIds, setRagDocIds] = useState<string[]>([]);
  const [docTitles, setDocTitles] = useState<Record<string, string>>({});
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearched(true);
    setRagDocIds([]);
    setChatOpen(false);
    setChatMessages([]);
    try {
      const data = await apiClient.smartSearch(query.trim());
      setResults(data.results);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [query]);

  const docResults = useMemo(() => {
    const groupedResults = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
      if (!acc[r.document_id]) acc[r.document_id] = [];
      acc[r.document_id].push(r);
      return acc;
    }, {});
    const rows = Object.entries(groupedResults).map(([docId, chunks]) => ({
      document_id: docId,
      document_title: chunks[0].document_title,
      source_type: chunks[0].source_type,
      best_score: Math.max(...chunks.map((c) => c.score)),
      snippets: chunks.slice(0, 2).map((c) => c.snippet),
      chunk_count: chunks.length,
    }));
    rows.sort((a, b) => b.best_score - a.best_score);
    return rows;
  }, [results]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const toggleRagDoc = (id: string, title: string) => {
    setDocTitles((prev) => ({ ...prev, [id]: title }));
    setRagDocIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectAllRagDocs = () => {
    const ids = docResults.map((d) => d.document_id);
    const titles = Object.fromEntries(
      docResults.map((d) => [d.document_id, d.document_title]),
    );
    setDocTitles((prev) => ({ ...prev, ...titles }));
    setRagDocIds(ids);
  };

  const clearRagDocs = () => setRagDocIds([]);

  const openChat = () => {
    setChatMessages([]);
    setChatInput('');
    setChatOpen(true);
  };

  const handleAsk = useCallback(async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg: ChatMessage = { role: 'user', content: chatInput.trim() };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);
    try {
      const history = chatMessages.map((m) => ({ role: m.role, content: m.content }));
      const data = await apiClient.askAssistant({
        query: userMsg.content,
        document_ids: ragDocIds,
        history,
      });
      setChatMessages((prev) => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err) {
      console.error('Ask failed:', err);
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Произошла ошибка при генерации ответа. Попробуйте позже.' },
      ]);
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, chatLoading, chatMessages, ragDocIds]);

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-green/20 to-accent-cyan/20 flex items-center justify-center">
              <Brain size={20} className="text-accent-cyan" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold">Smart Search</h1>
          </div>
          <p className="text-white/30 text-sm max-w-xl mx-auto">
            Поиск и ответы по всем кейсам менторов. Новые материалы индексируются автоматически.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-8">
          <GlassCard padding="none" hover={false}>
            <div className="flex items-center gap-3 px-4 py-1">
              <Search size={18} className="text-white/30 flex-shrink-0" />
              <input
                ref={searchInputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Введите запрос: «машинное обучение», «как деплоить», «линейная регрессия»..."
                className="flex-1 bg-transparent text-white text-sm py-3.5 outline-none placeholder-white/30"
              />
              <Button
                size="sm"
                onClick={handleSearch}
                loading={searching}
                disabled={!query.trim()}
                icon={<Search size={14} />}
              >
                Найти
              </Button>
            </div>
          </GlassCard>

          <div className="flex justify-end mt-3">
            <span className="text-xs text-white/20">
              BM25 + Semantic · индекс = кейсы менторов
            </span>
          </div>
        </div>

        {/* Content area */}
        <div className="flex gap-6 items-start">
          {/* Results panel */}
          <div className={cn('flex-1 min-w-0', chatOpen && 'hidden lg:block lg:w-1/2 lg:flex-none')}>
            {searching && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <GlassCard key={i} hover={false}>
                    <Skeleton className="h-5 w-2/3 mb-3" />
                    <Skeleton className="h-3 w-full mb-2" />
                    <Skeleton className="h-3 w-4/5" />
                  </GlassCard>
                ))}
              </div>
            )}

            {!searching && searched && docResults.length === 0 && (
              <div className="text-center py-16">
                <Search size={40} className="mx-auto text-white/10 mb-4" />
                <p className="text-white/30 text-lg">Ничего не найдено по запросу</p>
                <p className="text-white/20 text-sm mt-1">Попробуйте другие ключевые слова или загрузите PDF</p>
                <div className="mt-6">
                  <Button size="sm" variant="secondary" onClick={openChat} icon={<MessageSquare size={14} />}>
                    Чат с AI (все кейсы)
                  </Button>
                  <p className="text-[11px] text-white/20 mt-2">Без привязки к найденным документам</p>
                </div>
              </div>
            )}

            {!searching && docResults.length > 0 && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <p className="text-xs font-bold uppercase text-white/20 tracking-wider">
                    Найдено документов: {docResults.length}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-white/35">
                      RAG: {ragDocIds.length > 0 ? `${ragDocIds.length} в контексте` : 'весь индекс'}
                    </span>
                    <button
                      type="button"
                      onClick={selectAllRagDocs}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-white/[0.04] text-white/50 hover:text-white/80 transition-colors"
                    >
                      Выбрать все
                    </button>
                    <button
                      type="button"
                      onClick={clearRagDocs}
                      disabled={ragDocIds.length === 0}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-white/[0.04] text-white/50 hover:text-white/80 transition-colors disabled:opacity-30"
                    >
                      Снять выбор
                    </button>
                    <Button size="sm" variant="secondary" onClick={openChat} icon={<MessageSquare size={14} />}>
                      Чат с AI
                    </Button>
                  </div>
                </div>
                <p className="text-[11px] text-white/25 mb-3">
                  Отметьте чекбоксы — ответы будут только по выбранным документам. Без выбора используется поиск по всем кейсам.
                </p>
                <div className="space-y-3">
                  {docResults.map((doc, idx) => {
                    const checked = ragDocIds.includes(doc.document_id);
                    return (
                      <motion.div
                        key={doc.document_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <GlassCard
                          padding="none"
                          className={cn(
                            'transition-all border border-transparent',
                            checked &&
                              'border-accent-cyan/30 shadow-[0_0_20px_rgba(0,240,255,0.08)]',
                          )}
                        >
                          <div className="p-4">
                            <div className="flex items-start gap-3">
                              <button
                                type="button"
                                role="checkbox"
                                aria-checked={checked}
                                onClick={() => toggleRagDoc(doc.document_id, doc.document_title)}
                                className={cn(
                                  'mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition-colors',
                                  checked
                                    ? 'border-accent-cyan bg-accent-cyan/20 text-accent-cyan'
                                    : 'border-white/20 bg-white/[0.03] text-transparent hover:border-white/35',
                                )}
                              >
                                {checked ? <Check size={12} strokeWidth={3} className="text-accent-cyan" /> : null}
                              </button>
                              <button
                                type="button"
                                className="flex flex-1 min-w-0 text-left gap-3"
                                onClick={() => toggleRagDoc(doc.document_id, doc.document_title)}
                              >
                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent-green/10 to-accent-cyan/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <BookOpen size={16} className="text-accent-cyan" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-sm font-semibold text-white truncate">
                                      {doc.document_title}
                                    </h3>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-accent-cyan/10 text-accent-cyan font-medium flex-shrink-0">
                                      {(doc.best_score * 100).toFixed(0)}% match
                                    </span>
                                  </div>
                                  {doc.snippets.map((snippet, i) => (
                                    <p key={i} className="text-xs text-white/40 line-clamp-2 mb-1">
                                      {snippet}
                                    </p>
                                  ))}
                                  <div className="flex items-center gap-3 mt-2">
                                    <span className="text-[10px] text-white/20">Материал</span>
                                    <span className="text-[10px] text-white/20">{doc.chunk_count} фрагм.</span>
                                  </div>
                                </div>
                                <ChevronRight size={16} className="text-white/20 flex-shrink-0 mt-1" />
                              </button>
                            </div>
                          </div>
                        </GlassCard>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {!searched && (
              <div className="text-center py-16">
                <Sparkles size={40} className="mx-auto text-white/10 mb-4" />
                <p className="text-white/30 text-lg">Введите запрос для поиска</p>
                <p className="text-white/20 text-sm mt-1">
                  Примеры: «решающие деревья», «как деплоить», «React hooks»
                </p>
              </div>
            )}
          </div>

          {/* Chat panel */}
          <AnimatePresence>
            {chatOpen && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={cn('w-full lg:w-1/2 lg:flex-none')}
              >
                <GlassCard padding="none" hover={false} className="flex flex-col h-[600px]">
                  {/* Chat header */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
                    <button
                      onClick={() => setChatOpen(false)}
                      className="lg:hidden p-1 rounded-lg hover:bg-white/[0.06]"
                    >
                      <ArrowLeft size={16} className="text-white/40" />
                    </button>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-green/20 to-accent-cyan/20 flex items-center justify-center flex-shrink-0">
                      <Brain size={14} className="text-accent-cyan" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {ragDocIds.length > 0
                          ? `Контекст: ${ragDocIds.length} док.`
                          : 'Контекст: все кейсы'}
                      </p>
                      <p className="text-[10px] text-white/30 line-clamp-2">
                        {ragDocIds.length > 0
                          ? ragDocIds.map((id) => docTitles[id] || id).join(' · ')
                          : 'Ответы по релевантным фрагментам из всех материалов'}
                      </p>
                    </div>
                    <button
                      onClick={() => setChatOpen(false)}
                      className="p-1 rounded-lg hover:bg-white/[0.06]"
                    >
                      <X size={14} className="text-white/30" />
                    </button>
                  </div>

                  {/* Chat messages */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                    {chatMessages.length === 0 && (
                      <div className="text-center py-8">
                        <Bot size={32} className="mx-auto text-white/10 mb-3" />
                        <p className="text-sm text-white/30">
                          Задайте вопрос
                          {ragDocIds.length > 0
                            ? ' — учтём только выбранные документы'
                            : ' — контекст подберётся по запросу по всем кейсам'}
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center mt-4">
                          {['О чём этот документ?', 'Объясни подробнее', 'Приведи примеры'].map((q) => (
                            <button
                              key={q}
                              onClick={() => { setChatInput(q); }}
                              className="text-xs px-3 py-1.5 rounded-lg glass glass-hover text-white/40 hover:text-white/70 transition-colors"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {chatMessages.map((msg, i) => (
                      <div key={i} className={cn('flex gap-3', msg.role === 'user' && 'flex-row-reverse')}>
                        <div
                          className={cn(
                            'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                            msg.role === 'user'
                              ? 'bg-accent-green/10'
                              : 'bg-accent-cyan/10'
                          )}
                        >
                          {msg.role === 'user' ? (
                            <User size={12} className="text-accent-green" />
                          ) : (
                            <Bot size={12} className="text-accent-cyan" />
                          )}
                        </div>
                        <div
                          className={cn(
                            'max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm',
                            msg.role === 'user'
                              ? 'bg-accent-green/10 text-white'
                              : 'bg-white/[0.03] text-white/80'
                          )}
                        >
                          <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                        </div>
                      </div>
                    ))}

                    {chatLoading && (
                      <div className="flex gap-3">
                        <div className="w-7 h-7 rounded-lg bg-accent-cyan/10 flex items-center justify-center flex-shrink-0">
                          <Bot size={12} className="text-accent-cyan" />
                        </div>
                        <div className="bg-white/[0.03] rounded-xl px-3.5 py-2.5">
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat input */}
                  <div className="border-t border-white/[0.06] p-3">
                    <div className="flex items-center gap-2">
                      <input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={handleChatKeyDown}
                        placeholder="Сообщение для AI..."
                        className="flex-1 bg-glass-light border border-white/[0.06] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-accent-cyan/30 transition-all"
                      />
                      <Button
                        size="sm"
                        onClick={handleAsk}
                        disabled={!chatInput.trim() || chatLoading}
                        loading={chatLoading}
                        icon={<Send size={14} />}
                      >
                        <span className="hidden sm:inline">Отправить</span>
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}
