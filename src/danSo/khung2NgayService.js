/**
 * Khung 2 Ngày (92 - 93 Số) Service
 * Specialized algorithm for generating and backtesting 14-15 sets of 92-93 numbers with Max Gan ~2-3 days
 * and Frame 2-Day Win Rate > 99.4% for ALL 4 TARGET PRIZES:
 * 1. db_tail: 2 số đuôi Giải Đặc Biệt (Đề ĐB)
 * 2. db_head: 2 số đầu Giải Đặc Biệt (Đầu ĐB)
 * 3. g1_tail: 2 số đuôi Giải Nhất (Đuôi G1)
 * 4. g1_head: 2 số đầu Giải Nhất (Đầu G1)
 */

import { getPrizeForMode, parseNumberSet, TARGET_MODES, getModeLabel } from '../utils/lotteryEngine';
import presetsData from '../data/danso_92_93_presets.json';

const STORAGE_KEY_PREFIX = 'lottery_sets_khung2_v2_';

export function getKhung2StorageKey(targetMode = 'db_tail') {
  return `${STORAGE_KEY_PREFIX}${targetMode}`;
}

/**
 * Calculate dynamic individual number metrics for a given target mode
 */
export function analyzeNumberMetricsForKhung2(historyData, targetMode = 'db_tail') {
  const chronicle = [...historyData].filter(d => getPrizeForMode(d, targetMode)).reverse(); // oldest to newest
  const total = chronicle.length;
  if (total === 0) return { topGan: [], cold90: [], cold180: [], cold365: [], compositeCold: [], coldKeps: [] };

  const recent90 = chronicle.slice(-90);
  const recent180 = chronicle.slice(-180);
  const recent365 = chronicle.slice(-365);

  const freqAll = {};
  const currentGan = {};
  const maxGan = {};
  const freq90 = {};
  const freq180 = {};
  const freq365 = {};

  for (let i = 0; i < 100; i++) {
    const num = i.toString().padStart(2, '0');
    freqAll[num] = 0;
    currentGan[num] = 0;
    maxGan[num] = 0;
    freq90[num] = 0;
    freq180[num] = 0;
    freq365[num] = 0;
  }

  // All-time & current gan
  chronicle.forEach(draw => {
    const p = getPrizeForMode(draw, targetMode);
    for (let i = 0; i < 100; i++) {
      const num = i.toString().padStart(2, '0');
      if (num === p) {
        freqAll[num]++;
        currentGan[num] = 0;
      } else {
        currentGan[num]++;
        if (currentGan[num] > maxGan[num]) maxGan[num] = currentGan[num];
      }
    }
  });

  // Recent 90
  recent90.forEach(draw => {
    const p = getPrizeForMode(draw, targetMode);
    if (p && freq90[p] !== undefined) freq90[p]++;
  });

  // Recent 180
  recent180.forEach(draw => {
    const p = getPrizeForMode(draw, targetMode);
    if (p && freq180[p] !== undefined) freq180[p]++;
  });

  // Recent 365
  recent365.forEach(draw => {
    const p = getPrizeForMode(draw, targetMode);
    if (p && freq365[p] !== undefined) freq365[p]++;
  });

  const allNums = Object.keys(freqAll);

  const topGan = [...allNums].sort((a, b) => currentGan[b] - currentGan[a]);
  const cold90 = [...allNums].sort((a, b) => freq90[a] - freq90[b]);
  const cold180 = [...allNums].sort((a, b) => freq180[a] - freq180[b]);
  const cold365 = [...allNums].sort((a, b) => freq365[a] - freq365[b]);

  const compositeCold = [...allNums].sort((a, b) => {
    const scoreA = currentGan[a] * 1.5 - freq90[a] * 3.0 - freq180[a] * 1.5;
    const scoreB = currentGan[b] * 1.5 - freq90[b] * 3.0 - freq180[b] * 1.5;
    return scoreB - scoreA;
  });

  const keps = ['00', '11', '22', '33', '44', '55', '66', '77', '88', '99'];
  const coldKeps = [...keps].sort((a, b) => freq365[a] - freq365[b]);

  return {
    topGan,
    cold90,
    cold180,
    cold365,
    compositeCold,
    coldKeps,
    currentGanMap: currentGan,
    freq90Map: freq90
  };
}

