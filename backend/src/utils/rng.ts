/**
 * Xorshift128+ PRNG - Shared between frontend and backend
 * Ensures identical results on both sides
 */
export class SeededRandom {
  private state: [number, number] = [0, 0];

  constructor(seed: string | number | bigint) {
    this.setSeed(seed);
  }

  private setSeed = (seed: string | number | bigint): void => {
    let hash = 0;

    if (typeof seed === 'string') {
      for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
    } else if (typeof seed === 'bigint') {
      hash = Number(seed);
    } else {
      hash = seed;
    }

    this.state[0] = hash;
    this.state[1] = hash ^ 0x9e3779b9;

    // Warm up
    for (let i = 0; i < 10; i++) {
      this.next();
    }
  };

  next = (): number => {
    const [a, b] = this.state;
    const result = (a + b) >>> 0;

    let x = a ^ (a << 23);
    this.state[0] = b;
    x = x ^ b ^ ((x >>> 17) ^ (b >>> 26));
    this.state[1] = x;

    return (result >>> 0) / 0x100000000;
  };

  nextInt = (min: number, max: number): number => {
    return min + Math.floor(this.next() * (max - min));
  };

  nextFloat = (min: number, max: number): number => {
    return min + this.next() * (max - min);
  };

  shuffle = <T>(array: T[]): T[] => {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  pick = <T>(array: T[]): T => {
    return array[this.nextInt(0, array.length)];
  };
}

/**
 * Dice roll
 */
export const rollDice = (seed: string | number | bigint): [number, number, number] => {
  const rng = new SeededRandom(seed);
  return [
    rng.nextInt(1, 7),
    rng.nextInt(1, 7),
    rng.nextInt(1, 7),
  ];
};

/**
 * Tài xỉu outcome
 */
export const getTaiXiuOutcome = (seed: string | number | bigint): 'tai' | 'xiu' | 'draw' => {
  const [d1, d2, d3] = rollDice(seed);
  const sum = d1 + d2 + d3;

  if (sum > 11) return 'tai';
  if (sum < 11) return 'xiu';
  return 'draw';
};

/**
 * Generate deck
 */
export const generateDeck = (seed: string | number | bigint): string[] => {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

  const deck = suits.flatMap((suit) =>
    ranks.map((rank) => `${rank}${suit}`)
  );

  const rng = new SeededRandom(seed);
  return rng.shuffle(deck);
};

/**
 * Baccarat hand evaluation
 */
export interface BaccaratHand {
  cards: string[];
  value: number;
  naturalWin: boolean;
}

export const evaluateBaccaratHand = (cards: string[]): BaccaratHand => {
  let value = 0;

  for (const card of cards) {
    const rank = card.charAt(0);
    let cardValue = 0;

    if (['J', 'Q', 'K'].includes(rank)) {
      cardValue = 0;
    } else if (rank === 'A') {
      cardValue = 1;
    } else if (rank === '10') {
      cardValue = 0;
    } else {
      cardValue = parseInt(rank);
    }

    value += cardValue;
  }

  value = value % 10;
  const naturalWin = cards.length === 2 && (value === 8 || value === 9);

  return { cards, value, naturalWin };
};

export const dealBaccarat = (seed: string | number | bigint): {
  player: BaccaratHand;
  banker: BaccaratHand;
  winner: 'player' | 'banker' | 'draw';
} => {
  const deck = generateDeck(seed);

  const playerCards = [deck[0], deck[1]];
  const bankerCards = [deck[2], deck[3]];

  const player = evaluateBaccaratHand(playerCards);
  const banker = evaluateBaccaratHand(bankerCards);

  let winner: 'player' | 'banker' | 'draw' = 'draw';

  if (player.value > banker.value) {
    winner = 'player';
  } else if (banker.value > player.value) {
    winner = 'banker';
  }

  return { player, banker, winner };
};

/**
 * Long Hổ outcome
 */
export const dealLongHo = (seed: string | number | bigint): {
  dragon: string;
  tiger: string;
  winner: 'dragon' | 'tiger' | 'draw';
} => {
  const deck = generateDeck(seed);

  const dragon = deck[0];
  const tiger = deck[1];

  const dragonValue = getCardValue(dragon);
  const tigerValue = getCardValue(tiger);

  let winner: 'dragon' | 'tiger' | 'draw' = 'draw';

  if (dragonValue > tigerValue) {
    winner = 'dragon';
  } else if (tigerValue > dragonValue) {
    winner = 'tiger';
  }

  return { dragon, tiger, winner };
};

const getCardValue = (card: string): number => {
  const rank = card.charAt(0);

  if (rank === 'A') return 1;
  if (rank === 'J') return 11;
  if (rank === 'Q') return 12;
  if (rank === 'K') return 13;

  return parseInt(rank);
};

/**
 * Roulette spin
 */
export const spinRoulette = (seed: string | number | bigint): number => {
  const rng = new SeededRandom(seed);
  return rng.nextInt(0, 37);
};

/**
 * Cup flip
 */
export const rollCup = (seed: string | number | bigint): 'even' | 'odd' => {
  const rng = new SeededRandom(seed);
  const coin1 = rng.next() > 0.5;
  const coin2 = rng.next() > 0.5;
  const coin3 = rng.next() > 0.5;

  const count = [coin1, coin2, coin3].filter((c) => c).length;
  return count % 2 === 0 ? 'even' : 'odd';
};
