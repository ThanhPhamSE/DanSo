/**
 * Enhanced Dàn Số Service
 * Dedicated independent analysis & storage for 4 distinct prize targets:
 * 1. db_tail: Dàn 2 số đuôi Giải Đặc Biệt (Đề ĐB)
 * 2. db_head: Dàn 2 số đầu Giải Đặc Biệt (Đầu ĐB)
 * 3. g1_tail: Dàn 2 số đuôi Giải Nhất (Đuôi G1)
 * 4. g1_head: Dàn 2 số đầu Giải Nhất (Đầu G1)
 *
 * Features:
 * - Isolated storage per target (lottery_sets_isolated_<target>)
 * - Dedicated Input/Import and Presets for each target
 * - In-depth 5-Year Gan Rhythm & Cycle Progression (2021 - 2026)
 * - T+1 and T+2 probability (Theoretical & Empirical Conditional)
 * - Quality Rating & Tier (⭐⭐⭐⭐⭐ Xuất Sắc / ⭐⭐⭐⭐ Rất Tốt / ⭐⭐⭐ Trung Bình / ⚠️ Yếu)
 * - Exact Gan analytics (Current Gan, Max Gan with date range, Avg Gan, Win Streak)
 * - Breakdown of individual numbers inside each set
 */

import firebasePresets from '../data/firebase_dan_so.json';
import { getPrizeForMode, parseNumberSet } from '../utils/lotteryEngine';

export const TARGET_CONFIGS = {
  db_tail: {
    id: 'db_tail',
    name: 'Dàn 2 Số Đuôi Giải Đặc Biệt (Đề ĐB)',
    short: 'Đuôi ĐB (Đề)',
    fullName: '2 SỐ ĐUÔI GIẢI ĐẶC BIỆT (ĐỀ MIỀN BẮC)',
    icon: '🎯',
    color: 'amber',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    prizeName: 'Đề ĐB'
  },
  db_head: {
    id: 'db_head',
    name: 'Dàn 2 Số Đầu Giải Đặc Biệt',
    short: 'Đầu ĐB',
    fullName: '2 SỐ ĐẦU GIẢI ĐẶC BIỆT',
    icon: '👑',
    color: 'sky',
    badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    prizeName: 'Đầu ĐB'
  },
  g1_tail: {
    id: 'g1_tail',
    name: 'Dàn 2 Số Đuôi Giải Nhất (Đuôi G1)',
    short: 'Đuôi G1',
    fullName: '2 SỐ ĐUÔI GIẢI NHẤT (ĐUÔI G1)',
    icon: '🥇',
    color: 'emerald',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    prizeName: 'Đuôi G1'
  },
  g1_head: {
    id: 'g1_head',
    name: 'Dàn 2 Số Đầu Giải Nhất (Đầu G1)',
    short: 'Đầu G1',
    fullName: '2 SỐ ĐẦU GIẢI NHẤT (ĐẦU G1)',
    icon: 'purple',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    prizeName: 'Đầu G1'
  }
};

/**
 * Generate default presets specifically tailored for each target
 */
