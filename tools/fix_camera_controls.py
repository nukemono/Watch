from pathlib import Path

p = Path('iphone-field.html')
s = p.read_text()

old = 'video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.fallback'
new = 'video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;-webkit-user-select:none;user-select:none}video::-webkit-media-controls,video::-webkit-media-controls-panel,video::-webkit-media-controls-start-playback-button{display:none!important;-webkit-appearance:none}.fallback'
if old not in s:
    raise SystemExit('video css anchor not found')
s = s.replace(old, new, 1)

old = '<video id="video" autoplay muted playsinline></video>'
new = '<video id="video" autoplay muted playsinline disablepictureinpicture controlslist="nodownload noplaybackrate noremoteplayback" tabindex="-1" aria-hidden="true"></video>'
if old not in s:
    raise SystemExit('video element anchor not found')
s = s.replace(old, new, 1)

old = """  async function startCamera(){
    try{
      state.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
      $('video').srcObject=state.stream;
      $('fallback').classList.add('hidden');
      setStatus('cameraStatus','カメラ: OK','ok');
    }catch(err){
      $('fallback').textContent='カメラ取得不可: '+err.message;
      setStatus('cameraStatus','カメラ: 失敗','bad');
    }
  }"""
new = """  async function startCamera(){
    try{
      state.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
      const video=$('video');
      // iOS Safari の動画プレイヤーUIを無効化し、カメラプレビューとしてだけ使う。
      video.controls=false;
      video.removeAttribute('controls');
      video.autoplay=true;
      video.muted=true;
      video.defaultMuted=true;
      video.playsInline=true;
      video.setAttribute('playsinline','');
      video.setAttribute('webkit-playsinline','');
      if('disablePictureInPicture' in video) video.disablePictureInPicture=true;
      video.srcObject=state.stream;
      if(!video.dataset.cameraPauseGuard){
        video.dataset.cameraPauseGuard='1';
        video.addEventListener('pause',()=>{
          if(state.stream&&state.stream.active) video.play().catch(()=>{});
        });
      }
      await video.play().catch(()=>{});
      for(const track of state.stream.getVideoTracks()){
        track.onended=()=>{
          setStatus('cameraStatus','カメラ: 停止','bad');
          $('fallback').textContent='カメラが停止しました。「カメラを再取得」を押してください。';
          $('fallback').classList.remove('hidden');
          $('startBtn').disabled=false;
          $('startBtn').textContent='カメラを再取得';
        };
      }
      $('fallback').classList.add('hidden');
      setStatus('cameraStatus','カメラ: OK','ok');
    }catch(err){
      $('fallback').textContent='カメラ取得不可: '+err.message;
      $('fallback').classList.remove('hidden');
      setStatus('cameraStatus','カメラ: 失敗','bad');
    }
  }"""
if old not in s:
    raise SystemExit('startCamera anchor not found')
s = s.replace(old, new, 1)
p.write_text(s)

p = Path('.github/workflows/pr-preview.yml')
s = p.read_text()
old = """      - name: Checkout PR branch
        if: github.event.action != 'closed'
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.sha }}
"""
new = """      - name: Checkout PR branch
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.sha }}
"""
if old not in s:
    raise SystemExit('preview checkout anchor not found')
s = s.replace(old, new, 1)
p.write_text(s)
