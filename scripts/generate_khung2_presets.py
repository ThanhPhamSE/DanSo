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

def calc_num_stats(draws, mode):
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

def evaluate_set(excluded_nums, draws, mode):
    excluded_set = set(excluded_nums)
    selected_set = {str(i).zfill(2) for i in range(100)} - excluded_set
    
    valid_draws = [d for d in draws if get_prize(d, mode)]
    total = len(valid_draws)
    hits = 0
    temp_gan = 0
    max_gan = 0
    max_gan_start = None
    max_gan_end = None
    streak_start = None
    
    khung_hits_1 = 0
    khung_hits_2 = 0
    vuot_khung = 0
    
    for d in valid_draws:
        p = get_prize(d, mode)
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
                
    hit_rate = (hits / total) * 100 if total > 0 else 0
    k2_rate = ((khung_hits_1 + khung_hits_2) / (hits if hits > 0 else 1)) * 100
    
    latest_draw = valid_draws[-1] if valid_draws else None
    latest_prize = get_prize(latest_draw, mode) if latest_draw else ''
    is_hit_today = latest_prize in selected_set if latest_prize else False
    
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
        'khung2_rate': round(k2_rate, 2),
        'latest_prize': latest_prize,
        'is_hit_today': is_hit_today
    }

target_modes = [
    ('db_tail', '2 Số Đuôi Giải Đặc Biệt (Đề ĐB)', 'Đuôi ĐB'),
    ('db_head', '2 Số Đầu Giải Đặc Biệt', 'Đầu ĐB'),
    ('g1_tail', '2 Số Đuôi Giải Nhất (Đuôi G1)', 'Đuôi G1'),
    ('g1_head', '2 Số Đầu Giải Nhất (Đầu G1)', 'Đầu G1')
]

all_target_presets = {}

