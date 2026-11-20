import json
import os
import re
from datetime import datetime, timedelta

export_path = r'd:\Dowload\appdanso-default-rtdb-export.json'

print("Loading JSON export...")
with open(export_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

print("=== 1. ROOT NODES ===")
for k, v in data.items():
    print(f"Node: '{k}' | Type: {type(v).__name__} | Size: {len(v)}")

# 1. Inspect dan_so
print("\n=== 2. INSPECT 'dan_so' ===")
dan_so = data.get('dan_so', {})
print(f"Total dan_so records: {len(dan_so)}")
for i, (k, v) in enumerate(list(dan_so.items())[:3]):
    print(f"Sample {i+1} [ID: {k}]:")
    print(json.dumps(v, indent=2, ensure_ascii=False))

# Check fields in dan_so
dan_so_fields = {}
for k, v in dan_so.items():
    if isinstance(v, dict):
        for f_name, f_val in v.items():
            t_name = type(f_val).__name__
            dan_so_fields.setdefault(f_name, set()).add(t_name)
print("Fields in dan_so:", dan_so_fields)

# 2. Inspect lottery_results
print("\n=== 3. INSPECT 'lottery_results' ===")
lr = data.get('lottery_results', {})
print(f"Total lottery_results records: {len(lr)}")

lr_keys = list(lr.keys())
print("Sample keys (dates):", lr_keys[:5], "...", lr_keys[-5:])

# Check key formats
date_pattern = re.compile(r'^\d{4}-\d{2}-\d{2}$')
invalid_keys_lr = [k for k in lr_keys if not date_pattern.match(k)]
print(f"Invalid date keys in lottery_results: {len(invalid_keys_lr)} ({invalid_keys_lr[:5]})")

# Check values in lottery_results
lr_types = set(type(v).__name__ for v in lr.values())
print(f"Value types in lottery_results: {lr_types}")

# Sample values
print("Sample lottery_results values:")
for k in lr_keys[:3] + lr_keys[-3:]:
    print(f"  {k}: {repr(lr[k])} (type: {type(lr[k]).__name__})")

# Value format check (lengths, strings vs numbers, leading zeros)
val_lengths_lr = {}
non_str_lr = []
has_leading_zero = 0
for k, v in lr.items():
    if not isinstance(v, str):
        non_str_lr.append((k, v))
    else:
        l = len(v)
        val_lengths_lr[l] = val_lengths_lr.get(l, 0) + 1
        if v.startswith('0'):
            has_leading_zero += 1

print(f"Value string length distribution in lottery_results: {val_lengths_lr}")
print(f"Count of values starting with '0': {has_leading_zero}")
print(f"Non-string values in lottery_results: {len(non_str_lr)}")

# Date range in lottery_results
sorted_lr_dates = sorted([k for k in lr_keys if date_pattern.match(k)])
if sorted_lr_dates:
    print(f"Date range: {sorted_lr_dates[0]} to {sorted_lr_dates[-1]}")
    d_start = datetime.strptime(sorted_lr_dates[0], '%Y-%m-%d')
    d_end = datetime.strptime(sorted_lr_dates[-1], '%Y-%m-%d')
    expected_days = (d_end - d_start).days + 1
    actual_days = len(sorted_lr_dates)
    print(f"Expected span days: {expected_days}, Actual records: {actual_days}, Difference (missing draws/Tet): {expected_days - actual_days}")

# 3. Inspect lottery_first_results
print("\n=== 4. INSPECT 'lottery_first_results' ===")
lfr = data.get('lottery_first_results', {})
print(f"Total lottery_first_results records: {len(lfr)}")

lfr_keys = list(lfr.keys())
invalid_keys_lfr = [k for k in lfr_keys if not date_pattern.match(k)]
print(f"Invalid date keys in lottery_first_results: {len(invalid_keys_lfr)} ({invalid_keys_lfr[:5]})")

lfr_types = set(type(v).__name__ for v in lfr.values())
print(f"Value types in lottery_first_results: {lfr_types}")

print("Sample lottery_first_results values:")
for k in lfr_keys[:3] + lfr_keys[-3:]:
    print(f"  {k}: {repr(lfr[k])} (type: {type(lfr[k]).__name__})")

val_lengths_lfr = {}
non_str_lfr = []
has_leading_zero_lfr = 0
for k, v in lfr.items():
    if not isinstance(v, str):
        non_str_lfr.append((k, v))
    else:
        l = len(v)
        val_lengths_lfr[l] = val_lengths_lfr.get(l, 0) + 1
        if v.startswith('0'):
            has_leading_zero_lfr += 1

print(f"Value string length distribution in lottery_first_results: {val_lengths_lfr}")
print(f"Count of values starting with '0': {has_leading_zero_lfr}")
print(f"Non-string values in lottery_first_results: {len(non_str_lfr)}")

sorted_lfr_dates = sorted([k for k in lfr_keys if date_pattern.match(k)])
if sorted_lfr_dates:
    print(f"Date range: {sorted_lfr_dates[0]} to {sorted_lfr_dates[-1]}")

# 4. Compare lottery_results vs lottery_first_results
print("\n=== 5. COMPARE DB (lottery_results) vs G1 (lottery_first_results) ===")
set_lr = set(lr_keys)
set_lfr = set(lfr_keys)

only_in_lr = sorted(list(set_lr - set_lfr))
only_in_lfr = sorted(list(set_lfr - set_lr))
common = sorted(list(set_lr & set_lfr))

print(f"Common dates: {len(common)}")
print(f"Dates only in lottery_results: {len(only_in_lr)} (e.g. {only_in_lr[:5]} ... {only_in_lr[-5:] if only_in_lr else ''})")
print(f"Dates only in lottery_first_results: {len(only_in_lfr)} (e.g. {only_in_lfr[:5]} ... {only_in_lfr[-5:] if only_in_lfr else ''})")

# Let's inspect some samples of common dates
print("\nSide-by-side sample for 5 recent dates:")
for d in common[-5:]:
    print(f"Date: {d} | lottery_results (DB): {lr[d]} | lottery_first_results (G1): {lfr[d]}")

print("\n=== 6. DETAIL OF ALL 'dan_so' RECORDS ===")
for k, v in dan_so.items():
    nums = v.get('numbers', [])
    print(f"- ID: {k} | Name: {v.get('name')} | Target: {v.get('target')} | Qty: {len(nums)} numbers")
    print(f"  Sample nums: {nums[:8]} ... (sorted={sorted(nums) == nums})")
