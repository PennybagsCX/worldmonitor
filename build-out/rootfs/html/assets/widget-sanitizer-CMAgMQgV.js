import{p as h}from"./purify.es-bRchjNq8.js";const y={ALLOWED_TAGS:["div","span","p","h1","h2","h3","h4","h5","h6","ul","ol","li","table","thead","tbody","tr","th","td","strong","em","b","i","br","hr","small","svg","path","circle","rect","line","polyline","polygon","text","tspan"],ALLOWED_ATTR:["class","style","title","aria-label","viewBox","fill","stroke","stroke-width","d","cx","cy","r","x","y","width","height","points","xmlns"],FORBID_TAGS:["button","input","form","select","textarea","script","iframe","object","embed"],ALLOW_DATA_ATTR:!1,FORCE_BODY:!0},k=/url\s*\(|expression\s*\(|javascript\s*:|@import|behavior\s*:/i;h.addHook("uponSanitizeAttribute",(t,e)=>{e.attrName==="style"&&k.test(e.attrValue)&&(e.keepAttr=!1)});function A(t){return h.sanitize(t,y)}function w(t){return t.replace(/^\s*<div[^>]*\bclass="panel-header"[^>]*>[\s\S]*?<\/div>\s*/i,"")}function T(t,e=""){return`
    <div class="${["wm-widget-shell",e].filter(Boolean).join(" ")}">
      <div class="wm-widget-body">
        <div class="wm-widget-generated">${A(w(t))}</div>
      </div>
    </div>
  `}const d=new Map,s=new WeakMap,l=new WeakMap,c=new WeakMap,p=new WeakMap,S=1e3;function E(){const t=globalThis.crypto;if(!t)throw new Error("crypto API unavailable for widget sandbox token");if(t.randomUUID)return t.randomUUID();const e=new Uint8Array(16);return t.getRandomValues(e),Array.from(e,n=>n.toString(16).padStart(2,"0")).join("")}function L(t){return`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'unsafe-inline'; img-src data:; connect-src https://cdn.jsdelivr.net;">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"><\/script>
<style>
:root{--bg:#0a0a0a;--surface:#141414;--text:#e8e8e8;--text-secondary:#ccc;--text-dim:#888;--text-muted:#666;--border:#2a2a2a;--border-subtle:#1a1a1a;--overlay-subtle:rgba(255,255,255,0.03);--green:#44ff88;--red:#ff4444;--yellow:#ffaa00;--accent:#44ff88}
html,body{font-family:'SF Mono','Monaco','Cascadia Code','Fira Code','DejaVu Sans Mono','Liberation Mono',monospace!important}
body{margin:0;padding:12px;background:var(--bg);color:var(--text);font-size:12px;line-height:1.5;overflow-y:auto;box-sizing:border-box}
*{box-sizing:inherit;font-family:inherit!important}
table{border-collapse:collapse;width:100%}
th{text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);padding:4px 8px;border-bottom:1px solid var(--border);font-weight:600}
td{padding:5px 8px;border-bottom:1px solid var(--border-subtle);color:var(--text-secondary)}
.change-positive{color:var(--green)}
.change-negative{color:var(--red)}
.panel-header{display:flex;align-items:center;justify-content:space-between;padding:6px 10px;background:var(--overlay-subtle);border-bottom:1px solid var(--border);margin:-12px -12px 0}
.panel-title{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--text)}
.panel-tabs{display:flex;gap:2px;padding:6px 10px 0;border-bottom:1px solid var(--border);margin:0 -12px}
.panel-tab{font-size:11px;font-weight:500;color:var(--text-muted);padding:4px 10px;border:none;border-bottom:2px solid transparent;cursor:pointer;background:none;letter-spacing:0.5px;text-transform:uppercase}
.panel-tab:hover{color:var(--text);background:var(--overlay-subtle)}
.panel-tab.active{color:var(--accent);border-bottom-color:var(--accent)}
.disp-stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:1px;background:var(--border);margin-top:8px}
.disp-stat-box{background:var(--bg);padding:8px}
.disp-stat-value{display:block;font-size:16px;font-variant-numeric:tabular-nums;color:var(--text);font-weight:500}
.disp-stat-label{display:block;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-top:2px}
</style>
</head>
<body>${t}</body>
</html>`}function g(t){const e=t.dataset.wmId;if(!e||s.has(t))return;const n=d.get(e);if(!n)return;d.delete(e);const r=L(n),o=t.dataset.wmToken;if(!o)return;s.set(t,r),l.set(t,{id:e,token:o});const m=new AbortController;c.set(t,m),window.addEventListener("message",a=>{var f;const i=l.get(t);if(!i||a.source!==t.contentWindow||!a.data||a.data.type!=="wm-widget-ready"||a.data.id!==i.id||a.data.token!==i.token)return;const u=s.get(t);if(!u)return;const b=performance.now(),v=p.get(t)??0;b-v<S||(p.set(t,b),(f=t.contentWindow)==null||f.postMessage({type:"wm-html",id:i.id,token:i.token,html:u},"*"))},{signal:m.signal})}function x(t){var e;(e=c.get(t))==null||e.abort(),c.delete(t),l.delete(t),s.delete(t),p.delete(t)}if(typeof document<"u"){const t=new MutationObserver(n=>{for(const r of n){for(const o of r.addedNodes)o instanceof Element&&(o instanceof HTMLIFrameElement&&o.dataset.wmId?g(o):o.querySelectorAll("iframe[data-wm-id]").forEach(g));for(const o of r.removedNodes)o instanceof Element&&(o instanceof HTMLIFrameElement&&o.dataset.wmId?x(o):o.querySelectorAll("iframe[data-wm-id]").forEach(x))}}),e=()=>{document.body&&t.observe(document.body,{childList:!0,subtree:!0})};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",e):e()}function I(t){const e=`wm-${Math.random().toString(36).slice(2)}`,n=E();return d.set(e,w(t)),`<div class="wm-widget-shell wm-widget-pro"><iframe src="${`/wm-widget-sandbox.html#id=${encodeURIComponent(e)}&token=${encodeURIComponent(n)}`}" data-wm-id="${e}" data-wm-token="${n}" sandbox="allow-scripts" style="width:100%;height:400px;border:none;display:block;" title="Interactive widget"></iframe></div>`}export{A as sanitizeWidgetHtml,I as wrapProWidgetHtml,T as wrapWidgetHtml};
