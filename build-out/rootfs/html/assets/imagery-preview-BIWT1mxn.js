import{t as n}from"./panel-storage-COYkA8bZ.js";import{g as i,s as l}from"./cross-domain-storage-BkfZ6fhr.js";import{s as c,t as d}from"./dom-utils-B8MVJOEB.js";function g(t){return t&&t.__esModule&&Object.prototype.hasOwnProperty.call(t,"default")?t.default:t}const o="wm-layer-warning-dismissed";let r=null;function p(t){if(i(o)||r||window.self!==window.top||new URLSearchParams(window.location.search).get("alert")==="false")return;const e=document.createElement("div");e.className="layer-warn-overlay",c(e,d(`
    <div class="layer-warn-dialog">
      <div class="layer-warn-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <div class="layer-warn-text">
        <strong>${n("components.deckgl.layerWarningTitle")}</strong>
        <p>${n("components.deckgl.layerWarningBody",{threshold:t})}</p>
      </div>
      <label class="layer-warn-dismiss">
        <input type="checkbox" />
        <span>${n("components.deckgl.layerWarningDismiss")}</span>
      </label>
      <button class="layer-warn-ok">${n("components.deckgl.layerWarningOk")}</button>
    </div>`,"legacy direct innerHTML migration"));const a=()=>{const s=e.querySelector(".layer-warn-dismiss input");s!=null&&s.checked&&l(o),e.classList.add("layer-warn-out"),setTimeout(()=>{e.remove(),r=null},200)};e.querySelector(".layer-warn-ok").addEventListener("click",a),e.addEventListener("click",s=>{s.target===e&&a()}),document.body.appendChild(e),r=e,requestAnimationFrame(()=>e.classList.add("layer-warn-in"))}const m=["sentinel-s1-l1c.s3.amazonaws.com","sentinel-cogs.s3.us-west-2.amazonaws.com","earth-search.aws.element84.com"];function f(t){if(!t)return!1;try{const e=new URL(t);return e.protocol==="https:"&&m.some(a=>e.hostname===a)}catch{return!1}}export{g,f as i,p as s};
