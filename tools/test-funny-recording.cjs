const fs=require('fs'),assert=require('node:assert/strict');const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out='docs/verification/funny-recording';fs.mkdirSync(out,{recursive:true});let browser;
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE});const page=await browser.newPage({viewport:{width:720,height:1280}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const ready=()=>page.waitForFunction(()=>globalThis.__HARVEST__?.game.actor.ready&&__HARVEST__.game.field.ready&&__HARVEST__.game.homeUI.ready,null,{timeout:60000});
 await page.goto('http://127.0.0.1:8093');await ready();
 await page.evaluate(()=>{const g=__HARVEST__.game;g.enabled=false;g.model.debugLevel(3);Object.assign(g.model.s,{coins:9876,started:true,row:7,distance:7.4,phase:0,mask:0,resume:'Harvesting'});g.actor.build(g.model.cfg);g.save();});await page.waitForFunction(()=>__HARVEST__.game.actor.ready);
 const original=await page.evaluate(()=>JSON.parse(localStorage.getItem('orange-cat.harvest.v2')));
 await page.goto('http://127.0.0.1:8093/?funny=1');await ready();
 const inspect=()=>page.evaluate(()=>{const g=__HARVEST__.game,s=g.actor.hybrid?.sickle;return {mode:g.funnyRecording,time:g.funnyTime,level:g.model.s.level,coins:g.model.s.coins,row:g.model.s.row,distance:g.model.s.distance,state:g.model.state,x:g.actor.root.position.x,y:g.actor.root.position.y,angle:g.actor.root.angle,scale:g.actor.root.scale.x,frame:s?.frame,backupLevel:g.recordingBackup?.s.level,hint:g.upgradeView.active,settings:g.model.s.settings};});
 const entry=await inspect();assert(entry.mode&&entry.level===1&&entry.state==='Ready');assert.equal(entry.backupLevel,3);assert.equal(entry.x,0);
 await page.mouse.click(360,1192);await page.waitForFunction(()=>__HARVEST__.model.state==='Harvesting');await page.evaluate(()=>__HARVEST__.game.enabled=false);
 const frames=[];
 for(let second=0;second<=12;second++){
  if(second)await page.evaluate(()=>{const g=__HARVEST__.game;for(let i=0;i<10;i++)g.advance(.1);g.refresh();});
  if([0,4,8,12].includes(second)){frames.push(await inspect());await page.screenshot({path:out+'/second-'+second+'.png'});}
 }
 assert(frames[1].x>0&&frames[2].x>frames[1].x&&frames[3].x===270);assert(frames[3].y===70&&frames[3].angle===-12);assert(frames[3].x>212/2+90);assert(!frames[3].hint);
 const late=await inspect();await page.evaluate(()=>__HARVEST__.game.advance(.23));const swinging=await inspect();assert.notEqual(swinging.frame,late.frame);assert.equal(swinging.x,270);
 await page.evaluate(()=>__HARVEST__.game.save());assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('orange-cat.harvest.v2'))),original);
 await page.evaluate(()=>{const g=__HARVEST__.game;g.model.pause();g.advance(0);});const paused=await inspect();await page.evaluate(()=>__HARVEST__.game.advance(.7));assert.deepEqual(await inspect(),paused);
 await page.evaluate(()=>{const g=__HARVEST__.game;g.hide();g.show();g.advance(.6);});assert.equal((await inspect()).time,paused.time);
 await page.evaluate(()=>__HARVEST__.game.enabled=true);await page.mouse.click(661,61);await page.mouse.click(360,757);await page.waitForFunction(()=>!__HARVEST__.game.funnyRecording&&__HARVEST__.game.actor.ride?.ready,null,{timeout:60000});const restored=await inspect();assert.equal(restored.level,3);assert.equal(restored.coins,9876);assert.equal(restored.distance,7.4);assert.equal(restored.x,0);assert.equal(restored.y,0);assert.equal(restored.angle,0);assert.equal(restored.scale,1);assert(!page.url().includes('funny=1'));await page.screenshot({path:out+'/restored.png'});
 await page.reload();await ready();const reloaded=await inspect();assert(!reloaded.mode&&reloaded.level===3&&reloaded.coins===9876&&reloaded.distance===7.4);
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/results.json',JSON.stringify({checks:'isolated first-level recording / gradual diagonal drift / outside field still swinging / frozen pause and background / unchanged real save / settings restores level and progress / reload normal',entry,frames,swinging,paused,restored,reloaded,errors},null,2));console.log('PASS funny recording, diagonal walk and complete normal-mode restore');await browser.close();
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1;});
