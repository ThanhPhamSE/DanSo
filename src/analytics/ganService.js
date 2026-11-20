import { getPrizeForMode } from '../utils/lotteryEngine';

export function analyzeGan(historyData, mode = 'db_tail') {
  if (!historyData || historyData.length === 0) return [];

  const validDraws = historyData.filter(d => getPrizeForMode(d, mode));
  const totalCount = validDraws.length;
  if (totalCount === 0) return [];

  const chronicle = [...validDraws].reverse(); // oldest to newest

  const ganStats = {};
  for (let i = 0; i <= 99; i++) {
    const num = i.toString().padStart(2, '0');
    ganStats[num] = {
      num,
      currentGan: 0,
      maxGan: 0,
      minGan: Infinity,
      maxGanStart: null,
      maxGanEnd: null,
      ganIntervals: [],
      tempGan: 0,
      tempStart: chronicle[0]?.d || null,
      lastHitDate: null
    };
  }

  for (let idx = 0; idx < chronicle.length; idx++) {
    const day = chronicle[idx];
    const prize = getPrizeForMode(day, mode);

    for (let i = 0; i <= 99; i++) {
      const num = i.toString().padStart(2, '0');
      const item = ganStats[num];

      if (prize === num) {
        if (item.lastHitDate !== null) {
          const interval = item.tempGan;
          item.ganIntervals.push(interval);
          if (interval < item.minGan) item.minGan = interval;
          if (interval > item.maxGan) {
            item.maxGan = interval;
            item.maxGanStart = item.tempStart;
            item.maxGanEnd = day.d;
          }
        }
        item.lastHitDate = day.d;
        item.tempGan = 0;
        item.tempStart = day.d;
      } else {
        item.tempGan++;
      }
    }
  }

  const results = [];
  for (let i = 0; i <= 99; i++) {
    const num = i.toString().padStart(2, '0');
    const item = ganStats[num];
    item.currentGan = item.tempGan;

    if (item.currentGan > item.maxGan) {
      item.maxGan = item.currentGan;
      item.maxGanStart = item.tempStart;
      item.maxGanEnd = chronicle[chronicle.length - 1]?.d || '';
    }

    if (item.minGan === Infinity) item.minGan = 0;

    const intervals = item.ganIntervals;
    const avgGan = intervals.length > 0
      ? parseFloat((intervals.reduce((a, b) => a + b, 0) / intervals.length).toFixed(1))
      : 0;

    const timesExceededAvg = intervals.filter(g => g > avgGan).length;

    let category = 'normal';
    let categoryLabel = 'Gan Bình Thường';
    let categoryColor = 'text-slate-300';

    if (item.currentGan < avgGan * 0.5) {
      category = 'low';
      categoryLabel = 'Gan Thấp (Vừa về)';
      categoryColor = 'text-emerald-400';
    } else if (item.currentGan >= item.maxGan) {
      category = 'historic_max';
      categoryLabel = 'Vượt Đỉnh Gan Max';
      categoryColor = 'text-rose-500 font-bold animate-pulse';
    } else if (item.currentGan >= avgGan * 1.5) {
      category = 'high';
      categoryLabel = 'Gan Cao (Chờ đảo cầu)';
      categoryColor = 'text-amber-400';
    }

    results.push({
      num,
      currentGan: item.currentGan,
      avgGan,
      maxGan: item.maxGan,
      minGan: item.minGan,
      maxGanPeriod: item.maxGanStart ? `${item.maxGanStart} → ${item.maxGanEnd}` : '---',
      timesExceededAvg,
      category,
      categoryLabel,
      categoryColor,
      lastHitDate: item.lastHitDate
    });
  }

  return results.sort((a, b) => b.currentGan - a.currentGan);
}
