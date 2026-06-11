import { useState, useEffect, useRef, useCallback } from "react";

// ── RESPONSIVE HOOK ───────────────────────────────────────────────────────────
function useIsMobile(){ 
  const [m,setM]=useState(window.innerWidth<600);
  useEffect(()=>{
    const h=()=>setM(window.innerWidth<600);
    window.addEventListener('resize',h);
    return()=>window.removeEventListener('resize',h);
  },[]);
  return m;
}

// ── TIER: computed ONLY from rating, never from stored field ──────────────────
const getTier = r => r >= 98 ? "Legenda" : r >= 89 ? "Gold" : r >= 83 ? "Silver" : "Bronze";

const RAW = [
  {name:"Teja Paku Alam",pos:["GK"],rating:91,type:"Lokal"},
  {name:"I Made Wirawan",pos:["GK"],rating:86,type:"Lokal"},
  {name:"Adam Przybek",pos:["GK"],rating:82,type:"Asing"},
  {name:"Kevin Mendoza",pos:["GK"],rating:90,type:"Asing"},
  {name:"Fitrah Maulana",pos:["GK"],rating:80,type:"Youth"},
  {name:"Muhammad Natshir",pos:["GK"],rating:78,type:"Lokal"},
  {name:"Satrio Azhar",pos:["GK"],rating:77,type:"Youth"},
  {name:"Shahar Ginanjar",pos:["GK"],rating:86,type:"Lokal"},
  {name:"Markus Horison",pos:["GK"],rating:87,type:"Lokal"},
  {name:"Cecep Supriatna",pos:["GK"],rating:82,type:"Lokal"},
  {name:"Jendry Pitoy",pos:["GK"],rating:86,type:"Lokal"},
  {name:"Victor Igbonefo",pos:["CB"],rating:90,type:"Lokal"},
  {name:"Nick Kuipers",pos:["CB","RB"],rating:88,type:"Asing"},
  {name:"Federico Barba",pos:["CB","LB"],rating:92,type:"Asing"},
  {name:"Bojan Malisic",pos:["CB"],rating:86,type:"Asing"},
  {name:"Fabiano Beltrame",pos:["CB","CDM"],rating:85,type:"Asing"},
  {name:"Vladimir Vujovic",pos:["CB"],rating:85,type:"Asing"},
  {name:"Matricardi",pos:["CB"],rating:89,type:"Asing"},
  {name:"Alfeandra Dewangga",pos:["LB","CDM"],rating:85,type:"Lokal"},
  {name:"Dion Markx",pos:["CB"],rating:85,type:"Asing"},
  {name:"Andrew Patrick Jung",pos:["ST"],rating:90,type:"Asing"},
  {name:"Kakang Rudianto",pos:["CB","RB"],rating:84,type:"Youth"},
  {name:"Achmad Jufriyanto",pos:["CB","LB"],rating:89,type:"Lokal"},
  {name:"Daisuke Sato",pos:["RB","CDM","LB"],rating:84,type:"Asing"},
  {name:"Tony Sucipto",pos:["LB","CDM","CB"],rating:82,type:"Lokal"},
  {name:"Frets Butuan",pos:["RW","LW","RM"],rating:83,type:"Lokal"},
  {name:"Layvin Kurzawa",pos:["LB","LWB","CDM"],rating:90,type:"Asing"},
  {name:"Ardi Idrus",pos:["LB","LWB","LM"],rating:85,type:"Lokal"},
  {name:"Wildansyah",pos:["LB","LWB","LM"],rating:81,type:"Lokal"},
  {name:"Zalnando",pos:["RB","RWB","RM"],rating:84,type:"Lokal"},
  {name:"Frans Putros",pos:["RB","CDM"],rating:89,type:"Asing"},
  {name:"Supardi Nasir",pos:["RB","RWB","RM"],rating:89,type:"Lokal"},
  {name:"Henhen Herdiana",pos:["RB","RM","RWB"],rating:81,type:"Lokal"},
  {name:"Robi Darwis",pos:["RB","LB","CDM"],rating:83,type:"Youth"},
  {name:"Ferdiansyah",pos:["RB","RM"],rating:82,type:"Youth"},
  {name:"Hariono",pos:["CDM","CM"],rating:85,type:"Lokal"},
  {name:"Dedi Kusnandar",pos:["CDM","CM"],rating:86,type:"Lokal"},
  {name:"Oh In-Kyun",pos:["CDM","CM"],rating:85,type:"Asing"},
  {name:"Marc Klok",pos:["CDM","CM"],rating:94,type:"Asing"},
  {name:"Raphael Maitimo",pos:["CM","CAM","ST"],rating:86,type:"Lokal"},
  {name:"Ricky Kambuaya",pos:["CM","CAM","RM"],rating:87,type:"Lokal"},
  {name:"Beckham Putra",pos:["RW","LW","CAM"],rating:90,type:"Lokal"},
  {name:"Kim Jeffrey Kurniawan",pos:["CM","LM","CDM"],rating:86,type:"Lokal"},
  {name:"Ghozali Siregar",pos:["RW","LW","RM"],rating:80,type:"Lokal"},
  {name:"Michael Essien",pos:["CM","CDM"],rating:90,type:"Asing"},
  {name:"Eliano Reijnders",pos:["LW","LB","CDM"],rating:88,type:"Lokal"},
  {name:"Gian Zola Nasrullah",pos:["CAM","LW","LM"],rating:83,type:"Lokal"},
  {name:"Esteban Vizcarra",pos:["CAM","LW","RM"],rating:88,type:"Asing"},
  {name:"Shohei Matsunaga",pos:["CAM","CM"],rating:85,type:"Asing"},
  {name:"Atep Rizal",pos:["LM","LW","CAM"],rating:88,type:"Lokal"},
  {name:"Saddil Ramdani",pos:["LW","LM"],rating:87,type:"Lokal"},
  {name:"Erwin Ramdani",pos:["LW","LM","RM"],rating:85,type:"Lokal"},
  {name:"Febri Hariyadi",pos:["LW","LM"],rating:87,type:"Lokal"},
  {name:"Nazriel",pos:["CDM","CM"],rating:82,type:"Youth"},
  {name:"Zulham Zamrun",pos:["LW","ST"],rating:87,type:"Lokal"},
  {name:"Tantan",pos:["LW","RW"],rating:82,type:"Lokal"},
  {name:"Ciro Alves",pos:["RW","ST","LW"],rating:93,type:"Asing"},
  {name:"Fulgensius Billy Keraf",pos:["RW","ST","RM"],rating:80,type:"Youth"},
  {name:"David da Silva",pos:["ST"],rating:96,type:"Asing"},
  {name:"Uilliam Baros",pos:["LW","RW","LB"],rating:87,type:"Asing"},
  {name:"Wander Luiz",pos:["ST","CAM"],rating:90,type:"Asing"},
  {name:"Jonathan Bauman",pos:["ST","CAM"],rating:90,type:"Asing"},
  {name:"Ezechiel N'Douassel",pos:["ST","RW"],rating:88,type:"Asing"},
  {name:"Geoffrey Castillion",pos:["ST","LW"],rating:83,type:"Asing"},
  {name:"Serginho van Dijk",pos:["ST","LW"],rating:88,type:"Asing"},
  {name:"Carlton Cole",pos:["ST"],rating:82,type:"Asing"},
  {name:"Belencoso",pos:["ST"],rating:84,type:"Asing"},
  {name:"Muchlis Hadi Ning",pos:["ST","LW"],rating:81,type:"Lokal"},
  {name:"Airlangga S.",pos:["ST","RW"],rating:81,type:"Lokal"},
  {name:"Rachmat Irianto",pos:["CDM","CB","RB"],rating:83,type:"Lokal"},
  {name:"Edo Febriansyah",pos:["LB","LWB","LM"],rating:84,type:"Lokal"},
  {name:"Ryan Kurnia",pos:["ST","RW","LW"],rating:83,type:"Lokal"},
  {name:"Thom Haye",pos:["CM","CAM","CDM"],rating:93,type:"Lokal"},
  {name:"Makan Konate",pos:["CAM","CM","LW"],rating:91,type:"Asing"},
  {name:"Stefano Beltrame",pos:["CAM","LW","RW"],rating:88,type:"Asing"},
  {name:"Gustavo Franca",pos:["CB"],rating:89,type:"Asing"},
  {name:"Tyronne Del Pino",pos:["CAM"],rating:93,type:"Asing"},
  {name:"Rezaldi Hehanussa",pos:["LB","LWB","LM"],rating:84,type:"Lokal"},
  {name:"Eka Ramdani",pos:["CM","CDM","CAM"],rating:87,type:"Lokal"},
  {name:"Berguinho",pos:["RW","CAM"],rating:89,type:"Asing"},
  {name:"Adzikry",pos:["LW","RW"],rating:82,type:"Youth"},
  {name:"Mateo Kojican",pos:["CDM","CM"],rating:85,type:"Asing"},
  {name:"Firman Utina",pos:["CAM","CM"],rating:91,type:"Lokal"},
  {name:"Ridwan",pos:["RW","RM"],rating:88,type:"Lokal"},
  {name:"Gonzales",pos:["ST"],rating:95,type:"Asing"},
  {name:"Ferdinand Sinaga",pos:["ST","LW"],rating:89,type:"Lokal"},
  {name:"Nova Arianto",pos:["CB"],rating:87,type:"Lokal"},
  {name:"Hilton Morreira",pos:["LW","RW"],rating:89,type:"Asing"},
  {name:"Dimas Drajad",pos:["ST"],rating:84,type:"Youth"},
  {name:"Anwar Sanusi",pos:["GK"],rating:98,type:"Legenda"},
  {name:"Robby Darwis",pos:["CB"],rating:98,type:"Legenda"},
  {name:"Yusuf Bachtiar",pos:["CM"],rating:98,type:"Legenda"},
  {name:"Yudi Guntara",pos:["CAM"],rating:98,type:"Legenda"},
  {name:"Sutiono Lamso",pos:["ST"],rating:98,type:"Legenda"},
  {name:"Levy Madinda",pos:["CM","CAM"],rating:86,type:"Asing"},
  {name:"Omid Nazari",pos:["CM","CAM"],rating:86,type:"Asing"},
  {name:"Radovic",pos:["CAM"],rating:89,type:"Asing"},
  {name:"Siswanto",pos:["LW","RW"],rating:82,type:"Lokal"},
  {name:"Lopicic",pos:["CAM","LW","RW"],rating:81,type:"Asing"},
  {name:"Kippersluis",pos:["ST","CAM"],rating:80,type:"Asing"},
  {name:"Pablo Frances",pos:["CAM","LW"],rating:79,type:"Asing"},
  {name:"Weeks Lewis",pos:["LW","CAM","RW"],rating:80,type:"Asing"},
  {name:"Jajang Sukmara",pos:["LB","RB","RWB"],rating:77,type:"Lokal"},
  {name:"Agung Pribadi",pos:["CAM","CM"],rating:77,type:"Lokal"},
  {name:"Dias Angga",pos:["RB","LB","LWB"],rating:77,type:"Lokal"},
  {name:"Sigit Hermawan",pos:["ST","LW","RW"],rating:78,type:"Lokal"},
  {name:"Yandi Sofyan",pos:["ST","LW"],rating:81,type:"Lokal"},
  {name:"Zaenal Arief",pos:["ST"],rating:87,type:"Lokal"},
  {name:"Aliyudin",pos:["LW","LM","RM"],rating:81,type:"Lokal"},
  {name:"Yanto Basna",pos:["CB"],rating:80,type:"Lokal"},
  {name:"Maman",pos:["CB"],rating:83,type:"Lokal"},
];
// Compute tier from rating — single source of truth
const PLAYERS = RAW.map(p => ({ ...p, tier: getTier(p.rating) }));

