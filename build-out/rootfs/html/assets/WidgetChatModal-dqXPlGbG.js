import{h as ve,j as ye,k as Ce}from"./widget-store-IAxu1TMg.js";import{g as Ee}from"./clerk-DnucG282.js";import{d as J,t as e,h as Q}from"./panel-storage-COYkA8bZ.js";import{e as u,s as U,t as N}from"./dom-utils-B8MVJOEB.js";import{Y as be,w as ke}from"./panels-c93eK3j2.js";import{wrapProWidgetHtml as Te,wrapWidgetHtml as He}from"./widget-sanitizer-CMAgMQgV.js";import{b as Se,a as xe}from"./premium-denial-BPCYST5U.js";import{r as oe}from"./panel-gating-CFklAQbM.js";import"./i18n-qlunRAMb.js";import"./persistent-cache-DcwIBXtm.js";import"./purify.es-bRchjNq8.js";const $e=["widgets.examples.oilGold","widgets.examples.cryptoMovers","widgets.examples.flightDelays","widgets.examples.conflictHotspots"],Pe=["widgets.proExamples.interactiveChart","widgets.proExamples.sortableTable","widgets.proExamples.animatedCounters","widgets.proExamples.tabbedComparison"];let m=null,k=null,$=null;function ce(t,s,i,r,n){var P;if(i||(((P=Q().user)==null?void 0:P.id)??null)!==n)return;Se({status:t,errorCode:(s==null?void 0:s.error)??null,belief:r})==="entitlement_desync"&&xe("widget-chat")}async function de(t){const s=ve(),i=ye(),r=Ce();if(s||i||r){const d={};return s&&(d["X-WorldMonitor-Key"]=s),{headers:d,usedTesterKey:!0}}const n=await Ee();return n?{headers:{Authorization:`Bearer ${n}`},usedTesterKey:!1}:{headers:{},usedTesterKey:!1}}function Xe(t){var ee,te,se,ie;W(),J("widget-ai-open",{panelId:(ee=t.existingSpec)==null?void 0:ee.id});const s=t.tier??((te=t.existingSpec)==null?void 0:te.tier)??"basic",i=s==="pro";m=document.createElement("div"),m.className="modal-overlay active";const r=document.createElement("div");r.className="modal widget-chat-modal";const n=t.mode==="modify",d=n?e("widgets.modifyTitle"):e("widgets.chatTitle"),P=i?`<span class="widget-pro-badge">${u(e("widgets.proBadge"))}</span>`:"";U(r,N(`
    <div class="modal-header">
      <span class="modal-title">${u(d)}${P}</span>
      <button class="modal-close" aria-label="${u(e("common.close"))}">✕</button>
    </div>
    <div class="widget-chat-layout">
      <section class="widget-chat-sidebar">
        <div class="widget-chat-readiness"></div>
        <div class="widget-chat-messages"></div>
        <div class="widget-chat-examples">
          <div class="widget-chat-examples-label">${e("widgets.examplesTitle")}</div>
          <div class="widget-chat-examples-list"></div>
        </div>
        <div class="widget-chat-input-row">
          <textarea class="widget-chat-input" placeholder="${e("widgets.inputPlaceholder")}" rows="3"></textarea>
          <button class="widget-chat-send">${e("widgets.send")}</button>
        </div>
      </section>
      <section class="widget-chat-main">
        <div class="widget-chat-preview"></div>
      </section>
    </div>
    <div class="widget-chat-footer">
      <div class="widget-chat-footer-status"></div>
      <button class="widget-chat-action-btn" disabled>${n?e("widgets.applyChanges"):e("widgets.addToDashboard")}</button>
    </div>
  `,"legacy direct innerHTML migration")),m.appendChild(r),document.body.appendChild(m);const T=r.querySelector(".widget-chat-messages"),l=r.querySelector(".widget-chat-preview"),K=r.querySelector(".widget-chat-readiness"),le=r.querySelector(".widget-chat-examples-list"),g=r.querySelector(".widget-chat-footer-status"),q=r.querySelector(".widget-chat-input"),O=r.querySelector(".widget-chat-send"),Y=r.querySelector(".widget-chat-action-btn"),ge=r.querySelector(".modal-close"),H=[...((se=t.existingSpec)==null?void 0:se.conversationHistory)??[]];let f=((ie=t.existingSpec)==null?void 0:ie.html)??null,M=!1,_=!1,A=null;if(t.initialMessage&&(q.value=t.initialMessage),n&&t.existingSpec){for(const a of H)B(T,a.role,a.content);f&&z(l,f,t.existingSpec.title,e("widgets.phaseReadyToPrompt"),e("widgets.modifyHint"),i),T.scrollTop=T.scrollHeight,p(g,e("widgets.modifyHint"))}else h(l,"checking"),p(g,e("widgets.checkingConnection"));qe(le,q,i),v(),pe(),ge.addEventListener("click",W),m.addEventListener("click",a=>{a.target===m&&W()});const V=a=>{a.key==="Escape"&&W()};document.addEventListener("keydown",V),Y.addEventListener("click",()=>{A&&(t.onComplete(A),W())});async function pe(){var a;D(K,"checking",e("widgets.checkingConnection"));try{const o=await de(i),I=Q(),re=((a=I.user)==null?void 0:a.id)??null,F=oe(I),c=await fetch(be(),{headers:o.headers});let w=null;try{w=await c.json()}catch{}if(!c.ok){const y=Me(c.status,w,i,o.usedTesterKey,F,re);_=!1,D(K,"error",y),p(g,y,"error"),f||h(l,"error",y),v();return}if(i&&(w==null?void 0:w.proKeyConfigured)===!1){const y=e("widgets.preflightProUnavailable");_=!1,D(K,"error",y),p(g,y,"error"),f||h(l,"error",y),v();return}_=!0,D(K,"ready",e("widgets.preflightConnected")),f||h(l,"ready_to_prompt"),p(g,f?e("widgets.modifyHint"):e("widgets.readyToGenerate")),v()}catch{_=!1;const o=e("widgets.preflightUnavailable");D(K,"error",o),p(g,o,"error"),f||h(l,"error",o),v()}}function v(){O.disabled=M||!_,O.textContent=M?e("widgets.generating"):e("widgets.send"),Y.disabled=!A}const Z=async()=>{var F;const a=q.value.trim();if(!a||O.disabled)return;J("widget-ai-generate"),q.value="",M=!0,A=null,v(),B(T,"user",a),h(l,"fetching"),p(g,e("widgets.generating"));const o=t.existingSpec,I=JSON.stringify({prompt:a.slice(0,2e3),mode:t.mode,tier:s,currentHtml:f,conversationHistory:H.map(c=>({role:c.role,content:c.content.slice(0,500)}))});k=new AbortController,$=setTimeout(()=>{k==null||k.abort(),B(T,"assistant",e("widgets.requestTimedOut")),h(l,"error",e("widgets.requestTimedOut")),p(g,e("widgets.requestTimedOut"),"error"),M=!1,v()},i?12e4:6e4);try{const c=await de(i),w=Q(),y=((F=w.user)==null?void 0:F.id)??null,we=oe(w),ue={"Content-Type":"application/json",...c.headers},S=await fetch(ke(),{method:"POST",signal:k.signal,headers:ue,body:I});if(!S.ok){let X=null;try{X=await S.json()}catch{}throw ce(S.status,X,c.usedTesterKey,we,y),new Error(e("widgets.serverError",{status:S.status}))}if(!S.body)throw new Error(e("widgets.serverError",{status:S.status}));let L="",b=(o==null?void 0:o.title)??"Custom Widget",x=null;const j=B(T,"assistant",""),R=document.createElement("span");R.className="widget-chat-radar",U(R,N('<span class="panel-loading-radar"><span class="panel-radar-sweep"></span><span class="panel-radar-dot"></span></span>',"legacy direct innerHTML migration")),j.appendChild(R);const me=S.body.getReader(),he=new TextDecoder;let G="";for(;;){const{done:X,value:fe}=await me.read();if(X)break;G+=he.decode(fe,{stream:!0});const ae=G.split(`
`);G=ae.pop()??"";for(const ne of ae){if(!ne.startsWith("data: "))continue;let C;try{C=JSON.parse(ne.slice(6))}catch{continue}if(C.type==="tool_call"){x||(x=document.createElement("span"),x.className="widget-chat-tool-badge",j.appendChild(x));const E=String(C.endpoint??"data");x.textContent=e("widgets.fetching",{target:E}),h(l,"fetching",E),p(g,e("widgets.fetching",{target:E}))}else if(C.type==="html_complete")L=String(C.html??""),f=L,z(l,L,b,e("widgets.phaseComposing"),e("widgets.previewComposingCopy"),i),p(g,e("widgets.previewComposingCopy"));else if(C.type==="done"){b=String(C.title??"Custom Widget"),R.remove(),J("widget-ai-success",{title:b});const E=e("widgets.generatedWidget",{title:b});H.push({role:"user",content:a},{role:"assistant",content:E}),H.length>10&&H.splice(0,H.length-10),A={id:(o==null?void 0:o.id)??`cw-${crypto.randomUUID()}`,title:b,html:L,prompt:a,tier:s,accentColor:(o==null?void 0:o.accentColor)??null,conversationHistory:[...H],createdAt:(o==null?void 0:o.createdAt)??Date.now(),updatedAt:Date.now()},j.textContent=e("widgets.ready",{title:b}),x&&x.remove(),z(l,L,b,e("widgets.phaseComplete"),e("widgets.previewReadyCopy"),i),p(g,e("widgets.readyToApply",{title:b})),Y.textContent=n?e("widgets.applyChanges"):e("widgets.addToDashboard"),M=!1,v()}else if(C.type==="error"){const E=String(C.message??e("widgets.unknownError"));R.remove(),j.textContent=`${e("common.error")}: ${E}`,h(l,"error",E),p(g,E,"error")}}}}catch(c){if(c instanceof DOMException&&c.name==="AbortError")return;const w=c instanceof Error?c.message:e("widgets.unknownError");B(T,"assistant",`${e("common.error")}: ${w}`),h(l,"error",w),p(g,w,"error")}finally{$&&(clearTimeout($),$=null),M=!1,v()}};O.addEventListener("click",()=>void Z()),q.addEventListener("keydown",a=>{a.key==="Enter"&&(a.ctrlKey||a.metaKey)&&(a.preventDefault(),Z())}),m._escHandler=V,q.focus()}function W(){if(k&&(k.abort(),k=null),$&&(clearTimeout($),$=null),m){const t=m;t._escHandler&&document.removeEventListener("keydown",t._escHandler),m.remove(),m=null}}function qe(t,s,i){U(t,N("","legacy direct innerHTML migration"));const r=i?Pe:$e;for(const n of r){const d=document.createElement("button");d.type="button",d.className="widget-chat-example-chip",d.textContent=e(n),d.addEventListener("click",()=>{s.value=e(n),s.focus()}),t.appendChild(d)}}function Me(t,s,i,r,n,d){return t===403?r?i?e("widgets.preflightInvalidProKey"):e("widgets.preflightInvalidKey"):(ce(t,s,r,n,d),i?e("widgets.preflightProSubscriptionRequired"):e("widgets.preflightProRequired")):t===503&&(s==null?void 0:s.proKeyConfigured)===!1?e("widgets.preflightProUnavailable"):(s==null?void 0:s.anthropicConfigured)===!1?e("widgets.preflightAiUnavailable"):e("widgets.preflightUnavailable")}function D(t,s,i){t.className=`widget-chat-readiness is-${s}`,t.textContent=i}function p(t,s,i="muted"){t.className=`widget-chat-footer-status is-${i}`,t.textContent=s}function h(t,s,i=""){const r=_e(s),n=i||Ae(s),d=s==="error";U(t,N(`
    <div class="widget-chat-preview-state is-${s}">
      <div class="widget-chat-preview-head">
        <div>
          <div class="widget-chat-preview-kicker">${u(e("widgets.previewTitle"))}</div>
          <div class="widget-chat-preview-heading">${u(r)}</div>
        </div>
        <span class="widget-chat-phase-badge">${u(Ke(s))}</span>
      </div>
      <p class="widget-chat-preview-copy">${u(n)}</p>
      ${d?`
        <div class="widget-chat-preview-alert">${u(i||e("widgets.previewErrorCopy"))}</div>
      `:`
        <div class="widget-chat-preview-skeleton" aria-hidden="true">
          <span class="widget-chat-skeleton-line is-title"></span>
          <span class="widget-chat-skeleton-line"></span>
          <span class="widget-chat-skeleton-line is-short"></span>
          <div class="widget-chat-skeleton-grid">
            <span class="widget-chat-skeleton-card"></span>
            <span class="widget-chat-skeleton-card"></span>
            <span class="widget-chat-skeleton-card"></span>
          </div>
        </div>
      `}
    </div>
  `,"legacy direct innerHTML migration"))}function z(t,s,i,r,n="",d=!1){const P=d?Te(s):He(s,"wm-widget-shell-preview");U(t,N(`
    <div class="widget-chat-preview-frame">
      <div class="widget-chat-preview-head">
        <div>
          <div class="widget-chat-preview-kicker">${u(e("widgets.previewTitle"))}</div>
          <div class="widget-chat-preview-heading">${u(i)}</div>
        </div>
        <span class="widget-chat-phase-badge">${u(r)}</span>
      </div>
      ${n?`<p class="widget-chat-preview-copy">${u(n)}</p>`:""}
      <div class="widget-chat-preview-render">
        ${P}
      </div>
    </div>
  `,"legacy direct innerHTML migration"))}function Ke(t){switch(t){case"checking":return e("widgets.phaseChecking");case"ready_to_prompt":return e("widgets.phaseReadyToPrompt");case"fetching":return e("widgets.phaseFetching");case"composing":return e("widgets.phaseComposing");case"complete":return e("widgets.phaseComplete");case"error":return e("widgets.phaseError")}}function _e(t){switch(t){case"checking":return e("widgets.previewCheckingHeading");case"ready_to_prompt":return e("widgets.previewReadyHeading");case"fetching":return e("widgets.previewFetchingHeading");case"composing":return e("widgets.previewComposingHeading");case"complete":return e("widgets.previewReadyHeading");case"error":return e("widgets.previewErrorHeading")}}function Ae(t){switch(t){case"checking":return e("widgets.previewCheckingCopy");case"ready_to_prompt":return e("widgets.previewReadyCopy");case"fetching":return e("widgets.previewFetchingCopy");case"composing":return e("widgets.previewComposingCopy");case"complete":return e("widgets.previewReadyCopy");case"error":return e("widgets.previewErrorCopy")}}function B(t,s,i){const r=document.createElement("div");return r.className=`widget-chat-msg ${s}`,r.textContent=i,t.appendChild(r),t.scrollTop=t.scrollHeight,r}export{W as closeWidgetChatModal,Xe as openWidgetChatModal};
