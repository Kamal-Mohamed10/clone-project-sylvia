#!/usr/bin/env python3
"""One-off: pull a topically-accurate, openly-licensed photo for each drink from
Wikimedia (via the MediaWiki pageimages API) into public/drinks/. The live site
has zero per-drink photos at all, so every result here is a stand-in, not a
real photo of Sylvia's specific pour — match by varietal/style/brand, not by
the house-specific name. Reruns are safe — it overwrites. Slugs must match
DRINKS in src/lib/drinks-data.ts (regenerate that after this)."""
import json, os, sys, time, urllib.parse, urllib.request

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "drinks")
UA = {"User-Agent": "sylvias-events-app/1.0 (drink thumbnails; contact dev)"}

# slug -> list of candidate Wikipedia article titles (first with an image wins)
DRINKS = {
    # Happy Hour rollups (category-level, not a single drink)
    "wines-by-the-glass": ["Wine glass"],
    "wines-by-the-bottle": ["Wine bottle"],
    "beer": ["Beer"],
    "cocktails": ["Cocktail"],

    # Cocktails on The Rocks
    "south-carolina-rum-punch": ["Rum punch", "Planter's punch"],
    "sylvias-soulful-sangria": ["Sangria"],
    "sylvias-summertime-sangria": ["Sangria"],
    "harlem-blues": ["Blue Lagoon (cocktail)", "Cocktail"],
    "margarita-special": ["Margarita"],
    "uptown-delight": ["Cocktail"],
    "long-island-iced-tea": ["Long Island Iced Tea"],
    "harlem-old-fashioned": ["Old Fashioned", "Old fashioned (cocktail)", "Whiskey"],
    "the-hemingway": ["Hemingway Daiquiri", "Daiquiri"],

    # Cocktails Straight Up
    "mo-money": ["Cocktail", "Martini (cocktail)"],
    "the-1944": ["Cocktail", "Old Fashioned"],
    "love-harlem": ["Cocktail", "Martini (cocktail)"],
    "coconut-lime-drop": ["Martini (cocktail)", "Cocktail"],
    "espresso-martini": ["Espresso Martini"],

    # Cocktails Bubbly
    "the-lenox": ["Champagne cocktail"],
    "bellini": ["Bellini (cocktail)", "Prosecco", "Peach"],
    "hugo-spritz": ["Hugo (cocktail)"],
    "south-carolina-spritz": ["Aperol spritz", "Spritz (cocktail)"],
    "mo-money-spritz": ["Aperol spritz", "Spritz (cocktail)"],

    # Beer
    "harlems-own-sugar-hill-golden-ale": ["Golden ale", "Pale ale"],
    "stella-artois": ["Stella Artois"],
    "corona": ["Corona (beer)", "Corona Extra", "Grupo Modelo", "Lager", "Pale lager"],
    "heineken": ["Heineken", "Heineken (brand)", "Heineken International"],
    "budweiser": ["Budweiser", "Anheuser-Busch"],
    "bud-light": ["Bud Light"],

    # White Wine (by varietal, not brand)
    "dante-chardonnay-california-2024": ["Chardonnay"],
    "cadi-ponti-pinot-grigio-italy-2025": ["Pinot gris", "Pinot grigio"],
    "fair-valley-sauvignon-blanc-south-africa-2024": ["Sauvignon blanc"],
    "ryan-patrick-riesling-washington-2023": ["Riesling"],

    # Red Wine (by varietal)
    "dante-cabernet-sauvignon-california-2023": ["Cabernet Sauvignon"],
    "cesani-chianti-colli-senesi-italy-2022": ["Chianti"],
    "dante-merlot-california-2023": ["Merlot"],
    "dante-pinot-noir-2024": ["Pinot noir"],

    # Sparkling Wine / Champagne
    "ca-furlan-cuv-e-beatrice-prosecco-italy": ["Prosecco"],
    "ca-furlan-cuv-e-beatrice-ros-prosecco-italy": ["Rosé", "Prosecco"],
    "veuve-clicquot-brut-ros": ["Veuve Clicquot", "Champagne"],
    "mo-t-chandon-nectar-imperial": ["Moët & Chandon", "Champagne"],

    # Zero-Proof Favorites
    "grandma-julias-fruit-punch": ["Fruit punch"],
    "sylvias-nojito": ["Mojito", "Mocktail"],
    "home-brewed-sweetened-iced-tea": ["Sweet tea", "Iced tea"],
    "peach-iced-tea": ["Iced tea"],
    "lemonade": ["Lemonade"],
    "sylvias-uptown": ["Mocktail", "Fruit punch"],
    "coke": ["Coca-Cola"],
    "diet-coke": ["Diet Coke"],
    "sprite": ["Sprite (drink)"],
    "ginger-ale": ["Ginger ale", "Ginger beer", "Canada Dry"],
    "bottled-water": ["Bottled water"],
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


os.makedirs(OUT, exist_ok=True)
ok, fail = [], []
for slug, titles in DRINKS.items():
    dest = os.path.join(OUT, slug + ".jpg")
    if os.path.exists(dest):
        print(f"  ..  {slug:40s} (already present, skipped)")
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
            with open(dest, "wb") as f:
                f.write(blob)
            got = (title, len(blob))
            break
    if got:
        print(f"  OK  {slug:40s} <- {got[0]} ({got[1] // 1024}K)")
        ok.append(slug)
    else:
        print(f"  XX  {slug:40s} (no image found)")
        fail.append(slug)
    time.sleep(1)  # be polite to the API

print(f"\n{len(ok)} ok, {len(fail)} failed: {fail}")
sys.exit(0)
