// V03 head/body + one untouched Walk V02 right-arm/sickle sprite.
export const V03={feetY:-205,legacyScale:.17,torsoScale:.19,headScale:.21,hipY:18,toolScales:[.20,.24],widths:[180,180],grassCanvas:[284,218],rowSpace:44,stanceBob:.51,visualHeight:180.64};
export const COMBINED={file:'cat-walk-v02/textures/cat_right_arm_sickle',size:[571,580],pivot:[137,480],wrist:[260,440],grip:[333,378],blade:[430,177]};
// Keep both Walk V02 hands at the same source-art scale; their transparent
// canvases have different sizes and must not be used to match palm width.
export const LEFT_ARM={pivot:[335,165],relativeScale:1};
const rad=Math.PI/180,mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const clamp=(t:number)=>Math.max(0,Math.min(1,t)),ease=(t:number)=>{t=clamp(t);return t*t*(3-2*t);};
export function v03ToolScale(level=1){return V03.toolScales[level===2?1:0];}
export function v03LeftArmScale(level=1){return v03ToolScale(level)*LEFT_ARM.relativeScale;}
export function v03LeftArm(phase:number,gait:number){
 const p=clamp(phase);if(p<=.2)return mix(-8,12,ease(p/.2));if(p<=.4)return mix(12,-18,ease((p-.2)/.2));if(p<=.55)return mix(-18,-12,ease((p-.4)/.15));const t=clamp((p-.55)/.45);return mix(-12,-8,ease(t))+Math.sin(Math.PI*t)*8*Math.sin(gait*Math.PI*2);
}
export function v03Pose(phase:number,level=1){
 const p=clamp(phase);let toolAngle:number,bodyAngle:number,reach:number;
 if(p<=.2){const t=ease(p/.2);toolAngle=mix(-10,-25,t);bodyAngle=2.5*t;reach=0;}
 else if(p<=.4){const t=(p-.2)/.2;toolAngle=mix(-25,98,t);bodyAngle=mix(2.5,-2.5,ease(t));reach=t;}
 else if(p<=.55){const t=ease((p-.4)/.15);toolAngle=mix(98,102,t);bodyAngle=mix(-2.5,-1,t);reach=1;}
 else{const t=ease((p-.55)/.45);toolAngle=mix(102,-10,t);bodyAngle=mix(-1,0,t);reach=1-t;}
 const a=bodyAngle*rad,sx=250*V03.torsoScale,sy=335*V03.torsoScale;
 const shoulder={x:sx*Math.cos(a)-sy*Math.sin(a),y:V03.hipY+sx*Math.sin(a)+sy*Math.cos(a)};
 // Modest forward placement inside the body/head occlusion, not another arm
 // segment. The entire original sprite remains rigid, uniformly scaled.
 const attachment={x:shoulder.x-32*reach,y:shoulder.y+50*reach};
 const transform=(pixel:number[])=>{const dx=(pixel[0]-COMBINED.pivot[0])*v03ToolScale(level),dy=(COMBINED.pivot[1]-pixel[1])*v03ToolScale(level),t=toolAngle*rad;return {x:attachment.x+dx*Math.cos(t)-dy*Math.sin(t),y:attachment.y+dx*Math.sin(t)+dy*Math.cos(t)};};
 return {bodyAngle,shoulder,attachment,wrist:transform(COMBINED.wrist),grip:transform(COMBINED.grip),toolAngle,contact:transform(COMBINED.blade)};
}
export function v03Contact(phase:number,level=1){const p=v03Pose(phase,level).contact;return {x:p.x,y:V03.feetY+V03.stanceBob+p.y};}
