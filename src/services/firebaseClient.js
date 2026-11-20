/**
 * Firebase Realtime Database Client
 * Uses native standard fetch for high performance, zero-dependency, and direct browser connectivity.
 */

const DEFAULT_FIREBASE_RTDB_URL = 'https://appdanso-default-rtdb-default-rtdb.firebaseio.com';

export function getDatabaseUrl() {
  try {
    const custom = localStorage.getItem('lottery_firebase_rtdb_url');
    if (custom && custom.trim()) return custom.trim().replace(/\/+$/, '');
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
 * Supports filtering from 2010 via orderBy and startAt
 */
export async function fetchFromFirebase(nodeName, startAtDate = '2010-01-01') {
  const baseUrl = getDatabaseUrl();
  const url = `${baseUrl}/${nodeName}.json?orderBy="$key"&startAt="${startAtDate}"`;

  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) {
      throw new Error(`Firebase HTTP ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    return data || {};
  } catch (err) {
    console.warn(`[FirebaseClient] Direct connection failed for ${nodeName}:`, err.message);
    throw err;
  }
}
