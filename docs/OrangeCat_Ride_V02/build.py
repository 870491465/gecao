from PIL import Image, ImageDraw, ImageFilter
import numpy as np, math, io, json, zipfile, pathlib, shutil
P=pathlib.Path(__file__).parent
src=pathlib.Path('/workspace/scratch/7693e3cef327/generated_images/exec-a004c41a-0f4b-42d4-9099-d4a7b6d2ee5e.png')
a=np.array(Image.open(src).convert('RGBA')); a[:,:,3]=np.clip((a[:,:,3].astype(float)-210)*255/45,0,255).astype('uint8')
H,W=a.shape[:2]; yy,xx=np.mgrid[:H,:W]
# Remove static reel. Keep seated cat and steering wheel in foreground.
keep=Image.new('L',(W,H)); d=ImageDraw.Draw(keep)
d.rectangle((0,430,W,H),fill=255)
d.polygon([(680,195),(860,195),(880,270),(950,290),(950,440),(585,440),(585,310),(650,280)],fill=255)
a[:,:,3]=np.minimum(a[:,:,3],np.array(keep))
a[(yy<280)&~((a[:,:,0].astype(float)>a[:,:,1]*1.1)&(a[:,:,0].astype(float)>a[:,:,2]*1.5)),3]=0
body=Image.fromarray(a); body.save(P/'body.png')
N=24; frames=[]; previews=[]; metrics=[]
def png(im):
 b=io.BytesIO(); im.save(b,format='PNG'); return b.getvalue()
files={}
for k in range(N):
 t=k/N; phase=2*math.pi*t
 # Roll tread texture on visible rubber surfaces, preserving wheel silhouettes.
 ar=a.copy()
 for cx,cy,rx,ry in [(500,812,74,145),(1036,812,70,145),(512,567,35,88),(1024,567,34,88)]:
  m=(np.abs(xx-cx)<rx)&(np.abs(yy-cy)<ry)
  sy=(cy-ry+(yy-(cy-ry)+int(2*ry*t))%(2*ry)).clip(0,H-1)
  if cx==1036:
   m=m&(xx>1040); sx=xx.clip(1042,1080)
  elif cx==500:
   m=m&(xx<540); sx=xx.clip(452,520)
  elif cx==512:
   sx=xx.clip(492,518)
  else:
   sx=xx.clip(1019,1038)
  sm=a[sy,sx]; rgb=a[:,:,:3].astype(float)
  neutral=(rgb.max(2)-rgb.min(2)<45)&(rgb.max(2)<180)&(sm[:,:,:3].max(2)-sm[:,:,:3].min(2)<45)
  weight=np.clip((1-np.abs(xx-cx)/rx)*5,0,1)*np.clip((1-np.abs(yy-cy)/ry)*7,0,1)*m*neutral*(a[:,:,3]>220)*(sm[:,:,3]>220)
  ar[:,:,:3]=(ar[:,:,:3].astype(float)*(1-weight[:,:,None])+sm[:,:,:3]*weight[:,:,None]).astype('uint8')
 if k==6:
  checks={}
  for name,(x0,y0,x1,y1) in {'left_front':(488,510,524,630),'right_front':(1014,510,1040,630),'left_rear':(450,720,530,900),'right_rear':(1040,755,1080,900)}.items():
   diff=np.abs(ar[y0:y1,x0:x1,:3].astype(float)-a[y0:y1,x0:x1,:3].astype(float))
   checks[name]={'meanPixelChange':round(float(diff.mean()),3),'changedPixels':int((diff.max(2)>5).sum())}
   assert diff.mean()>2, (name,diff.mean())
  (P/'wheel_motion_checks.json').write_text(json.dumps(checks,indent=2))
  print('Four-wheel checks:',checks,flush=True)
 reel=Image.new('RGBA',(W,H)); dr=ImageDraw.Draw(reel)
 for x in [90,485,1045,1430]:
  dr.ellipse((x-33,95,x+33,425),fill=(55,132,22,255),outline=(22,80,16,255),width=7)
  dr.ellipse((x-21,110,x+21,410),fill=(0,0,0,0),outline=(132,215,51,255),width=9)
 # Six spaced bars travel around the horizontal axis, sorted by depth.
 bars=sorted([(math.cos(j*math.pi/3+phase/3),j*math.pi/3+phase/3) for j in range(6)])
 for dep,ang in bars:
  y=260+148*math.sin(ang); dx=22*math.cos(ang); shade=int(145+50*dep)
  dr.line((90+dx,y,1430+dx,y),fill=(55,66,56,255),width=20)
  dr.line((90+dx,y-3,1430+dx,y-3),fill=(shade,shade+5,shade,255),width=12)
  dr.line((90+dx,y-6,1430+dx,y-6),fill=(min(255,shade+47),)*3+(255,),width=3)
 for x in [90,485,1045,1430]:
  dr.arc((x-33,95,x+33,425),-90,90,fill=(117,215,36,255),width=15)
 reel.alpha_composite(Image.fromarray(ar))
 canvas=Image.new('RGBA',(768,640)); dy=round(1.5*math.sin(phase*2))
 canvas.alpha_composite(reel.resize((692,461),Image.Resampling.LANCZOS),(38,140+dy))
 smoke=Image.new('RGBA',canvas.size); sd=ImageDraw.Draw(smoke)
 for j in range(4):
  age=(t+j/4)%1; opacity=int(195*math.sin(math.pi*age)**.6); r=5+20*age
  x=493+72*age+5*math.sin(age*6); y=460-155*age
  for ox,oy,sc in [(0,0,1),(-.55,.12,.68),(.5,.05,.7),(0,-.5,.68)]:
   sd.ellipse((x+ox*r-r*sc,y+oy*r-r*sc,x+ox*r+r*sc,y+oy*r+r*sc),fill=(255,249,230,opacity))
 canvas.alpha_composite(smoke.filter(ImageFilter.GaussianBlur(.8)))
 files[f'frames/ride_{k:02}.png']=png(canvas); frames.append(canvas)
 bg=Image.new('RGBA',canvas.size,(231,239,210,255)); bg.alpha_composite(canvas); previews.append(bg.convert('RGB'))
