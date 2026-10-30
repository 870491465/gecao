// Isolated build snapshot: do not close or reload the user's running Creator editor.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{spawn}=require('child_process');
const root=process.cwd(),snapshot=path.join(root,'temp','cat-validation-'+Date.now());
fs.mkdirSync(snapshot,{recursive:true});for(const name of ['assets','settings'])fs.cpSync(path.join(root,name),path.join(snapshot,name),{recursive:true});
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));pkg.uuid=crypto.randomUUID();pkg.name='OrangeCatPartsValidation';fs.writeFileSync(path.join(snapshot,'package.json'),JSON.stringify(pkg,null,2));
const config=JSON.parse(fs.readFileSync('tools/build-web.json','utf8'));config.buildPath=path.join(root,'build');
const configPath=path.join(snapshot,'build-config.json');fs.writeFileSync(configPath,JSON.stringify(config,null,2));
const stdout=fs.openSync('temp/build-cat-parts.log','w'),stderr=fs.openSync('temp/build-cat-parts-errors.log','w');
const child=spawn('D:/ProgramData/cocos/editors/Creator/3.8.8/CocosCreator.exe',['--project',snapshot,'--build','configPath='+configPath],{windowsHide:true,stdio:['ignore',stdout,stderr]});console.log('Creator 3.8.8 isolated validation build PID',child.pid);
child.on('exit',code=>{const result={date:new Date().toISOString(),engine:'3.8.8',exitCode:code,source:root,snapshot,output:'build/web-mobile',success:code===36};const report=process.env.CAT_VALIDATION_REPORT||'docs/verification/cat-walk-v02';fs.mkdirSync(report,{recursive:true});fs.writeFileSync(path.join(report,'build.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));process.exitCode=code===36?0:1;});
