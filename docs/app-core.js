(() => {
  "use strict";
  const B = window.BibLib;
  const CROSSREF_API="https://api.crossref.org/works",SS_MATCH="https://api.semanticscholar.org/graph/v1/paper/search/match",
    SS_SEARCH="https://api.semanticscholar.org/graph/v1/paper/search",SS_FIELDS="title,authors,year,venue,publicationVenue,externalIds",
    DBLP_API="https://dblp.org/search/pub/api",ARXIV_API="https://export.arxiv.org/api/query",
    OR_API="https://api2.openreview.net",MAX_RETRIES=2,RETRY_MS=800,FETCH_TIMEOUT=8000;

  const rS={ssD:300,crD:80,dblpD:200,arxivD:200,orD:300,cvfD:500,
    ssMn:200,ssMx:2000,crMn:50,crMx:1500,dblpMn:150,dblpMx:1500,arxivMn:150,arxivMx:1500,orMn:300,orMx:2000,cvfMn:300,cvfMx:3000,
    lSS:0,lCR:0,lDBLP:0,lArx:0,lOR:0,lCVF:0,ssOk:0,crOk:0,dblpOk:0,arxivOk:0,orOk:0,cvfOk:0};
  const rK={ss:{d:"ssD",mx:"ssMx",mn:"ssMn",ok:"ssOk",l:"lSS"},cr:{d:"crD",mx:"crMx",mn:"crMn",ok:"crOk",l:"lCR"},
    dblp:{d:"dblpD",mx:"dblpMx",mn:"dblpMn",ok:"dblpOk",l:"lDBLP"},arxiv:{d:"arxivD",mx:"arxivMx",mn:"arxivMn",ok:"arxivOk",l:"lArx"},
    or:{d:"orD",mx:"orMx",mn:"orMn",ok:"orOk",l:"lOR"},cvf:{d:"cvfD",mx:"cvfMx",mn:"cvfMn",ok:"cvfOk",l:"lCVF"}};
  function rBack(s){const k=rK[s];if(!k)return;rS[k.d]=Math.min(rS[k.d]*1.3,rS[k.mx]);rS[k.ok]=0;}
  function rSucc(s){const k=rK[s];if(!k)return;rS[k.ok]++;if(rS[k.ok]>=2){rS[k.d]=Math.max(rS[k.d]*0.85,rS[k.mn]);rS[k.ok]=0;}}
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  function gS(u){if(u.includes("semanticscholar.org"))return"ss";if(u.includes("crossref.org"))return"cr";if(u.includes("dblp.org"))return"dblp";if(u.includes("arxiv.org"))return"arxiv";if(u.includes("openreview.net"))return"or";if(u.includes("thecvf.com")||u.includes("ecva.net"))return"cvf";return"cr";}

  let _authErrCb=null;

  async function rF(url,{retries=MAX_RETRIES,is404=false,txt=false,headers={}}={}){
    const s=gS(url),k=rK[s],el=Date.now()-rS[k.l];if(el<rS[k.d])await sleep(rS[k.d]-el);rS[k.l]=Date.now();
    for(let a=0;a<=retries;a++){
      const ctrl=new AbortController(),tid=setTimeout(()=>ctrl.abort(),FETCH_TIMEOUT);
      try{
        const r=await fetch(url,{signal:ctrl.signal,headers});clearTimeout(tid);
        if(r.ok){rSucc(s);return txt?r.text():r.json();}
        if(r.status===404&&is404)return null;
        if((r.status===401||r.status===403)&&s==="ss"){_authErrCb?.(s,r.status);return null;}
        if(r.status===429){rBack(s);if(a<retries){await sleep(RETRY_MS*Math.pow(2,a));continue;}}
        return null;
      }catch(e){clearTimeout(tid);rBack(s);if(a<retries){await sleep(RETRY_MS*Math.pow(2,a));continue;}return null;}
    }return null;}

  function bU(b,p){const u=new URL(b);for(const[k,v]of Object.entries(p))u.searchParams.set(k,v);return u.toString();}

  async function searchSSMatch(t,h){const d=await rF(bU(SS_MATCH,{query:t,fields:SS_FIELDS}),{is404:true,headers:h});if(!d?.data?.[0])return null;return B.ssToStandard(d.data[0]);}
  async function searchSSSearch(t,h){const d=await rF(bU(SS_SEARCH,{query:t,limit:"5",fields:SS_FIELDS}),{headers:h});return(d?.data||[]).map(B.ssToStandard);}
  async function searchCrossref(t){const d=await rF(bU(CROSSREF_API,{"query.title":t,rows:"5",select:"title,author,published-print,published-online,container-title,volume,issue,page,DOI,publisher,URL,type"}));return(d?.message?.items||[]).map(B.crossrefToStandard);}
  async function searchDBLP(t){const d=await rF(bU(DBLP_API,{q:t,format:"json",h:"5"}));const h=d?.result?.hits?.hit;if(!h)return[];return(Array.isArray(h)?h:[h]).map(x=>B.dblpToStandard(x.info)).filter(Boolean);}
  async function searchArxiv(t){
    const xml=await rF(bU(ARXIV_API,{search_query:`ti:"${t}"`,start:"0",max_results:"5",sortBy:"relevance",sortOrder:"descending"}),{txt:true});
    if(!xml)return[];const papers=[],eR=/<entry>([\s\S]*?)<\/entry>/g;let em;
    while((em=eR.exec(xml))!==null){const ex=em[1],tM=/<title[^>]*>([\s\S]*?)<\/title>/i.exec(ex),iM=/<id>([\s\S]*?)<\/id>/i.exec(ex),pM=/<published>([\s\S]*?)<\/published>/i.exec(ex);
      const aR=/<author>\s*<name>([\s\S]*?)<\/name>\s*<\/author>/g,auths=[];let am;while((am=aR.exec(ex))!==null)auths.push(am[1].trim());
      const aid=(iM?.[1]||"").replace(/^https?:\/\/arxiv\.org\/abs\//i,"").replace(/v\d+$/i,""),pt=(tM?.[1]||"").replace(/\s+/g," ").trim(),yr=pM?pM[1].slice(0,4):"";
      papers.push({title:pt,author:auths.map(n=>{const p=n.split(/\s+/).filter(Boolean);return p.length>=2?`${p[p.length-1]}, ${p.slice(0,-1).join(" ")}`:n;}).join(" and "),year:yr,journal:aid?`arXiv preprint arXiv:${aid}`:"arXiv preprint",volume:"",number:"",pages:"",doi:aid?`10.48550/arXiv.${aid}`:"",publisher:"",url:aid?`https://arxiv.org/abs/${aid}`:(iM?.[1]||""),_source:"arxiv"});}return papers;}
  async function searchOR(t){try{const d=await rF(bU(`${OR_API}/notes`,{"content.title":t,limit:"5",details:"replies"}));return(d?.notes||[]).map(n=>B.openreviewToStandard(n)).filter(p=>p.title);}catch{return[];}}
  async function searchCVF(e){const ci=B.cvfConfFromEntry(e);if(!ci)return[];try{const h=await rF(ci.url,{txt:true});return h?B.cvfPageToCandidates(h,ci):[];}catch{return[];}}

  function hasStrongPublished(candidates,ct){
    return candidates.some(c=>!B.isArxivCandidate(c)&&B.classifyVersion(c)!=="preprint"&&B.titleSimilarity(ct,c.title||"")>=B.TITLE_MATCH_THRESHOLD);}

  async function lookupTiered(title,entry,logFn,getEngines,getApiKey){
    const enabled=new Set(getEngines()),ct=B.stripLatex(title);
    const ssKey=getApiKey?getApiKey("semantic_scholar"):"";
    const ssH=ssKey?{"x-api-key":ssKey}:{};
    const allCandidates=[],seen=new Set();
    function addCandidates(list){for(const c of list){const k=(B.normalizeTitle(c.title||""))+"||"+(c._source||"");if(!seen.has(k)){seen.add(k);allCandidates.push(c);}}}
    function finalize(){const ranked=rankCandidates(entry,ct,allCandidates).slice(0,8);if(!ranked.length){logFn("warning",`Not found: ${ct.slice(0,50)}`);return{best:null,candidates:[]};}return{best:ranked[0],candidates:ranked};}

    // ── Tier 1: DBLP + CrossRef + SS in parallel ──────────────────
    const t1Tasks=[];
    if(enabled.has("dblp"))t1Tasks.push(searchDBLP(ct).then(r=>{logFn("query",`T1 DBLP: ${ct.slice(0,55)}`);return r;}).catch(()=>[]));
    if(enabled.has("crossref"))t1Tasks.push(searchCrossref(ct).then(r=>{logFn("query",`T1 CrossRef: ${ct.slice(0,55)}`);return r;}).catch(()=>[]));
    if(enabled.has("semantic_scholar"))t1Tasks.push((async()=>{
      logFn("query",`T1 S2: ${ct.slice(0,55)}`);
      const sm=await searchSSMatch(ct,ssH);
      if(sm&&B.titleSimilarity(ct,sm.title||"")>=B.MIN_TITLE_SIM)return[sm];
      return searchSSSearch(ct,ssH).catch(()=>[]);
    })());

    const t1Results=await Promise.all(t1Tasks);
    const t1=t1Results.flat();
    addCandidates(t1);

    if(hasStrongPublished(allCandidates,ct)){
      logFn("success",`Published T1: ${(rankCandidates(entry,ct,allCandidates)[0]?.title||"").slice(0,50)}`);
      return finalize();}

    const t1HasMatch=!!B.bestMatch(t1,ct);
    if(t1HasMatch)logFn("success",`Found T1: ${(B.bestMatch(t1,ct)?.title||"").slice(0,50)}`);

    // ── Tier 2: CVF + OpenReview in parallel ─────────────────────────
    const t2Tasks=[];
    if(enabled.has("cvf"))t2Tasks.push(searchCVF(entry).then(r=>{logFn("query",`T2 CVF: ${ct.slice(0,55)}`);return r;}).catch(()=>[]));
    if(enabled.has("openreview"))t2Tasks.push(searchOR(ct).then(r=>{logFn("query",`T2 OR: ${ct.slice(0,55)}`);return r;}).catch(()=>[]));
    if(t2Tasks.length){
      const t2=((await Promise.all(t2Tasks)).flat());
      addCandidates(t2);
      if(hasStrongPublished(allCandidates,ct)){
        logFn("success",`Published T2: ${(rankCandidates(entry,ct,allCandidates)[0]?.title||"").slice(0,50)}`);
        return finalize();}
      const t2HasMatch=!!B.bestMatch(t2,ct);
      if(t2HasMatch)logFn("success",`Found T2: ${(B.bestMatch(t2,ct)?.title||"").slice(0,50)}`);}

    // ── Tier 3: ArXiv — only if no confident match yet ────────────────
    if(enabled.has("arxiv")&&!B.bestMatch(allCandidates,ct)){
      logFn("query",`T3 ArXiv: ${ct.slice(0,55)}`);
      const ar=await searchArxiv(ct).catch(()=>[]);
      addCandidates(ar);
      const ab=B.bestMatch(ar,ct);if(ab)logFn("success",`ArXiv: ${(ab.title||"").slice(0,50)}`);}

    return finalize();}

  function rankCandidates(entry,ct,candidates){
    const oy=parseInt(entry.year||"0",10);
    const isPub=c=>!B.isArxivCandidate(c)&&B.classifyVersion(c)!=="preprint";
    return[...candidates].sort((a,b)=>{
      const tsA=B.titleSimilarity(ct,a.title||""),tsB=B.titleSimilarity(ct,b.title||"");
      if(Math.abs(tsB-tsA)>0.5)return tsB-tsA;
      // tiebreak 1: published before preprint
      const pA=isPub(a)?1:0,pB=isPub(b)?1:0;
      if(pB!==pA)return pB-pA;
      // tiebreak 2: closer year
      if(oy>0){const dyA=a.year?Math.abs(parseInt(a.year,10)-oy):999,dyB=b.year?Math.abs(parseInt(b.year,10)-oy):999;if(dyA!==dyB)return dyA-dyB;}
      return tsB-tsA;
    });}

  function selBest(o,cs){if(!cs.length)return null;if(cs.length===1)return cs[0];const oy=parseInt(o.year||"0",10),s=[...cs];
    if(oy>0)s.sort((a,b)=>Math.abs(parseInt(a.year||"0",10)-oy)-Math.abs(parseInt(b.year||"0",10)-oy));
    else{const ot=B.normalizeTitle(o.title||"");s.sort((a,b)=>B.titleSimilarity(ot,b.title||"")-B.titleSimilarity(ot,a.title||""));}return s[0];}
  window.BibVerify={lookupTiered,rS,rK,rBack,rSucc,setAuthErrCb(cb){_authErrCb=cb;}};
})();
