import urllib.request, urllib.error, ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

tests = [
    'orderBy="$key"&startAt="2026-11-21"',
    'orderBy="$key"&limitToLast=5',
    'orderBy=%22%24key%22&startAt=%222026-11-21%22',
    'orderBy=%22$key%22&startAt=%222026-11-21%22'
]

for test in tests:
    url = f'https://appdanso-default-rtdb.asia-southeast1.firebasedatabase.app/lottery_results.json?{test}'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, context=ctx) as r:
            print('SUCCESS:', test, '->', len(r.read()))
    except urllib.error.HTTPError as e:
        print('FAILED:', test, '->', e.code, e.read().decode())
