const fs=require('fs'),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
let browser;
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE});const page=await browser.newPage({viewport:{width:720,height:1280}});
 await page.goto('http://127.0.0.1:8093');await page.waitForFunction(()=>globalThis.__HARVEST__?.game.actor.ready&&__HARVEST__.game.field.ready);
 await page.evaluate(()=>{const g=__HARVEST__.game;g.enabled=false;g.model.debugLevel(6);Object.assign(g.model.s,{row:30,distance:30.4,started:true});g.actor.build(g.model.cfg);g.field.clear();g.advance(0);});await page.waitForFunction(()=>__HARVEST__.game.actor.ready&&__HARVEST__.game.field.ready,null,{timeout:60000});await page.evaluate(()=>{const g=__HARVEST__.game;g.model.start();g.enabled=true;});await page.waitForTimeout(1500);
 const result=await page.evaluate(async()=>{
  const cc=await System.import('cc'),g=__HARVEST__.game,stats={},frames=[],draws=[];
  for(const [owner,key,label] of [[g,'advance','advance'],[g.field,'update','field'],[g.model,'update','model'],[g,'refresh','ui']]){const fn=owner[key].bind(owner);stats[label]=[];owner[key]=(...args)=>{const t=performance.now(),r=fn(...args);stats[label].push(performance.now()-t);return r;};}
  const start={sort:g.field.sortPasses,layout:g.field.layoutWrites};
  await new Promise(resolve=>{let n=0,last=0;function step(now){if(last)frames.push(now-last);last=now;draws.push(cc.director.root.device.numDrawCalls);if(++n>=241)resolve();else requestAnimationFrame(step);}requestAnimationFrame(step);});
  const q=a=>{a.sort((x,y)=>x-y);return {mean:a.reduce((x,y)=>x+y,0)/a.length,p50:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],max:a[a.length-1],samples:a.length};};
  return {scenario:'stage six, dense steady field, 1500ms warmup, no screen recorder',frames:q(frames),timings:Object.fromEntries(Object.entries(stats).map(([k,v])=>[k,q(v)])),draws:q(draws),cells:g.field.cells.size,nodes:g.nodeCount(),sortPasses:g.field.sortPasses-start.sort,layoutWrites:g.field.layoutWrites-start.layout,gameFrameRate:cc.game.frameRate,renderer:cc.director.root.device.renderer};
 });
 fs.mkdirSync('docs/verification/rice-smoothness',{recursive:true});fs.writeFileSync('docs/verification/rice-smoothness/dense-profile.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));await browser.close();
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1;});
