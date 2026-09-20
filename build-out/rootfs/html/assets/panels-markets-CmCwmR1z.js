const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-Cvwvt7HI.js","assets/embed-url-BEcsdCFo.js","assets/panel-storage-COYkA8bZ.js","assets/clerk-DnucG282.js","assets/i18n-qlunRAMb.js","assets/persistent-cache-DcwIBXtm.js","assets/widget-store-IAxu1TMg.js","assets/debugbear-rum-CTwHbetR.js","assets/gdelt-intel-B2bRPowK.js","assets/data-freshness-ChOowvKb.js","assets/panel-gating-CFklAQbM.js","assets/fx-rates-C75bePW4.js","assets/embed-url-B23MHeXh.css"])))=>i.map(i=>d[i]);
var Lt=Object.defineProperty;var zt=(a,s,e)=>s in a?Lt(a,s,{enumerable:!0,configurable:!0,writable:!0,value:e}):a[s]=e;var x=(a,s,e)=>zt(a,typeof s!="symbol"?s+"":s,e);import{P as k}from"./Panel-076IrmoK.js";import{t as d,S as Ue,k as Me,p as It}from"./panel-storage-COYkA8bZ.js";import{n as ht,b as N,p as L,q as gt}from"./widget-store-IAxu1TMg.js";import{e as l,u as S,a as Bt,f as _,j as M}from"./dom-utils-B8MVJOEB.js";import{m as q,s as Ot}from"./sparkline-EyuwviXB.js";import"./panels-c93eK3j2.js";import{c as Ne}from"./watchlist-modal-CVqseWCs.js";import{b as Ut,r as jt,g as Gt,c as Vt,a as Ht,o as qt}from"./market-chart-modal-B2_ACf-o.js";import{X as Yt,Y as Wt}from"./main-8a68VbSf.js";import{g as E,a as D,b as Xt,c as Kt,d as Qt,e as Jt,f as Zt,h as ea,i as ta}from"./stock-fundamentals-display-BdKFnC_N.js";import{W as xt}from"./WatchlistTableView-DQcT7H76.js";import{g as z,c as aa,E as na,a as Le,r as sa,e as ia,M as yt}from"./embed-url-BEcsdCFo.js";import{describeFreshness as ra}from"./persistent-cache-DcwIBXtm.js";import{F as oa}from"./FrameworkSelector-8m6Dfxrc.js";import{h as la}from"./panel-gating-CFklAQbM.js";import{_ as A}from"./clerk-DnucG282.js";import{F as ca}from"./fx-rates-C75bePW4.js";import{a as da,I as pa,t as bt}from"./gdelt-intel-B2bRPowK.js";import{i as ma,a as ua,p as Ce}from"./news-market-correlation-CaMZ0E_r.js";const fa={MARKET_QUOTE_UNAVAILABLE_REASON_UNSPECIFIED:"components.markets.unavailable.notFound",MARKET_QUOTE_UNAVAILABLE_REASON_NOT_FOUND:"components.markets.unavailable.notFound",MARKET_QUOTE_UNAVAILABLE_REASON_PROVIDER_ERROR:"components.markets.unavailable.providerError",MARKET_QUOTE_UNAVAILABLE_REASON_PROVIDER_RATE_LIMITED:"components.markets.unavailable.rateLimited",MARKET_QUOTE_UNAVAILABLE_REASON_PROVIDER_NOT_CONFIGURED:"components.markets.unavailable.notConfigured",MARKET_QUOTE_UNAVAILABLE_REASON_REQUEST_LIMIT_EXCEEDED:"components.markets.unavailable.requestLimit",MARKET_QUOTE_UNAVAILABLE_REASON_UPSTREAM_BUDGET_EXHAUSTED:"components.markets.unavailable.budget",MARKET_QUOTE_UNAVAILABLE_REASON_SEED_UNAVAILABLE:"components.markets.unavailable.seed"};function va(a){const s=d(fa[a.reason]??"components.markets.unavailable.notFound"),e=a.symbols.join(", ");return a.overflow>0?d("components.markets.unavailable.symbolsMore",{symbols:e,count:a.overflow,reason:s}):d("components.markets.unavailable.symbols",{symbols:e,reason:s})}class ha extends k{constructor(){super({id:"markets",title:d("panels.markets"),infoTooltip:d("components.markets.infoTooltip")});x(this,"_markets",[]);x(this,"_marketsRateLimited",!1);x(this,"_marketsUnavailable",[]);x(this,"_disclosures",null);this.header.appendChild(Ne()),Ut(this.content,()=>this._markets,qt)}renderMarkets(e,t,n){this._markets=e,this._marketsRateLimited=!!t,this._marketsUnavailable=n??[],this._renderMarketsAndDisclosures()}renderDisclosures(e){this._disclosures=e??null,this._renderMarketsAndDisclosures()}_renderMarketsAndDisclosures(){const e=jt(this._disclosures),t=this._markets.map((i,r)=>`
      <div${Gt(i,r,d("components.markets.chart.title",{symbol:i.display}))}>
        <div class="market-info">
          <span class="market-name">${l(i.name)}</span>
          <span class="market-symbol">${l(i.display)}</span>
        </div>
        <div class="market-data">
          ${q(i.sparkline,i.change)}
          <span class="market-price">${ht(i.price)}</span>
          <span class="market-change ${N(i.change)}">${L(i.change)}</span>
        </div>
      </div>
    `).join(""),n=Vt({hasMarkets:this._markets.length>0,marketsHtml:t,disclosureHtml:e,unavailableMessage:this._marketsRateLimited?d("common.rateLimitedMarket"):d("common.failedMarketData"),unavailableSymbolLines:Ht(this._marketsUnavailable).map(va)});if(n.kind==="retry"){this.showRetrying(n.message);return}this.setSafeContent(S(n.html,"legacy Panel.setContent() migration"))}}class ga extends k{constructor(){super({id:"heatmap",title:d("panels.heatmap"),infoTooltip:d("components.heatmap.infoTooltip")});x(this,"_tab","performance");x(this,"_heatmapData",[]);x(this,"_sectorBars",[]);x(this,"_valuations",{});x(this,"_staleValuationSymbols",new Set);this.content.addEventListener("click",e=>{const t=e.target.closest("[data-tab]"),n=t==null?void 0:t.dataset.tab;(n==="performance"||n==="valuations")&&(this._tab=n,this._render())})}renderHeatmap(e,t){this._heatmapData=e,this._sectorBars=t??[],this._render()}updateValuations(e,t){if(e===void 0)return;if(this._staleValuationSymbols=new Set((t??[]).map(i=>i.toUpperCase())),Object.keys(e).length===0){this._valuations={},this._tab==="valuations"&&(this._tab="performance"),this._render();return}const n={};for(const[i,r]of Object.entries(e))n[i]={trailingPE:(r==null?void 0:r.trailingPE)??null,forwardPE:(r==null?void 0:r.forwardPE)??null,beta:(r==null?void 0:r.beta)??null,ytdReturn:(r==null?void 0:r.ytdReturn)??null,threeYearReturn:(r==null?void 0:r.threeYearReturn)??null,fiveYearReturn:(r==null?void 0:r.fiveYearReturn)??null};this._valuations=n,this._render()}_buildTabBar(){return Object.keys(this._valuations).length>0?`<div style="display:flex;gap:4px;margin-bottom:8px">
      <button class="panel-tab${this._tab==="performance"?" active":""}" data-tab="performance" style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));padding:3px 10px">Performance</button>
      <button class="panel-tab${this._tab==="valuations"?" active":""}" data-tab="valuations" style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));padding:3px 10px">Valuations</button>
    </div>`:""}_render(){if(this._heatmapData.length===0){this.showRetrying(d("common.failedSectorData"));return}const e=this._buildTabBar();if(this._tab==="valuations"&&Object.keys(this._valuations).length>0){this.setSafeContent(S(e+this._renderValuations(),"legacy Panel.setContent() migration"));return}this.setSafeContent(S(e+this._renderPerformance(),"legacy Panel.setContent() migration"))}_renderPerformance(){const t='<div class="heatmap">'+this._heatmapData.map(o=>{const c=o.change??0,p=o.symbol?`<div class="sector-ticker">${l(o.symbol)}</div>`:"";return`
        <div class="heatmap-cell ${gt(c)}">
          ${p}
          <div class="sector-change ${N(c)}">${L(c)}</div>
          <div class="sector-name">${l(o.name)}</div>
        </div>
      `}).join("")+"</div>";if(this._sectorBars.length===0)return t;const n=[...this._sectorBars].filter(o=>Number.isFinite(o.change1d)).sort((o,c)=>c.change1d-o.change1d);if(n.length===0)return t;const i=Math.max(...n.map(o=>Math.abs(o.change1d)),3),r='<div class="heatmap-bar-chart">'+n.map(o=>{const c=Math.min(Math.abs(o.change1d)/i*100,100).toFixed(1),p=o.change1d>=0,m=p?"var(--green)":"var(--red)",f=p?"+":"";return`<div class="heatmap-bar-row">
  <span class="heatmap-bar-label">${l(o.symbol)}</span>
  <div class="heatmap-bar-track"><div class="heatmap-bar-fill" style="width:${c}%;background:${m}"></div></div>
  <span class="heatmap-bar-value ${p?"positive":"negative"}">${f}${o.change1d.toFixed(2)}%</span>
</div>`}).join("")+"</div>";return t+r}_renderValuations(){const e=Object.entries(this._valuations).map(([u,g])=>({symbol:u,...g})).filter(u=>u.forwardPE!==null||u.trailingPE!==null);if(e.length===0)return'<div style="padding:8px;color:var(--text-dim);font-size:calc(12px * var(--wm-panel-effective-scale, 1))">No valuation data available</div>';const t=[...e].sort((u,g)=>(u.forwardPE??u.trailingPE??999)-(g.forwardPE??g.trailingPE??999)),n=t.map(u=>u.forwardPE??u.trailingPE??0).filter(u=>u>0),i=(n.length>0?n[Math.floor(n.length/2)]:void 0)??20,r=Math.max(...n,30),o=new Map(this._heatmapData.map(u=>[u.symbol,u.name])),c=u=>u!==null?u.toFixed(1):"--",p=u=>{if(u===null)return"--";const g=u*100;return`${g>=0?"+":""}${g.toFixed(1)}%`},m=u=>u!==null?u.toFixed(2):"--",f=u=>u===null?"var(--text-dim)":u<i*.8?"var(--green)":u>i*1.2?"var(--red)":"#e6a817",h='<div class="heatmap-bar-chart" style="margin-bottom:12px">'+t.map(u=>{const g=u.forwardPE??u.trailingPE??0,$=Math.min(g/r*100,100).toFixed(1),w=f(g>0?g:null),b=o.get(u.symbol)??u.symbol;return`<div class="heatmap-bar-row">
  <span class="heatmap-bar-label" title="${l(u.symbol)}">${l(b)}</span>
  <div class="heatmap-bar-track"><div class="heatmap-bar-fill" style="width:${$}%;background:${w}"></div></div>
  <span class="heatmap-bar-value" style="color:${w}">${g>0?g.toFixed(1)+"x":"--"}</span>
</div>`}).join("")+"</div>",v=`<div style="overflow-x:auto">
<table style="width:100%;border-collapse:collapse;font-size:calc(11px * var(--wm-panel-effective-scale, 1))">
  <thead><tr style="color:var(--text-dim);border-bottom:1px solid var(--border)">
    <th style="padding:3px 6px;text-align:left;font-weight:500">Sector</th>
    <th style="padding:3px 6px;text-align:right;font-weight:500">Trail P/E</th>
    <th style="padding:3px 6px;text-align:right;font-weight:500">Fwd P/E</th>
    <th style="padding:3px 6px;text-align:right;font-weight:500">Beta</th>
    <th style="padding:3px 6px;text-align:right;font-weight:500">YTD</th>
  </tr></thead>
  <tbody>${t.map(u=>{const g=o.get(u.symbol)??u.symbol,$=this._staleValuationSymbols.has(u.symbol.toUpperCase()),w=$?' <span title="Last known value; not refreshed this cycle" style="color:var(--text-dim);font-size:calc(9px * var(--wm-panel-effective-scale, 1))">(stale)</span>':"";return`<tr${$?' style="opacity:0.65"':""}>
  <td style="padding:3px 6px;white-space:nowrap;font-size:calc(11px * var(--wm-panel-effective-scale, 1))">${l(g)}${w}</td>
  <td style="padding:3px 6px;text-align:right;font-size:calc(11px * var(--wm-panel-effective-scale, 1));color:${f(u.trailingPE)}">${c(u.trailingPE)}</td>
  <td style="padding:3px 6px;text-align:right;font-size:calc(11px * var(--wm-panel-effective-scale, 1));color:${f(u.forwardPE)}">${c(u.forwardPE)}</td>
  <td style="padding:3px 6px;text-align:right;font-size:calc(11px * var(--wm-panel-effective-scale, 1))">${m(u.beta)}</td>
  <td style="padding:3px 6px;text-align:right;font-size:calc(11px * var(--wm-panel-effective-scale, 1));color:${u.ytdReturn===null?"var(--text-dim)":u.ytdReturn>=0?"var(--green)":"var(--red)"}">${p(u.ytdReturn)}</td>
</tr>`}).join("")}</tbody>
</table></div>`;return h+v}}function xa(a){if(typeof a!="string"||a==="")return null;const s=Number(a);return Number.isFinite(s)?s:null}function $t(a){if(!Array.isArray(a)||a.length<13)return null;const s=a[a.length-1],e=a[a.length-13];return s==null||e==null||!(e>0)||!Number.isFinite(s)?null:(s-e)/e}function ya(a){const s=Array.isArray(a.assets)?a.assets:null;if(!s||s.length===0)return null;const e=[],t=[];for(const n of s){const i=typeof n.funding=="number"&&Number.isFinite(n.funding)?n.funding:null,r=Array.isArray(n.sparkOi)?n.sparkOi.filter(p=>Number.isFinite(p)):[],o=Array.isArray(n.sparkScore)?n.sparkScore.filter(p=>Number.isFinite(p)):[],c={symbol:String(n.symbol??""),display:String(n.display??""),group:String(n.group??""),funding:i,oiDelta1h:$t(r),composite:typeof n.composite=="number"?n.composite:0,warmup:!!n.warmup,stale:!!n.stale,sparkScore:o};c.group==="fx"?e.push(c):t.push(c)}return{ts:typeof a.ts=="number"?a.ts:0,warmup:!!a.warmup,fxAssets:e,commodityAssets:t,unavailable:!1}}function ba(a){const s=[],e=[];for(const t of a.assets){const n={symbol:t.symbol,display:t.display,group:t.group,funding:xa(t.funding),oiDelta1h:$t(t.sparkOi),composite:Number(t.composite||0),warmup:!!t.warmup,stale:!!t.stale,sparkScore:Array.isArray(t.sparkScore)?t.sparkScore:[]};t.group==="fx"?s.push(n):e.push(n)}return{ts:Number(a.ts||0),warmup:!!a.warmup,fxAssets:s,commodityAssets:e,unavailable:!1}}const je=[{symbol:"EURUSD=X",label:"EUR",flag:"🇪🇺",multiply:!1},{symbol:"GBPUSD=X",label:"GBP",flag:"🇬🇧",multiply:!1},{symbol:"USDJPY=X",label:"JPY",flag:"🇯🇵",multiply:!0},{symbol:"USDCNY=X",label:"CNY",flag:"🇨🇳",multiply:!0},{symbol:"USDINR=X",label:"INR",flag:"🇮🇳",multiply:!0},{symbol:"AUDUSD=X",label:"AUD",flag:"🇦🇺",multiply:!1},{symbol:"USDCHF=X",label:"CHF",flag:"🇨🇭",multiply:!0},{symbol:"USDCAD=X",label:"CAD",flag:"🇨🇦",multiply:!0},{symbol:"USDTRY=X",label:"TRY",flag:"🇹🇷",multiply:!0}];class $a extends k{constructor(){super({id:"commodities",title:d("panels.commodities"),infoTooltip:d("components.commodities.infoTooltip")});x(this,"_tab","commodities");x(this,"_commodityData",[]);x(this,"_fxRates",[]);this.content.addEventListener("click",e=>{const t=e.target.closest("[data-tab]"),n=t==null?void 0:t.dataset.tab;(n==="commodities"||n==="fx"||n==="xau"&&Ue==="commodity")&&(this._tab=n,this._render())})}renderCommodities(e){this._commodityData=e,this._render()}updateFxRates(e){this._fxRates=e,this._render()}_buildTabBar(e,t){const i=[`<button class="panel-tab${this._tab==="commodities"?" active":""}" data-tab="commodities" style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));padding:3px 10px">Commodities</button>`];return e&&i.push(`<button class="panel-tab${this._tab==="fx"?" active":""}" data-tab="fx" style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));padding:3px 10px">EUR FX</button>`),t&&i.push(`<button class="panel-tab${this._tab==="xau"?" active":""}" data-tab="xau" style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));padding:3px 10px">XAU/FX</button>`),i.length>1?`<div style="display:flex;gap:4px;margin-bottom:8px">${i.join("")}</div>`:""}_renderXau(){const e=this._commodityData.find(r=>r.symbol==="GC=F"&&r.price!==null);if(!(e!=null&&e.price))return'<div style="padding:8px;color:var(--text-dim);font-size:calc(12px * var(--wm-panel-effective-scale, 1))">Gold price unavailable</div>';const t=e.price,n=new Map(this._commodityData.filter(r=>{var o;return(o=r.symbol)==null?void 0:o.endsWith("=X")}).map(r=>[r.symbol,r])),i=je.map(r=>{const o=n.get(r.symbol);if(!(o!=null&&o.price)||!Number.isFinite(o.price))return null;const c=r.multiply?t*o.price:t/o.price;if(!Number.isFinite(c)||c<=0)return null;const p=Math.round(c).toLocaleString();return`<div class="commodity-item">
        <div class="commodity-name">${l(r.flag)} XAU/${l(r.label)}</div>
        <div class="commodity-price" style="font-size:calc(11px * var(--wm-panel-effective-scale, 1))">${l(p)}</div>
      </div>`}).filter(Boolean);return i.length===0?`<div class="commodities-grid">${je.map(o=>`<div class="commodity-item">
          <div class="commodity-name">${l(o.flag)} XAU/${l(o.label)}</div>
          <div class="commodity-price" style="font-size:calc(11px * var(--wm-panel-effective-scale, 1))">--</div>
        </div>`).join("")}</div><div style="margin-top:6px;font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">FX rates unavailable</div>`:`<div class="commodities-grid">${i.join("")}</div><div style="margin-top:6px;font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">Computed from GC=F + Yahoo FX</div>`}_render(){const e=this._fxRates.length>0,t=Ue==="commodity"&&this._commodityData.some(o=>o.symbol==="GC=F"&&o.price!==null);this._tab==="xau"&&!t&&(this._tab="commodities");const n=this._buildTabBar(e,t);if(this._tab==="fx"&&e){const o=this._fxRates.map(c=>{const p=c.change1d??null,m=p!==null?`${p>0?"+":""}${p.toFixed(4)}`:"",f=p===null||p===0?"":p>0?"change-positive":"change-negative";return`<div class="commodity-item">
          <div class="commodity-name">EUR/${l(c.currency)}</div>
          <div class="commodity-price">${l(c.rate.toFixed(4))}</div>
          ${m?`<div class="commodity-change ${l(f)}">${l(m)}</div>`:""}
        </div>`}).join("");this.setSafeContent(S(n+`<div class="commodities-grid">${o}</div><div style="margin-top:6px;font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">Source: ECB</div>`,"legacy Panel.setContent() migration"));return}if(this._tab==="xau"&&t){this.setSafeContent(S(n+this._renderXau(),"legacy Panel.setContent() migration"));return}const i=this._commodityData.filter(o=>{var c;return typeof o.price=="number"&&Number.isFinite(o.price)&&!((c=o.symbol)!=null&&c.endsWith("=X"))});if(i.length===0){if(!e){this.showRetrying(d("common.failedCommodities"));return}this.setSafeContent(S(n+`<div style="padding:8px;color:var(--text-dim);font-size:calc(12px * var(--wm-panel-effective-scale, 1))">${d("common.failedCommodities")}</div>`,"legacy Panel.setContent() migration"));return}const r='<div class="commodities-grid">'+i.map(o=>`
        <div class="commodity-item">
          <div class="commodity-name">${l(o.display)}</div>
          ${q(o.sparkline,o.change,60,18)}
          <div class="commodity-price">${ht(o.price)}</div>
          <div class="commodity-change ${N(o.change)}">${L(o.change)}</div>
        </div>
      `).join("")+"</div>";this.setSafeContent(S(n+r,"legacy Panel.setContent() migration"))}}class wa extends k{constructor(){super({id:"crypto",title:d("panels.crypto"),infoTooltip:d("components.crypto.infoTooltip")})}renderCrypto(s){if(s.length===0){this.showRetrying(d("common.failedCryptoData"));return}const e=s.map(t=>`
      <div class="market-item">
        <div class="market-info">
          <span class="market-name">${l(t.name)}</span>
          <span class="market-symbol">${l(t.symbol)}</span>
        </div>
        <div class="market-data">
          ${q(t.sparkline,t.change)}
          <span class="market-price">$${t.price.toLocaleString()}</span>
          <span class="market-change ${N(t.change)}">${L(t.change)}</span>
        </div>
      </div>
    `).join("");this.setSafeContent(S(e,"legacy Panel.setContent() migration"))}}class Sa extends k{constructor(){super({id:"crypto-heatmap",title:"Crypto Sectors"})}renderSectors(s){if(s.length===0){this.showRetrying(d("common.failedSectorData"));return}const e='<div class="heatmap">'+s.map(t=>{const n=t.change??0;return`
        <div class="heatmap-cell ${gt(n)}">
          <div class="sector-name">${l(t.name)}</div>
          <div class="sector-change ${N(n)}">${L(n)}</div>
        </div>
      `}).join("")+"</div>";this.setSafeContent(S(e,"legacy Panel.setContent() migration"))}}class le extends k{renderTokens(s){if(s.length===0){this.showRetrying(d("common.failedCryptoData"));return}const e=s.map(t=>`
      <div class="market-item">
        <div class="market-info">
          <span class="market-name">${l(t.name)}</span>
          <span class="market-symbol">${l(t.symbol)}</span>
        </div>
        <div class="market-data">
          <span class="market-price">$${t.price.toLocaleString(void 0,{maximumFractionDigits:t.price<1?6:2})}</span>
          <span class="market-change ${N(t.change24h)}">${L(t.change24h)}</span>
          <span class="market-change market-change--7d ${N(t.change7d)}">${L(t.change7d)}W</span>
        </div>
      </div>
    `).join("");this.setSafeContent(S(e,"legacy Panel.setContent() migration"))}}class _a extends le{constructor(){super({id:"defi-tokens",title:"DeFi Tokens",infoTooltip:d("components.defiTokens.infoTooltip")})}}class ka extends le{constructor(){super({id:"ai-tokens",title:"AI Tokens",infoTooltip:d("components.aiTokens.infoTooltip")})}}class Ca extends le{constructor(){super({id:"other-tokens",title:"Alt Tokens",infoTooltip:d("components.altTokens.infoTooltip")})}}const Ls=Object.freeze(Object.defineProperty({__proto__:null,AiTokensPanel:ka,CommoditiesPanel:$a,CryptoHeatmapPanel:Sa,CryptoPanel:wa,DefiTokensPanel:_a,HeatmapPanel:ga,MarketPanel:ha,OtherTokensPanel:Ca,TokenListPanel:le,mapHyperliquidFlowResponse:ba,mapHyperliquidFlowSeed:ya},Symbol.toStringTag,{value:"Module"}));function ce(a){const s=Number.isFinite(a)?a.toFixed(2):"0.00";return`${a>=0?"+":""}${s}%`}function Aa(a){const s=Number.isFinite(a)?a.toFixed(2):"0.00";return`${a>=.15?"Bullish":a<=-.15?"Bearish":"Neutral"} (${a>=0?"+":""}${s})`}function Ge(a,s){return Number.isFinite(a)?`${s==="USD"?"$":""}${a.toFixed(2)}${s&&s!=="USD"?` ${s}`:""}`:"N/A"}function Ve(a){const s=a.toLowerCase();return s.includes("buy")?"badge-bullish":s.includes("hold")||s.includes("watch")?"badge-neutral":"badge-bearish"}function He(a,s){return a.length===0?"":`<ul class="${s}" style="margin:8px 0 0;padding-left:18px;font-size:calc(12px * var(--wm-panel-effective-scale, 1));line-height:1.5">${a.map(e=>`<li>${l(e)}</li>`).join("")}</ul>`}function X(a){const s=Math.abs(a);return s>=1e9?`$${(a/1e9).toFixed(1)}B`:s>=1e6?`$${(a/1e6).toFixed(1)}M`:s>=1e3?`$${(a/1e3).toFixed(0)}K`:`$${a.toFixed(0)}`}function Fa(a){return a==="P"?"Buy":a==="S"?"Sell":a==="M"?"Exercise":a==="A"?"Award":a==="D"?"Disposition":a==="F"?"Tax/Fee":a}class Ra extends k{constructor(){super({id:"stock-analysis",title:"Premium Stock Analysis",infoTooltip:d("components.stockAnalysis.infoTooltip"),premium:"locked"});x(this,"insiderBySymbol",{});x(this,"tableView");x(this,"lastItems",[]);x(this,"lastHistory",{});this.header.appendChild(Ne("Edit Watchlist"))}destroy(){var e;(e=this.tableView)==null||e.destroy(),super.destroy()}setInsiderData(e,t){this.insiderBySymbol[e]=t}renderAnalyses(e,t={},n="live"){if(e.length===0){this.setDataBadge("unavailable"),this.showRetrying("No premium stock analyses available yet.");return}this.setDataBadge(n,`${e.length} symbols`),this.lastItems=e,this.lastHistory=t,this.tableView?this.tableView.updateRenderDetail(i=>this.renderCard(i,this.lastHistory[i.symbol]||[])):this.tableView=new xt({intro:this.buildIntro(e.length),columns:[{key:"symbol",label:"Symbol",sortable:!0,sortOptionKey:"symbol-asc",cell:i=>`<strong>${l(i.display||i.symbol)}</strong>`},{key:"price",label:"Price",align:"right",cell:i=>l(Ge(i.currentPrice,i.currency))},{key:"signal",label:"Signal",cell:i=>{const r=D(i);return`<span class="signal-badge ${Ve(r)}">${l(r)}</span>`}},{key:"score",label:"Score",align:"right",sortable:!0,sortOptionKey:"score-desc",cell:i=>l(String(E(i)))},{key:"change",label:"1d %",align:"right",sortable:!0,sortOptionKey:"change-desc",cell:i=>`<span style="color:${i.changePercent>=0?"var(--semantic-normal)":"var(--semantic-critical)"}">${l(ce(i.changePercent))}</span>`}],filters:[{key:"all",label:"All",match:()=>!0},{key:"strong-buy",label:"Strong Buy",match:i=>D(i).toLowerCase().includes("strong buy")},{key:"buy",label:"Buy+",match:i=>D(i).toLowerCase().includes("buy")},{key:"hold",label:"Hold",match:i=>{const r=D(i).toLowerCase();return r.includes("hold")||r.includes("watch")}},{key:"sell",label:"Sell",match:i=>D(i).toLowerCase().includes("sell")}],sortOptions:[{key:"score-desc",label:"Score ↓",cmp:(i,r)=>E(r)-E(i)},{key:"change-desc",label:"1d % ↓",cmp:(i,r)=>r.changePercent-i.changePercent},{key:"symbol-asc",label:"Symbol A-Z",cmp:(i,r)=>(i.display||i.symbol).localeCompare(r.display||r.symbol)}],defaultSort:"score-desc",defaultFilter:"all",getKey:i=>i.symbol,getSearchText:i=>`${i.symbol} ${i.display||""} ${i.name||""}`,renderDetail:i=>this.renderCard(i,this.lastHistory[i.symbol]||[]),searchPlaceholder:"Search ticker or name..."}),this.tableView.setItems(e),this.rerender()}rerender(){this.tableView&&(this.tableView.updateIntro(this.buildIntro(this.lastItems.length)),this.setSafeContent(S(this.tableView.render(),"legacy Panel.setContent() migration")),this.tableView.bind(this.content,()=>this.rerender()))}buildIntro(e){const t=Yt().filter(r=>!Wt(r.symbol)).length,n=e===1?"ticker":"tickers",i=t>0?` <span style="color:var(--text-dim)">${t} watchlist ${t===1?"symbol is an index/FX rate":"symbols are indices/FX rates"} and don't get an equity report.</span>`:"";return`Analyst-grade equity reports for the ${e} ${n} in your watchlist — your picks lead, popular names fill the rest. Use <strong>Edit Watchlist</strong> to add your own.${i}`}formatDividendRate(e,t){const n=(t||"").trim().toUpperCase();if(n&&n!=="USD")try{return`${new Intl.NumberFormat("en-US",{style:"currency",currency:n}).format(e)}/share`}catch{return`${n} ${e.toFixed(2)}/share`}return`$${e.toFixed(2)}/share`}renderDividendProfile(e){if(!e.dividendYield||e.dividendYield<=0)return"";const t=`${e.dividendYield.toFixed(1)}%`,n=e.trailingAnnualDividendRate>0?` (${this.formatDividendRate(e.trailingAnnualDividendRate,e.currency)})`:"",i=e.dividendCagr!==0?`${e.dividendCagr>0?"+":""}${e.dividendCagr.toFixed(1)}%`:"N/A",r=e.dividendFrequency?`<span class="badge-neutral" style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));padding:2px 6px;border-radius:3px">${l(e.dividendFrequency)}</span>`:"",o=e.exDividendDate>0?new Date(e.exDividendDate).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"N/A",c=typeof e.payoutRatio=="number"&&e.payoutRatio>0,p=c?`${(e.payoutRatio*100).toFixed(1)}%`:"",m=c?`<div><div style="color:var(--text-dim)">Payout Ratio</div><div style="margin-top:3px">${l(p)}</div></div>`:"";return`
      <div style="border:1px solid var(--border);padding:10px 12px">
        <div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));text-transform:uppercase;letter-spacing:0.08em;color:var(--text-dim);margin-bottom:8px">Dividend Profile</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;font-size:calc(11px * var(--wm-panel-effective-scale, 1))">
          <div><div style="color:var(--text-dim)">Yield</div><div style="margin-top:3px">${l(t)}${l(n)}</div></div>
          <div><div style="color:var(--text-dim)">5Y CAGR</div><div style="margin-top:3px">${l(i)}</div></div>
          <div><div style="color:var(--text-dim)">Frequency</div><div style="margin-top:3px">${r||"N/A"}</div></div>
          ${m}
          <div><div style="color:var(--text-dim)">Ex-Dividend</div><div style="margin-top:3px">${l(o)}</div></div>
        </div>
      </div>
    `}renderCard(e,t){const n=D(e),i=Ve(n),r=t.filter(m=>m.generatedAt!==e.generatedAt).slice(0,3),o=r[0],c=o?E(e)-E(o):null,p=e.headlines.slice(0,2).map(m=>{const f=Bt(m.link),h=l(m.title),y=l(m.source||"Source");return`<a href="${f}" target="_blank" rel="noreferrer" style="display:block;color:var(--text);text-decoration:none;padding:8px 10px;border:1px solid var(--border);background:rgba(255,255,255,0.02)"><div style="font-size:calc(12px * var(--wm-panel-effective-scale, 1));line-height:1.45">${h}</div><div style="margin-top:4px;font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);text-transform:uppercase;letter-spacing:0.08em">${y}</div></a>`}).join("");return`
      <section class="signal-card" style="padding:14px;display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
          <div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <strong style="font-size:calc(16px * var(--wm-panel-effective-scale, 1));letter-spacing:-0.02em">${l(e.name||e.symbol)}</strong>
              <span style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);font-family:var(--font-mono);text-transform:uppercase">${l(e.display||e.symbol)}</span>
              <span class="signal-badge ${i}" style="font-family:var(--font-mono)">${l(n)}</span>
            </div>
            <div style="margin-top:6px;font-size:calc(12px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);line-height:1.5">${l(Xt(e))}</div>
          </div>
          <div style="text-align:right;min-width:110px">
            <div style="font-size:calc(18px * var(--wm-panel-effective-scale, 1));font-weight:700">${l(Ge(e.currentPrice,e.currency))}</div>
            <div style="font-size:calc(12px * var(--wm-panel-effective-scale, 1));color:${e.changePercent>=0?"var(--semantic-normal)":"var(--semantic-critical)"}">${l(ce(e.changePercent))}</div>
            <div style="margin-top:6px;font-size:calc(11px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">Score ${l(String(E(e)))} · ${l(Kt(e))}</div>
          </div>
          ${t.length>=2?(()=>{const m=t.slice(0,6).reverse().map(E),f=m[m.length-1]??0,h=m[m.length-2]??f;return Ot(m,f>=h?"var(--semantic-normal)":"var(--semantic-critical)",60,20,"display:block;margin-top:4px;align-self:flex-end")})():""}
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;font-size:calc(11px * var(--wm-panel-effective-scale, 1))">
          <div style="border:1px solid var(--border);padding:8px"><div style="color:var(--text-dim);text-transform:uppercase;letter-spacing:0.08em">Trend</div><div style="margin-top:4px">${l(e.trendStatus)}</div></div>
          <div style="border:1px solid var(--border);padding:8px"><div style="color:var(--text-dim);text-transform:uppercase;letter-spacing:0.08em">MA5 Bias</div><div style="margin-top:4px">${l(ce(e.biasMa5))}</div></div>
          <div style="border:1px solid var(--border);padding:8px"><div style="color:var(--text-dim);text-transform:uppercase;letter-spacing:0.08em">RSI 12</div><div style="margin-top:4px">${l(e.rsi12.toFixed(1))}</div></div>
          <div style="border:1px solid var(--border);padding:8px"><div style="color:var(--text-dim);text-transform:uppercase;letter-spacing:0.08em">Volume</div><div style="margin-top:4px">${l(e.volumeStatus)}</div></div>
          ${e.newsSentiment!=null?`<div style="border:1px solid var(--border);padding:8px"><div style="color:var(--text-dim);text-transform:uppercase;letter-spacing:0.08em">News</div><div style="margin-top:4px">${l(Aa(e.newsSentiment))}</div></div>`:""}
        </div>
        ${this.renderDividendProfile(e)}
        <div style="font-size:calc(12px * var(--wm-panel-effective-scale, 1));line-height:1.55;color:var(--text)"><strong style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));text-transform:uppercase;letter-spacing:0.08em;color:var(--text-dim)">Action</strong><div style="margin-top:4px">${l(Qt(e))}</div></div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">
          <div>
            <div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));text-transform:uppercase;letter-spacing:0.08em;color:var(--text-dim)">Bullish Factors</div>
            ${He(Jt(e).slice(0,3),"badge-bullish")}
          </div>
          <div>
            <div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));text-transform:uppercase;letter-spacing:0.08em;color:var(--text-dim)">Risk Factors</div>
            ${He(Zt(e).slice(0,3),"badge-bearish")}
          </div>
        </div>
        <div style="font-size:calc(12px * var(--wm-panel-effective-scale, 1));line-height:1.55;color:var(--text-dim)">
          <strong style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));text-transform:uppercase;letter-spacing:0.08em;color:var(--text-dim)">Why Now</strong>
          <div style="margin-top:4px">${l(ea(e))}</div>
        </div>
        ${o?`
          <div style="font-size:calc(12px * var(--wm-panel-effective-scale, 1));line-height:1.55;color:var(--text-dim)">
            <strong style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));text-transform:uppercase;letter-spacing:0.08em;color:var(--text-dim)">Signal Drift</strong>
            <div style="margin-top:4px">
              Previous run was ${l(D(o))} at score ${l(String(E(o)))}.
              Current drift is ${l(`${c&&c>0?"+":""}${(c||0).toFixed(1)}`)}.
            </div>
          </div>
        `:""}
        ${r.length>0?`
          <div style="display:grid;gap:6px">
            <div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));text-transform:uppercase;letter-spacing:0.08em;color:var(--text-dim)">Recent History</div>
            ${r.map(m=>`
              <div style="display:flex;justify-content:space-between;gap:12px;padding:8px 10px;border:1px solid var(--border);background:rgba(255,255,255,0.02);font-size:calc(11px * var(--wm-panel-effective-scale, 1))">
                <span>${l(D(m))} · score ${l(String(E(m)))}</span>
                <span style="color:var(--text-dim)">${l(new Date(m.generatedAt).toLocaleString())}</span>
              </div>
            `).join("")}
          </div>
        `:""}
        ${this.renderInsiderSection(e.symbol)}
        ${p?`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px">${p}</div>`:""}
        ${this.renderAnalystConsensus(e)}
        ${this.renderFundamentals(e)}
      </section>
    `}renderFundamentals(e){const t=(i,r,o)=>`<div style="border:1px solid var(--border);padding:6px 8px;flex:1;min-width:88px"><div style="color:var(--text-dim);text-transform:uppercase;letter-spacing:0.08em">${l(i)}</div><div style="margin-top:2px${o?`;color:${o}`:""}">${l(r)}</div></div>`,n=ta(e.fundamentals,e.currency).map(i=>t(i.label,i.value,i.color));return n.length===0?"":`
      <div style="border-top:1px solid var(--border);margin-top:4px;padding-top:10px">
        <div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));text-transform:uppercase;letter-spacing:0.08em;color:var(--text-dim);margin-bottom:8px">Fundamentals</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">${n.join("")}</div>
      </div>
    `}renderAnalystConsensus(e){const t=e.analystConsensus,n=e.priceTarget,i=e.recentUpgrades,r=t&&t.total>0,o=typeof(n==null?void 0:n.mean)=="number"&&n.mean>0,c=typeof(n==null?void 0:n.median)=="number"&&n.median>0,p=!!n&&n.numberOfAnalysts>0&&(o||c),m=i&&i.length>0;return!r&&!p&&!m?"":`
      <div style="border-top:1px solid var(--border);margin-top:4px;padding-top:10px">
        <div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));text-transform:uppercase;letter-spacing:0.08em;color:var(--text-dim);margin-bottom:8px">Analyst Consensus</div>
        ${r?this.renderRatingBar(t):""}
        ${p?this.renderPriceTarget(n,e.currentPrice,e.currency):""}
        ${m?this.renderRecentUpgrades(i):""}
      </div>
    `}renderRatingBar(e){const t=e.total||1,n=c=>(c/t*100).toFixed(1),i=[{label:"Strong Buy",count:e.strongBuy,color:"#16a34a",pct:n(e.strongBuy)},{label:"Buy",count:e.buy,color:"#4ade80",pct:n(e.buy)},{label:"Hold",count:e.hold,color:"#facc15",pct:n(e.hold)},{label:"Sell",count:e.sell,color:"#f87171",pct:n(e.sell)},{label:"Strong Sell",count:e.strongSell,color:"#dc2626",pct:n(e.strongSell)}].filter(c=>c.count>0),r=i.map(c=>`<div style="flex:${c.count};background:${c.color};height:8px;min-width:2px" title="${l(c.label)}: ${c.count} (${c.pct}%)"></div>`).join(""),o=i.map(c=>`<span style="display:inline-flex;align-items:center;gap:3px"><span style="width:8px;height:8px;border-radius:2px;background:${c.color};display:inline-block"></span>${c.count}</span>`).join('<span style="color:var(--border);margin:0 4px">|</span>');return`
      <div style="margin-bottom:8px">
        <div style="display:flex;gap:1px;border-radius:4px;overflow:hidden;margin-bottom:4px">${r}</div>
        <div style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);display:flex;align-items:center;flex-wrap:wrap;gap:2px">${o}<span style="margin-left:6px;color:var(--text-dim)">(${t} analysts)</span></div>
      </div>
    `}renderPriceTarget(e,t,n){const i=n==="USD"?"$":n==="EUR"?"€":n==="GBP"?"£":n||"$",r=i.length===1,o=u=>r?`${i}${u.toFixed(2)}`:`${u.toFixed(2)} ${i}`,c=u=>typeof u=="number"&&Number.isFinite(u)&&u>0,p=c(e.low)?e.low:void 0,m=c(e.high)?e.high:void 0,f=c(e.mean)?e.mean:void 0,y=(c(e.median)?e.median:void 0)??f;if(!y)return"";const v=[];if(p!==void 0&&v.push(`<div style="border:1px solid var(--border);padding:6px 8px;flex:1;min-width:90px"><div style="color:var(--text-dim);text-transform:uppercase;letter-spacing:0.08em">Low</div><div style="margin-top:2px">${l(o(p))}</div></div>`),v.push(`<div style="border:1px solid var(--border);padding:6px 8px;flex:1;min-width:90px"><div style="color:var(--text-dim);text-transform:uppercase;letter-spacing:0.08em">Median</div><div style="margin-top:2px">${l(o(y))}</div></div>`),m!==void 0&&v.push(`<div style="border:1px solid var(--border);padding:6px 8px;flex:1;min-width:90px"><div style="color:var(--text-dim);text-transform:uppercase;letter-spacing:0.08em">High</div><div style="margin-top:2px">${l(o(m))}</div></div>`),v.push(`<div style="border:1px solid var(--border);padding:6px 8px;flex:1;min-width:90px"><div style="color:var(--text-dim);text-transform:uppercase;letter-spacing:0.08em">Analysts</div><div style="margin-top:2px">${l(String(e.numberOfAnalysts))}</div></div>`),t>0){const u=(y-t)/t*100,g=u>=0?"var(--semantic-normal)":"var(--semantic-critical)",$=`${u>=0?"+":""}${u.toFixed(1)}%`;v.push(`<div style="border:1px solid var(--border);padding:6px 8px;flex:1;min-width:90px"><div style="color:var(--text-dim);text-transform:uppercase;letter-spacing:0.08em">vs Current</div><div style="margin-top:2px;color:${g}">${l($)}</div></div>`)}return`<div style="display:flex;flex-wrap:wrap;gap:8px;font-size:calc(11px * var(--wm-panel-effective-scale, 1));margin-bottom:8px">${v.join("")}</div>`}renderRecentUpgrades(e){return`
      <div style="display:grid;gap:4px">
        <div style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));text-transform:uppercase;letter-spacing:0.08em;color:var(--text-dim)">Recent Actions</div>
        ${e.slice(0,3).map(n=>{const i=n.action==="up"||n.action==="init"?"var(--semantic-normal)":n.action==="down"?"var(--semantic-critical)":"var(--text-dim)",r=n.action==="up"?"Upgrade":n.action==="down"?"Downgrade":n.action==="init"?"Initiated":l(n.action),o=n.fromGrade?`${l(n.fromGrade)} → ${l(n.toGrade)}`:l(n.toGrade);return`
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:5px 8px;border:1px solid var(--border);background:rgba(255,255,255,0.02);font-size:calc(11px * var(--wm-panel-effective-scale, 1))">
          <span style="font-weight:500">${l(n.firm)}</span>
          <span style="color:${i};white-space:nowrap">${r}</span>
          <span style="color:var(--text-dim);white-space:nowrap">${o}</span>
        </div>
      `}).join("")}
      </div>
    `}renderInsiderSection(e){const t=this.insiderBySymbol[e];if(t===void 0)return"";if(t.unavailable)return`
        <div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);padding:8px;border:1px solid var(--border)">
          Insider data unavailable
        </div>`;if(t.transactions.length===0&&t.totalBuys===0&&t.totalSells===0)return`
        <div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);padding:8px;border:1px solid var(--border)">
          No insider transactions in the last 6 months
        </div>`;const n=X(t.totalBuys),i=X(t.totalSells),r=`${t.netValue>=0?"+":""}${X(t.netValue)}`,o=t.netValue>=0?"var(--semantic-normal)":"var(--semantic-critical)",c=`
      <div style="display:flex;gap:16px;flex-wrap:wrap;font-size:calc(12px * var(--wm-panel-effective-scale, 1));font-family:var(--font-mono)">
        <span>Buys: <span style="color:var(--semantic-normal)">${l(n)}</span></span>
        <span>Sells: <span style="color:var(--semantic-critical)">${l(i)}</span></span>
        <span>Net: <span style="color:${o};font-weight:600">${l(r)}</span></span>
      </div>`,p=t.transactions.slice(0,5),m=p.length>0?`
      <table style="width:100%;border-collapse:collapse;font-size:calc(11px * var(--wm-panel-effective-scale, 1));margin-top:6px">
        <thead>
          <tr style="color:var(--text-dim);text-transform:uppercase;letter-spacing:0.08em;text-align:left">
            <th style="padding:4px 6px;border-bottom:1px solid var(--border)">Name</th>
            <th style="padding:4px 6px;border-bottom:1px solid var(--border)">Type</th>
            <th style="padding:4px 6px;border-bottom:1px solid var(--border);text-align:right">Shares</th>
            <th style="padding:4px 6px;border-bottom:1px solid var(--border);text-align:right">Value</th>
            <th style="padding:4px 6px;border-bottom:1px solid var(--border)">Date</th>
          </tr>
        </thead>
        <tbody>
          ${p.map(f=>{const h=f.transactionCode==="P",y=f.transactionCode==="S",v=h?"var(--semantic-normal)":y?"var(--semantic-critical)":"var(--text-dim)",u=f.value===0?"—":X(f.value);return`
              <tr>
                <td style="padding:4px 6px;border-bottom:1px solid var(--border);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l(f.name)}</td>
                <td style="padding:4px 6px;border-bottom:1px solid var(--border);color:${v}">${l(Fa(f.transactionCode))}</td>
                <td style="padding:4px 6px;border-bottom:1px solid var(--border);text-align:right;font-family:var(--font-mono)">${Number.isFinite(f.shares)?f.shares.toLocaleString():"0"}</td>
                <td style="padding:4px 6px;border-bottom:1px solid var(--border);text-align:right;font-family:var(--font-mono)">${u}</td>
                <td style="padding:4px 6px;border-bottom:1px solid var(--border);color:var(--text-dim)">${l(f.transactionDate)}</td>
              </tr>`}).join("")}
        </tbody>
      </table>`:"";return`
      <div style="display:grid;gap:6px">
        <div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));text-transform:uppercase;letter-spacing:0.08em;color:var(--text-dim)">Insider Activity (6 months)</div>
        ${c}
        ${m}
      </div>`}}const zs=Object.freeze(Object.defineProperty({__proto__:null,StockAnalysisPanel:Ra},Symbol.toStringTag,{value:"Module"}));function de(a){return a>0?"#8df0b2":a<0?"#ff8c8c":"var(--text-dim)"}function T(a){return`${a>0?"+":""}${a.toFixed(1)}%`}function Ea(a){return a>=55?"badge-bullish":a>=45?"badge-neutral":"badge-bearish"}function Pa(a){return a>=55?"Profitable":a>=45?"Mixed":"Losing"}class Da extends k{constructor(){super({id:"stock-backtest",title:"Premium Backtesting",infoTooltip:d("components.stockBacktest.infoTooltip"),premium:"locked"});x(this,"tableView");this.header.appendChild(Ne("Edit Watchlist"))}destroy(){var e;(e=this.tableView)==null||e.destroy(),super.destroy()}renderBacktests(e,t="live"){if(e.length===0){this.setDataBadge("unavailable"),this.showRetrying("No stock backtests available yet.");return}this.setDataBadge(t,`${e.length} symbols`),this.tableView||(this.tableView=new xt({intro:"Historical replay of the technical signal model over recent daily bars. Point-in-time fundamentals are not included.",columns:[{key:"symbol",label:"Symbol",sortable:!0,sortOptionKey:"symbol-asc",cell:n=>`<strong>${l(n.display||n.symbol)}</strong>`},{key:"winrate",label:"Win Rate",align:"right",sortable:!0,sortOptionKey:"winrate-desc",cell:n=>l(T(n.winRate))},{key:"direction",label:"Direction",align:"right",sortable:!0,sortOptionKey:"direction-desc",cell:n=>l(T(n.directionAccuracy))},{key:"avgreturn",label:"Avg Return",align:"right",sortable:!0,sortOptionKey:"avgreturn-desc",cell:n=>`<span style="color:${de(n.avgSimulatedReturnPct)}">${l(T(n.avgSimulatedReturnPct))}</span>`},{key:"signals",label:"Signals",align:"right",sortable:!0,sortOptionKey:"signals-desc",cell:n=>l(String(n.actionableEvaluations))}],filters:[{key:"all",label:"All",match:()=>!0},{key:"profitable",label:"Profitable",match:n=>n.winRate>=55},{key:"mixed",label:"Mixed",match:n=>n.winRate>=45&&n.winRate<55},{key:"losing",label:"Losing",match:n=>n.winRate<45}],sortOptions:[{key:"winrate-desc",label:"Win Rate ↓",cmp:(n,i)=>i.winRate-n.winRate},{key:"direction-desc",label:"Direction ↓",cmp:(n,i)=>i.directionAccuracy-n.directionAccuracy},{key:"avgreturn-desc",label:"Avg Return ↓",cmp:(n,i)=>i.avgSimulatedReturnPct-n.avgSimulatedReturnPct},{key:"signals-desc",label:"Signals ↓",cmp:(n,i)=>i.actionableEvaluations-n.actionableEvaluations},{key:"symbol-asc",label:"Symbol A-Z",cmp:(n,i)=>(n.display||n.symbol).localeCompare(i.display||i.symbol)}],defaultSort:"winrate-desc",defaultFilter:"all",getKey:n=>n.symbol,getSearchText:n=>`${n.symbol} ${n.display||""} ${n.name||""}`,renderDetail:n=>this.renderDetail(n),searchPlaceholder:"Search ticker or name..."})),this.tableView.setItems(e),this.rerender()}rerender(){this.tableView&&(this.setSafeContent(S(this.tableView.render(),"legacy Panel.setContent() migration")),this.tableView.bind(this.content,()=>this.rerender()))}renderDetail(e){return`
      <section style="padding:14px;display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
          <div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <strong style="font-size:calc(16px * var(--wm-panel-effective-scale, 1));letter-spacing:-0.02em">${l(e.name||e.symbol)}</strong>
              <span style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);font-family:var(--font-mono);text-transform:uppercase">${l(e.display||e.symbol)}</span>
              <span class="signal-badge ${Ea(e.winRate)}">${l(Pa(e.winRate))}</span>
            </div>
            <div style="margin-top:6px;font-size:calc(12px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);line-height:1.5">${l(e.summary)}</div>
          </div>
          <div style="text-align:right;min-width:110px">
            <div style="font-size:calc(18px * var(--wm-panel-effective-scale, 1));font-weight:700;color:${de(e.avgSimulatedReturnPct)}">${l(T(e.avgSimulatedReturnPct))}</div>
            <div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">Avg simulated return</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;font-size:calc(11px * var(--wm-panel-effective-scale, 1))">
          <div style="border:1px solid var(--border);padding:8px"><div style="color:var(--text-dim);text-transform:uppercase;letter-spacing:0.08em">Win Rate</div><div style="margin-top:4px">${l(T(e.winRate))}</div></div>
          <div style="border:1px solid var(--border);padding:8px"><div style="color:var(--text-dim);text-transform:uppercase;letter-spacing:0.08em">Direction Accuracy</div><div style="margin-top:4px">${l(T(e.directionAccuracy))}</div></div>
          <div style="border:1px solid var(--border);padding:8px"><div style="color:var(--text-dim);text-transform:uppercase;letter-spacing:0.08em">Cumulative</div><div style="margin-top:4px;color:${de(e.cumulativeSimulatedReturnPct)}">${l(T(e.cumulativeSimulatedReturnPct))}</div></div>
          <div style="border:1px solid var(--border);padding:8px"><div style="color:var(--text-dim);text-transform:uppercase;letter-spacing:0.08em">Signals</div><div style="margin-top:4px">${l(String(e.actionableEvaluations))}</div></div>
          <div style="border:1px solid var(--border);padding:8px"><div style="color:var(--text-dim);text-transform:uppercase;letter-spacing:0.08em">Rating Basis</div><div style="margin-top:4px">${l(e.ratingBasis==="technical_only"?"Technical only":e.ratingBasis)}</div></div>
        </div>
        <div style="display:grid;gap:6px">
          <div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));text-transform:uppercase;letter-spacing:0.08em;color:var(--text-dim)">Recent Evaluations</div>
          ${e.evaluations.map(t=>`
            <div style="display:flex;justify-content:space-between;gap:12px;padding:8px 10px;border:1px solid var(--border);background:rgba(255,255,255,0.02);font-size:calc(11px * var(--wm-panel-effective-scale, 1))">
              <span>${l(t.signal)} · ${l(t.outcome)} · ${l(T(t.simulatedReturnPct))}</span>
              <span style="color:var(--text-dim)">${l(new Date(Number(t.analysisAt)).toLocaleDateString())}</span>
            </div>
          `).join("")}
        </div>
      </section>
    `}}const Is=Object.freeze(Object.defineProperty({__proto__:null,StockBacktestPanel:Da},Symbol.toStringTag,{value:"Module"}));function Ta(a){return a>=1e6?`${(a/1e6).toFixed(1)}M`:a>=1e3?`${(a/1e3).toFixed(1)}K`:String(a)}function Ma(a){return a>=80?"#e74c3c":a>=50?"#e67e22":a>=25?"#f1c40f":"#27ae60"}class Na extends k{constructor(){super({id:"wsb-ticker-scanner",title:d("panels.wsbTickerScanner"),infoTooltip:d("components.wsbTickerScanner.infoTooltip"),showCount:!0,premium:"locked"});x(this,"_tickers",[]);x(this,"_hasData",!1);x(this,"_sortField","mentionCount");x(this,"_sortAsc",!1);this.content.addEventListener("click",e=>{const n=e.target.closest("[data-sort]");if(!n)return;const i=n.dataset.sort;i===this._sortField?this._sortAsc=!this._sortAsc:(this._sortField=i,this._sortAsc=!1),this._render()})}async fetchData(){var t,n,i;const e=z("wsbTickers");if((t=e==null?void 0:e.tickers)!=null&&t.length)return this.updateData(e.tickers),!0;try{const r=await fetch(Me("/api/bootstrap?keys=wsbTickers"),{signal:AbortSignal.timeout(5e3)});if(r.ok){const{data:o}=await r.json();if((i=(n=o.wsbTickers)==null?void 0:n.tickers)!=null&&i.length)return this.updateData(o.wsbTickers.tickers),!0}}catch{}return this.showError("No ticker data available yet",()=>{this.fetchData()},60),!1}updateData(e){this._tickers=[...e],this._hasData=this._tickers.length>0,this._hasData?(this.setCount(this._tickers.length),this._render()):(this.setCount(0),this.showError("No trending tickers found",()=>{this.fetchData()},120))}_sorted(){const e=this._sortAsc?1:-1;return[...this._tickers].sort((t,n)=>e*(t[this._sortField]-n[this._sortField]))}_sortIndicator(e){return e!==this._sortField?"":this._sortAsc?" ▲":" ▼"}_render(){const e=this._sorted(),t=Math.max(1,...e.map(o=>o.velocityScore)),n="font-size:calc(9px * var(--wm-panel-effective-scale, 1));font-weight:700;color:var(--text-dim);text-transform:uppercase;padding:4px 6px;cursor:pointer;user-select:none;white-space:nowrap",i="font-size:calc(11px * var(--wm-panel-effective-scale, 1));padding:5px 6px;vertical-align:middle",r=e.slice(0,50).map((o,c)=>{const p=Ma(o.velocityScore),m=Math.max(4,Math.round(o.velocityScore/t*100)),f=o.subreddits.map(h=>`<span style="font-size:calc(8px * var(--wm-panel-effective-scale, 1));padding:1px 4px;border-radius:2px;background:rgba(255,255,255,0.06);color:var(--text-dim);margin-right:2px">r/${l(h)}</span>`).join("");return`<tr style="border-bottom:1px solid var(--border)">
        <td style="${i};color:var(--text-dim);text-align:right;min-width:20px">${c+1}</td>
        <td style="${i};font-family:'SF Mono',SFMono-Regular,Consolas,monospace;font-weight:700;color:var(--text)">${l(o.symbol)}</td>
        <td style="${i};text-align:right;color:var(--text)">${o.mentionCount}</td>
        <td style="${i};text-align:right;color:var(--text)">${Ta(o.totalScore)}</td>
        <td style="${i};min-width:80px">
          <div style="display:flex;align-items:center;gap:4px">
            <span style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));font-weight:600;color:${p};min-width:24px;text-align:right">${Math.round(o.velocityScore)}</span>
            <div style="flex:1;height:4px;border-radius:2px;background:rgba(255,255,255,0.08)">
              <div style="height:100%;width:${m}%;border-radius:2px;background:${p}"></div>
            </div>
          </div>
        </td>
        <td style="${i}">${f}</td>
      </tr>`}).join("");this.setSafeContent(S(`
      <div style="overflow-x:auto;overflow-y:auto;max-height:480px">
        <table style="width:100%;border-collapse:collapse;border-spacing:0">
          <thead>
            <tr style="border-bottom:1px solid var(--border)">
              <th style="${n};text-align:right">#</th>
              <th style="${n};text-align:left">Ticker</th>
              <th style="${n};text-align:right" data-sort="mentionCount">Mentions${this._sortIndicator("mentionCount")}</th>
              <th style="${n};text-align:right" data-sort="totalScore">Score${this._sortIndicator("totalScore")}</th>
              <th style="${n};text-align:left" data-sort="velocityScore">Velocity${this._sortIndicator("velocityScore")}</th>
              <th style="${n};text-align:left">Source</th>
            </tr>
          </thead>
          <tbody>${r||'<tr><td colspan="6" style="padding:16px;text-align:center;color:var(--text-dim);font-size:calc(12px * var(--wm-panel-effective-scale, 1))">No ticker data</td></tr>'}</tbody>
        </table>
      </div>
      <div style="margin-top:6px;font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">Reddit · r/wallstreetbets, r/stocks, r/investing · sorted by ${this._sortField.replace(/([A-Z])/g," $1").toLowerCase()}</div>
    `,"legacy Panel.setContent() migration"))}}const Bs=Object.freeze(Object.defineProperty({__proto__:null,WsbTickerScannerPanel:Na},Symbol.toStringTag,{value:"Module"}));function La(a){const s=a.toUpperCase();return s==="LONG"?"badge-bullish":s==="SHORT"?"badge-bearish":"badge-neutral"}function za(a){const s=a.toUpperCase();return s==="HIGH"?"badge-bullish":s==="LOW"?"badge-bearish":"badge-neutral"}function Ia(a){const s=a.toUpperCase();return s==="LONG"?d("components.marketImplications.directions.long"):s==="SHORT"?d("components.marketImplications.directions.short"):d("components.marketImplications.directions.hedge")}function Ba(a){if(!a||a.length===0)return"";const s=Math.random().toString(36).slice(2,8),e=a.map((t,n)=>{const i=n<a.length-1?' <span style="color:var(--text-dim);margin:0 2px">&rarr;</span> ':"";return`<span class="chain-node" data-chain-id="${s}" data-node-idx="${n}" data-logic="${l(t.logic)}"
      style="cursor:pointer;border-bottom:1px dotted var(--text-dim)">${l(t.node)}</span>${i}`}).join("");return`
    <div style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);margin-top:6px;line-height:1.8">
      <span style="text-transform:uppercase;letter-spacing:0.06em;opacity:0.6">${l(d("components.marketImplications.rationale"))}</span> ${e}
    </div>
    <div id="chain-logic-${s}" style="display:none;font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);font-style:italic;margin-top:2px;padding-left:4px"></div>
  `}function Oa(a){return`
    <div class="signal-card">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px">
        <span class="signal-badge ${La(a.direction)}">${Ia(a.direction)}</span>
        <strong style="font-size:calc(14px * var(--wm-panel-effective-scale, 1));letter-spacing:-0.02em">${l(a.ticker)}</strong>
        ${a.name?`<span style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">${l(a.name)}</span>`:""}
        ${a.timeframe?`<span class="signal-badge badge-neutral" style="font-family:var(--font-mono)">${l(a.timeframe)}</span>`:""}
        ${a.confidence?`<span class="signal-badge ${za(a.confidence)}">${l(a.confidence)}</span>`:""}
      </div>
      <div style="font-size:calc(13px * var(--wm-panel-effective-scale, 1));font-weight:600;line-height:1.4;margin-bottom:6px">${l(a.title)}</div>
      <div style="font-size:calc(12px * var(--wm-panel-effective-scale, 1));line-height:1.55;color:var(--text-dim)">${l(a.narrative)}</div>
      ${Ba(a.transmissionChain)}
      ${a.driver?`<div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);margin-top:6px"><span style="text-transform:uppercase;letter-spacing:0.06em">${l(d("components.marketImplications.driver"))}</span> ${l(a.driver)}</div>`:""}
      ${a.riskCaveat?`<div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));color:var(--yellow);padding:6px 8px;border:1px solid color-mix(in srgb,var(--yellow) 30%,transparent);background:color-mix(in srgb,var(--yellow) 8%,transparent);margin-top:6px">${l(a.riskCaveat)}</div>`:""}
    </div>
  `}class Ua extends k{constructor(){super({id:"market-implications",title:d("components.marketImplications.title"),infoTooltip:d("components.marketImplications.infoTooltip"),premium:"locked"});x(this,"fwSelector");this.fwSelector=new oa({panelId:"market-implications",isPremium:la(),panel:this,note:d("components.marketImplications.appliesToNext")}),this.header.appendChild(this.fwSelector.el),this.content.addEventListener("click",e=>{const t=e.target.closest(".chain-node");if(!t)return;const n=t.getAttribute("data-chain-id"),i=t.getAttribute("data-node-idx"),r=t.getAttribute("data-logic"),o=this.content.querySelector(`#chain-logic-${n}`);if(!o)return;const c=o.style.display!=="none",p=o.getAttribute("data-open-idx")===i;c&&p?o.style.display="none":(o.textContent=r,o.setAttribute("data-open-idx",i),o.style.display="block")})}destroy(){this.fwSelector.destroy(),super.destroy()}renderImplications(e,t="live"){if(e.degraded||e.cards.length===0){this.showUnavailable();return}const n=e.generatedAt?ra(new Date(e.generatedAt).getTime()):"";this.setDataBadge(t,n||d("components.marketImplications.signals",{count:e.cards.length})),this.resetRetryBackoff();const i=`
      <div style="display:flex;flex-direction:column;gap:10px">
        ${e.cards.map(Oa).join("")}
        <div style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);padding:8px;border-top:1px solid var(--border);line-height:1.5;text-align:center">${l(d("components.marketImplications.disclaimer"))}</div>
      </div>
    `;this.setSafeContent(S(i,"legacy Panel.setContent() migration"))}showUnavailable(e=d("components.marketImplications.unavailable")){this.setDataBadge("unavailable");const t=`
      <div style="font-size:calc(12px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);line-height:1.5;padding:16px 0;text-align:center">${l(e)}</div>
    `;this.setSafeContent(S(t,"legacy Panel.setContent() migration"))}}const Os=Object.freeze(Object.defineProperty({__proto__:null,MarketImplicationsPanel:Ua},Symbol.toStringTag,{value:"Module"}));function O(a){const s=Math.abs(a);return s>=1e3?Math.round(a).toLocaleString():s>=100?a.toFixed(2):s>=1?a.toFixed(4):a.toPrecision(4)}function qe(a){return`${a>0?"+":""}${a.toFixed(1)}%`}function Ye(a){return`${a>0?"+":""}${a.toFixed(4)}`}function K(a){return a>0?"change-positive":a<0?"change-negative":"fx-flat"}const ja=6e4,pe="stress";class Ga extends k{constructor(){super({id:"fx",title:d("panels.fx"),defaultRowSpan:2,infoTooltip:d("components.fx.infoTooltip")});x(this,"stress",[]);x(this,"usd",[]);x(this,"eur",[]);x(this,"rub",[]);x(this,"degraded",[]);x(this,"tab",pe);x(this,"tabForced",!1);x(this,"loaded",!1);x(this,"inFlight",!1);x(this,"degradedRetryTimer",null);this.content.addEventListener("click",e=>this.handleClick(e))}async fetchData(){var e,t;if(!this.inFlight){this.inFlight=!0;try{const{getFxPanelData:n}=await A(async()=>{const{getFxPanelData:r}=await import("./index-Cvwvt7HI.js");return{getFxPanelData:r}},__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12])),i=await n();if(!((e=this.element)!=null&&e.isConnected))return;this.updateFx(i)}catch(n){if(this.isAbortError(n)||!((t=this.element)!=null&&t.isConnected))return;this.showError(d("common.failedMarketData"),()=>void this.fetchData())}finally{this.inFlight=!1}}}updateFx(e){this.stress=e.stress,this.usd=e.usd,this.eur=e.eur,this.rub=e.rub,this.degraded=e.degraded,this.loaded=!0,this.render(),this.scheduleDegradedRetry()}scheduleDegradedRetry(){this.clearDegradedRetry(),this.degraded.length!==0&&(this.degradedRetryTimer=setTimeout(()=>{var e;this.degradedRetryTimer=null,(e=this.element)!=null&&e.isConnected&&this.fetchData()},ja))}clearDegradedRetry(){this.degradedRetryTimer!==null&&(clearTimeout(this.degradedRetryTimer),this.degradedRetryTimer=null)}destroy(){this.clearDegradedRetry(),super.destroy()}handleClick(e){const t=e.target.closest(".panel-tab");t!=null&&t.dataset.tab&&(this.tab=t.dataset.tab,this.tabForced=!1,this.render())}hasStress(){return this.stress.length>0}hasSpot(){return this.usd.length>0||this.eur.length>0}hasRub(){return this.rub.length>0}render(){if(!this.loaded)return;if(!this.hasStress()&&!this.hasSpot()&&!this.hasRub()){this.showError(d("common.failedMarketData"),()=>void this.fetchData());return}this.tabForced&&this.tab!==pe&&this.hasStress()&&(this.tab=pe,this.tabForced=!1),this.tab==="stress"&&!this.hasStress()&&(this.tab="spot",this.tabForced=!0),this.tab==="spot"&&!this.hasSpot()&&(this.tab="rub",this.tabForced=!0),this.tab==="rub"&&!this.hasRub()&&(this.tab="stress",this.tabForced=!0);const e=this.tab==="stress"?this.renderStress():this.tab==="spot"?this.renderSpot():this.renderRub();this.setSafeContent(_`${this.renderTabs()}${e}${this.renderDegradedNotice()}`)}renderDegradedNotice(){if(this.degraded.length===0)return _``;const e=this.degraded.map(t=>d(`components.fx.source.${t}`)).join(", ");return _`<div class="fx-degraded">${d("components.fx.degraded",{sources:e})}</div>`}renderTabs(){const e=[];return this.hasStress()&&e.push(_`<button class="panel-tab ${this.tab==="stress"?"active":""}" data-tab="stress">${d("components.fx.tabs.stress")}</button>`),this.hasSpot()&&e.push(_`<button class="panel-tab ${this.tab==="spot"?"active":""}" data-tab="spot">${d("components.fx.tabs.spot")}</button>`),this.hasRub()&&e.push(_`<button class="panel-tab ${this.tab==="rub"?"active":""}" data-tab="rub">${d("components.fx.tabs.rub")}</button>`),_`<div class="panel-tabs">${M(e)}</div>`}renderStress(){const e=M(this.stress.map(c=>{const p=c.yoyChange===null?_`<td class="fx-na">--</td>`:_`<td class="${K(c.yoyChange)}">${qe(c.yoyChange)}</td>`,f=c.peakRate!==null&&c.troughRate!==null&&c.peakDate!==null&&c.troughDate!==null?_`<td class="fx-window">
            <span class="fx-window-rates">${O(c.peakRate)} → ${O(c.troughRate)}</span>
            <span class="fx-window-dates">${c.peakDate} → ${c.troughDate}</span>
          </td>`:_`<td class="fx-na">--</td>`;return _`
        <tr class="${c.stressed?"fx-stressed":""}">
          <td class="fx-ccy">
            <span class="fx-ccy-code">${c.currency}</span>
            <span class="fx-ccy-country">${c.countryCode}</span>
          </td>
          ${p}
          <td class="${K(c.drawdown24m)}">${qe(c.drawdown24m)}</td>
          ${f}
        </tr>`})),t=this.stress.map(c=>c.asOf).filter(c=>c!==null),n=t.length>0?t.reduce((c,p)=>c<p?c:p):null,i=t.length>0?t.reduce((c,p)=>c>p?c:p):null,r=n===null||i===null?null:n===i?i:`${n} → ${i}`,o=this.stress.filter(c=>c.stressed).length;return _`
      <div class="fx-scroll">
        <table class="fx-table">
          <thead>
            <tr>
              <th class="fx-ccy">${d("components.fx.currency")}</th>
              <th>${d("components.fx.yoy")}</th>
              <th>${d("components.fx.drawdown")}</th>
              <th class="fx-window">${d("components.fx.peakToTrough")}</th>
            </tr>
          </thead>
          <tbody>${e}</tbody>
        </table>
      </div>
      <div class="fx-footer">
        ${d("components.fx.stressedCount",{stressed:o,total:this.stress.length,threshold:`${ca}%`})}
        · ${d("components.fx.sourceYahoo")}${r?` · ${r}`:""}
      </div>`}renderSpot(){const e=[];if(this.usd.length>0){const t=M(this.usd.map(n=>_`
        <tr>
          <td class="fx-ccy"><span class="fx-ccy-code">${n.currency}</span></td>
          <td>${O(n.unitsPerUsd)}</td>
          <td class="fx-inverse">${O(n.usdPerUnit)}</td>
        </tr>`));e.push(_`
        <div class="fx-section-title">${d("components.fx.usdBase")}</div>
        <div class="fx-scroll">
          <table class="fx-table">
            <thead>
              <tr>
                <th class="fx-ccy">${d("components.fx.currency")}</th>
                <th>${d("components.fx.perUsd")}</th>
                <th class="fx-inverse">${d("components.fx.usdPerUnit")}</th>
              </tr>
            </thead>
            <tbody>${t}</tbody>
          </table>
        </div>
        <div class="fx-footer">${d("components.fx.sourceYahoo")}</div>`)}if(this.eur.length>0){const t=M(this.eur.map(n=>{const i=n.change1d===null?_`<td class="fx-na">--</td>`:_`<td class="${K(n.change1d)}">${Ye(n.change1d)}</td>`;return _`
          <tr>
            <td class="fx-ccy"><span class="fx-ccy-code">EUR/${n.currency}</span></td>
            <td>${O(n.rate)}</td>
            ${i}
          </tr>`}));e.push(_`
        <div class="fx-section-title">${d("components.fx.eurBase")}</div>
        <div class="fx-scroll">
          <table class="fx-table">
            <thead>
              <tr>
                <th class="fx-ccy">${d("components.fx.pair")}</th>
                <th>${d("components.fx.rate")}</th>
                <th>${d("components.fx.change1d")}</th>
              </tr>
            </thead>
            <tbody>${t}</tbody>
          </table>
        </div>
        <div class="fx-footer">${d("components.fx.sourceEcb")}</div>`)}return M(e)}renderRub(){const e=M(this.rub.map(t=>{const n=t.change1d===null?_`<td class="fx-na">--</td>`:_`<td class="${K(t.change1d)}">${Ye(t.change1d)}</td>`;return _`
        <tr>
          <td class="fx-ccy"><span class="fx-ccy-code">${t.currency}</span></td>
          <td>${O(t.rubPerUnit)}</td>
          ${n}
        </tr>`}));return _`
      <div class="fx-section-title">${d("components.fx.rubBase")}</div>
      <div class="fx-scroll">
        <table class="fx-table">
          <thead>
            <tr>
              <th class="fx-ccy">${d("components.fx.currency")}</th>
              <th>${d("components.fx.rubPerUnit")}</th>
              <th>${d("components.fx.change1d")}</th>
            </tr>
          </thead>
          <tbody>${e}</tbody>
        </table>
      </div>
      <div class="fx-footer">${d("components.fx.sourceCbr")}</div>`}}const Us=Object.freeze(Object.defineProperty({__proto__:null,FxPanel:Ga},Symbol.toStringTag,{value:"Module"})),Va=aa(()=>new na(Le(),{fetch:sa}));function We(a){var e,t,n,i,r,o,c,p,m,f,h,y,v,u,g,$,w,b,C,F,R,W,B;const s=a.signals;return{timestamp:a.timestamp,verdict:a.verdict,bullishCount:a.bullishCount,totalCount:a.totalCount,signals:{liquidity:{status:((e=s==null?void 0:s.liquidity)==null?void 0:e.status)??"UNKNOWN",value:((t=s==null?void 0:s.liquidity)==null?void 0:t.value)??null,sparkline:((n=s==null?void 0:s.liquidity)==null?void 0:n.sparkline)??[]},flowStructure:{status:((i=s==null?void 0:s.flowStructure)==null?void 0:i.status)??"UNKNOWN",btcReturn5:((r=s==null?void 0:s.flowStructure)==null?void 0:r.btcReturn5)??null,qqqReturn5:((o=s==null?void 0:s.flowStructure)==null?void 0:o.qqqReturn5)??null},macroRegime:{status:((c=s==null?void 0:s.macroRegime)==null?void 0:c.status)??"UNKNOWN",qqqRoc20:((p=s==null?void 0:s.macroRegime)==null?void 0:p.qqqRoc20)??null,xlpRoc20:((m=s==null?void 0:s.macroRegime)==null?void 0:m.xlpRoc20)??null},technicalTrend:{status:((f=s==null?void 0:s.technicalTrend)==null?void 0:f.status)??"UNKNOWN",btcPrice:((h=s==null?void 0:s.technicalTrend)==null?void 0:h.btcPrice)??null,sma50:((y=s==null?void 0:s.technicalTrend)==null?void 0:y.sma50)??null,sma200:((v=s==null?void 0:s.technicalTrend)==null?void 0:v.sma200)??null,vwap30d:((u=s==null?void 0:s.technicalTrend)==null?void 0:u.vwap30d)??null,mayerMultiple:((g=s==null?void 0:s.technicalTrend)==null?void 0:g.mayerMultiple)??null,sparkline:(($=s==null?void 0:s.technicalTrend)==null?void 0:$.sparkline)??[]},hashRate:{status:((w=s==null?void 0:s.hashRate)==null?void 0:w.status)??"UNKNOWN",change30d:((b=s==null?void 0:s.hashRate)==null?void 0:b.change30d)??null},priceMomentum:{status:((C=s==null?void 0:s.priceMomentum)==null?void 0:C.status)??"UNKNOWN"},fearGreed:{status:((F=s==null?void 0:s.fearGreed)==null?void 0:F.status)??"UNKNOWN",value:((R=s==null?void 0:s.fearGreed)==null?void 0:R.value)??null,history:((W=s==null?void 0:s.fearGreed)==null?void 0:W.history)??[]}},meta:{qqqSparkline:((B=a.meta)==null?void 0:B.qqqSparkline)??[]},unavailable:a.unavailable}}function Q(a,s=80,e=24,t="#4fc3f7"){if(!a||a.length<2)return"";const n=Math.min(...a),r=Math.max(...a)-n||1,o=a.map((c,p)=>{const m=p/(a.length-1)*s,f=e-(c-n)/r*(e-2)-1;return`${m.toFixed(1)},${f.toFixed(1)}`}).join(" ");return`<svg width="${s}" height="${e}" viewBox="0 0 ${s} ${e}" class="signal-sparkline"><polyline points="${o}" fill="none" stroke="${t}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`}function Ha(a,s=48){if(a===null)return'<span class="signal-value unknown">N/A</span>';const e=Math.max(0,Math.min(100,a)),t=(s-6)/2,n=2*Math.PI*t,i=n-e/100*n;let r="#f44336";return e>=75?r="#4caf50":e>=50?r="#ff9800":e>=25&&(r="#ff5722"),`<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" class="fg-donut">
    <circle cx="${s/2}" cy="${s/2}" r="${t}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="5"/>
    <circle cx="${s/2}" cy="${s/2}" r="${t}" fill="none" stroke="${r}" stroke-width="5" stroke-dasharray="${n}" stroke-dashoffset="${i}" stroke-linecap="round" transform="rotate(-90 ${s/2} ${s/2})"/>
    <text x="${s/2}" y="${s/2+4}" text-anchor="middle" fill="${r}" style="font-size:calc(12px * var(--wm-panel-effective-scale, 1))" font-weight="bold">${e}</text>
  </svg>`}function qa(a){const s=a.toUpperCase();return["GREED","EXTREME GREED"].includes(s)?"#4caf50":["FEAR","EXTREME FEAR"].includes(s)?"#f44336":"#4fc3f7"}function Xe(a){const s=a.toUpperCase();return["BULLISH","RISK-ON","GROWING","PROFITABLE","ALIGNED","NORMAL","EXTREME GREED","GREED"].includes(s)?"badge-bullish":["BEARISH","DEFENSIVE","DECLINING","SQUEEZE","PASSIVE GAP","EXTREME FEAR","FEAR"].includes(s)?"badge-bearish":"badge-neutral"}function U(a,s="%"){return a===null?"N/A":`${a>0?"+":""}${a.toFixed(1)}${s}`}class Ya extends k{constructor(){super({id:"macro-signals",title:d("panels.macroSignals"),showCount:!1,infoTooltip:d("components.macroSignals.infoTooltip")});x(this,"data",null);x(this,"loading",!0);x(this,"error",null);x(this,"lastTimestamp","")}async fetchData(){const e=z("macroSignals");return e!=null&&e.signals&&e.totalCount>0?(this.data=We(e),this.lastTimestamp=this.data.timestamp,this.error=null,this.loading=!1,this.renderPanel(),this.refreshFromRpc(),!0):this.refreshFromRpc()}async refreshFromRpc(){var n,i,r;try{const o=await Va().getMacroSignals({});if(!((n=this.element)!=null&&n.isConnected))return!1;this.data=We(o),this.error=null}catch(o){if(this.isAbortError(o)||!((i=this.element)!=null&&i.isConnected))return!1;if(!this.data)console.warn("[MacroSignals] Fetch error:",o),this.error=d("common.noDataShort");else return!1}this.loading=!1,this.renderPanel();const e=((r=this.data)==null?void 0:r.timestamp)??"",t=e!==this.lastTimestamp;return this.lastTimestamp=e,t}renderPanel(){var r,o,c;if(this.loading){this.showLoading(d("common.computingSignals"));return}if(this.error||!this.data){this.showError(this.error||d("common.noDataShort"),()=>void this.fetchData());return}if(this.data.unavailable){this.showError(d("common.upstreamUnavailable"),()=>void this.fetchData());return}const e=this.data,t=e.signals,i=`
      <div class="macro-signals-container">
        <div class="macro-verdict ${e.verdict==="BUY"?"verdict-buy":e.verdict==="CASH"?"verdict-cash":"verdict-unknown"}">
          <span class="verdict-label">${d("components.macroSignals.overall")}</span>
          <span style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));background:rgba(247,147,26,0.15);color:#f7931a;border:1px solid rgba(247,147,26,0.3);padding:1px 5px;border-radius:3px;font-weight:700;letter-spacing:0.04em;vertical-align:middle">&#x20bf; BTC</span>
          <span class="verdict-value">${e.verdict==="BUY"?d("components.macroSignals.verdict.buy"):e.verdict==="CASH"?d("components.macroSignals.verdict.cash"):l(e.verdict)}</span>
          <span class="verdict-detail">${d("components.macroSignals.bullish",{count:String(e.bullishCount),total:String(e.totalCount)})}</span>
        </div>
        <div class="signals-grid">
          ${this.renderSignalCard(d("components.macroSignals.signals.liquidity"),t.liquidity.status,U(t.liquidity.value),Q(t.liquidity.sparkline,60,20,"#4fc3f7"),"JPY 30d ROC","https://www.tradingview.com/symbols/JPYUSD/")}
          ${this.renderSignalCard(d("components.macroSignals.signals.flow"),t.flowStructure.status,`BTC ${U(t.flowStructure.btcReturn5)} / QQQ ${U(t.flowStructure.qqqReturn5)}`,"","5d returns",null)}
          ${this.renderSignalCard(d("components.macroSignals.signals.regime"),t.macroRegime.status,`QQQ ${U(t.macroRegime.qqqRoc20)} / XLP ${U(t.macroRegime.xlpRoc20)}`,Q(e.meta.qqqSparkline,60,20,"#ab47bc"),"20d ROC","https://www.tradingview.com/symbols/QQQ/")}
          ${this.renderSignalCard(d("components.macroSignals.signals.btcTrend"),t.technicalTrend.status,`$${((r=t.technicalTrend.btcPrice)==null?void 0:r.toLocaleString())??"N/A"}`,Q(t.technicalTrend.sparkline,60,20,"#ff9800"),`SMA50: $${((o=t.technicalTrend.sma50)==null?void 0:o.toLocaleString())??"-"} | VWAP: $${((c=t.technicalTrend.vwap30d)==null?void 0:c.toLocaleString())??"-"} | Mayer: ${t.technicalTrend.mayerMultiple??"-"}`,"https://www.tradingview.com/symbols/BTCUSD/")}
          ${this.renderSignalCard(d("components.macroSignals.signals.hashRate"),t.hashRate.status,U(t.hashRate.change30d),"","30d change","https://mempool.space/mining")}
          ${this.renderSignalCard(d("components.macroSignals.signals.momentum"),t.priceMomentum.status,"","","Mayer Multiple",null)}
          ${this.renderFearGreedCard(t.fearGreed)}
        </div>
      </div>
    `;this.setSafeContent(S(i,"legacy Panel.setContent() migration"))}renderSignalCard(e,t,n,i,r,o){const c=Xe(t);return`
      <div class="signal-card${o?" signal-card-linked":""}">
        <div class="signal-header">
          ${o?`<a href="${l(o)}" target="_blank" rel="noopener" class="signal-name signal-card-link">${l(e)}</a>`:`<span class="signal-name">${l(e)}</span>`}
          <span class="signal-badge ${c}">${l(t)}</span>
        </div>
        <div class="signal-body">
          ${i?`<div class="signal-sparkline-wrap">${i}</div>`:""}
          ${n?`<span class="signal-value">${n}</span>`:""}
        </div>
        ${r?`<div class="signal-detail">${l(r)}</div>`:""}
      </div>
    `}renderFearGreedCard(e){const t=Xe(e.status);return`
      <div class="signal-card signal-card-fg">
        <div class="signal-header">
          <span class="signal-name">${d("components.macroSignals.signals.fearGreed")}</span>
          <span class="signal-badge ${t}">${l(e.status)}</span>
        </div>
        <div class="signal-body signal-body-fg">
          <div style="display:flex;align-items:center;gap:8px">
            ${Ha(e.value)}
            ${Q(e.history.map(n=>n.value),80,28,qa(e.status))}
          </div>
        </div>
        <div class="signal-detail">
          <a href="https://alternative.me/crypto/fear-and-greed-index/" target="_blank" rel="noopener">alternative.me</a>
        </div>
      </div>
    `}}const js=Object.freeze(Object.defineProperty({__proto__:null,MacroSignalsPanel:Ya},Symbol.toStringTag,{value:"Module"}));function Ke(a){return a<=20?"#e74c3c":a<=40?"#e67e22":a<=60?"#f1c40f":a<=80?"#2ecc71":"#27ae60"}function I(a,s=2){return a==null?"N/A":a.toFixed(s)}function Wa(a){return a<=20?{state:"Crisis / Risk-Off",stance:"CASH",color:"#c0392b"}:a<=35?{state:"Stressed / Defensive",stance:"DEFENSIVE",color:"#e67e22"}:a<=50?{state:"Fragile / Hedged",stance:"HEDGED",color:"#f1c40f"}:a<=65?{state:"Stable / Normal",stance:"NORMAL",color:"#2ecc71"}:{state:"Strong / Risk-On",stance:"AGGRESSIVE",color:"#27ae60"}}function Xa(a){var o,c,p;const s=[],e=((o=a.momentum)==null?void 0:o.score)??50,t=((c=a.sentiment)==null?void 0:c.score)??50,n=a.cnnFearGreed,i=a.compositeScore,r=((p=a.trend)==null?void 0:p.score)??50;return e<10&&s.push("Momentum at extreme low — broad equity selling pressure"),t<15&&s.push("Sentiment in extreme fear zone"),n>0&&Math.abs(i-n)>20&&s.push(`CNN F&G ${Math.round(n)} diverges ${Math.abs(Math.round(i-n))}pts from composite — sentiment/structural disconnect`),r<20&&s.push("Trend in breakdown — price structure deteriorating"),s}function Ka(a,s,e,t){function c($,w){const b=$*Math.PI/180;return`${(100+w*Math.cos(b)).toFixed(2)},${(100-w*Math.sin(b)).toFixed(2)}`}const m=[{a1:180,a2:144,fill:"#c0392b"},{a1:144,a2:108,fill:"#e67e22"},{a1:108,a2:72,fill:"#f1c40f"},{a1:72,a2:36,fill:"#2ecc71"},{a1:36,a2:0,fill:"#27ae60"}].map($=>`<path d="M${c($.a1,88)} A88,88 0 0,0 ${c($.a2,88)} L${c($.a2,60)} A60,60 0 0,1 ${c($.a1,60)} Z" fill="${$.fill}" opacity="0.88"/>`).join(""),f=(180-a*1.8)*Math.PI/180,h=(100+75*Math.cos(f)).toFixed(1),y=(100-75*Math.sin(f)).toFixed(1),v=e!=null?`${e>=0?"+":""}${e.toFixed(1)} vs prev`:"",u=e!=null?e>=0?"#2ecc71":"#e74c3c":"",g=v?`<div data-gauge-role="delta" style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));line-height:1.25;color:${u}">${v}</div>`:"";return`<div data-gauge-role="root" style="display:flex;flex-direction:column;align-items:center;text-align:center;font-family:system-ui,-apple-system,sans-serif">
    <svg viewBox="0 0 200 115" width="200" height="115" style="display:block;max-width:100%" aria-hidden="true">
      ${m}
      <line x1="100" y1="100" x2="${h}" y2="${y}" stroke="${t}" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="100" cy="100" r="6" fill="${t}"/>
      <circle cx="100" cy="100" r="3" fill="rgba(8,8,8,0.9)"/>
    </svg>
    <div data-gauge-role="score" style="font-size:calc(26px * var(--wm-panel-effective-scale, 1));font-weight:700;line-height:1;color:${t}">${Math.round(a)}</div>
    <div data-gauge-role="label" style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));font-weight:600;line-height:1.25;color:${t};letter-spacing:0.07em">${s}</div>
    ${g}
  </div>`}function Qa(a){var i,r,o,c,p,m,f,h,y,v;const s=a.composite;if(!(s!=null&&s.score))return null;const e=a.categories??{},t=a.headerMetrics??{},n=u=>u?{score:Number(u.score??50),weight:Number(u.weight??0),contribution:Number(u.contribution??0),degraded:!!u.degraded,inputsJson:JSON.stringify(u.inputs??{})}:void 0;return{compositeScore:Number(s.score),compositeLabel:String(s.label??""),previousScore:Number(s.previous??0),seededAt:String(a.timestamp??""),sentiment:n(e.sentiment),volatility:n(e.volatility),positioning:n(e.positioning),trend:n(e.trend),breadth:n(e.breadth),momentum:n(e.momentum),liquidity:n(e.liquidity),credit:n(e.credit),macro:n(e.macro),crossAsset:n(e.crossAsset),vix:Number(((i=t==null?void 0:t.vix)==null?void 0:i.value)??0),hySpread:Number(((r=t==null?void 0:t.hySpread)==null?void 0:r.value)??0),yield10y:Number(((o=t==null?void 0:t.yield10y)==null?void 0:o.value)??0),putCallRatio:Number(((c=t==null?void 0:t.putCall)==null?void 0:c.value)??0),pctAbove200d:Number(((p=t==null?void 0:t.pctAbove200d)==null?void 0:p.value)??0),cnnFearGreed:Number(((m=t==null?void 0:t.cnnFearGreed)==null?void 0:m.value)??0),cnnLabel:String(((f=t==null?void 0:t.cnnFearGreed)==null?void 0:f.label)??""),aaiiBull:Number(((h=t==null?void 0:t.aaiBull)==null?void 0:h.value)??0),aaiiBear:Number(((y=t==null?void 0:t.aaiBear)==null?void 0:y.value)??0),fedRate:String(((v=t==null?void 0:t.fedRate)==null?void 0:v.value)??""),unavailable:!1}}const Ja=["sentiment","volatility","positioning","trend","breadth","momentum","liquidity","credit","macro","crossAsset"],Za={sentiment:"Sentiment",volatility:"Volatility",positioning:"Positioning",trend:"Trend",breadth:"Breadth",momentum:"Momentum",liquidity:"Liquidity",credit:"Credit",macro:"Macro",crossAsset:"Cross-Asset"};class en extends k{constructor(){super({id:"fear-greed",title:d("panels.fearGreed"),showCount:!1,infoTooltip:"Composite sentiment index: 10 weighted categories (volatility, positioning, breadth, momentum, liquidity, credit, macro, cross-asset, sentiment, trend)."});x(this,"data",null)}async fetchData(){const e=z("fearGreedIndex");if(e&&!e.unavailable){const n=Qa(e);if(n&&n.compositeScore>0)return this.data=n,this.renderPanel(),this.refreshFromRpc(),!0}return this.showLoading(),this.refreshFromRpc()}async refreshFromRpc(){try{const{MarketServiceClient:e}=await A(async()=>{const{MarketServiceClient:r}=await import("./rpc-client-market-v1-Bo995CQG.js");return{MarketServiceClient:r}},[]),{getRpcBaseUrl:t}=await A(async()=>{const{getRpcBaseUrl:r}=await import("./embed-url-BEcsdCFo.js").then(o=>o.al);return{getRpcBaseUrl:r}},__vite__mapDeps([1,2,3,4,5,6,7,12])),i=await new e(t(),{fetch:(...r)=>globalThis.fetch(...r)}).getFearGreedIndex({});return i.unavailable?(this.data||this.showError(d("common.noDataShort"),()=>void this.fetchData()),!1):(this.data=i,this.renderPanel(),!0)}catch(e){return this.data||this.showError(e instanceof Error?e.message:d("common.failedToLoad"),()=>void this.fetchData()),!1}}renderPanel(){if(!this.data){this.showError(d("common.noDataShort"),()=>void this.fetchData());return}const e=this.data,t=e.compositeScore,n=l(e.compositeLabel),i=e.previousScore,r=i>0?t-i:null,o=Ke(t),c=Wa(t),p=Xa(e),m=Ja.map(u=>{const g=e[u];if(!g)return"";const $=Math.round(g.score??50),w=Math.round((g.weight??0)*100),b=(g.contribution??0).toFixed(1),C=g.degraded?' <span style="color:#e67e22;font-size:calc(10px * var(--wm-panel-effective-scale, 1))">degraded</span>':"",F=Ke($),R=Za[u]??u;return`
        <div style="margin:4px 0">
          <div style="display:flex;justify-content:space-between;font-size:calc(11px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">
            <span>${l(R)}${C}</span>
            <span style="color:${F};font-weight:600">${$}</span>
          </div>
          <div style="height:4px;background:rgba(255,255,255,0.1);border-radius:2px;margin:2px 0">
            <div style="width:${$}%;height:100%;background:${F};border-radius:2px;transition:width 0.3s"></div>
          </div>
          <div style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">${w}% weight &middot; +${b} pts</div>
        </div>`}).join(""),f=(u,g)=>`<div style="text-align:center;padding:6px 4px">
        <div style="font-size:calc(18px * var(--wm-panel-effective-scale, 1));font-weight:600;color:var(--text)">${l(g)}</div>
        <div style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);margin-top:2px">${l(u)}</div>
      </div>`,h=[f("VIX",e.vix>0?I(e.vix,2):"N/A"),f("HY Spread",e.hySpread>0?`${I(e.hySpread,2)}%`:"N/A"),f("10Y Yield",e.yield10y>0?`${I(e.yield10y,2)}%`:"N/A"),f("P/C Ratio",e.putCallRatio>0?I(e.putCallRatio,2):"N/A"),f("% > 200d",e.pctAbove200d?`${I(e.pctAbove200d,1)}%`:"N/A"),f("CNN F&G",e.cnnFearGreed?`${Math.round(e.cnnFearGreed)}`:"N/A"),f("AAII Bull",e.aaiiBull?`${I(e.aaiiBull,1)}%`:"N/A"),f("AAII Bear",e.aaiiBear?`${I(e.aaiiBear,1)}%`:"N/A"),f("Fed Rate",e.fedRate||"N/A")].join(""),y=p.length>0?`<div style="margin-bottom:10px">
          ${p.map(u=>`<div style="display:flex;align-items:center;gap:6px;padding:5px 8px;margin-bottom:4px;border-radius:4px;border:1px solid #e67e22;background:rgba(230,126,34,0.08);font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:#e67e22">&#9888; ${l(u)}</div>`).join("")}
        </div>`:"",v=`
      <div style="padding:12px 14px">
        <div style="text-align:center;margin-bottom:12px">
          <div style="text-align:center;font-size:calc(11px * var(--wm-panel-effective-scale, 1));font-weight:600;color:${c.color};letter-spacing:0.06em;text-transform:uppercase;margin-bottom:4px">${l(c.state)}</div>
          ${Ka(t,n,r,o)}
          <div style="text-align:center;margin-top:6px;margin-bottom:8px">
            <span style="display:inline-block;padding:3px 12px;border-radius:999px;font-size:calc(10px * var(--wm-panel-effective-scale, 1));font-weight:700;color:#fff;background:${c.color};letter-spacing:0.08em">${l(c.stance)}</span>
          </div>
        </div>
        ${y}
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2px;background:rgba(255,255,255,0.04);border-radius:8px;padding:4px;margin-bottom:12px">
          ${h}
        </div>
        <div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">Category Breakdown</div>
        ${m}
      </div>`;this.setSafeContent(S(v,"legacy Panel.setContent() migration"))}}const Gs=Object.freeze(Object.defineProperty({__proto__:null,FearGreedPanel:en},Symbol.toStringTag,{value:"Module"}));function wt(a){return a<=-20?"#e74c3c":a<=-10?"#e67e22":a<0?"#f39c12":a<10?"#95a5a6":a<20?"#27ae60":"#2ecc71"}function tn(a){return a<=-20?"Extreme Bearish":a<=-10?"Bearish":a<0?"Mildly Bearish":a<10?"Neutral":a<20?"Bullish":"Extreme Bullish"}function me(a,s,e,t){return`<div style="margin:4px 0">
    <div style="display:flex;justify-content:space-between;font-size:calc(11px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);margin-bottom:2px">
      <span>${l(e)}</span>
      <span style="color:${s};font-weight:600">${l(t)}</span>
    </div>
    <div style="height:6px;background:rgba(255,255,255,0.08);border-radius:3px">
      <div style="width:${Math.min(a,100)}%;height:100%;background:${s};border-radius:3px;transition:width 0.3s"></div>
    </div>
  </div>`}function an(a){const s=wt(a),e=Math.max(-60,Math.min(60,a)),t=50,n=Math.abs(e)/60*50,i=e>=0?t:t-n;return`<div style="margin:8px 0">
    <div style="display:flex;justify-content:space-between;font-size:calc(11px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);margin-bottom:3px">
      <span>Bull-Bear Spread</span>
      <span style="color:${s};font-weight:700">${e>=0?"+":""}${a.toFixed(1)}%</span>
    </div>
    <div style="position:relative;height:10px;background:rgba(255,255,255,0.06);border-radius:4px">
      <div style="position:absolute;top:0;bottom:0;left:50%;width:1px;background:rgba(255,255,255,0.2)"></div>
      <div style="position:absolute;top:0;bottom:0;left:${i.toFixed(1)}%;width:${n.toFixed(1)}%;background:${s};border-radius:3px;transition:all 0.3s"></div>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);margin-top:2px">
      <span>Bearish</span>
      <span>Bullish</span>
    </div>
  </div>`}function nn(a){if(a.length<2)return"";const s=[...a].reverse(),e=280,t=60,n=4,i=s.map($=>$.spread),r=Math.max(Math.abs(Math.min(...i)),Math.abs(Math.max(...i)),20),o=(e-n*2)/(s.length-1),c=t/2,p=(c-n)/r,f=s.map(($,w)=>{const b=(n+w*o).toFixed(1),C=(c-$.spread*p).toFixed(1);return`${b},${C}`}).join(" "),h=s.map(($,w)=>{const b=n+w*o-1,C=Math.abs($.spread)*p,F=$.spread>=0?c-C:c,R=$.spread>=0?"rgba(39,174,96,0.25)":"rgba(231,76,60,0.25)";return`<rect x="${b.toFixed(1)}" y="${F.toFixed(1)}" width="2" height="${C.toFixed(1)}" fill="${R}" rx="0.5"/>`}).join(""),y=`<line x1="${n}" y1="${c}" x2="${e-n}" y2="${c}" stroke="rgba(255,255,255,0.15)" stroke-width="0.5" stroke-dasharray="3,3"/>`,v=c+20*p,u=`<line x1="${n}" y1="${v.toFixed(1)}" x2="${e-n}" y2="${v.toFixed(1)}" stroke="rgba(231,76,60,0.3)" stroke-width="0.5" stroke-dasharray="2,4"/>`,g=`<text x="${e-n}" y="${(v-2).toFixed(1)}" text-anchor="end" style="font-size:calc(7px * var(--wm-panel-effective-scale, 1))" fill="rgba(231,76,60,0.5)" font-family="system-ui,sans-serif">-20 buy signal</text>`;return`<div style="margin:8px 0">
    <div style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">52-Week Spread History</div>
    <svg viewBox="0 0 ${e} ${t}" width="100%" height="${t}" style="display:block">
      ${h}
      ${y}
      ${u}
      ${g}
      <polyline points="${f}" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1.2" stroke-linejoin="round"/>
    </svg>
  </div>`}class sn extends k{constructor(){super({id:"aaii-sentiment",title:"AAII Investor Sentiment",showCount:!1,infoTooltip:"Weekly AAII survey: individual investors report 6-month market outlook as bullish, neutral, or bearish. Spread below -20 is a historical contrarian buy signal."});x(this,"data",null)}async fetchData(){var t;const e=z("aaiiSentiment");if(e!=null&&e.latest)return this.data=e,this.renderPanel(),!0;try{const n=await fetch(Me("/api/bootstrap?keys=aaiiSentiment"),{signal:AbortSignal.timeout(5e3)});if(n.ok){const{data:i}=await n.json();if((t=i.aaiiSentiment)!=null&&t.latest)return this.data=i.aaiiSentiment,this.renderPanel(),!0}}catch{}return this.showError("AAII sentiment data unavailable",()=>{this.fetchData()},300),!1}renderPanel(){var C;if(!((C=this.data)!=null&&C.latest)){this.showError(d("common.noDataShort"),()=>void this.fetchData());return}const e=this.data,{latest:t,previous:n,avg8w:i,historicalAvg:r,extremes:o,weeks:c}=e,p=wt(t.spread),m=tn(t.spread),f=n==null?void 0:n.spread,h=f!=null?t.spread-f:null,y=h!=null?`<span style="color:${h>=0?"#2ecc71":"#e74c3c"};font-size:calc(10px * var(--wm-panel-effective-scale, 1));margin-left:4px">${h>=0?"+":""}${h.toFixed(1)} vs prev</span>`:"",v=t.spread<=-20?`<div style="display:flex;align-items:center;gap:6px;padding:6px 8px;margin:8px 0;border-radius:4px;border:1px solid #2ecc71;background:rgba(46,204,113,0.08);font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:#2ecc71">
          &#9432; Contrarian buy signal active: spread at ${t.spread.toFixed(1)}% (threshold: -20%)
        </div>`:t.bearish>=50?`<div style="display:flex;align-items:center;gap:6px;padding:6px 8px;margin:8px 0;border-radius:4px;border:1px solid #e67e22;background:rgba(230,126,34,0.08);font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:#e67e22">
            &#9888; Extreme bearish reading: ${t.bearish.toFixed(1)}% bearish (avg: ${r.bearish}%)
          </div>`:"",u=i?`
      <div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.06)">
        <div style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">8-Week Moving Average</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;text-align:center">
          <div><div style="font-size:calc(14px * var(--wm-panel-effective-scale, 1));font-weight:600;color:#2ecc71">${i.bullish}%</div><div style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">Bull</div></div>
          <div><div style="font-size:calc(14px * var(--wm-panel-effective-scale, 1));font-weight:600;color:#95a5a6">${i.neutral}%</div><div style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">Neutral</div></div>
          <div><div style="font-size:calc(14px * var(--wm-panel-effective-scale, 1));font-weight:600;color:#e74c3c">${i.bearish}%</div><div style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">Bear</div></div>
        </div>
      </div>`:"",g=o.spreadBelow20>0||o.bearishAbove50>0?`<div style="margin-top:6px;font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">
          52w extremes: ${o.spreadBelow20} contrarian signals, ${o.bearishAbove50} extreme bear, ${o.bullishAbove50} extreme bull
        </div>`:"",$=e.fallback?'<span style="display:inline-block;padding:1px 5px;border-radius:3px;background:rgba(230,126,34,0.15);color:#e67e22;font-size:calc(9px * var(--wm-panel-effective-scale, 1));margin-left:4px">(fallback data)</span>':"",w=t.date?`<div style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);text-align:right;margin-top:4px">Survey: ${l(t.date)}${e.source!=="xls"?` (${l(e.source)})`:""}${$}</div>`:"",b=`
      <div style="padding:12px 14px">
        <div style="text-align:center;margin-bottom:8px">
          <div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));font-weight:600;color:${p};letter-spacing:0.06em;text-transform:uppercase">${l(m)}</div>
          ${y?`<div style="margin-top:2px">${y}</div>`:""}
        </div>

        ${v}

        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;text-align:center;padding:8px;background:rgba(255,255,255,0.03);border-radius:6px;margin-bottom:8px">
          <div>
            <div style="font-size:calc(22px * var(--wm-panel-effective-scale, 1));font-weight:700;color:#2ecc71">${t.bullish.toFixed(1)}%</div>
            <div style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">Bullish</div>
            <div style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">avg ${r.bullish}%</div>
          </div>
          <div>
            <div style="font-size:calc(22px * var(--wm-panel-effective-scale, 1));font-weight:700;color:#95a5a6">${t.neutral.toFixed(1)}%</div>
            <div style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">Neutral</div>
            <div style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">avg ${r.neutral}%</div>
          </div>
          <div>
            <div style="font-size:calc(22px * var(--wm-panel-effective-scale, 1));font-weight:700;color:#e74c3c">${t.bearish.toFixed(1)}%</div>
            <div style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">Bearish</div>
            <div style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">avg ${r.bearish}%</div>
          </div>
        </div>

        ${me(t.bullish,"#2ecc71","Bullish",`${t.bullish.toFixed(1)}%`)}
        ${me(t.neutral,"#95a5a6","Neutral",`${t.neutral.toFixed(1)}%`)}
        ${me(t.bearish,"#e74c3c","Bearish",`${t.bearish.toFixed(1)}%`)}

        ${an(t.spread)}

        ${nn(c)}

        ${u}
        ${g}
        ${w}
      </div>`;this.setSafeContent(S(b,"legacy Panel.setContent() migration"))}}const Vs=Object.freeze(Object.defineProperty({__proto__:null,AAIISentimentPanel:sn},Symbol.toStringTag,{value:"Module"}));function j(a){return a==null?null:Number.isFinite(a)?a:null}function Qe(a){const s=a.current,e=(a.history??[]).map(t=>({date:t.date,pctAbove20d:j(t.pctAbove20d),pctAbove50d:j(t.pctAbove50d),pctAbove200d:j(t.pctAbove200d)}));return{currentPctAbove20d:j(a.currentPctAbove20d??(s==null?void 0:s.pctAbove20d)),currentPctAbove50d:j(a.currentPctAbove50d??(s==null?void 0:s.pctAbove50d)),currentPctAbove200d:j(a.currentPctAbove200d??(s==null?void 0:s.pctAbove200d)),updatedAt:a.updatedAt??"",history:e,unavailable:a.unavailable}}const ae=480,Ae=160,V=32,Fe=12,St=10,_t=22,Je=ae-V-Fe,Ze=Ae-St-_t,Re=[{key:"pctAbove20d",color:"#3b82f6",label:"20-day SMA",fillOpacity:.08},{key:"pctAbove50d",color:"#f59e0b",label:"50-day SMA",fillOpacity:.06},{key:"pctAbove200d",color:"#22c55e",label:"200-day SMA",fillOpacity:.04}];function kt(a,s){return s<=1?V+Je/2:V+a/(s-1)*Je}function oe(a){return St+Ze-a/100*Ze}function et(a,s){const e=[];let t=[];for(let n=0;n<a.length;n++){const i=a[n][s];if(i==null||!Number.isFinite(i)){t.length>0&&(e.push(t),t=[]);continue}t.push({x:kt(n,a.length),y:oe(i)})}return t.length>0&&e.push(t),e}function rn(a){if(a.length<2)return"";const s=oe(0).toFixed(1),e=a[0].x.toFixed(1),t=a[a.length-1].x.toFixed(1),n=a.map(i=>`${i.x.toFixed(1)},${i.y.toFixed(1)}`);return`M${e},${s} L${n.join(" L")} L${t},${s} Z`}function on(a){return a.length===0?"":a.map(s=>`${s.x.toFixed(1)},${s.y.toFixed(1)}`).join(" ")}function ln(a){if(a.length<2)return'<div style="text-align:center;color:var(--text-dim);padding:20px;font-size:calc(11px * var(--wm-panel-effective-scale, 1))">Collecting data. Chart appears after 2+ days.</div>';const s=[0,25,50,75,100].map(c=>{const p=oe(c);return`
      <line x1="${V}" y1="${p.toFixed(1)}" x2="${ae-Fe}" y2="${p.toFixed(1)}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
      <text x="${(V-3).toFixed(0)}" y="${p.toFixed(1)}" text-anchor="end" fill="rgba(255,255,255,0.35)" style="font-size:calc(8px * var(--wm-panel-effective-scale, 1))" dominant-baseline="middle">${c}%</text>`}).join(""),e=Math.max(1,Math.floor(a.length/6)),t=a.map((c,p)=>{if(p%e!==0&&p!==a.length-1)return"";const m=kt(p,a.length),f=c.date.slice(5);return`<text x="${m.toFixed(1)}" y="${Ae-_t+13}" text-anchor="middle" fill="rgba(255,255,255,0.4)" style="font-size:calc(7px * var(--wm-panel-effective-scale, 1))">${l(f)}</text>`}).join(""),n=Re.map(c=>et(a,c.key).map(m=>{const f=rn(m);return f?`<path d="${f}" fill="${c.color}" opacity="${c.fillOpacity}"/>`:""}).join("")).join(""),i=Re.map(c=>et(a,c.key).map(m=>m.length<2?"":`<polyline points="${on(m)}" fill="none" stroke="${c.color}" stroke-width="1.5" opacity="0.9"/>`).join("")).join(""),r=oe(50),o=`<line x1="${V}" y1="${r.toFixed(1)}" x2="${ae-Fe}" y2="${r.toFixed(1)}" stroke="rgba(255,255,255,0.12)" stroke-width="1" stroke-dasharray="4 3"/>`;return`<svg viewBox="0 0 ${ae} ${Ae}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block">${s}${o}${t}${n}${i}</svg>`}function cn(a,s){const e=a>=60?"rgba(34,197,94,0.12)":a>=40?"rgba(245,158,11,0.12)":"rgba(239,68,68,0.12)",t=a>=60?"#22c55e":a>=40?"#f59e0b":"#ef4444";return`<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:4px;background:${e}">
    <span style="width:6px;height:6px;border-radius:50%;background:${s}"></span>
    <span style="font-size:calc(14px * var(--wm-panel-effective-scale, 1));font-weight:600;color:${t}">${a.toFixed(1)}%</span>
  </span>`}class dn extends k{constructor(){super({id:"market-breadth",title:d("panels.marketBreadth"),showCount:!1,infoTooltip:"Percentage of S&P 500 stocks trading above their 20, 50, and 200-day simple moving averages. A measure of market participation and internal strength."});x(this,"data",null)}async fetchData(){var t;const e=z("breadthHistory");return e&&!e.unavailable&&((t=e.history)!=null&&t.length)?(this.data=Qe(e),this.renderPanel(),this.refreshFromRpc(),!0):(this.showLoading(),this.refreshFromRpc())}async refreshFromRpc(){try{const{MarketServiceClient:e}=await A(async()=>{const{MarketServiceClient:r}=await import("./rpc-client-market-v1-Bo995CQG.js");return{MarketServiceClient:r}},[]),{getRpcBaseUrl:t}=await A(async()=>{const{getRpcBaseUrl:r}=await import("./embed-url-BEcsdCFo.js").then(o=>o.al);return{getRpcBaseUrl:r}},__vite__mapDeps([1,2,3,4,5,6,7,12])),i=await new e(t(),{fetch:(...r)=>globalThis.fetch(...r)}).getMarketBreadthHistory({});return i.unavailable?(this.data||this.showError(d("common.noDataShort"),()=>void this.fetchData()),!1):(this.data=Qe(i),this.renderPanel(),!0)}catch(e){return this.data||this.showError(e instanceof Error?e.message:d("common.failedToLoad"),()=>void this.fetchData()),!1}}renderPanel(){var o,c;if(!((c=(o=this.data)==null?void 0:o.history)!=null&&c.length)){this.showError(d("common.noDataShort"),()=>void this.fetchData());return}const e=this.data,t=ln(e.history),n={pctAbove20d:e.currentPctAbove20d,pctAbove50d:e.currentPctAbove50d,pctAbove200d:e.currentPctAbove200d},r=`
      <div style="padding:12px 14px">
        <div style="margin-bottom:8px">${Re.map(p=>{const m=n[p.key],f=typeof m=="number"&&Number.isFinite(m)&&m>=0;return`<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0">
        <span style="display:flex;align-items:center;gap:6px;font-size:calc(11px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">
          <span style="width:8px;height:3px;border-radius:1px;background:${p.color}"></span>
          % Above ${l(p.label)}
        </span>
        ${f?cn(m,p.color):'<span style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">—</span>'}
      </div>`}).join("")}</div>
        <div style="border-radius:6px;background:rgba(255,255,255,0.02);padding:4px 0">${t}</div>
        ${e.updatedAt?`<div style="text-align:right;font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);margin-top:4px">${l(new Date(e.updatedAt).toLocaleString())}</div>`:""}
      </div>`;this.setSafeContent(S(r,"legacy Panel.setContent() migration"))}}const Hs=Object.freeze(Object.defineProperty({__proto__:null,MarketBreadthPanel:dn},Symbol.toStringTag,{value:"Module"})),pn=[{symbol:"^GSPC",label:"S&P 500"},{symbol:"^IXIC",label:"Nasdaq Composite"},{symbol:"BTC-USD",label:"Bitcoin"},{symbol:"ETH-USD",label:"Ethereum"},{symbol:"GC=F",label:"Gold"},{symbol:"CL=F",label:"WTI Crude"}],mn=[{hours:24,label:"24 hours"},{hours:72,label:"3 days"},{hours:168,label:"7 days"},{hours:336,label:"14 days"}],ne=560,Ee=210,se=42,Pe=54,ie=12,un=28,fn=ne-se-Pe,ue=Ee-ie-un;function tt(a,s){return a.map(e=>({timestampMs:Ce(e.timestamp),value:e.value})).filter(e=>Number.isFinite(e.timestampMs)&&e.timestampMs>=s&&Number.isFinite(e.value)).sort((e,t)=>e.timestampMs-t.timestampMs)}function at(a){const s=Math.min(...a),e=Math.max(...a);if(s===e){const n=Math.abs(s)*.05||1;return{min:s-n,max:e+n}}const t=(e-s)*.06;return{min:s-t,max:e+t}}function nt(a){return Math.abs(a)>=1e3?a.toLocaleString(void 0,{maximumFractionDigits:0}):Math.abs(a)>=100?a.toFixed(0):Math.abs(a)>=10?a.toFixed(1):a.toFixed(2)}function st(a,s,e,t){const n=[];let i=[],r=Number.NEGATIVE_INFINITY;for(const o of a)o.timestampMs-r>t&&i.length>0&&(n.push(i.join(" ")),i=[]),i.push(`${s(o.timestampMs).toFixed(1)},${e(o.value).toFixed(1)}`),r=o.timestampMs;return i.length>0&&n.push(i.join(" ")),n}function Ct(a,s,e){const t=Math.max(...a.map(b=>Ce(b.timestamp)).filter(Number.isFinite),...s.map(b=>Ce(b.timestamp)).filter(Number.isFinite));if(!Number.isFinite(t))return'<div class="news-market-correlation__empty">No timestamped series available.</div>';const n=t-e*60*60*1e3,i=tt(a,n),r=tt(s,n);if(i.length<2||r.length<2)return'<div class="news-market-correlation__empty">Not enough overlapping history for this window.</div>';const o=Math.max(n,Math.min(i[0].timestampMs,r[0].timestampMs)),c=Math.max(i[i.length-1].timestampMs,r[r.length-1].timestampMs),p=Math.max(1,c-o),m=at(i.map(b=>b.value)),f=at(r.map(b=>b.value)),h=b=>se+(b-o)/p*fn,y=b=>ie+(1-(b-m.min)/(m.max-m.min))*ue,v=b=>ie+(1-(b-f.min)/(f.max-f.min))*ue,u=[0,.25,.5,.75,1].map(b=>{const C=ie+b*ue,F=m.max-b*(m.max-m.min),R=f.max-b*(f.max-f.min);return`<line x1="${se}" y1="${C.toFixed(1)}" x2="${ne-Pe}" y2="${C.toFixed(1)}" stroke="rgba(255,255,255,0.07)"/><text x="${se-5}" y="${C.toFixed(1)}" text-anchor="end" dominant-baseline="middle" fill="#f59e0b" font-size="8">${l(nt(F))}</text><text x="${ne-Pe+5}" y="${C.toFixed(1)}" text-anchor="start" dominant-baseline="middle" fill="#60a5fa" font-size="8">${l(nt(R))}</text>`}).join(""),g=[0,.5,1].map(b=>{const C=o+b*p,F=new Date(C).toLocaleString(void 0,{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",hour12:!1});return`<text x="${h(C).toFixed(1)}" y="${Ee-7}" text-anchor="${b===0?"start":b===1?"end":"middle"}" fill="rgba(255,255,255,0.45)" font-size="8">${l(F)}</text>`}).join(""),$=st(i,h,y,10800*1e3).filter(b=>b.includes(" ")).map(b=>`<polyline points="${b}" fill="none" stroke="#f59e0b" stroke-width="1.6" stroke-linejoin="round"/>`).join(""),w=st(r,h,v,7200*1e3).filter(b=>b.includes(" ")).map(b=>`<polyline points="${b}" fill="none" stroke="#60a5fa" stroke-width="1.6" stroke-linejoin="round"/>`).join("");return`<svg class="news-market-correlation__chart" viewBox="0 0 ${ne} ${Ee}" role="img" aria-label="News volume and market price over a shared time axis">${u}${g}${$}${w}</svg>`}function vn(a){return{"insufficient-data":"Insufficient aligned observations",none:"No clear relationship","weak-positive":"Weak positive relationship","weak-negative":"Weak negative relationship","moderate-positive":"Moderate positive relationship","moderate-negative":"Moderate negative relationship","strong-positive":"Strong positive relationship","strong-negative":"Strong negative relationship"}[a.relationship]}function hn(a){var e;return a.leadLag.relationship==="neither"?"Neither series clearly leads":`${a.leadLag.relationship==="news-leads"?"News leads":"Market leads"} by ${a.leadLag.hours}h (r=${((e=a.leadLag.coefficient)==null?void 0:e.toFixed(2))??"—"}, n=${a.leadLag.sampleSize})`}class gn extends k{constructor(){super({id:"news-market-correlation",title:"News ↔ Markets",showCount:!1,className:"panel-wide",defaultRowSpan:2,infoTooltip:"Exploratory Pearson correlation between persisted GDELT topic volume and hourly market returns. The chart shows news volume and price on separate axes. Correlation and lead/lag do not establish causation."});x(this,"selectedTopic","sanctions");x(this,"selectedSymbol","^GSPC");x(this,"windowHours",168);x(this,"hasData",!1);x(this,"requestGeneration",0);x(this,"renderedSelection",null)}async fetchData(){var r,o,c,p,m;const e=++this.requestGeneration,t=this.selectedTopic,n=this.selectedSymbol,i=this.windowHours;this.hasData||this.showLoading();try{const[f,h]=await Promise.all([ia("marketCorrelationSeries"),da(t)]);if(e!==this.requestGeneration)return!1;const y=ma(f)?f:void 0,v=(r=y==null?void 0:y.series)==null?void 0:r.find(w=>w.symbol===n),u=(o=v==null?void 0:v.points)!=null&&o.length?v:(c=y==null?void 0:y.series)==null?void 0:c.find(w=>{var b;return(b=w.points)==null?void 0:b.length});if(!((p=h==null?void 0:h.vol)!=null&&p.length)||!((m=u==null?void 0:u.points)!=null&&m.length)||!y)return this.hasData?this.restoreRenderedSelection():this.showError("Correlation series unavailable",()=>void this.fetchData(),300),!1;this.selectedSymbol=u.symbol;const g=h.vol.map(w=>({timestamp:w.date,value:w.value})),$=ua(g,u.points,{windowHours:i,maxLagHours:6});return this.hasData=!0,this.renderedSelection={topic:t,symbol:u.symbol,windowHours:i},this.renderPanel(g,y,u,$,i),!0}catch(f){return e!==this.requestGeneration||(this.hasData?this.restoreRenderedSelection():this.showError(f instanceof Error?f.message:"Failed to load correlation series",()=>void this.fetchData(),300)),!1}}restoreRenderedSelection(){if(!this.renderedSelection)return;this.selectedTopic=this.renderedSelection.topic,this.selectedSymbol=this.renderedSelection.symbol,this.windowHours=this.renderedSelection.windowHours;const e=this.content.querySelector('[data-role="news-topic"]'),t=this.content.querySelector('[data-role="market-symbol"]'),n=this.content.querySelector('[data-role="window-hours"]');e&&(e.value=this.selectedTopic),t&&(t.value=this.selectedSymbol),n&&(n.value=String(this.windowHours))}renderPanel(e,t,n,i,r){const o=pa.map(g=>`<option value="${l(g.id)}"${g.id===this.selectedTopic?" selected":""}>${l(g.name)}</option>`).join(""),c=new Set(t.series.filter(g=>{var $;return($=g.points)==null?void 0:$.length}).map(g=>g.symbol)),p=pn.map(g=>`<option value="${l(g.symbol)}"${g.symbol===this.selectedSymbol?" selected":""}${c.has(g.symbol)?"":" disabled"}>${l(g.label)}</option>`).join(""),m=mn.map(g=>`<option value="${g.hours}"${g.hours===this.windowHours?" selected":""}>${l(g.label)}</option>`).join(""),f=i.coefficient===null?"—":i.coefficient.toFixed(2),h=i.confidenceInterval?`[${i.confidenceInterval.low.toFixed(2)}, ${i.confidenceInterval.high.toFixed(2)}]`:"—",y=i.relationship==="none"||i.relationship==="insufficient-data"?"news-market-correlation__result--neutral":i.coefficient!==null&&i.coefficient<0?"news-market-correlation__result--negative":"news-market-correlation__result--positive",v=t.updatedAt?new Date(t.updatedAt).toLocaleString():"unknown",u=`<div class="news-market-correlation">
      <div class="news-market-correlation__controls">
        <label>News topic<select data-role="news-topic">${o}</select></label>
        <label>Market<select data-role="market-symbol">${p}</select></label>
        <label>Window<select data-role="window-hours">${m}</select></label>
      </div>
      <div class="news-market-correlation__legend"><span><i class="news-market-correlation__dot news-market-correlation__dot--news"></i>GDELT news volume</span><span><i class="news-market-correlation__dot news-market-correlation__dot--market"></i>${l(n.label)} price</span></div>
      ${Ct(e,n.points,r)}
      <div class="news-market-correlation__stats">
        <div><span>Pearson r</span><strong>${l(f)}</strong><small>n=${i.sampleSize} hourly returns</small></div>
        <div><span>95% interval</span><strong>${l(h)}</strong><small>displayed window</small></div>
        <div class="${y}"><span>Interpretation</span><strong>${l(vn(i))}</strong><small>${l(hn(i))}</small></div>
      </div>
      <div class="news-market-correlation__caveat">Pearson r compares topic volume with hourly market returns. The ±6h lead/lag scan is exploratory. Correlation is not causation; weak and null results are retained.</div>
      <div class="news-market-correlation__freshness">Market series updated ${l(v)}</div>
    </div>`;this.setSafeContent(S(u,"news-market-correlation controlled panel markup"),()=>this.bindControls())}bindControls(){var e,t,n;(e=this.content.querySelector('[data-role="news-topic"]'))==null||e.addEventListener("change",i=>{this.selectedTopic=i.currentTarget.value,this.fetchData()}),(t=this.content.querySelector('[data-role="market-symbol"]'))==null||t.addEventListener("change",i=>{this.selectedSymbol=i.currentTarget.value,this.fetchData()}),(n=this.content.querySelector('[data-role="window-hours"]'))==null||n.addEventListener("change",i=>{this.windowHours=Number(i.currentTarget.value)||168,this.fetchData()})}}const qs=Object.freeze(Object.defineProperty({__proto__:null,NewsMarketCorrelationPanel:gn,buildNewsMarketChart:Ct},Symbol.toStringTag,{value:"Module"}));let fe=null;async function xn(){if(!fe){const{EconomicServiceClient:a}=await A(async()=>{const{EconomicServiceClient:e}=await import("./rpc-client-economic-v1-ClSZlM4Y.js");return{EconomicServiceClient:e}},[]),{getRpcBaseUrl:s}=await A(async()=>{const{getRpcBaseUrl:e}=await import("./embed-url-BEcsdCFo.js").then(t=>t.al);return{getRpcBaseUrl:e}},__vite__mapDeps([1,2,3,4,5,6,7,12]));fe=new a(s(),{fetch:(...e)=>globalThis.fetch(...e)})}return fe}const ve=["DGS1MO","DGS3MO","DGS6MO","DGS1","DGS2","DGS5","DGS10","DGS30"],De=["1M","3M","6M","1Y","2Y","5Y","10Y","30Y"],At=["1Y","2Y","5Y","10Y","20Y","30Y"],ze=480,Ie=180,H=40,Ft=20,Rt=16,Et=24,Te=ze-H-Ft,it=Ie-Rt-Et;function Be(a,s){return s<=1?H+Te/2:H+a/(s-1)*Te}function Y(a,s,e){const t=e-s||1,n=(a-s)/t;return Rt+it-n*it}function rt(a,s,e){return a.map((t,n)=>{if(t.value===null)return null;const i=Be(n,a.length),r=Y(t.value,s,e);return`${i.toFixed(2)},${r.toFixed(2)}`}).filter(Boolean).join(" ")}function yn(a,s){const e=(s-a)/3,t=[];for(let n=0;n<=3;n++){const i=a+e*n,r=Y(i,a,s);t.push(`<text x="${(H-4).toFixed(0)}" y="${r.toFixed(2)}" text-anchor="end" fill="rgba(255,255,255,0.35)" style="font-size:calc(8px * var(--wm-panel-effective-scale, 1))" alignment-baseline="middle">${i.toFixed(1)}%</text>`),t.push(`<line x1="${H}" y1="${r.toFixed(2)}" x2="${ze-Ft}" y2="${r.toFixed(2)}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`)}return t.join("")}function bn(a){return De.slice(0,a).map((s,e)=>{const t=Be(e,a),n=Ie-Et+12;return`<text x="${t.toFixed(2)}" y="${n}" text-anchor="middle" fill="rgba(255,255,255,0.5)" style="font-size:calc(8px * var(--wm-panel-effective-scale, 1))">${l(s)}</text>`}).join("")}function $n(a,s,e,t){return a.map((n,i)=>{if(n.value===null)return"";const r=Be(i,a.length),o=Y(n.value,s,e);return`<circle cx="${r.toFixed(2)}" cy="${o.toFixed(2)}" r="3" fill="${t}" stroke="rgba(0,0,0,0.4)" stroke-width="1"/>`}).join("")}function Pt(a){const e={"1Y":3,"2Y":4,"5Y":5,"10Y":6,"20Y":6.5,"30Y":7}[a];return e==null?null:H+e/7*Te}function wn(a,s,e){const t=At.map(n=>{const i=a[n];if(i==null)return null;const r=Pt(n);if(r===null)return null;const o=Y(i,s,e);return`${r.toFixed(2)},${o.toFixed(2)}`}).filter(Boolean);return t.length<2?"":`<polyline points="${t.join(" ")}" fill="none" stroke="#2ecc71" stroke-width="1.5" stroke-dasharray="5,3" stroke-linecap="round" stroke-linejoin="round"/>`}function Sn(a,s,e){return At.map(t=>{const n=a[t];if(n==null)return"";const i=Pt(t);if(i===null)return"";const r=Y(n,s,e);return`<circle cx="${i.toFixed(2)}" cy="${r.toFixed(2)}" r="2.5" fill="#2ecc71" stroke="rgba(0,0,0,0.4)" stroke-width="1"/>`}).join("")}function _n(a,s,e){const t=a.map(v=>v.value).filter(v=>v!==null),n=s.map(v=>v.value).filter(v=>v!==null),i=e?Object.values(e):[],r=[...t,...n,...i];if(r.length===0)return'<div style="padding:16px;color:var(--text-dim);font-size:calc(12px * var(--wm-panel-effective-scale, 1))">No yield data available.</div>';const o=Math.max(0,Math.min(...r)-.25),c=Math.max(...r)+.5,p=rt(a,o,c),m=rt(s,o,c),f=m.length>0?`<polyline points="${m}" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" stroke-dasharray="4,3" stroke-linecap="round" stroke-linejoin="round"/>`:"",h=e?wn(e,o,c):"",y=e?Sn(e,o,c):"";return`
    <svg viewBox="0 0 ${ze} ${Ie}" width="100%" style="display:block;overflow:visible">
      ${yn(o,c)}
      ${bn(a.length)}
      ${f}
      ${h}
      <polyline points="${p}" fill="none" stroke="#3498db" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      ${$n(a,o,c,"#3498db")}
      ${y}
    </svg>`}function kn(a){const s=a.map(t=>`<th style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));font-weight:600;color:var(--text-dim);padding:4px 6px;text-align:center">${l(t.tenor)}</th>`).join(""),e=a.map(t=>{const n=t.value!==null?`${t.value.toFixed(2)}%`:"N/A";return`<td style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));color:var(--text);padding:4px 6px;text-align:center">${l(n)}</td>`}).join("");return`
    <div style="overflow-x:auto;margin-top:8px">
      <table style="width:100%;border-collapse:collapse">
        <thead><tr>${s}</tr></thead>
        <tbody><tr>${e}</tr></tbody>
      </table>
    </div>`}function Cn(a,s,e=80,t=22){const n=a.map(p=>p.value).filter(p=>Number.isFinite(p));if(n.length<2)return`<svg width="${e}" height="${t}"></svg>`;const i=Math.min(...n),o=Math.max(...n)-i||.01,c=n.map((p,m)=>{const f=m/(n.length-1)*e,h=t-(p-i)/o*(t-2)-1;return`${f.toFixed(1)},${h.toFixed(1)}`}).join(" ");return`<svg width="${e}" height="${t}" style="display:inline-block;vertical-align:middle"><polyline points="${c}" fill="none" stroke="${l(s)}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`}function An(a){return a.some(t=>t.obs.length>0)?`<div style="padding:4px 0">${a.map(t=>{const n=t.obs[t.obs.length-1];if(!n)return"";const i=t.obs[t.obs.length-2],r=i?n.value-i.value:null,o=r!==null?`${r>=0?"+":""}${r.toFixed(2)}%`:"",c=r===null?"":r>=0?"#e74c3c":"#27ae60";return`<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
      <div style="width:90px;font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">${l(t.label)}</div>
      ${Cn(t.obs.slice(-24),t.color)}
      <div style="min-width:44px;text-align:right;font-size:calc(13px * var(--wm-panel-effective-scale, 1));font-weight:600;color:var(--text);font-variant-numeric:tabular-nums">${l(n.value.toFixed(2))}%</div>
      ${o?`<div style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:${c}">${l(o)}</div>`:""}
      <div style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);margin-left:auto">${l(n.date)}</div>
    </div>`}).join("")}</div>
    <div style="margin-top:8px;font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">Source: ECB</div>`:'<div style="padding:16px;color:var(--text-dim);font-size:calc(12px * var(--wm-panel-effective-scale, 1))">ECB rate data unavailable</div>'}class Fn extends k{constructor(){super({id:"yield-curve",title:"Yield Curve & Rates",showCount:!1,infoTooltip:d("components.yieldCurve.infoTooltip")});x(this,"_hasData",!1);x(this,"_tab","curve");x(this,"_current",[]);x(this,"_prior",[]);x(this,"_ecbRates",null);x(this,"_rateRows",[]);this.content.addEventListener("click",e=>{const t=e.target.closest("[data-tab]");((t==null?void 0:t.dataset.tab)==="curve"||(t==null?void 0:t.dataset.tab)==="rates")&&(this._tab=t.dataset.tab,this._render())})}async fetchData(){var e,t,n,i,r;this.showLoading();try{const o=await xn(),[c,p]=await Promise.allSettled([o.getFredSeriesBatch({seriesIds:[...ve,"ESTR","EURIBOR3M","EURIBOR6M","EURIBOR1Y"],limit:36}),o.getEuYieldCurve({})]),m=c.status==="fulfilled"?c.value.results??{}:{};return this._current=ve.map((h,y)=>{var u,g;const v=((u=m[h])==null?void 0:u.observations)??[];return{tenor:De[y]??h,value:v.length>0?((g=v[v.length-1])==null?void 0:g.value)??null:null}}),this._prior=ve.map((h,y)=>{var u,g;const v=((u=m[h])==null?void 0:u.observations)??[];return{tenor:De[y]??h,value:v.length>1?((g=v[v.length-2])==null?void 0:g.value)??null:null}}),this._ecbRates=p.status==="fulfilled"&&!p.value.unavailable&&((e=p.value.data)!=null&&e.rates)?p.value.data.rates:null,this._rateRows=[{id:"ESTR",label:"€STR",obs:((t=m.ESTR)==null?void 0:t.observations)??[],color:"#2ecc71"},{id:"EURIBOR3M",label:"EURIBOR 3M",obs:((n=m.EURIBOR3M)==null?void 0:n.observations)??[],color:"#3498db"},{id:"EURIBOR6M",label:"EURIBOR 6M",obs:((i=m.EURIBOR6M)==null?void 0:i.observations)??[],color:"#9b59b6"},{id:"EURIBOR1Y",label:"EURIBOR 1Y",obs:((r=m.EURIBOR1Y)==null?void 0:r.observations)??[],color:"#e67e22"}],this._current.filter(h=>h.value!==null).length===0?(this._hasData||this.showError("No yield data available",()=>void this.fetchData()),!1):(this._hasData=!0,this._render(),!0)}catch(o){return this._hasData||this.showError(o instanceof Error?o.message:"Failed to load yield curve",()=>void this.fetchData()),!1}}_render(){var f,h;const e=`<div style="display:flex;gap:4px;margin-bottom:6px">
      <button class="panel-tab${this._tab==="curve"?" active":""}" data-tab="curve" style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));padding:3px 10px">US Curve</button>
      <button class="panel-tab${this._tab==="rates"?" active":""}" data-tab="rates" style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));padding:3px 10px">ECB Rates</button>
    </div>`;if(this._tab==="rates"){this.setSafeContent(S(`<div style="padding:10px 14px 6px">${e}${An(this._rateRows)}</div>`,"legacy Panel.setContent() migration"));return}const t=((f=this._current.find(y=>y.tenor==="2Y"))==null?void 0:f.value)??null,n=((h=this._current.find(y=>y.tenor==="10Y"))==null?void 0:h.value)??null,i=t!==null&&n!==null&&t>n,r=t!==null&&n!==null?((n-t)*100).toFixed(0):null,o=r!==null&&Number(r)>=0?"+":"",c=i?'<span style="background:#e74c3c;color:#fff;font-size:calc(9px * var(--wm-panel-effective-scale, 1));font-weight:700;padding:2px 6px;border-radius:4px;letter-spacing:0.08em">INVERTED</span>':'<span style="background:#2ecc71;color:#000;font-size:calc(9px * var(--wm-panel-effective-scale, 1));font-weight:700;padding:2px 6px;border-radius:4px;letter-spacing:0.08em">NORMAL</span>',p=r!==null?`<span style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);margin-left:10px">2Y-10Y Spread: <span style="color:${i?"#e74c3c":"#2ecc71"}">${l(o+r)}bps</span></span>`:"",m=this._ecbRates?'<span><svg width="20" height="4" style="vertical-align:middle"><line x1="0" y1="2" x2="20" y2="2" stroke="#2ecc71" stroke-width="1.5" stroke-dasharray="5,3"/></svg> EU (ECB AAA)</span>':"";this.setSafeContent(S(`
      <div style="padding:10px 14px 6px">
        ${e}
        <div style="display:flex;align-items:center;margin-bottom:10px;gap:4px">
          ${c}${p}
        </div>
        <div style="margin:0 -4px">${_n(this._current,this._prior,this._ecbRates)}</div>
        ${kn(this._current)}
        <div style="margin-top:8px;font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);display:flex;gap:12px;align-items:center;flex-wrap:wrap">
          <span><svg width="20" height="4" style="vertical-align:middle"><line x1="0" y1="2" x2="20" y2="2" stroke="#3498db" stroke-width="2"/></svg> US (Current)</span>
          <span><svg width="20" height="4" style="vertical-align:middle"><line x1="0" y1="2" x2="20" y2="2" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" stroke-dasharray="4,3"/></svg> US (Prior)</span>
          ${m}
          <span style="margin-left:auto">Source: FRED / ECB</span>
        </div>
      </div>`,"legacy Panel.setContent() migration"))}}const Ys=Object.freeze(Object.defineProperty({__proto__:null,YieldCurvePanel:Fn},Symbol.toStringTag,{value:"Module"}));let he=null;async function Rn(){if(!he){const{MarketServiceClient:a}=await A(async()=>{const{MarketServiceClient:e}=await import("./rpc-client-market-v1-Bo995CQG.js");return{MarketServiceClient:e}},[]),{getRpcBaseUrl:s}=await A(async()=>{const{getRpcBaseUrl:e}=await import("./embed-url-BEcsdCFo.js").then(t=>t.al);return{getRpcBaseUrl:e}},__vite__mapDeps([1,2,3,4,5,6,7,12]));he=new a(s(),{fetch:(...e)=>globalThis.fetch(...e)})}return he}function ot(a){return a==null?"":`${a>=0?"+":""}${a.toFixed(2)}`}function lt(a){return a==null||a<=0?"":a>=1e12?`$${(a/1e12).toFixed(1)}T`:a>=1e9?`$${(a/1e9).toFixed(1)}B`:a>=1e6?`$${Math.round(a/1e6)}M`:`$${a}`}function En(a,s){if(a==null||s==null||s===0)return"";const e=(a-s)/Math.abs(s)*100;return`${e>=0?"+":""}${e.toFixed(1)}%`}function Pn(a){const s=new Date;s.setHours(0,0,0,0);const e=new Date(`${a}T00:00:00`);if(Number.isNaN(e.getTime()))return a;const t=Math.round((e.getTime()-s.getTime())/864e5),n=e.toLocaleDateString(It(),{weekday:"short",month:"short",day:"numeric"});return t===0?d("components.earningsCalendar.today",{date:n}):t===1?d("components.earningsCalendar.tomorrow",{date:n}):n.toUpperCase().replace(","," ·")}function Dn(a){const s=a.hour==="bmo"?"BMO":a.hour==="amc"?"AMC":a.hour?a.hour.toUpperCase():"",e=a.hour==="bmo"?"background:rgba(46,204,113,0.15);color:#2ecc71":a.hour==="amc"?"background:rgba(52,152,219,0.15);color:#3498db":"background:rgba(255,255,255,0.08);color:var(--text-dim)",t=lt(a.revenueEstimate),n=lt(a.revenueActual),i=ot(a.epsEstimate),r=ot(a.epsActual);let o="";if(a.hasActuals&&r){const p=a.surpriseDirection==="beat"?"background:rgba(46,204,113,0.2);color:#2ecc71":a.surpriseDirection==="miss"?"background:rgba(231,76,60,0.2);color:#e74c3c":"background:rgba(255,255,255,0.08);color:var(--text-dim)",m=a.surpriseDirection==="beat"?d("components.earningsCalendar.surprise.beat"):a.surpriseDirection==="miss"?d("components.earningsCalendar.surprise.miss"):d("components.earningsCalendar.surprise.inLine"),f=En(a.epsActual,a.epsEstimate);o=`
      <span style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));font-weight:600;color:var(--text)">${l(d("components.earningsCalendar.epsActual",{value:r}))}</span>
      <span style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));font-weight:700;padding:1px 4px;border-radius:3px;${p}">${l(m)}${f?` ${l(f)}`:""}</span>`}else i&&(o=`<span style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">${l(d("components.earningsCalendar.epsEstimate",{value:i}))}</span>`);let c="";return a.hasActuals&&n?c=`<span style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">${l(d("components.earningsCalendar.revenueActual",{value:n}))}</span>`:t&&(c=`<span style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:rgba(255,255,255,0.25)">${l(d("components.earningsCalendar.revenueEstimate",{value:t}))}</span>`),`
    <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
      <div style="display:flex;flex-direction:column;align-items:center;gap:3px;flex-shrink:0;padding-top:1px">
        ${s?`<span style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));font-weight:700;padding:2px 5px;border-radius:3px;${e};letter-spacing:0.04em">${l(s)}</span>`:""}
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-size:calc(12px * var(--wm-panel-effective-scale, 1));font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${l(a.company)}</div>
        <div style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);letter-spacing:0.04em">${l(a.symbol)}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex-shrink:0">
        ${o?`<div style="display:flex;align-items:center;gap:5px">${o}</div>`:""}
        ${c?`<div>${c}</div>`:""}
      </div>
    </div>`}function Tn(a,s,e){return`
    <div style="${e?"":"border-top:1px solid rgba(255,255,255,0.06);"}padding-top:${e?"0":"10"}px;padding-bottom:2px">
      <div style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.06em;padding:0 0 5px">${l(Pn(a))}</div>
      ${s.map(Dn).join("")}
    </div>`}class Mn extends k{constructor(){super({id:"earnings-calendar",title:d("components.earningsCalendar.title"),showCount:!1,infoTooltip:d("components.earningsCalendar.infoTooltip")});x(this,"_hasData",!1)}async fetchData(){return this.showLoading(),this.refreshFromRpc()}async refreshFromRpc(){var e;try{const t=await Rn(),n=new Date,i=new Date;i.setDate(i.getDate()+14);const r=n.toISOString().slice(0,10),o=i.toISOString().slice(0,10),c=await t.listEarningsCalendar({fromDate:r,toDate:o});return c.unavailable||!((e=c.earnings)!=null&&e.length)?(this._hasData||this.showError(d("components.earningsCalendar.errors.noData"),()=>void this.fetchData()),!1):(this.render(c.earnings),!0)}catch(t){return this._hasData||this.showError(t instanceof Error?t.message:d("components.earningsCalendar.errors.failedToLoad"),()=>void this.fetchData()),!1}}render(e){this._hasData=!0;const t=new Map;for(const r of e){const o=r.date||"Unknown",c=t.get(o);c?c.push(r):t.set(o,[r])}const i=`
      <div style="padding:0 14px 12px;max-height:480px;overflow-y:auto">
        ${[...t.keys()].sort().map((r,o)=>Tn(r,t.get(r),o===0)).join("")}
      </div>`;this.setSafeContent(S(i,"legacy Panel.setContent() migration"))}}const Ws=Object.freeze(Object.defineProperty({__proto__:null,EarningsCalendarPanel:Mn},Symbol.toStringTag,{value:"Module"}));let ge=null;async function Nn(){if(!ge){const{EconomicServiceClient:a}=await A(async()=>{const{EconomicServiceClient:e}=await import("./rpc-client-economic-v1-ClSZlM4Y.js");return{EconomicServiceClient:e}},[]),{getRpcBaseUrl:s}=await A(async()=>{const{getRpcBaseUrl:e}=await import("./embed-url-BEcsdCFo.js").then(t=>t.al);return{getRpcBaseUrl:e}},__vite__mapDeps([1,2,3,4,5,6,7,12]));ge=new a(s(),{fetch:(...e)=>globalThis.fetch(...e)})}return ge}const Ln={US:"🇺🇸",GB:"🇬🇧",UK:"🇬🇧",EU:"🇪🇺",EUR:"🇪🇺",EA:"🇪🇺",DE:"🇩🇪",FR:"🇫🇷",JP:"🇯🇵",CN:"🇨🇳",CA:"🇨🇦",AU:"🇦🇺"},zn=new Set(["EU","EA","EUR","DE","FR","IT","ES","NL","BE","AT","PT","FI","IE","GR"]),ct={high:"#e74c3c",medium:"#f39c12",low:"rgba(255,255,255,0.3)"};function In(a){const s=new Map;for(const e of a){const t=e.date||"Unknown";s.has(t)||s.set(t,[]),s.get(t).push(e)}return s}function Bn(a){if(!a||a==="Unknown")return"Unknown";const s=new Date(`${a}T00:00:00`);return Number.isNaN(s.getTime())?a:s.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}function On(a,s){return a?s?`${a} ${s}`:a:"—"}function Un(a){const s=new Date;s.setHours(0,0,0,0);const e=new Date(`${a}T00:00:00`);if(Number.isNaN(e.getTime()))return"";const t=Math.round((e.getTime()-s.getTime())/864e5);return t===0?"today":t===1?"tomorrow":t<0?Math.abs(t)<14?`${Math.abs(t)}d ago`:`${Math.round(Math.abs(t)/7)}w ago`:t<14?`in ${t}d`:`in ${Math.round(t/7)}w`}class jn extends k{constructor(){super({id:"economic-calendar",title:"Economic Calendar",showCount:!1,infoTooltip:d("components.economicCalendar.infoTooltip")});x(this,"_hasData",!1);x(this,"_events",[]);x(this,"_region","all");this.content.addEventListener("click",e=>{const t=e.target.closest("button[data-region]");if(!t)return;const n=t.dataset.region;n&&n!==this._region&&(this._region=n,this._render())})}async fetchData(){this.showLoading("Loading economic calendar...");try{const e=await Nn(),t=new Date,n=t.toISOString().slice(0,10),i=new Date(t.getTime()+30*864e5).toISOString().slice(0,10),r=await e.getEconomicCalendar({fromDate:n,toDate:i});return r.unavailable||!r.events||r.events.length===0?(this._hasData||this.showError("Economic calendar data unavailable.",()=>void this.fetchData()),!1):(this._events=r.events,this._hasData=!0,this._render(),!0)}catch(e){return this.isAbortError(e)||this._hasData||this.showError("Failed to load economic calendar.",()=>void this.fetchData()),!1}}_filterEvents(){return this._region==="us"?this._events.filter(e=>e.country==="US"):this._region==="eu"?this._events.filter(e=>zn.has(e.country)):this._events}_renderRegionTabs(){return'<div style="display:flex;gap:4px;padding:0 14px 10px">'+[{key:"all",label:"All"},{key:"us",label:"US"},{key:"eu",label:"EU"}].map(({key:t,label:n})=>{const i=this._region===t;return`<button data-region="${t}" style="
          padding:3px 10px;font-size:calc(10px * var(--wm-panel-effective-scale, 1));font-weight:600;letter-spacing:0.04em;
          border-radius:3px;border:none;cursor:pointer;
          background:${i?"rgba(255,255,255,0.15)":"transparent"};
          color:${i?"var(--text)":"rgba(255,255,255,0.35)"};
        ">${l(n)}</button>`}).join("")+"</div>"}_render(){if(!this._hasData){this.showError("No upcoming economic events.",()=>void this.fetchData());return}const e=this._filterEvents(),t=In(e);let n="",i=!0;for(const[p,m]of t){const f=i?"":"border-top:1px solid rgba(255,255,255,0.06);";i=!1,n+=`<tr>
        <td colspan="3" style="
          padding:10px 0 3px;
          font-size:calc(10px * var(--wm-panel-effective-scale, 1));font-weight:600;
          color:rgba(255,255,255,0.35);
          text-transform:uppercase;letter-spacing:0.06em;
          ${f}
        ">${l(Bn(p))}</td>
      </tr>`;for(const h of m){const y=(h.impact||"low").toLowerCase(),v=ct[y]??ct.low,u=Ln[h.country]??l(h.country),g=y==="high";let $,w;h.actual?($=l(On(h.actual,h.unit)),w="color:var(--text);font-weight:600"):($=l(Un(h.date)),w="color:rgba(255,255,255,0.35);font-style:italic"),n+=`<tr style="font-size:calc(12px * var(--wm-panel-effective-scale, 1));line-height:1.2">
          <td style="padding:4px 8px 4px 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:0">
            <span style="margin-right:5px">${u}</span><span style="font-weight:${g?600:400}">${l(h.event)}</span>
          </td>
          <td style="padding:4px 6px;text-align:center;vertical-align:middle">
            <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${v};vertical-align:middle"></span>
          </td>
          <td style="padding:4px 0;text-align:right;font-variant-numeric:tabular-nums;${w};white-space:nowrap">${$}</td>
        </tr>`}}const r=this._region==="all"?"No upcoming economic events":"No events for selected region",o=e.length===0?`<tr><td colspan="3" style="padding:20px 0;text-align:center;color:rgba(255,255,255,0.3);font-size:calc(12px * var(--wm-panel-effective-scale, 1))">${l(r)}</td></tr>`:"",c=`${this._renderRegionTabs()}<div style="padding:0 14px 12px;max-height:440px;overflow-y:auto">
      <table style="width:100%;border-collapse:collapse;table-layout:fixed">
        <colgroup>
          <col style="width:auto">
          <col style="width:20px">
          <col style="width:64px">
        </colgroup>
        <thead>
          <tr style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));font-weight:600;color:rgba(255,255,255,0.25);text-transform:uppercase;letter-spacing:0.06em">
            <th style="text-align:left;padding:0 8px 8px 0;font-weight:600">EVENT</th>
            <th style="padding:0 0 8px;font-weight:600"></th>
            <th style="text-align:right;padding:0 0 8px;font-weight:600"></th>
          </tr>
        </thead>
        <tbody>${o}${n}</tbody>
      </table>
    </div>`;this.setSafeContent(S(c,"legacy Panel.setContent() migration"))}}const Xs=Object.freeze(Object.defineProperty({__proto__:null,EconomicCalendarPanel:jn},Symbol.toStringTag,{value:"Module"}));let xe=null;async function Gn(){if(!xe){const{MarketServiceClient:a}=await A(async()=>{const{MarketServiceClient:e}=await import("./rpc-client-market-v1-Bo995CQG.js");return{MarketServiceClient:e}},[]),{getRpcBaseUrl:s}=await A(async()=>{const{getRpcBaseUrl:e}=await import("./embed-url-BEcsdCFo.js").then(t=>t.al);return{getRpcBaseUrl:e}},__vite__mapDeps([1,2,3,4,5,6,7,12]));xe=new a(s(),{fetch:(...e)=>globalThis.fetch(...e)})}return xe}function J(a){return typeof a=="number"?a:parseInt(String(a),10)||0}function ye(a,s){const e=Math.max(-100,Math.min(100,a)),t=Math.abs(e)/100*50,n=e>=0?"#2ecc71":"#e74c3c",i=e>=0?50:50-t,r=e>=0?"+":"";return`
    <div style="margin:3px 0">
      <div style="display:flex;justify-content:space-between;font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);margin-bottom:2px">
        <span>${l(s)}</span>
        <span style="color:${n};font-weight:600">${r}${e.toFixed(1)}%</span>
      </div>
      <div style="position:relative;height:8px;background:rgba(255,255,255,0.06);border-radius:2px">
        <div style="position:absolute;top:0;bottom:0;left:50%;width:1px;background:rgba(255,255,255,0.15)"></div>
        <div style="position:absolute;top:0;bottom:0;left:${i.toFixed(2)}%;width:${t.toFixed(2)}%;background:${n};border-radius:1px"></div>
      </div>
    </div>`}function Vn(a){const s=J(a.leveragedFundsLong),e=J(a.leveragedFundsShort),t=J(a.smallTraderLong),n=J(a.smallTraderShort),i=a.netPct,r=(s-e)/Math.max(s+e,1)*100,o=(t-n)/Math.max(t+n,1)*100;return`
    <div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <span style="font-size:calc(12px * var(--wm-panel-effective-scale, 1));font-weight:600">${l(a.name)}</span>
        <span style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">${l(a.code)}</span>
      </div>
      ${ye(i,"Asset Managers")}
      ${ye(r,"Leveraged Funds")}
      ${a.smallTraderAvailable?ye(o,"Small Traders (non-reportable)"):""}
    </div>`}class Hn extends k{constructor(){super({id:"cot-positioning",title:"CFTC COT Positioning",showCount:!1,infoTooltip:d("components.cotPositioning.infoTooltip")});x(this,"_hasData",!1)}async fetchData(){this.showLoading();try{const t=await(await Gn()).getCotPositioning({});return t.unavailable||!t.instruments||t.instruments.length===0?(this._hasData||this.showError("COT data unavailable",()=>void this.fetchData()),!1):(this._hasData=!0,this.render(t.instruments,t.reportDate??""),!0)}catch(e){return this._hasData||this.showError(e instanceof Error?e.message:"Failed to load",()=>void this.fetchData()),!1}}render(e,t){const n=e.map(Vn).join(""),r=e.some(p=>p.smallTraderAvailable)?"Small traders use the CFTC non-reportable residual category. This seed stores the latest weekly snapshot, not historical releases, so a retail trend line is not shown.":"Small-trader positioning is unavailable until the next CFTC seed refresh. No retail trend line is shown.",o=t?`<div style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);margin-top:8px;text-align:right">Report date: ${l(t)}</div>`:"",c=`
      <div style="padding:10px 14px">
        ${n}
        <div style="margin-top:8px;padding:7px 8px;border:1px solid rgba(255,255,255,0.08);border-radius:4px;color:var(--text-dim);font-size:calc(9px * var(--wm-panel-effective-scale, 1));line-height:1.4">${l(r)}</div>
        ${o}
      </div>`;this.setSafeContent(S(c,"legacy Panel.setContent() migration"))}}const Ks=Object.freeze(Object.defineProperty({__proto__:null,CotPositioningPanel:Hn},Symbol.toStringTag,{value:"Module"}));let be=null;async function qn(){if(!be){const{MarketServiceClient:a}=await A(async()=>{const{MarketServiceClient:e}=await import("./rpc-client-market-v1-Bo995CQG.js");return{MarketServiceClient:e}},[]),{getRpcBaseUrl:s}=await A(async()=>{const{getRpcBaseUrl:e}=await import("./embed-url-BEcsdCFo.js").then(t=>t.al);return{getRpcBaseUrl:e}},__vite__mapDeps([1,2,3,4,5,6,7,12]));be=new a(s(),{fetch:bt})}return be}const dt=["AAPL","MSFT","NVDA","AMZN","GOOGL","META","TSLA"],$e=["CL","GC","SI","ES","NQ"],Yn={ES:"S&P 500 futures",NQ:"Nasdaq futures"};function G(a){if(typeof a=="number")return a;const s=parseInt(String(a),10);return Number.isFinite(s)?s:0}function pt(a){return a===null?'<span class="commodity-change">—</span>':`<span class="commodity-change ${N(a)}">${L(a)}</span>`}function we(a,s){const e=a+s;return e<=0?null:(a-s)/e*100}function mt(a){return a===null?"—":`${a>=0?"+":""}${a.toFixed(1)}%`}class Wn extends k{constructor(){super({id:"liquidity-shifts",title:d("components.liquidityShifts.title"),showCount:!1,infoTooltip:d("components.liquidityShifts.infoTooltip")});x(this,"_hasData",!1)}async fetchData(){var e;this.showLoading();try{const t=await qn(),[n,i]=await Promise.all([t.getCotPositioning({}),t.listMarketQuotes({symbols:dt})]),r=(n.instruments??[]).filter(v=>$e.includes(v.code??"")).sort((v,u)=>$e.indexOf(v.code??"")-$e.indexOf(u.code??""));if(r.length===0&&(((e=i.quotes)==null?void 0:e.length)??0)===0)return this._hasData||this.showError(d("components.liquidityShifts.unavailable"),()=>void this.fetchData()),!1;this._hasData=!0;const o=r.map(v=>{const u=G(v.assetManagerLong??0),g=G(v.assetManagerShort??0),$=we(u,g),w=G(v.leveragedFundsLong??0),b=G(v.leveragedFundsShort??0),C=G(v.smallTraderLong??0),F=G(v.smallTraderShort??0),R=w>0||b>0,W=R?we(w,b):null,B=v.code??"",Dt=Yn[B]??v.name??B,Tt=R?`<div class="market-symbol">${d("components.liquidityShifts.lev")} ${l(mt(W))}</div>`:"",Oe=v.smallTraderAvailable===!0,Mt=Oe?we(C,F):null,Nt=Oe?`<div class="market-symbol">Small traders ${l(mt(Mt))}</div>`:"";return`<div class="liquidity-row">
          <div class="liquidity-row__info">
            <div class="market-name">${l(Dt)}</div>
            <div class="market-symbol">${l(B)} • ${d("components.liquidityShifts.longShort",{long:String(u),short:String(g)})}</div>
          </div>
          <div class="liquidity-row__values">
            <div>${pt($)}</div>
            ${Tt}
            ${Nt}
          </div>
        </div>`}).join(""),c=new Map(dt.map((v,u)=>[v,u])),m=[...i.quotes??[]].sort((v,u)=>{const g=c.get(v.symbol??"")??Number.MAX_SAFE_INTEGER,$=c.get(u.symbol??"")??Number.MAX_SAFE_INTEGER;return g-$}).map(v=>{const u=Number(v.change??0);return`<div class="market-item liquidity-stock-row">
            <div class="market-info">
              <span class="market-name">${l(v.name||v.symbol||"")}</span>
              <span class="market-symbol">${l(v.symbol||"")}</span>
            </div>
            <div>${pt(u)}</div>
          </div>`}).join(""),f=`<div class="market-symbol">${d("components.liquidityShifts.noCot")}</div>`,h=`<div class="market-symbol">${d("components.liquidityShifts.noStocks")}</div>`,y=n.reportDate?`<div class="market-symbol liquidity-report-date">${d("components.liquidityShifts.reportDate",{date:n.reportDate})}</div>`:"";return this.setSafeContent(S(`
        <div class="liquidity-shifts-panel">
          <div class="liquidity-shifts-panel__section-title">${d("components.liquidityShifts.cotSection")}</div>
          ${o||f}
          <div class="liquidity-shifts-panel__section-title liquidity-shifts-panel__section-title--gap">${d("components.liquidityShifts.stocksSection")}</div>
          ${m||h}
          ${y}
        </div>
      `,"legacy Panel.setContent() migration")),!0}catch(t){return this._hasData||this.showError(t instanceof Error?t.message:d("components.liquidityShifts.failed"),()=>void this.fetchData()),!1}}}const Qs=Object.freeze(Object.defineProperty({__proto__:null,LiquidityShiftsPanel:Wn},Symbol.toStringTag,{value:"Module"}));let Se=null;async function Xn(){if(!Se){const{MarketServiceClient:a}=await A(async()=>{const{MarketServiceClient:e}=await import("./rpc-client-market-v1-Bo995CQG.js");return{MarketServiceClient:e}},[]),{getRpcBaseUrl:s}=await A(async()=>{const{getRpcBaseUrl:e}=await import("./embed-url-BEcsdCFo.js").then(t=>t.al);return{getRpcBaseUrl:e}},__vite__mapDeps([1,2,3,4,5,6,7,12]));Se=new a(s(),{fetch:(...e)=>globalThis.fetch(...e)})}return Se}const Kn=40;function Qn(a){if(!Array.isArray(a)||a.length<13)return null;const s=a[a.length-1],e=a[a.length-13];return!(e>0)||!Number.isFinite(s)?null:(s-e)/e}function Jn(a){if(a==null)return null;const s=typeof a=="number"?a:parseFloat(String(a));return Number.isFinite(s)?s:null}function Zn(a,s){const e=Array.isArray(a.sparkOi)?a.sparkOi.filter(t=>Number.isFinite(t)):[];return{symbol:String(a.symbol??""),display:String(a.display??""),group:String(a.group??""),funding:s?typeof a.funding=="number"&&Number.isFinite(a.funding)?a.funding:null:Jn(a.funding),oiDelta1h:Qn(e),composite:Number(a.composite||0),warmup:!!a.warmup,stale:!!a.stale}}function ut(a,s){const e=[],t=[],n=[];for(const i of a){const r=Zn(i,s),o=r.group;o==="fx"?n.push(r):o==="crypto"?t.push(r):e.push(r)}return{warmup:!1,commodityAssets:e,cryptoAssets:t,fxAssets:n,unavailable:!1}}function es(a,s){return a<15?"var(--text-dim)":s!=null&&s<0?a>=60?"#e74c3c":a>=40?"#e67e22":"#c0392b88":a>=60?"#2ecc71":a>=40?"#27ae60":"#2ecc7188"}function ts(a,s,e=56){const t=(e-6)/2,n=e/2,i=e/2+2,r=Math.PI*.8,o=Math.PI*2.2,c=o-r,p=r+a/100*c,m=n+t*Math.cos(r),f=i+t*Math.sin(r),h=n+t*Math.cos(o),y=i+t*Math.sin(o),v=n+t*Math.cos(p),u=i+t*Math.sin(p),g=p-r>Math.PI?1:0,$=a<15?.4:a<40?.6:.9;return`<svg width="${e}" height="${e}" viewBox="0 0 ${e} ${e}" class="pos-gauge">
    <path d="M ${m} ${f} A ${t} ${t} 0 1 1 ${h} ${y}" fill="none" stroke="var(--border-color, #333)" stroke-width="3" stroke-linecap="round"/>
    ${a>0?`<path d="M ${m} ${f} A ${t} ${t} 0 ${g} 1 ${v} ${u}" fill="none" stroke="${s}" stroke-width="3.5" stroke-linecap="round" opacity="${$}"/>`:""}
    <text x="${n}" y="${i+2}" text-anchor="middle" dominant-baseline="middle" fill="${s}" style="font-size:calc(13px * var(--wm-panel-effective-scale, 1))" font-weight="600" opacity="${$}">${Math.round(a)}</text>
  </svg>`}function as(a,s){const e=Math.round(a.composite),t=es(e,a.funding),n=e>=Kn,i=a.funding!=null?`${(a.funding*100).toFixed(3)}%`:"--",r=a.funding!=null&&a.funding<0?"change-negative":"change-positive",o=a.oiDelta1h!=null?`${a.oiDelta1h>=0?"+":""}${(a.oiDelta1h*100).toFixed(1)}%`:"--",c=a.oiDelta1h!=null&&a.oiDelta1h<0?"change-negative":"change-positive",p=a.stale?' <span class="pos-badge pos-badge--stale">stale</span>':"",m=a.warmup?' <span class="pos-badge pos-badge--warmup">warm</span>':"",f=n?" pos-card--elevated":"",h=n?` style="--pos-glow-color: ${t}"`:"",y=s?` data-pos-navigate="${l(s)}"`:"",v=s?" pos-card--clickable":"",u=`${a.symbol} score ${e}/100`+(a.funding!=null?` | funding ${i}`:"")+(a.oiDelta1h!=null?` | OI delta ${o}`:"")+(a.warmup?" | warming up":"")+(a.stale?" | upstream stale":"");return`<div class="pos-card${f}${v}"${h}${y} title="${l(u)}">
    <div class="pos-card__name">${l(a.display)}${p}${m}</div>
    ${ts(e,t)}
    <div class="pos-card__metrics">
      <span class="${r}" title="hourly funding">${l(i)}</span>
      <span class="${c}" title="OI delta 1h">${l(o)}</span>
    </div>
  </div>`}const ns={BTC:"crypto",ETH:"crypto",SOL:"crypto",PAXG:"commodities","xyz:CL":"commodities","xyz:BRENTOIL":"commodities","xyz:GOLD":"commodities","xyz:SILVER":"commodities","xyz:PLATINUM":"commodities","xyz:PALLADIUM":"commodities","xyz:COPPER":"commodities","xyz:NATGAS":"commodities"};function ss(a){const s=ns[a];return s&&document.querySelector(`[data-panel="${s}"]`)?s:null}function _e(a,s){if(s.length===0)return"";const t=[...s].sort((n,i)=>i.composite-n.composite).map(n=>as(n,ss(n.symbol))).join("");return`<div class="pos-section">
    <div class="pos-section__header">${l(a)}</div>
    <div class="pos-grid">${t}</div>
  </div>`}class is extends k{constructor(){super({id:"positioning-247",title:d("components.positioning247.title"),showCount:!1,infoTooltip:d("components.positioning247.infoTooltip")});x(this,"_flow",null);x(this,"_loading",!1);this.content.addEventListener("click",e=>{const t=e.target.closest("[data-pos-navigate]");if(t!=null&&t.dataset.posNavigate){const n=document.querySelector(`[data-panel="${t.dataset.posNavigate}"]`);n&&(n.scrollIntoView({behavior:"smooth",block:"center"}),n.classList.add("panel-highlight"),setTimeout(()=>n.classList.remove("panel-highlight"),1500))}})}async fetchData(){if(this._loading)return!1;this._loading=!0;try{if(!this._flow){const n=z("hyperliquidFlow");n&&!n.unavailable&&Array.isArray(n.assets)&&n.assets.length>0&&(this._flow={...ut(n.assets,!0),warmup:!!n.warmup},this._render())}const t=await(await Xn()).getHyperliquidFlow({});return t.unavailable||!t.assets||t.assets.length===0?this._flow||(this._flow={warmup:!0,commodityAssets:[],cryptoAssets:[],fxAssets:[],unavailable:!0}):this._flow={...ut(t.assets,!1),warmup:!!t.warmup},this._render(),!0}catch(e){return console.error("[PositioningPanel] RPC failed:",e instanceof Error?e.message:e),this._flow||(this._flow={warmup:!0,commodityAssets:[],cryptoAssets:[],fxAssets:[],unavailable:!0}),this._render(),!1}finally{this._loading=!1}}_render(){if(!this._flow){this.showLoading();return}if(this._flow.unavailable){this.setSafeContent(S(`<div class="pos-panel"><div class="pos-warmup">${l(d("components.positioning247.warmup"))}</div></div>`,"legacy Panel.setContent() migration"));return}const e=[];this._flow.warmup&&e.push(`<div class="pos-warmup">${l(d("components.positioning247.warmup"))}</div>`),e.push(_e(d("components.positioning247.commodities"),this._flow.commodityAssets)),e.push(_e(d("components.positioning247.crypto"),this._flow.cryptoAssets)),e.push(_e(d("components.positioning247.fx"),this._flow.fxAssets)),e.push(`<div class="pos-footer">${l(d("components.positioning247.footer"))}</div>`),this.setSafeContent(S(`<div class="pos-panel">${e.join("")}</div>`,"legacy Panel.setContent() migration"))}}const Js=Object.freeze(Object.defineProperty({__proto__:null,PositioningPanel:is},Symbol.toStringTag,{value:"Module"}));function P(a,s=2){return!Number.isFinite(a)||a<=0?"--":a>=1e4?Math.round(a).toLocaleString():a.toLocaleString(void 0,{minimumFractionDigits:s,maximumFractionDigits:s})}function ke(a){const s=typeof a=="string"?parseInt(a,10):a;return Number.isFinite(s)?Math.round(s).toLocaleString():"--"}function re(a,s=2){return Number.isFinite(a)?`${a>=0?"+":""}${a.toFixed(s)}%`:"--"}function rs(a){const s=typeof a=="string"?parseInt(a,10):a;return Number.isFinite(s)?`${s>=0?"+":""}${Math.round(s).toLocaleString()}`:"--"}function os(a){if(!a)return{text:"Updated —",dot:"var(--text-dim)"};const s=Date.now()-new Date(a).getTime();if(!Number.isFinite(s)||s<0)return{text:"Updated now",dot:"#2ecc71"};const e=Math.floor(s/6e4),t=e<10?"#2ecc71":e<30?"#f5a623":"#e74c3c";return e<1?{text:"Updated just now",dot:t}:e<60?{text:`Updated ${e}m ago`,dot:t}:{text:`Updated ${Math.floor(e/60)}h ago`,dot:t}}function ls(a,s,e,t){const n=Math.max(0,Math.min(100,t));return`
    <div style="position:relative;height:8px;background:linear-gradient(90deg,rgba(231,76,60,0.25),rgba(245,166,35,0.25),rgba(46,204,113,0.25));border-radius:4px;margin:6px 0">
      <div style="position:absolute;top:-3px;bottom:-3px;left:${n.toFixed(1)}%;width:3px;background:#fff;border-radius:1px;box-shadow:0 0 4px rgba(255,255,255,0.8);transform:translateX(-50%)"></div>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">
      <span>Low $${l(P(a))}</span>
      <span style="color:var(--text);font-weight:600">$${l(P(e))} • ${n.toFixed(0)}% of range</span>
      <span>High $${l(P(s))}</span>
    </div>`}function ft(a,s,e){const t=Math.max(-100,Math.min(100,a)),n=Math.abs(t)/100*50,i=t>=0?"#2ecc71":"#e74c3c",r=t>=0?50:50-n,o=t>=0?"+":"",c=parseInt(e,10),p=Number.isFinite(c)&&c!==0?` <span style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:${c>=0?"#2ecc71":"#e74c3c"};font-weight:500">Δ ${rs(e)}</span>`:"";return`
    <div style="margin:4px 0">
      <div style="display:flex;justify-content:space-between;font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);margin-bottom:2px">
        <span>${l(s)}${p}</span>
        <span style="color:${i};font-weight:600">${o}${t.toFixed(1)}%</span>
      </div>
      <div style="position:relative;height:8px;background:rgba(255,255,255,0.06);border-radius:2px">
        <div style="position:absolute;top:0;bottom:0;left:50%;width:1px;background:rgba(255,255,255,0.15)"></div>
        <div style="position:absolute;top:0;bottom:0;left:${r.toFixed(2)}%;width:${n.toFixed(2)}%;background:${i};border-radius:1px"></div>
      </div>
    </div>`}function cs(a){return a>80?{text:"Silver undervalued",color:"#f5a623"}:a<60?{text:"Gold undervalued",color:"#f5a623"}:{text:"Neutral",color:"var(--text-dim)"}}function Z(a,s){const e=s>=0?"#2ecc71":"#e74c3c";return`<div style="flex:1;text-align:center;padding:4px;background:rgba(255,255,255,0.03);border-radius:4px">
    <div style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">${l(a)}</div>
    <div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));font-weight:600;color:${e}">${l(re(s,1))}</div>
  </div>`}class ds extends k{constructor(){super({id:"gold-intelligence",title:d("panels.goldIntelligence"),infoTooltip:d("components.goldIntelligence.infoTooltip")});x(this,"_hasData",!1)}async fetchData(){var e,t;this.showLoading();try{const n=Me("/api/market/v1/get-gold-intelligence"),i=await fetch(n);if(!i.ok)throw new Error(`HTTP ${i.status}`);const r=await i.json();return r.unavailable?(this._hasData||this.showError("Gold data unavailable",()=>void this.fetchData()),!1):(e=this.element)!=null&&e.isConnected?(this._hasData=!0,this.render(r),!0):!1}catch(n){return this.isAbortError(n)||!((t=this.element)!=null&&t.isConnected)||this._hasData||this.showError(n instanceof Error?n.message:"Failed to load",()=>void this.fetchData()),!1}}renderHeader(e){const t=e.goldChangePct,n=t>=0?"#2ecc71":"#e74c3c",i=q(e.goldSparkline,t,80,20),r=os(e.updatedAt),o=e.session&&e.session.dayHigh>0?`<div style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);margin-top:2px">
          Session H $${l(P(e.session.dayHigh))} • L $${l(P(e.session.dayLow))} • Prev $${l(P(e.session.prevClose))}
        </div>`:"";return`
      <div class="energy-tape-section">
        <div class="energy-section-title">Price &amp; Performance</div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <span style="font-size:calc(16px * var(--wm-panel-effective-scale, 1));font-weight:700">$${l(P(e.goldPrice))}</span>
          <span style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));font-weight:600;color:${n};padding:1px 6px;border-radius:3px;background:${n}22">${re(t)}</span>
          ${i}
        </div>
        <div style="display:flex;align-items:center;gap:6px;font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">
          <span style="width:6px;height:6px;border-radius:50%;background:${r.dot};display:inline-block"></span>
          <span>${l(r.text)} • GC=F front-month</span>
        </div>
        ${o}
      </div>`}renderReturns(e){if(!e.returns&&!e.range52w)return"";const t=e.returns?`<div style="display:flex;gap:4px;margin-top:6px">
          ${Z("1W",e.returns.w1)}
          ${Z("1M",e.returns.m1)}
          ${Z("YTD",e.returns.ytd)}
          ${Z("1Y",e.returns.y1)}
        </div>`:"",n=e.range52w&&e.range52w.hi>0?`<div style="margin-top:8px">
          <div style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">52-week range</div>
          ${ls(e.range52w.lo,e.range52w.hi,e.goldPrice,e.range52w.positionPct)}
        </div>`:"";return`<div class="energy-tape-section" style="margin-top:10px">
      <div class="energy-section-title">Returns</div>
      ${t}
      ${n}
    </div>`}renderMetals(e){const t=e.goldSilverRatio!=null&&Number.isFinite(e.goldSilverRatio)?(()=>{const r=cs(e.goldSilverRatio);return`<div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px">
          <span style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">Gold/Silver Ratio</span>
          <span style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));font-weight:600">${l(e.goldSilverRatio.toFixed(1))} <span style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:${r.color};font-weight:400">${l(r.text)}</span></span>
        </div>`})():"",n=e.goldPlatinumPremiumPct!=null&&Number.isFinite(e.goldPlatinumPremiumPct)?`<div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px">
          <span style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">Gold vs Platinum</span>
          <span style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));font-weight:600">${l(re(e.goldPlatinumPremiumPct,1))} premium</span>
        </div>`:"",i=[{label:"Silver",price:e.silverPrice},{label:"Platinum",price:e.platinumPrice},{label:"Palladium",price:e.palladiumPrice}].map(r=>`<div style="flex:1;text-align:center;padding:4px;background:rgba(255,255,255,0.03);border-radius:4px">
        <div style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">${l(r.label)}</div>
        <div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));font-weight:600">$${l(P(r.price))}</div>
      </div>`).join("");return`<div class="energy-tape-section" style="margin-top:10px">
      <div class="energy-section-title">Metals Complex</div>
      ${t}
      ${n}
      <div style="display:flex;gap:6px;margin-top:8px">${i}</div>
    </div>`}renderFx(e){return e.crossCurrencyPrices.length?`<div class="energy-tape-section" style="margin-top:10px">
      <div class="energy-section-title">Gold in Major Currencies</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">${e.crossCurrencyPrices.map(n=>`<div style="text-align:center;padding:4px;background:rgba(255,255,255,0.03);border-radius:4px">
        <div style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">${l(n.flag)} XAU/${l(n.currency)}</div>
        <div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));font-weight:600">${l(P(n.price,0))}</div>
      </div>`).join("")}</div>
    </div>`:""}renderPositioning(e){const t=e.cot;if(!t)return"";const n=t.managedMoney,i=t.producerSwap,r=n?ft(n.netPct,"Managed Money (speculators)",n.wowNetDelta):"",o=i?ft(i.netPct,"Producer/Swap (commercials)",i.wowNetDelta):"",c=(m,f)=>m?`<div style="display:flex;justify-content:space-between;font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);padding:2px 0">
          <span>${l(f)}</span>
          <span>L ${l(ke(m.longPositions))} / S ${l(ke(m.shortPositions))} • ${m.oiSharePct.toFixed(1)}% OI</span>
        </div>`:"",p=t.reportDate?`<div style="display:flex;justify-content:space-between;font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);margin-top:6px">
          <span>As of ${l(t.reportDate)}${t.nextReleaseDate?` • next release ${l(t.nextReleaseDate)}`:""}</span>
          <span>OI ${l(ke(t.openInterest))}</span>
        </div>`:"";return`<div class="energy-tape-section" style="margin-top:10px">
      <div class="energy-section-title">CFTC Positioning</div>
      ${r}
      ${c(n,"MM breakdown")}
      ${o}
      ${c(i,"P/S breakdown")}
      ${p}
    </div>`}renderCbReserves(e){const t=e.cbReserves;if(!t||!t.topHolders.length)return"";const n=(m,f)=>`<div style="display:flex;justify-content:space-between;font-size:calc(10px * var(--wm-panel-effective-scale, 1));padding:1px 0">
      <span style="color:var(--text-dim)">${f}. ${l(m.name)}</span>
      <span style="font-weight:600">${m.tonnes>0?`${m.tonnes.toFixed(1)}t`:"—"}</span>
    </div>`,i=m=>{const f=m.deltaTonnes12m>=0?"#2ecc71":"#e74c3c",h=m.deltaTonnes12m>=0?"+":"";return`<div style="display:flex;justify-content:space-between;font-size:calc(10px * var(--wm-panel-effective-scale, 1));padding:1px 0">
        <span style="color:var(--text-dim)">${l(m.name)}</span>
        <span style="color:${f};font-weight:600">${h}${m.deltaTonnes12m.toFixed(1)}t</span>
      </div>`},r=t.topHolders.slice(0,10).map((m,f)=>n(m,f+1)).join(""),o=t.topBuyers12m.slice(0,5).map(i).join(""),c=t.topSellers12m.slice(0,5).map(i).join(""),p=o||c?`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
          <div>
            <div style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);text-transform:uppercase;margin-bottom:2px">Buyers 12M</div>
            ${o||'<div style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">—</div>'}
          </div>
          <div>
            <div style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);text-transform:uppercase;margin-bottom:2px">Sellers 12M</div>
            ${c||'<div style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">—</div>'}
          </div>
        </div>`:"";return`<div class="energy-tape-section" style="margin-top:10px">
      <div class="energy-section-title">Central-Bank Reserves</div>
      <div style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);margin-bottom:4px">Top holders (tonnes)</div>
      ${r}
      ${p}
      <div style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);margin-top:6px;text-align:right">IMF IFS • as of ${l(t.asOfMonth)}</div>
    </div>`}renderEtfFlows(e){const t=e.etfFlows;if(!t||!Number.isFinite(t.tonnes)||t.tonnes<=0)return"";const n=(o,c,p)=>{const m=c>=0?"#2ecc71":"#e74c3c",f=c>=0?"+":"",h=p>=0?"+":"";return`<div style="flex:1;text-align:center;padding:4px;background:rgba(255,255,255,0.03);border-radius:4px">
        <div style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim)">${l(o)}</div>
        <div style="font-size:calc(11px * var(--wm-panel-effective-scale, 1));font-weight:600;color:${m}">${f}${c.toFixed(1)}t</div>
        <div style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:${m}">${h}${p.toFixed(2)}%</div>
      </div>`},i=t.aumUsd>=1e9?`$${(t.aumUsd/1e9).toFixed(1)}B`:t.aumUsd>0?`$${(t.aumUsd/1e6).toFixed(0)}M`:"--",r=t.sparkline90d.length>1?q(t.sparkline90d,t.changeM1Pct,80,20):"";return`<div class="energy-tape-section" style="margin-top:10px">
      <div class="energy-section-title">Physical Flows (GLD)</div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px">
        <div>
          <span style="font-size:calc(14px * var(--wm-panel-effective-scale, 1));font-weight:700">${l(t.tonnes.toFixed(1))} <span style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);font-weight:500">tonnes</span></span>
          <span style="font-size:calc(10px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);margin-left:6px">AUM ${l(i)}${t.nav>0?` • NAV $${t.nav.toFixed(2)}`:""}</span>
        </div>
        ${r}
      </div>
      <div style="display:flex;gap:4px;margin-top:4px">
        ${n("1W",t.changeW1Tonnes,t.changeW1Pct)}
        ${n("1M",t.changeM1Tonnes,t.changeM1Pct)}
        ${n("1Y",t.changeY1Tonnes,t.changeY1Pct)}
      </div>
      <div style="font-size:calc(9px * var(--wm-panel-effective-scale, 1));color:var(--text-dim);margin-top:4px;text-align:right">SPDR GLD • as of ${l(t.asOfDate)}</div>
    </div>`}renderDrivers(e){var n;return(n=e.drivers)!=null&&n.length?`<div class="energy-tape-section" style="margin-top:10px">
      <div class="energy-section-title">Drivers</div>
      ${e.drivers.map(i=>{const r=i.changePct>=0?"#2ecc71":"#e74c3c",o=i.correlation30d<=-.3?"#2ecc71":i.correlation30d>=.3?"#e74c3c":"var(--text-dim)";return`<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;font-size:calc(10px * var(--wm-panel-effective-scale, 1))">
        <span style="color:var(--text-dim)">${l(i.label)}</span>
        <span>
          <span style="font-weight:600">${l(i.value.toFixed(2))}</span>
          <span style="color:${r};margin-left:4px">${l(re(i.changePct,2))}</span>
          <span style="color:${o};margin-left:8px;font-size:calc(9px * var(--wm-panel-effective-scale, 1))">corr 30d ${i.correlation30d>=0?"+":""}${i.correlation30d.toFixed(2)}</span>
        </span>
      </div>`}).join("")}
    </div>`:""}render(e){const t=[this.renderHeader(e),this.renderReturns(e),this.renderMetals(e),this.renderFx(e),this.renderPositioning(e),this.renderEtfFlows(e),this.renderCbReserves(e),this.renderDrivers(e)].join("");this.setSafeContent(S(`<div style="padding:10px 14px">${t}</div>`,"legacy Panel.setContent() migration"))}}const Zs=Object.freeze(Object.defineProperty({__proto__:null,GoldIntelligencePanel:ds},Symbol.toStringTag,{value:"Module"}));function ee(a){return Math.abs(a)>=1e9?`${(a/1e9).toFixed(1)}B`:Math.abs(a)>=1e6?`${(a/1e6).toFixed(1)}M`:Math.abs(a)>=1e3?`${(a/1e3).toFixed(0)}K`:a.toLocaleString()}function vt(a){return a==="inflow"?"flow-inflow":a==="outflow"?"flow-outflow":"flow-neutral"}function ps(a){return a>.1?"change-positive":a<-.1?"change-negative":"change-neutral"}class ms extends k{constructor(){super({id:"etf-flows",title:d("panels.etfFlows"),showCount:!1,infoTooltip:d("components.etfFlows.infoTooltip")});x(this,"data",null);x(this,"loading",!0);x(this,"error",null)}async fetchData(){var t;const e=z("etfFlows");if((t=e==null?void 0:e.etfs)!=null&&t.length){this.data=e,this.error=null,this.loading=!1,this.renderPanel(),this.refreshFromRpc();return}await this.refreshFromRpc()}async refreshFromRpc(){var e,t,n;try{const r=await new yt(Le(),{fetch:(...o)=>globalThis.fetch(...o)}).listEtfFlows({});if(!((e=this.element)!=null&&e.isConnected))return;((t=r.etfs)!=null&&t.length||!this.data)&&(this.data=r,this.error=null,this.loading=!1,this.renderPanel())}catch(i){if(this.isAbortError(i)||!((n=this.element)!=null&&n.isConnected))return;this.data||(console.warn("[ETFFlows] Fetch error:",i),this.error=d("components.etfFlows.unavailable"),this.loading=!1,this.renderPanel())}}renderPanel(){var o;if(this.loading){this.showLoading(d("common.loadingEtfData"));return}if(this.error||!this.data){this.showError(this.error||d("common.noDataShort"),()=>void this.fetchData());return}const e=this.data;if(!((o=e.etfs)!=null&&o.length)){const c=e.rateLimited?d("components.etfFlows.rateLimited"):d("components.etfFlows.unavailable");this.setSafeContent(S(`<div class="panel-loading-text">${c}</div>`,"legacy Panel.setContent() migration"));return}const t=e.summary||{totalVolume:0,totalEstFlow:0,netDirection:"NEUTRAL",inflowCount:0,outflowCount:0},n=t.netDirection.includes("INFLOW")?"flow-inflow":t.netDirection.includes("OUTFLOW")?"flow-outflow":"flow-neutral",i=e.etfs.map(c=>`
      <tr class="etf-row ${vt(c.direction)}">
        <td class="etf-ticker">${l(c.ticker)}</td>
        <td class="etf-issuer">${l(c.issuer)}</td>
        <td class="etf-flow ${vt(c.direction)}">${c.direction==="inflow"?"+":c.direction==="outflow"?"-":""}$${ee(Math.abs(c.estFlow))}</td>
        <td class="etf-volume">${ee(c.volume)}</td>
        <td class="etf-change ${ps(c.priceChange)}">${c.priceChange>0?"+":""}${c.priceChange.toFixed(2)}%</td>
      </tr>
    `).join(""),r=`
      <div class="etf-flows-container">
        <div class="etf-summary ${n}">
          <div class="etf-summary-item">
            <span class="etf-summary-label">${d("components.etfFlows.netFlow")}</span>
            <span class="etf-summary-value ${n}">${t.netDirection.includes("INFLOW")?d("components.etfFlows.netInflow"):d("components.etfFlows.netOutflow")}</span>
          </div>
          <div class="etf-summary-item">
            <span class="etf-summary-label">${d("components.etfFlows.estFlow")}</span>
            <span class="etf-summary-value">$${ee(Math.abs(t.totalEstFlow))}</span>
          </div>
          <div class="etf-summary-item">
            <span class="etf-summary-label">${d("components.etfFlows.totalVol")}</span>
            <span class="etf-summary-value">${ee(t.totalVolume)}</span>
          </div>
          <div class="etf-summary-item">
            <span class="etf-summary-label">${d("components.etfFlows.etfs")}</span>
            <span class="etf-summary-value">${t.inflowCount}↑ ${t.outflowCount}↓</span>
          </div>
        </div>
        <div class="etf-table-wrap">
          <table class="etf-table">
            <thead>
              <tr>
                <th>${d("components.etfFlows.table.ticker")}</th>
                <th>${d("components.etfFlows.table.issuer")}</th>
                <th>${d("components.etfFlows.table.estFlow")}</th>
                <th>${d("components.etfFlows.table.volume")}</th>
                <th>${d("components.etfFlows.table.change")}</th>
              </tr>
            </thead>
            <tbody>${i}</tbody>
          </table>
        </div>
      </div>
    `;this.setSafeContent(S(r,"legacy Panel.setContent() migration"))}}const ei=Object.freeze(Object.defineProperty({__proto__:null,ETFFlowsPanel:ms},Symbol.toStringTag,{value:"Module"}));function te(a){return a>=1e12?`$${(a/1e12).toFixed(1)}T`:a>=1e9?`$${(a/1e9).toFixed(1)}B`:a>=1e6?`$${(a/1e6).toFixed(0)}M`:`$${a.toLocaleString()}`}function us(a){return a==="ON PEG"?"peg-on":a==="SLIGHT DEPEG"?"peg-slight":"peg-off"}function fs(a){return a==="HEALTHY"?"health-good":a==="CAUTION"?"health-caution":"health-warning"}class vs extends k{constructor(){super({id:"stablecoins",title:d("panels.stablecoins"),showCount:!1,infoTooltip:d("components.stablecoins.infoTooltip")});x(this,"data",null);x(this,"loading",!0);x(this,"error",null)}async fetchData(){var t;const e=z("stablecoinMarkets");if((t=e==null?void 0:e.stablecoins)!=null&&t.length){this.data=e,this.error=null,this.loading=!1,this.renderPanel(),this.refreshFromRpc();return}await this.refreshFromRpc()}async refreshFromRpc(){var e,t,n;try{const r=await new yt(Le(),{fetch:bt}).listStablecoinMarkets({coins:[]});if(!((e=this.element)!=null&&e.isConnected))return;((t=r.stablecoins)!=null&&t.length||!this.data)&&(this.data=r,this.error=null,this.loading=!1,this.renderPanel())}catch(i){if(this.isAbortError(i)||!((n=this.element)!=null&&n.isConnected))return;this.data||(console.warn("[Stablecoin] Fetch error:",i),this.error=d("common.noDataShort"),this.loading=!1,this.renderPanel())}}renderPanel(){var r;if(this.loading){this.showLoading(d("common.loadingStablecoins"));return}if(this.error||!this.data){this.showError(this.error||d("common.noDataShort"),()=>void this.fetchData());return}const e=this.data;if(!((r=e.stablecoins)!=null&&r.length)){this.setSafeContent(_`<div class="panel-empty">${d("common.noDataShort")}</div>`);return}const t=e.summary||{totalMarketCap:0,totalVolume24h:0,healthStatus:"UNAVAILABLE"},n=M(e.stablecoins.map(o=>_`
      <div class="stable-row">
        <div class="stable-info">
          <span class="stable-symbol">${o.symbol}</span>
          <span class="stable-name">${o.name}</span>
        </div>
        <div class="stable-price">$${o.price.toFixed(4)}</div>
        <div class="stable-peg ${us(o.pegStatus)}">
          <span class="peg-badge">${o.pegStatus}</span>
          <span class="peg-dev">${o.deviation.toFixed(2)}%</span>
        </div>
      </div>
    `)),i=M(e.stablecoins.map(o=>_`
      <div class="stable-supply-row">
        <span class="stable-symbol">${o.symbol}</span>
        <span class="stable-mcap">${te(o.marketCap)}</span>
        <span class="stable-vol">${te(o.volume24h)}</span>
        <span class="stable-change ${o.change24h>=0?"change-positive":"change-negative"}">${o.change24h>=0?"+":""}${o.change24h.toFixed(2)}%</span>
      </div>
    `));this.setSafeContent(_`
      <div class="stablecoin-container">
        <div class="stable-health ${fs(t.healthStatus)}">
          <span class="health-label">${t.healthStatus}</span>
          <span class="health-detail">MCap: ${te(t.totalMarketCap)} | Vol: ${te(t.totalVolume24h)}</span>
        </div>
        <div class="stable-section">
          <div class="stable-section-title">${d("components.stablecoins.pegHealth")}</div>
          <div class="stable-peg-list">${n}</div>
        </div>
        <div class="stable-section">
          <div class="stable-section-title">${d("components.stablecoins.supplyVolume")}</div>
          <div class="stable-supply-header">
            <span>${d("components.stablecoins.token")}</span><span>${d("components.stablecoins.mcap")}</span><span>${d("components.stablecoins.vol24h")}</span><span>${d("components.stablecoins.chg24h")}</span>
          </div>
          <div class="stable-supply-list">${i}</div>
        </div>
      </div>
    `)}}const ti=Object.freeze(Object.defineProperty({__proto__:null,StablecoinPanel:vs},Symbol.toStringTag,{value:"Module"}));export{Vs as A,Ks as C,Ws as E,Us as F,Zs as G,Qs as L,Ls as M,qs as N,Js as P,zs as S,Bs as W,Ys as Y,Is as a,Os as b,js as c,Gs as d,Hs as e,Xs as f,ei as g,ti as h};
