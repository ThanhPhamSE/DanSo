/**
 * 3 Càng Statistical & Probability Analytics Service
 * Evaluates 3 Càng for:
 * 1. 3 Càng Giải Đặc Biệt: sp.slice(-3) (e.g. 10760 -> 760)
 * 2. 3 Càng Giải Nhất: fp.slice(-3) (e.g. 34387 -> 387)
 *
 * Capabilities:
 * - 10 Càng Digit Analysis (0-9: Frequency, Gan, 30d, 90d, 365d, Bayesian forecast)
 * - Odd/Even, Big/Small (Tài/Xỉu) Distributions
 * - 3 Càng Structure / Classification (Distinct, Double/Kép, Triple/Tam hoa, Run/Sảnh)
 * - Sum of 3 Càng (0 - 27 distribution)
 * - Top 20 Most Frequent & Top 20 Coldest 3 Càng (000 - 999)
 * - Single 3 Càng lookup & full history
 * - 3 Càng Combination Generator (Càng x Dàn 2D) with historical backtesting
 */

export function extract3Cang(draw, target = 'db') {
  if (!draw) return null;
  const raw = target === 'db' ? draw.sp : draw.fp;
  if (!raw || typeof raw !== 'string' || raw.length < 3) return null;
  return raw.slice(-3);
}

export function extractCangDigit(draw, target = 'db') {
  const three = extract3Cang(draw, target);
  return three ? parseInt(three[0], 10) : null;
}

/**
 * Analyze the 10 Càng Digits (0 - 9, the hundreds place of 3 càng)
 */
