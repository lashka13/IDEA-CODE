export interface ChatChannel {
  id: string;
  name: string;
  emoji: string;
  description: string;
  type: 'general' | 'topic';
  topic?: string;
  memberCount: number;
  lastActivity: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  authorId: string;
  text: string;
  createdAt: string;
  replyTo?: string;
  reactions?: { emoji: string; count: number }[];
}

export const mockChannels: ChatChannel[] = [
  {
    id: 'ch-general',
    name: 'Общий',
    emoji: '💬',
    description: 'Общий чат для всех участников платформы',
    type: 'general',
    memberCount: 1247,
    lastActivity: '2026-03-21T14:30:00Z',
  },
  {
    id: 'ch-offtop',
    name: 'Оффтоп',
    emoji: '🎭',
    description: 'Мемы, обсуждения и всё не по теме',
    type: 'general',
    memberCount: 890,
    lastActivity: '2026-03-21T14:25:00Z',
  },
  {
    id: 'ch-jobs',
    name: 'Вакансии и стажировки',
    emoji: '💼',
    description: 'Вакансии, стажировки и фриланс для студентов',
    type: 'general',
    memberCount: 654,
    lastActivity: '2026-03-21T13:10:00Z',
  },
  {
    id: 'ch-frontend',
    name: 'Frontend',
    emoji: '⚛️',
    description: 'React, Vue, Angular, CSS, браузерные API',
    type: 'topic',
    topic: 'frontend',
    memberCount: 342,
    lastActivity: '2026-03-21T14:28:00Z',
  },
  {
    id: 'ch-backend',
    name: 'Backend',
    emoji: '🖥️',
    description: 'Java, Python, Go, Node.js, базы данных',
    type: 'topic',
    topic: 'backend',
    memberCount: 298,
    lastActivity: '2026-03-21T14:15:00Z',
  },
  {
    id: 'ch-devops',
    name: 'DevOps',
    emoji: '🐳',
    description: 'Docker, K8s, CI/CD, облака, Linux',
    type: 'topic',
    topic: 'devops',
    memberCount: 187,
    lastActivity: '2026-03-21T12:40:00Z',
  },
  {
    id: 'ch-ml',
    name: 'Data Science & ML',
    emoji: '🧠',
    description: 'Нейросети, Pandas, ML, аналитика данных',
    type: 'topic',
    topic: 'ml',
    memberCount: 231,
    lastActivity: '2026-03-21T13:55:00Z',
  },
  {
    id: 'ch-mobile',
    name: 'Mobile Dev',
    emoji: '📱',
    description: 'Kotlin, Swift, Flutter, React Native',
    type: 'topic',
    topic: 'mobile',
    memberCount: 145,
    lastActivity: '2026-03-21T11:20:00Z',
  },
  {
    id: 'ch-security',
    name: 'CyberSec',
    emoji: '🔐',
    description: 'CTF, пентест, безопасность, криптография',
    type: 'topic',
    topic: 'security',
    memberCount: 112,
    lastActivity: '2026-03-21T10:45:00Z',
  },
];

