import { getPrizeForMode } from '../utils/lotteryEngine';

export function analyzeFrequency(historyData, mode = 'db_tail') {
  if (!historyData || historyData.length === 0) return [];

  const validDraws = historyData.filter(d => getPrizeForMode(d, mode));
  const totalCount = validDraws.length;
  if (totalCount === 0) return [];

  const draws7 = validDraws.slice(0, 7);
  const draws30 = validDraws.slice(0, 30);
  const draws60 = validDraws.slice(0, 60);
  const draws90 = validDraws.slice(0, 90);

  const countInDraws = (draws) => {
    const map = {};
    for (let i = 0; i <= 99; i++) {
      map[i.toString().padStart(2, '0')] = 0;
    }
    for (const d of draws) {
      const num = getPrizeForMode(d, mode);
      if (num && map[num] !== undefined) {
        map[num]++;
      }
    }
    return map;
  };

  const mapAll = countInDraws(validDraws);
  const map7 = countInDraws(draws7);
  const map30 = countInDraws(draws30);
  const map60 = countInDraws(draws60);
  const map90 = countInDraws(draws90);

  const results = [];
  for (let i = 0; i <= 99; i++) {
    const num = i.toString().padStart(2, '0');
    const totalHits = mapAll[num];
    const hits7 = map7[num];
    const hits30 = map30[num];
    const hits60 = map60[num];
    const hits90 = map90[num];

    const rateAll = parseFloat(((totalHits / totalCount) * 100).toFixed(2));
    const rate30 = parseFloat(((hits30 / (draws30.length || 1)) * 100).toFixed(2));
    const rate90 = parseFloat(((hits90 / (draws90.length || 1)) * 100).toFixed(2));

    const trendDiff = parseFloat((rate30 - rateAll).toFixed(2));
    let trend = 'stable';
    if (trendDiff >= 1.0) trend = 'rising';
    else if (trendDiff <= -1.0) trend = 'falling';

    results.push({
      num,
      totalHits,
      hits7,
      hits30,
      hits60,
      hits90,
      rateAll,
      rate30,
      rate90,
      trendDiff,
      trend,
      head: parseInt(num[0], 10),
      tail: parseInt(num[1], 10),
      sum: (parseInt(num[0], 10) + parseInt(num[1], 10)) % 10
    });
  }

  return results;
}

export function getTopRankings(freqList, limit = 10) {
  const hot = [...freqList].sort((a, b) => b.totalHits - a.totalHits).slice(0, limit);
  const cold = [...freqList].sort((a, b) => a.totalHits - b.totalHits).slice(0, limit);
  const hot30 = [...freqList].sort((a, b) => b.hits30 - a.hits30).slice(0, limit);
  const cold30 = [...freqList].sort((a, b) => a.hits30 - b.hits30).slice(0, limit);
  return { hot, cold, hot30, cold30 };
}
