from PIL import Image,ImageDraw
from scipy.ndimage import label,binary_dilation,find_objects
import numpy as np,pathlib,io,json,zipfile
P=pathlib.Path(__file__).parent
src=Image.open('generated_images/exec-4b13885e-5845-4f48-92f0-b7cb685888c8.png').convert('RGBA');a=np.array(src)
lab,n=label(a[:,:,3]>80);slices=find_objects(lab)
def save(im,p):
 b=io.BytesIO();im.save(b,format='PNG');p.write_bytes(b.getvalue())
def extract(i):
 m=binary_dilation(lab==i,iterations=3);b=a.copy();b[:,:,3]=np.where(m,a[:,:,3],0);im=Image.fromarray(b);return im.crop(im.getbbox())
config={}
def asset(name,i,size,scale=None):
 im=extract(i)
 if scale is None:scale=min((size[0]-32)/im.width,(size[1]-64)/im.height)
 im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
 out=Image.new('RGBA',size);out.alpha_composite(im,((size[0]-im.width)//2,size[1]-32-im.height));save(out,P/'textures'/f'{name}.png')
 config[name]={'size':list(size),'anchor':[0.5,32/size[1]],'rootPixelFromTop':[size[0]/2,size[1]-32]};return out
plants=[asset(f'rice_mature_0{j+1}',i,(512,640),1.08) for j,i in enumerate([1,2,3])]
asset('rice_row_strip',5,(512,1024),1.5)
asset('rice_stubble',7,(512,640),0.40)
for j,i in enumerate([6,8,9,10,12]):asset(f'rice_grain_0{j+1}',i,(128,160),.65)
for j,i in enumerate([11,13,14]):asset(f'rice_leaf_0{j+1}',i,(160,192),.7)
save(src,P/'rice_reference.png')
preview=Image.new('RGBA',(1000,900),'#b7793d');d=ImageDraw.Draw(preview)
for x in [180,500,820]:
 d.rounded_rectangle((x-125,20,x+125,880),radius=70,fill='#986031')
 for k,y in enumerate([230,400,570,740]):
  im=plants[k%3].resize((230,288),Image.Resampling.LANCZOS);preview.alpha_composite(im,(x-115,y-274))
save(preview,P/'field_preview.png')
(P/'assets.json').write_text(json.dumps({'engine':'Cocos Creator','anchorConvention':'normalized bottom-left origin','assets':config},indent=2))
(P/'README.txt').write_text('水稻素材 V01｜橘猫割草记\n\ntextures：3个成熟水稻变体、1个连排素材、1个稻茬、5个稻粒、3个碎叶，共13张透明PNG。\nrice_reference.png：已确认的素材参考图。field_preview.png：三垄拼装示意，不代表联合收割机最终垄数。\n\n替换草素材：\n1. 将textures导入Cocos，纹理作为SpriteFrame使用。成熟水稻与稻茬均为512×640，锚点统一(0.5,0.05)，对应根部落地位置。采用CUSTOM尺寸，保留完整画布；避免按透明裁边后的尺寸改变节点大小。\n2. 原有草节点使用rice_mature_01～03随机变体，保留原有生成、回收、地图滚动和收割判定逻辑。仅在农作物升级到水稻后切换资源。\n3. 以田垄宽度控制整体缩放，水稻叶片宽度约占单垄宽度80%～95%，不要直接用512像素原尺寸。前后叠放，以根部位置排序：屏幕下方的植株覆盖上方植株。不要用稻穗顶部作为碰撞点。\n4. 收割时成熟植株隐藏，替换为同尺寸同锚点的rice_stubble；稻粒与碎叶用作短暂飞散粒子。碎片不要当作整株素材。\n5. rice_row_strip仅用于背景密植或整段收割；逐株判定请用三个单丛变体，不要同时叠放两套导致密度过高。连排素材锚点见assets.json。\n6. UI金币和作物收益由游戏配置控制，本包不包含或修改经济数值。\n\n图片说明：成熟水稻为金黄下垂稻穗与青绿叶片，稻茬已缩小高度；所有植物PNG底部留32像素透明边。颗粒素材保持各自完整画布。\n检查：独立透明通道、尺寸、PNG解码和ZIP完整性检查通过。未接入用户Cocos项目，实际缩放与遮挡仍需在现有场景中确认。\n',encoding='utf8')
for p in (P/'textures').glob('*.png'):
 im=Image.open(p);im.load();assert im.mode=='RGBA' and im.getextrema()[3][0]==0
b=io.BytesIO()
with zipfile.ZipFile(b,'w',zipfile.ZIP_DEFLATED) as z:
 for p in P.rglob('*'):
  if p.is_file():z.writestr(str(p.relative_to(P)),p.read_bytes())
P.with_suffix('.zip').write_bytes(b.getvalue())
with zipfile.ZipFile(P.with_suffix('.zip')) as z:assert z.testzip() is None
print('Exported',len(config),'assets')
