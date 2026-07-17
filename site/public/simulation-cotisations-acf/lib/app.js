var h=React.createElement,us=React.useState,um=React.useMemo;
var BASE=[
{n:"Bacs de Seine (CD76)",t:951,c:5934,ccn:1,col:"A",fx:2910,pp:3024,tp:"a"},
{n:"Morlenn Express",t:2253,c:9596,ccn:1,col:"A",fx:2910,pp:6686,tp:"a"},
{n:"Penn Ar Bed",t:2125,c:9270,ccn:1,col:"A",fx:2910,pp:6360,tp:"a"},
{n:"Transdev Oceane",t:6102,c:18687,ccn:1,col:"A",fx:2910,pp:15777,tp:"a"},
{n:"Bacs de loire",t:1036,c:6193,ccn:1,col:"A",fx:2910,pp:3283,tp:"a"},
{n:"Cie Yeu continent",t:2750,c:10860,ccn:1,col:"A",fx:2910,pp:7950,tp:"a"},
{n:"Cie Maritime Transport",t:47,c:3059,ccn:1,col:"A",fx:2910,pp:149,tp:"a"},
{n:"Keolis Fouras Aix",t:278,c:3794,ccn:1,col:"A",fx:2910,pp:884,tp:"a"},
{n:"Bacs Gironde (CD33)",t:8413,c:22965,ccn:1,col:"A",fx:2910,pp:20055,tp:"a"},
{n:"SMTDR (Rhone)",t:944,c:5912,ccn:1,col:"A",fx:2910,pp:3002,tp:"a"},
{n:"TLV",t:1046,c:6222,ccn:1,col:"A",fx:2910,pp:3312,tp:"a"},
{n:"STM Mayotte",t:1818,c:8431,ccn:1,col:"A",fx:2910,pp:5521,tp:"a"},
{n:"SPM F",t:1611,c:7839,ccn:1,col:"A",fx:2910,pp:4929,tp:"a"},
{n:"TDLR (Transdev LR)",t:113,c:3269,ccn:1,col:"A",fx:2910,pp:359,tp:"a"},
{n:"Bateau bus du Golfe",t:257,c:3727,ccn:1,col:"A",fx:2910,pp:817,tp:"a"},
{n:"Transrade Marseille",t:402,c:4188,ccn:1,col:"A",fx:2910,pp:1278,tp:"a"},
{n:"CD50 Tatihou",t:45,c:3053,ccn:1,col:"A",fx:2910,pp:143,tp:"a"},
{n:"Karru-Ferry",t:56,c:3088,ccn:1,col:"A",fx:2910,pp:178,tp:"a"},
{n:"TAO (Lorient)",t:524,c:4576,ccn:1,col:"A",fx:2910,pp:1666,tp:"a"},
{n:"RD TPM Toulon",t:950,c:5931,ccn:1,col:"A",fx:2910,pp:3021,tp:"a"},
{n:"Blue Lines (Martinique)",t:321,c:3931,ccn:1,col:"A",fx:2910,pp:1021,tp:"a"},
{n:"DNO",t:325,c:2910,ccn:0,col:"A",fx:2910,pp:0,tp:"a"},
{n:"SAEML Osani Ghjirulatu",t:10,c:0,ccn:1,col:"A",fx:0,pp:0,tp:"a",nw:1},
{n:"TMC",t:622,c:2910,ccn:1,col:"B",fx:2910,pp:0,tp:"a"},
{n:"Cie Vendeenne",t:551,c:2910,ccn:0,col:"B",fx:2910,pp:0,tp:"a"},
{n:"JALILO / Arcachon",t:31,c:2910,ccn:1,col:"B",fx:2910,pp:0,tp:"a"},
{n:"LD-Tide",t:1127,c:2910,ccn:1,col:"B",fx:2910,pp:0,tp:"a"},
{n:"Solkaper",t:100,c:0,ccn:0,col:"B",fx:0,pp:0,tp:"a",nw:1},
{n:"Mobyfly",t:15,c:0,ccn:0,col:"B",fx:0,pp:0,tp:"a",nw:1},
{n:"FILHET ALLARD",t:0,c:2910,ccn:0,col:"C",fx:2910,pp:0,tp:"e"},
{n:"CAPSTAN Avocats",t:0,c:2910,ccn:0,col:"C",fx:2910,pp:0,tp:"e"},
{n:"Ecomer Data",t:0,c:0,ccn:0,col:"C",fx:0,pp:0,tp:"e",nw:1},
{n:"LS Résa",t:0,c:0,ccn:0,col:"C",fx:0,pp:0,tp:"e",nw:1},
{n:"Adam Assurances",t:0,c:0,ccn:0,col:"C",fx:0,pp:0,tp:"e",nw:1},
{n:"Ouest Sécurité Marine",t:0,c:0,ccn:0,col:"C",fx:0,pp:0,tp:"e",nw:1},
{n:"ARMAM",t:0,c:10000,ccn:0,col:"C",fx:10000,pp:0,tp:"h"},
{n:"Howden",t:0,c:970,ccn:0,col:"C",fx:970,pp:0,tp:"h"},
];
var LG=[{n:"SPLMNA (44 vedettes)",t:440,c:2910,ccn:1,col:"C",fx:2910,pp:0,tp:"e",lam:1,crew:212,ved:44}];
var LS=[
{n:"Lam. Bayonne",t:30,c:364,ccn:1,col:"C",fx:364,pp:0,tp:"e",lam:1,crew:6,ved:3},
{n:"Lam. Bordeaux",t:50,c:364,ccn:1,col:"C",fx:364,pp:0,tp:"e",lam:1,crew:36,ved:5},
{n:"Lam. La Rochelle",t:50,c:364,ccn:1,col:"C",fx:364,pp:0,tp:"e",lam:1,crew:25,ved:5},
{n:"Lam. Donges",t:80,c:364,ccn:1,col:"C",fx:364,pp:0,tp:"e",lam:1,crew:47,ved:8},
{n:"Lam. Lorient",t:30,c:364,ccn:1,col:"C",fx:364,pp:0,tp:"e",lam:1,crew:10,ved:3},
{n:"Lam. Brest",t:40,c:364,ccn:1,col:"C",fx:364,pp:0,tp:"e",lam:1,crew:35,ved:4},
{n:"Lam. Ouistreham",t:10,c:363,ccn:1,col:"C",fx:363,pp:0,tp:"e",lam:1,crew:8,ved:1},
{n:"Lam. Rouen-Dieppe",t:150,c:363,ccn:1,col:"C",fx:363,pp:0,tp:"e",lam:1,crew:45,ved:15},
];