export function getDefaultPresetsForTarget(targetMode) {
  const generateCham = (digits) => {
    const s = new Set();
    for (let i = 0; i < 100; i++) {
      const str = i.toString().padStart(2, '0');
      if (digits.some(d => str[0] === String(d) || str[1] === String(d))) {
        s.add(str);
      }
    }
    return Array.from(s).sort();
  };

  const generateTong = (totals) => {
    const s = new Set();
    for (let i = 0; i < 100; i++) {
      const d1 = Math.floor(i / 10);
      const d2 = i % 10;
      const sum = (d1 + d2) % 10;
      if (totals.includes(sum)) {
        s.add(i.toString().padStart(2, '0'));
      }
    }
    return Array.from(s).sort();
  };

  const generateDau = (daus) => {
    const s = new Set();
    for (let i = 0; i < 100; i++) {
      const d1 = Math.floor(i / 10);
      if (daus.includes(d1)) {
        s.add(i.toString().padStart(2, '0'));
      }
    }
    return Array.from(s).sort();
  };

  if (targetMode === 'db_tail') {
    return [
      {
        id: 'db_tail_64_thongdung',
        name: 'Dàn Đề 64 Số (Đầu 0,1,2,3,4,5,6,7)',
        numbers: generateDau([0, 1, 2, 3, 4, 5, 6, 7]),
        target: 'db_tail',
        note: 'Dàn chuẩn Đề MB 64 số phổ biến nhất',
        createdAt: new Date().toISOString()
      },
      {
        id: 'db_tail_cham_27',
        name: 'Dàn Đề Chạm 2 - Chạm 7 (36 Số)',
        numbers: generateCham([2, 7]),
        target: 'db_tail',
        note: 'Dàn Đề chạm 2 và chạm 7',
        createdAt: new Date().toISOString()
      },
      {
        id: 'db_tail_tong_chan',
        name: 'Dàn Đề Tổng Chẵn (50 Số)',
        numbers: generateTong([0, 2, 4, 6, 8]),
        target: 'db_tail',
        note: 'Dàn tổng chẵn 50 số',
        createdAt: new Date().toISOString()
      },
      {
        id: 'db_tail_tong_le',
        name: 'Dàn Đề Tổng Lẻ (50 Số)',
        numbers: generateTong([1, 3, 5, 7, 9]),
        target: 'db_tail',
        note: 'Dàn tổng lẻ 50 số',
        createdAt: new Date().toISOString()
      },
      {
        id: 'db_tail_fb_dan10',
        name: 'Dàn VIP 53 Số (Từ Firebase)',
        numbers: firebasePresets[0]?.numbers || generateCham([0, 3, 6, 8]),
        target: 'db_tail',
        note: 'Dàn trích xuất từ dữ liệu Firebase',
        createdAt: new Date().toISOString()
      }
    ];
  }

  if (targetMode === 'db_head') {
    return [
      {
        id: 'db_head_cham_05',
        name: 'Dàn Đầu ĐB Chạm 0 - Chạm 5 (36 Số)',
        numbers: generateCham([0, 5]),
        target: 'db_head',
        note: 'Dàn chạm 0 và 5 cho 2 số đầu Giải Đặc Biệt',
        createdAt: new Date().toISOString()
      },
      {
        id: 'db_head_tong_chan',
        name: 'Dàn Đầu ĐB Tổng Chẵn (50 Số)',
        numbers: generateTong([0, 2, 4, 6, 8]),
        target: 'db_head',
        note: 'Tổng chẵn cho 2 số đầu ĐB',
        createdAt: new Date().toISOString()
      },
      {
        id: 'db_head_dau_nho',
        name: 'Dàn Đầu ĐB Số Nhỏ 0-4 (50 Số)',
        numbers: generateDau([0, 1, 2, 3, 4]),
        target: 'db_head',
        note: '2 số đầu ĐB thuộc nhóm đầu 0 đến 4',
        createdAt: new Date().toISOString()
      },
      {
        id: 'db_head_fb_dan11',
        name: 'Dàn Đầu ĐB 51 Số (Từ Firebase)',
        numbers: firebasePresets[1]?.numbers || generateCham([1, 4, 7, 9]),
        target: 'db_head',
        note: 'Dàn trích xuất từ Firebase',
        createdAt: new Date().toISOString()
      }
    ];
  }

  if (targetMode === 'g1_tail') {
    return [
      {
        id: 'g1_tail_fb_dan10',
        name: 'Dàn Đuôi G1 Chuẩn (Dàn 10 - 53 Số)',
        numbers: firebasePresets[0]?.numbers || generateCham([0, 2, 4, 6]),
        target: 'g1_tail',
        note: 'Dàn G1 nguyên bản từ dữ liệu Firebase',
        createdAt: new Date().toISOString()
      },
      {
        id: 'g1_tail_fb_dan11',
        name: 'Dàn Đuôi G1 Chuẩn (Dàn 11 - 51 Số)',
        numbers: firebasePresets[1]?.numbers || generateCham([1, 3, 5, 7]),
        target: 'g1_tail',
        note: 'Dàn 11 trích xuất từ Firebase',
        createdAt: new Date().toISOString()
      },
      {
        id: 'g1_tail_cham_38',
        name: 'Dàn Đuôi G1 Chạm 3 - Chạm 8 (36 Số)',
        numbers: generateCham([3, 8]),
        target: 'g1_tail',
        note: 'Dàn chạm 3 và 8 cho 2 số đuôi Giải Nhất',
        createdAt: new Date().toISOString()
      },
      {
        id: 'g1_tail_tong_be',
        name: 'Dàn Đuôi G1 Tổng Bé 0,1,2,3,4 (50 Số)',
        numbers: generateTong([0, 1, 2, 3, 4]),
        target: 'g1_tail',
        note: 'Dàn tổng bé đuôi Giải Nhất',
        createdAt: new Date().toISOString()
      }
    ];
  }

  // g1_head
  return [
    {
      id: 'g1_head_cham_16',
      name: 'Dàn Đầu G1 Chạm 1 - Chạm 6 (36 Số)',
      numbers: generateCham([1, 6]),
      target: 'g1_head',
      note: 'Dàn chạm 1 và 6 cho 2 số đầu Giải Nhất',
      createdAt: new Date().toISOString()
    },
    {
      id: 'g1_head_dau_lon',
      name: 'Dàn Đầu G1 Đầu Lớn 5-9 (50 Số)',
      numbers: generateDau([5, 6, 7, 8, 9]),
      target: 'g1_head',
      note: 'Dàn đầu 5,6,7,8,9 cho 2 số đầu Giải Nhất',
      createdAt: new Date().toISOString()
    },
    {
      id: 'g1_head_tong_le',
      name: 'Dàn Đầu G1 Tổng Lẻ (50 Số)',
      numbers: generateTong([1, 3, 5, 7, 9]),
      target: 'g1_head',
      note: 'Dàn tổng lẻ 50 số cho 2 số đầu G1',
      createdAt: new Date().toISOString()
    },
    {
      id: 'g1_head_fb_dan12',
      name: 'Dàn Đầu G1 50 Số (Từ Firebase)',
      numbers: firebasePresets[2]?.numbers || generateCham([2, 5, 8]),
      target: 'g1_head',
      note: 'Dàn trích xuất từ Firebase',
      createdAt: new Date().toISOString()
    }
  ];
}

