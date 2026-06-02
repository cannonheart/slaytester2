(()=>{function w(n){let t="st-style";if(document.getElementById(t))return;let r=document.createElement("style");r.id=t,r.textContent=n,document.head.appendChild(r)}function k(){let n=document.createElement("div");n.className="st-overlay";let t=document.createElement("div");return t.className="st-card",n.appendChild(t),document.body.appendChild(n),{card:t,cleanup:()=>{document.body.removeChild(n);let r=document.getElementById("st-style");r?.parentNode?.removeChild(r)}}}function E(n,t){let r=document.createElement("p");r.className="st-text",r.textContent=t,n.appendChild(r)}function M(n,t,r,a,l){let o=document.createElement("div");o.className="st-btns";let c=document.createElement("button");c.className="st-btn-yes st-btn",c.textContent=t;let e=document.createElement("button");return e.className="st-btn-no st-btn",e.textContent=r,c.addEventListener("click",a),e.addEventListener("click",l),o.appendChild(c),o.appendChild(e),n.appendChild(o),c}function D(n,t,r){w(n.css);let{card:a,cleanup:l}=k();E(a,n.popupText),M(a,n.popupYes,n.popupNo,()=>{l(),t()},()=>{l(),r()});let o=document.createElement("p");o.className="st-footer",o.textContent=n.popupFooter,a.appendChild(o)}function T(n,t,r){w(n.css);let{card:a,cleanup:l}=k();E(a,n.popupMic),M(a,n.popupYes,n.popupNo,()=>{l(),t()},()=>{l(),r()})}function N(n,t,r,a){w(n.css);let{card:l,cleanup:o}=k(),c=document.createElement("audio");c.srcObject=t,c.muted=!1,c.play().catch(()=>{}),E(l,"Mic check \u2014 can you hear yourself?"),M(l,"Yes","Go back",()=>{c.pause(),c.srcObject=null,o(),r(t)},()=>{c.pause(),c.srcObject=null,o(),a()})}function H(n,t,r,a,l){let o=new FormData;return o.append("sessionId",t),o.append("chunkIndex",String(r)),o.append("chunkTime",String(a)),o.append("blob",l,`${r}_${a}.mp4`),{url:`${n}/api/recorder/upload`,body:o}}function B(n,t,r,a){let l=MediaRecorder.isTypeSupported("video/mp4;codecs=avc3")?"video/mp4;codecs=avc3":"video/mp4";if(console.log("[Slaytester] MediaRecorder mime:",l),!MediaRecorder.isTypeSupported(l))return console.error("[Slaytester] video/mp4 not supported by MediaRecorder"),{stop:()=>{}};let o;try{o=new MediaRecorder(a,{mimeType:l,videoBitsPerSecond:r.bitrate})}catch(e){return console.error("[Slaytester] MediaRecorder constructor failed:",e),{stop:()=>{}}}console.log("[Slaytester] MediaRecorder created:",{mimeType:o.mimeType,state:o.state,videoBitsPerSecond:o.videoBitsPerSecond}),o.onstart=()=>{console.log("[Slaytester] MediaRecorder started, state:",o.state)},o.onstop=()=>{console.log("[Slaytester] MediaRecorder stopped, state:",o.state)},o.onerror=()=>{console.error("[Slaytester] MediaRecorder error:",o.error),window.dispatchEvent(new CustomEvent("slaytester:error",{detail:{message:`MediaRecorder error: ${o.error?.message}`,chunkIndex:c}}))};let c=0;o.ondataavailable=e=>{if(console.log(`[Slaytester] ondataavailable fired, size: ${e.data.size}`),e.data.size===0)return;let s=c++,i=Math.floor(performance.now()),{url:u,body:m}=H(n,t,s,i,e.data);console.log(`[Slaytester] Uploading chunk ${s} (${e.data.size} bytes) to ${u}`),fetch(u,{method:"POST",body:m}).then(d=>{d.ok?console.log(`[Slaytester] Chunk ${s} uploaded`):(console.error(`[Slaytester] Upload failed for chunk ${s}: ${d.status} ${d.statusText}`),window.dispatchEvent(new CustomEvent("slaytester:error",{detail:{message:`Upload failed: HTTP ${d.status}`,chunkIndex:s}})))}).catch(d=>{console.error(`[Slaytester] Network error uploading chunk ${s}:`,d),window.dispatchEvent(new CustomEvent("slaytester:error",{detail:{message:`Network error: ${d.message}`,chunkIndex:s}}))})},a.getTracks().forEach(e=>console.log("[Slaytester] track:",e.kind,"readyState:",e.readyState,"enabled:",e.enabled,"muted:",e.muted));try{o.start(1e3),console.log("[Slaytester] recorder.start(1000) called successfully, state:",o.state)}catch(e){return console.error("[Slaytester] recorder.start failed:",e),window.dispatchEvent(new CustomEvent("slaytester:error",{detail:{message:`recorder.start failed: ${e.message}`}})),{stop:()=>{}}}return setTimeout(()=>{console.log("[Slaytester] recorder state 2s after start:",o.state)},2e3),{stop:()=>{o.state!=="inactive"&&(console.log("[Slaytester] Stopping recorder"),o.stop())}}}var L=new WeakSet,G=new WeakSet,_=[],S;function F(n){L.add(n),window.__slaytesterGameCtx||(window.__slaytesterGameCtx=n)}function q(n,t){try{n.context}catch{return!1}try{t.context}catch{return!1}return n.context===t.context}var Y=["createGain","createBufferSource","createOscillator","createScriptProcessor","createMediaElementSource","createMediaStreamSource"];function j(){let n=window.AudioContext||window.webkitAudioContext;if(n){for(let t of Y){let r=n.prototype[t];r&&(n.prototype[t]=function(...a){return F(this),r.apply(this,a)})}S=AudioNode.prototype.connect,AudioNode.prototype.connect=function(t,r,a){S.call(this,t,r,a);let l=this.context;if(L.has(l)&&t instanceof AudioDestinationNode){let o=r??0,c=a??0,e=window.__slaytesterCaptureDest;(!e||t!==e)&&_.push({source:this,output:o,input:c}),e&&t!==e&&q(this,e)&&S.call(this,e,r,a)}return t}}}function A(n){let t=new Map;for(let r of _){let a=r.source.context;!a||G.has(a)||(t.has(a)||t.set(a,[]),t.get(a).push(r))}for(let[r,a]of t){G.add(r);let l=r.destination,o=r.createGain(),c=r.createMediaStreamDestination();S.call(o,c,0,0),S.call(o,l,0,0);for(let e of a)try{S.call(e.source,o,e.output,0)}catch(s){console.warn("[Slaytester] bridge connection failed:",s)}return c.stream}return null}var z={popupText:"This game is running a playtest! Do you want to join the playtest and record your gameplay?",privacyPolicyUrl:null,popupYes:"Sure!",popupNo:"Nah",popupFooter:"powered by Slaytester",requestMic:!0,popupMic:"Enable your microphone for commentary?",fps:30,css:`
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
}`,bitrate:1e6};(function(){j();let n=document.currentScript,t=n?.getAttribute("data-playtest-id");if(!t){console.warn("[Slaytester] no data-playtest-id found on script tag");return}console.log("[Slaytester] loaded for playtest:",t);let a=(n?.src??"").replace(/\/recorder\.js(\?.*)?$/,"");console.log("[Slaytester] base URL:",a),fetch(`${a}/api/recorder/config?playtestId=${t}`).then(e=>{if(!e.ok)throw new Error(`config fetch returned ${e.status}`);return e.json()}).then(e=>{if(e.availableSlots===0){console.log("[Slaytester] playtest is full, exiting");return}let s={...z,...e,apiBase:a};console.log("[Slaytester] config received:",s),D(s,()=>{fetch(`${a}/api/recorder/session`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({playtestId:t})}).then(i=>{if(i.status===409){console.log("[Slaytester] playtest is full"),o(s);return}if(!i.ok)throw new Error(`session claim returned ${i.status}`);return i.json()}).then(i=>{if(!i?.sessionId)return;let u=i.sessionId;if(console.log("[Slaytester] session claimed:",u),!s.requestMic){c(s,u,null);return}if(!navigator.mediaDevices){l(s);return}T(s,()=>{navigator.mediaDevices.getUserMedia({audio:{autoGainControl:!1,echoCancellation:!1,noiseSuppression:!1}}).then(m=>{N(s,m,d=>{c(s,u,d)},()=>{m.getTracks().forEach(d=>d.stop()),T(s,()=>{navigator.mediaDevices.getUserMedia({audio:{autoGainControl:!1,echoCancellation:!1,noiseSuppression:!1}}).then(d=>N(s,d,g=>c(s,u,g),()=>{d.getTracks().forEach(g=>g.stop())}))},()=>c(s,u,null))})}).catch(m=>{console.warn("[Slaytester] getUserMedia failed, recording without mic:",m),c(s,u,null)})},()=>c(s,u,null))}).catch(i=>console.error("[Slaytester] failed to claim session:",i))},()=>console.log("[Slaytester] recording declined by user"))}).catch(e=>console.error("[Slaytester] failed to fetch config:",e));function l(e){let s=document.createElement("div");s.className="st-overlay";let i=document.createElement("div");i.className="st-card";let u=document.createElement("p");u.className="st-text",u.textContent="Microphone access requires HTTPS or getting served from localhost. Recording without mic.",i.appendChild(u);let m=document.createElement("button");m.className="st-btn-yes st-btn",m.textContent="OK",m.addEventListener("click",()=>document.body.removeChild(s)),i.appendChild(m),s.appendChild(i),document.body.appendChild(s);let d="st-style";if(!document.getElementById(d)){let g=document.createElement("style");g.id=d,g.textContent=e.css,document.head.appendChild(g)}}function o(e){let s=document.createElement("div");s.className="st-overlay";let i=document.createElement("div");i.className="st-card";let u=document.createElement("p");u.className="st-text",u.textContent="This playtest is full. Thanks for your interest!",i.appendChild(u),s.appendChild(i),document.body.appendChild(s);let m="st-style";if(!document.getElementById(m)){let d=document.createElement("style");d.id=m,d.textContent=e.css,document.head.appendChild(d)}}async function c(e,s,i){let u=document.querySelector("canvas");if(!u){console.error("[Slaytester] no canvas element found on page");return}let m=e.fps??30;console.log("[Slaytester] capturing canvas at",m,"fps");let d;try{let p=u.getContext("2d");p&&(p.globalAlpha=.01,p.fillRect(0,0,1,1),p.globalAlpha=1),d=u.captureStream(m)}catch(p){console.error("[Slaytester] canvas.captureStream failed:",p);return}let g=d.getVideoTracks();console.log("[Slaytester] canvas video tracks:",g.length),g.length===0&&console.warn("[Slaytester] canvas has no video tracks"),console.log("[Slaytester] session ID:",s);let y;try{y=new AudioContext,console.log("[Slaytester] audioCtx state:",y.state),y.state==="suspended"&&(await y.resume(),console.log("[Slaytester] audioCtx resumed"))}catch(p){console.error("[Slaytester] failed to create AudioContext:",p);return}let v=y.createMediaStreamDestination();window.__slaytesterCaptureDest=v,console.log("[Slaytester] capture destination created");function O(){if(document.getElementById("st-rec-indicator"))return;if(!document.getElementById("st-rec-style")){let f=document.createElement("style");f.id="st-rec-style",f.textContent="@keyframes st-rec-pulse{0%,100%{opacity:1}50%{opacity:0.3}}",document.head.appendChild(f)}let p=document.createElement("div");p.id="st-rec-indicator",Object.assign(p.style,{position:"fixed",top:"12px",right:"12px",background:"rgba(0,0,0,0.65)",color:"#fff",fontFamily:"sans-serif",fontSize:"13px",padding:"6px 14px",borderRadius:"20px",zIndex:"999999",display:"flex",alignItems:"center",gap:"6px",pointerEvents:"none"}),p.innerHTML='<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#ff4444;animation:st-rec-pulse 1.5s infinite"></span> REC',document.body.appendChild(p)}let b=y.createGain();b.gain.value=1,b.connect(v);let C=y.createConstantSource();C.offset.value=0,C.connect(b),C.start();function R(p){try{let f=y.createMediaStreamSource(p),h=y.createGain();h.gain.value=.38,f.connect(h),h.connect(b),console.log("[Slaytester] bridged game audio to recorder")}catch(f){console.error("[Slaytester] failed to bridge game audio:",f)}}let I=A(v);if(I)R(I);else{let p=setInterval(()=>{let f=A(v);f&&(clearInterval(p),R(f))},1e3)}if(i){let p=i.getAudioTracks();console.log("[Slaytester] connecting mic:",p.length,"track(s)");let f=y.createMediaStreamSource(i),h=y.createDynamicsCompressor();h.threshold.value=-25,h.ratio.value=15,h.attack.value=.005,h.release.value=.15;let x=y.createGain();x.gain.value=1.3,f.connect(h),h.connect(x),x.connect(b)}else console.log("[Slaytester] no mic stream, recording without microphone");console.log("[Slaytester] capture dest audio tracks:",v.stream.getAudioTracks().length);let U=[...g,...v.stream.getAudioTracks()],P=new MediaStream(U);console.log("[Slaytester] combined stream tracks:",P.getTracks().length);let $=B(a,s,e,P);O(),addEventListener("beforeunload",()=>{$&&$.stop()})}})();})();
