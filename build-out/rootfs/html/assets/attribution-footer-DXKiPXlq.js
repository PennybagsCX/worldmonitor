import{e as r}from"./dom-utils-B8MVJOEB.js";function c(e){if(e==null)return null;try{const t=e instanceof Date?e:new Date(e);if(Number.isNaN(t.getTime()))return null;const s=Date.now()-t.getTime(),a=Math.round(s/6e4);if(a<1)return"just now";if(a<60)return`${a}m ago`;const o=Math.round(a/60);return o<24?`${o}h ago`:`${Math.round(o/24)}d ago`}catch{return null}}function l(e){return e==null?null:e>=.8?"high":e>=.5?"medium":"low"}const d={operator:"operator disclosure",regulator:"regulator data",ais:"AIS calibration",satellite:"satellite imagery",press:"press / wire",classifier:"evidence classifier",derived:"derived metric"};function u(e){const t=[],s=d[e.sourceType];if(t.push(r(s)),e.method&&t.push(r(e.method)),typeof e.sampleSize=="number"&&Number.isFinite(e.sampleSize)){const n=e.sampleLabel||"obs";t.push(`${e.sampleSize.toLocaleString()} ${r(n)}`)}const a=c(e.updatedAt);a&&t.push(`updated ${a}`);const o=l(e.confidence);o&&t.push(`${o} confidence`),e.classifierVersion&&t.push(`classifier ${r(e.classifierVersion)}`);const i=e.creditName?e.creditUrl?` · <a href="${r(e.creditUrl)}" target="_blank" rel="noopener" class="attr-credit">${r(e.creditName)}</a>`:` · <span class="attr-credit">${r(e.creditName)}</span>`:"";return`<div class="panel-attribution-footer" ${[`data-attr-source="${r(e.sourceType)}"`,e.method?`data-attr-method="${r(e.method)}"`:"",typeof e.sampleSize=="number"?`data-attr-n="${e.sampleSize}"`:"",e.confidence!=null?`data-attr-confidence="${e.confidence.toFixed(2)}"`:"",e.classifierVersion?`data-attr-classifier="${r(e.classifierVersion)}"`:""].filter(Boolean).join(" ")}>${t.join(" · ")}${i}</div>`}const h=`
<style>
  .panel-attribution-footer {
    margin-top: 8px;
    padding-top: 6px;
    border-top: 1px solid rgba(255,255,255,0.05);
    font-size: calc(9px * var(--wm-panel-effective-scale, 1));
    color: var(--text-dim, #888);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .panel-attribution-footer .attr-credit { color: var(--text-dim, #888); text-decoration: none; }
  .panel-attribution-footer .attr-credit:hover { text-decoration: underline; }
</style>
`;export{h as A,u as a};
