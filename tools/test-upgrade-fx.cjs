const fs=require('fs'),assert=require('node:assert/strict'),crypto=require('crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out='docs/verification/upgrade-fx-v01';fs.mkdirSync(out,{recursive:true});let browser;
(async()=>{
 const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
 assert.equal(hash('docs/OrangeCat_Upgrade_FX_V01/upgrade_sound.mp3'),hash('assets/resources/audio/upgrade_v01.mp3'));
 for(let i=0;i<89;i++){const n='upgrade_'+String(i).padStart(3,'0')+'.png';assert.equal(hash('docs/OrangeCat_Upgrade_FX_V01/fx_frames/'+n),hash('assets/resources/upgrade-fx-v01/frames/'+n));}
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE});const page=await browser.newPage({viewport:{width:720,height:1280}}),errors=[],results=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:8093');await page.waitForFunction(()=>globalThis.__HARVEST__?.game.upgradeFX?.ready&&__HARVEST__.game.sound.clips.upgrade&&__HARVEST__.game.actor.ready&&__HARVEST__.game.field.ready&&__HARVEST__.game.homeUI.ready,null,{timeout:90000});
 assert.equal(await page.evaluate(()=>__HARVEST__.model.s.settings.sfx),false);
 await page.mouse.click(360,1192);
 const state=()=>page.evaluate(()=>{const g=__HARVEST__.game,f=g.upgradeFX,a=g.sound.upgrade;return {level:g.model.s.level,actor:g.actor.level,state:g.model.state,coins:g.model.s.coins,income:g.model.s.totalIncome,active:f.active,elapsed:f.elapsed,frame:f.frame,swapped:f.swapped,audio:a.playing,audioTime:a.currentTime,audioDuration:a.duration,loop:a.loop,clip:a.clip?.name,scale:g.actor.root.scale.x,anchorY:g.actor.root.position.y,root:g.upgradeFX.root.active,ready:g.actor.ready};});
 for(let from=1;from<=3;from++){
  await page.evaluate(from=>{const g=__HARVEST__.game;g.enabled=false;g.model.debugLevel(from);g.model.s.started=true;g.model.state='Harvesting';g.model.s.coins=g.model.cfg.next;g.model.s.settings.sfx=from!==2;g.actor.build(g.model.cfg);g.field.clear();g.advance(0);g.refresh();},from);
  await page.waitForFunction(()=>__HARVEST__.game.actor.ready);
  const price=await page.evaluate(()=>__HARVEST__.model.cfg.next);
  await page.evaluate(()=>__HARVEST__.game.purchase());await page.waitForFunction(()=>__HARVEST__.game.stagedActor?.ready,null,{timeout:90000});
  await page.evaluate(()=>__HARVEST__.game.update(0));const start=await state();assert.equal(start.actor,from);assert.equal(start.level,from+1);assert.equal(start.coins,0);assert.equal(start.audio,from!==2);assert(!start.loop);assert(start.audioDuration>4.3&&start.audioDuration<4.6);assert(start.clip.includes('upgrade_v01'));
  await page.evaluate(()=>{const g=__HARVEST__.game;for(let i=0;i<10;i++)g.purchase();g.update(.3);g.update(.27);});const before=await state();assert.equal(before.actor,from);assert(!before.swapped);assert.equal(before.coins,0);assert.equal(before.state,'Upgrading');
  await page.evaluate(()=>__HARVEST__.game.update(.03));const swapped=await state();assert.equal(swapped.actor,from+1);assert(swapped.swapped&&swapped.ready&&swapped.frame===12);assert.equal(swapped.state,'Harvesting');assert(Math.abs(swapped.anchorY+205*(1-swapped.scale))<.0001);await page.screenshot({path:out+'/level-'+(from+1)+'-flash.png'});
  await page.evaluate(()=>__HARVEST__.game.update(.2));const bounce=await state();assert(Math.abs(bounce.scale-1)>.001);assert(Math.abs(bounce.anchorY+205*(1-bounce.scale))<.0001);
  await page.evaluate(()=>{const g=__HARVEST__.game;g.model.pause();g.sound.stop();g.update(.4);});const paused=await state();await page.waitForTimeout(180);await page.evaluate(()=>__HARVEST__.game.update(.5));const frozen=await state();assert.equal(frozen.elapsed,paused.elapsed);assert(!frozen.audio);assert(Math.abs(frozen.audioTime-paused.audioTime)<.03);
  await page.evaluate(()=>{const g=__HARVEST__.game;g.model.start();g.update(1.6);});const second=await state();assert(second.active&&second.frame===48);assert(second.coins>0);assert.equal(second.audio,from!==2);await page.screenshot({path:out+'/level-'+(from+1)+'-stars.png'});
  await page.evaluate(()=>{const g=__HARVEST__.game;g.hide();g.update(.2);g.show();});const hidden=await state();assert.equal(hidden.elapsed,second.elapsed);assert(!hidden.audio);
  await page.evaluate(()=>{const g=__HARVEST__.game;g.model.start();g.update(2.05);});const ended=await state();assert(!ended.active&&!ended.root&&!ended.audio);assert.equal(ended.scale,1);assert(Math.abs(ended.anchorY)<.00001);assert(ended.coins>0);results.push({from,price,start,before,swapped,bounce,paused,second,ended});
 }
 // Insufficient money and maximum tier create no effects or charges.
 await page.evaluate(()=>{const g=__HARVEST__.game;g.purchase();});assert(!(await state()).active);
 await page.evaluate(()=>{const g=__HARVEST__.game;g.model.debugLevel(1);g.model.s.coins=0;g.actor.build(g.model.cfg);g.purchase();});assert.equal(await page.evaluate(()=>__HARVEST__.model.s.level),1);assert(!(await state()).active);
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/results.json',JSON.stringify({date:new Date().toISOString(),checks:'89 original frames and MP3 / three upgrades / .58 flash swap / grounded bounce / 2.4 stars / 4.44 cleanup / tail harvesting / single charge / mute / pause / background',results,errors},null,2));console.log('PASS upgrade FX V01: three tiers, timing, original assets, audio, mute, pause and cleanup');await browser.close();
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1;});
