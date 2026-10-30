// Optional local WebGL verification using an existing Playwright installation.
// PLAYWRIGHT_MODULE may point to its absolute installed module path. No engine substitutes.
const fs=require('fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--autoplay-policy=no-user-gesture-required']});
 const context=await browser.newContext({viewport:{width:432,height:768},deviceScaleFactor:1});const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error'&&!m.location().url.includes('favicon'))errors.push(m.text());});
 await page.goto('http://127.0.0.1:8092');await page.waitForFunction(()=>globalThis.__HARVEST__,{timeout:30000});await page.waitForTimeout(1000);
 const dir='docs/verification';fs.mkdirSync(dir,{recursive:true});await page.screenshot({path:dir+'/01-ready.png'});
 console.log('READY',await page.evaluate(()=>({s:__HARVEST__.snapshot(),fps:__HARVEST__.game.fps})));console.log('ERRORS',errors);
 if(process.argv.includes('--inspect')){await browser.close();return;}
 await page.mouse.click(216,589); // StartContinue on verified 432x768 canvas.
 console.log('STARTED',await page.evaluate(()=>__HARVEST__.model.state));
 await page.waitForTimeout(1000);await page.screenshot({path:dir+'/02-scythe.png'});
 const metrics=[];for(let i=0;i<8;i++){await page.waitForTimeout(10000);metrics.push(await page.evaluate(()=>({round:__HARVEST__.model.s.round,coins:__HARVEST__.model.s.coins,fps:__HARVEST__.game.fps,nodes:__HARVEST__.game.nodeCount(),heap:performance.memory?.usedJSHeapSize})));console.log('REALTIME',JSON.stringify(metrics.at(-1)));}
 await page.waitForTimeout(1500);const cycles=await page.evaluate(()=>__HARVEST__.snapshot());if(cycles.round<3)throw Error('Did not complete two actual realtime fields');
 const checks=[];checks.push({test:'one click, two complete fields, actual 83 seconds',pass:true,round:cycles.round,coins:cycles.coins});
 await page.evaluate(()=>__HARVEST__.model.pause());let saved=await page.evaluate(()=>__HARVEST__.snapshot());await page.waitForTimeout(1100);checks.push({test:'pause no income',pass:(await page.evaluate(()=>__HARVEST__.model.s.coins))===saved.coins});
 await page.evaluate(()=>__HARVEST__.game.save());await page.reload();await page.waitForFunction(()=>globalThis.__HARVEST__);const restored=await page.evaluate(()=>__HARVEST__.snapshot());checks.push({test:'actual localStorage reload restores mask and coins',pass:saved.coins===restored.coins&&saved.mask===restored.mask&&saved.row===restored.row});
 await page.evaluate(()=>{const g=__HARVEST__.game;g.model.s.coins=10000;g.model.s.debug=true;g.model.start();for(let i=0;i<20;i++)g.purchase();});let upgraded=await page.evaluate(()=>__HARVEST__.snapshot());checks.push({test:'20 purchase attempts only one debit',pass:upgraded.level===2&&upgraded.coins===9880});await page.waitForTimeout(1400);
 for(let level=2;level<=5;level++){
  await page.evaluate(l=>{const g=__HARVEST__.game;g.model.debugLevel(l);g.actor.build(g.model.cfg);g.field.clear();g.model.start();},level);
  await page.waitForTimeout(1600);await page.screenshot({path:dir+'/level-'+level+'.png'});
  const one=await page.evaluate(()=>({wheel:__HARVEST__.game.model.s.distance,disc:__HARVEST__.game.actor.disc?.angle}));await page.waitForTimeout(250);
  const two=await page.evaluate(()=>({wheel:__HARVEST__.game.model.s.distance,disc:__HARVEST__.game.actor.disc?.angle}));
  if(level>=3)checks.push({test:'level '+level+' independent machine animation and travel',pass:two.wheel>one.wheel&&(level!==3||two.disc!==one.disc)});
 }
 await page.evaluate(()=>__HARVEST__.game.hide());saved=await page.evaluate(()=>__HARVEST__.snapshot());await page.waitForTimeout(1000);await page.evaluate(()=>__HARVEST__.game.show());checks.push({test:'application lifecycle no offline compensation',pass:await page.evaluate(v=>__HARVEST__.model.state==='Paused'&&__HARVEST__.model.s.coins===v,saved.coins)});
 const result={type:'actual headless Chromium WebGL runtime, not a physical phone',date:new Date().toISOString(),cycles,metrics,checks,errors};fs.writeFileSync(dir+'/runtime-results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));await browser.close();if(errors.length||checks.some(c=>!c.pass))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