for mode_id, mode_name, mode_short in target_modes:
    print(f"\n==================== PROCESSING {mode_name} ({mode_id}) ====================")
    valid_draws = [d for d in chronicle if get_prize(d, mode_id)]
    recent_90 = valid_draws[-90:]
    recent_180 = valid_draws[-180:]
    recent_365 = valid_draws[-365:]
    
    all_freq, current_gans, max_gans = calc_num_stats(valid_draws, mode_id)
    f90, _, _ = calc_num_stats(recent_90, mode_id)
    f180, _, _ = calc_num_stats(recent_180, mode_id)
    f365, _, _ = calc_num_stats(recent_365, mode_id)
    
    top_gan_nums = sorted(current_gans.keys(), key=lambda x: current_gans[x], reverse=True)
    cold_90_nums = sorted(f90.keys(), key=lambda x: f90[x])
    cold_180_nums = sorted(f180.keys(), key=lambda x: f180[x])
    cold_365_nums = sorted(f365.keys(), key=lambda x: f365[x])
    
    composite_cold = sorted(
        current_gans.keys(),
        key=lambda x: (current_gans[x] * 1.5 - f90[x] * 3.0 - f180[x] * 1.5),
        reverse=True
    )
    
    keps = [f"{i}{i}" for i in range(10)]
    cold_keps = sorted(keps, key=lambda x: f365[x])
    
    strategies = [
        # 7 Dàn 93 số (Loại 7 số)
        {
            'id': f'k2_93_top_gan_{mode_id}',
            'name': f'Dàn 93 Số {mode_short} - Loại 7 Số Gan Lỳ Cực Đại',
            'k': 93,
            'excluded': top_gan_nums[:7],
            'desc': f'Loại 7 số có số ngày chưa về (gan) cao nhất hiện tại của {mode_short}'
        },
        {
            'id': f'k2_93_composite_vip_{mode_id}',
            'name': f'Dàn 93 Số {mode_short} - Loại 7 Số Gan Sâu & Yếu Nhịp (VIP Khung 2N)',
            'k': 93,
            'excluded': composite_cold[:7],
            'desc': f'Bộ lọc đa biến: kết hợp điểm Gan và chu kỳ nguội lạnh của {mode_short}'
        },
        {
            'id': f'k2_93_cold_365d_{mode_id}',
            'name': f'Dàn 93 Số {mode_short} - Loại 7 Số Đóng Băng 1 Năm',
            'k': 93,
            'excluded': cold_365_nums[:7],
            'desc': f'Loại 7 số có tần suất xuất hiện thấp nhất trong 365 kỳ qua của {mode_short}'
        },
        {
            'id': f'k2_93_cold_180d_{mode_id}',
            'name': f'Dàn 93 Số {mode_short} - Loại 7 Số Nguội Lạnh 6 Tháng',
            'k': 93,
            'excluded': cold_180_nums[:7],
            'desc': f'Loại 7 số có số lần nổ ít nhất trong 180 ngày gần nhất của {mode_short}'
        },
        {
            'id': f'k2_93_cold_90d_{mode_id}',
            'name': f'Dàn 93 Số {mode_short} - Loại 7 Số Đóng Băng 90 Ngày',
            'k': 93,
            'excluded': cold_90_nums[:7],
            'desc': f'Loại 7 số xuất hiện ít nhất trong 3 tháng qua của {mode_short}'
        },
        {
            'id': f'k2_93_hybrid_def_{mode_id}',
            'name': f'Dàn 93 Số {mode_short} - Phòng Thủ Đa Tầng Khung 2N',
            'k': 93,
            'excluded': [top_gan_nums[0], top_gan_nums[1], top_gan_nums[2], cold_90_nums[0], cold_90_nums[1], cold_180_nums[0], cold_365_nums[0]],
            'desc': f'Phân tán rủi ro: loại 3 số gan sâu + 4 số đáy tần suất của {mode_short}'
        },
        {
            'id': f'k2_93_cold_keps_{mode_id}',
            'name': f'Dàn 93 Số {mode_short} - Loại 7 Kép Bằng Chậm Nhịp',
            'k': 93,
            'excluded': cold_keps[:7],
            'desc': f'Loại 7 con kép bằng có tần suất về thấp nhất của {mode_short}'
        },
        
        # 7-8 Dàn 92 số (Loại 8 số)
        {
            'id': f'k2_92_top_gan_{mode_id}',
            'name': f'Dàn 92 Số {mode_short} - Loại 8 Số Gan Cực Đại',
            'k': 92,
            'excluded': top_gan_nums[:8],
            'desc': f'Loại bỏ hoàn toàn 8 con số gan đứng đầu bảng {mode_short}'
        },
        {
            'id': f'k2_92_composite_vip_{mode_id}',
            'name': f'Dàn 92 Số {mode_short} - Tối Ưu Đa Yếu Tố (VIP Khung 2N)',
            'k': 92,
            'excluded': composite_cold[:8],
            'desc': f'Thuật toán tối ưu hóa đa biến: Gan hiện tại + Chu kỳ + Tần suất gần của {mode_short}'
        },
        {
            'id': f'k2_92_cold_365d_{mode_id}',
            'name': f'Dàn 92 Số {mode_short} - Loại 8 Số Yếu Nhất 1 Năm',
            'k': 92,
            'excluded': cold_365_nums[:8],
            'desc': f'Loại bỏ 8 số có xác suất thống kê thấp nhất 1 năm qua của {mode_short}'
        },
        {
            'id': f'k2_92_cold_180d_{mode_id}',
            'name': f'Dàn 92 Số {mode_short} - Loại 8 Số Nguội Lạnh 6 Tháng',
            'k': 92,
            'excluded': cold_180_nums[:8],
            'desc': f'Loại 8 số xuất hiện ít nhất trong nửa năm của {mode_short}'
        },
        {
            'id': f'k2_92_cold_90d_{mode_id}',
            'name': f'Dàn 92 Số {mode_short} - Loại 8 Số Đóng Băng 90 Ngày',
            'k': 92,
            'excluded': cold_90_nums[:8],
            'desc': f'Loại bỏ 8 số xuất hiện ít nhất trong 90 ngày gần nhất của {mode_short}'
        },
        {
            'id': f'k2_92_hybrid_safe_{mode_id}',
            'name': f'Dàn 92 Số {mode_short} - An Toàn Tuyệt Đối (Hybrid 4+4)',
            'k': 92,
            'excluded': list(dict.fromkeys(top_gan_nums[:4] + cold_90_nums[:4]))[:8],
            'desc': f'Loại 4 số siêu gan + 4 số đáy tần suất của {mode_short}'
        },
        {
            'id': f'k2_92_keps_combo_{mode_id}',
            'name': f'Dàn 92 Số {mode_short} - Loại Kép Nguội & Số Gan Sâu',
            'k': 92,
            'excluded': list(dict.fromkeys(cold_keps[:4] + top_gan_nums[:4]))[:8],
            'desc': f'Loại 4 kép bằng câm + 4 số gan lỳ nhất của {mode_short}'
        },
        {
            'id': f'k2_92_max2_opt_{mode_id}',
            'name': f'Dàn 92 Số {mode_short} - Chuẩn Khung Max 2 Ngày',
            'k': 92,
            'excluded': list(dict.fromkeys(composite_cold[:5] + cold_365_nums[:3]))[:8],
            'desc': f'Bộ lọc tinh chỉnh cân bằng nhịp nổ ngày 1 và ngày 2 của {mode_short}'
        }
    ]
    
    mode_sets = []
    for s in strategies:
        res = evaluate_set(s['excluded'], chronicle, mode_id)
        frame_status = 'Ăn Đều (Vừa Nổ)'
        frame_advice = 'Vào tiền Ngày 1 (Mức cơ sở)'
        frame_status_color = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
        if res['current_gan'] == 1:
            frame_status = '🔥 Đang Ở Ngày 2 Khung'
            frame_status_color = 'text-amber-400 bg-amber-500/10 border-amber-500/30'
            frame_advice = 'Vào tiền Ngày 2 (Khung quyết định nổ >99.5%)'
        elif res['current_gan'] >= 2:
            frame_status = '⚠️ Gan Vượt Khung'
            frame_status_color = 'text-rose-400 bg-rose-500/10 border-rose-500/30'
            frame_advice = 'Gan bất thường, nên chờ nổ lại vào nhịp mới'
            
        res['frame_status'] = frame_status
        res['frame_advice'] = frame_advice
        res['frame_status_color'] = frame_status_color
        
        mode_sets.append({
            'id': s['id'],
            'name': s['name'],
            'k': res['k'],
            'numbers': res['numbers'],
            'excluded': s['excluded'],
            'desc': s['desc'],
            'stats': res,
            'targetMode': mode_id
        })
        print(f"  -> {s['name']}: {res['k']} số | Ăn Khung 2N: {res['khung2_rate']}% | Max Gan: {res['max_gan']} ngày | Gan hiện tại: {res['current_gan']}")

    all_target_presets[mode_id] = mode_sets

with open('src/data/danso_92_93_presets.json', 'w', encoding='utf-8') as f:
    json.dump(all_target_presets, f, ensure_ascii=False, indent=2)

print("\nSUCCESS! Successfully generated 15 presets for ALL 4 target modes and saved to src/data/danso_92_93_presets.json!")
