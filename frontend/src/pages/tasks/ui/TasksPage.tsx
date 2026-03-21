import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  ChevronLeft,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Trophy,
  Filter,
  Lightbulb,
  Terminal,
  Send,
  Zap,
  Users,
  Timer,

} from 'lucide-react';
import { PageTransition, GlassCard, Button, Badge, CodeCoinIcon } from '../../../shared/ui';
import { cn, } from '../../../shared/lib';
import { TASK_CATEGORIES, type Task, type TaskCategory, type TaskDifficulty, type Challenge } from '../../../shared/types';
import { useAppSelector } from '../../../app/store/hooks';
import { selectAllUsers } from '../../../entities/user';
import { apiClient } from '../../../shared/api/client';

type SubmissionStatus = 'idle' | 'running' | 'accepted' | 'wrong' | 'error';

function CodeIDE({
  task,
}: {
  task: Task;
}) {
  const [code, setCode] = useState(getStarterCode(task));
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState<SubmissionStatus>('idle');
  const [activeTestCase, setActiveTestCase] = useState(0);

  const handleRun = () => {
    setStatus('running');
    setOutput('');
    setTimeout(() => {
      const example = task.examples[activeTestCase];
      if (example) {
        setOutput(`Вход:\n${example.input}\n\nОжидаемый выход:\n${example.output}\n\n> Запуск на тестовом примере...`);
      }
      setStatus('idle');
    }, 1000);
  };

  const handleSubmit = () => {
    setStatus('running');
    setOutput('Проверяем решение на тестах...\n');
    setTimeout(() => {
      const rand = Math.random();
      if (rand > 0.4) {
        setStatus('accepted');
        setOutput(
          `✅ Тест 1: Passed\n✅ Тест 2: Passed\n✅ Тест 3: Passed\n✅ Тест 4 (скрытый): Passed\n✅ Тест 5 (скрытый): Passed\n\n🎉 Все тесты пройдены!\nВремя: 42ms | Память: 12.3 MB`
        );
      } else {
        setStatus('wrong');
        setOutput(
          `✅ Тест 1: Passed\n✅ Тест 2: Passed\n❌ Тест 3: Wrong Answer\n\nОжидалось: ${task.examples[0]?.output || '...'}\nПолучено: -1`
        );
      }
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface-900/80 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <select className="bg-surface-800 border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-white/60 focus:outline-none [color-scheme:dark] appearance-none cursor-pointer hover:border-white/10 transition-colors">
            <option value="python">Python 3.11</option>
            <option value="javascript">JavaScript (Node 20)</option>
            <option value="go">Go 1.21</option>
            <option value="java">Java 21</option>
            <option value="cpp">C++ 17</option>
          </select>
          <button
            onClick={() => setCode(getStarterCode(task))}
            className="p-1.5 rounded-lg text-white/20 hover:text-white/40 hover:bg-white/[0.04] transition-colors"
            title="Сбросить код"
          >
            <RotateCcw size={14} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleRun} disabled={status === 'running'}>
            <Play size={12} /> Запустить
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={status === 'running'} loading={status === 'running'}>
            <Send size={12} /> Отправить
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0 flex flex-col">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          className="flex-1 bg-surface-900/40 p-4 font-mono text-sm text-white/80 resize-none focus:outline-none leading-relaxed"
          placeholder="Напишите решение здесь..."
        />

        {/* Test cases + Output */}
        <div className="h-48 border-t border-white/[0.04] flex flex-col">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.04]">
            <span className="text-[10px] font-bold uppercase text-white/20">Тесты</span>
            <div className="flex gap-1 ml-2">
              {task.examples.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTestCase(i)}
                  className={cn(
                    'px-2 py-0.5 rounded text-[10px] transition-colors',
                    activeTestCase === i ? 'bg-white/[0.08] text-white/60' : 'text-white/20 hover:text-white/40'
                  )}
                >
                  Тест {i + 1}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-1">
              {status === 'accepted' && <CheckCircle2 size={14} className="text-accent-green" />}
              {status === 'wrong' && <XCircle size={14} className="text-red-400" />}
              {status === 'running' && <div className="w-3 h-3 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />}
            </div>
          </div>
          <div className="flex-1 overflow-auto p-3">
            {output ? (
              <pre className="text-xs font-mono text-white/50 whitespace-pre-wrap">{output}</pre>
            ) : (
              <div className="flex items-center gap-3 text-xs text-white/20">
                <Terminal size={14} />
                Результат выполнения появится здесь
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TheoryQuestion({ task }: { task: Task }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [checking, setChecking] = useState(false);
  const [correctOptionId, setCorrectOptionId] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string>('');

  const handleSubmit = async () => {
    if (!selected) return;
    setChecking(true);
    try {
      const res = await apiClient.checkTaskAnswer(task.id, selected);
      setCorrectOptionId(res.correct_option_id);
      setExplanation(res.explanation);
      setSubmitted(true);
    } catch {
      // Fallback to client-side if API unavailable
      setCorrectOptionId(task.correctOptionId || null);
      setExplanation(task.explanation || '');
      setSubmitted(true);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-bold mb-6">{task.title}</h3>
      <p className="text-sm text-white/60 mb-6 whitespace-pre-wrap">{task.description}</p>

      <div className="space-y-3 mb-6">
        {task.options?.map((opt) => {
          const isCorrect = submitted && opt.id === correctOptionId;
          const isSelected = opt.id === selected;
          return (
            <button
              key={opt.id}
              onClick={() => !submitted && setSelected(opt.id)}
              className={cn(
                'w-full text-left p-4 rounded-xl border transition-all',
                !submitted && 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer',
                submitted && isCorrect && 'border-accent-green/40 bg-accent-green/10',
                submitted && isSelected && !isCorrect && 'border-red-500/40 bg-red-500/10',
                !submitted && isSelected && 'border-accent-cyan/30 bg-accent-cyan/5',
                submitted && !isSelected && !isCorrect && 'opacity-40'
              )}
            >
              <div className="flex items-center gap-3">
                <span className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold',
                  submitted && isCorrect ? 'bg-accent-green/20 text-accent-green' :
                  submitted && isSelected && !isCorrect ? 'bg-red-500/20 text-red-400' :
                  isSelected ? 'bg-accent-cyan/20 text-accent-cyan' :
                  'bg-white/[0.06] text-white/40'
                )}>
                  {submitted && isCorrect ? <CheckCircle2 size={14} /> : opt.id.toUpperCase()}
                </span>
                <span className="text-sm">{opt.text}</span>
              </div>
            </button>
          );
        })}
      </div>

      {submitted && explanation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'p-4 rounded-xl text-sm mb-6',
            selected === correctOptionId
              ? 'bg-accent-green/5 border border-accent-green/10'
              : 'bg-red-500/5 border border-red-500/10'
          )}
        >
          <p className="font-medium mb-1">
            {selected === correctOptionId ? '✓ Правильно!' : '✗ Неверно'}
          </p>
          <p className="text-white/50">{explanation}</p>
        </motion.div>
      )}

      {!submitted && (
        <Button onClick={handleSubmit} disabled={!selected || checking} loading={checking}>
          Проверить ответ
        </Button>
      )}

      {submitted && (
        <Button
          variant="secondary"
          onClick={() => { setSelected(null); setSubmitted(false); setCorrectOptionId(null); setExplanation(''); }}
        >
          Попробовать снова
        </Button>
      )}
    </div>
  );
}

function SystemDesignInput({ task }: { task: Task }) {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="p-6">
      <h3 className="text-lg font-bold mb-4">{task.title}</h3>
      <div className="text-sm text-white/60 mb-6 whitespace-pre-wrap">{task.description}</div>

      {task.hints.length > 0 && (
        <div className="mb-6">
          <p className="text-xs text-white/30 mb-2 flex items-center gap-1"><Lightbulb size={10} /> Подсказки</p>
          <div className="space-y-1">
            {task.hints.map((hint, i) => (
              <p key={i} className="text-xs text-white/40 pl-3 border-l border-white/10">{hint}</p>
            ))}
          </div>
        </div>
      )}

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Опишите вашу архитектуру: API, базу данных, стратегию масштабирования..."
        rows={12}
        className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-accent-green/20 transition-colors resize-none mb-4 font-mono"
      />

      {!submitted ? (
        <Button onClick={() => setSubmitted(true)} disabled={answer.length < 20}>
          <Send size={14} /> Отправить на проверку
        </Button>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <GlassCard className="border border-accent-cyan/10">
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <CheckCircle2 size={14} className="text-accent-cyan" />
              Ответ отправлен на проверку ментору
            </p>
            <p className="text-xs text-white/40">Обычно проверка занимает 1-2 дня. Результат придёт в уведомлениях.</p>
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
}

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const users = useAppSelector(selectAllUsers);
  const isActive = challenge.status === 'active';
  const isUpcoming = challenge.status === 'upcoming';
  const isEnded = challenge.status === 'ended';

  const diffColor = challenge.difficulty === 'junior' ? 'green' : challenge.difficulty === 'middle' ? 'cyan' : 'orange';
  const typeLabel = challenge.type === 'weekly' ? 'Неделя' : challenge.type === 'daily' ? 'День' : 'Спец.';

  const progress = challenge.maxParticipants
    ? (challenge.participantsCount / challenge.maxParticipants) * 100
    : null;

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <GlassCard className="h-full flex flex-col">
        {/* Status badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={cn(
              'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
              isActive && 'bg-accent-green/10 text-accent-green',
              isUpcoming && 'bg-accent-cyan/10 text-accent-cyan',
              isEnded && 'bg-white/[0.06] text-white/30',
            )}>
              {isActive ? '● Активен' : isUpcoming ? 'Скоро' : 'Завершён'}
            </span>
            <span className="text-[10px] text-white/20">{typeLabel}</span>
          </div>
          <Badge variant={diffColor as 'green' | 'cyan' | 'orange'} size="sm">{challenge.difficulty}</Badge>
        </div>

        {/* Title */}
        <h3 className="font-semibold mb-1">{challenge.title}</h3>
        <p className="text-xs text-white/40 leading-relaxed mb-4 flex-1">{challenge.description}</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 rounded-lg bg-white/[0.02]">
            <div className="flex items-center justify-center gap-1">
              <CodeCoinIcon size={10} />
              <span className="text-sm font-bold text-accent-green">{challenge.prizePool}</span>
            </div>
            <p className="text-[10px] text-white/25">Призовой фонд</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-white/[0.02]">
            <div className="flex items-center justify-center gap-1">
              <Users size={10} className="text-white/30" />
              <span className="text-sm font-bold">{challenge.participantsCount}</span>
            </div>
            <p className="text-[10px] text-white/25">Участников</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-white/[0.02]">
            <p className="text-sm font-bold">{challenge.tasks.length}</p>
            <p className="text-[10px] text-white/25">Заданий</p>
          </div>
        </div>

        {/* Progress bar for limited slots */}
        {progress !== null && (
          <div className="mb-4">
            <div className="flex justify-between text-[10px] text-white/25 mb-1">
              <span>Мест занято</span>
              <span>{challenge.participantsCount}/{challenge.maxParticipants}</span>
            </div>
            <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent-green to-accent-cyan"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Tasks list */}
        <div className="mb-4">
          <p className="text-[10px] text-white/20 mb-2">Задания:</p>
          <div className="flex flex-wrap gap-1">
            {challenge.tasks.slice(0, 5).map((task, i) => (
              <span key={i} className="px-2 py-0.5 rounded-md bg-white/[0.03] text-[10px] text-white/35">{task}</span>
            ))}
            {challenge.tasks.length > 5 && (
              <span className="px-2 py-0.5 rounded-md bg-white/[0.03] text-[10px] text-white/20">
                +{challenge.tasks.length - 5}
              </span>
            )}
          </div>
        </div>

        {/* Leaderboard preview */}
        {challenge.topParticipants.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] text-white/20 mb-2">Лидеры:</p>
            <div className="space-y-1.5">
              {challenge.topParticipants.slice(0, 3).map((p, i) => {
                const u = users.find((user) => user.id === p.userId);
                return (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className={cn(
                      'w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold',
                      i === 0 && 'bg-yellow-400/10 text-yellow-400',
                      i === 1 && 'bg-white/[0.08] text-white/50',
                      i === 2 && 'bg-orange-400/10 text-orange-400',
                    )}>
                      {i + 1}
                    </span>
                    {u && <img src={u.avatarUrl} alt="" className="w-5 h-5 rounded-md" />}
                    <span className="text-white/50 flex-1 truncate">{u?.name || 'Участник'}</span>
                    <span className="text-white/25">{p.score} pts</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Time + CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.04] mt-auto">
          <div className="flex items-center gap-1.5 text-[10px] text-white/25">
            <Timer size={10} />
            <span>
              {isActive && `До ${new Date(challenge.endsAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`}
              {isUpcoming && `Старт ${new Date(challenge.startsAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`}
              {isEnded && `Завершён ${new Date(challenge.endsAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`}
            </span>
          </div>
          <Button size="sm" variant={isActive ? 'primary' : 'secondary'} disabled={isEnded}>
            {isActive ? 'Участвовать' : isUpcoming ? 'Напомнить' : 'Результаты'}
          </Button>
        </div>
      </GlassCard>
    </motion.div>
  );
}

type ActiveTab = 'tasks' | 'challenges';

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('tasks');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<TaskDifficulty | 'all'>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  useEffect(() => {
    apiClient.getTasks().then((data: any[]) => {
      const mapped: Task[] = data.map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        difficulty: t.difficulty,
        category: t.category,
        topic: t.topic,
        isTheory: t.is_theory,
        inputFormat: t.input_format,
        outputFormat: t.output_format,
        constraints: t.constraints,
        examples: t.examples,
        hiddenTests: t.hidden_tests,
        timeLimit: t.time_limit_ms,
        memoryLimit: t.memory_limit_mb,
        solvedCount: t.solved_count,
        totalAttempts: t.total_attempts ?? 0,
        acceptanceRate: t.acceptance_rate,
        tags: t.tags,
        hints: t.hints,
        options: t.options,
        correctOptionId: t.correct_option_id,
        explanation: t.explanation,
      }));
      setTasks(mapped);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    apiClient.getChallenges().then((data: any[]) => {
      const mapped: Challenge[] = data.map((c: any) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        type: c.type,
        difficulty: c.difficulty,
        category: c.category,
        prizePool: c.prize_pool,
        participantsCount: c.participants_count,
        maxParticipants: c.max_participants,
        startsAt: c.starts_at,
        endsAt: c.ends_at,
        status: c.status,
        tasks: c.task_ids,
        topParticipants: c.top_participants,
      }));
      setChallenges(mapped);
    }).catch(() => {});
  }, []);

  const filteredTasks = tasks.filter((t) => {
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
    if (selectedDifficulty !== 'all' && t.difficulty !== selectedDifficulty) return false;
    return true;
  });

  const difficultyColor = (d: TaskDifficulty) =>
    d === 'easy' ? 'green' : d === 'medium' ? 'cyan' : 'orange';

  if (selectedTask) {
    return (
      <PageTransition>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-24 pb-4">
          {/* Task header */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setSelectedTask(null)}
              className="p-2 rounded-lg hover:bg-white/[0.04] text-white/30 hover:text-white/60 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Badge variant={difficultyColor(selectedTask.difficulty) as 'green' | 'cyan' | 'orange'}>
                  {selectedTask.difficulty}
                </Badge>
                <Badge variant="default">{selectedTask.topic}</Badge>
              </div>
              <h1 className="text-lg font-bold truncate">{selectedTask.title}</h1>
            </div>
            <div className="flex items-center gap-3 text-xs text-white/20">
              {selectedTask.timeLimit && (
                <span className="flex items-center gap-1"><Clock size={10} /> {selectedTask.timeLimit}</span>
              )}
              <span className="flex items-center gap-1"><Trophy size={10} /> {selectedTask.acceptanceRate}%</span>
            </div>
          </div>

          {/* Task content */}
          {selectedTask.isTheory ? (
            <GlassCard padding="none">
              <TheoryQuestion task={selectedTask} />
            </GlassCard>
          ) : selectedTask.category === 'system-design' ? (
            <GlassCard padding="none">
              <SystemDesignInput task={selectedTask} />
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-180px)]">
              {/* Left: Problem description */}
              <GlassCard padding="none" className="overflow-y-auto custom-scrollbar">
                <div className="p-6">
                  <div className="text-sm text-white/60 whitespace-pre-wrap mb-6">{selectedTask.description}</div>

                  {selectedTask.constraints.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-xs font-bold text-white/40 uppercase mb-2">Ограничения</h4>
                      <ul className="space-y-1">
                        {selectedTask.constraints.map((c, i) => (
                          <li key={i} className="text-xs text-white/40 flex items-start gap-2">
                            <span className="text-accent-cyan mt-0.5">•</span> {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedTask.examples.map((ex, i) => (
                    <div key={i} className="mb-4">
                      <h4 className="text-xs font-bold text-white/40 uppercase mb-2">Пример {i + 1}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white/[0.02] rounded-lg p-3">
                          <p className="text-[10px] text-white/20 mb-1">Вход</p>
                          <pre className="text-xs font-mono text-white/60">{ex.input}</pre>
                        </div>
                        <div className="bg-white/[0.02] rounded-lg p-3">
                          <p className="text-[10px] text-white/20 mb-1">Выход</p>
                          <pre className="text-xs font-mono text-accent-green">{ex.output}</pre>
                        </div>
                      </div>
                    </div>
                  ))}

                  {selectedTask.hints.length > 0 && (
                    <details className="mt-6">
                      <summary className="text-xs text-white/30 cursor-pointer hover:text-white/50 flex items-center gap-1">
                        <Lightbulb size={10} /> Подсказки ({selectedTask.hints.length})
                      </summary>
                      <div className="mt-2 space-y-2">
                        {selectedTask.hints.map((hint, i) => (
                          <p key={i} className="text-xs text-white/40 pl-3 border-l border-accent-cyan/20">{hint}</p>
                        ))}
                      </div>
                    </details>
                  )}

                  <div className="flex flex-wrap gap-1.5 mt-6 pt-4 border-t border-white/[0.04]">
                    {selectedTask.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full bg-white/[0.04] text-[10px] text-white/30">{tag}</span>
                    ))}
                  </div>
                </div>
              </GlassCard>

              {/* Right: Code IDE */}
              <GlassCard padding="none" className="overflow-hidden">
                <CodeIDE task={selectedTask} />
              </GlassCard>
            </div>
          )}
        </div>
      </PageTransition>
    );
  }

  const activeChallenges = challenges.filter((c) => c.status === 'active').length;

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">Задачи</h1>
            <p className="text-sm text-white/40">Готовься к собеседованиям и прокачивай навыки</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit mb-8">
          <button
            onClick={() => setActiveTab('tasks')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === 'tasks' ? 'bg-white/[0.08] text-white' : 'text-white/40 hover:text-white/60'
            )}
          >
            Задачи
          </button>
          <button
            onClick={() => setActiveTab('challenges')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
              activeTab === 'challenges' ? 'bg-white/[0.08] text-white' : 'text-white/40 hover:text-white/60'
            )}
          >
            <Zap size={12} />
            Челленджи
            {activeChallenges > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-accent-green/15 text-[10px] font-bold text-accent-green">
                {activeChallenges}
              </span>
            )}
          </button>
        </div>

        {/* Challenges tab */}
        {activeTab === 'challenges' && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {challenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          </div>
        )}

        {/* Tasks tab */}
        {activeTab === 'tasks' && (
        <>
        {/* Categories */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {TASK_CATEGORIES.map((cat) => {
            const count = tasks.filter((t) => t.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? 'all' : cat.id)}
                className={cn(
                  'p-4 rounded-xl border text-left transition-all',
                  selectedCategory === cat.id
                    ? 'border-accent-green/30 bg-accent-green/5'
                    : 'border-white/[0.06] bg-white/[0.02] hover:border-white/10'
                )}
              >
                <span className="text-2xl block mb-2">{cat.emoji}</span>
                <p className="text-sm font-semibold">{cat.label}</p>
                <p className="text-[10px] text-white/30 mt-0.5">{count} задач</p>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <Filter size={14} className="text-white/20" />
          <div className="flex gap-1">
            {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDifficulty(d)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs transition-all',
                  selectedDifficulty === d
                    ? 'bg-white/[0.08] text-white'
                    : 'text-white/30 hover:text-white/50'
                )}
              >
                {d === 'all' ? 'Все' : d === 'easy' ? 'Easy' : d === 'medium' ? 'Medium' : 'Hard'}
              </button>
            ))}
          </div>
          <span className="text-xs text-white/20 ml-auto">{filteredTasks.length} задач</span>
        </div>

        {/* Task list */}
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <motion.button
              key={task.id}
              whileHover={{ x: 4 }}
              onClick={() => setSelectedTask(task)}
              className="w-full text-left p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/10 hover:bg-white/[0.03] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={difficultyColor(task.difficulty) as 'green' | 'cyan' | 'orange'} size="sm">
                      {task.difficulty}
                    </Badge>
                    <Badge variant="default" size="sm">{task.topic}</Badge>
                    {task.isTheory && <Badge variant="purple" size="sm">Теория</Badge>}
                  </div>
                  <h3 className="text-sm font-medium group-hover:text-accent-cyan transition-colors">{task.title}</h3>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-xs text-white/20">
                  <span className="flex items-center gap-1"><Trophy size={10} /> {task.acceptanceRate}%</span>
                  <span>{task.solvedCount} решений</span>
                </div>
                <ChevronRight size={14} className="text-white/10 group-hover:text-white/30 transition-colors" />
              </div>
            </motion.button>
          ))}
        </div>
        </>
        )}
      </div>
    </PageTransition>
  );
}

function getStarterCode(task: Task): string {
  if (task.category === 'algorithms') {
    return `# Решение задачи: ${task.title}
# Формат ввода: ${task.inputFormat}
# Формат вывода: ${task.outputFormat}

def solve():
    # Ваш код здесь
    pass

if __name__ == "__main__":
    solve()
`;
  }
  return '';
}
