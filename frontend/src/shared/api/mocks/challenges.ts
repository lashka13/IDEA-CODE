export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'weekly' | 'daily' | 'special';
  difficulty: 'junior' | 'middle' | 'senior';
  category: string;
  prizePool: number;
  participantsCount: number;
  maxParticipants: number | null;
  startsAt: string;
  endsAt: string;
  status: 'upcoming' | 'active' | 'ended';
  tasks: string[];
  topParticipants: { userId: string; score: number }[];
}

export const mockChallenges: Challenge[] = [
  {
    id: 'ch1',
    title: 'Алгоритмическая неделя',
    description: 'Решите 7 алгоритмических задач за неделю. Лучшие по скорости и оптимальности получат призы!',
    type: 'weekly',
    difficulty: 'middle',
    category: 'Алгоритмы',
    prizePool: 500,
    participantsCount: 47,
    maxParticipants: null,
    startsAt: '2025-01-13T00:00:00Z',
    endsAt: '2025-01-20T00:00:00Z',
    status: 'active',
    tasks: ['Two Sum', 'Binary Search', 'Merge Sort', 'BFS/DFS', 'Dynamic Programming', 'Sliding Window', 'Graph Shortest Path'],
    topParticipants: [
      { userId: 'user-1', score: 950 },
      { userId: 'user-2', score: 870 },
      { userId: 'user-4', score: 820 },
    ],
  },
  {
    id: 'ch2',
    title: 'Docker Challenge',
    description: 'Контейнеризируйте приложение, настройте multi-stage build и CI/CD пайплайн.',
    type: 'weekly',
    difficulty: 'senior',
    category: 'DevOps',
    prizePool: 750,
    participantsCount: 23,
    maxParticipants: 50,
    startsAt: '2025-01-13T00:00:00Z',
    endsAt: '2025-01-20T00:00:00Z',
    status: 'active',
    tasks: ['Dockerfile basics', 'Multi-stage build', 'Docker Compose', 'CI/CD pipeline', 'Monitoring setup'],
    topParticipants: [
      { userId: 'user-3', score: 980 },
      { userId: 'user-5', score: 910 },
    ],
  },
  {
    id: 'ch3',
    title: 'React Мастер',
    description: 'Создайте 5 React-компонентов по ТЗ. Оценка по чистоте кода, производительности и UX.',
    type: 'weekly',
    difficulty: 'middle',
    category: 'Frontend',
    prizePool: 600,
    participantsCount: 62,
    maxParticipants: null,
    startsAt: '2025-01-20T00:00:00Z',
    endsAt: '2025-01-27T00:00:00Z',
    status: 'upcoming',
    tasks: ['Custom Hook', 'Virtualized List', 'Form Builder', 'Drag & Drop', 'Chart Component'],
    topParticipants: [],
  },
  {
    id: 'ch4',
    title: 'SQL Марафон',
    description: 'Серия из 10 SQL-задач нарастающей сложности. От простых SELECT до оконных функций.',
    type: 'weekly',
    difficulty: 'junior',
    category: 'Базы данных',
    prizePool: 400,
    participantsCount: 89,
    maxParticipants: null,
    startsAt: '2025-01-06T00:00:00Z',
    endsAt: '2025-01-13T00:00:00Z',
    status: 'ended',
    tasks: ['SELECT basics', 'JOINs', 'Subqueries', 'GROUP BY', 'Window functions', 'CTEs', 'Indexes', 'Transactions', 'Optimization', 'Final boss'],
    topParticipants: [
      { userId: 'user-2', score: 1000 },
      { userId: 'user-6', score: 960 },
      { userId: 'user-1', score: 940 },
    ],
  },
  {
    id: 'ch5',
    title: 'Дневной спринт: FizzBuzz вариации',
    description: 'Решите 3 вариации FizzBuzz за 1 час. Кто быстрее — тот забирает приз!',
    type: 'daily',
    difficulty: 'junior',
    category: 'Алгоритмы',
    prizePool: 100,
    participantsCount: 134,
    maxParticipants: null,
    startsAt: '2025-01-15T10:00:00Z',
    endsAt: '2025-01-15T11:00:00Z',
    status: 'ended',
    tasks: ['Classic FizzBuzz', 'FizzBuzz Tree', 'FizzBuzz Matrix'],
    topParticipants: [
      { userId: 'user-4', score: 300 },
      { userId: 'user-1', score: 290 },
    ],
  },
];
