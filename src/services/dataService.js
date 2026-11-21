/**
 * Lottery Data Service — Smart Auto-Update Edition
 *
 * Strategy:
 * 1. Load from cache immediately (fast UI render)
 * 2. Auto-detect if data is stale (cache date < today OR cache older than 2h)
 * 3. If stale → incremental fetch from Firebase (only missing days, not full reload)
 * 4. Merge new records into existing cache (keep all 10 years, add today's data)
 * 5. Background auto-refresh every 2 hours while app is open
 */

import { fetchFromFirebase, fetchIncrementalFromFirebase, getDatabaseUrl } from './firebaseClient';
import { normalizeLotteryData, TET_FAKE_DUPLICATE_DATES } from './dataNormalizer';

const CACHE_KEY = 'lottery_data_cache_v2026_11_21';
const SYNC_META_KEY = 'lottery_sync_meta_v2026_11_21';

// Cache expires after 2 hours (in ms)
const CACHE_MAX_AGE_MS = 2 * 60 * 60 * 1000;

/** Returns today's date as 'YYYY-MM-DD' in Vietnam timezone (UTC+7) */
function getTodayVN() {
  const now = new Date();
  // Offset to UTC+7
  const utc7 = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return utc7.toISOString().slice(0, 10);
}

/** Add N days to a YYYY-MM-DD string */
function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Read cache from localStorage */
function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const rawMeta = localStorage.getItem(SYNC_META_KEY);
    const data = raw ? JSON.parse(raw) : null;
    const meta = rawMeta ? JSON.parse(rawMeta) : null;
    return { data, meta };
  } catch (e) {
    return { data: null, meta: null };
  }
}

/** Write updated cache to localStorage */
function writeCache(records, meta) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(records));
    localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
  } catch (e) {
    console.warn('[DataService] Cache write failed:', e.message);
  }
}

/**
 * Determine if the cache needs a refresh:
 * - Cache is empty → needs full refresh
 * - endDate in cache < today → new draws available
 * - lastSync older than CACHE_MAX_AGE_MS → periodic refresh
 */
function isCacheStale(data, meta) {
  if (!data || data.length === 0) return { stale: true, reason: 'empty_cache' };

  const today = getTodayVN();
  const endDate = meta?.audit?.endDate || data[0]?.d || '';

  if (endDate < today) {
    return { stale: true, reason: 'missing_today', endDate, today };
  }

  if (meta?.lastSync) {
    const age = Date.now() - new Date(meta.lastSync).getTime();
    if (age > CACHE_MAX_AGE_MS) {
      return { stale: true, reason: 'expired', ageHours: (age / 3600000).toFixed(1) };
    }
  }

  return { stale: false };
}

/**
 * Incremental update: only fetches records from (cacheEndDate + 1 day) to today
 * Merges them into the existing cache.
 * This is very fast since it only fetches a few days of data.
 */
async function incrementalUpdate(existingRecords, cacheEndDate) {
  const fetchFrom = addDays(cacheEndDate, 1); // start from day after last known date

  console.log(`[DataService] Incremental fetch from ${fetchFrom} → today`);

  const [rawDb, rawG1] = await Promise.all([
    fetchIncrementalFromFirebase('lottery_results', fetchFrom),
    fetchIncrementalFromFirebase('lottery_first_results', fetchFrom)
  ]);

  if ((!rawDb || Object.keys(rawDb).length === 0) &&
      (!rawG1 || Object.keys(rawG1).length === 0)) {
    // No new data yet (draw hasn't happened today or Firebase not updated)
    return null;
  }

  const { cleanRecords: newRecords } = normalizeLotteryData(rawDb, rawG1, fetchFrom);

  if (newRecords.length === 0) return null;

  // Merge: new records first (newest), then existing (sorted newest first already)
  const existingDates = new Set(existingRecords.map(r => r.d));
  const toAdd = newRecords.filter(r => !existingDates.has(r.d));

  if (toAdd.length === 0) return null;

  console.log(`[DataService] ✅ Added ${toAdd.length} new draw(s): ${toAdd.map(r => r.d).join(', ')}`);

  return [...toAdd, ...existingRecords]; // merged, still sorted newest first
}

/**
 * Full load from Firebase (initial load or forced reload)
 * Fetches all data from 2010-01-01 to present
 */
