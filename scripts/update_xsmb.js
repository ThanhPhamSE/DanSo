import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Helper to format date YYYY-MM-DD (GMT+7 for Vietnam)
export function getTodayGMT7String() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const gmt7 = new Date(utc + (3600000 * 7));
  const yyyy = gmt7.getFullYear();
  const mm = String(gmt7.getMonth() + 1).padStart(2, '0');
  const dd = String(gmt7.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Scrape XSMB from xosodaiphat
export async function fetchXSMBFromWeb(dateStr) {
  const [yyyy, mm, dd] = dateStr.split('-');
  const dateFormatted = `${dd}-${mm}-${yyyy}`;
  const url = `https://xosodaiphat.com/xsmb-${dateFormatted}.html`;

  console.log(`[XSMB Scraper] Fetching ${url}...`);

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!res.ok) {
      console.warn(`[XSMB Scraper] HTTP ${res.status} when fetching ${url}`);
      return null;
    }

    const html = await res.text();
    const prizeKeys = [
      ['DB', 1],
      ['1', 1],
      ['2', 2],
      ['3', 6],
      ['4', 4],
      ['5', 6],
      ['6', 3],
      ['7', 4]
    ];

    const rawPrizes = [];
    for (const [key, count] of prizeKeys) {
      for (let i = 0; i < count; i++) {
        const regex = new RegExp(`id=["']?mb_prize_${key}_item_${i}["']?[^>]*>\\s*(\\d+)\\s*<`, 'i');
        const m = html.match(regex);
        if (m) {
          rawPrizes.push(m[1].trim());
        } else {
          console.warn(`[XSMB Scraper] Missing prize ${key} item ${i}`);
          return null;
        }
      }
    }

    if (rawPrizes.length === 27) {
      const special = rawPrizes[0];
      const db = special.slice(-2).padStart(2, '0');
      const lo = rawPrizes.map(p => p.slice(-2).padStart(2, '0'));
      return {
        date: dateStr,
        rawPrizes,
        db,
        lo
      };
    }
  } catch (err) {
    console.error(`[XSMB Scraper] Error parsing ${dateStr}:`, err.message);
  }

  return null;
}

// Function to add XSMB entry to all JSON and CSV datasets
export function addXSMBEntry(entry) {
  const jsonPaths = [
    path.join(rootDir, 'xsmb.json'),
    path.join(rootDir, 'public', 'xsmb.json'),
    path.join(rootDir, 'src', 'data', 'xsmb.json')
  ];

  const csvPath = path.join(rootDir, 'xsmb_data.csv');
  let updatedAny = false;

  // 1. Update JSON files (newest first)
  jsonPaths.forEach(jsonPath => {
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      const exists = data.some(item => item.d === entry.date);
      if (!exists) {
        const newItem = {
          d: entry.date,
          db: entry.db,
          lo: entry.lo
        };
        data.unshift(newItem);
        fs.writeFileSync(jsonPath, JSON.stringify(data), 'utf8');
        console.log(`[OK] Added ${entry.date} to ${path.relative(rootDir, jsonPath)}`);
        updatedAny = true;
      } else {
        console.log(`[Info] ${path.relative(rootDir, jsonPath)} already contains ${entry.date}`);
      }
    }
  });

  // 2. Update CSV file (append to bottom)
  if (fs.existsSync(csvPath)) {
    const csvContent = fs.readFileSync(csvPath, 'utf8').trim();
    if (!csvContent.includes(entry.date)) {
      const csvRow = `${entry.date},${entry.rawPrizes.join(',')}`;
      fs.writeFileSync(csvPath, `${csvContent}\n${csvRow}\n`, 'utf8');
      console.log(`[OK] Added ${entry.date} to xsmb_data.csv`);
      updatedAny = true;
    } else {
      console.log(`[Info] xsmb_data.csv already contains ${entry.date}`);
    }
  }

  return updatedAny;
}

// Main execution function
async function main() {
  const targetDate = process.argv[2] || getTodayGMT7String();
  console.log(`=== XSMB Auto Updater ===`);
  console.log(`Target Date: ${targetDate}`);

  // Check if date already exists in main json file
  const mainJsonPath = path.join(rootDir, 'xsmb.json');
  let alreadyExists = false;
  if (fs.existsSync(mainJsonPath)) {
    const data = JSON.parse(fs.readFileSync(mainJsonPath, 'utf8'));
    alreadyExists = data.some(item => item.d === targetDate);
  }

  if (alreadyExists) {
    console.log(`Date ${targetDate} is ALREADY UPDATED in dataset.`);
    return;
  }

  const fetchedEntry = await fetchXSMBFromWeb(targetDate);
  if (fetchedEntry) {
    console.log(`Successfully fetched XSMB data for ${targetDate}: DB=${fetchedEntry.db}, Lo Count=${fetchedEntry.lo.length}`);
    addXSMBEntry(fetchedEntry);
    console.log(`=== Update Completed Successfully ===`);
  } else {
    console.error(`Failed to fetch XSMB data for ${targetDate}. Result may not be available yet.`);
  }
}

// Run main if called directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('update_xsmb.js')) {
  main();
}
