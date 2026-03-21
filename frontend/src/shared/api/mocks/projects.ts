export type ProjectStatus = 'recruiting' | 'in-progress' | 'review' | 'completed';
export type ProjectRole = 'frontend' | 'backend' | 'ml' | 'design' | 'devops' | 'pm' | 'qa' | 'mobile';

export interface ProjectMember {
  userId: string;
  role: ProjectRole;
  isTeamLead?: boolean;
}

export interface ProjectTeamSlot {
  role: ProjectRole;
  label: string;
  filled: number;
  total: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  status: ProjectStatus;
  mentorId: string;
  techStack: string[];
  teamSlots: ProjectTeamSlot[];
  members: ProjectMember[];
  githubUrl?: string;
  deadline: string;
  rewardCoins: number;
  tags: string[];
  createdAt: string;
  tasks: string[];
}

export const ROLE_LABELS: Record<ProjectRole, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  ml: 'ML Engineer',
  design: 'Дизайнер',
  devops: 'DevOps',
  pm: 'PM',
  qa: 'QA',
  mobile: 'Mobile',
};

export const ROLE_COLORS: Record<ProjectRole, string> = {
  frontend: '#3178C6',
  backend: '#00ADD8',
  ml: '#FF6F00',
  design: '#FF4081',
  devops: '#4CAF50',
  pm: '#9C27B0',
  qa: '#FF9800',
  mobile: '#E91E63',
};

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  recruiting: 'Набор команды',
  'in-progress': 'В разработке',
  review: 'На проверке',
  completed: 'Завершён',
};

