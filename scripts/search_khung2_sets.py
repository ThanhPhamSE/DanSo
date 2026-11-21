import json

with open('public/xsmb_from_2010.json', 'r', encoding='utf-8') as f:
    records = json.load(f)

# Sort oldest to newest for chronological simulation
chronicle = list(reversed(records))
print(f"Total draws: {len(chronicle)}")

# Analyze individual number frequency, gan, and cold periods
target_modes = ['db_tail', 'db_head', 'g1_tail', 'g1_head']

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

# Let's test different exclusion strategies for 92 numbers (drop 8 numbers) and 93 numbers (drop 7 numbers):
# Strategies to exclude 7-8 numbers:
# 1. Extreme Gan numbers (top gan currently)
# 2. Lowest frequency over last 90 days / 180 days / 365 days
# 3. Lowest all-time frequency
# 4. Same head/tail cold clusters (e.g. cold digit head/tail pairs)
# 5. Dual parity / sum cold tails
# 6. Sliding window momentum cold numbers

# Let's write a simulation function for a set:
def evaluate_set_khung2(numbers_set, draws, mode='db_tail'):
    k = len(numbers_set)
    total_draws = len(draws)
    
    hits = 0
    current_gan = 0
    max_gan = 0
    max_gan_start = None
    max_gan_end = None
    
    khung_1_hits = 0 # hits immediately on day 1 (gan = 0 before)
    khung_2_hits = 0 # hits on day 2 (gan = 1 before)
    vuot_khung_hits = 0 # hits after gan >= 2 (missed 2-day frame)
    vuot_khung_events = []
    
    temp_gan = 0
    streak_start = None
    
    for d in draws:
        prize = get_prize(d, mode)
        if not prize:
            continue
        is_hit = prize in numbers_set
        
        if is_hit:
            hits += 1
            if temp_gan == 0:
                khung_1_hits += 1
            elif temp_gan == 1:
                khung_2_hits += 1
            else:
                vuot_khung_hits += 1
                vuot_khung_events.append({'date': d['d'], 'gan_before': temp_gan, 'start': streak_start})
            
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
                
    current_gan = temp_gan
    hit_rate = (hits / total_draws) * 100
    khung2_success_rate = ((khung_1_hits + khung_2_hits) / hits) * 100 if hits > 0 else 0
    
    return {
        'k': k,
        'hits': hits,
        'total_draws': total_draws,
        'hit_rate': round(hit_rate, 2),
        'current_gan': current_gan,
        'max_gan': max_gan,
        'max_gan_start': max_gan_start,
        'max_gan_end': max_gan_end,
        'khung_1_hits': khung_1_hits,
        'khung_2_hits': khung_2_hits,
        'vuot_khung_count': len(vuot_khung_events),
        'khung2_success_rate': round(khung2_success_rate, 2),
        'excluded_count': 100 - k
    }

print("Loaded evaluate_set_khung2 script.")
