const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/gdelt-intel-B2bRPowK.js","assets/panel-storage-COYkA8bZ.js","assets/clerk-DnucG282.js","assets/i18n-qlunRAMb.js","assets/embed-url-BEcsdCFo.js","assets/persistent-cache-DcwIBXtm.js","assets/widget-store-IAxu1TMg.js","assets/debugbear-rum-CTwHbetR.js","assets/data-freshness-ChOowvKb.js","assets/panel-gating-CFklAQbM.js","assets/embed-url-B23MHeXh.css"])))=>i.map(i=>d[i]);
var X=Object.defineProperty;var Z=(r,s,e)=>s in r?X(r,s,{enumerable:!0,configurable:!0,writable:!0,value:e}):r[s]=e;var f=(r,s,e)=>Z(r,typeof s!="symbol"?s+"":s,e);import{_ as q}from"./clerk-DnucG282.js";import{UNDERSEA_CABLES as _}from"./geo-map-data-By455S2c.js";import{a as T,e as a,s as E,t as L}from"./dom-utils-B8MVJOEB.js";import{c as ss}from"./widget-store-IAxu1TMg.js";import{T as j}from"./transit-chart-C9EcLIrs.js";import{a9 as ts,w as z,u as as,o as B,aa as ps,ab as es,e as os,b as ns,ac as is,n as ls}from"./gdelt-intel-B2bRPowK.js";import{t,h as D,l as V,f as A,q as W}from"./panel-storage-COYkA8bZ.js";import{aj as rs}from"./embed-url-BEcsdCFo.js";import{s as cs}from"./sparkline-EyuwviXB.js";import{h as R}from"./panel-gating-CFklAQbM.js";class us{mount(s,e){if(!e.length)return;const p=e.reduce((m,g)=>m+g.share,0)||1,o=80,i=o/2,n=o/2,c=34,l=18,u=window.devicePixelRatio||1,d=document.createElement("canvas");d.width=o*u,d.height=o*u,d.style.width=`${o}px`,d.style.height=`${o}px`,d.className="popup-hs2-ring-canvas";const $=d.getContext("2d");if(!$)return;$.scale(u,u);let h=-Math.PI/2;e.forEach(m=>{const g=m.share/p*2*Math.PI;$.beginPath(),$.arc(i,n,c,h,h+g),$.arc(i,n,l,h+g,h,!0),$.closePath(),$.fillStyle=m.color,$.fill(),h+=g}),s.appendChild(d);const v=document.createElement("div");v.className="popup-hs2-ring-legend",e.forEach(m=>{const g=document.createElement("div");g.className="popup-hs2-ring-legend-item";const y=document.createElement("span");y.className="popup-hs2-ring-dot",y.style.background=m.color;const C=document.createElement("span");C.className="popup-hs2-ring-label",C.textContent=m.label;const b=document.createElement("span");b.className="popup-hs2-ring-pct",b.textContent=`${m.share}%`,g.appendChild(y),g.appendChild(C),g.appendChild(b),v.appendChild(g)}),s.appendChild(v)}}const I={news:.35,cii:.25,geo:.25,military:.15},Q=1440*60*1e3,G=48;function ds(r){return r.escalationScore??3}function vs(r,s,e){return Math.min(100,r*15+(s?30:0)+e*5)}function hs(r){return r??30}function ms(r,s){return r===0?0:Math.min(100,r+s*10)}function $s(r,s){return Math.min(100,r*10+s*15)}function gs(r){return{newsActivity:vs(r.newsMatches,r.hasBreaking,r.newsVelocity),ciiContribution:hs(r.ciiScore),geoConvergence:ms(r.geoAlertScore,r.geoAlertTypes),militaryActivity:$s(r.flightsNearby,r.vesselsNearby)}}function ys(r){return r.newsActivity*I.news+r.ciiContribution*I.cii+r.geoConvergence*I.geo+r.militaryActivity*I.military}function bs(r){return 1+r/100*4}function fs(r,s){return r*.3+s*.7}function Cs(r,s){const e=s-Q,p=r.filter(o=>o.timestamp>=e);return p.length>G?p.slice(-G):p}function ws(r){if(r.length<3)return"stable";let s=0,e=0,p=0,o=0,i=0;for(let l=0;l<r.length;l++){const u=r[l];u&&(s+=i,e+=u.score,p+=i*u.score,o+=i*i,i++)}if(i<3)return"stable";const n=i*o-s*s;if(n===0)return"stable";const c=(i*p-s*e)/n;return c>.1?"escalating":c<-.1?"de-escalating":"stable"}function Ss(r,s,e){const{now:p,previousHistory:o}=e,i=ds(r),n=gs(s),c=ys(n),l=bs(c),u=fs(i,l),d=Cs(o??[],p);return d.push({timestamp:p,score:u}),{hotspotId:r.id,staticBaseline:i,dynamicScore:Math.round(l*10)/10,combinedScore:Math.round(u*10)/10,trend:ws(d),components:n,history:d,lastUpdated:new Date(p)}}function ks(r,s){if(r.length<2)return null;const e=s-Q,p=r.find(i=>i.timestamp>=e),o=r[r.length-1];return!p||!o?null:{change:Math.round((o.score-p.score)*10)/10,start:Math.round(p.score*10)/10,end:Math.round(o.score*10)/10}}function Ts(r,s,e,p=200){let o=0,i=0;for(const n of s)z(r.lat,r.lon,n.lat,n.lon)<=p&&o++;for(const n of e)z(r.lat,r.lon,n.lat,n.lon)<=p&&i++;return{flights:o,vessels:i}}function J(r){return ts.find(s=>s.id===r)}const xs={tehran:"IR",moscow:"RU",beijing:"CN",kyiv:"UA",taipei:"TW",telaviv:"IL",pyongyang:"KP",sanaa:"YE",riyadh:"SA",ankara:"TR",damascus:"SY",caracas:"VE",dc:"US",london:"GB",brussels:"BE",baghdad:"IQ",beirut:"LB",doha:"QA",abudhabi:"AE",mexico:"MX",havana:"CU",nuuk:"GL",sahel:["ML","NE","BF"],haiti:"HT",horn_africa:["ET","SO","SD"],pak_afghan:["PK","AF"],silicon_valley:"US",wall_street:"US",houston:"US",cairo:"EG"};function Es(r){const s=xs[r];return s?Array.isArray(s)?[...s]:[s]:[]}function Ls(r,s){const e=Es(r).map(s).filter(p=>p!==null);return e.length>0?Math.max(...e):null}const U=new Map;let H=null,N=null;function Zs(r){H=r}function qs(r){N=r}function As(r){return H?Ls(r,H):null}function Ps(r){return N?N(r.lat,r.lon,150):null}function Is(r,s){var o;const e=J(r);if(!e)throw new Error(`Hotspot not found: ${r}`);const p=Ss(e,s,{now:Date.now(),previousHistory:(o=U.get(r))==null?void 0:o.history});return U.set(r,p),p}function Ms(r){return U.get(r)??null}let O={flights:[],vessels:[]};function st(r,s){O={flights:r,vessels:s}}function tt(r,s,e,p){const o=J(r);if(!o)return null;const i=As(r),n=Ps(o),c=Ts(o,O.flights,O.vessels),l={newsMatches:s,hasBreaking:e,newsVelocity:p,ciiScore:i,geoAlertScore:(n==null?void 0:n.score)??0,geoAlertTypes:(n==null?void 0:n.types)??0,flightsNearby:c.flights,vesselsNearby:c.vessels};return Is(r,l)}function Us(r){const s=U.get(r);return s?ks(s.history,Date.now()):null}function Ds(r){try{return new URL(r).hostname.replace("www.","")}catch{return""}}function Rs(r,s={}){const e=s.limit??3,p=s.label??"Source",o=s.containerClass??"popup-source-links",i=s.linkClass??"popup-link",n=[];for(const c of r??[]){if(n.length>=e)break;const l=T(c);if(!l)continue;const u=Ds(c)||`${p} ${n.length+1}`;n.push(`<a class="${a(i)}" href="${l}" target="_blank" rel="noopener noreferrer nofollow">${a(u)} →</a>`)}return n.length?`<div class="${a(o)}">${n.join("")}</div>`:""}const F={suez:[{label:"Energy",share:30,color:"#f97316"},{label:"Machinery",share:22,color:"#3b82f6"},{label:"Chemicals",share:16,color:"#a855f7"},{label:"Food",share:14,color:"#22c55e"},{label:"Other",share:18,color:"#64748b"}],malacca_strait:[{label:"Energy",share:34,color:"#f97316"},{label:"Electronics",share:25,color:"#3b82f6"},{label:"Chemicals",share:14,color:"#a855f7"},{label:"Food",share:12,color:"#22c55e"},{label:"Other",share:15,color:"#64748b"}],hormuz_strait:[{label:"Energy",share:78,color:"#f97316"},{label:"Chemicals",share:9,color:"#a855f7"},{label:"Food",share:7,color:"#22c55e"},{label:"Other",share:6,color:"#64748b"}],bab_el_mandeb:[{label:"Energy",share:32,color:"#f97316"},{label:"Machinery",share:20,color:"#3b82f6"},{label:"Chemicals",share:15,color:"#a855f7"},{label:"Food",share:13,color:"#22c55e"},{label:"Other",share:20,color:"#64748b"}],panama:[{label:"Bulk",share:28,color:"#eab308"},{label:"Energy",share:18,color:"#f97316"},{label:"Containers",share:35,color:"#3b82f6"},{label:"Other",share:19,color:"#64748b"}],taiwan_strait:[{label:"Electronics",share:40,color:"#3b82f6"},{label:"Machinery",share:22,color:"#6366f1"},{label:"Energy",share:14,color:"#f97316"},{label:"Chemicals",share:12,color:"#a855f7"},{label:"Other",share:12,color:"#64748b"}],cape_of_good_hope:[{label:"Bulk",share:35,color:"#eab308"},{label:"Energy",share:22,color:"#f97316"},{label:"Containers",share:28,color:"#3b82f6"},{label:"Other",share:15,color:"#64748b"}],gibraltar:[{label:"Containers",share:30,color:"#3b82f6"},{label:"Energy",share:25,color:"#f97316"},{label:"Bulk",share:20,color:"#eab308"},{label:"Other",share:25,color:"#64748b"}],bosphorus:[{label:"Energy",share:58,color:"#f97316"},{label:"Bulk",share:18,color:"#eab308"},{label:"Containers",share:14,color:"#3b82f6"},{label:"Other",share:10,color:"#64748b"}]};function Fs(r){const o=2*Math.PI*28;let i=0;const n=r.map(l=>{const u=l.share/100*o,d=`<circle cx="36" cy="36" r="28" fill="none" stroke="${l.color}" stroke-width="10" stroke-dasharray="${u.toFixed(2)} ${(o-u).toFixed(2)}" stroke-dashoffset="${(-i).toFixed(2)}" />`;return i+=u,d}),c=r.map(l=>`<span class="sector-legend-item"><span class="sector-dot" style="background:${l.color}"></span>${a(l.label)}&nbsp;${l.share}%</span>`).join(" · ");return`
    <div class="sector-ring-wrap">
      <svg width="72" height="72" viewBox="0 0 72 72" style="transform:rotate(-90deg)">${n.join("")}</svg>
      <div class="sector-legend">${c}</div>
    </div>`}function Hs(r){return r==="POSITION_SOURCE_WINGBITS"?'<a href="https://wingbits.com?utm_source=worldmonitor&utm_medium=referral&utm_campaign=worldmonitor" target="_blank" rel="noopener" style="color:inherit">wingbits.com</a>':r==="POSITION_SOURCE_OPENSKY"?'<a href="https://opensky-network.org" target="_blank" rel="noopener" style="color:inherit">opensky-network.org</a>':a(r)}function Ns(r){if(!r)return a(t("popups.militaryFlight.attribution"));const e={"adsb.lol":{label:"adsb.lol (ODbL)",url:"https://api.adsb.lol"},"airplanes.live":{label:"airplanes.live",url:"https://api.airplanes.live"},"adsb.fi":{label:"adsb.fi",url:"https://opendata.adsb.fi"},wingbits:{label:"Wingbits",url:"https://wingbits.com"},opensky:{label:"OpenSky Network",url:"https://opensky-network.org"}}[r],p=e?`<a href="${e.url}" target="_blank" rel="noopener" style="color:inherit">${e.label}</a>`:a(r);return`${a(t("popups.source"))}: ${p}`}function M(r){if(!r)return"—";const s=new Date(r.includes("T")?r:r.replace(" ","T")+"Z");return Number.isNaN(s.getTime())?"—":s.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}function K(r){return r===void 0||r===0?"":`<span style="color:${r>0?"#f97316":"#22c55e"};font-size:calc(10px * var(--wm-panel-effective-scale, 1));margin-left:3px">${r>0?"+":""}${r}m</span>`}const k=class k{constructor(s){f(this,"container");f(this,"popup",null);f(this,"onClose");f(this,"cableAdvisories",[]);f(this,"repairShips",[]);f(this,"chokepointData",null);f(this,"transitChart",null);f(this,"isMobileSheet",!1);f(this,"sheetTouchStartY",null);f(this,"sheetCurrentOffset",0);f(this,"mobileDismissThreshold",96);f(this,"outsideListenerTimeoutId",null);f(this,"mapPopupHistoryOpen",null);f(this,"lastPositionedHeight",null);f(this,"handleOutsideClick",s=>{this.popup&&!this.popup.contains(s.target)&&this.hide()});f(this,"handleEscapeKey",s=>{s.key==="Escape"&&this.hide()});f(this,"handleSheetTouchStart",s=>{var o;if(!this.popup||!this.isMobileSheet||s.touches.length!==1)return;const e=s.target,p=this.popup.querySelector(".popup-body");if(e!=null&&e.closest(".popup-body")&&p&&p.scrollTop>0){this.sheetTouchStartY=null;return}this.sheetTouchStartY=((o=s.touches[0])==null?void 0:o.clientY)??null,this.sheetCurrentOffset=0,this.popup.classList.add("dragging")});f(this,"handleSheetTouchMove",s=>{var o;if(!this.popup||!this.isMobileSheet||this.sheetTouchStartY===null)return;const e=(o=s.touches[0])==null?void 0:o.clientY;if(e==null)return;const p=Math.max(0,e-this.sheetTouchStartY);p<=0||(this.sheetCurrentOffset=p,this.popup.style.transform=`translate3d(0, ${p}px, 0)`,s.preventDefault())});f(this,"handleSheetTouchEnd",()=>{if(!this.popup||!this.isMobileSheet||this.sheetTouchStartY===null)return;const s=this.sheetCurrentOffset>=this.mobileDismissThreshold;if(this.popup.classList.remove("dragging"),this.sheetTouchStartY=null,s){this.hide();return}this.sheetCurrentOffset=0,this.popup.style.transform="",this.popup.classList.add("open")});this.container=s}setChokepointData(s){this.chokepointData=s}show(s){var o,i;this.hide("replacement"),this.isMobileSheet=ss(),this.popup=document.createElement("div"),this.popup.className=this.isMobileSheet?"map-popup map-popup-sheet":"map-popup";const e=this.renderContent(s);E(this.popup,L(this.isMobileSheet?`<button class="map-popup-sheet-handle" aria-label="${t("common.close")}"></button>${e}`:e,"legacy direct innerHTML migration"));const p=this.container.getBoundingClientRect();if(this.isMobileSheet?(this.popup.style.left="",this.popup.style.top="",this.popup.style.transform=""):this.positionDesktopPopup(s,p),document.body.appendChild(this.popup),!this.isMobileSheet){const n=s.type,c=this.popup,l=this.lastPositionedHeight;requestAnimationFrame(()=>{setTimeout(()=>{this.popup===c&&this.refreshHeightCache(n,s,p,l)},0)})}if(s.type==="waterway"){const n=s.data,c=(i=(o=this.chokepointData)==null?void 0:o.chokepoints)==null?void 0:i.find(h=>h.id===n.chokepointId),l=this.popup.querySelector("[data-transit-chart]"),u=(c==null?void 0:c.id)??"",d=R(D());if(l&&u&&d){const h=k.historyCache.get(u);h&&h.length?(this.transitChart=new j,this.transitChart.mount(l,h)):k.historyInflight.has(u)||(k.historyInflight.add(u),as(u).then(v=>{var g;k.historyInflight.delete(u);const m=(g=this.popup)==null?void 0:g.querySelector(`[data-transit-chart-id="${u}"]`);m&&(v.history.length?(k.historyCache.set(u,v.history),m.textContent="",this.transitChart=new j,this.transitChart.mount(m,v.history)):m.textContent=t("components.supplyChain.historyUnavailable")||"History unavailable")}).catch(()=>{var m;k.historyInflight.delete(u);const v=(m=this.popup)==null?void 0:m.querySelector(`[data-transit-chart-id="${u}"]`);v&&(v.textContent=t("components.supplyChain.historyUnavailable")||"History unavailable")}))}u&&!d&&V("chokepoint-transit-chart");const $=F[n.chokepointId];if($!=null&&$.length){const h=this.popup.querySelector(`[data-hs2-ring="${n.chokepointId}"]`);h?new us().mount(h,$):R(D())||V("chokepoint-sector-ring")}}if(this.popup.addEventListener("click",n=>{const c=n.target;if(c.closest(".popup-close")||c.closest(".map-popup-sheet-handle")){this.hide();return}const l=c.closest(".cluster-toggle");if(l){const u=l.previousElementSibling;if(!u)return;const d=u.style.display!=="none";u.style.display=d?"none":"",l.textContent=d?l.dataset.more??"":l.dataset.less??""}}),this.isMobileSheet){this.mapPopupHistoryOpen=B.openCancelable("map-popup",c=>this.hide(c)),this.popup.addEventListener("touchstart",this.handleSheetTouchStart,{passive:!0}),this.popup.addEventListener("touchmove",this.handleSheetTouchMove,{passive:!1}),this.popup.addEventListener("touchend",this.handleSheetTouchEnd),this.popup.addEventListener("touchcancel",this.handleSheetTouchEnd);const n=this.popup;requestAnimationFrame(()=>{this.popup===n&&(n.classList.add("open"),n.addEventListener("transitionend",()=>{this.popup===n&&(n.style.willChange="auto")},{once:!0}))})}this.outsideListenerTimeoutId!==null&&window.clearTimeout(this.outsideListenerTimeoutId),this.outsideListenerTimeoutId=window.setTimeout(()=>{document.addEventListener("click",this.handleOutsideClick),document.addEventListener("touchstart",this.handleOutsideClick),document.addEventListener("keydown",this.handleEscapeKey),this.outsideListenerTimeoutId=null},0)}showRouteBreakdown(s,e,p,o){var b,S;this.hide();const i=((b=this.chokepointData)==null?void 0:b.chokepoints)??[],n=((S=e.map(w=>{var x;return{id:w,score:((x=i.find(P=>P.id===w))==null?void 0:x.disruptionScore)??0}}).sort((w,x)=>x.score-w.score)[0])==null?void 0:S.id)??e[0]??"",c=i.find(w=>w.id===n),l=n?F[n]??[]:[],u={WAR_RISK_TIER_WAR_ZONE:"War Zone",WAR_RISK_TIER_CRITICAL:"Critical",WAR_RISK_TIER_HIGH:"High",WAR_RISK_TIER_ELEVATED:"Elevated",WAR_RISK_TIER_NORMAL:"Normal"},d={WAR_RISK_TIER_WAR_ZONE:"#ef4444",WAR_RISK_TIER_CRITICAL:"#ef4444",WAR_RISK_TIER_HIGH:"#f59e0b",WAR_RISK_TIER_ELEVATED:"#f59e0b",WAR_RISK_TIER_NORMAL:"var(--text-dim,#888)"},$=(c==null?void 0:c.warRiskTier)??"WAR_RISK_TIER_NORMAL",h=(c==null?void 0:c.disruptionScore)??0,v=h>70?"#ef4444":h>30?"#f59e0b":"var(--text-dim,#888)",m=l.slice(0,2),g=m.length?m.map(w=>`<span style="display:inline-flex;align-items:center;gap:3px;margin-right:6px"><span style="width:8px;height:8px;border-radius:50%;background:${w.color};display:inline-block"></span><span style="font-size:calc(10px * var(--wm-panel-effective-scale, 1))">${a(w.label)} ${w.share}%</span></span>`).join(""):'<span style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));opacity:.5">No sector data</span>',y=`
      <div class="popup-header">
        <span class="popup-title" style="font-size:calc(12px * var(--wm-panel-effective-scale, 1))">${a(s.routeName)}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body" style="padding:8px 12px;min-width:200px">
        ${c?`<div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));font-weight:600;margin-bottom:6px">${a(c.name)}</div>`:""}
        <div style="display:flex;gap:10px;margin-bottom:6px">
          <span style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));opacity:.6">Disruption</span>
          <span style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));font-weight:600;color:${v}">${h}/100</span>
        </div>
        <div style="display:flex;gap:10px;margin-bottom:6px">
          <span style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));opacity:.6">War Risk</span>
          <span style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));font-weight:600;color:${d[$]??"inherit"}">${u[$]??"Normal"}</span>
        </div>
        <div style="margin-top:4px">${g}</div>
      </div>`;this.isMobileSheet=!1,this.popup=document.createElement("div"),this.popup.className="map-popup map-popup-route-breakdown",E(this.popup,L(y,"legacy direct innerHTML migration"));const C=this.container.getBoundingClientRect();this.positionDesktopPopup({x:p,y:o,type:"waterway",data:{}},C),document.body.appendChild(this.popup),this.popup.addEventListener("click",w=>{w.target.closest(".popup-close")&&this.hide()}),this.outsideListenerTimeoutId!==null&&clearTimeout(this.outsideListenerTimeoutId),this.outsideListenerTimeoutId=window.setTimeout(()=>{this.outsideListenerTimeoutId=null,document.addEventListener("click",this.handleOutsideClick),document.addEventListener("keydown",this.handleEscapeKey)},200)}positionDesktopPopup(s,e){if(!this.popup)return;const p=k.heightByType.get(s.type);if(p!==void 0){this.applyDesktopPosition(s,e,p);return}this.popup.style.visibility="hidden",this.popup.style.top="0",this.popup.style.left="-9999px",document.body.appendChild(this.popup);const o=this.popup.offsetHeight;document.body.removeChild(this.popup),this.popup.style.visibility="",k.heightByType.set(s.type,o),this.applyDesktopPosition(s,e,o)}refreshHeightCache(s,e,p,o){if(!this.popup||this.isMobileSheet)return;const i=this.popup.offsetHeight;if(!(i<=0)){if(k.heightByType.set(s,i),o!==null&&Math.abs(i-o)>k.HEIGHT_DRIFT_PX){this.applyDesktopPosition(e,p,i);return}this.clampPopupToViewport()}}applyDesktopPosition(s,e,p){if(!this.popup)return;this.lastPositionedHeight=p;const o=380,i=50,n=60,c=e.left+s.x,l=e.top+s.y,u=window.innerWidth-o-20;let d=c+20;d>u&&(d=Math.max(10,c-o-20));const $=window.innerHeight-l-i,h=l-n;let v;$>=p?v=l+10:h>=p?v=l-p-10:v=n,v=Math.max(n,v);const m=window.innerHeight-p-i;m>n&&(v=Math.min(v,m)),this.popup.style.left=`${d}px`,this.popup.style.top=`${v}px`}clampPopupToViewport(){if(!this.popup||this.isMobileSheet)return;const s=this.popup.getBoundingClientRect(),e=20,p=60,o=s.bottom-(window.innerHeight-e);if(o>0){const i=Number.parseFloat(this.popup.style.top)||0;this.popup.style.top=`${Math.max(p,i-o)}px`}}hide(s="control"){var e,p,o;(e=this.transitChart)==null||e.destroy(),this.transitChart=null,(p=this.mapPopupHistoryOpen)==null||p.cancel(),this.mapPopupHistoryOpen=null,this.outsideListenerTimeoutId!==null&&(window.clearTimeout(this.outsideListenerTimeoutId),this.outsideListenerTimeoutId=null),this.popup&&(this.isMobileSheet&&s==="control"&&B.close("map-popup"),this.popup.removeEventListener("touchstart",this.handleSheetTouchStart),this.popup.removeEventListener("touchmove",this.handleSheetTouchMove),this.popup.removeEventListener("touchend",this.handleSheetTouchEnd),this.popup.removeEventListener("touchcancel",this.handleSheetTouchEnd),this.popup.remove(),this.popup=null,this.isMobileSheet=!1,this.sheetTouchStartY=null,this.sheetCurrentOffset=0,document.removeEventListener("click",this.handleOutsideClick),document.removeEventListener("touchstart",this.handleOutsideClick),document.removeEventListener("keydown",this.handleEscapeKey),(o=this.onClose)==null||o.call(this))}setOnClose(s){this.onClose=s}setCableActivity(s,e){this.cableAdvisories=s,this.repairShips=e}renderContent(s){switch(s.type){case"conflict":return this.renderConflictPopup(s.data);case"hotspot":return this.renderHotspotPopup(s.data,s.relatedNews);case"earthquake":return this.renderEarthquakePopup(s.data);case"weather":return this.renderWeatherPopup(s.data);case"base":return this.renderBasePopup(s.data);case"waterway":return this.renderWaterwayPopup(s.data);case"apt":return this.renderAPTPopup(s.data);case"cyberThreat":return this.renderCyberThreatPopup(s.data);case"nuclear":return this.renderNuclearPopup(s.data);case"economic":return this.renderEconomicPopup(s.data);case"irradiator":return this.renderIrradiatorPopup(s.data);case"pipeline":return this.renderPipelinePopup(s.data);case"cable":return this.renderCablePopup(s.data);case"cable-advisory":return this.renderCableAdvisoryPopup(s.data);case"repair-ship":return this.renderRepairShipPopup(s.data);case"outage":return this.renderOutagePopup(s.data);case"datacenter":return this.renderDatacenterPopup(s.data);case"datacenterCluster":return this.renderDatacenterClusterPopup(s.data);case"ais":return this.renderAisPopup(s.data);case"protest":return this.renderProtestPopup(s.data);case"protestCluster":return this.renderProtestClusterPopup(s.data);case"flight":return this.renderFlightPopup(s.data);case"aircraft":return this.renderAircraftPopup(s.data);case"militaryFlight":return this.renderMilitaryFlightPopup(s.data);case"militaryVessel":return this.renderMilitaryVesselPopup(s.data);case"militaryFlightCluster":return this.renderMilitaryFlightClusterPopup(s.data);case"militaryVesselCluster":return this.renderMilitaryVesselClusterPopup(s.data);case"natEvent":return this.renderNaturalEventPopup(s.data);case"port":return this.renderPortPopup(s.data);case"spaceport":return this.renderSpaceportPopup(s.data);case"mineral":return this.renderMineralPopup(s.data);case"startupHub":return this.renderStartupHubPopup(s.data);case"cloudRegion":return this.renderCloudRegionPopup(s.data);case"techHQ":return this.renderTechHQPopup(s.data);case"accelerator":return this.renderAcceleratorPopup(s.data);case"techEvent":return this.renderTechEventPopup(s.data);case"techHQCluster":return this.renderTechHQClusterPopup(s.data);case"techEventCluster":return this.renderTechEventClusterPopup(s.data);case"stockExchange":return this.renderStockExchangePopup(s.data);case"financialCenter":return this.renderFinancialCenterPopup(s.data);case"centralBank":return this.renderCentralBankPopup(s.data);case"commodityHub":return this.renderCommodityHubPopup(s.data);case"iranEvent":return this.renderIranEventPopup(s.data);case"gpsJamming":return this.renderGpsJammingPopup(s.data);case"radiation":return this.renderRadiationPopup(s.data);default:return""}}renderRadiationPopup(s){const e=s.severity==="spike"?"high":"medium",p=`${s.delta>=0?"+":""}${s.delta.toFixed(1)} ${a(s.unit)}`,o=Os(s),i=_s(s.confidence),n=[s.corroborated?"Confirmed":"",s.conflictingSources?"Conflicting sources":"",s.convertedFromCpm?"CPM-derived component":""].filter(Boolean).join(" · ");return`
      <div class="popup-header outage">
        <span class="popup-title">☢ ${a(s.location.toUpperCase())}</span>
        <span class="popup-badge ${e}">${a(s.severity.toUpperCase())}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">Reading</span>
            <span class="stat-value">${s.value.toFixed(1)} ${a(s.unit)}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">Baseline</span>
            <span class="stat-value">${s.baselineValue.toFixed(1)} ${a(s.unit)}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">Delta</span>
            <span class="stat-value">${p}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">Confidence</span>
            <span class="stat-value">${a(i)}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">Sources</span>
            <span class="stat-value">${a(o)}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">Source count</span>
            <span class="stat-value">${s.sourceCount}</span>
          </div>
        </div>
        <p class="popup-description">${a(s.country)} · z-score ${s.zScore.toFixed(2)} · ${a(s.freshness)}${n?` · ${a(n)}`:""}</p>
      </div>
    `}renderConflictPopup(s){var o;const e=s.intensity==="high"?"high":s.intensity==="medium"?"medium":"low",p=a(((o=s.intensity)==null?void 0:o.toUpperCase())||t("popups.unknown").toUpperCase());return`
      <div class="popup-header conflict">
        <span class="popup-title">${a(s.name.toUpperCase())}</span>
        <span class="popup-badge ${e}">${p}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">${t("popups.startDate")}</span>
            <span class="stat-value">${a(s.startDate||t("popups.unknown"))}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.casualties")}</span>
            <span class="stat-value">${a(s.casualties||t("popups.unknown"))}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.displaced")}</span>
            <span class="stat-value">${a(s.displaced||t("popups.unknown"))}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.location")}</span>
            <span class="stat-value">${a(s.location||`${s.center[1]}°N, ${s.center[0]}°E`)}</span>
          </div>
        </div>
        ${s.description?`<p class="popup-description">${a(s.description)}</p>`:""}
        ${s.parties&&s.parties.length>0?`
          <div class="popup-section">
            <details open>
              <summary>${t("popups.belligerents")}</summary>
              <div class="popup-section-content">
                <div class="popup-tags">
                  ${s.parties.map(i=>`<span class="popup-tag">${a(i)}</span>`).join("")}
                </div>
              </div>
            </details>
          </div>
        `:""}
        ${s.keyDevelopments&&s.keyDevelopments.length>0?`
          <div class="popup-section">
            <details open>
              <summary>${t("popups.keyDevelopments")}</summary>
              <div class="popup-section-content">
                <ul class="popup-list">
                  ${s.keyDevelopments.map(i=>`<li>${a(i)}</li>`).join("")}
                </ul>
              </div>
            </details>
          </div>
        `:""}
        <div class="popup-section">
          <details class="conflict-history-details">
            <summary>📜 HISTORICAL PROFILE</summary>
            <div class="conflict-history-content">
              <div class="popup-loading">Loading…</div>
            </div>
          </details>
        </div>
      </div>
    `}getLocalizedHotspotSubtext(s){const p=`popups.hotspotSubtexts.${s.toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"")}`,o=t(p);return o===p?s:o}renderHotspotPopup(s,e){const p=s.level||"low",o=a((s.level||"low").toUpperCase()),i=s.subtext?this.getLocalizedHotspotSubtext(s.subtext):"",n=Ms(s.id),c=Us(s.id),l={1:A("--semantic-normal"),2:A("--semantic-normal"),3:A("--semantic-elevated"),4:A("--semantic-high"),5:A("--semantic-critical")},u={1:t("popups.hotspot.levels.stable"),2:t("popups.hotspot.levels.watch"),3:t("popups.hotspot.levels.elevated"),4:t("popups.hotspot.levels.high"),5:t("popups.hotspot.levels.critical")},d={escalating:"↑",stable:"→","de-escalating":"↓"},$={escalating:A("--semantic-critical"),stable:A("--semantic-elevated"),"de-escalating":A("--semantic-normal")},h=(n==null?void 0:n.combinedScore)??s.escalationScore??3,v=Math.round(h),m=(n==null?void 0:n.trend)??s.escalationTrend??"stable",g=`
      <div class="popup-section escalation-section">
        <span class="section-label">${t("popups.hotspot.escalation")}</span>
        <div class="escalation-display">
          <div class="escalation-score" style="background: ${l[v]||A("--text-dim")}">
            <span class="score-value">${h.toFixed(1)}/5</span>
            <span class="score-label">${u[v]||t("popups.unknown")}</span>
          </div>
          <div class="escalation-trend" style="color: ${$[m]||A("--text-dim")}">
            <span class="trend-icon">${d[m]||""}</span>
            <span class="trend-label">${a(m.toUpperCase())}</span>
          </div>
          ${n!=null&&n.history&&n.history.length>=3?(()=>{const b=n.history.slice(-20).map(x=>x.score),S=b[b.length-1]??3,w=S>=4?"#f44336":S>=3?"#ff9800":"#4caf50";return cs(b,w,80,24,"opacity:0.9")})():""}
        </div>
        ${n?`
          <div class="escalation-breakdown">
            <div class="breakdown-header">
              <span class="baseline-label">${t("popups.hotspot.baseline")}: ${n.staticBaseline}/5</span>
              ${c?`
                <span class="change-label ${c.change>=0?"rising":"falling"}">
                  24h: ${c.change>=0?"+":""}${c.change}
                </span>
              `:""}
            </div>
            <div class="breakdown-components">
              <div class="breakdown-row">
                <span class="component-label">${t("popups.hotspot.components.news")}</span>
                <div class="component-bar-bg">
                  <div class="component-bar news" style="width: ${n.components.newsActivity}%"></div>
                </div>
                <span class="component-value">${Math.round(n.components.newsActivity)}</span>
              </div>
              <div class="breakdown-row">
                <span class="component-label">${t("popups.hotspot.components.cii")}</span>
                <div class="component-bar-bg">
                  <div class="component-bar cii" style="width: ${n.components.ciiContribution}%"></div>
                </div>
                <span class="component-value">${Math.round(n.components.ciiContribution)}</span>
              </div>
              <div class="breakdown-row">
                <span class="component-label">${t("popups.hotspot.components.geo")}</span>
                <div class="component-bar-bg">
                  <div class="component-bar geo" style="width: ${n.components.geoConvergence}%"></div>
                </div>
                <span class="component-value">${Math.round(n.components.geoConvergence)}</span>
              </div>
              <div class="breakdown-row">
                <span class="component-label">${t("popups.hotspot.components.military")}</span>
                <div class="component-bar-bg">
                  <div class="component-bar military" style="width: ${n.components.militaryActivity}%"></div>
                </div>
                <span class="component-value">${Math.round(n.components.militaryActivity)}</span>
              </div>
            </div>
          </div>
        `:""}
        ${s.escalationIndicators&&s.escalationIndicators.length>0?`
          <div class="escalation-indicators">
            ${s.escalationIndicators.map(b=>`<span class="indicator-tag">• ${a(b)}</span>`).join("")}
          </div>
        `:""}
      </div>
    `,y=s.history?`
      <div class="popup-section history-section">
        <details>
          <summary>${t("popups.historicalContext")}</summary>
          <div class="popup-section-content">
            <div class="history-content">
              ${s.history.lastMajorEvent?`
                <div class="history-event">
                  <span class="history-label">${t("popups.lastMajorEvent")}:</span>
                  <span class="history-value">${a(s.history.lastMajorEvent)} ${s.history.lastMajorEventDate?`(${a(s.history.lastMajorEventDate)})`:""}</span>
                </div>
              `:""}
              ${s.history.precedentDescription?`
                <div class="history-event">
                  <span class="history-label">${t("popups.precedents")}:</span>
                  <span class="history-value">${a(s.history.precedentDescription)}</span>
                </div>
              `:""}
              ${s.history.cyclicalRisk?`
                <div class="history-event cyclical">
                  <span class="history-label">${t("popups.cyclicalPattern")}:</span>
                  <span class="history-value">${a(s.history.cyclicalRisk)}</span>
                </div>
              `:""}
            </div>
          </div>
        </details>
      </div>
    `:"",C=s.whyItMatters?`
      <div class="popup-section why-matters-section">
        <details>
          <summary>${t("popups.whyItMatters")}</summary>
          <div class="popup-section-content">
            <p class="why-matters-text">${a(s.whyItMatters)}</p>
          </div>
        </details>
      </div>
    `:"";return`
      <div class="popup-header hotspot">
        <span class="popup-title">${a(s.name.toUpperCase())}</span>
        <span class="popup-badge ${p}">${o}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        ${i?`<div class="popup-subtitle">${a(i)}</div>`:""}
        ${s.description?`<p class="popup-description">${a(s.description)}</p>`:""}
        ${g}
        <div class="popup-stats">
          ${s.location?`
            <div class="popup-stat">
              <span class="stat-label">${t("popups.location")}</span>
              <span class="stat-value">${a(s.location)}</span>
            </div>
          `:""}
          <div class="popup-stat">
            <span class="stat-label">${t("popups.coordinates")}</span>
            <span class="stat-value">${a(`${s.lat.toFixed(2)}°N, ${s.lon.toFixed(2)}°E`)}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.status")}</span>
            <span class="stat-value">${a(s.status||t("popups.monitoring"))}</span>
          </div>
        </div>
        ${C}
        ${y}
        ${s.agencies&&s.agencies.length>0?`
          <div class="popup-section">
            <details open>
              <summary>${t("popups.keyEntities")}</summary>
              <div class="popup-section-content">
                <div class="popup-tags">
                  ${s.agencies.map(b=>`<span class="popup-tag">${a(b)}</span>`).join("")}
                </div>
              </div>
            </details>
          </div>
        `:""}
        ${e&&e.length>0?`
          <div class="popup-section">
            <details>
              <summary>${t("popups.relatedHeadlines")}</summary>
              <div class="popup-section-content">
                <div class="popup-news">
                  ${e.slice(0,5).map(b=>`
                    <div class="popup-news-item">
                      <span class="news-source">${a(b.source)}</span>
                      <a href="${T(b.link)}" target="_blank" class="news-title">${a(b.title)}</a>
                    </div>
                  `).join("")}
                </div>
              </div>
            </details>
          </div>
        `:""}
        <div class="hotspot-gdelt-context" data-hotspot-id="${a(s.id)}">
          <div class="hotspot-gdelt-header">${t("popups.liveIntel")}</div>
          <div class="hotspot-gdelt-loading">${t("popups.loadingNews")}</div>
        </div>
      </div>
    `}async loadHotspotGdeltContext(s){if(!this.popup)return;const e=this.popup.querySelector(".hotspot-gdelt-context");if(e)try{const p=await ps(s);if(!this.popup||!e.isConnected)return;if(p.length===0){E(e,L(`
          <div class="hotspot-gdelt-header">${t("popups.liveIntel")}</div>
          <div class="hotspot-gdelt-loading">${t("popups.noCoverage")}</div>
        `,"legacy direct innerHTML migration"));return}E(e,L(`
        <div class="hotspot-gdelt-header">${t("popups.liveIntel")}</div>
        <div class="hotspot-gdelt-articles">
          ${p.slice(0,5).map(o=>this.renderGdeltArticle(o)).join("")}
        </div>
      `,"legacy direct innerHTML migration"))}catch{e.isConnected&&E(e,L(`
          <div class="hotspot-gdelt-header">${t("popups.liveIntel")}</div>
          <div class="hotspot-gdelt-loading">${t("common.error")}</div>
        `,"legacy direct innerHTML migration"))}}loadConflictHistory(s){if(!this.popup)return;const e=this.popup.querySelector(".conflict-history-details"),p=this.popup.querySelector(".conflict-history-content");if(!e||!p)return;let o=!1;const i=async()=>{var n;if(!(!e.open||o)){o=!0;try{const{fetchUcdpEvents:c,deriveConflictHistory:l}=await q(async()=>{const{fetchUcdpEvents:v,deriveConflictHistory:m}=await import("./gdelt-intel-B2bRPowK.js").then(g=>g.ag);return{fetchUcdpEvents:v,deriveConflictHistory:m}},__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10])),u=await c();if(!this.popup||!p.isConnected)return;const{conflictSince:d,recordedFatalities:$}=l(s,u.data),h=[d?`<div class="popup-stat"><span class="stat-label">CONFLICT SINCE</span><span class="stat-value">${a(d)}</span></div>`:"",(n=s.peaceAgreements)!=null&&n.length?`<div class="popup-stat"><span class="stat-label">PEACE AGREEMENTS</span><span class="stat-value">${s.peaceAgreements.map(a).join("<br>")}</span></div>`:"",$>0?`<div class="popup-stat"><span class="stat-label">RECORDED FATALITIES</span><span class="stat-value">~${$.toLocaleString()}</span></div>`:s.totalFatalities?`<div class="popup-stat"><span class="stat-label">TOTAL FATALITIES</span><span class="stat-value">${a(s.totalFatalities)}</span></div>`:""].filter(Boolean).join("");E(p,L(h||'<div class="popup-loading">No historical data available.</div>',"legacy direct innerHTML migration"))}catch{p.isConnected&&E(p,L('<div class="popup-loading">Could not load history.</div>',"legacy direct innerHTML migration"))}}};e.addEventListener("toggle",i,{once:!0})}async loadWingbitsLiveFlight(s){if(!this.popup)return;const e=this.popup.querySelector(".wingbits-live-section");if(e)try{const p=await es(s);if(!this.popup||!e.isConnected)return;if(!p){E(e,L("","legacy direct innerHTML migration"));return}const o=[];let i="";if(p.photoUrl){const l=T(p.photoUrl);if(l){const u=p.photoLink?T(p.photoLink):"#",d=p.photoCredit?`<span class="flight-photo-credit">© ${a(p.photoCredit)}</span>`:"";i=`<div class="flight-photo"><a href="${u}" target="_blank" rel="noopener"><img src="${l}" alt="${a(p.callsign)}" style="width:100%;border-radius:4px;display:block"></a>${d}</div>`}}if(p.callsignIata){const l=p.airlineName?` <span style="font-size:calc(12px * var(--wm-panel-effective-scale, 1));opacity:0.6;font-weight:400">${a(p.airlineName)}</span>`:"";o.push(`<div style="font-weight:700;font-size:calc(15px * var(--wm-panel-effective-scale, 1));margin:4px 0">${a(p.callsignIata)}${l}</div>`)}if(p.depIata&&p.arrIata){const l=p.arrTerminal?`<span style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));opacity:0.5;margin-left:4px">T${a(p.arrTerminal)}</span>`:"",u=p.flightDurationMin?`<span style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));opacity:0.6">${Math.floor(p.flightDurationMin/60)}h${p.flightDurationMin%60>0?` ${p.flightDurationMin%60}m`:""}</span>`:"";o.push(`
          <div class="flight-route" style="display:flex;align-items:center;gap:6px;margin:8px 0 4px;font-weight:700;font-size:calc(18px * var(--wm-panel-effective-scale, 1))">
            <span>${a(p.depIata)}</span>
            <span style="font-size:calc(12px * var(--wm-panel-effective-scale, 1));opacity:0.4;font-weight:400">&#9992;</span>
            <span>${a(p.arrIata)}${l}</span>
            <span style="flex:1;text-align:right">${u}</span>
          </div>`);const d=M(p.depTimeUtc),$=M(p.arrTimeUtc),h=M(p.depEstimatedUtc),v=M(p.arrEstimatedUtc),m=p.depDelayedMin!==0||p.arrDelayedMin!==0;o.push(`
          <div class="flight-times" style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));display:grid;grid-template-columns:1fr auto 1fr;gap:2px 8px;margin-bottom:6px;opacity:0.85">
            <span style="opacity:0.5;font-size:calc(10px * var(--wm-panel-effective-scale, 1));text-transform:uppercase">DEP</span>
            <span></span>
            <span style="opacity:0.5;font-size:calc(10px * var(--wm-panel-effective-scale, 1));text-transform:uppercase;text-align:right">ARR</span>
            <span style="opacity:0.5;font-size:calc(10px * var(--wm-panel-effective-scale, 1))">${t("popups.flight.scheduled")||"Sched"}</span><span></span><span style="opacity:0.5;font-size:calc(10px * var(--wm-panel-effective-scale, 1));text-align:right">${t("popups.flight.scheduled")||"Sched"}</span>
            <span>${d}</span><span style="opacity:0.3;text-align:center">↔</span><span style="text-align:right">${$}</span>
            ${m?`
            <span style="opacity:0.5;font-size:calc(10px * var(--wm-panel-effective-scale, 1))">${t("popups.flight.estimated")||"Est"}</span><span></span><span style="opacity:0.5;font-size:calc(10px * var(--wm-panel-effective-scale, 1));text-align:right">${t("popups.flight.estimated")||"Est"}</span>
            <span>${h}${K(p.depDelayedMin)}</span><span style="opacity:0.3;text-align:center">↔</span><span style="text-align:right">${v}${K(p.arrDelayedMin)}</span>`:""}
          </div>`);const g=new Date,y=`${g.getFullYear()}-${String(g.getMonth()+1).padStart(2,"0")}-${String(g.getDate()).padStart(2,"0")}`,C=T(`https://www.google.com/travel/flights/search?q=Flights+from+${encodeURIComponent(p.depIata)}+to+${encodeURIComponent(p.arrIata)}+on+${encodeURIComponent(y)}`);o.push(`<a href="${C}" target="_blank" rel="noopener" style="display:block;margin-top:8px;padding:7px 12px;background:rgba(68,255,136,.06);border:1px solid rgba(68,255,136,.18);border-radius:6px;color:var(--green,#44ff88);text-decoration:none;font-size:calc(12px * var(--wm-panel-effective-scale, 1));text-align:center">Book this route &rarr;</a>`)}const n=[];if(p.registration&&n.push(`<div class="popup-stat"><span class="stat-label">Reg</span><span class="stat-value">${a(p.registration)}</span></div>`),p.model&&n.push(`<div class="popup-stat"><span class="stat-label">Model</span><span class="stat-value">${a(p.model)}</span></div>`),p.operator&&n.push(`<div class="popup-stat"><span class="stat-label">Operator</span><span class="stat-value">${a(p.operator)}</span></div>`),p.verticalRate!==0&&n.push(`<div class="popup-stat"><span class="stat-label">Climb</span><span class="stat-value">${p.verticalRate>0?"+":""}${Math.round(p.verticalRate)} fpm</span></div>`),o.length===0&&n.length===0&&!i){E(e,L("","legacy direct innerHTML migration"));return}const c=n.length>0?`<div class="popup-stats">${n.join("")}</div>`:"";if(E(e,L(`
        <div class="popup-section-label" style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));opacity:0.5;text-transform:uppercase;letter-spacing:.05em;margin-top:8px">Live Data</div>
        ${o.join("")}
        ${c}
        ${i}
      `,"legacy direct innerHTML migration")),this.clampPopupToViewport(),i){const l=e.querySelector("img");l&&!l.complete&&(l.addEventListener("load",()=>{this.clampPopupToViewport()},{once:!0}),l.addEventListener("error",()=>{this.clampPopupToViewport()},{once:!0}))}}catch{e.isConnected&&E(e,L("","legacy direct innerHTML migration"))}}renderGdeltArticle(s){const e=s.source||os(s.url),p=ns(s.date);return`
      <a href="${T(s.url)}" target="_blank" rel="noopener" class="hotspot-gdelt-article">
        <div class="article-meta">
          <span>${a(e)}</span>
          <span>${a(p)}</span>
        </div>
        <div class="article-title">${a(s.title)}</div>
      </a>
    `}renderEarthquakePopup(s){var i,n;const e=s.magnitude>=6?"high":s.magnitude>=5?"medium":"low",p=s.magnitude>=6?t("popups.earthquake.levels.major"):s.magnitude>=5?t("popups.earthquake.levels.moderate"):t("popups.earthquake.levels.minor"),o=this.getTimeAgo(new Date(s.occurredAt));return`
      <div class="popup-header earthquake">
        <span class="popup-title magnitude">M${s.magnitude.toFixed(1)}</span>
        <span class="popup-badge ${e}">${p}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        <p class="popup-location">${a(s.place)}</p>
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">${t("popups.depth")}</span>
            <span class="stat-value">${s.depthKm.toFixed(1)} km</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.coordinates")}</span>
            <span class="stat-value">${(((i=s.location)==null?void 0:i.latitude)??0).toFixed(2)}°, ${(((n=s.location)==null?void 0:n.longitude)??0).toFixed(2)}°</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.time")}</span>
            <span class="stat-value">${o}</span>
          </div>
        </div>
        <a href="${T(s.sourceUrl)}" target="_blank" class="popup-link">${t("popups.viewUSGS")} →</a>
      </div>
    `}getTimeAgo(s){const e=Math.floor((Date.now()-s.getTime())/1e3);if(e<60)return t("popups.timeAgo.s",{count:e});const p=Math.floor(e/60);if(p<60)return t("popups.timeAgo.m",{count:p});const o=Math.floor(p/60);if(o<24)return t("popups.timeAgo.h",{count:o});const i=Math.floor(o/24);return t("popups.timeAgo.d",{count:i})}renderWeatherPopup(s){const e=a(s.severity.toLowerCase()),p=this.getTimeUntil(s.expires);return`
      <div class="popup-header weather ${e}">
        <span class="popup-title">${a(s.event.toUpperCase())}</span>
        <span class="popup-badge ${e}">${a(s.severity.toUpperCase())}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        <p class="popup-headline">${a(s.headline)}</p>
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">${t("popups.area")}</span>
            <span class="stat-value">${a(s.areaDesc)}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.expires")}</span>
            <span class="stat-value">${p}</span>
          </div>
        </div>
        <p class="popup-description">${a(s.description.slice(0,300))}${s.description.length>300?"...":""}</p>
      </div>
    `}getTimeUntil(s){const e=s instanceof Date?s:new Date(s);if(Number.isNaN(e.getTime()))return"—";const p=e.getTime()-Date.now();if(p<=0)return t("popups.expired");const o=Math.floor(p/(1e3*60*60));return o<1?`${Math.floor(p/(1e3*60))}${t("popups.timeUnits.m")}`:o<24?`${o}${t("popups.timeUnits.h")}`:`${Math.floor(o/24)}${t("popups.timeUnits.d")}`}renderBasePopup(s){const e={"us-nato":t("popups.base.types.us-nato"),china:t("popups.base.types.china"),russia:t("popups.base.types.russia")},p={"us-nato":"elevated",china:"high",russia:"high"},o=s,i=[];return o.catAirforce&&i.push("Air Force"),o.catNaval&&i.push("Naval"),o.catNuclear&&i.push("Nuclear"),o.catSpace&&i.push("Space"),o.catTraining&&i.push("Training"),`
      <div class="popup-header base">
        <span class="popup-title">${a(s.name.toUpperCase())}</span>
        <span class="popup-badge ${p[s.type]||"low"}">${a(e[s.type]||s.type.toUpperCase())}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        ${s.description?`<p class="popup-description">${a(s.description)}</p>`:""}
        ${o.kind?`<p class="popup-description" style="opacity:0.7;margin-top:2px">${a(o.kind.replace(/_/g," "))}</p>`:""}
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">${t("popups.type")}</span>
            <span class="stat-value">${a(e[s.type]||s.type)}</span>
          </div>
          ${s.arm?`<div class="popup-stat"><span class="stat-label">Branch</span><span class="stat-value">${a(s.arm)}</span></div>`:""}
          ${s.country?`<div class="popup-stat"><span class="stat-label">Country</span><span class="stat-value">${a(s.country)}</span></div>`:""}
          ${i.length>0?`<div class="popup-stat"><span class="stat-label">Categories</span><span class="stat-value">${a(i.join(", "))}</span></div>`:""}
          <div class="popup-stat">
            <span class="stat-label">${t("popups.coordinates")}</span>
            <span class="stat-value">${s.lat.toFixed(2)}°, ${s.lon.toFixed(2)}°</span>
          </div>
        </div>
      </div>
    `}renderWaterwayPopup(s){var u,d,$;const e=(d=(u=this.chokepointData)==null?void 0:u.chokepoints)==null?void 0:d.find(h=>h.id===s.chokepointId),p=!!e&&(($=e.transitSummary)==null?void 0:$.dataAvailable)!==!1,o=R(D()),i=F[s.chokepointId],n=i&&!o?`<div class="popup-section-title" style="margin-top:10px;font-size:calc(10px * var(--wm-panel-effective-scale, 1));text-transform:uppercase;opacity:.6;letter-spacing:.06em">Trade Sector Mix</div>
         ${Fs(i)}`:"";let c="";p&&(o?c=`<div data-transit-chart="${a(s.name)}" data-transit-chart-id="${a((e==null?void 0:e.id)??"")}" style="margin-top:10px;min-height:200px;display:flex;align-items:center;justify-content:center;color:var(--text-dim,#888);font-size:calc(12px * var(--wm-panel-effective-scale, 1))">${t("components.supplyChain.loadingHistory")||"Loading transit history…"}</div>`:c=`
          <div class="sector-pro-gate" data-gate="chokepoint-transit-chart" style="position:relative;overflow:hidden;border-radius:6px;margin-top:10px;min-height:120px;background:var(--surface-elevated, #111)">
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:4px">
              <span style="font-size:calc(16px * var(--wm-panel-effective-scale, 1))">🔒</span>
              <span style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));font-weight:600;opacity:.8">PRO</span>
              <span style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));opacity:.5">Transit History</span>
            </div>
          </div>`);let l="";return i&&(o?l=`
          <div class="popup-section-title" style="margin-top:10px;font-size:calc(10px * var(--wm-panel-effective-scale, 1));text-transform:uppercase;opacity:.6;letter-spacing:.06em">Sector Exposure</div>
          <div data-hs2-ring="${a(s.chokepointId)}" class="popup-hs2-ring-container"></div>`:l=`
          <div class="sector-pro-gate" data-gate="chokepoint-sector-ring" style="position:relative;overflow:hidden;border-radius:6px;margin-top:10px;min-height:80px;background:var(--surface-elevated, #111)">
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:4px">
              <span style="font-size:calc(16px * var(--wm-panel-effective-scale, 1))">🔒</span>
              <span style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));font-weight:600;opacity:.8">PRO</span>
              <span style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));opacity:.5">Sector Breakdown</span>
            </div>
          </div>`),`
      <div class="popup-header waterway">
        <span class="popup-title">${a(s.name)}</span>
        <span class="popup-badge elevated">${t("popups.strategic")}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        ${s.description?`<p class="popup-description">${a(s.description)}</p>`:""}
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">${t("popups.coordinates")}</span>
            <span class="stat-value">${s.lat.toFixed(2)}°, ${s.lon.toFixed(2)}°</span>
          </div>
        </div>
        ${n}
        ${l}
        ${c}
      </div>
    `}renderAisPopup(s){var l,u;const e=a(s.severity),p=a(s.severity.toUpperCase()),o=s.type==="gap_spike"?t("popups.aisGapSpike"):t("popups.chokepointCongestion"),i=s.type==="gap_spike"?t("popups.darkening"):t("popups.density"),n=s.type==="gap_spike"?t("popups.darkShips"):t("popups.vesselCount"),c=s.type==="gap_spike"?((l=s.darkShips)==null?void 0:l.toString())||"—":((u=s.vesselCount)==null?void 0:u.toString())||"—";return`
      <div class="popup-header ais">
        <span class="popup-title">${a(s.name.toUpperCase())}</span>
        <span class="popup-badge ${e}">${p}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        <div class="popup-subtitle">${o}</div>
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">${i}</span>
            <span class="stat-value">${s.changePct}% ↑</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${n}</span>
            <span class="stat-value">${c}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.window")}</span>
            <span class="stat-value">${s.windowHours}H</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.region")}</span>
            <span class="stat-value">${a(s.region||`${s.lat.toFixed(2)}°, ${s.lon.toFixed(2)}°`)}</span>
          </div>
        </div>
        <p class="popup-description">${a(s.description)}</p>
      </div>
    `}renderProtestPopup(s){var v,m,g;const e=a(s.severity),p=a(s.severity.toUpperCase()),o=a(s.eventType.replace("_"," ").toUpperCase()),i=s.eventType==="riot"?"🔥":s.eventType==="strike"?"✊":"📢",n=s.sourceType==="acled"?t("popups.protest.acledVerified"):t("popups.protest.gdelt"),c=s.validated?`<span class="popup-badge verified">${t("popups.verified")}</span>`:"",l=s.fatalities?`<div class="popup-stat"><span class="stat-label">${t("popups.fatalities")}</span><span class="stat-value alert">${s.fatalities}</span></div>`:"",u=(v=s.actors)!=null&&v.length?`<div class="popup-stat"><span class="stat-label">${t("popups.actors")}</span><span class="stat-value">${s.actors.map(y=>a(y)).join(", ")}</span></div>`:"",d=Rs(s.sourceUrls,{label:t("popups.source")}),$=(m=s.tags)!=null&&m.length?`<div class="popup-tags">${s.tags.map(y=>`<span class="popup-tag">${a(y)}</span>`).join("")}</div>`:"",h=(g=s.relatedHotspots)!=null&&g.length?`<div class="popup-related">${t("popups.near")}: ${s.relatedHotspots.map(y=>a(y)).join(", ")}</div>`:"";return`
      <div class="popup-header protest ${e}">
        <span class="popup-icon">${i}</span>
        <span class="popup-title">${o}</span>
        <span class="popup-badge ${e}">${p}</span>
        ${c}
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        <div class="popup-subtitle">${s.city?`${a(s.city)}, `:""}${a(s.country)}</div>
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">${t("popups.time")}</span>
            <span class="stat-value">${s.time.toLocaleDateString()}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.source")}</span>
            <span class="stat-value">${n}</span>
          </div>
          ${l}
          ${u}
        </div>
        ${s.title?`<p class="popup-description">${a(s.title)}</p>`:""}
        ${d}
        ${$}
        ${h}
      </div>
    `}renderProtestClusterPopup(s){const e=s.count??s.items.length,p=s.riotCount??s.items.filter(v=>v.eventType==="riot").length,o=s.highSeverityCount??s.items.filter(v=>v.severity==="high").length,i=s.verifiedCount??s.items.filter(v=>v.validated).length,n=s.totalFatalities??s.items.reduce((v,m)=>v+(m.fatalities||0),0),l=[...s.items].sort((v,m)=>{const g={high:0,medium:1,low:2},y={riot:0,civil_unrest:1,strike:2,demonstration:3,protest:4},C=(g[v.severity]??3)-(g[m.severity]??3);return C!==0?C:(y[v.eventType]??5)-(y[m.eventType]??5)}).slice(0,10).map(v=>{var x;const m=v.eventType==="riot"?"🔥":v.eventType==="strike"?"✊":"📢",g=v.severity,y=v.time.toLocaleDateString(void 0,{month:"short",day:"numeric"}),C=v.city?a(v.city):"",b=v.title?`: ${a(v.title.slice(0,40))}${v.title.length>40?"...":""}`:"",S=(x=v.sourceUrls)==null?void 0:x.find(P=>T(P)),w=S?` <a class="popup-link cluster-source-link" href="${T(S)}" target="_blank" rel="noopener noreferrer nofollow">${t("popups.source")} →</a>`:"";return`<li class="cluster-item ${g}">${m} ${y}${C?` • ${C}`:""}${b}${w}</li>`}).join(""),u=Math.min(10,s.items.length),d=Math.max(0,e-u),$=d>0?`<li class="cluster-more">+${d} ${t("popups.moreEvents")}</li>`:"";return`
      <div class="popup-header protest ${o>0?"high":p>0?"medium":"low"} cluster">
        <span class="popup-title">📢 ${a(s.country)}</span>
        <span class="popup-badge">${e} ${t("popups.events").toUpperCase()}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body cluster-popup">
        <div class="cluster-summary">
          ${p?`<span class="summary-item riot">🔥 ${p} ${t("popups.protest.riots")}</span>`:""}
          ${o?`<span class="summary-item high">⚠️ ${o} ${t("popups.protest.highSeverity")}</span>`:""}
          ${i?`<span class="summary-item verified">✓ ${i} ${t("popups.verified")}</span>`:""}
          ${n>0?`<span class="summary-item fatalities">💀 ${n} ${t("popups.fatalities")}</span>`:""}
        </div>
        <ul class="cluster-list">${l}${$}</ul>
        ${s.sampled?`<p class="popup-more">${t("popups.sampledList",{count:s.items.length})}</p>`:""}
      </div>
    `}renderFlightPopup(s){const e=a(s.severity),p=s.severity==="unknown"?"NO DATA":a(s.severity.toUpperCase()),o={ground_stop:t("popups.flight.groundStop"),ground_delay:t("popups.flight.groundDelay"),departure_delay:t("popups.flight.departureDelay"),arrival_delay:t("popups.flight.arrivalDelay"),general:t("popups.flight.delaysReported"),closure:t("popups.flight.closure")},i=s.severity==="unknown"?"Coverage unavailable":o[s.delayType]||t("popups.flight.delays"),n=s.severity==="unknown"?"❔":s.delayType==="closure"?"🚫":s.delayType==="ground_stop"?"🛑":s.severity==="severe"?"✈️":"🛫",l={faa:t("popups.flight.sources.faa"),eurocontrol:t("popups.flight.sources.eurocontrol"),computed:t("popups.flight.sources.computed"),aviationstack:t("popups.flight.sources.aviationstack"),notam:t("popups.flight.sources.notam"),unspecified:"—"}[s.source]||a(s.source),d={americas:t("popups.flight.regions.americas"),europe:t("popups.flight.regions.europe"),apac:t("popups.flight.regions.apac"),mena:t("popups.flight.regions.mena"),africa:t("popups.flight.regions.africa")}[s.region]||a(s.region),$=s.avgDelayMinutes>0?`<div class="popup-stat"><span class="stat-label">${t("popups.flight.avgDelay")}</span><span class="stat-value alert">+${s.avgDelayMinutes} ${t("popups.timeUnits.m")}</span></div>`:"",h=s.reason?`<div class="popup-stat"><span class="stat-label">${t("popups.reason")}</span><span class="stat-value">${a(s.reason)}</span></div>`:"",v=s.cancelledFlights?`<div class="popup-stat"><span class="stat-label">${t("popups.flight.cancelled")}</span><span class="stat-value alert">${s.cancelledFlights} ${t("popups.events")}</span></div>`:"";return`
      <div class="popup-header flight ${e}">
        <span class="popup-icon">${n}</span>
        <span class="popup-title">${a(s.iata)} - ${i}</span>
        <span class="popup-badge ${e}">${p}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        <div class="popup-subtitle">${a(s.name)}</div>
        <div class="popup-location">${a(s.city)}, ${a(s.country)}</div>
        <div class="popup-stats">
          ${$}
          ${h}
          ${v}
          <div class="popup-stat">
            <span class="stat-label">${t("popups.region")}</span>
            <span class="stat-value">${d}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.source")}</span>
            <span class="stat-value">${l}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.updated")}</span>
            <span class="stat-value">${s.updatedAt.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    `}renderAircraftPopup(s){const e=a(s.callsign||s.icao24),p=s.onGround?"low":"elevated",o=s.onGround?t("popups.aircraft.ground"):t("popups.aircraft.airborne"),i=s.altitudeFt>0?`FL${Math.round(s.altitudeFt/100)} (${s.altitudeFt.toLocaleString()} ft)`:t("popups.aircraft.ground");return`
      <div class="popup-header aircraft">
        <span class="popup-icon">&#9992;</span>
        <span class="popup-title">${e}</span>
        <span class="popup-badge ${p}">${o}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        <div class="popup-subtitle">ICAO24: ${a(s.icao24)}</div>
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">${t("popups.aircraft.altitude")}</span>
            <span class="stat-value">${i}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.aircraft.speed")}</span>
            <span class="stat-value">${s.groundSpeedKts} kts</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.aircraft.heading")}</span>
            <span class="stat-value">${Math.round(s.trackDeg)}&deg;</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.aircraft.position")}</span>
            <span class="stat-value">${s.lat.toFixed(4)}&deg;, ${s.lon.toFixed(4)}&deg;</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.source")}</span>
            <span class="stat-value">${Hs(s.source)}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.updated")}</span>
            <span class="stat-value">${s.observedAt.toLocaleTimeString()}</span>
          </div>
        </div>
${W("wingbitsEnrichment")?'<div class="wingbits-live-section"><div class="wingbits-live-loading" style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));opacity:0.5;padding:4px 0">Loading Wingbits live data…</div></div>':""}
      </div>
    `}renderAPTPopup(s){var n,c;const e=(n=s.tactics)!=null&&n.length?`<div class="popup-tags">${s.tactics.map(l=>`<span class="popup-tag">${a(l)}</span>`).join("")}</div>`:"",p=(c=s.targetSectors)!=null&&c.length?`<div class="popup-subtitle" style="margin-top:6px">Targets: ${a(s.targetSectors.join(", "))}</div>`:"",o=s.mitreId&&s.mitreUrl?`<div class="popup-stat"><span class="stat-label">MITRE</span><span class="stat-value"><a class="popup-link" href="${a(s.mitreUrl)}" target="_blank" rel="noopener">${a(s.mitreId)} ↗</a></span></div>`:"",i=s.active===!1?'<span class="popup-badge low">Inactive</span>':`<span class="popup-badge high">${t("popups.threat")}</span>`;return`
      <div class="popup-header apt">
        <span class="popup-title">${a(s.name)}</span>
        ${i}
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        <div class="popup-subtitle">${a(s.aka)}</div>
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">${t("popups.sponsor")}</span>
            <span class="stat-value">${a(s.sponsor)}</span>
          </div>
          ${o}
        </div>
        ${s.description?`<p class="popup-description">${a(s.description)}</p>`:""}
        ${e}
        ${p}
      </div>
    `}renderCyberThreatPopup(s){const e=a(s.severity),o={feodo:"Feodo Tracker",urlhaus:"URLhaus",c2intel:"C2 Intel Feeds",otx:"AlienVault OTX",abuseipdb:"AbuseIPDB"}[s.source]||s.source,i=s.type.replace(/_/g," ").toUpperCase(),n=(s.tags||[]).slice(0,6);return`
      <div class="popup-header apt ${e}">
        <span class="popup-title">${t("popups.cyberThreat.title")}</span>
        <span class="popup-badge ${e}">${a(s.severity.toUpperCase())}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        <div class="popup-subtitle">${a(i)}</div>
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">${a(s.indicatorType.toUpperCase())}</span>
            <span class="stat-value">${a(s.indicator)}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.country")}</span>
            <span class="stat-value">${a(s.country||t("popups.unknown"))}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.source")}</span>
            <span class="stat-value">${a(o)}</span>
          </div>
          ${s.malwareFamily?`<div class="popup-stat">
            <span class="stat-label">${t("popups.malware")}</span>
            <span class="stat-value">${a(s.malwareFamily)}</span>
          </div>`:""}
          <div class="popup-stat">
            <span class="stat-label">${t("popups.lastSeen")}</span>
            <span class="stat-value">${a(s.lastSeen?new Date(s.lastSeen).toLocaleString():t("popups.unknown"))}</span>
          </div>
        </div>
        ${n.length>0?`
        <div class="popup-tags">
          ${n.map(c=>`<span class="popup-tag">${a(c)}</span>`).join("")}
        </div>`:""}
      </div>
    `}renderNuclearPopup(s){var o,i,n,c;const e={plant:t("popups.nuclear.types.plant"),enrichment:t("popups.nuclear.types.enrichment"),weapons:t("popups.nuclear.types.weapons"),research:t("popups.nuclear.types.research"),reprocessing:t("popups.nuclear.types.reprocessing"),"test-site":t("popups.nuclear.types.testSite")},p={active:"elevated",contested:"high",decommissioned:"low"};return`
      <div class="popup-header nuclear">
        <span class="popup-title">${a(s.name.toUpperCase())}</span>
        <span class="popup-badge ${p[s.status]||"low"}">${a(s.status.toUpperCase())}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">${t("popups.type")}</span>
            <span class="stat-value">${a(e[s.type]||s.type.toUpperCase())}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.status")}</span>
            <span class="stat-value">${a(s.status.toUpperCase())}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.coordinates")}</span>
            <span class="stat-value">${s.lat.toFixed(2)}°, ${s.lon.toFixed(2)}°</span>
          </div>
        </div>
        <p class="popup-description">${t("popups.nuclear.description")}</p>
        ${s.operationalSince||(o=s.treaties)!=null&&o.length||s.iaeaStatus||(i=s.keyEvents)!=null&&i.length?`
        <div class="popup-section">
          <details>
            <summary>📜 HISTORICAL PROFILE</summary>
            <div class="popup-section-content">
              ${s.operationalSince?`
              <div class="popup-stat">
                <span class="stat-label">OPERATIONAL SINCE</span>
                <span class="stat-value">${a(s.operationalSince)}</span>
              </div>`:""}
              ${(n=s.treaties)!=null&&n.length?`
              <div class="popup-stat">
                <span class="stat-label">TREATIES</span>
                <span class="stat-value">${s.treaties.map(a).join(", ")}</span>
              </div>`:""}
              ${s.iaeaStatus?`
              <div class="popup-stat">
                <span class="stat-label">IAEA STATUS</span>
                <span class="stat-value">${a(s.iaeaStatus)}</span>
              </div>`:""}
              ${(c=s.keyEvents)!=null&&c.length?`
              <div class="popup-stat">
                <span class="stat-label">KEY EVENTS</span>
                <span class="stat-value">${s.keyEvents.map(a).join("<br>")}</span>
              </div>`:""}
            </div>
          </details>
        </div>`:""}
      </div>
    `}renderEconomicPopup(s){const e={exchange:t("popups.economic.types.exchange"),"central-bank":t("popups.economic.types.centralBank"),"financial-hub":t("popups.economic.types.financialHub")},p={exchange:"📈","central-bank":"🏛","financial-hub":"💰"},o=s.marketHours?this.getMarketStatus(s.marketHours):null,i=o?o==="open"?t("popups.open"):o==="closed"?t("popups.economic.closed"):t("popups.unknown"):"";return`
      <div class="popup-header economic ${s.type}">
        <span class="popup-title">${p[s.type]||""} ${a(s.name.toUpperCase())}</span>
        <span class="popup-badge ${o==="open"?"elevated":"low"}">${a(i||e[s.type]||"")}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        ${s.description?`<p class="popup-description">${a(s.description)}</p>`:""}
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">${t("popups.type")}</span>
            <span class="stat-value">${a(e[s.type]||s.type.toUpperCase())}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.country")}</span>
            <span class="stat-value">${a(s.country)}</span>
          </div>
          ${s.marketHours?`
          <div class="popup-stat">
            <span class="stat-label">${t("popups.tradingHours")}</span>
            <span class="stat-value">${a(s.marketHours.open)} - ${a(s.marketHours.close)}</span>
          </div>
          `:""}
          <div class="popup-stat">
            <span class="stat-label">${t("popups.coordinates")}</span>
            <span class="stat-value">${s.lat.toFixed(2)}°, ${s.lon.toFixed(2)}°</span>
          </div>
        </div>
      </div>
    `}renderIrradiatorPopup(s){return`
      <div class="popup-header irradiator">
        <span class="popup-title">☢ ${a(s.city.toUpperCase())}</span>
        <span class="popup-badge elevated">${t("popups.gamma")}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        <div class="popup-subtitle">${t("popups.irradiator.subtitle")}</div>
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">${t("popups.country")}</span>
            <span class="stat-value">${a(s.country)}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.city")}</span>
            <span class="stat-value">${a(s.city)}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.coordinates")}</span>
            <span class="stat-value">${s.lat.toFixed(2)}°, ${s.lon.toFixed(2)}°</span>
          </div>
        </div>
        <p class="popup-description">${t("popups.irradiator.description")}</p>
      </div>
    `}renderPipelinePopup(s){const e={oil:t("popups.pipeline.types.oil"),gas:t("popups.pipeline.types.gas"),products:t("popups.pipeline.types.products")},p={oil:"high",gas:"elevated",products:"low"},o={operating:t("popups.pipeline.status.operating"),construction:t("popups.pipeline.status.construction")},i=s.type==="oil"?"🛢":s.type==="gas"?"🔥":"⛽";return`
      <div class="popup-header pipeline ${s.type}">
        <span class="popup-title">${i} ${a(s.name.toUpperCase())}</span>
        <span class="popup-badge ${p[s.type]||"low"}">${a(s.type.toUpperCase())}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        <div class="popup-subtitle">${e[s.type]||t("popups.pipeline.title")}</div>
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">${t("popups.status")}</span>
            <span class="stat-value">${a(o[s.status]||s.status.toUpperCase())}</span>
          </div>
          ${s.capacity?`
          <div class="popup-stat">
            <span class="stat-label">${t("popups.capacity")}</span>
            <span class="stat-value">${a(s.capacity)}</span>
          </div>
          `:""}
          ${s.length?`
          <div class="popup-stat">
            <span class="stat-label">${t("popups.length")}</span>
            <span class="stat-value">${a(s.length)}</span>
          </div>
          `:""}
          ${s.operator?`
          <div class="popup-stat">
            <span class="stat-label">${t("popups.operator")}</span>
            <span class="stat-value">${a(s.operator)}</span>
          </div>
          `:""}
        </div>
        ${s.countries&&s.countries.length>0?`
          <div class="popup-section">
            <span class="section-label">${t("popups.countries")}</span>
            <div class="popup-tags">
              ${s.countries.map(n=>`<span class="popup-tag">${a(n)}</span>`).join("")}
            </div>
          </div>
        `:""}
        <p class="popup-description">${t("popups.pipeline.description",{type:s.type,status:s.status==="operating"?t("popups.pipelineStatusDesc.operating"):t("popups.pipelineStatusDesc.construction")})}</p>
      </div>
    `}renderCablePopup(s){var y;const e=this.getLatestCableAdvisory(s.id),p=this.getPriorityRepairShip(s.id),o=is(s.id);let i,n;(o==null?void 0:o.status)==="fault"?(i=t("popups.cable.fault"),n="high"):(o==null?void 0:o.status)==="degraded"?(i=t("popups.cable.degraded"),n="elevated"):e?(i=e.severity==="fault"?t("popups.cable.fault"):t("popups.cable.degraded"),n=e.severity==="fault"?"high":"elevated"):(i=t("popups.cable.active"),n="low");const c=(p==null?void 0:p.eta)||(e==null?void 0:e.repairEta),l=a(s.name.toUpperCase()),u=a(i),d=c?a(c):"",$=e?a(e.title):"",h=e?a(e.impact):"",v=e?a(e.description):"",m=p?a(p.name):"",g=p?a(p.note||t("popups.repairShip.note")):"";return`
      <div class="popup-header cable">
        <span class="popup-title">🌐 ${l}</span>
        <span class="popup-badge ${n}">${s.major?t("popups.cable.major"):t("popups.cable.cable")}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        <div class="popup-subtitle">${t("popups.cable.subtitle")}</div>
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">${t("popups.type")}</span>
            <span class="stat-value">${t("popups.cable.type")}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.waypoints")}</span>
            <span class="stat-value">${s.points.length}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.status")}</span>
            <span class="stat-value">${u}</span>
          </div>
          ${c?`
          <div class="popup-stat">
            <span class="stat-label">${t("popups.repairEta")}</span>
            <span class="stat-value">${d}</span>
          </div>
          `:""}
        </div>
        ${e?`
          <div class="popup-section">
            <span class="section-label">${t("popups.cable.advisory")}</span>
            <div class="popup-tags">
              <span class="popup-tag">${$}</span>
              <span class="popup-tag">${h}</span>
            </div>
            <p class="popup-description">${v}</p>
          </div>
        `:""}
        ${p?`
          <div class="popup-section">
            <span class="section-label">${t("popups.cable.repairDeployment")}</span>
            <div class="popup-tags">
              <span class="popup-tag">${m}</span>
              <span class="popup-tag">${p.status==="on-station"?t("popups.cable.repairStatus.onStation"):t("popups.cable.repairStatus.enRoute")}</span>
            </div>
            <p class="popup-description">${g}</p>
          </div>
        `:""}
        ${(y=o==null?void 0:o.evidence)!=null&&y.length?`
          <div class="popup-section">
            <span class="section-label">${t("popups.cable.health.evidence")}</span>
            <ul class="evidence-list">
              ${o.evidence.map(C=>`<li class="evidence-item"><strong>${a(C.source)}</strong>: ${a(C.summary)}</li>`).join("")}
            </ul>
          </div>
        `:""}
        <p class="popup-description">${t("popups.cable.description")}</p>
      </div>
    `}renderCableAdvisoryPopup(s){const e=_.find(d=>d.id===s.cableId),p=this.getTimeAgo(s.reported),o=s.severity==="fault"?t("popups.cable.fault"):t("popups.cable.degraded"),i=a((e==null?void 0:e.name.toUpperCase())||s.cableId.toUpperCase()),n=a(s.title),c=a(s.impact),l=s.repairEta?a(s.repairEta):"",u=a(s.description);return`
      <div class="popup-header cable">
        <span class="popup-title">🚨 ${i}</span>
        <span class="popup-badge ${s.severity==="fault"?"high":"elevated"}">${o}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        <div class="popup-subtitle">${n}</div>
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">${t("popups.cableAdvisory.reported")}</span>
            <span class="stat-value">${p}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.cableAdvisory.impact")}</span>
            <span class="stat-value">${c}</span>
          </div>
          ${s.repairEta?`
          <div class="popup-stat">
            <span class="stat-label">${t("popups.cableAdvisory.eta")}</span>
            <span class="stat-value">${l}</span>
          </div>
          `:""}
        </div>
        <p class="popup-description">${u}</p>
      </div>
    `}renderRepairShipPopup(s){const e=_.find(l=>l.id===s.cableId),p=a(s.name.toUpperCase()),o=a((e==null?void 0:e.name)||s.cableId),i=a(s.eta),n=s.operator?a(s.operator):"",c=a(s.note||t("popups.repairShip.description"));return`
      <div class="popup-header cable">
        <span class="popup-title">🚢 ${p}</span>
        <span class="popup-badge elevated">${t("popups.repairShip.badge")}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        <div class="popup-subtitle">${o}</div>
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">${t("popups.status")}</span>
            <span class="stat-value">${s.status==="on-station"?t("popups.repairShip.status.onStation"):t("popups.repairShip.status.enRoute")}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.cableAdvisory.eta")}</span>
            <span class="stat-value">${i}</span>
          </div>
          ${s.operator?`
          <div class="popup-stat">
            <span class="stat-label">${t("popups.operator")}</span>
            <span class="stat-value">${n}</span>
          </div>
          `:""}
        </div>
        <p class="popup-description">${c}</p>
      </div>
    `}getLatestCableAdvisory(s){return this.cableAdvisories.filter(p=>p.cableId===s).reduce((p,o)=>p?o.reported.getTime()>p.reported.getTime()?o:p:o,void 0)}getPriorityRepairShip(s){const e=this.repairShips.filter(o=>o.cableId===s);return e.length===0?void 0:e.find(o=>o.status==="on-station")||e[0]}renderOutagePopup(s){const e={total:"high",major:"elevated",partial:"low"},p={total:t("popups.outage.levels.total"),major:t("popups.outage.levels.major"),partial:t("popups.outage.levels.partial")},o=this.getTimeAgo(s.pubDate);return`
      <div class="popup-header outage ${a(s.severity)}">
        <span class="popup-title">📡 ${a(s.country.toUpperCase())}</span>
        <span class="popup-badge ${e[s.severity]||"low"}">${p[s.severity]||t("popups.outage.levels.disruption")}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        <div class="popup-subtitle">${a(s.title)}</div>
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">${t("popups.severity")}</span>
            <span class="stat-value">${a(s.severity.toUpperCase())}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.outage.reported")}</span>
            <span class="stat-value">${o}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.coordinates")}</span>
            <span class="stat-value">${s.lat.toFixed(2)}°, ${s.lon.toFixed(2)}°</span>
          </div>
        </div>
        ${s.categories&&s.categories.length>0?`
          <div class="popup-section">
            <span class="section-label">${t("popups.outage.categories")}</span>
            <div class="popup-tags">
              ${s.categories.slice(0,5).map(n=>`<span class="popup-tag">${a(n)}</span>`).join("")}
            </div>
          </div>
        `:""}
        ${s.description?`<p class="popup-description">${a(s.description.slice(0,250))}${s.description.length>250?"...":""}</p>`:""}
        <a href="${T(s.link)}" target="_blank" class="popup-link">${t("popups.outage.readReport")} →</a>
      </div>
    `}renderDatacenterPopup(s){const e={existing:"normal",planned:"elevated",decommissioned:"low"},p={existing:t("popups.datacenter.status.existing"),planned:t("popups.datacenter.status.planned"),decommissioned:t("popups.datacenter.status.decommissioned")},o=i=>i>=1e6?`${(i/1e6).toFixed(1)}M`:i>=1e3?`${(i/1e3).toFixed(0)}K`:i.toString();return`
      <div class="popup-header datacenter ${s.status}">
        <span class="popup-title">🖥️ ${a(s.name)}</span>
        <span class="popup-badge ${e[s.status]||"normal"}">${p[s.status]||t("popups.datacenter.status.unknown")}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        <div class="popup-subtitle">${a(s.owner)} • ${a(s.country)}</div>
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">${t("popups.datacenter.gpuChipCount")}</span>
            <span class="stat-value">${o(s.chipCount)}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.datacenter.chipType")}</span>
            <span class="stat-value">${a(s.chipType||t("popups.unknown"))}</span>
          </div>
          ${s.powerMW?`
          <div class="popup-stat">
            <span class="stat-label">${t("popups.datacenter.power")}</span>
            <span class="stat-value">${s.powerMW.toFixed(0)} MW</span>
          </div>
          `:""}
          ${s.sector?`
          <div class="popup-stat">
            <span class="stat-label">${t("popups.datacenter.sector")}</span>
            <span class="stat-value">${a(s.sector)}</span>
          </div>
          `:""}
        </div>
        ${s.note?`<p class="popup-description">${a(s.note)}</p>`:""}
        <div class="popup-attribution">${t("popups.datacenter.attribution")}</div>
      </div>
    `}renderDatacenterClusterPopup(s){const e=s.count??s.items.length,p=s.totalChips??s.items.reduce((u,d)=>u+d.chipCount,0),o=s.totalPowerMW??s.items.reduce((u,d)=>u+(d.powerMW||0),0),i=s.existingCount??s.items.filter(u=>u.status==="existing").length,n=s.plannedCount??s.items.filter(u=>u.status==="planned").length,c=u=>u>=1e6?`${(u/1e6).toFixed(1)}M`:u>=1e3?`${(u/1e3).toFixed(0)}K`:u.toString(),l=s.items.slice(0,8).map(u=>`
      <div class="cluster-item">
        <span class="cluster-item-icon">${u.status==="planned"?"🔨":"🖥️"}</span>
        <div class="cluster-item-info">
          <span class="cluster-item-name">${a(u.name.slice(0,40))}${u.name.length>40?"...":""}</span>
          <span class="cluster-item-detail">${a(u.owner)} • ${c(u.chipCount)} ${t("popups.datacenter.chips")}</span>
        </div>
      </div>
    `).join("");return`
      <div class="popup-header datacenter cluster">
        <span class="popup-title">🖥️ ${t("popups.datacenter.cluster.title",{count:String(e)})}</span>
        <span class="popup-badge elevated">${a(s.region)}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        <div class="popup-subtitle">${a(s.country)}</div>
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">${t("popups.datacenter.cluster.totalChips")}</span>
            <span class="stat-value">${c(p)}</span>
          </div>
          ${o>0?`
          <div class="popup-stat">
            <span class="stat-label">${t("popups.datacenter.cluster.totalPower")}</span>
            <span class="stat-value">${o.toFixed(0)} MW</span>
          </div>
          `:""}
          <div class="popup-stat">
            <span class="stat-label">${t("popups.datacenter.cluster.operational")}</span>
            <span class="stat-value">${i}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.datacenter.cluster.planned")}</span>
            <span class="stat-value">${n}</span>
          </div>
        </div>
        <div class="cluster-list">
          ${l}
        </div>
        ${e>8?`<p class="popup-more">${t("popups.datacenter.cluster.moreDataCenters",{count:String(Math.max(0,e-8))})}</p>`:""}
        ${s.sampled?`<p class="popup-more">${t("popups.datacenter.cluster.sampledSites",{count:String(s.items.length)})}</p>`:""}
        <div class="popup-attribution">${t("popups.datacenter.attribution")}</div>
      </div>
    `}renderStartupHubPopup(s){const e={mega:t("popups.startupHub.tiers.mega"),major:t("popups.startupHub.tiers.major"),emerging:t("popups.startupHub.tiers.emerging")},p={mega:"🦄",major:"🚀",emerging:"💡"};return`
      <div class="popup-header startup-hub ${s.tier}">
        <span class="popup-title">${p[s.tier]||"🚀"} ${a(s.name)}</span>
        <span class="popup-badge ${s.tier}">${e[s.tier]||t("popups.startupHub.tiers.hub")}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        <div class="popup-subtitle">${a(s.city)}, ${a(s.country)}</div>
        ${s.unicorns?`
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">${t("popups.startupHub.unicorns")}</span>
            <span class="stat-value">${s.unicorns}+</span>
          </div>
        </div>
        `:""}
        ${s.description?`<p class="popup-description">${a(s.description)}</p>`:""}
      </div>
    `}renderCloudRegionPopup(s){const e={aws:"Amazon Web Services",gcp:"Google Cloud Platform",azure:"Microsoft Azure",cloudflare:"Cloudflare"},p={aws:"🟠",gcp:"🔵",azure:"🟣",cloudflare:"🟡"};return`
      <div class="popup-header cloud-region ${s.provider}">
        <span class="popup-title">${p[s.provider]||"☁️"} ${a(s.name)}</span>
        <span class="popup-badge ${s.provider}">${a(s.provider.toUpperCase())}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        <div class="popup-subtitle">${a(s.city)}, ${a(s.country)}</div>
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">${t("popups.cloudRegion.provider")}</span>
            <span class="stat-value">${a(e[s.provider]||s.provider)}</span>
          </div>
          ${s.zones?`
          <div class="popup-stat">
            <span class="stat-label">${t("popups.cloudRegion.availabilityZones")}</span>
            <span class="stat-value">${s.zones}</span>
          </div>
          `:""}
        </div>
      </div>
    `}renderTechHQPopup(s){const e={faang:t("popups.techHQ.types.faang"),unicorn:t("popups.techHQ.types.unicorn"),public:t("popups.techHQ.types.public")},p={faang:"🏛️",unicorn:"🦄",public:"🏢"};return`
      <div class="popup-header tech-hq ${s.type}">
        <span class="popup-title">${p[s.type]||"🏢"} ${a(s.company)}</span>
        <span class="popup-badge ${s.type}">${e[s.type]||t("popups.techHQ.types.tech")}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        <div class="popup-subtitle">${a(s.city)}, ${a(s.country)}</div>
        <div class="popup-stats">
          ${s.marketCap?`
          <div class="popup-stat">
            <span class="stat-label">${t("popups.techHQ.marketCap")}</span>
            <span class="stat-value">${a(s.marketCap)}</span>
          </div>
          `:""}
          ${s.employees?`
          <div class="popup-stat">
            <span class="stat-label">${t("popups.techHQ.employees")}</span>
            <span class="stat-value">${s.employees.toLocaleString()}</span>
          </div>
          `:""}
        </div>
      </div>
    `}renderAcceleratorPopup(s){const e={accelerator:t("popups.accelerator.types.accelerator"),incubator:t("popups.accelerator.types.incubator"),studio:t("popups.accelerator.types.studio")},p={accelerator:"🎯",incubator:"🔬",studio:"🎨"};return`
      <div class="popup-header accelerator ${s.type}">
        <span class="popup-title">${p[s.type]||"🎯"} ${a(s.name)}</span>
        <span class="popup-badge ${s.type}">${e[s.type]||t("popups.accelerator.types.accelerator")}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        <div class="popup-subtitle">${a(s.city)}, ${a(s.country)}</div>
        <div class="popup-stats">
          ${s.founded?`
          <div class="popup-stat">
            <span class="stat-label">${t("popups.accelerator.founded")}</span>
            <span class="stat-value">${s.founded}</span>
          </div>
          `:""}
        </div>
        ${s.notable&&s.notable.length>0?`
        <div class="popup-notable">
          <span class="notable-label">${t("popups.accelerator.notableAlumni")}</span>
          <span class="notable-list">${s.notable.map(o=>a(o)).join(", ")}</span>
        </div>
        `:""}
      </div>
    `}renderTechEventPopup(s){const e=new Date(s.startDate),p=new Date(s.endDate),o=e.toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"}),i=p>e&&p.toDateString()!==e.toDateString()?` - ${p.toLocaleDateString(void 0,{month:"short",day:"numeric"})}`:"",n=s.daysUntil<=7?"urgent":s.daysUntil<=30?"soon":"",c=s.daysUntil===0?t("popups.techEvent.days.today"):s.daysUntil===1?t("popups.techEvent.days.tomorrow"):t("popups.techEvent.days.inDays",{count:String(s.daysUntil)});return`
      <div class="popup-header tech-event ${n}">
        <span class="popup-title">📅 ${a(s.title)}</span>
        <span class="popup-badge ${n}">${c}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        <div class="popup-subtitle">📍 ${a(s.location)}, ${a(s.country)}</div>
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">${t("popups.techEvent.date")}</span>
            <span class="stat-value">${o}${i}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.location")}</span>
            <span class="stat-value">${a(s.location)}</span>
          </div>
        </div>
        ${s.url?`
        <a href="${T(s.url)}" target="_blank" rel="noopener noreferrer" class="popup-link">
          ${t("popups.techEvent.moreInformation")} →
        </a>
        `:""}
      </div>
    `}renderTechHQClusterPopup(s){const e=s.count??s.items.length,p=s.unicornCount??s.items.filter(l=>l.type==="unicorn").length,o=s.faangCount??s.items.filter(l=>l.type==="faang").length,i=s.publicCount??s.items.filter(l=>l.type==="public").length,c=[...s.items].sort((l,u)=>{const d={faang:0,unicorn:1,public:2};return(d[l.type]??3)-(d[u.type]??3)}).map(l=>{const u=l.type==="faang"?"🏛️":l.type==="unicorn"?"🦄":"🏢",d=l.marketCap?` (${a(l.marketCap)})`:"";return`<li class="cluster-item ${l.type}">${u} ${a(l.company)}${d}</li>`}).join("");return`
      <div class="popup-header tech-hq cluster">
        <span class="popup-title">🏙️ ${a(s.city)}</span>
        <span class="popup-badge">${t("popups.techHQCluster.companiesCount",{count:String(e)})}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body cluster-popup">
        <div class="popup-subtitle">📍 ${a(s.city)}, ${a(s.country)}</div>
        <div class="cluster-summary">
          ${o?`<span class="summary-item faang">🏛️ ${t("popups.techHQCluster.bigTechCount",{count:String(o)})}</span>`:""}
          ${p?`<span class="summary-item unicorn">🦄 ${t("popups.techHQCluster.unicornsCount",{count:String(p)})}</span>`:""}
          ${i?`<span class="summary-item public">🏢 ${t("popups.techHQCluster.publicCount",{count:String(i)})}</span>`:""}
        </div>
        <ul class="cluster-list">${c}</ul>
        ${s.sampled?`<p class="popup-more">${t("popups.techHQCluster.sampled",{count:String(s.items.length)})}</p>`:""}
      </div>
    `}renderTechEventClusterPopup(s){const e=s.count??s.items.length,p=s.soonCount??s.items.filter(n=>n.daysUntil<=14).length,i=[...s.items].sort((n,c)=>n.daysUntil-c.daysUntil).map(n=>{const l=new Date(n.startDate).toLocaleDateString(void 0,{month:"short",day:"numeric"});return`<li class="cluster-item ${n.daysUntil<=7?"urgent":n.daysUntil<=30?"soon":""}">📅 ${l}: ${a(n.title)}</li>`}).join("");return`
      <div class="popup-header tech-event cluster">
        <span class="popup-title">📅 ${a(s.location)}</span>
        <span class="popup-badge">${t("popups.techEventCluster.eventsCount",{count:String(e)})}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body cluster-popup">
        <div class="popup-subtitle">📍 ${a(s.location)}, ${a(s.country)}</div>
        ${p?`<div class="cluster-summary"><span class="summary-item soon">⚡ ${t("popups.techEventCluster.upcomingWithin2Weeks",{count:String(p)})}</span></div>`:""}
        <ul class="cluster-list">${i}</ul>
        ${s.sampled?`<p class="popup-more">${t("popups.techEventCluster.sampled",{count:String(s.items.length)})}</p>`:""}
      </div>
    `}getMarketStatus(s){try{const e=new Date,o=new Intl.DateTimeFormat(void 0,{hour:"2-digit",minute:"2-digit",hour12:!1,timeZone:s.timezone}).format(e),[i=0,n=0]=s.open.split(":").map(Number),[c=0,l=0]=s.close.split(":").map(Number),[u=0,d=0]=o.split(":").map(Number),$=i*60+n,h=c*60+l,v=u*60+d;return v>=$&&v<h?"open":"closed"}catch{return"unknown"}}renderMilitaryFlightPopup(s){const e={usaf:"US Air Force",usn:"US Navy",usmc:"US Marines",usa:"US Army",raf:"Royal Air Force",rn:"Royal Navy",faf:"French Air Force",gaf:"German Air Force",plaaf:"PLA Air Force",plan:"PLA Navy",vks:"Russian Aerospace",iaf:"Israeli Air Force",nato:"NATO",other:t("popups.unknown")},p={fighter:t("popups.militaryFlight.types.fighter"),bomber:t("popups.militaryFlight.types.bomber"),transport:t("popups.militaryFlight.types.transport"),tanker:t("popups.militaryFlight.types.tanker"),awacs:t("popups.militaryFlight.types.awacs"),reconnaissance:t("popups.militaryFlight.types.reconnaissance"),helicopter:t("popups.militaryFlight.types.helicopter"),drone:t("popups.militaryFlight.types.drone"),patrol:t("popups.militaryFlight.types.patrol"),special_ops:t("popups.militaryFlight.types.specialOps"),vip:t("popups.militaryFlight.types.vip"),unknown:t("popups.unknown")},o={high:"elevated",medium:"low",low:"low"},i=a(s.callsign||t("popups.unknown")),n=a(s.aircraftType.toUpperCase()),c=a(e[s.operator]||s.operatorCountry||t("popups.unknown")),l=a(s.hexCode||""),u=a(p[s.aircraftType]||s.aircraftType),d=s.squawk?a(s.squawk):"",$=s.note?a(s.note):"",h=s.registration?a(s.registration):"",v=s.aircraftModel?a(s.aircraftModel):"",m=s.verticalRate!==void 0&&s.verticalRate!==0?`
          <div class="popup-stat">
            <span class="stat-label">${t("popups.militaryFlight.climbRate")}</span>
            <span class="stat-value">${s.verticalRate>0?"+":""}${Math.round(s.verticalRate)} fpm</span>
          </div>`:"",g=s.enriched?[s.enriched.manufacturer?`<div class="popup-stat"><span class="stat-label">${t("popups.militaryFlight.manufacturer")}</span><span class="stat-value">${a(s.enriched.manufacturer)}</span></div>`:"",s.enriched.owner?`<div class="popup-stat"><span class="stat-label">${t("popups.militaryFlight.owner")}</span><span class="stat-value">${a(s.enriched.owner)}</span></div>`:"",s.enriched.builtYear?`<div class="popup-stat"><span class="stat-label">${t("popups.militaryFlight.builtYear")}</span><span class="stat-value">${a(s.enriched.builtYear)}</span></div>`:""].join(""):"";return`
      <div class="popup-header military-flight ${s.operator}">
        <span class="popup-title">${i}</span>
        <span class="popup-badge ${o[s.confidence]||"low"}">${n}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        <div class="popup-subtitle">${c}</div>
        ${h||v?`<div class="popup-subtitle" style="opacity:0.7;font-size:calc(11px * var(--wm-panel-effective-scale, 1));margin-top:-4px">${[h,v].filter(Boolean).join(" · ")}</div>`:""}
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">${t("popups.militaryFlight.altitude")}</span>
            <span class="stat-value">${s.altitude>0?`FL${Math.round(s.altitude/100)}`:t("popups.militaryFlight.ground")}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.militaryFlight.speed")}</span>
            <span class="stat-value">${s.speed} kts</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.militaryFlight.heading")}</span>
            <span class="stat-value">${Math.round(s.heading)}°</span>
          </div>
          ${m}
          <div class="popup-stat">
            <span class="stat-label">${t("popups.militaryFlight.hexCode")}</span>
            <span class="stat-value">${l}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.type")}</span>
            <span class="stat-value">${u}</span>
          </div>
          ${s.squawk?`
          <div class="popup-stat">
            <span class="stat-label">${t("popups.militaryFlight.squawk")}</span>
            <span class="stat-value">${d}</span>
          </div>
          `:""}
          ${g}
        </div>
        ${s.note?`<p class="popup-description">${$}</p>`:""}
${W("wingbitsEnrichment")?'<div class="wingbits-live-section"><div class="wingbits-live-loading" style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));opacity:0.5;padding:4px 0">Loading Wingbits live data…</div></div>':""}
        <div class="popup-attribution">${Ns(s.source)}</div>
      </div>
    `}getFlagEmoji(s){if(!s||s.length!==2)return"";const e=s.toUpperCase().split("").map(p=>127397+p.charCodeAt(0));try{return String.fromCodePoint(...e)}catch{return""}}getOperatorCountryCode(s){return(s.operatorCountry?ls(s.operatorCountry):null)||k.OPERATOR_COUNTRY_MAP[s.operator]||""}formatCoord(s,e){const p=s>=0?"N":"S",o=e>=0?"E":"W";return`${Math.abs(s).toFixed(3)}°${p}, ${Math.abs(e).toFixed(3)}°${o}`}renderClusterVesselItem(s){const e=this.getOperatorCountryCode(s),p=e?this.getFlagEmoji(e):"";return`<div class="cluster-vessel-item">${p?`<span class="flag-icon-small">${p}</span> `:""}${a(s.name)} - ${a(s.vesselType)}</div>`}renderMilitaryVesselPopup(s){const e={usn:"US Navy",uscg:"US Coast Guard",rn:"Royal Navy",fn:"French Navy",plan:"PLA Navy",ruf:"Russian Navy",jmsdf:"Japan Maritime SDF",rokn:"ROK Navy",other:t("popups.unknown")},p={carrier:"Aircraft Carrier",destroyer:"Destroyer",frigate:"Frigate",submarine:"Submarine",amphibious:"Amphibious",patrol:"Patrol",auxiliary:"Auxiliary",research:"Research",icebreaker:"Icebreaker",special:"Special",unknown:t("popups.unknown")},o=s.isDark?`<span class="popup-badge high">${t("popups.militaryVessel.aisDark")}</span>`:"",i=s.usniSource?`<span class="popup-badge" style="background:rgba(255,170,50,0.15);border:1px solid rgba(255,170,50,0.5);color:#ffaa44;">${t("popups.militaryVessel.estPosition")}</span>`:`<span class="popup-badge" style="background:rgba(68,255,136,0.15);border:1px solid rgba(68,255,136,0.5);color:#44ff88;">${t("popups.militaryVessel.aisLive")}</span>`,n=s.usniDeploymentStatus&&s.usniDeploymentStatus!=="unknown"?`<span class="popup-badge ${s.usniDeploymentStatus==="deployed"?"high":s.usniDeploymentStatus==="underway"?"elevated":"low"}">${s.usniDeploymentStatus.toUpperCase().replace("-"," ")}</span>`:"",c=s.vesselType==="unknown"&&s.aisShipType?s.aisShipType:p[s.vesselType]||s.vesselType,l=s.vesselType==="unknown"&&s.aisShipType?s.aisShipType.toUpperCase():s.vesselType.toUpperCase(),u=a(s.name||`${t("popups.militaryVessel.vessel")} ${s.mmsi}`),d=a(e[s.operator]||s.operatorCountry||t("popups.unknown")),$=a(c),h=a(l),v=a(s.mmsi||"—"),m=s.hullNumber?a(s.hullNumber):"",g=s.note?a(s.note):"",y=this.getOperatorCountryCode(s),C=y?this.getFlagEmoji(y):"",b=s.lastAisUpdate?`${new Date(s.lastAisUpdate).toLocaleString()}${s.aisGapMinutes?` (${s.aisGapMinutes}m ago)`:""}`:t("popups.unknown"),S=s.track&&s.track.length>0?`<div class="popup-section">
          <details>
            <summary>${t("popups.militaryVessel.recentTracking")}</summary>
            <div class="popup-section-content">
              <div class="vessel-history-list">
                ${s.track.slice(-5).reverse().map((x,P)=>`
                  <div class="vessel-history-item">
                    <span class="history-point">${this.formatCoord(x[0],x[1])}</span>
                    ${P===0?`<span class="history-tag">${t("popups.militaryVessel.lastReport")}</span>`:""}
                  </div>
                `).join("")}
              </div>
            </div>
          </details>
        </div>`:"",w=s.usniActivityDescription||s.usniRegion||s.usniStrikeGroup?`
      <div class="popup-section usni-intel-section">
        <div class="section-header usni">
          <span class="section-label">${t("popups.militaryVessel.usniIntel")}</span>
        </div>
        <div class="usni-intel-content">
          ${s.usniStrikeGroup?`<div class="usni-field"><strong>${t("popups.militaryVessel.strikeGroup")}:</strong> ${a(s.usniStrikeGroup)}</div>`:""}
          ${s.usniRegion?`<div class="usni-field"><strong>${t("popups.militaryVessel.region")}:</strong> ${a(s.usniRegion)}</div>`:""}
          ${s.usniActivityDescription?`<p class="usni-description">${a(s.usniActivityDescription)}</p>`:""}
          ${s.usniArticleUrl&&T(s.usniArticleUrl)?`
            <div class="usni-source-row">
              <a href="${T(s.usniArticleUrl)}" target="_blank" rel="noopener noreferrer" class="usni-link">
                ${t("popups.militaryVessel.usniSource")} ${s.usniArticleDate?`(${new Date(s.usniArticleDate).toLocaleDateString()})`:""}
              </a>
            </div>
          `:""}
        </div>
      </div>
    `:"";return`
      <div class="popup-header military-vessel ${s.operator}">
        <div class="popup-title-row">
          <span class="popup-title">${u}</span>
          ${s.hullNumber?`<span class="hull-badge">${m}</span>`:""}
        </div>
        <div class="popup-badges">
          ${o}
          ${i}
          ${n}
          <span class="popup-badge elevated">${h}</span>
        </div>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        <div class="popup-subtitle">
          ${C?`<span class="flag-icon">${C}</span>`:""}
          <span class="operator-label">${d}</span>
        </div>
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">${t("popups.type")}</span>
            <span class="stat-value">${$}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.militaryVessel.speed")}</span>
            <span class="stat-value">${s.speed} kts</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.militaryVessel.heading")}</span>
            <span class="stat-value">${Math.round(s.heading)}°</span>
          </div>
          ${s.mmsi?`
          <div class="popup-stat">
            <span class="stat-label">${t("popups.militaryVessel.mmsi")}</span>
            <span class="stat-value">${v}</span>
          </div>
          `:""}
          ${s.nearChokepoint?`
          <div class="popup-stat warning">
            <span class="stat-label">${t("popups.militaryVessel.nearChokepoint")}</span>
            <span class="stat-value">${a(s.nearChokepoint)}</span>
          </div>
          `:""}
          ${s.nearBase?`
          <div class="popup-stat">
            <span class="stat-label">${t("popups.militaryVessel.nearBase")}</span>
            <span class="stat-value">${a(s.nearBase)}</span>
          </div>
          `:""}
          <div class="popup-stat full-width">
            <span class="stat-label">${t("popups.militaryVessel.lastSeen")}</span>
            <span class="stat-value">${b}</span>
          </div>
        </div>

        ${w}
        ${S}

        ${s.note?`<p class="popup-description">${g}</p>`:""}
        ${s.isDark?`<p class="popup-description alert">${t("popups.militaryVessel.darkDescription")}</p>`:""}
        ${s.usniSource?`<p class="popup-description" style="opacity:0.7;font-size:0.85em">${t("popups.militaryVessel.approximatePosition")}</p>`:""}
        ${s.usniArticleUrl&&!w&&T(s.usniArticleUrl)?`<div class="popup-attribution"><a href="${T(s.usniArticleUrl)}" target="_blank" rel="noopener noreferrer">${t("popups.militaryVessel.usniSource")}${s.usniArticleDate?` (${new Date(s.usniArticleDate).toLocaleDateString()})`:""}</a></div>`:""}
      </div>
    `}renderMilitaryFlightClusterPopup(s){const e={exercise:t("popups.militaryCluster.flightActivity.exercise"),patrol:t("popups.militaryCluster.flightActivity.patrol"),transport:t("popups.militaryCluster.flightActivity.transport"),unknown:t("popups.militaryCluster.flightActivity.unknown")},p={exercise:"high",patrol:"elevated",transport:"low",unknown:"low"},o=s.activityType||"unknown",i=a(s.name),n=a(o.toUpperCase()),c=s.dominantOperator?a(s.dominantOperator.toUpperCase()):"",l=s.flights.slice(0,5).map(d=>`<div class="cluster-flight-item">${a(d.callsign)} - ${a(d.aircraftType)}</div>`).join(""),u=s.flightCount>5?`<div class="cluster-more">${t("popups.militaryCluster.moreAircraft",{count:String(s.flightCount-5)})}</div>`:"";return`
      <div class="popup-header military-cluster">
        <span class="popup-title">${i}</span>
        <span class="popup-badge ${p[o]||"low"}">${t("popups.militaryCluster.aircraftCount",{count:String(s.flightCount)})}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        <div class="popup-subtitle">${e[o]||t("popups.militaryCluster.flightActivity.unknown")}</div>
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">${t("popups.militaryCluster.aircraft")}</span>
            <span class="stat-value">${s.flightCount}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.militaryCluster.activity")}</span>
            <span class="stat-value">${n}</span>
          </div>
          ${s.dominantOperator?`
          <div class="popup-stat">
            <span class="stat-label">${t("popups.militaryCluster.primary")}</span>
            <span class="stat-value">${c}</span>
          </div>
          `:""}
        </div>
        <div class="popup-section">
          <span class="section-label">${t("popups.militaryCluster.trackedAircraft")}</span>
          <div class="cluster-flights">
            ${l}
            ${u}
          </div>
        </div>
      </div>
    `}renderMilitaryVesselClusterPopup(s){var b;const e={exercise:t("popups.militaryCluster.vesselActivity.exercise"),deployment:t("popups.militaryCluster.vesselActivity.deployment"),patrol:t("popups.militaryCluster.vesselActivity.patrol"),transit:t("popups.militaryCluster.vesselActivity.transit"),unknown:t("popups.militaryCluster.vesselActivity.unknown")},p={exercise:"high",deployment:"high",patrol:"elevated",transit:"low",unknown:"low"},o=s.activityType||"unknown",i=a(s.name),n=a(o.toUpperCase()),c=s.region?a(s.region):"",l={};s.vessels.forEach(S=>{l[S.operator]=(l[S.operator]||0)+1});const u=(b=Object.entries(l).sort((S,w)=>w[1]-S[1])[0])==null?void 0:b[0],d=u&&k.OPERATOR_COUNTRY_MAP[u]||"",$=d?this.getFlagEmoji(d):"",h=s.vessels.slice(0,5).map(S=>this.renderClusterVesselItem(S)).join(""),v=s.vessels.length>5?s.vessels.slice(5).map(S=>this.renderClusterVesselItem(S)).join(""):"",m=s.vessels.length-5,g=a(t("popups.militaryCluster.moreVessels",{count:String(m)})),y=a(t("popups.militaryCluster.showLess")),C=v?`${h}<div class="cluster-vessels-hidden" style="display:none">${v}</div><button type="button" class="cluster-toggle" data-more="${g}" data-less="${y}">${g}</button>`:h;return`
      <div class="popup-header military-cluster">
        <span class="popup-title">${i}</span>
        <span class="popup-badge ${p[o]||"low"}">${t("popups.militaryCluster.vesselsCount",{count:String(s.vesselCount)})}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        <div class="popup-subtitle">${$?`<span class="flag-icon">${$}</span> `:""}${e[o]||t("popups.militaryCluster.vesselActivity.unknown")}</div>
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">${t("popups.militaryCluster.vessels")}</span>
            <span class="stat-value">${s.vesselCount}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.militaryCluster.activity")}</span>
            <span class="stat-value">${n}</span>
          </div>
          ${s.region?`
          <div class="popup-stat">
            <span class="stat-label">${t("popups.region")}</span>
            <span class="stat-value">${c}</span>
          </div>
          `:""}
        </div>
        <div class="popup-section">
          <span class="section-label">${t("popups.militaryCluster.trackedVessels")}</span>
          <div class="cluster-vessels">
            ${C}
          </div>
        </div>
      </div>
    `}sanitizeClassToken(s,e="unknown"){return String(s||"").trim().replace(/[^A-Za-z0-9_-]/g,"").replace(/^[^A-Za-z_]/,"")||e}renderNaturalEventPopup(s){var c;const e={severeStorms:"high",wildfires:"high",volcanoes:"high",earthquakes:"elevated",floods:"elevated",landslides:"elevated",drought:"medium",dustHaze:"low",snow:"low",tempExtremes:"elevated",seaLakeIce:"low",waterColor:"low",manmade:"elevated"},p=rs(s.category),o=e[s.category]||"low",i=this.sanitizeClassToken(s.category,"manmade"),n=this.getTimeAgo(s.date);return`
      <div class="popup-header nat-event ${i}">
        <span class="popup-icon">${p}</span>
        <span class="popup-title">${a(s.categoryTitle.toUpperCase())}</span>
        <span class="popup-badge ${o}">${s.closed?t("popups.naturalEvent.closed"):t("popups.naturalEvent.active")}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        <div class="popup-subtitle">${a(s.title)}</div>
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">${t("popups.naturalEvent.reported")}</span>
            <span class="stat-value">${n}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.coordinates")}</span>
            <span class="stat-value">${s.lat.toFixed(2)}°, ${s.lon.toFixed(2)}°</span>
          </div>
          ${s.magnitude?`
          <div class="popup-stat">
            <span class="stat-label">${t("popups.magnitude")}</span>
            <span class="stat-value">${s.magnitude}${s.magnitudeUnit?` ${a(s.magnitudeUnit)}`:""}</span>
          </div>
          `:""}
          ${s.sourceName?`
          <div class="popup-stat">
            <span class="stat-label">${t("popups.source")}</span>
            <span class="stat-value">${a(s.sourceName)}</span>
          </div>
          `:""}
        </div>
        ${s.stormName||s.windKt||(c=s.agencyObservations)!=null&&c.length?this.renderTcDetails(s):""}
        ${s.description&&!s.windKt?`<p class="popup-description">${a(s.description)}</p>`:""}
        ${s.sourceUrl?`<a href="${T(s.sourceUrl)}" target="_blank" class="popup-link">${t("popups.naturalEvent.viewOnSource",{source:a(s.sourceName||t("popups.source"))})} →</a>`:""}
        <div class="popup-attribution">${t("popups.naturalEvent.attribution")}</div>
      </div>
    `}renderTcDetails(s){const e={0:"#5ebaff",1:"#00faf4",2:"#ffffcc",3:"#ffe775",4:"#ffc140",5:"#ff6060"},p=s.stormCategory??0,o=e[p]||e[0],i=s.classification||(p>0?`Category ${p}`:t("popups.naturalEvent.tropicalSystem")),n=s.agencyObservations??[],c=n.map(l=>{const u=l.windKt!=null?`${l.windKt} kt${l.windAveragingPeriodMinutes?` (${l.windAveragingPeriodMinutes}-minute mean)`:""}`:"Wind not reported",d=l.sourceName||l.agency,$=l.agencyId?` · ${l.agencyId}`:"",h=l.status?` · ${l.status}`:"";return`<div class="popup-stat" style="grid-column: 1 / -1"><span class="stat-label">${a(d)}${a($)}</span><span class="stat-value">${a(u+h)}</span></div>`}).join("");return`
      <div class="popup-stats">
        ${s.stormName?`
        <div class="popup-stat" style="grid-column: 1 / -1">
          <span class="stat-label">${t("popups.naturalEvent.storm")}</span>
          <span class="stat-value">${a(s.stormName)}</span>
        </div>`:""}
        <div class="popup-stat">
          <span class="stat-label">${t("popups.naturalEvent.classification")}</span>
          <span class="stat-value" style="color: ${o}">${a(i)}</span>
        </div>
        ${s.windKt!=null?`
        <div class="popup-stat">
          <span class="stat-label">${t("popups.naturalEvent.maxWind")}</span>
          <span class="stat-value">${s.windKt} kt (${Math.round(s.windKt*1.15078)} mph)</span>
        </div>`:""}
        ${s.windAveragingPeriodMinutes!=null?`
        <div class="popup-stat">
          <span class="stat-label">Wind average</span>
          <span class="stat-value">${s.windAveragingPeriodMinutes}-minute mean</span>
        </div>`:""}
        ${s.canonicalId?`
        <div class="popup-stat">
          <span class="stat-label">Canonical match</span>
          <span class="stat-value">${a(s.matchingConfidence||"Agency identifier")}</span>
        </div>`:""}
        ${s.pressureMb!=null?`
        <div class="popup-stat">
          <span class="stat-label">${t("popups.naturalEvent.pressure")}</span>
          <span class="stat-value">${s.pressureMb} mb</span>
        </div>`:""}
        ${s.movementSpeedKt!=null?`
        <div class="popup-stat">
          <span class="stat-label">${t("popups.naturalEvent.movement")}</span>
          <span class="stat-value">${s.movementDir!=null?s.movementDir+"° at ":""}${s.movementSpeedKt} kt</span>
        </div>`:""}
        ${n.length>0?`
        <div class="popup-stat" style="grid-column: 1 / -1">
          <span class="stat-label">Agency observations</span>
          <span class="stat-value">${n.length}</span>
        </div>
        ${c}`:""}
      </div>
    `}renderPortPopup(s){const e={container:t("popups.port.types.container"),oil:t("popups.port.types.oil"),lng:t("popups.port.types.lng"),naval:t("popups.port.types.naval"),mixed:t("popups.port.types.mixed"),bulk:t("popups.port.types.bulk")},p={container:"elevated",oil:"high",lng:"high",naval:"elevated",mixed:"normal",bulk:"low"},o={container:"🏭",oil:"🛢️",lng:"🔥",naval:"⚓",mixed:"🚢",bulk:"📦"},i=s.rank?`<div class="popup-stat"><span class="stat-label">${t("popups.port.worldRank")}</span><span class="stat-value">#${s.rank}</span></div>`:"";return`
      <div class="popup-header port ${a(s.type)}">
        <span class="popup-icon">${o[s.type]||"🚢"}</span>
        <span class="popup-title">${a(s.name.toUpperCase())}</span>
        <span class="popup-badge ${p[s.type]||"normal"}">${e[s.type]||s.type.toUpperCase()}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        <div class="popup-subtitle">${a(s.country)}</div>
        <div class="popup-stats">
          ${i}
          <div class="popup-stat">
            <span class="stat-label">${t("popups.type")}</span>
            <span class="stat-value">${e[s.type]||s.type.toUpperCase()}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.coordinates")}</span>
            <span class="stat-value">${s.lat.toFixed(2)}°, ${s.lon.toFixed(2)}°</span>
          </div>
        </div>
        <p class="popup-description">${a(s.note)}</p>
      </div>
    `}renderSpaceportPopup(s){const e={active:"elevated",construction:"high",inactive:"low"},p={active:t("popups.spaceport.status.active"),construction:t("popups.spaceport.status.construction"),inactive:t("popups.spaceport.status.inactive")};return`
      <div class="popup-header spaceport ${s.status}">
        <span class="popup-icon">🚀</span>
        <span class="popup-title">${a(s.name.toUpperCase())}</span>
        <span class="popup-badge ${e[s.status]||"normal"}">${p[s.status]||s.status.toUpperCase()}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        <div class="popup-subtitle">${a(s.operator)} • ${a(s.country)}</div>
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">${t("popups.spaceport.launchActivity")}</span>
            <span class="stat-value">${a(s.launches.toUpperCase())}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.coordinates")}</span>
            <span class="stat-value">${s.lat.toFixed(2)}°, ${s.lon.toFixed(2)}°</span>
          </div>
        </div>
        <p class="popup-description">${t("popups.spaceport.description")}</p>
      </div>
    `}renderMineralPopup(s){const e={producing:"elevated",development:"high",exploration:"low"},p={producing:t("popups.mineral.status.producing"),development:t("popups.mineral.status.development"),exploration:t("popups.mineral.status.exploration")},o=s.mineral==="Lithium"?"🔋":s.mineral==="Rare Earths"?"🧲":"💎";return`
      <div class="popup-header mineral ${s.status}">
        <span class="popup-icon">${o}</span>
        <span class="popup-title">${a(s.name.toUpperCase())}</span>
        <span class="popup-badge ${e[s.status]||"normal"}">${p[s.status]||s.status.toUpperCase()}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        <div class="popup-subtitle">${t("popups.mineral.projectSubtitle",{mineral:a(s.mineral.toUpperCase())})}</div>
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">${t("popups.operator")}</span>
            <span class="stat-value">${a(s.operator)}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.country")}</span>
            <span class="stat-value">${a(s.country)}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.coordinates")}</span>
            <span class="stat-value">${s.lat.toFixed(2)}°, ${s.lon.toFixed(2)}°</span>
          </div>
        </div>
        <p class="popup-description">${a(s.significance)}</p>
      </div>
    `}renderStockExchangePopup(s){const e=s.tier.toUpperCase(),p=s.tier==="mega"?"high":s.tier==="major"?"medium":"low";return`
      <div class="popup-header exchange">
        <span class="popup-title">${a(s.shortName)}</span>
        <span class="popup-badge ${p}">${e}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        <div class="popup-subtitle">${a(s.name)}</div>
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">${t("popups.location")}</span>
            <span class="stat-value">${a(s.city)}, ${a(s.country)}</span>
          </div>
          ${s.marketCap?`<div class="popup-stat"><span class="stat-label">${t("popups.stockExchange.marketCap")}</span><span class="stat-value">$${s.marketCap}T</span></div>`:""}
          ${s.tradingHours?`<div class="popup-stat"><span class="stat-label">${t("popups.tradingHours")}</span><span class="stat-value">${a(s.tradingHours)}</span></div>`:""}
        </div>
        ${s.description?`<p class="popup-description">${a(s.description)}</p>`:""}
      </div>
    `}renderFinancialCenterPopup(s){const e=s.type.toUpperCase();return`
      <div class="popup-header financial-center">
        <span class="popup-title">${a(s.name)}</span>
        <span class="popup-badge">${e}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">${t("popups.location")}</span>
            <span class="stat-value">${a(s.city)}, ${a(s.country)}</span>
          </div>
          ${s.gfciRank?`<div class="popup-stat"><span class="stat-label">${t("popups.financialCenter.gfciRank")}</span><span class="stat-value">#${s.gfciRank}</span></div>`:""}
        </div>
        ${s.specialties&&s.specialties.length>0?`
          <div class="popup-section">
            <span class="section-label">${t("popups.financialCenter.specialties")}</span>
            <div class="popup-tags">
              ${s.specialties.map(p=>`<span class="popup-tag">${a(p)}</span>`).join("")}
            </div>
          </div>
        `:""}
        ${s.description?`<p class="popup-description">${a(s.description)}</p>`:""}
      </div>
    `}renderCentralBankPopup(s){const e=s.type.toUpperCase();return`
      <div class="popup-header central-bank">
        <span class="popup-title">${a(s.shortName)}</span>
        <span class="popup-badge">${e}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        <div class="popup-subtitle">${a(s.name)}</div>
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">${t("popups.location")}</span>
            <span class="stat-value">${a(s.city)}, ${a(s.country)}</span>
          </div>
          ${s.currency?`<div class="popup-stat"><span class="stat-label">${t("popups.centralBank.currency")}</span><span class="stat-value">${a(s.currency)}</span></div>`:""}
        </div>
        ${s.description?`<p class="popup-description">${a(s.description)}</p>`:""}
      </div>
    `}renderCommodityHubPopup(s){const e=s.type.toUpperCase();return`
      <div class="popup-header commodity-hub">
        <span class="popup-title">${a(s.name)}</span>
        <span class="popup-badge">${e}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">${t("popups.location")}</span>
            <span class="stat-value">${a(s.city)}, ${a(s.country)}</span>
          </div>
        </div>
        ${s.commodities&&s.commodities.length>0?`
          <div class="popup-section">
            <span class="section-label">${t("popups.commodityHub.commodities")}</span>
            <div class="popup-tags">
              ${s.commodities.map(p=>`<span class="popup-tag">${a(p)}</span>`).join("")}
            </div>
          </div>
        `:""}
        ${s.description?`<p class="popup-description">${a(s.description)}</p>`:""}
      </div>
    `}normalizeSeverity(s){const e=(s||"").trim().toLowerCase();return e==="high"?"high":e==="medium"?"medium":"low"}renderIranEventPopup(s){const e=this.normalizeSeverity(s.severity),p=s.timestamp?this.getTimeAgo(new Date(s.timestamp)):"",o=T(s.sourceUrl),i=s.relatedEvents&&s.relatedEvents.length>0?`
        <div class="popup-section">
          <span class="section-label">${t("popups.iranEvent.relatedEvents")}</span>
          <ul class="cluster-list">
            ${s.relatedEvents.map(n=>{const c=this.normalizeSeverity(n.severity),l=n.timestamp?this.getTimeAgo(new Date(n.timestamp)):"",u=n.title.length>60?n.title.slice(0,60)+"…":n.title;return`<li class="cluster-item"><span class="popup-badge ${c}">${a(c.toUpperCase())}</span> ${a(u)}${l?` <span style="color:var(--text-muted);font-size:calc(10px * var(--wm-panel-effective-scale, 1));">${a(l)}</span>`:""}</li>`}).join("")}
          </ul>
        </div>`:"";return`
      <div class="popup-header iranEvent ${e}">
        <span class="popup-title">${a(s.title)}</span>
        <span class="popup-badge ${e}">${a(e.toUpperCase())}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">${t("popups.type")}</span>
            <span class="stat-value">${a(s.category)}</span>
          </div>
          ${s.locationName?`<div class="popup-stat">
            <span class="stat-label">${t("popups.location")}</span>
            <span class="stat-value">${a(s.locationName)}</span>
          </div>`:""}
          ${p?`<div class="popup-stat">
            <span class="stat-label">${t("popups.time")}</span>
            <span class="stat-value">${a(p)}</span>
          </div>`:""}
        </div>
        ${i}
        ${o?`<a href="${a(o)}" target="_blank" rel="noopener noreferrer nofollow" class="popup-link">${t("popups.source")} →</a>`:""}
      </div>
    `}renderGpsJammingPopup(s){const e=s.level==="high",p=e?"critical":"medium";return`
      <div class="popup-header" style="background:${e?"#ff5050":"#ffb432"}">
        <span class="popup-title">${t("popups.gpsJamming.title")}</span>
        <span class="popup-badge ${p}">${a(s.level.toUpperCase())}</span>
        <button class="popup-close" aria-label="Close">×</button>
      </div>
      <div class="popup-body">
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">${t("popups.gpsJamming.navPerformance")}</span>
            <span class="stat-value">${Number(s.pct).toFixed(1)}%</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.gpsJamming.samples")}</span>
            <span class="stat-value">${s.affectedAircraft}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.gpsJamming.aircraft")}</span>
            <span class="stat-value">${s.totalAircraft}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">${t("popups.gpsJamming.h3Hex")}</span>
            <span class="stat-value" style="font-size:calc(10px * var(--wm-panel-effective-scale, 1))">${a(s.h3)}</span>
          </div>
        </div>
      </div>
    `}};f(k,"historyCache",new Map),f(k,"historyInflight",new Set),f(k,"heightByType",new Map),f(k,"HEIGHT_DRIFT_PX",12),f(k,"OPERATOR_COUNTRY_MAP",{usn:"US",usaf:"US",usmc:"US",usa:"US",uscg:"US",rn:"GB",raf:"GB",plan:"CN",plaaf:"CN",vks:"RU",ruf:"RU",faf:"FR",fn:"FR",gaf:"DE",iaf:"IL",jmsdf:"JP",rokn:"KR"});let Y=k;function Os(r){const s=[...new Set(r.contributingSources)];return s.length>0?s.join(" + "):r.source}function _s(r){switch(r){case"high":return"High";case"medium":return"Medium";default:return"Low"}}function at(r,s){const e=n=>n.map(c=>`<li>${a(c)}</li>`).join(""),p=s.related.length>0?s.related.map(n=>`<span>${a(n)}</span>`).join(""):"<span>Layer guide</span>",o=s.evidence.length>0?`<div class="layer-explanation-grounding"><span>Grounded in</span>${s.evidence.map(n=>`<code>${a(n)}</code>`).join("")}</div>`:"",i=s.coverage==="curated"?"Curated v1":"Fallback";return`
    <div class="layer-explanation-header">
      <div>
        <span class="layer-explanation-kicker">${a(s.category)}</span>
        <strong>${a(r)}</strong>
      </div>
      <button class="layer-explanation-close" aria-label="Close">×</button>
    </div>
    <div class="layer-explanation-content">
      <div class="layer-explanation-status ${s.coverage}">${i}</div>
      <p class="layer-explanation-purpose">${a(s.purpose)}</p>
      <div class="layer-explanation-grid">
        <section>
          <span>Source</span>
          <p>${a(s.source)}</p>
        </section>
        <section>
          <span>Freshness</span>
          <p>${a(s.freshness)}</p>
        </section>
        <section>
          <span>Confidence</span>
          <p>${a(s.confidence)}</p>
        </section>
      </div>
      <div class="layer-explanation-section">
        <span>Limitations</span>
        <ul>${e(s.limitations)}</ul>
      </div>
      <div class="layer-explanation-section">
        <span>Related</span>
        <div class="layer-explanation-related">${p}</div>
      </div>
      ${o}
    </div>
  `}export{Y as M,Zs as a,qs as b,Ms as g,at as r,st as s,tt as u};
