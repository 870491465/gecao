from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np
from scipy.ndimage import map_coordinates
import math,json,zipfile,io,os
def safe_save(im,path):
 b=io.BytesIO();im.save(b,format="PNG");tmp=Path(str(path)+".tmp");tmp.write_bytes(b.getvalue());os.replace(tmp,path)
P=Path(__file__).resolve().parent
source=Path('/workspace/scratch/7693e3cef327/generated_images/exec-17eb060e-2401-4554-974c-74267e88f290.png')
if not (P/'source.png').exists():
 im=Image.open(source).convert('RGBA'); a=np.array(im);a[:,:,3]=np.clip((a[:,:,3].astype(float)-210)*255/35,0,255).astype('uint8');Image.fromarray(a).resize((512,768),Image.Resampling.LANCZOS).save(P/'source.png')
im=Image.open(P/'source.png').convert('RGBA');a=np.asarray(im).astype(float);h,w=a.shape[:2]; yy,xx=np.mgrid[:h,:w];frames=[];rgba=[]
# Premultiplied alpha prevents colored fringes during sampling.
a[:,:,:3]*=a[:,:,3:4]/255
def render_reel(k):
 S=3
 layer=Image.new('RGBA',(512*S,768*S));d=ImageDraw.Draw(layer)
 def line(points,color,width):d.line([(round(x*S),round(y*S)) for x,y in points],fill=color,width=round(width*S))
 def ellipse(box,color,width):d.ellipse(tuple(round(v*S) for v in box),outline=color,width=round(width*S))
 cx1,cx2,cy,ry,rx=141,377,94,38,7
 phase=2*math.pi*k/72
 # Six crossbars orbit the horizontal axle, depth-sorted.
 bars=sorted([(math.cos(phase+i*math.pi/3),phase+i*math.pi/3) for i in range(6)])
 for depth,theta in bars:
  y=cy+ry*math.sin(theta);xoff=rx*math.cos(theta)
  light=int(140+55*(depth+1)/2)
  line([(cx1+xoff,y),(cx2+xoff,y)],(48,64,47,255),5)
  line([(cx1+xoff,y-0.5),(cx2+xoff,y-0.5)],(light,light+4,min(255,light+9),255),3)
  line([(cx1+xoff,y-1),(cx2+xoff,y-1)],(min(255,light+42),min(255,light+45),min(255,light+46),255),.8)
 # Open side rings and spokes rotate with the cage; external fixed guards remain.
 for cx in [cx1,cx2]:
  ellipse((cx-rx,cy-ry,cx+rx,cy+ry),(99,132,56,255),2)
  for i in range(3):
   theta=phase+i*2*math.pi/3
   line([(cx,cy),(cx+rx*math.cos(theta),cy+ry*math.sin(theta))],(104,137,57,255),2)
  ellipse((cx-3,cy-4,cx+3,cy+4),(187,196,169,255),2)
 return layer.resize((512,768),Image.Resampling.LANCZOS)
for k in range(24):
 t=2*math.pi*k/24
 body=np.clip((yy-335)/210,0,1)*np.clip((720-yy)/100,0,1)
 dx=2.5*math.sin(t)*body;dy=1.6*(1-math.cos(2*t))*body
 feet=np.clip((yy-595)/65,0,1)
 left=np.exp(-((xx-160)/75)**4);right=np.exp(-((xx-338)/75)**4)
 dy+=feet*(left*7*math.sin(t)-right*7*math.sin(t));dx+=feet*(left-right)*1.5*math.cos(t)
 tail=np.exp(-((xx-90)/70)**2-((yy-560)/70)**2);dy+=tail*2.5*math.sin(t+.5)
 # Lock the mower, handle and both gripping paws pixel-for-pixel.
 dx[yy<330]=0;dy[yy<330]=0
 o=np.stack([map_coordinates(a[:,:,c],[yy-dy,xx-dx],order=1,mode='constant',cval=0) for c in range(4)],axis=-1)
 o[:,:,:3]=np.divide(o[:,:,:3]*255,o[:,:,3:4],out=np.zeros_like(o[:,:,:3]),where=o[:,:,3:4]>0)
 # Rotate each tire in its own foreshortened ellipse, keeping axle position fixed.
 wheel_phase=2*math.pi*k/24
 base=np.array(im).astype(float)
 for cx,cy,rx,ry in [(108,226,19,53),(411,225,20,54)]:
  # Scroll only the dark rubber tread; preserve rims and the full silhouette.
  sample_y=cy-46+np.mod(yy-(cy-46)+92*k/24,92)
  rotated=np.stack([map_coordinates(base[:,:,c],[sample_y,xx],order=1,mode='nearest') for c in range(4)],axis=-1)
  mask=np.clip((rx-abs(xx-cx)-2)/5,0,1)*np.clip((48-abs(yy-cy))/10,0,1)
  gray=base[:,:,:3].max(axis=2)-base[:,:,:3].min(axis=2)
  target_gray=rotated[:,:,:3].max(axis=2)-rotated[:,:,:3].min(axis=2)
  mask*=((gray<40)&(target_gray<40)&(base[:,:,:3].mean(axis=2)<170)&(rotated[:,:,:3].mean(axis=2)<170))
  mask*=base[:,:,3]/255
  o[:,:,:3]=o[:,:,:3]*(1-mask[:,:,None])+rotated[:,:,:3]*mask[:,:,None]
 out=Image.fromarray(np.clip(o,0,255).astype('uint8'))
 # Replace original static cage interior, preserving engine and external side guards.
 out.paste((0,0,0,0),(133,52,386,132))
 reel=render_reel(k);safe_save(reel,P/f'reel_frames/reel_{k:02}.png')
 out.alpha_composite(reel)
 safe_save(out,P/f'frames/push_{k:02}.png');rgba.append(out)
 bg=Image.new('RGBA',(512,768),'#dce5cd');bg.alpha_composite(out);frames.append(bg.convert('RGB'))
