export type CategoryId =
  | 'sports'
  | 'casino'
  | 'nohu'
  | 'banca'
  | 'gamebai'
  | 'xoso'
  | 'daga'
  | 'esports';

export type PlayableEngine =
  | 'taixiu'
  | 'xocdia'
  | 'baccarat'
  | 'longho'
  | 'coinflip'
  | 'slot'
  | 'number'
  | 'pick2'
  | 'chonga'
  | 'baucua';

export interface CatalogGame {
  id: string;
  name: string;
  provider: string;
  category: CategoryId;
  hot?: boolean;
  jackpot?: boolean;
  isNew?: boolean;
  favorite?: boolean;
  gradient: string;
  icon: string;
  real?: 'taiXiu' | 'xocDia' | 'baccarat' | 'longHo' | 'roulette';
  /**
   * Explicit playable engine override. If unset, a category-based fallback
   * is applied by getPlayable() so every lobby card is clickable.
   */
  playable?: PlayableEngine;
}

/** Map a CatalogGame to a playable engine ID (for routing to /play/:id). */
export const getPlayable = (g: CatalogGame): PlayableEngine | null => {
  if (g.playable) return g.playable;
  // Legacy `real` field covers the 4 built-in live games (roulette → pick2).
  if (g.real === 'taiXiu') return 'taixiu';
  if (g.real === 'xocDia') return 'xocdia';
  if (g.real === 'baccarat') return 'baccarat';
  if (g.real === 'longHo') return 'longho';
  if (g.real === 'roulette') return 'pick2';
  // Category-based fallbacks so every card is clickable.
  switch (g.category) {
    case 'nohu':
    case 'banca':
      return 'slot';
    case 'xoso':
      return 'number';
    case 'gamebai':
      return 'longho';
    case 'daga':
      return 'chonga';
    case 'sports':
    case 'esports':
      return 'pick2';
    case 'casino':
      return 'baccarat';
    default:
      return null;
  }
};

export interface Provider {
  id: string;
  name: string;
  subtitle?: string;
  logoText: string;
  logoColor: string;
}

export const PROVIDERS: Provider[] = [
  { id: 'all', name: 'TẤT CẢ', logoText: '★', logoColor: 'text-orange-400' },
  { id: 'live', name: 'BÀN CHƠI', subtitle: '3D Live', logoText: '🎲', logoColor: 'text-yellow-400' },
  { id: 'nohu', name: 'NỔ HŨ', logoText: '777', logoColor: 'text-yellow-500' },
  { id: '168game', name: '168Game', logoText: '168G', logoColor: 'text-orange-500' },
  { id: 'pg', name: 'PG', logoText: 'PG', logoColor: 'text-orange-400' },
  { id: 'jili', name: 'JILI', logoText: 'JILI', logoColor: 'text-red-500' },
  { id: 'fc', name: 'FC', logoText: 'FC', logoColor: 'text-red-600' },
  { id: 'mg', name: 'MG', logoText: 'MG', logoColor: 'text-teal-400' },
  { id: 'jdb', name: 'JDB', logoText: 'JDB', logoColor: 'text-yellow-600' },
  { id: 'pp', name: 'PP', logoText: 'PP', logoColor: 'text-yellow-500' },
  { id: 'mw', name: 'MW', logoText: 'MW', logoColor: 'text-purple-500' },
];

const G = {
  gold: 'from-yellow-500 via-orange-500 to-red-600',
  emerald: 'from-emerald-500 via-green-600 to-teal-700',
  ruby: 'from-pink-600 via-red-600 to-rose-800',
  sapphire: 'from-blue-500 via-indigo-600 to-purple-800',
  amethyst: 'from-purple-500 via-fuchsia-600 to-pink-700',
  sunset: 'from-orange-400 via-pink-500 to-red-600',
  jungle: 'from-green-600 via-emerald-700 to-teal-900',
  ocean: 'from-cyan-500 via-blue-600 to-indigo-900',
  dragon: 'from-red-600 via-orange-600 to-yellow-500',
  midnight: 'from-slate-700 via-purple-900 to-black',
  forest: 'from-lime-500 via-green-700 to-emerald-900',
  royal: 'from-amber-500 via-yellow-600 to-orange-700',
};

