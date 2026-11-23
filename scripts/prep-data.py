#!/usr/bin/env python3
"""Slim the Shopify catalog export into site data files.

Reads ../catalog-export.json, writes:
  src/data/products.json  - full slim data (server-side only)
  public/data/index.json  - lightweight shop index (client-side)
  src/data/home.json      - best sellers, categories, bundles
  ../BUILD-NOTES.md       - data-quality resolutions

Resolutions:
- iN650 duplicate SKUs: the second product with base iN650
  (handle flying-owl-canvas-wall-art-in650) gets "-B" suffixed
  SKUs and barcodes (iN650-B-12x20, ...).
- 145 variants with no barcode: left blank, never invented.
"""
import json, re, os, collections

BASE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(BASE, "catalog-export.json")
SITE = os.path.join(BASE, "site")

SIZE_RE = re.compile(r"(\d+)\s*[x\-]\s*(\d+)")

def parse_size(title):
    m = SIZE_RE.search(title or "")
    if not m:
        return None
    w, h = int(m.group(1)), int(m.group(2))
    orient = "square" if w == h else ("horizontal" if w > h else "vertical")
    return {"size": f"{w}x{h}", "w": w, "h": h, "orientation": orient}

def clean_title(t):
    return (t or "").split(" | ")[0].strip()

def strip_html(h):
    txt = re.sub(r"<[^>]+>", " ", h or "")
    return re.sub(r"\s+", " ", txt).strip()

raw = json.load(open(SRC))
prods = raw["products"]

# --- resolve duplicate SKUs: only suffix variants whose FULL sku was already seen ---
seen_skus = set()
dup_note = []
for p in prods:
    touched = False
    for v in p.get("variants", []):
        sku = v.get("sku") or ""
        if sku and sku in seen_skus:
            parts = sku.split("-", 1)
            v["sku"] = f"{parts[0]}-B-{parts[1]}" if len(parts) == 2 else sku + "-B"
            if v.get("barcode") == sku:
                v["barcode"] = v["sku"]
            touched = True
        if sku:
            seen_skus.add(sku)
            if v.get("sku"):
                seen_skus.add(v["sku"])
    if touched:
        dup_note.append(p["handle"])

slim = []
for p in prods:
    variants = []
    for v in p.get("variants", []):
        sz = parse_size(v.get("title", ""))
        if not sz:
            continue
        variants.append({
            "size": sz["size"],
            "orientation": sz["orientation"],
            "price": float(v["price"]),
            "compareAt": float(v["compare_at_price"]) if v.get("compare_at_price") else None,
            "sku": v.get("sku") or "",
            "barcode": v.get("barcode") or "",
        })
    if not variants:
        continue
    images = [{"url": im["url"], "w": im.get("width") or 0, "h": im.get("height") or 0}
              for im in p.get("images", []) if im.get("url")]
    if not images:
        continue
    orientations = sorted({v["orientation"] for v in variants})
    slim.append({
        "handle": p["handle"],
        "title": clean_title(p["title"]),
        "fullTitle": p["title"],
        "description": strip_html(p.get("description_html") or p.get("description", "")),
        "tags": p.get("tags", []),
        "type": p.get("product_type", ""),
        "images": images,
        "variants": variants,
        "minPrice": min(v["price"] for v in variants),
        "orientations": orientations,
        "isBundle": "-set-" in p["handle"],
    })

slim.sort(key=lambda x: x["handle"])

# --- categories (title + tags) ---
CATS = [
    ("Diwali", re.compile(r"diwali|ganesha|lakshmi|rangoli|diya|marigold|toran", re.I)),
    ("Christmas", re.compile(r"christmas|santa|reindeer|snowman|holiday village|winter village|nativity|wise men|shepherd", re.I)),
    ("Religious & Spiritual", re.compile(r"jesus|christ|holy|bible|angel|pray|cross|church|saint|mary|buddha|krishna|shiva|spiritual|nativity", re.I)),
    ("Animals & Wildlife", re.compile(r"wildlife-animals|fox|owl|cat|dog|bird|horse|elephant|lion|tiger|wolf|deer|bear|butterfly|fish|parrot|eagle|rabbit|panda", re.I)),
    ("Abstract", re.compile(r"abstract", re.I)),
    ("Nature & Landscapes", re.compile(r"nature-landscapes|mountain|forest|sunset|lake|valley|desert|waterfall", re.I)),
    ("Floral & Botanical", re.compile(r"floral|botanical|flower|rose|peony|lavender|blossom|tulip|orchid", re.I)),
    ("Ocean & Beach", re.compile(r"ocean|beach|sea|wave|surf|coral|turtle|dolphin|whale", re.I)),
]
def cat_of(p):
    hay = p["fullTitle"] + " " + " ".join(p["tags"])
    for name, rx in CATS:
        if rx.search(hay):
            return name
    return "Wall Art"

