import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CATALOG, CatalogGame, getByCategory, getHot, getJackpot, getNew, getPlayable, getPlayableNow } from '../data/gameCatalog';
import { CATEGORIES, getCategory } from '../data/categories';
import { HeroCarousel, HeroSlide } from '../components/ui/HeroCarousel';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Badge } from '../components/ui/Badge';
import { CTAButton } from '../components/ui/CTAButton';
import { useSessionStore } from '../stores/useSessionStore';

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'welcome',
    highlight: 'Khuyến mãi HOT',
    title: 'Chào Mừng Đến TK88',
    subtitle: 'Nạp lần đầu tặng 100% lên đến 8,888,000 ₫ — chơi ngay không giới hạn!',
    icon: '🎰',
    gradient: 'from-red-700 via-rose-800 to-red-950',
    ctaLabel: 'Nhận Thưởng',
  },
  {
    id: 'vip',
    highlight: 'VIP Club',
    title: 'Hoàn Trả 1.5% Mỗi Ngày',
    subtitle: 'Hệ thống VIP 7 cấp · Thưởng sinh nhật · Quà đặc biệt cho thành viên cao cấp.',
    icon: '👑',
    gradient: 'from-yellow-600 via-orange-700 to-red-800',
    ctaLabel: 'Tham Gia VIP',
  },
  {
    id: 'live3d',
    highlight: 'Live 3D',
    title: 'Casino 3D Thế Hệ Mới',
    subtitle: 'Tài Xỉu · Xóc Đĩa · Baccarat · Long Hổ · Roulette — công nghệ Babylon.js.',
    icon: '🎲',
    gradient: 'from-emerald-600 via-teal-700 to-cyan-900',
    ctaLabel: 'Chơi 3D Ngay',
  },
  {
    id: 'nohu',
    highlight: 'Jackpot',
    title: 'Nổ Hũ Triệu Phú',
    subtitle: 'Jackpot cộng dồn hàng ngày — đang có 12,345,678,000 ₫ chờ bạn!',
    icon: '💰',
    gradient: 'from-amber-500 via-yellow-600 to-orange-700',
    ctaLabel: 'Quay Hũ',
  },
];

const GameCard: React.FC<{ game: CatalogGame; onClick: () => void }> = ({ game, onClick }) => {
  const favorites = useSessionStore.persist?.hasHydrated; // noop, just ensures store loaded
  void favorites;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.04, y: -4 }}
      whileTap={{ scale: 0.97 }}
      className="group cursor-pointer"
      onClick={onClick}
    >
      <div
        className={`relative aspect-[4/5] rounded-xl overflow-hidden bg-gradient-to-br ${game.gradient} shadow-lg shadow-black/50 ring-1 ring-white/10 group-hover:ring-casino-gold/60 group-hover:shadow-gold-glow transition-all`}
      >
        <div className="absolute inset-0 opacity-20 mix-blend-overlay">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white blur-2xl" />
          <div className="absolute bottom-0 -left-10 w-32 h-32 rounded-full bg-black blur-xl" />
        </div>

        <div className="absolute inset-0 flex items-center justify-center text-7xl drop-shadow-2xl group-hover:scale-110 transition-transform duration-300">
          {game.icon}
        </div>

        {/* Top-left: HOT / NEW */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {game.hot && <Badge variant="hot" pulse>HOT</Badge>}
          {game.isNew && <Badge variant="new">NEW</Badge>}
          {game.jackpot && <Badge variant="jackpot">JACKPOT</Badge>}
        </div>

        {/* Top-right: LIVE badge */}
        {game.real && (
          <div className="absolute top-2 right-2">
            <Badge variant="live">LIVE 3D</Badge>
          </div>
        )}

        {/* Bottom-right: provider */}
        <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur rounded px-2 py-0.5 text-[10px] font-black text-casino-gold uppercase tracking-wider">
          {game.provider}
        </div>

        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <div className="bg-cta-gradient text-black font-black px-4 py-1.5 rounded-full text-sm shadow-xl">
            ▶ CHƠI
          </div>
        </div>
      </div>
      <div className="mt-1.5 px-1 text-xs font-semibold text-white/90 truncate text-center">
        {game.name}
      </div>
    </motion.div>
  );
};

const GameRow: React.FC<{
  title: string;
  icon?: React.ReactNode;
  games: CatalogGame[];
  onPlay: (g: CatalogGame) => void;
  onSeeAll?: () => void;
}> = ({ title, icon, games, onPlay, onSeeAll }) => {
  if (games.length === 0) return null;
  return (
    <section className="mb-8">
      <SectionHeading
        icon={icon}
        title={title}
        action={
          onSeeAll && (
            <button
              onClick={onSeeAll}
              className="text-xs text-casino-gold hover:underline"
            >
              Xem tất cả →
            </button>
          )
        }
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
        {games.slice(0, 12).map((g) => (
          <GameCard key={g.id} game={g} onClick={() => onPlay(g)} />
        ))}
      </div>
    </section>
  );
};

