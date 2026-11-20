import json
import os

export_path = r'd:\Dowload\appdanso-default-rtdb-export.json'
with open(export_path, 'r', encoding='utf-8') as f:
    fb = json.load(f)

# Keep existing 27 lo prizes where available
try:
    with open('src/data/xsmb.json', 'r', encoding='utf-8') as f:
        local_xsmb = json.load(f)
    local_map = {item['d']: item.get('lo', []) for item in local_xsmb}
except Exception as e:
    local_map = {}

lr = fb.get('lottery_results', {})
lfr = fb.get('lottery_first_results', {})
dan_so = fb.get('dan_so', {})

tet_fake_dates = {
    '2023-01-21', '2023-01-22', '2023-01-23', '2023-01-24',
    '2024-02-09', '2024-02-10', '2024-02-11', '2024-02-12',
    '2025-01-28', '2025-01-29', '2025-01-30', '2025-01-31',
    '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19'
}

all_dates = sorted(list(set(lr.keys()) | set(lfr.keys())), reverse=True) # newest first
clean_records = []

for d in all_dates:
    if d in tet_fake_dates:
        continue
    
    db_item = lr.get(d)
    g1_item = lfr.get(d)
    
    db_bo = db_item.get('bo') if db_item else ''
    g1_bo = g1_item.get('bo') if g1_item else ''
    
    lo_list = local_map.get(d, [])
    if not lo_list and db_bo:
        lo_list = [db_bo]
        if g1_bo:
            lo_list.append(g1_bo)
    
    record = {
        'd': d,
        'db': db_bo,
        'g1': g1_bo,
        'sp': db_item.get('specialPrize', '') if db_item else '',
        'fp': g1_item.get('firstPrize', '') if g1_item else '',
        'lo': lo_list
    }
    clean_records.append(record)

print(f"Total clean records generated: {len(clean_records)}")
print("Newest 3 records:")
for r in clean_records[:3]:
    print(" ", r['d'], "DB:", r['db'], "G1:", r['g1'], "SP:", r['sp'], "FP:", r['fp'])

print("Oldest 2 records:")
for r in clean_records[-2:]:
    print(" ", r['d'], "DB:", r['db'], "G1:", r['g1'], "SP:", r['sp'], "FP:", r['fp'])

# Save to public/xsmb.json, src/data/xsmb.json, xsmb.json
for out_p in ['xsmb.json', 'public/xsmb.json', 'src/data/xsmb.json']:
    with open(out_p, 'w', encoding='utf-8') as f:
        json.dump(clean_records, f, ensure_ascii=False)
    print(f"Saved {out_p} ({len(clean_records)} records)")

# Also save preset dan_so from Firebase
preset_sets = []
for k, v in dan_so.items():
    cnt = len(v.get('numbers', []))
    tgt = v.get('target', 'TAIL')
    tgt_name = "Giải Nhất (G1)" if tgt == "HEAD" else "Giải Đặc Biệt (ĐB)"
    preset_sets.append({
        'id': v.get('id', k),
        'name': v.get('name', 'Dàn số'),
        'numbers': v.get('numbers', []),
        'target': tgt,
        'note': f"{cnt} số ({tgt_name})"
    })

preset_sets.sort(key=lambda x: x['name'])
with open('src/data/firebase_dan_so.json', 'w', encoding='utf-8') as f:
    json.dump(preset_sets, f, ensure_ascii=False, indent=2)
print(f"Saved src/data/firebase_dan_so.json ({len(preset_sets)} presets)")
