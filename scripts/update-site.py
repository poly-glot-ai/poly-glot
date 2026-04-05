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
vscode_version        = "1.4.13"  # fallback
vscode_installs       = 0         # install stat (from VS Code app)
vscode_download_count = 0         # downloadCount stat (from Marketplace web)
vscode_combined       = 0         # install + downloadCount (public API)
vscode_acquisition    = 0         # true acquisition count (publisher PAT API)

# ── Public API (always) — version + public stats ──────────────────────────────
vsc_payload = json.dumps({
    "filters": [{"criteria": [{"filterType": 7, "value": "poly-glot-ai.poly-glot"}]}],
    "flags": 914
})
vsc_resp = fetch_json(
    "https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery",
    method="POST",
    data=vsc_payload,
    headers={
        "Content-Type": "application/json",
        "Accept":       "application/json;api-version=3.0-preview.1",
    }
)
if vsc_resp:
    try:
        ext = vsc_resp["results"][0]["extensions"][0]
        vscode_version = ext["versions"][0]["version"]
        for s in ext.get("statistics", []):
            if s["statisticName"] == "install":
                vscode_installs = int(s["value"])
            if s["statisticName"] == "downloadCount":
                vscode_download_count = int(s["value"])
        vscode_combined = vscode_installs + vscode_download_count
    except (KeyError, IndexError, TypeError):
        pass

# ── Publisher PAT API (when secret available) — true acquisition count ────────
# This is the same number the publisher dashboard shows under "Total Acquisition".
# It includes direct VS Code app installs that the public API misses (~48hr lag).
# Set VSCODE_PAT in GitHub Actions secrets:
#   → marketplace.visualstudio.com → User settings → Personal Access Tokens
#   → Scopes: Marketplace (Read & Manage)
import os as _os
_vscode_pat = _os.environ.get("VSCODE_PAT", "")
if _vscode_pat:
    try:
        _pat_resp = fetch_json(
            "https://marketplace.visualstudio.com/_apis/gallery/publishers/poly-glot-ai/extensions/poly-glot/stats?flags=1",
            headers={
                "Accept":        "application/json;api-version=7.2-preview.1",
                "Authorization": f"Basic {__import__('base64').b64encode(f':{_vscode_pat}'.encode()).decode()}",
            }
        )
        if _pat_resp:
            # Response is a list of stat entries
            for entry in (_pat_resp if isinstance(_pat_resp, list) else []):
                if entry.get("statisticName") == "acquisitionCount":
                    vscode_acquisition = int(entry.get("value", 0))
                    break
            # Also try totalInstalls key (alternate response shape)
            if not vscode_acquisition and isinstance(_pat_resp, dict):
                vscode_acquisition = int(_pat_resp.get("totalInstalls", 0) or 0)
        if vscode_acquisition:
            print(f"  ✅ VS Code PAT API    : acquisitionCount = {vscode_acquisition}")
        else:
            print(f"  ℹ️  VS Code PAT API    : no acquisitionCount found — using public API combined")
    except Exception as _e:
        print(f"  ⚠️  VS Code PAT API    : error ({_e}) — using public API combined")
else:
    print(f"  ℹ️  VS Code PAT API    : VSCODE_PAT not set — using public API + floor")

# Open VSX downloads
ovx_resp     = fetch_json("https://open-vsx.org/api/poly-glot-ai/poly-glot")
ovx_installs = 0
if ovx_resp:
    try:
        ovx_installs = int(ovx_resp.get("downloadCount", 0))
    except (ValueError, TypeError):
        pass

print(f"  💻 VS Code extension  : {vscode_version}  (install={vscode_installs} downloadCount={vscode_download_count} combined={vscode_combined})")
print(f"  📦 Open VSX           : {ovx_installs} downloads")

# Chrome Web Store — via cws-proxy worker (OAuth2 → CWS Publish API)
# Returns { installs: N } once OAuth secrets are configured in Cloudflare
chrome_installs = 0
try:
    cws_resp = fetch_json("https://poly-glot.ai/api/auth/cws-proxy")
    if cws_resp and isinstance(cws_resp.get("installs"), int):
        chrome_installs = cws_resp["installs"]
        print(f"  🌐 Chrome Web Store   : {chrome_installs} installs (live via cws-proxy)")
    else:
        print(f"  🌐 Chrome Web Store   : proxy returned {cws_resp} — OAuth secrets not yet configured")
except Exception as e:
    print(f"  🌐 Chrome Web Store   : cws-proxy error ({e}) — using floor")

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

