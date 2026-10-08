from pathlib import Path

p = Path('iphone-field.html')
s = p.read_text()

old = """    const est=(valid&&loc&&finite(hs.mean)&&finite(es.mean))?estimateTime(hs.mean,es.mean,actual,loc.lat,loc.lon):null;"""
new = """    // 品質判定とは独立して、方位・高度・位置があれば推定時刻は必ず計算して参考表示する。
    const est=(loc&&finite(hs.mean)&&finite(es.mean))?estimateTime(hs.mean,es.mean,actual,loc.lat,loc.lon):null;"""
if old not in s:
    raise SystemExit('estimate anchor not found')
s = s.replace(old, new, 1)

old = """    if(!q.valid) detail.textContent='無効測定として保存しました。理由: '+(q.reason||'品質条件を満たしませんでした')+'。時刻推定には使用しません。';
    else detail.textContent=`推定太陽 方位 ${r.predicted_sun_azimuth_deg.toFixed(1)}° / 高度 ${r.predicted_sun_elevation_deg.toFixed(1)}°。実時刻の太陽 方位 ${s.actual_sun.azimuth.toFixed(1)}° / 高度 ${s.actual_sun.elevation.toFixed(1)}°。磁気影響候補は検証用端末時刻との比較で判定しています。`;"""
new = """    if(!q.valid&&r) detail.textContent='品質条件に注意があります: '+(q.reason||'品質条件を満たしませんでした')+'。推定時刻と端末時刻との差は参考値として表示しています。';
    else if(!q.valid) detail.textContent='無効測定として保存しました。理由: '+(q.reason||'品質条件を満たしませんでした')+'。推定に必要な値が不足しています。';
    else if(r) detail.textContent=`推定太陽 方位 ${r.predicted_sun_azimuth_deg.toFixed(1)}° / 高度 ${r.predicted_sun_elevation_deg.toFixed(1)}°。実時刻の太陽 方位 ${s.actual_sun.azimuth.toFixed(1)}° / 高度 ${s.actual_sun.elevation.toFixed(1)}°。磁気影響候補は検証用端末時刻との比較で判定しています。`;
    else detail.textContent='方位・高度・GPSのいずれかが不足し、時刻を推定できませんでした。';"""
if old not in s:
    raise SystemExit('showResult detail anchor not found')
s = s.replace(old, new, 1)
p.write_text(s)

p = Path('magnetic-bias-mode.js')
s = p.read_text()

old = """    }else{
      $('estimatedTime').textContent='--';$('timeError').textContent='--';
      if(b?.status==='pending')$('resultDetail').textContent=`1回目を保存しました。あと${b.needed}回、同じ端末名・条件ID・近い地点で時間を空けて測定してください。`;
      else if(b?.status==='pending_span')$('resultDetail').textContent=`観測は${b.observation_count}回ありますが時間幅が${b.observation_span_min.toFixed(1)}分です。あと${b.needed_span_min.toFixed(1)}分以上空けてください。`;
      else if(b?.confidence==='low')$('resultDetail').textContent=`磁気バイアスは推定できましたが残差RMS ${b.residual_rms_deg.toFixed(1)}°が大きいため、時刻推定には採用していません。`;
    }"""
new = """    }else{
      // バイアス推定がまだ成立していなくても、従来の1回観測推定は消さずに暫定値として表示する。
      if(r){
        $('estimatedTime').textContent=new Date(r.estimated_time_iso).toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
        $('timeError').textContent=(r.time_error_min>=0?'+':'')+r.time_error_min.toFixed(1)+'分';
        if(Number.isFinite(r.angular_residual_deg))$('residual').textContent=r.angular_residual_deg.toFixed(1)+'°';
      }else{
        $('estimatedTime').textContent='--';$('timeError').textContent='--';
      }
      if(b?.status==='pending')$('resultDetail').textContent=`磁気バイアス推定はあと${b.needed}回必要です。現在は従来の1回観測による推定時刻を暫定表示しています。`;
      else if(b?.status==='pending_span')$('resultDetail').textContent=`観測は${b.observation_count}回ありますが時間幅が${b.observation_span_min.toFixed(1)}分です。あと${b.needed_span_min.toFixed(1)}分以上空けてください。現在は1回観測の推定値を暫定表示しています。`;
      else if(b?.confidence==='low')$('resultDetail').textContent=`磁気バイアスは推定できましたが残差RMS ${b.residual_rms_deg.toFixed(1)}°が大きいため補正を採用せず、1回観測の推定値を表示しています。`;
    }"""
if old not in s:
    raise SystemExit('applyResultUi anchor not found')
s = s.replace(old, new, 1)

old = """    processedId=latest.session_id;latest.magnetic_bias_mode=true;latest.observation_time_iso=obsTime(latest)?.toISOString()||latest.created_at;
    const withCurrent=[latest,...all.slice(1)];
    const b=estimate(withCurrent,latest);latest.bias_estimation=b;
    if(b.status==='estimated'&&b.confidence!=='low'){
      const estTime=new Date(b.current_estimated_time_iso),actual=obsTime(latest);
      latest.result={estimated_time_iso:estTime.toISOString(),actual_time_iso:actual.toISOString(),time_error_min:(estTime-actual)/60000,predicted_sun_azimuth_deg:b.current_predicted_sun_azimuth_deg,predicted_sun_elevation_deg:b.current_predicted_sun_elevation_deg,angular_residual_deg:b.residual_rms_deg,estimation_method:'magnetic_bias_multi_observation',magnetic_bias_deg:b.magnetic_bias_deg,observation_count:b.observation_count};
    }else latest.result=null;"""
new = """    processedId=latest.session_id;latest.magnetic_bias_mode=true;latest.observation_time_iso=obsTime(latest)?.toISOString()||latest.created_at;
    // base側で計算済みの1回観測結果を退避し、複数観測補正が成立するまで暫定結果として保持する。
    if(latest.result&&!latest.single_observation_result){
      latest.single_observation_result={...latest.result,estimation_method:'single_observation'};
    }
    const withCurrent=[latest,...all.slice(1)];
    const b=estimate(withCurrent,latest);latest.bias_estimation=b;
    if(b.status==='estimated'&&b.confidence!=='low'){
      const estTime=new Date(b.current_estimated_time_iso),actual=obsTime(latest);
      latest.result={estimated_time_iso:estTime.toISOString(),actual_time_iso:actual.toISOString(),time_error_min:(estTime-actual)/60000,predicted_sun_azimuth_deg:b.current_predicted_sun_azimuth_deg,predicted_sun_elevation_deg:b.current_predicted_sun_elevation_deg,angular_residual_deg:b.residual_rms_deg,estimation_method:'magnetic_bias_multi_observation',magnetic_bias_deg:b.magnetic_bias_deg,observation_count:b.observation_count};
    }else{
      latest.result=latest.single_observation_result||latest.result||null;
    }"""
if old not in s:
    raise SystemExit('processLatest anchor not found')
s = s.replace(old, new, 1)
p.write_text(s)
