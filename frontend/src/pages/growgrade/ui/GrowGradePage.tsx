import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  Target,
  Lightbulb,
  AlertTriangle,
  Timer,
  BarChart3,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PageTransition, GlassCard, Badge } from '../../../shared/ui';
import { cn } from '../../../shared/lib';
import { apiClient } from '../../../shared/api/client';

type CognitiveMetrics = {
  problem_decomposition: number;
  hypothesis_testing: number;
  abstraction_level: number;
  debugging_approach: number;
  time_management: number;
};

type AnalysisEntry = {
  id: string;
  task_id: string;
  task_title: string;
  task_difficulty: string;
  language: string;
  time_spent_seconds: number;
  thinking_score: number;
  thinking_level: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  patterns: string[];
  recommendations: string[];
  cognitive_metrics: CognitiveMetrics;
  created_at: string;
};

type Summary = {
  total_analyses: number;
  avg_score: number;
  dominant_level: string;
  avg_metrics: Record<string, number>;
  top_strengths: string[];
  top_weaknesses: string[];
  all_patterns: string[];
  ai_summary: string | null;
};

function MetricBar({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  const color = value >= 7 ? 'bg-accent-green' : value >= 4 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <span className="text-white/30 w-4 shrink-0">{icon}</span>
      <span className="text-[11px] text-white/50 w-28 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value * 10}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn('h-full rounded-full', color)}
        />
      </div>
      <span className="text-xs text-white/40 w-6 text-right font-mono">{value}</span>
    </div>
  );
}

