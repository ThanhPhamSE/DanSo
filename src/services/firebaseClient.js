/**
 * Firebase Realtime Database Client
 * Uses native standard fetch for high performance, zero-dependency, and direct browser connectivity.
 */

const DEFAULT_FIREBASE_RTDB_URL = 'https://appdanso-default-rtdb.asia-southeast1.firebasedatabase.app';

export function getDatabaseUrl() {
  try {
    const custom = localStorage.getItem('lottery_firebase_rtdb_url');
    if (custom && custom.trim() && !custom.includes('-default-rtdb-default-rtdb')) {
      return custom.trim().replace(/\/+$/, '');
    }
  } catch (e) {
    console.warn('LocalStorage access error:', e);
  }
  return DEFAULT_FIREBASE_RTDB_URL;
}

export function setDatabaseUrl(url) {
  try {
    if (!url || !url.trim()) {
      localStorage.removeItem('lottery_firebase_rtdb_url');
    } else {
      localStorage.setItem('lottery_firebase_rtdb_url', url.trim().replace(/\/+$/, ''));
    }
  } catch (e) {
    console.warn('LocalStorage write error:', e);
  }
}

/**
 * Fetch a node directly from Firebase Realtime Database
 * Supports filtering from a specific date via orderBy and startAt
 */
export async function fetchFromFirebase(nodeName, startAtDate = '2010-01-01') {
  const baseUrl = getDatabaseUrl();
  const url = `${baseUrl}/${nodeName}.json?orderBy="$key"&startAt="${startAtDate}"`;

  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) {
    throw new Error(`Firebase HTTP ${res.status}: ${res.statusText} for node: ${nodeName}`);
  }
  const data = await res.json();
  return data || {};
}

/**
 * Fetch only new records from a specific start date (for incremental update)
 */
export async function fetchIncrementalFromFirebase(nodeName, startAtDate) {
  return fetchFromFirebase(nodeName, startAtDate);
}

/**
 * Quick connectivity check - fetches only the latest 1 record to test connection
 */
export async function checkFirebaseConnectivity() {
  try {
    const baseUrl = getDatabaseUrl();
    // Fetch just the last item by ordering descending with limitToLast=1
    const url = `${baseUrl}/lottery_results.json?orderBy="$key"&limitToLast=1`;
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const data = await res.json();
    if (data) {
      const latestDate = Object.keys(data)[0] || '';
      return { ok: true, latestDate };
    }
    return { ok: false, error: 'No data returned' };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
