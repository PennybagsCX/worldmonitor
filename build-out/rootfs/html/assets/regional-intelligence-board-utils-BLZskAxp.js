import{e as a}from"./dom-utils-B8MVJOEB.js";const A=[{id:"mena",label:"Middle East & North Africa"},{id:"east-asia",label:"East Asia & Pacific"},{id:"europe",label:"Europe & Central Asia"},{id:"north-america",label:"North America"},{id:"south-asia",label:"South Asia"},{id:"latam",label:"Latin America & Caribbean"},{id:"sub-saharan-africa",label:"Sub-Saharan Africa"}],j="mena";function R(e,t){return e===t}function D(e){var t,r;return[u(e.narrative),g(e),y(e.balance),b(e.actors),w(e.scenarioSets),h(e.transmissionPaths),z(((t=e.triggers)==null?void 0:t.active)??[],((r=e.narrative)==null?void 0:r.watchItems)??[]),k(e)].join("")}function s(e,t,r=""){return`
    <div class="rib-section" style="margin-bottom:12px;padding:10px 12px;border:1px solid var(--border);border-radius:4px;background:rgba(255,255,255,0.02);${r}">
      <div class="rib-section-title" style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));letter-spacing:.08em;text-transform:uppercase;color:var(--text-dim);margin-bottom:8px">${a(e)}</div>
      ${t}
    </div>
  `}function p(e,t){const r=((t==null?void 0:t.text)??"").trim();if(!r)return"";const i=((t==null?void 0:t.evidenceIds)??[]).filter(o=>o.length>0),n=i.length>0?`<span style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);margin-left:6px">[${a(i.slice(0,4).join(", "))}]</span>`:"";return`
    <div class="rib-narrative-row" style="margin-bottom:8px">
      <div style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));letter-spacing:.08em;text-transform:uppercase;color:var(--text-dim);margin-bottom:2px">${a(e)}${n}</div>
      <div style="font-size:calc(12px * var(--wm-panel-effective-scale, 1));line-height:1.5">${a(r)}</div>
    </div>
  `}function u(e){if(!e)return"";const t=[p("Situation",e.situation),p("Balance Assessment",e.balanceAssessment),p("Outlook — 24h",e.outlook24h),p("Outlook — 7d",e.outlook7d),p("Outlook — 30d",e.outlook30d)].join("");return t?s("Narrative",t):""}function g(e){const t=e.regime,r=(t==null?void 0:t.label)??"unknown",i=(t==null?void 0:t.previousLabel)??"",n=(t==null?void 0:t.transitionDriver)??"",c=i&&i!==r?`<div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);margin-top:2px">Was: ${a(i)}${n?` · ${a(n)}`:""}</div>`:"",l=`
    <div class="rib-regime-label" style="font-size:calc(15px * var(--wm-panel-effective-scale, 1));font-weight:600;text-transform:capitalize">${a(r.replace(/_/g," "))}</div>
    ${c}
  `;return s("Regime",l)}function v(e,t,r){const i=Math.max(0,Math.min(1,t))*100;return`
    <div style="display:grid;grid-template-columns:110px 40px 1fr;gap:8px;align-items:center;margin-bottom:4px">
      <div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">${a(e)}</div>
      <div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));font-variant-numeric:tabular-nums">${t.toFixed(2)}</div>
      <div style="height:6px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden">
        <div style="height:100%;width:${i.toFixed(1)}%;background:var(${r})"></div>
      </div>
    </div>
  `}function y(e){if(!e)return s("Balance Vector",'<div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">Unavailable</div>');const t=[v("Coercive",e.coercivePressure,"--danger"),v("Fragility",e.domesticFragility,"--danger"),v("Capital",e.capitalStress,"--danger"),v("Energy Vuln",e.energyVulnerability,"--danger")].join(""),r=[v("Alliance",e.allianceCohesion,"--accent"),v("Maritime",e.maritimeAccess,"--accent"),v("Energy Lev",e.energyLeverage,"--accent")].join(""),i=e.netBalance,n=Math.max(-1,Math.min(1,i)),o=Math.abs(n)*50,c=n>=0?"right":"left",l=n>=0?"var(--accent)":"var(--danger)",f=`
    <div style="display:grid;grid-template-columns:110px 40px 1fr;gap:8px;align-items:center;margin-top:6px;padding-top:6px;border-top:1px dashed rgba(255,255,255,0.1)">
      <div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);font-weight:600">Net Balance</div>
      <div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));font-variant-numeric:tabular-nums;font-weight:600">${i.toFixed(2)}</div>
      <div style="position:relative;height:6px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden">
        <div style="position:absolute;left:50%;top:0;bottom:0;width:1px;background:rgba(255,255,255,0.3)"></div>
        <div style="position:absolute;${c}:50%;top:0;bottom:0;width:${o.toFixed(1)}%;background:${l}"></div>
      </div>
    </div>
  `,d=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div>
        <div style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);text-transform:uppercase;margin-bottom:4px">Pressures</div>
        ${t}
      </div>
      <div>
        <div style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);text-transform:uppercase;margin-bottom:4px">Buffers</div>
        ${r}
      </div>
    </div>
    ${f}
  `;return s("Balance Vector",d)}function b(e){if(!e||e.length===0)return s("Actors",'<div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">No actor data</div>');const r=[...e].sort((i,n)=>(n.leverageScore??0)-(i.leverageScore??0)).slice(0,5).map(i=>{const n=i.delta>0?`+${i.delta.toFixed(2)}`:i.delta.toFixed(2),o=i.delta>0?"var(--danger)":i.delta<0?"var(--accent)":"var(--text-dim)",c=(i.leverageDomains??[]).slice(0,3).join(", ");return`
      <div style="display:grid;grid-template-columns:1fr auto auto;gap:8px;align-items:center;padding:4px 0;border-bottom:1px dashed rgba(255,255,255,0.06)">
        <div>
          <div style="font-size:calc(12px * var(--wm-panel-effective-scale, 1));font-weight:500">${a(i.name||i.actorId)}</div>
          <div style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);text-transform:capitalize">${a(i.role||"actor")}${c?` · ${a(c)}`:""}</div>
        </div>
        <div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));font-variant-numeric:tabular-nums">${(i.leverageScore??0).toFixed(2)}</div>
        <div style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:${o};font-variant-numeric:tabular-nums;min-width:38px;text-align:right">${a(n)}</div>
      </div>
    `}).join("");return s("Actors",r)}function w(e){if(!e||e.length===0)return s("Scenarios",'<div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">No scenario data</div>');const t={"24h":0,"7d":1,"30d":2},r=[...e].sort((c,l)=>(t[c.horizon]??99)-(t[l.horizon]??99)),i={base:"var(--text-dim)",escalation:"var(--danger)",containment:"var(--accent)",fragmentation:"var(--warning, #e0a020)"},n=r.map(c=>{const f=[...c.lanes??[]].sort((d,m)=>m.probability-d.probability).map(d=>{const m=Math.round((d.probability??0)*100),x=i[d.name]??"var(--text-dim)";return`
        <div style="margin-bottom:3px">
          <div style="display:flex;justify-content:space-between;font-size:calc(11px * var(--wm-panel-effective-scale, 1));text-transform:capitalize">
            <span>${a(d.name)}</span>
            <span style="font-variant-numeric:tabular-nums">${m}%</span>
          </div>
          <div style="height:4px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden">
            <div style="height:100%;width:${m}%;background:${x}"></div>
          </div>
        </div>
      `}).join("");return`
      <div>
        <div style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);text-transform:uppercase;margin-bottom:6px">${a(c.horizon)}</div>
        ${f}
      </div>
    `}).join(""),o=`<div style="display:grid;grid-template-columns:repeat(${r.length},1fr);gap:12px">${n}</div>`;return s("Scenarios",o)}function $(e){switch((e??"").toLowerCase()){case"critical":return"var(--danger)";case"high":return"var(--danger)";case"medium":return"var(--warning, #e0a020)";case"low":return"var(--text-dim)";default:return"var(--text-dim)"}}function h(e){if(!e||e.length===0)return s("Transmission Paths",'<div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">No active transmissions</div>');const r=[...e].sort((i,n)=>(n.confidence??0)-(i.confidence??0)).slice(0,5).map(i=>{const n=$(i.severity),o=i.corridorId?` via ${a(i.corridorId)}`:"",c=Math.round((i.confidence??0)*100),l=i.latencyHours>0?` · ${i.latencyHours}h`:"";return`
      <div style="padding:4px 0;border-bottom:1px dashed rgba(255,255,255,0.06);display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center">
        <div>
          <div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));font-weight:500">${a(i.mechanism||"mechanism")}${o}</div>
          <div style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">${a(i.start||"")} → ${a(i.end||"")}${l}</div>
        </div>
        <div style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));font-variant-numeric:tabular-nums;color:${n};text-transform:uppercase">${a(i.severity||"unspec")} · ${c}%</div>
      </div>
    `}).join("");return s("Transmission Paths",r)}function z(e,t){const r=(e??[]).map(o=>`
    <div style="padding:3px 0;font-size:calc(11px * var(--wm-panel-effective-scale, 1))">
      <span style="color:var(--danger);font-weight:600">●</span>
      ${a(o.id)}${o.description?` — <span style="color:var(--text-dim)">${a(o.description)}</span>`:""}
    </div>
  `).join(""),i=(t??[]).filter(o=>(o.text??"").trim().length>0).map(o=>`
    <div style="padding:3px 0;font-size:calc(11px * var(--wm-panel-effective-scale, 1))">
      <span style="color:var(--text-dim)">▸</span>
      ${a(o.text)}
    </div>
  `).join("");if(!r&&!i)return s("Watchlist",'<div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">No active triggers or watch items</div>');const n=[];return r&&n.push(`<div style="margin-bottom:6px"><div style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);text-transform:uppercase;margin-bottom:2px">Active Triggers</div>${r}</div>`),i&&n.push(`<div><div style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);text-transform:uppercase;margin-bottom:2px">Watch Items</div>${i}</div>`),s("Watchlist",n.join(""))}function k(e){const t=e.meta;if(!t)return"";const r=Math.round((t.snapshotConfidence??0)*100),i=e.generatedAt?`${new Date(e.generatedAt).toISOString().replace("T"," ").slice(0,16)}Z`:"—",n=t.narrativeProvider?`${a(t.narrativeProvider)}/${a(t.narrativeModel||"unknown")}`:"no narrative";return`
    <div style="display:flex;flex-wrap:wrap;gap:12px;padding:6px 2px 0;font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">
      <span>generated ${a(i)}</span>
      <span>confidence ${r}%</span>
      <span>scoring v${a(t.scoringVersion||"")}</span>
      <span>geo v${a(t.geographyVersion||"")}</span>
      <span>narrative: ${n}</span>
    </div>
  `}function S(e){return e?new Date(e).toISOString().replace("T"," ").slice(0,16)+"Z":"—"}function I(e){if(!e||e.length===0)return s("Regime History",'<div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">No regime transitions recorded yet</div>');const t=e.slice(0,20).map(r=>{const i=r.previousLabel?a(r.previousLabel.replace(/_/g," ")):"none",n=a((r.label??"").replace(/_/g," ")),o=r.transitionDriver?` · ${a(r.transitionDriver)}`:"",c=S(r.transitionedAt);return`
      <div style="display:grid;grid-template-columns:130px 1fr;gap:8px;padding:3px 0;border-bottom:1px dashed rgba(255,255,255,0.06)">
        <div style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);font-variant-numeric:tabular-nums">${a(c)}</div>
        <div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1))"><span style="color:var(--text-dim)">${i}</span> → <span style="font-weight:500;text-transform:capitalize">${n}</span>${o}</div>
      </div>
    `}).join("");return s("Regime History",t)}function N(e){if(!e||!e.situationRecap)return s("Weekly Brief",'<div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">No weekly brief available yet</div>');const t=e.periodStart?new Date(e.periodStart).toISOString().split("T")[0]??"?":"?",r=e.periodEnd?new Date(e.periodEnd).toISOString().split("T")[0]??"?":"?",i=e.provider?`${a(e.provider)}/${a(e.model||"?")}`:"",n=(e.keyDevelopments??[]).filter(c=>c.length>0).slice(0,5).map(c=>`<div style="padding:2px 0;font-size:calc(11px * var(--wm-panel-effective-scale, 1))"><span style="color:var(--text-dim)">▸</span> ${a(c)}</div>`).join(""),o=`
    <div style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);margin-bottom:6px">${a(t)} — ${a(r)}${i?` · ${i}`:""}</div>
    ${e.situationRecap?`<div style="font-size:calc(12px * var(--wm-panel-effective-scale, 1));line-height:1.5;margin-bottom:8px">${a(e.situationRecap)}</div>`:""}
    ${e.regimeTrajectory?`
      <div style="margin-bottom:6px">
        <div style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);text-transform:uppercase;margin-bottom:2px">Regime Trajectory</div>
        <div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));line-height:1.4">${a(e.regimeTrajectory)}</div>
      </div>
    `:""}
    ${n?`
      <div style="margin-bottom:6px">
        <div style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);text-transform:uppercase;margin-bottom:2px">Key Developments</div>
        ${n}
      </div>
    `:""}
    ${e.riskOutlook?`
      <div>
        <div style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);text-transform:uppercase;margin-bottom:2px">Risk Outlook</div>
        <div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));line-height:1.4">${a(e.riskOutlook)}</div>
      </div>
    `:""}
  `;return s("Weekly Brief",o)}export{A as B,j as D,I as a,D as b,N as c,R as i};
