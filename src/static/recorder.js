(()=>{function b(o){let n="st-style";if(document.getElementById(n))return;let a=document.createElement("style");a.id=n,a.textContent=o,document.head.appendChild(a)}function v(){let o=document.createElement("div");o.className="st-overlay";let n=document.createElement("div");return n.className="st-card",o.appendChild(n),document.body.appendChild(o),{card:n,cleanup:()=>{document.body.removeChild(o);let a=document.getElementById("st-style");a?.parentNode?.removeChild(a)}}}function C(o,n){let a=document.createElement("p");a.className="st-text",a.textContent=n,o.appendChild(a)}function x(o,n,a,s,i,t=!1){let r=document.createElement("div");r.className="st-btns";let e=document.createElement("button");e.className="st-btn-yes st-btn",e.textContent=n,e.disabled=t;let c=document.createElement("button");return c.className="st-btn-no st-btn",c.textContent=a,e.addEventListener("click",s),c.addEventListener("click",i),r.appendChild(e),r.appendChild(c),o.appendChild(r),e}function R(o,n,a){b(o.css);let{card:s,cleanup:i}=v();C(s,o.popupText);let t=document.createElement("div");t.className="st-checkbox";let r=document.createElement("input");r.type="checkbox",r.id="st-consent";let e=document.createElement("label");if(e.htmlFor="st-consent",e.appendChild(document.createTextNode("I agree to ")),o.privacyPolicyUrl){let d=document.createElement("a");d.href=o.privacyPolicyUrl,d.target="_blank",d.className="st-link",d.textContent="game developer privacy policy",e.appendChild(d),e.appendChild(document.createTextNode(" and "))}let c=document.createElement("a");c.href=`${o.apiBase}/privacy`,c.target="_blank",c.className="st-link",c.textContent="Slaytester privacy policy",e.appendChild(c),t.appendChild(r),t.appendChild(e),s.appendChild(t);let l=x(s,o.popupYes,o.popupNo,()=>{i(),n()},()=>{i(),a()},!0);r.addEventListener("change",()=>{l.disabled=!r.checked});let u=document.createElement("p");u.className="st-footer",u.textContent=o.popupFooter,s.appendChild(u)}function k(o,n,a){b(o.css);let{card:s,cleanup:i}=v();C(s,o.popupMic),x(s,o.popupYes,o.popupNo,()=>{i(),n()},()=>{i(),a()})}function w(o,n,a,s){b(o.css);let{card:i,cleanup:t}=v(),r=document.createElement("audio");r.srcObject=n,r.muted=!1,r.play().catch(()=>{}),C(i,"Mic check \u2014 can you hear yourself?"),x(i,"Yes","Go back",()=>{r.pause(),r.srcObject=null,t(),a(n)},()=>{r.pause(),r.srcObject=null,t(),s()})}function j(o,n,a,s,i){let t=new FormData;return t.append("sessionId",n),t.append("chunkIndex",String(a)),t.append("chunkTime",String(s)),t.append("blob",i,`${a}_${s}.mp4`),{url:`${o}/api/recorder/upload`,body:t}}function $(o,n,a,s){let i=MediaRecorder.isTypeSupported("video/mp4;codecs=avc3")?"video/mp4;codecs=avc3":"video/mp4";if(console.log("[Slaytester] MediaRecorder mime:",i),!MediaRecorder.isTypeSupported(i))return console.error("[Slaytester] video/mp4 not supported by MediaRecorder"),{stop:()=>{}};let t;try{t=new MediaRecorder(s,{mimeType:i,videoBitsPerSecond:a.bitrate})}catch(e){return console.error("[Slaytester] MediaRecorder constructor failed:",e),{stop:()=>{}}}console.log("[Slaytester] MediaRecorder created:",{mimeType:t.mimeType,state:t.state,videoBitsPerSecond:t.videoBitsPerSecond}),t.onstart=()=>{console.log("[Slaytester] MediaRecorder started, state:",t.state)},t.onstop=()=>{console.log("[Slaytester] MediaRecorder stopped, state:",t.state)},t.onerror=()=>{console.error("[Slaytester] MediaRecorder error:",t.error),window.dispatchEvent(new CustomEvent("slaytester:error",{detail:{message:`MediaRecorder error: ${t.error?.message}`,chunkIndex:r}}))};let r=0;t.ondataavailable=e=>{if(console.log(`[Slaytester] ondataavailable fired, size: ${e.data.size}`),e.data.size===0)return;let c=r++,l=Math.floor(performance.now()),{url:u,body:d}=j(o,n,c,l,e.data);console.log(`[Slaytester] Uploading chunk ${c} (${e.data.size} bytes) to ${u}`),fetch(u,{method:"POST",body:d}).then(p=>{p.ok?console.log(`[Slaytester] Chunk ${c} uploaded`):(console.error(`[Slaytester] Upload failed for chunk ${c}: ${p.status} ${p.statusText}`),window.dispatchEvent(new CustomEvent("slaytester:error",{detail:{message:`Upload failed: HTTP ${p.status}`,chunkIndex:c}})))}).catch(p=>{console.error(`[Slaytester] Network error uploading chunk ${c}:`,p),window.dispatchEvent(new CustomEvent("slaytester:error",{detail:{message:`Network error: ${p.message}`,chunkIndex:c}}))})},s.getTracks().forEach(e=>console.log("[Slaytester] track:",e.kind,"readyState:",e.readyState,"enabled:",e.enabled,"muted:",e.muted));try{t.start(1e3),console.log("[Slaytester] recorder.start(1000) called successfully, state:",t.state)}catch(e){return console.error("[Slaytester] recorder.start failed:",e),window.dispatchEvent(new CustomEvent("slaytester:error",{detail:{message:`recorder.start failed: ${e.message}`}})),{stop:()=>{}}}return setTimeout(()=>{console.log("[Slaytester] recorder state 2s after start:",t.state)},2e3),{stop:()=>{t.state!=="inactive"&&(console.log("[Slaytester] Stopping recorder"),t.stop())}}}var D=new WeakSet,I=new WeakSet,B=[],g;function z(o){D.add(o),window.__slaytesterGameCtx||(window.__slaytesterGameCtx=o)}function O(o,n){try{o.context}catch{return!1}try{n.context}catch{return!1}return o.context===n.context}var F=["createGain","createBufferSource","createOscillator","createScriptProcessor","createMediaElementSource","createMediaStreamSource"];function L(){let o=window.AudioContext||window.webkitAudioContext;if(o){for(let n of F){let a=o.prototype[n];a&&(o.prototype[n]=function(...s){return z(this),a.apply(this,s)})}g=AudioNode.prototype.connect,AudioNode.prototype.connect=function(n,a,s){g.call(this,n,a,s);let i=this.context;if(D.has(i)&&n instanceof AudioDestinationNode){let t=a??0,r=s??0,e=window.__slaytesterCaptureDest;(!e||n!==e)&&B.push({source:this,output:t,input:r}),e&&n!==e&&O(this,e)&&g.call(this,e,a,s)}return n}}}function E(o){let n=new Map;for(let a of B){let s=a.source.context;!s||I.has(s)||(n.has(s)||n.set(s,[]),n.get(s).push(a))}for(let[a,s]of n){I.add(a);let i=a.destination,t=a.createGain(),r=a.createMediaStreamDestination();g.call(t,r,0,0),g.call(t,i,0,0);for(let e of s)try{g.call(e.source,t,e.output,0)}catch{}return r.stream}return null}var _={popupText:"This game is running a playtest! Do you want to join the playtest and record your gameplay?",privacyPolicyUrl:null,popupYes:"Sure!",popupNo:"Nah",popupFooter:"powered by Slaytester",requestMic:!0,popupMic:"Enable your microphone for commentary?",fps:30,css:`
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
}`,bitrate:1e6};(function(){L();let o=document.currentScript,n=o?.getAttribute("data-playtest-id");if(!n){console.warn("[Slaytester] no data-playtest-id found on script tag");return}console.log("[Slaytester] loaded for playtest:",n);let s=(o?.src??"").replace(/\/recorder\.js(\?.*)?$/,"");console.log("[Slaytester] base URL:",s),fetch(`${s}/api/recorder/config?playtestId=${n}`).then(r=>{if(!r.ok)throw new Error(`config fetch returned ${r.status}`);return r.json()}).then(r=>{if(r.availableSlots===0){console.log("[Slaytester] playtest is full, exiting");return}let e={..._,...r,apiBase:s};console.log("[Slaytester] config received:",e),R(e,()=>{fetch(`${s}/api/recorder/session`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({playtestId:n})}).then(c=>{if(c.status===409){console.log("[Slaytester] playtest is full"),i(e);return}if(!c.ok)throw new Error(`session claim returned ${c.status}`);return c.json()}).then(c=>{if(!c?.sessionId)return;let l=c.sessionId;if(console.log("[Slaytester] session claimed:",l),!e.requestMic){t(e,l,null);return}k(e,()=>{navigator.mediaDevices.getUserMedia({audio:!0}).then(u=>{w(e,u,d=>{t(e,l,d)},()=>{u.getTracks().forEach(d=>d.stop()),k(e,()=>{navigator.mediaDevices.getUserMedia({audio:!0}).then(d=>w(e,d,p=>t(e,l,p),()=>{d.getTracks().forEach(p=>p.stop())}))},()=>t(e,l,null))})}).catch(u=>{console.warn("[Slaytester] getUserMedia failed, recording without mic:",u),t(e,l,null)})},()=>t(e,l,null))}).catch(c=>console.error("[Slaytester] failed to claim session:",c))},()=>console.log("[Slaytester] recording declined by user"))}).catch(r=>console.error("[Slaytester] failed to fetch config:",r));function i(r){let e=document.createElement("div");e.className="st-overlay";let c=document.createElement("div");c.className="st-card";let l=document.createElement("p");l.className="st-text",l.textContent="This playtest is full. Thanks for your interest!",c.appendChild(l),e.appendChild(c),document.body.appendChild(e);let u="st-style";if(!document.getElementById(u)){let d=document.createElement("style");d.id=u,d.textContent=r.css,document.head.appendChild(d)}}async function t(r,e,c){let l=document.querySelector("canvas");if(!l){console.error("[Slaytester] no canvas element found on page");return}let u=r.fps??30;console.log("[Slaytester] capturing canvas at",u,"fps");let d;try{let m=l.getContext("2d");m&&(m.globalAlpha=.01,m.fillRect(0,0,1,1),m.globalAlpha=1),d=l.captureStream(u)}catch(m){console.error("[Slaytester] canvas.captureStream failed:",m);return}let p=d.getVideoTracks();console.log("[Slaytester] canvas video tracks:",p.length),p.length===0&&console.warn("[Slaytester] canvas has no video tracks"),console.log("[Slaytester] session ID:",e);let y;try{y=new AudioContext,console.log("[Slaytester] audioCtx state:",y.state),y.state==="suspended"&&(await y.resume(),console.log("[Slaytester] audioCtx resumed"))}catch(m){console.error("[Slaytester] failed to create AudioContext:",m);return}let f=y.createMediaStreamDestination();window.__slaytesterCaptureDest=f,console.log("[Slaytester] capture destination created");let S=y.createConstantSource();S.offset.value=0,S.connect(f),S.start();function M(m){y.createMediaStreamSource(m).connect(f),console.log("[Slaytester] bridged game audio to recorder")}let T=E(f);if(T)M(T);else{let m=setInterval(()=>{let h=E(f);h&&(clearInterval(m),M(h))},1e3)}if(c){let m=c.getAudioTracks();console.log("[Slaytester] connecting mic:",m.length,"track(s)");let h=y.createMediaStreamSource(c),P=y.createGain();h.connect(P),P.connect(f)}else console.log("[Slaytester] no mic stream, recording without microphone");console.log("[Slaytester] capture dest audio tracks:",f.stream.getAudioTracks().length);let U=[...p,...f.stream.getAudioTracks()],N=new MediaStream(U);console.log("[Slaytester] combined stream tracks:",N.getTracks().length);let A=$(s,e,r,N);addEventListener("beforeunload",()=>{A&&A.stop(),navigator.sendBeacon(`${s}/api/recorder/finalize`,new Blob([JSON.stringify({sessionId:e})],{type:"application/json"}))})}})();})();
