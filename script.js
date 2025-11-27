const video = document.getElementById('video')
const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
let last = null
let playing = false

function playMelody(notes){
  if(playing) return
  playing = true
  let t = audioCtx.currentTime
  for(const [f,d] of notes){
    const o = audioCtx.createOscillator()
    const g = audioCtx.createGain()
    o.frequency.value = f
    o.connect(g)
    g.connect(audioCtx.destination)
    g.gain.value = 0.2
    o.start(t)
    o.stop(t+d)
    t += d
  }
  setTimeout(()=>playing=false,t-audioCtx.currentTime)
}

function playEmotion(e){
  if(e==="happy") playMelody([[400,0.25],[450,0.25],[500,0.25],[550,0.25],[600,0.25],[650,0.25],[700,0.25]])
  else if(e==="sad") playMelody([[300,0.35],[280,0.35],[260,0.35],[240,0.35],[220,0.35],[200,0.35]])
  else if(e==="angry") playMelody([[150,0.15],[180,0.15],[120,0.15],[180,0.15],[150,0.15]])
  else if(e==="surprised") playMelody([[700,0.25],[750,0.25],[800,0.25],[850,0.25],[900,0.25],[950,0.25]])
  else playMelody([[400,0.3],[450,0.3],[400,0.3]])
}

document.addEventListener('click',()=>{if(audioCtx.state==='suspended') audioCtx.resume()},{once:true})

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(()=>navigator.getUserMedia({video:{}},s=>video.srcObject=s,e=>console.error(e)))

video.addEventListener('play',()=>{
  const canvas=faceapi.createCanvasFromMedia(video)
  document.body.append(canvas)
  const size={width:video.width,height:video.height}
  faceapi.matchDimensions(canvas,size)

  setInterval(async()=>{
    const det=await faceapi.detectAllFaces(video,new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions()
    const res=faceapi.resizeResults(det,size)
    const ctx=canvas.getContext('2d')
    ctx.clearRect(0,0,canvas.width,canvas.height)
    faceapi.draw.drawDetections(canvas,res)
    faceapi.draw.drawFaceLandmarks(canvas,res)
    faceapi.draw.drawFaceExpressions(canvas,res)

    if(det.length>0){
      const exp=det[0].expressions
      const emo=Object.keys(exp).reduce((a,b)=>exp[a]>exp[b]?a:b)
      if(exp[emo]>=0.5 && emo!==last){
        playEmotion(emo)
        last=emo
      }
    }
  },100)
})
