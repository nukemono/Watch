from pathlib import Path

p=Path('iphone-field.html')
s=p.read_text()

s=s.replace('const READY_WINDOW_MS = 2500, READY_HOLD_MS = 1500;', 'const READY_WINDOW_MS = 2500, READY_HOLD_MS = 800;', 1)
s=s.replace('const READY_HEADING_SD_MAX = 3, READY_ROT_MAX = 8;', 'const READY_HEADING_SD_MAX = 5, READY_ROT_MAX = 20;', 1)

old="""    if(held) setStatus('readyStatus','安定性: 測定可','ok');
    else if(rawReady) setStatus('readyStatus','安定性: '+(heldMs/1000).toFixed(1)+'/1.5秒','warn');
    else setStatus('readyStatus','安定性: '+(finite(hs.sd)?'SD '+hs.sd.toFixed(1)+'°':'待機'),'warn');"""
new="""    if(held) setStatus('readyStatus','安定性: 良好','ok');
    else if(rawReady) setStatus('readyStatus','安定性: 安定中 '+(heldMs/1000).toFixed(1)+'/0.8秒','warn');
    else setStatus('readyStatus','安定性: 参考 SD '+(finite(hs.sd)?hs.sd.toFixed(1)+'°':'--'),'warn');"""
if old not in s: raise SystemExit('stability label anchor not found')
s=s.replace(old,new,1)

old="""    $('gateText').textContent=!state.location?'GPS待機中':!sensorOk?'方位・高度角の取得待ち':stab.held&&gpsOk?'測定できます。太陽を中央に保って開始してください。':'測定は開始できます。現在は品質条件未達のため、結果が無効判定になる可能性があります。';"""
new="""    $('gateText').textContent=!state.location?'GPS待機中':!sensorOk?'方位・高度角の取得待ち':stab.held?'測定できます。安定性は良好です。':'測定できます。安定性は参考表示なので、そのまま測定して構いません。';"""
if old not in s: raise SystemExit('gate text anchor not found')
s=s.replace(old,new,1)

old="""      const q=sampleQuality(sample);
      if(q.hard){ state.recordAbortReason=q.reason; finishRecord(true); return; }
      if(!q.ok){
        if(state.recordUnstableSince===null)state.recordUnstableSince=performance.now();
        if(performance.now()-state.recordUnstableSince>=RECORD_UNSTABLE_GRACE_MS){ state.recordAbortReason=q.reason; finishRecord(true); return; }
      }else state.recordUnstableSince=null;"""
new="""      // 安定性は診断用として記録するだけで、測定を中断しない。
      // 手持ち測定では多少の揺れが自然なので、必ず10秒間サンプリングを続ける。"""
if old not in s: raise SystemExit('record abort anchor not found')
s=s.replace(old,new,1)

old="""    const reasons=[];
    if(aborted)reasons.push(state.recordAbortReason||'測定中に端末が不安定になりました');
    if(state.samples.length<MIN_SAMPLE_COUNT)reasons.push(`サンプル不足 ${state.samples.length}/${MIN_SAMPLE_COUNT}`);
    if(!finite(hs.sd)||hs.sd>FINAL_HEADING_SD_MAX)reasons.push(`方位SD ${finite(hs.sd)?hs.sd.toFixed(1):'--'}°`);
    if(!finite(es.sd)||es.sd>FINAL_ELEV_SD_MAX)reasons.push(`高度SD ${finite(es.sd)?es.sd.toFixed(1):'--'}°`);
    if(readyRatio<MIN_READY_RATIO)reasons.push(`安定サンプル率 ${(readyRatio*100).toFixed(0)}%`);
    if(!loc||!finite(loc.accuracy)||loc.accuracy>MAX_GPS_ACCURACY)reasons.push(`GPS精度 ${loc&&finite(loc.accuracy)?loc.accuracy.toFixed(0):'--'}m`);"""
new="""    const reasons=[];
    // 安定性は参考値として保存するだけで、無効判定には使わない。
    if(state.samples.length<MIN_SAMPLE_COUNT)reasons.push(`サンプル不足 ${state.samples.length}/${MIN_SAMPLE_COUNT}`);
    if(!finite(hs.mean)||!finite(es.mean))reasons.push('方位または高度角の平均を算出できません');
    if(!loc)reasons.push('GPS位置を取得できません');"""
if old not in s: raise SystemExit('finish quality anchor not found')
s=s.replace(old,new,1)

old="""      location:loc,quality:{valid,reason:reasons.join(' / '),ready_ratio:readyRatio,sample_count:state.samples.length},"""
new="""      location:loc,quality:{valid,reason:reasons.join(' / '),ready_ratio:readyRatio,sample_count:state.samples.length,heading_sd_deg:hs.sd,elevation_sd_deg:es.sd,stability_advisory_only:true},"""
if old not in s: raise SystemExit('quality object anchor not found')
s=s.replace(old,new,1)

p.write_text(s)
