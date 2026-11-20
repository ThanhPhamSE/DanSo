/**
 * Lottery Data Service
 * Manages fetching from Firebase Realtime Database with seamless local seed fallback and caching.
 */

import { fetchFromFirebase, getDatabaseUrl } from './firebaseClient';
import { normalizeLotteryData } from './dataNormalizer';

const CACHE_KEY = 'lottery_data_cache_v2010';
const SYNC_META_KEY = 'lottery_sync_meta_v2010';

export async function loadLotteryData(forceOnline = false) {
  let cachedData = null;
  let cachedMeta = null;

  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) cachedData = JSON.parse(raw);
    const rawMeta = localStorage.getItem(SYNC_META_KEY);
    if (rawMeta) cachedMeta = JSON.parse(rawMeta);
  } catch (e) {
    console.warn('Cache read error:', e);
  }

  // If not forcing online and valid cache exists, return immediately
  if (!forceOnline && cachedData && cachedData.length > 0) {
    return {
      records: cachedData,
      meta: cachedMeta || { source: 'cache', lastSync: new Date().toISOString() }
    };
  }

  // 1. Try fetching directly from Firebase Realtime Database (from 2010-01-01)
  try {
    const [rawDb, rawG1] = await Promise.all([
      fetchFromFirebase('lottery_results', '2010-01-01'),
      fetchFromFirebase('lottery_first_results', '2010-01-01')
    ]);

    const { cleanRecords, auditReport } = normalizeLotteryData(rawDb, rawG1, '2010-01-01');

    if (cleanRecords.length > 0) {
      const meta = {
        source: 'firebase_online',
        lastSync: new Date().toISOString(),
        databaseUrl: getDatabaseUrl(),
        audit: auditReport
      };

      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cleanRecords));
        localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
      } catch (e) {
        console.warn('Cache write error:', e);
      }

      return { records: cleanRecords, meta };
    }
  } catch (err) {
    console.warn('[DataService] Direct Firebase fetch uncontactable, fallback to local seed dataset:', err.message);
  }

  // 2. Fallback to pre-extracted 2010 seed dataset
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

      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(seedData));
        localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
      } catch (e) {}

      return { records: seedData, meta };
    }
  } catch (err) {
    console.error('Seed dataset load failed:', err);
  }

  // 3. Fallback to cached data if all else fails
  if (cachedData) {
    return { records: cachedData, meta: cachedMeta };
  }

  return { records: [], meta: null };
}

export function getSyncMetadata() {
  try {
    const raw = localStorage.getItem(SYNC_META_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