export const mockMessages: ChatMessage[] = [
  // General channel messages
  {
    id: 'msg-1',
    channelId: 'ch-general',
    authorId: 'user-1',
    text: 'Привет всем! Кто-нибудь проходил стажировку в T-Bank? Как там с ревью кода?',
    createdAt: '2026-03-21T14:30:00Z',
    reactions: [{ emoji: '👋', count: 5 }, { emoji: '🤔', count: 2 }],
  },
  {
    id: 'msg-2',
    channelId: 'ch-general',
    authorId: 'user-3',
    text: 'Да, проходил летом. Ревью очень подробные, менторы дают фидбек по каждому PR. Рекомендую!',
    createdAt: '2026-03-21T14:28:00Z',
    replyTo: 'msg-1',
    reactions: [{ emoji: '🔥', count: 8 }, { emoji: '❤️', count: 3 }],
  },
  {
    id: 'msg-3',
    channelId: 'ch-general',
    authorId: 'user-5',
    text: 'У меня завтра финальное собеседование в Яндекс. Кто-нибудь знает, какие алго задачи дают на System Design раунде?',
    createdAt: '2026-03-21T14:15:00Z',
    reactions: [{ emoji: '🍀', count: 12 }],
  },
  {
    id: 'msg-4',
    channelId: 'ch-general',
    authorId: 'user-2',
    text: 'Обычно дают спроектировать что-то типа URL shortener или чат-систему. Советую посмотреть курс по System Design на платформе — там есть разбор таких задач',
    createdAt: '2026-03-21T14:10:00Z',
    replyTo: 'msg-3',
  },
  {
    id: 'msg-5',
    channelId: 'ch-general',
    authorId: 'user-4',
    text: 'Ребят, загрузил новый конспект по Flutter — 8 часов работы, но вышло огонь 🔥 Буду рад фидбеку',
    createdAt: '2026-03-21T13:45:00Z',
    reactions: [{ emoji: '🔥', count: 6 }, { emoji: '👀', count: 4 }],
  },
  {
    id: 'msg-6',
    channelId: 'ch-general',
    authorId: 'user-7',
    text: 'Только что узнал, что МИСИС запускает хакатон совместно с T-Bank на следующей неделе. Кто формирует команду?',
    createdAt: '2026-03-21T13:20:00Z',
    reactions: [{ emoji: '🚀', count: 15 }, { emoji: '🙋', count: 9 }],
  },
  {
    id: 'msg-7',
    channelId: 'ch-general',
    authorId: 'user-6',
    text: 'Мы ищем фронтендера в команду! Стек: React + TypeScript. Пишите в личку 👋',
    createdAt: '2026-03-21T13:15:00Z',
    replyTo: 'msg-6',
  },
  {
    id: 'msg-8',
    channelId: 'ch-general',
    authorId: 'user-8',
    text: 'Кстати, кто-нибудь пробовал новый AI-ассистент для кода от Anthropic? Claude очень хорошо пишет код',
    createdAt: '2026-03-21T12:50:00Z',
    reactions: [{ emoji: '🤖', count: 7 }, { emoji: '👍', count: 11 }],
  },

  // Frontend channel
  {
    id: 'msg-f1',
    channelId: 'ch-frontend',
    authorId: 'user-1',
    text: 'Вопрос: стоит ли переходить с Redux Toolkit на Zustand для нового проекта? Какие плюсы/минусы?',
    createdAt: '2026-03-21T14:28:00Z',
    reactions: [{ emoji: '🤔', count: 4 }],
  },
  {
    id: 'msg-f2',
    channelId: 'ch-frontend',
    authorId: 'user-6',
    text: 'Zustand проще, меньше бойлерплейта. Но RTK Query для серверного стейта — лучше. Я использую Zustand для UI-стейта + React Query для API',
    createdAt: '2026-03-21T14:20:00Z',
    replyTo: 'msg-f1',
    reactions: [{ emoji: '💡', count: 8 }],
  },
  {
    id: 'msg-f3',
    channelId: 'ch-frontend',
    authorId: 'user-4',
    text: 'Кто работал с новым React Compiler? Действительно убирает необходимость в useMemo/useCallback?',
    createdAt: '2026-03-21T13:40:00Z',
  },
  {
    id: 'msg-f4',
    channelId: 'ch-frontend',
    authorId: 'user-1',
    text: 'Да, но пока только в экспериментальном режиме. В проде лучше подождать стабильного релиза. Пока мемоизируем руками',
    createdAt: '2026-03-21T13:35:00Z',
    replyTo: 'msg-f3',
  },

  // Backend channel
  {
    id: 'msg-b1',
    channelId: 'ch-backend',
    authorId: 'user-3',
    text: 'Собрал бенчмарк: Go HTTP сервер обрабатывает 150k req/s vs Node.js 45k req/s на одном ядре. Код в моём конспекте',
    createdAt: '2026-03-21T14:15:00Z',
    reactions: [{ emoji: '🔥', count: 14 }, { emoji: '🚀', count: 6 }],
  },
  {
    id: 'msg-b2',
    channelId: 'ch-backend',
    authorId: 'user-7',
    text: 'Подскажите лучшую стратегию миграций для PostgreSQL в Spring Boot проекте — Flyway или Liquibase?',
    createdAt: '2026-03-21T13:50:00Z',
  },
  {
    id: 'msg-b3',
    channelId: 'ch-backend',
    authorId: 'user-3',
    text: 'Flyway — проще, SQL-based. Liquibase — мощнее, XML/YAML/JSON. Для студенческого проекта Flyway за глаза',
    createdAt: '2026-03-21T13:45:00Z',
    replyTo: 'msg-b2',
    reactions: [{ emoji: '👍', count: 5 }],
  },

  // ML channel
  {
    id: 'msg-m1',
    channelId: 'ch-ml',
    authorId: 'user-2',
    text: 'Ребят, выложил ноутбук с fine-tuning BERT для классификации текстов на русском. Accuracy 94% на RuSentiment 🎯',
    createdAt: '2026-03-21T13:55:00Z',
    reactions: [{ emoji: '🔥', count: 11 }, { emoji: '🧠', count: 5 }],
  },
  {
    id: 'msg-m2',
    channelId: 'ch-ml',
    authorId: 'user-5',
    text: 'Какой GPU использовал? У меня на Colab T4 обучение занимает 2 часа',
    createdAt: '2026-03-21T13:50:00Z',
    replyTo: 'msg-m1',
  },

  // DevOps channel
  {
    id: 'msg-d1',
    channelId: 'ch-devops',
    authorId: 'user-3',
    text: 'Совет дня: используйте `docker compose watch` вместо volumes для hot-reload. Работает стабильнее и не течёт inotify на Linux',
    createdAt: '2026-03-21T12:40:00Z',
    reactions: [{ emoji: '💡', count: 9 }, { emoji: '🙏', count: 4 }],
  },
];