frames[0].save(P/'walk_preview.gif',save_all=True,append_images=frames[1:],duration=50,loop=0)
sheet=Image.new('RGBA',(512*6,768*4))
for k in range(24):sheet.alpha_composite(rgba[k],((k%6)*512,(k//6)*768))
sheet.save(P/'spritesheet_6x4.png')
contact=Image.new('RGB',(1024,768),'#dce5cd')
for j,k in enumerate([0,3,6,9,12,15,18,21]):contact.paste(frames[k].resize((256,384)),((j%4)*256,(j//4)*384))
contact.save(P/'contact_sheet.jpg')
checks={'frame_size':[512,768],'frames':24,'fps':20,'duration_seconds':1.2,'scale_is_constant':True,'grip_and_engine_pixels_unchanged':all(np.array_equal(np.array(rgba[k])[150:330,140:380],np.array(rgba[0])[150:330,140:380]) for k in range(24)),'method':'single-source local deformation; not separately redrawn poses','engine_tested':False}
(P/'animation.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2))
checks['reel']={'axis':'horizontal','bar_count':6,'degrees_per_frame':5,'degrees_per_cycle':120,'full_turn_seconds':3.6,'loop_symmetry_degrees':60,'center_y':94,'radius_y':38}
checks['wheels']={'centers':[[108,226],[411,225]],'turn_seconds':1.2,'axles_fixed':True,'method':'rubber tread scrolling with fixed rims and silhouette'}
checks['reel_pixels_change']=not np.array_equal(np.array(rgba[0])[52:132],np.array(rgba[6])[52:132])
(P/'animation.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2))
(P/'README.txt').write_text('橘猫手推割草机 V03：车轮与滚筒联动版\n\nwalk_preview.gif：小猫步行动作＋前滚筒旋转＋左右车轮胎纹滚动。\nframes：24张512×768透明整帧，20fps，1.2秒无缝循环。所有帧画布/比例/根位置固定。\nreel_frames：对应的24张独立透明滚筒层，同尺寸、同位置，可单独播放。\n滚筒为横轴转动的六根横杆，按圆周投影上下运行，保留镂空间隙；非整体贴图平面旋转。左右车轮沿轮面循环移动胎纹，固定轮毂与外轮廓，轮轴固定，一圈1.2秒；外侧护架、发动机、推杆与握爪固定。每帧5度，一圈3.6秒；六杆60度对称，1.2秒循环转120度恰好接续。\nCocos：整帧或独立滚筒层二选一，不要叠加重复滚筒。透明整帧保持固定画布，关闭逐帧自动裁边造成的偏移。\n角色继续沿用V01轻步形变；滚筒是程序绘制的简化动画层，与原画金属细节有差异。未做Cocos实机验证。\nbuild.py可复建，需要Pillow、NumPy、SciPy。\n',encoding='utf-8')
print(checks)
buffer=io.BytesIO()
with zipfile.ZipFile(buffer,'w',zipfile.ZIP_DEFLATED) as z:
 for f in sorted(P.rglob('*')):
  if f.is_file():z.write(f,f.relative_to(P.parent))

with zipfile.ZipFile(io.BytesIO(buffer.getvalue())) as z:assert z.testzip() is None
P.with_suffix('.zip').write_bytes(buffer.getvalue())
