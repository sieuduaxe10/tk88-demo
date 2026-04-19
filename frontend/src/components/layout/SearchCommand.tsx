import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../stores/useSessionStore';
import { CATALOG } from '../../data/gameCatalog';

export const SearchCommand: React.FC = () => {
  const isOpen = useSessionStore((s) => s.isSearchOpen);
  const closeSearch = useSessionStore((s) => s.closeSearch);
  const openSearch = useSessionStore((s) => s.openSearch);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openSearch();
      }
      if (e.key === 'Escape' && isOpen) closeSearch();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openSearch, closeSearch, isOpen]);

  useEffect(() => {
    if (!isOpen) setQuery('');
  }, [isOpen]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CATALOG.slice(0, 8);
    return CATALOG.filter((g) => g.name.toLowerCase().includes(q)).slice(0, 12);
  }, [query]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-start justify-center pt-24 px-4"
          onClick={closeSearch}
        >
          <motion.div
            initial={{ y: -40, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-casino-card border border-casino-gold/30 rounded-2xl shadow-card-hover overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
              <span className="text-xl">🔍</span>
              <input
                autoFocus
                type="text"
                placeholder="Tìm game (Tài Xỉu, Baccarat, Nổ Hũ...)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-white placeholder-casino-muted text-sm"
              />
              <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded bg-white/10 text-[10px] text-casino-muted">
                ESC
              </kbd>
            </div>

            <div className="max-h-96 overflow-y-auto p-2">
              {results.length === 0 ? (
                <div className="p-8 text-center text-casino-muted text-sm">
                  Không tìm thấy game phù hợp.
                </div>
              ) : (
                results.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      closeSearch();
                      if (g.real) navigate(`/player?game=${g.real}`);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition text-left"
                  >
                    <div
                      className={`w-10 h-10 rounded-lg bg-gradient-to-br ${g.gradient} flex items-center justify-center text-xl shadow-lg`}
                    >
                      {g.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white">
                        {g.name}
                      </div>
                      <div className="text-[10px] text-casino-muted uppercase">
                        {g.provider}
                      </div>
                    </div>
                    {g.real && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-casino-gold text-black">
                        LIVE
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>

            <div className="px-4 py-2 border-t border-white/10 flex justify-between text-[10px] text-casino-muted">
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10">↵</kbd> Chọn
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10">Ctrl+K</kbd>{' '}
                Tìm nhanh
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchCommand;