export function analyzeCangDigits(historyData, target = 'db') {
  const validDraws = historyData.filter(d => extract3Cang(d, target));
  const total = validDraws.length;
  if (total === 0) return null;

  const chronicle = [...validDraws].reverse(); // oldest to newest
  const recent30 = chronicle.slice(-30);
  const recent60 = chronicle.slice(-60);
  const recent90 = chronicle.slice(-90);
  const recent365 = chronicle.slice(-365);

  const freqAll = Array(10).fill(0);
  const freq30 = Array(10).fill(0);
  const freq60 = Array(10).fill(0);
  const freq90 = Array(10).fill(0);
  const freq365 = Array(10).fill(0);

  const currentGan = Array(10).fill(0);
  const maxGan = Array(10).fill(0);
  const maxGanStart = Array(10).fill(null);
  const maxGanEnd = Array(10).fill(null);
  const tempStreakStart = Array(10).fill(null);

  // Parity & Size counters
  let evenCount = 0; // 0, 2, 4, 6, 8
  let oddCount = 0;  // 1, 3, 5, 7, 9
  let smallCount = 0; // 0, 1, 2, 3, 4 (Xỉu)
  let bigCount = 0;   // 5, 6, 7, 8, 9 (Tài)

  let currentStreak = { type: null, count: 0 };
  let maxEvenStreak = 0;
  let maxOddStreak = 0;
  let tempEvenStreak = 0;
  let tempOddStreak = 0;

  chronicle.forEach((draw) => {
    const dVal = extractCangDigit(draw, target);
    if (dVal === null) return;

    // Track parities
    if (dVal % 2 === 0) {
      evenCount++;
      tempEvenStreak++;
      tempOddStreak = 0;
      if (tempEvenStreak > maxEvenStreak) maxEvenStreak = tempEvenStreak;
    } else {
      oddCount++;
      tempOddStreak++;
      tempEvenStreak = 0;
      if (tempOddStreak > maxOddStreak) maxOddStreak = tempOddStreak;
    }

    if (dVal >= 5) bigCount++;
    else smallCount++;

    for (let digit = 0; digit <= 9; digit++) {
      if (digit === dVal) {
        freqAll[digit]++;
        currentGan[digit] = 0;
        tempStreakStart[digit] = null;
      } else {
        if (currentGan[digit] === 0) tempStreakStart[digit] = draw.d;
        currentGan[digit]++;
        if (currentGan[digit] > maxGan[digit]) {
          maxGan[digit] = currentGan[digit];
          maxGanStart[digit] = tempStreakStart[digit];
          maxGanEnd[digit] = draw.d;
        }
      }
    }
  });

  // Windows
  recent30.forEach(d => {
    const digit = extractCangDigit(d, target);
    if (digit !== null) freq30[digit]++;
  });
  recent60.forEach(d => {
    const digit = extractCangDigit(d, target);
    if (digit !== null) freq60[digit]++;
  });
  recent90.forEach(d => {
    const digit = extractCangDigit(d, target);
    if (digit !== null) freq90[digit]++;
  });
  recent365.forEach(d => {
    const digit = extractCangDigit(d, target);
    if (digit !== null) freq365[digit]++;
  });

  const latestDraw = validDraws[0];
  const latestCang = extractCangDigit(latestDraw, target);
  const latest3Cang = extract3Cang(latestDraw, target);

  // Compile detailed metrics for digits 0-9
  const digitStats = Array.from({ length: 10 }, (_, digit) => {
    const totalHits = freqAll[digit];
    const rateAll = parseFloat(((totalHits / total) * 100).toFixed(2));
    const rate30 = parseFloat(((freq30[digit] / Math.min(30, total)) * 100).toFixed(1));
    const rate90 = parseFloat(((freq90[digit] / Math.min(90, total)) * 100).toFixed(1));
    const rate365 = parseFloat(((freq365[digit] / Math.min(365, total)) * 100).toFixed(1));
    const avgGan = totalHits > 0 ? parseFloat(((total - totalHits) / totalHits).toFixed(1)) : total;
    const avgCycle = totalHits > 0 ? parseFloat((total / totalHits).toFixed(1)) : total;

    // Bayesian composite forecast score (0-100)
    // Combines 30d momentum, 90d trend, and gan status
    const momentum = (freq30[digit] / 3.0) * 40; // 30d expected is 3.0
    const ganPenalty = (currentGan[digit] / (maxGan[digit] || 1)) * 20;
    const ganHealth = Math.max(0, 30 - ganPenalty);
    const baseFreq = (totalHits / (total * 0.1)) * 30; // normalized to 30
    const forecastScore = Math.min(100, Math.max(10, parseFloat((momentum + ganHealth + baseFreq).toFixed(1))));

    return {
      digit,
      label: `Càng ${digit}`,
      hits: totalHits,
      rateAll,
      hits30: freq30[digit],
      rate30,
      hits60: freq60[digit],
      hits90: freq90[digit],
      rate90,
      hits365: freq365[digit],
      rate365,
      currentGan: currentGan[digit],
      maxGan: maxGan[digit],
      maxGanPeriod: maxGanStart[digit] ? `${maxGanStart[digit]} → ${maxGanEnd[digit]}` : '---',
      avgGan,
      avgCycle,
      forecastScore,
      isEven: digit % 2 === 0,
      isBig: digit >= 5
    };
  });

  // Rankings
  const topCangAll = [...digitStats].sort((a, b) => b.hits - a.hits);
  const topCang30 = [...digitStats].sort((a, b) => b.hits30 - a.hits30);
  const topGanCang = [...digitStats].sort((a, b) => b.currentGan - a.currentGan);
  const topForecastCang = [...digitStats].sort((a, b) => b.forecastScore - a.forecastScore);

  return {
    totalDraws: total,
    latestDrawDate: latestDraw?.d || '',
    latestCang,
    latest3Cang,
    digitStats,
    topCangAll,
    topCang30,
    topGanCang,
    topForecastCang,
    parity: {
      evenCount,
      oddCount,
      evenRate: parseFloat(((evenCount / total) * 100).toFixed(1)),
      oddRate: parseFloat(((oddCount / total) * 100).toFixed(1)),
      maxEvenStreak,
      maxOddStreak,
      currentType: latestCang !== null ? (latestCang % 2 === 0 ? 'Chẵn' : 'Lẻ') : '--'
    },
    size: {
      smallCount, // Xỉu 0-4
      bigCount,   // Tài 5-9
      smallRate: parseFloat(((smallCount / total) * 100).toFixed(1)),
      bigRate: parseFloat(((bigCount / total) * 100).toFixed(1)),
      currentType: latestCang !== null ? (latestCang >= 5 ? 'Tài (5-9)' : 'Xỉu (0-4)') : '--'
    }
  };
}

/**
 * Analyze 3 Càng Structure & Classifications (Distinct, Kép/Double, Tam hoa/Bão, Sảnh/Run)
 */
