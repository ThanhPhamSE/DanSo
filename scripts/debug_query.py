import urllib.request, urllib.error, ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

urls = [
    'https://appdanso-default-rtdb.asia-southeast1.firebasedatabase.app/lottery_results.json?orderBy="$key"&limitToLast=10',
    'https://appdanso-default-rtdb.asia-southeast1.firebasedatabase.app/lottery_results.json?orderBy="$key"&startAt="2026-11-21"',
    'https://appdanso-default-rtdb.asia-southeast1.firebasedatabase.app/lottery_results/2026-11-21.json'
]

for url in urls:
    print('Testing URL:', url)
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, context=ctx) as r:
            print('  Status:', r.status, 'Response:', r.read().decode()[:150])
    except urllib.error.HTTPError as e:
        print('  HTTP Error:', e.code, e.read().decode())
    except Exception as e:
        print('  Error:', e)
