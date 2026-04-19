export interface Category {
  id: string;
  vnLabel: string;
  enLabel: string;
  slug: string;
  iconEmoji: string;
  accentColor: string;
  description?: string;
}

export const CATEGORIES: Category[] = [
  {
    id: 'sports',
    vnLabel: 'THỂ THAO',
    enLabel: 'Sports',
    slug: 'the-thao',
    iconEmoji: '⚽',
    accentColor: 'from-green-500 to-emerald-700',
    description: 'Cá cược thể thao trực tiếp',
  },
  {
    id: 'casino',
    vnLabel: 'CASINO',
    enLabel: 'Live Casino',
    slug: 'casino',
    iconEmoji: '🎰',
    accentColor: 'from-red-600 to-rose-800',
    description: 'Sòng bài trực tuyến 3D',
  },
  {
    id: 'nohu',
    vnLabel: 'NỔ HŨ',
    enLabel: 'Jackpot',
    slug: 'no-hu',
    iconEmoji: '💰',
    accentColor: 'from-yellow-500 to-orange-600',
    description: 'Nổ hũ triệu phú',
  },
  {
    id: 'banca',
    vnLabel: 'BẮN CÁ',
    enLabel: 'Fishing',
    slug: 'ban-ca',
    iconEmoji: '🐟',
    accentColor: 'from-cyan-500 to-blue-700',
    description: 'Bắn cá ăn xu',
  },
  {
    id: 'gamebai',
    vnLabel: 'GAME BÀI',
    enLabel: 'Card Games',
    slug: 'game-bai',
    iconEmoji: '🃏',
    accentColor: 'from-emerald-500 to-green-800',
    description: 'Tiến lên, Xì dách, Poker',
  },
  {
    id: 'xoso',
    vnLabel: 'XỔ SỐ',
    enLabel: 'Lottery',
    slug: 'xo-so',
    iconEmoji: '🎱',
    accentColor: 'from-purple-500 to-fuchsia-700',
    description: 'Lô đề 3 miền',
  },
  {
    id: 'daga',
    vnLabel: 'ĐÁ GÀ',
    enLabel: 'Cockfight',
    slug: 'da-ga',
    iconEmoji: '🐓',
    accentColor: 'from-orange-500 to-red-700',
    description: 'Đá gà Campuchia trực tiếp',
  },
  {
    id: 'esports',
    vnLabel: 'E-SPORTS',
    enLabel: 'E-Sports',
    slug: 'e-sports',
    iconEmoji: '🎮',
    accentColor: 'from-indigo-500 to-purple-800',
    description: 'LOL, CS:GO, Valorant',
  },
];

export const getCategory = (id: string): Category | undefined =>
  CATEGORIES.find((c) => c.id === id || c.slug === id);
