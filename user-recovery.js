(()=>{
  'use strict';

  const $=id=>document.getElementById(id);

  function cameraIsLive(){
    const video=$('video');
    const stream=video&&video.srcObject;
    if(!stream||typeof stream.getVideoTracks!=='function') return false;
    return stream.getVideoTracks().some(track=>track.readyState==='live'&&track.enabled!==false);
  }

  function restoreStartUiIfNeeded(){
    if(document.hidden) return;
    const startBtn=$('startBtn');
    const card=startBtn?startBtn.closest('.user-permission-card'):null;
    if(!startBtn||!card) return;

    if(cameraIsLive()) return;

    card.classList.remove('user-permission-done');
    startBtn.disabled=false;
    if(startBtn.textContent.trim()==='取得中'){
      startBtn.textContent='カメラ・センサーを再開';
    }
  }

  function delayedRecovery(){
    setTimeout(restoreStartUiIfNeeded,350);
  }

  window.addEventListener('pageshow',delayedRecovery);
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden) delayedRecovery();
  });
})();
