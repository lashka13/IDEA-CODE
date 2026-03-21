import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, FileText, Code, Video, Presentation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../../app/store/hooks';
import { selectAllMaterials } from '../../../entities/material';

const FORMAT_ICONS: Record<string, any> = {
  article: FileText,
  code: Code,
  video: Video,
  presentation: Presentation,
};

export function HeaderSearch({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const materials = useAppSelector(selectAllMaterials);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return materials
      .filter((m) => m.title.toLowerCase().includes(q) || m.tags.some((t) => t.toLowerCase().includes(q)) || m.technology.some((t) => t.toLowerCase().includes(q)))
      .slice(0, 6);
  }, [query, materials]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) onClose(); // toggle, but here just handle esc
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleSelect = (id: string) => {
    navigate(`/catalog/${id}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[101] w-full max-w-2xl px-4"
          >
            <div className="glass p-2">
              <div className="flex items-center gap-3 px-3">
                <Search size={18} className="text-white/30 flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Поиск материалов, технологий..."
                  className="flex-1 bg-transparent text-white text-sm py-3 outline-none placeholder-white/30"
                />
                <kbd className="hidden sm:flex items-center px-2 py-0.5 text-[10px] text-white/20 border border-white/[0.06] rounded">ESC</kbd>
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/[0.06]">
                  <X size={16} className="text-white/30" />
                </button>
              </div>

              {suggestions.length > 0 && (
                <div className="border-t border-white/[0.06] mt-1 pt-1">
                  {suggestions.map((mat) => {
                    const Icon = FORMAT_ICONS[mat.format] || FileText;
                    return (
                      <button
                        key={mat.id}
                        onClick={() => handleSelect(mat.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                          <Icon size={14} className="text-white/40" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{mat.title}</p>
                          <p className="text-xs text-white/30">{mat.technology.join(', ')}</p>
                        </div>
                        <span className="text-xs text-accent-green font-medium">{mat.price} CC</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {query && suggestions.length === 0 && (
                <div className="border-t border-white/[0.06] mt-1 pt-4 pb-3 text-center">
                  <p className="text-sm text-white/30">Ничего не найдено</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