function mk(b){return[[1000,b],[2000,b*.9],[4000,b*.8],[6000,b*.7],[8000,b*.6],[10000,b*.5]];}
function dg(t,tr){var s=0,p=0;for(var i=0;i<tr.length;i++){if(t<=p)break;s+=(Math.min(t,tr[i][0])-p)*tr[i][1];p=tr[i][0];}return s;}
function fm(n){return Math.round(n).toLocaleString("fr-FR");}

function comp(mm,sv,sc,lb,sb,sf,fz){
var lt=lb>0?mk(lb):[],st=sb>0?mk(sb):[];
return mm.map(function(m){
if(m.tp==="h")return Object.assign({},m,{sv:0,lo:0,so:0,tot:m.fx,delta:m.fx-m.c,pct:0});
if(fz[m.n])return Object.assign({},m,{sv:0,lo:0,so:0,tot:m.c,delta:0,pct:0,frozen:1});
var v=m.tp==="e"?sc:sv;
var l=m.tp==="a"&&lt.length?dg(m.t,lt):0;
var o=0;if(m.ccn){o=sf>0?sf:(st.length?dg(m.t,st):0);}
var tt=v+l+o;return Object.assign({},m,{sv:v,lo:l,so:o,tot:tt,delta:tt-m.c,pct:m.c>0?((tt-m.c)/m.c)*100:0});
});}

var PR={
"S1 Social fort":{s:2000,sc:2910,l:1.20,sb:1.80,f:0},
"S2 50/50":{s:2000,sc:2910,l:1.50,sb:1.50,f:0},
"S3 Instit. fort":{s:2000,sc:2910,l:2.00,sb:1.00,f:0},
"S4 Flat social":{s:2000,sc:2910,l:3.22,sb:0,f:800},
"S5 86/14":{s:2000,sc:2910,l:3.08,sb:0.50,f:0},
"S6 Iso-social 2024":{s:2000,sc:2910,l:3.08,sb:0,f:970},
};
var cBg={A:"#dbeafe",B:"#dcfce7",C:"#f3e8ff"},cFg={A:"#1e40af",B:"#166534",C:"#6b21a8"};

