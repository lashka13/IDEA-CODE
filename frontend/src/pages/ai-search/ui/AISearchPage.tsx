import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Sparkles,
  FileText,
  ChevronRight,
  Loader2,
  AlertCircle,
  BookOpen,
  RefreshCw,
  X,
} from 'lucide-react';
import { apiClient } from '../../../shared/api/client';
import { AIChatPanel } from '../../../features/ai-chat';
import { GradientMesh, GrainOverlay } from '../../../shared/ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SearchResult {
  chunk_id: string;
  document_id: string;
  document_title: string;
  score: number;
  snippet: string;
  source_type: string;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1 w-16 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.round(score * 100)}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-accent-green to-accent-cyan"
        />
      </div>
      <span className="text-[10px] text-white/30">{Math.round(score * 100)}%</span>
    </div>
  );
}

function MaterialCard({
  result,
  rank,
  selected,
  onClick,
}: {
  result: SearchResult;
  rank: number;
  selected: boolean;
  onClick: () => void;
}) {
  const title = result.document_title;
  const description = result.snippet;
  const Icon = FileText;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.05 }}
      onClick={onClick}
      className={`group relative cursor-pointer rounded-2xl border transition-all duration-300 p-4 ${
        selected
          ? 'border-accent-green/40 bg-accent-green/5 shadow-lg shadow-accent-green/5'
          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]'
      }`}
    >
      {/* Rank badge */}
      <div className="absolute -top-2.5 -left-2.5 w-6 h-6 rounded-full bg-surface-900 border border-white/[0.08] flex items-center justify-center">
        <span className="text-[10px] font-bold text-white/40">#{rank}</span>
      </div>

      {selected && (
        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-accent-green" />
      )}

      <div className="flex gap-3">
        {/* Icon */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            selected ? 'bg-accent-green/15' : 'bg-white/[0.04]'
          }`}
        >
          <Icon size={16} className={selected ? 'text-accent-green' : 'text-white/40'} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2">{title}</h3>
            <ScoreBar score={result.score} />
          </div>

          <p className="text-xs text-white/40 line-clamp-2 mb-2 leading-relaxed">{description}</p>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/40">
              {result.source_type}
            </span>
            <Link
              to={`/catalog/${result.document_id}`}
              onClick={(e) => e.stopPropagation()}
              className="ml-auto text-[10px] text-white/25 hover:text-accent-cyan transition-colors flex items-center gap-0.5"
            >
              К кейсам <ChevronRight size={10} />
            </Link>
          </div>
        </div>
      </div>

    </motion.div>
  );
}

function SearchSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/[0.04] rounded animate-pulse w-3/4" />
              <div className="h-3 bg-white/[0.04] rounded animate-pulse w-full" />
              <div className="h-3 bg-white/[0.04] rounded animate-pulse w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Example queries
// ---------------------------------------------------------------------------

const EXAMPLE_QUERIES = [
  'конспект по матанализу, тема ряды',
  'решающие деревья',
  'функциональный анализ',
  'временные ряды машинное обучение',
  'линейная алгебра матрицы',
  'нейронные сети backpropagation',
];

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AISearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [inputValue, setInputValue] = useState(searchParams.get('q') ?? '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedTitles, setSelectedTitles] = useState<string[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const data = await apiClient.smartSearch(q.trim(), 10);
      setResults(data.results);
    } catch (err: any) {
      setError(err.message || 'Ошибка при поиске');
    } finally {
      setLoading(false);
    }
  }, []);

  // Run search on mount if query param present
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      setInputValue(q);
      runSearch(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    const q = inputValue.trim();
    if (!q) return;
    setQuery(q);
    setSearchParams({ q });
    setSelectedIds([]);
    setSelectedTitles([]);
    setChatOpen(false);
    runSearch(q);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const toggleSelect = (result: SearchResult) => {
    const id = result.document_id;
    const title = result.document_title;
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
    setSelectedTitles((prev) => {
      if (prev.includes(title)) return prev.filter((x) => x !== title);
      return [...prev, title];
    });
  };

  const openChat = () => {
    if (selectedIds.length === 0 && results.length > 0) {
      const first = results[0];
      setSelectedIds([first.document_id]);
      setSelectedTitles([first.document_title]);
    }
    setChatOpen(true);
  };

  return (
    <div className="min-h-screen pt-20 pb-10">
      <GrainOverlay />
      <GradientMesh />

      <div className="max-w-7xl mx-auto px-4">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 pt-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-green/10 border border-accent-green/20 text-accent-green text-xs font-medium mb-4">
            <Sparkles size={12} />
            AI-поиск по материалам
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Найди нужный конспект
          </h1>
          <p className="text-white/40 text-sm max-w-lg mx-auto">
            Опиши что тебе нужно — ассистент найдёт релевантные материалы и ответит на твои вопросы по документу
          </p>
        </motion.div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-2xl mx-auto mb-8"
        >
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Например: конспект по матанализу на тему ряды…"
              className="w-full pl-11 pr-28 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-sm text-white placeholder-white/25 outline-none focus:border-accent-green/40 focus:bg-white/[0.06] transition-all"
            />
            <button
              onClick={handleSearch}
              disabled={!inputValue.trim() || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-accent-green text-surface-900 font-semibold text-sm hover:bg-accent-green/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : 'Найти'}
            </button>
          </div>

          {/* Example queries */}
          {!query && (
            <div className="flex flex-wrap gap-2 mt-3 justify-center">
              {EXAMPLE_QUERIES.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setInputValue(q);
                    setSearchParams({ q });
                    setQuery(q);
                    runSearch(q);
                  }}
                  className="text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white hover:border-white/10 hover:bg-white/[0.06] transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Content area */}
        <div className={`flex gap-6 ${chatOpen ? 'items-start' : ''}`}>
          {/* Results column */}
          <div className={`flex-1 min-w-0 ${chatOpen ? 'max-w-[55%]' : ''}`}>
            {/* Results header */}
            {query && !loading && results.length > 0 && (
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-white/60">
                    По запросу{' '}
                    <span className="text-white font-medium">«{query}»</span>{' '}
                    найдено{' '}
                    <span className="text-accent-green font-medium">{results.length}</span>{' '}
                    материал{results.length !== 1 ? 'а' : ''}
                  </p>
                  {selectedIds.length > 0 && (
                    <p className="text-xs text-white/30 mt-0.5">
                      Выбрано для чата: {selectedIds.length} материал{selectedIds.length > 1 ? 'а' : ''}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {selectedIds.length > 0 && (
                    <button
                      onClick={() => { setSelectedIds([]); setSelectedTitles([]); }}
                      className="text-xs px-3 py-1.5 rounded-xl border border-white/[0.06] text-white/40 hover:text-white hover:border-white/10 transition-all flex items-center gap-1"
                    >
                      <X size={11} /> Снять выбор
                    </button>
                  )}
                  <button
                    onClick={openChat}
                    disabled={results.length === 0}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-accent-green/15 border border-accent-green/30 text-accent-green text-sm font-medium hover:bg-accent-green/25 disabled:opacity-30 transition-all"
                  >
                    <BookOpen size={14} />
                    {chatOpen ? 'Обновить' : 'Спросить ассистента'}
                  </button>
                </div>
              </div>
            )}

            {/* Loading */}
            {loading && <SearchSkeleton />}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error}</span>
                <button
                  onClick={() => runSearch(query)}
                  className="ml-auto flex items-center gap-1 text-xs hover:text-red-300 transition-colors"
                >
                  <RefreshCw size={12} /> Повторить
                </button>
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && query && results.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                  <Search size={24} className="text-white/20" />
                </div>
                <p className="text-white/40 mb-1">Ничего не найдено</p>
                <p className="text-white/20 text-sm mb-4">
                  Попробуйте другой запрос или более общие слова
                </p>
                <p className="text-xs text-white/20">
                  Если материалы не индексированы — попросите администратора запустить индексацию
                </p>
              </div>
            )}

            {/* Result cards */}
            {!loading && results.length > 0 && (
              <div className="space-y-3">
                <AnimatePresence>
                  {results.map((result, idx) => (
                    <MaterialCard
                      key={result.chunk_id}
                      result={result}
                      rank={idx + 1}
                      selected={selectedIds.includes(result.document_id)}
                      onClick={() => toggleSelect(result)}
                    />
                  ))}
                </AnimatePresence>

                {results.length > 0 && !chatOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="pt-2 text-center"
                  >
                    <button
                      onClick={openChat}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-accent-green/20 to-accent-cyan/20 border border-accent-green/30 text-accent-green font-medium text-sm hover:from-accent-green/30 hover:to-accent-cyan/30 transition-all"
                    >
                      <Sparkles size={14} />
                      Задать вопрос ассистенту по найденным материалам
                    </button>
                    <p className="text-xs text-white/25 mt-2">
                      Кликни на карточки чтобы выбрать конкретные материалы, или ассистент возьмёт первый результат
                    </p>
                  </motion.div>
                )}
              </div>
            )}

            {/* No query yet */}
            {!query && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-accent-green/10 to-accent-cyan/10 border border-accent-green/20 flex items-center justify-center mx-auto mb-6">
                  <Sparkles size={32} className="text-accent-green/60" />
                </div>
                <h2 className="text-xl font-semibold mb-2 text-white/70">Начни поиск</h2>
                <p className="text-white/30 text-sm max-w-sm mx-auto">
                  Введи тему или название предмета — AI найдёт релевантные материалы и поможет разобраться в них
                </p>
              </motion.div>
            )}
          </div>

          {/* Chat panel */}
          <AnimatePresence>
            {chatOpen && (
              <motion.div
                initial={{ opacity: 0, x: 40, width: 0 }}
                animate={{ opacity: 1, x: 0, width: '45%' }}
                exit={{ opacity: 0, x: 40, width: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="flex-shrink-0 sticky top-24"
                style={{ height: 'calc(100vh - 120px)' }}
              >
                <AIChatPanel
                  materialIds={selectedIds}
                  materialTitles={selectedTitles}
                  onClose={() => setChatOpen(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
