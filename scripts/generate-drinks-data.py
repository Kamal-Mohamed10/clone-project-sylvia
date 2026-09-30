import re, html as htmllib, json, os

src = open("src/chrome/drinks.html", encoding="utf-8").read()

# The five drink-menu category panels (id -> nothing needed; categories come
# from each panel's own <h2> sub-headers, same granularity as the food menu).
PANEL_IDS = ["1426194", "1084813", "1084811", "1086470", "1084816"]

def clean(s):
    s = re.sub(r'<br\s*/?>', ' ', s)
    s = re.sub(r'<[^>]+>', '', s)
    s = htmllib.unescape(s)
    return re.sub(r'\s+', ' ', s).strip()

def slugify(s):
    s = htmllib.unescape(s).lower().replace("’", "").replace("'", "")
    s = re.sub(r'\([^)]*\)', '', s)          # drop "(Seasonal)" etc.
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return re.sub(r'-+', '-', s)

def panel_html(panel_id):
    m = re.search(rf'<div class="menu_{panel_id} food-menu-grid[^"]*"[^>]*>', src)
    start = m.end()
    nxt = re.search(r'<div class="menu_\d+ food-menu-grid', src[start:])
    end = start + nxt.start() if nxt else len(src)
    return src[start:end]

items = []
seen = set()
for pid in PANEL_IDS:
    panel = panel_html(pid)
    parts = re.split(r'<h2>(.*?)</h2>', panel, flags=re.S)
    for i in range(1, len(parts), 2):
        cat = clean(parts[i])
        content = parts[i + 1]
        for holder in re.findall(r'<div class="food-item-holder".*?(?=<div class="food-item-holder"|$)', content, re.S):
            nm = re.search(r'<div class="food-item-title">\s*<h3>(.*?)</h3>', holder, re.S)
            if not nm:
                continue
            name = clean(nm.group(1))
            key = (name.lower(), cat.lower())
            if not name or key in seen:
                continue
            pr = re.search(r'<div class="food-price">(.*?)</div>', holder, re.S)
            de = re.search(r'<div class="food-item-description">(.*?)</div>', holder, re.S)
            price_txt = clean(pr.group(1)) if pr else ""
            num = re.search(r'(\d+)', price_txt)
            price = int(num.group(1)) if num else None
            price_note = price_txt if price_txt and (price is None or price_txt != f"${price}") else None
            desc = clean(de.group(1)) if de else ""
            seen.add(key)
            items.append({
                "name": name, "description": desc, "price": price,
                "priceNote": price_note, "category": cat,
            })

# de-dupe slugs (e.g. two items that only differ by punctuation)
slugs = {}
for it in items:
    s = slugify(it["name"])
    slugs[s] = slugs.get(s, 0) + 1
    it["slug"] = s if slugs[s] == 1 else f"{s}-{slugs[s]}"

# The live site has zero per-drink photos at all (unlike food) — every image
# here is a locally-sourced, openly-licensed stand-in fetched by
# scripts/fetch-drink-images.py into public/drinks/<slug>.jpg. Only embed the
# path when that fetch actually produced a file (some slugs have no good match
# and stay imageless — the chat widget falls back to a plain card for those).
IMG_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "drinks")
for it in items:
    dest = os.path.join(IMG_DIR, it["slug"] + ".jpg")
    it["image"] = f'/drinks/{it["slug"]}.jpg' if os.path.exists(dest) else None

def ts(it):
    lines = [f'    name: {json.dumps(it["name"])},']
    if it["description"]:
        lines.append(f'    description: {json.dumps(it["description"])},')
    if it["price"] is not None:
        lines.append(f'    price: {it["price"]},')
    if it["priceNote"]:
        lines.append(f'    priceNote: {json.dumps(it["priceNote"])},')
    lines.append(f'    category: {json.dumps(it["category"])},')
    lines.append(f'    slug: {json.dumps(it["slug"])},')
    if it["image"]:
        lines.append(f'    image: {json.dumps(it["image"])},')
    return "  {\n" + "\n".join(lines) + "\n  }"

with_image = sum(1 for it in items if it["image"])

out = '''/**
 * Sylvia's full drink menu, auto-generated from the cloned /drink-menu page
 * (scripts/regenerate: scripts/generate-drinks-data.py, after re-running
 * scripts/fetch-drink-images.py). Every item mirrors the live site — name,
 * price (where published), description, and category (the page's own
 * sub-headers, e.g. "Cocktails on The Rocks", "White Wine" — finer-grained
 * than the five top-level tabs). The live site publishes no per-drink photos
 * at all; `image`, when present, is a locally-sourced openly-licensed
 * stand-in (see fetch-drink-images.py), not a real photo of Sylvia's drink.
 * Plain data (no server-only imports) — safe on client + server.
 */

export type DrinkItem = {
  name: string;
  /** Not every drink has one published (e.g. beer/wine are listed by name only). */
  description?: string;
  /** Published price in USD, when there is a single one (see priceNote). */
  price?: number;
  priceNote?: string;
  category: string;
  /** Stable id for card keys. */
  slug: string;
  /** Openly-licensed stand-in photo, or undefined when no good match was found. */
  image?: string;
};

export const DRINKS: DrinkItem[] = [
''' + ",\n".join(ts(it) for it in items) + '''
];
'''

open("src/lib/drinks-data.ts", "w", encoding="utf-8").write(out)
print(f"wrote {len(items)} drinks to src/lib/drinks-data.ts ({with_image} with images)")
for it in items:
    mark = "img" if it["image"] else "  -"
    print(f'  [{mark}] [{it["category"]}] {it["name"]}' + (f' (${it["price"]})' if it["price"] else ''))
