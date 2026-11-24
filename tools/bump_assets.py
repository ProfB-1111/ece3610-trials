#!/usr/bin/env python3
"""Stamp a fresh ?v=<timestamp> on every assets/*.js|css reference in the HTML pages,
so browsers fetch the updated files right after a push instead of reusing cached copies.
Run before committing:  python3 tools/bump_assets.py"""
import re, time, pathlib
v = time.strftime("%Y%m%d%H%M")
root = pathlib.Path(__file__).resolve().parent.parent
for page in root.glob("*.html"):
    s = page.read_text(encoding="utf-8")
    s2 = re.sub(r'((?:src|href)="assets/[\w./-]+\.(?:js|css))(?:\?v=\w+)?"', rf'\1?v={v}"', s)
    if s2 != s:
        page.write_text(s2, encoding="utf-8")
        print(f"{page.name}: assets stamped v={v}")
