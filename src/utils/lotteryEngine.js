/**
 * Lottery Engine Utility
 * Provides 4 Target Modes:
 * 1. db_tail: 2 số đuôi Giải Đặc Biệt (Đề ĐB)
 * 2. db_head: 2 số đầu Giải Đặc Biệt (Đầu ĐB)
 * 3. g1_tail: 2 số đuôi Giải Nhất (Đuôi G1)
 * 4. g1_head: 2 số đầu Giải Nhất (Đầu G1)
 */

export const TARGET_MODES = [
  { id: 'db_tail', label: '2 Số Đuôi ĐB (Đề ĐB)', short: 'Đuôi ĐB', icon: '🎯' },
  { id: 'db_head', label: '2 Số Đầu ĐB (Đầu ĐB)', short: 'Đầu ĐB', icon: '👑' },
  { id: 'g1_tail', label: '2 Số Đuôi G1 (Đuôi G1)', short: 'Đuôi G1', icon: '🥇' },
  { id: 'g1_head', label: '2 Số Đầu G1 (Đầu G1)', short: 'Đầu G1', icon: '⭐' }
];

export function getPrizeForMode(row, mode = 'db_tail') {
  if (!row) return '';
  const sp = String(row.sp || '');
  const fp = String(row.fp || '');

  switch (mode) {
    case 'db_head':
      return sp.length === 5 ? sp.slice(0, 2) : '';
    case 'db_tail':
    case 'de':
      return sp.length === 5 ? sp.slice(-2) : (row.db || '');
    case 'g1_head':
      return fp.length === 5 ? fp.slice(0, 2) : '';
    case 'g1_tail':
    case 'g1':
      return fp.length === 5 ? fp.slice(-2) : (row.g1 || '');
    default:
      return sp.length === 5 ? sp.slice(-2) : (row.db || '');
  }
}

export function getModeLabel(mode) {
  const found = TARGET_MODES.find(m => m.id === mode);
  return found ? found.label : '2 Số Đuôi ĐB (Đề ĐB)';
}

// Parse string to unique sorted array of 2-digit numbers
export function parseNumberSet(input) {
  if (!input) return [];
  const matches = String(input).match(/\d+/g) || [];
  const valid = new Set();
  for (const m of matches) {
    const num = parseInt(m, 10);
    if (!isNaN(num) && num >= 0 && num <= 99) {
      valid.add(num.toString().padStart(2, '0'));
    }
  }
  return Array.from(valid).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
}

// Bulk multiline parser
export function parseBulkSetsText(text) {
  if (!text) return [];
  const lines = text.split('\n');
  const sets = [];
  let setIndex = 1;

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    let name = `Dàn ${setIndex}`;
    let numbersText = line;

    if (line.includes(':')) {
      const parts = line.split(':');
      if (parts[0].trim().length < 35) {
        name = parts[0].trim();
        numbersText = parts.slice(1).join(':').trim();
      }
    }

    const numbers = parseNumberSet(numbersText);
    if (numbers.length > 0) {
      sets.push({
        id: `set_${Date.now()}_${setIndex}_${Math.random().toString(36).substring(2, 6)}`,
        name,
        numbers,
        note: `${numbers.length} số`,
        createdAt: new Date().toISOString()
      });
      setIndex++;
    }
  }

  return sets;
}
