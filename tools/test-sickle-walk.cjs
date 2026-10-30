const fs=require('fs'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out='docs/verification/sickle-walk-v02';fs.mkdirSync(out,{recursive:true});let browser;
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE});const page=await browser.newPage({viewport:{width:720,height:1280}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 const ready=()=>page.waitForFunction(()=>globalThis.__HARVEST__?.game.homeUI?.ready&&__HARVEST__.game.actor.ready&&__HARVEST__.game.field.ready,null,{timeout:60000});
 await page.goto('http://127.0.0.1:8092');await ready();
 const inspect=()=>page.evaluate(async()=>{const g=__HARVEST__.game,s=g.actor.hybrid.sickle,cc=await System.import('cc'),t=s.root.getComponent(cc.UITransform);return {frame:s.frame,name:s.sprite.spriteFrame.name,frames:s.frames.length,trim:s.sprite.trim,width:t.width,height:t.height,anchor:[t.anchorX,t.anchorY],feetY:g.actor.hybrid.root.position.y,oldVisible:g.actor.hybrid.walkVisual.active||g.actor.hybrid.swingVisual.active,phase:g.model.s.phase,row:g.model.s.row,distance:g.model.s.distance,coins:g.model.s.coins,mask:g.model.s.mask,state:g.model.state,profile:g.model.s.animationProfile};});
 const initial=await inspect();assert.equal(initial.frames,24);assert.equal(initial.width,640*.49);assert.deepEqual(initial.anchor,[300/640,1-550/640]);assert.equal(initial.feetY,-205);assert(!initial.oldVisible&&!initial.trim);await page.screenshot({path:out+'/ready.png'});
 await page.mouse.click(360,1192);await page.evaluate(()=>{const g=__HARVEST__.game;g.enabled=false;g.model.s=g.model.constructor.fresh();g.model.start();g.advance(0);g.refresh();});
 const stages=[];
 for(const [step,name,expectedCoins] of [[.15,'charge',0],[.18,'swing-right',1],[.25,'swing-left',2],[.22,'recover',2]]){
  await page.evaluate(dt=>{const g=__HARVEST__.game;g.advance(dt);g.refresh();},step);await page.waitForTimeout(80);const stage=await inspect();assert.equal(stage.coins,expectedCoins);assert.equal(stage.width,initial.width);assert.equal(stage.feetY,initial.feetY);stages.push(stage);await page.screenshot({path:out+'/'+name+'.png'});
 }
 await page.evaluate(()=>{const g=__HARVEST__.game;g.advance(.62);g.model.pause();g.save();g.refresh();});const paused=await inspect();assert.equal(paused.mask,2);assert.equal(paused.coins,3);await page.waitForTimeout(200);assert.deepEqual(await inspect(),paused);
 await page.reload();await ready();const restored=await inspect();for(const k of ['frame','phase','row','coins','mask','distance'])assert.equal(restored[k],paused[k]);
 await page.evaluate(()=>{const g=__HARVEST__.game;g.enabled=false;g.model.start();g.advance(.58);g.model.pause();g.save();g.refresh();});assert.equal((await inspect()).coins,4);
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);await page.screenshot({path:out+'/mobile-paused.png'});
 const legacy=await page.evaluate(()=>{const s=__HARVEST__.model.snapshot();delete s.animationProfile;return Object.assign(s,{row:7,phase:.8,distance:7.95,mask:3,coins:837});});
 await page.addInitScript(s=>localStorage.setItem('orange-cat.harvest.v2',JSON.stringify(s)),legacy);await page.reload();await ready();
 const before=await inspect();assert.equal(before.distance,7.95);await page.evaluate(()=>{const g=__HARVEST__.game;g.enabled=false;g.model.start();g.advance(.1);});const bridge=await inspect();assert(bridge.distance>=before.distance);assert.equal(bridge.coins,837);
 await page.evaluate(()=>{const g=__HARVEST__.game;g.advance(.1);g.advance(.1);});const nextRow=await inspect();assert.equal(nextRow.row,8);assert(Math.abs(nextRow.distance-8.1)<1e-7);assert.equal(nextRow.profile,'sickle-walk-v02');
 await page.evaluate(()=>{const g=__HARVEST__.game;g.model.pause();g.model.s.coins=120;g.purchase();g.enabled=true;});await page.waitForFunction(()=>__HARVEST__.game.actor.push?.ready&&__HARVEST__.model.state==='Paused',null,{timeout:60000});
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/results.json',JSON.stringify({date:new Date().toISOString(),initial,stages,paused,restored,bridge,nextRow,errors},null,2));console.log(JSON.stringify({checks:'24-frame sickle animation / correct fixed size / real blade hits / pause / reload / legacy progress / upgrade to push mower',errors}));await browser.close();
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1;});