async function fullLoadFromFirebase() {
  const [rawDb, rawG1] = await Promise.all([
    fetchFromFirebase('lottery_results', '2010-01-01'),
    fetchFromFirebase('lottery_first_results', '2010-01-01')
  ]);

  const { cleanRecords, auditReport } = normalizeLotteryData(rawDb, rawG1, '2010-01-01');
  return { cleanRecords, auditReport };
}

/**
 * Main entry point
 * @param {boolean} forceOnline - Force bypass cache and do a full reload
 */
export async function loadLotteryData(forceOnline = false) {
  const { data: cachedData, meta: cachedMeta } = readCache();
  const today = getTodayVN();

  // --- FORCE RELOAD (user clicked "Đồng Bộ") ---
  if (forceOnline) {
    try {
      console.log('[DataService] Force full reload from Firebase...');
      const { cleanRecords, auditReport } = await fullLoadFromFirebase();

      if (cleanRecords.length > 0) {
        const meta = {
          source: 'firebase_online',
          lastSync: new Date().toISOString(),
          databaseUrl: getDatabaseUrl(),
          audit: auditReport
        };
        writeCache(cleanRecords, meta);
        return { records: cleanRecords, meta };
      }
    } catch (err) {
      console.warn('[DataService] Force reload failed, returning cached data:', err.message);
    }
    // Fall through to cached
    if (cachedData?.length > 0) return { records: cachedData, meta: cachedMeta };
  }

  // --- CACHE IS FRESH → Return immediately (fast path) ---
  const staleness = isCacheStale(cachedData, cachedMeta);
  if (!staleness.stale && cachedData?.length > 0) {
    console.log(`[DataService] Cache fresh (${cachedData[0]?.d}), skipping Firebase fetch.`);
    return { records: cachedData, meta: cachedMeta };
  }

  // --- CACHE IS STALE → Try incremental update first ---
  if (cachedData?.length > 0 && staleness.reason === 'missing_today') {
    try {
      const cacheEndDate = cachedMeta?.audit?.endDate || cachedData[0]?.d;
      console.log(`[DataService] Cache ends at ${cacheEndDate}, today is ${today}. Incremental update...`);

      const merged = await incrementalUpdate(cachedData, cacheEndDate);

      if (merged) {
        const newEndDate = merged[0]?.d || cacheEndDate;
        const meta = {
          source: 'firebase_incremental',
          lastSync: new Date().toISOString(),
          databaseUrl: getDatabaseUrl(),
          audit: {
            ...cachedMeta?.audit,
            totalRecords: merged.length,
            endDate: newEndDate,
            lastIncrementalDate: today
          }
        };
        writeCache(merged, meta);
        return { records: merged, meta };
      } else {
        // Firebase not updated yet for today (draw might be later)
        // Return cache but bump lastSync so we don't retry too frequently
        const updatedMeta = {
          ...cachedMeta,
          lastSync: new Date().toISOString(),
          source: 'cache_pending_today',
          pendingDate: today
        };
        writeCache(cachedData, updatedMeta);
        return { records: cachedData, meta: updatedMeta };
      }
    } catch (err) {
      console.warn('[DataService] Incremental update failed, trying full reload:', err.message);
    }
  }

  // --- EXPIRED CACHE (older than 2h) → Incremental or full reload ---
  if (cachedData?.length > 0 && staleness.reason === 'expired') {
    try {
      const cacheEndDate = cachedMeta?.audit?.endDate || cachedData[0]?.d;
      const merged = await incrementalUpdate(cachedData, cacheEndDate);

      if (merged) {
        const meta = {
          source: 'firebase_incremental',
          lastSync: new Date().toISOString(),
          databaseUrl: getDatabaseUrl(),
          audit: {
            ...cachedMeta?.audit,
            totalRecords: merged.length,
            endDate: merged[0]?.d || cacheEndDate
          }
        };
        writeCache(merged, meta);
        return { records: merged, meta };
      }
      // No new data, just bump lastSync
      const updatedMeta = { ...cachedMeta, lastSync: new Date().toISOString() };
      writeCache(cachedData, updatedMeta);
      return { records: cachedData, meta: updatedMeta };
    } catch (err) {
      console.warn('[DataService] Expired refresh failed:', err.message);
      return { records: cachedData, meta: cachedMeta };
    }
  }

  // --- NO CACHE AT ALL → Full load from Firebase ---
  try {
    console.log('[DataService] No cache found, full load from Firebase 2010 → now...');
    const { cleanRecords, auditReport } = await fullLoadFromFirebase();

    if (cleanRecords.length > 0) {
      const meta = {
        source: 'firebase_online',
        lastSync: new Date().toISOString(),
        databaseUrl: getDatabaseUrl(),
        audit: auditReport
      };
      writeCache(cleanRecords, meta);
      return { records: cleanRecords, meta };
    }
  } catch (err) {
    console.warn('[DataService] Full Firebase load failed, trying local seed:', err.message);
  }

  // --- LAST RESORT: Local seed dataset ---
  try {
    const res = await fetch('/xsmb_from_2010.json', { cache: 'no-cache' });
    if (res.ok) {
      const seedData = await res.json();
      const meta = {
        source: 'local_seed_2010',
        lastSync: new Date().toISOString(),
        audit: {
          totalRecords: seedData.length,
          startDate: seedData[seedData.length - 1]?.d || '2010-01-01',
          endDate: seedData[0]?.d || ''
        }
      };
      writeCache(seedData, meta);
      return { records: seedData, meta };
    }
  } catch (err) {
    console.error('[DataService] Local seed also failed:', err);
  }

  // Absolute fallback
  if (cachedData) return { records: cachedData, meta: cachedMeta };
  return { records: [], meta: null };
}

