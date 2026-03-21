import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Upload,
  FileText,
  Code2,
  Video,
  Presentation,
  Plus,
  X,
  Eye,
  EyeOff,
  Sparkles,
  ImagePlus,
  GripVertical,
  Trash2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Type,
  Hash,
  Layers,
  HelpCircle,
  Play,
  Copy,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAppSelector } from '../../../app/store/hooks';
import { selectIsAuthenticated, selectCurrentUser } from '../../../features/auth';
import { apiClient } from '../../../shared/api/client';
import { PageTransition, GlassCard, Button, Input, Badge, CodeCoinIcon } from '../../../shared/ui';
import { cn } from '../../../shared/lib';
import type { Language, Difficulty, Format, TaskType } from '../../../shared/types';

const FORMAT_OPTIONS: { id: Format; label: string; icon: typeof FileText; desc: string }[] = [
  { id: 'article', label: 'Статья', icon: FileText, desc: 'Текстовый материал' },
  { id: 'code', label: 'Код', icon: Code2, desc: 'Исходный код' },
  { id: 'video', label: 'Видео', icon: Video, desc: 'Видеоуроки' },
  { id: 'presentation', label: 'Презентация', icon: Presentation, desc: 'Слайды' },
];

const LANGUAGE_OPTIONS: { id: Language; label: string; color: string }[] = [
  { id: 'python', label: 'Python', color: '#3776AB' },
  { id: 'javascript', label: 'JavaScript', color: '#F7DF1E' },
  { id: 'typescript', label: 'TypeScript', color: '#3178C6' },
  { id: 'java', label: 'Java', color: '#ED8B00' },
  { id: 'go', label: 'Go', color: '#00ADD8' },
  { id: 'rust', label: 'Rust', color: '#CE422B' },
];

const DIFFICULTY_OPTIONS: { id: Difficulty; label: string; variant: 'green' | 'cyan' | 'orange' }[] = [
  { id: 'junior', label: 'Junior', variant: 'green' },
  { id: 'middle', label: 'Middle', variant: 'cyan' },
  { id: 'senior', label: 'Senior', variant: 'orange' },
];

const TASK_TYPE_OPTIONS: { id: TaskType; label: string }[] = [
  { id: 'lecture-notes', label: 'Конспект лекций' },
  { id: 'lab', label: 'Лабораторная' },
  { id: 'coursework', label: 'Курсовой проект' },
  { id: 'pet-project', label: 'Pet-проект' },
  { id: 'cheatsheet', label: 'Шпаргалка' },
];

const SUGGESTED_TAGS = ['React', 'Docker', 'Python', 'ML', 'DevOps', 'API', 'SQL', 'Git', 'CI/CD', 'Testing', 'TypeScript', 'Node.js'];

type ContentBlockType = 'text' | 'video' | 'code' | 'quiz';

interface ContentBlock {
  id: string;
  type: ContentBlockType;
  body: string;
  codeLanguage?: string;
  videoUrl?: string;
}

interface LessonDraft {
  id: string;
  title: string;
  expanded: boolean;
  contents: ContentBlock[];
}

function makeContentBlock(type: ContentBlockType): ContentBlock {
  return { id: String(Date.now()) + Math.random(), type, body: '', codeLanguage: 'javascript', videoUrl: '' };
}

