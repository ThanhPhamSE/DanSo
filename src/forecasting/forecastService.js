import { analyzeFrequency } from '../analytics/frequencyService';
import { analyzeGan } from '../analytics/ganService';
import { analyzeCycles } from '../analytics/cycleService';
import { analyzeProbabilities } from '../probability/probabilityService';
import { scoreNumbers, DEFAULT_WEIGHTS } from './scoringEngine';
import { getPrizeForMode } from '../utils/lotteryEngine';

export function generateForecast(historyData, savedSets = [], mode = 'db_tail', weights = DEFAULT_WEIGHTS) {
  if (!historyData || historyData.length === 0) return null;

  const validDraws = historyData.filter(d => getPrizeForMode(d, mode));
  const latestDate = validDraws[0]?.d || '';

  const freqList = analyzeFrequency(validDraws, mode);
  const ganList = analyzeGan(validDraws, mode);
  const cycleList = analyzeCycles(validDraws, mode);
  const probList = analyzeProbabilities(validDraws, mode);

  const rankedT1 = scoreNumbers(freqList, ganList, cycleList, probList, weights);

  const rankedT2 = rankedT1.map(item => {
    const pSingle = item.pBayes / 100;
    const p2Day = (1 - Math.pow(1 - pSingle, 2)) * 100;
    const scoreT2 = parseFloat(((item.score * 0.7) + (p2Day * 15)).toFixed(2));

    return {
      ...item,
      scoreT2,
      p2Day: parseFloat(p2Day.toFixed(2))
    };
  }).sort((a, b) => b.scoreT2 - a.scoreT2);

  const scoredSets = savedSets.map((setItem) => {
    const setObj = new Set(setItem.numbers);
    const k = setObj.size;

    const pSetSingle = k / 100;
    const pSet2Day = (1 - Math.pow(1 - pSetSingle, 2)) * 100;

    let hitsTotal = 0;
    let hits30 = 0;
    let currentGan = 0;
    let maxGan = 0;
    let tempG = 0;

    const chronicle = [...validDraws].reverse();
    chronicle.forEach((day, dIdx) => {
      const prize = getPrizeForMode(day, mode);
      const isHit = setObj.has(prize);
      if (isHit) {
        hitsTotal++;
        if (dIdx >= chronicle.length - 30) hits30++;
        tempG = 0;
      } else {
        tempG++;
        if (tempG > maxGan) maxGan = tempG;
      }
    });

    currentGan = tempG;
    const hitRateAll = parseFloat(((hitsTotal / validDraws.length) * 100).toFixed(2));
    const hitRate30 = parseFloat(((hits30 / Math.min(30, validDraws.length)) * 100).toFixed(2));

    const setScoreT1 = parseFloat((
      (hitRateAll * 0.4) +
      (hitRate30 * 0.4) +
      (Math.max(0, 100 - (currentGan / (maxGan || 1)) * 50) * 0.2)
    ).toFixed(2));

    const setScoreT2 = parseFloat((setScoreT1 * 0.6 + (pSet2Day * 0.4)).toFixed(2));

    return {
      id: setItem.id,
      name: setItem.name,
      numbers: setItem.numbers,
      count: k,
      hitRateAll,
      hitRate30,
      currentGan,
      maxGan,
      pSetSinglePercent: parseFloat((pSetSingle * 100).toFixed(1)),
      pSet2DayPercent: parseFloat(pSet2Day.toFixed(1)),
      setScoreT1,
      setScoreT2
    };
  });

  const rankedSetsT1 = [...scoredSets].sort((a, b) => b.setScoreT1 - a.setScoreT1);
  const rankedSetsT2 = [...scoredSets].sort((a, b) => b.setScoreT2 - a.setScoreT2);

  return {
    latestDate,
    top20_T1: rankedT1.slice(0, 20),
    top20_T2: rankedT2.slice(0, 20),
    rankedSetsT1,
    rankedSetsT2
  };
}
