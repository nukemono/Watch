(()=>{
  'use strict';

  const DB_NAME='solarwatch_iphone_field_v1';
  const STORE='sessions';
  const $=id=>document.getElementById(id);
  const USER_MOTION_BLOCK_THRESHOLD_DEG_S=45;
  const USER_MOTION_BLOCK_MS=1000;
  let countRefreshSerial=0;
  let motionBlockedUntil=0;
  let motionReleaseTimer=null;

  const CSS=`
#userMeasureStatus{position:absolute;z-index:22;left:24px;right:24px;top:50%;transform:translateY(-50%);padding:22px 18px;border-radius:18px;background:rgba(0,0,0,.74);color:#fff;text-align:center;line-height:1.45;box-shadow:0 10px 36px rgba(0,0,0,.28);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);pointer-events:none}
#userMeasureStatus .user-measure-title{display:block;font-size:1.35rem;font-weight:850;letter-spacing:.01em}
#userMeasureStatus .user-measure-detail{display:block;margin-top:7px;font-size:.82rem;font-weight:600;color:#eee}
#userMeasureStatus.bad{background:rgba(157,38,38,.9)}
#userMeasureStatus.ready{display:none!important}
#userSaveState{width:100%;max-width:420px;box-sizing:border-box;padding:9px 11px!important;border-radius:10px;font-size:.8rem!important;line-height:1.45;color:#eee!important;background:rgba(255,255,255,.08)}
#userSaveState.pending{background:rgba(245,159,0,.18)!important;color:#ffe7a8!important}
#userSaveState.saved{background:rgba(8,127,91,.38)!important;color:#dff8ea!important}
#userSaveState.error{background:rgba(184,50,50,.34)!important;color:#ffdada!important}
#userSavedCount{font-size:.82rem;font-weight:700;color:#68707a;margin:-5px 0 12px}
#userDeleteAllBtn{width:100%;margin:0 0 14px;padding:12px;border-radius:12px;background:#fff0f0;color:#9d2626;border:1px solid #efc7c7;font-weight:800}
.user-session-status{display:inline-block;margin-top:8px;padding:4px 8px;border-radius:999px;font-size:.72rem;font-weight:700;background:#eaf8ef;color:#086b4e}
.user-session-status.warn{background:#fff4d6;color:#7a5200}
pre.user-log.user-readable-log{font-family:inherit!important;white-space:normal!important;padding:0!important;border:1px solid #e5e8ec!important;background:#f7f8fa!important;overflow:hidden!important}
.user-readable-log .log-head{display:block;padding:10px 12px;background:#fff;font-weight:800;border-bottom:1px solid #e5e8ec}
.user-readable-log .log-row{display:grid;grid-template-columns:minmax(110px,42%) 1fr;gap:10px;padding:9px 12px;border-top:1px solid #eceff2;font-size:.82rem;align-items:start}
.user-readable-log .log-row:first-of-type{border-top:0}
.user-readable-log .log-label{color:#68707a}
.user-readable-log .log-value{font-weight:650;text-align:right;word-break:break-word}
.user-readable-log .log-note{display:block;padding:10px 12px;font-size:.76rem;color:#68707a;line-height:1.5;border-top:1px solid #eceff2;background:#fff}
`;

  function addStyles(){
    if($('solarwatchUserEnhanceStyle')) return;
    const style=document.createElement('style');
    style.id='solarwatchUserEnhanceStyle';
    style.textContent=CSS;
    document.head.appendChild(style);
  }

  function openDb(){
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB_NAME,1);
      req.onupgradeneeded=()=>{
        const db=req.result;
        if(!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE,{keyPath:'session_id'});
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
    });
  }

  async function savedCount(){
    const db=await openDb();
    const count=await new Promise((resolve,reject)=>{
      const req=db.transaction(STORE,'readonly').objectStore(STORE).count();
      req.onsuccess=()=>resolve(req.result||0);
      req.onerror=()=>reject(req.error);
    });
    db.close();
    return count;
  }

  async function clearSavedSessions(){
    const db=await openDb();
    await new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).clear();
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error);
    });
    db.close();
  }

  function fmtNumber(value,digits=1,suffix=''){
    return Number.isFinite(value)?value.toFixed(digits)+suffix:'--';
  }

  function fmtDateTime(value){
    const d=value?new Date(value):null;
    return d&&!Number.isNaN(d.getTime())?d.toLocaleString('ja-JP'):'--';
  }

  function fmtTime(value){
    const d=value?new Date(value):null;
    return d&&!Number.isNaN(d.getTime())?d.toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit',second:'2-digit'}):'--';
  }

  function escapeHtml(value){
    return String(value).replace(/[&<>"']/g,ch=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[ch]);
  }

  function isRecording(){
    const recordingBox=$('recordingBox');
    return !!(recordingBox&&!recordingBox.classList.contains('hidden'));
  }

  function coreMeasurementReady(){
    const gateText=($('gateText')?.textContent||'').trim();
    return /^測定できます/.test(gateText);
  }

  function currentRotationRate(){
    const text=($('rotationRate')?.textContent||'').trim();
    const match=text.match(/-?\d+(?:\.\d+)?/);
    return match?Number(match[0]):null;
  }

  function scheduleMotionRelease(){
    if(motionReleaseTimer) clearTimeout(motionReleaseTimer);
    const wait=Math.max(0,motionBlockedUntil-performance.now()+30);
    motionReleaseTimer=setTimeout(()=>{
      motionReleaseTimer=null;
      updateMeasureStatus();
    },wait);
  }

  function updateMotionBlock(){
    const rotation=currentRotationRate();
    if(Number.isFinite(rotation)&&rotation>=USER_MOTION_BLOCK_THRESHOLD_DEG_S){
      motionBlockedUntil=performance.now()+USER_MOTION_BLOCK_MS;
      scheduleMotionRelease();
    }
  }

  function motionBlocked(){
    return performance.now()<motionBlockedUntil;
  }

  function canUserMeasure(){
    if(isRecording()) return false;
    updateMotionBlock();
    return coreMeasurementReady()&&!motionBlocked();
  }

  function friendlyMeasureState(){
    const gateText=($('gateText')?.textContent||'').trim();
    const cameraText=($('cameraStatus')?.textContent||'').trim();
    const sensorText=($('sensorStatus')?.textContent||'').trim();
    const gpsText=($('gpsStatus')?.textContent||'').trim();

    if(isRecording()) return {recording:true,title:'',detail:'',kind:''};
    if(/失敗|停止|不可/.test(cameraText)) return {title:'カメラを利用できません',detail:'ブラウザのカメラ許可状態を確認してください。',kind:'bad'};
    if(/失敗|許可されません/.test(sensorText)) return {title:'センサーを利用できません',detail:'ブラウザのセンサー許可状態を確認してください。',kind:'bad'};
    if(/非対応|denied|permission/i.test(gpsText)) return {title:'位置情報を利用できません',detail:'ブラウザの位置情報許可状態を確認してください。',kind:'bad'};
    if(motionBlocked()) return {title:'スマホを静かにしてお待ちください',detail:'大きく動かした直後なので、少しだけ待っています。',kind:'warn'};
    if(coreMeasurementReady()) return {title:'測定できます',detail:'',kind:'ready'};
    if(/GPS待機/.test(gateText)||/GPS:\s*待機/.test(gpsText)) return {title:'スマホを水平にしてお待ちください',detail:'位置情報を取得しています。',kind:'warn'};
    if(/GPS精度/.test(gateText)) return {title:'スマホを水平にしてお待ちください',detail:'位置情報が安定するまで待っています。',kind:'warn'};
    if(/水平|北基準/.test(gateText)) return {title:'スマホを水平にしてお待ちください',detail:'方位の基準を準備しています。',kind:'warn'};
    if(/WMM|偏角/.test(gateText)) return {title:'スマホを水平にしてお待ちください',detail:'方位を準備しています。',kind:'warn'};
    if(/3D方位|canonical|方位・高度|取得待ち/.test(gateText)) return {title:'スマホを水平にしてお待ちください',detail:'端末の向きを取得しています。',kind:'warn'};
    return {title:'スマホを水平にしてお待ちください',detail:'測定の準備をしています。',kind:'warn'};
  }

  function ensureMeasureStatus(){
    const recordBtn=$('recordBtn');
    if(!recordBtn) return null;
    let status=$('userMeasureStatus');
    if(!status){
      status=document.createElement('div');
      status.id='userMeasureStatus';
      status.setAttribute('aria-live','polite');
      recordBtn.parentNode.insertBefore(status,recordBtn);
    }
    return status;
  }

  function applyMeasurementGate(){
    const recordBtn=$('recordBtn');
    if(!recordBtn||isRecording()) return;
    const shouldEnable=canUserMeasure();
    recordBtn.disabled=!shouldEnable;
  }

  function updateMeasureStatus(){
    updateMotionBlock();
    applyMeasurementGate();
    const status=ensureMeasureStatus();
    if(!status) return;
    const state=friendlyMeasureState();
    if(state.recording){
      status.style.display='none';
      return;
    }
    status.style.display='block';
    status.className=state.kind||'warn';
    status.replaceChildren();
    const title=document.createElement('span');
    title.className='user-measure-title';
    title.textContent=state.title;
    status.appendChild(title);
    if(state.detail){
      const detail=document.createElement('span');
      detail.className='user-measure-detail';
      detail.textContent=state.detail;
      status.appendChild(detail);
    }
  }

  function bindMeasureStatus(){
    const recordBtn=$('recordBtn');
    const targets=[recordBtn,$('recordingBox'),$('gateText'),$('cameraStatus'),$('sensorStatus'),$('gpsStatus'),$('rotationRate')].filter(Boolean);
    const observer=new MutationObserver(()=>queueMicrotask(updateMeasureStatus));
    targets.forEach(target=>observer.observe(target,{attributes:true,childList:true,subtree:true,characterData:true}));
    recordBtn?.addEventListener('click',event=>{
      if(canUserMeasure()) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      updateMeasureStatus();
    },true);
    updateMeasureStatus();
  }

  function syncSaveState(){
    const saveBtn=$('userSaveResultBtn');
    const state=$('userSaveState');
    if(!saveBtn||!state) return;

    state.classList.remove('pending','saved','error');
    const buttonText=saveBtn.textContent.trim();
    const current=state.textContent.trim();

    if(buttonText==='保存しました'||/保存しました/.test(current)){
      state.classList.add('saved');
      if(state.textContent!=='✓ 履歴に保存しました。') state.textContent='✓ 履歴に保存しました。';
      return;
    }
    if(/失敗|できません|取得できません/.test(current)){
      state.classList.add('error');
      return;
    }
    if(!saveBtn.disabled&&buttonText==='履歴に保存'){
      state.classList.add('pending');
      if(state.textContent!=='この結果はまだ履歴に保存されていません。') state.textContent='この結果はまだ履歴に保存されていません。';
      return;
    }
    if(buttonText==='準備中…'){
      state.classList.add('pending');
      if(state.textContent!=='保存前の結果を準備しています…') state.textContent='保存前の結果を準備しています…';
    }
  }

  function bindSaveState(){
    const saveBtn=$('userSaveResultBtn');
    const state=$('userSaveState');
    if(!saveBtn||!state) return;
    const observer=new MutationObserver(()=>queueMicrotask(syncSaveState));
    observer.observe(saveBtn,{attributes:true,childList:true,subtree:true,characterData:true});
    observer.observe(state,{childList:true,subtree:true,characterData:true});
    syncSaveState();
  }

  function readableRows(data){
    return [
      ['測定日時',fmtDateTime(data.created_at)],
      ['推定時刻',fmtTime(data.estimated_time_iso)],
      ['測定状態',data.measurement_valid===false?'注意あり':'正常'],
      ['GPS精度',fmtNumber(data.gps_accuracy_m,1,' m')],
      ['観測方位',fmtNumber(data.observed_azimuth_deg,1,'°')],
      ['観測高度',fmtNumber(data.observed_elevation_deg,1,'°')],
      ['方位のばらつき',fmtNumber(data.heading_sd_deg,1,'°')],
      ['高度のばらつき',fmtNumber(data.elevation_sd_deg,1,'°')],
      ['推定太陽方位',fmtNumber(data.predicted_sun_azimuth_deg,1,'°')],
      ['推定太陽高度',fmtNumber(data.predicted_sun_elevation_deg,1,'°')],
      ['角度残差',fmtNumber(data.angular_residual_deg,1,'°')]
    ];
  }

  function makeReadableLog(pre){
    if(!pre||pre.dataset.readableLog==='1') return;
    let data;
    try{data=JSON.parse(pre.textContent);}catch{return;}
    pre.dataset.readableLog='1';
    pre.classList.add('user-readable-log');
    const rows=readableRows(data);
    const rowHtml=rows.map(([label,value])=>
      '<span class="log-row"><span class="log-label">'+escapeHtml(label)+'</span><span class="log-value">'+escapeHtml(value)+'</span></span>'
    ).join('');
    const note=data.measurement_valid===false
      ?'この測定には注意項目があります。結果を利用する前に測定状況を確認してください。'
      :'詳細な生データは共有CSVに含まれます。';
    pre.innerHTML='<span class="log-head">測定ログ</span>'+rowHtml+'<span class="log-note">'+escapeHtml(note)+'</span>';
  }

  async function updateSavedCount(){
    const serial=++countRefreshSerial;
    let count=$('userSavedCount');
    if(!count){
      count=document.createElement('div');
      count.id='userSavedCount';
      const share=$('userShareAllBtn');
      share?.parentNode.insertBefore(count,share);
    }
    if(!count) return;
    try{
      const n=await savedCount();
      if(serial!==countRefreshSerial) return;
      count.textContent='保存 '+n+'件';
    }catch(err){
      console.error('failed to count saved sessions',err);
      count.textContent='保存件数を取得できませんでした';
    }
  }

  function enhanceSavedCards(){
    const list=$('userSavedList');
    if(!list) return;
    const cards=[...list.querySelectorAll('.user-session')];

    for(const card of cards){
      const pre=card.querySelector('pre.user-log');
      makeReadableLog(pre);

      const actions=card.querySelector('.user-session-actions');
      const buttons=actions?[...actions.querySelectorAll('button')]:[];
      const logBtn=buttons[0];
      const deleteBtn=buttons[2];
      if(logBtn&&!logBtn.dataset.readableToggle){
        logBtn.dataset.readableToggle='1';
        logBtn.textContent='ログを見る';
        logBtn.addEventListener('click',()=>setTimeout(()=>{
          const log=card.querySelector('.user-log');
          logBtn.textContent=log?.classList.contains('hidden')?'ログを見る':'ログを閉じる';
        },0));
      }
      if(deleteBtn) deleteBtn.textContent='1件削除';

      if(!card.querySelector('.user-session-status')){
        let valid=true;
        if(pre?.dataset.readableLog==='1'){
          const statusRow=[...pre.querySelectorAll('.log-row')].find(row=>row.querySelector('.log-label')?.textContent==='測定状態');
          valid=statusRow?.querySelector('.log-value')?.textContent!=='注意あり';
        }
        const chip=document.createElement('div');
        chip.className='user-session-status'+(valid?'':' warn');
        chip.textContent=valid?'保存済み':'注意あり';
        const actionsEl=card.querySelector('.user-session-actions');
        if(actionsEl) card.insertBefore(chip,actionsEl);
      }
    }
    updateSavedCount();
  }

  function ensureDeleteAllButton(){
    if($('userDeleteAllBtn')) return;
    const share=$('userShareAllBtn');
    if(!share) return;
    const button=document.createElement('button');
    button.id='userDeleteAllBtn';
    button.type='button';
    button.textContent='保存データをすべて削除';
    share.insertAdjacentElement('afterend',button);
    button.addEventListener('click',async()=>{
      if(!confirm('保存済みの測定データをすべて削除しますか？\nこの操作は取り消せません。')) return;
      try{
        await clearSavedSessions();
        const list=$('userSavedList');
        if(list) list.innerHTML='<div class="user-empty">保存データはありません。</div>';
        if(share) share.disabled=true;
        await updateSavedCount();
      }catch(err){
        console.error('failed to clear saved sessions',err);
        alert('保存データの削除に失敗しました。');
      }
    });
  }

  function bindSavedLogEnhancement(){
    const list=$('userSavedList');
    if(!list) return;
    ensureDeleteAllButton();
    const observer=new MutationObserver(()=>queueMicrotask(enhanceSavedCards));
    observer.observe(list,{childList:true,subtree:true});
    $('userSavedBtn')?.addEventListener('click',()=>setTimeout(()=>{
      enhanceSavedCards();
      updateSavedCount();
    },0));
    enhanceSavedCards();
    updateSavedCount();
  }

  function init(){
    addStyles();
    bindMeasureStatus();
    bindSaveState();
    bindSavedLogEnhancement();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
