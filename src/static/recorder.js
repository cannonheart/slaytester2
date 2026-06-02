(()=>{function T(o){let e="st-style";if(document.getElementById(e))return;let n=document.createElement("style");n.id=e,n.textContent=o,document.head.appendChild(n)}function N(){let o=document.createElement("div");o.className="st-overlay";let e=document.createElement("div");return e.className="st-card",o.appendChild(e),document.body.appendChild(o),{card:e,cleanup:()=>{document.body.removeChild(o);let n=document.getElementById("st-style");n?.parentNode?.removeChild(n)}}}function R(o,e){let n=document.createElement("p");n.className="st-text",n.textContent=e,o.appendChild(n)}function I(o,e,n,r,g){let t=document.createElement("div");t.className="st-btns";let y=document.createElement("button");y.className="st-btn-yes st-btn",y.textContent=e;let s=document.createElement("button");return s.className="st-btn-no st-btn",s.textContent=n,y.addEventListener("click",r),s.addEventListener("click",g),t.appendChild(y),t.appendChild(s),o.appendChild(t),y}function _(o,e,n){T(o.css);let{card:r,cleanup:g}=N();R(r,o.popupText),I(r,o.popupYes,o.popupNo,()=>{g(),e()},()=>{g(),n()});let t=document.createElement("a");t.className="st-footer",t.href="https://slaytester.com",t.target="_blank",t.textContent=o.popupFooter,r.appendChild(t)}function A(o,e,n){T(o.css);let{card:r,cleanup:g}=N();R(r,o.popupMic),I(r,o.popupYes,o.popupNo,()=>{g(),e()},()=>{g(),n()})}function $(o,e,n,r){T(o.css);let{card:g,cleanup:t}=N(),y=document.createElement("audio");y.srcObject=e,y.muted=!1,y.play().catch(()=>{}),R(g,"Mic check \u2014 can you hear yourself?"),I(g,"Yes","Go back",()=>{y.pause(),y.srcObject=null,t(),n(e)},()=>{y.pause(),y.srcObject=null,t(),r()})}function K(o,e,n,r,g){let t=new FormData;return t.append("sessionId",e),t.append("chunkIndex",String(n)),t.append("chunkTime",String(r)),t.append("blob",g,`${n}_${r}.mp4`),{url:`${o}/api/recorder/upload`,body:t}}function U(o,e,n,r){let g=MediaRecorder.isTypeSupported("video/mp4;codecs=avc3")?"video/mp4;codecs=avc3":"video/mp4";if(console.log("[Slaytester] MediaRecorder mime:",g),!MediaRecorder.isTypeSupported(g))return console.error("[Slaytester] video/mp4 not supported by MediaRecorder"),{stop:()=>{}};let t;try{t=new MediaRecorder(r,{mimeType:g,videoBitsPerSecond:n.bitrate})}catch(s){return console.error("[Slaytester] MediaRecorder constructor failed:",s),{stop:()=>{}}}console.log("[Slaytester] MediaRecorder created:",{mimeType:t.mimeType,state:t.state,videoBitsPerSecond:t.videoBitsPerSecond}),t.onstart=()=>{console.log("[Slaytester] MediaRecorder started, state:",t.state)},t.onstop=()=>{console.log("[Slaytester] MediaRecorder stopped, state:",t.state)},t.onerror=()=>{console.error("[Slaytester] MediaRecorder error:",t.error),window.dispatchEvent(new CustomEvent("slaytester:error",{detail:{message:`MediaRecorder error: ${t.error?.message}`,chunkIndex:y}}))};let y=0;t.ondataavailable=s=>{if(console.log(`[Slaytester] ondataavailable fired, size: ${s.data.size}`),s.data.size===0)return;let p=y++,a=Math.floor(performance.now()),{url:d,body:m}=K(o,e,p,a,s.data);console.log(`[Slaytester] Uploading chunk ${p} (${s.data.size} bytes) to ${d}`),fetch(d,{method:"POST",body:m}).then(u=>{u.ok?console.log(`[Slaytester] Chunk ${p} uploaded`):(console.error(`[Slaytester] Upload failed for chunk ${p}: ${u.status} ${u.statusText}`),window.dispatchEvent(new CustomEvent("slaytester:error",{detail:{message:`Upload failed: HTTP ${u.status}`,chunkIndex:p}})))}).catch(u=>{console.error(`[Slaytester] Network error uploading chunk ${p}:`,u),window.dispatchEvent(new CustomEvent("slaytester:error",{detail:{message:`Network error: ${u.message}`,chunkIndex:p}}))})},r.getTracks().forEach(s=>console.log("[Slaytester] track:",s.kind,"readyState:",s.readyState,"enabled:",s.enabled,"muted:",s.muted));try{t.start(1e3),console.log("[Slaytester] recorder.start(1000) called successfully, state:",t.state)}catch(s){return console.error("[Slaytester] recorder.start failed:",s),window.dispatchEvent(new CustomEvent("slaytester:error",{detail:{message:`recorder.start failed: ${s.message}`}})),{stop:()=>{}}}return setTimeout(()=>{console.log("[Slaytester] recorder state 2s after start:",t.state)},2e3),{stop:()=>{t.state!=="inactive"&&(console.log("[Slaytester] Stopping recorder"),t.stop())}}}var H=new WeakSet,F=new WeakSet,q=[],x;function Q(o){H.add(o),window.__slaytesterGameCtx||(window.__slaytesterGameCtx=o)}function X(o,e){try{o.context}catch{return!1}try{e.context}catch{return!1}return o.context===e.context}var Z=["createGain","createBufferSource","createOscillator","createScriptProcessor","createMediaElementSource","createMediaStreamSource"];function Y(){let o=window.AudioContext||window.webkitAudioContext;if(o){for(let e of Z){let n=o.prototype[e];n&&(o.prototype[e]=function(...r){return Q(this),n.apply(this,r)})}x=AudioNode.prototype.connect,AudioNode.prototype.connect=function(e,n,r){x.call(this,e,n,r);let g=this.context;if(H.has(g)&&e instanceof AudioDestinationNode){let t=n??0,y=r??0,s=window.__slaytesterCaptureDest;(!s||e!==s)&&q.push({source:this,output:t,input:y}),s&&e!==s&&X(this,s)&&x.call(this,s,n,r)}return e}}}function P(o){let e=new Map;for(let n of q){let r=n.source.context;!r||F.has(r)||(e.has(r)||e.set(r,[]),e.get(r).push(n))}for(let[n,r]of e){F.add(n);let g=n.destination,t=n.createGain(),y=n.createMediaStreamDestination();x.call(t,y,0,0),x.call(t,g,0,0);for(let s of r)try{x.call(s.source,t,s.output,0)}catch(p){console.warn("[Slaytester] bridge connection failed:",p)}return y.stream}return null}var W={popupText:"This game is running a playtest! Do you want to join the playtest and record your gameplay?",privacyPolicyUrl:null,popupYes:"Sure!",popupNo:"Nah",popupFooter:"powered by Slaytester",requestMic:!0,popupMic:"Enable your microphone for commentary?",fps:30,css:`
.st-overlay {
  position:fixed;
  z-index:999999;

  display:flex;
  align-items:center;
  justify-content:center;
  inset:0;

  background:rgba(0,0,0,0.6);
  font-family:sans-serif;
}

.st-card {
  background:#fff;
  border-radius:1rem;
  padding:2rem;
  max-width:20rem;
  width:90%;
  text-align:center;
}

.st-text {
  margin:0 0 1.5rem;
  font-size:1rem;
  color:#000;
  line-height:1.5;
}

.st-footer {
  display: block;
  margin:1.5rem 0 0;
  font-size:0.8rem;
  color:#2b001855;
}

.st-link {
  color:#2b0018;
}

.st-checkbox {
  display:flex;
  align-items:center;
  gap:0.8rem;
  margin-bottom:1.5rem;
  justify-content:center;
  font-size:0.8rem;
}

.st-btns {
  display:flex;
  gap:1rem;
  justify-content:center;
}

.st-btn {
  padding:0.6rem 1.6rem;
  border-radius:0.6rem;
  font-size:1rem;
  cursor:pointer;
}

.st-btn-yes {
  background:#2b0018;
  color:#fff;
}
.st-btn-yes:disabled { opacity:0.4;cursor:default; }

.st-btn-no {
  background:none;
  color:#2b0018;
  border:2px solid #2b0018;
}`,bitrate:1e6};(function(){Y();let o=document.currentScript,e=o?.getAttribute("data-playtest-id");if(!e){console.warn("[Slaytester] no data-playtest-id found on script tag");return}console.log("[Slaytester] loaded for playtest:",e);let r=(o?.src??"").replace(/\/recorder\.js(\?.*)?$/,"");console.log("[Slaytester] base URL:",r),fetch(`${r}/api/recorder/config?playtestId=${e}`).then(p=>{if(!p.ok)throw new Error(`config fetch returned ${p.status}`);return p.json()}).then(p=>{if(p.availableSlots===0){console.log("[Slaytester] playtest is full, exiting");return}let a={...W,...p,apiBase:r};if(console.log("[Slaytester] config received:",a),localStorage.getItem(`st-joined-${e}`)){t(a);return}_(a,()=>{fetch(`${r}/api/recorder/session`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({playtestId:e})}).then(d=>{if(d.status===409){console.log("[Slaytester] playtest is full"),y(a);return}if(!d.ok)throw new Error(`session claim returned ${d.status}`);return d.json()}).then(d=>{if(!d?.sessionId)return;let m=d.sessionId;if(console.log("[Slaytester] session claimed:",m),localStorage.setItem(`st-joined-${e}`,m),!a.requestMic){s(a,m,null);return}if(!navigator.mediaDevices){g(a);return}A(a,()=>{navigator.mediaDevices.getUserMedia({audio:{autoGainControl:!1,echoCancellation:!1,noiseSuppression:!1}}).then(u=>{$(a,u,c=>{s(a,m,c)},()=>{u.getTracks().forEach(c=>c.stop()),A(a,()=>{navigator.mediaDevices.getUserMedia({audio:{autoGainControl:!1,echoCancellation:!1,noiseSuppression:!1}}).then(c=>$(a,c,h=>s(a,m,h),()=>{c.getTracks().forEach(h=>h.stop())}))},()=>s(a,m,null))})}).catch(u=>{console.warn("[Slaytester] getUserMedia failed, recording without mic:",u),s(a,m,null)})},()=>s(a,m,null))}).catch(d=>console.error("[Slaytester] failed to claim session:",d))},()=>console.log("[Slaytester] recording declined by user"))}).catch(p=>console.error("[Slaytester] failed to fetch config:",p));function g(p){let a=document.createElement("div");a.className="st-overlay";let d=document.createElement("div");d.className="st-card";let m=document.createElement("p");m.className="st-text",m.textContent="Microphone access requires HTTPS or getting served from localhost. Recording without mic.",d.appendChild(m);let u=document.createElement("button");u.className="st-btn-yes st-btn",u.textContent="OK",u.addEventListener("click",()=>document.body.removeChild(a)),d.appendChild(u),a.appendChild(d),document.body.appendChild(a);let c="st-style";if(!document.getElementById(c)){let h=document.createElement("style");h.id=c,h.textContent=p.css,document.head.appendChild(h)}}function t(p){let a=document.createElement("div");a.className="st-overlay";let d=document.createElement("div");d.className="st-card";let m=document.createElement("p");m.className="st-text",m.textContent="You've already joined this playtest. Thanks!",d.appendChild(m);let u=document.createElement("button");u.className="st-btn-yes st-btn",u.textContent="I'll just play the game then",u.addEventListener("click",()=>document.body.removeChild(a)),d.appendChild(u),a.appendChild(d),document.body.appendChild(a);let c="st-style";if(!document.getElementById(c)){let h=document.createElement("style");h.id=c,h.textContent=p.css,document.head.appendChild(h)}}function y(p){let a=document.createElement("div");a.className="st-overlay";let d=document.createElement("div");d.className="st-card";let m=document.createElement("p");m.className="st-text",m.textContent="This playtest is full. Thanks for your interest!",d.appendChild(m),a.appendChild(d),document.body.appendChild(a);let u="st-style";if(!document.getElementById(u)){let c=document.createElement("style");c.id=u,c.textContent=p.css,document.head.appendChild(c)}}async function s(p,a,d){function m(){let l=document.querySelectorAll("canvas");console.log(`[Slaytester] Found ${l.length} canvas(es):`),l.forEach((i,f)=>{let b=i.getBoundingClientRect();console.log(`  [${f}] id="${i.id}" class="${i.className}" internal=${i.width}x${i.height} css=${Math.round(b.width)}x${Math.round(b.height)} visible=${b.width>0&&b.height>0}`)})}let u=p.fps??30;console.log("[Slaytester] capturing canvas at",u,"fps"),m();let c=null;for(let l=0;l<20;l++){for(let i of document.querySelectorAll("canvas")){let f=i.getBoundingClientRect();if(i.width>0&&i.height>0&&f.width>0&&f.height>0){c=i;break}}if(c)break;await new Promise(i=>setTimeout(i,1e3))}if(!c){console.error("[Slaytester] No suitable canvas found after 20s"),m();return}console.log("[Slaytester] Selected canvas:",c.id||"(no id)",c.width,"x",c.height);let h=Math.round(c.getBoundingClientRect().width)||c.width,S=Math.round(c.getBoundingClientRect().height)||c.height;console.log("[Slaytester] recording at:",h,"x",S);let B;try{let l=document.createElement("canvas");l.width=h,l.height=S,l.style.position="fixed",l.style.left="-9999px",l.style.top="0",document.body.appendChild(l);let i=l.getContext("2d");i.imageSmoothingEnabled=!1,new ResizeObserver(()=>{let k=c.getBoundingClientRect(),L=Math.round(k.width)||c.width,O=Math.round(k.height)||c.height;(L!==h||O!==S)&&console.log("[Slaytester] Canvas size changed:",h,"x",S,"\u2192",L,"x",O,"(recording continues at",h,"x",S,")")}).observe(c),i.drawImage(c,0,0,h,S);let b=0;(function k(){i.drawImage(c,0,0,h,S),i.fillStyle=b%2===0?"#000":"#fff",i.fillRect(0,0,2,2),b++,requestAnimationFrame(k)})(),B=l.captureStream(u)}catch(l){console.error("[Slaytester] canvas.captureStream failed:",l);return}let E=B.getVideoTracks();console.log("[Slaytester] canvas video tracks:",E.length),E.length===0&&console.warn("[Slaytester] canvas has no video tracks"),console.log("[Slaytester] session ID:",a);let v;try{v=new AudioContext,console.log("[Slaytester] audioCtx state:",v.state),v.state==="suspended"&&(await v.resume(),console.log("[Slaytester] audioCtx resumed"))}catch(l){console.error("[Slaytester] failed to create AudioContext:",l);return}let C=v.createMediaStreamDestination();window.__slaytesterCaptureDest=C,console.log("[Slaytester] capture destination created");function J(){if(document.getElementById("st-rec-indicator"))return;if(!document.getElementById("st-rec-style")){let i=document.createElement("style");i.id="st-rec-style",i.textContent="@keyframes st-rec-pulse{0%,100%{opacity:1}50%{opacity:0.3}}",document.head.appendChild(i)}let l=document.createElement("div");l.id="st-rec-indicator",Object.assign(l.style,{position:"fixed",top:"12px",right:"12px",background:"rgba(0,0,0,0.65)",color:"#fff",fontFamily:"sans-serif",fontSize:"13px",padding:"6px 14px",borderRadius:"20px",zIndex:"999999",display:"flex",alignItems:"center",gap:"6px",pointerEvents:"none"}),l.innerHTML='<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#ff4444;animation:st-rec-pulse 1.5s infinite"></span> REC',document.body.appendChild(l)}let w=v.createGain();w.gain.value=1,w.connect(C);let M=v.createConstantSource();M.offset.value=0,M.connect(w),M.start();function D(l){try{let i=v.createMediaStreamSource(l),f=v.createGain();f.gain.value=.38,i.connect(f),f.connect(w),console.log("[Slaytester] bridged game audio to recorder")}catch(i){console.error("[Slaytester] failed to bridge game audio:",i)}}let j=P(C);if(j)D(j);else{let l=setInterval(()=>{let i=P(C);i&&(clearInterval(l),D(i))},1e3)}if(d){let l=d.getAudioTracks();console.log("[Slaytester] connecting mic:",l.length,"track(s)");let i=v.createMediaStreamSource(d),f=v.createDynamicsCompressor();f.threshold.value=-25,f.ratio.value=15,f.attack.value=.005,f.release.value=.15;let b=v.createGain();b.gain.value=1.3,i.connect(f),f.connect(b),b.connect(w)}else console.log("[Slaytester] no mic stream, recording without microphone");console.log("[Slaytester] capture dest audio tracks:",C.stream.getAudioTracks().length);let V=[...E,...C.stream.getAudioTracks()],z=new MediaStream(V);console.log("[Slaytester] combined stream tracks:",z.getTracks().length);let G=U(r,a,p,z);J(),addEventListener("beforeunload",()=>{G&&G.stop()})}})();})();
