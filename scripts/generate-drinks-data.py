import re, html as htmllib, json

src = open("src/chrome/drinks.html", encoding="utf-8").read()

# The five drink-menu category panels (id -> nothing needed; categories come
# from each panel's own <h2> sub-headers, same granularity as the food menu).
PANEL_IDS = ["1426194", "1084813", "1084811", "1086470", "1084816"]

def clean(s):
    s = re.sub(r'<br\s*/?>', ' ', s)
    s = re.sub(r'<[^>]+>', '', s)
    s = htmllib.unescape(s)
    return re.sub(r'\s+', ' ', s).strip()

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

def ts(it):
    lines = [f'    name: {json.dumps(it["name"])},']
    if it["description"]:
        lines.append(f'    description: {json.dumps(it["description"])},')
    if it["price"] is not None:
        lines.append(f'    price: {it["price"]},')
    if it["priceNote"]:
        lines.append(f'    priceNote: {json.dumps(it["priceNote"])},')
    lines.append(f'    category: {json.dumps(it["category"])},')
    return "  {\n" + "\n".join(lines) + "\n  }"

out = '''/**
 * Sylvia's full drink menu, auto-generated from the cloned /drink-menu page
 * (scripts/regenerate: scripts/generate-drinks-data.py). Every item mirrors the
 * live site — name, price (where published), description, and category (the
 * page's own sub-headers, e.g. "Cocktails on The Rocks", "White Wine" — finer-
 * grained than the five top-level tabs). The live site publishes no per-drink
 * photos, so unlike menu-data.ts there's no `image` field here.
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
};

export const DRINKS: DrinkItem[] = [
''' + ",\n".join(ts(it) for it in items) + '''
];
'''

open("src/lib/drinks-data.ts", "w", encoding="utf-8").write(out)
print(f"wrote {len(items)} drinks to src/lib/drinks-data.ts")
for it in items:
    print(f'  [{it["category"]}] {it["name"]}' + (f' (${it["price"]})' if it["price"] else ''))
