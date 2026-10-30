"""Losslessly pack the original rice PNGs; --check verifies existing output pixels."""
from pathlib import Path
from PIL import Image
import json
import sys

root = Path(__file__).resolve().parents[1] / 'assets/resources/rice-v01'
names = ['rice_mature_01','rice_mature_02','rice_mature_03','rice_stubble','rice_grain_01','rice_grain_02','rice_grain_03','rice_grain_04','rice_grain_05','rice_leaf_01','rice_leaf_02','rice_leaf_03']
atlas = Image.new('RGBA', (2048, 2048))
frames = {}
for i, name in enumerate(names):
    image = Image.open(root / 'textures' / (name + '.png')).convert('RGBA')
    x, y = ((i % 2) * 516 + 2, (i // 2) * 644 + 2) if i < 4 else ((i - 4) * 164 + 2, 1290)
    atlas.paste(image, (x, y))
    frames[name] = {'rect': [x, y, image.width, image.height]}
metadata = {'size': [2048, 2048], 'frames': frames}
if '--check' in sys.argv:
    actual = Image.open(root / 'rice-atlas.png').convert('RGBA')
    assert actual.size == atlas.size
    assert actual.tobytes() == atlas.tobytes(), 'Atlas pixels differ from original rice images'
    assert json.loads((root / 'rice-atlas.json').read_text(encoding='utf-8')) == metadata
    print('PASS all 12 rice images retain exact RGBA pixels and original canvas sizes in one shared atlas')
else:
    atlas.save(root / 'rice-atlas.png', optimize=True)
    (root / 'rice-atlas.json').write_text(json.dumps(metadata, indent=2), encoding='utf-8')
    print('Packed rice atlas:', root / 'rice-atlas.png')
