import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, FileText, Code, Video, Presentation, Users, Hash, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../../app/store/hooks';
import { selectAllMaterials } from '../../../entities/material';
import { selectAllUsers } from '../../../entities/user';
import { selectAllCommunities } from '../../../entities/community';
import { cn } from '../../../shared/lib';

const FORMAT_ICONS: Record<string, any> = {
  article: FileText, code: Code, video: Video, presentation: Presentation,
};

export function HeaderSearch({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const materials = useAppSelector(selectAllMaterials);
  const users = useAppSelector(selectAllUsers);
  const communities = useAppSelector(selectAllCommunities);

  const results = useMemo(() => {
    if (!query.trim() || query.length < 2) return null;
    const q = query.toLowerCase();

    const matchedMaterials = materials
      .filter((m) => m.title.toLowerCase().includes(q) || m.tags.some((t) => t.toLowerCase().includes(q)) || m.technology.some((t) => t.toLowerCase().includes(q)))
      .slice(0, 4);

    const matchedUsers = users
      .filter((u) => u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q))
      .slice(0, 3);

    const matchedCommunities = communities
      .filter((c) => c.name.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q))
      .slice(0, 3);

    return { materials: matchedMaterials, users: matchedUsers, communities: matchedCommunities };
  }, [query, materials, users, communities]);

  const hasResults = results && (results.materials.length + results.users.length + results.communities.length) > 0;

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
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const go = (path: string) => { navigate(path); onClose(); };

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
            <div className="glass overflow-hidden">
              {/* Input */}
              <div className="flex items-center gap-3 px-4 py-1">
                <Search size={18} className="text-white/30 flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Поиск материалов, людей, сообществ..."
                  className="flex-1 bg-transparent text-white text-sm py-3.5 outline-none placeholder-white/30"
                />
                <kbd className="hidden sm:flex items-center px-2 py-0.5 text-[10px] text-white/20 border border-white/[0.06] rounded">ESC</kbd>
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/[0.06]">
                  <X size={16} className="text-white/30" />
                </button>
              </div>

              {/* Results */}
              {results && (
                <div className="border-t border-white/[0.06]">
                  {hasResults ? (
                    <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
                      {/* Materials */}
                      {results.materials.length > 0 && (
                        <div className="p-2">
                          <p className="text-[10px] font-bold uppercase text-white/20 px-2 py-1.5">Материалы</p>
                          {results.materials.map((mat) => {
                            const Icon = FORMAT_ICONS[mat.format] || FileText;
                            return (
                              <button
                                key={mat.id}
                                onClick={() => go(`/catalog/${mat.id}`)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-white/[0.04] transition-colors"
                              >
                                <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                                  <Icon size={14} className="text-white/40" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-white truncate">{mat.title}</p>
                                  <p className="text-xs text-white/30 truncate">{mat.technology.join(', ')}</p>
                                </div>
                                <span className="text-xs text-accent-green font-medium flex-shrink-0">{mat.price} CC</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Users */}
                      {results.users.length > 0 && (
                        <div className={cn('p-2', results.materials.length > 0 && 'border-t border-white/[0.04]')}>
                          <p className="text-[10px] font-bold uppercase text-white/20 px-2 py-1.5">Пользователи</p>
                          {results.users.map((user) => (
                            <button
                              key={user.id}
                              onClick={() => go(`/profile/${user.id}`)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-white/[0.04] transition-colors"
                            >
                              <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-lg flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white">{user.name}</p>
                                <p className="text-xs text-white/30">@{user.username}</p>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-white/30 flex-shrink-0">
                                <Users size={10} /> {user.levelTitle}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Communities */}
                      {results.communities.length > 0 && (
                        <div className={cn('p-2', (results.materials.length > 0 || results.users.length > 0) && 'border-t border-white/[0.04]')}>
                          <p className="text-[10px] font-bold uppercase text-white/20 px-2 py-1.5">Сообщества</p>
                          {results.communities.map((comm) => (
                            <button
                              key={comm.id}
                              onClick={() => go(`/communities/${comm.slug}`)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-white/[0.04] transition-colors"
                            >
                              <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-lg flex-shrink-0">
                                {comm.iconEmoji}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white">{comm.name}</p>
                                <p className="text-xs text-white/30 flex items-center gap-1">
                                  <Hash size={9} /> {comm.memberCount} участников
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-sm text-white/30">Ничего не найдено по запросу «{query}»</p>
                    </div>
                  )}
                </div>
              )}

              {/* Hint when empty */}
              {!query && (
                <div className="border-t border-white/[0.06] px-4 py-3">
                  <p className="text-xs text-white/20">Начните вводить — поиск по материалам, людям и сообществам</p>
                </div>
              )}

              {/* AI Search footer — always visible when there is any input */}
              {query.length >= 1 && (
                <div className="border-t border-white/[0.06] px-4 py-2.5">
                  <button
                    onClick={() => go(`/ai-search?q=${encodeURIComponent(query)}`)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-accent-green/10 to-accent-cyan/10 border border-accent-green/20 hover:from-accent-green/20 hover:to-accent-cyan/20 hover:border-accent-green/40 transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles size={13} className="text-accent-green" />
                      <span className="text-xs font-medium text-accent-green">
                        AI-поиск: «{query}»
                      </span>
                    </div>
                    <span className="text-[10px] text-white/30 group-hover:text-white/50 transition-colors">
                      Найти по смыслу →
                    </span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
