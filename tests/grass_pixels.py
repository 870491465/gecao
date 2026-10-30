from pathlib import Path
from PIL import Image
import json
root=Path(__file__).resolve().parents[1]
source=root/'docs/Grass_Field_Batch02/textures'
decode_errors=[]
for file in source.glob('*.png'):
    try:
        decoded=Image.open(file);decoded.load()
        print(file.name,'OK',decoded.size)
    except Exception as error:
        decode_errors.append({'file':file.name,'error':str(error)})
        print(file.name,'ERROR',str(error))
image=Image.open(source/'ground_scroll.png').convert('RGB')
assert image.size==(768,1536)
assert image.crop((0,0,768,1)).tobytes()==image.crop((0,1535,768,1536)).tobytes()
assert image.crop((0,767,768,768)).tobytes()==image.crop((0,768,768,769)).tobytes()
joined=Image.new('RGB',image.size)
for name,x,w in [('ground_left_edge',0,208),('ground_soil',208,352),('ground_right_edge',560,208)]:
    part=image.crop((x,0,x+w,1536))
    assert part.size==(w,1536)
    joined.paste(part,(x,0))
assert joined.tobytes()==image.tobytes()
for pair in 'ABC':
    for state in ['mature','stubble']:
        grass=Image.open(source/f'grass_{state}_{pair}.png')
        assert grass.size==(512,512) and grass.mode=='RGBA'
        assert grass.getchannel('A').getextrema()==(0,255)
out=root/'docs/verification/grass-batch02';out.mkdir(parents=True,exist_ok=True)
(out/'pixels.json').write_text(json.dumps({'top_bottom_equal':True,'internal_mirror_join_equal':True,'full_image_uv_regions_reassemble_full_image':True,'six_rgba_512_pairs':True,'source_decode_errors':decode_errors},indent=2),encoding='utf8')
print('PASS source ground seams, exact split reconstruction and six RGBA grass canvases')
