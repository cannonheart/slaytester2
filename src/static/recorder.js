(()=>{function w(n){let t="st-style";if(document.getElementById(t))return;let r=document.createElement("style");r.id=t,r.textContent=n,document.head.appendChild(r)}function k(){let n=document.createElement("div");n.className="st-overlay";let t=document.createElement("div");return t.className="st-card",n.appendChild(t),document.body.appendChild(n),{card:t,cleanup:()=>{document.body.removeChild(n);let r=document.getElementById("st-style");r?.parentNode?.removeChild(r)}}}function E(n,t){let r=document.createElement("p");r.className="st-text",r.textContent=t,n.appendChild(r)}function M(n,t,r,a,d){let o=document.createElement("div");o.className="st-btns";let c=document.createElement("button");c.className="st-btn-yes st-btn",c.textContent=t;let e=document.createElement("button");return e.className="st-btn-no st-btn",e.textContent=r,c.addEventListener("click",a),e.addEventListener("click",d),o.appendChild(c),o.appendChild(e),n.appendChild(o),c}function D(n,t,r){w(n.css);let{card:a,cleanup:d}=k();E(a,n.popupText),M(a,n.popupYes,n.popupNo,()=>{d(),t()},()=>{d(),r()});let o=document.createElement("p");o.className="st-footer",o.textContent=n.popupFooter,a.appendChild(o)}function T(n,t,r){w(n.css);let{card:a,cleanup:d}=k();E(a,n.popupMic),M(a,n.popupYes,n.popupNo,()=>{d(),t()},()=>{d(),r()})}function N(n,t,r,a){w(n.css);let{card:d,cleanup:o}=k(),c=document.createElement("audio");c.srcObject=t,c.muted=!1,c.play().catch(()=>{}),E(d,"Mic check \u2014 can you hear yourself?"),M(d,"Yes","Go back",()=>{c.pause(),c.srcObject=null,o(),r(t)},()=>{c.pause(),c.srcObject=null,o(),a()})}function z(n,t,r,a,d){let o=new FormData;return o.append("sessionId",t),o.append("chunkIndex",String(r)),o.append("chunkTime",String(a)),o.append("blob",d,`${r}_${a}.mp4`),{url:`${n}/api/recorder/upload`,body:o}}function B(n,t,r,a){let d=MediaRecorder.isTypeSupported("video/mp4;codecs=avc3")?"video/mp4;codecs=avc3":"video/mp4";if(console.log("[Slaytester] MediaRecorder mime:",d),!MediaRecorder.isTypeSupported(d))return console.error("[Slaytester] video/mp4 not supported by MediaRecorder"),{stop:()=>{}};let o;try{o=new MediaRecorder(a,{mimeType:d,videoBitsPerSecond:r.bitrate})}catch(e){return console.error("[Slaytester] MediaRecorder constructor failed:",e),{stop:()=>{}}}console.log("[Slaytester] MediaRecorder created:",{mimeType:o.mimeType,state:o.state,videoBitsPerSecond:o.videoBitsPerSecond}),o.onstart=()=>{console.log("[Slaytester] MediaRecorder started, state:",o.state)},o.onstop=()=>{console.log("[Slaytester] MediaRecorder stopped, state:",o.state)},o.onerror=()=>{console.error("[Slaytester] MediaRecorder error:",o.error),window.dispatchEvent(new CustomEvent("slaytester:error",{detail:{message:`MediaRecorder error: ${o.error?.message}`,chunkIndex:c}}))};let c=0;o.ondataavailable=e=>{if(console.log(`[Slaytester] ondataavailable fired, size: ${e.data.size}`),e.data.size===0)return;let s=c++,i=Math.floor(performance.now()),{url:u,body:p}=z(n,t,s,i,e.data);console.log(`[Slaytester] Uploading chunk ${s} (${e.data.size} bytes) to ${u}`),fetch(u,{method:"POST",body:p}).then(l=>{l.ok?console.log(`[Slaytester] Chunk ${s} uploaded`):(console.error(`[Slaytester] Upload failed for chunk ${s}: ${l.status} ${l.statusText}`),window.dispatchEvent(new CustomEvent("slaytester:error",{detail:{message:`Upload failed: HTTP ${l.status}`,chunkIndex:s}})))}).catch(l=>{console.error(`[Slaytester] Network error uploading chunk ${s}:`,l),window.dispatchEvent(new CustomEvent("slaytester:error",{detail:{message:`Network error: ${l.message}`,chunkIndex:s}}))})},a.getTracks().forEach(e=>console.log("[Slaytester] track:",e.kind,"readyState:",e.readyState,"enabled:",e.enabled,"muted:",e.muted));try{o.start(1e3),console.log("[Slaytester] recorder.start(1000) called successfully, state:",o.state)}catch(e){return console.error("[Slaytester] recorder.start failed:",e),window.dispatchEvent(new CustomEvent("slaytester:error",{detail:{message:`recorder.start failed: ${e.message}`}})),{stop:()=>{}}}return setTimeout(()=>{console.log("[Slaytester] recorder state 2s after start:",o.state)},2e3),{stop:()=>{o.state!=="inactive"&&(console.log("[Slaytester] Stopping recorder"),o.stop())}}}var L=new WeakSet,G=new WeakSet,_=[],v;function H(n){L.add(n),window.__slaytesterGameCtx||(window.__slaytesterGameCtx=n)}function F(n,t){try{n.context}catch{return!1}try{t.context}catch{return!1}return n.context===t.context}var q=["createGain","createBufferSource","createOscillator","createScriptProcessor","createMediaElementSource","createMediaStreamSource"];function j(){let n=window.AudioContext||window.webkitAudioContext;if(n){for(let t of q){let r=n.prototype[t];r&&(n.prototype[t]=function(...a){return H(this),r.apply(this,a)})}v=AudioNode.prototype.connect,AudioNode.prototype.connect=function(t,r,a){v.call(this,t,r,a);let d=this.context;if(L.has(d)&&t instanceof AudioDestinationNode){let o=r??0,c=a??0,e=window.__slaytesterCaptureDest;(!e||t!==e)&&_.push({source:this,output:o,input:c}),e&&t!==e&&F(this,e)&&v.call(this,e,r,a)}return t}}}function A(n){let t=new Map;for(let r of _){let a=r.source.context;!a||G.has(a)||(t.has(a)||t.set(a,[]),t.get(a).push(r))}for(let[r,a]of t){G.add(r);let d=r.destination,o=r.createGain(),c=r.createMediaStreamDestination();v.call(o,c,0,0),v.call(o,d,0,0);for(let e of a)try{v.call(e.source,o,e.output,0)}catch(s){console.warn("[Slaytester] bridge connection failed:",s)}return c.stream}return null}var U={popupText:"This game is running a playtest! Do you want to join the playtest and record your gameplay?",privacyPolicyUrl:null,popupYes:"Sure!",popupNo:"Nah",popupFooter:"powered by Slaytester",requestMic:!0,popupMic:"Enable your microphone for commentary?",fps:30,css:`
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
}`,bitrate:1e6};(function(){j();let n=document.currentScript,t=n?.getAttribute("data-playtest-id");if(!t){console.warn("[Slaytester] no data-playtest-id found on script tag");return}console.log("[Slaytester] loaded for playtest:",t);let a=(n?.src??"").replace(/\/recorder\.js(\?.*)?$/,"");console.log("[Slaytester] base URL:",a),fetch(`${a}/api/recorder/config?playtestId=${t}`).then(e=>{if(!e.ok)throw new Error(`config fetch returned ${e.status}`);return e.json()}).then(e=>{if(e.availableSlots===0){console.log("[Slaytester] playtest is full, exiting");return}let s={...U,...e,apiBase:a};console.log("[Slaytester] config received:",s),D(s,()=>{fetch(`${a}/api/recorder/session`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({playtestId:t})}).then(i=>{if(i.status===409){console.log("[Slaytester] playtest is full"),o(s);return}if(!i.ok)throw new Error(`session claim returned ${i.status}`);return i.json()}).then(i=>{if(!i?.sessionId)return;let u=i.sessionId;if(console.log("[Slaytester] session claimed:",u),!s.requestMic){c(s,u,null);return}if(!navigator.mediaDevices){d(s);return}T(s,()=>{navigator.mediaDevices.getUserMedia({audio:{autoGainControl:!1,echoCancellation:!1,noiseSuppression:!1}}).then(p=>{N(s,p,l=>{c(s,u,l)},()=>{p.getTracks().forEach(l=>l.stop()),T(s,()=>{navigator.mediaDevices.getUserMedia({audio:{autoGainControl:!1,echoCancellation:!1,noiseSuppression:!1}}).then(l=>N(s,l,f=>c(s,u,f),()=>{l.getTracks().forEach(f=>f.stop())}))},()=>c(s,u,null))})}).catch(p=>{console.warn("[Slaytester] getUserMedia failed, recording without mic:",p),c(s,u,null)})},()=>c(s,u,null))}).catch(i=>console.error("[Slaytester] failed to claim session:",i))},()=>console.log("[Slaytester] recording declined by user"))}).catch(e=>console.error("[Slaytester] failed to fetch config:",e));function d(e){let s=document.createElement("div");s.className="st-overlay";let i=document.createElement("div");i.className="st-card";let u=document.createElement("p");u.className="st-text",u.textContent="Microphone access requires HTTPS or getting served from localhost. Recording without mic.",i.appendChild(u);let p=document.createElement("button");p.className="st-btn-yes st-btn",p.textContent="OK",p.addEventListener("click",()=>document.body.removeChild(s)),i.appendChild(p),s.appendChild(i),document.body.appendChild(s);let l="st-style";if(!document.getElementById(l)){let f=document.createElement("style");f.id=l,f.textContent=e.css,document.head.appendChild(f)}}function o(e){let s=document.createElement("div");s.className="st-overlay";let i=document.createElement("div");i.className="st-card";let u=document.createElement("p");u.className="st-text",u.textContent="This playtest is full. Thanks for your interest!",i.appendChild(u),s.appendChild(i),document.body.appendChild(s);let p="st-style";if(!document.getElementById(p)){let l=document.createElement("style");l.id=p,l.textContent=e.css,document.head.appendChild(l)}}async function c(e,s,i){let u=document.querySelector("canvas");if(!u){console.error("[Slaytester] no canvas element found on page");return}let p=e.fps??30;console.log("[Slaytester] capturing canvas at",p,"fps");let l;try{let m=u.getContext("2d");m&&(m.globalAlpha=.01,m.fillRect(0,0,1,1),m.globalAlpha=1),l=u.captureStream(p)}catch(m){console.error("[Slaytester] canvas.captureStream failed:",m);return}let f=l.getVideoTracks();console.log("[Slaytester] canvas video tracks:",f.length),f.length===0&&console.warn("[Slaytester] canvas has no video tracks"),console.log("[Slaytester] session ID:",s);let y;try{y=new AudioContext,console.log("[Slaytester] audioCtx state:",y.state),y.state==="suspended"&&(await y.resume(),console.log("[Slaytester] audioCtx resumed"))}catch(m){console.error("[Slaytester] failed to create AudioContext:",m);return}let S=y.createMediaStreamDestination();window.__slaytesterCaptureDest=S,console.log("[Slaytester] capture destination created");let b=y.createGain();b.gain.value=1,b.connect(S);let C=y.createConstantSource();C.offset.value=0,C.connect(b),C.start();function R(m){try{let h=y.createMediaStreamSource(m),g=y.createGain();g.gain.value=.38,h.connect(g),g.connect(b),console.log("[Slaytester] bridged game audio to recorder")}catch(h){console.error("[Slaytester] failed to bridge game audio:",h)}}let P=A(S);if(P)R(P);else{let m=setInterval(()=>{let h=A(S);h&&(clearInterval(m),R(h))},1e3)}if(i){let m=i.getAudioTracks();console.log("[Slaytester] connecting mic:",m.length,"track(s)");let h=y.createMediaStreamSource(i),g=y.createDynamicsCompressor();g.threshold.value=-25,g.ratio.value=15,g.attack.value=.005,g.release.value=.15;let x=y.createGain();x.gain.value=1.3,h.connect(g),g.connect(x),x.connect(b)}else console.log("[Slaytester] no mic stream, recording without microphone");console.log("[Slaytester] capture dest audio tracks:",S.stream.getAudioTracks().length);let O=[...f,...S.stream.getAudioTracks()],I=new MediaStream(O);console.log("[Slaytester] combined stream tracks:",I.getTracks().length);let $=B(a,s,e,I);addEventListener("beforeunload",()=>{$&&$.stop()})}})();})();
