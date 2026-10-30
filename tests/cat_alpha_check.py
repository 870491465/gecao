"""Read-only source alpha intersection check; does not edit or regenerate textures."""
from PIL import Image
from pathlib import Path
import json, math, sys
root = Path(__file__).resolve().parents[1]
v02 = '--v02' in sys.argv
source = root / ('docs/OrangeCat_Walk_V02/textures' if v02 else 'docs/OrangeCat_Cocos_Parts_V01/textures')
body = Image.open(source / ('cat_body.png' if v02 else 'cat_body_feet.png')).convert('RGBA')
arm = Image.open(source / 'cat_right_arm_sickle.png').convert('RGBA')
# Only the steel blade, not the arm/shoulder region which should be covered by the body.
blade = [(x, y) for y in range(280) for x in range(arm.width) if arm.getpixel((x,y))[3] > 150]
samples = []
for i in range(121):
    angle = -60 + i * .5
    t = math.radians(angle)
    overlap = 0
    for x, y in blade:
        dx, dy = (x-137)*.8, (480-y)*.8
        bx = round((389 if v02 else 508) + 302 + dx*math.cos(t) - dy*math.sin(t))
        by = round((987 if v02 else 977) - 410 - dx*math.sin(t) - dy*math.cos(t))
        if 0 <= bx < body.width and 0 <= by < body.height and body.getpixel((bx,by))[3] > 150:
            overlap += 1
    samples.append({'angle': angle, 'occluded_blade_pixels': overlap})
baseline = samples[-1]['occluded_blade_pixels']
result = {'type':'source alpha overlap, geometry check, not device runtime','blade_pixels':len(blade), 'threshold':150,'samples':samples,'reference_static_occluded_pixels':baseline,'max_occluded_blade_pixels':max(s['occluded_blade_pixels'] for s in samples)}
out = root / ('docs/verification/cat-walk-v02/alpha-overlap.json' if v02 else 'docs/verification/cat-parts-v01/alpha-overlap.json')
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(result, indent=2), encoding='utf-8')
assert result['max_occluded_blade_pixels'] <= (baseline if v02 else 0)
print('PASS 121 source-alpha poses: no extra blade occlusion beyond source static reference; baseline',baseline)
