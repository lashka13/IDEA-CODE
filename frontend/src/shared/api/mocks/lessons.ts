import type { Lesson } from '../../types';

export const mockLessons: Lesson[] = [
  // ===== mat-1: React Hooks: Полное руководство =====
  {
    id: 'lesson-1-1',
    materialId: 'mat-1',
    order: 1,
    title: 'useState и useReducer — управление состоянием',
    duration: '25 мин',
    isPreview: true,
    contents: [
      {
        type: 'video',
        title: 'Введение в useState',
        videoUrl: 'https://www.youtube.com/embed/O6P86uwfdR0',
        videoDuration: '12:34',
      },
      {
        type: 'text',
        title: 'Теория: Как работает useState',
        body: `## useState — основа управления состоянием в React

\`useState\` — это хук, который позволяет добавлять реактивное состояние в функциональные компоненты. Каждый вызов useState создаёт независимую «ячейку» состояния.

### Как работает под капотом

React хранит состояние компонента в связном списке (linked list). При каждом рендере React обходит список хуков **в том же порядке**, в котором они были вызваны. Именно поэтому хуки нельзя вызывать условно.

### Ключевые правила:

1. **Иммутабельность** — никогда не мутируйте состояние напрямую
2. **Батчинг** — React 18+ автоматически группирует обновления состояния
3. **Функциональные обновления** — используйте callback-форму когда новое состояние зависит от предыдущего

### Когда использовать useReducer вместо useState?

| Критерий | useState | useReducer |
|----------|----------|------------|
| Простое значение | ✅ | ❌ |
| Объект с 2-3 полями | ✅ | ✅ |
| Сложная логика переходов | ❌ | ✅ |
| Связанные состояния | ❌ | ✅ |

> **Правило большого пальца**: если у вас больше 3 связанных useState, рассмотрите useReducer.`,
      },
      {
        type: 'code',
        title: 'Практика: Counter с useReducer',
        codeLanguage: 'typescript',
        code: `import { useReducer } from 'react';

// Типизируем состояние и экшены
interface CounterState {
  count: number;
  step: number;
}

type CounterAction =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'reset' }
  | { type: 'setStep'; payload: number };

const initialState: CounterState = { count: 0, step: 1 };

function counterReducer(state: CounterState, action: CounterAction): CounterState {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + state.step };
    case 'decrement':
      return { ...state, count: state.count - state.step };
    case 'reset':
      return initialState;
    case 'setStep':
      return { ...state, step: action.payload };
    default:
      return state;
  }
}

export function Counter() {
  const [state, dispatch] = useReducer(counterReducer, initialState);

  return (
    <div>
      <p>Count: {state.count} (step: {state.step})</p>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
      <button onClick={() => dispatch({ type: 'reset' })}>Reset</button>
      <input
        type="number"
        value={state.step}
        onChange={(e) => dispatch({ type: 'setStep', payload: +e.target.value })}
      />
    </div>
  );
}`,
      },
      {
        type: 'quiz',
        quiz: [
          {
            id: 'q1-1-1',
            question: 'Почему хуки нельзя вызывать внутри условных конструкций (if/else)?',
            options: [
              { id: 'a', text: 'Это вызовет ошибку компиляции TypeScript' },
              { id: 'b', text: 'React отслеживает хуки по порядку вызова, условия нарушают этот порядок' },
              { id: 'c', text: 'Хуки работают только на верхнем уровне DOM-дерева' },
              { id: 'd', text: 'Условные хуки потребляют больше памяти' },
            ],
            correctOptionId: 'b',
            explanation: 'React хранит хуки в связном списке и обходит их по порядку при каждом рендере. Если порядок вызова изменится (из-за условия), React не сможет корректно сопоставить хуки с их состоянием.',
          },
          {
            id: 'q1-1-2',
            question: 'Когда стоит предпочесть useReducer вместо useState?',
            options: [
              { id: 'a', text: 'Всегда, useReducer эффективнее' },
              { id: 'b', text: 'Когда состояние — простое булевое значение' },
              { id: 'c', text: 'Когда логика обновления состояния сложная или несколько состояний связаны между собой' },
              { id: 'd', text: 'Только при использовании TypeScript' },
            ],
            correctOptionId: 'c',
            explanation: 'useReducer лучше подходит для управления сложным состоянием с множеством переходов и взаимосвязанными полями. Это делает логику обновлений предсказуемой и тестируемой.',
          },
        ],
      },
    ],
  },
  {
    id: 'lesson-1-2',
    materialId: 'mat-1',
    order: 2,
    title: 'useEffect — побочные эффекты и жизненный цикл',
    duration: '30 мин',
    contents: [
      {
        type: 'video',
        title: 'Глубокое погружение в useEffect',
        videoUrl: 'https://www.youtube.com/embed/0ZJgIjIuY7U',
        videoDuration: '15:20',
      },
      {
        type: 'text',
        title: 'Жизненный цикл эффекта',
        body: `## useEffect — синхронизация с внешним миром

useEffect позволяет синхронизировать компонент с внешними системами: API, таймеры, подписки, DOM.

### Ментальная модель

Думайте о useEffect не как о «жизненном цикле», а как о **синхронизации**:

\`\`\`
useEffect(() => {
  // Эффект: синхронизируем состояние с внешней системой
  const subscription = api.subscribe(id);

  // Cleanup: отписываемся при размонтировании или изменении id
  return () => subscription.unsubscribe();
}, [id]); // Зависимости: когда пересинхронизировать
\`\`\`

### Три сценария массива зависимостей:

1. **Без массива** — эффект выполняется после каждого рендера
2. **Пустой массив \`[]\`** — эффект выполняется один раз (mount/unmount)
3. **С зависимостями \`[a, b]\`** — эффект пересинхронизируется когда a или b изменились

### ⚠️ Распространённые ошибки

**Бесконечный цикл** — объект в зависимостях:
\`\`\`typescript
// ❌ Каждый рендер создаёт новый объект → бесконечный цикл
useEffect(() => { fetch(options) }, [{ page: 1 }]);

// ✅ Примитивные значения или useMemo
useEffect(() => { fetch({ page }) }, [page]);
\`\`\`

**Race condition** — несколько запросов:
\`\`\`typescript
useEffect(() => {
  let cancelled = false;
  fetchData(id).then(data => {
    if (!cancelled) setData(data);
  });
  return () => { cancelled = true; };
}, [id]);
\`\`\``,
      },
      {
        type: 'code',
        title: 'Кастомный хук useDebounce',
        codeLanguage: 'typescript',
        code: `import { useState, useEffect } from 'react';

/**
 * Хук дебаунса — откладывает обновление значения
 * Полезен для поисковых запросов, чтобы не отправлять
 * запрос на каждое нажатие клавиши
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: отменяем предыдущий таймер
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Использование:
function SearchComponent() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) {
      // Запрос отправится только через 300мс
      // после того, как пользователь перестанет печатать
      searchAPI(debouncedQuery).then(setResults);
    }
  }, [debouncedQuery]);

  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}`,
      },
      {
        type: 'quiz',
        quiz: [
          {
            id: 'q1-2-1',
            question: 'Что произойдёт, если передать пустой массив зависимостей [] в useEffect?',
            options: [
              { id: 'a', text: 'Эффект не выполнится никогда' },
              { id: 'b', text: 'Эффект выполнится при каждом рендере' },
              { id: 'c', text: 'Эффект выполнится один раз после первого рендера, cleanup — при размонтировании' },
              { id: 'd', text: 'Эффект выполнится синхронно до рендера' },
            ],
            correctOptionId: 'c',
            explanation: 'Пустой массив зависимостей означает, что эффект не зависит ни от каких значений и выполнится только один раз. Функция cleanup выполнится при размонтировании компонента.',
          },
        ],
      },
    ],
  },
  {
    id: 'lesson-1-3',
    materialId: 'mat-1',
    order: 3,
    title: 'useMemo и useCallback — оптимизация рендеров',
    duration: '22 мин',
    contents: [
      {
        type: 'video',
        title: 'Когда действительно нужна мемоизация',
        videoUrl: 'https://www.youtube.com/embed/vpE9I_eqHdM',
        videoDuration: '10:45',
      },
      {
        type: 'text',
        title: 'Мемоизация: не серебряная пуля',
        body: `## useMemo и useCallback — оптимизация с умом

### useMemo — кеширование вычислений

\`\`\`typescript
const sortedItems = useMemo(
  () => items.sort((a, b) => a.name.localeCompare(b.name)),
  [items]
);
\`\`\`

**Используйте когда:**
- Тяжёлые вычисления (сортировка 10000+ элементов)
- Объект передаётся как зависимость в useEffect
- Объект передаётся в React.memo компонент

**НЕ используйте когда:**
- Простые операции (сложение, конкатенация строк)
- Значение используется только в JSX

### useCallback — стабильная ссылка на функцию

\`\`\`typescript
const handleClick = useCallback((id: string) => {
  setItems(prev => prev.filter(item => item.id !== id));
}, []); // Пустые зависимости — функция стабильна
\`\`\`

### Правило: профилируйте, потом оптимизируйте

> "Premature optimization is the root of all evil" — Donald Knuth

Используйте React DevTools Profiler чтобы найти реальные узкие места, прежде чем обвешивать код мемоизацией.`,
      },
      {
        type: 'quiz',
        quiz: [
          {
            id: 'q1-3-1',
            question: 'В каком случае useMemo НЕ нужен?',
            options: [
              { id: 'a', text: 'Фильтрация списка из 50000 элементов' },
              { id: 'b', text: 'Сложение двух чисел для отображения в JSX' },
              { id: 'c', text: 'Создание объекта, который передаётся как зависимость в useEffect' },
              { id: 'd', text: 'Создание проп-объекта для React.memo компонента' },
            ],
            correctOptionId: 'b',
            explanation: 'Сложение двух чисел — тривиальная операция. Обёртка в useMemo добавит больше накладных расходов, чем сэкономит. useMemo полезен только для действительно тяжёлых вычислений.',
          },
        ],
      },
    ],
  },
  {
    id: 'lesson-1-4',
    materialId: 'mat-1',
    order: 4,
    title: 'useRef — ссылки и императивный код',
    duration: '18 мин',
    contents: [
      {
        type: 'text',
        title: 'useRef — мутабельный контейнер вне рендер-цикла',
        body: `## useRef — два назначения

### 1. Ссылка на DOM-элемент

\`\`\`tsx
function TextInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return <input ref={inputRef} />;
}
\`\`\`

### 2. Хранение мутабельного значения

В отличие от useState, изменение \`.current\` **не вызывает ре-рендер**:

\`\`\`tsx
function Timer() {
  const intervalRef = useRef<number | null>(null);

  const startTimer = () => {
    intervalRef.current = window.setInterval(() => {
      console.log('tick');
    }, 1000);
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };
}
\`\`\`

### Типичные use-cases:
- Хранение предыдущего значения пропа
- Хранение ID таймера / подписки
- Доступ к DOM для измерений (getBoundingClientRect)
- Отслеживание «первого рендера»`,
      },
      {
        type: 'code',
        title: 'usePrevious — хранение предыдущего значения',
        codeLanguage: 'typescript',
        code: `import { useRef, useEffect } from 'react';

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}

// Использование
function PriceDisplay({ price }: { price: number }) {
  const previousPrice = usePrevious(price);
  const diff = previousPrice !== undefined ? price - previousPrice : 0;

  return (
    <div>
      <span>{price} ₽</span>
      {diff > 0 && <span style={{ color: 'green' }}>▲ +{diff}</span>}
      {diff < 0 && <span style={{ color: 'red' }}>▼ {diff}</span>}
    </div>
  );
}`,
      },
    ],
  },
  {
    id: 'lesson-1-5',
    materialId: 'mat-1',
    order: 5,
    title: 'useContext — глобальное состояние без Redux',
    duration: '20 мин',
    contents: [
      {
        type: 'text',
        title: 'Context API — когда Redux не нужен',
        body: `## useContext — шаринг данных через дерево компонентов

Context решает проблему **prop drilling** — передачи пропсов через много уровней вложенности.

### Когда использовать Context вместо Redux:

✅ **Context подойдёт для:**
- Тема (светлая/тёмная)
- Текущий пользователь (auth)
- Локаль/язык интерфейса
- Данные, которые редко меняются

❌ **Redux лучше для:**
- Частые обновления (каждый keystroke)
- Сложная бизнес-логика
- Серверное состояние с кешированием
- DevTools для отладки

### ⚠️ Проблема: ре-рендер всех потребителей

Каждый компонент, использующий \`useContext(MyContext)\`, перерисуется при **любом** изменении контекста, даже если он использует только часть данных.

**Решение:** разделяйте контексты по частоте обновления:

\`\`\`tsx
// ❌ Один большой контекст
const AppContext = createContext({ theme, user, locale, notifications });

// ✅ Несколько маленьких контекстов
const ThemeContext = createContext(theme);
const UserContext = createContext(user);
const NotificationContext = createContext(notifications);
\`\`\``,
      },
      {
        type: 'code',
        title: 'Практика: Theme Provider',
        codeLanguage: 'typescript',
        code: `import { createContext, useContext, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

// Кастомный хук с проверкой
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}`,
      },
    ],
  },
  {
    id: 'lesson-1-6',
    materialId: 'mat-1',
    order: 6,
    title: 'Кастомные хуки — абстракция логики',
    duration: '28 мин',
    contents: [
      {
        type: 'video',
        title: 'Пишем переиспользуемые хуки',
        videoUrl: 'https://www.youtube.com/embed/J-g9ZJha8FE',
        videoDuration: '14:10',
      },
      {
        type: 'text',
        title: 'Кастомные хуки — суперсила React',
        body: `## Кастомные хуки — извлечение и переиспользование логики

Кастомный хук — это функция, имя которой начинается с \`use\` и которая вызывает другие хуки.

### Когда создавать кастомный хук:

1. **Дублирование** — одна и та же логика в 2+ компонентах
2. **Сложность** — компонент стал слишком большим
3. **Тестируемость** — логику легче тестировать отдельно от UI

### Рецепт хорошего хука:
- Одна ответственность (Single Responsibility)
- Возвращает только то, что нужно потребителю
- Обрабатывает loading/error состояния
- Имеет чистый cleanup`,
      },
      {
        type: 'code',
        title: 'useLocalStorage — персистентное состояние',
        codeLanguage: 'typescript',
        code: `import { useState, useEffect } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Ленивая инициализация — читаем из localStorage один раз
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Синхронизируем с localStorage при изменении
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

// Использование:
function Settings() {
  const [fontSize, setFontSize] = useLocalStorage('fontSize', 16);
  const [darkMode, setDarkMode] = useLocalStorage('darkMode', true);

  return (
    <div style={{ fontSize }}>
      <button onClick={() => setFontSize(prev => prev + 2)}>A+</button>
      <button onClick={() => setDarkMode(prev => !prev)}>Toggle theme</button>
    </div>
  );
}`,
      },
    ],
  },
  {
    id: 'lesson-1-7',
    materialId: 'mat-1',
    order: 7,
    title: 'Паттерны: Compound Components, Render Props',
    duration: '35 мин',
    contents: [
      {
        type: 'text',
        title: 'Продвинутые паттерны компонентов',
        body: `## Compound Components

Паттерн, при котором несколько компонентов работают вместе, разделяя неявное состояние.

**Примеры из жизни:** \`<select>/<option>\`, \`<table>/<tr>/<td>\`

### Зачем?

\`\`\`tsx
// ❌ Один мега-компонент с кучей пропсов
<Accordion items={items} renderHeader={...} renderBody={...}
  onToggle={...} multiple={false} />

// ✅ Compound Components — гибко и читаемо
<Accordion>
  <Accordion.Item>
    <Accordion.Header>Заголовок</Accordion.Header>
    <Accordion.Panel>Контент</Accordion.Panel>
  </Accordion.Item>
</Accordion>
\`\`\`

### Реализация через Context:

Родительский компонент хранит состояние и предоставляет его через Context. Дочерние компоненты потребляют этот контекст.

## Render Props

Паттерн, при котором компонент принимает функцию как проп (или children) и вызывает её с данными:

\`\`\`tsx
<MouseTracker>
  {({ x, y }) => <div>Курсор: {x}, {y}</div>}
</MouseTracker>
\`\`\`

> **Совет:** В большинстве случаев кастомные хуки заменяют Render Props.
> Используйте Render Props только если нужно условно рендерить потребителя.`,
      },
    ],
  },
  {
    id: 'lesson-1-8',
    materialId: 'mat-1',
    order: 8,
    title: 'React 19: use(), useOptimistic, useFormStatus',
    duration: '20 мин',
    contents: [
      {
        type: 'text',
        title: 'Новые хуки React 19',
        body: `## React 19 — новое поколение хуков

### use() — чтение промисов и контекста

\`use()\` — единственный хук, который можно вызывать условно!

\`\`\`tsx
function UserProfile({ userPromise }) {
  // Suspend пока промис не resolve'ится
  const user = use(userPromise);
  return <h1>{user.name}</h1>;
}
\`\`\`

### useOptimistic — оптимистичные обновления

\`\`\`tsx
function TodoList({ todos, addTodo }) {
  const [optimisticTodos, addOptimistic] = useOptimistic(
    todos,
    (state, newTodo) => [...state, { ...newTodo, pending: true }]
  );

  async function handleAdd(formData) {
    const newTodo = { title: formData.get('title') };
    addOptimistic(newTodo); // Мгновенно в UI
    await addTodo(newTodo); // Запрос на сервер
  }
}
\`\`\`

### useFormStatus — состояние отправки формы

\`\`\`tsx
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending}>
      {pending ? 'Отправка...' : 'Отправить'}
    </button>
  );
}
\`\`\`

Эти хуки отлично интегрируются с Server Components и Server Actions.`,
      },
      {
        type: 'quiz',
        quiz: [
          {
            id: 'q1-8-1',
            question: 'Чем хук use() отличается от всех остальных хуков React?',
            options: [
              { id: 'a', text: 'Он работает только на сервере' },
              { id: 'b', text: 'Его можно вызывать внутри условных конструкций (if/else)' },
              { id: 'c', text: 'Он не требует массива зависимостей' },
              { id: 'd', text: 'Он работает только с классовыми компонентами' },
            ],
            correctOptionId: 'b',
            explanation: 'use() — единственный хук, который можно вызывать условно и внутри циклов. Это возможно благодаря тому, что он работает с промисами и контекстом особым образом.',
          },
        ],
      },
    ],
  },

  // ===== mat-2: Docker для начинающих =====
  {
    id: 'lesson-2-1',
    materialId: 'mat-2',
    order: 1,
    title: 'Зачем нужен Docker — проблемы «у меня работает»',
    duration: '20 мин',
    isPreview: true,
    contents: [
      {
        type: 'video',
        title: 'Введение в контейнеризацию',
        videoUrl: 'https://www.youtube.com/embed/Gjnup-PuquQ',
        videoDuration: '10:15',
      },
      {
        type: 'text',
        title: 'Зачем миру нужен Docker',
        body: `## Проблема: «У меня работает!»

Классическая ситуация в разработке:

1. 🧑‍💻 Разработчик: "Код работает на моей машине"
2. 🖥️ Сервер: "Ошибка: модуль не найден"
3. 🤷 Все: "Но у меня же работает..."

### Причины расхождений:

- **Разные версии** языков, библиотек, ОС
- **Разные переменные окружения**
- **Разные системные зависимости** (libssl, imagemagick, ffmpeg)
- **Разные настройки** ОС (timezone, locale, ulimits)

### Решение: контейнеризация

Docker упаковывает приложение вместе со **всеми зависимостями** в изолированный контейнер:

\`\`\`
┌─────────────────────────────┐
│         Container           │
│  ┌───────────────────────┐  │
│  │    Your Application    │  │
│  ├───────────────────────┤  │
│  │   Runtime (Node 20)    │  │
│  ├───────────────────────┤  │
│  │  System Libs (Alpine)  │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
\`\`\`

### Контейнер vs Виртуальная машина

| Параметр | Контейнер | VM |
|----------|-----------|-----|
| Размер | ~100 MB | ~10 GB |
| Старт | Секунды | Минуты |
| Изоляция | Процессы | Полная ОС |
| Overhead | Минимальный | Значительный |`,
      },
      {
        type: 'quiz',
        quiz: [
          {
            id: 'q2-1-1',
            question: 'Какое главное преимущество Docker-контейнеров перед виртуальными машинами?',
            options: [
              { id: 'a', text: 'Контейнеры обеспечивают более высокий уровень безопасности' },
              { id: 'b', text: 'Контейнеры разделяют ядро хост-системы, поэтому легковеснее и быстрее запускаются' },
              { id: 'c', text: 'Контейнеры не требуют установки Docker' },
              { id: 'd', text: 'Контейнеры работают только на Linux' },
            ],
            correctOptionId: 'b',
            explanation: 'Контейнеры используют ядро хост-системы вместо полной виртуализации ОС, что делает их значительно легче (~100MB vs ~10GB) и быстрее (секунды vs минуты на запуск).',
          },
        ],
      },
    ],
  },
  {
    id: 'lesson-2-2',
    materialId: 'mat-2',
    order: 2,
    title: 'Установка и первый контейнер',
    duration: '15 мин',
    contents: [
      {
        type: 'text',
        title: 'Установка Docker',
        body: `## Установка Docker

### macOS / Windows
Скачайте **Docker Desktop** с [docker.com](https://docker.com) — он включает Docker Engine, Docker CLI и Docker Compose.

### Linux (Ubuntu/Debian)
\`\`\`bash
# Добавляем официальный GPG ключ Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Устанавливаем
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin
\`\`\`

### Проверяем установку
\`\`\`bash
docker --version    # Docker version 24.x
docker compose version  # Docker Compose version 2.x
\`\`\``,
      },
      {
        type: 'code',
        title: 'Первые команды Docker',
        codeLanguage: 'typescript',
        code: `# Запускаем первый контейнер
docker run hello-world

# Запускаем nginx на порте 8080
docker run -d -p 8080:80 --name my-nginx nginx:alpine

# Проверяем запущенные контейнеры
docker ps

# Смотрим логи контейнера
docker logs my-nginx

# Заходим внутрь контейнера
docker exec -it my-nginx sh

# Останавливаем и удаляем
docker stop my-nginx
docker rm my-nginx

# Список образов
docker images

# Удалить образ
docker rmi nginx:alpine`,
      },
    ],
  },
  {
    id: 'lesson-2-3',
    materialId: 'mat-2',
    order: 3,
    title: 'Dockerfile — создаём свои образы',
    duration: '25 мин',
    contents: [
      {
        type: 'video',
        title: 'Пишем Dockerfile правильно',
        videoUrl: 'https://www.youtube.com/embed/pg19Z8LL06w',
        videoDuration: '13:40',
      },
      {
        type: 'text',
        title: 'Анатомия Dockerfile',
        body: `## Dockerfile — рецепт образа

Dockerfile — это текстовый файл с инструкциями по сборке Docker-образа.

### Основные инструкции:

| Инструкция | Описание |
|-----------|----------|
| \`FROM\` | Базовый образ |
| \`WORKDIR\` | Рабочая директория |
| \`COPY\` | Копирование файлов |
| \`RUN\` | Выполнение команды при сборке |
| \`ENV\` | Переменная окружения |
| \`EXPOSE\` | Документирование порта |
| \`CMD\` | Команда при запуске контейнера |

### Оптимизация слоёв

Каждая инструкция создаёт слой. Docker кеширует слои — если слой не изменился, он берётся из кеша:

\`\`\`dockerfile
# ✅ Правильный порядок (зависимости меняются реже кода)
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# ❌ Неправильный (любое изменение кода инвалидирует кеш npm ci)
COPY . .
RUN npm ci
\`\`\``,
      },
      {
        type: 'code',
        title: 'Dockerfile для Node.js приложения',
        codeLanguage: 'typescript',
        code: `# Используем slim-образ Node.js 20 на Alpine
FROM node:20-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Сначала копируем только файлы зависимостей (для кеширования слоёв)
COPY package.json package-lock.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем остальной код
COPY . .

# Собираем приложение
RUN npm run build

# --- Stage 2: Runtime ---
FROM node:20-alpine

WORKDIR /app

# Копируем только необходимое из builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Переменные окружения
ENV NODE_ENV=production
ENV PORT=3000

# Документируем порт
EXPOSE 3000

# Запускаем приложение
CMD ["node", "dist/index.js"]`,
      },
      {
        type: 'quiz',
        quiz: [
          {
            id: 'q2-3-1',
            question: 'Почему в Dockerfile важно копировать package.json отдельно от остального кода?',
            options: [
              { id: 'a', text: 'Это обязательное требование Docker' },
              { id: 'b', text: 'Для кеширования слоя npm ci — зависимости меняются реже, чем код' },
              { id: 'c', text: 'Чтобы package.json был в корне контейнера' },
              { id: 'd', text: 'Для уменьшения размера образа' },
            ],
            correctOptionId: 'b',
            explanation: 'Docker кеширует каждый слой. Если мы сначала копируем package.json и запускаем npm ci, этот слой будет закеширован до тех пор, пока package.json не изменится. Это значительно ускоряет повторные сборки.',
          },
        ],
      },
    ],
  },
  {
    id: 'lesson-2-4',
    materialId: 'mat-2',
    order: 4,
    title: 'Docker Compose — оркестрация сервисов',
    duration: '30 мин',
    contents: [
      {
        type: 'text',
        title: 'Docker Compose — управление многосервисной архитектурой',
        body: `## Docker Compose

В реальных проектах приложение состоит из нескольких сервисов:
- Frontend (React/Vue)
- Backend (Node.js/Go/Python)
- Database (PostgreSQL/MongoDB)
- Cache (Redis)
- Reverse Proxy (Nginx)

**Docker Compose** позволяет описать все сервисы в одном файле \`docker-compose.yml\` и управлять ими одной командой.

### Ключевые команды:

\`\`\`bash
docker compose up -d      # Запустить все сервисы в фоне
docker compose down        # Остановить и удалить
docker compose logs -f     # Логи всех сервисов (follow)
docker compose ps          # Статус сервисов
docker compose exec app sh # Зайти в контейнер
\`\`\``,
      },
      {
        type: 'code',
        title: 'docker-compose.yml для полного стека',
        codeLanguage: 'typescript',
        code: `version: '3.8'

services:
  # Backend API
  api:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://user:pass@db:5432/myapp
      REDIS_URL: redis://cache:6379
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
    volumes:
      - ./backend/src:/app/src  # Hot-reload в разработке

  # PostgreSQL
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: myapp
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d myapp"]
      interval: 5s
      retries: 5

  # Redis для кеширования
  cache:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  # Nginx reverse proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - api

volumes:
  pgdata:  # Именованный volume для персистентности`,
      },
    ],
  },
  {
    id: 'lesson-2-5',
    materialId: 'mat-2',
    order: 5,
    title: 'Volumes — персистентное хранилище',
    duration: '15 мин',
    contents: [
      {
        type: 'text',
        title: 'Данные в Docker: volumes и bind mounts',
        body: `## Проблема: контейнеры эфемерны

По умолчанию все данные внутри контейнера **теряются** при его удалении. Для персистентности используем **volumes**.

### Три типа хранилища:

1. **Named Volumes** — управляются Docker, идеальны для баз данных
   \`\`\`bash
   docker run -v pgdata:/var/lib/postgresql/data postgres
   \`\`\`

2. **Bind Mounts** — прямая привязка к файловой системе хоста
   \`\`\`bash
   docker run -v ./src:/app/src node
   \`\`\`

3. **tmpfs** — хранение в оперативной памяти (не персистентно)
   \`\`\`bash
   docker run --tmpfs /tmp node
   \`\`\`

### Когда что использовать:

| Тип | Для чего |
|-----|----------|
| Named Volume | Данные БД, загруженные файлы |
| Bind Mount | Hot-reload в разработке |
| tmpfs | Секреты, временные данные |`,
      },
    ],
  },
  {
    id: 'lesson-2-6',
    materialId: 'mat-2',
    order: 6,
    title: 'Networking — связываем контейнеры',
    duration: '18 мин',
    contents: [
      {
        type: 'text',
        title: 'Docker Networking',
        body: `## Сети в Docker

Docker автоматически создаёт виртуальную сеть для контейнеров.

### Типы сетей:

- **bridge** (default) — изолированная сеть для контейнеров на одном хосте
- **host** — контейнер использует сеть хоста напрямую
- **none** — без сетевого доступа

### DNS в Docker

В docker-compose сервисы доступны по **имени сервиса**:

\`\`\`
api → db:5432      (не localhost:5432!)
api → cache:6379
nginx → api:3000
\`\`\`

### Важно: localhost в контейнере

\`localhost\` внутри контейнера — это сам контейнер, а не хост-машина!

Для доступа к хосту используйте: \`host.docker.internal\``,
      },
    ],
  },
  {
    id: 'lesson-2-7',
    materialId: 'mat-2',
    order: 7,
    title: 'Multi-stage builds — оптимизация',
    duration: '22 мин',
    contents: [
      {
        type: 'text',
        title: 'Multi-stage builds — маленькие и безопасные образы',
        body: `## Проблема: раздутые образы

Типичная ошибка новичка:
\`\`\`dockerfile
FROM node:20
COPY . .
RUN npm install
RUN npm run build
CMD ["node", "dist/index.js"]
# Результат: образ ~1.5GB 😱
\`\`\`

Образ содержит: исходный код, devDependencies, build tools — ничего из этого не нужно в production.

## Решение: Multi-stage Build

\`\`\`dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Runtime (только то, что нужно)
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/index.js"]
# Результат: образ ~150MB ✅
\`\`\`

### Для статических сайтов (React/Vue):

\`\`\`dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Результат: образ ~25MB 🚀
\`\`\``,
      },
    ],
  },
  {
    id: 'lesson-2-8',
    materialId: 'mat-2',
    order: 8,
    title: 'Финальный проект: Full-stack деплой',
    duration: '40 мин',
    contents: [
      {
        type: 'video',
        title: 'Деплоим полный стек на VPS',
        videoUrl: 'https://www.youtube.com/embed/3c-iBn73dDE',
        videoDuration: '22:00',
      },
      {
        type: 'text',
        title: 'Финальный проект',
        body: `## Деплой полного стека: React + Node.js + PostgreSQL + Nginx

### Архитектура проекта:

\`\`\`
               Internet
                  │
                  ▼
            ┌──────────┐
            │  Nginx   │ :80, :443
            └────┬─────┘
                 │
         ┌───────┴───────┐
         ▼               ▼
    ┌──────────┐   ┌──────────┐
    │ Frontend │   │ Backend  │
    │ (static) │   │ (API)    │
    └──────────┘   └────┬─────┘
                        │
                 ┌──────┴──────┐
                 ▼             ▼
           ┌──────────┐  ┌──────────┐
           │PostgreSQL│  │  Redis   │
           └──────────┘  └──────────┘
\`\`\`

### Что вы научились:

✅ Контейнеризация любого приложения
✅ Docker Compose для многосервисных проектов
✅ Оптимизация размера образов
✅ Управление данными через volumes
✅ Настройка сети между сервисами
✅ Production-ready деплой

### Следующие шаги:
- Docker Swarm / Kubernetes для масштабирования
- CI/CD с Docker (GitHub Actions)
- Мониторинг контейнеров (Prometheus + Grafana)`,
      },
      {
        type: 'quiz',
        quiz: [
          {
            id: 'q2-8-1',
            question: 'Какой лучший способ деплоить статический React-сайт в Docker?',
            options: [
              { id: 'a', text: 'FROM node:20, COPY ., npm start' },
              { id: 'b', text: 'Multi-stage: собрать в node, скопировать dist в nginx:alpine' },
              { id: 'c', text: 'Запустить npm run dev в контейнере' },
              { id: 'd', text: 'Смонтировать папку build через volume' },
            ],
            correctOptionId: 'b',
            explanation: 'Multi-stage build позволяет получить минимальный образ (~25MB) с nginx, содержащий только статические файлы. Не нужен Node.js runtime в production для статического сайта.',
          },
        ],
      },
    ],
  },

  // ===== mat-3: Machine Learning (краткие уроки) =====
  {
    id: 'lesson-3-1',
    materialId: 'mat-3',
    order: 1,
    title: 'Введение в ML — типы задач и подходы',
    duration: '30 мин',
    isPreview: true,
    contents: [
      {
        type: 'video',
        title: 'Что такое Machine Learning?',
        videoUrl: 'https://www.youtube.com/embed/ukzFI9rgwfU',
        videoDuration: '15:00',
      },
      {
        type: 'text',
        title: 'Введение в мир ML',
        body: `## Машинное обучение — обучение на данных

Machine Learning — это область AI, где алгоритмы учатся на данных без явного программирования правил.

### Три типа ML:

**1. Supervised Learning (обучение с учителем)**
- Есть данные с метками (X → Y)
- Классификация: спам/не спам, кот/собака
- Регрессия: предсказание цены, температуры

**2. Unsupervised Learning (без учителя)**
- Нет меток, ищем паттерны
- Кластеризация: сегментация клиентов
- Снижение размерности: PCA, t-SNE

**3. Reinforcement Learning (обучение с подкреплением)**
- Агент взаимодействует со средой
- Награды за правильные действия
- Примеры: игры, робототехника, рекомендации

### ML Pipeline:

\`\`\`
Данные → Очистка → Feature Engineering → Обучение → Оценка → Деплой
\`\`\``,
      },
      {
        type: 'quiz',
        quiz: [
          {
            id: 'q3-1-1',
            question: 'К какому типу ML относится задача определения спам-писем?',
            options: [
              { id: 'a', text: 'Unsupervised Learning — кластеризация' },
              { id: 'b', text: 'Supervised Learning — классификация' },
              { id: 'c', text: 'Reinforcement Learning' },
              { id: 'd', text: 'Semi-supervised Learning' },
            ],
            correctOptionId: 'b',
            explanation: 'Определение спама — это задача бинарной классификации (спам/не спам) с учителем, т.к. мы обучаем модель на размеченных данных.',
          },
        ],
      },
    ],
  },
  {
    id: 'lesson-3-2',
    materialId: 'mat-3',
    order: 2,
    title: 'Линейная регрессия — предсказание числовых значений',
    duration: '35 мин',
    contents: [
      {
        type: 'text',
        title: 'Линейная регрессия',
        body: `## Линейная регрессия — первый алгоритм ML

Самый простой и интерпретируемый алгоритм. Ищет линейную зависимость между признаками (X) и целевой переменной (y).

### Формула:
\`ŷ = w₁x₁ + w₂x₂ + ... + wₙxₙ + b\`

где:
- \`w\` — веса (weights)
- \`b\` — сдвиг (bias)
- \`x\` — признаки (features)

### Функция потерь (MSE):
\`MSE = (1/n) Σ (yᵢ - ŷᵢ)²\`

### Градиентный спуск:
Алгоритм итеративно обновляет веса в направлении наименьшей ошибки:

\`w = w - α · ∂MSE/∂w\`

где \`α\` — learning rate (скорость обучения).`,
      },
      {
        type: 'code',
        title: 'Линейная регрессия на scikit-learn',
        codeLanguage: 'python',
        code: `import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score

# Генерируем данные
np.random.seed(42)
X = np.random.rand(100, 1) * 10  # площадь квартиры
y = 2.5 * X.squeeze() + 10 + np.random.randn(100) * 2  # цена

# Делим на train/test
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Обучаем модель
model = LinearRegression()
model.fit(X_train, y_train)

# Предсказываем
y_pred = model.predict(X_test)

# Оцениваем
print(f"MSE: {mean_squared_error(y_test, y_pred):.2f}")
print(f"R²:  {r2_score(y_test, y_pred):.2f}")
print(f"Коэффициент: {model.coef_[0]:.2f}")
print(f"Сдвиг: {model.intercept_:.2f}")`,
      },
    ],
  },
];