# 2i. Ensure live-data.v11.js is referenced (upgrades any older version reference)
if 'src="live-data.v11.js"' not in html:
    import re as _re
    html = _re.sub(r'<script[^>]+src="live-data[^"]*\.js"[^>]*></script>\n?', '', html)
    html = html.replace(
        '</body>',
        '<script defer src="live-data.v11.js"></script>\n</body>',
        1
    )

if html != html_orig:
    write_file("index.html", html)
else:
    print("  ℹ️  index.html — no changes needed")

# ─────────────────────────────────────────────────────────────────────────────
# 2j. Auto-update VS_FLOOR and OVX_FLOOR across ALL three floor files:
#       1. live-data.v11.js     — browser counter (single source of truth)
#       2. dashboard/index.html — health dashboard Math.max() floor
#       3. scripts/update-site.py (self) — minimum floor constant here
#
#     The public Marketplace API undercounts vs the dashboard (~48 hr lag).
#     We use combined (install + downloadCount) as the new floor whenever
#     it exceeds the current floor — so the counter never goes backwards.
#     All three files are updated atomically in the same commit.
# ─────────────────────────────────────────────────────────────────────────────
import re as _re2

LIVE_DATA_FILE = "live-data.v11.js"
DASHBOARD_FILE  = "dashboard/index.html"
SELF_FILE       = "scripts/update-site.py"

# VS Code: prefer the PAT-based true acquisition count over the public API combined.
# The PAT endpoint returns the same number the publisher dashboard shows (~48hr lead).
# Fall back to public combined if PAT is unavailable; always raise-only (never lower).
_HARDCODED_VS_FLOOR = 124   # last manually verified value (2026-04-05)
if vscode_acquisition:
    # PAT returned a value — use it as the authoritative count
    vscode_combined = max(_HARDCODED_VS_FLOOR, vscode_acquisition)
    print(f"  ✅ VS Code effective   : {vscode_combined} (from PAT acquisitionCount)")
else:
    # No PAT — fall back to public API + hardcoded floor
    vscode_combined = max(_HARDCODED_VS_FLOOR, vscode_combined)
    print(f"  ℹ️  VS Code effective   : {vscode_combined} (floor-guarded public API)")

# ── 1. live-data.v11.js ──────────────────────────────────────────────────────
try:
    with open(LIVE_DATA_FILE, "r", encoding="utf-8") as f:
        ld = f.read()

    ld_orig = ld

    # Extract current floors
    vs_match  = _re2.search(r'var VS_FLOOR\s*=\s*(\d+)', ld)
    ovx_match = _re2.search(r'var OVX_FLOOR\s*=\s*(\d+)', ld)
    current_vs_floor  = int(vs_match.group(1))  if vs_match  else 0
    current_ovx_floor = int(ovx_match.group(1)) if ovx_match else 0

    # Only raise floors, never lower them
    new_vs_floor  = max(current_vs_floor,  vscode_combined)
    new_ovx_floor = max(current_ovx_floor, ovx_installs)

    if new_vs_floor != current_vs_floor:
        ld = _re2.sub(
            r'(var VS_FLOOR\s*=\s*)\d+',
            rf'\g<1>{new_vs_floor}',
            ld
        )
        print(f"  ✅ {LIVE_DATA_FILE} VS_FLOOR updated: {current_vs_floor} → {new_vs_floor}")
    else:
        print(f"  ℹ️  {LIVE_DATA_FILE} VS_FLOOR unchanged: {current_vs_floor} (api={vscode_combined})")

    if new_ovx_floor != current_ovx_floor:
        ld = _re2.sub(
            r'(var OVX_FLOOR\s*=\s*)\d+',
            rf'\g<1>{new_ovx_floor}',
            ld
        )
        print(f"  ✅ {LIVE_DATA_FILE} OVX_FLOOR updated: {current_ovx_floor} → {new_ovx_floor}")
    else:
        print(f"  ℹ️  {LIVE_DATA_FILE} OVX_FLOOR unchanged: {current_ovx_floor} (api={ovx_installs})")

    # Chrome Web Store — auto-raise floor from cws-proxy (raise-only, never lower)
    chrome_match = _re2.search(r'var CHROME_FLOOR\s*=\s*(\d+)', ld)
    current_chrome_floor = int(chrome_match.group(1)) if chrome_match else 0
    new_chrome_floor = max(current_chrome_floor, chrome_installs)
    if new_chrome_floor != current_chrome_floor:
        ld = _re2.sub(
            r'(var CHROME_FLOOR\s*=\s*)\d+',
            rf'\g<1>{new_chrome_floor}',
            ld
        )
        print(f"  ✅ {LIVE_DATA_FILE} CHROME_FLOOR updated: {current_chrome_floor} → {new_chrome_floor}")
    else:
        print(f"  ℹ️  {LIVE_DATA_FILE} CHROME_FLOOR: {current_chrome_floor} (cws-proxy={chrome_installs})")

    if ld != ld_orig:
        write_file(LIVE_DATA_FILE, ld)
    else:
        print(f"  ℹ️  {LIVE_DATA_FILE} — no floor changes needed")

    # ── Self-update: keep _HARDCODED_VS_FLOOR in this file in sync ───────────
    try:
        with open(SELF_FILE, "r", encoding="utf-8") as _sf:
            self_src = _sf.read()
        self_src_orig = self_src
        _self_match = _re2.search(r'_HARDCODED_VS_FLOOR\s*=\s*(\d+)', self_src)
        _self_floor  = int(_self_match.group(1)) if _self_match else 0
        if new_vs_floor > _self_floor:
            self_src = _re2.sub(
                r'(_HARDCODED_VS_FLOOR\s*=\s*)\d+',
                rf'\g<1>{new_vs_floor}',
                self_src
            )
            # Update the comment date too
            import datetime as _dt
            _today_str = _dt.date.today().isoformat()
            self_src = _re2.sub(
                r'(last manually verified value \()[^)]+(\))',
                rf'\g<1>{_today_str}\g<2>',
                self_src
            )
            write_file(SELF_FILE, self_src)
            print(f"  ✅ {SELF_FILE} _HARDCODED_VS_FLOOR updated: {_self_floor} → {new_vs_floor}")
        else:
            print(f"  ℹ️  {SELF_FILE} _HARDCODED_VS_FLOOR unchanged: {_self_floor}")
    except Exception as _se:
        print(f"  ⚠️  {SELF_FILE} self-update failed: {_se}")

