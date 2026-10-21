(()=>{
  'use strict';

  const DB_NAME='solarwatch_iphone_field_v1';
  const STORE='sessions';
  const $=id=>document.getElementById(id);

  const USER_CSS=`
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
#resultCard{position:fixed!important;inset:0!important;z-index:50!important;margin:0!important;border:0!important;border-radius:0!important;background:rgba(0,0,0,.88)!important;color:#fff!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;padding:28px!important;text-align:center!important}
#resultCard.hidden{display:none!important}
#resultCard h2{font-size:1rem!important;font-weight:600!important;color:#ddd!important;margin-bottom:14px!important}
#resultCard .grid{display:block!important;width:100%!important;max-width:420px!important}
#resultCard .grid .metric{display:none!important}
#resultCard .grid .metric.user-estimated{display:block!important;border:0!important;background:transparent!important;color:#fff!important;padding:0!important}
#resultCard .user-estimated .label{font-size:.82rem!important;color:#ddd!important}
#resultCard .user-estimated .value{font-size:3.2rem!important;line-height:1.15!important;color:#fff!important;margin-top:8px!important}
#resultCard #resultDetail,#resultCard #downloadBtn,#resultCard #shareLatestBtn{display:none!important}
#resultCard #againBtn{max-width:420px!important;margin-top:28px!important;padding:15px!important;background:#f59f00!important;color:#111!important}
#userMenuBtn{position:fixed;z-index:25;left:calc(12px + env(safe-area-inset-left));top:calc(12px + env(safe-area-inset-top));width:48px;height:48px;border-radius:50%;border:0;background:rgba(0,0,0,.58);color:#fff;font-size:24px;line-height:1;margin:0;padding:0;box-shadow:none}
#userMenuBackdrop{position:fixed;inset:0;z-index:35;background:rgba(0,0,0,.38)}
#userMenuBackdrop.hidden,#userSavedPanel.hidden{display:none!important}
#userMenuPanel{position:absolute;left:0;top:0;bottom:0;width:min(78vw,320px);padding:calc(76px + env(safe-area-inset-top)) 18px 20px;background:#fff;color:#20242a;box-shadow:8px 0 32px rgba(0,0,0,.25)}
#userMenuPanel button{margin:0 0 10px;width:100%;background:#f3f4f6;color:#20242a;text-align:left;padding:14px;border-radius:12px}
#userSavedPanel{position:fixed;inset:0;z-index:45;background:#f4f5f7;color:#20242a;overflow-y:auto;padding:calc(12px + env(safe-area-inset-top)) 14px calc(20px + env(safe-area-inset-bottom))}
.user-saved-head{display:flex;align-items:center;gap:10px;position:sticky;top:0;background:#f4f5f7;padding:4px 0 12px;z-index:2}.user-saved-head h2{margin:0;flex:1}.user-saved-head button{width:auto;margin:0;padding:10px 12px}
#userShareAllBtn{width:100%;margin:0 0 12px;padding:13px;border-radius:12px;background:#eef1f4;color:#20242a}
.user-session{background:#fff;border:1px solid #dfe3e8;border-radius:14px;padding:14px;margin-bottom:10px}.user-session-title{font-weight:800;font-size:1rem}.user-session-time{font-size:1.3rem;font-weight:800;margin-top:5px}.user-session-actions{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-top:12px}.user-session-actions button{margin:0;padding:10px 6px;font-size:.82rem;border-radius:10px}.user-session-actions .delete{background:#fff0f0;color:#9d2626}.user-log{margin-top:10px;padding:10px;border-radius:10px;background:#f7f8fa;font-size:.73rem;white-space:pre-wrap;word-break:break-word;text-align:left}.user-empty{text-align:center;color:#68707a;padding:48px 12px}
`;

  function installUserShell(){
    document.title='SolarWatch';

    if(!$('solarwatchUserStyle')){
      const style=document.createElement('style');
      style.id='solarwatchUserStyle';
      style.textContent=USER_CSS;
      document.head.appendChild(style);
    }

    const wrap=document.querySelector('.wrap');
    if(!wrap) throw new Error('ユーザーUI: .wrap が見つかりません');

    const startBtn=$('startBtn');
    const recordBtn=$('recordBtn');
    const history=$('history');
    const resultCard=$('resultCard');

    const headerCard=wrap.querySelector(':scope > .card');
    headerCard?.classList.add('user-hide');
    startBtn?.closest('.card')?.classList.add('user-permission-card');
    recordBtn?.closest('.card')?.classList.add('user-main-card');
    history?.closest('.card')?.classList.add('user-history-card');
    $('estimatedTime')?.closest('.metric')?.classList.add('user-estimated');

    if(startBtn&&!startBtn.disabled) startBtn.textContent='カメラ・位置情報・センサーを許可して開始';
    if(recordBtn) recordBtn.textContent='10秒測定';
    if(resultCard){
      const h2=resultCard.querySelector('h2');
      if(h2) h2.textContent='推定結果';
    }
    if($('againBtn')) $('againBtn').textContent='もう一度測る';

    if(!$('userMenuBtn')){
      const menuBtn=document.createElement('button');
      menuBtn.id='userMenuBtn';
      menuBtn.type='button';
      menuBtn.setAttribute('aria-label','メニュー');
      menuBtn.textContent='☰';

      const backdrop=document.createElement('div');
      backdrop.id='userMenuBackdrop';
      backdrop.className='hidden';
      backdrop.innerHTML='<div id="userMenuPanel"><button id="userSavedBtn" type="button">保存データ</button><button id="userMenuCloseBtn" type="button">閉じる</button></div>';

      const saved=document.createElement('div');
      saved.id='userSavedPanel';
      saved.className='hidden';
      saved.innerHTML='<div class="user-saved-head"><button id="userSavedCloseBtn" type="button">←</button><h2>保存データ</h2></div><button id="userShareAllBtn" type="button">保存済み全データを共有</button><div id="userSavedList"></div>';

      wrap.prepend(saved);
      wrap.prepend(backdrop);
      wrap.prepend(menuBtn);
    }
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

  async function getSessions(){
    const db=await openDb();
    const rows=await new Promise((resolve,reject)=>{
      const req=db.transaction(STORE,'readonly').objectStore(STORE).getAll();
      req.onsuccess=()=>resolve(req.result||[]);
      req.onerror=()=>reject(req.error);
    });
    db.close();
    return rows.sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')));
  }

  async function deleteSession(id){
    const db=await openDb();
    await new Promise((resolve,reject)=>{
      const req=db.transaction(STORE,'readwrite').objectStore(STORE).delete(id);
      req.onsuccess=()=>resolve();
      req.onerror=()=>reject(req.error);
    });
    db.close();
  }

  function csvRows(session){
    const r=session.result||{}, a=session.actual_sun||{}, q=session.quality||{};
    return (session.samples||[]).map(sample=>({
      session_id:session.session_id,
      device_label:session.device_label,
      measurement_condition_id:session.condition_id,
      created_at:session.created_at,
      measurement_valid:q.valid!==false,
      measurement_invalid_reason:q.reason||'',
      measurement_ready_ratio:q.ready_ratio??null,
      measurement_quality_sample_count:q.sample_count??null,
      measurement_estimation_sample_count:q.estimation_sample_count??null,
      ...sample,
      mvp_observed_azimuth_deg:session.summary?.heading_mean_deg??null,
      mvp_observed_elevation_deg:session.summary?.elevation_mean_deg??null,
      mvp_heading_circular_sd_deg:session.summary?.heading_sd_deg??null,
      mvp_elevation_sd_deg:session.summary?.elevation_sd_deg??null,
      mvp_sample_count:session.summary?.sample_count??null,
      mvp_estimation_sample_count:session.summary?.estimation_sample_count??null,
      mvp_elevation_coordinate:session.summary?.elevation_coordinate??null,
      mvp_estimated_time_iso:r.estimated_time_iso??null,
      mvp_actual_time_iso:r.actual_time_iso??null,
      mvp_time_error_min:r.time_error_min??null,
      mvp_predicted_sun_azimuth_deg:r.predicted_sun_azimuth_deg??null,
      mvp_predicted_sun_elevation_deg:r.predicted_sun_elevation_deg??null,
      mvp_angular_residual_deg:r.angular_residual_deg??null,
      actual_sun_azimuth_deg:a.azimuth??null,
      actual_sun_elevation_deg:a.elevation??null,
      observation_azimuth_error_deg:session.sensor_validation?.azimuth_error_deg??null,
      observation_elevation_error_deg:session.sensor_validation?.elevation_error_deg??null
    }));
  }

  function csvText(sessions){
    const rows=sessions.flatMap(csvRows);
    if(!rows.length) return '';
    const keys=[...new Set(rows.flatMap(row=>Object.keys(row)))];
    const esc=value=>{
      if(value===null||value===undefined) return '';
      const text=String(value);
      return /[",\n]/.test(text)?'"'+text.replace(/"/g,'""')+'"':text;
    };
    return keys.join(',')+'\n'+rows.map(row=>keys.map(key=>esc(row[key])).join(',')).join('\n');
  }

  async function shareCsv(filename,text){
    if(!text){alert('共有できる測定データがありません。');return;}
    const file=new File([text],filename,{type:'text/csv;charset=utf-8'});
    try{
      if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){
        await navigator.share({title:'SolarWatch 測定データ',text:'SolarWatchの測定CSVです。',files:[file]});
        return;
      }
      if(navigator.clipboard&&navigator.clipboard.writeText){
        await navigator.clipboard.writeText(text);
        alert('CSVデータをクリップボードへコピーしました。');
        return;
      }
      alert('このブラウザでは直接共有できません。');
    }catch(e){
      if(e&&e.name==='AbortError') return;
      alert('共有に失敗しました。');
    }
  }

  function logSummary(session){
    return JSON.stringify({
      session_id:session.session_id,
      created_at:session.created_at,
      measurement_valid:session.quality?.valid??null,
      observed_azimuth_deg:session.summary?.heading_mean_deg??null,
      observed_elevation_deg:session.summary?.elevation_mean_deg??null,
      heading_sd_deg:session.summary?.heading_sd_deg??null,
      elevation_sd_deg:session.summary?.elevation_sd_deg??null,
      gps_accuracy_m:session.location?.accuracy??null,
      estimated_time_iso:session.result?.estimated_time_iso??null,
      predicted_sun_azimuth_deg:session.result?.predicted_sun_azimuth_deg??null,
      predicted_sun_elevation_deg:session.result?.predicted_sun_elevation_deg??null,
      angular_residual_deg:session.result?.angular_residual_deg??null
    },null,2);
  }

  async function renderSavedData(){
    const list=$('userSavedList');
    if(!list) return;
    let sessions=[];
    try{sessions=await getSessions();}
    catch(e){list.textContent='保存データを読み込めませんでした。';return;}

    list.textContent='';
    const shareAll=$('userShareAllBtn');
    if(shareAll) shareAll.disabled=!sessions.length;
    if(!sessions.length){
      const empty=document.createElement('div');
      empty.className='user-empty';
      empty.textContent='保存データはありません。';
      list.appendChild(empty);
      return;
    }

    for(const session of sessions){
      const card=document.createElement('div');
      card.className='user-session';
      const title=document.createElement('div');
      title.className='user-session-title';
      const created=session.created_at?new Date(session.created_at):null;
      title.textContent=created&&!Number.isNaN(created.getTime())?created.toLocaleString('ja-JP'):(session.session_id||'測定データ');

      const estimated=document.createElement('div');
      estimated.className='user-session-time';
      const estimatedDate=session.result?.estimated_time_iso?new Date(session.result.estimated_time_iso):null;
      estimated.textContent='推定時刻 '+(estimatedDate&&!Number.isNaN(estimatedDate.getTime())?estimatedDate.toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit',second:'2-digit'}):'--');

      const actions=document.createElement('div');
      actions.className='user-session-actions';
      const logBtn=document.createElement('button');
      logBtn.type='button'; logBtn.textContent='ログ';
      const shareBtn=document.createElement('button');
      shareBtn.type='button'; shareBtn.textContent='共有';
      const deleteBtn=document.createElement('button');
      deleteBtn.type='button'; deleteBtn.textContent='削除'; deleteBtn.className='delete';
      const log=document.createElement('pre');
      log.className='user-log hidden';
      log.textContent=logSummary(session);

      logBtn.addEventListener('click',()=>log.classList.toggle('hidden'));
      shareBtn.addEventListener('click',()=>shareCsv((session.session_id||'solarwatch_measurement')+'.csv',csvText([session])));
      deleteBtn.addEventListener('click',async()=>{
        if(!confirm('この測定データを削除しますか？\n削除すると元に戻せません。')) return;
        await deleteSession(session.session_id);
        await renderSavedData();
      });

      actions.append(logBtn,shareBtn,deleteBtn);
      card.append(title,estimated,actions,log);
      list.appendChild(card);
    }
  }

  function bindUserEvents(){
    const menuBtn=$('userMenuBtn');
    const menuBackdrop=$('userMenuBackdrop');
    const savedPanel=$('userSavedPanel');
    const startButton=$('startBtn');
    const permissionCard=startButton?startButton.closest('.user-permission-card'):null;

    const openMenu=()=>menuBackdrop?.classList.remove('hidden');
    const closeMenu=()=>menuBackdrop?.classList.add('hidden');
    menuBtn?.addEventListener('click',openMenu);
    $('userMenuCloseBtn')?.addEventListener('click',closeMenu);
    menuBackdrop?.addEventListener('click',e=>{if(e.target===menuBackdrop) closeMenu();});
    $('userSavedBtn')?.addEventListener('click',async()=>{closeMenu();savedPanel?.classList.remove('hidden');await renderSavedData();});
    $('userSavedCloseBtn')?.addEventListener('click',()=>savedPanel?.classList.add('hidden'));
    $('userShareAllBtn')?.addEventListener('click',async()=>{const sessions=await getSessions();await shareCsv('solarwatch_field_all.csv',csvText(sessions));});

    if(startButton&&permissionCard){
      const syncPermissionState=()=>{
        if(startButton.disabled&&startButton.textContent.trim()==='取得中') permissionCard.classList.add('user-permission-done');
      };
      new MutationObserver(syncPermissionState).observe(startButton,{attributes:true,childList:true,subtree:true,characterData:true});
      syncPermissionState();
    }

    const history=$('history');
    if(history&&savedPanel){
      new MutationObserver(()=>{if(!savedPanel.classList.contains('hidden')) renderSavedData();}).observe(history,{childList:true,subtree:true,characterData:true});
    }
  }

  function init(){
    try{
      installUserShell();
      bindUserEvents();
    }catch(e){
      console.error('user-ui initialization failed',e);
      alert('ユーザー画面の初期化に失敗しました。ページを再読み込みしてください。');
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
