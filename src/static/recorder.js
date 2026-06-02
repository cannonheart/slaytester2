(()=>{function b(n){let o="st-style";if(document.getElementById(o))return;let r=document.createElement("style");r.id=o,r.textContent=n,document.head.appendChild(r)}function v(){let n=document.createElement("div");n.className="st-overlay";let o=document.createElement("div");return o.className="st-card",n.appendChild(o),document.body.appendChild(n),{card:o,cleanup:()=>{document.body.removeChild(n);let r=document.getElementById("st-style");r?.parentNode?.removeChild(r)}}}function C(n,o){let r=document.createElement("p");r.className="st-text",r.textContent=o,n.appendChild(r)}function x(n,o,r,s,i){let t=document.createElement("div");t.className="st-btns";let a=document.createElement("button");a.className="st-btn-yes st-btn",a.textContent=o;let e=document.createElement("button");return e.className="st-btn-no st-btn",e.textContent=r,a.addEventListener("click",s),e.addEventListener("click",i),t.appendChild(a),t.appendChild(e),n.appendChild(t),a}function P(n,o,r){b(n.css);let{card:s,cleanup:i}=v();C(s,n.popupText),x(s,n.popupYes,n.popupNo,()=>{i(),o()},()=>{i(),r()});let t=document.createElement("p");t.className="st-footer",t.textContent=n.popupFooter,s.appendChild(t)}function w(n,o,r){b(n.css);let{card:s,cleanup:i}=v();C(s,n.popupMic),x(s,n.popupYes,n.popupNo,()=>{i(),o()},()=>{i(),r()})}function k(n,o,r,s){b(n.css);let{card:i,cleanup:t}=v(),a=document.createElement("audio");a.srcObject=o,a.muted=!1,a.play().catch(()=>{}),C(i,"Mic check \u2014 can you hear yourself?"),x(i,"Yes","Go back",()=>{a.pause(),a.srcObject=null,t(),r(o)},()=>{a.pause(),a.srcObject=null,t(),s()})}function U(n,o,r,s,i){let t=new FormData;return t.append("sessionId",o),t.append("chunkIndex",String(r)),t.append("chunkTime",String(s)),t.append("blob",i,`${r}_${s}.mp4`),{url:`${n}/api/recorder/upload`,body:t}}function $(n,o,r,s){let i=MediaRecorder.isTypeSupported("video/mp4;codecs=avc3")?"video/mp4;codecs=avc3":"video/mp4";if(console.log("[Slaytester] MediaRecorder mime:",i),!MediaRecorder.isTypeSupported(i))return console.error("[Slaytester] video/mp4 not supported by MediaRecorder"),{stop:()=>{}};let t;try{t=new MediaRecorder(s,{mimeType:i,videoBitsPerSecond:r.bitrate})}catch(e){return console.error("[Slaytester] MediaRecorder constructor failed:",e),{stop:()=>{}}}console.log("[Slaytester] MediaRecorder created:",{mimeType:t.mimeType,state:t.state,videoBitsPerSecond:t.videoBitsPerSecond}),t.onstart=()=>{console.log("[Slaytester] MediaRecorder started, state:",t.state)},t.onstop=()=>{console.log("[Slaytester] MediaRecorder stopped, state:",t.state)},t.onerror=()=>{console.error("[Slaytester] MediaRecorder error:",t.error),window.dispatchEvent(new CustomEvent("slaytester:error",{detail:{message:`MediaRecorder error: ${t.error?.message}`,chunkIndex:a}}))};let a=0;t.ondataavailable=e=>{if(console.log(`[Slaytester] ondataavailable fired, size: ${e.data.size}`),e.data.size===0)return;let c=a++,d=Math.floor(performance.now()),{url:m,body:l}=U(n,o,c,d,e.data);console.log(`[Slaytester] Uploading chunk ${c} (${e.data.size} bytes) to ${m}`),fetch(m,{method:"POST",body:l}).then(u=>{u.ok?console.log(`[Slaytester] Chunk ${c} uploaded`):(console.error(`[Slaytester] Upload failed for chunk ${c}: ${u.status} ${u.statusText}`),window.dispatchEvent(new CustomEvent("slaytester:error",{detail:{message:`Upload failed: HTTP ${u.status}`,chunkIndex:c}})))}).catch(u=>{console.error(`[Slaytester] Network error uploading chunk ${c}:`,u),window.dispatchEvent(new CustomEvent("slaytester:error",{detail:{message:`Network error: ${u.message}`,chunkIndex:c}}))})},s.getTracks().forEach(e=>console.log("[Slaytester] track:",e.kind,"readyState:",e.readyState,"enabled:",e.enabled,"muted:",e.muted));try{t.start(1e3),console.log("[Slaytester] recorder.start(1000) called successfully, state:",t.state)}catch(e){return console.error("[Slaytester] recorder.start failed:",e),window.dispatchEvent(new CustomEvent("slaytester:error",{detail:{message:`recorder.start failed: ${e.message}`}})),{stop:()=>{}}}return setTimeout(()=>{console.log("[Slaytester] recorder state 2s after start:",t.state)},2e3),{stop:()=>{t.state!=="inactive"&&(console.log("[Slaytester] Stopping recorder"),t.stop())}}}var D=new WeakSet,I=new WeakSet,B=[],g;function z(n){D.add(n),window.__slaytesterGameCtx||(window.__slaytesterGameCtx=n)}function O(n,o){try{n.context}catch{return!1}try{o.context}catch{return!1}return n.context===o.context}var G=["createGain","createBufferSource","createOscillator","createScriptProcessor","createMediaElementSource","createMediaStreamSource"];function _(){let n=window.AudioContext||window.webkitAudioContext;if(n){for(let o of G){let r=n.prototype[o];r&&(n.prototype[o]=function(...s){return z(this),r.apply(this,s)})}g=AudioNode.prototype.connect,AudioNode.prototype.connect=function(o,r,s){g.call(this,o,r,s);let i=this.context;if(D.has(i)&&o instanceof AudioDestinationNode){let t=r??0,a=s??0,e=window.__slaytesterCaptureDest;(!e||o!==e)&&B.push({source:this,output:t,input:a}),e&&o!==e&&O(this,e)&&g.call(this,e,r,s)}return o}}}function M(n){let o=new Map;for(let r of B){let s=r.source.context;!s||I.has(s)||(o.has(s)||o.set(s,[]),o.get(s).push(r))}for(let[r,s]of o){I.add(r);let i=r.destination,t=r.createGain(),a=r.createMediaStreamDestination();g.call(t,a,0,0),g.call(t,i,0,0);for(let e of s)try{g.call(e.source,t,e.output,0)}catch{}return a.stream}return null}var L={popupText:"This game is running a playtest! Do you want to join the playtest and record your gameplay?",privacyPolicyUrl:null,popupYes:"Sure!",popupNo:"Nah",popupFooter:"powered by Slaytester",requestMic:!0,popupMic:"Enable your microphone for commentary?",fps:30,css:`
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
}`,bitrate:1e6};(function(){_();let n=document.currentScript,o=n?.getAttribute("data-playtest-id");if(!o){console.warn("[Slaytester] no data-playtest-id found on script tag");return}console.log("[Slaytester] loaded for playtest:",o);let s=(n?.src??"").replace(/\/recorder\.js(\?.*)?$/,"");console.log("[Slaytester] base URL:",s),fetch(`${s}/api/recorder/config?playtestId=${o}`).then(a=>{if(!a.ok)throw new Error(`config fetch returned ${a.status}`);return a.json()}).then(a=>{if(a.availableSlots===0){console.log("[Slaytester] playtest is full, exiting");return}let e={...L,...a,apiBase:s};console.log("[Slaytester] config received:",e),P(e,()=>{fetch(`${s}/api/recorder/session`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({playtestId:o})}).then(c=>{if(c.status===409){console.log("[Slaytester] playtest is full"),i(e);return}if(!c.ok)throw new Error(`session claim returned ${c.status}`);return c.json()}).then(c=>{if(!c?.sessionId)return;let d=c.sessionId;if(console.log("[Slaytester] session claimed:",d),!e.requestMic){t(e,d,null);return}w(e,()=>{navigator.mediaDevices.getUserMedia({audio:!0}).then(m=>{k(e,m,l=>{t(e,d,l)},()=>{m.getTracks().forEach(l=>l.stop()),w(e,()=>{navigator.mediaDevices.getUserMedia({audio:!0}).then(l=>k(e,l,u=>t(e,d,u),()=>{l.getTracks().forEach(u=>u.stop())}))},()=>t(e,d,null))})}).catch(m=>{console.warn("[Slaytester] getUserMedia failed, recording without mic:",m),t(e,d,null)})},()=>t(e,d,null))}).catch(c=>console.error("[Slaytester] failed to claim session:",c))},()=>console.log("[Slaytester] recording declined by user"))}).catch(a=>console.error("[Slaytester] failed to fetch config:",a));function i(a){let e=document.createElement("div");e.className="st-overlay";let c=document.createElement("div");c.className="st-card";let d=document.createElement("p");d.className="st-text",d.textContent="This playtest is full. Thanks for your interest!",c.appendChild(d),e.appendChild(c),document.body.appendChild(e);let m="st-style";if(!document.getElementById(m)){let l=document.createElement("style");l.id=m,l.textContent=a.css,document.head.appendChild(l)}}async function t(a,e,c){let d=document.querySelector("canvas");if(!d){console.error("[Slaytester] no canvas element found on page");return}let m=a.fps??30;console.log("[Slaytester] capturing canvas at",m,"fps");let l;try{let p=d.getContext("2d");p&&(p.globalAlpha=.01,p.fillRect(0,0,1,1),p.globalAlpha=1),l=d.captureStream(m)}catch(p){console.error("[Slaytester] canvas.captureStream failed:",p);return}let u=l.getVideoTracks();console.log("[Slaytester] canvas video tracks:",u.length),u.length===0&&console.warn("[Slaytester] canvas has no video tracks"),console.log("[Slaytester] session ID:",e);let y;try{y=new AudioContext,console.log("[Slaytester] audioCtx state:",y.state),y.state==="suspended"&&(await y.resume(),console.log("[Slaytester] audioCtx resumed"))}catch(p){console.error("[Slaytester] failed to create AudioContext:",p);return}let f=y.createMediaStreamDestination();window.__slaytesterCaptureDest=f,console.log("[Slaytester] capture destination created");let S=y.createConstantSource();S.offset.value=0,S.connect(f),S.start();function E(p){y.createMediaStreamSource(p).connect(f),console.log("[Slaytester] bridged game audio to recorder")}let T=M(f);if(T)E(T);else{let p=setInterval(()=>{let h=M(f);h&&(clearInterval(p),E(h))},1e3)}if(c){let p=c.getAudioTracks();console.log("[Slaytester] connecting mic:",p.length,"track(s)");let h=y.createMediaStreamSource(c),R=y.createGain();h.connect(R),R.connect(f)}else console.log("[Slaytester] no mic stream, recording without microphone");console.log("[Slaytester] capture dest audio tracks:",f.stream.getAudioTracks().length);let j=[...u,...f.stream.getAudioTracks()],A=new MediaStream(j);console.log("[Slaytester] combined stream tracks:",A.getTracks().length);let N=$(s,e,a,A);addEventListener("beforeunload",()=>{N&&N.stop()})}})();})();