except Exception as e:
    print(f"  ⚠️  Could not update {LIVE_DATA_FILE}: {e}")
    new_vs_floor  = vscode_combined  # fallback so dashboard update still runs
    new_ovx_floor = ovx_installs

# ── 2. dashboard/index.html ──────────────────────────────────────────────────
# Dashboard has its own Math.max(N, ...) floor — keep it in sync with live-data.v11.js
try:
    with open(DASHBOARD_FILE, "r", encoding="utf-8") as f:
        db = f.read()

    db_orig = db

    # Match: m.vscInstall = Math.max(NNN, ...)
    db_vs_match = _re2.search(r'm\.vscInstall\s*=\s*Math\.max\((\d+),', db)
    current_db_vs_floor = int(db_vs_match.group(1)) if db_vs_match else 0

    if new_vs_floor != current_db_vs_floor:
        db = _re2.sub(
            r'(m\.vscInstall\s*=\s*Math\.max\()\d+,',
            rf'\g<1>{new_vs_floor},',
            db
        )
        print(f"  ✅ {DASHBOARD_FILE} vscInstall floor updated: {current_db_vs_floor} → {new_vs_floor}")
    else:
        print(f"  ℹ️  {DASHBOARD_FILE} vscInstall floor unchanged: {current_db_vs_floor}")

    # Also sync Chrome floor in dashboard if cws-proxy returned a live count
    if chrome_installs > 0:
        db_chrome_match = _re2.search(r'Math\.max\((\d+),\s*cwsData\.installs\)', db)
        # Dashboard uses live cws-proxy fetch — no hardcoded floor needed there
        # but update the CHROME_FLOOR comment for reference
        pass

    if db != db_orig:
        write_file(DASHBOARD_FILE, db)
    else:
        print(f"  ℹ️  {DASHBOARD_FILE} — no floor changes needed")

except Exception as e:
    print(f"  ⚠️  Could not update {DASHBOARD_FILE}: {e}")

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

_vsc_source = "PAT acquisitionCount" if vscode_acquisition else "public API + floor"
_chrome_src = f"{chrome_installs} installs (cws-proxy)" if chrome_installs else "0 (floor / not yet live)"
print(f"""
✅  Auto-update complete
    CLI version   : v{npm_version}
    MCP version   : v{mcp_version}
    VS Code       : v{vscode_version}  ·  {vscode_combined} ({_vsc_source})
    Open VSX      : {ovx_installs} downloads
    Chrome        : {_chrome_src}
    npm downloads : {downloads_total:,} total / {downloads_week:,} this week / {downloads_day:,} today
    Build tag     : {now_tag}
    Date          : {today}
""")
