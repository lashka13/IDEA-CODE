export interface Material {
  id: string;
  title: string;
  description: string;
  authorId: string;
  coverUrl: string;
  price: number;
  rating: number;
  ratingCount: number;
  purchaseCount: number;
  language: Language;
  technology: string[];
  difficulty: Difficulty;
  format: Format;
  taskType: TaskType;
  tags: string[];
  tableOfContents: string[];
  /** Relative path e.g. /uploads/xxx.pdf for RAG / Smart Search */
  pdfUrl?: string | null;
  communityId?: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  bio: string;
  rating: number;
  codeCoins: number;
  level: number;
  levelTitle: string;
  techStack: string[];
  skills: Record<string, number>;
  achievementIds: string[];
  joinedAt: string;
  uploadsCount: number;
  purchasesCount: number;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'purchase' | 'sale' | 'royalty' | 'reward' | 'challenge-prize';
  amount: number;
  description: string;
  materialId?: string;
  createdAt: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: string;
}

export interface Comment {
  id: string;
  materialId: string;
  authorId: string;
  text: string;
  rating: number;
  createdAt: string;
}

export type Language = 'python' | 'javascript' | 'typescript' | 'java' | 'go' | 'rust';
export type Difficulty = 'junior' | 'middle' | 'senior';
export type Format = 'code' | 'article' | 'video' | 'presentation';
export type TaskType = 'lab' | 'coursework' | 'pet-project' | 'cheatsheet' | 'lecture-notes';
export type SortBy = 'date' | 'rating' | 'price-asc' | 'price-desc' | 'popular';

// Course content types
export type LessonContentType = 'video' | 'text' | 'code' | 'quiz';

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
}

export interface LessonContent {
  type: LessonContentType;
  title?: string;
  body?: string;
  videoUrl?: string;
  videoDuration?: string;
  code?: string;
  codeLanguage?: string;
  quiz?: QuizQuestion[];
}

export interface Lesson {
  id: string;
  materialId: string;
  order: number;
  title: string;
  duration: string;
  contents: LessonContent[];
  isPreview?: boolean;
}

export interface CourseProgress {
  lessonId: string;
  completed: boolean;
  quizScore?: number;
  quizTotal?: number;
}

// ── Mentors ───────────────────────────────────────────────────

export interface Mentor {
  id: string;
  name: string;
  avatarUrl: string;
  title: string;
  company: string;
  experience: string;
  bio: string;
  techStack: string[];
  rating: number;
  reviewCount: number;
  sessionsCompleted: number;
  pricePerHour: number;
  available: boolean;
  specializations: string[];
  languages: string[];
}

// ── Tasks & Challenges ────────────────────────────────────────

export type TaskDifficulty = 'easy' | 'medium' | 'hard';
export type TaskCategory = 'algorithms' | 'math' | 'theory' | 'system-design';

export interface TaskTestCase {
  input: string;
  output: string;
  hidden?: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  topic: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  examples: TaskTestCase[];
  hiddenTests: TaskTestCase[];
  timeLimit: string;
  memoryLimit: string;
  solvedCount: number;
  totalAttempts: number;
  acceptanceRate: number;
  tags: string[];
  hints: string[];
  isTheory?: boolean;
  options?: { id: string; text: string }[];
  correctOptionId?: string;
  explanation?: string;
}

export const TASK_CATEGORIES: { id: TaskCategory; label: string; emoji: string; description: string }[] = [
  { id: 'algorithms', label: 'Алгоритмы', emoji: '⚡', description: 'Структуры данных, сортировки, графы, DP' },
  { id: 'math', label: 'Математика', emoji: '📐', description: 'Дискретная математика, линейная алгебра, теория вероятностей' },
  { id: 'theory', label: 'Теория', emoji: '📚', description: 'Docker, Git, OS, сети, базы данных' },
  { id: 'system-design', label: 'System Design', emoji: '🏗️', description: 'Проектирование систем, архитектура' },
];

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

// ── Schedule ──────────────────────────────────────────────────

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

// ── Projects ──────────────────────────────────────────────────

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

// ── Roadmap ───────────────────────────────────────────────────

export interface RoadmapNode {
  id: string;
  title: string;
  description: string;
  category: 'fundamentals' | 'frontend' | 'backend' | 'devops' | 'data' | 'soft-skills';
  difficulty: 'junior' | 'middle' | 'senior';
  skills: string[];
  materialIds: string[];
  dependencies: string[];
  estimatedHours: number;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  progress: number;
}

export interface RoadmapTrack {
  id: string;
  title: string;
  description: string;
  emoji: string;
  color: string;
  nodes: RoadmapNode[];
}

// ── Notifications ─────────────────────────────────────────────

export interface AppNotification {
  id: string;
  type: 'purchase' | 'sale' | 'chat' | 'project' | 'mentor' | 'achievement' | 'challenge' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}