export const Lobby: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const category = params.get('category');
  const [comingSoon, setComingSoon] = useState<string | null>(null);
  const openAuthModal = useSessionStore((s) => s.openAuthModal);
  const user = useSessionStore((s) => s.user);

  const categoryInfo = category ? getCategory(category) : null;

  const filteredGames = useMemo(() => {
    if (!category) return null;
    return getByCategory(category as any);
  }, [category]);

  const handlePlay = (game: CatalogGame) => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    const miniId = getPlayable(game);
    if (miniId) {
      navigate(`/play/${miniId}`);
      return;
    }
    setComingSoon(game.name);
    setTimeout(() => setComingSoon(null), 2200);
  };

  const hot = getHot();
  const jackpot = getJackpot();
  const newGames = getNew();
  const live3d = CATALOG.filter((g) => g.real);
  const playableNow = getPlayableNow();

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {/* Hero */}
      {!category && (
        <div className="mb-8">
          <HeroCarousel
            slides={HERO_SLIDES.map((s) => ({
              ...s,
              ctaOnClick: () => {
                if (s.id === 'welcome' || s.id === 'vip') {
                  if (!user) openAuthModal('register');
                  else navigate('/promotions');
                } else if (s.id === 'live3d') {
                  if (!user) openAuthModal('register');
                  else navigate('/play/taixiu');
                }
                else if (s.id === 'nohu')
                  navigate('/?category=nohu');
              },
            }))}
          />

          {/* Quick-access category tiles */}
          <div className="mt-6 grid grid-cols-4 md:grid-cols-8 gap-2 sm:gap-3">
            {CATEGORIES.map((c) => (
              <motion.button
                key={c.id}
                whileHover={{ scale: 1.06, y: -3 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/?category=${c.id}`)}
                className={`relative aspect-square rounded-xl bg-gradient-to-br ${c.accentColor} shadow-lg ring-1 ring-white/10 hover:ring-casino-gold/60 hover:shadow-gold-glow transition-all flex flex-col items-center justify-center`}
              >
                <span className="text-3xl md:text-4xl drop-shadow">{c.iconEmoji}</span>
                <span className="mt-1 text-[10px] md:text-xs font-black text-white tracking-wide uppercase">
                  {c.vnLabel}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Category header when filtered */}
      {categoryInfo && (
        <div className="mb-6">
          <div
            className={`rounded-xl p-5 sm:p-7 bg-gradient-to-br ${categoryInfo.accentColor} shadow-lg`}
          >
            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-5xl drop-shadow-lg">{categoryInfo.iconEmoji}</div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white uppercase drop-shadow">
                  {categoryInfo.vnLabel}
                </h1>
                <p className="text-sm text-white/90">{categoryInfo.description}</p>
              </div>
              <div className="ml-auto">
                <CTAButton
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate('/')}
                >
                  ← Tất cả danh mục
                </CTAButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rows */}
      {filteredGames ? (
        <div>
          <SectionHeading
            title={`${filteredGames.length} trò chơi`}
            subtitle={categoryInfo?.description}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
            {filteredGames.map((g) => (
              <GameCard key={g.id} game={g} onClick={() => handlePlay(g)} />
            ))}
          </div>
        </div>
      ) : (
        <>
          <GameRow
            title="🎮 Chơi Ngay — Trò Chơi Thật"
            icon="🎯"
            games={playableNow}
            onPlay={handlePlay}
          />
          <GameRow
            title="Live 3D Casino"
            icon="🎲"
            games={live3d}
            onPlay={handlePlay}
            onSeeAll={() => navigate('/?category=casino')}
          />
          <GameRow
            title="Đang Hot"
            icon="🔥"
            games={hot}
            onPlay={handlePlay}
          />
          <GameRow
            title="Nổ Hũ Triệu Phú"
            icon="💰"
            games={jackpot}
            onPlay={handlePlay}
            onSeeAll={() => navigate('/?category=nohu')}
          />
          {newGames.length > 0 && (
            <GameRow
              title="Mới Ra Mắt"
              icon="✨"
              games={newGames}
              onPlay={handlePlay}
            />
          )}
        </>
      )}

      {/* Coming soon toast */}
      <AnimatePresence>
        {comingSoon && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-cta-gradient text-black font-bold px-6 py-3 rounded-full shadow-2xl z-50"
          >
            🚧 {comingSoon} — Sắp ra mắt
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Lobby;
