(()=>{
  'use strict';

  const DB_NAME='solarwatch_iphone_field_v1';
  const STORE='sessions';
  const USER_MOTION_BLOCK_THRESHOLD_DEG_S=45;
  const USER_MOTION_BLOCK_MS=1000;
  const $=id=>document.getElementById(id);

  let pendingSession=null;
  let pendingCapturePromise=null;
  let knownSessionIds=new Set();
  let measurementBaselineIds=null;
  let measurementStartedAt=0;
  let motionBlockedUntil=0;
  let motionReleaseTimer=null;
  let resultWasVisible=false;

  const