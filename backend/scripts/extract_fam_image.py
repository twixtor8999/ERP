import urllib.request
import re
import base64

url = "https://siddeshwar-enterprises.web.app"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8', errors='ignore')

matches = re.findall(r'NX_FAM\s*=\s*["\']data:image/jpeg;base64,([^"\']+)["\']', html)
if matches:
    raw_data = base64.b64decode(matches[0])
    with open("../frontend/public/family-shopping.jpg", "wb") as f:
        f.write(raw_data)
    print("Successfully wrote family-shopping.jpg:", len(raw_data), "bytes")
else:
    print("NX_FAM base64 not matched directly, searching...")
    # Alternative match
    m2 = re.search(r'NX_FAM\s*=\s*["\']([^"\']+)["\']', html)
    if m2:
        val = m2.group(1)
        if val.startswith("data:image/"):
            b64_str = val.split(",", 1)[1]
            raw_data = base64.b64decode(b64_str)
            with open("../frontend/public/family-shopping.jpg", "wb") as f:
                f.write(raw_data)
            print("Successfully extracted family-shopping.jpg via split:", len(raw_data), "bytes")
