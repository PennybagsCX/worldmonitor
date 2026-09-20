import{e as t,a as k}from"./dom-utils-B8MVJOEB.js";import{aR as p}from"./main-8a68VbSf.js";function U(i){return i==="available"?"components.giving.status.published":i==="available-but-legacy"?"components.giving.status.legacy":i==="cached-refresh-unavailable"?"components.giving.status.cached":"components.giving.status.partial"}function P(i){try{return new URL(i).protocol!=="https:"?null:k(i)||null}catch{return null}}function $(i){const n=t(i.sourceName),s=P(i.sourceUrl);return s?`<a href="${s}" target="_blank" rel="noopener noreferrer nofollow">${n}</a>`:n}function m(i){const n=i.sourcePublishedAt?` · ${t(i.sourcePublishedAt)}`:"";return`<span class="giving-source-meta">${$(i)} · ${t(i.referencePeriod)}${n}</span>`}function v(i){return i>=1e9?`${(i/1e9).toFixed(1)}B`:i>=1e6?`${(i/1e6).toFixed(1)}M`:i>=1e3?`${(i/1e3).toFixed(0)}K`:i.toLocaleString()}function u(i){return i.reportedUnit==="USD"?p(i.reportedValue):i.reportedUnit==="GBP"?`GBP ${v(i.reportedValue)}`:i.reportedUnit==="USD billion"?`$${i.reportedValue.toFixed(1)}B`:i.reportedUnit==="grants"?`${v(i.reportedValue)} grants`:`${v(i.reportedValue)} ${t(i.reportedUnit)}`.trim()}function b(i,n){return i==="more_than"||i==="at_least"?`${t(n("components.giving.atLeast"))} `:i==="about"?`${t(n("components.giving.about"))} `:""}function d(i,n,s){return`${b(i.valueQualifier,s)}${n}`}function _(i,n){return i.provenance.find(s=>s.sourceName===n||s.coveredMetricPaths.some(o=>o.includes(`[platform=${n}]`)))}function h(i,n){return i.provenance.find(s=>s.coveredMetricPaths.some(o=>o.includes(n)))}function V(i,n){const s=i.provenance.filter(g=>g.includedInHighlightedAggregate&&g.status==="verified"),o=s.some(g=>g.valueQualifier==="more_than"||g.valueQualifier==="at_least"),e=Number.isFinite(i.estimatedDailyFlowUsd)&&i.estimatedDailyFlowUsd>0?i.estimatedDailyFlowUsd:0,a=e*365,r=a>0?p(a):n("components.giving.sourceNotVerified"),c=o?b("at_least",n):"",l=s.map(g=>`${g.sourceName} · ${g.referencePeriod}`).join(" · ");return`
    <div class="giving-stats-grid">
      <div class="giving-stat-box giving-stat-headline">
        <span class="giving-stat-value">${c}${r}</span>
        <span class="giving-stat-label">${t(n("components.giving.trackedAnnualized"))}</span>
        ${l?`<span class="giving-source-meta">${t(l)}</span>`:""}
      </div>
      <div class="giving-stat-box">
        <span class="giving-stat-value">${e>0?p(e):"—"}</span>
        <span class="giving-stat-label">${t(n("components.giving.annualizedDaily"))}</span>
      </div>
    </div>`}function y(i,n){if(i.platforms.length===0)return`<div class="panel-empty">${t(n("common.noDataShort"))}</div>`;const s=i.platforms.map(o=>{const e=_(i,o.platform);let a;if(!e||e.status==="unverified")a=`<span class="giving-unverified">${t(n("components.giving.sourceNotVerified"))}</span>`;else if(e.status==="partially_verified")a=`
        <span class="giving-benchmark-value">${d(e,u(e),n)}</span>
        <span class="giving-benchmark-kind">${t(n("components.giving.partialEstimate"))}</span>
        <span class="giving-methodology-note">${t(e.notes)}</span>`;else if(e.denominator.includes("cumulative"))a=`
        <span class="giving-benchmark-value">${d(e,u(e),n)}</span>
        <span class="giving-benchmark-kind">${t(n("components.giving.reportedCumulative"))}</span>`;else{const r=o.dailyVolumeUsd>0?p(o.dailyVolumeUsd*365):u(e);a=`
        <span class="giving-benchmark-value">${d(e,r,n)}</span>
        <span class="giving-benchmark-kind">${t(n("components.giving.trackedAnnualized"))}</span>`}return`<tr class="giving-row">
      <td class="giving-platform-name">${t(o.platform)}</td>
      <td class="giving-platform-benchmark">
        ${a}
        ${e?m(e):""}
      </td>
    </tr>`}).join("");return`
    <table class="giving-table">
      <thead>
        <tr>
          <th>${t(n("components.giving.platform"))}</th>
          <th>${t(n("components.giving.benchmark"))}</th>
        </tr>
      </thead>
      <tbody>${s}</tbody>
    </table>`}function x(i,n,s){if(n.length===0)return`<div class="panel-empty">${t(s("common.noDataShort"))}</div>`;const o=h(i,"categories[*].share");return`<table class="giving-table giving-cat-table"><tbody>${n.map(a=>{const r=(o==null?void 0:o.status)==="verified",c=r?`${(a.share*100).toFixed(1)}%`:t(s("components.giving.sourceNotVerified"));return`<tr class="giving-row">
      <td class="giving-cat-name">${t(a.category)}</td>
      <td class="giving-category-benchmark">
        <span class="${r?"giving-benchmark-value":"giving-unverified"}">${c}</span>
        ${o?m(o):""}
      </td>
    </tr>`}).join("")}</tbody></table>`}function f(i,n,s,o){const e=h(i,n),a=(e==null?void 0:e.status)==="verified";return`
    <div class="giving-stat-box">
      <span class="${a?"giving-stat-value":"giving-unverified"}">
        ${a&&e?d(e,u(e),o):t(o("components.giving.sourceNotVerified"))}
      </span>
      <span class="giving-stat-label">${t(s)}</span>
      ${e?m(e):""}
    </div>`}function N(i,n){return`
    <div class="giving-inst-grid">
      ${f(i,"institutional.oecd_oda_annual_usd_bn",n("components.giving.oecdOda"),n)}
      ${f(i,"institutional.candid_grants_tracked",n("components.giving.candidGrants"),n)}
    </div>`}function w(i,n){const s=i.availability==="available"?"":" open",o=i.provenance.map(e=>`
    <li class="giving-methodology-item">
      <span class="giving-methodology-source">${$(e)}</span>
      <span class="giving-source-meta">${t(e.referencePeriod)} · ${t(e.status.replace(/_/g," "))}</span>
      <span class="giving-methodology-note">${t(e.notes)}</span>
    </li>`).join("");return`
    <details class="giving-methodology"${s}>
      <summary>${t(n("components.giving.sourcesMethodology"))}</summary>
      <p>${t(n("components.giving.methodologyIntro"))}</p>
      <ul>${o}</ul>
    </details>`}function D(i){const n=["platforms"];return i.categories.length>0&&n.push("categories"),i.provenance.some(s=>s.coveredMetricPaths.some(o=>o.includes("summary.institutional.")))&&n.push("institutional"),n}function S(i,n,s){const o=D(i),e=o.includes(n)?n:"platforms",a={platforms:s("components.giving.tabs.platforms"),categories:s("components.giving.tabs.categories"),institutional:s("components.giving.tabs.institutional")},r=o.length>1?`<div class="panel-tabs">${o.map(l=>`<button class="panel-tab ${e===l?"active":""}" data-tab="${l}">${t(a[l])}</button>`).join("")}</div>`:"";let c;return e==="categories"?c=x(i,i.categories,s):e==="institutional"?c=N(i,s):c=y(i,s),`
    <div class="giving-panel-content">
      <div class="giving-status giving-status-${t(i.availability)}" role="status">
        ${t(s(U(i.availability)))}
      </div>
      ${V(i,s)}
      ${r}
      ${c}
      ${w(i,s)}
    </div>`}export{D as a,S as r};
