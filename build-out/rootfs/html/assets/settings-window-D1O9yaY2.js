import{t as o,S as c,i as y}from"./panel-storage-COYkA8bZ.js";import{S as b}from"./user-location-N7cD7VOl.js";import{n as C,A as p,V as L,o as u,s as P,z as T,B as k,E as _,u as $}from"./panels-c93eK3j2.js";import{l as D,B as E,s as F}from"./widget-store-IAxu1TMg.js";import{s as w,t as S,e as g}from"./dom-utils-B8MVJOEB.js";import"./clerk-DnucG282.js";import"./i18n-qlunRAMb.js";import"./persistent-cache-DcwIBXtm.js";function H(i,e){if(i==="runtime-config")return o("modals.runtimeConfig.title");const l=`panels.${i.replace(/-([a-z])/g,(m,d)=>d.toUpperCase())}`,r=o(l);return r===l?e:r}function M(){var d;const i=document.getElementById("app");if(!i)return;document.title=`${o("header.settings")} - World Monitor`;const e=D(b.panels,C),v=new Set(Object.keys(p));for(const s of Object.keys(e))!v.has(s)&&s!=="runtime-config"&&delete e[s];const l=new Set(L[c]??[]);for(const s of Object.keys(p))s in e||(e[s]={...u(s,c),enabled:l.has(s)});const r=y();function m(){const A=Object.entries(e).filter(([t])=>(t!=="runtime-config"||r)&&(!t.startsWith("cw-")||E())).map(([t,n])=>{const a=p[t]?u(t,c):n;return`
        <div class="panel-toggle-item ${n.enabled?"active":""}" data-panel="${g(t)}">
          <div class="panel-toggle-checkbox">${n.enabled?"✓":""}</div>
          <span class="panel-toggle-label">${g(H(t,a.name??n.name))}</span>
        </div>
      `}).join(""),f=document.getElementById("panelToggles");f&&(w(f,S(A,"legacy direct innerHTML migration")),f.querySelectorAll(".panel-toggle-item").forEach(t=>{t.addEventListener("click",()=>{const n=t.dataset.panel,a=e[n];if(a){const h=p[n]?u(n,c):a;if(!a.enabled&&!P(n,h,E())||!a.enabled&&!E()&&T(n)&&k(e)>=_)return;$(a,!a.enabled),F(b.panels,e),m()}})}))}w(i,S(`
    <div class="settings-window-shell">
      <div class="settings-window-header">
        <div class="settings-window-header-text">
          <span class="settings-window-title">${g(o("header.settings"))}</span>
          <p class="settings-window-caption">${g(o("header.panelDisplayCaption"))}</p>
        </div>
        <button type="button" class="modal-close" id="settingsWindowClose">×</button>
      </div>
      <div class="panel-toggle-grid" id="panelToggles"></div>
    </div>
  `,"legacy direct innerHTML migration")),(d=document.getElementById("settingsWindowClose"))==null||d.addEventListener("click",()=>{window.close()}),m()}export{M as initSettingsWindow};
