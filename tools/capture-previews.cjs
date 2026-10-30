// Capture real gameplay for the project README; uses an isolated browser save.
const fs=require('fs'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out='docs/previews',frames='temp/readme-upgrade';fs.mkdirSync(out,{recursive:true});fs.mkdirSync(frames,{recursive:true});let browser;
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE});
 const page=await browser.newPage({viewport:{width:360,height:640}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.env.HARVEST_TEST_URL||'http://127.0.0.1:8093');
 await page.waitForFunction(()=>globalThis.__HARVEST__?.game.homeUI.ready&&__HARVEST__.game.actor.ready&&__HARVEST__.game.field.ready&&__HARVEST__.game.upgradeFX.ready&&__HARVEST__.game.sound.clips.upgrade,null,{timeout:90000});
 const prepare=async(level,upgrade=false)=>{
  await page.evaluate(({level,upgrade})=>{const g=__HARVEST__.game;g.enabled=false;g.upgradeFX.clear();g.clearTransientFeedback();g.model.debugLevel(level);Object.assign(g.model.s,{row:27,distance:27.4,mask:0,coins:upgrade?g.model.cfg.next:0,started:true});g.model.state='Harvesting';g.actor.build(g.model.cfg);g.field.clear();g.advance(0);g.refresh();},{level,upgrade});
  await page.waitForFunction(()=>__HARVEST__.game.actor.ready&&__HARVEST__.game.field.ready&&__HARVEST__.game.field.haystacks.frame,null,{timeout:90000});
  await page.evaluate(()=>{const g=__HARVEST__.game;for(let i=0;i<24;i++)g.update(1/60);g.refresh();});
 };
 for(let level=1;level<=6;level++){
  await prepare(level);await page.screenshot({path:out+'/level-'+level+'.png'});console.log('Captured level '+level);
 }
 await prepare(3,true);await page.evaluate(()=>{const g=__HARVEST__.game;g.model.s.coins=g.model.cfg.next;g.purchase();});await page.waitForFunction(()=>__HARVEST__.game.stagedActor?.ready,null,{timeout:90000});await page.evaluate(()=>__HARVEST__.game.update(0));
 for(let i=0;i<50;i++){if(i)await page.evaluate(()=>__HARVEST__.game.update(.1));await page.screenshot({path:frames+'/frame-'+String(i).padStart(3,'0')+'.png'});}
 assert.equal(await page.evaluate(()=>__HARVEST__.game.actor.level),4);assert.deepEqual(errors,[]);await browser.close();
 execFileSync(process.env.FFMPEG_EXECUTABLE||'ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate','10','-i',frames+'/frame-%03d.png','-filter_complex','[0:v]split[a][b];[a]palettegen=stats_mode=diff:max_colors=96[p];[b][p]paletteuse=dither=bayer:bayer_scale=3','-loop','0',out+'/upgrade.gif'],{stdio:'inherit'});
 console.log('Captured six gameplay images and a real level 3 to 4 upgrade GIF');
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1;});
