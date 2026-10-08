from pathlib import Path

p = Path('iphone-field.html')
s = p.read_text()

old = """    const stab=updateStability();
    const gpsOk=state.location && finite(state.location.accuracy) && state.location.accuracy<=MAX_GPS_ACCURACY;
    const usable=state.started && gpsOk && finite(state.primaryHeading) && finite(state.cameraElevation) && stab.held;
    $('recordBtn').disabled=!usable || state.recording;
    $('gateText').textContent=!state.location?'GPS待機中':!gpsOk?`GPS精度 ${state.location.accuracy.toFixed(0)}m：50m以下を待っています`:stab.held?'測定できます。太陽を中央に保って開始してください。':'安定性が1.5秒継続すると測定できます。';"""
new = """    const stab=updateStability();
    const gpsOk=state.location && finite(state.location.accuracy) && state.location.accuracy<=MAX_GPS_ACCURACY;
    const sensorOk=finite(state.primaryHeading) && finite(state.cameraElevation);
    const usable=state.started && state.location && sensorOk;
    $('recordBtn').disabled=!usable || state.recording;
    $('gateText').textContent=!state.location?'GPS待機中':!sensorOk?'方位・高度角の取得待ち':stab.held&&gpsOk?'測定できます。太陽を中央に保って開始してください。':'測定は開始できます。現在は品質条件未達のため、結果が無効判定になる可能性があります。';"""
if old not in s:
    raise SystemExit('render gate anchor not found')
s = s.replace(old, new, 1)

old = """    const stab=state.lastStability||{};
    const gpsOk=state.location && finite(state.location.accuracy) && state.location.accuracy<=MAX_GPS_ACCURACY;
    const sensorOk=finite(state.primaryHeading) && finite(state.cameraElevation);
    if(!gpsOk||!sensorOk){
      alert('GPS・方位・高度角の取得を確認してから測定してください。');
      return;
    }
    if(!stab.held){
      alert('安定性が「測定可」になってから測定してください。');
      return;
    }
    state.recording=true; state.samples=[]; state.recordStartPerf=performance.now();"""
new = """    const stab=state.lastStability||{};
    const sensorOk=finite(state.primaryHeading) && finite(state.cameraElevation);
    if(!state.location||!sensorOk){
      alert('GPS・方位・高度角の取得が完了してから測定してください。');
      return;
    }
    state.recording=true; state.samples=[]; state.recordStartPerf=performance.now();"""
if old not in s:
    raise SystemExit('record guard anchor not found')
s = s.replace(old, new, 1)

p.write_text(s)
