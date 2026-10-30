from PIL import Image,ImageDraw
from scipy.ndimage import map_coordinates
import numpy as np,math,pathlib,io,zipfile,json,shutil
P=pathlib.Path(__file__).parent
def save(im,p):
 b=io.BytesIO();im.save(b,format='PNG');p.write_bytes(b.getvalue())
im=Image.open('generated_images/exec-1cb1d571-9924-449e-a10f-14ad4323bd87.png').convert('RGBA').resize((512,716),Image.Resampling.LANCZOS)
base=Image.new('RGBA',(512,768));base.alpha_composite(im,(0,20));a=np.array(base);a[:,:,3]=np.clip((a[:,:,3].astype(float)-190)*255/65,0,255).astype('uint8')
save(Image.fromarray(a),P/'source.png')
# Only replace the interior bars, retaining complete guards, axle and handle joints.
a[63:180,138:380,3]=0
yy,xx=np.mgrid[:768,:512];frames=[];previews=[];checks={}
for k in range(24):
 phase=math.tau*k/24;w=np.clip((yy-605)/38,0,1);side=np.where(xx<260,1,-1)
 sy=yy-8*math.sin(phase)*side*w;sx=xx-1.5*math.cos(phase)*side*w
 ar=np.stack([map_coordinates(a[:,:,c],[sy,sx],order=1,mode='constant') for c in range(4)],axis=2).astype('uint8')
 for name,x0,x1 in [('left',69,120),('right',395,443)]:
  y0,y1=220,327;sample=a[y0+(yy-y0+round(107*k/24))%107,xx.clip(x0+6,x1-6)]
  rgb=a[:,:,:3].astype(float);mask=(xx>=x0)&(xx<x1)&(yy>=y0)&(yy<y1)&(rgb.max(2)-rgb.min(2)<40)&(rgb.max(2)<170)&(a[:,:,3]>240)
  wt=mask*np.clip((yy-y0)/8,0,1)*np.clip((y1-yy)/8,0,1)*np.clip((xx-x0)/4,0,1)*np.clip((x1-xx)/4,0,1)
  ar[:,:,:3]=(ar[:,:,:3]*(1-wt[:,:,None])+sample[:,:,:3]*wt[:,:,None]).astype('uint8')
  if k==6:checks[name]=float(np.abs(ar[y0:y1,x0:x1,:3].astype(float)-a[y0:y1,x0:x1,:3]).mean())
 f=Image.fromarray(ar);r=Image.new('RGBA',(1024,1536));d=ImageDraw.Draw(r)
 for dep,ang in sorted((math.cos(j*math.pi/3+phase/3),j*math.pi/3+phase/3) for j in range(6)):
  y=242+108*math.sin(ang);v=int(170+50*dep);d.line((276,y,760,y),fill=(51,62,50),width=10);d.line((276,y-2,760,y-2),fill=(v,v+4,v),width=6);d.line((276,y-3,760,y-3),fill=(min(255,v+30),)*3,width=2)
 f.alpha_composite(r.resize(f.size,Image.Resampling.LANCZOS));save(f,P/f'frames/push_{k:02}.png');frames.append(f)
 bg=Image.new('RGBA',f.size,(227,237,210));bg.alpha_composite(f);previews.append(bg.convert('RGB'))
sheet=Image.new('RGBA',(3072,3072))
for k,f in enumerate(frames):sheet.alpha_composite(f,(k%6*512,k//6*768))
save(sheet,P/'spritesheet_6x4.png');previews[0].save(P/'push_preview.gif',save_all=True,append_images=previews[1:],duration=50,loop=0,optimize=False);previews[6].save(P/'check.jpg')
assert min(checks.values())>2,checks
assert np.array_equal(np.array(frames[0])[397:451],np.array(frames[6])[397:451]),'grip/joints changed'
(P/'animation.json').write_text(json.dumps({'frameSize':[512,768],'frames':24,'fps':20,'duration':1.2,'loop':True,'singleSprite':True,'wheelChecks':checks,'cuttingSpan':[138,380],'rowCenters':[198.5,319.5]},indent=2))
(P/'README.txt').write_text('小猫手推割草机 V02：使用补齐两侧连接套的最新素材制作\n整套动画：512×768，24帧，20fps，1.2秒循环。\n双脚交替运动；两个车轮胎纹滚动；滚筒横杆绕轴旋转。双手、推杆与左右连接套保持固定，不拆分交付。\n导入frames或spritesheet，统一尺寸和锚点；整体缩放。滚筒覆盖两垄：中心x=198.5和319.5，间距121像素。\n检查：两个轮胎区域独立变化，握点与连接套区域逐像素保持一致，全部PNG解码与ZIP校验通过。\n当前为贴图形变与滚筒重绘动画预览，尚未在Cocos实机联调。\n',encoding='utf8')
for p in P.rglob('*.png'):Image.open(p).load()
b=io.BytesIO()
with zipfile.ZipFile(b,'w',zipfile.ZIP_DEFLATED) as z:
 for p in P.rglob('*'):
  if p.is_file():z.writestr(str(p.relative_to(P)),p.read_bytes())
P.with_suffix('.zip').write_bytes(b.getvalue())
with zipfile.ZipFile(P.with_suffix('.zip')) as z:assert z.testzip() is None
print('Verified',checks)
