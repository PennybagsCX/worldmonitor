import{aS as W,V as ie,aT as pe}from"./main-8a68VbSf.js";import{t as n,d as j}from"./panel-storage-COYkA8bZ.js";import{e as a,s as L,t as q}from"./dom-utils-B8MVJOEB.js";import{p as de}from"./panels-c93eK3j2.js";import{s as me}from"./gdelt-intel-B2bRPowK.js";import"./clerk-DnucG282.js";import"./embed-url-BEcsdCFo.js";import"./persistent-cache-DcwIBXtm.js";import"./widget-store-IAxu1TMg.js";import"./i18n-qlunRAMb.js";import"./debugbear-rum-CTwHbetR.js";import"./continuous-C6rOMA6Z.js";import"./string-iyfKsFnt.js";import"./panel-gating-CFklAQbM.js";import"./resilience-choropleth-utils-Ck1vfSH5.js";import"./user-location-N7cD7VOl.js";import"./data-freshness-ChOowvKb.js";import"./cached-risk-scores-D5bf9Gui.js";import"./cross-domain-storage-BkfZ6fhr.js";import"./layout-batch-IgoVuxa7.js";import"./checkout-DfUSNmIe.js";import"./theme-manager-BKoLo8p1.js";import"./font-settings-BRtdvVWs.js";const Y=pe/1e3;let f=null;function Z(p,t){const s=p.indexOf(":");if(s===-1)return{};const h=p.slice(0,s).trim(),b=p.slice(s+1).trim().replace("{key}",t.trim());return{[h]:b}}function Q(p,t){const s=t.indexOf(":");if(s===-1)return null;const h=t.slice(0,s).trim(),b=t.slice(s+1).trim(),i=p[h];if(!i)return null;const T=b.indexOf("{key}"),y=b.slice(0,T).trim();return y&&!i.startsWith(y)?null:i.slice(y?y.length+1:0).trim()||null}function X(p){const t=p.match(/\(([^)]+)\)\s*$/);return(t==null?void 0:t[1])??p}function _e(p){var V,G;B();const t=p.existingSpec;f=document.createElement("div"),f.className="modal-overlay active";const s=document.createElement("div");s.className="modal mcp-connect-modal";const h=W.map(e=>`
    <button class="mcp-preset-card" data-url="${a(e.serverUrl)}"
      data-tool="${a(e.defaultTool??"")}"
      data-args="${a(JSON.stringify(e.defaultArgs??{}))}"
      data-title="${a(e.defaultTitle??e.name)}"
      data-auth-note="${a(e.authNote??"")}"
      data-api-key-header="${a(e.apiKeyHeader??"")}">
      <span class="mcp-preset-icon">${e.icon}</span>
      <span class="mcp-preset-info">
        <span class="mcp-preset-name">${a(e.name)}</span>
        <span class="mcp-preset-desc">${a(e.description)}</span>
      </span>
      ${e.authNote?'<span class="mcp-preset-key-badge">🔑</span>':""}
    </button>
  `).join(""),b=(t==null?void 0:t.customHeaders)??{},i=t?W.find(e=>e.serverUrl===t.serverUrl&&e.apiKeyHeader):void 0,T=i!=null&&i.apiKeyHeader?Q(b,i.apiKeyHeader):null,y=!t||!!T,te=T??"",se=y?"":ee(b);L(s,q(`
    <div class="modal-header">
      <span class="modal-title">${a(n("mcp.modalTitle"))}</span>
      <button class="modal-close" aria-label="${a(n("common.close"))}">✕</button>
    </div>
    <div class="mcp-connect-body">
      ${t?"":`
      <div class="mcp-presets-section">
        <label class="mcp-label">${a(n("mcp.quickConnect"))}</label>
        <div class="mcp-presets-list">${h}</div>
      </div>
      <div class="mcp-section-divider"><span>${a(n("mcp.or"))}</span></div>
      `}
      <div class="mcp-form-group">
        <label class="mcp-label">${a(n("mcp.serverUrl"))}</label>
        <input class="mcp-input mcp-server-url" type="url"
          placeholder="https://my-mcp-server.com/mcp"
          value="${a((t==null?void 0:t.serverUrl)??"")}" />
      </div>
      <div class="mcp-form-group mcp-api-key-group" style="${y?"":"display:none"}">
        <label class="mcp-label">${a(n("mcp.apiKey"))}</label>
        <input class="mcp-input mcp-api-key" type="text" autocomplete="off"
          placeholder="${a(n("mcp.apiKeyPlaceholder"))}"
          value="${a(te)}" />
        <span class="mcp-api-key-hint"></span>
        <button type="button" class="mcp-auth-mode-btn mcp-to-advanced">${a(n("mcp.useCustomHeaders"))}</button>
      </div>
      <div class="mcp-form-group mcp-auth-header-group" style="${y?"display:none":""}">
        <label class="mcp-label">${a(n("mcp.authHeader"))} <span class="mcp-optional">(${n("mcp.optional")})</span></label>
        <input class="mcp-input mcp-auth-header" type="text"
          placeholder="Authorization: Bearer token123; x-api-key: key456"
          value="${a(se)}" />
        <button type="button" class="mcp-auth-mode-btn mcp-to-simple" style="display:none">${a(n("mcp.useApiKey"))}</button>
      </div>
      <div class="mcp-connect-actions">
        <button class="btn btn-secondary mcp-connect-btn">${a(n("mcp.connectBtn"))}</button>
        <span class="mcp-connect-status"></span>
      </div>
      <div class="mcp-tools-section" style="display:none">
        <label class="mcp-label">${a(n("mcp.selectTool"))}</label>
        <div class="mcp-tools-list"></div>
      </div>
      <div class="mcp-tool-config" style="display:none">
        <div class="mcp-form-group">
          <label class="mcp-label">${a(n("mcp.toolArgs"))}</label>
          <textarea class="mcp-input mcp-tool-args" rows="3" placeholder="{}"></textarea>
          <span class="mcp-args-error" style="display:none;color:var(--red)"></span>
        </div>
        <div class="mcp-form-group">
          <label class="mcp-label">${a(n("mcp.panelTitle"))}</label>
          <input class="mcp-input mcp-panel-title" type="text"
            placeholder="${a(n("mcp.panelTitlePlaceholder"))}"
            value="${a((t==null?void 0:t.title)??"")}" />
        </div>
        <div class="mcp-form-group mcp-refresh-group">
          <label class="mcp-label">${a(n("mcp.refreshEvery"))}</label>
          <input class="mcp-input mcp-refresh-input" type="number" min="${Y}" max="86400"
            value="${t?Math.round(t.refreshIntervalMs/1e3):Y}" />
          <span class="mcp-refresh-unit">${a(n("mcp.seconds"))}</span>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost mcp-cancel-btn">${a(n("common.cancel"))}</button>
      <button class="btn btn-primary mcp-add-btn" disabled>${a(n("mcp.addPanel"))}</button>
    </div>
  `,"legacy direct innerHTML migration")),f.appendChild(s),document.body.appendChild(f);let x=[],S=t?{name:t.toolName}:null;const F="Authorization: Bearer {key}";let u=(i==null?void 0:i.apiKeyHeader)??(y?F:"");const k=s.querySelector(".mcp-server-url"),$=s.querySelector(".mcp-api-key-group"),A=s.querySelector(".mcp-api-key"),E=s.querySelector(".mcp-api-key-hint"),ae=s.querySelector(".mcp-to-advanced"),H=s.querySelector(".mcp-auth-header-group"),M=s.querySelector(".mcp-auth-header"),g=s.querySelector(".mcp-to-simple"),O=s.querySelector(".mcp-connect-btn"),d=s.querySelector(".mcp-connect-status"),_=s.querySelector(".mcp-tools-section"),N=s.querySelector(".mcp-tools-list"),U=s.querySelector(".mcp-tool-config"),C=s.querySelector(".mcp-tool-args"),w=s.querySelector(".mcp-args-error"),K=s.querySelector(".mcp-panel-title"),ce=s.querySelector(".mcp-refresh-input"),I=s.querySelector(".mcp-add-btn");function le(){return $.style.display!=="none"}function D(){if(le()&&u){const e=A.value.trim();return e?Z(u,e):{}}return z(M.value)}function J(e){u=e.apiKeyHeader??"",$.style.display="",H.style.display="none",g.style.display="none",e.authNote?E.textContent=X(e.authNote):E.textContent=""}function ne(e=!0){e&&u&&A.value.trim()&&(M.value=ee(Z(u,A.value.trim()))),$.style.display="none",H.style.display="",u&&(g.style.display="")}ae.addEventListener("click",()=>ne(!0)),g.addEventListener("click",()=>{if(u){const e=z(M.value),c=Q(e,u);c&&(A.value=c)}$.style.display="",H.style.display="none",g.style.display="none"}),y&&(i!=null&&i.authNote)&&(E.textContent=X(i.authNote)),t||k.addEventListener("input",()=>{const e=k.value.trim(),c=Array.from(s.querySelectorAll(".mcp-preset-card")),l=c.find(o=>o.dataset.url===e);if(l){c.forEach(v=>v.classList.remove("selected")),l.classList.add("selected");const o=l.dataset.apiKeyHeader??"",r=l.dataset.authNote??"";o?J({apiKeyHeader:o,authNote:r}):(u="",$.style.display="none",E.textContent="",H.style.display="",g.style.display="none")}else c.forEach(o=>o.classList.remove("selected")),u=F,$.style.display="",E.textContent="",H.style.display="none",g.style.display="none"}),s.querySelectorAll(".mcp-preset-card").forEach(e=>{e.addEventListener("click",()=>{s.querySelectorAll(".mcp-preset-card").forEach(v=>v.classList.remove("selected")),e.classList.add("selected"),k.value=e.dataset.url??"";const c=e.dataset.apiKeyHeader??"",l=e.dataset.authNote??"";c?(J({apiKeyHeader:c,authNote:l}),A.value="",d.textContent="",d.className="mcp-connect-status"):(u="",$.style.display="none",H.style.display="",g.style.display="none",M.value="",l?(d.textContent=`🔑 ${l}`,d.className="mcp-connect-status mcp-status-info"):(d.textContent="",d.className="mcp-connect-status"));const o=e.dataset.tool,r=e.dataset.args,m=e.dataset.title;o&&(S={name:o,description:""},C.value=r||"{}",m&&(K.value=m),U.style.display="",I.disabled=!1,_.style.display="",L(N,q(`<div class="mcp-tool-item selected"><span class="mcp-tool-name">${a(o)}</span></div>`,"legacy direct innerHTML migration")))})}),t&&(C.value=Object.keys(t.toolArgs).length?JSON.stringify(t.toolArgs,null,2):"{}",U.style.display="",_.style.display="",L(N,q(`<div class="mcp-tool-item selected">${a(t.toolName)}</div>`,"legacy direct innerHTML migration")),I.disabled=!1);function z(e){const c=e.trim();if(!c)return{};const l={};for(const o of c.split(/;\s+(?=[A-Za-z0-9_-]+\s*:)/)){const r=o.indexOf(":");if(r===-1)continue;const m=o.slice(0,r).trim(),v=o.slice(r+1).trim();m&&(l[m]=v)}return l}function oe(e){L(N,q("","legacy direct innerHTML migration"));for(const c of e){const l=document.createElement("div");l.className="mcp-tool-item";const o=c.description?c.description.length>100?c.description.slice(0,97)+"…":c.description:"";L(l,q(`
        <span class="mcp-tool-name">${a(c.name)}</span>
        ${o?`<span class="mcp-tool-desc">${a(o)}</span>`:""}
      `,"legacy direct innerHTML migration")),l.addEventListener("click",()=>{N.querySelectorAll(".mcp-tool-item").forEach(m=>m.classList.remove("selected")),l.classList.add("selected"),S=c,K.value||(K.value=c.name);const r=c.inputSchema;if(r!=null&&r.properties){const m={};for(const[v,re]of Object.entries(r.properties)){const P=re;P.default!==void 0&&P.default!==null&&(m[v]=P.default)}C.value=Object.keys(m).length?JSON.stringify(m,null,2):"{}"}else C.value="{}";U.style.display="",I.disabled=!1}),N.appendChild(l)}}O.addEventListener("click",async()=>{const e=k.value.trim();if(e){j("mcp-connect-attempt"),d.textContent=n("mcp.connecting"),d.className="mcp-connect-status mcp-status-loading",O.disabled=!0;try{const c=D(),l=new URLSearchParams({serverUrl:e});Object.keys(c).length&&l.set("headers",JSON.stringify(c));const o=await me(`${de("/api/mcp-proxy")}?${l}`,{signal:AbortSignal.timeout(2e4)}),r=await o.json();if(!o.ok||r.error)throw new Error(r.error||`HTTP ${o.status}`);x=r.tools??[],d.textContent=n("mcp.foundTools",{count:String(x.length)}),d.className="mcp-connect-status mcp-status-ok",j("mcp-connect-success",{toolCount:x.length}),_.style.display="",oe(x)}catch(c){const l=c instanceof Error?c.message:String(c);d.textContent=`${n("mcp.connectFailed")}: ${l}`,d.className="mcp-connect-status mcp-status-error"}finally{O.disabled=!1}}}),I.addEventListener("click",()=>{if(!S)return;j("mcp-panel-add",{tool:S.name}),w.style.display="none";let e={};try{e=JSON.parse(C.value||"{}")}catch{w.textContent=n("mcp.invalidJson"),w.style.display="";return}const l={id:(t==null?void 0:t.id)??`mcp-${crypto.randomUUID()}`,title:K.value.trim()||S.name,serverUrl:k.value.trim(),customHeaders:D(),toolName:S.name,toolArgs:e,refreshIntervalMs:ie(parseInt(ce.value,10)*1e3),createdAt:(t==null?void 0:t.createdAt)??Date.now(),updatedAt:Date.now()};B(),p.onComplete(l)});const R=()=>B();(V=s.querySelector(".modal-close"))==null||V.addEventListener("click",R),(G=s.querySelector(".mcp-cancel-btn"))==null||G.addEventListener("click",R),f.addEventListener("click",e=>{e.target===f&&R()})}function ee(p){const t=Object.entries(p);return t.length?t.map(([s,h])=>`${s}: ${h}`).join("; "):""}function B(){f==null||f.remove(),f=null}export{B as closeMcpConnectModal,_e as openMcpConnectModal};
