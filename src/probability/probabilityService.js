import { getPrizeForMode } from '../utils/lotteryEngine';

export function analyzeProbabilities(historyData, mode = 'db_tail') {
  if (!historyData || historyData.length === 0) return [];

  const validDraws = historyData.filter(d => getPrizeForMode(d, mode));
  const N = validDraws.length;
  if (N === 0) return [];

  const n30 = Math.min(30, N);
  const n90 = Math.min(90, N);
  const draws30 = validDraws.slice(0, n30);
  const draws90 = validDraws.slice(0, n90);

  const countAll = {};
  const count30 = {};
  const count90 = {};
  for (let i = 0; i <= 99; i++) {
    const s = i.toString().padStart(2, '0');
    countAll[s] = 0;
    count30[s] = 0;
    count90[s] = 0;
  }

  validDraws.forEach(d => {
    const p = getPrizeForMode(d, mode);
    if (p && countAll[p] !== undefined) countAll[p]++;
  });

  draws30.forEach(d => {
    const p = getPrizeForMode(d, mode);
    if (p && count30[p] !== undefined) count30[p]++;
  });

  draws90.forEach(d => {
    const p = getPrizeForMode(d, mode);
    if (p && count90[p] !== undefined) count90[p]++;
  });

  const z = 1.96;
  const results = [];

  for (let i = 0; i <= 99; i++) {
    const num = i.toString().padStart(2, '0');
    const hits = countAll[num];
    const hits30 = count30[num];
    const hits90 = count90[num];

    const pEmpirical = hits / N;
    const p30 = hits30 / n30;
    const p90 = hits90 / n90;

    const pBayes = (hits + 1) / (N + 100);

    const denominator = 1 + (z * z) / N;
    const centerAdjusted = pEmpirical + (z * z) / (2 * N);
    const rad = z * Math.sqrt((pEmpirical * (1 - pEmpirical)) / N + (z * z) / (4 * N * N));
    const ciLower = Math.max(0, (centerAdjusted - rad) / denominator);
    const ciUpper = Math.min(1, (centerAdjusted + rad) / denominator);

    results.push({
      num,
      hits,
      pTheoretical: 0.01,
      pEmpirical: parseFloat((pEmpirical * 100).toFixed(3)),
      p30: parseFloat((p30 * 100).toFixed(2)),
      p90: parseFloat((p90 * 100).toFixed(2)),
      pBayes: parseFloat((pBayes * 100).toFixed(3)),
      ci95: [parseFloat((ciLower * 100).toFixed(3)), parseFloat((ciUpper * 100).toFixed(3))],
      ciWidth: parseFloat(((ciUpper - ciLower) * 100).toFixed(3))
    });
  }

  return results;
}
