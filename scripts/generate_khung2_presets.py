import json

with open('public/xsmb_from_2010.json', 'r', encoding='utf-8') as f:
    records = json.load(f)

chronicle = list(reversed(records)) # 2010-01-01 to 2026-11-20

def get_prize(row, mode):
    sp = row.get('sp', '')
    fp = row.get('fp', '')
    if mode == 'db_tail':
        return sp[-2:] if len(sp) == 5 else row.get('db', '')
    elif mode == 'db_head':
        return sp[:2] if len(sp) == 5 else ''
    elif mode == 'g1_tail':
        return fp[-2:] if len(fp) == 5 else row.get('g1', '')
    elif mode == 'g1_head':
        return fp[:2] if len(fp) == 5 else ''
    return ''

# Compute stats of individual numbers on last 90, 180, 365 days and all-time
recent_90 = chronicle[-90:]
recent_180 = chronicle[-180:]
recent_365 = chronicle[-365:]

def calc_num_stats(draws, mode='db_tail'):
    freq = {str(i).zfill(2): 0 for i in range(100)}
    temp_gan = {str(i).zfill(2): 0 for i in range(100)}
    max_gan = {str(i).zfill(2): 0 for i in range(100)}
    for d in draws:
        p = get_prize(d, mode)
        for i in range(100):
            num = str(i).zfill(2)
            if num == p:
                freq[num] += 1
                temp_gan[num] = 0
            else:
                temp_gan[num] += 1
                if temp_gan[num] > max_gan[num]:
                    max_gan[num] = temp_gan[num]
    return freq, temp_gan, max_gan

all_freq, current_gans, max_gans = calc_num_stats(chronicle, 'db_tail')
f90, _, _ = calc_num_stats(recent_90, 'db_tail')
f180, _, _ = calc_num_stats(recent_180, 'db_tail')
f365, _, _ = calc_num_stats(recent_365, 'db_tail')

# Sort numbers by criteria to build different exclusion sets of 7 and 8 numbers:
# 1. Top Gan numbers (những con số đang gan lỳ nhất hiện tại)
top_gan_nums = sorted(current_gans.keys(), key=lambda x: current_gans[x], reverse=True)

# 2. Lowest frequency in 90 days
cold_90_nums = sorted(f90.keys(), key=lambda x: f90[x])

# 3. Lowest frequency in 180 days
cold_180_nums = sorted(f180.keys(), key=lambda x: f180[x])

# 4. Lowest frequency in 365 days
cold_365_nums = sorted(f365.keys(), key=lambda x: f365[x])

# 5. Composite cold score (Gan cao + Tần suất thấp)
composite_cold = sorted(
    current_gans.keys(),
    key=lambda x: (current_gans[x] * 1.5 - f90[x] * 3 - f180[x] * 1.5),
    reverse=True
)

# 6. Rare pairs (số kép ít về)
keps = [f"{i}{i}" for i in range(10)]
cold_keps = sorted(keps, key=lambda x: f365[x])

# 7. Sát kép ít về
sat_keps = ['01', '10', '12', '21', '23', '32', '34', '43', '45', '54', '56', '65', '67', '76', '78', '87', '89', '98', '09', '90']
cold_sat_keps = sorted(sat_keps, key=lambda x: f365[x])

print(f"Top 10 Gan: {top_gan_nums[:10]} with gans {[current_gans[x] for x in top_gan_nums[:10]]}")
print(f"Top 10 Cold 90d: {cold_90_nums[:10]}")
print(f"Top 10 Cold 365d: {cold_365_nums[:10]}")
print(f"Top 10 Composite Cold: {composite_cold[:10]}")

# Function to evaluate set
def evaluate_set(excluded_nums, draws, mode='db_tail'):
    excluded_set = set(excluded_nums)
    selected_set = {str(i).zfill(2) for i in range(100)} - excluded_set
    
    total = len(draws)
    hits = 0
    temp_gan = 0
    max_gan = 0
    max_gan_start = None
    max_gan_end = None
    streak_start = None
    
    khung_hits_1 = 0
    khung_hits_2 = 0
    vuot_khung = 0
    
    for d in draws:
        p = get_prize(d, mode)
        if not p:
            continue
        if p in selected_set:
            hits += 1
            if temp_gan == 0:
                khung_hits_1 += 1
            elif temp_gan == 1:
                khung_hits_2 += 1
            else:
                vuot_khung += 1
            temp_gan = 0
            streak_start = None
        else:
            if temp_gan == 0:
                streak_start = d['d']
            temp_gan += 1
            if temp_gan > max_gan:
                max_gan = temp_gan
                max_gan_start = streak_start
                max_gan_end = d['d']
                
    hit_rate = (hits / total) * 100
    # Success rate within 2-day frame
    k2_rate = ((khung_hits_1 + khung_hits_2) / (hits if hits > 0 else 1)) * 100
    
    return {
        'k': len(selected_set),
        'numbers': sorted(list(selected_set)),
        'excluded': sorted(list(excluded_set)),
        'hit_rate': round(hit_rate, 2),
        'current_gan': temp_gan,
        'max_gan': max_gan,
        'max_gan_period': f"{max_gan_start} → {max_gan_end}" if max_gan_start else '---',
        'khung_1_hits': khung_hits_1,
        'khung_2_hits': khung_hits_2,
        'vuot_khung_count': vuot_khung,
        'khung2_rate': round(k2_rate, 2)
    }

