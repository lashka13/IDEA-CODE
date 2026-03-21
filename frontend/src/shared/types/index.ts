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

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverUrl: string;
  iconEmoji: string;
  memberCount: number;
  materialCount: number;
  activityScore: number;
  color: string;
  tags: string[];
  createdAt: string;
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

export interface Post {
  id: string;
  communityId: string;
  authorId: string;
  title: string;
  content: string;
  likesCount: number;
  commentsCount: number;
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