export const mockProjects: Project[] = [
  {
    id: 'proj-1',
    title: 'Онлайн-магазин электроники',
    description: 'Полноценный e-commerce проект с каталогом товаров, корзиной, оплатой, личным кабинетом и админ-панелью. Интеграция с платёжной системой и службой доставки. Реализация поиска с фильтрами и рекомендательной системой на основе ML.',
    coverUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop&q=80',
    difficulty: 'intermediate',
    status: 'recruiting',
    mentorId: 'mentor-1',
    techStack: ['React', 'Node.js', 'PostgreSQL', 'Redis', 'Docker'],
    teamSlots: [
      { role: 'frontend', label: 'Frontend', filled: 1, total: 2 },
      { role: 'backend', label: 'Backend', filled: 0, total: 2 },
      { role: 'design', label: 'Дизайнер', filled: 1, total: 1 },
      { role: 'devops', label: 'DevOps', filled: 0, total: 1 },
      { role: 'ml', label: 'ML Engineer', filled: 0, total: 1 },
    ],
    members: [
      { userId: 'user-1', role: 'frontend', isTeamLead: true },
      { userId: 'user-6', role: 'design' },
    ],
    deadline: '2026-05-15',
    rewardCoins: 500,
    tags: ['E-commerce', 'Fullstack', 'ML Recommendations'],
    createdAt: '2026-03-10',
    tasks: [
      'Проектирование базы данных и API',
      'UI-кит и дизайн-система',
      'Каталог товаров с фильтрами',
      'Корзина и оформление заказа',
      'Интеграция платёжной системы',
      'Рекомендательная система',
      'CI/CD и деплой',
    ],
  },
  {
    id: 'proj-2',
    title: 'Платформа для онлайн-обучения',
    description: 'LMS-платформа с видеоуроками, тестами, системой прогресса и сертификатами. Интеграция с видеохостингом, real-time чат между студентами и преподавателями. Аналитика прохождения курсов.',
    coverUrl: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&h=400&fit=crop&q=80',
    difficulty: 'advanced',
    status: 'in-progress',
    mentorId: 'mentor-4',
    techStack: ['Next.js', 'Go', 'PostgreSQL', 'WebSocket', 'S3'],
    teamSlots: [
      { role: 'frontend', label: 'Frontend', filled: 2, total: 2 },
      { role: 'backend', label: 'Backend', filled: 2, total: 2 },
      { role: 'design', label: 'Дизайнер', filled: 1, total: 1 },
      { role: 'devops', label: 'DevOps', filled: 1, total: 1 },
    ],
    members: [
      { userId: 'user-1', role: 'frontend', isTeamLead: true },
      { userId: 'user-6', role: 'frontend' },
      { userId: 'user-3', role: 'backend' },
      { userId: 'user-7', role: 'backend' },
      { userId: 'user-4', role: 'design' },
      { userId: 'user-5', role: 'devops' },
    ],
    githubUrl: 'https://github.com/it-resource/edu-platform',
    deadline: '2026-04-30',
    rewardCoins: 800,
    tags: ['EdTech', 'Fullstack', 'WebSocket', 'Video Streaming'],
    createdAt: '2026-02-20',
    tasks: [
      'Архитектура микросервисов',
      'Система авторизации (OAuth)',
      'Видеоплеер и загрузка видео',
      'Система тестов и прогресса',
      'Real-time чат (WebSocket)',
      'Генерация сертификатов (PDF)',
      'Аналитический дашборд',
    ],
  },
  {
    id: 'proj-3',
    title: 'Трекер здоровья и фитнеса',
    description: 'Мобильное приложение для отслеживания тренировок, питания и сна. ML-модель для персональных рекомендаций по тренировкам. Интеграция с фитнес-браслетами через Bluetooth.',
    coverUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&h=400&fit=crop&q=80',
    difficulty: 'advanced',
    status: 'recruiting',
    mentorId: 'mentor-5',
    techStack: ['React Native', 'Python', 'FastAPI', 'TensorFlow', 'Firebase'],
    teamSlots: [
      { role: 'frontend', label: 'Mobile Dev', filled: 1, total: 2 },
      { role: 'backend', label: 'Backend', filled: 1, total: 1 },
      { role: 'ml', label: 'ML Engineer', filled: 0, total: 1 },
      { role: 'design', label: 'Дизайнер', filled: 0, total: 1 },
    ],
    members: [
      { userId: 'user-4', role: 'frontend', isTeamLead: true },
      { userId: 'user-7', role: 'backend' },
    ],
    deadline: '2026-06-01',
    rewardCoins: 600,
    tags: ['HealthTech', 'Mobile', 'ML', 'IoT'],
    createdAt: '2026-03-15',
    tasks: [
      'UI/UX дизайн мобильного приложения',
      'API для тренировок и питания',
      'ML-модель рекомендаций',
      'Интеграция Bluetooth (фитнес-браслеты)',
      'Push-уведомления',
      'Статистика и графики прогресса',
    ],
  },
  {
    id: 'proj-4',
    title: 'Чат-бот для техподдержки',
    description: 'AI-powered чат-бот для автоматизации техподдержки. NLP для понимания вопросов, интеграция с базой знаний, эскалация сложных вопросов к оператору. Аналитика обращений.',
    coverUrl: 'https://images.unsplash.com/photo-1531746790095-e5cb157f4be8?w=800&h=400&fit=crop&q=80',
    difficulty: 'intermediate',
    status: 'review',
    mentorId: 'mentor-2',
    techStack: ['Python', 'FastAPI', 'React', 'LangChain', 'PostgreSQL'],
    teamSlots: [
      { role: 'frontend', label: 'Frontend', filled: 1, total: 1 },
      { role: 'backend', label: 'Backend', filled: 1, total: 1 },
      { role: 'ml', label: 'ML/NLP Engineer', filled: 2, total: 2 },
    ],
    members: [
      { userId: 'user-2', role: 'ml', isTeamLead: true },
      { userId: 'user-5', role: 'ml' },
      { userId: 'user-6', role: 'frontend' },
      { userId: 'user-3', role: 'backend' },
    ],
    githubUrl: 'https://github.com/it-resource/support-bot',
    deadline: '2026-03-25',
    rewardCoins: 450,
    tags: ['AI', 'NLP', 'LangChain', 'Chatbot'],
    createdAt: '2026-01-15',
    tasks: [
      'Обучение NLP модели на FAQ',
      'API бэкенда с RAG',
      'UI чат-виджета',
      'Интеграция с базой знаний',
      'Система эскалации',
      'Аналитический дашборд',
    ],
  },
  {
    id: 'proj-5',
    title: 'Агрегатор мероприятий кампуса',
    description: 'Веб-приложение для поиска и создания мероприятий в кампусе. Календарь, фильтры по тематике, регистрация на события, QR-коды для посещения. Рейтинг организаторов.',
    coverUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop&q=80',
    difficulty: 'beginner',
    status: 'recruiting',
    mentorId: 'mentor-1',
    techStack: ['Vue.js', 'Node.js', 'MongoDB', 'Tailwind CSS'],
    teamSlots: [
      { role: 'frontend', label: 'Frontend', filled: 0, total: 2 },
      { role: 'backend', label: 'Backend', filled: 0, total: 1 },
      { role: 'design', label: 'Дизайнер', filled: 0, total: 1 },
    ],
    members: [],
    deadline: '2026-05-01',
    rewardCoins: 300,
    tags: ['Events', 'Campus', 'Vue.js', 'Начинающим'],
    createdAt: '2026-03-18',
    tasks: [
      'Дизайн интерфейса и UX-исследование',
      'API для мероприятий и регистрации',
      'Календарь и фильтры',
      'Генерация QR-кодов',
      'Система рейтинга',
    ],
  },
];
