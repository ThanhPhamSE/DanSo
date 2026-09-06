/**
 * Lottery Engine for XSMB Multi-Set Analysis, Yearly Statistics & Soi Cầu
 */

// Parse raw input string into unique array of formatted 2-digit strings ("00" to "99")
export function parseNumberSet(input) {
  if (!input) return [];
  const matches = input.match(/\d+/g) || [];
  const valid = new Set();
  
  for (const m of matches) {
    let num = parseInt(m, 10);
    if (!isNaN(num) && num >= 0 && num <= 99) {
      valid.add(num.toString().padStart(2, '0'));
    }
  }
  
  return Array.from(valid).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
}

/**
 * Bulk Import Parser
 * Converts multiline text (where each line is a dàn số) into an array of set objects
 */
export function parseBulkSetsText(text) {
  if (!text) return [];
  const lines = text.split('\n');
  const sets = [];
  let setIndex = 1;

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    let name = `Dàn ${setIndex}`;
    let numbersText = line;

    if (line.includes(':')) {
      const parts = line.split(':');
      if (parts[0].trim().length < 30) {
        name = parts[0].trim();
        numbersText = parts.slice(1).join(':').trim();
      }
    }

    const numbers = parseNumberSet(numbersText);
    if (numbers.length > 0) {
      sets.push({
        id: `set_bulk_${Date.now()}_${setIndex}_${Math.random().toString(36).substring(2, 6)}`,
        name: name,
        numbers: numbers,
        note: `${numbers.length} số`
      });
      setIndex++;
    }
  }

  return sets;
}

// Preset initial multi-set list
export const INITIAL_SET_LIST = [
  {
    id: 'set_1',
    name: 'Dàn 1 (17 số ví dụ 1)',
    numbers: parseNumberSet("84,89,93,94,98,41,42,46,47,01,14,23,24,64,74,78,90"),
    note: '17 số mẫu'
  },
  {
    id: 'set_2',
    name: 'Dàn 2 (17 số ví dụ 2)',
    numbers: parseNumberSet("28,37,55,73,82,91,01,04,31,48,51,59,71,81,93,03,30"),
    note: '17 số mẫu'
  },
  {
    id: 'set_3',
    name: 'Dàn 3 (50 số Chẵn)',
    numbers: Array.from({ length: 50 }, (_, i) => (i * 2).toString().padStart(2, '0')),
    note: '50 số chẵn'
  }
];

export const PRESET_SETS = INITIAL_SET_LIST;

/**
 * Main Single Set Analysis Function
 */
