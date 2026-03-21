export interface AppNotification {
  id: string;
  type: 'purchase' | 'sale' | 'chat' | 'project' | 'mentor' | 'achievement' | 'challenge' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export const mockNotifications: AppNotification[] = [
  {
    id: 'n1',
    type: 'sale',
    title: 'Новая продажа!',
    message: 'Ваш курс «React Hooks: Полное руководство» купил пользователь @ivan_dev',
    read: false,
    createdAt: '2025-01-15T14:30:00Z',
    link: '/wallet',
  },
  {
    id: 'n2',
    type: 'chat',
    title: 'Новое сообщение',
    message: 'Мария Козлова написала в #frontend: «Кто-нибудь работал с Zustand?»',
    read: false,
    createdAt: '2025-01-15T13:15:00Z',
    link: '/chat',
  },
  {
    id: 'n3',
    type: 'project',
    title: 'Приглашение в проект',
    message: 'Вас пригласили в проект «AI-Ассистент» на роль Frontend-разработчика',
    read: false,
    createdAt: '2025-01-15T11:00:00Z',
    link: '/projects',
  },
  {
    id: 'n4',
    type: 'mentor',
    title: 'Сессия подтверждена',
    message: 'Алексей Петров подтвердил менторскую сессию на завтра в 18:00',
    read: false,
    createdAt: '2025-01-14T20:00:00Z',
    link: '/mentors',
  },
  {
    id: 'n5',
    type: 'achievement',
    title: 'Новое достижение!',
    message: 'Вы получили бейдж «Первая покупка» — купите свой первый материал',
    read: true,
    createdAt: '2025-01-14T16:00:00Z',
    link: '/profile',
  },
  {
    id: 'n6',
    type: 'challenge',
    title: 'Челлендж стартовал!',
    message: 'Еженедельный челлендж «Алгоритмическая неделя» начался. Призовой фонд: 500 CC',
    read: true,
    createdAt: '2025-01-14T10:00:00Z',
    link: '/tasks',
  },
  {
    id: 'n7',
    type: 'purchase',
    title: 'Материал куплен',
    message: 'Вы приобрели «Docker: Контейнеризация от А до Я» за 35 CC',
    read: true,
    createdAt: '2025-01-13T15:00:00Z',
    link: '/catalog/2',
  },
  {
    id: 'n8',
    type: 'system',
    title: 'Обновление платформы',
    message: 'Добавлены задачи для подготовки к собеседованиям и менторская программа!',
    read: true,
    createdAt: '2025-01-12T09:00:00Z',
  },
];
