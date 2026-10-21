(()=>{
  'use strict';

  const DB_NAME='solarwatch_iphone_field_v1';
  const STORE='sessions';
  const $=id=>document.getElementById(id);

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
      title.textContent=created&&!Number.isNaN(created.getTime())
        ?created.toLocaleString('ja-JP')
        :(session.session_id||'測定データ');

      const estimated=document.createElement('div');
      estimated.className='user-session-time';
      const estimatedDate=session.result?.estimated_time_iso?new Date(session.result.estimated_time_iso):null;
      estimated.textContent='推定時刻 '+(estimatedDate&&!Number.isNaN(estimatedDate.getTime())
        ?estimatedDate.toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit',second:'2-digit'})
        :'--');

      const actions=document.createElement('div');
      actions.className='user-session-actions';
      const logBtn=document.createElement('button');
      logBtn.type='button';
      logBtn.textContent='ログ';
      const shareBtn=document.createElement('button');
      shareBtn.type='button';
      shareBtn.textContent='共有';
      const deleteBtn=document.createElement('button');
      deleteBtn.type='button';
      deleteBtn.textContent='削除';
      deleteBtn.className='delete';
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

  function init(){
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
    $('userSavedBtn')?.addEventListener('click',async()=>{
      closeMenu();
      savedPanel?.classList.remove('hidden');
      await renderSavedData();
    });
    $('userSavedCloseBtn')?.addEventListener('click',()=>savedPanel?.classList.add('hidden'));
    $('userShareAllBtn')?.addEventListener('click',async()=>{
      const sessions=await getSessions();
      await shareCsv('solarwatch_field_all.csv',csvText(sessions));
    });

    if(startButton&&permissionCard){
      const syncPermissionState=()=>{
        if(startButton.disabled&&startButton.textContent.trim()==='取得中'){
          permissionCard.classList.add('user-permission-done');
        }
      };
      new MutationObserver(syncPermissionState).observe(startButton,{attributes:true,childList:true,subtree:true,characterData:true});
      syncPermissionState();
    }

    const history=$('history');
    if(history&&savedPanel){
      new MutationObserver(()=>{
        if(!savedPanel.classList.contains('hidden')) renderSavedData();
      }).observe(history,{childList:true,subtree:true,characterData:true});
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
