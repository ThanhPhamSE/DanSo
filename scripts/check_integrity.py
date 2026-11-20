import json
import re

export_path = r'd:\Dowload\appdanso-default-rtdb-export.json'

with open(export_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

lr = data.get('lottery_results', {})
lfr = data.get('lottery_first_results', {})

print("=== CHECK DATA INTEGRITY FOR lottery_results (DB) ===")
invalid_lr_records = []
bo_mismatch_lr = []
specialPrize_lengths = {}
bo_lengths = {}

for date_key, val in lr.items():
    # Check required fields
    required = ['id', 'date', 'dateDisplay', 'specialPrize', 'bo', 'dau', 'duoi', 'tong', 'timestamp']
    missing = [f for f in required if f not in val]
    if missing:
        invalid_lr_records.append((date_key, f"Missing fields: {missing}"))
        continue
    
    # Check date matches key
    if val['date'] != date_key:
        invalid_lr_records.append((date_key, f"Date mismatch: key={date_key}, date={val['date']}"))

    # Check prize length
    sp = str(val['specialPrize'])
    specialPrize_lengths[len(sp)] = specialPrize_lengths.get(len(sp), 0) + 1
    if len(sp) != 5:
        invalid_lr_records.append((date_key, f"specialPrize length != 5: {sp}"))

    # Check bo length
    bo = str(val['bo'])
    bo_lengths[len(bo)] = bo_lengths.get(len(bo), 0) + 1
    if len(bo) != 2:
        invalid_lr_records.append((date_key, f"bo length != 2: {bo}"))

    # Check bo == last 2 digits of specialPrize
    if bo != sp[-2:]:
        bo_mismatch_lr.append((date_key, sp, bo))

    # Check dau, duoi, tong
    if val['dau'] != int(bo[0]) or val['duoi'] != int(bo[1]) or val['tong'] != (val['dau'] + val['duoi']):
        invalid_lr_records.append((date_key, f"dau/duoi/tong calculation mismatch: {val}"))

print(f"Total invalid DB records: {len(invalid_lr_records)}")
if invalid_lr_records:
    print("Samples:", invalid_lr_records[:5])
print(f"SpecialPrize length breakdown: {specialPrize_lengths}")
print(f"bo length breakdown: {bo_lengths}")
print(f"bo vs specialPrize[-2:] mismatches: {len(bo_mismatch_lr)}")

print("\n=== CHECK DATA INTEGRITY FOR lottery_first_results (G1) ===")
invalid_lfr_records = []
bo_mismatch_lfr = []
firstPrize_lengths = {}
bo_lengths_lfr = {}

for date_key, val in lfr.items():
    required = ['id', 'date', 'dateDisplay', 'firstPrize', 'bo', 'dau', 'duoi', 'tong', 'timestamp']
    missing = [f for f in required if f not in val]
    if missing:
        invalid_lfr_records.append((date_key, f"Missing fields: {missing}"))
        continue
    
    if val['date'] != date_key:
        invalid_lfr_records.append((date_key, f"Date mismatch: key={date_key}, date={val['date']}"))

    fp = str(val['firstPrize'])
    firstPrize_lengths[len(fp)] = firstPrize_lengths.get(len(fp), 0) + 1
    if len(fp) != 5:
        invalid_lfr_records.append((date_key, f"firstPrize length != 5: {fp}"))

    bo = str(val['bo'])
    bo_lengths_lfr[len(bo)] = bo_lengths_lfr.get(len(bo), 0) + 1
    if len(bo) != 2:
        invalid_lfr_records.append((date_key, f"bo length != 2: {bo}"))

    if bo != fp[-2:]:
        bo_mismatch_lfr.append((date_key, fp, bo))

    if val['dau'] != int(bo[0]) or val['duoi'] != int(bo[1]) or val['tong'] != (val['dau'] + val['duoi']):
        invalid_lfr_records.append((date_key, f"dau/duoi/tong calculation mismatch: {val}"))

print(f"Total invalid G1 records: {len(invalid_lfr_records)}")
if invalid_lfr_records:
    print("Samples:", invalid_lfr_records[:5])
print(f"firstPrize length breakdown: {firstPrize_lengths}")
print(f"bo length breakdown: {bo_lengths_lfr}")
print(f"bo vs firstPrize[-2:] mismatches: {len(bo_mismatch_lfr)}")

# What are the 52 dates only in lottery_results?
only_in_lr = sorted(list(set(lr.keys()) - set(lfr.keys())))
print(f"\n=== INSPECT 52 DATES ONLY IN lottery_results (missing in G1) ===")
print("Dates:", only_in_lr)
# Let's see some values for these dates in lottery_results:
for d in only_in_lr[:5]:
    print(f"Date {d}: {lr[d]}")
