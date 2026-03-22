import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

interface TourStep {
  title: string;
  description: string;
  emoji: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    emoji: '🎓',
    title: 'Добро пожаловать в GrowGrade!',
    description: 'Платформа для роста IT-специалистов с AI-анализом мышления, внутренней валютой CodeCoins и менторами.',
  },
  {
    emoji: '📚',
    title: 'Каталог курсов',
    description: 'Покупайте и изучайте курсы от других разработчиков. Фильтры по языку, сложности, формату. Комментарии с рейтингом.',
  },
  {
    emoji: '⚡',
    title: 'Задачи с реальным выполнением кода',
    description: 'Решайте алгоритмические задачи прямо в браузере. Код выполняется на сервере через Piston — поддержка Python, JS, Go, Java, C++.',
  },
  {
    emoji: '🤖',
    title: 'AI Code Review',
    description: 'После решения задачи AI-ментор анализирует ваш код: оценивает сложность алгоритма, предлагает оптимизации и лучшие практики.',
  },
  {
    emoji: '💬',
    title: 'Чат в реальном времени',
    description: 'WebSocket-чат с каналами по темам. Общайтесь с другими разработчиками, задавайте вопросы, делитесь опытом.',
  },
  {
    emoji: '🏗️',
    title: 'Проекты и сообщества',
    description: 'Присоединяйтесь к командным проектам, вступайте в сообщества по интересам. Менторы помогут с код-ревью.',
  },
  {
    emoji: '🗺️',
    title: 'Роадмапы обучения',
    description: 'Интерактивные карты развития: Frontend, Backend, DevOps. Отслеживайте прогресс и прокачивайте навыки по плану.',
  },
  {
    emoji: '🔍',
    title: 'AI-поиск по материалам (RAG)',
    description: 'Загружайте PDF — AI индексирует и отвечает на вопросы по содержимому. Гибридный поиск: BM25 + векторный + LLM.',
  },
];

const STORAGE_KEY = 'onboarding_completed';

export function OnboardingTour() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      const timer = setTimeout(() => setShow(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, '1');
  };

  const handleNext = () => {
    if (step < TOUR_STEPS.length - 1) setStep(step + 1);
    else handleClose();
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  if (!show) return null;

  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

        {/* Card */}
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', bounce: 0.3 }}
          className="relative w-full max-w-lg rounded-2xl border border-white/[0.08] bg-surface-900/95 shadow-2xl overflow-hidden"
        >
          {/* Gradient top bar */}
          <div className="h-1 bg-gradient-to-r from-accent-green via-accent-cyan to-purple-500" />

          {/* Close */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-colors"
          >
            <X size={16} />
          </button>

          {/* Content */}
          <div className="p-8 text-center">
            <motion.div
              key={`emoji-${step}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className="text-5xl mb-4"
            >
              {current.emoji}
            </motion.div>

            <h2 className="text-xl font-bold mb-3">{current.title}</h2>
            <p className="text-sm text-white/50 leading-relaxed mb-6 max-w-sm mx-auto">
              {current.description}
            </p>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-1.5 mb-6">
              {TOUR_STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step ? 'w-6 bg-accent-green' : i < step ? 'w-1.5 bg-accent-green/40' : 'w-1.5 bg-white/10'
                  }`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrev}
                disabled={step === 0}
                className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm transition-all ${
                  step === 0 ? 'text-white/10 cursor-not-allowed' : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
                }`}
              >
                <ChevronLeft size={14} /> Назад
              </button>

              <span className="text-[10px] text-white/20">{step + 1} / {TOUR_STEPS.length}</span>

              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-accent-green to-accent-cyan text-surface-900 hover:shadow-lg hover:shadow-accent-green/20 transition-all"
              >
                {isLast ? (
                  <><Sparkles size={14} /> Начать</>
                ) : (
                  <>Далее <ChevronRight size={14} /></>
                )}
              </button>
            </div>
          </div>

          {/* Skip */}
          <div className="px-8 pb-4 text-center">
            <button onClick={handleClose} className="text-[10px] text-white/20 hover:text-white/40 transition-colors">
              Пропустить тур
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
