const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.COCOS_PREVIEW||'http://localhost:7456/';
const out='docs/verification/cat-parts-v01';fs.mkdirSync(out,{recursive:true});
let activeBrowser;
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE});
 activeBrowser=browser;const context=await browser.newContext({viewport:{width:720,height:1280}});const p=await context.newPage(),errors=[];
 p.on('pageerror',e=>{errors.push(e.stack||String(e));console.log('RUNTIME ERROR',e.stack||String(e));});p.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text());});
 await p.goto(base+'?scene=f8a7937e-6da3-43a5-8206-57251ab0ced6');
 if(process.env.COCOS_BUILT){await p.waitForFunction(()=>globalThis.__HARVEST__);await p.evaluate(async()=>{const cc=await System.import('cc');await new Promise((resolve,reject)=>cc.director.loadScene('CatPartsLab',e=>e?reject(e):resolve()));});}
 await p.waitForFunction(()=>globalThis.__CAT_PARTS_LAB__?.rig.ready,{timeout:60000});
 if(!process.env.COCOS_BUILT){await p.locator('#view-select .view-select').click();await p.locator('li[data-device="WebpageFullScreen"]').click();await p.waitForTimeout(350);}
 assert.equal(await p.evaluate(()=>__CAT_PARTS_LAB__.rig.root.scale.x),.55,'Preview must use latest assembly revision');
 const labStoredBaseline=await p.evaluate(()=>localStorage.getItem('orange-cat.harvest.v2'));
 const assembly=await p.evaluate(()=>{const l=__CAT_PARTS_LAB__;return [...l.rig.parts.values()].map(n=>({name:n.name,position:[n.position.x,n.position.y],scale:n.scale.x,angle:n.angle,anchor:[n.getComponent('cc.UITransform').anchorX,n.getComponent('cc.UITransform').anchorY],size:[n.getComponent('cc.UITransform').width,n.getComponent('cc.UITransform').height]}));});
 const config=JSON.parse(fs.readFileSync('docs/OrangeCat_Cocos_Parts_V01/parts_config.json','utf8'));
 for(let i=0;i<assembly.length;i++){const actual=assembly[i],expected=[...config.parts].sort((a,b)=>a.draw_order_back_to_front-b.draw_order_back_to_front)[i];assert.equal(actual.name,expected.name);assert.deepEqual(actual.position,expected.position_from_feet_root_y_up);assert.deepEqual(actual.size,expected.size_px);assert(Math.abs(actual.scale-expected.local_scale)<1e-6);for(let k=0;k<2;k++)assert(Math.abs(actual.anchor[k]-expected.anchor_normalized_bottom_left[k])<1e-6);}
 await p.screenshot({path:out+'/00-static-light.png'});await p.evaluate(()=>{const l=__CAT_PARTS_LAB__;l.dark=true;l.paintBackground();});await p.screenshot({path:out+'/01-static-dark.png'});
 await p.evaluate(()=>{const l=__CAT_PARTS_LAB__;l.dark=false;l.paintBackground();l.staticPose=false;l.playing=true;globalThis._catChunks=[];globalThis._catRecorder=new MediaRecorder(document.querySelector('canvas').captureStream(30),{mimeType:'video/webm;codecs=vp9'});_catRecorder.ondataavailable=e=>_catChunks.push(e.data);_catRecorder.start();});await p.waitForTimeout(4300);
 const videoData=await p.evaluate(async()=>{__CAT_PARTS_LAB__.playing=false;await new Promise(resolve=>{_catRecorder.onstop=resolve;_catRecorder.stop();});const bytes=new Uint8Array(await new Blob(_catChunks,{type:'video/webm'}).arrayBuffer());let str='';for(const b of bytes)str+=String.fromCharCode(b);return btoa(str);});fs.writeFileSync(out+'/cat-action.webm',Buffer.from(videoData,'base64'));
 const bodyTransforms=[];
 for(const [name,phase] of [['rest',0],['windup',.2],['strike',.3],['cut-end',.4],['follow',.55],['recover',.8]]){
  const transform=await p.evaluate(t=>{const l=__CAT_PARTS_LAB__;l.staticPose=false;l.phase=t;l.pose();return {body:Array.from(l.rig.body.worldMatrix.m||Object.values(l.rig.body.worldMatrix)),position:[l.rig.body.position.x,l.rig.body.position.y],angle:l.rig.body.angle,scale:[l.rig.body.scale.x,l.rig.body.scale.y],root:[l.rig.root.position.x,l.rig.root.position.y],arm:l.rig.arm.angle};},phase);
  bodyTransforms.push({name,phase,...transform});await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await p.screenshot({path:out+'/pose-'+name+'.png'});
 }
 for(const t of bodyTransforms){assert.deepEqual(t.position,[0,0]);assert.equal(t.angle,0);assert.deepEqual(t.scale,[1,1]);assert.deepEqual(t.root,bodyTransforms[0].root);assert.deepEqual(t.body,bodyTransforms[0].body);}
 const savedInLab=await p.evaluate(()=>localStorage.getItem('orange-cat.harvest.v2'));assert.equal(savedInLab,labStoredBaseline);
 const pause=await p.evaluate(()=>{const l=__CAT_PARTS_LAB__;l.playing=false;return {phase:l.phase,angle:l.rig.arm.angle};});await p.waitForTimeout(250);assert.deepEqual(await p.evaluate(()=>({phase:__CAT_PARTS_LAB__.phase,angle:__CAT_PARTS_LAB__.rig.arm.angle})),pause);
 await p.goto(base+'?scene=febc2a03-7e0c-4dc6-a74f-5252b26625f6');await p.waitForFunction(()=>globalThis.__HARVEST__?.game.actor.parts?.ready,{timeout:60000});
 const hits=await p.evaluate(async()=>{
  const cc=await System.import('cc'),g=__HARVEST__.game;g.enabled=false;g.model.start();const hits=[];const original=g.model.onCut;
  g.model.onCut=e=>{g.actor.animate(g.model.cfg,g.model.s.phase,g.model.s.distance,g.workTime);const pixel=e.col===g.model.cfg.cols-1?[430,177]:e.col===0?[179,131]:[275,91];const world=g.actor.arm.getComponent(cc.UITransform).convertToWorldSpaceAR(new cc.Vec3(pixel[0]-137,480-pixel[1],0));const blade=g.root.getComponent(cc.UITransform).convertToNodeSpaceAR(world);const crop=g.field.cells.get(e.id)?.n.position;hits.push({id:e.id,phase:g.model.s.phase,blade:[blade.x,blade.y],crop:crop?[crop.x,crop.y]:null});original(e);};
  for(let i=0;i<120;i++)g.advance(1/120);return hits;
 });
 assert.equal(hits.length,2);for(const h of hits){assert(h.phase>=.2-1e-8&&h.phase<=.4+1e-8);assert(h.crop);assert(Math.hypot(h.blade[0]-h.crop[0],h.blade[1]-h.crop[1])<4,'cut must follow actual sprite blade');}
 await p.evaluate(()=>__HARVEST__.game.refresh());await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await p.screenshot({path:out+'/game-scythe.png'});
 const before=await p.evaluate(()=>__HARVEST__.model.s.coins);await p.evaluate(()=>{const g=__HARVEST__.game;g.model.pause();g.advance(2);});assert.equal(await p.evaluate(()=>__HARVEST__.model.s.coins),before);
 await p.evaluate(()=>{const g=__HARVEST__.game;g.enabled=true;g.model.start();});await p.waitForTimeout(2500);await p.screenshot({path:out+'/game-running.png'});
 await p.evaluate(()=>{const g=__HARVEST__.game;g.model.debugLevel(2);g.actor.build(g.model.cfg);g.field.clear();});await p.waitForFunction(()=>__HARVEST__.game.actor.parts.ready);
 const level2=await p.evaluate(()=>{const g=__HARVEST__.game;g.enabled=false;g.field.update(g.model,0);g.model.start();const coins=g.model.s.coins,count=g.model.s.totalCut;g.model.onCut=e=>g.field.cut(e);for(let i=0;i<120;i++)g.advance(1/120);g.refresh();return {coins:g.model.s.coins-coins,cut:g.model.s.totalCut-count,phase:g.model.s.phase};});assert.equal(level2.cut,3);assert.equal(level2.coins,6);await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await p.screenshot({path:out+'/game-level2.png'});
 await context.close();const result={date:new Date().toISOString(),engine:process.env.COCOS_BUILT?'3.8.8 actual Cocos WebGL build':'3.8.8 actual editor WebGL preview',assembly,bodyTransforms,hits,level2,checks:{sourceAssembly:true,feetAndBodyFixed:true,pauseFrozen:true,noSaveInLab:true,bladeContactWithin4px:true,onePaymentPerCell:true},errors};fs.writeFileSync(out+'/results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));await browser.close();if(errors.length)process.exitCode=1;
})().catch(async e=>{console.error(e);await activeBrowser?.close();process.exitCode=1;});
