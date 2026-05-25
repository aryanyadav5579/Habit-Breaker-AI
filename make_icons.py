"""
Generate extension icon PNG files from the source image.
Run: python make_icons.py
"""
from PIL import Image
import os

src = r'C:\Users\Asus\.gemini\antigravity\brain\6eb29b0a-eb22-402e-9981-7588552d8a49\habit_breaker_icon_1779699479133.png'
out_dir = os.path.join(os.path.dirname(__file__), 'extension', 'icons')

os.makedirs(out_dir, exist_ok=True)

img = Image.open(src).convert('RGBA')
for size in [16, 32, 48, 128]:
    resized = img.resize((size, size), Image.LANCZOS)
    dest = os.path.join(out_dir, f'icon{size}.png')
    resized.save(dest, 'PNG')
    print(f'Saved {size}x{size} → {dest}')

print('Done.')