function HistoryCard({ entry, isExpanded, onToggle }: { entry: AnalysisEntry; isExpanded: boolean; onToggle: () => void }) {
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const scoreColor = entry.thinking_score >= 7 ? 'text-accent-green' : entry.thinking_score >= 4 ? 'text-yellow-400' : 'text-red-400';
  const diffColor = entry.task_difficulty === 'easy' ? 'green' : entry.task_difficulty === 'medium' ? 'cyan' : 'orange';

  return (
    <motion.div layout>
      <GlassCard className="!p-0 overflow-hidden">
        <button onClick={onToggle} className="w-full text-left p-4 hover:bg-white/[0.02] transition-colors">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold',
              entry.thinking_score >= 7 ? 'bg-accent-green/10' : entry.thinking_score >= 4 ? 'bg-yellow-400/10' : 'bg-red-400/10'
            )}>
              <span className={scoreColor}>{entry.thinking_score}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium truncate">{entry.task_title}</span>
                <Badge variant={diffColor as 'green' | 'cyan' | 'orange'} size="sm">{entry.task_difficulty}</Badge>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-white/30">
                <span>{entry.thinking_level}</span>
                <span className="flex items-center gap-0.5"><Timer size={8} /> {formatTime(entry.time_spent_seconds)}</span>
                <span>{entry.language}</span>
                <span>{new Date(entry.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span>
              </div>
            </div>
            {isExpanded ? <ChevronUp size={14} className="text-white/20" /> : <ChevronDown size={14} className="text-white/20" />}
          </div>
        </button>

        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="border-t border-white/[0.04] p-4 space-y-4"
          >
            <p className="text-xs text-white/50 leading-relaxed">{entry.summary}</p>

            {entry.cognitive_metrics && (
              <div className="space-y-1.5">
                <MetricBar label="Декомпозиция" value={entry.cognitive_metrics.problem_decomposition} icon={<Target size={10} />} />
                <MetricBar label="Гипотезы" value={entry.cognitive_metrics.hypothesis_testing} icon={<Lightbulb size={10} />} />
                <MetricBar label="Абстракция" value={entry.cognitive_metrics.abstraction_level} icon={<TrendingUp size={10} />} />
                <MetricBar label="Дебаггинг" value={entry.cognitive_metrics.debugging_approach} icon={<AlertTriangle size={10} />} />
                <MetricBar label="Время" value={entry.cognitive_metrics.time_management} icon={<Timer size={10} />} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {entry.strengths.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase text-accent-green/60 mb-1 flex items-center gap-1">
                    <CheckCircle2 size={8} /> Сильные стороны
                  </p>
                  {entry.strengths.map((s, i) => (
                    <p key={i} className="text-[11px] text-white/40 mb-0.5 pl-2 border-l border-accent-green/20">{s}</p>
                  ))}
                </div>
              )}
              {entry.weaknesses.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase text-red-400/60 mb-1 flex items-center gap-1">
                    <AlertTriangle size={8} /> Зоны роста
                  </p>
                  {entry.weaknesses.map((w, i) => (
                    <p key={i} className="text-[11px] text-white/40 mb-0.5 pl-2 border-l border-red-400/20">{w}</p>
                  ))}
                </div>
              )}
            </div>

            {entry.recommendations.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase text-white/20 mb-1 flex items-center gap-1">
                  <Sparkles size={8} /> Рекомендации
                </p>
                {entry.recommendations.map((r, i) => (
                  <p key={i} className="text-[11px] text-white/40 mb-0.5 pl-2 border-l border-amber-400/20">{r}</p>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </GlassCard>
    </motion.div>
  );
}

export default function GrowGradePage() {
  const [history, setHistory] = useState<AnalysisEntry[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiClient.getThinkingHistory().catch(() => []),
      apiClient.getThinkingSummary().catch(() => null),
    ]).then(([h, s]) => {
      setHistory(h);
      setSummary(s);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <PageTransition>
        <div className="max-w-5xl mx-auto px-4 pt-24 pb-16 flex items-center justify-center min-h-[60vh]">
          <div className="flex items-center gap-3 text-white/30">
            <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            Загрузка GrowGrade...
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Brain size={20} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">GrowGrade</h1>
            <p className="text-sm text-white/40">Анализ вашего процесса мышления</p>
          </div>
        </div>

        {summary && summary.total_analyses > 0 ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 mt-6">
              <GlassCard className="text-center">
                <div className={cn(
                  'text-3xl font-bold mb-1',
                  summary.avg_score >= 7 ? 'text-accent-green' : summary.avg_score >= 4 ? 'text-yellow-400' : 'text-red-400'
                )}>
                  {summary.avg_score}
                </div>
                <p className="text-[10px] text-white/30 uppercase">Средний балл</p>
              </GlassCard>

              <GlassCard className="text-center">
                <div className="text-3xl font-bold text-amber-400 mb-1">{summary.total_analyses}</div>
                <p className="text-[10px] text-white/30 uppercase">Анализов</p>
              </GlassCard>

              <GlassCard className="text-center">
                <div className="text-lg font-bold text-accent-cyan mb-1">{summary.dominant_level}</div>
                <p className="text-[10px] text-white/30 uppercase">Уровень мышления</p>
              </GlassCard>

              <GlassCard className="text-center">
                <div className="text-lg font-bold text-white/60 mb-1">
                  {summary.all_patterns.length}
                </div>
                <p className="text-[10px] text-white/30 uppercase">Паттернов</p>
              </GlassCard>
            </div>

            {/* Cognitive Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <GlassCard>
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 size={14} className="text-amber-400" />
                  Средние когнитивные метрики
                </h3>
                <div className="space-y-3">
                  <MetricBar label="Декомпозиция" value={summary.avg_metrics.problem_decomposition || 0} icon={<Target size={10} />} />
                  <MetricBar label="Гипотезы" value={summary.avg_metrics.hypothesis_testing || 0} icon={<Lightbulb size={10} />} />
                  <MetricBar label="Абстракция" value={summary.avg_metrics.abstraction_level || 0} icon={<TrendingUp size={10} />} />
                  <MetricBar label="Дебаггинг" value={summary.avg_metrics.debugging_approach || 0} icon={<AlertTriangle size={10} />} />
                  <MetricBar label="Время" value={summary.avg_metrics.time_management || 0} icon={<Timer size={10} />} />
                </div>
              </GlassCard>

              <div className="space-y-4">
                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-2 gap-3">
                  {summary.top_strengths.length > 0 && (
                    <GlassCard className="!bg-accent-green/[0.03] !border-accent-green/10">
                      <p className="text-[10px] font-bold uppercase text-accent-green/60 mb-2 flex items-center gap-1">
                        <CheckCircle2 size={10} /> Сильные стороны
                      </p>
                      {summary.top_strengths.slice(0, 4).map((s, i) => (
                        <p key={i} className="text-[11px] text-white/50 mb-1 pl-2 border-l border-accent-green/20">{s}</p>
                      ))}
                    </GlassCard>
                  )}
                  {summary.top_weaknesses.length > 0 && (
                    <GlassCard className="!bg-red-400/[0.03] !border-red-400/10">
                      <p className="text-[10px] font-bold uppercase text-red-400/60 mb-2 flex items-center gap-1">
                        <AlertTriangle size={10} /> Зоны роста
                      </p>
                      {summary.top_weaknesses.slice(0, 4).map((w, i) => (
                        <p key={i} className="text-[11px] text-white/50 mb-1 pl-2 border-l border-red-400/20">{w}</p>
                      ))}
                    </GlassCard>
                  )}
                </div>

                {/* Patterns */}
                {summary.all_patterns.length > 0 && (
                  <GlassCard>
                    <p className="text-[10px] font-bold uppercase text-white/20 mb-2">Паттерны мышления</p>
                    <div className="flex flex-wrap gap-1.5">
                      {summary.all_patterns.map((p, i) => (
                        <span key={i} className="text-[10px] text-amber-400/70 bg-amber-400/[0.08] px-2.5 py-1 rounded-full">{p}</span>
                      ))}
                    </div>
                  </GlassCard>
                )}
              </div>
            </div>

            {/* AI Summary */}
            {summary.ai_summary && (
              <GlassCard className="mb-8 !border-amber-500/15 !bg-amber-500/[0.03]">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={14} className="text-amber-400" />
                  <h3 className="text-sm font-semibold text-amber-400">AI-саммари когнитивного профиля</h3>
                </div>
                <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">{summary.ai_summary}</p>
              </GlassCard>
            )}

            {/* History */}
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Timer size={16} className="text-white/30" />
              История анализов
            </h2>
            <div className="space-y-3">
              {history.map((entry) => (
                <HistoryCard
                  key={entry.id}
                  entry={entry}
                  isExpanded={expandedId === entry.id}
                  onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                />
              ))}
            </div>
          </>
        ) : (
          <GlassCard className="text-center py-16 mt-8">
            <Brain size={48} className="text-amber-400/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Нет анализов мышления</h3>
            <p className="text-sm text-white/40 max-w-md mx-auto">
              Решайте задачи с включённым Thinking Log — записывайте ход мыслей при решении.
              После нажмите "Анализ мышления" чтобы AI оценил ваш когнитивный процесс.
            </p>
          </GlassCard>
        )}
      </div>
    </PageTransition>
  );
}
