(()=>{function b(n){let t="st-style";if(document.getElementById(t))return;let r=document.createElement("style");r.id=t,r.textContent=n,document.head.appendChild(r)}function C(){let n=document.createElement("div");n.className="st-overlay";let t=document.createElement("div");return t.className="st-card",n.appendChild(t),document.body.appendChild(n),{card:t,cleanup:()=>{document.body.removeChild(n);let r=document.getElementById("st-style");r?.parentNode?.removeChild(r)}}}function x(n,t){let r=document.createElement("p");r.className="st-text",r.textContent=t,n.appendChild(r)}function w(n,t,r,a,l){let o=document.createElement("div");o.className="st-btns";let c=document.createElement("button");c.className="st-btn-yes st-btn",c.textContent=t;let e=document.createElement("button");return e.className="st-btn-no st-btn",e.textContent=r,c.addEventListener("click",a),e.addEventListener("click",l),o.appendChild(c),o.appendChild(e),n.appendChild(o),c}function I(n,t,r){b(n.css);let{card:a,cleanup:l}=C();x(a,n.popupText),w(a,n.popupYes,n.popupNo,()=>{l(),t()},()=>{l(),r()});let o=document.createElement("p");o.className="st-footer",o.textContent=n.popupFooter,a.appendChild(o)}function k(n,t,r){b(n.css);let{card:a,cleanup:l}=C();x(a,n.popupMic),w(a,n.popupYes,n.popupNo,()=>{l(),t()},()=>{l(),r()})}function E(n,t,r,a){b(n.css);let{card:l,cleanup:o}=C(),c=document.createElement("audio");c.srcObject=t,c.muted=!1,c.play().catch(()=>{}),x(l,"Mic check \u2014 can you hear yourself?"),w(l,"Yes","Go back",()=>{c.pause(),c.srcObject=null,o(),r(t)},()=>{c.pause(),c.srcObject=null,o(),a()})}function O(n,t,r,a,l){let o=new FormData;return o.append("sessionId",t),o.append("chunkIndex",String(r)),o.append("chunkTime",String(a)),o.append("blob",l,`${r}_${a}.mp4`),{url:`${n}/api/recorder/upload`,body:o}}function $(n,t,r,a){let l=MediaRecorder.isTypeSupported("video/mp4;codecs=avc3")?"video/mp4;codecs=avc3":"video/mp4";if(console.log("[Slaytester] MediaRecorder mime:",l),!MediaRecorder.isTypeSupported(l))return console.error("[Slaytester] video/mp4 not supported by MediaRecorder"),{stop:()=>{}};let o;try{o=new MediaRecorder(a,{mimeType:l,videoBitsPerSecond:r.bitrate})}catch(e){return console.error("[Slaytester] MediaRecorder constructor failed:",e),{stop:()=>{}}}console.log("[Slaytester] MediaRecorder created:",{mimeType:o.mimeType,state:o.state,videoBitsPerSecond:o.videoBitsPerSecond}),o.onstart=()=>{console.log("[Slaytester] MediaRecorder started, state:",o.state)},o.onstop=()=>{console.log("[Slaytester] MediaRecorder stopped, state:",o.state)},o.onerror=()=>{console.error("[Slaytester] MediaRecorder error:",o.error),window.dispatchEvent(new CustomEvent("slaytester:error",{detail:{message:`MediaRecorder error: ${o.error?.message}`,chunkIndex:c}}))};let c=0;o.ondataavailable=e=>{if(console.log(`[Slaytester] ondataavailable fired, size: ${e.data.size}`),e.data.size===0)return;let s=c++,i=Math.floor(performance.now()),{url:u,body:p}=O(n,t,s,i,e.data);console.log(`[Slaytester] Uploading chunk ${s} (${e.data.size} bytes) to ${u}`),fetch(u,{method:"POST",body:p}).then(d=>{d.ok?console.log(`[Slaytester] Chunk ${s} uploaded`):(console.error(`[Slaytester] Upload failed for chunk ${s}: ${d.status} ${d.statusText}`),window.dispatchEvent(new CustomEvent("slaytester:error",{detail:{message:`Upload failed: HTTP ${d.status}`,chunkIndex:s}})))}).catch(d=>{console.error(`[Slaytester] Network error uploading chunk ${s}:`,d),window.dispatchEvent(new CustomEvent("slaytester:error",{detail:{message:`Network error: ${d.message}`,chunkIndex:s}}))})},a.getTracks().forEach(e=>console.log("[Slaytester] track:",e.kind,"readyState:",e.readyState,"enabled:",e.enabled,"muted:",e.muted));try{o.start(1e3),console.log("[Slaytester] recorder.start(1000) called successfully, state:",o.state)}catch(e){return console.error("[Slaytester] recorder.start failed:",e),window.dispatchEvent(new CustomEvent("slaytester:error",{detail:{message:`recorder.start failed: ${e.message}`}})),{stop:()=>{}}}return setTimeout(()=>{console.log("[Slaytester] recorder state 2s after start:",o.state)},2e3),{stop:()=>{o.state!=="inactive"&&(console.log("[Slaytester] Stopping recorder"),o.stop())}}}var B=new WeakSet,D=new WeakSet,L=[],S;function z(n){B.add(n),window.__slaytesterGameCtx||(window.__slaytesterGameCtx=n)}function G(n,t){try{n.context}catch{return!1}try{t.context}catch{return!1}return n.context===t.context}var H=["createGain","createBufferSource","createOscillator","createScriptProcessor","createMediaElementSource","createMediaStreamSource"];function _(){let n=window.AudioContext||window.webkitAudioContext;if(n){for(let t of H){let r=n.prototype[t];r&&(n.prototype[t]=function(...a){return z(this),r.apply(this,a)})}S=AudioNode.prototype.connect,AudioNode.prototype.connect=function(t,r,a){S.call(this,t,r,a);let l=this.context;if(B.has(l)&&t instanceof AudioDestinationNode){let o=r??0,c=a??0,e=window.__slaytesterCaptureDest;(!e||t!==e)&&L.push({source:this,output:o,input:c}),e&&t!==e&&G(this,e)&&S.call(this,e,r,a)}return t}}}function M(n){let t=new Map;for(let r of L){let a=r.source.context;!a||D.has(a)||(t.has(a)||t.set(a,[]),t.get(a).push(r))}for(let[r,a]of t){D.add(r);let l=r.destination,o=r.createGain(),c=r.createMediaStreamDestination();S.call(o,c,0,0),S.call(o,l,0,0);for(let e of a)try{S.call(e.source,o,e.output,0)}catch(s){console.warn("[Slaytester] bridge connection failed:",s)}return c.stream}return null}var j={popupText:"This game is running a playtest! Do you want to join the playtest and record your gameplay?",privacyPolicyUrl:null,popupYes:"Sure!",popupNo:"Nah",popupFooter:"powered by Slaytester",requestMic:!0,popupMic:"Enable your microphone for commentary?",fps:30,css:`
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
}`,bitrate:1e6};(function(){_();let n=document.currentScript,t=n?.getAttribute("data-playtest-id");if(!t){console.warn("[Slaytester] no data-playtest-id found on script tag");return}console.log("[Slaytester] loaded for playtest:",t);let a=(n?.src??"").replace(/\/recorder\.js(\?.*)?$/,"");console.log("[Slaytester] base URL:",a),fetch(`${a}/api/recorder/config?playtestId=${t}`).then(e=>{if(!e.ok)throw new Error(`config fetch returned ${e.status}`);return e.json()}).then(e=>{if(e.availableSlots===0){console.log("[Slaytester] playtest is full, exiting");return}let s={...j,...e,apiBase:a};console.log("[Slaytester] config received:",s),I(s,()=>{fetch(`${a}/api/recorder/session`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({playtestId:t})}).then(i=>{if(i.status===409){console.log("[Slaytester] playtest is full"),o(s);return}if(!i.ok)throw new Error(`session claim returned ${i.status}`);return i.json()}).then(i=>{if(!i?.sessionId)return;let u=i.sessionId;if(console.log("[Slaytester] session claimed:",u),!s.requestMic){c(s,u,null);return}if(!navigator.mediaDevices){l(s);return}k(s,()=>{navigator.mediaDevices.getUserMedia({audio:!0}).then(p=>{E(s,p,d=>{c(s,u,d)},()=>{p.getTracks().forEach(d=>d.stop()),k(s,()=>{navigator.mediaDevices.getUserMedia({audio:!0}).then(d=>E(s,d,y=>c(s,u,y),()=>{d.getTracks().forEach(y=>y.stop())}))},()=>c(s,u,null))})}).catch(p=>{console.warn("[Slaytester] getUserMedia failed, recording without mic:",p),c(s,u,null)})},()=>c(s,u,null))}).catch(i=>console.error("[Slaytester] failed to claim session:",i))},()=>console.log("[Slaytester] recording declined by user"))}).catch(e=>console.error("[Slaytester] failed to fetch config:",e));function l(e){let s=document.createElement("div");s.className="st-overlay";let i=document.createElement("div");i.className="st-card";let u=document.createElement("p");u.className="st-text",u.textContent="Microphone access requires HTTPS or getting served from localhost. Recording without mic.",i.appendChild(u);let p=document.createElement("button");p.className="st-btn-yes st-btn",p.textContent="OK",p.addEventListener("click",()=>document.body.removeChild(s)),i.appendChild(p),s.appendChild(i),document.body.appendChild(s);let d="st-style";if(!document.getElementById(d)){let y=document.createElement("style");y.id=d,y.textContent=e.css,document.head.appendChild(y)}}function o(e){let s=document.createElement("div");s.className="st-overlay";let i=document.createElement("div");i.className="st-card";let u=document.createElement("p");u.className="st-text",u.textContent="This playtest is full. Thanks for your interest!",i.appendChild(u),s.appendChild(i),document.body.appendChild(s);let p="st-style";if(!document.getElementById(p)){let d=document.createElement("style");d.id=p,d.textContent=e.css,document.head.appendChild(d)}}async function c(e,s,i){let u=document.querySelector("canvas");if(!u){console.error("[Slaytester] no canvas element found on page");return}let p=e.fps??30;console.log("[Slaytester] capturing canvas at",p,"fps");let d;try{let m=u.getContext("2d");m&&(m.globalAlpha=.01,m.fillRect(0,0,1,1),m.globalAlpha=1),d=u.captureStream(p)}catch(m){console.error("[Slaytester] canvas.captureStream failed:",m);return}let y=d.getVideoTracks();console.log("[Slaytester] canvas video tracks:",y.length),y.length===0&&console.warn("[Slaytester] canvas has no video tracks"),console.log("[Slaytester] session ID:",s);let f;try{f=new AudioContext,console.log("[Slaytester] audioCtx state:",f.state),f.state==="suspended"&&(await f.resume(),console.log("[Slaytester] audioCtx resumed"))}catch(m){console.error("[Slaytester] failed to create AudioContext:",m);return}let g=f.createMediaStreamDestination();window.__slaytesterCaptureDest=g,console.log("[Slaytester] capture destination created");let v=f.createConstantSource();v.offset.value=0,v.connect(g),v.start();function T(m){try{f.createMediaStreamSource(m).connect(g),console.log("[Slaytester] bridged game audio to recorder")}catch(h){console.error("[Slaytester] failed to bridge game audio:",h)}}let N=M(g);if(N)T(N);else{let m=setInterval(()=>{let h=M(g);h&&(clearInterval(m),T(h))},1e3)}if(i){let m=i.getAudioTracks();console.log("[Slaytester] connecting mic:",m.length,"track(s)");let h=f.createMediaStreamSource(i),P=f.createGain();h.connect(P),P.connect(g)}else console.log("[Slaytester] no mic stream, recording without microphone");console.log("[Slaytester] capture dest audio tracks:",g.stream.getAudioTracks().length);let U=[...y,...g.stream.getAudioTracks()],A=new MediaStream(U);console.log("[Slaytester] combined stream tracks:",A.getTracks().length);let R=$(a,s,e,A);addEventListener("beforeunload",()=>{R&&R.stop()})}})();})();
