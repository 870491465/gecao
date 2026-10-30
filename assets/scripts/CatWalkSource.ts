// Copied verbatim from OrangeCat_Walk_V02/walk_motion.js; default preview mathematics.
// Pure math only. No dependency on a particular Cocos version.
// Add offsets to the original transforms; do not accumulate them per frame.
export function sampleWalk(phase) {
  const p = ((phase % 1) + 1) % 1;
  function foot(t) {
    t %= 1;
    return t < 0.5
      ? 12 * (1 - 4 * t)
      : -12 + 48 * (t - 0.5) + 5 * Math.sin((t - 0.5) * 2 * Math.PI);
  }
  return {
    leftFootYOffset: foot(p),
    rightFootYOffset: foot((p + 0.5) % 1),
    upperBodyYOffset: 3 * (1 - Math.cos(p * 4 * Math.PI)) / 2,
  };
}
export function advanceWalkPhase(phase, forwardDistanceDesignPixels) {
  return ((phase + forwardDistanceDesignPixels / 48) % 1 + 1) % 1;
}