export function analyzeLotterySet(historyData, userSet, limitDays = 100, mode = 'de') {
  if (!historyData || historyData.length === 0 || !userSet || userSet.length === 0) {
    return null;
  }

  let slicedData = historyData;
  if (limitDays !== 'all') {
    const n = parseInt(limitDays, 10);
    if (!isNaN(n) && n > 0) {
      slicedData = historyData.slice(0, n);
    }
  }

  const setObj = new Set(userSet);
  const totalDays = slicedData.length;

  let hitDaysCount = 0;
  let currentGan = 0;
  let maxGan = 0;
  let currentWinStreak = 0;
  let maxWinStreak = 0;
  let totalHitHits = 0;

  const numberHitStats = {};
  userSet.forEach(num => { numberHitStats[num] = 0; });

  const chronicle = [...slicedData].reverse();

  let tempGan = 0;
  let tempWinStreak = 0;

  const historyDetails = chronicle.map((day) => {
    let dayHits = [];
    if (mode === 'de') {
      const dbNum = day.db;
      if (setObj.has(dbNum)) {
        dayHits.push(dbNum);
      }
    } else {
      for (const loNum of day.lo) {
        if (setObj.has(loNum)) {
          dayHits.push(loNum);
        }
      }
    }

    const isHit = dayHits.length > 0;
    if (isHit) {
      hitDaysCount++;
      totalHitHits += dayHits.length;

      dayHits.forEach(n => {
        if (numberHitStats[n] !== undefined) {
          numberHitStats[n]++;
        }
      });

      tempGan = 0;
      tempWinStreak++;
      if (tempWinStreak > maxWinStreak) {
        maxWinStreak = tempWinStreak;
      }
    } else {
      tempGan++;
      if (tempGan > maxGan) {
        maxGan = tempGan;
      }
      tempWinStreak = 0;
    }

    return {
      date: day.d,
      db: day.db,
      lo: day.lo,
      isHit,
      hitCount: dayHits.length,
      dayHits,
      ganAtDay: tempGan,
      winStreakAtDay: tempWinStreak
    };
  });

  currentGan = historyDetails[historyDetails.length - 1]?.ganAtDay || 0;
  currentWinStreak = historyDetails[historyDetails.length - 1]?.winStreakAtDay || 0;

  const headCounts = Array(10).fill(0);
  const tailCounts = Array(10).fill(0);
  const sumCounts = Array(10).fill(0);

  userSet.forEach(numStr => {
    const h = parseInt(numStr[0], 10);
    const t = parseInt(numStr[1], 10);
    const s = (h + t) % 10;
    headCounts[h]++;
    tailCounts[t]++;
    sumCounts[s]++;
  });

  const sortedNumberStats = Object.entries(numberHitStats)
    .map(([num, count]) => ({ num, count, hitRate: ((count / totalDays) * 100).toFixed(1) }))
    .sort((a, b) => b.count - a.count);

  const topHits = sortedNumberStats.slice(0, 5);
  const leastHits = [...sortedNumberStats].reverse().slice(0, 5);

  const hitRatePercent = totalDays > 0 ? parseFloat(((hitDaysCount / totalDays) * 100).toFixed(2)) : 0;
  const missDaysCount = totalDays - hitDaysCount;
  const avgInterval = hitDaysCount > 0 ? (totalDays / hitDaysCount).toFixed(1) : totalDays;
  const expectedRate = mode === 'de' ? (userSet.length * 1.0) : (userSet.length * 27 * 0.01);

  // Find max gan period (exact start → end dates)
  const maxGanPeriod = findMaxGanPeriod(historyDetails);

  return {
    totalDays,
    dansoCount: userSet.length,
    hitDaysCount,
    missDaysCount,
    hitRatePercent,
    expectedRate: expectedRate.toFixed(1),
    currentGan,
    maxGan,
    maxGanPeriod,
    currentWinStreak,
    maxWinStreak,
    avgInterval,
    totalHitHits,
    topHits,
    leastHits,
    sortedNumberStats,
    headCounts,
    tailCounts,
    sumCounts,
    historyDetails: historyDetails.reverse()
  };
}

/**
 * Find the longest losing streak (max gan) with exact start and end dates
 * historyDetails should be in newest-first order (as returned by analyzeLotterySet)
 */
export function findMaxGanPeriod(historyDetails) {
  if (!historyDetails || historyDetails.length === 0) return null;

  // Work oldest→newest to find streaks
  const chronological = [...historyDetails].reverse();

  let bestGan = 0;
  let bestStart = null;
  let bestEnd = null;

  let streakStart = null;
  let currentStreak = 0;

  for (let i = 0; i < chronological.length; i++) {
    const day = chronological[i];
    if (!day.isHit) {
      if (currentStreak === 0) streakStart = day.date;
      currentStreak++;
      if (currentStreak > bestGan) {
        bestGan = currentStreak;
        bestStart = streakStart;
        bestEnd = day.date;
      }
    } else {
      currentStreak = 0;
      streakStart = null;
    }
  }

  if (bestGan === 0) return null;
  return { maxGan: bestGan, startDate: bestStart, endDate: bestEnd };
}

/**
 * Yearly Breakdown Analysis Function (Tỉ lệ 5 Năm gần nhất)
 */
export function analyzeYearlyStats(historyData, userSet, mode = 'de', limitYears = 5) {
  if (!historyData || historyData.length === 0 || !userSet || userSet.length === 0) {
    return [];
  }

  const yearGroups = {};
  historyData.forEach(day => {
    const year = day.d.substring(0, 4);
    if (!yearGroups[year]) yearGroups[year] = [];
    yearGroups[year].push(day);
  });

  const years = Object.keys(yearGroups)
    .sort((a, b) => parseInt(b) - parseInt(a))
    .slice(0, limitYears);

  return years.map(year => {
    const dayList = yearGroups[year];
    const stats = analyzeLotterySet(dayList, userSet, 'all', mode);
    return {
      year,
      totalDays: stats.totalDays,
      hitDaysCount: stats.hitDaysCount,
      hitRatePercent: stats.hitRatePercent,
      currentGan: stats.currentGan,
      maxGan: stats.maxGan,
      maxWinStreak: stats.maxWinStreak
    };
  });
}

