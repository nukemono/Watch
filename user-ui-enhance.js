(()=>{
  'use strict';

  const $=id=>document.getElementById(id);

  const CSS=`
#userMeasureStatus{position:absolute;z-index:12;left:16px;right:16px;bottom:calc(84px + env(safe-area-inset-bottom));padding:10px 12px;border-radius:12px;background:rgba(0,0,0,.62);color:#fff;text-align:center;font-size:.82rem;line-height:1.45;backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px)}
#userMeasureStatus.ready{background:rgba(8,127,91,.84)}
#userMeasureStatus.bad{background:rgba(157,38,38,.88)}
#userSaveState{width:100%;max-width:420px;box-sizing:border-box;padding:9px 11px!important;border-radius:10px;font-size:.8rem!important;line-height:1.45;color:#eee!important;background:rgba(255,255,255,.08)}
#userSaveState.pending{background:rgba(245,159,0,.18)!important;color:#ffe7a8!important}
#userSaveState.saved{background:rgba(8,127,91,.38)!important;color:#dff8ea!important}
#userSaveState.error{background:rgba(184,50,50,.34)!important;color:#ffdada!important}
#userSavedCount{font-size:.78rem;color:#68707a;margin:-5px 0 12px}
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

  function friendlyMeasureState(){
    const recordBtn=$('recordBtn');
    const recordingBox=$('recordingBox');
    const gateText=($('gateText')?.textContent||'').trim();
    const cameraText=($('cameraStatus')?.textContent||'').trim();
    const sensorText=($('sensorStatus')?.textContent||'').trim();
    const gpsText=($('gpsStatus')?.textContent||'').trim();

    if(recordingBox&&!recordingBox.classList.contains('hidden')) return {recording:true,text:'',kind:''};
    if(/失敗|停止|不可/.test(cameraText)) return {text:'カメラを利用できません。ブラウザの許可状態を確認してください。',kind:'bad'};
    if(/失敗|許可されません/.test(sensorText)) return {text:'センサーを利用できません。ブラウザの許可状態を確認してください。',kind:'bad'};
    if(/非対応|denied|permission/i.test(gpsText)) return {text:'位置情報を利用できません。ブラウザの許可状態を確認してください。',kind:'bad'};
    if(recordBtn&&!recordBtn.disabled) return {text:'測定できます。太陽を中央に合わせてください。',kind:'ready'};
    if(/水平|北基準/.test(gateText)) return {text:'端末をできるだけ水平にして、方位の準備が終わるまで少し待ってください。',kind:'warn'};
    if(/GPS待機/.test(gateText)||/GPS: 待機/.test(gpsText)) return {text:'位置情報を取得しています。',kind:'warn'};
    if(/GPS精度/.test(gateText)) return {text:'位置情報が安定するまでお待ちください。',kind:'warn'};
    if(/WMM|偏角/.test(gateText)) return {text:'方位を準備しています。',kind:'warn'};
    if(/3D方位|canonical|方位・高度|取得待ち/.test(gateText)) return {text:'端末の向きを取得しています。',kind:'warn'};
    return {text:'測定の準備をしています。',kind:'warn'};
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

  function updateMeasureStatus(){
    const status=ensureMeasureStatus();
    if(!status) return;
    const state=friendlyMeasureState();
    if(state.recording){
      status.style.display='none';
      return;
    }
    status.style.display='block';
    status.textContent=state.text;
    status.className=state.kind||'warn';
  }

  function bindMeasureStatus(){
    const targets=[$('recordBtn'),$('recordingBox'),$('gateText'),$('cameraStatus'),$('sensorStatus'),$('gpsStatus')].filter(Boolean);
    const observer=new MutationObserver(updateMeasureStatus);
    targets.forEach(target=>observer.observe(target,{attributes:true,childList:true,subtree:true,characterData:true}));
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

  function enhanceSavedCards(){
    const list=$('userSavedList');
    if(!list) return;
    const cards=[...list.querySelectorAll('.user-session')];

    let count=$('userSavedCount');
    if(!count){
      count=document.createElement('div');
      count.id='userSavedCount';
      const share=$('userShareAllBtn');
      share?.parentNode.insertBefore(count,share);
    }
    if(count) count.textContent='保存 '+cards.length+'件';

    for(const card of cards){
      const pre=card.querySelector('pre.user-log');
      makeReadableLog(pre);

      const actions=card.querySelector('.user-session-actions');
      const logBtn=actions?.querySelector('button');
      if(logBtn&&!logBtn.dataset.readableToggle){
        logBtn.dataset.readableToggle='1';
        logBtn.textContent='ログを見る';
        logBtn.addEventListener('click',()=>setTimeout(()=>{
          const log=card.querySelector('.user-log');
          logBtn.textContent=log?.classList.contains('hidden')?'ログを見る':'ログを閉じる';
        },0));
      }

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
  }

  function bindSavedLogEnhancement(){
    const list=$('userSavedList');
    if(!list) return;
    const observer=new MutationObserver(()=>queueMicrotask(enhanceSavedCards));
    observer.observe(list,{childList:true,subtree:true});
    enhanceSavedCards();
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
