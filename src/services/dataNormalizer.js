/**
 * Data Normalizer & Integrity Validator
 * Enforces:
 * - Date >= 2010-01-01 (10-16 years of data)
 * - Excludes 16 false duplicate draws during Tet holidays
 * - Preserves leading zeros ("00" to "99")
 * - Generates audit report
 */

export const TET_FAKE_DUPLICATE_DATES = new Set([
  '2023-01-21', '2023-01-22', '2023-01-23', '2023-01-24',
  '2024-02-09', '2024-02-10', '2024-02-11', '2024-02-12',
  '2025-01-28', '2025-01-29', '2025-01-30', '2025-01-31',
  '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19'
]);

export function normalizeLotteryData(rawDbMap = {}, rawG1Map = {}, minDate = '2010-01-01') {
  const allDates = new Set([
    ...Object.keys(rawDbMap || {}),
    ...Object.keys(rawG1Map || {})
  ]);

  const cleanRecords = [];
  let skippedTetCount = 0;
  let skippedBeforeMinCount = 0;
  let invalidFormatCount = 0;

  const sortedDates = Array.from(allDates).sort().reverse(); // newest first

  for (const date of sortedDates) {
    if (date < minDate) {
      skippedBeforeMinCount++;
      continue;
    }

    if (TET_FAKE_DUPLICATE_DATES.has(date)) {
      skippedTetCount++;
      continue;
    }

    const dbItem = rawDbMap[date];
    const g1Item = rawG1Map[date];

    // Extract 2-digit with leading zero preserved
    let db = '';
    let sp = '';
    if (dbItem) {
      if (typeof dbItem === 'object') {
        db = String(dbItem.bo || (dbItem.specialPrize ? dbItem.specialPrize.slice(-2) : '')).padStart(2, '0');
        sp = String(dbItem.specialPrize || '');
      } else if (typeof dbItem === 'string') {
        db = dbItem.slice(-2).padStart(2, '0');
        sp = dbItem;
      }
    }

    let g1 = '';
    let fp = '';
    if (g1Item) {
      if (typeof g1Item === 'object') {
        g1 = String(g1Item.bo || (g1Item.firstPrize ? g1Item.firstPrize.slice(-2) : '')).padStart(2, '0');
        fp = String(g1Item.firstPrize || '');
      } else if (typeof g1Item === 'string') {
        g1 = g1Item.slice(-2).padStart(2, '0');
        fp = g1Item;
      }
    }

    // Validate 2-digit string
    if (db && (!/^\d{2}$/.test(db))) {
      invalidFormatCount++;
      db = '';
    }
    if (g1 && (!/^\d{2}$/.test(g1))) {
      invalidFormatCount++;
      g1 = '';
    }

    if (db || g1) {
      cleanRecords.push({
        d: date,
        db,
        g1,
        sp,
        fp
      });
    }
  }

  const auditReport = {
    totalRecords: cleanRecords.length,
    startDate: cleanRecords[cleanRecords.length - 1]?.d || minDate,
    endDate: cleanRecords[0]?.d || '',
    skippedTetCount,
    skippedBeforeMinCount,
    invalidFormatCount,
    hasDbCount: cleanRecords.filter(r => r.db).length,
    hasG1Count: cleanRecords.filter(r => r.g1).length
  };

  return { cleanRecords, auditReport };
}
