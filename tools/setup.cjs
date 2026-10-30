// Uses only the installed Creator 3.8.8 2D template; no downloaded editor or engine.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const template='D:/ProgramData/cocos/editors/Creator/3.8.8/resources/resources/3d/engine/editor/assets/default_file_content/scene/scene-2d.scene';
const uuid='31a29115-90ea-4eb9-915f-909df4c925d5';
fs.mkdirSync('assets/scenes',{recursive:true});fs.mkdirSync('assets/resources/audio',{recursive:true});
// Creator's default class ID preserves 5 hex chars, then encodes 3 nibbles as 2 base64 chars.
function classId(id){const h=id.replace(/-/g,''),b='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';return h.slice(0,5)+h.slice(5).replace(/.{3}/g,t=>{const n=parseInt(t,16);return b[n>>6]+b[n&63];});}
function meta(file,importer,id){if(!fs.existsSync(file+'.meta'))fs.writeFileSync(file+'.meta',JSON.stringify({ver:importer==='typescript'?'4.0.24':'1.1.50',importer,imported:true,uuid:id,files:[],subMetas:{},userData:{}},null,2));}
meta('assets/scripts/HarvestGame.ts','typescript',uuid);
for(const [name,level,id] of [['Main',0,'febc2a03-7e0c-4dc6-a74f-5252b26625f6'],['ScytheLab',1,'a588565c-e58d-459c-80cd-c3469cd102a7'],['MachineLab',4,'e69b27c9-31a3-4ec8-bdab-1337ea0240c6']]){
 if(fs.existsSync('assets/scenes/'+name+'.scene'))continue;
 const a=JSON.parse(fs.readFileSync(template,'utf8'));a[0]._name=name;a[1]._name=name;a[2]._lpos={__type__:'cc.Vec3',x:360,y:640,z:0};a[5]._contentSize={__type__:'cc.Size',width:720,height:1280};a[4]._orthoHeight=640;a[4]._color={__type__:'cc.Color',r:135,g:171,b:99,a:255};a[2]._components.push({__id__:a.length});a.push({__type__:classId(uuid),_name:'',_objFlags:0,node:{__id__:2},_enabled:true,__prefab:null,sampleLevel:level,_id:crypto.randomUUID()});
 fs.writeFileSync('assets/scenes/'+name+'.scene',JSON.stringify(a,null,2));meta('assets/scenes/'+name+'.scene','scene',id);
}
function wav(name,seconds,generate){const rate=22050,count=Math.round(seconds*rate),b=Buffer.alloc(44+count*2);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(count*2,40);for(let i=0;i<count;i++)b.writeInt16LE(Math.max(-32767,Math.min(32767,generate(i/rate,seconds)*24000)),44+i*2);fs.writeFileSync('assets/resources/audio/'+name+'.wav',b);}
wav('cut',.18,(t,d)=>Math.sin(t*20000+Math.sin(t*517)*5)*Math.exp(-t*25)*.28);
wav('upgrade',.65,(t,d)=>Math.sin(t*Math.PI*2*(350+300*t))*Math.sin(Math.PI*t/d)*.25);
wav('music',8,(t,d)=>{const notes=[261.63,329.63,392,329.63,293.66,349.23,440,349.23];const i=Math.floor(t);return Math.sin(t*Math.PI*2*notes[i])*Math.sin(Math.PI*(t-i))*.15;});
console.log('Created Cocos 2D scenes, layered bootstrap, and original synthesized placeholder audio.');