/**
 * Storage helpers for isolated targets
 */
export function getStorageKeyForTarget(targetMode) {
  return `lottery_sets_isolated_${targetMode || 'db_tail'}_v3`;
}

export function getSetsForTarget(targetMode) {
  const key = getStorageKeyForTarget(targetMode);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn(`Error loading sets for ${targetMode}:`, e);
  }

  // Fallback to default presets for this specific target
  const defaults = getDefaultPresetsForTarget(targetMode);
  saveSetsForTarget(targetMode, defaults);
  return defaults;
}

export function saveSetsForTarget(targetMode, sets) {
  const key = getStorageKeyForTarget(targetMode);
  try {
    localStorage.setItem(key, JSON.stringify(sets));
  } catch (e) {
    console.warn(`Error saving sets for ${targetMode}:`, e);
  }
}

/**
 * 5-YEAR GAN RHYTHM & PROGRESSION ANALYZER (2021 - 2026)
 * Specifically evaluates the rhythm, cycles, and distribution of Gan over the last 5 years.
 */
export function analyzeGanRhythm5Years(numbers, historyData, targetMode = 'db_tail') {
  if (!numbers || numbers.length === 0 || !historyData || historyData.length === 0) {
    return null;
  }

  const setObj = new Set(numbers);
  const k = setObj.size;

  // Filter valid draws from 2021-01-01 to present
  const fiveYearsDraws = historyData.filter(d => {
    const p = getPrizeForMode(d, targetMode);
    return Boolean(p) && (d.d >= '2021-01-01');
  });

  const total5YearsDays = fiveYearsDraws.length;
  if (total5YearsDays === 0) return null;

  // Chronological order: oldest (2021-01-01) to newest
  const chronicle = [...fiveYearsDraws].reverse();

  let totalHits = 0;
  let tempGan = 0;
  let maxGan5Y = 0;
  let maxGanStart5Y = null;
  let maxGanEnd5Y = null;
  let streakStart = null;

  let currentWinStreak = 0;
  let maxWinStreak5Y = 0;
  let tempWinStreak = 0;

  // Track each hit cycle (Nhịp Gan của từng lần nổ)
  const hitCycles = [];
  // Track daily timeline
  const dailyTimeline = [];

  // Yearly accumulator
  const yearlyMap = {};

  chronicle.forEach((draw) => {
    const year = draw.d.slice(0, 4);
    if (!yearlyMap[year]) {
      yearlyMap[year] = {
        year,
        totalDays: 0,
        hits: 0,
        maxGan: 0,
        tempGan: 0,
        tempStreak: 0,
        maxStreak: 0
      };
    }
    const yObj = yearlyMap[year];
    yObj.totalDays++;

    const prize = getPrizeForMode(draw, targetMode);
    const isHit = setObj.has(prize);

    if (isHit) {
      totalHits++;
      yObj.hits++;

      // Record hit cycle with gan before this hit
      hitCycles.push({
        date: draw.d,
        year,
        prize,
        ganBefore: tempGan,
        cycleLength: tempGan + 1
      });

      tempGan = 0;
      streakStart = null;
      tempWinStreak++;
      if (tempWinStreak > maxWinStreak5Y) maxWinStreak5Y = tempWinStreak;

      yObj.tempGan = 0;
      yObj.tempStreak++;
      if (yObj.tempStreak > yObj.maxStreak) yObj.maxStreak = yObj.tempStreak;
    } else {
      if (tempGan === 0) streakStart = draw.d;
      tempGan++;
      if (tempGan > maxGan5Y) {
        maxGan5Y = tempGan;
        maxGanStart5Y = streakStart;
        maxGanEnd5Y = draw.d;
      }
      tempWinStreak = 0;

      yObj.tempGan++;
      if (yObj.tempGan > yObj.maxGan) yObj.maxGan = yObj.tempGan;
      yObj.tempStreak = 0;
    }

    dailyTimeline.push({
      date: draw.d,
      year,
      prize,
      isHit,
      ganAtDay: tempGan
    });
  });

  const currentGan = tempGan;
  currentWinStreak = tempWinStreak;

  // Calculate Gan Rhythm Distribution (Nhịp gan thường về ở mức mấy ngày)
  const rhythmDistribution = {
    '0 ngày (Ăn thông)': 0,
    '1 ngày (Nổ lại)': 0,
    '2 ngày': 0,
    '3-4 ngày': 0,
    '5-7 ngày': 0,
    '8-10 ngày': 0,
    '> 10 ngày (Gan dài)': 0
  };

  hitCycles.forEach(c => {
    const g = c.ganBefore;
    if (g === 0) rhythmDistribution['0 ngày (Ăn thông)']++;
    else if (g === 1) rhythmDistribution['1 ngày (Nổ lại)']++;
    else if (g === 2) rhythmDistribution['2 ngày']++;
    else if (g >= 3 && g <= 4) rhythmDistribution['3-4 ngày']++;
    else if (g >= 5 && g <= 7) rhythmDistribution['5-7 ngày']++;
    else if (g >= 8 && g <= 10) rhythmDistribution['8-10 ngày']++;
    else rhythmDistribution['> 10 ngày (Gan dài)']++;
  });

  const distributionChartData = Object.entries(rhythmDistribution).map(([label, count]) => ({
    name: label,
    count,
    rate: totalHits > 0 ? parseFloat(((count / totalHits) * 100).toFixed(1)) : 0
  }));

  // Yearly Summary Table
  const yearlyStats = Object.keys(yearlyMap).sort().reverse().map(yr => {
    const y = yearlyMap[yr];
    const hitRate = y.totalDays > 0 ? parseFloat(((y.hits / y.totalDays) * 100).toFixed(2)) : 0;
    const avgGan = y.hits > 0 ? parseFloat(((y.totalDays - y.hits) / y.hits).toFixed(1)) : 0;
    return {
      year: yr,
      totalDays: y.totalDays,
      hits: y.hits,
      hitRate,
      maxGan: y.maxGan,
      avgGan,
      maxWinStreak: y.maxStreak
    };
  });

  // Monthly aggregated data for 5-Year timeline chart (sampled for clear chart rendering)
  // Group by Year-Month: shows max gan reached and hits in that month
  const monthlyMap = {};
  dailyTimeline.forEach(d => {
    const ym = d.date.slice(0, 7); // '2021-01'
    if (!monthlyMap[ym]) {
      monthlyMap[ym] = { ym, year: ym.slice(0, 4), month: ym.slice(5, 7), draws: 0, hits: 0, maxGan: 0 };
    }
    monthlyMap[ym].draws++;
    if (d.isHit) monthlyMap[ym].hits++;
    if (d.ganAtDay > monthlyMap[ym].maxGan) monthlyMap[ym].maxGan = d.ganAtDay;
  });

  const monthlyTimelineChart = Object.values(monthlyMap).map(m => ({
    time: m.ym,
    year: m.year,
    month: `T${m.month}/${m.year.slice(2)}`,
    hits: m.hits,
    maxGan: m.maxGan,
    draws: m.draws,
    hitRate: parseFloat(((m.hits / m.draws) * 100).toFixed(1))
  }));

  // Detailed recent rhythm (last 80 hits)
  const recentHitsRhythm = hitCycles.slice(-80).map(c => ({
    date: c.date.slice(5),
    fullDate: c.date,
    ganBefore: c.ganBefore,
    prize: c.prize
  }));

  const hitRate5Y = parseFloat(((totalHits / total5YearsDays) * 100).toFixed(2));
  const avgGan5Y = totalHits > 0 ? parseFloat(((total5YearsDays - totalHits) / totalHits).toFixed(1)) : 0;

  return {
    k,
    targetMode,
    total5YearsDays,
    totalHits,
    hitRate5Y,
    currentGan,
    currentWinStreak,
    maxGan5Y,
    maxGanPeriod5Y: maxGanStart5Y ? `${maxGanStart5Y} → ${maxGanEnd5Y}` : '---',
    avgGan5Y,
    maxWinStreak5Y,
    distributionChartData,
    yearlyStats,
    monthlyTimelineChart,
    recentHitsRhythm,
    totalCyclesCount: hitCycles.length
  };
}

