from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np,math,json,io,zipfile
P=Path(__file__).resolve().parent;W=H=640
tex={p.stem:Image.open(p).convert('RGBA') for p in (P/'textures').glob('*.png')}
parts=json.loads((P/'source_parts.json').read_text())['parts']
def mat(pivot,pos,scale,angle):
 c,s=math.cos(angle),math.sin(angle);m=np.array([[c*scale,-s*scale,0],[s*scale,c*scale,0],[0,0,1.]])
 m[:2,2]=np.array(pos)-m[:2,:2]@np.array(pivot);return m
def put(im,name,m):
 inv=np.linalg.inv(m);im.alpha_composite(tex[name].transform((W,H),Image.Transform.AFFINE,tuple(inv[:2].ravel()),Image.Resampling.BICUBIC))
def ease(a):return a*a*(3-2*a)
keys=[(0,0),(.15,8),(.47,-110),(.60,-110),(1,0)]
def angle(t):
 for (ta,va),(tb,vb) in zip(keys,keys[1:]):
  if ta<=t<=tb:return va+(vb-va)*ease((t-ta)/(tb-ta))
frames=[];pngs=[];records=[]
for i in range(24):
 t=i/24; swing=angle(t);bob=2*math.sin(2*math.pi*t);lean=math.radians(2.5)*math.sin(2*math.pi*t)
 root=mat([0,0],[300,550+bob],.37,lean);im=Image.new('RGBA',(W,H));draws=[]
 for p in sorted(parts,key=lambda x:x['draw_order_back_to_front']):
  n=p['name'];pos=p['position_from_feet_root_y_up'];pos=[pos[0],-pos[1]];rot=0
  if n=='cat_right_arm_sickle':
   reach=max(0,-swing/110);pos[0]-=380*reach;pos[1]-=360*reach;rot=math.radians(swing*.65)
  if n=='cat_left_arm':rot=math.radians(-swing*.06)
  if n=='cat_tail':rot=math.radians(3)*math.sin(2*math.pi*t+.4)
  if n in ['cat_leg_left','cat_leg_right']:
   phase=2*math.pi*t+(0 if n.endswith('left') else math.pi)
   stride=math.sin(phase)
   pos[1]+=24+48*stride
   pos[0]+=8*math.cos(phase)
   rot=math.radians(9)*stride

  m=root@mat(p['pivot_px_top_left'],pos,p['local_scale'],rot);put(im,n,m);draws.append({'part':n,'matrix':m.tolist()})
 frames.append(im);b=io.BytesIO();im.save(b,format='PNG');data=b.getvalue();(P/f'frames/swing_{i:02}.png').write_bytes(data);pngs.append(data);records.append({'frame':i,'arm_angle_degrees':swing,'draws':draws})
bgs=[]
for im in frames:
 bg=Image.new('RGBA',(W,H),'#e3e9d8');bg.alpha_composite(im);bgs.append(bg.convert('RGB'))
bgs[0].save(P/'swing_preview.gif',save_all=True,append_images=bgs[1:],duration=[40,40,40,40,40,50]*4,loop=0)
sheet=Image.new('RGBA',(W*6,H*4))
for i,im in enumerate(frames):sheet.alpha_composite(im,((i%6)*W,(i//6)*H))
sheet.save(P/'spritesheet_6x4.png')
contact=Image.new('RGB',(1280,640),'#e3e9d8')
for j,k in enumerate([0,3,6,9,12,15,18,21]):contact.paste(bgs[k].resize((320,320)),((j%4)*320,(j//4)*320))
contact.save(P/'contact_sheet.jpg')
config={'canvas':[640,640],'fps':24,'duration_seconds':1,'root_anchor_px':[300,550],'scale_fixed':.37,'right_arm_angles_degrees':[-110,8],'angle_note':'rig-relative approximation of video sweep, not measured camera-space degrees','reference_video':'录制_2026_10_29_12_31_53_495.mp4','reference_observation':'right side to left-front above shoulder, about 1 second per cycle after 1.5 seconds','frames':records,'cocos_tested':False,'walk':{'cycle_seconds':1,'phase_offset_degrees':180,'leg_translation_design_px':48,'leg_rotation_degrees':9,'note':'existing leg sprites animated at hip; upper-body swing retained'}}
(P/'animation.json').write_text(json.dumps(config,ensure_ascii=False,indent=2))
(P/'README.txt').write_text("""小猫边走边挥镰刀 V02

新增：左右腿相差半周期交替迈步，腿部轻摆，保留原版上身起伏与挥刀矩阵。
复用所有原图，没有重新生成角色。固定640×640画布、角色比例与根锚点(300,550)。
24张透明PNG；24fps；1秒循环。GIF每帧采用40/50ms组合，总长1秒。
脚步为背面原地步行的分层模拟，场景中需配合草地向下滚动。每周期左右脚各迈一步。
禁止逐帧自动裁切或缩放；Cocos Sprite保持统一尺寸和锚点。
frames/swing_00.png至23.png：带步行的完整角色透明帧。
spritesheet_6x4.png：6列4行图集，每格640×640。
swing_preview.gif：背景合成循环预览；contact_sheet.jpg：关键帧对照。
textures：原有可复用分层。source_parts.json：静态装配配置。
animation.json：逐帧部件变换矩阵及步行参数。build.py：生成脚本。
本版未做Cocos实机验证；脚底滑动需结合地图滚动速度调节播放速度。
""",encoding='utf-8')
buffer=io.BytesIO()
with zipfile.ZipFile(buffer,'w',zipfile.ZIP_DEFLATED) as z:
 for f in sorted(P.rglob('*')):
  if f.is_file():
   data=pngs[int(f.stem.split('_')[-1])] if f.parent.name=='frames' else f.read_bytes()
   z.writestr(str(f.relative_to(P.parent)),data)
with zipfile.ZipFile(io.BytesIO(buffer.getvalue())) as z:assert z.testzip() is None
P.with_suffix('.zip').write_bytes(buffer.getvalue());print('done')
