export const GRASS = { canvas:64,anchorX:.5,anchorY:.0625,fallSeconds:.12,groundHeight:1536,groundMinY:-640,groundMaxY:640,soilMargin:32,fxCount:3,fxLimit:48,fxSeconds:.4,fxBaseSize:27,fxSizeStep:5.4 };
export function grassVariant(row:number,col:number,round:number,lane:number){return ['A','B','C'][(row*7+col*11+round+lane)%3];}
export function groundOffset(distancePixels:number){return ((distancePixels%GRASS.groundHeight)+GRASS.groundHeight)%GRASS.groundHeight;}
export function groundSegments(distancePixels:number){const offset=groundOffset(distancePixels);return [GRASS.groundMinY-offset,GRASS.groundMinY-offset+GRASS.groundHeight];}