# Build 14 distinct high-performance sets (92 and 93 numbers)
strategies = [
    # 93-number sets (drop 7 numbers)
    {
        'id': 'k2_93_top_gan',
        'name': 'Dàn 93 Số - Loại 7 Số Gan Lỳ Cực Đại',
        'k': 93,
        'excluded': top_gan_nums[:7],
        'desc': 'Loại 7 số có số ngày chưa về (gan) cao nhất hiện tại'
    },
    {
        'id': 'k2_93_cold_90d',
        'name': 'Dàn 93 Số - Loại 7 Số Đóng Băng 90 Ngày',
        'k': 93,
        'excluded': cold_90_nums[:7],
        'desc': 'Loại 7 số có tần suất xuất hiện thấp nhất trong 90 kỳ gần đây'
    },
    {
        'id': 'k2_93_cold_180d',
        'name': 'Dàn 93 Số - Loại 7 Số Đóng Băng 6 Tháng',
        'k': 93,
        'excluded': cold_180_nums[:7],
        'desc': 'Loại 7 số có số lần nổ ít nhất trong 180 ngày gần nhất'
    },
    {
        'id': 'k2_93_cold_365d',
        'name': 'Dàn 93 Số - Loại 7 Số Đóng Băng 1 Năm',
        'k': 93,
        'excluded': cold_365_nums[:7],
        'desc': 'Loại 7 số có tần suất thấp nhất trong 365 kỳ qua'
    },
    {
        'id': 'k2_93_composite_vip',
        'name': 'Dàn 93 Số - Loại 7 Số Gan Sâu & Yếu Nhịp (VIP)',
        'k': 93,
        'excluded': composite_cold[:7],
        'desc': 'Thuật toán kết hợp điểm Gan và chu kỳ nguội lạnh'
    },
    {
        'id': 'k2_93_cold_keps',
        'name': 'Dàn 93 Số - Loại 7 Kép Bằng Ít Về Nhất',
        'k': 93,
        'excluded': cold_keps[:7],
        'desc': 'Loại 7 con kép bằng có nhịp về chậm nhất'
    },
    {
        'id': 'k2_93_mixed_defense',
        'name': 'Dàn 93 Số - Phòng Thủ Tối Ưu Khung 2N',
        'k': 93,
        'excluded': [top_gan_nums[0], top_gan_nums[1], top_gan_nums[2], cold_90_nums[0], cold_90_nums[1], cold_180_nums[0], cold_365_nums[0]],
        'desc': 'Phân tán rủi ro: loại 3 số gan cao nhất + 4 số nguội lạnh nhất'
    },
    
    # 92-number sets (drop 8 numbers)
    {
        'id': 'k2_92_top_gan',
        'name': 'Dàn 92 Số - Loại 8 Số Gan Cực Đại',
        'k': 92,
        'excluded': top_gan_nums[:8],
        'desc': 'Loại bỏ hoàn toàn 8 số gan đứng đầu bảng'
    },
    {
        'id': 'k2_92_cold_90d',
        'name': 'Dàn 92 Số - Loại 8 Số Nguội Lạnh 90 Ngày',
        'k': 92,
        'excluded': cold_90_nums[:8],
        'desc': 'Loại bỏ 8 số xuất hiện ít nhất trong 3 tháng qua'
    },
    {
        'id': 'k2_92_cold_180d',
        'name': 'Dàn 92 Số - Loại 8 Số Nguội Lạnh 6 Tháng',
        'k': 92,
        'excluded': cold_180_nums[:8],
        'desc': 'Loại bỏ 8 số xuất hiện ít nhất trong nửa năm'
    },
    {
        'id': 'k2_92_cold_365d',
        'name': 'Dàn 92 Số - Loại 8 Số Yếu Nhất 1 Năm',
        'k': 92,
        'excluded': cold_365_nums[:8],
        'desc': 'Loại bỏ 8 số có xác suất thống kê thấp nhất 1 năm qua'
    },
    {
        'id': 'k2_92_composite_vip',
        'name': 'Dàn 92 Số - Tối Ưu Đa Yếu Tố (VIP Khung 2N)',
        'k': 92,
        'excluded': composite_cold[:8],
        'desc': 'Bộ lọc đa biến: Gan hiện tại + Chu kỳ + Tần suất gần'
    },
    {
        'id': 'k2_92_hybrid_safe',
        'name': 'Dàn 92 Số - An Toàn Tuyệt Đối (Hybrid 4+4)',
        'k': 92,
        'excluded': list(set(top_gan_nums[:4] + cold_90_nums[:4]))[:8],
        'desc': 'Loại 4 số siêu gan + 4 số đáy tần suất'
    },
    {
        'id': 'k2_92_kep_gan_combo',
        'name': 'Dàn 92 Số - Loại Kép Nguội & Số Gan Sâu',
        'k': 92,
        'excluded': list(set(cold_keps[:4] + top_gan_nums[:4]))[:8],
        'desc': 'Loại 4 kép bằng câm + 4 số gan lỳ nhất bảng'
    }
]

evaluated_list = []
for strat in strategies:
    res = evaluate_set(strat['excluded'], chronicle, 'db_tail')
    item = {
        'id': strat['id'],
        'name': strat['name'],
        'k': strat['k'],
        'excluded': strat['excluded'],
        'desc': strat['desc'],
        'stats': res
    }
    evaluated_list.append(item)
    print(f"==> {strat['name']}: {res['k']} số | Hit Rate: {res['hit_rate']}% | Khung 2N: {res['khung2_rate']}% | Max Gan: {res['max_gan']} ngày | Current Gan: {res['current_gan']}")

with open('src/data/danso_92_93_presets.json', 'w', encoding='utf-8') as f:
    json.dump(evaluated_list, f, ensure_ascii=False, indent=2)

print("\nSaved 14 presets to src/data/danso_92_93_presets.json successfully!")
