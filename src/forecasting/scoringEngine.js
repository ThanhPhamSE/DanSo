/**
 * Statistical Scoring Engine
 * Evaluates each number and set using a multi-factor mathematical formulation.
 * Factors:
 * 1. Historical Frequency (Weight: w_hist)
 * 2. Recent 30-Day Frequency (Weight: w_rec)
 * 3. Cycle Gap Proximity (Weight: w_gap)
 * 4. Empirical Probability (Weight: w_prob)
 * 5. Stability & Consistency (Weight: w_stab)
 */

export const DEFAULT_WEIGHTS = {
  w_hist: 0.20,
  w_rec: 0.25,
  w_gap: 0.25,
  w_prob: 0.20,
  w_stab: 0.10
};

export function scoreNumbers(freqList, ganList, cycleList, probList, weights = DEFAULT_WEIGHTS) {
  if (!freqList || freqList.length === 0) return [];

  const ganMap = Object.fromEntries(ganList.map(g => [g.num, g]));
  const cycleMap = Object.fromEntries(cycleList.map(c => [c.num, c]));
  const probMap = Object.fromEntries(probList.map(p => [p.num, p]));

  // Find min/max for normalization (0-100 scale)
  const maxHits = Math.max(...freqList.map(f => f.totalHits), 1);
  const maxHits30 = Math.max(...freqList.map(f => f.hits30), 1);

  const scored = freqList.map(item => {
    const num = item.num;
    const g = ganMap[num] || { currentGan: 0, avgGan: 100 };
    const c = cycleMap[num] || { meanCycle: 100, currentGap: 0, stdDev: 10 };
    const p = probMap[num] || { pBayes: 1.0, pEmpirical: 1.0 };

    // 1. Historical Frequency Score (0-100)
    const s_hist = (item.totalHits / maxHits) * 100;

    // 2. Recent Frequency Score (0-100)
    const s_rec = (item.hits30 / maxHits30) * 100;

    // 3. Cycle Gap Proximity Score:
    // Gaussian-like function peaking when currentGap is close to meanCycle
    const gapDiff = Math.abs(c.currentGap - c.meanCycle);
    const sigma = Math.max(c.stdDev || 50, 20);
    const s_gap = Math.exp(-Math.pow(gapDiff, 2) / (2 * sigma * sigma)) * 100;

    // 4. Bayesian Empirical Probability Score (0-100)
    const s_prob = Math.min(100, (p.pBayes / 2.0) * 100);

    // 5. Stability Score: lower variance = higher score
    const s_stab = Math.max(0, 100 - Math.min(100, (c.stdDev / (c.meanCycle || 1)) * 100));

    // Composite Weighted Score
    const compositeScore = parseFloat((
      s_hist * weights.w_hist +
      s_rec * weights.w_rec +
      s_gap * weights.w_gap +
      s_prob * weights.w_prob +
      s_stab * weights.w_stab
    ).toFixed(2));

    let confidence = 'Vừa Phải';
    if (compositeScore >= 75) confidence = 'Rất Cao';
    else if (compositeScore >= 60) confidence = 'Khá Cao';
    else if (compositeScore < 40) confidence = 'Thấp';

    return {
      num,
      score: compositeScore,
      confidence,
      totalHits: item.totalHits,
      hits30: item.hits30,
      currentGan: g.currentGan,
      avgGan: g.avgGan,
      meanCycle: c.meanCycle,
      pEmpirical: p.pEmpirical,
      pBayes: p.pBayes,
      ci95: p.ci95 || [0, 0]
    };
  });

  return scored.sort((a, b) => b.score - a.score);
}
