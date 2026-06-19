/*
 * Moteur de conformite soutage ISO 8217, port JavaScript du PoC Python.
 * Tourne integralement dans le navigateur : aucune donnee ne quitte la machine.
 * Parite verifiee avec bunkering_poc (Python) sur les rapports reels.
 */
(function (root) {
  "use strict";

  // ---------------------------------------------------------------- parametres
  const CATALOG = [
    ["density_15c","Densite @ 15C","kg/m3","numeric","common",["density","density @ 15c","density@15c","density at 15c","density 15c","density @15c"]],
    ["viscosity_40c","Viscosite @ 40C","cSt","numeric","distillate",["k viscosity at 40c","viscosity at 40c","viscosity 40c","viscosity (40c)","kinematic viscosity at 40c","viscosity@40c"]],
    ["viscosity_50c","Viscosite @ 50C","cSt","numeric","residual",["viscosity at 50c","viscosity 50c","viscosity @50c","kinematic viscosity at 50c","viscosity@50c"]],
    ["viscosity_100c","Viscosite @ 100C","cSt","calculated","residual",["viscosity at 100c","viscosity 100c"]],
    ["flash_point","Point d'eclair","degC","numeric","common",["flash","flash pt","flashpoint","flash point pmcc"]],
    ["pour_point","Point d'ecoulement","degC","numeric","common",["pour pt","pourpoint"]],
    ["cloud_point","Point de trouble","degC","numeric","distillate",["cloud pt"]],
    ["cfpp","CFPP","degC","numeric","distillate",["cold filter plugging point"]],
    ["micro_carbon_residue","Residu carbone micro","%m/m","numeric","common",["mcr","mcr 10%","micro carbon residue (10%)","micro carbon residue","carbon residue micro method","ccr","conradson carbon","micro carbon residue 10%","mcr10%"]],
    ["ash","Cendres","%m/m","numeric","common",["ash content","ash content at 550c","ash content at 775c"]],
    ["water","Eau","%v/v","numeric","common",["water content","water content by ke","moisture"]],
    ["sulphur","Soufre","%m/m","numeric","common",["sulfur","sulphur content","sulfur content","sulphur (s)"]],
    ["total_sediment","Sediment total","%m/m","numeric","residual",["total sediment potential","total sediment aged","tsp","tsa","total sediment accelerated","total sediment acc","sediment"]],
    ["vanadium","Vanadium","mg/kg","numeric","metal",["v"]],
    ["sodium","Sodium","mg/kg","numeric","metal",["na"]],
    ["aluminium","Aluminium","mg/kg","numeric","metal",["aluminum","al"]],
    ["silicon","Silicium","mg/kg","numeric","metal",["si"]],
    ["aluminium_silicon","Aluminium + Silicium (catfines)","mg/kg","numeric","residual",["al+si","al + si","aluminium + silicon","aluminum + silicon","al+si (catfines)","aluminium+silicon","catfines","al/si"]],
    ["iron","Fer","mg/kg","numeric","metal",["fe"]],
    ["nickel","Nickel","mg/kg","numeric","metal",["ni"]],
    ["calcium","Calcium","mg/kg","numeric","metal",["ca"]],
    ["zinc","Zinc","mg/kg","numeric","metal",["zn"]],
    ["phosphorus","Phosphore","mg/kg","numeric","metal",["phosphorous","p"]],
    ["potassium","Potassium","mg/kg","numeric","metal",["k"]],
    ["magnesium","Magnesium","mg/kg","numeric","metal",["mg"]],
    ["lead","Plomb","mg/kg","numeric","metal",["pb"]],
    ["ccai","CCAI","-","calculated","residual",["ccai (ignition quality)","calculated carbon aromaticity index"]],
    ["cetane_index","Indice de cetane","-","numeric","distillate",["calculated cetane index","cci"]],
    ["acid_number","Indice d'acide","mg KOH/g","numeric","common",["tan","total acid number","strong acid number","san"]],
    ["net_specific_energy","Energie specifique nette","MJ/kg","calculated","common",["nse","net calorific value","ncv"]],
    ["gross_specific_energy","Energie specifique brute","MJ/kg","calculated","common",["gse","gross calorific value","gcv"]],
    ["api_gravity","Densite API","-","calculated","common",["api"]],
    ["fame","FAME","%v/v","numeric","common",["fame content","biofuel ratio","biofuel","biodiesel"]],
    ["appearance","Apparence","-","qualitative","common",["visual"]],
    ["colour","Couleur","-","qualitative","common",["color"]],
    ["estimated_fame_number","EFN","-","calculated","common",["efn","engine friendliness number"]],
  ].map(a => ({key:a[0],label:a[1],unit:a[2],kind:a[3],family:a[4],aliases:a[5]}));

  const BY_KEY = {};
  CATALOG.forEach(p => { BY_KEY[p.key] = p; });

  const UNIT_HINTS = ["kg","cst","mm2","%","mg","mj","koh","index","ppm","degc","v/v","m/m","iep","60ml","mod"];
  function looksLikeUnit(s){ s=s.toLowerCase(); return UNIT_HINTS.some(h=>s.indexOf(h)>=0); }

  function normalizeLabel(text){
    if(!text) return "";
    let t = text.normalize("NFKD").replace(/[̀-ͯ]/g,"");
    t = t.toLowerCase().replace(/°/g,"");
    t = t.replace("@ 15.0","@ 15").replace("@ 50.0","@ 50").replace("@ 40.0","@ 40");
    t = t.replace(/\*+/g,"");
    t = t.replace(/\(([^)]*)\)/g, (m,inner)=> looksLikeUnit(inner) ? "" : m);
    t = t.replace(/deg c/g,"c").replace(/degc/g,"c");
    t = t.replace(/[\s_]+/g," ").replace(/^[\s:-]+|[\s:-]+$/g,"");
    return t;
  }

  const ALIAS_INDEX = {};
  CATALOG.forEach(p => {
    ALIAS_INDEX[normalizeLabel(p.label)] = p.key;
    ALIAS_INDEX[normalizeLabel(p.key.replace(/_/g," "))] = p.key;
    p.aliases.forEach(a => { ALIAS_INDEX[normalizeLabel(a)] = p.key; });
  });

  function resolveParam(raw){
    if(!raw) return null;
    const norm = normalizeLabel(raw);
    if(ALIAS_INDEX[norm]) return BY_KEY[ALIAS_INDEX[norm]];
    const compact = norm.replace(/ /g,"");
    for(const an in ALIAS_INDEX){ if(an.replace(/ /g,"")===compact) return BY_KEY[ALIAS_INDEX[an]]; }
    return null;
  }

  // ---------------------------------------------------------------- operateurs
  const NUMCORE = "[-+]?\\d[\\d.,]*\\d|[-+]?\\d";
  const OPMAP = {"<":"<","≤":"<=","<=":"<=",">":">","≥":">=",">=":">="};
  const QUALI_HINTS = ["clear","bright","blue","in progress","pass","caution","not stated","n/a","na","nil","intact","yes","no","red","green","amber"];

  function toFloat(s){
    s = String(s).trim().replace(/\s/g,"");
    if(/^[-+]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g,"");
    else s = s.replace(/,/g,".");
    s = s.replace(/%+$/,"");
    const v = parseFloat(s);
    return isNaN(v) ? null : v;
  }

  function parseMeasurement(raw){
    if(raw==null) return {raw:"",operator:null,value:null,text:null};
    const s = String(raw).trim();
    if(!s) return {raw:s,operator:null,value:null,text:null};
    const low = s.toLowerCase();
    let m = s.match(new RegExp("(<=|>=|≤|≥|<|>)\\s*("+NUMCORE+")"));
    if(m) return {raw:s,operator:OPMAP[m[1]]||"=",value:toFloat(m[2]),text:null};
    m = s.match(new RegExp("^\\s*("+NUMCORE+")\\s*(?:%|ppm|mg\\/kg)?\\s*$"));
    if(m) return {raw:s,operator:"=",value:toFloat(m[1]),text:null};
    m = s.match(new RegExp("("+NUMCORE+")"));
    if(m && !["clear","bright","progress","intact"].some(h=>low.indexOf(h)>=0))
      return {raw:s,operator:"=",value:toFloat(m[1]),text:null};
    if(QUALI_HINTS.some(h=>low.indexOf(h)>=0) || s)
      return {raw:s,operator:null,value:null,text:s};
    return {raw:s,operator:null,value:null,text:null};
  }

  function parseLimit(raw){
    if(raw==null) return {min:null,max:null,raw:null};
    const s = String(raw).trim();
    if(!s || ["-","n/a","na","NOT STATED"].indexOf(s)>=0) return {min:null,max:null,raw:s||null};
    let lo=null, hi=null;
    const rng = s.match(new RegExp("("+NUMCORE+")\\s*[-–]\\s*("+NUMCORE+")"));
    if(rng && !/min/i.test(s) && !/max/i.test(s)){
      const a=toFloat(rng[1]), b=toFloat(rng[2]);
      if(a!=null && b!=null) return {min:Math.min(a,b),max:Math.max(a,b),raw:s};
    }
    let mm;
    const r1 = new RegExp("(min|max)\\.?\\s*[:=]?\\s*("+NUMCORE+")","ig");
    while((mm=r1.exec(s))){ if(mm[1].toLowerCase()==="min") lo=toFloat(mm[2]); else hi=toFloat(mm[2]); }
    const r2 = new RegExp("("+NUMCORE+")\\s*\\(?\\s*(min|max)\\.?\\s*\\)?","ig");
    while((mm=r2.exec(s))){ const k=mm[2].toLowerCase(); if(k==="min"&&lo==null)lo=toFloat(mm[1]); else if(k==="max"&&hi==null)hi=toFloat(mm[1]); }
    if(lo==null && hi==null){ const m=s.match(new RegExp("^\\s*("+NUMCORE+")\\s*%?\\s*$")); if(m) hi=toFloat(m[1]); }
    return {min:lo,max:hi,raw:s};
  }

  // ---------------------------------------------------------------- ISO 8217
  const DEFAULT_REVISION = "2017";
  function normalizeRevision(rev){ if(!rev) return DEFAULT_REVISION; const m=String(rev).match(/(2005|2010|2012|2017|2024)/); return m?m[1]:DEFAULT_REVISION; }

  const DISTILLATE_ALIASES = {DMX:"DMX",DMA:"DMA",DMZ:"DMZ",DMB:"DMB",LSMGO:"DMA",LSDMA:"DMA",MGO:"DMA",MDO:"DMB",LSGO:"DMA",LSDMB:"DMB",ULSDMA:"DMA"};
  const RESIDUAL_DENSITY = {RMA:920.0,RMB:960.0,RMD:975.0,RME:991.0,RMG:991.0,RMK:1010.0};

  function resolveGrade(gradeStr, productType){
    const blob = [gradeStr,productType].filter(Boolean).join(" ").toUpperCase();
    const compact = blob.replace(/[\s:_-]+/g,"");
    let m = blob.match(/(RM[ABDEGK])\s*[:\-]?\s*(\d{2,3})/);
    if(m) return {family:"residual",base:m[1],viscosity_max:parseFloat(m[2]),label:m[1]+parseInt(m[2])};
    if(compact.indexOf("RM")>=0){ for(const fam in RESIDUAL_DENSITY){ if(compact.indexOf(fam)>=0) return {family:"residual",base:fam,viscosity_max:null,label:fam}; } }
    for(const al in DISTILLATE_ALIASES){ if(compact.indexOf(al)>=0) return {family:"distillate",base:DISTILLATE_ALIASES[al],viscosity_max:null,label:al}; }
    const pt=(productType||"").toUpperCase();
    if(["VLSFO","HSFO","ULSFO","IFO","HFO"].some(k=>pt.indexOf(k)>=0||blob.indexOf(k)>=0)) return {family:"residual",base:"RMG",viscosity_max:380.0,label:"RMG380(assumed)"};
    if(["MGO","MDO","DISTILLATE","GASOIL","GAS OIL"].some(k=>pt.indexOf(k)>=0||blob.indexOf(k)>=0)) return {family:"distillate",base:"DMA",viscosity_max:null,label:"DMA(assumed)"};
    return null;
  }

  const DISTILLATE_BASE = {
    DMX:{viscosity_40c:[1.4,5.5],flash_point:[43,null],pour_point:[null,-6],cetane_index:[45,null],micro_carbon_residue:[null,0.30],ash:[null,0.010],acid_number:[null,0.5]},
    DMA:{viscosity_40c:[2.0,6.0],density_15c:[null,890],flash_point:[60,null],pour_point:[null,0],cetane_index:[40,null],micro_carbon_residue:[null,0.30],ash:[null,0.010],acid_number:[null,0.5]},
    DMZ:{viscosity_40c:[3.0,6.0],density_15c:[null,890],flash_point:[60,null],pour_point:[null,0],cetane_index:[40,null],micro_carbon_residue:[null,0.30],ash:[null,0.010],acid_number:[null,0.5]},
    DMB:{viscosity_40c:[2.0,11.0],density_15c:[null,900],flash_point:[60,null],pour_point:[null,6],cetane_index:[35,null],micro_carbon_residue:[null,0.30],ash:[null,0.010],water:[null,0.30],acid_number:[null,0.5],total_sediment:[null,0.10]},
  };
  function residualBase(densityMax){
    return {density_15c:[null,densityMax],micro_carbon_residue:[null,18.0],ash:[null,0.100],water:[null,0.50],total_sediment:[null,0.10],vanadium:[null,350],sodium:[null,100],aluminium_silicon:[null,60],calcium:[null,30],zinc:[null,15],phosphorus:[null,15],ccai:[null,870],flash_point:[60,null],pour_point:[null,30],acid_number:[null,2.5]};
  }
  const RESIDUAL_OVERRIDE = {
    RMA:{micro_carbon_residue:[null,2.5],vanadium:[null,50],aluminium_silicon:[null,25],total_sediment:[null,0.10],ccai:[null,850]},
    RMB:{micro_carbon_residue:[null,10.0],vanadium:[null,150],aluminium_silicon:[null,40],ccai:[null,860]},
    RMD:{micro_carbon_residue:[null,14.0],ash:[null,0.070],vanadium:[null,150],aluminium_silicon:[null,40],ccai:[null,860]},
    RME:{micro_carbon_residue:[null,15.0],vanadium:[null,150],aluminium_silicon:[null,50],ccai:[null,860]},
    RMG:{},
    RMK:{vanadium:[null,450],ccai:[null,870]},
  };
  const REV2005 = {ash:[null,0.150],vanadium_RMG:[null,300],vanadium_RMK:[null,600],aluminium_silicon:[null,80]};

  function limitsFor(grade, revision){
    const rev = normalizeRevision(revision);
    const out = {};
    let table;
    if(grade.family==="distillate"){
      table = Object.assign({}, DISTILLATE_BASE[grade.base]||DISTILLATE_BASE.DMA);
    } else {
      table = residualBase(RESIDUAL_DENSITY[grade.base]||991.0);
      Object.assign(table, RESIDUAL_OVERRIDE[grade.base]||{});
      if(grade.viscosity_max!=null) table.viscosity_50c=[null,grade.viscosity_max];
      if(rev==="2005"){
        table.ash=REV2005.ash; table.aluminium_silicon=REV2005.aluminium_silicon;
        const vk="vanadium_"+grade.base; if(REV2005[vk]) table.vanadium=REV2005[vk];
      }
    }
    for(const key in table){ out[key]={min:table[key][0],max:table[key][1],raw:"ISO8217:"+rev+" "+grade.base}; }
    return out;
  }

  function inferSulphurMax(gradeStr, productType, sulphurGrade){
    const blob = [gradeStr,productType,sulphurGrade].filter(Boolean).join(" ").toUpperCase();
    const m = blob.match(/(\d+\.\d+)\s*%/);
    if(m) return [parseFloat(m[1]), "declared "+m[1]+"%"];
    if(blob.indexOf("ULS")>=0||blob.indexOf("ULSFO")>=0) return [0.10,"tag ULS"];
    if(blob.indexOf("VLSFO")>=0||blob.indexOf("0.5")>=0||blob.indexOf("LSMGO")>=0||(" "+blob).indexOf(" LS")>=0) return [0.50,"tag VLSFO/LS"];
    if(blob.indexOf("HSFO")>=0||blob.indexOf("HFO")>=0) return [3.50,"tag HSFO"];
    return [null,"statutory (PO-driven)"];
  }

  // ---------------------------------------------------------------- conformite
  const WARN_MARGIN = 0.05;
  function withinMargin(value, limit){ if(limit===0) return Math.abs(value)<=WARN_MARGIN; return Math.abs(limit-value)/Math.abs(limit)<=WARN_MARGIN; }

  function evaluateValue(operator, value, limit){
    if(value==null) return {verdict:"qualitative",severity:"ok",rationale:"valeur qualitative"};
    if(!limit || (limit.min==null && limit.max==null)) return {verdict:"no_limit",severity:"ok",rationale:"parametre informatif, pas de seuil ISO"};
    const op = operator||"=";
    const lo=limit.min, hi=limit.max;
    const fails=[], warns=[], notes=[];
    if(hi!=null){
      if(op==="="){ if(value>hi) fails.push(value+" > max "+hi); else if(withinMargin(value,hi)) warns.push(value+" proche du max "+hi); }
      else if(op==="<"){ if(value<=hi) notes.push("<"+value+" <= max "+hi); else return {verdict:"indeterminate",severity:"warning",rationale:"<"+value+" avec max "+hi+" : conclusion incertaine"}; }
      else if(op==="<="){ if(value<=hi) notes.push("<="+value+" <= max "+hi); else return {verdict:"indeterminate",severity:"warning",rationale:"<="+value+" avec max "+hi}; }
      else if(op===">"){ if(value>=hi) fails.push(">"+value+" >= max "+hi); else return {verdict:"indeterminate",severity:"warning",rationale:">"+value+" avec max "+hi}; }
      else if(op===">="){ if(value>hi) fails.push(">="+value+" > max "+hi); }
    }
    if(lo!=null){
      if(op==="="){ if(value<lo) fails.push(value+" < min "+lo); else if(withinMargin(value,lo)) warns.push(value+" proche du min "+lo); }
      else if(op===">"){ if(value>=lo) notes.push(">"+value+" >= min "+lo); else return {verdict:"indeterminate",severity:"warning",rationale:">"+value+" avec min "+lo}; }
      else if(op===">="){ if(value>=lo) notes.push(">="+value+" >= min "+lo); }
      else if(op==="<"){ if(value<=lo) fails.push("<"+value+" <= min "+lo); else return {verdict:"indeterminate",severity:"warning",rationale:"<"+value+" avec min "+lo}; }
      else if(op==="<="){ if(value<lo) fails.push("<="+value+" < min "+lo); }
    }
    if(fails.length) return {verdict:"fail",severity:"out_of_spec",rationale:fails.join("; ")};
    if(warns.length) return {verdict:"pass",severity:"warning",rationale:warns.join("; ")};
    return {verdict:"pass",severity:"ok",rationale:notes.join("; ")||"dans les limites"};
  }

  function evaluateReport(report, revision){
    const rev = normalizeRevision(revision||report.iso_revision);
    if(report.iso_revision==null){ report.iso_revision=rev; report.iso_revision_source=report.iso_revision_source||"default"; }
    const grade = resolveGrade(report.grade_ordered, null);
    const isoLimits = grade ? limitsFor(grade, rev) : {};
    const sm = inferSulphurMax(report.grade_ordered, null, null);
    if(sm[0]!=null) isoLimits.sulphur={min:null,max:sm[0],raw:"sulphur cap ("+sm[1]+")"};
    let oos=0, warn=0;
    report.parameters.forEach(pr => {
      const canon = resolveParam(pr.raw_label);
      if(canon){ pr.canonical_key=canon.key; pr.unit=pr.unit||canon.unit; }
      if(report.report_type!=="quality"){ pr.verdict="no_limit"; return; }
      const limit = pr.canonical_key ? isoLimits[pr.canonical_key] : null;
      if(limit){ pr.iso_limit_min=limit.min; pr.iso_limit_max=limit.max; }
      if(pr.canonical_key==null){ pr.verdict="unknown_param"; pr.severity="ok"; pr.rationale="parametre non resolu"; }
      else { const ev=evaluateValue(pr.operator,pr.value,limit||{min:null,max:null}); pr.verdict=ev.verdict; pr.severity=ev.severity; pr.rationale=ev.rationale; }
      if(pr.severity==="out_of_spec") oos++; else if(pr.severity==="warning") warn++;
    });
    report.out_of_spec_count=oos; report.warning_count=warn;
    report.overall_severity = oos?"out_of_spec":(warn?"warning":"ok");
    return report;
  }

  // ---------------------------------------------------------------- text layer
  const METHOD_RE = /\b(?:ISO|ASTM|IP|LP|INT|EN|DIN)\s?-?\s?[A-Z]?\d{2,5}[A-Za-z0-9:.\-]*(?:\s?\(mod\))?|\bVISUAL\b|\bVisual\b|\bCalculated\b|\bCalculation\b/gi;
  const UNIT_ALT = ["kg/m3","kg/m³","kg/l","mm2/s","mm²/s","cSt(?:@\\d+\\S*)?","MJ/kg","mg\\s?KOH/g","mgKOH/g","mg/kg","%\\s?\\(?\\s?m/m\\s?\\)?","%\\s?\\(?\\s?v/v\\s?\\)?","%\\s?\\(?\\s?V/V\\s?\\)?","%\\s?mass","%\\s?vol","°C","degC","Index"];
  const UNIT_RE = new RegExp("(?:"+UNIT_ALT.join("|")+")","g");
  const NUM_RE_G = /(?<op>[<>]=?)?\s*(?<num>[-+]?\d[\d.]*)/g;
  const TRAIL_METHOD = /\b(?:ASTM|ISO|IP|LP|INT|EN|DIN|Calc|Calculated|Visual)\b\s*$/i;
  const DEFAULT_STOP = ["previous test results","vessel past bunkering","comparison with previous","general statistics","stats appendix","comparison of current","port history","previous three bunker","additional test results"];

  function columnUnit(line){
    UNIT_RE.lastIndex=0; let m;
    while((m=UNIT_RE.exec(line))){ const u=m[0]; if((u==="°C"||u==="degC") && m.index>0 && /\d/.test(line[m.index-1])) continue; return [m.index, m.index+u.length]; }
    return null;
  }
  function stripLabel(s){ s=s.replace(/^[\s:*\-†°()]+|[\s:*\-†°()]+$/g,""); s=s.replace(TRAIL_METHOD,"").replace(/^[\s:*\-†°()]+|[\s:*\-†°()]+$/g,""); return s; }

  function chooseValue(valuePosition, unitSpan, methodSpan, nums){
    if(!nums.length) return null;
    let chosen;
    if(valuePosition==="last") chosen=nums[nums.length-1];
    else if(valuePosition==="before_unit" && unitSpan){ const before=nums.filter(n=>n.end<=unitSpan[0]+1); chosen=before.length?before[before.length-1]:nums[0]; }
    else if(valuePosition==="before_unit") chosen=nums[0];
    else { if(unitSpan){ const after=nums.filter(n=>n.start>=unitSpan[1]-1); chosen=after.length?after[0]:nums[nums.length-1]; } else chosen=nums[0]; }
    if(methodSpan && methodSpan[0]<=chosen.start && chosen.start<methodSpan[1]){ const rest=nums.filter(n=>!(methodSpan[0]<=n.start && n.start<methodSpan[1])); if(rest.length) chosen=(valuePosition==="last")?rest[rest.length-1]:rest[0]; }
    return [(chosen.op+chosen.num).trim(), [chosen.start,chosen.end]];
  }

  function parseRows(pages, opts){
    opts = opts||{};
    const valuePosition = opts.valuePosition||"after_unit";
    const startMarker = opts.startMarker||null;
    const stopMarkers = opts.stopMarkers||DEFAULT_STOP;
    const readings=[], seen={};
    let flat=[];
    pages.forEach(ch => { flat=flat.concat(String(ch).split(/\r?\n/)); });
    let started = startMarker==null;
    for(let raw of flat){
      const line = raw.replace(/�/g,"°").replace(/\s+$/,"");
      const low = line.toLowerCase().trim();
      if(!low) continue;
      if(!started){ if(low.indexOf(startMarker)>=0) started=true; continue; }
      if(stopMarkers.some(mk=>low.indexOf(mk)>=0)) break;

      let methodSpan=null; METHOD_RE.lastIndex=0; let mm, last=null; while((mm=METHOD_RE.exec(line))) last=mm; if(last) methodSpan=[last.index,last.index+last[0].length];
      const unitSpan = columnUnit(line);
      const nums=[]; NUM_RE_G.lastIndex=0; let nm;
      while((nm=NUM_RE_G.exec(line))){ if(nm[0].trim()==="") { NUM_RE_G.lastIndex++; continue; } nums.push({op:nm.groups.op||"",num:nm.groups.num,start:nm.index,end:nm.index+nm[0].length}); }

      const found = chooseValue(valuePosition, unitSpan, methodSpan, nums);
      let cut;
      if(valuePosition==="before_unit" && found) cut=found[1][0];
      else { const cands=[methodSpan,unitSpan].filter(Boolean).map(s=>s[0]); if(cands.length) cut=Math.min.apply(null,cands); else cut=found?found[1][0]:(nums.length?nums[0].start:null); }
      if(cut==null) continue;
      const label = stripLabel(line.slice(0,cut));
      const canon = resolveParam(label);
      if(!canon || seen[canon.key]) continue;

      if(canon.key==="appearance"||canon.key==="colour"||canon.key==="color"||canon.kind==="qualitative"){
        let tail=line.slice(cut).replace(METHOD_RE,"").replace(/^[\s:-]+|[\s:-]+$/g,"");
        const meas=parseMeasurement(tail);
        readings.push(mkReading(label,meas,null,canon.unit,null)); seen[canon.key]=1; continue;
      }
      if(!found) continue;
      const meas=parseMeasurement(found[0]);
      if(meas.value==null) continue;
      const method = last? last[0].trim():null;
      const unit = unitSpan? line.slice(unitSpan[0],unitSpan[1]).trim() : canon.unit;
      readings.push(mkReading(label,meas,method,unit,null));
      seen[canon.key]=1;
    }
    return readings;
  }

  function mkReading(rawLabel, meas, method, unit, labLimit){
    return {canonical_key:null,raw_label:rawLabel,method:method||null,unit:unit||null,
      raw_value:meas.raw,operator:meas.operator,value:meas.value,text_value:meas.text,
      lab_limit_raw:labLimit||null,iso_limit_min:null,iso_limit_max:null,
      verdict:"unknown_param",severity:"ok",rationale:null};
  }

  // ---------------------------------------------------------------- labos
  function grab(text, re){ const m=text.match(re); return m?m[1].trim():null; }
  function findImo(text){ const m=text.match(/\b(\d{7})\b/); return m?m[1]:null; }
  function clean(s){ if(!s) return null; s=s.replace(/^[\s:,\-]+|[\s:,\-]+$/g,"").trim(); return s||null; }
  function toF(s){ const v=parseFloat(s); return isNaN(v)?null:v; }

  const QTITLES=["fuel analysis report","fuel quality report","bunker sample spec report","fobas fuel analysis"];
  const QTY_TITLES=["bunker quantity survey","quantity survey report","bqs survey","nominated qty"];
  const RES_TITLES=["sludge discharge","sludge final","rob + sludge","sludge survey","bilge"];
  function detectReportType(text){ const t=text.toLowerCase();
    if(QTITLES.some(k=>t.indexOf(k)>=0)) return "quality";
    if(QTY_TITLES.some(k=>t.indexOf(k)>=0)) return "quantity";
    if(RES_TITLES.some(k=>t.indexOf(k)>=0)) return "residue";
    return "quality"; }
  function isQuality(text){ const t=text.toLowerCase();
    if(QTITLES.some(k=>t.indexOf(k)>=0)) return true;
    return !QTY_TITLES.concat(RES_TITLES).some(k=>t.indexOf(k)>=0); }

  function baseReport(o){ return Object.assign({report_id:null,lab:null,report_type:"quality",source_kind:"pdf_text",status:null,source_file:null,vessel:null,imo:null,port:null,bunker_date:null,report_date:null,supplier:null,barge:null,grade_ordered:null,po_number:null,iso_revision:null,iso_revision_source:null,quantity_mt:null,parameters:[],out_of_spec_count:0,warning_count:0,overall_severity:"ok"},o); }

  const LABS = [
    { name:"FOBAS",
      match:t=>{const x=t.toLowerCase(); return (x.indexOf("fobas")>=0||x.indexOf("lrgmt.com")>=0||(x.indexOf("lloyd")>=0&&x.indexOf("fuel analysis")>=0))&&isQuality(t);},
      parse:(pages,file)=>{ const full=pages.join("\n"); const rev=grab(full,/ISO-F Grade\(?\s*(20\d\d(?:\/20\d\d)?)/i);
        const r=baseReport({report_id:grab(full,/Job reference:\s*([A-Za-z0-9-]+)/i)||file,lab:"FOBAS",source_file:file,
          vessel:grab(full,/Vessel:\s*(.+)/i),imo:findImo(full),port:grab(full,/Port:\s*([A-Za-z .'-]+),/i),
          bunker_date:grab(full,/Sampled Date\s+([\d-]+)/i),report_date:grab(full,/Published date:\s*([\d A-Za-z]+)/i),
          supplier:clean(grab(full,/Supplier\s+([A-Za-z0-9 .&'-]+?)(?:\n|Barge|Grade|$)/i)),
          barge:clean(grab(full,/Barge\/Installation\s+([A-Za-z0-9 .&'-]+)/i)),
          grade_ordered:clean(grab(full,/Grade Ordered\s+([A-Z0-9 ]+?)(?:\n|Transit|$)/i)||grab(full,/ISO-F-([A-Z]{3,6})/i)),
          quantity_mt:toF(grab(full,/Bunker Quantity \(MT\)\s+([\d.]+)/i))});
        if(rev){ r.iso_revision=rev.split("/")[0]; r.iso_revision_source="grade_tag"; }
        if(full.toUpperCase().indexOf("ULS")>=0 && r.grade_ordered) r.grade_ordered=r.grade_ordered+" ULS";
        r.parameters=parseRows(pages,{valuePosition:"last",startMarker:"test results",stopMarkers:DEFAULT_STOP.concat(["calculated values","quantity difference"])});
        return r; } },
    { name:"INTERTEK",
      match:t=>{const x=t.toLowerCase(); return x.indexOf("intertek")>=0&&(x.indexOf("lintec")>=0||x.indexOf("fuel quality report")>=0)&&isQuality(t);},
      parse:(pages,file)=>{ const full=pages.join("\n");
        const r=baseReport({report_id:grab(full,/Sample No\.\s*([A-Z0-9-]+)/i)||file,lab:"INTERTEK",source_file:file,
          vessel:grab(full,/\n([A-Z][A-Z ]+?)\s*\(\d{7}\)/),imo:findImo(full),port:grab(full,/Bunker Port\s+([A-Za-z .'-]+)/i),
          report_date:grab(full,/Report Date\s+([\d/]+)/i),supplier:clean(grab(full,/Fuel Supplier\s+([A-Za-z0-9 .&'-]+?)(?:\n|Sample|$)/i)),
          grade_ordered:clean(grab(full,/Grade Ordered\s+([A-Z0-9 ]+?)(?:\n|Sulphur|$)/i)),po_number:grab(full,/Client Ref\s+([A-Za-z0-9-]+)/i)});
        const sg=grab(full,/Sulphur Grade\s+([\d.]+%?\s*max)/i); if(sg&&r.grade_ordered) r.grade_ordered=r.grade_ordered+" "+sg;
        const rev=grab(full,/ISO 8217:(20\d\d)/i); if(rev){ r.iso_revision=rev; r.iso_revision_source="report_declared"; }
        r.parameters=parseRows(pages,{valuePosition:"before_unit",startMarker:"parameter result",stopMarkers:DEFAULT_STOP.concat(["sample results are compared","engineering notes"])});
        return r; } },
    { name:"VPS",
      match:t=>{const x=t.toLowerCase(); return (x.indexOf("veritas petroleum services")>=0||x.indexOf("vpsveritas.com")>=0||(x.indexOf("vps")>=0&&x.indexOf("fuel analysis report")>=0))&&isQuality(t);},
      parse:(pages,file)=>{ const full=pages.join("\n");
        const r=baseReport({report_id:grab(full,/Sample Number\s+([A-Z0-9-]+)/i)||file,lab:"VPS",source_file:file,
          status:full.toLowerCase().indexOf("preliminary report")>=0?"interim":"final",
          vessel:grab(full,/\n([A-Z][A-Z ]+?)\s*\(\d{7}\)/),imo:findImo(full),port:grab(full,/Bunker Port\s+([A-Za-z .'-]+)/i),
          bunker_date:grab(full,/Bunker Date\s+([\d A-Za-z-]+)/i),
          supplier:clean(grab(full,/Supplier\s+([A-Za-z0-9 .&'-]+?)(?:\n|\d|Loaded)/i)),
          grade_ordered:clean(grab(full,/Product Grade\s+([A-Z0-9:]+)/i)),po_number:grab(full,/Order Number\s+([A-Za-z0-9-]+)/i),
          quantity_mt:toF(grab(full,/Quantity per C\.Eng\.\s+([\d.]+)/i))});
        const pt=grab(full,/Product Type\s+([A-Z]+)/i); if(pt) r.grade_ordered=((r.grade_ordered||"")+" "+pt).trim();
        const rev=grab(full,/RMG\d+:(20\d\d)/i)||grab(full,/ISO 8217:(20\d\d)/i); if(rev){ r.iso_revision=rev; r.iso_revision_source="grade_tag"; }
        r.parameters=parseRows(pages,{valuePosition:"after_unit",startMarker:"test results",stopMarkers:DEFAULT_STOP.concat(["specification results","operational advice"])});
        return r; } },
    { name:"VISWA",
      match:t=>{const x=t.toLowerCase(); return (x.indexOf("theviswagroup.com")>=0||x.indexOf("viswa lab")>=0)&&isQuality(t);},
      parse:(pages,file)=>{ const full=pages.join("\n");
        const r=baseReport({report_id:grab(full,/REPORT ID:\s*([A-Z0-9-]+)/i)||file,lab:"VISWA",source_file:file,
          status:full.toLowerCase().indexOf("(interim)")>=0?"interim":"final",
          vessel:clean(grab(full,/SHIP\(IMO NO\):\s*([A-Z0-9 ]+?)\(\d{7}\)/i)||grab(full,/VESSEL:\s*([A-Z0-9 ]+?)\(\d{7}\)/i)),
          imo:findImo(full),port:clean(grab(full,/BUNKER PORT\s+([A-Za-z ,.'-]+?)(?:DENSITY|SENT|\n)/i)),
          bunker_date:grab(full,/BUNKER DATE\s+([\d A-Za-z-]+)/i),report_date:grab(full,/REPORT DATE\s+([\d A-Za-z-]+)/i),
          supplier:clean(grab(full,/SUPPLIER\s+([A-Za-z0-9 .&'-]+?)(?:\n|VISCOSITY|BARGE)/i)),
          grade_ordered:clean(grab(full,/GRADE\s+([A-Z0-9 ]+?)(?:\n|SENT|DENSITY)/i)),
          po_number:clean(grab(full,/PO NUMBER\s+([A-Z0-9]+)/i)),quantity_mt:toF(grab(full,/QUANTITY \(MT\)\s+([\d.]+)/i))});
        if(r.po_number==="-"||r.po_number==="") r.po_number=null;
        r.parameters=parseRows(pages,{valuePosition:"after_unit",startMarker:"test description",stopMarkers:DEFAULT_STOP.concat(["additional tests","comparison of current"])});
        return r; } },
    { name:"VERIFUEL",
      match:t=>{const x=t.toLowerCase(); return (x.indexOf("verifuelforms@bureauveritas.com")>=0||x.indexOf("bunker sample spec report")>=0)&&isQuality(t);},
      parse:(pages,file)=>{ const full=pages.join("\n");
        const r=baseReport({report_id:grab(full,/Job ID\s+([A-Za-z0-9-]+)/i)||file,lab:"VERIFUEL",source_file:file,
          vessel:clean(grab(full,/SPEC REPORT\s+([A-Za-z ]+?)\s*\(\d{7}\)/i)),imo:findImo(full),port:clean(grab(full,/Bunker Port\s+([A-Za-z .'-]+)/i)),
          bunker_date:grab(full,/Bunker Date\s+([\d A-Za-z]+)/i),report_date:grab(full,/Issued On\s+([\d A-Za-z]+)/i),
          supplier:clean(grab(full,/Bunker Supplier\s+([A-Za-z0-9 .&'-]+?)(?:\n|Density|Mode)/i)),
          grade_ordered:clean(grab(full,/Grade Ordered\s+([A-Z0-9 ]+?)(?:\n|Sample)/i)),
          po_number:clean(grab(full,/Batch ID \/ Order No\s+([A-Za-z0-9-]+)/i)),quantity_mt:toF(grab(full,/Quantity \(MT\)\s+([\d.]+)/i))});
        r.iso_revision_source="default";
        r.parameters=parseRows(pages,{valuePosition:"after_unit",startMarker:"test results",stopMarkers:DEFAULT_STOP.concat(["additional test results","recheck comments","samples seal information"])});
        return r; } },
  ];

  function detectLab(text){ for(const l of LABS){ if(l.match(text)) return l; } return null; }

  const PORT_NOISE = /\b(separation|storage|seal|courier|bunker date|density|sent|dhl|sampling|intact|used|yes|no|temperature)\b.*$/i;
  function sanitizePort(p){ if(!p) return p; p=p.replace(PORT_NOISE,"").replace(/[\s,.\-]+$/,"").trim(); return p||null; }

  function processPages(pages, filename){
    const text = pages.join("\n");
    const lab = detectLab(text);
    let report;
    if(lab) report = lab.parse(pages, filename);
    else { const rtype=detectReportType(text); report=baseReport({report_id:filename,lab:"UNKNOWN",report_type:rtype,source_file:filename,iso_revision_source:"default"}); }
    report.port = sanitizePort(report.port);
    evaluateReport(report);
    return report;
  }

  // ---------------------------------------------------------------- analyse
  function supplierScores(reports){
    const agg={};
    reports.forEach(r=>{ const sup=(r.supplier||"UNKNOWN").trim().toUpperCase(); const s=agg[sup]||(agg[sup]={supplier:sup,n_reports:0,n_params:0,n_oos:0,n_warn:0,ports:{},grades:{}});
      s.n_reports++; if(r.port) s.ports[r.port]=1; if(r.grade_ordered) s.grades[r.grade_ordered]=1;
      r.parameters.forEach(p=>{ if(["pass","fail","indeterminate"].indexOf(p.verdict)>=0){ s.n_params++; if(p.severity==="out_of_spec") s.n_oos++; else if(p.severity==="warning") s.n_warn++; } }); });
    return Object.values(agg).map(s=>{ const pen=s.n_params?(s.n_oos+0.25*s.n_warn)/s.n_params:0; s.quality_score=s.n_params?Math.max(0,Math.round(1000*(1-pen))/10):0; s.ports=Object.keys(s.ports); return s; })
      .sort((a,b)=> b.quality_score-a.quality_score || a.supplier.localeCompare(b.supplier));
  }

  function alerts(reports, includeWarnings){
    const out=[];
    reports.forEach(r=> r.parameters.forEach(p=>{ if(p.severity==="out_of_spec"||(includeWarnings&&p.severity==="warning"))
      out.push({report_id:r.report_id,lab:r.lab,vessel:r.vessel,supplier:r.supplier,port:r.port,grade:r.grade_ordered,
        iso_revision:r.iso_revision,parameter:p.canonical_key,raw_label:p.raw_label,raw_value:p.raw_value,
        iso_limit_min:p.iso_limit_min,iso_limit_max:p.iso_limit_max,severity:p.severity,verdict:p.verdict,rationale:p.rationale}); }));
    out.sort((a,b)=> (a.severity==="out_of_spec"?0:1)-(b.severity==="out_of_spec"?0:1) || (a.supplier||"").localeCompare(b.supplier||""));
    return out;
  }

  root.BunkeringEngine = {
    processPages, evaluateReport, supplierScores, alerts, resolveParam, parseMeasurement,
    parseLimit, evaluateValue, resolveGrade, limitsFor, detectLab, BY_KEY,
  };
})(typeof window!=="undefined"?window:globalThis);
