from PIL import Image,ImageDraw,ImageFilter
import numpy as np, math, pathlib,io,json,zipfile,shutil
P=pathlib.Path(__file__).parent
def savepng(im,p):
 b=io.BytesIO();im.save(b,format='PNG');p.write_bytes(b.getvalue())
im=Image.open('/workspace/scratch/7693e3cef327/generated_images/exec-19eb6f51-a3c7-465a-8c9d-83ce3862ca4c.png').convert('RGBA').resize((768,512),Image.Resampling.LANCZOS)
a=np.array(im); a[:,:,3]=np.clip((a[:,:,3].astype(float)-210)*255/45,0,255).astype('uint8')
keep=Image.new('L',im.size);d=ImageDraw.Draw(keep);d.rectangle((0,165,768,512),fill=255);d.polygon([(329,94),(440,94),(448,108),(472,115),(485,145),(485,170),(281,170),(285,133),(297,115),(323,109)],fill=255)
a[:,:,3]=np.minimum(a[:,:,3],np.array(keep));savepng(Image.fromarray(a),P/'body.png')
yy,xx=np.mgrid[:512,:768]
wheels=[('left_front',250,279,266,350,254,260),('right_front',502,307,515,350,506,511),('left_rear',225,365,253,489,232,245),('right_rear',516,365,541,489,521,533)]
frames=[];preview=[];wheel_history={n:[] for n,*_ in wheels}
for k in range(24):
 t=k/24;phase=2*math.pi*t; ar=a.copy()
 for name,x0,y0,x1,y1,s0,s1 in wheels:
  height=y1-y0; sy=y0+(yy-y0+round(height*t))%height; sx=xx.clip(s0,s1)
  sample=a[sy.clip(0,511),sx];mask=(xx>=x0)&(xx<x1)&(yy>=y0)&(yy<y1)
  color=a[:,:,:3].astype(float); neutral=(color.max(2)-color.min(2)<42)&(color.max(2)<170)
  weight=mask*neutral*np.clip((xx-x0)/3,0,1)*np.clip((x1-xx)/3,0,1)*np.clip((yy-y0)/6,0,1)*np.clip((y1-yy)/6,0,1)*(a[:,:,3]>240)
  ar[:,:,:3]=(ar[:,:,:3]*(1-weight[:,:,None])+sample[:,:,:3]*weight[:,:,None]).astype('uint8')
  wheel_history[name].append(ar[y0:y1,x0:x1,:3].copy())
 reel=Image.new('RGBA',(1536,1024));dr=ImageDraw.Draw(reel)
 for x in [76,170,270,384,495,593,691]:
  dr.ellipse((2*x-22,34,2*x+22,306),outline=(42,112,15,255),width=14)
 for dep,ang in sorted((math.cos(j*math.pi/3+phase/3),j*math.pi/3+phase/3) for j in range(6)):
  y=170+125*math.sin(ang);dx=12*math.cos(ang);c=int(165+45*dep)
  dr.line((152+dx,y,1382+dx,y),fill=(53,68,57,255),width=15)
  dr.line((152+dx,y-2,1382+dx,y-2),fill=(c,c+5,c,255),width=9)
  dr.line((152+dx,y-4,1382+dx,y-4),fill=(min(255,c+35),)*3+(255,),width=3)
 for x in [76,170,270,384,495,593,691]:dr.arc((2*x-22,34,2*x+22,306),-90,90,fill=(115,212,34,255),width=10)
 reel=reel.resize((768,512),Image.Resampling.LANCZOS);reel.alpha_composite(Image.fromarray(ar))
 canvas=Image.new('RGBA',(768,640));dy=round(math.sin(phase*2));canvas.alpha_composite(reel,(0,95+dy))
 smoke=Image.new('RGBA',canvas.size);sd=ImageDraw.Draw(smoke)
 for j in range(4):
  age=(t+j/4)%1;r=4+20*age;x=498+61*age;y=460-128*age;opacity=round(205*math.sin(math.pi*age)**.7)
  for ox,oy,sc in [(0,0,1),(-.5,.1,.7),(.45,0,.7),(0,-.5,.7)]:sd.ellipse((x+ox*r-r*sc,y+oy*r-r*sc,x+ox*r+r*sc,y+oy*r+r*sc),fill=(255,249,231,opacity))
 canvas.alpha_composite(smoke.filter(ImageFilter.GaussianBlur(.8)));savepng(canvas,P/f'frames/combine_{k:02}.png');frames.append(canvas)
 bg=Image.new('RGBA',canvas.size,(229,238,211,255));bg.alpha_composite(canvas);preview.append(bg.convert('RGB'))
sheet=Image.new('RGBA',(4608,2560))
for k,f in enumerate(frames):sheet.alpha_composite(f,(k%6*768,k//6*640))
savepng(sheet,P/'spritesheet_6x4.png');preview[0].save(P/'combine_preview.gif',save_all=True,append_images=preview[1:],duration=50,loop=0,optimize=False)
checks={}
for n,ls in wheel_history.items():
 arr=np.array(ls,dtype=float);diff=np.abs(arr-np.roll(arr,1,axis=0)).mean((1,2,3));assert diff.min()>1,(n,diff)
 checks[n]={'minimumFrameChange':float(diff.min()),'averageFrameChange':float(diff.mean())}
(P/'validation.json').write_text(json.dumps(checks,indent=2));print(checks)
(P/'animation.json').write_text(json.dumps({'frameSize':[768,640],'frameCount':24,'fps':20,'duration':1.2,'loop':True,'exhaustOrigin':[498,460],'wheelRegions':[list(w) for w in wheels],'reelAxis':{'center':[384,180],'radiusY':62.5,'bars':6,'degreesPerLoop':120}},indent=2))
(P/'README.txt').write_text('第四级联合收割机动画预览 V01\n24帧，20fps，1.2秒循环；透明PNG均为768×640。\n四个轮胎分别滚动纹路；前滚筒六根横杆绕轴循环；排气管持续冒白烟；整车与驾驶舱小猫轻微颠动。\n四轮逐帧区域差异检查记录在validation.json。\nGIF用于预览；frames透明序列和spritesheet供Cocos导入。保持统一尺寸与锚点，勿逐帧自动裁切。\n车轮使用胎面纹理滚动模拟，滚筒为重绘动画层，与静态参考细节略有不同。尚未在Cocos联调，当前为动画预览资源。\n复用：沿用第三级四轮累积绘制方法、烟雾循环方法；新增：联合收割机车身、驾驶舱、粮仓、卸粮管素材与动画帧。\n',encoding='utf8')
shutil.copy('/workspace/scratch/7693e3cef327/generated_images/exec-bc728c04-336c-426e-8352-56d9436e7529.png',P/'UI_reference.png')
for p in P.rglob('*.png'):Image.open(p).load()
buf=io.BytesIO()
with zipfile.ZipFile(buf,'w',zipfile.ZIP_DEFLATED) as z:
 for p in P.rglob('*'):
  if p.is_file():z.writestr(str(p.relative_to(P)),p.read_bytes())
P.with_suffix('.zip').write_bytes(buf.getvalue())
with zipfile.ZipFile(P.with_suffix('.zip')) as z:assert z.testzip() is None
print('ZIP verified')
