import React, { useState, useCallback, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  FileText,
  Code2,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Lock,
  Trophy,
  Clock,
  BookOpen,
  CircleCheck,
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { selectAllMaterials } from '../../../entities/material';
import { selectAllUsers } from '../../../entities/user';
import { selectIsAuthenticated } from '../../../features/auth';
import { selectIsPurchased } from '../../../features/buy-material';
import {
  selectCourseProgress,
  selectActiveLesson,
  setActiveLesson,
  completeLesson,
  saveQuizScore,
} from '../../../features/course-progress';
import { PageTransition, GlassCard, Button, Badge } from '../../../shared/ui';
import { cn } from '../../../shared/lib';
import { apiClient } from '../../../shared/api/client';
import type { Lesson, LessonContent, QuizQuestion } from '../../../shared/types';

// ---- Quiz Component ----
function QuizBlock({
  quiz,
  onComplete,
}: {
  quiz: QuizQuestion[];
  onComplete: (score: number, total: number) => void;
}) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = quiz[currentQ];

  const handleSelect = (optionId: string) => {
    if (showResult) return;
    setSelected(optionId);
    setShowResult(true);
    if (optionId === question.correctOptionId) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentQ < quiz.length - 1) {
      setCurrentQ((q) => q + 1);
      setSelected(null);
      setShowResult(false);
    } else {
      const finalScore = selected === question.correctOptionId ? score : score;
      setFinished(true);
      onComplete(finalScore, quiz.length);
    }
  };

  if (finished) {
    const pct = Math.round((score / quiz.length) * 100);
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
        >
          <Trophy
            size={64}
            className={cn(
              'mx-auto mb-4',
              pct >= 80 ? 'text-yellow-400' : pct >= 50 ? 'text-accent-cyan' : 'text-white/30'
            )}
          />
        </motion.div>
        <h3 className="text-2xl font-bold mb-2">Тест завершён!</h3>
        <p className="text-4xl font-bold mb-1">
          <span className={pct >= 80 ? 'text-accent-green' : pct >= 50 ? 'text-accent-cyan' : 'text-red-400'}>
            {score}
          </span>
          <span className="text-white/20">/{quiz.length}</span>
        </p>
        <p className="text-sm text-white/40 mb-6">
          {pct >= 80 ? 'Отличный результат!' : pct >= 50 ? 'Неплохо, но можно лучше' : 'Попробуйте пересмотреть материал'}
        </p>
        <div className="w-full max-w-xs mx-auto h-2 bg-white/[0.06] rounded-full overflow-hidden mb-6">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            className={cn(
              'h-full rounded-full',
              pct >= 80 ? 'bg-accent-green' : pct >= 50 ? 'bg-accent-cyan' : 'bg-red-400'
            )}
          />
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setCurrentQ(0);
            setSelected(null);
            setShowResult(false);
            setScore(0);
            setFinished(false);
          }}
        >
          Пройти заново
        </Button>
      </motion.div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Badge variant="purple">
          <BrainCircuit size={10} className="mr-1" />
          Вопрос {currentQ + 1} из {quiz.length}
        </Badge>
        <span className="text-xs text-white/30">
          Правильных: {score}
        </span>
      </div>

      <h4 className="text-lg font-semibold mb-6">{question.question}</h4>

      <div className="space-y-3">
        {question.options.map((opt) => {
          const isCorrect = opt.id === question.correctOptionId;
          const isSelected = opt.id === selected;
          return (
            <motion.button
              key={opt.id}
              whileHover={!showResult ? { scale: 1.01 } : undefined}
              whileTap={!showResult ? { scale: 0.99 } : undefined}
              onClick={() => handleSelect(opt.id)}
              className={cn(
                'w-full text-left p-4 rounded-xl border transition-all duration-300',
                !showResult && 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 cursor-pointer',
                showResult && isCorrect && 'border-accent-green/40 bg-accent-green/10',
                showResult && isSelected && !isCorrect && 'border-red-500/40 bg-red-500/10',
                showResult && !isSelected && !isCorrect && 'border-white/[0.04] bg-white/[0.01] opacity-50'
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0',
                    !showResult && 'bg-white/[0.06] text-white/40',
                    showResult && isCorrect && 'bg-accent-green/20 text-accent-green',
                    showResult && isSelected && !isCorrect && 'bg-red-500/20 text-red-400'
                  )}
                >
                  {showResult && isCorrect ? <CheckCircle2 size={14} /> : opt.id.toUpperCase()}
                </span>
                <span className="text-sm">{opt.text}</span>
              </div>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                'mt-4 p-4 rounded-xl text-sm',
                selected === question.correctOptionId
                  ? 'bg-accent-green/5 border border-accent-green/10 text-white/70'
                  : 'bg-red-500/5 border border-red-500/10 text-white/70'
              )}
            >
              <p className="font-medium mb-1">
                {selected === question.correctOptionId ? '✓ Правильно!' : '✗ Неверно'}
              </p>
              <p className="text-white/50">{question.explanation}</p>
            </div>
            <div className="mt-4 flex justify-end">
              <Button size="sm" onClick={handleNext}>
                {currentQ < quiz.length - 1 ? 'Следующий вопрос' : 'Завершить тест'}
                <ChevronRight size={14} />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---- Video Player Placeholder ----
function VideoPlayer({ videoUrl, duration }: { videoUrl?: string; duration?: string }) {
  const [playing, setPlaying] = useState(false);

  if (playing && videoUrl) {
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
        <iframe
          src={`${videoUrl}?autoplay=1`}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; fullscreen"
          allowFullScreen
          title="Video lesson"
        />
      </div>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.005 }}
      onClick={() => setPlaying(true)}
      className="relative w-full aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-surface-800 to-surface-900 border border-white/[0.06] group cursor-pointer"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(57,255,20,0.05)_0%,transparent_70%)]" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="w-16 h-16 rounded-full bg-accent-green/20 backdrop-blur-sm flex items-center justify-center border border-accent-green/30 group-hover:bg-accent-green/30 transition-colors"
        >
          <Play size={28} className="text-accent-green ml-1" />
        </motion.div>
        {duration && (
          <span className="text-xs text-white/30 flex items-center gap-1">
            <Clock size={10} /> {duration}
          </span>
        )}
      </div>
      <div className="absolute bottom-0 inset-x-0 h-1 bg-white/[0.04]">
        <div className="h-full w-0 bg-accent-green/50 rounded-full" />
      </div>
    </motion.button>
  );
}