export function analyze3CangPatterns(historyData, target = 'db') {
  const validDraws = historyData.filter(d => extract3Cang(d, target));
  const total = validDraws.length;
  if (total === 0) return null;

  let countDistinct = 0;  // 3 distinct digits (e.g. 123, 760)
  let countDouble = 0;    // 2 identical digits (e.g. 112, 121, 122)
  let countTriple = 0;    // 3 identical digits (000, 111, ..., 999)
  let countRun = 0;       // Consecutive run (123, 234, 789 / 321, 987)

  const tripleEvents = [];
  const runEvents = [];

  validDraws.forEach(draw => {
    const val = extract3Cang(draw, target);
    if (!val) return;

    const d0 = val[0], d1 = val[1], d2 = val[2];
    const n0 = parseInt(d0, 10), n1 = parseInt(d1, 10), n2 = parseInt(d2, 10);

    const isTriple = (d0 === d1 && d1 === d2);
    const isDouble = !isTriple && (d0 === d1 || d0 === d2 || d1 === d2);
    const isDistinct = (d0 !== d1 && d0 !== d2 && d1 !== d2);

    const isRunAsc = (n1 === (n0 + 1) % 10 && n2 === (n1 + 1) % 10);
    const isRunDesc = (n1 === (n0 - 1 + 10) % 10 && n2 === (n1 - 1 + 10) % 10);
    const isRun = isRunAsc || isRunDesc;

    if (isTriple) {
      countTriple++;
      tripleEvents.push({ date: draw.d, value: val, full: target === 'db' ? draw.sp : draw.fp });
    } else if (isDouble) {
      countDouble++;
    } else if (isDistinct) {
      countDistinct++;
    }

    if (isRun) {
      countRun++;
      runEvents.push({ date: draw.d, value: val, type: isRunAsc ? 'Sảnh Tiến' : 'Sảnh Lùi' });
    }
  });

  return {
    totalDraws: total,
    distinct: {
      count: countDistinct,
      rate: parseFloat(((countDistinct / total) * 100).toFixed(2)),
      theoRate: 72.0, // 720 / 1000 = 72%
      label: '3 Chữ Số Khác Nhau (Ví dụ: 760, 387)'
    },
    double: {
      count: countDouble,
      rate: parseFloat(((countDouble / total) * 100).toFixed(2)),
      theoRate: 27.0, // 270 / 1000 = 27%
      label: '3 Càng Kép (Ví dụ: 112, 121, 122)'
    },
    triple: {
      count: countTriple,
      rate: parseFloat(((countTriple / total) * 100).toFixed(2)),
      theoRate: 1.0, // 10 / 1000 = 1%
      label: 'Tam Hoa / Bão (000, 111, ..., 999)',
      recentEvents: tripleEvents.slice(0, 10)
    },
    run: {
      count: countRun,
      rate: parseFloat(((countRun / total) * 100).toFixed(2)),
      label: 'Sảnh Tiến / Lùi (Ví dụ: 123, 234, 765)',
      recentEvents: runEvents.slice(0, 8)
    }
  };
}

/**
 * Analyze Sum of 3 Càng (Sums from 0 to 27)
 */
export function analyze3CangSums(historyData, target = 'db') {
  const validDraws = historyData.filter(d => extract3Cang(d, target));
  const total = validDraws.length;
  if (total === 0) return [];

  const chronicle = [...validDraws].reverse();
  const sumCounts = Array(28).fill(0);
  const currentGan = Array(28).fill(0);
  const maxGan = Array(28).fill(0);

  chronicle.forEach(draw => {
    const val = extract3Cang(draw, target);
    if (!val) return;
    const sum = parseInt(val[0], 10) + parseInt(val[1], 10) + parseInt(val[2], 10);

    for (let s = 0; s <= 27; s++) {
      if (s === sum) {
        sumCounts[s]++;
        currentGan[s] = 0;
      } else {
        currentGan[s]++;
        if (currentGan[s] > maxGan[s]) maxGan[s] = currentGan[s];
      }
    }
  });

  return Array.from({ length: 28 }, (_, sum) => ({
    sum,
    label: `Tổng ${sum}`,
    count: sumCounts[sum],
    rate: parseFloat(((sumCounts[sum] / total) * 100).toFixed(2)),
    currentGan: currentGan[sum],
    maxGan: maxGan[sum]
  })).sort((a, b) => b.count - a.count);
}

/**
 * Top 20 Most Frequent and Top 20 Coldest 3 Càng (000 - 999)
 */
export function analyzeTop3CangRankings(historyData, target = 'db') {
  const validDraws = historyData.filter(d => extract3Cang(d, target));
  const total = validDraws.length;
  if (total === 0) return { topHits: [], topGan: [] };

  const chronicle = [...validDraws].reverse();
  const hitCounts = {};
  const currentGan = {};
  const maxGan = {};
  const lastDate = {};

  for (let i = 0; i < 1000; i++) {
    const key = i.toString().padStart(3, '0');
    hitCounts[key] = 0;
    currentGan[key] = 0;
    maxGan[key] = 0;
    lastDate[key] = null;
  }

  chronicle.forEach(draw => {
    const val = extract3Cang(draw, target);
    if (!val) return;

    for (let i = 0; i < 1000; i++) {
      const key = i.toString().padStart(3, '0');
      if (key === val) {
        hitCounts[key]++;
        currentGan[key] = 0;
        lastDate[key] = draw.d;
      } else {
        currentGan[key]++;
        if (currentGan[key] > maxGan[key]) maxGan[key] = currentGan[key];
      }
    }
  });

  const allList = Object.keys(hitCounts).map(val => ({
    val,
    count: hitCounts[val],
    rate: parseFloat(((hitCounts[val] / total) * 100).toFixed(3)),
    currentGan: currentGan[val],
    maxGan: maxGan[val],
    lastDate: lastDate[val] || 'Chưa nổ từ 2010'
  }));

  const topHits = [...allList].sort((a, b) => b.count - a.count).slice(0, 20);
  const topGan = [...allList].sort((a, b) => b.currentGan - a.currentGan).slice(0, 20);

  return { topHits, topGan };
}

