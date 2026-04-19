import React from 'react';
import clsx from 'clsx';

/**
 * Baccarat/Long Hổ scoreboard ("cầu").
 * Shows Bead Road (hạt) + Big Road (đại lộ) — two patterns real casinos display.
 *
 * Results encoded as: 'banker' | 'player' | 'tie' (baccarat)
 *                  | 'long'   | 'ho'     | 'tie' (longho)
 */
type R = string;
export type RoadVariant = 'baccarat' | 'longho' | 'xocdia' | 'taixiu' | 'chonga';

const COLOR_B = 'bg-red-600 border-red-400 text-white';
const COLOR_P = 'bg-blue-600 border-blue-400 text-white';
const COLOR_T = 'bg-green-600 border-green-400 text-white';
const COLOR_O = 'bg-orange-500 border-orange-300 text-white';
const COLOR_PURPLE = 'bg-purple-600 border-purple-300 text-white';

// Which 2 sides to treat as red (B) vs blue (P) in the big road.
// Ties collapse onto the last non-tie cell as a diagonal slash.
const bigRoadSide = (r: R, variant: RoadVariant): 'B' | 'P' | 'T' => {
  if (variant === 'baccarat') {
    if (r === 'banker') return 'B';
    if (r === 'player') return 'P';
    return 'T';
  }
  if (variant === 'longho') {
    if (r === 'long') return 'B';
    if (r === 'ho') return 'P';
    return 'T';
  }
  if (variant === 'xocdia') {
    if (r === 'chan') return 'B';
    return 'P'; // 'le'
  }
  if (variant === 'chonga') {
    if (r === 'red') return 'B';
    return 'P'; // 'blue'
  }
  // taixiu
  if (r === 'tai') return 'B';
  if (r === 'xiu') return 'P';
  return 'T'; // 'triple' (rare — treat like tie)
};

const labelOf = (r: R, variant: RoadVariant) => {
  if (variant === 'baccarat') {
    if (r === 'tie') return 'H';
    return r === 'banker' ? 'C' : 'P';
  }
  if (variant === 'longho') {
    if (r === 'tie') return 'H';
    return r === 'long' ? 'L' : 'H̀';
  }
  if (variant === 'xocdia') {
    return r === 'chan' ? 'C' : 'L';
  }
  if (variant === 'chonga') {
    return r === 'red' ? 'Đ' : 'X';
  }
  // taixiu
  if (r === 'triple') return '3';
  return r === 'tai' ? 'T' : 'X';
};

const colorOf = (r: R, variant: RoadVariant) => {
  if (variant === 'baccarat') {
    if (r === 'tie') return COLOR_T;
    return r === 'banker' ? COLOR_B : COLOR_P;
  }
  if (variant === 'longho') {
    if (r === 'tie') return COLOR_T;
    return r === 'long' ? COLOR_B : COLOR_O;
  }
  if (variant === 'xocdia') {
    return r === 'chan' ? COLOR_B : COLOR_P;
  }
  if (variant === 'chonga') {
    return r === 'red' ? COLOR_B : COLOR_P;
  }
  // taixiu
  if (r === 'triple') return COLOR_PURPLE;
  return r === 'tai' ? COLOR_B : COLOR_P;
};

const legendOf = (variant: RoadVariant) => {
  if (variant === 'baccarat')
    return [
      { color: 'bg-blue-500', label: 'Con' },
      { color: 'bg-red-500', label: 'Cái' },
      { color: 'bg-green-500', label: 'Hòa' },
    ];
  if (variant === 'longho')
    return [
      { color: 'bg-orange-500', label: 'Hổ' },
      { color: 'bg-red-500', label: 'Long' },
      { color: 'bg-green-500', label: 'Hòa' },
    ];
  if (variant === 'xocdia')
    return [
      { color: 'bg-red-500', label: 'Chẵn' },
      { color: 'bg-blue-500', label: 'Lẻ' },
    ];
  if (variant === 'chonga')
    return [
      { color: 'bg-red-500', label: 'Gà Đỏ' },
      { color: 'bg-blue-500', label: 'Gà Xanh' },
    ];
  return [
    { color: 'bg-red-500', label: 'Tài' },
    { color: 'bg-blue-500', label: 'Xỉu' },
    { color: 'bg-purple-500', label: 'Ba đỏ' },
  ];
};

