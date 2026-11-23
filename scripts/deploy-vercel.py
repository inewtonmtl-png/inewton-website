#!/usr/bin/env python3
"""Prepare Vercel deployment payload for the iNewton site.

Uploads the two large data files via the Vercel MCP upload_file tool,
then writes the create_deployment arguments JSON.
Run each upload_file call from the shell (the CLI prints the result);
this script only builds the file list + payload skeleton.
"""
import json, os, hashlib, base64, subprocess, sys

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BIG = ["src/data/products.json", "public/data/index.json"]
SMALL = [
    "package.json", "package-lock.json", "next.config.mjs", "tsconfig.json",
    "src/app/globals.css", "src/app/layout.tsx", "src/app/page.tsx",
    "src/app/shop/page.tsx", "src/app/cart/page.tsx",
    "src/app/checkout/success/page.tsx", "src/app/checkout/cancel/page.tsx",
    "src/app/api/checkout/route.ts", "src/app/products/[handle]/page.tsx",
    "src/components/Footer.tsx", "src/components/Header.tsx",
    "src/components/ProductCard.tsx", "src/components/ProductDetails.tsx",
    "src/data/home.json", "src/lib/cart.tsx", "src/lib/catalog.ts",
]

def sha1(path):
    h = hashlib.sha1()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()

def upload(path):
    full = os.path.join(SITE, path)
    size = os.path.getsize(full)
    digest = sha1(full)
    b64 = base64.b64encode(open(full, "rb").read()).decode()
    args = {"contentLength": size, "xVercelDigest": digest, "requestBody": b64}
    out = subprocess.run(
        ["/opt/hatch/bin/vercel", "call-tool", "--name", "upload_file",
         "--arguments-json", json.dumps(args)],
        capture_output=True, text=True)
    print(f"upload {path}: exit={out.returncode} size={size} sha1={digest}")
    print(out.stdout[:600])
    if out.returncode != 0:
        print(out.stderr[:600]); sys.exit(1)
    return {"file": path, "sha": digest, "size": size}

refs = [upload(p) for p in BIG]

files = list(refs)
for rel in SMALL:
    full = os.path.join(SITE, rel)
    with open(full, "r", encoding="utf-8") as f:
        data = f.read()
    files.append({"file": rel, "data": data, "encoding": "utf-8"})

payload = {"requestBody": {"name": "inewton-own-site", "files": files}}
out_path = os.path.join(SITE, "deploy-args.json")
with open(out_path, "w") as f:
    json.dump(payload, f)
print(f"wrote {out_path}: {len(files)} files, {os.path.getsize(out_path)} bytes")
