import { type Achievement } from '../../types';

export const mockAchievements: Achievement[] = [
  { id: 'ach-1', name: 'Первый шаг', description: 'Зарегистрируйся на платформе', icon: '🎯', rarity: 'common', unlockedAt: '2025-09-01' },
  { id: 'ach-2', name: 'Автор', description: 'Загрузи свой первый материал', icon: '✍️', rarity: 'common', unlockedAt: '2025-09-05' },
  { id: 'ach-3', name: 'Популярный автор', description: '10+ покупок твоего материала', icon: '🔥', rarity: 'rare', unlockedAt: '2025-10-01' },
  { id: 'ach-4', name: 'Мега-эксперт', description: 'Загрузи 10+ материалов', icon: '🏆', rarity: 'epic', unlockedAt: '2025-11-15' },
  { id: 'ach-5', name: 'Ценный кадр', description: 'Рейтинг 4.8+ при 20+ оценках', icon: '💎', rarity: 'epic', unlockedAt: '2026-01-01' },
  { id: 'ach-6', name: 'Сообщество', description: 'Вступи в 3 сообщества', icon: '🤝', rarity: 'common' },
  { id: 'ach-7', name: 'Автор месяца', description: 'Стань топ-1 автором недели', icon: '👑', rarity: 'legendary', unlockedAt: '2026-02-01' },
  { id: 'ach-8', name: 'Легенда', description: '1000+ CodeCoins заработано', icon: '🌟', rarity: 'legendary', unlockedAt: '2026-03-01' },
  { id: 'ach-9', name: 'Челленджер', description: 'Выиграй челлендж сообщества', icon: '⚡', rarity: 'rare' },
  { id: 'ach-10', name: 'Книжный червь', description: 'Купи 50+ материалов', icon: '📚', rarity: 'epic' },
];