const FORMATIONS = {
  "4-3-3":  {slots:["GK","LB","CB","CB","RB","CM","CM","CM","LW","ST","RW"],desc:"Balanced, wide attack"},
  "4-4-2":  {slots:["GK","LB","CB","CB","RB","LM","CM","CM","RM","ST","ST"],desc:"Classic double striker"},
  "4-2-3-1":{slots:["GK","LB","CB","CB","RB","CDM","CDM","LW","CAM","RW","ST"],desc:"Double pivot, attacking trio"},
  "3-5-2":  {slots:["GK","CB","CB","CB","LWB","CM","CM","CM","RWB","ST","ST"],desc:"Wing-back dominance"},
  "5-3-2":  {slots:["GK","LWB","CB","CB","CB","RWB","CM","CM","CM","ST","ST"],desc:"Solid defence, counter"},
  "4-1-4-1":{slots:["GK","LB","CB","CB","RB","CDM","LM","CM","CM","RM","ST"],desc:"CDM anchor, wide control"},
  "3-4-3":  {slots:["GK","CB","CB","CB","LM","CM","CM","RM","LW","ST","RW"],desc:"All-out attack"},
};

const COORDS = {
  "4-3-3":  [[50,90],[13,71],[35,71],[65,71],[87,71],[25,51],[50,47],[75,51],[15,24],[50,16],[85,24]],
  "4-4-2":  [[50,90],[13,71],[35,71],[65,71],[87,71],[13,49],[37,45],[63,45],[87,49],[36,18],[64,18]],
  "4-2-3-1":[[50,90],[13,71],[35,71],[65,71],[87,71],[36,59],[64,59],[15,37],[50,32],[85,37],[50,15]],
  "3-5-2":  [[50,90],[26,71],[50,71],[74,71],[11,53],[32,49],[50,45],[68,49],[89,53],[36,18],[64,18]],
  "5-3-2":  [[50,90],[11,65],[28,72],[50,72],[72,72],[89,65],[28,49],[50,45],[72,49],[36,18],[64,18]],
  "4-1-4-1":[[50,90],[13,71],[35,71],[65,71],[87,71],[50,61],[13,47],[36,43],[64,43],[87,47],[50,15]],
  "3-4-3":  [[50,90],[26,73],[50,73],[74,73],[16,53],[38,49],[62,49],[84,53],[16,24],[50,16],[84,24]],
};

const DEF_POS=["CB","LB","RB","LWB","RWB"];
const MID_POS=["CM","CDM","CAM","LM","RM"];
const FWD_POS=["LW","RW","ST"];
const getPosCategory = p => p==="GK"?"GK":DEF_POS.includes(p)?"DEF":MID_POS.includes(p)?"MID":"FWD";
const CAT_COLOR={GK:"#A855F7",DEF:"#3B82F6",MID:"#22C55E",FWD:"#EF4444"};
const CAT_DARK ={GK:"#7C3AED",DEF:"#1D4ED8",MID:"#15803D",FWD:"#B91C1C"};

const TIER_COLOR={Legenda:"#FF6BFF",Gold:"#F59E0B",Silver:"#94A3B8",Bronze:"#7C4A1E"};
const TIER_GLOW ={Legenda:"rgba(255,107,255,0.5)",Gold:"rgba(245,158,11,0.4)",Silver:"rgba(148,163,184,0.25)",Bronze:"rgba(124,74,30,0.4)"};
const TIER_BG   ={Legenda:"rgba(255,107,255,0.1)",Gold:"rgba(245,158,11,0.1)",Silver:"rgba(148,163,184,0.07)",Bronze:"rgba(124,74,30,0.12)"};
const TYPE_COLOR={Lokal:"#22C55E",Asing:"#F97316",Youth:"#38BDF8",Legenda:"#F59E0B"};
const STAGE_NAMES=["Indonesia Super League","ASEAN Club Championship","AFC CL Elite"];

// Opponents — remove Persib
const OPPONENTS = {
  stage1:[
    {name:"Borneo FC",rating:93},{name:"Persija Jakarta",rating:88},
    {name:"Persebaya Surabaya",rating:83},{name:"Bhayangkara Presisi",rating:81},{name:"Malut United",rating:80},
    {name:"Dewa United",rating:79},{name:"Arema FC",rating:79},{name:"Bali United",rating:78},
    {name:"PSM Makassar",rating:78},{name:"Madura United",rating:77},{name:"Persita Tangerang",rating:77},
    {name:"Persik Kediri",rating:76},{name:"PSIM Yogyakarta",rating:76},{name:"Persijap Jepara",rating:75},
    {name:"Persis Solo",rating:75},{name:"Semen Padang FC",rating:74},{name:"PSBS Biak",rating:74},
  ],
  stage2:[
    {name:"Johor Darul Ta'zim",rating:92},{name:"BG Pathum United",rating:90},{name:"Buriram United",rating:89},
    {name:"Lion City Sailors",rating:86},{name:"Cong An Hanoi",rating:87},{name:"Nam Dinh FC",rating:84},
    {name:"Selangor FC",rating:85},{name:"True Bangkok United",rating:86},{name:"Chiang Rai United",rating:83},
    {name:"Tampines Rovers",rating:82},{name:"Shan United",rating:81},{name:"DPMM FC",rating:80},
    {name:"Kaya FC",rating:79},{name:"Preah Khan Reach",rating:78},{name:"Visakha FC",rating:78},
    {name:"Young Elephants FC",rating:77},{name:"Lalenok United",rating:76},
  ],
  stage3:[
    {name:"Al-Hilal",rating:95},{name:"Al-Nassr",rating:93},{name:"Al-Ahli",rating:91},
    {name:"Vissel Kobe",rating:90},{name:"Kawasaki Frontale",rating:89},{name:"Kashima Antlers",rating:88},
    {name:"Ulsan HD",rating:89},{name:"Jeonbuk Hyundai",rating:88},{name:"Pohang Steelers",rating:87},
    {name:"Persepolis",rating:87},{name:"Esteghlal",rating:85},{name:"Al-Sadd",rating:86},
    {name:"Al-Ain",rating:86},{name:"Shanghai Port",rating:85},{name:"Shandong Taishan",rating:84},
    {name:"Pakhtakor",rating:83},{name:"Central Coast Mariners",rating:82},
  ],
};

function rollTier(){ const r=Math.random(); return r<0.45?"Bronze":r<0.80?"Silver":r<0.97?"Gold":"Legenda"; }
function getPool(pos,tier,excl=[]){
  let pool=PLAYERS.filter(p=>p.pos.includes(pos)&&p.tier===tier&&!excl.includes(p.name));
  if(!pool.length){
    const fallbacks={Legenda:["Gold","Silver","Bronze"],Gold:["Silver","Bronze"],Silver:["Bronze"],Bronze:["Silver"]};
    for(const fb of (fallbacks[tier]||[])){
      pool=PLAYERS.filter(p=>p.pos.includes(pos)&&p.tier===fb&&!excl.includes(p.name));
      if(pool.length) break;
    }
  }
  if(!pool.length){ pool=PLAYERS.filter(p=>p.pos.includes(pos)&&!excl.includes(p.name)); }
  return pool;
}
function shuffle(a){ const b=[...a]; for(let i=b.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [b[i],b[j]]=[b[j],b[i]]; } return b; }
function rnd(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }

function calcOVR(slots){
  const filled=slots.filter(s=>s.player);
  if(filled.length<11)return 0;
  const g=[],d=[],m=[],f=[];
  filled.forEach(s=>{
    const r=s.player.rating, p=s.pos;
    if(p==="GK")g.push(r); else if(DEF_POS.includes(p))d.push(r);
    else if(MID_POS.includes(p))m.push(r); else if(FWD_POS.includes(p))f.push(r);
  });
  const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
  const base=avg(g)*0.15+avg(d)*0.25+avg(m)*0.35+avg(f)*0.25;
  const yc=filled.filter(s=>s.player.type==="Youth").length;
  return Math.round((base+(yc>=5?6:yc>=3?3:0))*10)/10;
}

// Full season simulation with stats
function simulateFullSeason(ovr, opponents, lineup){
  // Build home+away fixture list (17 opponents × 2 = 34)
  const fixtures = [];
  opponents.forEach(opp=>{ fixtures.push({...opp,home:true}); fixtures.push({...opp,home:false}); });
  const shuffled = shuffle(fixtures).slice(0,34);

  // Player goal/assist/save distributions
  const fwds  = lineup.filter(s=>FWD_POS.includes(s.pos)&&s.player).map(s=>s.player);
  const mids  = lineup.filter(s=>MID_POS.includes(s.pos)&&s.player).map(s=>s.player);
  const defs  = lineup.filter(s=>DEF_POS.includes(s.pos)&&s.player).map(s=>s.player);
  const gk    = lineup.find(s=>s.pos==="GK"&&s.player)?.player;

  const playerStats = {};
  lineup.forEach(s=>{ if(s.player) playerStats[s.player.name]={goals:0,assists:0,saves:0}; });

  const matchResults = [];
  let W=0,D=0,L=0,pts=0,gf=0,ga=0,longestWin=0,curWin=0;
  let biggestWin={margin:-99,desc:""}, highestScoring={total:-1,desc:""}, biggestLoss={margin:-99,desc:""};

  shuffled.forEach(opp=>{
    const myBase=ovr+(opp.home?3:0)+(Math.random()-0.5)*20;
    const oppBase=opp.rating+(opp.home?0:3)+(Math.random()-0.5)*20;
    const diff=myBase-oppBase;

    let myGoals,oppGoals;
    if(diff>10){ myGoals=rnd(2,5); oppGoals=rnd(0,1); W++;pts+=3;curWin++;longestWin=Math.max(longestWin,curWin); }
    else if(diff>=0){
      myGoals=rnd(1,3); oppGoals=rnd(1,3);
      if(myGoals===oppGoals){D++;pts+=1;curWin=0;}
      else if(myGoals>oppGoals){W++;pts+=3;curWin++;longestWin=Math.max(longestWin,curWin);}
      else{L++;curWin=0;}
    }
    else{ myGoals=rnd(0,2); oppGoals=rnd(1,4); L++;curWin=0; }
    gf+=myGoals; ga+=oppGoals;

    // Distribute goals — FWD 65%, MID 25%, DEF 10%, GK 0%
    for(let g=0;g<myGoals;g++){
      const r=Math.random();
      let scorer=null;
      if(r<0.65&&fwds.length) scorer=fwds[Math.floor(Math.random()*fwds.length)];
      else if(r<0.90&&mids.length) scorer=mids[Math.floor(Math.random()*mids.length)];
      else if(defs.length) scorer=defs[Math.floor(Math.random()*defs.length)];
      // GK never scores — fallback to fwd if scorer still null
      if(!scorer&&fwds.length) scorer=fwds[Math.floor(Math.random()*fwds.length)];
      if(scorer&&playerStats[scorer.name]) playerStats[scorer.name].goals++;
      // Assist — MID 55%, FWD 30%, DEF 15%, GK 0% (impossible)
      if(Math.random()<0.75){
        const ra=Math.random();
        let ast=null;
        if(ra<0.55&&mids.length) ast=mids[Math.floor(Math.random()*mids.length)];
        else if(ra<0.85&&fwds.length) ast=fwds.filter(p=>p!==scorer)[Math.floor(Math.random()*Math.max(1,fwds.filter(p=>p!==scorer).length))];
        else if(defs.length) ast=defs[Math.floor(Math.random()*defs.length)];
        // GK intentionally excluded
        if(ast&&playerStats[ast.name]&&ast!==scorer) playerStats[ast.name].assists++;
      }
    }

    // KEY ACTIONS: GK=Saves, DEF=Tackles, MID=Interceptions, FWD=Shots
    // GK saves
    if(gk&&playerStats[gk.name]){
      playerStats[gk.name].saves+=rnd(0, Math.max(1, oppGoals+rnd(0,3)));
    }
    // DEF tackles — proportional to danger
    defs.forEach(d=>{
      if(playerStats[d.name]) playerStats[d.name].saves+=rnd(0,3);
    });
    // MID interceptions — 1-2 per mid per game
    mids.forEach(m=>{
      if(Math.random()<0.5&&playerStats[m.name]) playerStats[m.name].saves+=rnd(0,2);
    });
    // FWD shots (not saves — track in same field as "key actions")
    fwds.forEach(f=>{
      if(Math.random()<0.7&&playerStats[f.name]) playerStats[f.name].saves+=rnd(1,3);
    });

    const margin=myGoals-oppGoals;
    if(margin>biggestWin.margin) biggestWin={margin,desc:`${myGoals}-${oppGoals} vs ${opp.name}`};
    if(myGoals+oppGoals>highestScoring.total) highestScoring={total:myGoals+oppGoals,desc:`${myGoals}-${oppGoals} vs ${opp.name}`};
    if(oppGoals-myGoals>biggestLoss.margin) biggestLoss={margin:oppGoals-myGoals,desc:`${myGoals}-${oppGoals} vs ${opp.name}`};

    matchResults.push({opp:opp.name,home:opp.home,myGoals,oppGoals,result:myGoals>oppGoals?"W":myGoals===oppGoals?"D":"L"});
  });

  // Simulate other clubs for standings
  const otherClubs = opponents.map(opp=>{
    let op=0; const str=opp.rating/100;
    for(let i=0;i<34;i++){ const r=Math.random(); op+=r<str*0.55?3:r<str*0.75?1:0; }
    return {name:opp.name,pts:op,rating:opp.rating};
  });
  const standings=[{name:"Maung XI",pts,isPlayer:true},...otherClubs].sort((a,b)=>b.pts-a.pts);
  const position=standings.findIndex(s=>s.isPlayer)+1;

  // Awards
  const statsArr=Object.entries(playerStats).map(([name,s])=>({name,...s}));
  const topScorer=statsArr.sort((a,b)=>b.goals-a.goals)[0];
  const topAssist=statsArr.sort((a,b)=>b.assists-a.assists)[0];
  const topSave  =statsArr.sort((a,b)=>b.saves-a.saves)[0];
  const pots     =statsArr.sort((a,b)=>(b.goals+b.assists)-(a.goals+a.assists))[0];
  const cleanSheets=matchResults.filter(r=>r.oppGoals===0).length;

  return {W,D,L,pts,gf,ga,matchResults,playerStats,standings,position,
    topScorer,topAssist,topSave,pots,cleanSheets,longestWin,biggestWin,highestScoring,biggestLoss};
}



