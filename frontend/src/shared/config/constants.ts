export const APP_NAME = 'IT-RE:SOURCE';
export const CURRENCY_NAME = 'CodeCoins';
export const INITIAL_COINS = 50;

export const DIFFICULTY_LABELS = {
  junior: 'Junior',
  middle: 'Middle',
  senior: 'Senior',
} as const;

export const FORMAT_LABELS = {
  code: 'Код',
  article: 'Статья',
  video: 'Видео',
  presentation: 'Презентация',
} as const;

export const LANGUAGE_COLORS: Record<string, string> = {
  python: '#3776AB',
  javascript: '#F7DF1E',
  typescript: '#3178C6',
  java: '#ED8B00',
  go: '#00ADD8',
  rust: '#CE422B',
};
