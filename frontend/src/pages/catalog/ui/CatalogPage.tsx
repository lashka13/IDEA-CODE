import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { SlidersHorizontal, X } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { selectAllMaterials } from '../../../entities/material';
import { selectAllUsers } from '../../../entities/user';
import { selectFilters, toggleLanguage, toggleDifficulty, toggleFormat, setSortBy, clearFilters } from '../../../features/filter-materials';
import { MaterialCard } from '../../../entities/material/ui/MaterialCard';
import { PageTransition, Tag, StaggerContainer, staggerItemVariants, GlassCard } from '../../../shared/ui';
import { cn } from '../../../shared/lib';
import type { Language, Difficulty, Format, SortBy } from '../../../shared/types';

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
];

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'junior', label: 'Junior' },
  { value: 'middle', label: 'Middle' },
  { value: 'senior', label: 'Senior' },
];

const FORMATS: { value: Format; label: string }[] = [
  { value: 'article', label: 'Статья' },
  { value: 'code', label: 'Код' },
  { value: 'video', label: 'Видео' },
  { value: 'presentation', label: 'Презентация' },
];

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'popular', label: 'Популярные' },
  { value: 'rating', label: 'По рейтингу' },
  { value: 'date', label: 'Новые' },
  { value: 'price-asc', label: 'Дешевле' },
  { value: 'price-desc', label: 'Дороже' },
];

export default function CatalogPage() {
  const dispatch = useAppDispatch();
  const materials = useAppSelector(selectAllMaterials);
  const users = useAppSelector(selectAllUsers);
  const filters = useAppSelector(selectFilters);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filtered = useMemo(() => {
    let result = [...materials];

    if (filters.languages.length > 0) {
      result = result.filter((m) => filters.languages.includes(m.language));
    }
    if (filters.difficulties.length > 0) {
      result = result.filter((m) => filters.difficulties.includes(m.difficulty));
    }
    if (filters.formats.length > 0) {
      result = result.filter((m) => filters.formats.includes(m.format));
    }

    switch (filters.sortBy) {
      case 'rating': result.sort((a, b) => b.rating - a.rating); break;
      case 'date': result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      case 'price-asc': result.sort((a, b) => a.price - b.price); break;
      case 'price-desc': result.sort((a, b) => b.price - a.price); break;
      default: result.sort((a, b) => b.purchaseCount - a.purchaseCount);
    }

    return result;
  }, [materials, filters]);

  const hasFilters = filters.languages.length > 0 || filters.difficulties.length > 0 || filters.formats.length > 0;

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold">Кейсы менторов</h1>
            <p className="text-white/30 text-sm mt-1">{filtered.length} материалов</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all',
                sidebarOpen ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20' : 'glass glass-hover text-white/60'
              )}
            >
              <SlidersHorizontal size={14} />
              <span className="hidden sm:inline">Фильтры</span>
            </button>
          </div>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {SORT_OPTIONS.map((opt) => (
            <Tag
              key={opt.value}
              active={filters.sortBy === opt.value}
              onClick={() => dispatch(setSortBy(opt.value))}
            >
              {opt.label}
            </Tag>
          ))}
          {hasFilters && (
            <button
              onClick={() => dispatch(clearFilters())}
              className="flex items-center gap-1 px-3 py-1 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <X size={12} /> Сбросить
            </button>
          )}
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          {sidebarOpen && (
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden md:block w-64 flex-shrink-0"
            >
              <GlassCard className="sticky top-24 space-y-6">
                {/* Language filter */}
                <div>
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Язык</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {LANGUAGES.map((lang) => (
                      <Tag
                        key={lang.value}
                        active={filters.languages.includes(lang.value)}
                        onClick={() => dispatch(toggleLanguage(lang.value))}
                      >
                        {lang.label}
                      </Tag>
                    ))}
                  </div>
                </div>

                {/* Difficulty filter */}
                <div>
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Уровень</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {DIFFICULTIES.map((d) => (
                      <Tag
                        key={d.value}
                        active={filters.difficulties.includes(d.value)}
                        onClick={() => dispatch(toggleDifficulty(d.value))}
                      >
                        {d.label}
                      </Tag>
                    ))}
                  </div>
                </div>

                {/* Format filter */}
                <div>
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Формат</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {FORMATS.map((f) => (
                      <Tag
                        key={f.value}
                        active={filters.formats.includes(f.value)}
                        onClick={() => dispatch(toggleFormat(f.value))}
                      >
                        {f.label}
                      </Tag>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </motion.aside>
          )}

          {/* Grid */}
          <div className="flex-1">
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((material) => (
                <motion.div key={material.id} variants={staggerItemVariants}>
                  <MaterialCard
                    material={material}
                    author={users.find((u) => u.id === material.authorId)}
                  />
                </motion.div>
              ))}
            </StaggerContainer>

            {filtered.length === 0 && (
              <div className="text-center py-20">
                <p className="text-white/30 text-lg">Ничего не найдено</p>
                <p className="text-white/20 text-sm mt-1">Попробуйте изменить фильтры</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
