export type EventType = 'stream' | 'webinar' | 'workshop' | 'q-and-a';

export interface ScheduleEvent {
  id: string;
  title: string;
  description: string;
  type: EventType;
  materialId: string;
  materialTitle: string;
  hostName: string;
  hostAvatarUrl: string;
  coverUrl: string;
  startsAt: string;
  durationMinutes: number;
  isLive: boolean;
  participantsCount: number;
  maxParticipants: number | null;
  tags: string[];
  recordingAvailable: boolean;
}

export const mockScheduleEvents: ScheduleEvent[] = [
  {
    id: 'ev-1',
    title: 'React Hooks Deep Dive: Live-кодинг',
    description: 'Пишем кастомные хуки в реальном времени. Разберём useDebouncedValue, useIntersectionObserver и useWebSocket.',
    type: 'stream',
    materialId: 'mat-1',
    materialTitle: 'React Hooks: Полное руководство',
    hostName: 'Алексей Петров',
    hostAvatarUrl: 'https://i.pravatar.cc/150?img=11',
    coverUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop&q=80',
    startsAt: '2025-01-16T18:00:00Z',
    durationMinutes: 90,
    isLive: true,
    participantsCount: 34,
    maxParticipants: null,
    tags: ['React', 'Hooks', 'Live-coding'],
    recordingAvailable: false,
  },
  {
    id: 'ev-2',
    title: 'Docker: Multi-stage builds на практике',
    description: 'Вебинар по оптимизации Docker-образов. Покажу, как уменьшить образ Node.js приложения с 1.2GB до 50MB.',
    type: 'webinar',
    materialId: 'mat-2',
    materialTitle: 'Docker для начинающих: от 0 до деплоя',
    hostName: 'Дмитрий Волков',
    hostAvatarUrl: 'https://i.pravatar.cc/150?img=12',
    coverUrl: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&h=400&fit=crop&q=80',
    startsAt: '2025-01-17T15:00:00Z',
    durationMinutes: 60,
    isLive: false,
    participantsCount: 18,
    maxParticipants: 50,
    tags: ['Docker', 'DevOps', 'Optimization'],
    recordingAvailable: false,
  },
  {
    id: 'ev-3',
    title: 'ML Pipeline: от данных до продакшна',
    description: 'Воркшоп: строим полный ML-пайплайн. Feature engineering, обучение модели, валидация и деплой через FastAPI.',
    type: 'workshop',
    materialId: 'mat-4',
    materialTitle: 'Machine Learning с нуля на Python',
    hostName: 'Мария Козлова',
    hostAvatarUrl: 'https://i.pravatar.cc/150?img=5',
    coverUrl: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=400&fit=crop&q=80',
    startsAt: '2025-01-18T12:00:00Z',
    durationMinutes: 120,
    isLive: false,
    participantsCount: 42,
    maxParticipants: 100,
    tags: ['ML', 'Python', 'Workshop'],
    recordingAvailable: false,
  },
  {
    id: 'ev-4',
    title: 'Q&A: Карьера в Frontend 2025',
    description: 'Отвечаю на вопросы подписчиков. Что учить, как проходить собеседования, зарплатные ожидания.',
    type: 'q-and-a',
    materialId: 'mat-1',
    materialTitle: 'React Hooks: Полное руководство',
    hostName: 'Алексей Петров',
    hostAvatarUrl: 'https://i.pravatar.cc/150?img=11',
    coverUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=400&fit=crop&q=80',
    startsAt: '2025-01-19T19:00:00Z',
    durationMinutes: 60,
    isLive: false,
    participantsCount: 67,
    maxParticipants: null,
    tags: ['Career', 'Frontend', 'Q&A'],
    recordingAvailable: false,
  },
  {
    id: 'ev-5',
    title: 'TypeScript: Advanced Types мастер-класс',
    description: 'Conditional types, template literal types, infer, mapped types. Пишем type-safe API-клиент.',
    type: 'stream',
    materialId: 'mat-7',
    materialTitle: 'TypeScript: Продвинутый уровень',
    hostName: 'Иван Сидоров',
    hostAvatarUrl: 'https://i.pravatar.cc/150?img=13',
    coverUrl: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&h=400&fit=crop&q=80',
    startsAt: '2025-01-20T17:00:00Z',
    durationMinutes: 90,
    isLive: false,
    participantsCount: 25,
    maxParticipants: null,
    tags: ['TypeScript', 'Advanced', 'Types'],
    recordingAvailable: false,
  },
  {
    id: 'ev-6',
    title: 'Алгоритмы: разбор задач FAANG',
    description: 'Решаем 5 реальных задач с собеседований в Google и Яндекс. BFS, DP, sliding window.',
    type: 'stream',
    materialId: 'mat-5',
    materialTitle: 'Алгоритмы и структуры данных',
    hostName: 'Дмитрий Волков',
    hostAvatarUrl: 'https://i.pravatar.cc/150?img=12',
    coverUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&h=400&fit=crop&q=80',
    startsAt: '2025-01-15T18:00:00Z',
    durationMinutes: 120,
    isLive: false,
    participantsCount: 89,
    maxParticipants: null,
    tags: ['Algorithms', 'Interview', 'FAANG'],
    recordingAvailable: true,
  },
  {
    id: 'ev-7',
    title: 'CI/CD с GitHub Actions: hands-on',
    description: 'Настраиваем пайплайн для React-приложения: линтинг, тесты, билд, деплой на Vercel.',
    type: 'workshop',
    materialId: 'mat-2',
    materialTitle: 'Docker для начинающих: от 0 до деплоя',
    hostName: 'Дмитрий Волков',
    hostAvatarUrl: 'https://i.pravatar.cc/150?img=12',
    coverUrl: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&h=400&fit=crop&q=80',
    startsAt: '2025-01-21T16:00:00Z',
    durationMinutes: 90,
    isLive: false,
    participantsCount: 31,
    maxParticipants: 40,
    tags: ['CI/CD', 'GitHub Actions', 'DevOps'],
    recordingAvailable: false,
  },
];
