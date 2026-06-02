(()=>{function R(n){let t="st-style";if(document.getElementById(t))return;let r=document.createElement("style");r.id=t,r.textContent=n,document.head.appendChild(r)}function N(){let n=document.createElement("div");n.className="st-overlay";let t=document.createElement("div");return t.className="st-card",n.appendChild(t),document.body.appendChild(n),{card:t,cleanup:()=>{document.body.removeChild(n);let r=document.getElementById("st-style");r?.parentNode?.removeChild(r)}}}function A(n,t){let r=document.createElement("p");r.className="st-text",r.textContent=t,n.appendChild(r)}function $(n,t,r,c,p){let o=document.createElement("div");o.className="st-btns";let l=document.createElement("button");l.className="st-btn-yes st-btn",l.textContent=t;let e=document.createElement("button");return e.className="st-btn-no st-btn",e.textContent=r,l.addEventListener("click",c),e.addEventListener("click",p),o.appendChild(l),o.appendChild(e),n.appendChild(o),l}function _(n,t,r){R(n.css);let{card:c,cleanup:p}=N();A(c,n.popupText),$(c,n.popupYes,n.popupNo,()=>{p(),t()},()=>{p(),r()});let o=document.createElement("p");o.className="st-footer",o.textContent=n.popupFooter,c.appendChild(o)}function I(n,t,r){R(n.css);let{card:c,cleanup:p}=N();A(c,n.popupMic),$(c,n.popupYes,n.popupNo,()=>{p(),t()},()=>{p(),r()})}function P(n,t,r,c){R(n.css);let{card:p,cleanup:o}=N(),l=document.createElement("audio");l.srcObject=t,l.muted=!1,l.play().catch(()=>{}),A(p,"Mic check \u2014 can you hear yourself?"),$(p,"Yes","Go back",()=>{l.pause(),l.srcObject=null,o(),r(t)},()=>{l.pause(),l.srcObject=null,o(),c()})}function J(n,t,r,c,p){let o=new FormData;return o.append("sessionId",t),o.append("chunkIndex",String(r)),o.append("chunkTime",String(c)),o.append("blob",p,`${r}_${c}.mp4`),{url:`${n}/api/recorder/upload`,body:o}}function j(n,t,r,c){let p=MediaRecorder.isTypeSupported("video/mp4;codecs=avc3")?"video/mp4;codecs=avc3":"video/mp4";if(console.log("[Slaytester] MediaRecorder mime:",p),!MediaRecorder.isTypeSupported(p))return console.error("[Slaytester] video/mp4 not supported by MediaRecorder"),{stop:()=>{}};let o;try{o=new MediaRecorder(c,{mimeType:p,videoBitsPerSecond:r.bitrate})}catch(e){return console.error("[Slaytester] MediaRecorder constructor failed:",e),{stop:()=>{}}}console.log("[Slaytester] MediaRecorder created:",{mimeType:o.mimeType,state:o.state,videoBitsPerSecond:o.videoBitsPerSecond}),o.onstart=()=>{console.log("[Slaytester] MediaRecorder started, state:",o.state)},o.onstop=()=>{console.log("[Slaytester] MediaRecorder stopped, state:",o.state)},o.onerror=()=>{console.error("[Slaytester] MediaRecorder error:",o.error),window.dispatchEvent(new CustomEvent("slaytester:error",{detail:{message:`MediaRecorder error: ${o.error?.message}`,chunkIndex:l}}))};let l=0;o.ondataavailable=e=>{if(console.log(`[Slaytester] ondataavailable fired, size: ${e.data.size}`),e.data.size===0)return;let a=l++,u=Math.floor(performance.now()),{url:m,body:y}=J(n,t,a,u,e.data);console.log(`[Slaytester] Uploading chunk ${a} (${e.data.size} bytes) to ${m}`),fetch(m,{method:"POST",body:y}).then(s=>{s.ok?console.log(`[Slaytester] Chunk ${a} uploaded`):(console.error(`[Slaytester] Upload failed for chunk ${a}: ${s.status} ${s.statusText}`),window.dispatchEvent(new CustomEvent("slaytester:error",{detail:{message:`Upload failed: HTTP ${s.status}`,chunkIndex:a}})))}).catch(s=>{console.error(`[Slaytester] Network error uploading chunk ${a}:`,s),window.dispatchEvent(new CustomEvent("slaytester:error",{detail:{message:`Network error: ${s.message}`,chunkIndex:a}}))})},c.getTracks().forEach(e=>console.log("[Slaytester] track:",e.kind,"readyState:",e.readyState,"enabled:",e.enabled,"muted:",e.muted));try{o.start(1e3),console.log("[Slaytester] recorder.start(1000) called successfully, state:",o.state)}catch(e){return console.error("[Slaytester] recorder.start failed:",e),window.dispatchEvent(new CustomEvent("slaytester:error",{detail:{message:`recorder.start failed: ${e.message}`}})),{stop:()=>{}}}return setTimeout(()=>{console.log("[Slaytester] recorder state 2s after start:",o.state)},2e3),{stop:()=>{o.state!=="inactive"&&(console.log("[Slaytester] Stopping recorder"),o.stop())}}}var F=new WeakSet,U=new WeakSet,H=[],C;function K(n){F.add(n),window.__slaytesterGameCtx||(window.__slaytesterGameCtx=n)}function Q(n,t){try{n.context}catch{return!1}try{t.context}catch{return!1}return n.context===t.context}var X=["createGain","createBufferSource","createOscillator","createScriptProcessor","createMediaElementSource","createMediaStreamSource"];function q(){let n=window.AudioContext||window.webkitAudioContext;if(n){for(let t of X){let r=n.prototype[t];r&&(n.prototype[t]=function(...c){return K(this),r.apply(this,c)})}C=AudioNode.prototype.connect,AudioNode.prototype.connect=function(t,r,c){C.call(this,t,r,c);let p=this.context;if(F.has(p)&&t instanceof AudioDestinationNode){let o=r??0,l=c??0,e=window.__slaytesterCaptureDest;(!e||t!==e)&&H.push({source:this,output:o,input:l}),e&&t!==e&&Q(this,e)&&C.call(this,e,r,c)}return t}}}function B(n){let t=new Map;for(let r of H){let c=r.source.context;!c||U.has(c)||(t.has(c)||t.set(c,[]),t.get(c).push(r))}for(let[r,c]of t){U.add(r);let p=r.destination,o=r.createGain(),l=r.createMediaStreamDestination();C.call(o,l,0,0),C.call(o,p,0,0);for(let e of c)try{C.call(e.source,o,e.output,0)}catch(a){console.warn("[Slaytester] bridge connection failed:",a)}return l.stream}return null}var Y={popupText:"This game is running a playtest! Do you want to join the playtest and record your gameplay?",privacyPolicyUrl:null,popupYes:"Sure!",popupNo:"Nah",popupFooter:"powered by Slaytester",requestMic:!0,popupMic:"Enable your microphone for commentary?",fps:30,css:`
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
}`,bitrate:1e6};(function(){q();let n=document.currentScript,t=n?.getAttribute("data-playtest-id");if(!t){console.warn("[Slaytester] no data-playtest-id found on script tag");return}console.log("[Slaytester] loaded for playtest:",t);let c=(n?.src??"").replace(/\/recorder\.js(\?.*)?$/,"");console.log("[Slaytester] base URL:",c),fetch(`${c}/api/recorder/config?playtestId=${t}`).then(e=>{if(!e.ok)throw new Error(`config fetch returned ${e.status}`);return e.json()}).then(e=>{if(e.availableSlots===0){console.log("[Slaytester] playtest is full, exiting");return}let a={...Y,...e,apiBase:c};console.log("[Slaytester] config received:",a),_(a,()=>{fetch(`${c}/api/recorder/session`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({playtestId:t})}).then(u=>{if(u.status===409){console.log("[Slaytester] playtest is full"),o(a);return}if(!u.ok)throw new Error(`session claim returned ${u.status}`);return u.json()}).then(u=>{if(!u?.sessionId)return;let m=u.sessionId;if(console.log("[Slaytester] session claimed:",m),!a.requestMic){l(a,m,null);return}if(!navigator.mediaDevices){p(a);return}I(a,()=>{navigator.mediaDevices.getUserMedia({audio:{autoGainControl:!1,echoCancellation:!1,noiseSuppression:!1}}).then(y=>{P(a,y,s=>{l(a,m,s)},()=>{y.getTracks().forEach(s=>s.stop()),I(a,()=>{navigator.mediaDevices.getUserMedia({audio:{autoGainControl:!1,echoCancellation:!1,noiseSuppression:!1}}).then(s=>P(a,s,f=>l(a,m,f),()=>{s.getTracks().forEach(f=>f.stop())}))},()=>l(a,m,null))})}).catch(y=>{console.warn("[Slaytester] getUserMedia failed, recording without mic:",y),l(a,m,null)})},()=>l(a,m,null))}).catch(u=>console.error("[Slaytester] failed to claim session:",u))},()=>console.log("[Slaytester] recording declined by user"))}).catch(e=>console.error("[Slaytester] failed to fetch config:",e));function p(e){let a=document.createElement("div");a.className="st-overlay";let u=document.createElement("div");u.className="st-card";let m=document.createElement("p");m.className="st-text",m.textContent="Microphone access requires HTTPS or getting served from localhost. Recording without mic.",u.appendChild(m);let y=document.createElement("button");y.className="st-btn-yes st-btn",y.textContent="OK",y.addEventListener("click",()=>document.body.removeChild(a)),u.appendChild(y),a.appendChild(u),document.body.appendChild(a);let s="st-style";if(!document.getElementById(s)){let f=document.createElement("style");f.id=s,f.textContent=e.css,document.head.appendChild(f)}}function o(e){let a=document.createElement("div");a.className="st-overlay";let u=document.createElement("div");u.className="st-card";let m=document.createElement("p");m.className="st-text",m.textContent="This playtest is full. Thanks for your interest!",u.appendChild(m),a.appendChild(u),document.body.appendChild(a);let y="st-style";if(!document.getElementById(y)){let s=document.createElement("style");s.id=y,s.textContent=e.css,document.head.appendChild(s)}}async function l(e,a,u){function m(){let i=document.querySelectorAll("canvas");console.log(`[Slaytester] Found ${i.length} canvas(es):`),i.forEach((d,g)=>{let v=d.getBoundingClientRect();console.log(`  [${g}] id="${d.id}" class="${d.className}" internal=${d.width}x${d.height} css=${Math.round(v.width)}x${Math.round(v.height)} visible=${v.width>0&&v.height>0}`)})}let y=e.fps??30;console.log("[Slaytester] capturing canvas at",y,"fps"),m();let s=null;for(let i=0;i<20;i++){for(let d of document.querySelectorAll("canvas")){let g=d.getBoundingClientRect();if(d.width>0&&d.height>0&&g.width>0&&g.height>0){s=d;break}}if(s)break;await new Promise(d=>setTimeout(d,1e3))}if(!s){console.error("[Slaytester] No suitable canvas found after 20s"),m();return}console.log("[Slaytester] Selected canvas:",s.id||"(no id)",s.width,"x",s.height);let f=Math.round(s.getBoundingClientRect().width)||s.width,S=Math.round(s.getBoundingClientRect().height)||s.height;console.log("[Slaytester] recording at:",f,"x",S);let D;try{let i=document.createElement("canvas");i.width=f,i.height=S,i.style.position="fixed",i.style.left="-9999px",i.style.top="0",document.body.appendChild(i);let d=i.getContext("2d");d.imageSmoothingEnabled=!1,new ResizeObserver(()=>{let w=s.getBoundingClientRect(),M=Math.round(w.width)||s.width,T=Math.round(w.height)||s.height;(M!==f||T!==S)&&(console.log("[Slaytester] Canvas size changed:",f,"x",S,"\u2192",M,"x",T),f=M,S=T,i.width=f,i.height=S)}).observe(s),d.drawImage(s,0,0,f,S);let v=0;(function w(){d.drawImage(s,0,0,f,S),d.fillStyle=v%2===0?"#000":"#fff",d.fillRect(0,0,2,2),v++,requestAnimationFrame(w)})(),D=i.captureStream(y)}catch(i){console.error("[Slaytester] canvas.captureStream failed:",i);return}let k=D.getVideoTracks();console.log("[Slaytester] canvas video tracks:",k.length),k.length===0&&console.warn("[Slaytester] canvas has no video tracks"),console.log("[Slaytester] session ID:",a);let h;try{h=new AudioContext,console.log("[Slaytester] audioCtx state:",h.state),h.state==="suspended"&&(await h.resume(),console.log("[Slaytester] audioCtx resumed"))}catch(i){console.error("[Slaytester] failed to create AudioContext:",i);return}let b=h.createMediaStreamDestination();window.__slaytesterCaptureDest=b,console.log("[Slaytester] capture destination created");function W(){if(document.getElementById("st-rec-indicator"))return;if(!document.getElementById("st-rec-style")){let d=document.createElement("style");d.id="st-rec-style",d.textContent="@keyframes st-rec-pulse{0%,100%{opacity:1}50%{opacity:0.3}}",document.head.appendChild(d)}let i=document.createElement("div");i.id="st-rec-indicator",Object.assign(i.style,{position:"fixed",top:"12px",right:"12px",background:"rgba(0,0,0,0.65)",color:"#fff",fontFamily:"sans-serif",fontSize:"13px",padding:"6px 14px",borderRadius:"20px",zIndex:"999999",display:"flex",alignItems:"center",gap:"6px",pointerEvents:"none"}),i.innerHTML='<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#ff4444;animation:st-rec-pulse 1.5s infinite"></span> REC',document.body.appendChild(i)}let x=h.createGain();x.gain.value=1,x.connect(b);let E=h.createConstantSource();E.offset.value=0,E.connect(x),E.start();function z(i){try{let d=h.createMediaStreamSource(i),g=h.createGain();g.gain.value=.38,d.connect(g),g.connect(x),console.log("[Slaytester] bridged game audio to recorder")}catch(d){console.error("[Slaytester] failed to bridge game audio:",d)}}let G=B(b);if(G)z(G);else{let i=setInterval(()=>{let d=B(b);d&&(clearInterval(i),z(d))},1e3)}if(u){let i=u.getAudioTracks();console.log("[Slaytester] connecting mic:",i.length,"track(s)");let d=h.createMediaStreamSource(u),g=h.createDynamicsCompressor();g.threshold.value=-25,g.ratio.value=15,g.attack.value=.005,g.release.value=.15;let v=h.createGain();v.gain.value=1.3,d.connect(g),g.connect(v),v.connect(x)}else console.log("[Slaytester] no mic stream, recording without microphone");console.log("[Slaytester] capture dest audio tracks:",b.stream.getAudioTracks().length);let V=[...k,...b.stream.getAudioTracks()],O=new MediaStream(V);console.log("[Slaytester] combined stream tracks:",O.getTracks().length);let L=j(c,a,e,O);W(),addEventListener("beforeunload",()=>{L&&L.stop()})}})();})();