export const CATALOG: CatalogGame[] = [
  // --- CASINO (Live 3D + Table) ---
  { id: 'taiXiu', name: 'Tài Xỉu 3D', provider: 'live', category: 'casino', real: 'taiXiu', hot: true, gradient: G.ruby, icon: '🎲' },
  { id: 'xocDia', name: 'Xóc Đĩa 3D', provider: 'live', category: 'casino', real: 'xocDia', hot: true, gradient: G.gold, icon: '🪙' },
  { id: 'baccarat', name: 'Baccarat 3D', provider: 'live', category: 'casino', real: 'baccarat', hot: true, gradient: G.emerald, icon: '🃏' },
  { id: 'longHo', name: 'Long Hổ 3D', provider: 'live', category: 'casino', real: 'longHo', hot: true, gradient: G.dragon, icon: '🐉' },
  { id: 'roulette', name: 'Roulette 3D', provider: 'live', category: 'casino', real: 'roulette', hot: true, gradient: G.royal, icon: '🎡' },
  { id: '168-baccarat', name: 'Baccarat Kinh Điển', provider: '168game', category: 'casino', gradient: G.emerald, icon: '🃏' },
  { id: '168-sicbo', name: 'Sicbo Hoàng Gia', provider: '168game', category: 'casino', gradient: G.ruby, icon: '🎲' },
  { id: 'casino-speed', name: 'Speed Baccarat', provider: 'live', category: 'casino', gradient: G.sapphire, icon: '⚡' },
  { id: 'casino-dragon', name: 'Dragon Tiger Pro', provider: 'live', category: 'casino', gradient: G.dragon, icon: '🐉' },
  { id: 'casino-bbc', name: 'Bầu Cua Tôm Cá', provider: 'live', category: 'casino', hot: true, gradient: G.sunset, icon: '🦐', playable: 'baucua' },
  { id: 'casino-mini', name: 'Mini Baccarat', provider: 'live', category: 'casino', gradient: G.emerald, icon: '♦️' },
  { id: 'casino-vip', name: 'VIP Salon Privé', provider: 'live', category: 'casino', gradient: G.royal, icon: '👑' },

  // --- NỔ HŨ ---
  { id: 'nohu-super', name: 'Siêu Nổ Hũ 777', provider: 'nohu', category: 'nohu', hot: true, jackpot: true, gradient: G.gold, icon: '🎰' },
  { id: 'nohu-mega', name: 'Mega Jackpot', provider: 'nohu', category: 'nohu', hot: true, jackpot: true, gradient: G.ruby, icon: '💰' },
  { id: 'nohu-lucky', name: 'May Mắn Bùng Nổ', provider: 'nohu', category: 'nohu', gradient: G.sunset, icon: '✨' },
  { id: 'nohu-wheel', name: 'Vòng Quay Tỉ Phú', provider: 'nohu', category: 'nohu', jackpot: true, gradient: G.royal, icon: '🎡' },
  { id: 'nohu-phoenix', name: 'Phượng Hoàng Vàng', provider: 'nohu', category: 'nohu', hot: true, gradient: G.dragon, icon: '🔥' },
  { id: 'nohu-god', name: 'Thần Tài Giáng Trần', provider: 'nohu', category: 'nohu', jackpot: true, gradient: G.gold, icon: '🧧' },
  { id: 'pg-wealth', name: 'Thần Tài Đến', provider: 'pg', category: 'nohu', hot: true, gradient: G.gold, icon: '💰' },
  { id: 'pg-fortune', name: 'Vòng Xoay May Mắn', provider: 'pg', category: 'nohu', gradient: G.amethyst, icon: '🎰' },
  { id: 'pg-aztec', name: 'Kho Báu Aztec', provider: 'pg', category: 'nohu', hot: true, gradient: G.jungle, icon: '🗿' },
  { id: 'pg-neko', name: 'Neko May Mắn', provider: 'pg', category: 'nohu', hot: true, gradient: G.sunset, icon: '🐱' },
  { id: 'pg-phoenix', name: 'Phượng Hoàng Lửa', provider: 'pg', category: 'nohu', gradient: G.dragon, icon: '🔥' },
  { id: 'pp-gates', name: 'Cổng Olympus', provider: 'pp', category: 'nohu', hot: true, gradient: G.sapphire, icon: '⚡' },
  { id: 'pp-sweet', name: 'Kẹo Ngọt Ngào', provider: 'pp', category: 'nohu', gradient: G.sunset, icon: '🍬' },
  { id: 'pp-bonanza', name: 'Bonanza Vàng', provider: 'pp', category: 'nohu', hot: true, jackpot: true, gradient: G.gold, icon: '💎' },
  { id: 'pp-starlight', name: 'Ánh Sao Công Chúa', provider: 'pp', category: 'nohu', gradient: G.amethyst, icon: '⭐' },
  { id: 'fc-treasure', name: 'Đá Quý Và Vàng', provider: 'fc', category: 'nohu', hot: true, gradient: G.royal, icon: '💰' },
  { id: 'fc-samurai', name: 'Samurai Vinh Quang', provider: 'fc', category: 'nohu', gradient: G.ruby, icon: '⚔️' },
  { id: 'mg-asgard', name: 'Asgard Trỗi Dậy', provider: 'mg', category: 'nohu', hot: true, gradient: G.sapphire, icon: '⚡' },
  { id: 'mg-rage', name: 'Cơn Thịnh Nộ', provider: 'mg', category: 'nohu', gradient: G.dragon, icon: '🔥' },
  { id: 'mg-wizard', name: 'Phù Thủy Huyền Bí', provider: 'mg', category: 'nohu', gradient: G.amethyst, icon: '🧙' },
  { id: 'jdb-revenge', name: 'Sự Trả Thù Của Geisha', provider: 'jdb', category: 'nohu', hot: true, gradient: G.ruby, icon: '🌸' },
  { id: 'jdb-unicorn', name: 'Kỳ Lân Mách Bảo', provider: 'jdb', category: 'nohu', gradient: G.amethyst, icon: '🦄' },
  { id: 'jdb-lantern', name: 'Đèn Lồng Đỏ', provider: 'jdb', category: 'nohu', gradient: G.dragon, icon: '🏮' },
  { id: 'mw-dragon', name: 'Long Vương Thức Tỉnh', provider: 'mw', category: 'nohu', hot: true, gradient: G.dragon, icon: '🐲' },
  { id: 'mw-fortune', name: 'Tài Lộc Phát', provider: 'mw', category: 'nohu', gradient: G.gold, icon: '🧧' },

  // --- BẮN CÁ ---
  { id: 'jili-fish', name: 'Bắn Cá Hoàng Gia', provider: 'jili', category: 'banca', hot: true, gradient: G.ocean, icon: '🐟' },
  { id: 'banca-boss', name: 'Bắn Cá Boss 5D', provider: 'jili', category: 'banca', hot: true, gradient: G.ocean, icon: '🦈' },
  { id: 'banca-mermaid', name: 'Tiên Cá Đại Chiến', provider: 'pg', category: 'banca', gradient: G.sapphire, icon: '🧜‍♀️' },
  { id: 'banca-dragon', name: 'Long Vương Bắn Cá', provider: 'fc', category: 'banca', gradient: G.dragon, icon: '🐲' },
  { id: 'banca-deep', name: 'Thợ Săn Biển Sâu', provider: 'jdb', category: 'banca', gradient: G.ocean, icon: '🐙' },
  { id: 'banca-bomb', name: 'Ngư Lôi Vàng', provider: 'jili', category: 'banca', gradient: G.sunset, icon: '💣' },
  { id: 'banca-neptune', name: 'Thần Hải Vương', provider: 'mg', category: 'banca', hot: true, gradient: G.sapphire, icon: '🔱' },

  // --- GAME BÀI ---
  { id: 'gb-tienlen', name: 'Tiến Lên Miền Nam', provider: 'live', category: 'gamebai', hot: true, gradient: G.emerald, icon: '🃏' },
  { id: 'gb-tienlendem', name: 'Tiến Lên Đếm Lá', provider: 'live', category: 'gamebai', gradient: G.emerald, icon: '♠️' },
  { id: 'gb-phom', name: 'Phỏm – Tá Lả', provider: 'live', category: 'gamebai', hot: true, gradient: G.ruby, icon: '♥️' },
  { id: 'gb-xidach', name: 'Xì Dách 21', provider: 'live', category: 'gamebai', gradient: G.midnight, icon: '♣️' },
  { id: 'gb-poker', name: 'Poker Texas', provider: 'live', category: 'gamebai', gradient: G.royal, icon: '♦️' },
  { id: 'gb-mau', name: 'Mậu Binh', provider: 'live', category: 'gamebai', gradient: G.ruby, icon: '🎴' },
  { id: 'gb-binh', name: 'Binh Xập Xám', provider: 'live', category: 'gamebai', hot: true, gradient: G.dragon, icon: '🀄' },
  { id: 'gb-catte', name: 'Cát Tê', provider: 'live', category: 'gamebai', gradient: G.forest, icon: '🃁' },
  { id: 'gb-sam', name: 'Sâm Lốc', provider: 'live', category: 'gamebai', gradient: G.amethyst, icon: '🂱' },
  { id: 'pg-mahjong', name: 'Đường Mạt Chược', provider: 'pg', category: 'gamebai', gradient: G.emerald, icon: '🀄' },

  // --- XỔ SỐ / LÔ ĐỀ ---
  { id: 'xs-mb', name: 'Xổ Số Miền Bắc', provider: 'live', category: 'xoso', hot: true, gradient: G.ruby, icon: '🎱' },
  { id: 'xs-mt', name: 'Xổ Số Miền Trung', provider: 'live', category: 'xoso', gradient: G.sunset, icon: '🎰' },
  { id: 'xs-mn', name: 'Xổ Số Miền Nam', provider: 'live', category: 'xoso', hot: true, gradient: G.gold, icon: '🎯' },
  { id: 'xs-keno', name: 'Keno 1 Phút', provider: 'live', category: 'xoso', gradient: G.sapphire, icon: '🔢' },
  { id: 'xs-vietlott', name: 'Vietlott Power', provider: 'live', category: 'xoso', hot: true, gradient: G.royal, icon: '💫' },
  { id: 'xs-max', name: 'Max 3D Pro', provider: 'live', category: 'xoso', gradient: G.amethyst, icon: '🎲' },
  { id: 'xs-mega', name: 'Mega 6/45', provider: 'live', category: 'xoso', gradient: G.gold, icon: '🏆' },
  { id: 'xs-siamese', name: 'Xiên Nhanh', provider: 'live', category: 'xoso', gradient: G.emerald, icon: '🧧' },

  // --- BẮN CÁ extra + ĐÁ GÀ ---
  { id: 'daga-cam', name: 'Đá Gà Campuchia', provider: 'live', category: 'daga', hot: true, gradient: G.ruby, icon: '🐓' },
  { id: 'daga-thomo', name: 'Đá Gà Thomo', provider: 'live', category: 'daga', hot: true, gradient: G.sunset, icon: '🐔' },
  { id: 'daga-philippines', name: 'Đá Gà Philippines', provider: 'live', category: 'daga', gradient: G.dragon, icon: '🦅' },
  { id: 'daga-savan', name: 'Đá Gà Savan', provider: 'live', category: 'daga', gradient: G.forest, icon: '🐓' },
  { id: 'daga-cuasat', name: 'Đá Gà Cựa Sắt', provider: 'live', category: 'daga', gradient: G.ruby, icon: '⚔️' },
  { id: 'daga-cuadao', name: 'Đá Gà Cựa Dao', provider: 'live', category: 'daga', gradient: G.midnight, icon: '🗡️' },

  // --- THỂ THAO ---
  { id: 'sp-euro', name: 'Cúp C1 Châu Âu', provider: 'live', category: 'sports', hot: true, gradient: G.sapphire, icon: '⚽' },
  { id: 'sp-premier', name: 'Ngoại Hạng Anh', provider: 'live', category: 'sports', hot: true, gradient: G.ruby, icon: '🏆' },
  { id: 'sp-vleague', name: 'V-League Việt Nam', provider: 'live', category: 'sports', gradient: G.dragon, icon: '🇻🇳' },
  { id: 'sp-basket', name: 'NBA Bóng Rổ', provider: 'live', category: 'sports', gradient: G.sunset, icon: '🏀' },
  { id: 'sp-tennis', name: 'Tennis Grand Slam', provider: 'live', category: 'sports', gradient: G.forest, icon: '🎾' },
  { id: 'sp-boxing', name: 'Boxing WBA', provider: 'live', category: 'sports', gradient: G.ruby, icon: '🥊' },
  { id: 'sp-mma', name: 'UFC MMA', provider: 'live', category: 'sports', gradient: G.midnight, icon: '🥋' },
  { id: 'sp-f1', name: 'Đua Xe F1', provider: 'live', category: 'sports', gradient: G.dragon, icon: '🏎️' },
  { id: 'sp-horse', name: 'Đua Ngựa Hoàng Gia', provider: 'live', category: 'sports', gradient: G.royal, icon: '🏇' },
  { id: 'jili-money', name: 'Tiền Đạo Đỉnh Cao', provider: 'jili', category: 'sports', hot: true, gradient: G.forest, icon: '⚽' },
  { id: 'jili-boxing', name: 'Quyền Vương', provider: 'jili', category: 'sports', gradient: G.ruby, icon: '🥊' },

  // --- E-SPORTS ---
  { id: 'esp-lol', name: 'League of Legends', provider: 'live', category: 'esports', hot: true, gradient: G.sapphire, icon: '⚔️' },
  { id: 'esp-csgo', name: 'CS:GO 2', provider: 'live', category: 'esports', hot: true, gradient: G.midnight, icon: '🔫' },
  { id: 'esp-valorant', name: 'Valorant', provider: 'live', category: 'esports', gradient: G.ruby, icon: '🎯' },
  { id: 'esp-dota', name: 'Dota 2', provider: 'live', category: 'esports', gradient: G.amethyst, icon: '🗡️' },
  { id: 'esp-pubg', name: 'PUBG Mobile', provider: 'live', category: 'esports', gradient: G.forest, icon: '🪖' },
  { id: 'esp-lm', name: 'Liên Quân Mobile', provider: 'live', category: 'esports', hot: true, gradient: G.dragon, icon: '🎮' },
  { id: 'esp-fifa', name: 'FIFA Online 4', provider: 'live', category: 'esports', gradient: G.sapphire, icon: '⚽' },
  { id: 'esp-aov', name: 'Arena of Valor', provider: 'live', category: 'esports', gradient: G.ruby, icon: '🛡️' },

  // --- Casino extras (PG/JILI/FC/MG/JDB/MW misc to fill rows) ---
  { id: 'pg-dinosaur', name: 'Đại Dịch Xác Sống', provider: 'pg', category: 'nohu', gradient: G.forest, icon: '🦖' },
  { id: 'pg-quyet', name: 'Quyết Chiến Giang Hồ', provider: 'pg', category: 'nohu', gradient: G.ruby, icon: '⚔️' },
  { id: 'jili-charge', name: 'Siêu Năng Lượng', provider: 'jili', category: 'nohu', gradient: G.sapphire, icon: '⚡' },
  { id: 'jili-gem', name: 'Đá Quý Huyền Bí', provider: 'jili', category: 'nohu', gradient: G.amethyst, icon: '💎' },
  { id: 'fc-ninja', name: 'Bóng Nhóm Ninja', provider: 'fc', category: 'nohu', gradient: G.midnight, icon: '🥷' },
  { id: 'fc-pirate', name: 'Cướp Biển Caribe', provider: 'fc', category: 'nohu', gradient: G.ocean, icon: '🏴\u200d☠️' },
  { id: 'mg-hunt', name: 'Cuộc Đi Săn Cuối', provider: 'mg', category: 'nohu', gradient: G.forest, icon: '🦁' },
  { id: 'jdb-pirate', name: 'Wild Đạo Tặc', provider: 'jdb', category: 'nohu', gradient: G.sunset, icon: '⚓' },
  { id: 'mw-warrior', name: 'Chiến Binh Ba Tư', provider: 'mw', category: 'nohu', gradient: G.royal, icon: '🏹' },
  { id: '168-rocket', name: 'Tên Lửa Tăng Tốc', provider: '168game', category: 'nohu', hot: true, gradient: G.sapphire, icon: '🚀' },
  { id: '168-mine', name: 'Mỏ Kim Cương', provider: '168game', category: 'nohu', gradient: G.amethyst, icon: '💎' },
  { id: 'isNew-crash', name: 'Aviator Crash', provider: '168game', category: 'nohu', isNew: true, hot: true, gradient: G.sapphire, icon: '✈️' },
  { id: 'isNew-plinko', name: 'Plinko Vàng', provider: 'pp', category: 'nohu', isNew: true, gradient: G.sunset, icon: '🪙' },
  { id: 'isNew-hilo', name: 'Hi-Lo Rồng', provider: 'pg', category: 'nohu', isNew: true, gradient: G.dragon, icon: '🐲' },
];

export const getByCategory = (cat: CategoryId): CatalogGame[] =>
  CATALOG.filter((g) => g.category === cat);

export const getHot = (): CatalogGame[] => CATALOG.filter((g) => g.hot);
export const getJackpot = (): CatalogGame[] =>
  CATALOG.filter((g) => g.jackpot);
export const getNew = (): CatalogGame[] => CATALOG.filter((g) => g.isNew);

/**
 * Games with a dedicated playable scene (not just a generic category fallback).
 * These are the flagship interactive experiences shown on the home page.
 */
export const getPlayableNow = (): CatalogGame[] => {
  const flagships = CATALOG.filter((g) => g.real || g.playable);
  const firstDaga = CATALOG.find((g) => g.category === 'daga');
  // Surface one cockfight card so users can find the new chonga engine.
  if (firstDaga && !flagships.includes(firstDaga)) flagships.push(firstDaga);
  return flagships;
};
