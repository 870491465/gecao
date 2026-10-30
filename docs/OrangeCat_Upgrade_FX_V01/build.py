from PIL import Image,ImageDraw,ImageFont,ImageFilter
import numpy as np,math,pathlib,io,json,subprocess,shutil,zipfile
P=pathlib.Path(__file__).parent;dur=4.44
def save(im,p):
 b=io.BytesIO();im.save(b,format='PNG');p.write_bytes(b.getvalue())
def asset(path):
 im=Image.open(path).convert('RGBA');a=np.array(im);a[:,:,3]=np.clip((a[:,:,3].astype(float)-210)*255/45,0,255).astype('uint8');im=Image.fromarray(a);return im.crop(im.getbbox())
old=asset('generated_images/exec-a004c41a-0f4b-42d4-9099-d4a7b6d2ee5e.png');new=asset('generated_images/exec-19eb6f51-a3c7-465a-8c9d-83ce3862ca4c.png')
save(old,P/'before.png');save(new,P/'after.png')
font='/usr/share/fonts/truetype/noto/NotoSansCJKsc-Regular.otf';f=ImageFont.truetype(font,33);small=ImageFont.truetype(font,21)
rng=np.random.default_rng(27);particles=[(rng.uniform(0,math.tau),rng.uniform(75,205),rng.uniform(4,10),rng.uniform(0,.22)) for _ in range(32)]
def star(d,x,y,r,col):d.polygon([(x,y-r),(x+r*.25,y-r*.25),(x+r,y),(x+r*.25,y+r*.25),(x,y+r),(x-r*.25,y+r*.25),(x-r,y),(x-r*.25,y-r*.25)],fill=col)
def fx(t):
 im=Image.new('RGBA',(512,512));d=ImageDraw.Draw(im)
 if t<.58:
  p=t/.58
  for j in range(12):
   ang=j*math.tau/12+t*2;r=195-110*p;star(d,256+math.cos(ang)*r,256+math.sin(ang)*r,3+4*p,(255,227,107,round(230*p)))
 for origin,power in [(.58,1),(2.4,.65)]:
  age=t-origin
  if 0<=age<1.65:
   p=age/1.65
   for off in [0,.12]:
    q=max(0,p-off);r=35+220*q;al=round(210*(1-q)**2*power)
    d.ellipse((256-r,256-r*.48+70,256+r,256+r*.48+70),outline=(255,212,74,al),width=max(1,round(8*(1-q))))
   for ang,speed,size,delay in particles:
    q=max(0,age-delay);r=25+speed*q/(1+q*.5);alpha=round(255*max(0,1-q/1.4)*power)
    star(d,256+math.cos(ang)*r,256+math.sin(ang)*r-q*20,size*(1-q/2),(255,224,117,alpha))
   flash=max(0,1-age/.19)
   if flash:
    glow=Image.new('RGBA',im.size);gd=ImageDraw.Draw(glow);gd.ellipse((115,115,397,397),fill=(255,244,185,round(240*flash)));im.alpha_composite(glow.filter(ImageFilter.GaussianBlur(24)))
 return im
for k in range(89):save(fx(k/20),P/f'fx_frames/upgrade_{k:03}.png')
bg=Image.new('RGB',(540,960));a=np.zeros((960,540,3),dtype=np.uint8)
for y in range(960):a[y,:,:]=[int(231-35*y/960),int(242-29*y/960),int(202-42*y/960)]
bg=Image.fromarray(a).convert('RGBA');bd=ImageDraw.Draw(bg)
bd.rounded_rectangle((24,25,516,120),radius=28,fill=(255,249,230),outline=(223,195,125),width=3);bd.text((270,70),'装备升级',font=f,fill=(111,69,30),anchor='mm')
for x in [95,270,445]:
 for y in range(165,900,65):
  bd.line((x,y,x,y-16),fill=(139,177,86),width=4);bd.line((x,y,x-8,y-11),fill=(155,188,98),width=4)
