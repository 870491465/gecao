const fs=require('fs');const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{const b=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE});const p=await b.newPage({viewport:{width:432,height:768}});const errors=[];p.on('pageerror',e=>errors.push(String(e)));await p.goto('http://127.0.0.1:8092');await p.waitForFunction(()=>globalThis.__HARVEST__);const results=[];
 for(let level=1;level<=5;level++){
  await p.evaluate(l=>{const g=__HARVEST__.game;g.model.debugLevel(l);g.actor.build(g.model.cfg);g.field.clear();g.model.start();},level);
  await p.waitForTimeout(6500);await p.screenshot({path:'docs/verification/final-level-'+level+'.png'});
  results.push(await p.evaluate(()=>{const g=__HARVEST__.game;return {level:g.model.s.level,fps:g.fps,nodes:g.nodeCount(),visible:g.field.cells.size,coins:g.model.s.coins,cut:g.model.s.totalCut,driverVisible:g.actor.body.children.some(n=>n.name==='HeadBack'&&n.active),round:g.model.s.round};}));
  console.log('LEVEL',results.at(-1));
 }
 // A paused screenshot and a later frame must have identical progress/arm/roller.
 const before=await p.evaluate(()=>{const g=__HARVEST__.game;g.model.pause();return {distance:g.model.s.distance,coins:g.model.s.coins,angle:g.actor.arm.angle,time:g.workTime,cropTime:g.field.time};});await p.waitForTimeout(500);const after=await p.evaluate(()=>{const g=__HARVEST__.game;return {distance:g.model.s.distance,coins:g.model.s.coins,angle:g.actor.arm.angle,time:g.workTime,cropTime:g.field.time};});
 const samples=[];
 for(const [scene,level] of [['ScytheLab',1],['MachineLab',4]]){
  const stored=await p.evaluate(()=>localStorage.getItem('orange-cat.harvest.v2'));
  await p.evaluate(async name=>{const cc=await System.import('cc');await new Promise((resolve,reject)=>cc.director.loadScene(name,e=>e?reject(e):resolve()));},scene);
  await p.waitForTimeout(300);const sample=await p.evaluate(()=>({level:__HARVEST__.game.sampleLevel,coins:__HARVEST__.model.s.coins,state:__HARVEST__.model.state}));
  await p.evaluate(()=>__HARVEST__.game.save());const storedAfter=await p.evaluate(()=>localStorage.getItem('orange-cat.harvest.v2'));
  samples.push({scene,...sample,pass:sample.level===level&&sample.coins===0&&sample.state==='Ready'&&stored===storedAfter});console.log('SAMPLE',samples.at(-1));
 }
 const result={type:'actual Cocos WebGL final visual revision',date:new Date().toISOString(),results,pausedUnchanged:JSON.stringify(before)===JSON.stringify(after),samples,errors};fs.writeFileSync('docs/verification/final-visual-results.json',JSON.stringify(result,null,2));await b.close();if(errors.length||!result.pausedUnchanged||samples.some(s=>!s.pass))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
