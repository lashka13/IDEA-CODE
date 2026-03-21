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
  // For theory tasks
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

export const mockTasks: Task[] = [
  // ===== ALGORITHMS =====
  {
    id: 'task-1',
    title: 'Два числа с заданной суммой',
    description: `Дан массив целых чисел \`nums\` и целое число \`target\`. Верните индексы двух элементов массива, сумма которых равна \`target\`.

Каждый набор входных данных имеет **ровно одно решение**, и один элемент нельзя использовать дважды.

Ответ можно вернуть в любом порядке.`,
    category: 'algorithms',
    difficulty: 'easy',
    topic: 'Хеш-таблицы',
    inputFormat: 'Первая строка: n — длина массива. Вторая строка: n целых чисел. Третья строка: target.',
    outputFormat: 'Два индекса через пробел (0-indexed).',
    constraints: ['2 ≤ n ≤ 10⁴', '-10⁹ ≤ nums[i] ≤ 10⁹', '-10⁹ ≤ target ≤ 10⁹', 'Гарантируется единственное решение'],
    examples: [
      { input: '4\n2 7 11 15\n9', output: '0 1' },
      { input: '3\n3 2 4\n6', output: '1 2' },
    ],
    hiddenTests: [
      { input: '2\n3 3\n6', output: '0 1', hidden: true },
      { input: '5\n-1 -2 -3 -4 -5\n-8', output: '2 4', hidden: true },
    ],
    timeLimit: '1 сек',
    memoryLimit: '256 МБ',
    solvedCount: 1847,
    totalAttempts: 2340,
    acceptanceRate: 78.9,
    tags: ['Массивы', 'Хеш-таблица'],
    hints: [
      'Попробуйте использовать хеш-таблицу (словарь/Map) для хранения уже просмотренных элементов',
      'Для каждого числа проверяйте, есть ли в хеш-таблице число (target - текущее)',
    ],
  },
  {
    id: 'task-2',
    title: 'Развернуть связный список',
    description: `Дан односвязный список. Разверните его и верните новый head.

Пример:
\`\`\`
Вход:  1 -> 2 -> 3 -> 4 -> 5
Выход: 5 -> 4 -> 3 -> 2 -> 1
\`\`\``,
    category: 'algorithms',
    difficulty: 'easy',
    topic: 'Связные списки',
    inputFormat: 'Первая строка: n — количество элементов. Вторая строка: n целых чисел.',
    outputFormat: 'n целых чисел — развёрнутый список.',
    constraints: ['0 ≤ n ≤ 5000', '-5000 ≤ Node.val ≤ 5000'],
    examples: [
      { input: '5\n1 2 3 4 5', output: '5 4 3 2 1' },
      { input: '2\n1 2', output: '2 1' },
    ],
    hiddenTests: [
      { input: '0\n', output: '', hidden: true },
      { input: '1\n42', output: '42', hidden: true },
    ],
    timeLimit: '1 сек',
    memoryLimit: '256 МБ',
    solvedCount: 1234,
    totalAttempts: 1780,
    acceptanceRate: 69.3,
    tags: ['Связный список', 'Итерация'],
    hints: [
      'Используйте три указателя: prev, curr, next',
      'На каждом шаге: сохраняем next, переставляем указатель curr на prev, сдвигаем prev и curr',
    ],
  },
  {
    id: 'task-3',
    title: 'Максимальная подстрока без повторений',
    description: `Дана строка \`s\`. Найдите длину **наибольшей подстроки** без повторяющихся символов.

**Подстрока** — это непрерывная последовательность символов внутри строки.`,
    category: 'algorithms',
    difficulty: 'medium',
    topic: 'Скользящее окно',
    inputFormat: 'Строка s.',
    outputFormat: 'Целое число — длина максимальной подстроки.',
    constraints: ['0 ≤ s.length ≤ 5 × 10⁴', 's содержит ASCII символы'],
    examples: [
      { input: 'abcabcbb', output: '3' },
      { input: 'bbbbb', output: '1' },
      { input: 'pwwkew', output: '3' },
    ],
    hiddenTests: [
      { input: '', output: '0', hidden: true },
      { input: 'abcdef', output: '6', hidden: true },
    ],
    timeLimit: '1 сек',
    memoryLimit: '256 МБ',
    solvedCount: 987,
    totalAttempts: 1890,
    acceptanceRate: 52.2,
    tags: ['Скользящее окно', 'Хеш-таблица', 'Строки'],
    hints: [
      'Используйте метод скользящего окна (sliding window)',
      'Храните Set/Map символов текущего окна. При повторе — сдвигайте левую границу',
    ],
  },
  {
    id: 'task-4',
    title: 'Медиана двух отсортированных массивов',
    description: `Даны два отсортированных массива \`nums1\` и \`nums2\` размеров \`m\` и \`n\`. Верните **медиану** объединённого отсортированного массива.

Общая сложность решения должна быть **O(log(m+n))**.`,
    category: 'algorithms',
    difficulty: 'hard',
    topic: 'Бинарный поиск',
    inputFormat: 'Первая строка: m n. Вторая строка: m чисел. Третья строка: n чисел.',
    outputFormat: 'Число с точностью до 5 знаков.',
    constraints: ['0 ≤ m, n ≤ 1000', 'm + n ≥ 1', '-10⁶ ≤ nums[i] ≤ 10⁶'],
    examples: [
      { input: '2 1\n1 3\n2', output: '2.00000' },
      { input: '2 2\n1 2\n3 4', output: '2.50000' },
    ],
    hiddenTests: [
      { input: '1 1\n1\n2', output: '1.50000', hidden: true },
    ],
    timeLimit: '1 сек',
    memoryLimit: '256 МБ',
    solvedCount: 234,
    totalAttempts: 1120,
    acceptanceRate: 20.9,
    tags: ['Бинарный поиск', 'Массивы', 'Divide and Conquer'],
    hints: [
      'Используйте бинарный поиск по разделителю меньшего массива',
      'Ищите разделение, при котором все элементы слева ≤ всех элементов справа',
    ],
  },
  {
    id: 'task-5',
    title: 'Количество островов',
    description: `Дана 2D сетка \`grid\` размером m×n, состоящая из '1' (суша) и '0' (вода). Верните количество **островов**.

Остров окружён водой и образован соединением смежных земель по горизонтали или вертикали.`,
    category: 'algorithms',
    difficulty: 'medium',
    topic: 'Графы и BFS/DFS',
    inputFormat: 'Первая строка: m n. Далее m строк по n символов (0 или 1).',
    outputFormat: 'Целое число — количество островов.',
    constraints: ['1 ≤ m, n ≤ 300', 'grid[i][j] ∈ {0, 1}'],
    examples: [
      { input: '4 5\n11110\n11010\n11000\n00000', output: '1' },
      { input: '4 5\n11000\n11000\n00100\n00011', output: '3' },
    ],
    hiddenTests: [
      { input: '1 1\n1', output: '1', hidden: true },
    ],
    timeLimit: '2 сек',
    memoryLimit: '256 МБ',
    solvedCount: 876,
    totalAttempts: 1340,
    acceptanceRate: 65.4,
    tags: ['BFS', 'DFS', 'Матрица', 'Графы'],
    hints: [
      'Используйте DFS или BFS для обхода каждого острова',
      'При нахождении "1" запускайте обход и помечайте все связанные клетки как посещённые',
    ],
  },

  // ===== MATH =====
  {
    id: 'task-m1',
    title: 'Определитель матрицы 3×3',
    description: `Дана матрица 3×3. Вычислите её определитель.

Определитель матрицы 3×3 вычисляется по формуле разложения по первой строке:

\`det(A) = a₁₁(a₂₂a₃₃ - a₂₃a₃₂) - a₁₂(a₂₁a₃₃ - a₂₃a₃₁) + a₁₃(a₂₁a₃₂ - a₂₂a₃₁)\``,
    category: 'math',
    difficulty: 'easy',
    topic: 'Линейная алгебра',
    inputFormat: '3 строки по 3 числа — элементы матрицы.',
    outputFormat: 'Одно целое число — определитель.',
    constraints: ['-100 ≤ aᵢⱼ ≤ 100'],
    examples: [
      { input: '1 2 3\n4 5 6\n7 8 9', output: '0' },
      { input: '2 0 1\n3 1 0\n1 2 1', output: '3' },
    ],
    hiddenTests: [
      { input: '1 0 0\n0 1 0\n0 0 1', output: '1', hidden: true },
    ],
    timeLimit: '1 сек',
    memoryLimit: '256 МБ',
    solvedCount: 456,
    totalAttempts: 520,
    acceptanceRate: 87.7,
    tags: ['Матрицы', 'Линейная алгебра'],
    hints: ['Используйте формулу Саррюса или разложение по строке'],
  },

  // ===== THEORY =====
  {
    id: 'task-t1',
    title: 'Что произойдёт при выполнении docker run?',
    description: 'Выберите правильную последовательность событий при выполнении команды `docker run nginx`.',
    category: 'theory',
    difficulty: 'easy',
    topic: 'Docker',
    inputFormat: '',
    outputFormat: '',
    constraints: [],
    examples: [],
    hiddenTests: [],
    timeLimit: '',
    memoryLimit: '',
    solvedCount: 892,
    totalAttempts: 1100,
    acceptanceRate: 81.1,
    tags: ['Docker', 'Контейнеризация'],
    hints: [],
    isTheory: true,
    options: [
      { id: 'a', text: 'Docker создаёт VM → устанавливает nginx → запускает' },
      { id: 'b', text: 'Docker ищет образ локально → если нет, скачивает из Docker Hub → создаёт контейнер → запускает процесс' },
      { id: 'c', text: 'Docker компилирует nginx из исходников → запускает бинарник' },
      { id: 'd', text: 'Docker подключается к удалённому серверу → запускает nginx там' },
    ],
    correctOptionId: 'b',
    explanation: 'Docker сначала проверяет локальный кеш образов. Если образа нет, загружает его из Docker Hub. Затем создаёт новый контейнер (изолированный процесс) и запускает в нём основной процесс nginx.',
  },
  {
    id: 'task-t2',
    title: 'Разница между git merge и git rebase',
    description: 'Какое ключевое отличие между `git merge` и `git rebase`?',
    category: 'theory',
    difficulty: 'medium',
    topic: 'Git',
    inputFormat: '',
    outputFormat: '',
    constraints: [],
    examples: [],
    hiddenTests: [],
    timeLimit: '',
    memoryLimit: '',
    solvedCount: 654,
    totalAttempts: 890,
    acceptanceRate: 73.5,
    tags: ['Git', 'Version Control'],
    hints: [],
    isTheory: true,
    options: [
      { id: 'a', text: 'merge удаляет ветку, rebase сохраняет' },
      { id: 'b', text: 'merge создаёт merge-коммит, rebase переписывает историю, перемещая коммиты на кончик целевой ветки' },
      { id: 'c', text: 'rebase быстрее, merge безопаснее — больше различий нет' },
      { id: 'd', text: 'merge работает только с remote, rebase — только локально' },
    ],
    correctOptionId: 'b',
    explanation: 'git merge создаёт новый merge-коммит, сохраняя всю историю обеих веток. git rebase перемещает ("переигрывает") коммиты текущей ветки поверх целевой, создавая линейную историю, но переписывая хеши коммитов.',
  },
  {
    id: 'task-t3',
    title: 'Индексы в PostgreSQL',
    description: 'В каком случае B-Tree индекс в PostgreSQL **НЕ** поможет ускорить запрос?',
    category: 'theory',
    difficulty: 'medium',
    topic: 'Базы данных',
    inputFormat: '',
    outputFormat: '',
    constraints: [],
    examples: [],
    hiddenTests: [],
    timeLimit: '',
    memoryLimit: '',
    solvedCount: 321,
    totalAttempts: 560,
    acceptanceRate: 57.3,
    tags: ['PostgreSQL', 'Индексы', 'Оптимизация'],
    hints: [],
    isTheory: true,
    options: [
      { id: 'a', text: 'WHERE name = \'John\'' },
      { id: 'b', text: 'WHERE age > 25 ORDER BY age' },
      { id: 'c', text: 'WHERE name LIKE \'%ohn%\'' },
      { id: 'd', text: 'WHERE id BETWEEN 100 AND 200' },
    ],
    correctOptionId: 'c',
    explanation: 'B-Tree индекс не может эффективно обработать паттерн LIKE с wildcard в начале (%ohn%). Индекс работает слева направо, поэтому поиск подстроки в середине или конце требует полного сканирования. Для таких запросов нужен GIN индекс с pg_trgm.',
  },

  // ===== SYSTEM DESIGN =====
  {
    id: 'task-sd1',
    title: 'Спроектируйте URL Shortener',
    description: `Спроектируйте систему сокращения URL (типа bit.ly).

**Функциональные требования:**
- Пользователь отправляет длинный URL → получает короткий
- При переходе по короткому URL → редирект на оригинальный
- Кастомные короткие ссылки (опционально)
- Аналитика переходов

**Нефункциональные требования:**
- 100M новых URL/день
- Редирект < 100ms
- Высокая доступность (99.99%)
- Короткие URL не должны быть угадываемы

Опишите:
1. Схему API
2. Алгоритм генерации коротких ссылок
3. Схему базы данных
4. Стратегию масштабирования`,
    category: 'system-design',
    difficulty: 'hard',
    topic: 'Проектирование систем',
    inputFormat: 'Текстовый ответ',
    outputFormat: 'Текстовый ответ',
    constraints: [],
    examples: [],
    hiddenTests: [],
    timeLimit: '45 мин',
    memoryLimit: '',
    solvedCount: 145,
    totalAttempts: 320,
    acceptanceRate: 45.3,
    tags: ['System Design', 'Масштабирование', 'API Design'],
    hints: [
      'Подумайте о base62 encoding для генерации коротких ссылок',
      'Используйте кеш (Redis) для горячих ссылок',
      'Рассмотрите шардирование БД по хешу короткой ссылки',
    ],
  },
];
