const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/trending-keywords-BSlcCiPO.js","assets/main-8a68VbSf.js","assets/clerk-DnucG282.js","assets/embed-url-BEcsdCFo.js","assets/panel-storage-COYkA8bZ.js","assets/i18n-qlunRAMb.js","assets/persistent-cache-DcwIBXtm.js","assets/widget-store-IAxu1TMg.js","assets/debugbear-rum-CTwHbetR.js","assets/continuous-C6rOMA6Z.js","assets/string-iyfKsFnt.js","assets/panel-gating-CFklAQbM.js","assets/resilience-choropleth-utils-Ck1vfSH5.js","assets/user-location-N7cD7VOl.js","assets/panels-c93eK3j2.js","assets/data-freshness-ChOowvKb.js","assets/gdelt-intel-B2bRPowK.js","assets/cached-risk-scores-D5bf9Gui.js","assets/dom-utils-B8MVJOEB.js","assets/cross-domain-storage-BkfZ6fhr.js","assets/layout-batch-IgoVuxa7.js","assets/checkout-DfUSNmIe.js","assets/theme-manager-BKoLo8p1.js","assets/font-settings-BRtdvVWs.js","assets/keyword-spike-core-LMTDbJ5S.js","assets/embed-url-B23MHeXh.css"])))=>i.map(i=>d[i]);
var y=Object.defineProperty;var f=(p,s,o)=>s in p?y(p,s,{enumerable:!0,configurable:!0,writable:!0,value:o}):p[s]=o;var m=(p,s,o)=>f(p,typeof s!="symbol"?s+"":s,o);import{_ as b}from"./clerk-DnucG282.js";import{s as $,t as h,e as a,a as k}from"./dom-utils-B8MVJOEB.js";import{t,f as u}from"./panel-storage-COYkA8bZ.js";import{G as C}from"./cached-risk-scores-D5bf9Gui.js";import"./i18n-qlunRAMb.js";import"./gdelt-intel-B2bRPowK.js";import"./embed-url-BEcsdCFo.js";import"./persistent-cache-DcwIBXtm.js";import"./widget-store-IAxu1TMg.js";import"./debugbear-rum-CTwHbetR.js";import"./data-freshness-ChOowvKb.js";import"./panel-gating-CFklAQbM.js";const x=12;function S(p){b(()=>import("./trending-keywords-BSlcCiPO.js"),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25])).then(s=>s.suppressTrendingTerm(p)).catch(s=>{console.warn("[SignalModal] suppressTrendingTerm failed (chunk load?):",s)})}class H{constructor(){m(this,"element");m(this,"currentSignals",[]);m(this,"audioEnabled",!0);m(this,"audio",null);m(this,"onLocationClick");m(this,"escHandler",s=>{s.key==="Escape"&&this.hide()});this.element=document.createElement("div"),this.element.className="signal-modal-overlay",this.element.setAttribute("role","dialog"),this.element.setAttribute("aria-modal","true"),$(this.element,h(`
      <div class="signal-modal">
        <div class="signal-modal-header">
          <span class="signal-modal-title">🎯 ${t("modals.signal.title")}</span>
          <button class="signal-modal-close" aria-label="Close">×</button>
        </div>
        <div class="signal-modal-content"></div>
        <div class="signal-modal-footer">
          <label class="signal-audio-toggle">
            <input type="checkbox" checked>
            <span>${t("modals.signal.soundAlerts")}</span>
          </label>
          <button class="signal-dismiss-btn">${t("modals.signal.dismiss")}</button>
        </div>
      </div>
    `,"legacy direct innerHTML migration")),document.body.appendChild(this.element),this.setupEventListeners(),this.initAudio();const s=this.element.querySelector(".signal-modal");s==null||s.addEventListener("animationend",()=>{s.style.willChange="auto"},{once:!0})}initAudio(){this.audio=new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQYjfKapmWswEjCJvuPQfSoXZZ+3qqBJESSP0unGaxMJVYiytrFeLhR6p8znrFUXRW+bs7V3Qx1hn8Xjp1cYPnegprhkMCFmoLi1k0sZTYGlqqlUIA=="),this.audio.volume=.3}setupEventListeners(){var o,d;(o=this.element.querySelector(".signal-modal-close"))==null||o.addEventListener("click",()=>{this.hide()}),(d=this.element.querySelector(".signal-dismiss-btn"))==null||d.addEventListener("click",()=>{this.hide()}),this.element.addEventListener("click",i=>{i.target.classList.contains("signal-modal-overlay")&&this.hide()});const s=this.element.querySelector('input[type="checkbox"]');s==null||s.addEventListener("change",()=>{this.audioEnabled=s.checked}),this.element.addEventListener("click",i=>{const r=i.target;if(r.classList.contains("location-link")){const n=parseFloat(r.dataset.lat||"0"),c=parseFloat(r.dataset.lon||"0");this.onLocationClick&&!Number.isNaN(n)&&!Number.isNaN(c)&&(this.onLocationClick(n,c),this.hide());return}if(r.classList.contains("suppress-keyword-btn")){const n=(r.dataset.term||"").trim();if(!n)return;S(n),this.currentSignals=this.currentSignals.filter(c=>{const e=c.data.term;return typeof e!="string"||e.toLowerCase()!==n.toLowerCase()}),this.renderSignals()}})}setLocationClickHandler(s){this.onLocationClick=s}activateEsc(){document.addEventListener("keydown",this.escHandler)}show(s){s.length!==0&&(document.fullscreenElement||(this.currentSignals=[...s,...this.currentSignals].slice(0,50),this.renderSignals(),this.element.classList.add("active"),this.activateEsc(),this.playSound()))}showSignal(s){this.currentSignals=[s],this.renderSignals(),this.element.classList.add("active"),this.activateEsc()}showAlert(s){if(document.fullscreenElement)return;const o=this.element.querySelector(".signal-modal-content"),d={critical:u("--semantic-critical"),high:u("--semantic-high"),medium:u("--semantic-low"),low:u("--text-dim")},r={cii_spike:"📊",convergence:"🌍",cascade:"⚡",sanctions:"🚫",radiation:"☢️",composite:"🔗"}[s.type]||"⚠️",n=d[s.priority]||"#ff9944";let c="";if(s.components.ciiChange){const e=s.components.ciiChange,l=e.change>0?"+":"";c+=`
        <div class="signal-context-item">
          <span class="context-label">${t("modals.signal.country")}</span>
          <span class="context-value">${a(e.countryName)}</span>
        </div>
        <div class="signal-context-item">
          <span class="context-label">${t("modals.signal.scoreChange")}</span>
          <span class="context-value">${e.previousScore} → ${e.currentScore} (${l}${e.change})</span>
        </div>
        <div class="signal-context-item">
          <span class="context-label">${t("modals.signal.instabilityLevel")}</span>
          <span class="context-value" style="text-transform: uppercase; color: ${n}">${e.level}</span>
        </div>
        <div class="signal-context-item">
          <span class="context-label">${t("modals.signal.primaryDriver")}</span>
          <span class="context-value">${a(e.driver)}</span>
        </div>
      `}if(s.components.convergence){const e=s.components.convergence;c+=`
        <div class="signal-context-item">
          <span class="context-label">${t("modals.signal.location")}</span>
          <button class="location-link" data-lat="${e.lat}" data-lon="${e.lon}">${e.lat.toFixed(2)}°, ${e.lon.toFixed(2)}° ↗</button>
        </div>
        <div class="signal-context-item">
          <span class="context-label">${t("modals.signal.eventTypes")}</span>
          <span class="context-value">${e.types.join(", ")}</span>
        </div>
        <div class="signal-context-item">
          <span class="context-label">${t("modals.signal.eventCount")}</span>
          <span class="context-value">${t("modals.signal.eventCountValue",{count:e.totalEvents})}</span>
        </div>
      `}if(s.components.cascade){const e=s.components.cascade;c+=`
        <div class="signal-context-item">
          <span class="context-label">${t("modals.signal.source")}</span>
          <span class="context-value">${a(e.sourceName)} (${a(e.sourceType)})</span>
        </div>
        <div class="signal-context-item">
          <span class="context-label">${t("modals.signal.countriesAffected")}</span>
          <span class="context-value">${e.countriesAffected}</span>
        </div>
        <div class="signal-context-item">
          <span class="context-label">${t("modals.signal.impactLevel")}</span>
          <span class="context-value">${a(e.highestImpact)}</span>
        </div>
      `}if(s.components.sanctions){const e=s.components.sanctions;c+=`
        <div class="signal-context-item">
          <span class="context-label">Country</span>
          <span class="context-value">${a(e.countryName)} (${a(e.countryCode)})</span>
        </div>
        <div class="signal-context-item">
          <span class="context-label">Pressure</span>
          <span class="context-value">${e.entryCount} designations${e.newEntryCount>0?` · +${e.newEntryCount} new`:""}</span>
        </div>
        <div class="signal-context-item">
          <span class="context-label">Top program</span>
          <span class="context-value">${a(e.topProgram)} (${e.topProgramCount})</span>
        </div>
        <div class="signal-context-item">
          <span class="context-label">Vessels / aircraft</span>
          <span class="context-value">${e.vesselCount} / ${e.aircraftCount}</span>
        </div>
        <div class="signal-context-item">
          <span class="context-label">Dataset size</span>
          <span class="context-value">${e.totalCount}${e.datasetDate?` · ${new Date(e.datasetDate).toISOString().slice(0,10)}`:""}</span>
        </div>
      `}if(s.components.radiation){const e=s.components.radiation;c+=`
        <div class="signal-context-item">
          <span class="context-label">Station</span>
          <span class="context-value">${a(e.siteName)}</span>
        </div>
        <div class="signal-context-item">
          <span class="context-label">Reading</span>
          <span class="context-value">${e.value.toFixed(1)} ${a(e.unit)}</span>
        </div>
        <div class="signal-context-item">
          <span class="context-label">Baseline</span>
          <span class="context-value">${e.baselineValue.toFixed(1)} ${a(e.unit)}</span>
        </div>
        <div class="signal-context-item">
          <span class="context-label">Delta / z-score</span>
          <span class="context-value">+${e.delta.toFixed(1)} / ${e.zScore.toFixed(2)}</span>
        </div>
        <div class="signal-context-item">
          <span class="context-label">Confidence</span>
          <span class="context-value">${a(e.confidence)}${e.corroborated?" · confirmed":""}${e.conflictingSources?" · conflicting":""}</span>
        </div>
        <div class="signal-context-item">
          <span class="context-label">Sources</span>
          <span class="context-value">${a(e.contributingSources.join(" + "))} (${e.sourceCount})</span>
        </div>
        <div class="signal-context-item">
          <span class="context-label">Anomalies in batch</span>
          <span class="context-value">${e.anomalyCount} total (${e.spikeCount} spike, ${e.elevatedCount} elevated, ${e.corroboratedCount} confirmed)</span>
        </div>
      `}$(o,h(`
      <div class="signal-item" style="border-left-color: ${n}">
        <div class="signal-type">${r} ${s.type.toUpperCase().replace("_"," ")}</div>
        <div class="signal-title">${a(s.title)}</div>
        <div class="signal-description">${a(s.summary)}</div>
        <div class="signal-meta">
          <span class="signal-confidence" style="background: ${n}22; color: ${n}">${s.priority.toUpperCase()}</span>
          <span class="signal-time">${this.formatTime(s.timestamp)}</span>
        </div>
        <div class="signal-context">
          ${c}
        </div>
        ${s.countries.length>0?`
          <div class="signal-topics">
            ${s.countries.map(e=>`<span class="signal-topic">${a(e)}</span>`).join("")}
          </div>
        `:""}
      </div>
    `,"legacy direct innerHTML migration")),this.element.classList.add("active"),this.activateEsc()}playSound(){var s;this.audioEnabled&&this.audio&&(this.audio.currentTime=0,(s=this.audio.play())==null||s.catch(()=>{}))}hide(){this.element.classList.remove("active"),document.removeEventListener("keydown",this.escHandler)}renderSignals(){const s=this.element.querySelector(".signal-modal-content"),o={prediction_leads_news:`🔮 ${t("modals.signal.predictionLeading")}`,news_leads_markets:`📰 ${t("modals.signal.newsLeading")}`,silent_divergence:`🔇 ${t("modals.signal.silentDivergence")}`,velocity_spike:`🔥 ${t("modals.signal.velocitySpike")}`,keyword_spike:`📊 ${t("modals.signal.keywordSpike")}`,convergence:`◉ ${t("modals.signal.convergence")}`,triangulation:`△ ${t("modals.signal.triangulation")}`,flow_drop:`🛢️ ${t("modals.signal.flowDrop")}`,flow_price_divergence:`📈 ${t("modals.signal.flowPriceDivergence")}`,geo_convergence:`🌐 ${t("modals.signal.geoConvergence")}`,explained_market_move:`✓ ${t("modals.signal.marketMove")}`,sector_cascade:`📊 ${t("modals.signal.sectorCascade")}`,military_surge:`🛩️ ${t("modals.signal.militarySurge")}`},d=this.currentSignals.map(i=>{var g;const r=C(i.type),n=i.data,c=n==null?void 0:n.newsCorrelation,e=n==null?void 0:n.focalPointContext,l={lat:n==null?void 0:n.lat,lon:n==null?void 0:n.lon,regionName:n==null?void 0:n.regionName};return`
        <div class="signal-item ${a(i.type)}">
          <div class="signal-type">${o[i.type]||a(i.type)}</div>
          <div class="signal-title">${a(i.title)}</div>
          <div class="signal-description">${a(i.description)}</div>
          <div class="signal-meta">
            <span class="signal-confidence">${t("modals.signal.confidence")}: ${Math.round(i.confidence*100)}%</span>
            <span class="signal-time">${this.formatTime(i.timestamp)}</span>
          </div>
          ${i.data.explanation?`
            <div class="signal-explanation">${a(i.data.explanation)}</div>
          `:""}
          ${e&&e.length>0?`
            <div class="signal-focal-points">
              <div class="focal-points-header">📡 ${t("modals.signal.focalPoints")}</div>
              ${e.map(v=>`<div class="focal-point-item">${a(v)}</div>`).join("")}
            </div>
          `:""}
          ${c?`
            <div class="signal-news-correlation">
              <div class="news-correlation-header">📰 ${t("modals.signal.newsCorrelation")}</div>
              <pre class="news-correlation-text">${a(c)}</pre>
            </div>
          `:""}
          ${l.lat&&l.lon?`
            <div class="signal-location">
              <button class="location-link" data-lat="${l.lat}" data-lon="${l.lon}">
                📍 ${t("modals.signal.viewOnMap")}: ${l.regionName?a(l.regionName):`${l.lat.toFixed(2)}°, ${l.lon.toFixed(2)}°`}
              </button>
            </div>
          `:""}
          <div class="signal-context">
            <div class="signal-context-item why-matters">
              <span class="context-label">${t("modals.signal.whyItMatters")}</span>
              <span class="context-value">${a(r.whyItMatters)}</span>
            </div>
            <div class="signal-context-item actionable">
              <span class="context-label">${t("modals.signal.action")}</span>
              <span class="context-value">${a(r.actionableInsight)}</span>
            </div>
            <div class="signal-context-item confidence-note">
              <span class="context-label">${t("modals.signal.note")}</span>
              <span class="context-value">${a(r.confidenceNote)}</span>
            </div>
          </div>
          ${(g=i.data.relatedTopics)!=null&&g.length?`
            <div class="signal-topics">
              ${i.data.relatedTopics.map(v=>`<span class="signal-topic">${a(v)}</span>`).join("")}
            </div>
          `:""}
          ${this.renderSpikeEvidence(i)}
          ${i.type==="keyword_spike"&&typeof(n==null?void 0:n.term)=="string"?`
            <div class="signal-actions">
              <button class="suppress-keyword-btn" data-term="${a(n.term)}">${t("modals.signal.suppress")}</button>
            </div>
          `:""}
        </div>
      `}).join("");$(s,h(d,"legacy direct innerHTML migration"))}renderSpikeEvidence(s){if(s.type!=="keyword_spike")return"";const o=s.data,d=Array.isArray(o.sourceNames)?o.sourceNames.filter(l=>typeof l=="string"&&l.trim().length>0):[],i=Array.isArray(o.articles)?o.articles.filter(l=>!!l&&typeof l.title=="string"&&l.title.length>0):[];if(d.length===0&&i.length===0)return"";const r=d.slice(0,x),n=d.length-r.length,c=d.length?`
      <div class="signal-sources">
        <span class="signal-sources-label">${t("header.sources")}</span>
        ${r.map(l=>`<span class="signal-source-chip">${a(l)}</span>`).join("")}
        ${n>0?`<span class="signal-source-chip signal-source-chip-more">+${n}</span>`:""}
      </div>
    `:"",e=i.length?`
      <div class="signal-articles">
        <div class="signal-articles-header">📰 ${t("popups.relatedHeadlines")}</div>
        ${i.slice(0,x).map(l=>{const g=typeof l.link=="string"?k(l.link):"",v=a(l.title);return`
            <div class="signal-article-item">
              <span class="news-source">${a(l.source??"")}</span>
              ${g?`<a class="news-title" href="${g}" target="_blank" rel="noopener noreferrer">${v}</a>`:`<span class="news-title">${v}</span>`}
            </div>
          `}).join("")}
      </div>
    `:"";return`${c}${e}`}formatTime(s){return s.toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"})}getElement(){return this.element}}export{H as SignalModal};