/**
 * Check if Firebase has a newer draw date than our current local records.
 * If yes, automatically fetch and merge the new records incrementally.
 * Returns { hasNew: true, records, meta, newDate } or { hasNew: false }
 */
export async function checkAndSyncNewDraws(currentLatestDate) {
  try {
    const baseUrl = getDatabaseUrl();
    // Tiny lightweight query: fetch only the 1 latest key from Firebase
    const url = `${baseUrl}/lottery_results.json?orderBy="$key"&limitToLast=1`;
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) return { hasNew: false };
    
    const data = await res.json();
    if (!data || typeof data !== 'object') return { hasNew: false };

    const firebaseLatestDate = Object.keys(data)[0];
    if (!firebaseLatestDate) return { hasNew: false };

    // If Firebase has a newer date than current in-memory / cache
    if (!currentLatestDate || firebaseLatestDate > currentLatestDate) {
      console.log(`[DataService] 🔥 Found newer draw on Firebase: ${firebaseLatestDate} > ${currentLatestDate}. Syncing...`);
      const { data: cachedData } = readCache();
      const baseRecords = (cachedData && cachedData.length > 0) ? cachedData : [];
      
      const merged = await incrementalUpdate(baseRecords, currentLatestDate || '2010-01-01');
      if (merged && merged.length > 0) {
        const meta = {
          source: 'firebase_incremental',
          lastSync: new Date().toISOString(),
          databaseUrl: getDatabaseUrl(),
          audit: {
            totalRecords: merged.length,
            startDate: merged[merged.length - 1]?.d || '2010-01-01',
            endDate: merged[0]?.d || firebaseLatestDate
          }
        };
        writeCache(merged, meta);
        return { hasNew: true, records: merged, meta, newDate: merged[0]?.d };
      }
    }
    return { hasNew: false };
  } catch (err) {
    console.warn('[DataService] Background check failed:', err.message);
    return { hasNew: false, error: err.message };
  }
}

export function getSyncMetadata() {
  try {
    const raw = localStorage.getItem(SYNC_META_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Manually add or update a draw result (e.g. today or missing date)
 * Immediately updates localStorage cache and returns updated records
 */
export function addOrUpdateManualRecord(newRec) {
  const { data: cachedData, meta: cachedMeta } = readCache();
  const records = cachedData || [];

  // Remove existing record on same date if any
  const filtered = records.filter(r => r.d !== newRec.d);
  const updated = [newRec, ...filtered].sort((a, b) => b.d.localeCompare(a.d));

  const updatedMeta = {
    ...cachedMeta,
    source: 'manual_override',
    lastSync: new Date().toISOString(),
    audit: {
      ...cachedMeta?.audit,
      totalRecords: updated.length,
      endDate: updated[0]?.d
    }
  };

  writeCache(updated, updatedMeta);
  return { records: updated, meta: updatedMeta };
}

/** Clear all cache (force full reload next time) */
export function clearDataCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(SYNC_META_KEY);
  } catch (e) {}
}
