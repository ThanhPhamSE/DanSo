import { getPrizeForMode } from '../utils/lotteryEngine';

export function analyzeCycles(historyData, mode = 'db_tail') {
  if (!historyData || historyData.length === 0) return [];

  const validDraws = historyData.filter(d => getPrizeForMode(d, mode));
  const totalCount = validDraws.length;
  if (totalCount === 0) return [];

  const chronicle = [...validDraws].reverse(); // oldest to newest

  const numberGaps = {};
  const lastIndexMap = {};
  for (let i = 0; i <= 99; i++) {
    const s = i.toString().padStart(2, '0');
    numberGaps[s] = [];
    lastIndexMap[s] = null;
  }

  for (let idx = 0; idx < chronicle.length; idx++) {
    const prize = getPrizeForMode(chronicle[idx], mode);
    if (prize && numberGaps[prize]) {
      if (lastIndexMap[prize] !== null) {
        const gap = idx - lastIndexMap[prize];
        numberGaps[prize].push(gap);
      }
      lastIndexMap[prize] = idx;
    }
  }

  const results = [];

  for (let i = 0; i <= 99; i++) {
    const num = i.toString().padStart(2, '0');
    const gaps = numberGaps[num];
    const currentGap = lastIndexMap[num] !== null ? (chronicle.length - 1 - lastIndexMap[num]) : chronicle.length;

    if (gaps.length === 0) {
      results.push({
        num,
        meanCycle: totalCount,
        medianCycle: totalCount,
        stdDev: 0,
        currentGap,
        divergenceRatio: 1.0,
        returnRate1d: 0,
        returnRate2d: 0,
        returnRate3d: 0,
        returnRate5d: 0,
        returnRate7d: 0
      });
      continue;
    }

    const sum = gaps.reduce((a, b) => a + b, 0);
    const meanCycle = parseFloat((sum / gaps.length).toFixed(1));

    const sorted = [...gaps].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const medianCycle = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

    const variance = gaps.reduce((acc, g) => acc + Math.pow(g - meanCycle, 2), 0) / gaps.length;
    const stdDev = parseFloat(Math.sqrt(variance).toFixed(1));

    const totalTransitions = gaps.length;
    const returnRate1d = parseFloat(((gaps.filter(g => g === 1).length / totalTransitions) * 100).toFixed(1));
    const returnRate2d = parseFloat(((gaps.filter(g => g <= 2).length / totalTransitions) * 100).toFixed(1));
    const returnRate3d = parseFloat(((gaps.filter(g => g <= 3).length / totalTransitions) * 100).toFixed(1));
    const returnRate5d = parseFloat(((gaps.filter(g => g <= 5).length / totalTransitions) * 100).toFixed(1));
    const returnRate7d = parseFloat(((gaps.filter(g => g <= 7).length / totalTransitions) * 100).toFixed(1));

    const divergenceRatio = parseFloat((currentGap / (meanCycle || 1)).toFixed(2));

    results.push({
      num,
      meanCycle,
      medianCycle,
      stdDev,
      currentGap,
      divergenceRatio,
      returnRate1d,
      returnRate2d,
      returnRate3d,
      returnRate5d,
      returnRate7d,
      totalCyclesRecorded: gaps.length
    });
  }

  return results.sort((a, b) => b.divergenceRatio - a.divergenceRatio);
}