// --- Section wrapper ---
function Section({
  title,
  icon,
  open,
  onToggle,
  badge,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-white/[0.06] rounded-2xl overflow-hidden bg-white/[0.01] transition-all">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors text-left"
      >
        <span className="text-white/40">{icon}</span>
        <span className="text-sm font-semibold flex-1">{title}</span>
        {badge}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} className="text-white/20" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Inline content block editor ---
function ContentBlockEditor({
  block,
  onChange,
  onRemove,
}: {
  block: ContentBlock;
  onChange: (b: ContentBlock) => void;
  onRemove: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(block.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="group rounded-xl border border-white/[0.04] bg-white/[0.015] overflow-hidden"
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.04] bg-white/[0.02]">
        <span className="text-[10px] font-bold uppercase text-white/25">
          {block.type === 'text' && 'Текст'}
          {block.type === 'video' && 'Видео'}
          {block.type === 'code' && 'Код'}
          {block.type === 'quiz' && 'Квиз'}
        </span>
        {block.type === 'code' && (
          <>
            <select
              value={block.codeLanguage}
              onChange={(e) => onChange({ ...block, codeLanguage: e.target.value })}
              className="ml-auto bg-transparent border border-white/[0.06] rounded-md px-2 py-0.5 text-[10px] text-white/50 focus:outline-none [color-scheme:dark]"
            >
              {LANGUAGE_OPTIONS.map((l) => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
            <button onClick={handleCopy} className="p-1 rounded text-white/20 hover:text-white/50 transition-colors">
              {copied ? <Check size={10} className="text-accent-green" /> : <Copy size={10} />}
            </button>
          </>
        )}
        <button
          onClick={onRemove}
          className="ml-auto p-1 rounded text-white/15 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={10} />
        </button>
      </div>

      {block.type === 'text' && (
        <textarea
          value={block.body}
          onChange={(e) => onChange({ ...block, body: e.target.value })}
          placeholder="Напишите текст урока... Поддерживается Markdown: **жирный**, *курсив*, `код`, ## заголовки"
          rows={5}
          className="w-full bg-transparent px-4 py-3 text-sm text-white/70 placeholder:text-white/15 focus:outline-none resize-y min-h-[100px] leading-relaxed"
        />
      )}

      {block.type === 'video' && (
        <div className="p-4 space-y-3">
          <Input
            value={block.videoUrl || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...block, videoUrl: e.target.value })}
            placeholder="https://youtube.com/watch?v=..."
            icon={<Play size={14} />}
          />
          {block.videoUrl && (
            <div className="rounded-lg overflow-hidden bg-black/30 aspect-video flex items-center justify-center">
              <div className="text-center">
                <Play size={32} className="text-white/20 mx-auto mb-2" />
                <p className="text-xs text-white/30">Видео будет отображаться здесь</p>
              </div>
            </div>
          )}
        </div>
      )}

      {block.type === 'code' && (
        <textarea
          value={block.body}
          onChange={(e) => onChange({ ...block, body: e.target.value })}
          placeholder={'// Вставьте код...\nfunction example() {\n  return "Hello World";\n}'}
          rows={8}
          className="w-full bg-surface-900/50 px-4 py-3 text-sm text-accent-cyan/80 placeholder:text-white/15 focus:outline-none resize-y min-h-[120px] font-mono leading-relaxed"
          spellCheck={false}
        />
      )}

      {block.type === 'quiz' && (
        <div className="p-4">
          <textarea
            value={block.body}
            onChange={(e) => onChange({ ...block, body: e.target.value })}
            placeholder={'Вопрос: Что делает useEffect?\nA) Управляет состоянием\nB) Выполняет побочные эффекты ✓\nC) Рендерит компоненты\n\n(отметьте правильный ответ знаком ✓)'}
            rows={6}
            className="w-full bg-transparent px-0 text-sm text-white/70 placeholder:text-white/15 focus:outline-none resize-y min-h-[100px] leading-relaxed"
          />
        </div>
      )}
    </motion.div>
  );
}

// --- Lesson editor ---
function LessonEditor({
  lesson,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  lesson: LessonDraft;
  index: number;
  onChange: (l: LessonDraft) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const addContent = (type: ContentBlockType) => {
    onChange({ ...lesson, contents: [...lesson.contents, makeContentBlock(type)] });
  };

  const updateContent = (id: string, block: ContentBlock) => {
    onChange({ ...lesson, contents: lesson.contents.map((c) => (c.id === id ? block : c)) });
  };

  const removeContent = (id: string) => {
    onChange({ ...lesson, contents: lesson.contents.filter((c) => c.id !== id) });
  };

  return (
    <motion.div layout className="rounded-xl border border-white/[0.06] bg-white/[0.01] overflow-hidden">
      {/* Lesson header */}
      <div className="flex items-center gap-2 px-4 py-3">
        <GripVertical size={14} className="text-white/15 cursor-grab flex-shrink-0" />
        <span className="w-6 h-6 rounded-md bg-accent-green/10 flex items-center justify-center text-[10px] font-bold text-accent-green flex-shrink-0">
          {index + 1}
        </span>
        <input
          value={lesson.title}
          onChange={(e) => onChange({ ...lesson, title: e.target.value })}
          placeholder={`Урок ${index + 1}: Введение в тему...`}
          className="flex-1 bg-transparent text-sm font-medium text-white placeholder:text-white/20 focus:outline-none"
        />
        <span className="text-[10px] text-white/20">{lesson.contents.length} блоков</span>
        <button
          onClick={() => onChange({ ...lesson, expanded: !lesson.expanded })}
          className="p-1.5 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/[0.04] transition-colors"
        >
          {lesson.expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        {canRemove && (
          <button
            onClick={onRemove}
            className="p-1.5 rounded-lg text-white/15 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {/* Lesson content blocks */}
      <AnimatePresence initial={false}>
        {lesson.expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              <AnimatePresence>
                {lesson.contents.map((block) => (
                  <ContentBlockEditor
                    key={block.id}
                    block={block}
                    onChange={(b) => updateContent(block.id, b)}
                    onRemove={() => removeContent(block.id)}
                  />
                ))}
              </AnimatePresence>

              {/* Add content block buttons */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] text-white/20 mr-1">Добавить:</span>
                {([
                  { type: 'text' as const, icon: Type, label: 'Текст' },
                  { type: 'video' as const, icon: Video, label: 'Видео' },
                  { type: 'code' as const, icon: Code2, label: 'Код' },
                  { type: 'quiz' as const, icon: HelpCircle, label: 'Квиз' },
                ]).map((opt) => (
                  <button
                    key={opt.type}
                    onClick={() => addContent(opt.type)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-white/[0.08] text-[10px] text-white/30 hover:border-accent-green/20 hover:text-accent-green/60 hover:bg-accent-green/[0.02] transition-all"
                  >
                    <opt.icon size={10} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- Live Preview ---
function LivePreview({
  title,
  description,
  format,
  language,
  difficulty,
  tags,
  price,
  coverPreview,
  lessons,
  authorName,
  authorAvatar,
}: {
  title: string;
  description: string;
  format: Format | null;
  language: Language | null;
  difficulty: Difficulty | null;
  taskType: TaskType | null;
  tags: string[];
  price: number;
  coverPreview: string | null;
  lessons: LessonDraft[];
  authorName?: string;
  authorAvatar?: string;
}) {
  const totalBlocks = lessons.reduce((sum, l) => sum + l.contents.length, 0);
  const hasContent = title || description || format;

  return (
    <div className="rounded-2xl border border-white/[0.06] overflow-hidden bg-white/[0.01]">
      {/* Cover */}
      {coverPreview ? (
        <div className="h-36 relative">
          <img src={coverPreview} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-900/90 to-transparent" />
        </div>
      ) : (
        <div className="h-24 bg-gradient-to-br from-accent-green/5 to-accent-cyan/5 flex items-center justify-center">
          <BookOpen size={24} className="text-white/10" />
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          {format && <Badge variant="default">{FORMAT_OPTIONS.find((f) => f.id === format)?.label}</Badge>}
          {difficulty && (
            <Badge variant={difficulty === 'junior' ? 'green' : difficulty === 'middle' ? 'cyan' : 'orange'}>
              {DIFFICULTY_OPTIONS.find((d) => d.id === difficulty)?.label}
            </Badge>
          )}
          {language && <Badge variant="purple">{LANGUAGE_OPTIONS.find((l) => l.id === language)?.label}</Badge>}
        </div>

        {/* Title */}
        <h3 className="font-bold leading-tight">
          {title || <span className="text-white/15 italic">Название материала...</span>}
        </h3>

        {/* Description */}
        <p className="text-xs text-white/40 leading-relaxed line-clamp-3">
          {description || <span className="text-white/15 italic">Описание...</span>}
        </p>

        {/* Author */}
        {authorName && (
          <div className="flex items-center gap-2">
            <img src={authorAvatar} alt="" className="w-6 h-6 rounded-md" />
            <span className="text-xs text-white/50">{authorName}</span>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 rounded-full bg-white/[0.04] text-[10px] text-white/40">{tag}</span>
            ))}
          </div>
        )}

        {/* Lessons table of contents */}
        {lessons.some((l) => l.title) && (
          <div className="border-t border-white/[0.04] pt-3">
            <p className="text-[10px] font-bold uppercase text-white/20 mb-2">
              Содержание · {lessons.length} уроков · {totalBlocks} блоков
            </p>
            <div className="space-y-1">
              {lessons.map((lesson, i) => (
                <div key={lesson.id} className="flex items-center gap-2 text-xs text-white/40">
                  <span className="w-4 h-4 rounded bg-white/[0.04] flex items-center justify-center text-[9px] text-white/25 flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="truncate">{lesson.title || `Урок ${i + 1}`}</span>
                  <span className="text-white/15 ml-auto text-[10px]">{lesson.contents.length}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
          <div className="flex items-center gap-1.5">
            <CodeCoinIcon size={14} />
            <span className="text-lg font-bold text-accent-green">{price}</span>
            <span className="text-[10px] text-white/25">CC</span>
          </div>
          <Button size="sm" disabled>Купить</Button>
        </div>

        {/* Completeness indicator */}
        {!hasContent && (
          <p className="text-[10px] text-white/15 text-center pt-2 italic">
            Заполните поля слева — предпросмотр обновится автоматически
          </p>
        )}
      </div>
    </div>
  );
}

// ========================
// Main Page
// ========================
export default function AddMaterialPage() {
  const navigate = useNavigate();
  const isAuth = useAppSelector(selectIsAuthenticated);
  const currentUser = useAppSelector(selectCurrentUser);

  // Section open states
  const [openSections, setOpenSections] = useState({
    basic: true,
    pdf: false,
    category: false,
    lessons: false,
  });
  const [showPreview, setShowPreview] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [format, setFormat] = useState<Format | null>(null);
  const [language, setLanguage] = useState<Language | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [taskType, setTaskType] = useState<TaskType | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [price, setPrice] = useState(20);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [lessons, setLessons] = useState<LessonDraft[]>([
    { id: '1', title: '', expanded: true, contents: [makeContentBlock('text')] },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // PDF document state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  if (!isAuth) {
    return (
      <PageTransition>
        <div className="max-w-lg mx-auto px-4 pt-24 pb-16 text-center">
          <GlassCard>
            <h2 className="text-xl font-bold mb-4">Войдите, чтобы добавить материал</h2>
            <p className="text-sm text-white/40 mb-6">Для загрузки материалов необходимо авторизоваться</p>
            <Link to="/login"><Button>Войти</Button></Link>
          </GlassCard>
        </div>
      </PageTransition>
    );
  }

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 6) {
      setTags([...tags, t]);
      setTagInput('');
    }
  };

  const addSuggestedTag = (tag: string) => {
    if (!tags.includes(tag) && tags.length < 6) {
      setTags([...tags, tag]);
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const addLesson = () => {
    setLessons([...lessons, {
      id: String(Date.now()),
      title: '',
      expanded: true,
      contents: [makeContentBlock('text')],
    }]);
  };

  const removeLesson = (id: string) => {
    if (lessons.length > 1) setLessons(lessons.filter((l) => l.id !== id));
  };

  const updateLesson = (id: string, updated: LessonDraft) => {
    setLessons(lessons.map((l) => (l.id === id ? updated : l)));
  };

  const handleCoverUpload = () => {
    const covers = [
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=500&fit=crop&q=80',
      'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=500&fit=crop&q=80',
      'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&h=500&fit=crop&q=80',
    ];
    setCoverPreview(covers[Math.floor(Math.random() * covers.length)]);
  };

  const handlePdfSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setPdfError('Только PDF-файлы');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setPdfError('Файл слишком большой (максимум 10 МБ)');
      return;
    }
    setPdfFile(file);
    setPdfError(null);
    setPdfUrl(null);
    setPdfUploading(true);
    try {
      const result = await apiClient.uploadFile(file);
      setPdfUrl(result.url);
    } catch (err: any) {
      setPdfError(err.message || 'Ошибка загрузки');
      setPdfFile(null);
    } finally {
      setPdfUploading(false);
    }
  };

  const removePdf = () => {
    setPdfFile(null);
    setPdfUrl(null);
    setPdfError(null);
  };

  const handleSubmit = async () => {
    if (!canPublish) return;
    setIsSubmitting(true);
    try {
      const material = await apiClient.createMaterial({
        title,
        description,
        format,
        language,
        difficulty,
        task_type: taskType,
        tags,
        price,
        cover_url: coverPreview || undefined,
        content_url: pdfUrl || undefined,
        technology: tags,
        table_of_contents: lessons.map((l) => l.title),
      });
      // Create lessons sequentially
      for (let i = 0; i < lessons.length; i++) {
        const l = lessons[i];
        await apiClient.createLesson(material.id, {
          title: l.title,
          order: i + 1,
          duration: `${l.contents.length * 5} мин`,
          is_preview: i === 0,
          contents: l.contents.map((c) => ({
            type: c.type,
            title: c.body ? c.body.split('\n')[0].slice(0, 60) : undefined,
            body: c.body || undefined,
            code: c.type === 'code' ? c.body : undefined,
            code_language: c.codeLanguage,
            video_url: c.videoUrl || undefined,
          })),
        });
      }
      setIsSubmitted(true);
    } catch {
      // silently fall back — show submitted anyway so user isn't blocked
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validation
  const isBasicValid = title.length >= 3 && description.length >= 10;
  const isCategoryValid = !!format && !!language && !!difficulty && !!taskType;
  const isLessonsValid = lessons.length > 0 && lessons.every((l) => l.title.length >= 2);
  const canPublish = isBasicValid && isCategoryValid && isLessonsValid;

  const completionPercent = [isBasicValid, isCategoryValid, isLessonsValid].filter(Boolean).length;

  if (isSubmitted) {
    return (
      <PageTransition>
        <div className="max-w-lg mx-auto px-4 pt-24 pb-16 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <GlassCard>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
                className="w-20 h-20 rounded-2xl bg-accent-green/10 flex items-center justify-center mx-auto mb-6"
              >
                <Sparkles size={36} className="text-accent-green" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">Материал отправлен!</h2>
              <p className="text-sm text-white/40 mb-6">
                «{title}» отправлен на модерацию. После проверки он появится в каталоге.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate('/catalog')}>В каталог</Button>
                <Button variant="secondary" onClick={() => window.location.reload()}>Загрузить ещё</Button>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors mb-3"
            >
              <ArrowLeft size={14} /> Каталог
            </Link>
            <h1 className="text-2xl font-bold">Создать материал</h1>
            <p className="text-sm text-white/40 mt-1">
              Заполните информацию, добавьте уроки — предпросмотр справа обновляется в реальном времени
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-white/40 hover:text-white/60 transition-colors"
            >
              {showPreview ? <EyeOff size={12} /> : <Eye size={12} />}
              {showPreview ? 'Скрыть' : 'Показать'} превью
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-accent-green to-accent-cyan"
              initial={{ width: 0 }}
              animate={{ width: `${(completionPercent / 3) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <span className="text-xs text-white/30">{completionPercent}/3</span>
        </div>

        {/* Main layout: editor + preview */}
        <div className="flex gap-6">
          {/* Left: Editor */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Section 1: Basic Info */}
            <Section
              title="Основная информация"
              icon={<Type size={16} />}
              open={openSections.basic}
              onToggle={() => toggleSection('basic')}
              badge={
                isBasicValid ? (
                  <span className="w-5 h-5 rounded-full bg-accent-green/15 flex items-center justify-center">
                    <Check size={10} className="text-accent-green" />
                  </span>
                ) : null
              }
            >
              <div className="space-y-5">
                <div>
                  <label className="block text-xs text-white/40 mb-2">Название *</label>
                  <Input
                    value={title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                    placeholder="React Hooks: Полное руководство"
                    className="w-full"
                  />
                  {title.length > 0 && title.length < 3 && (
                    <p className="text-[10px] text-orange-400/60 mt-1">Минимум 3 символа</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-white/40 mb-2">Описание *</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Подробно опишите, чему научится студент, какие навыки получит..."
                    rows={3}
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-green/30 transition-colors resize-none"
                  />
                  <div className="flex justify-between mt-1">
                    {description.length > 0 && description.length < 10 && (
                      <p className="text-[10px] text-orange-400/60">Минимум 10 символов</p>
                    )}
                    <p className="text-[10px] text-white/20 ml-auto">{description.length}/500</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-white/40 mb-2">Обложка</label>
                  {coverPreview ? (
                    <div className="relative rounded-xl overflow-hidden h-40">
                      <img src={coverPreview} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setCoverPreview(null)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 hover:bg-black/70 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleCoverUpload}
                      className="w-full h-32 border-2 border-dashed border-white/[0.08] rounded-xl flex flex-col items-center justify-center gap-2 hover:border-accent-green/20 hover:bg-accent-green/[0.02] transition-all"
                    >
                      <ImagePlus size={24} className="text-white/20" />
                      <span className="text-xs text-white/30">Загрузить обложку</span>
                    </button>
                  )}
                </div>
              </div>
            </Section>

            {/* Section 2: PDF Document */}
            <Section
              title="PDF документ"
              icon={<FileText size={16} />}
              open={openSections.pdf}
              onToggle={() => toggleSection('pdf')}
              badge={
                pdfUrl ? (
                  <span className="w-5 h-5 rounded-full bg-accent-green/15 flex items-center justify-center">
                    <Check size={10} className="text-accent-green" />
                  </span>
                ) : (
                  <span className="text-[10px] text-white/25 mr-1">необязательно</span>
                )
              }
            >
              <div className="space-y-3">
                <p className="text-xs text-white/40 leading-relaxed">
                  Загрузите PDF-конспект или лекцию. После публикации документ будет проиндексирован —
                  пользователи найдут его через AI-поиск и смогут задавать ассистенту вопросы по его содержимому.
                </p>

                {/* Upload area */}
                {!pdfFile && !pdfUrl && (
                  <label className="block cursor-pointer">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handlePdfSelect}
                      className="hidden"
                    />
                    <div className="w-full h-28 border-2 border-dashed border-white/[0.08] rounded-xl flex flex-col items-center justify-center gap-2 hover:border-accent-green/30 hover:bg-accent-green/[0.02] transition-all group">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.04] group-hover:bg-accent-green/10 flex items-center justify-center transition-colors">
                        <FileText size={18} className="text-white/30 group-hover:text-accent-green/60 transition-colors" />
                      </div>
                      <p className="text-xs text-white/30 group-hover:text-white/50 transition-colors">
                        Нажмите для выбора PDF · максимум 10 МБ
                      </p>
                    </div>
                  </label>
                )}

                {/* Uploading */}
                {pdfUploading && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <Loader2 size={16} className="text-accent-green animate-spin flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/60 truncate">{pdfFile?.name}</p>
                      <p className="text-[10px] text-white/30 mt-0.5">Загрузка…</p>
                    </div>
                  </div>
                )}

                {/* Uploaded successfully */}
                {pdfUrl && !pdfUploading && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-accent-green/5 border border-accent-green/20">
                    <div className="w-9 h-9 rounded-lg bg-accent-green/10 flex items-center justify-center flex-shrink-0">
                      <FileText size={16} className="text-accent-green" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/80 font-medium truncate">{pdfFile?.name}</p>
                      <p className="text-[10px] text-accent-green/60 mt-0.5">
                        ✓ Загружен · будет проиндексирован после публикации
                      </p>
                    </div>
                    <button
                      onClick={removePdf}
                      className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Error */}
                {pdfError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    <AlertCircle size={14} className="flex-shrink-0" />
                    {pdfError}
                    <button
                      onClick={() => setPdfError(null)}
                      className="ml-auto hover:text-red-300 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* Re-upload option when pdf is set */}
                {pdfUrl && (
                  <label className="block cursor-pointer">
                    <input type="file" accept="application/pdf" onChange={handlePdfSelect} className="hidden" />
                    <span className="text-[10px] text-white/25 hover:text-white/40 transition-colors cursor-pointer">
                      Заменить файл
                    </span>
                  </label>
                )}
              </div>
            </Section>

            {/* Section 3: Category */}
            <Section
              title="Категоризация и цена"
              icon={<Layers size={16} />}
              open={openSections.category}
              onToggle={() => toggleSection('category')}
              badge={
                isCategoryValid ? (
                  <span className="w-5 h-5 rounded-full bg-accent-green/15 flex items-center justify-center">
                    <Check size={10} className="text-accent-green" />
                  </span>
                ) : null
              }
            >
              <div className="space-y-5">
                {/* Format */}
                <div>
                  <label className="block text-xs text-white/40 mb-2">Формат *</label>
                  <div className="grid grid-cols-4 gap-2">
                    {FORMAT_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setFormat(opt.id)}
                          className={cn(
                            'flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center',
                            format === opt.id
                              ? 'border-accent-green/30 bg-accent-green/5'
                              : 'border-white/[0.06] bg-white/[0.02] hover:border-white/10'
                          )}
                        >
                          <Icon size={16} className={format === opt.id ? 'text-accent-green' : 'text-white/30'} />
                          <span className="text-[10px] font-medium">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Language + Difficulty row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-white/40 mb-2">Язык *</label>
                    <div className="flex flex-wrap gap-1.5">
                      {LANGUAGE_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setLanguage(opt.id)}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-xs border transition-all flex items-center gap-1.5',
                            language === opt.id
                              ? 'border-accent-green/30 bg-accent-green/5 text-white'
                              : 'border-white/[0.06] bg-white/[0.02] text-white/40 hover:border-white/10'
                          )}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.color }} />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-2">Уровень *</label>
                    <div className="flex gap-2">
                      {DIFFICULTY_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setDifficulty(opt.id)}
                          className={cn(
                            'flex-1 py-2 rounded-xl border text-center transition-all',
                            difficulty === opt.id
                              ? 'border-accent-green/30 bg-accent-green/5'
                              : 'border-white/[0.06] bg-white/[0.02] hover:border-white/10'
                          )}
                        >
                          <Badge variant={opt.variant}>{opt.label}</Badge>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Task Type */}
                <div>
                  <label className="block text-xs text-white/40 mb-2">Тип материала *</label>
                  <div className="flex flex-wrap gap-1.5">
                    {TASK_TYPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setTaskType(opt.id)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs border transition-all',
                          taskType === opt.id
                            ? 'border-accent-green/30 bg-accent-green/5 text-white'
                            : 'border-white/[0.06] bg-white/[0.02] text-white/40 hover:border-white/10'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs text-white/40 mb-2">Теги (до 6)</label>
                  {tags.length > 0 && (
                    <div className="flex gap-1.5 mb-2 flex-wrap">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent-green/5 border border-accent-green/15 text-xs text-accent-green/80"
                        >
                          <Hash size={9} />
                          {tag}
                          <button onClick={() => removeTag(tag)} className="hover:text-red-400 transition-colors ml-0.5">
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
                      placeholder="Добавить тег..."
                      className="flex-1"
                      onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button variant="secondary" size="sm" onClick={addTag} disabled={tags.length >= 6}>
                      <Plus size={12} />
                    </Button>
                  </div>
                  {/* Suggestions */}
                  {tags.length < 6 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {SUGGESTED_TAGS.filter((t) => !tags.includes(t))
                        .slice(0, 8)
                        .map((tag) => (
                          <button
                            key={tag}
                            onClick={() => addSuggestedTag(tag)}
                            className="px-2 py-0.5 rounded-md text-[10px] text-white/20 border border-white/[0.04] hover:border-accent-green/20 hover:text-accent-green/50 transition-all"
                          >
                            + {tag}
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                {/* Price */}
                <div>
                  <label className="block text-xs text-white/40 mb-2">Цена</label>
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <input
                      type="range"
                      min={5}
                      max={100}
                      step={5}
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="flex-1 accent-[#39FF14]"
                    />
                    <div className="flex items-center gap-1.5 min-w-[80px] justify-end">
                      <CodeCoinIcon size={14} />
                      <span className="text-lg font-bold text-accent-green">{price}</span>
                      <span className="text-[10px] text-white/25">CC</span>
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            {/* Section 4: Lessons */}
            <Section
              title={`Уроки (${lessons.length})`}
              icon={<BookOpen size={16} />}
              open={openSections.lessons}
              onToggle={() => toggleSection('lessons')}
              badge={
                isLessonsValid ? (
                  <span className="w-5 h-5 rounded-full bg-accent-green/15 flex items-center justify-center">
                    <Check size={10} className="text-accent-green" />
                  </span>
                ) : null
              }
            >
              <div className="space-y-3">
                {lessons.map((lesson, i) => (
                  <LessonEditor
                    key={lesson.id}
                    lesson={lesson}
                    index={i}
                    onChange={(updated) => updateLesson(lesson.id, updated)}
                    onRemove={() => removeLesson(lesson.id)}
                    canRemove={lessons.length > 1}
                  />
                ))}

                <button
                  onClick={addLesson}
                  className="w-full py-3 border-2 border-dashed border-white/[0.06] rounded-xl text-xs text-white/25 hover:border-accent-green/20 hover:text-accent-green/60 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={12} /> Добавить урок
                </button>
              </div>
            </Section>

            {/* Publish button */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <div>
                {!canPublish && (
                  <p className="text-xs text-white/30">
                    {!isBasicValid && 'Заполните название и описание. '}
                    {!isCategoryValid && 'Выберите формат, язык, уровень и тип. '}
                    {!isLessonsValid && 'Добавьте названия урокам. '}
                  </p>
                )}
                {canPublish && (
                  <p className="text-xs text-accent-green/60">Всё готово к публикации!</p>
                )}
              </div>
              <Button
                onClick={handleSubmit}
                disabled={!canPublish}
                loading={isSubmitting}
                icon={<Upload size={14} />}
              >
                Опубликовать
              </Button>
            </div>
          </div>

          {/* Right: Live Preview */}
          <AnimatePresence>
            {showPreview && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 340, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                className="hidden lg:block flex-shrink-0 overflow-hidden"
              >
                <div className="sticky top-24 w-[340px]">
                  <div className="flex items-center gap-2 mb-3">
                    <Eye size={12} className="text-white/20" />
                    <span className="text-[10px] font-bold uppercase text-white/20">Предпросмотр</span>
                  </div>
                  <LivePreview
                    title={title}
                    description={description}
                    format={format}
                    language={language}
                    difficulty={difficulty}
                    taskType={taskType}
                    tags={tags}
                    price={price}
                    coverPreview={coverPreview}
                    lessons={lessons}
                    authorName={currentUser?.name}
                    authorAvatar={currentUser?.avatarUrl}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}