/**
 * Multi-Set Comparative Analysis Function
 */
export function analyzeMultiSets(historyData, setList, limitDays = 100, mode = 'de') {
  if (!historyData || historyData.length === 0 || !setList || setList.length === 0) {
    return [];
  }

  const latestDay = historyData[0];

  return setList.map(setItem => {
    const stats = analyzeLotterySet(historyData, setItem.numbers, limitDays, mode);
    const setObj = new Set(setItem.numbers);
    
    let todayHit = false;
    let todayHitsList = [];
    if (mode === 'de') {
      todayHit = setObj.has(latestDay.db);
      if (todayHit) todayHitsList.push(latestDay.db);
    } else {
      todayHitsList = latestDay.lo.filter(n => setObj.has(n));
      todayHit = todayHitsList.length > 0;
    }

    return {
      id: setItem.id,
      name: setItem.name,
      numbers: setItem.numbers,
      count: setItem.numbers.length,
      note: setItem.note || '',
      stats,
      todayResult: {
        date: latestDay.d,
        db: latestDay.db,
        isHit: todayHit,
        hits: todayHitsList
      }
    };
  });
}

/**
 * Multi-Set Daily Matrix (Day by Day Matrix comparing all sets)
 */
export function buildMultiSetDailyMatrix(historyData, setList, limitDays = 30, mode = 'de') {
  if (!historyData || historyData.length === 0 || !setList || setList.length === 0) {
    return [];
  }

  const sliced = historyData.slice(0, limitDays);

  return sliced.map(day => {
    const setResults = {};
    setList.forEach(setItem => {
      const setObj = new Set(setItem.numbers);
      let dayHits = [];
      if (mode === 'de') {
        if (setObj.has(day.db)) dayHits.push(day.db);
      } else {
        dayHits = day.lo.filter(n => setObj.has(n));
      }
      setResults[setItem.id] = {
        isHit: dayHits.length > 0,
        dayHits
      };
    });

    return {
      date: day.d,
      db: day.db,
      lo: day.lo,
      setResults
    };
  });
}

/**
 * Money Management & Profit Simulator
 */
export function simulateCapital(historyDetails, betPerNum = 10000, winPayoutRatio = 99, strategy = 'flat') {
  if (!historyDetails || historyDetails.length === 0) return null;

  const chronological = [...historyDetails].reverse();
  const setSize = chronological[0]?.dayHits ? (chronological[0].dayHits.length > 0 ? 50 : 50) : 50; 
  
  let totalInvested = 0;
  let totalPayout = 0;
  let currentMultiplier = 1;
  let maxDrawdown = 0;
  let peakProfit = 0;
  let currentProfit = 0;

  const logs = chronological.map(day => {
    let multiplier = 1;
    if (strategy === 'flat') {
      multiplier = 1;
    } else if (strategy === 'martingale') {
      multiplier = currentMultiplier;
    } else if (strategy === 'sch_1_2_4') {
      const step = (day.ganAtDay > 0 ? day.ganAtDay : 0) % 3;
      multiplier = Math.pow(2, step);
    }

    const dayCost = setSize * betPerNum * multiplier;
    let dayReward = 0;

    if (day.isHit) {
      dayReward = betPerNum * multiplier * winPayoutRatio * day.hitCount;
      currentMultiplier = 1;
    } else {
      if (strategy === 'martingale') {
        currentMultiplier = Math.min(currentMultiplier * 2, 32);
      }
    }

    totalInvested += dayCost;
    totalPayout += dayReward;
    currentProfit = totalPayout - totalInvested;

    if (currentProfit > peakProfit) {
      peakProfit = currentProfit;
    }
    const drawdown = peakProfit - currentProfit;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }

    return {
      date: day.date,
      isHit: day.isHit,
      multiplier,
      dayCost,
      dayReward,
      dayProfit: dayReward - dayCost,
      cumulativeProfit: currentProfit
    };
  });

  const netProfit = totalPayout - totalInvested;
  const roi = totalInvested > 0 ? ((netProfit / totalInvested) * 100).toFixed(2) : 0;

  return {
    totalInvested,
    totalPayout,
    netProfit,
    roi,
    maxDrawdown,
    logs: logs.reverse()
  };
}
