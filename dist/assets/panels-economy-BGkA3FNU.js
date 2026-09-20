const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/embed-url-BEcsdCFo.js","assets/panel-storage-COYkA8bZ.js","assets/clerk-DnucG282.js","assets/i18n-qlunRAMb.js","assets/persistent-cache-DcwIBXtm.js","assets/widget-store-IAxu1TMg.js","assets/debugbear-rum-CTwHbetR.js","assets/embed-url-B23MHeXh.css"])))=>i.map(i=>d[i]);
var ue=Object.defineProperty;var he=(a,u,t)=>u in a?ue(a,u,{enumerable:!0,configurable:!0,writable:!0,value:t}):a[u]=t;var b=(a,u,t)=>he(a,typeof u!="symbol"?u+"":u,t);import{P as A}from"./Panel-076IrmoK.js";import{BLS_METRO_IDS as Mt,getNationalDebtData as me,getEurostatCountryData as ve}from"./index-Cvwvt7HI.js";import{t as i,i as Q,q as J,f as lt,s as fe,l as Lt,h as It}from"./panel-storage-COYkA8bZ.js";import{u as T,e as n,a as te,s as B,t as N}from"./dom-utils-B8MVJOEB.js";import{Z as Ft,_ as ge,$ as be}from"./main-8a68VbSf.js";import{s as it,m as ye}from"./sparkline-EyuwviXB.js";import{D as ee,f as $e,a as we,b as Ce,c as Se,d as xe,e as Te,M as De,S as Pe,g as ke}from"./index-CX2lVN6A.js";import{p as _t,u as Ee,C as dt,v as Re,t as Ae}from"./gdelt-intel-B2bRPowK.js";import{S as Bt,r as Me,g as Le}from"./index-DyVf6A3C.js";import{T as Ie}from"./transit-chart-C9EcLIrs.js";import{h as pt}from"./panel-gating-CFklAQbM.js";import{g as Fe,r as _e}from"./china-activity-nowcast-view-BBrIi7h_.js";import{G as tt}from"./gulf-fdi-Brj4tDHY.js";import{t as Nt,n as Be,b as Ne,p as Oe}from"./widget-store-IAxu1TMg.js";import{g as O,c as rt,M as Ue,a as ot,E as kt,r as Et}from"./embed-url-BEcsdCFo.js";import{_ as V}from"./clerk-DnucG282.js";import{n as Ge,h as ut,i as He,c as je}from"./macro-tiles-china-DelTDcOg.js";import{C as ze}from"./ciss-staleness-BF7WkacN.js";function se(a){return a<20?"#27ae60":a<40?"#f1c40f":a<60?"#e67e22":a<80?"#e74c3c":"#8e44ad"}function Ve(a,u){return a==="ICSA"?u>=1e3?(u/1e3).toFixed(0)+"K":u.toFixed(0):a==="VIXCLS"?u.toFixed(2):a==="STLFSI4"||a==="GSCPI"?u.toFixed(3):u.toFixed(2)}const Ot="wm:economic-stress:last-notified-level";function Ke(a){if(typeof Notification>"u"||Notification.permission!=="granted")return;const u=a>=85?2:a>=70?1:0;if(u!==0)try{const t=parseInt(sessionStorage.getItem(Ot)??"0",10);if(u<=t)return;sessionStorage.setItem(Ot,String(u)),new Notification("Economic Stress Alert",{body:`Composite stress index reached ${a.toFixed(1)} (${a>=85?"Critical":"Severe"})`,icon:"/favico/favicon-32x32.png",tag:"economic-stress"})}catch{}}function We(a){if(a.missing)return`<div style="background:rgba(255,255,255,0.02);border-radius:6px;padding:8px 10px;border:1px solid rgba(255,255,255,0.05)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <span style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);text-transform:uppercase;letter-spacing:0.05em">${n(a.label)}</span>
        <span style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:#888">N/A</span>
      </div>
      <div style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:#666;font-style:italic">Data unavailable</div>
    </div>`;const u=se(a.score),t=Math.min(100,Math.max(0,a.score)).toFixed(1),e=Ve(a.id,a.rawValue);return`<div style="background:rgba(255,255,255,0.04);border-radius:6px;padding:8px 10px;border:1px solid rgba(255,255,255,0.07)">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
      <span style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);text-transform:uppercase;letter-spacing:0.05em">${n(a.label)}</span>
      <span style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">${n(e)}</span>
    </div>
    <div style="display:flex;align-items:center;gap:6px">
      <div style="flex:1;background:rgba(255,255,255,0.07);border-radius:3px;height:5px;overflow:hidden">
        <div style="height:100%;width:${t}%;background:${u};border-radius:3px;transition:width 0.3s"></div>
      </div>
      <span style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));font-weight:600;color:${u};min-width:28px;text-align:right">${a.score.toFixed(0)}</span>
    </div>
  </div>`}function ht(a){return a.value===null?"N/A":a.unit==="$B"?`$${a.value.toLocaleString()}B`:`${a.value.toLocaleString()}${a.unit}`}function mt(a){if(a.change===null)return"No change";const u=a.change>0?"+":"";return a.unit==="$B"?`${a.change<0?"-$":`${u}$`}${Math.abs(a.change).toLocaleString()}B`:`${u}${a.change.toLocaleString()}${a.unit}`}function vt(a){return a===null||a===0?"neutral":a>0?"positive":"negative"}function Ye(a){var r,c,p,h;const u=new Map(a.map(f=>[f.id,f])),t=((r=u.get("VIXCLS"))==null?void 0:r.value)??null,e=((c=u.get("T10Y2Y"))==null?void 0:c.value)??null,s=((p=u.get("UNRATE"))==null?void 0:p.value)??null,o=((h=u.get("FEDFUNDS"))==null?void 0:h.value)??null;let l=0;return t!==null&&(l+=t>=25?2:t>=18?1:0),e!==null&&(l+=e<=0?2:e<.5?1:0),s!==null&&(l+=s>=4.5?1:0),o!==null&&(l+=o>=5?1:o<=2?-1:0),l>=4?{label:i("components.economic.pressure.stress"),detail:i("components.economic.pressure.stressDetail"),className:"macro-pressure-stress"}:l>=2?{label:i("components.economic.pressure.watch"),detail:i("components.economic.pressure.watchDetail"),className:"macro-pressure-watch"}:{label:i("components.economic.pressure.steady"),detail:i("components.economic.pressure.steadyDetail"),className:"macro-pressure-steady"}}class qe extends A{constructor(){super({id:"economic",title:i("panels.economic"),defaultRowSpan:2,infoTooltip:i("components.economic.infoTooltip")});b(this,"fredData",[]);b(this,"blsData",[]);b(this,"spendingData",null);b(this,"bisData",null);b(this,"stressData",null);b(this,"lastUpdate",null);b(this,"activeTab","indicators");b(this,"fredState","loading");b(this,"fredErrorMsg","");this.content.addEventListener("click",t=>{const e=t.target.closest(".panel-tab");e!=null&&e.dataset.tab&&(this.activeTab=e.dataset.tab,this.render())})}update(t){this.fredData=t,this.fredState="ok",this.fredErrorMsg="",this.lastUpdate=new Date,this.render()}setFredError(t){this.fredState="error",this.fredErrorMsg=t,this.render()}setFredRetrying(t){this.fredState="retrying",this.fredErrorMsg=t!==void 0?`${i("common.retrying")} (${t}s)`:i("common.retrying"),this.render()}updateSpending(t){this.spendingData=t,this.render()}updateBis(t){this.bisData=t,this.render()}updateBls(t){this.blsData=t,this.render()}updateStress(t){this.stressData=t,Number.isFinite(t.compositeScore)&&Ke(t.compositeScore),this.render()}setLoading(t){t&&(this.fredState="loading",this.fredErrorMsg="")}render(){var c,p;const t=this.spendingData&&((c=this.spendingData.awards)==null?void 0:c.length)>0,e=this.bisData&&((p=this.bisData.policyRates)==null?void 0:p.length)>0,s=this.blsData.length>0,o=`
      <div class="panel-tabs">
        <button class="panel-tab ${this.activeTab==="indicators"?"active":""}" data-tab="indicators">
          ${i("components.economic.indicators")}
        </button>
        ${t?`
          <button class="panel-tab ${this.activeTab==="spending"?"active":""}" data-tab="spending">
            Recent awards
          </button>
        `:""}
        ${e?`
          <button class="panel-tab ${this.activeTab==="centralBanks"?"active":""}" data-tab="centralBanks">
            ${i("components.economic.centralBanks")}
          </button>
        `:""}
        ${s?`
          <button class="panel-tab ${this.activeTab==="labor"?"active":""}" data-tab="labor">
            ${i("components.economic.laborMarket")}
          </button>
        `:""}
        <button class="panel-tab ${this.activeTab==="stress"?"active":""}" data-tab="stress">
          Stress Index
        </button>
      </div>
    `;let l="";switch(this.activeTab){case"indicators":l=this.renderIndicators();break;case"spending":l=this.renderSpending();break;case"centralBanks":l=this.renderCentralBanks();break;case"labor":l=this.renderLabor();break;case"stress":l=this.renderStress();break}const r=this.lastUpdate?this.lastUpdate.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"";this.setSafeContent(T(`
      ${o}
      <div class="economic-content">
        ${l}
      </div>
      <div class="economic-footer">
        <span class="economic-source">${this.getSourceLabel()} • ${r}</span>
      </div>
    `,"legacy Panel.setContent() migration"))}getSourceLabel(){switch(this.activeTab){case"indicators":return"FRED";case"spending":return"USASpending.gov";case"centralBanks":return"BIS";case"labor":return"BLS";case"stress":return"FRED"}}renderIndicators(){if(this.fredData.length===0){if(Q()&&!J("economicFred"))return`<div class="economic-empty">${i("components.economic.fredKeyMissing")}</div>`;if(this.fredState==="error"||this.fredState==="retrying"){const r=this.fredState==="retrying",c=r?i("common.upstreamUnavailable"):this.fredErrorMsg,p=c.includes("—")?c.slice(0,c.indexOf("—")).trimEnd():c,h=r?`<div class="panel-error-countdown">${n(this.fredErrorMsg)}</div>`:"";return`
          <div class="panel-error-state">
            <div class="panel-loading-radar panel-error-radar">
              <div class="panel-radar-sweep"></div>
              <div class="panel-radar-dot error"></div>
            </div>
            <div class="panel-error-msg">${n(p)}</div>
            ${h}
          </div>
        `}return`<div class="economic-empty">${i("components.economic.noIndicatorData")}</div>`}const t=Ye(this.fredData),e=["VIXCLS","T10Y2Y","FEDFUNDS","UNRATE"],s=this.fredData.filter(r=>e.includes(r.id)),o=this.fredData.filter(r=>!e.includes(r.id)),l=[...s,...o];return`
      <div class="economic-content-macro">
        <div class="macro-pressure-card ${t.className}">
          <div class="macro-pressure-label">${i("components.economic.pressure.label")}</div>
          <div class="macro-pressure-value">${n(t.label)}</div>
          <div class="macro-pressure-detail">${n(t.detail)}</div>
        </div>
        <div class="macro-summary-grid">
          ${s.map(r=>`
            <div class="macro-summary-card">
              <div class="macro-summary-head">
                <span class="indicator-name">${n(r.name)}</span>
                <span class="indicator-id">${n(r.id)}</span>
              </div>
              <div class="macro-summary-value">${n(ht(r))}</div>
              <div class="macro-summary-change ${vt(r.change)}">${n(mt(r))}</div>
            </div>
          `).join("")}
        </div>
        <div class="economic-indicators">
          ${l.map(r=>{var c;return`
            <div class="economic-indicator" data-series="${n(r.id)}">
              <div class="indicator-header">
                <span class="indicator-name">${n(r.name)}</span>
                <span class="indicator-id">${n(r.id)}</span>
              </div>
              <div class="indicator-value">
                <span class="value">${n(ht(r))}</span>
                <span class="change ${vt(r.change)}">${n(mt(r))}</span>
              </div>
              <div class="indicator-date">${n(r.date)}</div>
              ${it(((c=r.observations)==null?void 0:c.map(p=>p.value))??[],r.change!==null&&r.change>=0?"#4caf50":"#f44336",120,28,"display:block;margin:2px 0")}
            </div>
          `}).join("")}
        </div>
      </div>
    `}renderSpending(){var l;if(!this.spendingData||!((l=this.spendingData.awards)!=null&&l.length))return`<div class="economic-empty">${i("components.economic.noSpending")}</div>`;const{awards:t,totalAmount:e,periodStart:s,periodEnd:o}=this.spendingData;return`
      <div class="spending-summary">
        <div class="spending-total">
          ${n(Ft(e))} ${i("components.economic.in")} ${n(String(t.length))} ${i("components.economic.awards")}
          <span class="spending-period">${n(s)} / ${n(o)}</span>
        </div>
      </div>
      <div class="spending-list">
        ${t.slice(0,8).map(r=>`
          <div class="spending-award">
            <div class="award-header">
              <span class="award-icon">${n(ge(r.awardType))}</span>
              <span class="award-amount">${n(Ft(r.amount))}</span>
            </div>
            <div class="award-recipient">${n(r.recipientName)}</div>
            <div class="award-agency">${n(r.agency)}</div>
            ${r.description?`<div class="award-desc">${n(r.description.slice(0,100))}${r.description.length>100?"...":""}</div>`:""}
          </div>
        `).join("")}
      </div>
    `}renderCentralBanks(){var p,h,f;if(!this.bisData||!((p=this.bisData.policyRates)!=null&&p.length))return`<div class="economic-empty">${i("components.economic.noBisData")}</div>`;const t=lt("--semantic-normal"),e=lt("--semantic-critical"),s=lt("--text-dim"),o=[...this.bisData.policyRates].sort((v,d)=>d.rate-v.rate),l=`
      <div class="bis-section">
        <div class="bis-section-title">${i("components.economic.policyRate")}</div>
        <div class="economic-indicators">
          ${o.map(v=>{const d=v.rate-v.previousRate,m=d<0?t:d>0?e:s,g=d<0?i("components.economic.cut"):d>0?i("components.economic.hike"):i("components.economic.hold"),y=d<0?"▼":d>0?"▲":"–";return`
              <div class="economic-indicator">
                <div class="indicator-header">
                  <span class="indicator-name">${n(v.centralBank)}</span>
                  <span class="indicator-id">${n(v.countryCode)}</span>
                </div>
                <div class="indicator-value">
                  <span class="value">${n(String(v.rate))}%</span>
                  <span class="change" style="color: ${n(m)}">${n(y)} ${n(g)}</span>
                </div>
                <div class="indicator-date">${n(v.date)}</div>
              </div>`}).join("")}
        </div>
      </div>
    `;let r="";((h=this.bisData.exchangeRates)==null?void 0:h.length)>0&&(r=`
        <div class="bis-section">
          <div class="bis-section-title">${i("components.economic.realEer")}</div>
          <div class="economic-indicators">
            ${this.bisData.exchangeRates.map(v=>{const d=v.realChange>0?e:v.realChange<0?t:s,m=v.realChange>0?"▲":v.realChange<0?"▼":"–";return`
                <div class="economic-indicator">
                  <div class="indicator-header">
                    <span class="indicator-name">${n(v.countryName)}</span>
                    <span class="indicator-id">${n(v.countryCode)}</span>
                  </div>
                  <div class="indicator-value">
                    <span class="value">${n(String(v.realEer))}</span>
                    <span class="change" style="color: ${n(d)}">${n(m)} ${n(v.realChange>0?"+":"")}${n(String(v.realChange))}%</span>
                  </div>
                  <div class="indicator-date">${n(v.date)}</div>
                </div>`}).join("")}
          </div>
        </div>
      `);let c="";if(((f=this.bisData.creditToGdp)==null?void 0:f.length)>0){const v=[...this.bisData.creditToGdp].sort((d,m)=>m.creditGdpRatio-d.creditGdpRatio);c=`
        <div class="bis-section">
          <div class="bis-section-title">${i("components.economic.creditToGdp")}</div>
          <div class="economic-indicators">
            ${v.map(d=>{const m=d.creditGdpRatio-d.previousRatio,g=m>0?e:m<0?t:s,y=m>0?"▲":m<0?"▼":"–",w=m!==0?`${m>0?"+":""}${Math.round(m*10)/10}pp`:"–";return`
                <div class="economic-indicator">
                  <div class="indicator-header">
                    <span class="indicator-name">${n(d.countryName)}</span>
                    <span class="indicator-id">${n(d.countryCode)}</span>
                  </div>
                  <div class="indicator-value">
                    <span class="value">${n(String(d.creditGdpRatio))}%</span>
                    <span class="change" style="color: ${n(g)}">${n(y)} ${n(w)}</span>
                  </div>
                  <div class="indicator-date">${n(d.date)}</div>
                </div>`}).join("")}
          </div>
        </div>
      `}return l+r+c}renderLabor(){if(this.blsData.length===0)return`<div class="economic-empty">${i("components.economic.noIndicatorData")}</div>`;const t=this.blsData.filter(o=>!Mt.has(o.id)),e=this.blsData.filter(o=>Mt.has(o.id)),s=o=>{var l;return`
      <div class="economic-indicator" data-series="${n(o.id)}">
        <div class="indicator-header">
          <span class="indicator-name">${n(o.name)}</span>
          <span class="indicator-id">${n(o.id)}</span>
        </div>
        <div class="indicator-value">
          <span class="value">${n(ht(o))}</span>
          <span class="change ${vt(o.change)}">${n(mt(o))}</span>
        </div>
        <div class="indicator-date">${n(o.date)}</div>
        ${it(((l=o.observations)==null?void 0:l.map(r=>r.value))??[],o.change!==null&&o.change>=0?"#4caf50":"#f44336",120,28,"display:block;margin:2px 0")}
      </div>`};return`
      <div class="economic-content-macro">
        <div class="economic-indicators">
          ${t.map(s).join("")}
        </div>
        ${e.length>0?`
          <div class="bis-section">
            <div class="bis-section-title">${i("components.economic.metroUnemployment")}</div>
            <div class="economic-indicators">
              ${e.map(s).join("")}
            </div>
          </div>
        `:""}
      </div>
    `}renderStress(){const t=this.stressData;if(!t||t.unavailable||!Number.isFinite(t.compositeScore))return'<div class="economic-empty">Stress index data unavailable</div>';const e=se(t.compositeScore),s=Math.min(100,Math.max(0,t.compositeScore)).toFixed(1),o=t.components.map(r=>We(r)).join(""),l=t.seededAt?`<div style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);text-align:right;margin-top:8px">Updated ${new Date(t.seededAt).toLocaleDateString(void 0,{month:"short",day:"numeric"})}</div>`:"";return`<div style="padding:12px 14px">
      <div style="text-align:center;margin-bottom:12px">
        <div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px">Composite Score</div>
        <div style="font-size:calc(38px * var(--wm-panel-effective-scale, 1));font-weight:700;color:${e};line-height:1">${t.compositeScore.toFixed(1)}</div>
        <div style="display:inline-block;margin-top:6px;padding:3px 10px;border-radius:12px;background:${e}22;border:1px solid ${e}66;font-size:calc(12px * var(--wm-panel-effective-scale, 1));font-weight:600;color:${e}">${n(t.label)}</div>
      </div>
      <div style="margin-bottom:16px">
        <div style="position:relative;height:12px;border-radius:6px;overflow:visible;background:linear-gradient(to right,#27ae60 0%,#f1c40f 20%,#e67e22 40%,#e74c3c 60%,#8e44ad 80%,#8e44ad 100%);margin-bottom:4px">
          <div style="position:absolute;top:-4px;left:calc(${s}% - 2px);width:4px;height:20px;background:#fff;border-radius:2px;box-shadow:0 0 4px rgba(0,0,0,0.6)"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">
          <span>Low</span><span>Moderate</span><span>Elevated</span><span>Severe</span><span>Critical</span>
        </div>
      </div>
      ${o?`<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">${o}</div>`:""}
      ${l}
    </div>`}}const pa=Object.freeze(Object.defineProperty({__proto__:null,EconomicPanel:qe},Symbol.toStringTag,{value:"Module"})),ft={query:"",buyer:"",country:"",source:"",sort:"closing_soon",pageSize:25,cursor:"",minAutomationScore:0},Ze=30,Qe=[["","All sources"],["sam","SAM.gov"],["ted","TED"],["contracts-finder","Contracts Finder"],["canada-buys","CanadaBuys"],["gets","GETS"],["world-bank","World Bank"]],Je=[["closing_soon","Closing soon"],["newest","Newest"],["estimated_value","Estimated value"],["relevance","Technology relevance"]];function Ut(a,u){return a===u?" selected":""}function Xe(a){if(!a)return null;const u=new Date(a);return Number.isFinite(u.getTime())?u:null}class ts extends A{constructor(){super({id:"global-procurement",title:"Global Procurement",defaultRowSpan:2,showCount:!0,premium:"locked",infoTooltip:"Search active official procurement opportunities. Results are seed-backed and source health is reported explicitly."});b(this,"data",null);b(this,"filters",{...ft});b(this,"requestHandler",null);b(this,"loading",!1);this.showLoading("Loading procurement opportunities…"),this.content.addEventListener("submit",t=>{const e=t.target.closest("[data-procurement-filters]");e&&(t.preventDefault(),this.filters=this.readFilters(e),this.request({...this.filters,cursor:""},!1))}),this.content.addEventListener("click",t=>{var s;const e=t.target;if(e.closest("[data-procurement-load-more]")){const o=(s=this.data)==null?void 0:s.nextCursor;o&&this.request({...this.filters,cursor:o},!0);return}e.closest("[data-procurement-reset]")&&(this.filters={...ft},this.request({...this.filters},!1))})}setRequestHandler(t){this.requestHandler=t}setLoading(t,e=!1){if(this.loading=t,t&&!e&&!this.data){this.showLoading("Loading procurement opportunities…");return}this.render()}update(t,e=!1){if(this.loading=!1,e&&this.data){const s=new Map(this.data.tenders.map(o=>[o.id,o]));t.tenders.forEach(o=>s.set(o.id,o)),this.data={...t,tenders:[...s.values()]}}else this.data=t;this.setCount(this.data.total),this.render()}showUnavailable(){this.loading=!1,this.data=null,this.setCount(0),this.showError("Procurement opportunities are currently unavailable.",()=>this.request({...this.filters},!1),60)}clear(){this.data=null,this.filters={...ft},this.loading=!1,this.setCount(0),this.clearSensitiveContent()}request(t,e){!this.requestHandler||this.loading||(this.filters={...t,cursor:""},this.setLoading(!0,e),this.requestHandler(t,e))}readFilters(t){const e=new FormData(t);return{query:String(e.get("query")||"").trim(),buyer:String(e.get("buyer")||"").trim(),country:String(e.get("country")||"").trim().toUpperCase().slice(0,2),source:String(e.get("source")||""),sort:String(e.get("sort")||"closing_soon"),pageSize:25,cursor:"",minAutomationScore:e.get("techRelevant")?Ze:0}}render(){const t=this.data,e=this.renderControls();if(!t){this.setSafeContent(T(`${e}<div class="economic-empty">No procurement snapshot is available yet.</div>`,"global procurement controls"));return}const s=t.sourceStatuses.map(p=>{const h=p.lastSuccessfulAt?` · last success ${new Date(p.lastSuccessfulAt).toLocaleString()}`:"";return`${p.source}: ${p.state} (${p.recordCount})${h}`}).join(" · "),o=t.availability==="partial"?'<div class="economic-warning">Partial coverage — healthy sources remain visible while one or more sources are unavailable.</div>':t.availability==="stale"?'<div class="economic-warning">Showing stale last-good opportunities while all source refreshes are failing.</div>':t.availability==="empty"?'<div class="economic-empty">Official sources returned no matching open opportunities.</div>':t.dataAvailable?"":'<div class="economic-warning">The canonical procurement snapshot is unavailable.</div>',l=t.tenders.map(p=>this.renderTenderCard(p)).join(""),r=t.tenders.length,c=t.nextCursor?`<button type="button" class="debt-load-more" data-procurement-load-more${this.loading?" disabled":""}>${this.loading?"Loading…":"Load more"} <span class="debt-load-more-count">(${Math.max(0,t.total-r)} remaining)</span></button>`:"";this.setSafeContent(T(`
      ${e}
      ${o}
      <div class="global-procurement-summary">Showing ${r.toLocaleString()} of ${t.total.toLocaleString()} matching opportunities</div>
      ${l?`<div class="spending-list global-procurement-list">${l}</div>`:""}
      ${c}
      <div class="economic-footer"><span class="economic-source">${n(s)}${t.fetchedAt?` · snapshot ${n(new Date(t.fetchedAt).toLocaleString())}`:""}</span></div>
    `,"global procurement results"))}renderControls(){return`<form class="global-procurement-controls" data-procurement-filters>
      <input class="global-procurement-input" name="query" data-procurement-query type="search" value="${n(String(this.filters.query||""))}" placeholder="Search title or description" aria-label="Search procurement opportunities">
      <input class="global-procurement-input" name="buyer" type="search" value="${n(String(this.filters.buyer||""))}" placeholder="Buyer" aria-label="Filter by buyer">
      <input class="global-procurement-input global-procurement-country" name="country" data-procurement-country type="text" maxlength="2" value="${n(String(this.filters.country||""))}" placeholder="Country" aria-label="Filter by ISO country code">
      <select class="global-procurement-select" name="source" data-procurement-source aria-label="Filter by source">
        ${Qe.map(([t,e])=>`<option value="${t}"${Ut(this.filters.source,t)}>${e}</option>`).join("")}
      </select>
      <select class="global-procurement-select" name="sort" data-procurement-sort aria-label="Sort opportunities">
        ${Je.map(([t,e])=>`<option value="${t}"${Ut(this.filters.sort,t)}>${e}</option>`).join("")}
      </select>
      <label class="global-procurement-toggle" title="Shows only opportunities whose title, description, or categories matched technology keywords. Keyword relevance evidence only — not an indication of bidding eligibility.">
        <input type="checkbox" name="techRelevant" data-procurement-tech-relevant${(this.filters.minAutomationScore||0)>0?" checked":""}${this.loading?" disabled":""}>
        Technology relevant only
      </label>
      <button type="submit" class="global-procurement-apply"${this.loading?" disabled":""}>Apply</button>
      <button type="button" class="global-procurement-reset" data-procurement-reset${this.loading?" disabled":""}>Reset</button>
    </form>`}renderTenderCard(t){var h,f,v;const e=te(t.officialUrl),s=Xe(t.deadline),o=s?Math.ceil((s.getTime()-Date.now())/864e5):null,l=o!==null&&o>=0&&o<=3,r=(h=t.money)!=null&&h.amount&&t.money.amount>0?`${t.money.currency||""} ${t.money.amount.toLocaleString()}`.trim():"",c=[t.source,t.buyer,t.countryCode,r,s?`Closes ${s.toLocaleDateString()}`:"",l?"CLOSING SOON":""].filter(d=>!!d).map(d=>n(d)).join(" · "),p=(v=(f=t.automationFit)==null?void 0:f.matchReasons)!=null&&v.length?`<div class="award-agency">Technology relevance (keyword evidence, not bidding eligibility): ${n(t.automationFit.matchReasons.join(", "))}</div>`:"";return`<article class="spending-award global-procurement-card">
      <div class="award-header"><span class="award-amount">${n(t.status.toUpperCase())}</span><span class="award-icon">${l?"⏰":"📄"}</span></div>
      <div class="award-recipient">${n(t.title)}</div>
      <div class="award-agency">${c}</div>
      ${t.description?`<div class="award-desc">${n(t.description.slice(0,240))}${t.description.length>240?"…":""}</div>`:""}
      ${p}
      ${e?`<a href="${e}" target="_blank" rel="noopener noreferrer nofollow" class="award-agency">Official notice ↗</a>`:""}
    </article>`}}const ua=Object.freeze(Object.defineProperty({__proto__:null,GlobalProcurementPanel:ts},Symbol.toStringTag,{value:"Module"})),ae="wm-consumer-prices-v1",es="wm-consumer-prices-settings-changed",Gt="wm-consumer-prices-open-tab",ss=["overview","categories","movers","spread","health","world"],Ht={market:ke,basket:ee,range:"30d",tab:"overview",categoryFilter:null};function as(){try{const a=localStorage.getItem(ae);if(a)return{...Ht,...JSON.parse(a)}}catch{}return{...Ht}}function z(a){try{localStorage.setItem(ae,JSON.stringify(a)),window.dispatchEvent(new CustomEvent(es,{detail:a}))}catch{}}function G(a,u=!1){if(a==null||a===0)return'<span class="cp-badge cp-badge--neutral">—</span>';const t=u?a>0?"cp-badge--red":"cp-badge--green":a>0?"cp-badge--green":"cp-badge--red",e=a>0?"+":"";return`<span class="cp-badge ${t}">${e}${a.toFixed(1)}%</span>`}function is(a){return Math.abs(a)<.5?'<span class="cp-pressure cp-pressure--steady">Stable</span>':a>=2?'<span class="cp-pressure cp-pressure--stress">Rising</span>':a>.5?'<span class="cp-pressure cp-pressure--watch">Mild Rise</span>':'<span class="cp-pressure cp-pressure--green">Easing</span>'}function W(a){return a==null||a===0?"Unknown":a<60?`${a}m ago`:a<1440?`${Math.round(a/60)}h ago`:`${Math.round(a/1440)}d ago`}function Y(a){return a==null?"cp-fresh--unknown":a<=60?"cp-fresh--ok":a<=240?"cp-fresh--warn":"cp-fresh--stale"}function ns(a){return a==null?"cp-infl--unknown":a>=10?"cp-infl--high":a>=5?"cp-infl--warn":a<0?"cp-infl--deflation":"cp-infl--ok"}function jt(a){return a==null?"—":`${a>=0?"+":""}${a.toFixed(1)}%`}class rs extends A{constructor(){super({id:"consumer-prices",title:i("panels.consumerPrices"),defaultRowSpan:2,infoTooltip:i("components.consumerPrices.infoTooltip")});b(this,"overview",null);b(this,"categories",null);b(this,"movers",null);b(this,"spread",null);b(this,"freshness",null);b(this,"allMarkets",[]);b(this,"globalInflation",null);b(this,"inflationLoading",!1);b(this,"inflationFilter","");b(this,"settings",as());b(this,"loading",!1);b(this,"openTabHandler",t=>{var s;const e=(s=t.detail)==null?void 0:s.tab;!e||!ss.includes(e)||(this.settings.tab=e,z(this.settings),this.render(),e==="world"&&this.globalInflation===null&&this.loadGlobalInflation())});this.content.addEventListener("click",t=>this.handleClick(t)),this.content.addEventListener("input",t=>this.handleInput(t)),typeof window<"u"&&window.addEventListener(Gt,this.openTabHandler)}destroy(){var t;typeof window<"u"&&window.removeEventListener(Gt,this.openTabHandler),(t=super.destroy)==null||t.call(this)}handleClick(t){const e=t.target,s=e.closest("[data-market]");if(s!=null&&s.dataset.market){const p=s.dataset.market;this.settings.market=p,this.settings.basket=p==="all"?ee:`essentials-${p}`,this.settings.tab="overview",z(this.settings),this.fetchData();return}const o=e.closest(".panel-tab");if(o!=null&&o.dataset.tab){this.settings.tab=o.dataset.tab,z(this.settings),this.render();return}const l=e.closest("[data-category]");if(l!=null&&l.dataset.category){this.settings.categoryFilter=l.dataset.category,this.settings.tab="movers",z(this.settings),this.render();return}const r=e.closest("[data-range]");if(r!=null&&r.dataset.range){this.settings.range=r.dataset.range,z(this.settings),this.fetchData();return}e.closest("[data-clear-filter]")&&(this.settings.categoryFilter=null,z(this.settings),this.render())}handleInput(t){const e=t.target;if(!(e instanceof HTMLInputElement)||e.dataset.inflationFilter===void 0||(this.inflationFilter=e.value,this.globalInflation===null||this.globalInflation.length===0))return;const s=this.visibleInflationRows(),o=this.content.querySelector(".cp-world-table tbody");o&&B(o,N(this.inflationTbodyHtml(s),"escaped IMF inflation rows"));const l=this.content.querySelector(".cp-world-count");l&&(l.textContent=this.inflationCountText(s))}async loadGlobalInflation(){var t;if(!this.inflationLoading){this.inflationLoading=!0;try{const e=await be();if(!((t=this.element)!=null&&t.isConnected))return;this.globalInflation=e,this.settings.tab==="world"&&this.render()}finally{this.inflationLoading=!1}}}async fetchData(){var h,f;if(this.loading)return;this.loading=!0,this.showLoading();const{market:t,basket:e,range:s}=this.settings;if(t==="all"){const v=await $e();if(!((h=this.element)!=null&&h.isConnected)){this.loading=!1;return}this.allMarkets=v,this.loading=!1,this.render();return}const[o,l,r,c,p]=await Promise.all([we(t,e),Ce(t,e,s),Se(t,s),xe(t,e),Te(t)]);if(!((f=this.element)!=null&&f.isConnected)){this.loading=!1;return}this.overview=o,this.categories=l,this.movers=r,this.spread=c,this.freshness=p,this.loading=!1,this.render()}render(){var m;const t=[{id:"overview",label:i("components.consumerPrices.tabs.overview")},{id:"categories",label:i("components.consumerPrices.tabs.categories")},{id:"movers",label:i("components.consumerPrices.tabs.movers")},{id:"spread",label:i("components.consumerPrices.tabs.spread")},{id:"health",label:i("components.consumerPrices.tabs.health")},{id:"world",label:i("components.consumerPrices.tabs.world")}],s=this.settings.market==="all"||this.settings.tab==="world"?t.filter(g=>g.id==="overview"||g.id==="world"):t;s.some(g=>g.id===this.settings.tab)||(this.settings.tab="overview");const{tab:o,range:l,categoryFilter:r,market:c}=this.settings,p=`
      <div class="panel-tabs">
        ${s.map(g=>`
          <button class="panel-tab${o===g.id?" active":""}" data-tab="${g.id}">
            ${n(g.label)}
          </button>
        `).join("")}
      </div>
    `,h=`
      <div class="cp-market-bar">
        ${De.map(g=>`
          <button class="cp-market-btn${c===g.code?" active":""}" data-market="${g.code}">${g.label}</button>
        `).join("")}
      </div>
    `,f=`
      <div class="cp-range-bar">
        ${["7d","30d","90d"].map(g=>`
          <button class="cp-range-btn${l===g?" active":""}" data-range="${g}">${g}</button>
        `).join("")}
      </div>
    `;if(o==="world"){this.setSafeContent(T(`
        <div class="consumer-prices-panel">
          ${p}
          <div class="cp-body">${this.renderWorldInflation()}</div>
        </div>
      `,"legacy Panel.setContent() migration"));return}if(c==="all"){this.setSafeContent(T(`
        <div class="consumer-prices-panel">
          ${h}
          ${p}
          <div class="cp-body">${this.renderGlobalOverview()}</div>
        </div>
      `,"legacy Panel.setContent() migration"));return}if((m=this.overview)==null?void 0:m.upstreamUnavailable){this.setSafeContent(T(`
        <div class="consumer-prices-panel">
          ${h}
          ${p}
          <div class="cp-body cp-seeding-state">
            <div class="cp-seeding-icon">📊</div>
            <div class="cp-seeding-title">Data collection in progress</div>
            <div class="cp-seeding-sub">Retail prices are being aggregated — check back in a few hours.</div>
          </div>
        </div>
      `,"legacy Panel.setContent() migration"));return}let d="";switch(o){case"overview":d=this.renderOverview();break;case"categories":d=f+this.renderCategories();break;case"movers":d=f+(r?`<div class="cp-filter-bar">Filtered: <strong>${n(r)}</strong> <button data-clear-filter>✕</button></div>`:"")+this.renderMovers();break;case"spread":d=this.renderSpread();break;case"health":d=this.renderHealth();break}this.setSafeContent(T(`
      <div class="consumer-prices-panel">
        ${h}
        ${p}
        <div class="cp-body">${d}</div>
      </div>
    `,"legacy Panel.setContent() migration"))}renderGlobalOverview(){return this.allMarkets.length===0?'<div class="cp-empty-state">Loading global data…</div>':`
      <table class="cp-global-table">
        <thead>
          <tr>
            <th>Market</th><th>Index</th><th>WoW</th><th>Spread</th><th>Updated</th>
          </tr>
        </thead>
        <tbody>${Pe.map(e=>{const s=this.allMarkets.find(c=>c.marketCode===e.code);if(!(s&&s.asOf&&s.asOf!=="0"&&!s.upstreamUnavailable))return`
          <tr class="cp-global-row" data-market="${e.code}">
            <td class="cp-global-flag">${e.label}</td>
            <td colspan="4" class="cp-global-pending">Pending data</td>
          </tr>`;const l=G(s.wowPct,!0),r=Y(s.freshnessLagMin>0?s.freshnessLagMin:null);return`
        <tr class="cp-global-row" data-market="${e.code}">
          <td class="cp-global-flag">${e.label}</td>
          <td class="cp-global-index">${s.essentialsIndex>0?s.essentialsIndex.toFixed(1):"—"}</td>
          <td class="cp-global-wow">${l}</td>
          <td class="cp-global-spread">${s.retailerSpreadPct>0?`${s.retailerSpreadPct.toFixed(1)}%`:"—"}</td>
          <td class="cp-global-fresh ${r}">${s.freshnessLagMin>0?W(s.freshnessLagMin):"—"}</td>
        </tr>`}).join("")}</tbody>
      </table>
      <div class="cp-global-hint">Tap a market row to drill in</div>
    `}visibleInflationRows(){const t=this.globalInflation??[],e=this.inflationFilter.trim().toLowerCase();return e?t.filter(s=>s.name.toLowerCase().includes(e)||s.iso2.toLowerCase().includes(e)):t}inflationCountText(t){const e=t.length===1?i("components.consumerPrices.world.countSingular"):i("components.consumerPrices.world.countPlural");return`${t.length} ${e}`}inflationTbodyHtml(t){return t.length===0?`<tr><td colspan="4" class="cp-global-pending">${n(i("components.consumerPrices.world.noMatches"))}</td></tr>`:t.map(e=>{const s=ns(e.inflationPct);return`
        <tr class="cp-global-row">
          <td class="cp-global-flag">${n(e.name)}</td>
          <td class="cp-infl-yoy ${s}">${jt(e.inflationPct)}</td>
          <td class="cp-infl-eop">${jt(e.cpiEopPct)}</td>
          <td class="cp-infl-year">${e.year??"—"}</td>
        </tr>`}).join("")}renderWorldInflation(){if(this.globalInflation===null)return this.inflationLoading||this.loadGlobalInflation(),`<div class="cp-empty-state">${n(i("components.consumerPrices.world.loading"))}</div>`;if(this.globalInflation.length===0)return this.renderEmptyState(i("components.consumerPrices.world.empty"));const t=this.visibleInflationRows();return`
      <div class="cp-world-controls">
        <input type="search" class="cp-world-filter" data-inflation-filter
          placeholder="${n(i("components.consumerPrices.world.filterPlaceholder"))}"
          value="${n(this.inflationFilter)}" />
        <span class="cp-world-count">${n(this.inflationCountText(t))}</span>
      </div>
      <table class="cp-global-table cp-world-table">
        <thead>
          <tr>
            <th>${n(i("components.consumerPrices.world.country"))}</th>
            <th>${n(i("components.consumerPrices.world.inflationYoY"))}</th>
            <th>${n(i("components.consumerPrices.world.endOfPeriod"))}</th>
            <th>${n(i("components.consumerPrices.world.year"))}</th>
          </tr>
        </thead>
        <tbody>${this.inflationTbodyHtml(t)}</tbody>
      </table>
      <div class="cp-global-hint">${n(i("components.consumerPrices.world.source"))}</div>
    `}renderOverview(){var e;const t=this.overview;return!t||!t.asOf||t.asOf==="0"?this.renderEmptyState("No price data available yet"):`
      <div class="cp-overview-grid">
        <div class="cp-stat-card">
          <div class="cp-stat-label">Essentials Basket</div>
          <div class="cp-stat-value">${t.essentialsIndex>0?t.essentialsIndex.toFixed(1):"—"}</div>
          <div class="cp-stat-sub">Index (base 100)</div>
        </div>
        <div class="cp-stat-card">
          <div class="cp-stat-label">Value Basket</div>
          <div class="cp-stat-value">${t.valueBasketIndex>0?t.valueBasketIndex.toFixed(1):"—"}</div>
          <div class="cp-stat-sub">Index (base 100)</div>
        </div>
        <div class="cp-stat-card">
          <div class="cp-stat-label">Week-over-Week</div>
          <div class="cp-stat-value">${G(t.wowPct,!0)}</div>
          <div class="cp-stat-sub">${is(t.wowPct)}</div>
        </div>
        <div class="cp-stat-card">
          <div class="cp-stat-label">Month-over-Month</div>
          <div class="cp-stat-value">${G(t.momPct,!0)}</div>
        </div>
        <div class="cp-stat-card">
          <div class="cp-stat-label">Retailer Spread</div>
          <div class="cp-stat-value">${t.retailerSpreadPct>0?`${t.retailerSpreadPct.toFixed(1)}%`:"—"}</div>
          <div class="cp-stat-sub">Cheapest vs most exp.</div>
        </div>
        <div class="cp-stat-card">
          <div class="cp-stat-label">Coverage</div>
          <div class="cp-stat-value">${t.coveragePct>0?`${t.coveragePct.toFixed(0)}%`:"—"}</div>
          <div class="cp-stat-sub ${Y(t.freshnessLagMin)}">
            ${W(t.freshnessLagMin)}
          </div>
        </div>
      </div>
      ${(e=t.topCategories)!=null&&e.length?`
        <div class="cp-section-label">Top Category Movers</div>
        <div class="cp-category-mini">
          ${t.topCategories.slice(0,5).map(s=>this.renderCategoryMini(s)).join("")}
        </div>
      `:""}
    `}renderCategoryMini(t){var s;const e=(s=t.sparkline)!=null&&s.length?it(t.sparkline,"var(--accent)",40,16):"";return`
      <div class="cp-cat-mini-row" data-category="${n(t.slug)}">
        <span class="cp-cat-name">${n(t.name)}</span>
        <span class="cp-cat-spark">${e}</span>
        ${G(t.momPct,!0)}
      </div>
    `}renderCategories(){var e;const t=(e=this.categories)==null?void 0:e.categories;return t!=null&&t.length?`
      <table class="cp-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>WoW</th>
            <th>MoM</th>
            <th>Trend</th>
            <th>Coverage</th>
          </tr>
        </thead>
        <tbody>
          ${t.map(s=>{var o;return`
            <tr class="cp-cat-row" data-category="${n(s.slug)}">
              <td><strong>${n(s.name)}</strong></td>
              <td>${G(s.wowPct,!0)}</td>
              <td>${G(s.momPct,!0)}</td>
              <td>${(o=s.sparkline)!=null&&o.length?it(s.sparkline,"var(--accent)",48,18):"—"}</td>
              <td>${s.coveragePct>0?`${s.coveragePct.toFixed(0)}%`:"—"}</td>
            </tr>
          `}).join("")}
        </tbody>
      </table>
    `:this.renderEmptyState("No category data yet")}renderMovers(){const t=this.movers;if(!t)return this.renderEmptyState("No price movement data yet");const{categoryFilter:e}=this.settings,s=r=>!e||r.category===e,o=(t.risers??[]).filter(s).slice(0,8),l=(t.fallers??[]).filter(s).slice(0,8);return!o.length&&!l.length?this.renderEmptyState("No movers for this selection"):`
      <div class="cp-movers-grid">
        <div class="cp-movers-col">
          <div class="cp-col-header cp-col-header--up">Rising</div>
          ${o.map(r=>this.renderMoverRow(r,"up")).join("")||'<div class="cp-empty-col">None</div>'}
        </div>
        <div class="cp-movers-col">
          <div class="cp-col-header cp-col-header--down">Falling</div>
          ${l.map(r=>this.renderMoverRow(r,"down")).join("")||'<div class="cp-empty-col">None</div>'}
        </div>
      </div>
    `}renderMoverRow(t,e){const s=t.changePct>0?"+":"";return`
      <div class="cp-mover-row cp-mover-row--${e}">
        <div class="cp-mover-title">${n(t.title)}</div>
        <div class="cp-mover-meta">
          <span class="cp-mover-cat">${n(t.category)}</span>
          <span class="cp-mover-retailer">${n(t.retailerSlug)}</span>
        </div>
        <div class="cp-mover-pct">${s}${t.changePct.toFixed(1)}%</div>
      </div>
    `}renderSpread(){var e;const t=this.spread;return(e=t==null?void 0:t.retailers)!=null&&e.length?`
      <div class="cp-spread-header">
        <span>Spread: <strong>${t.spreadPct.toFixed(1)}%</strong></span>
        <span class="cp-spread-basket">${n(t.basketSlug)} · ${n(t.currencyCode)}</span>
      </div>
      <div class="cp-spread-list">
        ${t.retailers.map((s,o)=>this.renderSpreadRow(s,o,t.currencyCode)).join("")}
      </div>
    `:this.renderEmptyState("Retailer comparison starts once data is collected")}renderSpreadRow(t,e,s){const o=e===0;return`
      <div class="cp-spread-row ${o?"cp-spread-row--cheapest":""}">
        <div class="cp-spread-rank">#${e+1}</div>
        <div class="cp-spread-name">${n(t.name)}</div>
        <div class="cp-spread-total">${s} ${t.basketTotal.toFixed(2)}</div>
        <div class="cp-spread-delta">${o?'<span class="cp-badge cp-badge--green">Cheapest</span>':G(t.deltaVsCheapestPct,!0)}</div>
        <div class="cp-spread-items">${t.itemCount} items</div>
        <div class="cp-spread-fresh ${Y(t.freshnessMin)}">${W(t.freshnessMin)}</div>
      </div>
    `}renderHealth(){var e;const t=this.freshness;return(e=t==null?void 0:t.retailers)!=null&&e.length?`
      <div class="cp-health-summary">
        <span>Overall freshness: <strong class="${Y(t.overallFreshnessMin)}">${W(t.overallFreshnessMin)}</strong></span>
        ${t.stalledCount>0?`<span class="cp-stalled-badge">${t.stalledCount} stalled</span>`:""}
      </div>
      <div class="cp-health-list">
        ${t.retailers.map(s=>`
          <div class="cp-health-row">
            <span class="cp-health-name">${n(s.name)}</span>
            <span class="cp-health-status cp-health-status--${s.status}">${s.status}</span>
            <span class="cp-health-rate">${s.parseSuccessRate>0?`${s.parseSuccessRate.toFixed(0)}% parse`:"—"}</span>
            <span class="cp-health-fresh ${Y(s.freshnessMin)}">${W(s.freshnessMin)}</span>
          </div>
        `).join("")}
      </div>
    `:this.renderEmptyState("Health data not yet available")}renderEmptyState(t){return`<div class="cp-empty-state">${n(t)}</div>`}}const ha=Object.freeze(Object.defineProperty({__proto__:null,ConsumerPricesPanel:rs},Symbol.toStringTag,{value:"Module"}));class os extends A{constructor(){super({id:"trade-policy",title:i("panels.tradePolicy"),defaultRowSpan:2,infoTooltip:i("components.tradePolicy.infoTooltip")});b(this,"restrictionsData",null);b(this,"tariffsData",null);b(this,"flowsData",null);b(this,"barriersData",null);b(this,"revenueData",null);b(this,"comtradeData",null);b(this,"activeTab","restrictions");this.content.addEventListener("click",t=>{const e=t.target.closest(".panel-tab");if(!e)return;const s=e.dataset.tab;s&&s!==this.activeTab&&(this.activeTab=s,this.render())})}updateRestrictions(t){this.restrictionsData=t,this.render()}updateTariffs(t){this.tariffsData=t,this.render()}updateFlows(t){this.flowsData=t,this.render()}updateBarriers(t){this.barriersData=t,this.render()}updateComtradeFlows(t){this.comtradeData=t,this.render()}updateRevenue(t){this.revenueData=t,Q()&&!J("wtoTrade")&&this.activeTab!=="revenue"&&(this.activeTab="revenue"),this.render()}render(){var m,g,y,w,k,S,E,R,$,C,P,I,U,F,D,M,_,L,x;const t=!Q()||J("wtoTrade"),e=t&&this.tariffsData&&((m=this.tariffsData.datapoints)==null?void 0:m.length)>0,s=t&&this.flowsData&&((g=this.flowsData.flows)==null?void 0:g.length)>0,o=t&&this.barriersData&&((y=this.barriersData.barriers)==null?void 0:y.length)>0,l=this.revenueData&&((w=this.revenueData.months)==null?void 0:w.length)>0,r=this.comtradeData&&((k=this.comtradeData.flows)==null?void 0:k.length)>0;if(!t&&!l&&!r){this.setSafeContent(T(`<div class="economic-empty">${i("components.tradePolicy.apiKeyMissing")}</div>`,"legacy Panel.setContent() migration"));return}!t&&this.activeTab!=="revenue"&&this.activeTab!=="comtrade"&&(this.activeTab="revenue");const c=`
      <div class="panel-tabs">
        ${t?`<button class="panel-tab ${this.activeTab==="restrictions"?"active":""}" data-tab="restrictions">
          ${i("components.tradePolicy.overview")}
        </button>`:""}
        ${e?`<button class="panel-tab ${this.activeTab==="tariffs"?"active":""}" data-tab="tariffs">
          ${i("components.tradePolicy.tariffs")}
        </button>`:""}
        ${s?`<button class="panel-tab ${this.activeTab==="flows"?"active":""}" data-tab="flows">
          ${i("components.tradePolicy.flows")}
        </button>`:""}
        ${o?`<button class="panel-tab ${this.activeTab==="barriers"?"active":""}" data-tab="barriers">
          ${i("components.tradePolicy.barriers")}
        </button>`:""}
        ${l?`<button class="panel-tab ${this.activeTab==="revenue"?"active":""}" data-tab="revenue">
          ${i("components.tradePolicy.revenue")}
        </button>`:""}
        ${r?`<button class="panel-tab ${this.activeTab==="comtrade"?"active":""}" data-tab="comtrade">
          ${i("components.tradePolicy.strategicFlows")}
        </button>`:""}
      </div>
    `,p=this.activeTab==="restrictions"?(((E=(S=this.restrictionsData)==null?void 0:S.restrictions)==null?void 0:E.length)??0)>0:this.activeTab==="tariffs"?((($=(R=this.tariffsData)==null?void 0:R.datapoints)==null?void 0:$.length)??0)>0:this.activeTab==="flows"?(((P=(C=this.flowsData)==null?void 0:C.flows)==null?void 0:P.length)??0)>0:this.activeTab==="barriers"?(((U=(I=this.barriersData)==null?void 0:I.barriers)==null?void 0:U.length)??0)>0:this.activeTab==="comtrade"?(((D=(F=this.comtradeData)==null?void 0:F.flows)==null?void 0:D.length)??0)>0:(((_=(M=this.revenueData)==null?void 0:M.months)==null?void 0:_.length)??0)>0,h=this.activeTab==="restrictions"?this.restrictionsData:this.activeTab==="tariffs"?this.tariffsData:this.activeTab==="flows"?this.flowsData:this.activeTab==="barriers"?this.barriersData:this.activeTab==="comtrade"?this.comtradeData:this.revenueData,f=!p&&(h!=null&&h.upstreamUnavailable)?`<div class="economic-warning">${this.activeTab==="revenue"?i("components.tradePolicy.treasuryUnavailable"):this.activeTab==="comtrade"?i("components.tradePolicy.comtradeUnavailable"):i("components.tradePolicy.upstreamUnavailable")}</div>`:"";let v="";switch(this.activeTab){case"restrictions":v=this.renderRestrictions();break;case"tariffs":v=this.renderTariffs();break;case"flows":v=this.renderFlows();break;case"barriers":v=this.renderBarriers();break;case"revenue":v=this.renderRevenue();break;case"comtrade":v=this.renderComtradeFlows();break}const d=this.activeTab==="comtrade"?i("components.tradePolicy.sourceComtrade"):this.activeTab==="revenue"?i("components.tradePolicy.sourceTreasury"):(this.activeTab==="tariffs"||this.activeTab==="restrictions")&&((x=(L=this.tariffsData)==null?void 0:L.effectiveTariffRate)!=null&&x.sourceName)?`${i("components.tradePolicy.sourceWto")} / ${this.tariffsData.effectiveTariffRate.sourceName}`:i("components.tradePolicy.sourceWto");this.setSafeContent(T(`
      ${c}
      ${f}
      <div class="economic-content">${v}</div>
      <div class="economic-footer">
        <span class="economic-source">${n(d)}</span>
      </div>
    `,"legacy Panel.setContent() migration"))}renderRestrictions(){var t;return!this.restrictionsData||!((t=this.restrictionsData.restrictions)!=null&&t.length)?`<div class="economic-empty">${i("components.tradePolicy.noOverviewData")}</div>`:`${this.renderRestrictionsContext()}
    <div class="trade-restrictions-list">
      ${this.restrictionsData.restrictions.map(e=>{const s=e.status==="high"?"status-active":e.status==="moderate"?"status-notified":"status-terminated",o=e.status==="high"?i("components.tradePolicy.highTariff"):e.status==="moderate"?i("components.tradePolicy.moderateTariff"):i("components.tradePolicy.lowTariff"),l=this.renderSourceUrl(e.sourceUrl);return`<div class="trade-restriction-card">
          <div class="trade-restriction-header">
            <span class="trade-country">${n(e.reportingCountry)}</span>
            <span class="trade-badge">${n(e.measureType)}</span>
            <span class="trade-status ${s}">${o}</span>
          </div>
          <div class="trade-restriction-body">
            <div class="trade-sector">${n(e.productSector)}</div>
            ${e.description?`<div class="trade-description">${n(e.description)}</div>`:""}
            ${this.renderRestrictionEffectiveContext(e.reportingCountry)}
            ${e.affectedCountry?`<div class="trade-affected">Affects: ${n(e.affectedCountry)}</div>`:""}
          </div>
          <div class="trade-restriction-footer">
            ${e.notifiedAt?`<span class="trade-date">${n(e.notifiedAt)}</span>`:""}
            ${l}
          </div>
        </div>`}).join("")}
    </div>`}renderRestrictionsContext(){const t=this.getEffectiveTariffGapSummary();if(!t)return`<div class="trade-policy-note">${i("components.tradePolicy.overviewNoteNoEffective")}</div>`;const e=t.gap>0?"+":"",s=this.renderSourceUrl(t.effectiveRate.sourceUrl);return`<div class="trade-policy-note">
      ${i("components.tradePolicy.usBaselineLabel")}: <strong>${t.baseline.tariffRate.toFixed(1)}%</strong>.
      ${i("components.tradePolicy.effectiveTariffRateLabel")}: <strong>${t.effectiveRate.tariffRate.toFixed(1)}%</strong>.
      ${i("components.tradePolicy.gapLabel")}: <strong>${e}${t.gap.toFixed(1)}pp</strong>.
      ${i("components.tradePolicy.overviewNoteTail")}
      ${s}
    </div>`}renderTariffs(){var r;if(!this.tariffsData||!((r=this.tariffsData.datapoints)!=null&&r.length))return`<div class="economic-empty">${i("components.tradePolicy.noTariffData")}</div>`;const t=[...this.tariffsData.datapoints].sort((c,p)=>p.year-c.year),e=t[0]??null,s=this.tariffsData.effectiveTariffRate??null,o=this.renderTariffSummary(e,s),l=t.map(c=>`<tr>
        <td>${c.year}</td>
        <td>${c.tariffRate.toFixed(1)}%</td>
        <td>${n(c.productSector||"—")}</td>
      </tr>`).join("");return`${o}
    <div class="trade-tariffs-table">
      <table>
        <thead>
          <tr>
            <th>Year</th>
            <th>${i("components.tradePolicy.mfnAppliedRate")}</th>
            <th>Sector</th>
          </tr>
        </thead>
        <tbody>${l}</tbody>
      </table>
    </div>`}renderTariffSummary(t,e){if(!t)return"";const s=i("components.tradePolicy.wtoBaselineMeta",{year:String(t.year)}),o=`
      <div class="trade-tariff-card">
        <div class="trade-tariff-label">${i("components.tradePolicy.baselineMfnTariff")}</div>
        <div class="trade-tariff-value">${t.tariffRate.toFixed(1)}%</div>
        <div class="trade-tariff-meta">${n(s)}</div>
      </div>
    `;if(!e)return`<div class="trade-tariff-summary">
        ${o}
        <div class="trade-tariff-card trade-tariff-card-muted">
          <div class="trade-tariff-label">${i("components.tradePolicy.effectiveTariffRateLabel")}</div>
          <div class="trade-tariff-value">—</div>
          <div class="trade-tariff-meta">${i("components.tradePolicy.noEffectiveCoverageForCountry")}</div>
        </div>
      </div>`;const l=e.tariffRate-t.tariffRate,r=l>0?"+":"",c=l>=0?"trade-tariff-gap-positive":"trade-tariff-gap-negative",p=[e.sourceName,e.observationPeriod,e.updatedAt?`Updated ${e.updatedAt}`:""].filter(Boolean),h=this.renderSourceUrl(e.sourceUrl);return`<div class="trade-tariff-summary">
      ${o}
      <div class="trade-tariff-card">
        <div class="trade-tariff-label">${i("components.tradePolicy.effectiveTariffRateLabel")}</div>
        <div class="trade-tariff-value">${e.tariffRate.toFixed(1)}%</div>
        <div class="trade-tariff-meta">
          ${n(p.join(" | "))}
          ${h?`<span class="trade-tariff-source">${h}</span>`:""}
        </div>
      </div>
      <div class="trade-tariff-card">
        <div class="trade-tariff-label">${i("components.tradePolicy.gapLabel")}</div>
        <div class="trade-tariff-value ${c}">${r}${l.toFixed(1)}pp</div>
        <div class="trade-tariff-meta">${i("components.tradePolicy.effectiveMinusBaseline")}</div>
      </div>
    </div>`}getLatestBaselineTariffPoint(){var t,e;return(e=(t=this.tariffsData)==null?void 0:t.datapoints)!=null&&e.length?[...this.tariffsData.datapoints].sort((s,o)=>o.year-s.year)[0]??null:null}getEffectiveTariffGapSummary(){var s;const t=this.getLatestBaselineTariffPoint(),e=((s=this.tariffsData)==null?void 0:s.effectiveTariffRate)??null;return!t||!e?null:{baseline:t,effectiveRate:e,gap:e.tariffRate-t.tariffRate}}renderRestrictionEffectiveContext(t){if(t!=="United States")return"";const e=this.getEffectiveTariffGapSummary();if(!e)return"";const s=e.gap>0?"+":"";return`<div class="trade-policy-inline-note">
      ${i("components.tradePolicy.effectiveTariffRateLabel")}: ${e.effectiveRate.tariffRate.toFixed(1)}%
      <span class="trade-policy-inline-sep">|</span>
      ${i("components.tradePolicy.gapVsMfnLabel")}: ${s}${e.gap.toFixed(1)}pp
    </div>`}renderFlows(){var t;return!this.flowsData||!((t=this.flowsData.flows)!=null&&t.length)?`<div class="economic-empty">${i("components.tradePolicy.noFlowData")}</div>`:`<div class="trade-flows-list">
      ${this.flowsData.flows.map(e=>{const s=e.yoyExportChange>=0?"▲":"▼",o=e.yoyImportChange>=0?"▲":"▼",l=e.yoyExportChange>=0?"change-positive":"change-negative",r=e.yoyImportChange>=0?"change-positive":"change-negative";return`<div class="trade-flow-card">
          <div class="trade-flow-year">${e.year}</div>
          <div class="trade-flow-metrics">
            <div class="trade-flow-metric">
              <span class="trade-flow-label">${i("components.tradePolicy.exports")}</span>
              <span class="trade-flow-value">$${e.exportValueUsd.toFixed(0)}M</span>
              <span class="trade-flow-change ${l}">${s} ${Math.abs(e.yoyExportChange).toFixed(1)}%</span>
            </div>
            <div class="trade-flow-metric">
              <span class="trade-flow-label">${i("components.tradePolicy.imports")}</span>
              <span class="trade-flow-value">$${e.importValueUsd.toFixed(0)}M</span>
              <span class="trade-flow-change ${r}">${o} ${Math.abs(e.yoyImportChange).toFixed(1)}%</span>
            </div>
          </div>
        </div>`}).join("")}
    </div>`}renderBarriers(){var t;return!this.barriersData||!((t=this.barriersData.barriers)!=null&&t.length)?`<div class="economic-empty">${i("components.tradePolicy.noBarriers")}</div>`:`<div class="trade-barriers-list">
      ${this.barriersData.barriers.map(e=>{const s=this.renderSourceUrl(e.sourceUrl);return`<div class="trade-barrier-card">
          <div class="trade-barrier-header">
            <span class="trade-country">${n(e.notifyingCountry)}</span>
            <span class="trade-badge">${n(e.measureType)}</span>
          </div>
          <div class="trade-barrier-body">
            <div class="trade-barrier-title">${n(e.title)}</div>
            ${e.productDescription?`<div class="trade-sector">${n(e.productDescription)}</div>`:""}
            ${e.objective?`<div class="trade-description">${n(e.objective)}</div>`:""}
          </div>
          <div class="trade-barrier-footer">
            ${e.dateDistributed?`<span class="trade-date">${n(e.dateDistributed)}</span>`:""}
            ${s}
          </div>
        </div>`}).join("")}
    </div>`}renderRevenue(){var R;if(!this.revenueData||!((R=this.revenueData.months)!=null&&R.length))return`<div class="economic-empty">${i("components.tradePolicy.noRevenueData")}</div>`;const t=this.revenueData.months,s=t[t.length-1].fiscalYear,o=t.filter($=>$.fiscalYear===s),l=o.length,c=t.filter($=>$.fiscalYear===s-1).slice(0,l),p=o.reduce(($,C)=>$+C.monthlyAmountBillions,0),h=c.reduce(($,C)=>$+C.monthlyAmountBillions,0),f=h>0?(p-h)/h*100:0,v=f>=0?"change-negative":"change-positive",d=f>=0?"▲":"▼",m=`
      <div class="trade-revenue-summary">
        <div class="trade-revenue-headline">
          <span class="trade-revenue-label">${i("components.tradePolicy.fytdLabel",{year:String(s)})}</span>
          <span class="trade-revenue-value">$${p.toFixed(1)}B</span>
        </div>
        <div class="trade-revenue-compare">
          ${i("components.tradePolicy.vsPriorFy",{year:String(s-1)})}: $${h.toFixed(1)}B
          <span class="${v}">${d} ${Math.abs(f).toFixed(0)}%</span>
        </div>
      </div>
    `,g=c.length>0?h/c.length:0,y=[...t].slice(-12),w=Math.max(...y.map($=>$.monthlyAmountBillions),1),S=`<div class="trade-revenue-chart">${y.map($=>{const C=Math.round($.monthlyAmountBillions/w*100),P=$.recordDate.slice(0,7),I=$.monthlyAmountBillions>g*1.5;return`<div class="trade-chart-col" title="${P}: $${$.monthlyAmountBillions.toFixed(1)}B">
        <div class="trade-chart-bar${I?" trade-chart-spike":""}" style="height:${C}%"></div>
        <div class="trade-chart-label">${$.recordDate.slice(5,7)}</div>
      </div>`}).join("")}</div>`,E=[...t].reverse().slice(0,24).map($=>`<tr${$.monthlyAmountBillions>g*2?' class="trade-revenue-spike"':""}>
        <td>${$.recordDate}</td>
        <td>$${$.monthlyAmountBillions.toFixed(1)}B</td>
        <td>$${$.fytdAmountBillions.toFixed(1)}B</td>
      </tr>`).join("");return`${m}
    ${S}
    <div class="trade-tariffs-table">
      <table>
        <thead>
          <tr>
            <th>${i("components.tradePolicy.colDate")}</th>
            <th>${i("components.tradePolicy.colMonthly")}</th>
            <th>${i("components.tradePolicy.colFytd")}</th>
          </tr>
        </thead>
        <tbody>${E}</tbody>
      </table>
    </div>`}renderComtradeFlows(){var p;const t=(p=this.comtradeData)==null?void 0:p.flows;if(!(t!=null&&t.length))return`<div class="economic-empty">${i("components.tradePolicy.noComtradeData")}</div>`;const e=t.filter(h=>h.partnerCode==="0"||h.partnerCode==="000"),s=e.length>0?e:t,o=new Map;for(const h of s){const f=`${h.reporterCode}:${h.cmdCode}:${h.year}`,v=o.get(f);(!v||h.tradeValueUsd>v.tradeValueUsd)&&o.set(f,h)}const l=new Map;for(const h of o.values()){const f=`${h.reporterCode}:${h.cmdCode}`,v=l.get(f);(!v||h.year>v.year)&&l.set(f,h)}const c=[...l.values()].sort((h,f)=>h.isAnomaly!==f.isAnomaly?h.isAnomaly?-1:1:Math.abs(f.yoyChange)-Math.abs(h.yoyChange)).map(h=>{const f=h.yoyChange>=0?"▲":"▼",v=h.yoyChange>=0?"change-positive":"change-negative",d=`${f} ${Math.abs(h.yoyChange*100).toFixed(0)}%`,m=h.tradeValueUsd>=1e9?`$${(h.tradeValueUsd/1e9).toFixed(1)}B`:`$${(h.tradeValueUsd/1e6).toFixed(0)}M`,g=h.isAnomaly?`<span style="margin-left:6px;font-size:calc(9px * var(--wm-panel-effective-scale, 1));font-weight:600;letter-spacing:0.05em;padding:1px 5px;border-radius:3px;background:rgba(255,68,68,0.15);color:var(--red);vertical-align:middle;text-transform:uppercase">${i("components.tradePolicy.anomalyBadge")}</span>`:"";return`<tr class="${h.isAnomaly?"trade-anomaly-row":""}">
        <td>${n(h.reporterName)}${g}</td>
        <td>${n(h.cmdDesc)}</td>
        <td>${m} <span class="trade-flow-year">${h.year}</span></td>
        <td class="${v}">${d}</td>
      </tr>`}).join("");return`<div class="trade-tariffs-table">
      <table>
        <thead><tr>
          <th>${i("components.tradePolicy.colReporter")}</th>
          <th>${i("components.tradePolicy.colCommodity")}</th>
          <th>${i("components.tradePolicy.colTradeValue")}</th>
          <th>${i("components.tradePolicy.yoyChange")}</th>
        </tr></thead>
        <tbody>${c}</tbody>
      </table>
    </div>`}renderSourceUrl(t){if(!t)return"";try{const e=new URL(t);if(e.protocol==="http:"||e.protocol==="https:")return`<a href="${n(t)}" target="_blank" rel="noopener" class="trade-source-link">Source</a>`}catch{}return""}}const ma=Object.freeze(Object.defineProperty({__proto__:null,TradePolicyPanel:os},Symbol.toStringTag,{value:"Module"}));class cs extends A{constructor(){super({id:"sanctions-pressure",title:i("components.sanctionsPressure.title"),showCount:!0,trackActivity:!0,defaultRowSpan:2,infoTooltip:i("components.sanctionsPressure.infoTooltip")});b(this,"data",null);this.showLoading(i("components.sanctionsPressure.loading"))}setData(t){this.data=t,this.setCount(t.totalCount),this.render()}render(){if(!this.data||this.data.totalCount===0){this.setSafeContent(T(`<div class="economic-empty">${n(i("components.sanctionsPressure.unavailable"))}</div>`,"legacy Panel.setContent() migration"));return}const t=this.data,e=`
      <div class="sanctions-summary">
        ${this.renderSummaryCard(i("components.sanctionsPressure.summary.new"),t.newEntryCount,t.newEntryCount>0?"highlight":"")}
        ${this.renderSummaryCard(i("components.sanctionsPressure.summary.vessels"),t.vesselCount)}
        ${this.renderSummaryCard(i("components.sanctionsPressure.summary.aircraft"),t.aircraftCount)}
      </div>
    `,s=t.countries.length>0?t.countries.slice(0,8).map(c=>this.renderCountryRow(c)).join(""):`<div class="economic-empty">${n(i("components.sanctionsPressure.empty.countries"))}</div>`,o=t.entries.length>0?t.entries.slice(0,10).map(c=>this.renderEntryRow(c)).join(""):`<div class="economic-empty">${n(i("components.sanctionsPressure.empty.entries"))}</div>`,l=t.programs.length>0?t.programs.slice(0,6).map(c=>this.renderProgramRow(c)).join(""):`<div class="economic-empty">${n(i("components.sanctionsPressure.empty.programs"))}</div>`,r=[i("components.sanctionsPressure.footer.updated",{time:t.fetchedAt.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}),t.datasetDate?i("components.sanctionsPressure.footer.dataset",{date:t.datasetDate.toISOString().slice(0,10)}):"",i("components.sanctionsPressure.footer.source")].filter(Boolean).join(" · ");this.setSafeContent(T(`
      <div class="sanctions-panel-content">
        ${e}
        <div class="sanctions-sections">
          <div class="sanctions-section">
            <div class="sanctions-section-title">${n(i("components.sanctionsPressure.sections.countries"))}</div>
            <div class="sanctions-list">${s}</div>
          </div>
          <div class="sanctions-section">
            <div class="sanctions-section-title">${n(i("components.sanctionsPressure.sections.entries"))}</div>
            <div class="sanctions-list">${o}</div>
          </div>
          <div class="sanctions-section">
            <div class="sanctions-section-title">${n(i("components.sanctionsPressure.sections.programs"))}</div>
            <div class="sanctions-list">${l}</div>
          </div>
        </div>
        <div class="economic-footer">${n(r)}</div>
      </div>
    `,"legacy Panel.setContent() migration"))}renderSummaryCard(t,e,s=""){return`
      <div class="sanctions-summary-card ${s?`sanctions-summary-card-${s}`:""}">
        <span class="sanctions-summary-label">${n(t)}</span>
        <span class="sanctions-summary-value">${n(String(e))}</span>
      </div>
    `}renderCountryRow(t){const e=[];return t.newEntryCount>0&&e.push(`<span class="sanctions-pill sanctions-pill-new">${n(i("components.sanctionsPressure.pills.newCount",{count:t.newEntryCount}))}</span>`),t.vesselCount>0&&e.push(`<span class="sanctions-pill">🚢 ${t.vesselCount}</span>`),t.aircraftCount>0&&e.push(`<span class="sanctions-pill">✈ ${t.aircraftCount}</span>`),`
      <div class="sanctions-row">
        <div class="sanctions-row-main">
          <div class="sanctions-row-title">${n(t.countryName)}</div>
          <div class="sanctions-row-meta">${n(t.countryCode)} · ${n(i("components.sanctionsPressure.designations",{count:t.entryCount}))}</div>
        </div>
        <div class="sanctions-row-flags">${e.join("")}</div>
      </div>
    `}renderProgramRow(t){return`
      <div class="sanctions-row">
        <div class="sanctions-row-main">
          <div class="sanctions-row-title">${n(t.program)}</div>
          <div class="sanctions-row-meta">${n(i("components.sanctionsPressure.designations",{count:t.entryCount}))}</div>
        </div>
        <div class="sanctions-row-flags">
          ${t.newEntryCount>0?`<span class="sanctions-pill sanctions-pill-new">${n(i("components.sanctionsPressure.pills.newCount",{count:t.newEntryCount}))}</span>`:""}
        </div>
      </div>
    `}renderEntryRow(t){const e=t.countryNames[0]||t.countryCodes[0]||i("components.sanctionsPressure.fallbacks.unattributed"),s=t.programs[0]||i("components.sanctionsPressure.fallbacks.program"),o=t.note?`<div class="sanctions-entry-note">${n(t.note)}</div>`:"",l=t.effectiveAt?t.effectiveAt.toISOString().slice(0,10):i("components.sanctionsPressure.fallbacks.undated");return`
      <div class="sanctions-entry">
        <div class="sanctions-entry-top">
          <span class="sanctions-entry-name">${n(t.name)}</span>
          <span class="sanctions-pill sanctions-pill-type">${n(t.entityType)}</span>
          ${t.isNew?`<span class="sanctions-pill sanctions-pill-new">${n(i("components.sanctionsPressure.pills.new"))}</span>`:""}
        </div>
        <div class="sanctions-entry-meta">${n(e)} · ${n(s)} · ${n(l)}</div>
        ${o}
      </div>
    `}}const va=Object.freeze(Object.defineProperty({__proto__:null,SanctionsPressurePanel:cs},Symbol.toStringTag,{value:"Module"})),ls=new Set(["hormuz_strait","malacca_strait","suez","bab_el_mandeb"]);class ds extends A{constructor(){super({id:"supply-chain",title:i("panels.supplyChain"),defaultRowSpan:2,infoTooltip:i("components.supplyChain.infoTooltip")});b(this,"shippingData",null);b(this,"chokepointData",null);b(this,"mineralsData",null);b(this,"mineralProductionData",null);b(this,"mineralsStage","mine");b(this,"stressData",null);b(this,"activeTab","chokepoints");b(this,"expandedChokepoint",null);b(this,"transitChart",new Ie);b(this,"chartObserver",null);b(this,"chartMountTimer",null);b(this,"historyCache",new Map);b(this,"historyInflight",new Set);b(this,"bypassUnsubscribe",null);b(this,"bypassGateTracked",!1);b(this,"onDismissScenario",null);b(this,"onScenarioActivate",null);b(this,"activeScenarioState",null);b(this,"scenarioPollController",null);this.content.addEventListener("click",t=>{const e=t.target.closest("[data-mineral-stage]");if((e==null?void 0:e.dataset.mineralStage)==="mine"||(e==null?void 0:e.dataset.mineralStage)==="refinery"){const r=e.dataset.mineralStage;r!==this.mineralsStage&&(this.mineralsStage=r,this.render());return}const s=t.target.closest(".panel-tab");if(s!=null&&s.dataset.tab){const r=s.dataset.tab;r!==this.activeTab&&(this.clearTransitChart(),this.activeTab=r,this.render());return}const o=t.target.closest(".sc-scenario-trigger");if(o){t.stopPropagation();const r=o.querySelector(".sc-scenario-btn");r&&!r.disabled&&this.runScenario(o,r);return}const l=t.target.closest(".trade-restriction-card");if(l!=null&&l.dataset.cpId){const r=this.expandedChokepoint===l.dataset.cpId?null:l.dataset.cpId;r||this.clearTransitChart(),this.expandedChokepoint=r,this.render()}})}clearTransitChart(){this.chartMountTimer&&(clearTimeout(this.chartMountTimer),this.chartMountTimer=null),this.chartObserver&&(this.chartObserver.disconnect(),this.chartObserver=null),this.transitChart.destroy(),this.bypassUnsubscribe&&(this.bypassUnsubscribe(),this.bypassUnsubscribe=null),this.bypassGateTracked=!1}updateShippingRates(t){this.shippingData=t,this.render()}updateChokepointStatus(t){this.chokepointData=t,this.render()}updateCriticalMinerals(t){this.mineralsData=t,this.render()}updateMineralProduction(t){this.mineralProductionData=t,this.render()}updateShippingStress(t){this.stressData=t,this.render()}render(){var r,c,p,h,f,v,d,m,g,y,w,k,S,E,R,$;this.clearTransitChart();const t=`
      <div class="panel-tabs">
        <button class="panel-tab ${this.activeTab==="chokepoints"?"active":""}" data-tab="chokepoints">
          ${i("components.supplyChain.chokepoints")}
        </button>
        <button class="panel-tab ${this.activeTab==="shipping"?"active":""}" data-tab="shipping">
          ${i("components.supplyChain.shipping")}
        </button>
        <button class="panel-tab ${this.activeTab==="indicators"?"active":""}" data-tab="indicators">
          ${i("components.supplyChain.economicIndicators")}
        </button>
        <button class="panel-tab ${this.activeTab==="minerals"?"active":""}" data-tab="minerals">
          ${i("components.supplyChain.minerals")}
        </button>
        <button class="panel-tab ${this.activeTab==="stress"?"active":""}" data-tab="stress">
          Stress
        </button>
      </div>
    `,e=this.activeTab==="chokepoints"?(((c=(r=this.chokepointData)==null?void 0:r.chokepoints)==null?void 0:c.length)??0)>0:this.activeTab==="shipping"?(((h=(p=this.shippingData)==null?void 0:p.indices)==null?void 0:h.length)??0)>0||this.chokepointData!==null:this.activeTab==="indicators"?(((v=(f=this.shippingData)==null?void 0:f.indices)==null?void 0:v.length)??0)>0:this.activeTab==="stress"?(((m=(d=this.stressData)==null?void 0:d.carriers)==null?void 0:m.length)??0)>0:(((y=(g=this.mineralProductionData)==null?void 0:g.commodities)==null?void 0:y.length)??0)>0||(((k=(w=this.mineralsData)==null?void 0:w.minerals)==null?void 0:k.length)??0)>0,s=this.activeTab==="chokepoints"?this.chokepointData:this.activeTab==="shipping"||this.activeTab==="indicators"?this.shippingData:this.activeTab==="stress"?this.stressData:(E=(S=this.mineralProductionData)==null?void 0:S.commodities)!=null&&E.length?this.mineralProductionData:this.mineralsData,o=!e&&(s!=null&&s.upstreamUnavailable)?`<div class="economic-warning">${i("components.supplyChain.upstreamUnavailable")}</div>`:"";let l="";switch(this.activeTab){case"chokepoints":l=this.renderChokepoints();break;case"shipping":l=this.renderShipping();break;case"indicators":l=this.renderIndicators();break;case"minerals":l=this.renderMinerals();break;case"stress":l=this.renderStress();break}if(this.setSafeContent(T(`
      ${t}
      ${o}
      <div class="economic-content">${l}</div>
    `,"legacy Panel.setContent() migration")),this.activeTab==="chokepoints"&&this.expandedChokepoint){const C=this.expandedChokepoint,P=($=(R=this.chokepointData)==null?void 0:R.chokepoints)==null?void 0:$.find(D=>D.name===C),I=()=>{const D=this.content.querySelector(`[data-chart-cp="${C}"]`);if(!D)return!1;const M=(P==null?void 0:P.id)??"";if(!M)return D.textContent=i("components.supplyChain.historyUnavailable")||"History unavailable",!0;const _=this.historyCache.get(M);return _&&_.length?(D.removeAttribute("style"),D.style.marginTop="8px",D.style.minHeight="200px",D.textContent="",this.transitChart.mount(D,_),!0):(this.historyInflight.has(M)||(this.historyInflight.add(M),Ee(M).then(L=>{this.historyInflight.delete(M);const x=this.content.querySelector(`[data-chart-cp-id="${M}"]`);x&&(L.history.length?(this.historyCache.set(M,L.history),x.removeAttribute("style"),x.style.marginTop="8px",x.style.minHeight="200px",x.textContent="",this.transitChart.mount(x,L.history)):x.textContent=i("components.supplyChain.historyUnavailable")||"History unavailable")}).catch(()=>{this.historyInflight.delete(M);const L=this.content.querySelector(`[data-chart-cp-id="${M}"]`);L&&(L.textContent=i("components.supplyChain.historyUnavailable")||"History unavailable")})),!0)},U=()=>{const D=this.content.querySelector(`[data-bypass-cp="${(P==null?void 0:P.id)??""}"]`);return D?(this.renderBypassSection(D,(P==null?void 0:P.id)??""),!0):!1},F=()=>U()?(I(),!0):!1;this.chartObserver=new MutationObserver(()=>{var D;F()&&(this.chartMountTimer&&(clearTimeout(this.chartMountTimer),this.chartMountTimer=null),(D=this.chartObserver)==null||D.disconnect(),this.chartObserver=null)}),this.chartObserver.observe(this.content,{childList:!0,subtree:!0}),this.chartMountTimer=setTimeout(()=>{F()&&(this.chartObserver&&(this.chartObserver.disconnect(),this.chartObserver=null),this.chartMountTimer=null)},220)}this.activeScenarioState&&this.renderScenarioBanner()}renderBypassSection(t,e){if(!e)return;const s=()=>'<div class="sc-bypass-gate"><span class="sc-bypass-lock">🔒</span><span class="sc-bypass-gate-text">Bypass corridors available with PRO</span></div>',o=c=>{const p=c.slice(0,3);return p.length?`<table class="sc-bypass-table">
        <thead><tr><th>Corridor</th><th>+Days</th><th>+Cost</th><th>Risk</th></tr></thead>
        <tbody>${p.map(f=>{const v=f.addedTransitDays>0?`+${f.addedTransitDays}d`:"-",d=f.addedCostMultiplier>1?`+${((f.addedCostMultiplier-1)*100).toFixed(0)}%`:"-",g={WAR_RISK_TIER_UNSPECIFIED:"Normal",WAR_RISK_TIER_WAR_ZONE:"War Zone",WAR_RISK_TIER_CRITICAL:"Critical",WAR_RISK_TIER_HIGH:"High",WAR_RISK_TIER_ELEVATED:"Elevated",WAR_RISK_TIER_NORMAL:"Normal"}[f.bypassWarRiskTier]??f.bypassWarRiskTier;return`<tr><td>${n(f.name)}</td><td>${v}</td><td>${d}</td><td>${n(g)}</td></tr>`}).join("")}</tbody>
      </table>`:'<div class="sc-bypass-error">No bypass options available</div>'},l=(c,p)=>{if(!c){B(t,N(s(),"legacy direct innerHTML migration")),this.bypassGateTracked||(Lt("bypass-corridors"),this.bypassGateTracked=!0);return}p!==void 0&&B(t,N(o(p),"legacy direct innerHTML migration"))};if(!pt(It())){l(!1),this.bypassUnsubscribe&&this.bypassUnsubscribe(),this.bypassUnsubscribe=fe(c=>{if(pt(c)){if(this.bypassUnsubscribe&&(this.bypassUnsubscribe(),this.bypassUnsubscribe=null),!this.content.contains(t))return;B(t,N('<div class="sc-bypass-loading">Loading bypass options…</div>',"legacy direct innerHTML migration")),_t(e,"container",100).then(p=>{this.content.contains(t)&&B(t,N(o(p.options),"legacy direct innerHTML migration"))}).catch(()=>{this.content.contains(t)&&B(t,N('<div class="sc-bypass-error">Bypass data unavailable</div>',"legacy direct innerHTML migration"))})}});return}_t(e,"container",100).then(c=>{this.content.contains(t)&&l(!0,c.options)}).catch(()=>{this.content.contains(t)&&B(t,N('<div class="sc-bypass-error">Bypass data unavailable</div>',"legacy direct innerHTML migration"))})}renderChokepoints(){var o,l,r;if(!this.chokepointData||!((o=this.chokepointData.chokepoints)!=null&&o.length))return`<div class="economic-empty">${i("components.supplyChain.noChokepoints")}</div>`;const t=(l=this.activeScenarioState)==null?void 0:l.result,e=new Set((t==null?void 0:t.affectedChokepointIds)??[]),s=((r=t==null?void 0:t.template)==null?void 0:r.disruptionPct)??null;return`<div class="trade-restrictions-list">
      ${[...this.chokepointData.chokepoints].sort((c,p)=>p.disruptionScore-c.disruptionScore).map(c=>{var L;const p=e.has(c.id),h=c.status==="red"?"status-active":c.status==="yellow"?"status-notified":"status-terminated",f=c.status==="red"?"sc-dot-red":c.status==="yellow"?"sc-dot-yellow":"sc-dot-green",v=c.aisDisruptions??(c.congestionLevel==="normal"?0:1),d=c.transitSummary,m=(d==null?void 0:d.wowChangePct)??0,g=d&&m!==0,y=g?`<span class="${m>=0?"change-positive":"change-negative"}">${m>=0?"▲":"▼"}${Math.abs(m).toFixed(1)}%</span>`:"",w=(d==null?void 0:d.disruptionPct)??0,k=w>10?"sc-disrupt-red":w>3?"sc-disrupt-yellow":"sc-disrupt-green",S=(d==null?void 0:d.riskLevel)==="critical"||(d==null?void 0:d.riskLevel)==="high"?"sc-disrupt-red":(d==null?void 0:d.riskLevel)==="elevated"||(d==null?void 0:d.riskLevel)==="moderate"?"sc-disrupt-yellow":"sc-disrupt-green",E=this.expandedChokepoint===c.name,R=E&&(d!=null&&d.riskReportAction)?`<div class="sc-routing-advisory">${n(d.riskReportAction)}</div>`:"",$=E&&(d==null?void 0:d.dataAvailable)!==!1?`<div data-chart-cp="${n(c.name)}" data-chart-cp-id="${n(c.id)}" style="margin-top:8px;min-height:200px;display:flex;align-items:center;justify-content:center;color:var(--text-dim,#888);font-size:calc(12px * var(--wm-panel-effective-scale, 1))">${i("components.supplyChain.loadingHistory")||"Loading transit history…"}</div>`:"",C=c.warRiskTier??"WAR_RISK_TIER_NORMAL",P={WAR_RISK_TIER_WAR_ZONE:"War Zone",WAR_RISK_TIER_CRITICAL:"Critical",WAR_RISK_TIER_HIGH:"High",WAR_RISK_TIER_ELEVATED:"Elevated",WAR_RISK_TIER_NORMAL:"Normal"},U=`<span class="sc-war-risk-badge sc-war-risk-badge--${{WAR_RISK_TIER_WAR_ZONE:"war",WAR_RISK_TIER_CRITICAL:"critical",WAR_RISK_TIER_HIGH:"high",WAR_RISK_TIER_ELEVATED:"elevated",WAR_RISK_TIER_NORMAL:"normal"}[C]??"normal"}">${P[C]??"Normal"}</span>`,F=E?`<div class="sc-bypass-section" data-bypass-cp="${n(c.id)}"><div class="sc-bypass-heading">Bypass Options</div><div class="sc-bypass-loading">Loading bypass options…</div></div>`:"",D=E?(()=>{var Rt;const x=Bt.find(At=>At.affectedChokepointIds.includes(c.id)&&At.type!=="tariff_shock");if(!x)return"";const j=pt(It()),K=((Rt=this.activeScenarioState)==null?void 0:Rt.scenarioId)===x.id,ct=["sc-scenario-btn",j?"":"sc-scenario-btn--gated",K?"sc-scenario-btn--active":""].filter(Boolean).join(" "),de=K?"Active":"Simulate Closure",pe=[j?"":'data-gated="1"',K?"disabled":""].filter(Boolean).join(" ");return`<div class="sc-scenario-trigger" data-scenario-id="${n(x.id)}" data-chokepoint-id="${n(c.id)}">
            <button class="${ct}" ${pe} aria-label="Simulate ${n(x.name)}">
              ${de}
            </button>
          </div>`})():"",_=p&&s!=null&&s>c.disruptionScore?`<span class="trade-badge">${c.disruptionScore}/100</span> <span class="trade-badge trade-badge--projected" style="background:#7f1d1d;color:#fff;margin-left:4px">→ ${s}/100</span>`:`<span class="trade-badge">${c.disruptionScore}/100</span>`;return`<div class="trade-restriction-card${E?" expanded":""}${p?" scenario-affected":""}" data-cp-id="${n(c.name)}" style="cursor:pointer${p?";border-left:3px solid #dc2626":""}">
          <div class="trade-restriction-header">
            <span class="trade-country">${n(c.name)}</span>
            <span class="sc-status-dot ${f}"></span>
            ${_}
            <span class="trade-status ${h}">${n(c.status)}</span>
          </div>
          <div class="trade-restriction-body">
            ${p&&(t!=null&&t.template)?`<div class="sc-metric-row" style="background:#7f1d1d22;padding:4px 6px;border-radius:3px;margin-bottom:4px;font-size:calc(11px * var(--wm-panel-effective-scale, 1))">
              <span style="color:#fca5a5;font-weight:600">⚠ Projected under scenario: ${t.template.disruptionPct}% closure for ${t.template.durationDays} days${t.template.costShockMultiplier>1?` (+${Math.round((t.template.costShockMultiplier-1)*100)}% cost)`:""}</span>
            </div>`:""}
            <div class="sc-metric-row">
              <span>${c.activeWarnings} ${i("components.supplyChain.warnings")} · ${v} ${i("components.supplyChain.aisDisruptions")}</span>
              ${(L=c.directions)!=null&&L.length?`<span>${c.directions.map(x=>n(x)).join("/")}</span>`:""}
            </div>
            ${d&&d.dataAvailable===!1?`<div class="sc-metric-row" style="opacity:0.5;font-size:calc(11px * var(--wm-panel-effective-scale, 1))"><span>${i("components.supplyChain.transitDataUnavailable")||"Transit data unavailable (upstream partial)"}</span></div>`:""}
            ${d&&d.dataAvailable!==!1&&(d.todayTotal>0||g||w>0)?`<div class="sc-metric-row">
              ${d.todayTotal>0?`<span>${d.todayTotal} ${i("components.supplyChain.vessels")}</span>`:""}
              ${g?`<span>${i("components.supplyChain.wowChange")}: ${y}</span>`:""}
              ${w>0?`<span>${i("components.supplyChain.disruption")}: <span class="${k}">${w.toFixed(1)}%</span></span>`:""}
            </div>`:""}
            ${d!=null&&d.riskLevel?`<div class="sc-metric-row">
              <span>${i("components.supplyChain.riskLevel")}: <span class="${S}">${n(d.riskLevel)}</span></span>
              <span>${d.incidentCount7d} ${i("components.supplyChain.incidents7d")}</span>
            </div>`:""}
            <div class="sc-metric-row">${U}</div>
            ${c.flowEstimate?(()=>{const x=c.flowEstimate,j=Math.round(x.flowRatio*100),K=x.disrupted||j<85?"#ef4444":j<95?"#f59e0b":"var(--text-dim,#888)",ct=x.hazardAlertLevel&&x.hazardAlertName?` <span style="background:#ea580c;color:#fff;font-size:calc(9px * var(--wm-panel-effective-scale, 1));padding:1px 5px;border-radius:3px;margin-left:4px">&#9888; ${n(x.hazardAlertName.toUpperCase())}</span>`:"";return`<div class="sc-metric-row" style="color:${K}">
                <span>~${x.currentMbd} mb/d <span style="opacity:0.7">(${j}% of ${x.baselineMbd} baseline)</span>${ct}</span>
              </div>`})():ls.has(c.id)?`<div class="sc-metric-row" style="color:var(--text-dim,#888);font-size:calc(11px * var(--wm-panel-effective-scale, 1));opacity:0.7">
                <span>${i("components.supplyChain.flowUnavailable")}</span>
              </div>`:""}
            ${c.description?`<div class="trade-description">${n(c.description)}</div>`:""}
            <div class="trade-affected">${c.affectedRoutes.slice(0,3).map(x=>n(x)).join(", ")}</div>
            ${R}
            ${$}
            ${F}
            ${D}
          </div>
        </div>`}).join("")}
    </div>`}renderShipping(){var s,o;const t=(o=(s=this.shippingData)==null?void 0:s.indices)==null?void 0:o.length,e=this.renderDisruptionSnapshot();return!t&&!e?`<div class="economic-empty">${i("components.supplyChain.noShipping")}</div>`:`<div class="trade-restrictions-list">
      ${e}
      ${t?this.renderFredIndices():""}
    </div>`}renderDisruptionSnapshot(){if(this.chokepointData===null)return`<div class="trade-sector" style="padding:8px;opacity:0.6">${i("components.supplyChain.loadingCorridors")}</div>`;const t=this.chokepointData.chokepoints;if(!(t!=null&&t.length))return"";const e=[...t].sort((r,c)=>c.disruptionScore-r.disruptionScore),s=e.filter(r=>r.disruptionScore>0),l=(s.length>0?s:e.slice(0,5)).map(r=>{const c=r.transitSummary,p=r.status==="red"?"sc-dot-red":r.status==="yellow"?"sc-dot-yellow":"sc-dot-green",h=(c==null?void 0:c.wowChangePct)??0,f=h!==0?`<span class="${h>=0?"change-positive":"change-negative"}">${h>=0?"▲":"▼"}${Math.abs(h).toFixed(1)}%</span>`:"-",v=(c==null?void 0:c.disruptionPct)??0,d=v>10?"sc-disrupt-red":v>3?"sc-disrupt-yellow":"sc-disrupt-green",m=(c==null?void 0:c.riskLevel)||"-",g=m==="critical"||m==="high"?"sc-disrupt-red":m==="elevated"||m==="moderate"?"sc-disrupt-yellow":"";return`<tr>
        <td><span class="sc-status-dot ${p}"></span> ${n(r.name)}</td>
        <td>${(c==null?void 0:c.todayTotal)??0}</td>
        <td>${f}</td>
        <td><span class="${d}">${v>0?v.toFixed(1)+"%":"-"}</span></td>
        <td>${g?`<span class="${g}">${n(m)}</span>`:n(m)}</td>
      </tr>`}).join("");return`<div style="margin-bottom:8px">
      <div class="trade-sector" style="font-weight:600;margin-bottom:4px">${i("components.supplyChain.corridorDisruption")}</div>
      <table class="sc-disruption-table">
        <thead><tr>
          <th>${i("components.supplyChain.corridor")}</th>
          <th>${i("components.supplyChain.vessels")}</th>
          <th>${i("components.supplyChain.wowChange")}</th>
          <th>${i("components.supplyChain.disruption")}</th>
          <th>${i("components.supplyChain.risk")}</th>
        </tr></thead>
        <tbody>${l}</tbody>
      </table>
    </div>`}renderFredIndices(){var r,c;if(Q()&&!J("supplyChain")||!((c=(r=this.shippingData)==null?void 0:r.indices)!=null&&c.length))return"";const t=new Set(["SCFI","CCFI"]),e=new Set(["BDI","BCI","BPI","BSI","BHSI"]),s=this.shippingData.indices.filter(p=>t.has(p.indexId)),o=this.shippingData.indices.filter(p=>e.has(p.indexId)),l=(p,h)=>{if(!h.length)return"";const f=h.map(v=>{const d=v.changePct>=0?"change-positive":"change-negative",m=v.changePct>=0?"▲":"▼",g=this.renderSparkline(v.history.map(w=>w.value),v.history.map(w=>w.date));return`<div class="trade-restriction-card">
          ${v.spikeAlert?`<div class="economic-warning">${i("components.supplyChain.spikeAlert")}</div>`:""}
          <div class="trade-restriction-header">
            <span class="trade-country">${n(v.name)}</span>
            <span class="trade-badge">${v.currentValue.toFixed(0)} ${n(v.unit)}</span>
            <span class="trade-flow-change ${d}">${m} ${Math.abs(v.changePct).toFixed(1)}%</span>
          </div>
          <div class="trade-restriction-body">
            ${g}
          </div>
        </div>`}).join("");return`<div class="trade-sector" style="font-weight:600;margin:8px 0 4px">${n(p)}</div>${f}`};return[l(i("components.supplyChain.containerRates"),s),l(i("components.supplyChain.bulkShipping"),o)].join("")}renderIndicators(){var l,r;if(Q()&&!J("supplyChain"))return"";if(!((r=(l=this.shippingData)==null?void 0:l.indices)!=null&&r.length))return`<div class="economic-empty">${i("components.supplyChain.noShipping")}</div>`;const t=new Set(["SCFI","CCFI"]),e=new Set(["BDI","BCI","BPI","BSI","BHSI"]),s=this.shippingData.indices.filter(c=>!t.has(c.indexId)&&!e.has(c.indexId));return s.length?`<div class="trade-restrictions-list">${s.map(c=>{const p=c.changePct>=0?"change-positive":"change-negative",h=c.changePct>=0?"▲":"▼",f=this.renderSparkline(c.history.map(d=>d.value),c.history.map(d=>d.date));return`<div class="trade-restriction-card">
          ${c.spikeAlert?`<div class="economic-warning">${i("components.supplyChain.spikeAlert")}</div>`:""}
          <div class="trade-restriction-header">
            <span class="trade-country">${n(c.name)}</span>
            <span class="trade-badge">${c.currentValue.toFixed(0)} ${n(c.unit)}</span>
            <span class="trade-flow-change ${p}">${h} ${Math.abs(c.changePct).toFixed(1)}%</span>
          </div>
          <div class="trade-restriction-body">
            ${f}
          </div>
        </div>`}).join("")}</div>`:`<div class="economic-empty">${i("components.supplyChain.noShipping")}</div>`}renderStress(){var h;if(!this.stressData||!((h=this.stressData.carriers)!=null&&h.length))return'<div class="economic-empty">Shipping stress data unavailable</div>';const{stressScore:t,stressLevel:e,carriers:s}=this.stressData,o=e==="critical"?"#e74c3c":e==="elevated"?"#e67e22":e==="moderate"?"#f1c40f":"#27ae60",l=Math.round(Math.min(100,Math.max(0,t))),c=`<div style="margin-bottom:12px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <span style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);text-transform:uppercase;letter-spacing:0.06em">Composite Stress Score</span>
        <span style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));font-weight:700;padding:2px 7px;border-radius:3px;background:${e==="critical"?"rgba(231,76,60,0.15)":e==="elevated"?"rgba(230,126,34,0.15)":e==="moderate"?"rgba(241,196,15,0.15)":"rgba(39,174,96,0.15)"};color:${o}">${n(e.toUpperCase())}</span>
      </div>
      <div style="position:relative;height:6px;border-radius:3px;background:rgba(255,255,255,0.08)">
        <div style="position:absolute;left:0;top:0;height:100%;width:${l}%;border-radius:3px;background:${o};transition:width 0.4s"></div>
      </div>
      <div style="text-align:right;font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);margin-top:2px">${t.toFixed(1)}/100</div>
    </div>`,p=s.map(f=>{var y;const v=f.changePct>=0?"change-positive":"change-negative",d=f.changePct>=0?"▲":"▼",m=f.carrierType==="etf"?"ETF":f.carrierType==="index"?"IDX":"CARR",g=((y=f.sparkline)==null?void 0:y.length)>=2?this.renderSparkline(f.sparkline):"";return`<div class="trade-restriction-card">
        <div class="trade-restriction-header">
          <span class="trade-country" style="font-size:calc(11px * var(--wm-panel-effective-scale, 1))">${n(f.symbol)}</span>
          <span style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));padding:1px 5px;border-radius:2px;background:rgba(255,255,255,0.06);color:var(--text-dim)">${m}</span>
          <span class="trade-badge">${f.price.toFixed(2)}</span>
          <span class="trade-flow-change ${v}">${d} ${Math.abs(f.changePct).toFixed(2)}%</span>
        </div>
        <div class="trade-restriction-body" style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">${n(f.name)}${g}</div>
      </div>`}).join("");return`<div class="trade-restrictions-list">${c}${p}</div>`}renderSparkline(t,e){if(t.length<2)return"";const s=Math.min(...t),l=Math.max(...t)-s||1,r=200,c=40,p=e!=null&&e.length?c+14:c,h=t.map((v,d)=>{const m=d/(t.length-1)*r,g=c-(v-s)/l*(c-4)-2;return`${m.toFixed(1)},${g.toFixed(1)}`}).join(" "),f=e!=null&&e.length?`
      <text x="0" y="${p-1}" fill="var(--text-dim,#888)" style="font-size:calc(9px * var(--wm-panel-effective-scale, 1))" text-anchor="start">${n(e[0].slice(0,7))}</text>
      <text x="${r}" y="${p-1}" fill="var(--text-dim,#888)" style="font-size:calc(9px * var(--wm-panel-effective-scale, 1))" text-anchor="end">${n(e[e.length-1].slice(0,7))}</text>
    `:"";return`<svg width="${r}" height="${p}" viewBox="0 0 ${r} ${p}" style="display:block;margin:4px 0">
      <polyline points="${h}" fill="none" stroke="var(--accent-primary, #4fc3f7)" stroke-width="1.5" />
      ${f}
    </svg>`}renderMinerals(){var s,o;const t=this.mineralProductionData;if((s=t==null?void 0:t.commodities)!=null&&s.length){const l=this.mineralsStage,r=t.commodities.map(p=>{const h=l==="refinery"?p.refinery:p.mine;if(!h)return`<tr>
            <td>${n(p.commodity)}</td>
            <td colspan="2">${n(i("components.supplyChain.stageUnavailable"))}</td>
          </tr>`;const f=h.countries.filter(y=>!y.withheld&&!y.residual&&y.share!=null).slice(0,3).map(y=>`${n(y.country)} ${(y.share??0).toFixed(0)}%`).join(", "),v=h.countries.find(y=>y.residual&&y.share!=null),d=v?` <span class="sc-mineral-residual">+${(v.share??0).toFixed(0)}% ${n(v.country||"other")}</span>`:"",m=h.withheldCount>0?` <span class="sc-risk-moderate">${n(i("components.supplyChain.withheldNote"))}</span>`:"",g=h.year&&h.year!==t.dataYear?` <span class="sc-mineral-vintage">(${n(String(h.year))})</span>`:"";return`<tr>
          <td>${n(p.commodity)}${g}</td>
          <td>${f||"—"}${d}${m}</td>
          <td>${h.hhi.toFixed(0)}</td>
        </tr>`}).join(""),c=t.dataYear?String(t.dataYear):"";return`<div class="trade-tariffs-table">
        <div class="panel-tabs" style="margin-bottom:8px">
          <button class="panel-tab ${l==="mine"?"active":""}" data-mineral-stage="mine">${i("components.supplyChain.mineStage")}</button>
          <button class="panel-tab ${l==="refinery"?"active":""}" data-mineral-stage="refinery">${i("components.supplyChain.refineryStage")}</button>
        </div>
        <p class="sc-mineral-caption">${i("components.supplyChain.productionCaption")}${c?` (${n(c)})`:""}</p>
        <table>
          <thead>
            <tr>
              <th>${i("components.supplyChain.mineral")}</th>
              <th>${i("components.supplyChain.topProducers")}</th>
              <th>HHI</th>
            </tr>
          </thead>
          <tbody>${r}</tbody>
        </table>
      </div>`}if(!this.mineralsData||!((o=this.mineralsData.minerals)!=null&&o.length))return`<div class="economic-empty">${i("components.supplyChain.noMinerals")}</div>`;const e=this.mineralsData.minerals.map(l=>{const r=l.riskRating==="critical"?"sc-risk-critical":l.riskRating==="high"?"sc-risk-high":l.riskRating==="moderate"?"sc-risk-moderate":"sc-risk-low",c=l.topProducers.slice(0,3).map(p=>`${n(p.country)} ${p.sharePct.toFixed(0)}%`).join(", ");return`<tr>
        <td>${n(l.mineral)}</td>
        <td>${c}</td>
        <td>${l.hhi.toFixed(0)}</td>
        <td><span class="${r}">${n(l.riskRating)}</span></td>
      </tr>`}).join("");return`<div class="trade-tariffs-table">
      <table>
        <thead>
          <tr>
            <th>${i("components.supplyChain.mineral")}</th>
            <th>${i("components.supplyChain.topProducers")}</th>
            <th>HHI</th>
            <th>${i("components.supplyChain.risk")}</th>
          </tr>
        </thead>
        <tbody>${e}</tbody>
      </table>
    </div>`}showScenarioSummary(t,e){this.activeScenarioState={scenarioId:t,result:e},this.render()}renderScenarioBanner(){var w,k;const t=this.activeScenarioState;if(!t)return;const{scenarioId:e,result:s}=t;(w=this.content.querySelector(".sc-scenario-banner"))==null||w.remove();const l=s.topImpactCountries.slice(0,5).map(S=>`<span class="sc-scenario-country">${n(S.iso2)} <em>${S.impactPct.toFixed(0)}%</em></span>`).join(" · "),r=document.createElement("div");r.className="sc-scenario-banner";const c=((k=Bt.find(S=>S.id===e))==null?void 0:k.name)??e.replace(/-/g," "),p=s.template,h=p?`${p.durationDays}d`:null,f=p?`${p.disruptionPct}% closure`:null,v=p?Math.round((p.costShockMultiplier-1)*100):null,d=v!=null&&v>0?`+${v}% cost`:null,m=[h,d].filter(Boolean).map(S=>`<span class="sc-scenario-param">${n(S)}</span>`).join(" · "),g=[h,f,d].filter(Boolean).join(" / "),y=g?`<div class="sc-scenario-tagline">Simulating ${n(g)} on ${s.affectedChokepointIds.length} chokepoint${s.affectedChokepointIds.length===1?"":"s"}. Chokepoint card below shows projected score; map highlights disrupted routes.</div>`:"";B(r,N(['<div class="sc-scenario-top">','<span class="sc-scenario-icon">⚠</span>',`<span class="sc-scenario-name">${n(c)}</span>`,m?`<span class="sc-scenario-params">${m}</span>`:"",`<span class="sc-scenario-countries">${l}</span>`,'<button class="sc-scenario-dismiss" aria-label="Dismiss scenario">×</button>',"</div>",y].join(""),"legacy direct innerHTML migration")),r.querySelector(".sc-scenario-dismiss").addEventListener("click",()=>{var S;return(S=this.onDismissScenario)==null?void 0:S.call(this)}),this.content.prepend(r)}hideScenarioSummary(){this.activeScenarioState=null,this.render()}setOnDismissScenario(t){this.onDismissScenario=t}setOnScenarioActivate(t){this.onScenarioActivate=t}async runScenario(t,e){var r,c;if(e.dataset.gated==="1"){Lt("scenario-engine");return}(r=this.scenarioPollController)==null||r.abort(),this.scenarioPollController=new AbortController;const{signal:s}=this.scenarioPollController,o=t.dataset.scenarioId;e.disabled=!0,e.textContent="Computing…";const l=p=>{e.isConnected&&(e.textContent=p,e.disabled=!1)};try{const p=AbortSignal.any([s,AbortSignal.timeout(2e4)]),f=(await Me({scenarioId:o,iso2:""},{signal:p})).jobId;let v=null;for(let d=0;d<60;d++){if(s.aborted){l("Simulate Closure");return}if(!this.content.isConnected)return;d>0&&await new Promise(g=>setTimeout(g,1e3));const m=await Le(f,{signal:s});if(m.status==="done"){const g=m.result;if(!g||!Array.isArray(g.topImpactCountries))throw new Error("done without valid result");v=g;break}if(m.status==="failed")throw new Error("Scenario failed")}if(!v)throw new Error("Timeout — scenario worker may be down");if(s.aborted){l("Simulate Closure");return}if(!this.content.isConnected)return;(c=this.onScenarioActivate)==null||c.call(this,o,v)}catch(p){if(p instanceof Error&&p.name==="AbortError"){l("Simulate Closure");return}console.error("[scenario] run failed:",p),l("Error — retry")}}}const fa=Object.freeze(Object.defineProperty({__proto__:null,SupplyChainPanel:ds},Symbol.toStringTag,{value:"Module"})),ie={port:"Ports",aviation:"Aviation",hazard:"Hazards",power_energy:"Power / energy",strategic_industry:"Strategic industry",trade:"Trade"},St={available:"Available",partial:"Partial",stale:"Stale",unavailable:"Unavailable"},ps="The active map renderer centers this corridor but cannot draw its boundary or nodes. Use the WebGL 2D map on a supported device to view the overlay.";function gt(a,u){if(!a||!Number.isFinite(Date.parse(a)))return"Time unavailable";const t=new Date(a);return u==="year"?String(t.getUTCFullYear()):u==="month"?t.toLocaleString(void 0,{year:"numeric",month:"short",timeZone:"UTC"}):u==="day"?t.toLocaleString(void 0,{year:"numeric",month:"short",day:"numeric",timeZone:"UTC"}):new Date(a).toLocaleString(void 0,{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"UTC",timeZoneName:"short"})}function us(a){var e;const u=a.sourceUrl?te(a.sourceUrl):"",t=u?`<a href="${n(u)}" target="_blank" rel="noopener noreferrer">${n(a.publisher.name)}</a>`:n(a.publisher.name);return`
    <li class="china-corridor-source" data-source-availability="${a.availability}">
      <div class="china-corridor-source__summary">${n(a.summary)}</div>
      <div class="china-corridor-source__meta">
        <span>${t}</span>
        <span>source ${n(a.availability)}</span>
        <span>observed ${n(gt(a.observationTime,a.observationTimePrecision))} (${n(a.observationTimePrecision)})</span>
        <span>released ${n(gt(a.releaseTime,a.releaseTimePrecision))} (${n(a.releaseTimePrecision)})</span>
        <span>retrieved ${n(gt(a.retrievalTime,a.retrievalTimePrecision))} (${n(a.retrievalTimePrecision)})</span>
        <span>transport ${n(a.transportFreshness)}</span>
        <span>content ${n(a.contentFreshness)}</span>
        <span>revision ${n(((e=a.revision)==null?void 0:e.state)??"unknown")}</span>
      </div>
    </li>`}function hs(a){const u=a.sourceSignals.length>0?`<ul class="china-corridor-sources">${a.sourceSignals.map(us).join("")}</ul>`:`<p class="china-corridor-missing">${n(a.reason??"No reviewed source signal is available.")}</p>`;return`
    <article class="china-corridor-condition" data-family="${a.family}" data-availability="${a.availability}">
      <header>
        <h4>${n(ie[a.family])}</h4>
        <span class="china-corridor-status china-corridor-status--${a.availability}">
          ${n(St[a.availability])}
        </span>
      </header>
      <div class="china-corridor-provider">Provider family: ${n(a.providerId)}</div>
      ${u}
    </article>`}class ms extends A{constructor(){super({id:"china-corridors",title:"China Logistics Corridors",className:"panel-wide",defaultRowSpan:2,infoTooltip:"Transparent control towers for four reviewed China logistics corridors. Each condition retains its own source, time, availability, and freshness; no aggregate risk score is produced."});b(this,"response",{generatedAt:"",corridors:[]});b(this,"selectedId",null);b(this,"selectedFamilies",new Set(dt));b(this,"onCorridorSelect",null);b(this,"showRendererHint",!1);this.content.addEventListener("click",t=>this.handleClick(t)),this.content.addEventListener("keydown",t=>this.handleKeydown(t))}setOnCorridorSelect(t){this.onCorridorSelect=t}setRendererSupportsOverlay(t){const e=!t;e!==this.showRendererHint&&(this.showRendererHint=e,this.selectedId!==null&&this.render())}async fetchData(){this.hasData()||this.showLoading();const t=await Re();return t.corridors.length===0?(this.hasData()||this.showError("China corridor data unavailable",()=>void this.fetchData()),!1):(this.setData(t),!0)}hasData(){return this.response.corridors.length>0}setData(t){var e;this.response=t,this.selectedId??(this.selectedId=((e=t.corridors[0])==null?void 0:e.id)??null),this.render()}selectedCorridor(){return this.response.corridors.find(t=>t.id===this.selectedId)??null}selectCorridor(t,e=!1){var l;const s=this.response.corridors.find(r=>r.id===t);if(!s)return;this.selectedId=s.id;const o=(l=this.onCorridorSelect)==null?void 0:l.call(this,s);this.showRendererHint=o===!1,this.render(()=>{var r;e&&((r=this.content.querySelector(`[role="tab"][data-corridor-id="${s.id}"]`))==null||r.focus())})}handleClick(t){const e=t.target,s=e.closest("[data-corridor-id]");if(s!=null&&s.dataset.corridorId){this.selectCorridor(s.dataset.corridorId);return}const o=e.closest("[data-family-filter]"),l=o==null?void 0:o.dataset.familyFilter;!l||!dt.includes(l)||(this.selectedFamilies.has(l)?this.selectedFamilies.delete(l):this.selectedFamilies.add(l),this.render())}handleKeydown(t){const e=t.target.closest('[role="tab"][data-corridor-id]');if(!e||!["ArrowRight","ArrowLeft","Home","End"].includes(t.key))return;const s=this.response.corridors.map(r=>r.id),o=s.indexOf(e.dataset.corridorId);if(o<0)return;t.preventDefault();let l;if(t.key==="Home")l=s[0];else if(t.key==="End")l=s[s.length-1];else{const r=t.key==="ArrowRight"?1:-1;l=s[(o+r+s.length)%s.length]}l&&this.selectCorridor(l,!0)}render(t){const e=this.selectedCorridor();if(!e)return;const s=this.response.corridors.map(r=>{const c=r.conditions.filter(p=>p.availability==="available").length;return`<button id="china-corridor-tab-${r.id}" role="tab" data-corridor-id="${r.id}" aria-selected="${r.id===e.id}" aria-controls="china-corridor-tabpanel" tabindex="${r.id===e.id?"0":"-1"}">
        <strong>${n(r.name)}</strong>
        <small>${c}/${r.conditions.length} families available · ${n(St[r.availability])}</small>
      </button>`}).join(""),o=dt.map(r=>`<button type="button" class="panel-tab china-corridor-filter${this.selectedFamilies.has(r)?" active":""}" data-family-filter="${r}" aria-pressed="${this.selectedFamilies.has(r)}">${n(ie[r])}</button>`).join(""),l=e.conditions.filter(r=>this.selectedFamilies.has(r.family)).map(hs).join("");this.setSafeContent(T(`
      <div class="china-corridor-panel">
        <div class="china-corridor-compare" role="tablist" aria-label="Compare China logistics corridors">${s}</div>
        <div class="panel-tabs china-corridor-filters" role="group" aria-label="Signal-family filters">${o}</div>
        <section id="china-corridor-tabpanel" role="tabpanel" aria-labelledby="china-corridor-tab-${e.id}">
          <div class="china-corridor-detail__heading">
            <div>
              <h3>${n(e.name)}</h3>
              <p class="china-corridor-description">${n(e.description)}</p>
            </div>
            <span class="china-corridor-status china-corridor-status--${e.availability}">${n(St[e.availability])}</span>
          </div>
          ${this.showRendererHint?`<p class="china-corridor-renderer-hint" role="status">${n(ps)}</p>`:""}
          <div class="china-corridor-conditions">${l||'<p class="china-corridor-missing">Select at least one signal family.</p>'}</div>
        </section>
      </div>
    `,"China corridor values are escaped before rendering"),t)}}const ga=Object.freeze(Object.defineProperty({__proto__:null,ChinaCorridorPanel:ms},Symbol.toStringTag,{value:"Module"}));class vs extends A{constructor(){super({id:"china-activity-nowcast",title:"China Activity Nowcast",className:"panel-wide",defaultRowSpan:2,infoTooltip:"A deterministic directional comparison of revision-aware official activity and reviewed proxy families. Missing and stale inputs are excluded; this is not a replacement GDP estimate."});b(this,"response",null)}async fetchData(){this.hasData()||this.showLoading();const t=await Fe();return this.setData(t),t.state!=="insufficient_data"}hasData(){return this.response!==null}setData(t){this.response=t,this.render()}render(){this.response!==null&&this.setSafeContent(T(_e(this.response),"China activity nowcast renderer escapes every dynamic value before constructing markup"))}}const ba=Object.freeze(Object.defineProperty({__proto__:null,ChinaActivityNowcastPanel:vs},Symbol.toStringTag,{value:"Module"}));function zt(a){return{ports:i("components.investments.sectors.ports"),pipelines:i("components.investments.sectors.pipelines"),energy:i("components.investments.sectors.energy"),datacenters:i("components.investments.sectors.datacenters"),airports:i("components.investments.sectors.airports"),railways:i("components.investments.sectors.railways"),telecoms:i("components.investments.sectors.telecoms"),water:i("components.investments.sectors.water"),logistics:i("components.investments.sectors.logistics"),mining:i("components.investments.sectors.mining"),"real-estate":i("components.investments.sectors.realEstate"),manufacturing:i("components.investments.sectors.manufacturing")}[a]||a}const fs={operational:"#22c55e","under-construction":"#f59e0b",announced:"#60a5fa",rumoured:"#a78bfa",cancelled:"#ef4444",divested:"#6b7280"},gs={SA:"🇸🇦",UAE:"🇦🇪"};function bs(a){return a===void 0?i("components.investments.undisclosed"):a>=1e5?`$${(a/1e3).toFixed(0)}B`:a>=1e3?`$${(a/1e3).toFixed(1)}B`:`$${a.toLocaleString()}M`}class ys extends A{constructor(t){super({id:"gcc-investments",title:i("panels.gccInvestments"),showCount:!0,infoTooltip:i("components.investments.infoTooltip")});b(this,"filters",{investingCountry:"ALL",sector:"ALL",entity:"ALL",status:"ALL",search:""});b(this,"sortKey","assetName");b(this,"sortAsc",!0);b(this,"filtersExpanded",!1);b(this,"onInvestmentClick");this.onInvestmentClick=t,this.setupEventDelegation(),this.render()}getFiltered(){const{investingCountry:t,sector:e,entity:s,status:o,search:l}=this.filters,r=l.toLowerCase();return tt.filter(c=>!(t!=="ALL"&&c.investingCountry!==t||e!=="ALL"&&c.sector!==e||s!=="ALL"&&c.investingEntity!==s||o!=="ALL"&&c.status!==o||r&&!c.assetName.toLowerCase().includes(r)&&!c.targetCountry.toLowerCase().includes(r)&&!c.description.toLowerCase().includes(r)&&!c.investingEntity.toLowerCase().includes(r))).sort((c,p)=>{const h=this.sortKey,f=c[h]??"",v=p[h]??"",d=f<v?-1:f>v?1:0;return this.sortAsc?d:-d})}render(){const t=this.getFiltered(),e=Nt(tt.map(d=>d.investingEntity)),s=Nt(tt.map(d=>d.sector)),o=d=>this.sortKey===d?"fdi-sort fdi-sort-active":"fdi-sort",l=(d,m)=>this.sortKey===d?`${m} ${this.sortAsc?"↑":"↓"}`:m,r=this.filters.investingCountry!=="ALL"||this.filters.sector!=="ALL"||this.filters.entity!=="ALL"||this.filters.status!=="ALL",c=t.map(d=>{const m=fs[d.status]||"#6b7280",g=gs[d.investingCountry]||"",y=zt(d.sector),w=d.yearAnnounced??d.yearOperational??"—";return`
        <div class="fdi-row" data-id="${n(d.id)}">
          <div class="fdi-row-line1">
            <span class="fdi-flag">${g}</span>
            <span class="fdi-asset-name">${n(d.assetName)}</span>
            <span class="fdi-entity-sub">${n(d.investingEntity)}</span>
            <span class="fdi-usd">${n(bs(d.investmentUSD))}</span>
          </div>
          <div class="fdi-row-line2">
            <span class="fdi-country">${n(d.targetCountry)}</span>
            <span class="fdi-sector-badge">${n(y)}</span>
            <span class="fdi-status-label"><span class="fdi-status-dot" style="background:${m}"></span>${n(d.status)}</span>
            <span class="fdi-year">${w}</span>
          </div>
        </div>`}).join(""),p=this.filtersExpanded||r?"fdi-filter-toggle fdi-filters-active":"fdi-filter-toggle",h=this.filtersExpanded?"fdi-filters fdi-filters-open":"fdi-filters",f=d=>this.filters.status===d?" selected":"",v=`
      <div class="fdi-search-row">
        <input class="fdi-search" type="text"
          placeholder="${i("components.investments.searchPlaceholder")}"
          value="${n(this.filters.search)}"/>
        <button class="${p}" data-action="toggle-filters" title="Filters" aria-label="Toggle filters" aria-pressed="${this.filtersExpanded}">⚙</button>
      </div>
      <div class="${h}">
        <select class="fdi-filter" data-filter="investingCountry">
          <option value="ALL">🌐 ${i("components.investments.allCountries")}</option>
          <option value="SA"${this.filters.investingCountry==="SA"?" selected":""}>🇸🇦 ${i("components.investments.saudiArabia")}</option>
          <option value="UAE"${this.filters.investingCountry==="UAE"?" selected":""}>🇦🇪 ${i("components.investments.uae")}</option>
        </select>
        <select class="fdi-filter" data-filter="sector">
          <option value="ALL">${i("components.investments.allSectors")}</option>
          ${s.map(d=>`<option value="${d}"${this.filters.sector===d?" selected":""}>${n(zt(d))}</option>`).join("")}
        </select>
        <select class="fdi-filter" data-filter="entity">
          <option value="ALL">${i("components.investments.allEntities")}</option>
          ${e.map(d=>`<option value="${n(d)}"${this.filters.entity===d?" selected":""}>${n(d)}</option>`).join("")}
        </select>
        <select class="fdi-filter" data-filter="status">
          <option value="ALL">${i("components.investments.allStatuses")}</option>
          <option value="operational"${f("operational")}>${i("components.investments.operational")}</option>
          <option value="under-construction"${f("under-construction")}>${i("components.investments.underConstruction")}</option>
          <option value="announced"${f("announced")}>${i("components.investments.announced")}</option>
          <option value="rumoured"${f("rumoured")}>${i("components.investments.rumoured")}</option>
          <option value="divested"${f("divested")}>${i("components.investments.divested")}</option>
        </select>
        <div class="fdi-sort-pills">
          <button class="${o("assetName")}" data-sort="assetName">${l("assetName",i("components.investments.asset"))}</button>
          <button class="${o("investmentUSD")}" data-sort="investmentUSD">${l("investmentUSD",i("components.investments.investment"))}</button>
          <button class="${o("targetCountry")}" data-sort="targetCountry">${l("targetCountry",i("components.investments.country"))}</button>
          <button class="${o("yearAnnounced")}" data-sort="yearAnnounced">${l("yearAnnounced",i("components.investments.year"))}</button>
        </div>
      </div>
      <div class="fdi-list">
        ${c||`<div class="fdi-empty">${i("components.investments.noMatch")}</div>`}
      </div>`;this.setSafeContent(T(v,"legacy Panel.setContent() migration")),this.countEl&&(this.countEl.textContent=String(t.length))}setupEventDelegation(){this.content.addEventListener("input",t=>{const e=t.target;e.classList.contains("fdi-search")&&(this.filters.search=e.value,this.render())}),this.content.addEventListener("change",t=>{const e=t.target.closest(".fdi-filter");if(e){const s=e.dataset.filter;this.filters[s]=e.value,this.render()}}),this.content.addEventListener("click",t=>{const e=t.target;if(e.closest('[data-action="toggle-filters"]')){this.filtersExpanded=!this.filtersExpanded,this.render();return}const o=e.closest(".fdi-sort");if(o){const r=o.dataset.sort;this.sortKey===r?this.sortAsc=!this.sortAsc:(this.sortKey=r,this.sortAsc=!0),this.render();return}const l=e.closest(".fdi-row");if(l){const r=tt.find(c=>c.id===l.dataset.id);r&&this.onInvestmentClick&&this.onInvestmentClick(r)}})}}const ya=Object.freeze(Object.defineProperty({__proto__:null,InvestmentsPanel:ys},Symbol.toStringTag,{value:"Module"})),Vt=rt(()=>new Ue(ot(),{fetch:Ae}));function bt(a,u){if(u.length===0)return"";const t=u.map(e=>`
    <div class="market-item">
      <div class="market-info">
        <span class="market-name">${e.flag} ${n(e.name)}</span>
        <span class="market-symbol">${n(e.country||e.symbol)}</span>
      </div>
      <div class="market-data">
        ${ye(e.sparkline,e.change)}
        <span class="market-price">${Be(e.price)}</span>
        <span class="market-change ${Ne(e.change)}">${Oe(e.change)}</span>
      </div>
    </div>
  `).join("");return`<div class="gulf-section"><div class="gulf-section-title">${n(a)}</div>${t}</div>`}class $s extends A{constructor(){super({id:"gulf-economies",title:i("panels.gulfEconomies"),infoTooltip:i("components.gulfEconomies.infoTooltip")})}async fetchData(){var u,t,e,s;try{const o=O("gulfQuotes");if((u=o==null?void 0:o.quotes)!=null&&u.length){if(!((t=this.element)!=null&&t.isConnected))return;this.renderGulf(o),Vt().listGulfQuotes({}).then(r=>{var c,p;!((c=this.element)!=null&&c.isConnected)||!((p=r.quotes)!=null&&p.length)||this.renderGulf(r)}).catch(()=>{});return}const l=await Vt().listGulfQuotes({});if(!((e=this.element)!=null&&e.isConnected))return;this.renderGulf(l)}catch(o){if(this.isAbortError(o)||!((s=this.element)!=null&&s.isConnected))return;this.showError(i("common.failedMarketData"),()=>void this.fetchData())}}renderGulf(u){var l;if(!((l=u.quotes)!=null&&l.length)){const r=u.rateLimited?i("common.rateLimitedMarket"):i("common.failedMarketData");this.showError(r,()=>void this.fetchData());return}const t=u.quotes.filter(r=>r.type==="index"),e=u.quotes.filter(r=>r.type==="currency"),s=u.quotes.filter(r=>r.type==="oil"),o=bt(i("panels.gulfIndices"),t)+bt(i("panels.gulfCurrencies"),e)+bt(i("panels.gulfOil"),s);this.setSafeContent(T(o,"legacy Panel.setContent() migration"))}}const $a=Object.freeze(Object.defineProperty({__proto__:null,GulfEconomiesPanel:$s},Symbol.toStringTag,{value:"Module"})),Kt=rt(()=>new kt(ot(),{fetch:Et}));class ws extends A{constructor(){super({id:"grocery-basket",title:i("panels.groceryBasket"),infoTooltip:i("components.groceryBasket.infoTooltip")})}async fetchData(){var u,t,e,s;try{const o=O("groceryBasket");if((u=o==null?void 0:o.countries)!=null&&u.length){if(!((t=this.element)!=null&&t.isConnected))return;this.renderBasket(o),Kt().listGroceryBasketPrices({}).then(r=>{var c,p;!((c=this.element)!=null&&c.isConnected)||!((p=r.countries)!=null&&p.length)||this.renderBasket(r)}).catch(()=>{});return}const l=await Kt().listGroceryBasketPrices({});if(!((e=this.element)!=null&&e.isConnected))return;this.renderBasket(l)}catch(o){if(this.isAbortError(o)||!((s=this.element)!=null&&s.isConnected))return;this.showError(i("common.failedMarketData"),()=>void this.fetchData())}}renderBasket(u){var h,f,v;if(!((h=u.countries)!=null&&h.length)){this.showError(i("common.failedMarketData"),()=>void this.fetchData());return}const t=u.countries,e=((v=(f=t[0])==null?void 0:f.items)==null?void 0:v.map(d=>d.itemId))??[],s=t.map(d=>`<th class="gb-country-header" title="${n(d.name)}">${n(d.flag)}<br><span class="gb-country-name">${n(d.name)}</span></th>`).join(""),o=e.map(d=>{var E,R;const m=(R=(E=t[0])==null?void 0:E.items)==null?void 0:R.find($=>$.itemId===d),g=t.map($=>{var C,P;return(P=(C=$.items)==null?void 0:C.find(I=>I.itemId===d))==null?void 0:P.usdPrice}).filter($=>$!=null&&$>0),y=g.length>1?Math.min(...g):null,w=g.length>1?Math.max(...g):null,k=.001,S=t.map($=>{var F;const C=(F=$.items)==null?void 0:F.find(D=>D.itemId===d);if(!(C!=null&&C.available)||!C.usdPrice||!C.localPrice)return'<td class="gb-cell gb-na">—</td>';const P=w!==null&&Math.abs(C.usdPrice-w)<k;return`<td class="gb-cell ${y!==null&&Math.abs(C.usdPrice-y)<k?"gb-cheapest":P?"gb-priciest":""}">$${C.usdPrice.toFixed(2)}<span class="gb-local">${C.localPrice.toFixed(2)} ${n($.currency)}</span></td>`}).join("");return`<tr><td class="gb-item-name">${n((m==null?void 0:m.itemName)??d)}<span class="gb-unit">${n((m==null?void 0:m.unit)??"")}</span></td>${S}</tr>`}).join(""),l=`<tr class="gb-total-row"><td class="gb-item-name"><strong>Total</strong></td>${t.map(d=>{const m=d.code===u.cheapestCountry,g=d.code===u.mostExpensiveCountry,y=m?"gb-cheapest":g?"gb-priciest":"";let w="";if(d.wowPct!=null){const k=d.wowPct>=0?"▲":"▼";w=`<span class="gb-wow ${d.wowPct>=0?"bm-wow-up":"bm-wow-down"}">${k}${Math.abs(d.wowPct).toFixed(1)}%</span>`}return`<td class="gb-cell gb-total ${y}"><strong>$${d.totalUsd.toFixed(2)}</strong>${w}</td>`}).join("")}</tr>`;let r="";if(u.wowAvailable&&u.wowAvgPct!==void 0){const d=u.wowAvgPct,m=d>=0?"▲":"▼";r=`<div class="bm-wow-summary">Basket avg: <span class="${d>=0?"bm-wow-up":"bm-wow-down"}">${m}${Math.abs(d).toFixed(1)}% WoW</span></div>`}const c=u.fetchedAt?new Date(u.fetchedAt).toLocaleDateString():"",p=`
      <div class="gb-wrapper">
        ${r}
        <div class="gb-scroll">
          <table class="gb-table">
            <thead><tr><th class="gb-item-col">${i("panels.groceryItem")}</th>${s}</tr></thead>
            <tbody>${o}${l}</tbody>
          </table>
        </div>
        ${c?`<div class="gb-updated">${i("components.status.updatedAt",{time:c})}</div>`:""}
      </div>
    `;this.setSafeContent(T(p,"legacy Panel.setContent() migration"))}}const wa=Object.freeze(Object.defineProperty({__proto__:null,GroceryBasketPanel:ws},Symbol.toStringTag,{value:"Module"})),Wt=rt(()=>new kt(ot(),{fetch:Et}));class Cs extends A{constructor(){super({id:"bigmac",title:i("panels.bigmac"),infoTooltip:i("components.bigmac.infoTooltip")})}async fetchData(){var u,t,e,s;try{const o=O("bigmac");if((u=o==null?void 0:o.countries)!=null&&u.length){if(!((t=this.element)!=null&&t.isConnected))return;this.renderIndex(o),Wt().listBigMacPrices({}).then(r=>{var c,p;!((c=this.element)!=null&&c.isConnected)||!((p=r.countries)!=null&&p.length)||this.renderIndex(r)}).catch(()=>{});return}const l=await Wt().listBigMacPrices({});if(!((e=this.element)!=null&&e.isConnected))return;this.renderIndex(l)}catch(o){if(this.isAbortError(o)||!((s=this.element)!=null&&s.isConnected))return;this.showError(i("common.failedMarketData"),()=>void this.fetchData())}}renderIndex(u){var f,v,d;if(!((f=u.countries)!=null&&f.length)){this.showError(i("common.failedMarketData"),()=>void this.fetchData());return}const t=[...u.countries].filter(m=>m.usdPrice!=null&&m.usdPrice>0).sort((m,g)=>g.usdPrice-m.usdPrice),e=(v=t[0])==null?void 0:v.code,s=(d=t[t.length-1])==null?void 0:d.code,o=u.wowAvailable&&u.wowAvgPct!==void 0,l=o?`<th class="gb-cell">${i("panels.bigmacWow")}</th>`:"",r=t.map(m=>{const g=m.code===s?"gb-cheapest":m.code===e?"gb-priciest":"";let y="";if(o){const w=m.wowPct??null;if(w==null)y='<td class="gb-cell gb-na">—</td>';else{const k=w>=0?"▲":"▼";y=`<td class="gb-cell ${w>=0?"bm-wow-up":"bm-wow-down"}">${k}${Math.abs(w).toFixed(1)}%</td>`}}return`<tr>
        <td class="gb-item-name">${n(m.flag)} ${n(m.name)}</td>
        <td class="gb-cell ${g}">$${m.usdPrice.toFixed(2)}</td>
        ${y}
      </tr>`}).join("");let c="";if(o){const m=u.wowAvgPct,g=m>=0?"▲":"▼";c=`<div class="bm-wow-summary">Global avg: <span class="${m>=0?"bm-wow-up":"bm-wow-down"}">${g}${Math.abs(m).toFixed(1)}% ${i("panels.bigmacWow")}</span></div>`}const p=u.fetchedAt?new Date(u.fetchedAt).toLocaleDateString():"",h=`
      <div class="gb-wrapper">
        ${c}
        <div class="gb-scroll">
          <table class="gb-table">
            <thead><tr>
              <th class="gb-item-col">${i("panels.bigmacCountry")}</th>
              <th class="gb-cell">USD</th>
              ${l}
            </tr></thead>
            <tbody>${r}</tbody>
          </table>
        </div>
        ${p?`<div class="gb-updated">${i("components.status.updatedAt",{time:p})}</div>`:""}
      </div>
    `;this.setSafeContent(T(h,"legacy Panel.setContent() migration"))}}const Ca=Object.freeze(Object.defineProperty({__proto__:null,BigMacPanel:Cs},Symbol.toStringTag,{value:"Module"})),Yt=rt(()=>new kt(ot(),{fetch:Et})),xt=480,Tt=140,X=36,ne=12,re=8,oe=20,qt=xt-X-ne,Zt=Tt-re-oe,Dt=[{key:"ffpi",color:"#f5a623",label:"Food"},{key:"cereals",color:"#7ed321",label:"Cereals"},{key:"meat",color:"#e86c6c",label:"Meat"},{key:"dairy",color:"#74c8e8",label:"Dairy"},{key:"oils",color:"#b57ce8",label:"Oils"},{key:"sugar",color:"#f0c36a",label:"Sugar"}];function ce(a,u){return u<=1?X+qt/2:X+a/(u-1)*qt}function le(a,u,t){const e=t-u||1;return re+Zt-(a-u)/e*Zt}function Ss(a,u,t,e){return a.map((o,l)=>{const r=o[u];return!Number.isFinite(r)||r<=0?null:`${ce(l,a.length).toFixed(1)},${le(r,t,e).toFixed(1)}`}).filter(Boolean).join(" ")}function xs(a){if(!a.length)return"";const u=[];for(const r of a)for(const c of Dt){const p=r[c.key];Number.isFinite(p)&&p>0&&u.push(p)}const t=Math.floor(Math.min(...u)*.96),e=Math.ceil(Math.max(...u)*1.02),s=[0,1,2,3].map(r=>{const c=t+(e-t)/3*r,p=le(c,t,e);return`
      <line x1="${X}" y1="${p.toFixed(1)}" x2="${xt-ne}" y2="${p.toFixed(1)}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
      <text x="${(X-3).toFixed(0)}" y="${p.toFixed(1)}" text-anchor="end" fill="rgba(255,255,255,0.35)" style="font-size:calc(8px * var(--wm-panel-effective-scale, 1))" dominant-baseline="middle">${c.toFixed(0)}</text>`}).join(""),o=a.map((r,c)=>{if(c%3!==0&&c!==a.length-1)return"";const p=ce(c,a.length),h=r.date;return`<text x="${p.toFixed(1)}" y="${Tt-oe+12}" text-anchor="middle" fill="rgba(255,255,255,0.4)" style="font-size:calc(7px * var(--wm-panel-effective-scale, 1))">${n(h)}</text>`}).join(""),l=Dt.map(r=>{const c=Ss(a,r.key,t,e);return c?`<polyline points="${c}" fill="none" stroke="${r.color}" stroke-width="${r.key==="ffpi"?2:1.2}" opacity="${r.key==="ffpi"?1:.7}"/>`:""}).join("");return`<svg viewBox="0 0 ${xt} ${Tt}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block">${s}${o}${l}</svg>`}function Ts(){return Dt.map(a=>`<span class="fao-legend-item"><span class="fao-legend-dot" style="background:${a.color}"></span>${n(i(`components.faoFoodPriceIndex.${a.key}`))}</span>`).join("")}class Ds extends A{constructor(){super({id:"fao-food-price-index",title:i("panels.faoFoodPriceIndex"),infoTooltip:i("components.faoFoodPriceIndex.infoTooltip")})}async fetchData(){var u,t,e,s;try{const o=O("faoFoodPriceIndex");if((u=o==null?void 0:o.points)!=null&&u.length){if(!((t=this.element)!=null&&t.isConnected))return;this.renderChart(o),Yt().getFaoFoodPriceIndex({}).then(r=>{var c,p;!((c=this.element)!=null&&c.isConnected)||!((p=r.points)!=null&&p.length)||this.renderChart(r)}).catch(()=>{});return}const l=await Yt().getFaoFoodPriceIndex({});if(!((e=this.element)!=null&&e.isConnected))return;this.renderChart(l)}catch(o){if(this.isAbortError(o)||!((s=this.element)!=null&&s.isConnected))return;this.showError(i("common.failedMarketData"),()=>void this.fetchData())}}renderChart(u){var f;if(!((f=u.points)!=null&&f.length)){this.showError(i("common.failedMarketData"),()=>void this.fetchData());return}const t=u.momPct>=0?"+":"",e=u.yoyPct>=0?"+":"",s=u.momPct>=0?"fao-up":"fao-down",o=u.yoyPct>=0?"fao-up":"fao-down",l=u.points[u.points.length-1],r=`
      <div class="fao-headline">
        <div class="fao-headline-primary">
          <span class="fao-index-value">${u.currentFfpi.toFixed(1)}</span>
          <span class="fao-index-label">${n(i("components.faoFoodPriceIndex.indexLabel"))}</span>
        </div>
        <div class="fao-headline-changes">
          <span class="fao-change ${s}">${t}${u.momPct.toFixed(1)}% ${n(i("components.faoFoodPriceIndex.mom"))}</span>
          <span class="fao-change ${o}">${e}${u.yoyPct.toFixed(1)}% ${n(i("components.faoFoodPriceIndex.yoy"))}</span>
        </div>
        <div class="fao-as-of">${n(i("components.faoFoodPriceIndex.asOf"))} ${n((l==null?void 0:l.date)??"")}</div>
      </div>`,c=xs(u.points),p=`<div class="fao-legend">${Ts()}</div>`,h=`<div class="fao-base-note">${n(i("components.faoFoodPriceIndex.baseNote"))}</div>`;this.setSafeContent(T(`<div class="fao-food-price-index-panel">${r}${c}${p}${h}</div>`,"legacy Panel.setContent() migration"))}}const Sa=Object.freeze(Object.defineProperty({__proto__:null,FaoFoodPriceIndexPanel:Ds},Symbol.toStringTag,{value:"Module"})),Ps={AFG:"🇦🇫",ALB:"🇦🇱",DZA:"🇩🇿",AGO:"🇦🇴",ARG:"🇦🇷",ARM:"🇦🇲",AUS:"🇦🇺",AUT:"🇦🇹",AZE:"🇦🇿",BHS:"🇧🇸",BHR:"🇧🇭",BGD:"🇧🇩",BLR:"🇧🇾",BEL:"🇧🇪",BLZ:"🇧🇿",BEN:"🇧🇯",BTN:"🇧🇹",BOL:"🇧🇴",BIH:"🇧🇦",BWA:"🇧🇼",BRA:"🇧🇷",BRN:"🇧🇳",BGR:"🇧🇬",BFA:"🇧🇫",BDI:"🇧🇮",CPV:"🇨🇻",KHM:"🇰🇭",CMR:"🇨🇲",CAN:"🇨🇦",CAF:"🇨🇫",TCD:"🇹🇩",CHL:"🇨🇱",CHN:"🇨🇳",COL:"🇨🇴",COM:"🇰🇲",COD:"🇨🇩",COG:"🇨🇬",CRI:"🇨🇷",CIV:"🇨🇮",HRV:"🇭🇷",CYP:"🇨🇾",CZE:"🇨🇿",DNK:"🇩🇰",DJI:"🇩🇯",DOM:"🇩🇴",ECU:"🇪🇨",EGY:"🇪🇬",SLV:"🇸🇻",GNQ:"🇬🇶",ERI:"🇪🇷",EST:"🇪🇪",SWZ:"🇸🇿",ETH:"🇪🇹",FJI:"🇫🇯",FIN:"🇫🇮",FRA:"🇫🇷",GAB:"🇬🇦",GMB:"🇬🇲",GEO:"🇬🇪",DEU:"🇩🇪",GHA:"🇬🇭",GRC:"🇬🇷",GTM:"🇬🇹",GIN:"🇬🇳",GNB:"🇬🇼",GUY:"🇬🇾",HTI:"🇭🇹",HND:"🇭🇳",HKG:"🇭🇰",HUN:"🇭🇺",ISL:"🇮🇸",IND:"🇮🇳",IDN:"🇮🇩",IRN:"🇮🇷",IRQ:"🇮🇶",IRL:"🇮🇪",ISR:"🇮🇱",ITA:"🇮🇹",JAM:"🇯🇲",JPN:"🇯🇵",JOR:"🇯🇴",KAZ:"🇰🇿",KEN:"🇰🇪",KOR:"🇰🇷",KWT:"🇰🇼",KGZ:"🇰🇬",LAO:"🇱🇦",LVA:"🇱🇻",LBN:"🇱🇧",LSO:"🇱🇸",LBR:"🇱🇷",LBY:"🇱🇾",LTU:"🇱🇹",LUX:"🇱🇺",MAC:"🇲🇴",MDG:"🇲🇬",MWI:"🇲🇼",MYS:"🇲🇾",MDV:"🇲🇻",MLI:"🇲🇱",MLT:"🇲🇹",MRT:"🇲🇷",MUS:"🇲🇺",MEX:"🇲🇽",MDA:"🇲🇩",MNG:"🇲🇳",MNE:"🇲🇪",MAR:"🇲🇦",MOZ:"🇲🇿",MMR:"🇲🇲",NAM:"🇳🇦",NPL:"🇳🇵",NLD:"🇳🇱",NZL:"🇳🇿",NIC:"🇳🇮",NER:"🇳🇪",NGA:"🇳🇬",MKD:"🇲🇰",NOR:"🇳🇴",OMN:"🇴🇲",PAK:"🇵🇰",PAN:"🇵🇦",PNG:"🇵🇬",PRY:"🇵🇾",PER:"🇵🇪",PHL:"🇵🇭",POL:"🇵🇱",PRT:"🇵🇹",QAT:"🇶🇦",ROU:"🇷🇴",RUS:"🇷🇺",RWA:"🇷🇼",SAU:"🇸🇦",SEN:"🇸🇳",SRB:"🇷🇸",SLE:"🇸🇱",SGP:"🇸🇬",SVK:"🇸🇰",SVN:"🇸🇮",SOM:"🇸🇴",ZAF:"🇿🇦",SSD:"🇸🇸",ESP:"🇪🇸",LKA:"🇱🇰",SDN:"🇸🇩",SUR:"🇸🇷",SWE:"🇸🇪",CHE:"🇨🇭",TWN:"🇹🇼",TJK:"🇹🇯",TZA:"🇹🇿",THA:"🇹🇭",TLS:"🇹🇱",TGO:"🇹🇬",TTO:"🇹🇹",TUN:"🇹🇳",TUR:"🇹🇷",TKM:"🇹🇲",UGA:"🇺🇬",UKR:"🇺🇦",ARE:"🇦🇪",GBR:"🇬🇧",USA:"🇺🇸",URY:"🇺🇾",UZB:"🇺🇿",VEN:"🇻🇪",VNM:"🇻🇳",YEM:"🇾🇪",ZMB:"🇿🇲",ZWE:"🇿🇼"},ks={AFG:"Afghanistan",ALB:"Albania",DZA:"Algeria",AGO:"Angola",ARG:"Argentina",ARM:"Armenia",AUS:"Australia",AUT:"Austria",AZE:"Azerbaijan",BHS:"Bahamas",BHR:"Bahrain",BGD:"Bangladesh",BLR:"Belarus",BEL:"Belgium",BLZ:"Belize",BEN:"Benin",BTN:"Bhutan",BOL:"Bolivia",BIH:"Bosnia & Herzegovina",BWA:"Botswana",BRA:"Brazil",BRN:"Brunei",BGR:"Bulgaria",BFA:"Burkina Faso",BDI:"Burundi",CPV:"Cabo Verde",KHM:"Cambodia",CMR:"Cameroon",CAN:"Canada",CAF:"Central African Rep.",TCD:"Chad",CHL:"Chile",CHN:"China",COL:"Colombia",COM:"Comoros",COD:"Dem. Rep. Congo",COG:"Congo",CRI:"Costa Rica",CIV:"Cote d'Ivoire",HRV:"Croatia",CYP:"Cyprus",CZE:"Czech Republic",DNK:"Denmark",DJI:"Djibouti",DOM:"Dominican Rep.",ECU:"Ecuador",EGY:"Egypt",SLV:"El Salvador",GNQ:"Equatorial Guinea",ERI:"Eritrea",EST:"Estonia",SWZ:"Eswatini",ETH:"Ethiopia",FJI:"Fiji",FIN:"Finland",FRA:"France",GAB:"Gabon",GMB:"Gambia",GEO:"Georgia",DEU:"Germany",GHA:"Ghana",GRC:"Greece",GTM:"Guatemala",GIN:"Guinea",GNB:"Guinea-Bissau",GUY:"Guyana",HTI:"Haiti",HND:"Honduras",HKG:"Hong Kong SAR",HUN:"Hungary",ISL:"Iceland",IND:"India",IDN:"Indonesia",IRN:"Iran",IRQ:"Iraq",IRL:"Ireland",ISR:"Israel",ITA:"Italy",JAM:"Jamaica",JPN:"Japan",JOR:"Jordan",KAZ:"Kazakhstan",KEN:"Kenya",KOR:"Korea (South)",KWT:"Kuwait",KGZ:"Kyrgyzstan",LAO:"Laos",LVA:"Latvia",LBN:"Lebanon",LSO:"Lesotho",LBR:"Liberia",LBY:"Libya",LTU:"Lithuania",LUX:"Luxembourg",MAC:"Macao SAR",MDG:"Madagascar",MWI:"Malawi",MYS:"Malaysia",MDV:"Maldives",MLI:"Mali",MLT:"Malta",MRT:"Mauritania",MUS:"Mauritius",MEX:"Mexico",MDA:"Moldova",MNG:"Mongolia",MNE:"Montenegro",MAR:"Morocco",MOZ:"Mozambique",MMR:"Myanmar",NAM:"Namibia",NPL:"Nepal",NLD:"Netherlands",NZL:"New Zealand",NIC:"Nicaragua",NER:"Niger",NGA:"Nigeria",MKD:"North Macedonia",NOR:"Norway",OMN:"Oman",PAK:"Pakistan",PAN:"Panama",PNG:"Papua New Guinea",PRY:"Paraguay",PER:"Peru",PHL:"Philippines",POL:"Poland",PRT:"Portugal",QAT:"Qatar",ROU:"Romania",RUS:"Russia",RWA:"Rwanda",SAU:"Saudi Arabia",SEN:"Senegal",SRB:"Serbia",SLE:"Sierra Leone",SGP:"Singapore",SVK:"Slovakia",SVN:"Slovenia",SOM:"Somalia",ZAF:"South Africa",SSD:"South Sudan",ESP:"Spain",LKA:"Sri Lanka",SDN:"Sudan",SUR:"Suriname",SWE:"Sweden",CHE:"Switzerland",TWN:"Taiwan",TJK:"Tajikistan",TZA:"Tanzania",THA:"Thailand",TLS:"Timor-Leste",TGO:"Togo",TTO:"Trinidad & Tobago",TUN:"Tunisia",TUR:"Turkey",TKM:"Turkmenistan",UGA:"Uganda",UKR:"Ukraine",ARE:"United Arab Emirates",GBR:"United Kingdom",USA:"United States",URY:"Uruguay",UZB:"Uzbekistan",VEN:"Venezuela",VNM:"Vietnam",YEM:"Yemen",ZMB:"Zambia",ZWE:"Zimbabwe"};function Es(a){return Ps[a]??"🌐"}function Qt(a){return ks[a]??a}function et(a){return!Number.isFinite(a)||a<=0?"$0":a>=1e12?`$${(a/1e12).toFixed(1)}T`:a>=1e9?`$${(a/1e9).toFixed(1)}B`:a>=1e6?`$${(a/1e6).toFixed(1)}M`:`$${Math.round(a).toLocaleString()}`}function Z(a){if(!a.perSecondRate||!a.baselineTs)return a.debtUsd??0;const u=(Date.now()-Number(a.baselineTs))/1e3;return(a.debtUsd??0)+a.perSecondRate*u}function Rs(a,u){const t=[...a];return u==="total"?t.sort((e,s)=>Z(s)-Z(e)):u==="gdp-ratio"?t.sort((e,s)=>(s.debtToGdp??0)-(e.debtToGdp??0)):u==="growth"&&t.sort((e,s)=>(s.annualGrowth??0)-(e.annualGrowth??0)),t}const q=20,nt=class nt extends A{constructor(){super({id:"national-debt",title:"National Debt Clock",showCount:!0,infoTooltip:"Live national debt estimates for 150+ countries. Data anchored at 2024-01-01 and accruing using IMF deficit projections."});b(this,"entries",[]);b(this,"filteredEntries",[]);b(this,"sortMode","total");b(this,"searchQuery","");b(this,"loading",!1);b(this,"lastFetch",0);b(this,"visibleCount",q);b(this,"tickerInterval",null);b(this,"tickerElements",new Map);b(this,"lastTickerValues",new Map);b(this,"connectRefreshQueued",!1);b(this,"connectionObserver",null);b(this,"connectRetryFrames",0);b(this,"REFRESH_INTERVAL",360*60*1e3);this.content.addEventListener("click",t=>{const e=t.target,s=e.closest("[data-sort]");if(s!=null&&s.dataset.sort){this.sortMode=s.dataset.sort,this.visibleCount=q,this.applyFilters(),this.render(),this.restartTicker();return}e.closest(".debt-load-more")&&(this.visibleCount+=q,this.render(),this.restartTicker())}),this.content.addEventListener("input",t=>{const e=t.target;e.classList.contains("debt-search")&&(this.searchQuery=e.value,this.visibleCount=q,this.applyFilters(),this.render(),this.restartTicker())})}async refresh(){var t,e,s;if(!this.loading&&!(Date.now()-this.lastFetch<this.REFRESH_INTERVAL&&this.entries.length>0)){if(!((t=this.element)!=null&&t.isConnected)){this.queueRefreshWhenConnected();return}this.loading=!0,this.showLoadingState();try{const o=await me();if(!((e=this.element)!=null&&e.isConnected)){this.queueRefreshWhenConnected();return}this.entries=o.entries??[],this.lastFetch=Date.now(),this.applyFilters(),this.setCount(this.filteredEntries.length),this.render(),this.startTicker()}catch(o){if(!((s=this.element)!=null&&s.isConnected))return;console.error("[NationalDebtPanel] Error fetching data:",o),this.showError("Failed to load national debt data")}finally{this.loading=!1}}}queueRefreshWhenConnected(){if(this.connectRefreshQueued)return;this.connectRefreshQueued=!0;const t=()=>{var s,o;return(s=this.element)!=null&&s.isConnected?(this.connectRefreshQueued=!1,this.connectRetryFrames=0,(o=this.connectionObserver)==null||o.disconnect(),this.connectionObserver=null,this.refresh(),!0):!1};if(t())return;if(typeof MutationObserver<"u"){const s=document.body??document.documentElement;if(s){const o=new MutationObserver(()=>{t()});o.observe(s,{childList:!0,subtree:!0}),this.connectionObserver=o;return}}(typeof requestAnimationFrame=="function"?requestAnimationFrame:s=>(globalThis.setTimeout(()=>s(Date.now()),0),0))(()=>{var s;if(this.connectRefreshQueued=!1,(s=this.element)!=null&&s.isConnected){this.connectRetryFrames=0,this.refresh();return}if(this.connectRetryFrames>=nt.MAX_CONNECT_RETRY_FRAMES){this.connectRetryFrames=0;return}this.connectRetryFrames+=1,this.queueRefreshWhenConnected()})}showLoadingState(){this.setSafeContent(T(`
      <div style="display:flex;align-items:center;justify-content:center;height:80px;color:var(--text-dim);font-size:calc(13px * var(--wm-panel-effective-scale, 1));">
        Loading debt data from IMF...
      </div>
    `,"legacy Panel.setContent() migration"))}applyFilters(){const t=this.searchQuery.toLowerCase().trim(),e=t?this.entries.filter(s=>s.iso3.toLowerCase().includes(t)||Qt(s.iso3).toLowerCase().includes(t)):this.entries;this.filteredEntries=Rs(e,this.sortMode)}get deficitCount(){return this.entries.filter(t=>t.perSecondRate>0).length}get surplusCount(){return this.entries.filter(t=>t.perSecondRate===0).length}getGlobalDebt(){return this.entries.reduce((t,e)=>t+Z(e),0)}getSourceLabel(){var e;let t="";for(const s of this.entries){const o=(e=s.source)==null?void 0:e.trim();o&&o.length>t.length&&(t=o)}return t||"IMF WEO"}render(){if(this.entries.length===0){this.showError("No data available");return}const t=`
      <div class="debt-panel-container">
        <div class="debt-summary">
          <div class="debt-summary-card debt-summary-card-deficit debt-summary-card-world">
            <span class="debt-summary-label">World Debt</span>
            <span class="debt-summary-value debt-global-ticker">${n(et(this.getGlobalDebt()))}</span>
          </div>
          <div class="debt-summary-card debt-summary-card-warning">
            <span class="debt-summary-label">In Deficit</span>
            <span class="debt-summary-value">${this.deficitCount}</span>
          </div>
          <div class="debt-summary-card debt-summary-card-surplus">
            <span class="debt-summary-label">Running Surplus</span>
            <span class="debt-summary-value">${this.surplusCount}</span>
          </div>
        </div>
        <div class="debt-controls">
          <div class="debt-sort-tabs">
            <button class="debt-tab${this.sortMode==="total"?" active":""}" data-sort="total">Total Debt</button>
            <button class="debt-tab${this.sortMode==="gdp-ratio"?" active":""}" data-sort="gdp-ratio">Debt/GDP</button>
            <button class="debt-tab${this.sortMode==="growth"?" active":""}" data-sort="growth">1Y Growth</button>
          </div>
          <input class="debt-search" type="text" placeholder="Search country..." value="${n(this.searchQuery)}">
        </div>
        <div class="debt-list">
          ${this.filteredEntries.slice(0,this.visibleCount).map((e,s)=>this.renderRow(e,s+1)).join("")}
        </div>
        ${this.visibleCount<this.filteredEntries.length?`
        <button class="debt-load-more">
          Load ${Math.min(q,this.filteredEntries.length-this.visibleCount)} more
          <span class="debt-load-more-count">(${this.filteredEntries.length-this.visibleCount} remaining)</span>
        </button>`:""}
        <div class="debt-footer">
          <span class="debt-source">Source: ${n(this.getSourceLabel())}</span>
          <span class="debt-updated">Updated: ${new Date(this.lastFetch).toLocaleDateString()}</span>
        </div>
      </div>
    `;this.setSafeContent(T(t,"legacy Panel.setContent() migration"))}renderRow(t,e){const s=Z(t),o=n(Qt(t.iso3)),l=Es(t.iso3),r=et(s),c=Number.isFinite(t.debtToGdp)&&t.debtToGdp>0?`${t.debtToGdp.toFixed(1)}%`:"—",p=Number.isFinite(t.annualGrowth)&&t.annualGrowth!==0?`${t.annualGrowth>0?"+":""}${t.annualGrowth.toFixed(1)}%`:"—",h=t.annualGrowth>5?"debt-growth-high":t.annualGrowth>0?"debt-growth-mid":"";return`
      <div class="debt-row" data-iso3="${n(t.iso3)}">
        <div class="debt-rank">${e}</div>
        <div class="debt-flag">${l}</div>
        <div class="debt-info">
          <div class="debt-name">${o}</div>
          <div class="debt-meta">
            <span class="debt-ratio">${c} of GDP</span>
            <span class="debt-growth ${h}">${p} YoY</span>
          </div>
        </div>
        <div class="debt-ticker" data-iso3="${n(t.iso3)}">${n(r)}</div>
      </div>
    `}startTicker(){if(this.stopTicker(),this.filteredEntries.length===0)return;this.tickerElements.clear(),this.lastTickerValues.clear();const t=this.content.querySelector(".debt-global-ticker");t&&this.tickerElements.set("__global__",t);const e=this.content.querySelector(".debt-list");if(e)for(const s of this.filteredEntries.slice(0,this.visibleCount)){const o=e.querySelector(`.debt-ticker[data-iso3="${s.iso3}"]`);o&&this.tickerElements.set(s.iso3,o)}this.tickerInterval=setInterval(()=>{const s=this.tickerElements.get("__global__");if(s){const o=et(this.getGlobalDebt());this.lastTickerValues.get("__global__")!==o&&(s.textContent=o,this.lastTickerValues.set("__global__",o))}for(const o of this.filteredEntries.slice(0,this.visibleCount)){const l=this.tickerElements.get(o.iso3);if(!l)continue;const r=et(Z(o));this.lastTickerValues.get(o.iso3)!==r&&(l.textContent=r,this.lastTickerValues.set(o.iso3,r))}},1e3)}stopTicker(){this.tickerInterval!==null&&(clearInterval(this.tickerInterval),this.tickerInterval=null),this.tickerElements.clear(),this.lastTickerValues.clear()}restartTicker(){this.stopTicker(),this.startTicker()}destroy(){var t;(t=this.connectionObserver)==null||t.disconnect(),this.connectionObserver=null,this.connectRefreshQueued=!1,this.connectRetryFrames=0,this.stopTicker(),super.destroy()}};b(nt,"MAX_CONNECT_RETRY_FRAMES",8);let Pt=nt;const xa=Object.freeze(Object.defineProperty({__proto__:null,NationalDebtPanel:Pt},Symbol.toStringTag,{value:"Module"}));let yt=null;async function As(){if(!yt){const{EconomicServiceClient:a}=await V(async()=>{const{EconomicServiceClient:t}=await import("./rpc-client-economic-v1-ClSZlM4Y.js");return{EconomicServiceClient:t}},[]),{getRpcBaseUrl:u}=await V(async()=>{const{getRpcBaseUrl:t}=await import("./embed-url-BEcsdCFo.js").then(e=>e.al);return{getRpcBaseUrl:t}},__vite__mapDeps([0,1,2,3,4,5,6,7]));yt=new a(u(),{fetch:(...t)=>globalThis.fetch(...t)})}return yt}function H(a){return`${a.toFixed(1)}%`}function Ms(a){return`$${a.toLocaleString(void 0,{maximumFractionDigits:0})}B`}function Ls(a){if(a.length<13)return{value:null,prior:null,date:""};const u=a[a.length-1],t=a[a.length-13],e=a[a.length-2],s=a[a.length-14]??a[a.length-13];if(!u||!t)return{value:null,prior:null,date:""};const o=t.value>0?(u.value-t.value)/t.value*100:null,l=s&&e&&s.value>0?(e.value-s.value)/s.value*100:null;return{value:o,prior:l,date:u.date}}function st(a){const u=a[a.length-1];if(!a.length||!u)return{value:null,prior:null,date:""};const t=a[a.length-2];return{value:u.value,prior:(t==null?void 0:t.value)??null,date:u.date}}function Is(a,u,t){return t||a===0?"neutral":(u?a<0:a>0)?"positive":"negative"}function Jt(a){const u=a.value!==null?n(a.format(a.value)):"N/A",t=a.value!==null&&a.prior!==null?a.value-a.prior:null,e=a.deltaFormat??a.format,s=t!==null?`${t>=0?"+":""}${e(t)} vs prior`:"",o=t!==null?Is(t,a.lowerIsBetter,a.neutral??!1):"neutral";return`<div class="macro-summary-card">
    <div class="macro-summary-head">
      <span class="indicator-name">${n(a.label)}</span>
    </div>
    <div class="macro-summary-value">${u}</div>
    ${s?`<div class="macro-summary-change ${o}">${n(s)}</div>`:""}
    <div class="indicator-date">${n(a.date)}</div>
  </div>`}const Fs=["DE","FR","IT","ES"];function _s(a){if(!a)return"";const u=/^(\d{4})-(\d{2})$/.exec(a);if(u){const e=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(u[2]??"0",10)-1];return e?`${e} ${u[1]??a}`:a}return a}function $t(a,u){var r;const t=[],e=[];let s="";for(const c of Fs){const p=(r=a.countries[c])==null?void 0:r[u];p&&typeof p.value=="number"&&Number.isFinite(p.value)&&(t.push(p.value),(!s||p.date>s)&&(s=p.date)),p!=null&&p.hasPrior&&Number.isFinite(p.priorValue)&&e.push(p.priorValue)}if(t.length===0)return{value:null,prior:null,date:""};const o=Math.round(t.reduce((c,p)=>c+p,0)/t.length*100)/100,l=e.length===t.length?Math.round(e.reduce((c,p)=>c+p,0)/e.length*100)/100:null;return{value:o,prior:l,date:_s(s)}}class Bs extends A{constructor(){super({id:"macro-tiles",title:"Macro Indicators",showCount:!1,infoTooltip:i("components.macroTiles.infoTooltip")});b(this,"_hasData",!1);b(this,"_tab","us");b(this,"_usTiles",[]);b(this,"_eurostat",null);b(this,"_estrObs",[]);b(this,"_china",null);this.content.addEventListener("click",t=>{const e=t.target.closest("[data-tab]");((e==null?void 0:e.dataset.tab)==="us"||(e==null?void 0:e.dataset.tab)==="eu"||(e==null?void 0:e.dataset.tab)==="cn")&&(this._tab=e.dataset.tab,this._render())}),this.content.addEventListener("keydown",t=>{if(!(t instanceof KeyboardEvent))return;const e=t.target.closest('[role="tab"][data-tab]');if(!e||!["ArrowRight","ArrowLeft","Home","End"].includes(t.key))return;const s=this._availableTabs(),o=s.indexOf(e.dataset.tab);if(o<0)return;t.preventDefault();const l=t.key==="Home"?s[0]:t.key==="End"?s[s.length-1]:s[(o+(t.key==="ArrowRight"?1:-1)+s.length)%s.length];l&&(this._tab=l,this._render(()=>{var r;(r=this.content.querySelector(`[data-tab="${l}"]`))==null||r.focus()}))})}async fetchData(){var t,e,s,o,l;this.showLoading();try{const r=await As(),c=O("chinaMacro"),p=O("chinaReleaseCalendar"),h=Ge(c,p),[f,v,d]=await Promise.allSettled([r.getFredSeriesBatch({seriesIds:["CPIAUCSL","UNRATE","GDP","FEDFUNDS","ESTR"],limit:14}),ve(),h??r.getChinaMacroSnapshot({})]),m=f.status==="fulfilled"?f.value.results??{}:{};this._estrObs=((t=m.ESTR)==null?void 0:t.observations)??[],v.status==="fulfilled"&&!v.value.unavailable&&(this._eurostat=v.value),this._china=d.status==="fulfilled"?d.value:null;const g=Ls(((e=m.CPIAUCSL)==null?void 0:e.observations)??[]),y=st(((s=m.UNRATE)==null?void 0:s.observations)??[]),w=st(((o=m.GDP)==null?void 0:o.observations)??[]),k=st(((l=m.FEDFUNDS)==null?void 0:l.observations)??[]);this._usTiles=[{id:"cpi",label:"CPI (YoY)",...g,lowerIsBetter:!0,format:H,deltaFormat:$=>$.toFixed(2)},{id:"unrate",label:"Unemployment",...y,lowerIsBetter:!0,format:H},{id:"gdp",label:"GDP (Billions)",...w,lowerIsBetter:!1,format:Ms,deltaFormat:$=>`${$.toLocaleString(void 0,{maximumFractionDigits:0})}B`},{id:"fed",label:"Fed Funds Rate",...k,lowerIsBetter:!1,neutral:!0,format:H}];const S=this._usTiles.some($=>$.value!==null),E=this._eurostat!==null,R=ut(this._china);return!S&&!E&&!R?(this._hasData||this.showError("Macro data unavailable",()=>void this.fetchData()),!1):(!S&&this._tab==="us"&&(this._tab=R?"cn":"eu"),!R&&this._tab==="cn"&&(this._tab=S?"us":"eu"),this._hasData=!0,this._render(),!0)}catch(r){return this._hasData||this.showError(r instanceof Error?r.message:"Failed to load",()=>void this.fetchData()),!1}}_render(t){const e=this._availableTabs(),s={us:"US",eu:"Euro Area",cn:"China"},o=`<div class="panel-tabs macro-tiles-tabs" role="tablist" aria-label="Macro economy">
      ${e.map(c=>`<button type="button" id="macro-tiles-tab-${c}" role="tab" aria-selected="${this._tab===c}" aria-controls="macro-tiles-tabpanel" tabindex="${this._tab===c?"0":"-1"}" class="panel-tab${this._tab===c?" active":""}" data-tab="${c}">${s[c]}</button>`).join("")}
    </div>`;let l;this._tab==="us"?l=`<div class="macro-summary-grid">${this._usTiles.map(Jt).join("")}</div>`:this._tab==="eu"?l=this._buildEuBody():l=this._buildChinaBody();const r=`macro-tiles-tab-${this._tab}`;this.setSafeContent(T(`${o}<div id="macro-tiles-tabpanel" class="macro-tiles-tabpanel" role="tabpanel" aria-labelledby="${r}">${l}</div>`,"legacy Panel.setContent() migration"),t)}_availableTabs(){return ut(this._china)?["us","eu","cn"]:["us","eu"]}_buildChinaBody(){if(!ut(this._china)||!this._china)return'<div class="macro-summary-empty">China macro data unavailable</div>';const t=He(this._china)?"":'<div class="macro-quality-note macro-quality-note--degraded" role="status">Official China macro pulse is degraded; stale or delayed observations remain visible below.</div>',e=this._china.indicators.map(je).join(""),s=new Date().toISOString().slice(0,10),o=this._china.releaseEvents.filter(r=>r.countryCode==="CN"&&r.releaseDate>=s).sort((r,c)=>r.releaseDate.localeCompare(c.releaseDate)).slice(0,3),l=o.length>0?`<section class="macro-release-calendar" aria-label="China release calendar">
          <div class="macro-release-calendar__heading">China release calendar</div>
          ${o.map(r=>`<div class="macro-release-calendar__event"><span>${n(r.event)}</span><span>${n(r.releaseDate)} · ${n(r.status)}</span></div>`).join("")}
        </section>`:'<div class="macro-release-calendar__empty">China release calendar unavailable</div>';return`${t}<div class="macro-summary-grid macro-summary-grid--china">${e}</div>${l}`}_buildEuBody(){if(!this._eurostat)return'<div class="macro-summary-empty">Euro Area data unavailable</div>';const t=$t(this._eurostat,"cpi"),e=$t(this._eurostat,"unemployment"),s=$t(this._eurostat,"gdpGrowth"),o=st(this._estrObs),l=[{id:"eu-cpi",label:"HICP (YoY)",value:t.value,prior:t.prior,date:t.date,lowerIsBetter:!0,format:H},{id:"eu-un",label:"Unemployment",value:e.value,prior:e.prior,date:e.date,lowerIsBetter:!0,format:H},{id:"eu-gdp",label:"GDP Growth (QoQ)",value:s.value,prior:s.prior,date:s.date,lowerIsBetter:!1,format:H},{id:"eu-estr",label:"€STR (ECB Rate)",...o,lowerIsBetter:!1,neutral:!0,format:H}];return l.some(r=>r.value!==null)?`<div class="macro-summary-grid">${l.map(Jt).join("")}</div>
      <div class="economic-source macro-summary-source">Eurostat · ECB · avg DE, FR, IT, ES</div>`:'<div class="macro-summary-empty">Euro Area data unavailable</div>'}}const Ta=Object.freeze(Object.defineProperty({__proto__:null,MacroTilesPanel:Bs},Symbol.toStringTag,{value:"Module"}));let wt=null;async function Ns(){if(!wt){const{MarketServiceClient:a}=await V(async()=>{const{MarketServiceClient:t}=await import("./rpc-client-market-v1-Bo995CQG.js");return{MarketServiceClient:t}},[]),{getRpcBaseUrl:u}=await V(async()=>{const{getRpcBaseUrl:t}=await import("./embed-url-BEcsdCFo.js").then(e=>e.al);return{getRpcBaseUrl:t}},__vite__mapDeps([0,1,2,3,4,5,6,7]));wt=new a(u(),{fetch:(...t)=>globalThis.fetch(...t)})}return wt}let Ct=null;async function Os(){if(!Ct){const{EconomicServiceClient:a}=await V(async()=>{const{EconomicServiceClient:t}=await import("./rpc-client-economic-v1-ClSZlM4Y.js");return{EconomicServiceClient:t}},[]),{getRpcBaseUrl:u}=await V(async()=>{const{getRpcBaseUrl:t}=await import("./embed-url-BEcsdCFo.js").then(e=>e.al);return{getRpcBaseUrl:t}},__vite__mapDeps([0,1,2,3,4,5,6,7]));Ct=new a(u(),{fetch:(...t)=>globalThis.fetch(...t)})}return Ct}function Us(a){return a==="Low Stress"?"#27ae60":a==="Moderate Stress"?"#f39c12":a==="Elevated Stress"?"#e67e22":"#c0392b"}function Gs(a){return a==="Low Stress"?i("components.fsi.interpretation.low"):a==="Moderate Stress"?i("components.fsi.interpretation.moderate"):a==="Elevated Stress"?i("components.fsi.interpretation.elevated"):i("components.fsi.interpretation.severe")}function Hs(a){return a==="Low Stress"?i("components.fsi.labels.lowStress"):a==="Moderate Stress"?i("components.fsi.labels.moderateStress"):a==="Elevated Stress"?i("components.fsi.labels.elevatedStress"):a==="Severe Stress"?i("components.fsi.labels.severeStress"):a}function js(a){return a==="Low"?i("components.fsi.cissLabels.low"):a==="Moderate"?i("components.fsi.cissLabels.moderate"):a==="Elevated"?i("components.fsi.cissLabels.elevated"):a==="High"?i("components.fsi.cissLabels.high"):a}function Xt(a){return a==="Low"?"#27ae60":a==="Moderate"?"#f39c12":a==="Elevated"?"#e67e22":"#c0392b"}function zs(a){const u=Date.parse(a);return Number.isFinite(u)?Date.now()-u>ze:!1}function at(a,u){return`<div style="background:rgba(255,255,255,0.04);border-radius:6px;padding:8px 10px;border:1px solid rgba(255,255,255,0.07)">
    <div style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px">${n(a)}</div>
    <div style="font-size:calc(16px * var(--wm-panel-effective-scale, 1));font-weight:600;color:var(--text)">${n(u)}</div>
  </div>`}class Vs extends A{constructor(){super({id:"fsi",title:i("components.fsi.title"),showCount:!1,infoTooltip:i("components.fsi.infoTooltip")});b(this,"_hasData",!1)}async fetchData(){var t,e,s,o;this.showLoading();try{const l=O("fearGreedIndex");let r=0,c="",p=0,h=0,f=0,v=0;if(l&&!l.unavailable){const m=l.headerMetrics??{};r=Number(((t=m==null?void 0:m.fsi)==null?void 0:t.value)??0),c=String(((e=m==null?void 0:m.fsi)==null?void 0:e.label)??""),f=Number(((s=m==null?void 0:m.vix)==null?void 0:s.value)??0),v=Number(((o=m==null?void 0:m.hySpread)==null?void 0:o.value)??0)}if(r<=0){const g=await(await Ns()).getFearGreedIndex({});!g.unavailable&&g.fsiValue>0&&(r=g.fsiValue,c=g.fsiLabel,p=g.hygPrice,h=g.tltPrice,f=g.vix,v=g.hySpread)}if(r<=0)return this._hasData||this.showError(i("components.fsi.errors.unavailable"),()=>void this.fetchData()),!1;let d=null;try{const m=O("euFsi");if(m&&!m.unavailable&&Number.isFinite(m.latestValue))d=m;else{const y=await(await Os()).getEuFsi({});!y.unavailable&&Number.isFinite(y.latestValue)&&(d=y)}}catch{}return this._hasData=!0,this.render({fsiValue:r,fsiLabel:c,hygPrice:p,tltPrice:h,vix:f,hySpread:v},d),!0}catch(l){return this._hasData||this.showError(l instanceof Error?l.message:i("components.fsi.errors.failedToLoad"),()=>void this.fetchData()),!1}}render(t,e){const{fsiValue:s,fsiLabel:o,hygPrice:l,tltPrice:r,vix:c,hySpread:p}=t,h=Us(o),f=Math.min(Math.max(s/2.5*100,0),100),v=Gs(o),d=e?e.stale||zs(e.latestDate):!1,m=e?`<div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.07)">
          <div style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px">${n(i("components.fsi.cissTitle"))}</div>
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
            <div style="font-size:calc(28px * var(--wm-panel-effective-scale, 1));font-weight:700;color:${Xt(e.label)};line-height:1">${e.latestValue.toFixed(4)}</div>
            <div>
              <div style="font-size:calc(12px * var(--wm-panel-effective-scale, 1));font-weight:600;color:${Xt(e.label)}">${n(js(e.label))}</div>
              <div style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:${d?"#e67e22":"var(--text-dim)"}">${n(e.latestDate?new Date(e.latestDate).toLocaleDateString(void 0,{year:"numeric",month:"short",day:"numeric"}):"")}</div>
            </div>
          </div>
          ${d?`<div style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:#e67e22;background:rgba(230,126,34,0.1);border-radius:4px;padding:4px 6px;margin-bottom:8px">⚠ ${n(i("components.fsi.cissStale"))}</div>`:""}
          <div style="background:rgba(255,255,255,0.07);border-radius:4px;height:6px;overflow:hidden">
            <div style="height:100%;width:${(e.latestValue*100).toFixed(1)}%;background:linear-gradient(90deg,#27ae60,#f39c12,#c0392b);border-radius:4px"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);margin-top:3px">
            <span>${n(i("components.fsi.scale.noStress"))}</span><span>${n(i("components.fsi.scale.extremeStress"))}</span>
          </div>
        </div>`:"",g=`<div style="padding:12px 14px">
      <div style="text-align:center;margin-bottom:16px">
        <div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);margin-bottom:4px">${n(i("components.fsi.usFsiValue"))}</div>
        <div style="font-size:calc(36px * var(--wm-panel-effective-scale, 1));font-weight:700;color:${h};line-height:1">${s.toFixed(4)}</div>
        <div style="font-size:calc(13px * var(--wm-panel-effective-scale, 1));font-weight:600;color:${h};margin-top:4px">${n(Hs(o))}</div>
      </div>
      <div style="margin:0 0 12px">
        <div style="display:flex;justify-content:space-between;font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);margin-bottom:3px">
          <span>${n(i("components.fsi.scale.highStress"))}</span><span>${n(i("components.fsi.scale.lowStress"))}</span>
        </div>
        <div style="background:rgba(255,255,255,0.07);border-radius:4px;height:8px;overflow:hidden">
          <div style="height:100%;width:${f.toFixed(1)}%;background:linear-gradient(90deg,#c0392b,#f39c12,#27ae60);border-radius:4px"></div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px">
        ${at(i("components.fsi.metrics.vix"),c>0?c.toFixed(2):i("components.fsi.notAvailable"))}
        ${at(i("components.fsi.metrics.hySpread"),p>0?p.toFixed(2)+"%":i("components.fsi.notAvailable"))}
        ${at(i("components.fsi.metrics.hygPrice"),l>0?"$"+l.toFixed(2):i("components.fsi.notAvailable"))}
        ${at(i("components.fsi.metrics.tltPrice"),r>0?"$"+r.toFixed(2):i("components.fsi.notAvailable"))}
      </div>
      <div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);background:rgba(255,255,255,0.03);border-radius:6px;padding:8px 10px;border-left:3px solid ${h}">
        ${n(v)}
      </div>
      ${m}
    </div>`;this.setSafeContent(T(g,"legacy Panel.setContent() migration"))}}const Da=Object.freeze(Object.defineProperty({__proto__:null,FSIPanel:Vs},Symbol.toStringTag,{value:"Module"}));export{Ca as B,ha as C,pa as E,Sa as F,ua as G,ya as I,Ta as M,xa as N,va as S,ma as T,fa as a,ga as b,ba as c,$a as d,wa as e,Da as f};
