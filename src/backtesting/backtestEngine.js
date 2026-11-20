import { generateForecast } from '../forecasting/forecastService';
import { getPrizeForMode } from '../utils/lotteryEngine';

export function runBacktest(historyData, testDaysCount = 60, mode = 'db_tail') {
  if (!historyData || historyData.length < testDaysCount + 100) {
    return { error: 'Không đủ dữ liệu lịch sử để thực hiện backtest (Cần tối thiểu 160 kỳ quay).' };
  }

  const validDraws = historyData.filter(d => getPrizeForMode(d, mode));
  const total = validDraws.length;

  const testResults = [];
  let t1HitsTop10 = 0;
  let t1HitsTop20 = 0;
  let t2HitsTop10 = 0;
  let t2HitsTop20 = 0;
  let brierScoreSum = 0;

  const startIndex = testDaysCount + 2;

  for (let offset = startIndex; offset >= 2; offset--) {
    const testCutoffIndex = offset;
    const trainingData = validDraws.slice(testCutoffIndex);

    const actualDayT1 = validDraws[testCutoffIndex - 1];
    const actualDayT2 = validDraws[testCutoffIndex - 2];

    const actualNumT1 = getPrizeForMode(actualDayT1, mode);
    const actualNumT2 = getPrizeForMode(actualDayT2, mode);

    if (!actualNumT1) continue;

    const forecast = generateForecast(trainingData, [], mode);
    if (!forecast) continue;

    const top10_T1 = new Set(forecast.top20_T1.slice(0, 10).map(x => x.num));
    const top20_T1 = new Set(forecast.top20_T1.map(x => x.num));

    const top10_T2 = new Set(forecast.top20_T2.slice(0, 10).map(x => x.num));
    const top20_T2 = new Set(forecast.top20_T2.map(x => x.num));

    const hitT1_10 = top10_T1.has(actualNumT1);
    const hitT1_20 = top20_T1.has(actualNumT1);

    const hitT2_10 = actualNumT2 ? top10_T2.has(actualNumT2) : false;
    const hitT2_20 = actualNumT2 ? top20_T2.has(actualNumT2) : false;

    if (hitT1_10) t1HitsTop10++;
    if (hitT1_20) t1HitsTop20++;
    if (hitT2_10) t2HitsTop10++;
    if (hitT2_20) t2HitsTop20++;

    const topPred = forecast.top20_T1[0];
    const predictedProb = (topPred?.pBayes || 1.0) / 100.0;
    const actualOutcome = (topPred?.num === actualNumT1) ? 1 : 0;
    brierScoreSum += Math.pow(predictedProb - actualOutcome, 2);

    testResults.push({
      date: actualDayT1.d,
      actualNumT1,
      actualNumT2,
      hitT1_10,
      hitT1_20,
      hitT2_10,
      hitT2_20,
      topPredNum: topPred?.num
    });
  }

  const N = testResults.length;
  if (N === 0) return { error: 'Không thể tính toán backtest.' };

  const hitRateT1_Top10 = parseFloat(((t1HitsTop10 / N) * 100).toFixed(2));
  const hitRateT1_Top20 = parseFloat(((t1HitsTop20 / N) * 100).toFixed(2));
  const hitRateT2_Top10 = parseFloat(((t2HitsTop10 / N) * 100).toFixed(2));
  const hitRateT2_Top20 = parseFloat(((t2HitsTop20 / N) * 100).toFixed(2));

  const baselineTop10 = 10.0;
  const baselineTop20 = 20.0;
  const brierScore = parseFloat((brierScoreSum / N).toFixed(4));

  return {
    totalTestDays: N,
    mode,
    hitRateT1_Top10,
    hitRateT1_Top20,
    hitRateT2_Top10,
    hitRateT2_Top20,
    baselineTop10,
    baselineTop20,
    t1EdgeTop10: parseFloat((hitRateT1_Top10 - baselineTop10).toFixed(2)),
    t1EdgeTop20: parseFloat((hitRateT1_Top20 - baselineTop20).toFixed(2)),
    brierScore,
    testResults: testResults.reverse()
  };
}