function Seg(p){if(p.v<=0)return null;var w=(p.v/p.mx)*100;return h("div",{style:{width:w+"%",background:p.color,height:"100%",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}},p.v>p.mx*0.04?h("span",{style:{fontSize:9,color:"#fff",fontWeight:600}},fm(p.v)):null);}

function NumInput(p){
var _d=us(null),d=_d[0],sd=_d[1];
var disp=d!==null?d:(p.step<1?p.val.toFixed(2):String(p.val));
return h("input",{type:"number",value:disp,min:p.mn,max:p.mx,step:"any",
onFocus:function(e){sd(String(e.target.value));},
onChange:function(e){var v=e.target.value;sd(v);var n=parseFloat(v);if(!isNaN(n)&&n>=p.mn&&n<=p.mx){p.set(n);p.custom();}},
onBlur:function(){var n=parseFloat(d);if(!isNaN(n)){n=Math.min(p.mx,Math.max(p.mn,n));p.set(n);p.custom();}sd(null);},
onKeyDown:function(e){if(e.key==="Enter")e.target.blur();},
style:{width:p.step<1?72:62,textAlign:"right",fontSize:16,fontWeight:700,color:p.color,border:"1.5px solid #d1d5db",borderRadius:5,padding:"2px 6px",fontFamily:"inherit",background:"#f8fafb"}});
}

function App(){
var _sv=us(2000),sv=_sv[0],ssv=_sv[1];
var _sc=us(2910),sc=_sc[0],ssc=_sc[1];
var _lb=us(3.22),lb=_lb[0],slb=_lb[1];
var _sb=us(0),sb=_sb[0],ssb=_sb[1];
var _sf=us(800),sf=_sf[0],ssf=_sf[1];
var _so=us("delta"),so=_so[0],sso=_so[1];
var _fi=us("all"),fi=_fi[0],sfi=_fi[1];
var _pr=us("S4 Flat social"),pr=_pr[0],spr=_pr[1];
var _ls=us(false),ls=_ls[0],sls=_ls[1];
var _fz=us({}),fz=_fz[0],sfz=_fz[1];
function tf(n){var o=Object.assign({},fz);if(o[n])delete o[n];else o[n]=1;sfz(o);}

function ap(n){var p=PR[n];ssv(p.s);ssc(p.sc);slb(p.l);ssb(p.sb);ssf(p.f);spr(n);}

var mm=um(function(){return BASE.concat(ls?LS:LG);},[ls]);
var all=um(function(){return comp(mm,sv,sc,lb,sb,sf,fz);},[mm,sv,sc,lb,sb,sf,fz]);
var ka=all;

var data=um(function(){
var r=all.slice();
if(fi==="3228")r=r.filter(function(x){return x.ccn;});
else if(fi==="arm")r=r.filter(function(x){return x.tp==="a";});
else if(fi==="lam")r=r.filter(function(x){return x.lam;});
else if(fi!=="all")r=r.filter(function(x){return x.col===fi;});
if(so==="delta")r.sort(function(a,b){return a.delta-b.delta;});
else if(so==="total")r.sort(function(a,b){return b.tot-a.tot;});
else if(so==="tonnage")r.sort(function(a,b){return b.t-a.t;});
else if(so==="name")r.sort(function(a,b){return a.n.localeCompare(b.n);});
return r;},[all,fi,so]);

var tC=0,tN=0,tSv=0,tLo=0,tSo=0;
for(var i=0;i<ka.length;i++){tC+=ka[i].c;tN+=ka[i].tot;tSv+=ka[i].sv;tLo+=ka[i].lo;tSo+=ka[i].so;}
var dP=tC>0?((tN-tC)/tC*100):0;
var mx=1;for(var j=0;j<data.length;j++){mx=Math.max(mx,data[j].c,data[j].tot);}
var li=all.filter(function(r){return r.lam;}),lN=0,lC=0;
for(var k=0;k<li.length;k++){lN+=li[k].tot;lC+=li[k].c;}
var up=ka[0]||{n:"-",delta:0,pct:0},dn=ka[0]||{n:"-",delta:0,pct:0};
for(var ii=0;ii<ka.length;ii++){if(ka[ii].pct>up.pct)up=ka[ii];if(ka[ii].pct<dn.pct)dn=ka[ii];}

var lD=lb>0?mk(lb):[],sD=sb>0?mk(sb):[];

function btn(active,onClick,text,small){return h("button",{onClick:onClick,style:{padding:small?"3px 8px":"5px 12px",border:active?"2px solid #0F4761":"1.5px solid #d1d5db",borderRadius:6,background:active?"#0F4761":"#fff",color:active?"#fff":"#374151",cursor:"pointer",fontWeight:600,fontSize:small?10:11}},text);}

function param(label,val,set,mn,mx,step,unit,color,sub){
return h("div",{key:label,style:{flex:1,minWidth:190}},
h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:2}},
h("span",{style:{fontSize:11,fontWeight:700,color:color}},label),
h("span",{style:{display:"flex",alignItems:"baseline",gap:4}},
h(NumInput,{val:val,set:set,mn:mn,mx:mx,step:step,color:color,custom:function(){spr("Custom");}}),
h("span",{style:{fontSize:12,color:"#888"}},unit))),
h("div",{style:{fontSize:10,color:"#999",marginBottom:2}},sub),
h("input",{type:"range",min:mn,max:mx,step:step,value:val,onChange:function(e){set(parseFloat(e.target.value));spr("Custom");},style:{width:"100%",accentColor:color,height:6,cursor:"pointer"}}));}

