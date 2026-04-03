#!/usr/bin/env python3
"""
Poly-Glot Auto-Update Script
=============================
Fetches live data from public APIs and patches:
  - index.html   : data-build, CLI terminal version, softwareVersion JSON-LD,
                   npm-version / mcp-version / vscode-version / dl-week / dl-total spans,
                   download count line, live-data.js injection
  - sitemap.xml  : <lastmod> date + changefreq → daily
  - README.md    : npm install stats block
  - cli/README.md: npm install stats block

Run by GitHub Actions on every push + every 3 hours.
Safe to run locally: python3 scripts/update-site.py
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

def fetch_json(url, timeout=10, method="GET", data=None, headers=None):
    """Fetch JSON from a URL. Returns None on any error (never raises)."""
    try:
        hdrs = {"User-Agent": "poly-glot-updater/1.0"}
        if headers:
            hdrs.update(headers)
        body = data.encode("utf-8") if isinstance(data, str) else data
        req = urllib.request.Request(url, data=body, headers=hdrs, method=method)
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode("utf-8"))
    except Exception as e:
        print(f"  ⚠️  Could not fetch {url}: {e}", file=sys.stderr)
        return None


def repo_path(relative):
    """Resolve a path relative to the repo root."""
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(root, relative)


def read_file(path):
    with open(repo_path(path), "r", encoding="utf-8") as f:
        return f.read()


def write_file(path, content):
    with open(repo_path(path), "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  ✅ Written: {path}")


# ─────────────────────────────────────────────────────────────────────────────
# 1. Fetch live data
# ─────────────────────────────────────────────────────────────────────────────

today   = datetime.date.today().strftime("%Y-%m-%d")
now_tag = datetime.datetime.utcnow().strftime("%Y%m%d-%H%M")

print(f"\n🔍 Fetching live data ({today}) …\n")

# npm CLI: latest version
npm_cli = fetch_json("https://registry.npmjs.org/poly-glot-ai-cli/latest")
npm_version = npm_cli.get("version", "1.9.5") if npm_cli else "1.9.5"
print(f"  📦 poly-glot-ai-cli   : {npm_version}")

# npm MCP: latest version
npm_mcp = fetch_json("https://registry.npmjs.org/poly-glot-mcp/latest")
mcp_version = npm_mcp.get("version", "1.0.0") if npm_mcp else "1.0.0"
print(f"  📦 poly-glot-mcp      : {mcp_version}")

# npm downloads
npm_week  = fetch_json("https://api.npmjs.org/downloads/point/last-week/poly-glot-ai-cli")
npm_month = fetch_json("https://api.npmjs.org/downloads/point/last-month/poly-glot-ai-cli")
npm_range = fetch_json("https://api.npmjs.org/downloads/range/2026-01-01:2099-01-01/poly-glot-ai-cli")
dl_day    = fetch_json("https://api.npmjs.org/downloads/point/last-day/poly-glot-ai-cli")

downloads_day   = dl_day.get("downloads", 0)   if dl_day   else 0
downloads_week  = npm_week.get("downloads", 0)  if npm_week  else 0
downloads_month = npm_month.get("downloads", 0) if npm_month else 0
downloads_total = sum(d["downloads"] for d in npm_range.get("downloads", [])) if npm_range else 0
print(f"  📊 Downloads          : day={downloads_day:,}  week={downloads_week:,}  month={downloads_month:,}  total={downloads_total:,}")

# VS Code Marketplace
vscode_version  = "1.4.6"  # fallback
vscode_installs = 0
vsc_payload = json.dumps({
    "filters": [{"criteria": [{"filterType": 7, "value": "poly-glot-ai.poly-glot"}]}],
    "flags": 914
})
vsc_resp = fetch_json(
    "https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery",
    method="POST",
    data=vsc_payload,
    headers={
        "Content-Type":  "application/json",
        "Accept":        "application/json;api-version=3.0-preview.1",
    }
)
if vsc_resp:
    try:
        ext = vsc_resp["results"][0]["extensions"][0]
        vscode_version = ext["versions"][0]["version"]
        for s in ext.get("statistics", []):
            if s["statisticName"] == "install":
                vscode_installs = int(s["value"])
    except (KeyError, IndexError, TypeError):
        pass
print(f"  💻 VS Code extension  : {vscode_version}  (installs: {vscode_installs})")

print()

# ─────────────────────────────────────────────────────────────────────────────
# 2. Patch index.html
# ─────────────────────────────────────────────────────────────────────────────

print("📝 Patching index.html …")
html = read_file("index.html")
html_orig = html

# 2a. data-build timestamp
html = re.sub(
    r'(<html[^>]*\bdata-build=")[^"]*(")',
    rf'\g<1>{now_tag}\g<2>',
    html, count=1
)

# 2b. softwareVersion JSON-LD
html = re.sub(
    r'("softwareVersion":\s*")[^"]*(")',
    rf'\g<1>{npm_version}\g<2>',
    html, count=1
)

# 2c. CLI terminal demo version line (with sentinel)
if "<!-- pg-npm-version-line -->" not in html:
    html = re.sub(
        r'(<div class="cli-line cli-output">\+\s*)'
        r'(poly-glot-ai-cli@[\d.]+|<a [^>]*__cf_email__[^>]*>.*?</a>)'
        r'(</div>)',
        rf'\g<1>poly-glot-ai-cli@{npm_version}\g<3><!-- pg-npm-version-line -->',
        html, count=1, flags=re.DOTALL
    )
else:
    html = re.sub(
        r'(<div class="cli-line cli-output">\+\s*)'
        r'(poly-glot-ai-cli@[\d.]+|<a [^>]*__cf_email__[^>]*>.*?</a>)'
        r'(</div><!-- pg-npm-version-line -->)',
        rf'\g<1>poly-glot-ai-cli@{npm_version}\g<3>',
        html, count=1, flags=re.DOTALL
    )

# 2d. [data-live="npm-version"] spans — update hardcoded fallback value
html = re.sub(
    r'(<span data-live="npm-version">)[^<]*(</span>)',
    rf'\g<1>{npm_version}\g<2>',
    html
)

# 2e. [data-live="mcp-version"] spans
html = re.sub(
    r'(<span data-live="mcp-version">)[^<]*(</span>)',
    rf'\g<1>{mcp_version}\g<2>',
    html
)

# 2f. [data-live="vscode-version"] spans
html = re.sub(
    r'(<span data-live="vscode-version">)[^<]*(</span>)',
    rf'\g<1>{vscode_version}\g<2>',
    html
)

# 2g. [data-live="dl-week"] spans
html = re.sub(
    r'(<span data-live="dl-week">)[^<]*(</span>)',
    rf'\g<1>{downloads_week:,}\g<2>',
    html
)

# 2h. [data-live="dl-total"] spans
html = re.sub(
    r'(<span data-live="dl-total">)[^<]*(</span>)',
    rf'\g<1>{downloads_total:,}\g<2>',
    html
)

# 2i. Inject live-data.js if not already present
if 'src="live-data.js"' not in html:
    html = html.replace(
        '</body>',
        '<script defer src="live-data.js"></script>\n</body>',
        1
    )

if html != html_orig:
    write_file("index.html", html)
else:
    print("  ℹ️  index.html — no changes needed")

# ─────────────────────────────────────────────────────────────────────────────
# 3. Patch sitemap.xml
# ─────────────────────────────────────────────────────────────────────────────

print("\n🗺️  Patching sitemap.xml …")
sitemap      = read_file("sitemap.xml")
sitemap_orig = sitemap

sitemap = re.sub(r'<lastmod>\d{4}-\d{2}-\d{2}</lastmod>', f'<lastmod>{today}</lastmod>', sitemap)
sitemap = re.sub(r'<changefreq>weekly</changefreq>', '<changefreq>daily</changefreq>', sitemap)

if sitemap != sitemap_orig:
    write_file("sitemap.xml", sitemap)
else:
    print("  ℹ️  sitemap.xml — no changes needed")

# ─────────────────────────────────────────────────────────────────────────────
# 4. Patch README npm stats blocks
# ─────────────────────────────────────────────────────────────────────────────

stats_block = f"""<!-- npm-stats-start -->
> 📦 **npm install stats** *(auto-updated every 3 hours)*
> | Period | Downloads |
> |--------|-----------|
> | Yesterday | **{downloads_day:,}** |
> | Last 7 days | **{downloads_week:,}** |
> | Last 30 days | **{downloads_month:,}** |
> | All time | **{downloads_total:,}** |
>
> 📦 CLI: **v{npm_version}** · 🔌 MCP: **v{mcp_version}** · 💻 VS Code: **v{vscode_version}**
>
> *Last updated: {today} UTC*
<!-- npm-stats-end -->"""

pattern = re.compile(r'<!-- npm-stats-start -->.*?<!-- npm-stats-end -->', re.DOTALL)

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
# Summary
# ─────────────────────────────────────────────────────────────────────────────

print(f"""
✅  Auto-update complete
    CLI version   : v{npm_version}
    MCP version   : v{mcp_version}
    VS Code       : v{vscode_version} ({vscode_installs} installs)
    Downloads     : {downloads_total:,} total / {downloads_week:,} this week / {downloads_day:,} today
    Build tag     : {now_tag}
    Date          : {today}
""")