for p in slim:
    p["category"] = cat_of(p)

categories = []
for name, _ in CATS:
    members = [p for p in slim if p["category"] == name]
    if members:
        categories.append({
            "name": name, "count": len(members),
            "image": members[0]["images"][0]["url"],
            "handle": members[0]["handle"],
        })
other = [p for p in slim if p["category"] == "Wall Art"]
if other:
    categories.append({"name": "Wall Art", "count": len(other),
                       "image": other[0]["images"][0]["url"], "handle": other[0]["handle"]})

# --- best sellers: 8 varied picks (no order history exists) ---
preferred = [
    "red-fox-portrait-canvas-wall-art",
    "cozy-cabin-christmas-village-canvas-wall-art",
    "goddess-lakshmi-tanjore-gold-canvas-wall-art",
    "lord-ganesha-marigold-garland-canvas-wall-art",
    "sunset-mountain-orange-peak-canvas-wall-art",
    "starry-night-sky-canvas-wall-art",
    "golden-temple-night-canvas-wall-art",
    "three-tabby-cats-canvas-wall-art",
]
by_handle = {p["handle"]: p for p in slim}
best = [by_handle[h] for h in preferred if h in by_handle]
# fill from distinct categories if any preferred handle is missing
seen_cats = {p["category"] for p in best}
for p in slim:
    if len(best) >= 8:
        break
    if p["category"] not in seen_cats and p not in best:
        best.append(p)
        seen_cats.add(p["category"])
best = best[:8]

# --- bundles ---
bundles = {}
for p in slim:
    if not p["isBundle"]:
        continue
    key = re.sub(r"-canvas-wall-art-set-.*$", "", p["handle"])
    name = p["title"].replace(" Canvas Wall Art Set", "").strip()
    bundles.setdefault(key, {"key": key, "name": name, "image": p["images"][0]["url"],
                             "options": []})
    bundles[key]["options"].append({
        "handle": p["handle"],
        "label": p["fullTitle"].split("|")[-1].strip() if "|" in p["fullTitle"] else p["title"],
        "price": min(v["price"] for v in p["variants"]),
        "compareAt": max((v["compareAt"] for v in p["variants"] if v["compareAt"]), default=None),
    })
bundle_list = sorted(bundles.values(), key=lambda b: b["key"])

# --- write outputs ---
os.makedirs(os.path.join(SITE, "src", "data"), exist_ok=True)
os.makedirs(os.path.join(SITE, "public", "data"), exist_ok=True)

with open(os.path.join(SITE, "src", "data", "products.json"), "w") as f:
    json.dump(slim, f)
index = [{"handle": p["handle"], "title": p["title"], "image": p["images"][0]["url"],
          "minPrice": p["minPrice"], "orientations": p["orientations"],
          "category": p["category"], "tags": p["tags"][:6]} for p in slim]
with open(os.path.join(SITE, "public", "data", "index.json"), "w") as f:
    json.dump(index, f)
home = {"bestSellers": [p["handle"] for p in best], "categories": categories,
        "bundles": bundle_list,
        "hero": {"handle": "red-fox-portrait-canvas-wall-art",
                 "image": by_handle["red-fox-portrait-canvas-wall-art"]["images"][0]["url"]}}
with open(os.path.join(SITE, "src", "data", "home.json"), "w") as f:
    json.dump(home, f, indent=2)

notes = f"""# iNewton own-site — build notes

- Source: Shopify export 2026-11-17 (catalog-export.json), 1,095 products.
- Site data: {len(slim)} products with usable size variants ({len(prods)-len(slim)} dropped: no parseable size variants).
- iN650 duplicate SKUs: handles {dup_note} — the second product's variant SKUs/barcodes
  suffixed with -B (e.g. iN650-B-12x20). First product keeps plain iN650 SKUs.
- 145 variants had no barcode: left blank, never invented.
- Prices are CAD, from catalog variants; compare-at is 1.25x on most variants.
- Images are Shopify CDN URLs for this preview; re-host before going live long-term.
- No order history exists (0 orders), so Best Sellers are a curated varied pick, not sales-ranked.
- Stripe account is TEST mode (livemode=false). No real payments in preview.
- Shopify store stays LIVE. No DNS change, no custom domain added in preview.
"""
open(os.path.join(BASE, "BUILD-NOTES.md"), "w").write(notes)
print(f"products: {len(slim)}, index: {len(index)}, categories: {[(c['name'], c['count']) for c in categories]}")
print(f"best sellers: {[p['handle'] for p in best]}")
print(f"bundles: {[(b['name'], len(b['options'])) for b in bundle_list]}")
print("dup resolved:", dup_note)