/**
 * Lookup single 3 Càng number (000 - 999)
 */
export function searchSingle3Cang(query, historyData, target = 'db') {
  const clean = String(query).trim().padStart(3, '0');
  if (!/^\d{3}$/.test(clean)) return null;

  const validDraws = historyData.filter(d => extract3Cang(d, target));
  const total = validDraws.length;
  if (total === 0) return null;

  let hits = 0;
  let currentGan = 0;
  let maxGan = 0;
  let tempGan = 0;
  let hitDates = [];

  const chronicle = [...validDraws].reverse();
  chronicle.forEach(draw => {
    const val = extract3Cang(draw, target);
    if (val === clean) {
      hits++;
      hitDates.push({ date: draw.d, fullPrize: target === 'db' ? draw.sp : draw.fp, ganBefore: tempGan });
      tempGan = 0;
    } else {
      tempGan++;
      if (tempGan > maxGan) maxGan = tempGan;
    }
  });
  currentGan = tempGan;

  const hitRate = parseFloat(((hits / total) * 100).toFixed(3));
  const avgGan = hits > 0 ? parseFloat(((total - hits) / hits).toFixed(1)) : total;

  return {
    val: clean,
    totalDraws: total,
    hits,
    hitRate,
    currentGan,
    maxGan,
    avgGan,
    lastHit: hitDates.length > 0 ? hitDates[hitDates.length - 1] : null,
    hitHistory: hitDates.reverse().slice(0, 15)
  };
}

/**
 * Evaluate a custom 3 Càng set (e.g. 50-200 numbers)
 */
export function evaluateCustom3CangSet(numbers3Cang, historyData, target = 'db') {
  if (!numbers3Cang || numbers3Cang.length === 0 || !historyData || historyData.length === 0) return null;

  const setObj = new Set(numbers3Cang.map(n => String(n).trim().padStart(3, '0')).filter(n => /^\d{3}$/.test(n)));
  const k = setObj.size;
  if (k === 0) return null;

  const validDraws = historyData.filter(d => extract3Cang(d, target));
  const total = validDraws.length;
  if (total === 0) return null;

  let hits = 0;
  let tempGan = 0;
  let maxGan = 0;
  let hitDates = [];

  const chronicle = [...validDraws].reverse();
  chronicle.forEach(draw => {
    const val = extract3Cang(draw, target);
    if (setObj.has(val)) {
      hits++;
      hitDates.push({ date: draw.d, prize: val, fullPrize: target === 'db' ? draw.sp : draw.fp });
      tempGan = 0;
    } else {
      tempGan++;
      if (tempGan > maxGan) maxGan = tempGan;
    }
  });

  const currentGan = tempGan;
  const hitRate = parseFloat(((hits / total) * 100).toFixed(2));
  const avgGan = hits > 0 ? parseFloat(((total - hits) / hits).toFixed(1)) : total;
  const pTheoretical = parseFloat(((k / 1000) * 100).toFixed(2));

  return {
    k,
    totalDraws: total,
    hits,
    hitRate,
    pTheoretical,
    currentGan,
    maxGan,
    avgGan,
    lastHit: hitDates.length > 0 ? hitDates[hitDates.length - 1] : null,
    recentHits: hitDates.reverse().slice(0, 10)
  };
}

/**
 * Generate 3 Càng by multiplying Càng digits with 2-digit numbers
 * Example: Càng [1, 2] x [15, 20] -> [115, 120, 215, 220]
 */
export function generate3CangFromMultiplication(cangDigits = [], numbers2D = []) {
  const result = [];
  const cangs = cangDigits.map(d => parseInt(d, 10)).filter(d => !isNaN(d) && d >= 0 && d <= 9);
  const nums = numbers2D.map(n => String(n).trim().padStart(2, '0')).filter(n => /^\d{2}$/.test(n));

  cangs.forEach(c => {
    nums.forEach(n => {
      result.push(`${c}${n}`);
    });
  });

  return Array.from(new Set(result)).sort();
}