// Build Big Road: non-tie outcomes go into vertical columns; same side → stack down;
// side change → new column. Ties attach to the last non-tie cell (slash overlay).
const buildBigRoad = (history: R[], variant: RoadVariant) => {
  const MAX_ROWS = 6;
  type Cell = { side: 'B' | 'P'; ties: number };
  const cols: Cell[][] = [];
  let curCol: Cell[] = [];
  let curSide: 'B' | 'P' | null = null;

  const push = (side: 'B' | 'P') => {
    if (side === curSide && curCol.length < MAX_ROWS) {
      curCol.push({ side, ties: 0 });
    } else {
      if (curCol.length) cols.push(curCol);
      curCol = [{ side, ties: 0 }];
      curSide = side;
    }
  };

  for (const r of history) {
    const side = bigRoadSide(r, variant);
    if (side === 'T') {
      if (curCol.length) curCol[curCol.length - 1].ties += 1;
      continue;
    }
    push(side);
  }
  if (curCol.length) cols.push(curCol);
  return cols;
};

export const BaccaratRoad: React.FC<{
  history: R[]; // newest LAST
  variant: RoadVariant;
}> = ({ history, variant }) => {
  if (history.length === 0) return null;

  const beadRows = 6;
  const beadCols = Math.max(14, Math.ceil(history.length / beadRows));
  const bigRoad = buildBigRoad(history, variant);
  const legend = legendOf(variant);

  return (
    <div className="bg-black/50 border border-casino-gold/30 rounded-xl p-3 mb-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-black uppercase tracking-wider text-yellow-300/80">
          Cầu — Lịch sử {history.length} ván
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          {legend.map((l) => (
            <span key={l.label} className="flex items-center gap-1">
              <span className={clsx('w-2 h-2 rounded-full', l.color)} /> {l.label}
            </span>
          ))}
        </div>
      </div>

      {/* Bead Road: 6 rows, column-major fill */}
      <div className="mb-3">
        <div className="text-[10px] uppercase text-casino-muted mb-1">Cầu hạt</div>
        <div
          className="grid gap-[2px] overflow-x-auto pb-1"
          style={{
            gridTemplateRows: `repeat(${beadRows}, 18px)`,
            gridAutoFlow: 'column',
            gridAutoColumns: '18px',
          }}
        >
          {Array.from({ length: beadRows * beadCols }).map((_, i) => {
            // Column-major: column = floor(i / rows), row = i % rows
            const col = Math.floor(i / beadRows);
            const row = i % beadRows;
            const historyIdx = col * beadRows + row;
            const r = history[historyIdx];
            return (
              <div
                key={i}
                className={clsx(
                  'w-[18px] h-[18px] rounded-full border text-[9px] font-black flex items-center justify-center',
                  r ? colorOf(r, variant) : 'border-white/10 bg-white/5',
                )}
              >
                {r ? labelOf(r, variant) : ''}
              </div>
            );
          })}
        </div>
      </div>

      {/* Big Road: vertical streaks */}
      <div>
        <div className="text-[10px] uppercase text-casino-muted mb-1">Cầu lớn (Đại lộ)</div>
        <div
          className="grid gap-[2px] overflow-x-auto pb-1"
          style={{
            gridTemplateRows: 'repeat(6, 18px)',
            gridAutoFlow: 'column',
            gridAutoColumns: '18px',
          }}
        >
          {bigRoad.slice(-22).map((col, cIdx) =>
            Array.from({ length: 6 }).map((_, rIdx) => {
              const cell = col[rIdx];
              // Represent side via a fake history value to reuse labelOf/colorOf per variant.
              const fakeR =
                cell?.side === 'B'
                  ? variant === 'baccarat'
                    ? 'banker'
                    : variant === 'longho'
                    ? 'long'
                    : variant === 'xocdia'
                    ? 'chan'
                    : variant === 'chonga'
                    ? 'red'
                    : 'tai'
                  : variant === 'baccarat'
                  ? 'player'
                  : variant === 'longho'
                  ? 'ho'
                  : variant === 'xocdia'
                  ? 'le'
                  : variant === 'chonga'
                  ? 'blue'
                  : 'xiu';
              return (
                <div
                  key={`${cIdx}-${rIdx}`}
                  className={clsx(
                    'w-[18px] h-[18px] rounded-full border relative text-[9px] font-black flex items-center justify-center',
                    cell ? colorOf(fakeR, variant) : 'border-white/5',
                  )}
                >
                  {cell && (
                    <>
                      <span>{labelOf(fakeR, variant)}</span>
                      {cell.ties > 0 && (
                        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="absolute w-[130%] h-[2px] bg-green-400 rotate-45" />
                        </span>
                      )}
                    </>
                  )}
                </div>
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
};