/**
 * Deep Analysis of a Set against a specific Target Mode (All-time 2010 - present)
 */
export function evaluateSetDeep(numbers, historyData, targetMode = 'db_tail') {
  if (!numbers || numbers.length === 0 || !historyData || historyData.length === 0) {
    return null;
  }

  const setObj = new Set(numbers);
  const k = setObj.size;

  const validDraws = historyData.filter(d => getPrizeForMode(d, targetMode));
  const totalDays = validDraws.length;
  if (totalDays === 0) return null;

  let hitDaysCount = 0;
  let hits7 = 0;
  let hits30 = 0;
  let hits60 = 0;
  let hits90 = 0;

  let maxGan = 0;
  let maxGanStart = null;
  let maxGanEnd = null;

  let currentWinStreak = 0;
  let maxWinStreak = 0;

  let tempGan = 0;
  let tempWinStreak = 0;
  let streakStart = null;

  const numberHitStats = {};
  numbers.forEach(n => { numberHitStats[n] = 0; });

  const chronicle = [...validDraws].reverse();
  const timelineHistory = [];
  const ganHistory = [];

  chronicle.forEach((day, idx) => {
    const prize = getPrizeForMode(day, targetMode);
    const isHit = setObj.has(prize);

    ganHistory.push({ ganBefore: tempGan, isHit, date: day.d });

    if (isHit) {
      hitDaysCount++;
      if (idx >= chronicle.length - 7) hits7++;
      if (idx >= chronicle.length - 30) hits30++;
      if (idx >= chronicle.length - 60) hits60++;
      if (idx >= chronicle.length - 90) hits90++;

      if (numberHitStats[prize] !== undefined) {
        numberHitStats[prize]++;
      }

      tempGan = 0;
      streakStart = null;
      tempWinStreak++;
      if (tempWinStreak > maxWinStreak) maxWinStreak = tempWinStreak;
    } else {
      if (tempGan === 0) streakStart = day.d;
      tempGan++;
      if (tempGan > maxGan) {
        maxGan = tempGan;
        maxGanStart = streakStart;
        maxGanEnd = day.d;
      }
      tempWinStreak = 0;
    }

    timelineHistory.push({
      date: day.d,
      prize,
      isHit,
      ganAtDay: tempGan,
      winStreakAtDay: tempWinStreak
    });
  });

  const currentGan = tempGan;
  currentWinStreak = tempWinStreak;

  // 1. Hit Rates
  const hitRateAll = parseFloat(((hitDaysCount / totalDays) * 100).toFixed(2));
  const hitRate7 = parseFloat(((hits7 / Math.min(7, totalDays)) * 100).toFixed(2));
  const hitRate30 = parseFloat(((hits30 / Math.min(30, totalDays)) * 100).toFixed(2));
  const hitRate60 = parseFloat(((hits60 / Math.min(60, totalDays)) * 100).toFixed(2));
  const hitRate90 = parseFloat(((hits90 / Math.min(90, totalDays)) * 100).toFixed(2));

  // 2. Gan and Cycle averages
  const avgGan = hitDaysCount > 0 ? parseFloat(((totalDays - hitDaysCount) / hitDaysCount).toFixed(1)) : 0;
  const avgCycle = hitDaysCount > 0 ? parseFloat((totalDays / hitDaysCount).toFixed(1)) : totalDays;

  // 3. Theoretical Probabilities
  const pSingleTheo = k / 100.0;
  const pT1TheoPercent = parseFloat((pSingleTheo * 100).toFixed(1));
  const pT2TheoGivenMissPercent = parseFloat(((1.0 - pSingleTheo) * pSingleTheo * 100).toFixed(1));
  const pT1orT2TheoPercent = parseFloat(((1.0 - Math.pow(1.0 - pSingleTheo, 2)) * 100).toFixed(1));

  // 4. Empirical Conditional Probabilities for T+1 and T+2 based on currentGan
  let timesReachedGan = 0;
  let empiricalHitT1 = 0;
  let empiricalHitT2 = 0;

  for (let i = 0; i < ganHistory.length; i++) {
    if (ganHistory[i].ganBefore === currentGan) {
      timesReachedGan++;
      if (ganHistory[i].isHit) {
        empiricalHitT1++;
      } else if (i + 1 < ganHistory.length && ganHistory[i + 1].isHit) {
        empiricalHitT2++;
      }
    }
  }

  const empiricalRateT1 = timesReachedGan > 0
    ? parseFloat(((empiricalHitT1 / timesReachedGan) * 100).toFixed(1))
    : pT1TheoPercent;

  const empiricalRateT1orT2 = timesReachedGan > 0
    ? parseFloat((((empiricalHitT1 + empiricalHitT2) / timesReachedGan) * 100).toFixed(1))
    : pT1orT2TheoPercent;

  // 5. Quality Score & Rating (0 - 100)
  const freqScore = Math.min(100, (hitRateAll / (pT1TheoPercent || 1)) * 50);
  const momentumScore = Math.min(100, (hitRate30 / (pT1TheoPercent || 1)) * 30);
  const ganPenalty = (currentGan / (maxGan || 1)) * 20;
  const ganHealthScore = Math.max(0, 20 - ganPenalty);

  const qualityScore = parseFloat((freqScore * 0.5 + momentumScore * 0.35 + ganHealthScore * 0.15).toFixed(1));

  let tier = 'Trung Bình';
  let tierColor = 'text-amber-400';
  let stars = '⭐⭐⭐';
  if (qualityScore >= 75) {
    tier = 'Xuất Sắc (Thường Xuyên Về)';
    tierColor = 'text-emerald-400';
    stars = '⭐⭐⭐⭐⭐';
  } else if (qualityScore >= 60) {
    tier = 'Rất Tốt (Ổn Định)';
    tierColor = 'text-cyan-400';
    stars = '⭐⭐⭐⭐';
  } else if (qualityScore < 45) {
    tier = 'Yếu (Ít Về / Gan Kéo Dài)';
    tierColor = 'text-rose-400';
    stars = '⭐⭐';
  }

  // 6. Individual numbers breakdown
  const sortedNumbers = Object.entries(numberHitStats)
    .map(([num, count]) => ({
      num,
      count,
      rate: parseFloat(((count / totalDays) * 100).toFixed(2))
    }))
    .sort((a, b) => b.count - a.count);

  // Latest day result
  const latestDraw = validDraws[0] || null;
  const latestPrize = getPrizeForMode(latestDraw, targetMode);
  const isHitToday = setObj.has(latestPrize);

  // Also calculate 5-Year Gan Rhythm
  const ganRhythm5Y = analyzeGanRhythm5Years(numbers, historyData, targetMode);

  return {
    k,
    targetMode,
    totalDays,
    hitDaysCount,
    missDaysCount: totalDays - hitDaysCount,
    hitRateAll,
    hitRate7,
    hitRate30,
    hitRate60,
    hitRate90,
    currentGan,
    maxGan,
    maxGanPeriod: maxGanStart ? `${maxGanStart} → ${maxGanEnd}` : '---',
    avgGan,
    avgCycle,
    currentWinStreak,
    maxWinStreak,
    // Probability forecasts
    theoretical: {
      pT1Percent: pT1TheoPercent,
      pT2Percent: pT2TheoGivenMissPercent,
      pT1orT2Percent: pT1orT2TheoPercent
    },
    empirical: {
      timesReachedGan,
      empiricalHitT1,
      empiricalHitT2,
      empiricalRateT1,
      empiricalRateT1orT2
    },
    // Quality & Rating
    qualityScore,
    tier,
    tierColor,
    stars,
    // Today result
    today: {
      date: latestDraw?.d || '',
      prize: latestPrize,
      isHit: isHitToday
    },
    sortedNumbers,
    topHits: sortedNumbers.slice(0, 5),
    leastHits: [...sortedNumbers].reverse().slice(0, 5),
    timelineHistory: timelineHistory.reverse(),
    // 5-Year Rhythm Analytics
    ganRhythm5Y
  };
}

export const evaluateSetDetailed = evaluateSetDeep;
export function evaluateSetOnHistory(numbers, historyData, mode = 'db_tail') {
  const deep = evaluateSetDeep(numbers, historyData, mode);
  if (!deep) return { hitRate: 0, currentGan: 0, maxGan: 0 };
  return {
    ...deep,
    hitRate: deep.hitRateAll
  };
}

// Legacy compatibility
export function getInitialSets() {
  return getSetsForTarget('db_tail');
}
export function saveSetsToStorage(sets) {
  saveSetsForTarget('db_tail', sets);
}
export const SET_CATEGORIES = [
  { id: 'db_tail', label: 'Dàn Đuôi ĐB (Đề)', short: 'Đuôi ĐB', icon: '🎯' },
  { id: 'db_head', label: 'Dàn Đầu ĐB', short: 'Đầu ĐB', icon: '👑' },
  { id: 'g1_tail', label: 'Dàn Đuôi G1', short: 'Đuôi G1', icon: '🥇' },
  { id: 'g1_head', label: 'Dàn Đầu G1', short: 'Đầu G1', icon: '⭐' }
];