cmd=['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s','540x960','-r','30','-i','-','-an','-c:v','libx264','-pix_fmt','yuv420p','-crf','19',str(P/'silent.mp4')]
proc=subprocess.Popen(cmd,stdin=subprocess.PIPE);gif=[]
for k in range(134):
 t=k/30;im=bg.copy();dr=ImageDraw.Draw(im);dr.ellipse((160,639,380,680),fill=(111,139,69,75))
 if t<.58:s=1-.07*(t/.58)**2;vehicle=old
 else:
  age=t-.58;s=1+.16*math.exp(-age*5)*math.sin(age*15);vehicle=new
 w=round(480*s);h=round(vehicle.height*w/vehicle.width);im.alpha_composite(vehicle.resize((w,h),Image.Resampling.LANCZOS),((540-w)//2,660-h))
 im.alpha_composite(fx(t),(14,220))
 if t>=.58:
  d=ImageDraw.Draw(im);d.rounded_rectangle((112,166,428,236),radius=24,fill=(255,247,214),outline=(239,194,56),width=3);d.text((270,200),'升级成功！',font=f,anchor='mm',fill=(141,83,20))
 d=ImageDraw.Draw(im);d.rounded_rectangle((42,745,498,857),radius=25,fill=(255,249,230),outline=(217,194,132),width=2)
 d.text((270,780),'Lv.3 骑乘收割机  →  Lv.4',font=small,anchor='mm',fill=(126,104,72));d.text((270,823),'联合收割机' if t>=.58 else '骑乘收割机',font=f,anchor='mm',fill=(93,113,42))
 proc.stdin.write(im.convert('RGB').tobytes())
 if k%2==0:gif.append(im.convert('RGB').resize((360,640)))
proc.stdin.close();assert proc.wait()==0
sound=pathlib.Path('upload/One Short Equipment Upgrade Success Sound For A Cozy Cute Cat Farming Game. A....mp3');shutil.copy(sound,P/'upgrade_sound.mp3')
subprocess.run(['ffmpeg','-v','error','-y','-i',str(P/'silent.mp4'),'-i',str(sound),'-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-t','4.44','-movflags','+faststart',str(P/'upgrade_with_sound.mp4')],check=True);(P/'silent.mp4').unlink()
gif[0].save(P/'upgrade_preview.gif',save_all=True,append_images=gif[1:],duration=67,loop=0)
timeline={'duration':4.44,'fxCanvas':[512,512],'fxFps':20,'frameCount':89,'events':[{'time':0,'event':'play sound; gather gold particles'},{'time':.58,'event':'swap equipment during flash'},{'time':.58,'event':'new equipment scale bounce starts'},{'time':2.4,'event':'second gold ring and star burst'},{'time':4.44,'event':'remove FX; leave new equipment'}]}
(P/'timeline.json').write_text(json.dumps(timeline,ensure_ascii=False,indent=2));(P/'README.txt').write_text('橘猫割草记 升级动画 V01\n音效原长4.44秒，依据音量包络重音设计：0—0.58秒金光聚拢；0.58秒闪光时切换新设备；随后轻弹落定；2.40秒追加星光；尾音结束清理特效。\nupgrade_with_sound.mp4为带音效预览；GIF无声音。\nfx_frames为89帧512×512透明特效，20fps播放；同一套特效可用于各级升级，替换before/after对应设备即可。\nCocos：原音效从0秒播放；0.58秒切换设备；固定设备底部锚点；特效中心对齐设备中心，保留足够边距；禁止循环播放升级特效。设备切换后即可恢复收割，尾部粒子可继续播放。\n预览使用静态设备展示升级时机，不包含设备本身的轮胎与收割滚筒循环。已检查文件与时间点，未进行Cocos实机联调。\n',encoding='utf8')
for p in P.rglob('*.png'):Image.open(p).load()
b=io.BytesIO()
with zipfile.ZipFile(b,'w',zipfile.ZIP_DEFLATED) as z:
 for p in P.rglob('*'):
  if p.is_file():z.writestr(str(p.relative_to(P)),p.read_bytes())
P.with_suffix('.zip').write_bytes(b.getvalue())
with zipfile.ZipFile(P.with_suffix('.zip')) as z:assert z.testzip() is None
print('Done',P.with_suffix('.zip'))