// ---- Code Block ----
function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-xl overflow-hidden border border-white/[0.06]">
      <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
          </div>
          {language && <span className="text-[10px] text-white/30 ml-2">{language}</span>}
        </div>
        <button
          onClick={handleCopy}
          className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-white/40 hover:text-white/60 transition-colors"
        >
          {copied ? 'Скопировано!' : 'Копировать'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
        <code className="text-white/70">{code}</code>
      </pre>
    </div>
  );
}

// ---- Markdown-like Text Renderer ----
function RichText({ body }: { body: string }) {
  const lines = body.split('\n');
  const elements: React.JSX.Element[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeLanguage = '';
  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];

  const flushTable = () => {
    if (tableHeaders.length > 0) {
      elements.push(
        <div key={`table-${elements.length}`} className="overflow-x-auto my-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {tableHeaders.map((h, i) => (
                  <th key={i} className="text-left p-2 border-b border-white/10 text-white/60 font-medium">
                    {h.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className="p-2 border-b border-white/[0.04] text-white/50">
                      {cell.trim()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    inTable = false;
    tableHeaders = [];
    tableRows = [];
  };

  lines.forEach((line, idx) => {
    // Code block
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(<CodeBlock key={`code-${idx}`} code={codeBuffer.join('\n')} language={codeLanguage} />);
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        if (inTable) flushTable();
        inCodeBlock = true;
        codeLanguage = line.slice(3).trim();
      }
      return;
    }
    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    // Table detection
    if (line.includes('|') && line.trim().startsWith('|')) {
      const cells = line
        .split('|')
        .filter((c) => c.trim() !== '');
      if (cells.every((c) => c.trim().match(/^[-:]+$/))) return; // separator row
      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
      } else {
        tableRows.push(cells);
      }
      return;
    } else if (inTable) {
      flushTable();
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={idx} className="text-base font-semibold mt-6 mb-2 text-white/90">
          {line.slice(4)}
        </h4>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h3 key={idx} className="text-lg font-bold mt-8 mb-3 text-white">
          {line.slice(3)}
        </h3>
      );
    } else if (line.startsWith('> ')) {
      elements.push(
        <blockquote
          key={idx}
          className="border-l-2 border-accent-cyan/30 pl-4 py-1 my-3 text-sm text-white/50 italic"
        >
          {line.slice(2)}
        </blockquote>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <li key={idx} className="text-sm text-white/60 ml-4 list-disc">
          {line.slice(2)}
        </li>
      );
    } else if (line.match(/^\d+\. /)) {
      elements.push(
        <li key={idx} className="text-sm text-white/60 ml-4 list-decimal">
          {line.replace(/^\d+\. /, '')}
        </li>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={idx} className="h-2" />);
    } else {
      // Inline code
      const parts = line.split(/(`[^`]+`)/g);
      elements.push(
        <p key={idx} className="text-sm text-white/60 leading-relaxed">
          {parts.map((part, i) =>
            part.startsWith('`') && part.endsWith('`') ? (
              <code key={i} className="px-1.5 py-0.5 rounded bg-white/[0.06] text-accent-cyan text-xs font-mono">
                {part.slice(1, -1)}
              </code>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </p>
      );
    }
  });

  if (inTable) flushTable();

  return <div className="space-y-1">{elements}</div>;
}

// ---- Content Renderer ----
function LessonContentRenderer({
  content,
  onQuizComplete,
}: {
  content: LessonContent;
  onQuizComplete: (score: number, total: number) => void;
}) {
  switch (content.type) {
    case 'video':
      return (
        <div className="mb-8">
          {content.title && <h4 className="text-sm font-medium text-white/50 mb-3">{content.title}</h4>}
          <VideoPlayer videoUrl={content.videoUrl} duration={content.videoDuration} />
        </div>
      );
    case 'text':
      return (
        <div className="mb-8">
          {content.title && (
            <h4 className="text-base font-semibold mb-4 flex items-center gap-2">
              <FileText size={16} className="text-accent-cyan" />
              {content.title}
            </h4>
          )}
          {content.body && <RichText body={content.body} />}
        </div>
      );
    case 'code':
      return (
        <div className="mb-8">
          {content.title && (
            <h4 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Code2 size={16} className="text-accent-green" />
              {content.title}
            </h4>
          )}
          {content.code && <CodeBlock code={content.code} language={content.codeLanguage} />}
        </div>
      );
    case 'quiz':
      return (
        <div className="mb-8">
          <GlassCard className="border border-purple-500/10">
            <h4 className="text-base font-semibold mb-6 flex items-center gap-2">
              <BrainCircuit size={16} className="text-purple-400" />
              Проверь свои знания
            </h4>
            {content.quiz && (
              <QuizBlock
                quiz={content.quiz}
                onComplete={onQuizComplete}
              />
            )}
          </GlassCard>
        </div>
      );
    default:
      return null;
  }
}

// ---- Main Page ----
export default function CourseViewerPage() {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const materials = useAppSelector(selectAllMaterials);
  const users = useAppSelector(selectAllUsers);
  const isAuth = useAppSelector(selectIsAuthenticated);
  const isPurchased = useAppSelector(selectIsPurchased(id || ''));
  const progress = useAppSelector(selectCourseProgress(id || ''));
  const activeLessonId = useAppSelector(selectActiveLesson);

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLessonsLoading(true);
    apiClient.getLessons(id)
      .then((data: any[]) => {
        const mapped = data
          .map((l) => ({
            id: l.id,
            materialId: l.material_id,
            title: l.title,
            order: l.order,
            duration: l.duration || '—',
            isPreview: l.is_preview ?? false,
            contents: Array.isArray(l.contents) ? l.contents : [],
          }))
          .sort((a, b) => a.order - b.order);
        setLessons(mapped);
      })
      .catch(() => {})
      .finally(() => setLessonsLoading(false));
  }, [id]);

  const material = materials.find((m) => m.id === id);

  // Loading state
  if (lessonsLoading) {
    return (
      <PageTransition>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-24 pb-16">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl bg-white/[0.02] animate-pulse" />)}
          </div>
        </div>
      </PageTransition>
    );
  }

  // If no lessons exist for this material, redirect to material detail
  if (!material || lessons.length === 0) {
    return <Navigate to={`/catalog/${id}`} replace />;
  }

  // Must be purchased (unless preview)
  if (!isPurchased && !isAuth) {
    return <Navigate to={`/catalog/${id}`} replace />;
  }

  const author = users.find((u) => u.id === material.authorId);
  const currentLesson = lessons.find((l) => l.id === activeLessonId) || lessons[0];
  const completedCount = progress.filter((p) => p.completed).length;
  const progressPct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  const handleSelectLesson = (lessonId: string) => {
    dispatch(setActiveLesson(lessonId));
  };

  const handleCompleteLesson = useCallback(() => {
    if (!id || !currentLesson) return;
    dispatch(completeLesson({ materialId: id, lessonId: currentLesson.id }));
    // Auto-advance to next lesson
    const nextLesson = lessons.find((l) => l.order === currentLesson.order + 1);
    if (nextLesson) {
      dispatch(setActiveLesson(nextLesson.id));
    }
  }, [dispatch, id, currentLesson, lessons]);

  const handleQuizComplete = useCallback(
    (score: number, total: number) => {
      if (!id || !currentLesson) return;
      dispatch(saveQuizScore({ materialId: id, lessonId: currentLesson.id, score, total }));
    },
    [dispatch, id, currentLesson]
  );

  const isLessonCompleted = (lessonId: string) => progress.some((p) => p.lessonId === lessonId && p.completed);
  const isCurrentLesson = currentLesson?.id;

  return (
    <PageTransition>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to={`/catalog/${id}`}
            className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors"
          >
            <ArrowLeft size={14} /> Назад
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <h1 className="text-sm font-medium text-white/60 truncate">{material.title}</h1>
          {author && (
            <>
              <div className="h-4 w-px bg-white/10 hidden sm:block" />
              <Link to={`/profile/${author.id}`} className="hidden sm:flex items-center gap-2 text-xs text-white/30 hover:text-white/50 transition-colors">
                <img src={author.avatarUrl} alt="" className="w-5 h-5 rounded-md" />
                {author.name}
              </Link>
            </>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-white/30 mb-2">
            <span>Прогресс кейса</span>
            <span>
              {completedCount}/{lessons.length} уроков · {progressPct}%
            </span>
          </div>
          <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-accent-green to-accent-cyan rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* Sidebar: Lesson list */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <GlassCard padding="sm">
              <div className="flex items-center gap-2 px-2 py-2 mb-2">
                <BookOpen size={14} className="text-accent-cyan" />
                <span className="text-sm font-semibold">Содержание</span>
              </div>
              <div className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto pr-1 custom-scrollbar">
                {lessons.map((lesson, i) => {
                  const completed = isLessonCompleted(lesson.id);
                  const isCurrent = lesson.id === isCurrentLesson;
                  const isLocked = !isPurchased && !lesson.isPreview;
                  return (
                    <motion.button
                      key={lesson.id}
                      whileHover={{ x: 2 }}
                      onClick={() => !isLocked && handleSelectLesson(lesson.id)}
                      className={cn(
                        'w-full text-left px-3 py-3 rounded-lg transition-all duration-200 group flex items-start gap-3',
                        isCurrent
                          ? 'bg-accent-green/10 border border-accent-green/20'
                          : 'hover:bg-white/[0.03] border border-transparent',
                        isLocked && 'opacity-40 cursor-not-allowed'
                      )}
                    >
                      <span
                        className={cn(
                          'w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5',
                          completed
                            ? 'bg-accent-green/20 text-accent-green'
                            : isCurrent
                              ? 'bg-accent-green/10 text-accent-green'
                              : 'bg-white/[0.04] text-white/30'
                        )}
                      >
                        {isLocked ? (
                          <Lock size={10} />
                        ) : completed ? (
                          <CheckCircle2 size={12} />
                        ) : (
                          i + 1
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'text-xs font-medium leading-snug',
                            isCurrent ? 'text-white' : 'text-white/60 group-hover:text-white/80'
                          )}
                        >
                          {lesson.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-white/20 flex items-center gap-1">
                            <Clock size={8} /> {lesson.duration}
                          </span>
                          {lesson.isPreview && !isPurchased && (
                            <Badge variant="green" size="sm">
                              Preview
                            </Badge>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </GlassCard>
          </div>

          {/* Main: Lesson content */}
          <div className="min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentLesson.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <GlassCard>
                  {/* Lesson header */}
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/[0.04]">
                    <span className="w-8 h-8 rounded-lg bg-accent-green/10 flex items-center justify-center text-sm font-bold text-accent-green">
                      {currentLesson.order}
                    </span>
                    <div>
                      <h2 className="text-lg font-bold">{currentLesson.title}</h2>
                      <p className="text-xs text-white/30 flex items-center gap-2 mt-0.5">
                        <Clock size={10} /> {currentLesson.duration}
                        {currentLesson.contents.some((c) => c.type === 'quiz') && (
                          <>
                            <span className="text-white/10">·</span>
                            <BrainCircuit size={10} /> Тест
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Lesson contents */}
                  {currentLesson.contents.map((content, i) => (
                    <LessonContentRenderer
                      key={i}
                      content={content}
                      onQuizComplete={handleQuizComplete}
                    />
                  ))}

                  {/* Complete & Navigate */}
                  <div className="flex items-center justify-between pt-6 mt-6 border-t border-white/[0.04]">
                    <Button
                      variant={isLessonCompleted(currentLesson.id) ? 'secondary' : 'primary'}
                      size="sm"
                      icon={isLessonCompleted(currentLesson.id) ? <CircleCheck size={14} /> : <CheckCircle2 size={14} />}
                      onClick={handleCompleteLesson}
                      disabled={isLessonCompleted(currentLesson.id)}
                    >
                      {isLessonCompleted(currentLesson.id) ? 'Урок пройден' : 'Отметить как пройденный'}
                    </Button>
                    {currentLesson.order < lessons.length && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const next = lessons.find((l) => l.order === currentLesson.order + 1);
                          if (next) handleSelectLesson(next.id);
                        }}
                      >
                        Следующий урок <ChevronRight size={14} />
                      </Button>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