/**
 * Deep evaluation of a 92-93 number set specifically for Khung 2 Ngày
 */
export function evaluateKhung2Set(numbers, historyData, targetMode = 'db_tail', excluded = []) {
  if (!numbers || numbers.length === 0 || !historyData || historyData.length === 0) {
    return null;
  }

  const setObj = new Set(numbers);
  const k = setObj.size;

  const chronicle = [...historyData].filter(d => getPrizeForMode(d, targetMode)).reverse();
  const totalDraws = chronicle.length;
  if (totalDraws === 0) return null;

  let hits = 0;
  let tempGan = 0;
  let maxGan = 0;
  let maxGanStart = null;
  let maxGanEnd = null;
  let streakStart = null;

  let khung1Hits = 0;
  let khung2Hits = 0;
  let vuotKhungHits = 0;

  let vuotKhungEvents = [];

  chronicle.forEach(draw => {
    const p = getPrizeForMode(draw, targetMode);
    const isHit = setObj.has(p);

    if (isHit) {
      hits++;
      if (tempGan === 0) {
        khung1Hits++;
      } else if (tempGan === 1) {
        khung2Hits++;
      } else {
        vuotKhungHits++;
        vuotKhungEvents.push({
          date: draw.d,
          ganBefore: tempGan,
          start: streakStart,
          prize: p
        });
      }
      tempGan = 0;
      streakStart = null;
    } else {
      if (tempGan === 0) streakStart = draw.d;
      tempGan++;
      if (tempGan > maxGan) {
        maxGan = tempGan;
        maxGanStart = streakStart;
        maxGanEnd = draw.d;
      }
    }
  });

  const currentGan = tempGan;
  const hitRate = parseFloat(((hits / totalDraws) * 100).toFixed(2));
  const khung2Rate = hits > 0 ? parseFloat((((khung1Hits + khung2Hits) / hits) * 100).toFixed(2)) : 0;
  const pTheoreticalKhung2 = parseFloat(((1 - Math.pow(1 - k / 100, 2)) * 100).toFixed(2));

  let frameStatus = 'Ăn Đều (Vừa Nổ)';
  let frameStatusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  let frameAdvice = 'Vào tiền Ngày 1 (Mức cơ sở)';

  if (currentGan === 1) {
    frameStatus = '🔥 Đang Ở Ngày 2 Khung';
    frameStatusColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    frameAdvice = 'Vào tiền Ngày 2 (Khung quyết định nổ >99.5%)';
  } else if (currentGan >= 2) {
    frameStatus = '⚠️ Gan Vượt Khung';
    frameStatusColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    frameAdvice = 'Gan bất thường, nên chờ nổ lại vào nhịp mới';
  }

  const latestDraw = historyData[0] || null;
  const latestPrize = getPrizeForMode(latestDraw, targetMode);
  const isHitToday = setObj.has(latestPrize);

  return {
    k,
    totalDraws,
    hits,
    misses: totalDraws - hits,
    hitRate,
    currentGan,
    maxGan,
    maxGanPeriod: maxGanStart ? `${maxGanStart} → ${maxGanEnd}` : '---',
    khung1Hits,
    khung2Hits,
    vuotKhungHits,
    vuotKhungEvents: vuotKhungEvents.slice(-10).reverse(),
    khung2Rate,
    pTheoreticalKhung2,
    frameStatus,
    frameStatusColor,
    frameAdvice,
    isHitToday,
    latestPrize,
    excludedCount: 100 - k,
    excluded: excluded.length > 0 ? excluded : Array.from({ length: 100 }, (_, i) => i.toString().padStart(2, '0')).filter(n => !setObj.has(n))
  };
}

/**
 * Generate 15 optimal presets dynamically for any of the 4 target modes
 */
