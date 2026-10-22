(()=>{
  'use strict';

  const DB_NAME='solarwatch_iphone_field_v1';
  const STORE='sessions';
  const $=id=>document.getElementById(id);
  let pollTimer=null;
  let resultVisible=false;
  let pendingSession=null;
  let saving=false;

  const CSS=`
html,body{width:100%;height:100%;overflow:hidden;background:#000}
body{overscroll-behavior:none}
.wrap{max-width:none!important;width:100%!important;height:100dvh!important;padding:0!important;margin:0!important}
.user-hide,.user-history-card{display:none!important}
.user-permission-card{position:fixed!important;inset:0!important;z-index:60!important;margin:0!important;padding:24px!important;border:0!important;border-radius:0!important;background:rgba(0,0,0,.92)!important;display:flex!important;align-items:center!important;justify-content:center!important}
.user-permission-card.user-permission-done{display:none!important}
.user-permission-card>h2,.user-permission-card>.row,.user-permission-card>#biasModeBox,.user-permission-card>.statuses{display:none!important}
.user-permission-card #startBtn{max-width:420px;margin:0!important;padding:16px!important;font-size:16px!important}
.user-main-card{position:fixed!important;inset:0!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;background:#000!important;overflow:hidden!important}
.user-main-card>h2,.user-main-card>.grid,#sourceText,#flipText,#gateText{display:none!important}
.user-main-card .camera{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;aspect-ratio:auto!important;margin:0!important;border-radius:0!important;background:#000!important}
.user-main-card .camera video{width:100%!important;height:100%!important;object-fit:cover!important}
.user-main-card .reticle{width:92px!important;height:92px!important}
.user-main-card .overlay{display:none!important}
#recordBtn{position:absolute!important;z-index:12!important;left:16px!important;right:16px!important;bottom:calc(16px + env(safe-area-inset-bottom))!important;width:auto!important;margin:0!important;padding:16px 12px!important;border-radius:15px!important;font-size:17px!important;box-shadow:0 6px 24px rgba(0,0,0,.28)!important}
#recordingBox{position:absolute!important;z-index:13!important;left:16px!important;right:16px!important;bottom:calc(82px + env(safe-area-inset-bottom))!important;background:rgba(0,0,0,.60)!important;padding:10px 12px!important;border-radius:12px!important;color:#fff!important}
#recordingBox .muted{color:#fff!important}
#userMeasureStatus{position:absolute;z-index:22;left:24px;right:24px;top:50%;transform:translateY(-50%);padding:22px 18px;border-radius:18px;background:rgba(0,0,0,.74);color:#fff;text-align:center;line-height:1.45;pointer-events:none}
#userMeasureStatus strong{display:block;font-size:1.35rem;font-weight:850}#userMeasureStatus span{display:block;margin-top:7px;font-size:.82rem;color:#eee}
#userMeasureStatus.ready{display:none!important}#userMeasureStatus.bad{background:rgba(157,38,38,.9)}
#resultCard{position:fixed!important;inset:0!important;z-index:50!important;margin:0!important;border:0!important;border-radius:0!important;background:rgba(0,0,0,.88)!important;color:#fff!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;padding:28px!important;text-align:center!important}
#resultCard.hidden{display:none!important}#resultCard h2{font-size:1rem!important;font-weight:600!important;color:#ddd!important;margin-bottom:14px!important}
#resultCard .grid{display:block!important;width:100%!important;max-width:420px!important}#resultCard .grid .metric{display:none!important}
#resultCard .grid .metric.user-estimated{display:block!important;border:0!important;background:transparent!important;color:#fff!important;padding:0!important}
#resultCard .user-estimated .label{font-size:.82rem!important;color:#ddd!important}#resultCard .user-estimated .value{font-size:3.2rem!important;line-height:1.15!important;color:#fff!important;margin-top:8px!important}
#resultCard #resultDetail,#resultCard #downloadBtn,#resultCard #shareLatestBtn{display:none!important}
#userResultActions{width:100%;max-width:420px;margin-top:28px;display:grid;grid-template-columns:1fr 1fr;gap:10px}#userResultActions button{width:100%!important;margin:0!important;padding:15px 10px!important;border-radius:14px!important;font-size:15px!important}
#userSaveResultBtn{background:#f59f00!important;color:#111!important}#userSaveResultBtn:disabled{opacity:.5!important}#resultCard #againBtn{background:#eef1f4!important;color:#222!important}
#userSaveState{width:100%;max-width:420px;box-sizing:border-box;min-height:1.4em;margin-top:10px;padding:9px 11px;border-radius:10px;font-size:.8rem;line-height:1.45;color:#eee;background:rgba(255,255,255,.08)}
#userSaveState.pending{background:rgba(245,159,0,.18);color:#ffe7a8}#userSaveState.saved{background:rgba(8,127,91,.38);color:#dff8ea}#userSaveState.error{background:rgba(184,50,50,.34);color:#ffdada}
#userMenuBtn{position:fixed;z-index:25;left:calc(12px + env(safe-area-inset-left));top:calc(12px + env(safe-area-inset-top));width:48px;height:48px;border-radius:50%;border:0;background:rgba(0,0,0,.58);color:#fff;font-size:24px;line-height:1;margin:0;padding:0}
#userMenuBackdrop{position:fixed;inset:0;z-index:35;background:rgba(0,0,0,.38)}#userMenuBackdrop.hidden,#userSavedPanel.hidden{display:none!important}
#userMenuPanel{position:absolute;left:0;top:0;bottom:0;width:min(78vw,320px);padding:calc(76px + env(safe-area-inset-top)) 18px 20px;background:#fff;color:#20242a;box-shadow:8px 0 32px rgba(0,0,0,.25)}#userMenuPanel button{margin:0 0 10px;width:100%;background:#f3f4f6;color:#20242a;text-align:left;padding:14px;border-radius:12px}
#userSavedPanel{position:fixed;inset:0;z-index:45;background:#f4f5f7;color:#20242a;overflow-y:auto;padding:calc(12px + env(safe-area-inset-top)) 14px calc(20px + env(safe-area-inset-bottom))}
.user-saved-head{display:flex;align-items:center;gap:10px;position:sticky;top:0;background:#f4f5f7;padding:4px 0 12px;z-index:2}.user-saved-head h2{margin:0;flex:1}.user-saved-head button{width:auto;margin:0;padding:10px 12px;min-width:48px;min-height:44px}
#userSavedCount{font-size:.82rem;font-weight:700;color:#68707a;margin:-4px 0 12px}#userShareAllBtn,#userDeleteAllBtn{width:100%;margin:0 0 12px;padding:13px;border-radius:12px}#userShareAllBtn{background:#eef1f4;color:#20242a}#userDeleteAllBtn{border:1px solid #efc7c7;background:#fff0f0;color:#9d2626;font-weight:800}
.user-session{background:#fff;border:1px solid #dfe3e8;border-radius:14px;padding:14px;margin-bottom:10px}.user-session-title{font-weight:800;font-size:1rem}.user-session-time{font-size:1.3rem;font-weight:800;margin-top:5px}.user-session-status{display:inline-block;margin-top:8px;padding:4px 8px;border-radius:999px;font-size:.72rem;font-weight:700;background:#eaf8ef;color:#086b4e}.user-session-status.warn{background:#fff4d6;color:#7a5200}
.user-session-actions{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-top:12px}.user-session-actions button{margin:0;padding:10px 6px;font-size:.82rem;border-radius:10px}.user-session-actions .delete{background:#fff0f0;color:#9d2626}
.user-log{margin-top:10px;border:1px solid #e5e8ec;border-radius:10px;background:#f7f8fa;overflow:hidden;text-align:left}.user-log.hidden{display:none!important}.user-log-row{display:grid;grid-template-columns:minmax(110px,42%) 1fr;gap:10px;padding:9px 12px;border-top:1px solid #eceff2;font-size:.82rem}.user-log-row:first-child{border-top:0}.user-log-label{color:#68707a}.user-log-value{font-weight:650;text-align:right;word-break:break-word}.user-log-note{padding:10px 12px;font-size:.76rem;color:#68707a;line-height:1.5;border-top:1px solid #eceff2;background:#fff}.user-empty{text-align:center;color:#68707a;padding:48px 12px}
`;

  function openDb(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,1);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
  async function getSessions(){const db=await openDb();try{return await new Promise((resolve,reject)=>{const req=db.transaction(STORE,'readonly').objectStore(STORE).getAll();req.onsuccess=()=>resolve((req.result||[]).sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||''))));req.onerror=()=>reject(req.error);});}finally{db.close();}}
  async function putSession(session){const db=await openDb();try{await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(session);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}finally{db.close();}}
  async function deleteSession(id){const db=await openDb();try{await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}finally{db.close();}}
  async function clearSessions(){const db=await openDb();try{await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).clear();tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}finally{db.close();}}

  function fmtNumber(v,d=1,s=''){return Number.isFinite(v)?v.toFixed(d)+s:'--';}
  function fmtDateTime(v){const d=v?new Date(v):null;return d&&!Number.isNaN(d.getTime())?d.toLocaleString('ja-JP'):'--';}
  function fmtTime(v){const d=v?new Date(v):null;return d&&!Number.isNaN(d.getTime())?d.toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit',second:'2-digit'}):'--';}

  function installShell(){
    document.title='SolarWatch';
    if(!$('solarwatchUserAppStyle')){const style=document.createElement('style');style.id='solarwatchUserAppStyle';style.textContent=CSS;document.head.appendChild(style);}
    const wrap=document.querySelector('.wrap');if(!wrap)throw new Error('ユーザーUIの土台が見つかりません');
    const startBtn=$('startBtn'),recordBtn=$('recordBtn'),history=$('history'),resultCard=$('resultCard'),againBtn=$('againBtn');
    wrap.querySelector(':scope > .card')?.classList.add('user-hide');
    startBtn?.closest('.card')?.classList.add('user-permission-card');
    recordBtn?.closest('.card')?.classList.add('user-main-card');
    history?.closest('.card')?.classList.add('user-history-card');
    $('estimatedTime')?.closest('.metric')?.classList.add('user-estimated');
    if(startBtn&&!startBtn.disabled)startBtn.textContent='カメラ・位置情報・センサーを許可して開始';
    if(recordBtn)recordBtn.textContent='10秒測定';
    if(resultCard){const h2=resultCard.querySelector('h2');if(h2)h2.textContent='推定結果';}
    if(againBtn)againBtn.textContent='再測定';

    if(resultCard&&againBtn&&!$('userSaveResultBtn')){
      const actions=document.createElement('div');actions.id='userResultActions';
      const saveBtn=document.createElement('button');saveBtn.id='userSaveResultBtn';saveBtn.type='button';saveBtn.textContent='履歴に保存';saveBtn.disabled=true;
      const state=document.createElement('div');state.id='userSaveState';
      againBtn.parentNode.insertBefore(actions,againBtn);actions.append(saveBtn,againBtn);actions.insertAdjacentElement('afterend',state);
    }

    if(!$('userMenuBtn')){
      const menu=document.createElement('button');menu.id='userMenuBtn';menu.type='button';menu.setAttribute('aria-label','メニュー');menu.textContent='☰';
      const backdrop=document.createElement('div');backdrop.id='userMenuBackdrop';backdrop.className='hidden';backdrop.innerHTML='<div id="userMenuPanel"><button id="userSavedBtn" type="button">保存データ</button><button id="userMenuCloseBtn" type="button">閉じる</button></div>';
      const saved=document.createElement('div');saved.id='userSavedPanel';saved.className='hidden';saved.innerHTML='<div class="user-saved-head"><button id="userSavedCloseBtn" type="button">←</button><h2>保存データ</h2></div><div id="userSavedCount">保存 0件</div><button id="userShareAllBtn" type="button">保存済み全データを共有</button><button id="userDeleteAllBtn" type="button">保存データをすべて削除</button><div id="userSavedList"></div>';
      wrap.prepend(saved);wrap.prepend(backdrop);wrap.prepend(menu);
    }
  }

  function ensureMeasureStatus(){const btn=$('recordBtn');if(!btn)return null;let box=$('userMeasureStatus');if(!box){box=document.createElement('div');box.id='userMeasureStatus';box.setAttribute('aria-live','polite');btn.parentNode.insertBefore(box,btn);}return box;}
  function isRecording(){const box=$('recordingBox');return !!(box&&!box.classList.contains('hidden'));}
  function syncPermission(){const btn=$('startBtn'),card=btn?.closest('.user-permission-card'),camera=$('cameraStatus');if(!btn||!card||!camera)return;const ok=(camera.classList.contains('ok')||/カメラ:\s*OK/.test(camera.textContent||''))&&btn.disabled&&btn.textContent.trim()==='取得中';card.classList.toggle('user-permission-done',ok);}
  function syncMeasureStatus(){
    const box=ensureMeasureStatus();if(!box)return;
    if(isRecording()){box.style.display='none';return;}
    const gate=($('gateText')?.textContent||'').trim(),camera=($('cameraStatus')?.textContent||'').trim(),sensor=($('sensorStatus')?.textContent||'').trim(),gps=($('gpsStatus')?.textContent||'').trim(),btn=$('recordBtn');
    let title='スマホを水平にしてお待ちください',detail='測定の準備をしています。',kind='warn';
    if(/失敗|停止|不可/.test(camera)){title='カメラを利用できません';detail='開始ボタンから再取得してください。';kind='bad';}
    else if(/失敗|許可されません/.test(sensor)){title='センサーを利用できません';detail='ブラウザの許可状態を確認してください。';kind='bad';}
    else if(/非対応|denied|permission/i.test(gps)){title='位置情報を利用できません';detail='ブラウザの許可状態を確認してください。';kind='bad';}
    else if(btn&&!btn.disabled&&/^測定できます/.test(gate)){title='測定できます';detail='';kind='ready';}
    else if(/GPS待機/.test(gate)||/GPS:\s*待機/.test(gps))detail='位置情報を取得しています。';
    else if(/GPS精度/.test(gate))detail='位置情報が安定するまで待っています。';
    else if(/水平|北基準/.test(gate))detail='方位の基準を準備しています。';
    else if(/WMM|偏角/.test(gate))detail='方位を準備しています。';
    box.style.display='block';box.className=kind;
    const oldTitle=box.querySelector('strong')?.textContent||'',oldDetail=box.querySelector('span')?.textContent||'';
    if(oldTitle===title&&oldDetail===detail)return;
    box.replaceChildren();const strong=document.createElement('strong');strong.textContent=title;box.appendChild(strong);if(detail){const span=document.createElement('span');span.textContent=detail;box.appendChild(span);}
  }

  function setSaveState(kind,text){const btn=$('userSaveResultBtn'),state=$('userSaveState');if(!btn||!state)return;state.className='';if(kind)state.classList.add(kind);state.textContent=text||'';btn.disabled=kind!=='pending';btn.textContent=kind==='saved'?'保存しました':'履歴に保存';}
  function syncResult(){
    const card=$('resultCard');if(!card)return;
    const visible=!card.classList.contains('hidden');
    if(visible&&!resultVisible){resultVisible=true;pendingSession=window.__solarwatchUserPendingSession||null;if(pendingSession)setSaveState('pending','この結果はまだ履歴に保存されていません。');else setSaveState('error','今回の測定データを取得できませんでした。');}
    else if(!visible&&resultVisible){resultVisible=false;}
  }

  function logRows(session){return [['測定日時',fmtDateTime(session.created_at)],['推定時刻',fmtTime(session.result?.estimated_time_iso)],['測定状態',session.quality?.valid===false?'注意あり':'正常'],['GPS精度',fmtNumber(session.location?.accuracy,1,' m')],['観測方位',fmtNumber(session.summary?.heading_mean_deg,1,'°')],['観測高度',fmtNumber(session.summary?.elevation_mean_deg,1,'°')],['方位のばらつき',fmtNumber(session.summary?.heading_sd_deg,1,'°')],['高度のばらつき',fmtNumber(session.summary?.elevation_sd_deg,1,'°')],['角度残差',fmtNumber(session.result?.angular_residual_deg,1,'°')]];}
  function makeLog(session){const box=document.createElement('div');box.className='user-log hidden';for(const [label,value] of logRows(session)){const row=document.createElement('div');row.className='user-log-row';const l=document.createElement('div');l.className='user-log-label';l.textContent=label;const v=document.createElement('div');v.className='user-log-value';v.textContent=value;row.append(l,v);box.appendChild(row);}const note=document.createElement('div');note.className='user-log-note';note.textContent='詳細な生データは共有CSVに含まれます。';box.appendChild(note);return box;}

  function csvRows(session){const r=session.result||{},a=session.actual_sun||{},q=session.quality||{};return (session.samples||[]).map(sample=>({session_id:session.session_id,device_label:session.device_label,measurement_condition_id:session.condition_id,created_at:session.created_at,measurement_valid:q.valid!==false,measurement_invalid_reason:q.reason||'',measurement_ready_ratio:q.ready_ratio??null,...sample,mvp_observed_azimuth_deg:session.summary?.heading_mean_deg??null,mvp_observed_elevation_deg:session.summary?.elevation_mean_deg??null,mvp_heading_circular_sd_deg:session.summary?.heading_sd_deg??null,mvp_elevation_sd_deg:session.summary?.elevation_sd_deg??null,mvp_estimated_time_iso:r.estimated_time_iso??null,mvp_actual_time_iso:r.actual_time_iso??null,mvp_time_error_min:r.time_error_min??null,mvp_predicted_sun_azimuth_deg:r.predicted_sun_azimuth_deg??null,mvp_predicted_sun_elevation_deg:r.predicted_sun_elevation_deg??null,mvp_angular_residual_deg:r.angular_residual_deg??null,actual_sun_azimuth_deg:a.azimuth??null,actual_sun_elevation_deg:a.elevation??null}));}
  function csvText(sessions){const rows=sessions.flatMap(csvRows);if(!rows.length)return'';const keys=[...new Set(rows.flatMap(row=>Object.keys(row)))];const esc=value=>{if(value===null||value===undefined)return'';const text=String(value);return /[",\n]/.test(text)?'"'+text.replace(/"/g,'""')+'"':text;};return keys.join(',')+'\n'+rows.map(row=>keys.map(key=>esc(row[key])).join(',')).join('\n');}
  async function shareCsv(filename,text){if(!text){alert('共有できる測定データがありません。');return;}const file=new File([text],filename,{type:'text/csv;charset=utf-8'});try{if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){await navigator.share({title:'SolarWatch 測定データ',text:'SolarWatchの測定CSVです。',files:[file]});return;}if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);alert('CSVデータをクリップボードへコピーしました。');return;}alert('このブラウザでは直接共有できません。');}catch(e){if(e?.name!=='AbortError'){console.error(e);alert('共有に失敗しました。');}}}

  async function renderSaved(){
    const list=$('userSavedList'),count=$('userSavedCount'),share=$('userShareAllBtn'),delAll=$('userDeleteAllBtn');if(!list)return;
    let sessions;try{sessions=await getSessions();}catch(e){console.error(e);list.textContent='保存データを読み込めませんでした。';return;}
    count.textContent='保存 '+sessions.length+'件';share.disabled=!sessions.length;delAll.disabled=!sessions.length;list.replaceChildren();
    if(!sessions.length){const empty=document.createElement('div');empty.className='user-empty';empty.textContent='保存データはありません。';list.appendChild(empty);return;}
    for(const session of sessions){
      const card=document.createElement('div');card.className='user-session';card.dataset.sessionId=session.session_id;
      const title=document.createElement('div');title.className='user-session-title';title.textContent=fmtDateTime(session.created_at);
      const time=document.createElement('div');time.className='user-session-time';time.textContent='推定時刻 '+fmtTime(session.result?.estimated_time_iso);
      const chip=document.createElement('div');chip.className='user-session-status'+(session.quality?.valid===false?' warn':'');chip.textContent=session.quality?.valid===false?'注意あり':'保存済み';
      const actions=document.createElement('div');actions.className='user-session-actions';
      const logBtn=document.createElement('button');logBtn.type='button';logBtn.textContent='ログを見る';
      const shareBtn=document.createElement('button');shareBtn.type='button';shareBtn.textContent='共有';
      const delBtn=document.createElement('button');delBtn.type='button';delBtn.className='delete';delBtn.textContent='1件削除';
      const log=makeLog(session);
      logBtn.onclick=()=>{log.classList.toggle('hidden');logBtn.textContent=log.classList.contains('hidden')?'ログを見る':'ログを閉じる';};
      shareBtn.onclick=()=>shareCsv((session.session_id||'solarwatch_measurement')+'.csv',csvText([session]));
      delBtn.onclick=async()=>{if(!confirm('この測定データを削除しますか？\n削除すると元に戻せません。'))return;delBtn.disabled=true;try{await deleteSession(session.session_id);await renderSaved();}catch(e){console.error(e);delBtn.disabled=false;alert('削除に失敗しました。');}};
      actions.append(logBtn,shareBtn,delBtn);card.append(title,time,chip,actions,log);list.appendChild(card);
    }
  }

  function bindEvents(){
    const backdrop=$('userMenuBackdrop'),panel=$('userSavedPanel');
    const closeMenu=()=>backdrop?.classList.add('hidden');
    $('userMenuBtn')?.addEventListener('click',()=>backdrop?.classList.remove('hidden'));
    $('userMenuCloseBtn')?.addEventListener('click',closeMenu);
    backdrop?.addEventListener('click',e=>{if(e.target===backdrop)closeMenu();});
    $('userSavedBtn')?.addEventListener('click',async()=>{closeMenu();panel?.classList.remove('hidden');await renderSaved();});
    $('userSavedCloseBtn')?.addEventListener('click',()=>panel?.classList.add('hidden'));
    $('userShareAllBtn')?.addEventListener('click',async()=>{const sessions=await getSessions();await shareCsv('solarwatch_field_all.csv',csvText(sessions));});
    $('userDeleteAllBtn')?.addEventListener('click',async()=>{if(!confirm('保存済みの測定データをすべて削除しますか？\nこの操作は取り消せません。'))return;const btn=$('userDeleteAllBtn');btn.disabled=true;try{await clearSessions();await renderSaved();}catch(e){console.error(e);btn.disabled=false;alert('保存データの削除に失敗しました。');}});

    $('userSaveResultBtn')?.addEventListener('click',async()=>{if(!pendingSession||saving)return;saving=true;const btn=$('userSaveResultBtn');btn.disabled=true;try{await putSession(pendingSession);window.__solarwatchUserPendingSession=null;pendingSession=null;setSaveState('saved','✓ 履歴に保存しました。');}catch(e){console.error(e);setSaveState('pending','保存に失敗しました。もう一度お試しください。');}finally{saving=false;}});
    const again=$('againBtn');if(again)again.onclick=()=>{pendingSession=null;window.__solarwatchUserPendingSession=null;setSaveState('', '');$('resultCard')?.classList.add('hidden');};
  }

  function init(){
    try{
      installShell();bindEvents();syncPermission();syncMeasureStatus();syncResult();
      pollTimer=setInterval(()=>{if(document.hidden)return;syncPermission();syncMeasureStatus();syncResult();},300);
      $('userBootShield')?.remove();
    }catch(e){console.error('user app init failed',e);const shield=$('userBootShield');if(shield){shield.textContent='ユーザー版の初期化に失敗しました。';shield.classList.add('bad');}}
  }

  window.addEventListener('pagehide',()=>{if(pollTimer){clearInterval(pollTimer);pollTimer=null;}},{once:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
