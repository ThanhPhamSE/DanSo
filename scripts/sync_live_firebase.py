import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

base = 'https://appdanso-default-rtdb.asia-southeast1.firebasedatabase.app'

print("1. Fetching all lottery_results from Firebase (2010 to present)...")
url_db = f'{base}/lottery_results.json?orderBy="$key"&startAt="2010-01-01"'
req_db = urllib.request.Request(url_db, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req_db, timeout=25, context=ctx) as r:
    raw_db = json.loads(r.read().decode('utf-8'))

print(f"   => Loaded {len(raw_db)} DB records.")

print("2. Fetching all lottery_first_results from Firebase (2010 to present)...")
url_g1 = f'{base}/lottery_first_results.json?orderBy="$key"&startAt="2010-01-01"'
req_g1 = urllib.request.Request(url_g1, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req_g1, timeout=25, context=ctx) as r:
    raw_g1 = json.loads(r.read().decode('utf-8'))

print(f"   => Loaded {len(raw_g1)} G1 records.")

# Normalize records
TET_FAKE_DATES = {
    '2023-01-21', '2023-01-22', '2023-01-23', '2023-01-24',
    '2024-02-09', '2024-02-10', '2024-02-11', '2024-02-12',
    '2025-01-28', '2025-01-29', '2025-01-30', '2025-01-31',
    '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19'
}

all_dates = sorted(set(list(raw_db.keys()) + list(raw_g1.keys())), reverse=True)
clean_records = []

for date in all_dates:
    if date < '2010-01-01' or date in TET_FAKE_DATES:
        continue
    db_item = raw_db.get(date, {})
    g1_item = raw_g1.get(date, {})

    sp = str(db_item.get('specialPrize', '') if isinstance(db_item, dict) else db_item)
    fp = str(g1_item.get('firstPrize', '') if isinstance(g1_item, dict) else g1_item)

    db = str(db_item.get('bo', '') if isinstance(db_item, dict) else '').zfill(2) if db_item else ''
    if not db and len(sp) == 5:
        db = sp[-2:]

    g1 = str(g1_item.get('bo', '') if isinstance(g1_item, dict) else '').zfill(2) if g1_item else ''
    if not g1 and len(fp) == 5:
        g1 = fp[-2:]

    if db or g1:
        clean_records.append({
            'd': date,
            'db': db,
            'g1': g1,
            'sp': sp,
            'fp': fp
        })

print(f"3. Total normalized records: {len(clean_records)}")
print(f"   Latest record: {clean_records[0]}")
print(f"   Oldest record: {clean_records[-1]}")

# Save to public and dist
for out_path in ['public/xsmb_from_2010.json', 'dist/xsmb_from_2010.json']:
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(clean_records, f, ensure_ascii=False)
    print(f"   => Saved {out_path}")

print("Done sync from live Firebase!")
