function i(t,s=15){const e=t().slice(0,s);return e.length===0?"":`Recent News:
`+e.map(n=>`- ${n.title} (${n.source})`).join(`
`)}export{i as b};
