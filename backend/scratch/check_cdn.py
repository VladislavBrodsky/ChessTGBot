import urllib.request
import urllib.error

urls = [
    "https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js",
    "https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js.map"
]

for url in urls:
    try:
        req = urllib.request.Request(url, method='HEAD')
        with urllib.request.urlopen(req) as resp:
            print(f"URL: {url} | Status: {resp.status}")
    except urllib.error.HTTPError as e:
        print(f"URL: {url} | Failed: {e.code}")
    except Exception as e:
        print(f"URL: {url} | Error: {e}")
