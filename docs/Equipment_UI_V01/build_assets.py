from PIL import Image, ImageDraw, ImageOps
from pathlib import Path
import json, zipfile

root=Path(__file__).parent
src=root.parent.parent/'generated_images'
tex=root/'textures';tex.mkdir(exist_ok=True)
mapping={
'equip_01_sickle':'exec-726810d2-5ba9-49bc-8710-925610c21757.png',
'equip_02_long_sickle':'exec-2bed04a9-2426-4b23-a185-1fd867ac18c0.png',
'equip_03_push_harvester':'exec-dd2211b0-e516-4261-ad89-df139a695a0d.png',
'equip_04_ride_harvester':'exec-736ffafe-20ee-494b-99b6-f8cb2f97f100.png',
'equip_05_combine':'exec-e3fe88eb-cd85-44bf-9d0a-66a6bd791198.png',
'tile_normal':'exec-08f94dbd-f55d-421b-a24f-939ad9365056.png'}
stats={}
for name,file in mapping.items():
 im=Image.open(src/file).convert('RGBA')
 bbox=im.getchannel('A').point(lambda a:255 if a>128 else 0).getbbox();im=im.crop(bbox)
 im.thumbnail((480,480),Image.Resampling.LANCZOS)
 canvas=Image.new('RGBA',(512,512));canvas.alpha_composite(im,((512-im.width)//2,(512-im.height)//2))
 canvas.save(tex/(name+'.png'))
 stats[name]={'size':[512,512],'alpha_extrema':canvas.getchannel('A').getextrema()}
 if name.startswith('equip'):
  gray=ImageOps.grayscale(canvas).convert('RGBA');gray.putalpha(canvas.getchannel('A'));gray.save(tex/(name+'_gray.png'))

# Small UI state overlays are clean raster geometry, independent of tool art.
im=Image.new('RGBA',(512,512));d=ImageDraw.Draw(im)
d.rounded_rectangle((13,13,499,499),radius=84,outline=(255,184,32,255),width=15)
d.rounded_rectangle((26,26,486,486),radius=73,outline=(255,242,143,255),width=5)
im.save(tex/'selection_border.png')
im=Image.new('RGBA',(96,96));d=ImageDraw.Draw(im)
d.ellipse((8,8,88,88),fill=(60,179,51,255),outline=(31,111,38,255),width=5)
d.ellipse((24,19,46,36),fill=(208,255,161,255));im.save(tex/'active_dot.png')
im=Image.new('RGBA',(128,128));d=ImageDraw.Draw(im)
d.rounded_rectangle((34,12,94,86),radius=29,outline=(94,102,107,255),width=12)
d.rounded_rectangle((21,54,107,118),radius=14,fill=(169,177,181,255),outline=(77,85,90,255),width=6)
d.ellipse((57,74,71,88),fill=(73,79,85,255));d.rectangle((61,83,67,99),fill=(73,79,85,255))
im.save(tex/'lock.png')
names=list(mapping)[:5]
preview=Image.new('RGB',(1000,430),(238,229,205))
for row in range(2):
 for i,name in enumerate(names):
  tile=Image.open(tex/'tile_normal.png').resize((176,176))
  tool=Image.open(tex/(name+('_gray' if row==1 and i>0 else '')+'.png'))
  tool.thumbnail((140,140),Image.Resampling.LANCZOS);tile.alpha_composite(tool,((176-tool.width)//2,28+(140-tool.height)//2))
  if row==1:
   if i==0:
    tile.alpha_composite(Image.open(tex/'selection_border.png').resize((176,176)))
    tile.alpha_composite(Image.open(tex/'active_dot.png').resize((18,18)),(146,13))
   else:tile.alpha_composite(Image.open(tex/'lock.png').resize((22,22)),(145,10))
  ImageDraw.Draw(tile).text((17,10),str(i+1),fill=(112,77,42,255),stroke_width=1)
  preview.paste(tile,(12+i*198,20+row*205),tile)
preview.save(root/'preview.png')
config={'version':1,'scope':'equipment_UI_only','canvas':[512,512],'anchor':[0.5,0.5],'levels':[{'level':i+1,'icon':'textures/'+n+'.png','grayIcon':'textures/'+n+'_gray.png'} for i,n in enumerate(names)],'logicalLayout':{'screenWidth':375,'tile':44,'gap':8,'rowWidth':252,'buttonGap':14},'states':{'locked':'gray icon + lock','unlocked':'color icon','current':'color icon + selection_border + active_dot'}}
(root/'equipment_config.json').write_text(json.dumps(config,ensure_ascii=False,indent=2))
(root/'validation.json').write_text(json.dumps(stats,indent=2))
assert len(list(tex.glob('*.png')))==14
for f in tex.glob('*.png'):
 im=Image.open(f); assert im.mode=='RGBA' and im.getchannel('A').getextrema()[0]==0
out=root.with_suffix('.zip')
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
 for f in root.rglob('*'):
  if f.is_file():z.write(f,Path(root.name)/f.relative_to(root))
print(out)