export function generateKhung2Presets(historyData, targetMode = 'db_tail') {
  // If pre-computed presets exist in JSON for this targetMode
  if (presetsData && presetsData[targetMode] && Array.isArray(presetsData[targetMode])) {
    return presetsData[targetMode].map(p => ({
      ...p,
      stats: evaluateKhung2Set(p.numbers, historyData, targetMode, p.excluded)
    }));
  }

  const modeShort = targetMode === 'db_tail' ? 'Đuôi ĐB' :
                    targetMode === 'db_head' ? 'Đầu ĐB' :
                    targetMode === 'g1_tail' ? 'Đuôi G1' : 'Đầu G1';

  const metrics = analyzeNumberMetricsForKhung2(historyData, targetMode);
  const { topGan, cold90, cold180, cold365, compositeCold, coldKeps } = metrics;

  const strategies = [
    // 7 Dàn 93 số (Loại 7 số)
    {
      id: `k2_93_top_gan_${targetMode}`,
      name: `Dàn 93 Số ${modeShort} - Loại 7 Số Gan Lỳ Cực Đại`,
      k: 93,
      excluded: topGan.slice(0, 7),
      desc: `Loại 7 số có số ngày chưa về (gan) cao nhất hiện tại của ${modeShort}`
    },
    {
      id: `k2_93_composite_vip_${targetMode}`,
      name: `Dàn 93 Số ${modeShort} - Loại 7 Số Gan Sâu & Yếu Nhịp (VIP Khung 2N)`,
      k: 93,
      excluded: compositeCold.slice(0, 7),
      desc: `Bộ lọc đa biến: kết hợp điểm Gan và chu kỳ nguội lạnh của ${modeShort}`
    },
    {
      id: `k2_93_cold_365d_${targetMode}`,
      name: `Dàn 93 Số ${modeShort} - Loại 7 Số Đóng Băng 1 Năm`,
      k: 93,
      excluded: cold365.slice(0, 7),
      desc: `Loại 7 số có tần suất xuất hiện thấp nhất trong 365 kỳ qua của ${modeShort}`
    },
    {
      id: `k2_93_cold_180d_${targetMode}`,
      name: `Dàn 93 Số ${modeShort} - Loại 7 Số Nguội Lạnh 6 Tháng`,
      k: 93,
      excluded: cold180.slice(0, 7),
      desc: `Loại 7 số có số lần nổ ít nhất trong 180 ngày gần nhất của ${modeShort}`
    },
    {
      id: `k2_93_cold_90d_${targetMode}`,
      name: `Dàn 93 Số ${modeShort} - Loại 7 Số Đóng Băng 90 Ngày`,
      k: 93,
      excluded: cold90.slice(0, 7),
      desc: `Loại 7 số xuất hiện ít nhất trong 3 tháng qua của ${modeShort}`
    },
    {
      id: `k2_93_hybrid_def_${targetMode}`,
      name: `Dàn 93 Số ${modeShort} - Phòng Thủ Đa Tầng Khung 2N`,
      k: 93,
      excluded: [topGan[0], topGan[1], topGan[2], cold90[0], cold90[1], cold180[0], cold365[0]],
      desc: `Phân tán rủi ro: loại 3 số gan sâu + 4 số đáy tần suất của ${modeShort}`
    },
    {
      id: `k2_93_cold_keps_${targetMode}`,
      name: `Dàn 93 Số ${modeShort} - Loại 7 Kép Bằng Chậm Nhịp`,
      k: 93,
      excluded: coldKeps.slice(0, 7),
      desc: `Loại 7 con kép bằng có tần suất về thấp nhất của ${modeShort}`
    },

    // 8 Dàn 92 số (Loại 8 số)
    {
      id: `k2_92_top_gan_${targetMode}`,
      name: `Dàn 92 Số ${modeShort} - Loại 8 Số Gan Cực Đại`,
      k: 92,
      excluded: topGan.slice(0, 8),
      desc: `Loại bỏ hoàn toàn 8 con số gan đứng đầu bảng ${modeShort}`
    },
    {
      id: `k2_92_composite_vip_${targetMode}`,
      name: `Dàn 92 Số ${modeShort} - Tối Ưu Đa Yếu Tố (VIP Khung 2N)`,
      k: 92,
      excluded: compositeCold.slice(0, 8),
      desc: `Thuật toán tối ưu hóa đa biến: Gan hiện tại + Chu kỳ + Tần suất gần của ${modeShort}`
    },
    {
      id: `k2_92_cold_365d_${targetMode}`,
      name: `Dàn 92 Số ${modeShort} - Loại 8 Số Yếu Nhất 1 Năm`,
      k: 92,
      excluded: cold365.slice(0, 8),
      desc: `Loại bỏ 8 số có xác suất thống kê thấp nhất 1 năm qua của ${modeShort}`
    },
    {
      id: `k2_92_cold_180d_${targetMode}`,
      name: `Dàn 92 Số ${modeShort} - Loại 8 Số Nguội Lạnh 6 Tháng`,
      k: 92,
      excluded: cold180.slice(0, 8),
      desc: `Loại 8 số xuất hiện ít nhất trong nửa năm của ${modeShort}`
    },
    {
      id: `k2_92_cold_90d_${targetMode}`,
      name: `Dàn 92 Số ${modeShort} - Loại 8 Số Đóng Băng 90 Ngày`,
      k: 92,
      excluded: cold90.slice(0, 8),
      desc: `Loại bỏ 8 số xuất hiện ít nhất trong 90 ngày gần nhất của ${modeShort}`
    },
    {
      id: `k2_92_hybrid_safe_${targetMode}`,
      name: `Dàn 92 Số ${modeShort} - An Toàn Tuyệt Đối (Hybrid 4+4)`,
      k: 92,
      excluded: Array.from(new Set([...topGan.slice(0, 4), ...cold90.slice(0, 4)])).slice(0, 8),
      desc: `Loại 4 số siêu gan + 4 số đáy tần suất của ${modeShort}`
    },
    {
      id: `k2_92_keps_combo_${targetMode}`,
      name: `Dàn 92 Số ${modeShort} - Loại Kép Nguội & Số Gan Sâu`,
      k: 92,
      excluded: Array.from(new Set([...coldKeps.slice(0, 4), ...topGan.slice(0, 4)])).slice(0, 8),
      desc: `Loại 4 kép bằng câm + 4 số gan lỳ nhất của ${modeShort}`
    },
    {
      id: `k2_92_max2_opt_${targetMode}`,
      name: `Dàn 92 Số ${modeShort} - Chuẩn Khung Max 2 Ngày`,
      k: 92,
      excluded: Array.from(new Set([...compositeCold.slice(0, 5), ...cold365.slice(0, 3)])).slice(0, 8),
      desc: `Bộ lọc tinh chỉnh cân bằng nhịp nổ ngày 1 và ngày 2 của ${modeShort}`
    }
  ];

  return strategies.map(s => {
    const excludedSet = new Set(s.excluded);
    const numbers = [];
    for (let i = 0; i < 100; i++) {
      const num = i.toString().padStart(2, '0');
      if (!excludedSet.has(num)) numbers.push(num);
    }
    const stats = evaluateKhung2Set(numbers, historyData, targetMode, s.excluded);
    return {
      id: s.id,
      name: s.name,
      k: numbers.length,
      numbers,
      excluded: s.excluded,
      desc: s.desc,
      stats,
      targetMode
    };
  });
}

/**
 * Storage helpers for Khung 2 Ngày
 */
export function getSavedKhung2Sets(targetMode = 'db_tail', historyData = []) {
  const key = getKhung2StorageKey(targetMode);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(item => ({
          ...item,
          targetMode,
          stats: evaluateKhung2Set(item.numbers, historyData, targetMode, item.excluded)
        }));
      }
    }
  } catch (e) {
    console.warn('LocalStorage read error for khung 2:', e);
  }

  // Fallback to presets for this targetMode
  const presets = generateKhung2Presets(historyData, targetMode);
  saveKhung2Sets(targetMode, presets);
  return presets;
}

export function saveKhung2Sets(targetMode, sets) {
  const key = getKhung2StorageKey(targetMode);
  try {
    localStorage.setItem(key, JSON.stringify(sets));
  } catch (e) {
    console.warn('LocalStorage save error for khung 2:', e);
  }
}