// ── TIGER BADGE (Biru + Putih) ───────────────────────────────────────────────
function TigerBadge({size=36}){
  const s = size;
  return(
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{flexShrink:0}}>
      <defs>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1D4ED8"/>
          <stop offset="100%" stopColor="#003DA5"/>
        </linearGradient>
      </defs>
      {/* Shield shape */}
      <path d="M20 2 L36 8 L36 23 C36 32 20 38 20 38 C20 38 4 32 4 23 L4 8 Z"
        fill="url(#shieldGrad)"/>
      {/* White border */}
      <path d="M20 2 L36 8 L36 23 C36 32 20 38 20 38 C20 38 4 32 4 23 L4 8 Z"
        fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8"/>
      {/* Inner shield line */}
      <path d="M20 6 L32 11 L32 22 C32 29 20 34 20 34 C20 34 8 29 8 22 L8 11 Z"
        fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.6"/>
      {/* "M" lettermark — bold white */}
      <text x="20" y="26" textAnchor="middle" fontSize="17" fontWeight="900"
        fill="white" fontFamily="Arial,sans-serif" letterSpacing="-1">M</text>
      {/* Decorative top line */}
      <line x1="12" y1="12" x2="28" y2="12" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>
    </svg>
  );
}

// ── OVR PANEL (real-time draft strength breakdown + Youth chemistry) ─────────
function OvrPanel({slots}){
  const filled = slots.filter(s=>s.player);
  if(!filled.length) return null;

  const groups = {GK:[], DEF:[], MID:[], FWD:[]};
  filled.forEach(s=>{ groups[getPosCategory(s.pos)].push(s.player.rating); });
  const avg = a => a.length ? Math.round(a.reduce((x,y)=>x+y,0)/a.length) : null;

  const gAvg=avg(groups.GK)||0, dAvg=avg(groups.DEF)||0, mAvg=avg(groups.MID)||0, fAvg=avg(groups.FWD)||0;
  const filledCats=[gAvg>0?0.15:0,dAvg>0?0.25:0,mAvg>0?0.35:0,fAvg>0?0.25:0];
  const totalWeight=filledCats.reduce((a,b)=>a+b,0);
  const baseOvr=totalWeight>0?Math.round((gAvg*filledCats[0]+dAvg*filledCats[1]+mAvg*filledCats[2]+fAvg*filledCats[3])/totalWeight):0;

  // Youth chemistry
  const youthCount = filled.filter(s=>s.player.type==="Youth").length;
  const youthBonus = youthCount>=5?6:youthCount>=3?3:0;
  const ovr = baseOvr + youthBonus;
  const nextBonus = youthCount<3?3:youthCount<5?6:null;
  const nextAt = youthCount<3?3:youthCount<5?5:null;

  const cats = [
    {label:"Attack",  val:fAvg, color:"#EF4444"},
    {label:"Midfield",val:mAvg, color:"#22C55E"},
    {label:"Defence", val:dAvg, color:"#3B82F6"},
    {label:"GK",      val:gAvg, color:"#A855F7"},
  ];

  return(
    <div style={{background:"#0D1828",borderRadius:12,padding:"12px 14px",marginBottom:12}}>
      {/* OVR row */}
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <div>
          <div style={{fontSize:9,fontWeight:700,color:"#475569",textTransform:"uppercase",letterSpacing:1}}>Overall</div>
          <div style={{display:"flex",alignItems:"baseline",gap:5}}>
            <span style={{fontSize:28,fontWeight:800,color:"#E2E8F0",lineHeight:1}}>{ovr||"—"}</span>
            {youthBonus>0&&<span style={{fontSize:11,fontWeight:700,color:"#38BDF8"}}>+{youthBonus} Youth</span>}
          </div>
        </div>
        <div style={{marginLeft:"auto",textAlign:"right"}}>
          <div style={{fontSize:11,color:"#475569"}}>{filled.length}/11 pemain</div>
          {youthBonus>0&&<div style={{fontSize:10,fontWeight:600,color:"#38BDF8"}}>⚡ Youth Chemistry aktif!</div>}
        </div>
      </div>

      {/* Category bars */}
      {cats.map(({label,val,color})=>(
        <div key={label} style={{marginBottom:7}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
            <div style={{fontSize:11,fontWeight:600,color:"#94A3B8",display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:color}}/>
              {label}
            </div>
            <div style={{fontSize:12,fontWeight:800,color:val?color:"#334155"}}>{val||"—"}</div>
          </div>
          <div style={{height:4,background:"rgba(255,255,255,0.07)",borderRadius:3,overflow:"hidden"}}>
            <div style={{height:"100%",borderRadius:3,background:color,
              width:val?`${Math.min(100,((val-70)/30)*100)}%`:"0%",transition:"width 0.4s ease"}}/>
          </div>
        </div>
      ))}

      {/* Youth chemistry tracker */}
      <div style={{marginTop:10,paddingTop:9,borderTop:"1px solid rgba(255,255,255,0.06)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
          <div style={{fontSize:10,fontWeight:700,color:"#38BDF8",display:"flex",alignItems:"center",gap:5}}>
            <span>🌟</span> Youth Chemistry
          </div>
          <div style={{fontSize:10,color:"#475569"}}>{youthCount} Youth di lineup</div>
        </div>
        {/* Progress dots */}
        <div style={{display:"flex",gap:4,alignItems:"center",marginBottom:5}}>
          {[1,2,3,4,5].map(n=>{
            const active=youthCount>=n;
            const isMilestone=n===3||n===5;
            return(
              <div key={n} style={{
                width:isMilestone?28:18,height:18,borderRadius:4,
                background:active?"rgba(56,189,248,0.25)":"rgba(255,255,255,0.04)",
                border:`1px solid ${active?"#38BDF8":"rgba(255,255,255,0.08)"}`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:9,fontWeight:700,
                color:active?"#38BDF8":"#334155",
                transition:"all 0.3s",
              }}>
                {isMilestone?(active?`+${n===3?3:6}`:`+${n===3?3:6}`):`${n}`}
              </div>
            );
          })}
          <div style={{fontSize:10,color:"#475569",marginLeft:2}}>OVR bonus</div>
        </div>
        {youthBonus>0?(
          <div style={{fontSize:10,fontWeight:600,color:"#38BDF8",background:"rgba(56,189,248,0.08)",padding:"3px 8px",borderRadius:6,display:"inline-block"}}>
            ✅ +{youthBonus} OVR aktif{nextAt?` · ${nextAt-youthCount} lagi untuk +${nextBonus}`:""}
          </div>
        ):(
          <div style={{fontSize:10,color:"#334155"}}>
            Tambah {3-youthCount} Youth lagi untuk unlock +3 OVR bonus
          </div>
        )}
      </div>
    </div>
  );
}

// ── PITCH ─────────────────────────────────────────────────────────────────────
function Pitch({formation,slots,activeSlot,onSlotClick,readonly=false}){
  if(!formation)return null;
  const coords=COORDS[formation];
  return(
    <div style={{position:"relative",width:"100%",paddingBottom:"min(112%, 420px)",borderRadius:10,overflow:"hidden",background:"#1a5c1a"}}>
      {/* Clean SVG pitch markings */}
      <svg style={{position:"absolute",inset:0,width:"100%",height:"100%"}} viewBox="0 0 100 112" preserveAspectRatio="none">
        <rect x="0" y="0" width="100" height="112" fill="#2d7a2d"/>
        {/* Alternating stripes */}
        {[0,1,2,3,4,5].map(i=>(
          <rect key={i} x="0" y={i*19} width="100" height="9.5" fill={i%2===0?"rgba(0,0,0,0.06)":"rgba(0,0,0,0)"}/>
        ))}
        {/* Lines */}
        <rect x="2" y="2" width="96" height="108" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.6"/>
        <line x1="2" y1="56" x2="98" y2="56" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5"/>
        <circle cx="50" cy="56" r="9" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.5"/>
        <circle cx="50" cy="56" r="0.8" fill="rgba(255,255,255,0.5)"/>
        {/* Top penalty box */}
        <rect x="23" y="2" width="54" height="17" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.5"/>
        <rect x="36" y="2" width="28" height="9" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.5"/>
        <circle cx="50" cy="12" r="0.8" fill="rgba(255,255,255,0.4)"/>
        {/* Bottom penalty box */}
        <rect x="23" y="93" width="54" height="17" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.5"/>
        <rect x="36" y="103" width="28" height="9" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.5"/>
        <circle cx="50" cy="100" r="0.8" fill="rgba(255,255,255,0.4)"/>
      </svg>
      {/* Player nodes */}
      {slots.map((s,i)=>{
        const [cx,cy]=coords[i]||[50,50];
        const isActive=s.id===activeSlot;
        const filled=!!s.player;
        const cat=getPosCategory(s.pos);
        const cc=CAT_COLOR[cat];
        const cd=CAT_DARK[cat];
        const firstName=filled?s.player.name.split(" ")[0]:"";
        return(
          <div key={s.id} onClick={()=>!readonly&&!filled&&onSlotClick?.(s.id)}
            style={{position:"absolute",left:`${cx}%`,top:`${cy}%`,transform:"translate(-50%,-50%)",
              display:"flex",flexDirection:"column",alignItems:"center",gap:2,
              cursor:readonly||filled?"default":"pointer",zIndex:2}}>
            <div style={{
              width:36,height:36,borderRadius:"50%",
              background:filled
                ? `radial-gradient(circle at 35% 35%, ${cc}, ${cd})`
                : isActive
                  ? `rgba(255,255,255,0.15)`
                  : `rgba(0,0,0,0.5)`,
              border:`2px ${isActive?"solid":"dashed"} ${isActive?"#fff":filled?cc:cc+"99"}`,
              display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",
              boxShadow:filled
                ? `0 2px 8px rgba(0,0,0,0.5), 0 0 0 1px ${cc}66`
                : isActive?"0 0 14px #fff9":"none",
              transition:"all 0.2s",
            }}>
              <span style={{fontSize:filled?11:9,fontWeight:800,color:"#fff",lineHeight:1,textShadow:"0 1px 3px rgba(0,0,0,0.8)"}}>
                {filled?s.player.rating:s.pos}
              </span>
            </div>
            <div style={{
              background:"rgba(0,0,0,0.82)",borderRadius:4,padding:"1px 5px",
              fontSize:9,color:"rgba(255,255,255,0.9)",fontWeight:600,
              whiteSpace:"nowrap",maxWidth:54,overflow:"hidden",textOverflow:"ellipsis",
              display:filled?"block":"none",
            }}>{firstName}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── PLAYER CARD ───────────────────────────────────────────────────────────────
function PlayerCard({card,onClick,selected,selectable}){
  const [vis,setVis]=useState({tier:false,player:false});
  useEffect(()=>{ if(card.tierVisible&&!vis.tier) setVis(v=>({...v,tier:true})); },[card.tierVisible]);
  useEffect(()=>{ if(card.playerVisible&&!vis.player) setVis(v=>({...v,player:true})); },[card.playerVisible]);
  const tier=card.tier; const tc=TIER_COLOR[tier]; const bg=vis.tier?TIER_BG[tier]:"rgba(255,255,255,0.02)";
  const cat=card.player?getPosCategory(card.player.pos[0]):null;
  const posColor=cat?CAT_COLOR[cat]:"#94A3B8";
  return(
    <div onClick={()=>selectable&&card.player&&onClick?.()} style={{
      background:bg,border:`1.5px solid ${selected?"#60A5FA":vis.tier?tc:"rgba(255,255,255,0.07)"}`,
      borderRadius:10,padding:"10px 6px",cursor:selectable&&card.player?"pointer":"default",
      transition:"all 0.25s",display:"flex",flexDirection:"column",alignItems:"center",gap:4,
      minHeight:120,justifyContent:"center",
      transform:selected?"translateY(-3px) scale(1.03)":"none",
      boxShadow:selected?`0 6px 20px ${TIER_GLOW[tier]}`:vis.tier?`0 2px 8px ${TIER_GLOW[tier]}`:"none",
    }}>
      {!vis.tier&&<div style={{fontSize:26,color:"rgba(255,255,255,0.07)",fontWeight:800}}>?</div>}
      {vis.tier&&(
        <>
          <div style={{fontSize:8,fontWeight:800,color:tc,letterSpacing:1.5,textTransform:"uppercase",animation:"tierPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both"}}>{tier}</div>
          <div style={{fontSize:28,fontWeight:800,color:tc,lineHeight:1,textShadow:`0 0 12px ${TIER_GLOW[tier]}`,animation:"tierPop 0.45s cubic-bezier(0.34,1.56,0.64,1) both"}}>
            {card.player?card.player.rating:"—"}
          </div>
        </>
      )}
      {vis.player&&card.player&&(
        <>
          <div style={{fontSize:11,fontWeight:700,color:"#F1F5F9",textAlign:"center",lineHeight:1.2,animation:"nameSlide 0.3s ease both",padding:"0 2px"}}>{card.player.name}</div>
          <div style={{display:"flex",gap:2,alignItems:"center",justifyContent:"center",flexWrap:"wrap",animation:"nameSlide 0.35s ease both"}}>
            {card.player.pos.map(p=>{
              const pc=CAT_COLOR[getPosCategory(p)];
              return <span key={p} style={{fontSize:8,fontWeight:700,color:pc,background:`${pc}18`,padding:"1px 5px",borderRadius:20,border:`1px solid ${pc}33`}}>{p}</span>;
            })}
          </div>
          <div style={{fontSize:9,color:TYPE_COLOR[card.player.type]||"#94A3B8",fontWeight:600,animation:"nameSlide 0.4s ease both"}}>{card.player.type}</div>
        </>
      )}
    </div>
  );
}

// ── GUIDE BOX ─────────────────────────────────────────────────────────────────
function GuideBox({icon,title,children}){
  return(
    <div style={{background:"rgba(59,130,246,0.07)",border:"1px solid rgba(59,130,246,0.2)",borderRadius:10,padding:"12px 14px",marginBottom:14}}>
      <div style={{fontSize:12,fontWeight:700,color:"#60A5FA",marginBottom:6,display:"flex",alignItems:"center",gap:6}}>
        <span>{icon}</span>{title}
      </div>
      <div style={{fontSize:12,color:"#94A3B8",lineHeight:1.7}}>{children}</div>
    </div>
  );
}

// ── SIMULATION VIEW ───────────────────────────────────────────────────────────
function SimulationView({ovr,opponents,lineup,onDone}){
  // Single state object — no split state, no race conditions
  const [tick, setTick] = useState(0);
  const store = useRef({
    allMatches: [],   // pre-computed 34 matches
    shown: [],        // matches revealed so far
    finalData: null,
    done: false,
  });

  // Pre-compute on mount
  useEffect(()=>{
    const fd = simulateFullSeason(ovr, opponents, lineup);
    fd.ovr = ovr;
    store.current.allMatches = fd.matchResults;
    store.current.finalData = fd;

    let idx = 0;
    const iv = setInterval(()=>{
      if(idx < store.current.allMatches.length){
        store.current.shown = store.current.allMatches.slice(0, idx+1);
        idx++;
        setTick(t => t+1); // trigger re-render
      } else {
        clearInterval(iv);
        store.current.done = true;
        setTick(t => t+1);
      }
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const { shown, finalData, done } = store.current;
  const W = shown.filter(r=>r.result==="W").length;
  const D = shown.filter(r=>r.result==="D").length;
  const L = shown.filter(r=>r.result==="L").length;
  const pts = W*3+D;
  const latest = shown[shown.length-1];

  if(!done){
    return(
      <div>
        <div style={{textAlign:"center",marginBottom:16}}>
          <div style={{fontSize:12,color:"#475569",marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>Sedang bermain... ({shown.length}/34)</div>
          <div style={{fontSize:13,fontWeight:600,color:"#94A3B8",minHeight:20}}>
            {latest ? (
              <span>
                <span style={{color:latest.home?"#22C55E":"#F97316"}}>{latest.home?"Kandang":"Tandang"}</span>
                {" vs "}{latest.opp} —{" "}
                <span style={{color:latest.result==="W"?"#22C55E":latest.result==="D"?"#F59E0B":"#EF4444",fontWeight:700}}>
                  {latest.myGoals}-{latest.oppGoals}
                </span>
              </span>
            ) : "Memulai musim..."}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7,marginBottom:12}}>
          {[["Menang",W,"#22C55E"],["Seri",D,"#F59E0B"],["Kalah",L,"#EF4444"]].map(([l,v,c])=>(
            <div key={l} style={{background:"#0D1828",borderRadius:9,padding:"10px",textAlign:"center"}}>
              <div style={{fontSize:22,fontWeight:800,color:c}}>{v}</div>
              <div style={{fontSize:10,color:"#475569"}}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{textAlign:"center",fontSize:14,color:"#3B82F6",fontWeight:800,marginBottom:12}}>{pts} poin</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
          {Array.from({length:34}).map((_,i)=>{
            const r = shown[i];
            const bg = r ? (r.result==="W"?"rgba(34,197,94,0.25)":r.result==="D"?"rgba(245,158,11,0.25)":"rgba(239,68,68,0.2)") : "rgba(255,255,255,0.04)";
            const col = r ? (r.result==="W"?"#22C55E":r.result==="D"?"#F59E0B":"#EF4444") : "#1E293B";
            return(
              <div key={i} style={{borderRadius:4,padding:"4px 2px",textAlign:"center",background:bg,fontSize:10,fontWeight:700,color:col}}>
                {r ? r.result : "·"}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── DONE ──
  if(!finalData) return <div style={{textAlign:"center",padding:20,color:"#475569"}}>Memuat...</div>;
  const fd = finalData;
  const champ = fd.position===1;
  const safeMatches = Array.isArray(fd.matchResults) ? fd.matchResults : [];
  const safeStandings = Array.isArray(fd.standings) ? fd.standings : [];

  return(
    <div>
      <div style={{
        background:champ?"rgba(245,158,11,0.1)":"rgba(59,130,246,0.07)",
        border:`1px solid ${champ?"rgba(245,158,11,0.35)":"rgba(59,130,246,0.2)"}`,
        borderRadius:12,padding:"16px",textAlign:"center",marginBottom:14,
      }}>
        <div style={{fontSize:32,marginBottom:6}}>{champ?"🏆":fd.position<=3?"🥈":"🎯"}</div>
        <div style={{fontSize:16,fontWeight:800,color:champ?"#F59E0B":"#60A5FA"}}>
          {champ?"JUARA!":fd.position<=3?`Posisi ${fd.position} — Podium`:`Posisi ${fd.position}`}
        </div>
        <div style={{fontSize:12,color:"#64748B",marginTop:4}}>{fd.pts} poin · {fd.W}W {fd.D}D {fd.L}L</div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7,marginBottom:14}}>
        {[["Menang",fd.W,"#22C55E"],["Seri",fd.D,"#F59E0B"],["Kalah",fd.L,"#EF4444"],
          ["Gol",fd.gf,"#3B82F6"],["Kebobolan",fd.ga,"#EF4444"],["Clean Sheet",fd.cleanSheets,"#22C55E"]
        ].map(([l,v,c])=>(
          <div key={l} style={{background:"#0D1828",borderRadius:9,padding:"10px",textAlign:"center"}}>
            <div style={{fontSize:18,fontWeight:800,color:c}}>{v}</div>
            <div style={{fontSize:10,color:"#475569",marginTop:1}}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{marginBottom:14}}>
        <div style={{fontSize:11,color:"#475569",fontWeight:600,textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>34 Pertandingan</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:8}}>
          {safeMatches.map((r,i)=>(
            <div key={i} title={`${r.home?"H":"A"} vs ${r.opp}: ${r.myGoals}-${r.oppGoals}`} style={{
              borderRadius:4,padding:"4px 2px",textAlign:"center",
              background:r.result==="W"?"rgba(34,197,94,0.2)":r.result==="D"?"rgba(245,158,11,0.2)":"rgba(239,68,68,0.2)",
              fontSize:10,fontWeight:700,
              color:r.result==="W"?"#22C55E":r.result==="D"?"#F59E0B":"#EF4444",
            }}>{r.result}</div>
          ))}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:4,fontSize:11,color:"#64748B"}}>
          <span>🏆 Kemenangan terbesar: <span style={{color:"#22C55E",fontWeight:600}}>{fd.biggestWin?.desc||"—"}</span></span>
          <span>🎯 Skor terbanyak: <span style={{color:"#F59E0B",fontWeight:600}}>{fd.highestScoring?.desc||"—"}</span></span>
          {fd.biggestLoss?.margin>0&&<span>💔 Kekalahan terbesar: <span style={{color:"#EF4444",fontWeight:600}}>{fd.biggestLoss?.desc||"—"}</span></span>}
        </div>
      </div>

      {(()=>{
        const statsArr = lineup.filter(s=>s.player).map(s=>({
          ...s,
          st:(fd.playerStats&&fd.playerStats[s.player.name])||{goals:0,assists:0,saves:0},
          cat:getPosCategory(s.pos),
        }));
        const topScorer = [...statsArr].sort((a,b)=>b.st.goals-a.st.goals)[0];
        const topAssist = [...statsArr].sort((a,b)=>b.st.assists-a.st.assists)[0];
        const topSaves  = [...statsArr].sort((a,b)=>b.st.saves-a.st.saves)[0];
        const keyLabel  = cat => cat==="GK"?"Saves":cat==="DEF"?"Tackles":cat==="MID"?"Intercept":"Shots";
        return(
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,color:"#475569",fontWeight:600,textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>Statistik Pemain</div>
            {/* Awards row */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7,marginBottom:10}}>
              {[
                {icon:"⚽",label:"Top Skor",player:topScorer,val:topScorer?.st.goals,color:"#22C55E"},
                {icon:"🎯",label:"Top Assist",player:topAssist,val:topAssist?.st.assists,color:"#F59E0B"},
                {icon:"🧤",label:"Top Key",player:topSaves,val:topSaves?.st.saves,color:"#3B82F6"},
              ].map(({icon,label,player,val,color})=>(
                <div key={label} style={{background:"#0D1828",borderRadius:9,padding:"8px 10px"}}>
                  <div style={{fontSize:9,color:"#475569",fontWeight:600,marginBottom:4}}>{icon} {label}</div>
                  <div style={{fontSize:11,fontWeight:700,color:"#E2E8F0",marginBottom:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{player?.player?.name||"—"}</div>
                  <div style={{fontSize:14,fontWeight:800,color}}>{val||0}</div>
                </div>
              ))}
            </div>
            {/* Full table */}
            <div style={{background:"#0D1828",borderRadius:10,overflow:"hidden"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 28px 28px 56px",padding:"6px 10px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                {["Pemain","G","A","Key"].map(h=>(
                  <div key={h} style={{fontSize:10,fontWeight:700,color:"#475569",textAlign:h==="Pemain"?"left":"center"}}>{h}</div>
                ))}
              </div>
              {statsArr.sort((a,b)=>{
                const order=["GK","DEF","MID","FWD"];
                return order.indexOf(a.cat)-order.indexOf(b.cat);
              }).map(({player,pos,st,cat})=>{
                const cc=CAT_COLOR[cat];
                return(
                  <div key={player.name} style={{display:"grid",gridTemplateColumns:"1fr 28px 28px 56px",padding:"5px 10px",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <span style={{fontSize:9,fontWeight:700,color:cc,background:`${cc}18`,padding:"1px 5px",borderRadius:4,flexShrink:0}}>{pos}</span>
                      <span style={{fontSize:11,color:"#CBD5E1",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{player.name}</span>
                    </div>
                    <div style={{fontSize:12,fontWeight:700,color:"#22C55E",textAlign:"center"}}>{st.goals||"·"}</div>
                    <div style={{fontSize:12,fontWeight:700,color:"#F59E0B",textAlign:"center"}}>{st.assists||"·"}</div>
                    <div style={{fontSize:11,fontWeight:600,color:"#3B82F6",textAlign:"center"}}>
                      {st.saves||"·"}
                      <span style={{fontSize:9,color:"#334155",marginLeft:3}}>{keyLabel(cat)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      <div style={{marginBottom:14}}>
        <div style={{fontSize:11,color:"#475569",fontWeight:600,textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>Klasemen Akhir</div>
        <div style={{background:"#0D1828",borderRadius:10,overflow:"hidden"}}>
          {safeStandings.slice(0,5).map((club,i)=>(
            <div key={club.name||i} style={{
              display:"flex",alignItems:"center",padding:"7px 12px",
              borderBottom:"1px solid rgba(255,255,255,0.04)",
              background:club.isPlayer?"rgba(245,158,11,0.08)":"transparent",
            }}>
              <div style={{width:20,fontSize:11,fontWeight:700,color:i<3?"#F59E0B":"#475569"}}>{i+1}</div>
              <div style={{flex:1,fontSize:12,fontWeight:club.isPlayer?700:400,color:club.isPlayer?"#F59E0B":"#CBD5E1"}}>{club.isPlayer?"⭐ Maung XI":club.name}</div>
              <div style={{fontSize:13,fontWeight:700,color:club.isPlayer?"#F59E0B":"#94A3B8"}}>{club.pts}</div>
            </div>
          ))}
          {fd.position>5&&(
            <>
              <div style={{padding:"4px 12px",textAlign:"center",fontSize:10,color:"#334155"}}>···</div>
              <div style={{display:"flex",alignItems:"center",padding:"7px 12px",background:"rgba(245,158,11,0.08)"}}>
                <div style={{width:20,fontSize:11,fontWeight:700,color:"#F59E0B"}}>{fd.position}</div>
                <div style={{flex:1,fontSize:12,fontWeight:700,color:"#F59E0B"}}>⭐ Maung XI</div>
                <div style={{fontSize:13,fontWeight:700,color:"#F59E0B"}}>{fd.pts}</div>
              </div>
            </>
          )}
        </div>
      </div>

      {champ ? (
        <button onClick={()=>onDone(fd)} style={{
          background:"#003DA5",color:"#fff",border:"none",padding:"12px 18px",borderRadius:10,
          fontSize:14,fontWeight:700,cursor:"pointer",width:"100%",
        }}>{fd.stage<2?"Lanjut ke Stage Berikutnya →":"Lihat Hasil Akhir →"}</button>
      ) : (
        <button onClick={()=>onDone(fd)} style={{
          background:"#7F1D1D",color:"#FCA5A5",border:"none",padding:"12px 18px",borderRadius:10,
          fontSize:14,fontWeight:700,cursor:"pointer",width:"100%",
        }}>Lihat Hasil →</button>
      )}
    </div>
  );
}


// ── MAIN ──────────────────────────────────────────────────────────────────────

// ── RECRUIT PHASE COMPONENT ───────────────────────────────────────────────────
function RecruitPhase({stage, slots, excludedNames, onReplace, onSkip, recruitCard, setRecruitCard}){
  const [card, setCard] = useState(recruitCard || null);
  const [cardState, setCardState] = useState(card ? "idle" : "idle"); // idle|spinning|revealed|choosing|replacing
  const [rerollLeft, setRerollLeft] = useState(1);
  const [displayCard, setDisplayCard] = useState({tierVisible:false, playerVisible:false, tier:"Silver", player:null});
  const [replacing, setReplacing] = useState(false);

  // Position compatibility check
  function canFitPosition(player, slotPos){
    return player.pos.includes(slotPos);
  }

  function rollRecruit(){
    const allPos = ["GK","CB","LB","RB","CDM","CM","CAM","LW","RW","ST"];
    const pos = allPos[Math.floor(Math.random()*allPos.length)];
    // stage here = current stage AFTER increment (1=going to stage2, 2=going to stage3)
    let tier;
    if(stage === 1){
      tier = Math.random() < 0.5 ? "Silver" : "Gold";
    } else {
      tier = Math.random() < 0.9 ? "Gold" : "Legenda";
    }
    const pool = getPool(pos, tier, excludedNames);
    if(!pool.length) return null;
    const p = pool[Math.floor(Math.random()*pool.length)];
    return {...p, tier:getTier(p.rating)};
  }

  function startRoll(){
    const p = rollRecruit();
    if(!p){ onSkip(); return; }
    setDisplayCard({tierVisible:false, playerVisible:false, tier:getTier(p.rating), player:p});
    setCardState("spinning");
    setTimeout(()=>setDisplayCard(d=>({...d, tierVisible:true})), 400);
    setTimeout(()=>{
      setDisplayCard(d=>({...d, playerVisible:true}));
      setCardState("revealed");
      setCard(p);
    }, 1300);
  }

  function doReroll(){
    if(rerollLeft<=0) return;
    setRerollLeft(r=>r-1);
    setCardState("spinning");
    setDisplayCard({tierVisible:false, playerVisible:false, tier:"Silver", player:null});
    setTimeout(()=>{
      const p = rollRecruit();
      if(!p){ onSkip(); return; }
      setDisplayCard({tierVisible:false, playerVisible:false, tier:getTier(p.rating), player:p});
      setTimeout(()=>setDisplayCard(d=>({...d, tierVisible:true})), 400);
      setTimeout(()=>{
        setDisplayCard(d=>({...d, playerVisible:true}));
        setCardState("revealed");
        setCard(p);
      }, 1300);
    }, 100);
  }

  const tc = TIER_COLOR[displayCard.tier] || "#94A3B8";
  const bg = displayCard.tierVisible ? TIER_BG[displayCard.tier] : "rgba(255,255,255,0.02)";

  return(
    <div>
      <GuideBox icon="🆕" title={`Rekrutan Baru — ${STAGE_NAMES[stage]}`}>
        Kamu mendapat 1 kesempatan rekrut pemain baru. Klik <strong style={{color:"#60A5FA"}}>Roll Rekrutan</strong> untuk reveal.
        Pemain hanya bisa ditempatkan sesuai posisi naturalnya. Re-roll tersisa: <strong style={{color:"#F59E0B"}}>{rerollLeft}x</strong>
      </GuideBox>

      {cardState === "idle" && (
        <button className="btn-p" onClick={startRoll}>Roll Rekrutan →</button>
      )}

      {(cardState === "spinning" || cardState === "revealed") && (
        <>
          <div style={{display:"flex",justifyContent:"center",marginBottom:14}}>
            {/* Single big card */}
            <div style={{
              width:"min(160px, 45vw)", background:bg,
              border:`2px solid ${displayCard.tierVisible?tc:"rgba(255,255,255,0.08)"}`,
              borderRadius:16, padding:"20px 12px", textAlign:"center",
              boxShadow:displayCard.tierVisible?`0 4px 24px ${TIER_GLOW[displayCard.tier]}`:"none",
              transition:"all 0.3s",
            }}>
              {!displayCard.tierVisible && (
                <div style={{fontSize:36,color:"rgba(255,255,255,0.08)",fontWeight:800,animation:"pulse 0.6s infinite"}}>?</div>
              )}
              {displayCard.tierVisible && (
                <>
                  <div style={{fontSize:10,fontWeight:800,color:tc,letterSpacing:2,textTransform:"uppercase",animation:"tierPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both",marginBottom:6}}>{displayCard.tier}</div>
                  <div style={{fontSize:44,fontWeight:800,color:tc,lineHeight:1,textShadow:`0 0 20px ${TIER_GLOW[displayCard.tier]}`,animation:"tierPop 0.45s cubic-bezier(0.34,1.56,0.64,1) both",marginBottom:8}}>{displayCard.player?.rating||"—"}</div>
                </>
              )}
              {displayCard.playerVisible && displayCard.player && (
                <>
                  <div style={{fontSize:14,fontWeight:700,color:"#F1F5F9",marginBottom:6,animation:"nameSlide 0.3s ease both"}}>{displayCard.player.name}</div>
                  <div style={{display:"flex",gap:4,justifyContent:"center",flexWrap:"wrap",animation:"nameSlide 0.35s ease both"}}>
                    {displayCard.player.pos.map(p=>(
                      <span key={p} style={{fontSize:10,fontWeight:700,color:CAT_COLOR[getPosCategory(p)],background:`${CAT_COLOR[getPosCategory(p)]}18`,padding:"2px 7px",borderRadius:20}}>{p}</span>
                    ))}
                  </div>
                  <div style={{fontSize:11,color:TYPE_COLOR[displayCard.player.type],marginTop:6,fontWeight:600}}>{displayCard.player.type}</div>
                </>
              )}
            </div>
          </div>

          {cardState === "revealed" && card && (
            <>
              {/* Position warning */}
              <div style={{background:"rgba(245,158,11,0.07)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:8,padding:"8px 12px",marginBottom:12,fontSize:11,color:"#F59E0B"}}>
                ⚠️ Pemain ini hanya bisa mengisi slot: <strong>{card.pos.join(", ")}</strong>
              </div>
              <div style={{display:"flex",gap:7,marginBottom:12}}>
                <button className="btn-p" style={{flex:1}} onClick={()=>setReplacing(true)}>Rekrut → pilih yang digeser</button>
                {rerollLeft>0&&<button className="btn-s" onClick={doReroll}>Re-roll ({rerollLeft})</button>}
                <button className="btn-s" style={{color:"#64748B",borderColor:"rgba(255,255,255,0.12)"}} onClick={onSkip}>Lewati</button>
              </div>
            </>
          )}
        </>
      )}

      {replacing && card && (
        <>
          <div style={{fontSize:12,color:"#F59E0B",marginBottom:8,fontWeight:600}}>
            Pilih slot yang digantikan oleh <strong>{card.name}</strong>:
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:8}}>
            {slots.map(s=>{
              const canPlace = canFitPosition(card, s.pos);
              return(
                <div key={s.id} onClick={()=>canPlace&&onReplace(s.id,{...card,tier:getTier(card.rating)})} style={{
                  background:"#0D1828",
                  border:`1px solid ${canPlace?"rgba(239,68,68,0.3)":"rgba(255,255,255,0.04)"}`,
                  borderRadius:9,padding:"9px 6px",cursor:canPlace?"pointer":"not-allowed",
                  textAlign:"center",opacity:canPlace?1:0.35,
                  transition:"all 0.15s",
                }}>
                  <div style={{fontSize:10,color:"#475569",marginBottom:2}}>{s.pos}</div>
                  <div style={{fontSize:10,fontWeight:600,color:canPlace?"#CBD5E1":"#475569",marginBottom:2}}>{s.player?.name.split(" ")[0]||"—"}</div>
                  <div style={{fontSize:12,fontWeight:800,color:TIER_COLOR[getTier(s.player?.rating||76)]}}>{s.player?.rating||"—"}</div>
                  {!canPlace&&<div style={{fontSize:8,color:"#334155",marginTop:2}}>posisi tidak cocok</div>}
                </div>
              );
            })}
          </div>
          <button className="btn-s" style={{color:"#64748B",borderColor:"rgba(255,255,255,0.12)",width:"100%"}} onClick={()=>setReplacing(false)}>← Kembali</button>
        </>
      )}

      {cardState === "idle" && (
        <div style={{marginTop:8}}>
          <button style={{background:"transparent",color:"#334155",border:"none",fontSize:12,cursor:"pointer",width:"100%",padding:"8px"}} onClick={onSkip}>Lewati rekrutan →</button>
        </div>
      )}
    </div>
  );
}


// ── COMPLETION PAGE ───────────────────────────────────────────────────────────
function CompletionPage({stageResults, slots, formation, managerName, onRestart}){
  const [showShare, setShowShare] = useState(false);
  const shareRef = useRef(null);

  const stagesWon = stageResults.filter(r=>r.position===1).length;
  const lastResult = stageResults[stageResults.length-1];
  const lastStage = lastResult?.stage ?? 0;
  const allWon = stagesWon === 3;
  const lostAt = stageResults.findIndex(r=>r.position!==1); // -1 if never lost

  // Scenario detection
  const scenario =
    allWon ? "all" :
    lastStage === 0 ? "lost1" :
    lastStage === 1 ? "lost2" :
    "lost3";

  const SCENARIOS = {
    lost1: {
      emoji:"😞", title:"Tidak Berhasil Lolos", sub:"Tersandung di Liga Lokal",
      color:"#EF4444", bg:"rgba(239,68,68,0.08)", border:"rgba(239,68,68,0.25)",
      msg:"Perjalanan terhenti di Liga Indonesia. Tim ini butuh lebih banyak keseimbangan dan kekuatan untuk bersaing. Coba lagi — Persib ada di hati!",
    },
    lost2: {
      emoji:"😤", title:"Hampir Sampai!", sub:"Juara Lokal, Tumbang di ASEAN",
      color:"#F97316", bg:"rgba(249,115,22,0.08)", border:"rgba(249,115,22,0.25)",
      msg:"Dominan di Liga Indonesia tapi ASEAN terlalu berat. Tim butuh upgrade di stage 2. Titip salam buat klub-klub tetangga!",
    },
    lost3: {
      emoji:"😭", title:"Begitu Dekat!", sub:"Juara ASEAN, Gagal di Asia",
      color:"#F59E0B", bg:"rgba(245,158,11,0.08)", border:"rgba(245,158,11,0.25)",
      msg:"Menakjubkan! Persib tembus AFC tapi Asia terlalu kejam. Satu level lagi — lineup terkuat Persib pasti bisa!",
    },
    all: {
      emoji:"🏆", title:"Maung Taklukkan Asia!", sub:"Juara 3 Kompetisi · Sejarah Tercipta",
      color:"#F59E0B", bg:"rgba(245,158,11,0.08)", border:"rgba(245,158,11,0.35)",
      msg:"LUAR BIASA! Persib dream team menaklukkan Liga Indonesia, ASEAN, dan AFC Champions League Elite. Ini bukan mimpi — ini Maung Eleven!",
    },
  };

  const sc = SCENARIOS[scenario];

  // Best stats across all stages
  const allStats = {};
  stageResults.forEach(r=>{
    Object.entries(r.playerStats||{}).forEach(([name,s])=>{
      if(!allStats[name]) allStats[name]={goals:0,assists:0,saves:0};
      allStats[name].goals += s.goals||0;
      allStats[name].assists += s.assists||0;
      allStats[name].saves += s.saves||0;
    });
  });
  const statsArr = Object.entries(allStats).map(([name,s])=>({name,...s}));
  const topScorer = [...statsArr].sort((a,b)=>b.goals-a.goals)[0];
  const topAssist = [...statsArr].sort((a,b)=>b.assists-a.assists)[0];
  const topSave   = [...statsArr].sort((a,b)=>b.saves-a.saves)[0];

  // Share card content
  function handleSave(){
    if(!shareRef.current) return;
    const el = shareRef.current;
    function doCapture(){
      window.html2canvas(el,{backgroundColor:"#070D1A",scale:2,useCORS:true,logging:false}).then(canvas=>{
        const a=document.createElement('a');
        a.download='maung-eleven-result.png';
        a.href=canvas.toDataURL('image/png');
        a.click();
      }).catch(()=>alert("Screenshot gagal, gunakan screenshot manual."));
    }
    if(window.html2canvas){ doCapture(); }
    else {
      const s=document.createElement('script');
      s.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      s.onload=doCapture;
      s.onerror=()=>alert("Load gagal, gunakan screenshot manual.");
      document.head.appendChild(s);
    }
  }

  return(
    <div>
      {/* Main result banner */}
      <div style={{background:sc.bg,border:`1px solid ${sc.border}`,borderRadius:14,padding:"20px 16px",textAlign:"center",marginBottom:14}}>
        <div style={{fontSize:44,marginBottom:8}}>{sc.emoji}</div>
        {managerName&&<div style={{fontSize:12,color:"#64748B",marginBottom:3}}>Manajer: <span style={{color:"#E2E8F0",fontWeight:600}}>{managerName}</span></div>}
        <div style={{fontSize:20,fontWeight:800,color:sc.color,marginBottom:4}}>{sc.title}</div>
        <div style={{fontSize:12,color:"#64748B",marginBottom:10}}>{sc.sub}</div>
        <div style={{fontSize:12,color:"#94A3B8",lineHeight:1.6,fontStyle:"italic"}}>"{sc.msg}"</div>
      </div>

      {/* Stage results */}
      <div style={{display:"grid",gridTemplateColumns:`repeat(${stageResults.length},1fr)`,gap:7,marginBottom:14}}>
        {stageResults.map((r,i)=>{
          const won = r.position===1;
          return(
            <div key={i} style={{
              background:"#0D1828",borderRadius:10,padding:10,textAlign:"center",
              border:`1px solid ${won?"rgba(34,197,94,0.25)":"rgba(239,68,68,0.2)"}`,
            }}>
              <div style={{fontSize:9,color:"#475569",marginBottom:4,fontWeight:600,textTransform:"uppercase",lineHeight:1.2}}>{STAGE_NAMES[i]}</div>
              <div style={{fontSize:9,marginBottom:4}}>{won?"🏆":"❌"}</div>
              <div style={{fontSize:16,fontWeight:800,color:won?"#22C55E":"#EF4444"}}>{r.pts}<span style={{fontSize:9,color:"#475569"}}> pts</span></div>
              <div style={{fontSize:10,color:"#64748B"}}>{r.W}W {r.D}D {r.L}L</div>
              <div style={{fontSize:10,color:"#3B82F6",marginTop:2}}>OVR {r.ovr}</div>
              <div style={{fontSize:10,color:won?"#22C55E":"#EF4444",marginTop:2,fontWeight:600}}>#{r.position}</div>
            </div>
          );
        })}
      </div>

      {/* Awards row — consistent with share card */}
      {statsArr.length > 0 && (
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:"#475569",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Penghargaan Musim</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7,marginBottom:10}}>
            {[
              {icon:"⚽",label:"Top Skor",name:topScorer?.name,val:topScorer?.goals,sub:`${topScorer?.assists||0} assist`,color:"#22C55E"},
              {icon:"🎯",label:"Top Assist",name:topAssist?.name,val:topAssist?.assists,sub:`${topAssist?.goals||0} gol`,color:"#F59E0B"},
              {icon:"🧤",label:"Top Key",name:topSave?.name,val:topSave?.saves,sub:"saves/tackles",color:"#3B82F6"},
            ].map(({icon,label,name,val,sub,color})=>(
              <div key={label} style={{background:"#0D1828",borderRadius:9,padding:"10px 8px",textAlign:"center"}}>
                <div style={{fontSize:9,color:"#475569",fontWeight:600,marginBottom:4}}>{icon} {label}</div>
                <div style={{fontSize:11,fontWeight:700,color:"#E2E8F0",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",marginBottom:2}}>{name||"—"}</div>
                <div style={{fontSize:18,fontWeight:800,color}}>{val||0}</div>
                <div style={{fontSize:9,color:"#475569"}}>{sub}</div>
              </div>
            ))}
          </div>
          {/* Match highlights across all stages */}
          {stageResults.map((r,i)=>{
            if(!r.biggestWin&&!r.biggestLoss) return null;
            return(
              <div key={i} style={{background:"#0D1828",borderRadius:9,padding:"8px 12px",marginBottom:6}}>
                <div style={{fontSize:10,fontWeight:600,color:"#475569",marginBottom:5}}>{STAGE_NAMES[i]}</div>
                <div style={{display:"flex",flexDirection:"column",gap:3,fontSize:11,color:"#64748B"}}>
                  {r.biggestWin?.desc&&<span>🏆 Kemenangan terbesar: <span style={{color:"#22C55E",fontWeight:600}}>{r.biggestWin.desc}</span></span>}
                  {r.highestScoring?.desc&&<span>🎯 Skor terbanyak: <span style={{color:"#F59E0B",fontWeight:600}}>{r.highestScoring.desc}</span></span>}
                  {r.biggestLoss?.margin>0&&<span>💔 Kekalahan terbesar: <span style={{color:"#EF4444",fontWeight:600}}>{r.biggestLoss.desc}</span></span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lineup */}
      <div style={{marginBottom:14}}>
        <div style={{fontSize:11,fontWeight:700,color:"#475569",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Lineup Akhir</div>
        <Pitch formation={formation} slots={slots} readonly/>
      </div>

      {/* Action buttons */}
      <div style={{display:"flex",gap:8,marginBottom:8}}>
        <button onClick={()=>setShowShare(true)} style={{
          flex:1,background:"#003DA5",color:"#fff",border:"none",padding:"12px",
          borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",
          alignItems:"center",justifyContent:"center",gap:6,
        }}>📤 Bagikan</button>
        <button onClick={onRestart} style={{
          flex:1,background:"transparent",color:"#94A3B8",border:"1px solid rgba(255,255,255,0.12)",
          padding:"12px",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",
        }}>Main Lagi</button>
      </div>

      {/* Share Popup */}
      {showShare && (
        <div style={{
          position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:999,
          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
          padding:"16px",overflowY:"auto",
        }}>
          {/* Share card — saveable */}
          <div ref={shareRef} style={{
            background:"#070D1A",borderRadius:16,padding:"20px 16px",
            width:"100%",maxWidth:"min(360px, calc(100vw - 32px))",
            border:`2px solid ${sc.border}`,
          }}>
            {/* Header */}
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,paddingBottom:12,borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
              <TigerBadge size={32}/>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>Maung Eleven</div>
                <div style={{fontSize:10,color:"#475569"}}>{managerName?`Manajer: ${managerName}`:"Persib All-Time Dream Team"}</div>
              </div>
              <div style={{marginLeft:"auto",fontSize:22}}>{sc.emoji}</div>
            </div>

            {/* Result headline */}
            <div style={{textAlign:"center",marginBottom:16}}>
              <div style={{fontSize:22,fontWeight:800,color:sc.color,marginBottom:2}}>{sc.title}</div>
              <div style={{fontSize:11,color:"#64748B"}}>{sc.sub}</div>
            </div>

            {/* W-D-L big numbers */}
            {stageResults.length > 0 && (()=>{
              const totW = stageResults.reduce((a,r)=>a+r.W,0);
              const totD = stageResults.reduce((a,r)=>a+r.D,0);
              const totL = stageResults.reduce((a,r)=>a+r.L,0);
              const totPts = stageResults.reduce((a,r)=>a+r.pts,0);
              return(
                <>
                  <div style={{display:"flex",justifyContent:"center",gap:4,marginBottom:4}}>
                    <span style={{fontSize:32,fontWeight:800,color:"#22C55E"}}>{totW}</span>
                    <span style={{fontSize:20,fontWeight:400,color:"#475569",alignSelf:"flex-end",marginBottom:4}}>-</span>
                    <span style={{fontSize:32,fontWeight:800,color:"#F59E0B"}}>{totD}</span>
                    <span style={{fontSize:20,fontWeight:400,color:"#475569",alignSelf:"flex-end",marginBottom:4}}>-</span>
                    <span style={{fontSize:32,fontWeight:800,color:"#EF4444"}}>{totL}</span>
                  </div>
                  <div style={{textAlign:"center",fontSize:11,color:"#475569",marginBottom:6}}>
                    WON · DRAWN · LOST · <span style={{color:"#3B82F6",fontWeight:600}}>{totPts} pts total</span>
                  </div>
                  {(()=>{
                    const finalOvr = stageResults[stageResults.length-1]?.ovr || 0;
                    return <div style={{textAlign:"center",fontSize:11,color:"#64748B",marginBottom:14}}>Team OVR: <span style={{color:"#E2E8F0",fontWeight:700}}>{finalOvr}</span></div>;
                  })()}
                </>
              );
            })()}

            {/* Per stage mini cards */}
            <div style={{display:"grid",gridTemplateColumns:`repeat(${stageResults.length},1fr)`,gap:6,marginBottom:14}}>
              {stageResults.map((r,i)=>(
                <div key={i} style={{background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"7px 6px",textAlign:"center",border:`1px solid ${r.position===1?"rgba(34,197,94,0.2)":"rgba(239,68,68,0.2)"}`}}>
                  <div style={{fontSize:8,color:"#475569",marginBottom:3,fontWeight:600}}>{["ISL","ASEAN","AFC"][i]}</div>
                  <div style={{fontSize:8,marginBottom:3}}>{r.position===1?"🏆":"❌"}</div>
                  <div style={{fontSize:13,fontWeight:800,color:r.position===1?"#22C55E":"#EF4444"}}>{r.pts}</div>
                  <div style={{fontSize:9,color:"#64748B"}}>{r.W}W {r.D}D {r.L}L</div>
                </div>
              ))}
            </div>

            {/* Lineup list — ordered GK→DEF→MID→FWD, left column first */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:9,color:"#475569",fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Your XI</div>
              {(()=>{
                const catOrder=["GK","DEF","MID","FWD"];
                const ordered=[...slots.filter(s=>s.player)].sort((a,b)=>catOrder.indexOf(getPosCategory(a.pos))-catOrder.indexOf(getPosCategory(b.pos)));
                const half=Math.ceil(ordered.length/2);
                const left=ordered.slice(0,half);
                const right=ordered.slice(half);
                return(
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"2px 10px"}}>
                    {Array.from({length:half}).map((_,i)=>{
                      const cols=[left[i],right[i]].filter(Boolean);
                      return cols.map(s=>{
                        const cat=getPosCategory(s.pos);
                        const cc=CAT_COLOR[cat];
                        return(
                          <div key={s.id} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                            <span style={{fontSize:8,fontWeight:700,color:cc,background:`${cc}18`,padding:"1px 4px",borderRadius:3,flexShrink:0,minWidth:22,textAlign:"center"}}>{s.pos}</span>
                            <span style={{fontSize:10,color:"#CBD5E1",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.player.name}</span>
                            <span style={{fontSize:10,fontWeight:700,color:TIER_COLOR[s.player.tier]||"#94A3B8",marginLeft:"auto",flexShrink:0}}>{s.player.rating}</span>
                          </div>
                        );
                      });
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Awards row */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5,marginBottom:12}}>
              {[
                {icon:"⚽",label:"TOP SCORER",name:topScorer?.name,val:topScorer?.goals,sub:`${topScorer?.assists||0}A`,color:"#22C55E"},
                {icon:"🎯",label:"TOP ASSIST",name:topAssist?.name,val:topAssist?.assists,sub:`${topAssist?.goals||0}G`,color:"#F59E0B"},
                {icon:"🧤",label:"TOP KEY",name:topSave?.name,val:topSave?.saves,sub:"saves",color:"#3B82F6"},
              ].map(({icon,label,name,val,sub,color})=>(
                <div key={label} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:7,padding:"6px 7px",textAlign:"center"}}>
                  <div style={{fontSize:8,color:"#475569",fontWeight:600,marginBottom:2}}>{icon} {label}</div>
                  <div style={{fontSize:10,fontWeight:700,color:"#E2E8F0",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{name?.split(" ")[0]||"—"}</div>
                  <div style={{fontSize:12,fontWeight:800,color}}>{val||0}</div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.06)"}}>
              <div style={{fontSize:10,color:"#38BDF8",fontWeight:600,marginBottom:3}}>
                🎮 Mainkan di: maung-eleven.vercel.app
              </div>
              <div style={{fontSize:9,color:"#334155"}}>Game simulasi bola · Persib All-Time Draft</div>
            </div>
          </div>

          {/* Popup actions */}
          <div style={{width:"100%",maxWidth:360,marginTop:12,display:"flex",flexDirection:"column",gap:8}}>
            <button onClick={handleSave} style={{
              background:"#22C55E",color:"#fff",border:"none",padding:"14px",
              borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",
            }}>💾 Simpan Gambar</button>
            <button onClick={()=>setShowShare(false)} style={{
              background:"transparent",color:"#64748B",border:"1px solid rgba(255,255,255,0.1)",
              padding:"12px",borderRadius:10,fontSize:13,cursor:"pointer",
            }}>Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MaungEleven(){
  const [phase,setPhase]=useState("name"); // name|formation|draft|simulate|recruit|done
  const [managerName,setManagerName]=useState("");
  const [formation,setFormation]=useState(null);
  const [slots,setSlots]=useState([]);
  const [activeSlot,setActiveSlot]=useState(null);
  const [cards,setCards]=useState(null);
  const [cardPhase,setCardPhase]=useState("idle");
  const [selectedCard,setSelectedCard]=useState(null);
  const [stage,setStage]=useState(0);
  const [stageResults,setStageResults]=useState([]);
  const [rerollLeft,setRerollLeft]=useState(1);
  const [recruitCard,setRecruitCard]=useState(null);
  const [recruitPhase,setRecruitPhase]=useState("idle");

  const filledSlots=slots.filter(s=>s.player);
  const allFilled=slots.length>0&&filledSlots.length===slots.length;
  const excludedNames=filledSlots.map(s=>s.player.name);
  const ovr=allFilled?calcOVR(slots):0;
  const latestResult=stageResults[stageResults.length-1];

  function startFormation(f){
    const sl=FORMATIONS[f].slots.map((pos,i)=>({id:i,pos,player:null}));
    setFormation(f);setSlots(sl);setPhase("draft");
    setActiveSlot(null);setCards(null);setCardPhase("idle");setRerollLeft(1);
  }

  function selectSlot(id){
    if(cardPhase==="spinning"||cardPhase==="choosing")return;
    const s=slots.find(x=>x.id===id);
    if(!s||s.player)return;
    setActiveSlot(id);setCards(null);setCardPhase("idle");setSelectedCard(null);
  }

  const cardsRef = useRef(null);
  function rollCards(){
    const slot=slots.find(s=>s.id===activeSlot);
    if(!slot)return;
    // Scroll to cards after short delay
    setTimeout(()=>{
      if(cardsRef.current){
        cardsRef.current.scrollIntoView({behavior:"smooth",block:"nearest"});
      }
    }, 250);
    const usedNames=[...excludedNames];
    const rolled=[];
    for(let i=0;i<5;i++){
      const tier=rollTier();
      let pool=getPool(slot.pos,tier,usedNames);
      const player=pool.length>0?pool[Math.floor(Math.random()*pool.length)]:null;
      if(player)usedNames.push(player.name);
      // Use computed tier from rating
      const computedTier=player?getTier(player.rating):tier;
      rolled.push({tier:computedTier,player,tierVisible:false,playerVisible:false});
    }
    setCards(rolled);setCardPhase("spinning");setSelectedCard(null);
    rolled.forEach((_,i)=>setTimeout(()=>setCards(p=>p.map((c,ci)=>ci===i?{...c,tierVisible:true}:c)),180+i*210));
    rolled.forEach((_,i)=>setTimeout(()=>{
      setCards(p=>p.map((c,ci)=>ci===i?{...c,playerVisible:true}:c));
      if(i===4)setCardPhase("choosing");
    },180+i*210+750+i*130));
  }

  function pickCard(i){
    if(cardPhase!=="choosing")return;
    const card=cards[i];
    if(!card.player)return;
    setSelectedCard(i);
    setTimeout(()=>{
      setSlots(p=>p.map(s=>s.id===activeSlot?{...s,player:{...card.player,tier:getTier(card.player.rating)}}:s));
      setActiveSlot(null);setCards(null);setCardPhase("idle");setSelectedCard(null);
    },450);
  }

  function doReroll(){
    if(rerollLeft<=0)return;
    setRerollLeft(r=>r-1);setCards(null);setCardPhase("idle");
    setTimeout(rollCards,60);
  }

  function startSimulate(){ setPhase("simulate"); }

  function onSimDone(fd){
    const result = {
      stage, ovr:fd.ovr||0, W:fd.W||0, D:fd.D||0, L:fd.L||0, pts:fd.pts||0,
      gf:fd.gf||0, ga:fd.ga||0, position:fd.position||1,
      cleanSheets:fd.cleanSheets||0, longestWin:fd.longestWin||0,
      biggestWin:fd.biggestWin||{desc:"—"}, highestScoring:fd.highestScoring||{desc:"—"}, biggestLoss:fd.biggestLoss||{desc:"—"},
      topScorer:fd.topScorer||null, topAssist:fd.topAssist||null,
      topSave:fd.topSave||null, pots:fd.pots||null,
      matchResults:fd.matchResults||[], playerStats:fd.playerStats||{},
      standings:fd.standings||[],
    };
    const newResults = [...stageResults, result];
    setStageResults(newResults);

    const isChamp = fd.position === 1;

    if(!isChamp){
      // Kalah — langsung ke done/gameover
      setPhase("done");
      return;
    }

    if(stage < 2){
      // Lolos! Roll rekrutan dengan tier sesuai stage
      const currentExcluded = slots.filter(s=>s.player).map(s=>s.player.name);
      const allPos = ["GK","CB","LB","RB","CDM","CM","CAM","LW","RW","ST"];
      const pos = allPos[Math.floor(Math.random()*allPos.length)];

      // Stage 1→2: Silver 50% / Gold 50%
      // Stage 2→3: Gold 90% / Legenda 10%
      let tier;
      if(stage === 0){
        tier = Math.random() < 0.5 ? "Silver" : "Gold";
      } else {
        tier = Math.random() < 0.9 ? "Gold" : "Legenda";
      }

      const pool = getPool(pos, tier, currentExcluded);
      if(pool.length > 0){
        const p = pool[Math.floor(Math.random()*pool.length)];
        setRecruitCard({player:{...p,tier:getTier(p.rating)}, tier:getTier(p.rating)});
        setRecruitPhase("rolled");
      } else {
        setRecruitPhase("idle");
      }
      setStage(s => s+1);
      setRerollLeft(1);
      setPhase("recruit");
    } else {
      setPhase("done");
    }
  }

  function replacePlayer(sid){
    if(!recruitCard)return;
    setSlots(p=>p.map(s=>s.id===sid?{...s,player:recruitCard.player}:s));
    setRecruitCard(null);setRecruitPhase("idle");setPhase("draft");
  }

  function restart(){
    setPhase("name");setManagerName("");setFormation(null);setSlots([]);setActiveSlot(null);
    setCards(null);setCardPhase("idle");setSelectedCard(null);setStage(0);
    setStageResults([]);setRerollLeft(1);setRecruitCard(null);setRecruitPhase("idle");
  }

  const css=`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    @keyframes tierPop{0%{opacity:0;transform:scale(0.3) rotate(-12deg)}65%{transform:scale(1.15) rotate(3deg)}100%{opacity:1;transform:scale(1) rotate(0)}}
    @keyframes nameSlide{0%{opacity:0;transform:translateY(8px)}100%{opacity:1;transform:translateY(0)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
    *{box-sizing:border-box;margin:0;padding:0}
    .me{font-family:'Inter',sans-serif;background:#070D1A;color:#E2E8F0;border-radius:16px;overflow:hidden;min-height:100dvh}
    body{background:#040810;margin:0}
    .btn-p{background:#003DA5;color:#fff;border:none;padding:12px 18px;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;width:100%;transition:all 0.15s}
    .btn-p:hover{background:#0047C2;transform:translateY(-1px)}
    .btn-p:disabled{background:#1E293B;color:#475569;cursor:not-allowed;transform:none}
    .btn-s{background:transparent;color:#F59E0B;border:1px solid #F59E0B;padding:9px 13px;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap}
    .btn-s:hover{background:rgba(245,158,11,0.08)}
    .btn-s:disabled{opacity:0.3;cursor:not-allowed}
  `;

  return(
    <div className="me" style={{maxWidth:600,margin:"0 auto"}}>
      <style>{css}</style>
      {/* Header */}
      <div style={{background:"#0D1B35",padding:"14px 18px",borderBottom:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",gap:12}}>
        <TigerBadge size={36}/>
        <div>
          <div style={{fontSize:16,fontWeight:800,color:"#fff",letterSpacing:-0.5}}>Maung Eleven</div>
          <div style={{fontSize:11,color:"#475569"}}>Persib all-time dream team</div>
        </div>
        {(phase==="draft")&&ovr>0&&(
          <div style={{marginLeft:"auto",textAlign:"right"}}>
            <div style={{fontSize:20,fontWeight:800,color:"#3B82F6"}}>{ovr}</div>
            <div style={{fontSize:9,color:"#475569",textTransform:"uppercase",letterSpacing:1}}>OVR</div>
          </div>
        )}
      </div>
      {/* Stage bar */}
      <div style={{display:"flex",background:"#050A14",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
        {STAGE_NAMES.map((n,i)=>{
          const done=i<stage||(phase==="done");
          const active=(i===stage)&&(phase==="draft"||phase==="simulate"||phase==="recruit");
          return(
            <div key={i} style={{flex:1,padding:"8px 4px",textAlign:"center",fontSize:10,fontWeight:600,
              color:done?"#22C55E":active?"#3B82F6":"#334155",
              borderBottom:active?"2px solid #3B82F6":done?"2px solid #22C55E":"2px solid transparent"}}>
              {done?"✓ ":""}{n}
            </div>
          );
        })}
      </div>

      <div style={{padding:"12px 14px",maxWidth:600,margin:"0 auto"}}>

        {/* ── NAME INPUT ── */}
        {phase==="name"&&(
          <div>
            {/* Hero section */}
            <div style={{textAlign:"center",padding:"16px 0 12px",marginBottom:4}}>
              <div style={{fontSize:13,fontWeight:700,color:"#3B82F6",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Persib All-Time Dream Team</div>
              <div style={{fontSize:22,fontWeight:800,color:"#F1F5F9",lineHeight:1.2,marginBottom:10}}>
                Bangun tim terbaikmu.<br/>Taklukkan Asia.
              </div>
              <div style={{fontSize:13,color:"#64748B",lineHeight:1.7,maxWidth:320,margin:"0 auto"}}>
                Draft 11 legenda Persib dari berbagai era. Bawa mereka melewati
                tiga kompetisi: <span style={{color:"#E2E8F0",fontWeight:600}}>Liga Indonesia</span>,{" "}
                <span style={{color:"#E2E8F0",fontWeight:600}}>ASEAN Club Championship</span>, hingga{" "}
                <span style={{color:"#E2E8F0",fontWeight:600}}>AFC Champions League Elite</span>.
                Hanya juara yang boleh lanjut.
              </div>
            </div>

            {/* Key mechanics pills */}
            <div style={{display:"flex",flexWrap:"wrap",gap:5,justifyContent:"center",marginBottom:14}}>
              {[
                {icon:"🎴",txt:"Roll 5 pilihan per slot"},
                {icon:"🏆",txt:"Wajib juara untuk lanjut"},
                {icon:"💜",txt:"Legenda 3% chance"},
                {icon:"🌟",txt:"Youth Chemistry bonus"},
                {icon:"🔁",txt:"Re-roll 1x per stage"},
                {icon:"🆕",txt:"Rekrutan di tiap stage"},
              ].map(({icon,txt})=>(
                <div key={txt} style={{
                  background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",
                  borderRadius:20,padding:"5px 10px",fontSize:11,color:"#94A3B8",
                  display:"flex",alignItems:"center",gap:5,
                }}>
                  <span>{icon}</span><span>{txt}</span>
                </div>
              ))}
            </div>

            {/* Name input */}
            <div style={{background:"#0D1828",borderRadius:12,padding:"16px",marginBottom:14}}>
              <div style={{fontSize:12,fontWeight:700,color:"#E2E8F0",marginBottom:4}}>Siapa nama manajermu?</div>
              <div style={{fontSize:11,color:"#475569",marginBottom:10}}>Namamu akan muncul di hasil akhir dan share card</div>
              <input
                type="text"
                maxLength={15}
                value={managerName}
                onChange={e=>setManagerName(e.target.value.slice(0,15))}
                placeholder="Masukkan nama (maks 15 karakter)"
                style={{
                  width:"100%",background:"#060B14",border:"1px solid rgba(255,255,255,0.12)",
                  borderRadius:8,padding:"10px 12px",fontSize:14,color:"#E2E8F0",
                  outline:"none",fontFamily:"inherit",marginBottom:6,
                }}
              />
              <div style={{fontSize:10,color:"#334155",textAlign:"right"}}>{managerName.length}/15</div>
            </div>

            <button className="btn-p"
              disabled={!managerName.trim()}
              onClick={()=>setPhase("formation")}
            >
              {managerName.trim()?`Siap, ${managerName.trim()}! Pilih Formasi →`:"Masukkan nama dulu"}
            </button>
          </div>
        )}

        {/* ── FORMATION ── */}
        {phase==="formation"&&(
          <>
            <div style={{fontSize:11,fontWeight:700,color:"#475569",textTransform:"uppercase",letterSpacing:1.2,marginBottom:10}}>Pilih Formasi</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7,marginBottom:12}}>
              {Object.entries(FORMATIONS).map(([f,fd])=>(
                <div key={f} onClick={()=>setFormation(f)} style={{
                  background:formation===f?"#0F2044":"#0D1828",
                  border:`1px solid ${formation===f?"#3B82F6":"rgba(255,255,255,0.07)"}`,
                  borderRadius:9,padding:"10px 4px",cursor:"pointer",textAlign:"center",
                  fontSize:13,fontWeight:700,color:formation===f?"#93C5FD":"#64748B",transition:"all 0.15s",
                }}>{f}</div>
              ))}
            </div>
            {formation&&(
              <>
                <div style={{fontSize:12,color:"#475569",textAlign:"center",marginBottom:10,fontStyle:"italic"}}>{FORMATIONS[formation].desc}</div>
                <div style={{marginBottom:12}}>
                  <Pitch formation={formation} slots={FORMATIONS[formation].slots.map((pos,i)=>({id:i,pos,player:null}))} readonly/>
                </div>
              </>
            )}
            <button className="btn-p" disabled={!formation} onClick={()=>startFormation(formation)}>Mulai Draft →</button>
          </>
        )}

        {/* ── DRAFT ── */}
        {phase==="draft"&&(
          <>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div style={{fontSize:11,fontWeight:700,color:"#475569",textTransform:"uppercase",letterSpacing:1.2}}>
                {STAGE_NAMES[stage]} — Draft
              </div>
              <div style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,
                background:rerollLeft>0?"rgba(245,158,11,0.12)":"rgba(255,255,255,0.04)",
                color:rerollLeft>0?"#F59E0B":"#475569",
                border:`1px solid ${rerollLeft>0?"rgba(245,158,11,0.3)":"rgba(255,255,255,0.08)"}`
              }}>
                Sisa roll: {rerollLeft}x
              </div>
            </div>
            <GuideBox icon="🎴" title="Cara draft pemain">
              Tap slot kosong di lapangan → klik <strong style={{color:"#60A5FA"}}>Roll</strong>.
              Tier reveal dulu, lalu nama pemain muncul. Pilih satu untuk isi slot.
            </GuideBox>
            <div style={{fontSize:11,color:"#475569",fontWeight:600,marginBottom:8}}>
              {filledSlots.length}/11 pemain diisi
            </div>
            <div style={{marginBottom:12}}>
              <Pitch formation={formation} slots={slots} activeSlot={activeSlot} onSlotClick={selectSlot}/>
            </div>
            <OvrPanel slots={slots}/>
            {activeSlot!==null&&activeSlot!==undefined&&(()=>{
              const slot=slots.find(s=>s.id===activeSlot);
              return(
                <div style={{marginBottom:12}}>
                  <div style={{background:"#0D1828",borderRadius:10,padding:"10px 12px",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                    <div>
                      <div style={{fontSize:11,color:"#475569"}}>Rolling untuk</div>
                      <div style={{fontSize:14,fontWeight:700,color:CAT_COLOR[getPosCategory(slot?.pos)]}}>{slot?.pos}</div>
                    </div>
                    <div style={{display:"flex",gap:7,alignItems:"center"}}>
                      {cardPhase==="choosing"&&rerollLeft>0&&<button className="btn-s" onClick={doReroll}>Re-roll ({rerollLeft})</button>}
                      <button className="btn-p" style={{width:"auto",padding:"10px 18px"}} onClick={rollCards} disabled={cardPhase==="spinning"||cardPhase==="choosing"}>
                        {cardPhase==="idle"?"Roll":"Rolling..."}
                      </button>
                    </div>
                  </div>
                  {cards&&(
                    <div ref={cardsRef}>
                      {/* Row 1: first 3 cards */}
                      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:6}}>
                        {cards.slice(0,3).map((c,i)=><PlayerCard key={i} card={c} selectable={cardPhase==="choosing"} selected={selectedCard===i} onClick={()=>pickCard(i)}/>)}
                      </div>
                      {/* Row 2: last 2 cards centered */}
                      <div style={{display:"flex",gap:6,justifyContent:"center"}}>
                        {cards.slice(3,5).map((c,i)=>(
                          <div key={i+3} style={{width:"calc(33.333% - 3px)"}}>
                            <PlayerCard card={c} selectable={cardPhase==="choosing"} selected={selectedCard===i+3} onClick={()=>pickCard(i+3)}/>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            {activeSlot===null&&!allFilled&&(
              <div style={{fontSize:12,color:"#2D3F58",textAlign:"center",padding:"8px 0",fontStyle:"italic"}}>Tap slot kosong di lapangan</div>
            )}
            {allFilled&&(
              <button className="btn-p" onClick={startSimulate}>Mulai {STAGE_NAMES[stage]} →</button>
            )}
          </>
        )}

        {/* ── SIMULATE ── */}
        {phase==="simulate"&&(
          <>
            <div style={{fontSize:11,color:"#475569",fontWeight:600,marginBottom:12,textTransform:"uppercase",letterSpacing:0.8}}>
              {STAGE_NAMES[stage]} — Simulasi
            </div>
            <SimulationView
              ovr={ovr}
              opponents={OPPONENTS[["stage1","stage2","stage3"][stage]]}
              lineup={slots}
              onDone={onSimDone}
            />
          </>
        )}

        {/* ── RECRUIT (shown at start of new stage) ── */}
        {phase==="recruit"&&(
          <RecruitPhase
            stage={stage}
            slots={slots}
            excludedNames={excludedNames}
            onReplace={(sid,player)=>{
              setSlots(p=>p.map(s=>s.id===sid?{...s,player}:s));
              setPhase("draft");
            }}
            onSkip={()=>setPhase("draft")}
            recruitCard={recruitCard}
            setRecruitCard={setRecruitCard}
          />
        )}

        {/* ── DONE ── */}
        {phase==="done"&&(
          <CompletionPage
            stageResults={stageResults}
            slots={slots}
            formation={formation}
            managerName={managerName}
            onRestart={restart}
          />
        )}

      </div>

      {/* ── GAME FOOTER ── */}
      <div style={{
        borderTop:"1px solid rgba(255,255,255,0.04)",
        padding:"14px 16px",
        textAlign:"center",
        background:"#040810",
      }}>
        <div style={{fontSize:11,color:"#2D3748",lineHeight:1.8}}>
          <div>Game simulasi sepak bola Indonesia — khususnya untuk fans Persib Bandung</div>
          <div>Terinspirasi dari <span style={{color:"#374151"}}>38-0.app</span></div>
          <div style={{marginTop:4}}>
            <span style={{color:"#374151"}}>dibuat oleh rakakostarian</span>
            <span style={{color:"#1E293B",margin:"0 6px"}}>·</span>
            <span style={{color:"#2D3748"}}>2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
