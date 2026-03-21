import { type Comment } from '../../types';

export const mockComments: Comment[] = [
  // React Hooks (mat-1) — 5 отзывов
  { id: 'com-1', materialId: 'mat-1', authorId: 'user-2', text: 'Отличный конспект! Наконец-то понял useCallback и когда его реально нужно использовать. Раздел про кастомные хуки — огонь 🔥', rating: 5, createdAt: '2026-01-20T14:30:00' },
  { id: 'com-2', materialId: 'mat-1', authorId: 'user-3', text: 'Хорошо структурировано. Хотелось бы чуть больше примеров с useReducer для сложных форм, но в целом лучший материал по хукам на платформе.', rating: 4, createdAt: '2026-01-22T09:15:00' },
  { id: 'com-3', materialId: 'mat-1', authorId: 'user-4', text: 'Очень помогло на проекте! Особенно раздел про мемоизацию — сократила количество ре-рендеров на 40%.', rating: 5, createdAt: '2026-02-01T16:00:00' },
  { id: 'com-11', materialId: 'mat-1', authorId: 'user-6', text: 'Как UI-разработчик подтверждаю — все паттерны рабочие. Использую Compound Components из 7й главы в каждом проекте.', rating: 5, createdAt: '2026-02-10T11:30:00' },
  { id: 'com-12', materialId: 'mat-1', authorId: 'user-5', text: 'Раздел по React 19 хукам — единственный качественный материал на русском. Стоит своих монет однозначно.', rating: 5, createdAt: '2026-02-18T15:45:00' },

  // Docker (mat-2) — 4 отзыва
  { id: 'com-4', materialId: 'mat-2', authorId: 'user-1', text: 'Лучший гайд по Docker. Чётко, по делу, без воды. Финальный проект с full-stack деплоем — просто подарок. Задеплоил свой пет-проект за вечер!', rating: 5, createdAt: '2026-02-05T11:00:00' },
  { id: 'com-5', materialId: 'mat-2', authorId: 'user-5', text: 'Для начинающих — самое то. Multi-stage builds наконец стали понятны. Образ уменьшился с 1.2GB до 89MB!', rating: 5, createdAt: '2026-02-10T13:45:00' },
  { id: 'com-13', materialId: 'mat-2', authorId: 'user-7', text: 'Использовал для подготовки к собесу. Половину вопросов по Docker ответил именно благодаря этому материалу.', rating: 5, createdAt: '2026-02-20T09:00:00' },
  { id: 'com-14', materialId: 'mat-2', authorId: 'user-4', text: 'Можно было бы добавить раздел про Docker Swarm для сравнения с K8s. Но за эту цену — шикарно.', rating: 4, createdAt: '2026-03-01T14:20:00' },

  // ML (mat-3) — 3 отзыва
  { id: 'com-6', materialId: 'mat-3', authorId: 'user-1', text: 'Сложновато для абсолютного новичка в ML, но если есть базовый Python — идеально. Jupyter-ноутбуки с визуализациями 🎨', rating: 4, createdAt: '2026-02-15T10:30:00' },
  { id: 'com-7', materialId: 'mat-3', authorId: 'user-5', text: 'Финальный проект с предсказанием оттока — реально полезный, добавил в портфолио. Хотелось бы ещё feature engineering.', rating: 4, createdAt: '2026-02-20T14:00:00' },
  { id: 'com-15', materialId: 'mat-3', authorId: 'user-7', text: 'XGBoost и LightGBM объяснены лучше, чем в платных курсах на Stepik. Маша, ты лучшая!', rating: 5, createdAt: '2026-03-05T16:30:00' },

  // Spring Boot (mat-4) — 2 отзыва
  { id: 'com-24', materialId: 'mat-4', authorId: 'user-1', text: 'Testcontainers для интеграционных тестов — жемчужина этого курса. Раньше мокал всё вручную, теперь живу в другом мире.', rating: 5, createdAt: '2026-01-15T10:00:00' },
  { id: 'com-25', materialId: 'mat-4', authorId: 'user-3', text: 'JWT раздел хороший, но для прода лучше использовать Spring Security + OAuth2. В целом — отличный старт.', rating: 4, createdAt: '2026-01-20T14:00:00' },

  // CTF (mat-5) — 2 отзыва
  { id: 'com-8', materialId: 'mat-5', authorId: 'user-3', text: 'Реально полезные разборы. Готовлюсь к CTF нашего вуза — этот материал как шпаргалка. Time-based SQLi — теперь моя любимая техника.', rating: 5, createdAt: '2026-03-01T09:00:00' },
  { id: 'com-16', materialId: 'mat-5', authorId: 'user-1', text: 'Даже как фронтендер нашёл полезное — теперь знаю как защищаться от XSS в React. Спасибо за примеры обхода CSP!', rating: 4, createdAt: '2026-03-10T12:00:00' },

  // CSS Grid (mat-7) — 3 отзыва
  { id: 'com-9', materialId: 'mat-7', authorId: 'user-4', text: 'Повесила на стену рядом с монитором! Каждый день пользуюсь. Grid areas — раньше всегда забывала синтаксис 😄', rating: 5, createdAt: '2026-01-10T15:00:00' },
  { id: 'com-17', materialId: 'mat-7', authorId: 'user-1', text: 'За 10 монет — просто подарок. Responsive паттерны без media queries — гениально. Лена, делай ещё!', rating: 5, createdAt: '2026-01-25T18:00:00' },
  { id: 'com-18', materialId: 'mat-7', authorId: 'user-8', text: 'Даже для gamedev пригодилось — верстал UI для своего сайта-портфолио по этой шпаргалке.', rating: 4, createdAt: '2026-02-05T20:00:00' },

  // K8s (mat-8) — 2 отзыва
  { id: 'com-10', materialId: 'mat-8', authorId: 'user-1', text: 'K8s наконец стал понятен. Helm Charts — это магия. Дима, спасибо за часть про мониторинг с Prometheus!', rating: 5, createdAt: '2026-03-10T10:00:00' },
  { id: 'com-19', materialId: 'mat-8', authorId: 'user-7', text: 'После Docker-курса этого же автора — K8s зашёл как по маслу. Рекомендую брать оба — связка огонь.', rating: 5, createdAt: '2026-03-15T11:30:00' },

  // TypeScript (mat-17) — 2 отзыва
  { id: 'com-20', materialId: 'mat-17', authorId: 'user-6', text: 'Type-safe API клиент из 7й главы — произведение искусства. Скопировала в свой проект, работает идеально!', rating: 5, createdAt: '2026-02-15T13:00:00' },
  { id: 'com-21', materialId: 'mat-17', authorId: 'user-3', text: 'Template Literal Types + Infer = 🤯 Даже после 3 лет на TypeScript нашёл новое. Стоит каждой монеты.', rating: 5, createdAt: '2026-02-28T17:00:00' },

  // PyTorch (mat-16) — 2 отзыва
  { id: 'com-22', materialId: 'mat-16', authorId: 'user-1', text: 'Transfer Learning с ResNet — объяснено лучше чем в документации PyTorch. Деплой на FastAPI — бонус который стоит отдельного курса.', rating: 5, createdAt: '2026-02-10T14:00:00' },
  { id: 'com-23', materialId: 'mat-16', authorId: 'user-5', text: 'Раздел про Transformers на уровне. Хотелось бы глубже в attention. В целом — топ для старта в DL.', rating: 4, createdAt: '2026-03-01T16:00:00' },

  // Go Concurrency (mat-10) — 2 отзыва
  { id: 'com-26', materialId: 'mat-10', authorId: 'user-7', text: 'Worker Pool паттерн из этого конспекта использую в каждом Go-проекте. Дима знает о чём пишет — видно по качеству примеров.', rating: 5, createdAt: '2026-03-05T09:00:00' },
  { id: 'com-27', materialId: 'mat-10', authorId: 'user-1', text: 'Context + отмена горутин — наконец понял как это правильно делать. Раньше утечки горутин были бичом моих сервисов.', rating: 5, createdAt: '2026-03-12T11:00:00' },

  // PostgreSQL (mat-18) — 2 отзыва
  { id: 'com-28', materialId: 'mat-18', authorId: 'user-3', text: 'Кейс с ускорением запроса с 2с до 20мс — реальная магия. GIN индекс для JSONB — то что мне было нужно. Артём, спасибо!', rating: 5, createdAt: '2026-03-15T14:00:00' },
  { id: 'com-29', materialId: 'mat-18', authorId: 'user-2', text: 'Даже для Data Science полезно — оптимизировала запросы к аналитической БД. Партиционирование по дате — game changer.', rating: 5, createdAt: '2026-03-18T10:00:00' },
];
