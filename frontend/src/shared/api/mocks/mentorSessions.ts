export type SessionStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface MentorSession {
  id: string;
  mentorId: string;
  studentId: string;
  topic: string;
  comment: string;
  scheduledAt: string;
  durationMinutes: number;
  status: SessionStatus;
  price: number;
  roomId: string | null;
  createdAt: string;
}

export const mockMentorSessions: MentorSession[] = [
  {
    id: 'session-1',
    mentorId: 'mentor-1',
    studentId: 'user-1',
    topic: 'Подготовка к собеседованию',
    comment: 'Хочу подготовиться к собеседованию в Яндекс на фронтенд позицию',
    scheduledAt: '2025-01-20T18:00:00Z',
    durationMinutes: 60,
    status: 'pending',
    price: 80,
    roomId: null,
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    id: 'session-2',
    mentorId: 'mentor-1',
    studentId: 'user-2',
    topic: 'Code Review',
    comment: 'Нужна помощь с архитектурой React-приложения',
    scheduledAt: '2025-01-21T15:00:00Z',
    durationMinutes: 60,
    status: 'approved',
    price: 80,
    roomId: 'room-abc123',
    createdAt: '2025-01-14T12:00:00Z',
  },
  {
    id: 'session-3',
    mentorId: 'mentor-2',
    studentId: 'user-1',
    topic: 'Помощь с проектом',
    comment: 'ML пайплайн для рекомендательной системы',
    scheduledAt: '2025-01-19T16:00:00Z',
    durationMinutes: 60,
    status: 'completed',
    price: 100,
    roomId: 'room-xyz789',
    createdAt: '2025-01-12T09:00:00Z',
  },
];