function kpi(label,val,delta,pos,clr,sm){
return h("div",{style:{background:"#fff",borderRadius:8,padding:"8px 12px",boxShadow:"0 1px 2px rgba(0,0,0,.04)",borderTop:clr?"3px solid "+clr:"none"}},
h("div",{style:{fontSize:9,color:"#888",textTransform:"uppercase",letterSpacing:".7px"}},label),
h("div",{style:{fontSize:sm?11:16,fontWeight:700,color:clr||"#0F4761",marginTop:1}},val),
delta?h("div",{style:{fontSize:11,fontWeight:600,color:pos?"#16a34a":"#dc2626"}},delta):null);}

return h("div",{style:{fontFamily:"system-ui,sans-serif",background:"#f7f8fa",minHeight:"100vh"}},
// Header
h("div",{style:{background:"linear-gradient(135deg,#0F4761,#1a6b8a)",color:"#fff",padding:"22px 28px 16px"}},
h("div",{style:{fontSize:22,fontWeight:700}},"Cotisations GASPE \u2014 Simulateur"),
h("div",{style:{opacity:.75,fontSize:13,marginTop:2}},"3 composantes : Services (fixe) + Lobbying (\u20ac/UMS) + Social CCN 3228 (\u20ac/UMS ou forfait)")),

h("div",{style:{maxWidth:1440,margin:"0 auto",padding:"14px 20px"}},
// Presets
h("div",{style:{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}},
Object.keys(PR).map(function(k){return btn(pr===k,function(){ap(k);},k);}),
pr==="Custom"?btn(true,null,"Custom"):null),

// Lamanage toggle
h("div",{style:{display:"flex",gap:8,alignItems:"center",marginBottom:12,padding:"8px 14px",background:ls?"#fef3c7":"#fff",borderRadius:8,border:"1.5px solid #e5e7eb"}},
h("span",{style:{fontSize:12,fontWeight:700,color:"#92400e"}},"\u2693 Lamanage :"),
btn(!ls,function(){sls(false);},"SPLMNA group\u00e9",true),
btn(ls,function(){sls(true);},"8 stations",true),
ls?h("span",{style:{fontSize:11,color:"#92400e",fontWeight:600}},"212 salari\u00e9s / 44 vedettes / ~440 UMS / CCN 3228"):null),

// Controls
h("div",{style:{background:"#fff",borderRadius:12,padding:"16px 20px",boxShadow:"0 1px 3px rgba(0,0,0,.06)",marginBottom:14}},
h("div",{style:{fontSize:13,fontWeight:700,color:"#0F4761",marginBottom:10}},"Param\u00e8tres du bar\u00e8me"),
h("div",{style:{display:"flex",gap:20,flexWrap:"wrap"}},
param("Services armateurs",sv,ssv,500,3500,10,"\u20ac","#0F4761","A + B + C armateurs"),
param("Services experts",sc,ssc,0,2910,10,"\u20ac","#0F4761","Filhet, Capstan (Howden = 970\u20ac fixe)"),
param("Lobbying 1\u00e8re tranche",lb,slb,0,4.00,0.02,"\u20ac/UMS","#3b9fc1","D\u00e9gressif \u00d70.90/0.80/0.70/0.60/0.50"),
param("Social 1\u00e8re tranche",sb,ssb,0,3.00,0.02,"\u20ac/UMS","#f59e0b","D\u00e9gressif. CCN 3228 transversal"),
param("Social forfait (si > 0)",sf,ssf,0,1500,10,"\u20ac","#f59e0b","Remplace le proportionnel social")),
// Barème display
h("div",{style:{marginTop:10,padding:"8px 12px",background:"#f8fafb",borderRadius:8,fontSize:11,display:"flex",gap:20,flexWrap:"wrap"}},
h("div",null,h("b",{style:{color:"#3b9fc1"}},"Lobbying")," ",lD.length>0?lD.map(function(tr,i){var p=i>0?lD[i-1][0]:0;return h("span",{key:i,style:{marginRight:6}},p+"-"+tr[0]+": ",h("b",null,tr[1].toFixed(2)));}):"-"),
h("div",null,h("b",{style:{color:"#f59e0b"}},"Social")," ",sf>0?h("span",null,"Forfait ",h("b",null,fm(sf)+" \u20ac")):sD.length>0?sD.map(function(tr,i){var p=i>0?sD[i-1][0]:0;return h("span",{key:i,style:{marginRight:6}},p+"-"+tr[0]+": ",h("b",null,tr[1].toFixed(2)));}):"-"))),

// KPIs
h("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:8,marginBottom:12}},
kpi("Budget actuel",fm(tC)+" \u20ac"),
kpi("Budget nouveau",fm(tN)+" \u20ac",(dP>=0?"+":"")+dP.toFixed(1)+"%",dP>=0),
kpi("Services",fm(tSv)+" \u20ac",tN>0?(tSv/tN*100).toFixed(0)+"%":null,true,"#0F4761"),
kpi("Lobbying",fm(tLo)+" \u20ac",tN>0?(tLo/tN*100).toFixed(0)+"%":null,true,"#3b9fc1"),
kpi("Social 3228",fm(tSo)+" \u20ac",tN>0?(tSo/tN*100).toFixed(0)+"%":null,true,"#f59e0b"),
kpi("Lamanage "+(ls?"8 sta.":"group\u00e9"),fm(lN)+" \u20ac",(lN-lC>=0?"+":"")+fm(lN-lC)+" \u20ac",lN<=lC,"#7c3aed"),
kpi("Hausse max",up.n,"+"+fm(up.delta),true,null,true),
kpi("Baisse max",dn.n,fm(dn.delta),false,null,true)),

// Filters
h("div",{style:{display:"flex",gap:5,marginBottom:6,flexWrap:"wrap",alignItems:"center"}},
h("span",{style:{fontSize:10,fontWeight:700,color:"#aaa"}},"FILTRE"),
[["all","Tous"],["A","Col.A"],["B","Col.B"],["C","Col.C"],["3228","CCN 3228"],["arm","Armateurs"],["lam","Lamanage"]].map(function(p){return btn(fi===p[0],function(){sfi(p[0]);},p[1],true);}),
h("span",{style:{fontSize:10,fontWeight:700,color:"#aaa",marginLeft:8}},"TRI"),
[["delta","Impact"],["total","Total"],["tonnage","Tonnage"],["name","A-Z"]].map(function(p){return btn(so===p[0],function(){sso(p[0]);},p[1],true);})),

// Legend
h("div",{style:{display:"flex",gap:12,marginBottom:5,fontSize:10,color:"#666",flexWrap:"wrap"}},
h("b",null,"ACTUEL :"),
h("span",null,h("span",{style:{display:"inline-block",width:10,height:10,borderRadius:2,background:"#94a3b8",verticalAlign:"middle",marginRight:3}}),"Fixe"),
h("span",null,h("span",{style:{display:"inline-block",width:10,height:10,borderRadius:2,background:"#64748b",verticalAlign:"middle",marginRight:3}}),"Prop."),
h("b",{style:{marginLeft:6}},"SC\u00c9NARIO :"),
h("span",null,h("span",{style:{display:"inline-block",width:10,height:10,borderRadius:2,background:"#0F4761",verticalAlign:"middle",marginRight:3}}),"Services"),
h("span",null,h("span",{style:{display:"inline-block",width:10,height:10,borderRadius:2,background:"#3b9fc1",verticalAlign:"middle",marginRight:3}}),"Lobbying"),
h("span",null,h("span",{style:{display:"inline-block",width:10,height:10,borderRadius:2,background:"#f59e0b",verticalAlign:"middle",marginRight:3}}),"Social"),
h("span",{style:{marginLeft:6}},"❄ cliquer pour geler un adhérent à sa cotisation N-1")),

// Chart
h("div",{style:{background:"#fff",borderRadius:12,padding:"10px 14px",boxShadow:"0 1px 3px rgba(0,0,0,.06)"}},
data.map(function(r,i){
var dc=r.delta>50?"#16a34a":r.delta<-50?"#dc2626":"#888";
var hl=r.n==="DNO"||r.lam;
var ih=r.tp==="h",gl=!!r.frozen;
return h("div",{key:r.n+"-"+i,style:{display:"grid",gridTemplateColumns:"190px 64px 1fr 76px",gap:4,alignItems:"center",padding:"4px 0",borderBottom:i<data.length-1?"1px solid #f3f4f6":"none",background:hl?"#fffbeb":(ih||gl)?"#f9fafb":"transparent",opacity:(ih||gl)?0.6:1}},
h("div",{style:{display:"flex",alignItems:"center",gap:3,overflow:"hidden"}},
h("span",{style:{background:cBg[r.col],color:cFg[r.col],padding:"1px 6px",borderRadius:4,fontSize:10,fontWeight:700}},r.col),
h("span",{style:{fontSize:10.5,fontWeight:hl?700:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},r.n)),
h("div",{style:{display:"flex",gap:2,flexWrap:"wrap",alignItems:"center"}},
ih?null:h("span",{onClick:function(){tf(r.n);},title:gl?"D\u00e9geler : appliquer le bar\u00e8me":"Geler \u00e0 la cotisation N-1 ("+fm(r.c)+" \u20ac)",style:{cursor:"pointer",fontSize:11,lineHeight:1,padding:"1px 3px",borderRadius:3,background:gl?"#dbeafe":"transparent",opacity:gl?1:0.3,userSelect:"none"}},"\u2744"),
r.ccn?h("span",{style:{background:"#fef3c7",color:"#92400e",padding:"1px 4px",borderRadius:3,fontSize:9,fontWeight:700}},"3228"):null,
r.tp==="e"?h("span",{style:{background:"#f3e8ff",color:"#6b21a8",padding:"1px 4px",borderRadius:3,fontSize:9,fontWeight:700}},"exp"):null,
r.nw?h("span",{style:{background:"#dcfce7",color:"#166534",padding:"1px 4px",borderRadius:3,fontSize:9,fontWeight:700}},"new"):null,
ih?h("span",{style:{background:"#e5e7eb",color:"#6b7280",padding:"1px 4px",borderRadius:3,fontSize:9,fontWeight:700}},"fixe"):null),
h("div",{style:{display:"flex",flexDirection:"column",gap:1.5}},
h("div",{style:{display:"flex",height:14,borderRadius:2,overflow:"hidden",background:"#f1f5f9"}},h(Seg,{v:r.fx,mx:mx,color:"#94a3b8"}),h(Seg,{v:r.pp,mx:mx,color:"#64748b"})),
h("div",{style:{display:"flex",height:14,borderRadius:2,overflow:"hidden",background:"#f1f5f9"}},(ih||gl)?h(Seg,{v:r.tot,mx:mx,color:"#94a3b8"}):null,h(Seg,{v:r.sv,mx:mx,color:"#0F4761"}),h(Seg,{v:r.lo,mx:mx,color:"#3b9fc1"}),h(Seg,{v:r.so,mx:mx,color:"#f59e0b"}))),
h("div",{style:{textAlign:"right"}},
(ih||gl)?h("div",null,h("div",{style:{fontSize:11,fontWeight:700,color:"#888"}},fm(r.tot)+" \u20ac"),h("div",{style:{fontSize:9,color:"#888"}},gl?"gel\u00e9 N-1":"fixe")):
h("div",null,h("div",{style:{fontSize:11,fontWeight:700,color:dc}},(r.delta>=0?"+":"")+fm(r.delta)+" \u20ac"),h("div",{style:{fontSize:9,color:dc}},(r.pct>=0?"+":"")+r.pct.toFixed(1)+"%"))));}),

// Total
h("div",{style:{display:"grid",gridTemplateColumns:"190px 64px 1fr 76px",gap:4,alignItems:"center",padding:"8px 0 2px",borderTop:"2px solid #0F4761",marginTop:4}},
h("div",{style:{fontSize:11,fontWeight:700,color:"#0F4761"}},"TOTAL ("+data.length+")"),
h("div"),
h("div",{style:{fontSize:10,color:"#555"}},"Actuel ",h("b",null,fm(data.reduce(function(s,r){return s+r.c;},0))+" \u20ac")," \u2192 ",h("b",{style:{color:"#0F4761"}},fm(data.reduce(function(s,r){return s+r.tot;},0))+" \u20ac")),
h("div",{style:{textAlign:"right",fontSize:12,fontWeight:700,color:data.reduce(function(s,r){return s+r.delta;},0)>=0?"#16a34a":"#dc2626"}},(data.reduce(function(s,r){return s+r.delta;},0)>=0?"+":"")+fm(Math.round(data.reduce(function(s,r){return s+r.delta;},0)))+" \u20ac"))),

// Lamanage detail
ls?h("div",{style:{marginTop:14,background:"#fffbeb",borderRadius:12,padding:"14px 18px",border:"1.5px solid #f59e0b",fontSize:12}},
h("div",{style:{fontWeight:700,color:"#92400e",marginBottom:8,fontSize:14}},"\u2693 D\u00e9tail Lamanage \u2014 8 stations SPLMNA"),
h("table",{style:{width:"100%",borderCollapse:"collapse",fontSize:11}},
h("thead",null,h("tr",{style:{borderBottom:"2px solid #92400e"}},
h("th",{style:{textAlign:"left",padding:"4px 8px"}},"Station"),
h("th",{style:{textAlign:"right",padding:"4px 8px"}},"Effectif"),
h("th",{style:{textAlign:"right",padding:"4px 8px"}},"Vedettes"),
h("th",{style:{textAlign:"right",padding:"4px 8px"}},"UMS"),
h("th",{style:{textAlign:"right",padding:"4px 8px"}},"Cotisation"))),
h("tbody",null,
li.map(function(r){return h("tr",{key:r.n,style:{borderBottom:"1px solid #fde68a"}},
h("td",{style:{padding:"4px 8px"}},r.n),
h("td",{style:{textAlign:"right",padding:"4px 8px"}},r.crew),
h("td",{style:{textAlign:"right",padding:"4px 8px"}},r.ved),
h("td",{style:{textAlign:"right",padding:"4px 8px"}},r.t),
h("td",{style:{textAlign:"right",padding:"4px 8px",fontWeight:700,color:"#dc2626"}},fm(r.tot)+" \u20ac"));}),
h("tr",{style:{borderTop:"2px solid #92400e",fontWeight:700}},
h("td",{style:{padding:"4px 8px"}},"TOTAL"),
h("td",{style:{textAlign:"right",padding:"4px 8px"}},"212"),
h("td",{style:{textAlign:"right",padding:"4px 8px"}},"44"),
h("td",{style:{textAlign:"right",padding:"4px 8px"}},"440"),
h("td",{style:{textAlign:"right",padding:"4px 8px",color:"#dc2626"}},fm(lN)+" \u20ac (actuel "+fm(lC)+")"))))):null,

// Footer
h("div",{style:{textAlign:"center",padding:"20px",fontSize:11,color:"#999",marginTop:20}},"GASPE \u2014 Simulateur de cotisations \u2014 Mars 2026")));}

ReactDOM.render(h(App),document.getElementById("r"));
