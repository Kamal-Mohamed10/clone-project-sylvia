#!/usr/bin/env python3
"""One-off: pull a topically-accurate, openly-licensed photo for each dish from
Wikimedia (via the MediaWiki pageimages API) into public/packages/dishes/.
Reruns are safe — it overwrites. Slugs must match DISH_IMAGES in src/lib/packages.ts."""
import json, os, sys, time, urllib.parse, urllib.request

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "packages", "dishes")
UA = {"User-Agent": "sylvias-events-app/1.0 (dish thumbnails; contact dev)"}

# slug -> list of candidate Wikipedia article titles (first with an image wins)
DISHES = {
    "smothered-chicken": ["Smothered chicken", "Chicken and gravy", "Fried chicken"],
    "scrambled-eggs": ["Scrambled eggs"],
    "grits": ["Grits"],
    "cornbread": ["Cornbread"],
    "bbq-chicken": ["Barbecue chicken"],
    "potato-salad": ["Potato salad"],
    "candied-yams": ["Candied yams", "Candied sweet potatoes", "Sweet potato"],
    "baked-catfish": ["Fried catfish", "Fish fry", "Fried fish"],
    "peach-cobbler": ["Peach cobbler", "Cobbler (food)"],
    "chicken-livers": ["Chicken liver", "Fried chicken livers", "Liver (food)"],
    "pork-chop": ["Pork chop"],
    "black-eyed-peas": ["Hoppin' John", "Black-eyed pea"],
    "string-beans": ["Green bean", "Green beans"],
    "baked-whiting": ["Fried fish", "Fish fillet", "Whiting (fish)"],
    "iced-tea": ["Sweet tea", "Iced tea"],
    "sassy-rice": ["Dirty rice", "Rice and gravy"],
    "biscuits": ["Biscuit (bread)", "Biscuits and gravy"],
    "catfish-fingers": ["Fish finger", "Fried fish"],
}


def fetch(url):
    """GET with simple backoff on 429."""
    for attempt in range(5):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(2 * (attempt + 1))
                continue
            raise
    raise RuntimeError("still 429 after retries")


def thumb_url(title):
    q = urllib.parse.urlencode({
        "action": "query", "titles": title, "prop": "pageimages",
        "piprop": "thumbnail", "pithumbsize": "480", "redirects": "1",
        "format": "json", "formatversion": "2",
    })
    data = json.loads(fetch("https://en.wikipedia.org/w/api.php?" + q))
    for page in data.get("query", {}).get("pages", []):
        t = page.get("thumbnail", {}).get("source")
        if t:
            return t
    return None


def is_image(b):
    return b[:3] == b"\xff\xd8\xff" or b[:8] == b"\x89PNG\r\n\x1a\n"


ok, fail = [], []
for slug, titles in DISHES.items():
    dest = os.path.join(OUT, slug + ".jpg")
    if os.path.exists(dest):  # already fetched on an earlier run
        print(f"  ..  {slug:18s} (already present, skipped)")
        ok.append(slug)
        continue
    got = None
    for title in titles:
        try:
            src = thumb_url(title)
        except Exception as e:
            print(f"  ! {slug}: {title} -> {e}", file=sys.stderr)
            continue
        if not src:
            continue
        try:
            blob = fetch(src)
        except Exception as e:
            print(f"  ! {slug}: download {src} -> {e}", file=sys.stderr)
            continue
        if is_image(blob) and len(blob) > 3000:
            with open(os.path.join(OUT, slug + ".jpg"), "wb") as f:
                f.write(blob)
            got = (title, len(blob))
            break
    if got:
        print(f"  OK  {slug:18s} <- {got[0]} ({got[1] // 1024}K)")
        ok.append(slug)
    else:
        print(f"  XX  {slug:18s} (no image found)")
        fail.append(slug)
    time.sleep(1)  # be polite to the API

print(f"\n{len(ok)} ok, {len(fail)} failed: {fail}")
sys.exit(1 if fail else 0)
