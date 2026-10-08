from pathlib import Path
import re

p = Path('iphone-field.html')
s = p.read_text()

def once(old, new, label):
    global s
    if old not in s:
        raise SystemExit(f'anchor not found: {label}')
    s = s.replace(old, new, 1)

once('<title>太陽ウォッチ iPhone 屋外統合検証 v2</title>', '<title>太陽ウォッチ iPhone 屋外統合検証 v3</title>', 'title')
once('<h1 style="margin-top:12px">☀️ iPhone 屋外統合検証 v2</h1>', '<h1 style="margin-top:12px">☀️ iPhone 屋外統合検証 v3</h1>', 'heading')
once('<div class="mut