sheet=Image.new('RGBA',(768*6,640*4))
for k,f in enumerate(frames): sheet.alpha_composite(f,(k%6*768,k//6*640))
files['spritesheet_6x4.png']=png(sheet)
for name,data in files.items(): (P/name).write_bytes(data)
previews[0].save(P/'ride_preview.gif',save_all=True,append_images=previews[1:],duration=50,loop=0,optimize=False)
contact=Image.new('RGB',(768,640))
for n,k in enumerate([0,4,8,12,16,20]): contact.paste(previews[k].resize((256,320)),(n%3*256,n//3*320))
contact.save(P/'contact.jpg')
config={'frameSize':[768,640],'frames':24,'fps':20,'durationSeconds':1.2,'loop':True,'anchorNormalized':[.5,.94],'reel':{'bars':6,'rotationPerLoopDegrees':120},'exhaustOrigin':[493,460],'type':'2D composited animation preview','notes':'Wheel tread scroll simulates rolling; reel redrawn with depth-sorted bars. Fixed scale; 1.5px vehicle vibration. Not engine tested.'}
(P/'animation.json').write_text(json.dumps(config,ensure_ascii=False,indent=2))
(P/'README.txt').write_text('第三级骑乘收割机动画预览 V02（四轮修复）\n24帧，20fps，1.2秒循环。每帧768×640，透明PNG。\n修复：前一版每绘制一个车轮会覆盖此前车轮的动画，本版改为依次累积四个车轮的变化。\n车轮：四处可见胎面纹路循环滚动，保持轮廓不变。\n滚筒：六根横杆绕水平轴转动，使用独立重绘滚筒，造型与参考略有差异。\n烟雾：连续出生、上升、变大、淡出。车体与猫一起轻微震动，双爪握住方向盘。\nGIF为浅绿色背景预览，透明帧和图集供Cocos导入。场景UI仅供参考。\n已检查帧尺寸、PNG解码、运动区域变化及循环边界差异；尚未在Cocos实际联调，不作为已验收正式资源。\n',encoding='utf8')
shutil.copy('/workspace/scratch/7693e3cef327/generated_images/exec-ac469a71-1c6a-4bb4-8423-f86e4f53a1ed.png',P/'UI_reference.png')
for p in P.rglob('*.png'): Image.open(p).load()
arr=np.array(previews,dtype=float); dif=np.abs(arr-np.roll(arr,1,axis=0)).mean((1,2,3)); print('frame changes',dif.round(3).tolist())
buff=io.BytesIO()
with zipfile.ZipFile(buff,'w',zipfile.ZIP_DEFLATED) as z:
 for p in sorted(P.rglob('*')):
  if p.is_file():z.writestr(str(p.relative_to(P)),p.read_bytes())
out=P.with_suffix('.zip');out.write_bytes(buff.getvalue())
with zipfile.ZipFile(out) as z: assert z.testzip() is None
print(out, out.stat().st_size)
