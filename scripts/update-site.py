#!/usr/bin/env python3
"""
Poly-Glot Auto-Update Script
=============================
Fetches live data from public APIs and patches:
  - index.html   : data-build, CLI version in terminal demo, sitemap lastmod in JSON-LD
  - sitemap.xml  : <lastmod> date
  - README.md    : npm install stats block
  - cli/README.md: npm install stats block

Run by GitHub Actions on every push + every 3 hours.
Safe to run locally too: python3 scripts/update-site.py
"""

import urllib.request
import urllib.error
import json
import re
import datetime
import sys
import os

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def fetch_json(url, timeout=10):
    """Fetch JSON from a URL. Returns None on any error (never raises)."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "poly-glot-updater/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode("utf-8"))
    except Exception as e:
        print(f"  ⚠️  Could not fetch {url}: {e}", file=sys.stderr)
        return None


def read_file(path):
    """Read a file relative to the repo root (script's parent dir)."""
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    full = os.path.join(root, path)
    with open(full, "r", encoding="utf-8") as f:
        return f.read()


def write_file(path, content):
    """Write a file relative to the repo root."""
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    full = os.path.join(root, path)
    with open(full, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  ✅ Written: {path}")


# ─────────────────────────────────────────────────────────────────────────────
# 1. Fetch live data
# ─────────────────────────────────────────────────────────────────────────────

today = datetime.date.today().strftime("%Y-%m-%d")
now_tag = datetime.datetime.utcnow().strftime("%Y%m%d-%H%M")

print(f"\n🔍 Fetching live data ({today}) …\n")

# npm: latest version
npm_data = fetch_json("https://registry.npmjs.org/poly-glot-ai-cli/latest")
npm_version = npm_data.get("version", "1.9.5") if npm_data else "1.9.5"
print(f"  📦 npm latest version : {npm_version}")

# npm: download stats
npm_day  = fetch_json("https://api.npmjs.org/downloads/point/last-day/poly-glot-ai-cli")
npm_week = fetch_json("https://api.npmjs.org/downloads/point/last-week/poly-glot-ai-cli")
npm_range = fetch_json(f"https://api.npmjs.org/downloads/range/2026-01-01:2099-01-01/poly-glot-ai-cli")
downloads_day   = npm_day.get("downloads", 0)   if npm_day   else 0
downloads_week  = npm_week.get("downloads", 0)  if npm_week  else 0
downloads_total = sum(d["downloads"] for d in npm_range.get("downloads", [])) if npm_range else 0
print(f"  📊 npm downloads      : day={downloads_day:,}  week={downloads_week:,}  total={downloads_total:,}")

# VS Code marketplace: latest published version
vscode_version = "1.4.6"   # fallback
vscode_payload = json.dumps({
    "filters": [{"criteria": [{"filterType": 7, "value": "poly-glot-ai.poly-glot"}]}],
    "flags": 914
}).encode("utf-8")
try:
    req = urllib.request.Request(
        "https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery",
        data=vscode_payload,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json;api-version=3.0-preview.1",
            "User-Agent": "poly-glot-updater/1.0",
        },
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=10) as r:
        vsc = json.loads(r.read())
        exts = vsc.get("results", [{}])[0].get("extensions", [])
        if exts:
            vscode_version = exts[0].get("versions", [{}])[0].get("version", vscode_version)
except Exception as e:
    print(f"  ⚠️  VS Code marketplace fetch failed: {e}", file=sys.stderr)
print(f"  💻 VS Code extension  : {vscode_version}")

print()

# ─────────────────────────────────────────────────────────────────────────────
# 2. Patch index.html
# ─────────────────────────────────────────────────────────────────────────────

print("📝 Patching index.html …")
html = read_file("index.html")
html_orig = html

# 2a. data-build attribute on <html> tag  →  today's date + UTC hour
#     Pattern:  <html lang="en" data-build="20260403-ghapp">
html = re.sub(
    r'(<html[^>]*\bdata-build=")[^"]*(")',
    rf'\g<1>{now_tag}\g<2>',
    html,
    count=1
)

# 2b. CLI terminal demo: the npm install output line
#     Source contains the version string as:  poly-glot-ai-cli@X.X.X
#     It appears inside a Cloudflare email-obfuscation anchor in the
#     *served* page, but in the raw source it is plain text like:
#         + poly-glot-ai-cli@1.5.2
#     We target the marker comment we added AND the raw pattern.
#
#     Pattern inside the cli-demo-body:
#       <div class="cli-line cli-output">+ poly-glot-ai-cli@X.X.X</div>
#     OR (if CF already mangled it in source):
#       <div class="cli-line cli-output">+ <a href="/cdn-cgi/...
#
#     Strategy: replace anything between "+ " and "</div>" on that line
#     IF it's inside the cli-demo-body block.
#     We use a sentinel comment we inject once, then match against it.

# First, check if our sentinel is already present
if "<!-- pg-npm-version-line -->" not in html:
    # First time: find the line and add sentinel
    html = re.sub(
        r'(<div class="cli-line cli-output">\+\s*)'          # opening + " + "
        r'(poly-glot-ai-cli@[\d.]+|'                         # plain version OR
        r'<a [^>]*__cf_email__[^>]*>.*?</a>)'               # CF-mangled version
        r'(</div>)',
        rf'\g<1>poly-glot-ai-cli@{npm_version}\g<3><!-- pg-npm-version-line -->',
        html,
        count=1,
        flags=re.DOTALL
    )
else:
    # Subsequent runs: sentinel is present — replace version between + and sentinel
    html = re.sub(
        r'(<div class="cli-line cli-output">\+\s*)'
        r'(poly-glot-ai-cli@[\d.]+|<a [^>]*__cf_email__[^>]*>.*?</a>)'
        r'(</div><!-- pg-npm-version-line -->)',
        rf'\g<1>poly-glot-ai-cli@{npm_version}\g<3>',
        html,
        count=1,
        flags=re.DOTALL
    )

# 2c. softwareVersion in JSON-LD schema
#     "<softwareVersion": "2.0.0">"  →  use npm version
html = re.sub(
    r'("softwareVersion":\s*")[^"]*(")',
    rf'\g<1>{npm_version}\g<2>',
    html,
    count=1
)

# 2d. Sitemap lastmod (if referenced inline in any meta — not present but future-proof)
# (sitemap.xml is patched separately below)

# 2e. Inject live-data.js script tag if not already there
if 'src="live-data.js"' not in html:
    html = html.replace(
        '</body>',
        '<script defer src="live-data.js"></script>\n</body>',
        1
    )

if html != html_orig:
    write_file("index.html", html)
    print("  ✅ index.html updated")
else:
    print("  ℹ️  index.html — no changes needed")

# ─────────────────────────────────────────────────────────────────────────────
# 3. Patch sitemap.xml
# ─────────────────────────────────────────────────────────────────────────────

print("\n🗺️  Patching sitemap.xml …")
sitemap = read_file("sitemap.xml")
sitemap_orig = sitemap

sitemap = re.sub(
    r'<lastmod>\d{4}-\d{2}-\d{2}</lastmod>',
    f'<lastmod>{today}</lastmod>',
    sitemap
)
# Also bump changefreq to daily since we now update very frequently
sitemap = re.sub(
    r'<changefreq>weekly</changefreq>',
    '<changefreq>daily</changefreq>',
    sitemap
)

if sitemap != sitemap_orig:
    write_file("sitemap.xml", sitemap)
else:
    print("  ℹ️  sitemap.xml — no changes needed")

# ─────────────────────────────────────────────────────────────────────────────
# 4. Patch README npm stats block (existing format, extended)
# ─────────────────────────────────────────────────────────────────────────────

stats_block = f"""<!-- npm-stats-start -->
> 📦 **npm install stats** *(auto-updated every 3 hours)*
> | Period | Downloads |
> |--------|-----------|
> | Yesterday | **{downloads_day:,}** |
> | Last 7 days | **{downloads_week:,}** |
> | All time | **{downloads_total:,}** |
>
> 📦 Latest version: **{npm_version}** · 💻 VS Code: **{vscode_version}**
>
> *Last updated: {today}*
<!-- npm-stats-end -->"""

pattern = re.compile(
    r'<!-- npm-stats-start -->.*?<!-- npm-stats-end -->',
    re.DOTALL
)

print("\n📖 Patching README files …")
for readme_path in ["README.md", "cli/README.md"]:
    try:
        readme = read_file(readme_path)
        if "<!-- npm-stats-start -->" in readme:
            updated = pattern.sub(stats_block, readme)
            if updated != readme:
                write_file(readme_path, updated)
            else:
                print(f"  ℹ️  {readme_path} — no changes needed")
        else:
            print(f"  ℹ️  {readme_path} — no stats block found, skipping")
    except FileNotFoundError:
        print(f"  ⚠️  {readme_path} not found, skipping")

# ─────────────────────────────────────────────────────────────────────────────
# Done
# ─────────────────────────────────────────────────────────────────────────────

print(f"""
✅  Auto-update complete
    npm version   : {npm_version}
    VS Code       : {vscode_version}
    Downloads     : {downloads_total:,} total / {downloads_week:,} this week
    Build tag     : {now_tag}
    Date          : {today}
""")
