import { useState, useEffect, useRef, useCallback } from "react";

// ── BREAKPOINT HOOK ──────────────────────────────────────────────────────────
function useBreakpoint(){
  const get = () => window.innerWidth >= 1024 ? 'desktop' : 'mobile';
  const [bp, setBp] = useState(get);
  useEffect(()=>{
    const fn = () => setBp(get());
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return bp;
}

// ── GA4 EVENT TRACKING ────────────────────────────────────────────────────────
function track(eventName, params={}){
  try{ window.gtag?.('event', eventName, params); }catch(e){}
}

// ── SUPABASE LEADERBOARD ──────────────────────────────────────────────────────
const SUPA_URL = (typeof process !== 'undefined' && process.env?.REACT_APP_SUPABASE_URL) || "https://rhzkatnrlvkovcfwjoum.supabase.co";
const SUPA_KEY = (typeof process !== 'undefined' && process.env?.REACT_APP_SUPABASE_KEY) || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoemthdG5ybHZrb3ZjZndqb3VtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NTM4NjksImV4cCI6MjA5NzAyOTg2OX0.xHF8XYZbMMIK3HEKVsgHADGvgoPaLHzXawVWkTDOJGo";

async function supaFetch(path, opts={}){
  if(!SUPA_URL||!SUPA_KEY) return null;
  try{
    const res = await fetch(`${SUPA_URL}/rest/v1${path}`, {
      headers:{
        'apikey': SUPA_KEY,
        'Authorization': `Bearer ${SUPA_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': opts.prefer||'',
      },
      ...opts,
    });
    if(!res.ok) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : [];
  }catch(e){ return null; }
}

function timeAgo(dateStr){
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff/60000);
  const hrs  = Math.floor(diff/3600000);
  const days = Math.floor(diff/86400000);
  if(mins < 60) return `${mins} menit lalu`;
  if(hrs  < 24) return `${hrs} jam lalu`;
  if(days === 1) return "Kemarin";
  const d = new Date(dateStr);
  return `${d.getDate()} ${["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"][d.getMonth()]}`;
}

async function submitScore({manager, pts, ovr, wins, scenario, stages_won}){
  // Basic validation
  if(!manager||manager.trim()==="") return;
  if(pts>306||pts<0) return;
  if(ovr>100||ovr<0) return;
  if(wins>102||wins<0) return;
  if(stages_won<1) return; // hanya yang menang min 1 stage

  await supaFetch('/Leaderboard', {
    method:'POST',
    prefer:'return=minimal',
    body: JSON.stringify({
      manager: manager.trim().slice(0,15),
      pts, ovr, wins,
      scenario: scenario||'unknown',
      stages_won,
    }),
  });
}

async function fetchLeaderboard(orderBy='pts', limit=10){
  const data = await supaFetch(
    `/Leaderboard?select=manager,pts,ovr,wins,stages_won,created_at&order=${orderBy}.desc&limit=${limit}`
  );
  return data||[];
}

// ── RTG LEADERBOARD SUBMIT & FETCH ────────────────────────────────────────────
async function submitRTGScore({manager, pts, ovr, wins, seasons_played, champion, champion_season}){
  if(!manager||manager.trim()==="") return;
  if(pts<0||ovr<0||wins<0) return;
  await supaFetch('/RTG_Leaderboard', {
    method:'POST',
    prefer:'return=minimal',
    body: JSON.stringify({
      manager: manager.trim().slice(0,15),
      pts, ovr, wins,
      seasons_played,
      champion: !!champion,
      champion_season: champion_season||null,
    }),
  });
}

async function fetchRTGLeaderboard(tab='fastest', limit=10){
  // Both tabs: champion only
  if(tab === 'fastest'){
    // Sort: champion_season ASC (musim paling cepat juara), tiebreak by total pts DESC
    const data = await supaFetch(
      `/RTG_Leaderboard?select=manager,pts,ovr,champion_season,seasons_played,created_at`+
      `&champion=eq.true&order=champion_season.asc,pts.desc&limit=${limit}`
    );
    return data||[];
  } else {
    // ovr tab: final OVR tertinggi, champion only
    const data = await supaFetch(
      `/RTG_Leaderboard?select=manager,pts,ovr,champion_season,seasons_played,created_at`+
      `&champion=eq.true&order=ovr.desc,pts.desc&limit=${limit}`
    );
    return data||[];
  }
}

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

// ── SHARED DATA & CONSTANTS ──────────────────────────────────────────────────
const RAW = [
  {name:"Sutiono Lamso",pos:["ST"],rating:98,type:"Legenda"},
  {name:"Anwar Sanusi",pos:["GK"],rating:98,type:"Legenda"},
  {name:"Robby Darwis",pos:["CB"],rating:98,type:"Legenda"},
  {name:"Yusuf Bachtiar",pos:["CM"],rating:98,type:"Legenda"},
  {name:"Yudi Guntara",pos:["CAM"],rating:98,type:"Legenda"},
  {name:"Dede Iskandar",pos:["RB","RWB","RM"],rating:98,type:"Legenda"},
  {name:"Ade Mulyono",pos:["LB","LWB","LM"],rating:98,type:"Legenda"},
  {name:"David da Silva",pos:["ST"],rating:96,type:"Asing"},
  {name:"Gonzales",pos:["ST"],rating:95,type:"Lokal"},
  {name:"Marc Klok",pos:["CDM","CM"],rating:94,type:"Lokal"},
  {name:"Ciro Alves",pos:["RW","ST","LW"],rating:93,type:"Asing"},
  {name:"Thom Haye",pos:["CM","CAM","CDM"],rating:93,type:"Lokal"},
  {name:"Tyronne Del Pino",pos:["CAM"],rating:93,type:"Asing"},
  {name:"Federico Barba",pos:["CB","LB"],rating:92,type:"Asing"},
  {name:"Bekamenga",pos:["ST"],rating:92,type:"Asing"},
  {name:"Teja Paku Alam",pos:["GK"],rating:91,type:"Lokal"},
  {name:"Makan Konate",pos:["CAM","CM","LW"],rating:91,type:"Asing"},
  {name:"Firman Utina",pos:["CAM","CM"],rating:91,type:"Lokal"},
  {name:"Lorenzo Cabanas",pos:["CAM"],rating:91,type:"Asing"},
  {name:"Nyeck Nyobe",pos:["CB"],rating:91,type:"Asing"},
  {name:"Beckham Putra",pos:["RW","LW","CAM"],rating:91,type:"Lokal"},
  {name:"Berguinho",pos:["RW","CAM"],rating:91,type:"Asing"},
  {name:"Hilton Morreira",pos:["LW","RW"],rating:91,type:"Asing"},
  {name:"Kevin Mendoza",pos:["GK"],rating:90,type:"Asing"},
  {name:"Victor Igbonefo",pos:["CB"],rating:90,type:"Lokal"},
  {name:"Matricardi",pos:["CB"],rating:90,type:"Asing"},
  {name:"Layvin Kurzawa",pos:["LB","LWB","CDM"],rating:90,type:"Asing"},
  {name:"Michael Essien",pos:["CM","CDM"],rating:90,type:"Asing"},
  {name:"Andrew Patrick Jung",pos:["ST"],rating:90,type:"Asing"},
  {name:"Wander Luiz",pos:["ST","CAM"],rating:90,type:"Asing"},
  {name:"Jonathan Bauman",pos:["ST","CAM"],rating:90,type:"Asing"},
  {name:"Redouane Barkaoui",pos:["ST"],rating:90,type:"Asing"},
  {name:"Sinthaweechai Kosin",pos:["GK"],rating:90,type:"Asing"},
  {name:"Alberto Rodriguez",pos:["CB"],rating:90,type:"Asing"},
  {name:"Nick Kuipers",pos:["CB","RB"],rating:90,type:"Asing"},
  {name:"Achmad Jufriyanto",pos:["CB","CDM"],rating:89,type:"Lokal"},
  {name:"Frans Putros",pos:["RB","CDM"],rating:89,type:"Asing"},
  {name:"Supardi Nasir",pos:["RB","RWB","RM"],rating:89,type:"Lokal"},
  {name:"Dedi Kusnandar",pos:["CDM","CM"],rating:89,type:"Lokal"},
  {name:"Ferdinand Sinaga",pos:["ST","LW"],rating:89,type:"Lokal"},
  {name:"Edo Febriansyah",pos:["LB","LWB","LM"],rating:89,type:"Lokal"},
  {name:"Gustavo Franca",pos:["CB"],rating:89,type:"Asing"},
  {name:"Radovic",pos:["CAM"],rating:89,type:"Asing"},
  {name:"Adam Alis",pos:["CM","CAM"],rating:89,type:"Lokal"},
  {name:"Suchao Nutnum",pos:["CAM","LM","RM"],rating:89,type:"Asing"},
  {name:"Luciano Guaycochea",pos:["CDM","CM"],rating:89,type:"Asing"},
  {name:"Patricio Jimenez",pos:["CB"],rating:89,type:"Asing"},
  {name:"Febri Hariyadi",pos:["RW","RM"],rating:89,type:"Lokal"},
  {name:"Zulham Zamrun",pos:["LW","ST"],rating:89,type:"Lokal"},
  {name:"Made Wirawan",pos:["GK"],rating:88,type:"Lokal"},
  {name:"Tony Sucipto",pos:["LB","CDM","CB"],rating:88,type:"Lokal"},
  {name:"Esteban Vizcarra",pos:["CAM","LW","RM"],rating:88,type:"Asing"},
  {name:"Atep Rizal",pos:["LM","LW"],rating:90,type:"Lokal"},
  {name:"Ezechiel N'Douassel",pos:["ST","RW"],rating:88,type:"Asing"},
  {name:"Serginho van Dijk",pos:["ST","LW"],rating:88,type:"Lokal"},
  {name:"Stefano Beltrame",pos:["CAM","LW","RW"],rating:89,type:"Asing"},
  {name:"Ridwan",pos:["RW","RM"],rating:88,type:"Lokal"},
  {name:"Zulkifli Syukur",pos:["RB","RWB"],rating:88,type:"Lokal"},
  {name:"Gilang Angga K.",pos:["RB","RWB"],rating:88,type:"Lokal"},
  {name:"Tema Mursadat",pos:["GK"],rating:88,type:"Lokal"},
  {name:"Abanda Herman",pos:["CB"],rating:88,type:"Asing"},
  {name:"Eliano Reijnders",pos:["LW","LB","CDM"],rating:88,type:"Lokal"},
  {name:"Markus Horison",pos:["GK"],rating:87,type:"Lokal"},
  {name:"Vladimir Vujovic",pos:["CB"],rating:90,type:"Asing"},
  {name:"Daisuke Sato",pos:["LB","LWB","RB"],rating:87,type:"Asing"},
  {name:"Ricky Kambuaya",pos:["CM","CAM","RM"],rating:87,type:"Lokal"},
  {name:"Saddil Ramdani",pos:["LW","LM"],rating:87,type:"Lokal"},
  {name:"Uilliam Baros",pos:["LW","RW","RWB"],rating:87,type:"Asing"},
  {name:"Zaenal Arief",pos:["ST"],rating:87,type:"Lokal"},
  {name:"Herman Dzumafo",pos:["ST"],rating:87,type:"Asing"},
  {name:"Eka Ramdani",pos:["CM","CDM","CAM"],rating:87,type:"Lokal"},
  {name:"Budi Sudarsono",pos:["ST"],rating:87,type:"Lokal"},
  {name:"Nova Arianto",pos:["CB"],rating:87,type:"Lokal"},
  {name:"Rashid",pos:["CDM","CM"],rating:87,type:"Asing"},
  {name:"Nasuha",pos:["LB","LWB","LM"],rating:87,type:"Lokal"},
  {name:"Shahar Ginanjar",pos:["GK"],rating:86,type:"Lokal"},
  {name:"Jendry Pitoy",pos:["GK"],rating:86,type:"Lokal"},
  {name:"Bojan Malisic",pos:["CB"],rating:86,type:"Asing"},
  {name:"Hariono",pos:["CDM","CM"],rating:86,type:"Lokal"},
  {name:"Raphael Maitimo",pos:["CM","CAM","ST"],rating:86,type:"Lokal"},
  {name:"Kim Jeffrey Kurniawan",pos:["CM","LM","CDM"],rating:86,type:"Lokal"},
  {name:"Ezra Walian",pos:["ST","CAM"],rating:86,type:"Lokal"},
  {name:"Kenji Adachihara",pos:["ST","LW"],rating:86,type:"Asing"},
  {name:"Marcio Souza",pos:["ST","LW","RW"],rating:86,type:"Asing"},
  {name:"Levy Madinda",pos:["CM","CAM"],rating:86,type:"Asing"},
  {name:"Omid Nazari",pos:["CM","CAM"],rating:86,type:"Asing"},
  {name:"Julio Cesar",pos:["CB"],rating:88,type:"Asing"},
  {name:"Robbie Gaspar",pos:["CDM","CM"],rating:86,type:"Asing"},
  {name:"Fabiano Beltrame",pos:["CB","CDM"],rating:85,type:"Asing"},
  {name:"Dion Markx",pos:["CB"],rating:85,type:"Youth"},
  {name:"Kakang Rudianto",pos:["CB","RB"],rating:85,type:"Youth"},
  {name:"Ardi Idrus",pos:["LB","LWB","LM"],rating:85,type:"Lokal"},
  {name:"Robi Darwis",pos:["RB","LB","CDM"],rating:85,type:"Youth"},
  {name:"Oh In-Kyun",pos:["CDM","CM"],rating:85,type:"Asing"},
  {name:"Shohei Matsunaga",pos:["CAM","LW","RW"],rating:85,type:"Asing"},
  {name:"Erwin Ramdani",pos:["LW","LM","RM"],rating:85,type:"Lokal"},
  {name:"Tantan",pos:["LW","RW"],rating:85,type:"Lokal"},
  {name:"Mateo Kojican",pos:["CDM","CM"],rating:85,type:"Asing"},
  {name:"Ramon Tanque",pos:["ST"],rating:85,type:"Asing"},
  {name:"Noh Alam Shah",pos:["ST"],rating:85,type:"Asing"},
  {name:"Suwita Pata",pos:["CDM","CB"],rating:85,type:"Lokal"},
  {name:"Alfeandra Dewangga",pos:["LB","CDM"],rating:84,type:"Lokal"},
  {name:"Zalnando",pos:["LB","LWB","RB"],rating:84,type:"Lokal"},
  {name:"Nazriel",pos:["CDM","CM"],rating:84,type:"Youth"},
  {name:"Rachmat Irianto",pos:["CDM","CB","RB"],rating:84,type:"Lokal"},
  {name:"Rezaldi Hehanussa",pos:["LB","LWB","LM"],rating:84,type:"Lokal"},
  {name:"Belencoso",pos:["ST"],rating:84,type:"Asing"},
  {name:"Dimas Drajad",pos:["ST"],rating:84,type:"Youth"},
  {name:"Yanto Basna",pos:["CB"],rating:84,type:"Lokal"},
  {name:"Robertino Pugliara",pos:["CAM"],rating:84,type:"Asing"},
  {name:"Mbida Messi",pos:["CAM"],rating:84,type:"Asing"},
  {name:"Satoshi Otomo",pos:["CAM","LW","RW"],rating:84,type:"Asing"},
  {name:"Frets Butuan",pos:["RW","LW","RM"],rating:83,type:"Lokal"},
  {name:"Gian Zola Nasrullah",pos:["CAM","LW","LM"],rating:83,type:"Youth"},
  {name:"Maman",pos:["CB"],rating:83,type:"Lokal"},
  {name:"Zulkifli Lukmansyah",pos:["RB","LB","RM"],rating:83,type:"Youth"},
  {name:"Geoffrey Castillion",pos:["ST","LW"],rating:83,type:"Asing"},
  {name:"Ryan Kurnia",pos:["ST","RW","LW"],rating:83,type:"Lokal"},
  {name:"Djibril Coulibaly",pos:["ST"],rating:83,type:"Asing"},
  {name:"Putu Gede",pos:["RB","RWB"],rating:83,type:"Lokal"},
  {name:"Nasser Al Sebai",pos:["CB"],rating:83,type:"Asing"},
  {name:"Zdravko Dragicevic",pos:["CAM","ST"],rating:83,type:"Asing"},
  {name:"Shahril Ishak",pos:["LM","RM","LW"],rating:83,type:"Asing"},
  {name:"Adam Przybek",pos:["GK"],rating:82,type:"Asing"},
  {name:"Cecep Supriatna",pos:["GK"],rating:82,type:"Lokal"},
  {name:"Ferdiansyah",pos:["RM","LM","RW"],rating:82,type:"Youth"},
  {name:"Adzikry",pos:["LW","RW"],rating:82,type:"Youth"},
  {name:"Siswanto",pos:["LW","RW"],rating:82,type:"Lokal"},
  {name:"Rene Mihelic",pos:["CAM"],rating:82,type:"Asing"},
  {name:"Carlton Cole",pos:["ST"],rating:82,type:"Asing"},
  {name:"Moses Sakyi",pos:["ST"],rating:82,type:"Asing"},
  {name:"Wildansyah",pos:["LB","LWB","LM"],rating:81,type:"Lokal"},
  {name:"Henhen Herdiana",pos:["RB","RM","RWB"],rating:81,type:"Lokal"},
  {name:"Lopicic",pos:["CAM","LW","RW"],rating:81,type:"Asing"},
  {name:"Aliyudin",pos:["LW","LM","RM"],rating:81,type:"Lokal"},
  {name:"Baihakki Khaizan",pos:["CB"],rating:81,type:"Asing"},
  {name:"Asri Akbar",pos:["CDM"],rating:81,type:"Lokal"},
  {name:"Muchlis Hadi Ning",pos:["ST","LW"],rating:81,type:"Lokal"},
  {name:"David Rumakiek",pos:["LB","LWB"],rating:81,type:"Youth"},
  {name:"Airlangga S.",pos:["ST","RW"],rating:81,type:"Lokal"},
  {name:"Yandi Sofyan",pos:["ST","LW"],rating:81,type:"Lokal"},
  {name:"Marcos Flores",pos:["CAM"],rating:81,type:"Asing"},
  {name:"David Laly",pos:["LW","LM","RM"],rating:81,type:"Lokal"},
  {name:"Sergio Castel",pos:["ST"],rating:81,type:"Asing"},
  {name:"Aang Suparman",pos:["CB"],rating:81,type:"Lokal"},
  {name:"Patrich Wanggai",pos:["ST"],rating:81,type:"Lokal"},
  {name:"Fitrah Maulana",pos:["GK"],rating:80,type:"Youth"},
  {name:"Ghozali Siregar",pos:["RW","LW","RM"],rating:80,type:"Lokal"},
  {name:"Fulgensius Billy Keraf",pos:["RW","ST","RM"],rating:80,type:"Youth"},
  {name:"Weeks Lewis",pos:["LW","CAM","RW"],rating:80,type:"Asing"},
  {name:"Arsan Makarim",pos:["RW"],rating:80,type:"Youth"},
  {name:"Bayu Fiqri",pos:["RB","RWB"],rating:80,type:"Youth"},
  {name:"Fitrul Dwi Rustapa",pos:["GK"],rating:80,type:"Lokal"},
  {name:"Diogo Ferreira",pos:["CB"],rating:80,type:"Asing"},
  {name:"Abdul Rahman",pos:["CB"],rating:80,type:"Lokal"},
  {name:"Taufiq",pos:["CDM","CM"],rating:80,type:"Lokal"},
  {name:"Abdul Azis",pos:["CDM"],rating:80,type:"Lokal"},
  {name:"Mailson Lima",pos:["LW","RW","ST"],rating:80,type:"Asing"},
  {name:"Gevorkyan",pos:["RW","LW"],rating:79,type:"Asing"},
  {name:"Kippersluis",pos:["ST","CAM"],rating:80,type:"Asing"},
  {name:"Kastaneer",pos:["ST"],rating:80,type:"Asing"},
  {name:"Bruno Cantanhade",pos:["ST"],rating:80,type:"Asing"},
  {name:"Rudiyana",pos:["RM","LM","RW"],rating:80,type:"Lokal"},
  {name:"Pablo Frances",pos:["CAM","LW"],rating:79,type:"Asing"},
  {name:"Kevin Pasha",pos:["CB"],rating:79,type:"Youth"},
  {name:"Diandra Diaz",pos:["CDM","CM"],rating:79,type:"Youth"},
  {name:"Sheva Sanggasi",pos:["GK"],rating:79,type:"Youth"},
  {name:"Ahmad Agung",pos:["CDM"],rating:79,type:"Lokal"},
  {name:"Faris Abdul",pos:["CB"],rating:79,type:"Youth"},
  {name:"Agung Mulyadi",pos:["RW","LW","CAM"],rating:79,type:"Youth"},
  {name:"Athaya Zahran",pos:["ST"],rating:79,type:"Youth"},
  {name:"Ridwan Ansori",pos:["ST","LW","CAM"],rating:79,type:"Youth"},
  {name:"Muhammad Natshir",pos:["GK"],rating:78,type:"Lokal"},
  {name:"Rhaka Bilhuda",pos:["GK"],rating:78,type:"Youth"},
  {name:"Reky Rahayu",pos:["GK"],rating:78,type:"Lokal"},
  {name:"Sigit Hermawan",pos:["ST","LW","RW"],rating:78,type:"Lokal"},
  {name:"Satrio Azhar",pos:["GK"],rating:77,type:"Youth"},
  {name:"Jajang Sukmara",pos:["LB","RB","RWB"],rating:77,type:"Lokal"},
  {name:"Agung Pribadi",pos:["CAM","CM"],rating:77,type:"Lokal"},
  {name:"Dias Angga",pos:["RB","LB","LWB"],rating:77,type:"Lokal"},
  {name:"Farshad Noor",pos:["CM","CDM"],rating:79,type:"Asing"},
  {name:"Ajat Sudrajat",pos:["ST"],rating:98,type:"Legenda"},
  {name:"Ilham M.",pos:["LW","RW"],rating:84,type:"Lokal"},
  {name:"Cucu Hidayat",pos:["CDM","CM"],rating:85,type:"Lokal"},
  {name:"Boy Jati Asmara",pos:["ST","LW"],rating:86,type:"Lokal"},
];

// Compute tier from rating — single source of truth
const PLAYERS = RAW.map(p => ({ ...p, tier: getTier(p.rating) }));

const FORMATIONS = {
  "4-3-3":  {slots:["GK","LB","CB","CB","RB","CM","CM","CM","LW","ST","RW"],desc:"Seimbang dengan serangan lebar"},
  "4-4-2":  {slots:["GK","LB","CB","CB","RB","LM","CM","CM","RM","ST","ST"],desc:"Klasik dua striker"},
  "4-2-3-1":{slots:["GK","LB","CB","CB","RB","CDM","CDM","LW","CAM","RW","ST"],desc:"Double pivot, trio serang"},
  "3-5-2":  {slots:["GK","CB","CB","CB","LWB","CM","CM","CM","RWB","ST","ST"],desc:"Dominasi wing-back"},
  "5-3-2":  {slots:["GK","LWB","CB","CB","CB","RWB","CM","CM","CM","ST","ST"],desc:"Pertahanan kokoh, serangan balik"},
  "4-1-4-1":{slots:["GK","LB","CB","CB","RB","CDM","LM","CM","CM","RM","ST"],desc:"Jangkar CDM, kontrol lebar"},
  "3-4-3":  {slots:["GK","CB","CB","CB","LM","CM","CM","RM","LW","ST","RW"],desc:"Serangan total habis-habisan"},
  "4-2-4":  {slots:["GK","LB","CB","CB","RB","CM","CM","LW","RW","ST","ST"],desc:"Ultra serang, 4 penyerang"},
  "4-3-2-1":{slots:["GK","LB","CB","CB","RB","CM","CM","CM","CAM","CAM","ST"],desc:"Pohon cemara, dua playmaker"},
};

const COORDS = {
  "4-3-3":  [[50,90],[13,71],[35,71],[65,71],[87,71],[25,51],[50,47],[75,51],[15,24],[50,16],[85,24]],
  "4-4-2":  [[50,90],[13,71],[35,71],[65,71],[87,71],[13,49],[37,45],[63,45],[87,49],[36,18],[64,18]],
  "4-2-3-1":[[50,90],[13,71],[35,71],[65,71],[87,71],[36,59],[64,59],[15,37],[50,32],[85,37],[50,15]],
  "3-5-2":  [[50,90],[26,71],[50,71],[74,71],[11,53],[32,49],[50,45],[68,49],[89,53],[36,18],[64,18]],
  "5-3-2":  [[50,90],[11,65],[28,72],[50,72],[72,72],[89,65],[28,49],[50,45],[72,49],[36,18],[64,18]],
  "4-1-4-1":[[50,90],[13,71],[35,71],[65,71],[87,71],[50,61],[13,47],[36,43],[64,43],[87,47],[50,15]],
  "3-4-3":  [[50,90],[26,73],[50,73],[74,73],[16,53],[38,49],[62,49],[84,53],[16,24],[50,16],[84,24]],
  "4-2-4":  [[50,90],[13,71],[35,71],[65,71],[87,71],[38,56],[62,56],[12,22],[88,22],[36,16],[64,16]],
  "4-3-2-1":[[50,90],[13,71],[35,71],[65,71],[87,71],[28,56],[50,52],[72,56],[36,36],[64,36],[50,18]],
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

// RTG draft roll — lebih susah dapat player bagus
// Bronze 70%, Silver 21%, Gold 8%, Legenda 1%
function rollRTGTier(){
  const r = Math.random();
  return r < 0.70 ? "Bronze" : r < 0.91 ? "Silver" : r < 0.99 ? "Gold" : "Legenda";
}
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

// Normalized key score — overperformance relative to position expectation

// Full season simulation with stats

// Normalized key score — overperformance relative to position expectation

// ── RTG SIMULATION ENGINE ─────────────────────────────────────────────────────

// Simulate one match: returns {result:"W"|"D"|"L", gf, ga}
// Kurva lebih ketat: diff=0 → 30% menang (bukan 40%), butuh OVR jauh lebih tinggi dari lawan
function simMatch(teamOVR, oppRating){
  const diff = teamOVR - oppRating;
  // diff=0 → 30%, diff=+5 → ~47%, diff=+10 → ~63%, diff=-5 → ~16%, diff=-10 → ~4%
  const winP  = Math.min(0.85, Math.max(0.04, 0.30 + diff * 0.034));
  const drawP = 0.20;
  const r = Math.random();
  let result;
  if(r < winP)           result = "W";
  else if(r < winP+drawP) result = "D";
  else                    result = "L";

  // Goals: roughly correlated with result and rating diff
  let gf, ga;
  if(result === "W"){
    gf = rnd(1,3) + (diff>8?1:0);
    ga = rnd(0,1);
  } else if(result === "D"){
    const g = rnd(0,2);
    gf = g; ga = g;
  } else {
    gf = rnd(0,1);
    ga = rnd(1,3) + (diff < -8?1:0);
  }
  return {result, gf, ga};
}

// Build full 34-match schedule (17 home + 17 away against each opponent)
function buildSchedule(opponents){
  const matches = [];
  opponents.forEach(opp=>{
    matches.push({opp, home:true});
    matches.push({opp, home:false});
  });
  // Shuffle
  for(let i=matches.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [matches[i],matches[j]]=[matches[j],matches[i]];
  }
  return matches;
}

// Generate frozen opponent season — store ALL 34 match results per opponent
// so we can slice them to match user's progress (apple-to-apple comparison)
function generateOpponentStandings(opponents){
  return opponents.map(opp=>{
    const matchLog = [];
    for(let i=0;i<34;i++){
      // NPC opponents face tougher opposition — range 76-88
      // This means even top-rated teams (88+) face near-equal opponents often
      // Result: more losses, more realistic standings (top team ~20-24W, not 28-32W)
      const avgOpp = 76 + Math.floor(Math.random()*13); // 76–88
      const r = simMatch(opp.rating, avgOpp);
      matchLog.push(r);
    }
    const calc = (log) => {
      const W = log.filter(m=>m.result==="W").length;
      const D = log.filter(m=>m.result==="D").length;
      const L = log.filter(m=>m.result==="L").length;
      const gf = log.reduce((s,m)=>s+m.gf,0);
      const ga = log.reduce((s,m)=>s+m.ga,0);
      return {W,D,L,gf,ga,pts:W*3+D,gd:gf-ga};
    };
    return {
      name: opp.name,
      isUser: false,
      matchLog,
      half: calc(matchLog.slice(0,17)),
      full: calc(matchLog),
    };
  });
}

// Compute standings at a given match count (userMatchCount = how many Maung XI has played)
// Opponents use proportional match count: floor(oppMatches * userMatchCount / 34)
// This ensures fair comparison — nobody can have more points than possible at current stage
function computeStandings(myMatchResults, frozenOpponents, myName="Maung XI"){
  const userPlayed = myMatchResults.length; // 0–34

  const myW   = myMatchResults.filter(m=>m.result==="W").length;
  const myD   = myMatchResults.filter(m=>m.result==="D").length;
  const myL   = myMatchResults.filter(m=>m.result==="L").length;
  const myGF  = myMatchResults.reduce((s,m)=>s+m.gf,0);
  const myGA  = myMatchResults.reduce((s,m)=>s+m.ga,0);

  const userRow = {
    name: myName,
    pts: myW*3+myD, W:myW, D:myD, L:myL,
    gf:myGF, ga:myGA, gd:myGF-myGA,
    played: userPlayed, isUser: true,
  };

  // Each opponent plays the same number of matches as user (proportional)
  // At 17 matches: use precomputed half stats. At 34: use full stats. Otherwise slice.
  const oppRows = frozenOpponents.map(opp=>{
    let stats;
    if(userPlayed === 0){
      stats = {W:0,D:0,L:0,gf:0,ga:0,pts:0,gd:0};
    } else if(userPlayed === 17){
      stats = opp.half;
    } else if(userPlayed === 34){
      stats = opp.full;
    } else {
      // Slice matchLog to userPlayed matches
      const slice = opp.matchLog.slice(0, userPlayed);
      const W = slice.filter(m=>m.result==="W").length;
      const D = slice.filter(m=>m.result==="D").length;
      const L = slice.filter(m=>m.result==="L").length;
      const gf = slice.reduce((s,m)=>s+m.gf,0);
      const ga = slice.reduce((s,m)=>s+m.ga,0);
      stats = {W,D,L,gf,ga,pts:W*3+D,gd:gf-ga};
    }
    return {
      name: opp.name,
      pts:stats.pts, W:stats.W, D:stats.D, L:stats.L,
      gf:stats.gf, ga:stats.ga, gd:stats.gd,
      played:userPlayed, isUser:false,
    };
  });

  const rows = [userRow, ...oppRows];
  rows.sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf);
  return rows.map((r,i)=>({...r, position:i+1}));
}

// Bonus helpers
const SPONSOR_BONUS = (pos) => pos<=5?20:pos<=10?12:7;
const END_BONUS     = (pos) => pos===1?0:pos<=3?28:pos<=6?20:pos<=10?14:8;

// ── RTG PLAYER STATS GENERATOR ────────────────────────────────────────────────
// Generates G/A/KeyPass stats from match results + lineup
// Called once per season when SEASON_DONE fires
function genRTGSeasonStats(starters, slots, matchResults){
  const lineup = slots.map((pos,i)=>({pos, player:starters[i]||null}));
  const fwds = lineup.filter(s=>FWD_POS.includes(s.pos)&&s.player).map(s=>s.player);
  const mids = lineup.filter(s=>MID_POS.includes(s.pos)&&s.player).map(s=>s.player);
  const defs = lineup.filter(s=>DEF_POS.includes(s.pos)&&s.player).map(s=>s.player);
  const gk   = lineup.find(s=>s.pos==="GK"&&s.player)?.player;

  const playerStats = {};
  lineup.forEach(s=>{
    if(s.player) playerStats[s.player.name] = {goals:0, assists:0};
  });

  matchResults.forEach(match=>{
    const myGoals = match.gf||0;

    // Goals: FWD 60%, MID 25%, DEF 15%
    for(let g=0;g<myGoals;g++){
      const r = Math.random();
      let scorer = null;
      if(r<0.60 && fwds.length)      scorer = fwds[Math.floor(Math.random()*fwds.length)];
      else if(r<0.85 && mids.length) scorer = mids[Math.floor(Math.random()*mids.length)];
      else if(defs.length)            scorer = defs[Math.floor(Math.random()*defs.length)];
      if(!scorer && fwds.length)      scorer = fwds[0];
      if(scorer && playerStats[scorer.name]) playerStats[scorer.name].goals++;
    }

    // Assists: 75% of goals — MID 60%, FWD 25%, DEF 15%
    for(let g=0;g<myGoals;g++){
      if(Math.random()<0.75){
        const ra = Math.random();
        let ast = null;
        if(ra<0.60 && mids.length)      ast = mids[Math.floor(Math.random()*mids.length)];
        else if(ra<0.85 && fwds.length) ast = fwds[Math.floor(Math.random()*fwds.length)];
        else if(defs.length)             ast = defs[Math.floor(Math.random()*defs.length)];
        if(ast && playerStats[ast.name]) playerStats[ast.name].assists++;
      }
    }
  });

  const statsArr   = Object.entries(playerStats).map(([name,s])=>({name,...s}));
  const topScorer  = [...statsArr].sort((a,b)=>b.goals-a.goals)[0]||null;
  const topAssist  = [...statsArr].sort((a,b)=>b.assists-a.assists)[0]||null;

  return {playerStats, statsArr, topScorer, topAssist};
}


// ── AUTO-ASSIGN LOWEST RATED SQUAD ──────────────────────────────────────────
function autoAssignLowestSquad(formation){
  const slots = FORMATIONS[formation]?.slots || [];
  const starters = Array(11).fill(null);
  const used = new Set();
  let youthCount = 0;
  const MAX_YOUTH = 2; // cegah Youth Chemistry (+3 butuh 3, +6 butuh 5)

  slots.forEach((pos, i) => {
    // Prefer non-Youth if already at Youth cap
    const candidates = PLAYERS
      .filter(p => p.pos.includes(pos) && !used.has(p.name))
      .sort((a, b) => a.rating - b.rating);

    // Try non-Youth first if at cap
    let pick = null;
    if(youthCount >= MAX_YOUTH){
      pick = candidates.find(p => p.type !== "Youth") || candidates[0];
    } else {
      pick = candidates[0];
    }

    if(pick){
      starters[i] = pick;
      used.add(pick.name);
      if(pick.type === "Youth") youthCount++;
    }
  });

  return {
    starters,
    bench: [],
    ownedPlayerIds: starters.filter(Boolean).map(p => p.name),
  };
}

// ── RTG OPPONENTS (17 Tim Liga Indonesia, fixed) ──────────────────────────────
// Base ratings dinaikkan signifikan — Musim 1 rata-rata ~82, naik +2/musim
// Base rating dinaikkan +3 dari config sebelumnya → M1 dan M2 lebih berat
// Avg base: ~81.5 (vs sebelumnya ~78.5). Scaling tetap +1.0/musim.
// M3+ tetap sama karena user sudah punya ruang upgrade dari transfer window
const RTG_OPPONENTS = [
  {name:"Persija Jakarta",    baseRating:87},
  {name:"Bali United",        baseRating:86},
  {name:"Persebaya Surabaya", baseRating:85},
  {name:"PSM Makassar",       baseRating:84},
  {name:"Arema FC",           baseRating:83},
  {name:"Borneo FC",          baseRating:82},
  {name:"Dewa United",        baseRating:81},
  {name:"PSIS Semarang",      baseRating:81},
  {name:"Madura United",      baseRating:80},
  {name:"Persita Tangerang",  baseRating:79},
  {name:"Barito Putera",      baseRating:78},
  {name:"PSS Sleman",         baseRating:78},
  {name:"Persik Kediri",      baseRating:77},
  {name:"PSBS Biak",          baseRating:76},
  {name:"Semen Padang",       baseRating:75},
  {name:"PSIM Yogyakarta",    baseRating:74},
  {name:"Persela Lamongan",   baseRating:73},
];

// Scaling +1.0/musim — cukup untuk membuat M4-5 terasa lebih berat dari M3
// M1: avg ~78.5, M2: ~79.5, M3: ~80.5, M4: ~81.5, M5: ~82.5
function getRTGOpponents(season){
  const inc = (season - 1) * 1.0;
  return RTG_OPPONENTS.map(o=>({...o, rating: o.baseRating + inc}));
}

// ── RTG COIN PRICES ──────────────────────────────────────────────────────────
const TIER_PRICE = {Bronze:8, Silver:15, Gold:28, Legenda:50};
const TIER_SELL  = {Bronze:4, Silver:7,  Gold:14, Legenda:25};

// ── RTG INITIAL STATE ────────────────────────────────────────────────────────
function initialRTGState(managerName=""){
  return {
    managerName,
    formation: "",
    coins: 80,
    coinLog: [],
    squad: {starters: Array(11).fill(null), bench: []},
    ownedPlayerIds: [],
    soldPlayerIds: [],
    currentSeason: 1,
    maxSeasons: 5,
    seasonResults: [],
    totalPts: 0, totalWins: 0, totalDraws: 0, totalLosses: 0, highestOVR: 0,
    champion: false, championSeason: null, completionScenario: null,
    // gamePhase: story_intro|formation|initial_draft|assign|
    //            season|season_half|season_end|transfer_end|completion
    gamePhase: "story_intro",
    // Runtime simulation data (not persisted across refresh mid-sim, that's OK)
    currentMatchResults: [], // [{oppName, result, gf, ga}] for current season
    leaderboardSubmitted: false,
  };
}

function resetRTGState(){
  try{ localStorage.removeItem("rtg_session"); }catch(e){}
}

function saveRTGState(state){
  try{ localStorage.setItem("rtg_session", JSON.stringify(state)); }catch(e){}
}

function loadRTGState(){
  try{
    const s = localStorage.getItem("rtg_session");
    return s ? JSON.parse(s) : null;
  }catch(e){ return null; }
}

// ── SHARED COMPONENTS ────────────────────────────────────────────────────────
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


// ── LANDING LEADERBOARD (2 tabs: Classic + RTG) ────────────────────────────



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


// ── COIN DISPLAY ─────────────────────────────────────────────────────────────
function CoinDisplay({coins, animate=false}){
  return(
    <div style={{
      display:"flex",alignItems:"center",gap:5,
      background:"rgba(245,158,11,0.12)",border:"1px solid rgba(245,158,11,0.3)",
      borderRadius:20,padding:"4px 12px",
      transition:"all 0.3s",
    }}>
      <span style={{fontSize:14}}>🪙</span>
      <span style={{fontSize:13,fontWeight:800,color:"#F59E0B"}}>{coins}</span>
      <span style={{fontSize:10,color:"#92400E",fontWeight:600}}>Maung Coin</span>
    </div>
  );
}

// ── RTG LEADERBOARD ───────────────────────────────────────────────────────────
function RTGLeaderboard({managerName=""}){
  const [tab, setTab] = useState("pts");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    setLoading(true);
    supaFetch(`/RTG_Leaderboard?select=manager,pts,ovr,wins,seasons_played,champion,created_at&order=${tab}.desc&limit=10`)
      .then(d=>{ setData(d||[]); setLoading(false); });
  },[tab]);

  const tabs = [{key:"pts",label:"Poin"},{key:"ovr",label:"OVR"},{key:"wins",label:"Kemenangan"}];
  return(
    <div style={{background:"#0D1828",borderRadius:12,overflow:"hidden",marginBottom:14}}>
      <div style={{padding:"10px 14px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontSize:12,fontWeight:700,color:"#F59E0B"}}>🏅 Leaderboard RTG</div>
        <div style={{display:"flex",gap:4}}>
          {tabs.map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)} style={{
              background:tab===t.key?"#92400E":"transparent",
              color:tab===t.key?"#FDE68A":"#475569",
              border:`1px solid ${tab===t.key?"#92400E":"rgba(255,255,255,0.08)"}`,
              padding:"3px 9px",borderRadius:20,fontSize:10,fontWeight:600,cursor:"pointer",
            }}>{t.label}</button>
          ))}
        </div>
      </div>
      <div>
        {loading?(
          <div style={{textAlign:"center",padding:"16px",fontSize:11,color:"#334155"}}>Memuat...</div>
        ):data.length===0?(
          <div style={{textAlign:"center",padding:"16px",fontSize:11,color:"#334155"}}>Belum ada data. Jadilah yang pertama!</div>
        ):(
          data.map((row,i)=>{
            const isMe=managerName&&row.manager?.toLowerCase()===managerName.toLowerCase();
            const medals=["🥇","🥈","🥉"];
            return(
              <div key={i} style={{
                display:"flex",alignItems:"center",padding:"8px 14px",
                borderBottom:"1px solid rgba(255,255,255,0.04)",
                background:isMe?"rgba(146,64,14,0.15)":"transparent",
              }}>
                <div style={{width:24,fontSize:i<3?14:11,fontWeight:700,color:i<3?"#F59E0B":"#334155",flexShrink:0}}>
                  {i<3?medals[i]:`${i+1}`}
                </div>
                <div style={{flex:1,fontSize:11,fontWeight:isMe?700:400,color:isMe?"#FDE68A":"#CBD5E1",
                  whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                  {row.manager}{isMe?" (kamu)":""}
                  {row.champion&&<span style={{marginLeft:4,fontSize:9}}>🏆</span>}
                </div>
                <div style={{fontSize:11,fontWeight:700,color:i===0?"#F59E0B":"#475569",marginRight:8}}>
                  {tab==="ovr"?Number(row.ovr).toFixed(1):row[tab]}
                </div>
                <div style={{fontSize:9,color:"#334155",flexShrink:0}}>
                  {row.seasons_played}M
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


// ── FLOATING CTA (scroll-to-bottom helper) ───────────────────────────────────
// Muncul di bottom layar saat button utama belum terlihat.
// Klik → smooth scroll ke button. Hilang otomatis saat button masuk viewport.
function FloatingCTA({targetRef, label="Lanjut ↓"}){
  const [visible, setVisible] = useState(false);

  useEffect(()=>{
    if(!targetRef?.current) return;
    // Pakai IntersectionObserver — muncul saat target di luar viewport
    const obs = new IntersectionObserver(
      ([entry])=> setVisible(!entry.isIntersecting),
      {threshold: 0.5}
    );
    obs.observe(targetRef.current);
    return ()=> obs.disconnect();
  }, [targetRef]);

  if(!visible) return null;

  return(
    <div style={{
      position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
      width:"100%", maxWidth:600,
      background:"linear-gradient(to top, #070D1A 60%, transparent)",
      padding:"20px 16px 20px", zIndex:50,
      pointerEvents:"auto",
    }}>
      <button
        onClick={()=> targetRef.current?.scrollIntoView({behavior:"smooth", block:"center"})}
        style={{
          width:"100%", background:"rgba(59,130,246,0.15)",
          border:"1px solid rgba(59,130,246,0.3)",
          color:"#93C5FD", borderRadius:10, padding:"11px",
          fontSize:13, fontWeight:600, cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center", gap:6,
        }}
      >
        <span style={{animation:"floatBounce 1.4s ease-in-out infinite"}}>↓</span>
        {label}
        <span style={{animation:"floatBounce 1.4s ease-in-out infinite"}}>↓</span>
      </button>
    </div>
  );
}

// ── RTG STORY INTRO ──────────────────────────────────────────────────────────
function RTGStoryIntro({managerName, dispatch, hasSavedSession, savedSeason}){
  const ctaRef = useRef(null);
  return(
    <div style={{maxWidth:520,margin:"0 auto"}}>
      <FloatingCTA targetRef={ctaRef} label="Mulai Perjalanan"/>
      {/* Back button — same style as Classic */}
      <button onClick={()=>dispatch({type:"GO_HOME"})} style={{
        background:"transparent",color:"#475569",border:"none",
        fontSize:12,cursor:"pointer",padding:"0 0 20px",display:"flex",alignItems:"center",gap:4,
      }}>← Ganti Mode</button>

      {/* Resume session banner — shown when there's an active saved session */}
      {hasSavedSession&&(
        <div style={{
          background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.25)",
          borderRadius:12,padding:"14px 16px",marginBottom:16,
          animation:"fadeSlideIn 0.25s ease",
        }}>
          <div style={{fontSize:12,fontWeight:700,color:"#22C55E",marginBottom:6}}>
            💾 Ada sesi tersimpan — Musim {savedSeason}
          </div>
          <div style={{fontSize:11,color:"#64748B",marginBottom:12,lineHeight:1.6}}>
            Kamu punya perjalanan yang belum selesai. Lanjutkan atau mulai dari awal?
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>dispatch({type:"RESUME_SESSION"})} style={{
              flex:2,background:"linear-gradient(135deg,#15803D,#16A34A)",
              color:"#fff",border:"none",padding:"10px",borderRadius:8,
              fontSize:12,fontWeight:700,cursor:"pointer",
            }}>
              ▶ Lanjutkan Sesi
            </button>
            <button onClick={()=>dispatch({type:"RESET_AND_START"})} style={{
              flex:1,background:"transparent",color:"#475569",
              border:"1px solid rgba(255,255,255,0.1)",padding:"10px",borderRadius:8,
              fontSize:11,fontWeight:600,cursor:"pointer",
            }}>
              Mulai Baru
            </button>
          </div>
        </div>
      )}

      {/* Hero banner — matches Classic intro structure */}
      <div style={{
        background:"linear-gradient(135deg,#1a1000,#2d1a00)",
        border:"1px solid rgba(245,158,11,0.25)",
        borderRadius:16,padding:"28px 20px 22px",textAlign:"center",marginBottom:16,
        position:"relative",overflow:"hidden",
      }}>
        <div style={{position:"absolute",top:-30,right:-30,fontSize:80,opacity:0.06,transform:"rotate(15deg)"}}>📖</div>
        <div style={{fontSize:11,fontWeight:700,color:"#F59E0B",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Mode Story</div>
        <div style={{fontSize:26,fontWeight:800,color:"#F1F5F9",lineHeight:1.2,marginBottom:10}}>
          Road to Glory
        </div>
        <div style={{fontSize:13,color:"#64748B",lineHeight:1.8,maxWidth:360,margin:"0 auto"}}>
          Lima musim. Satu mimpi.<br/>
          <span style={{color:"#94A3B8"}}>Bisakah <span style={{color:"#FDE68A",fontWeight:600}}>{managerName}</span> membangun Maung XI dari nol hingga juara Liga Indonesia?</span>
        </div>
      </div>

      {/* Steps — same structure as Classic */}
      <div style={{background:"#0D1828",borderRadius:12,padding:"16px",marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:700,color:"#F59E0B",marginBottom:10,textTransform:"uppercase",letterSpacing:1}}>Cara Bermain</div>
        {[
          {icon:"🏚️",title:"Mulai dari Nol",desc:"Kamu mewarisi tim dengan pemain rating terendah. Modal awal 120 Maung Coin — gunakan dengan bijak untuk membangun squad."},
          {icon:"🔄",title:"Transfer Window Tiap Musim",desc:"Beli, jual, dan upgrade pemain di tengah dan akhir setiap musim. Strategi transfer yang tepat adalah kunci kemenangan."},
          {icon:"📈",title:"Lawan Makin Kuat",desc:"Setiap musim, rating lawan naik +1. Kamu punya 5 musim untuk meraih posisi #1 sebelum Liga terlalu berat untuk ditaklukkan."},
          {icon:"🏆",title:"Satu Tujuan: Juara",desc:"Tidak ada jalan pintas. Bangun tim secara bertahap — dari squad seadanya hingga menjadi yang terkuat di Liga Indonesia."},
        ].map(({icon,title,desc})=>(
          <div key={title} style={{display:"flex",gap:12,marginBottom:14,alignItems:"flex-start"}}>
            <div style={{flexShrink:0,width:32,height:32,borderRadius:8,background:"rgba(245,158,11,0.1)",
              border:"1px solid rgba(245,158,11,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>
              {icon}
            </div>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:"#E2E8F0",marginBottom:2}}>{title}</div>
              <div style={{fontSize:11,color:"#64748B",lineHeight:1.6}}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Feature pills — same style as Classic */}
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:18}}>
        {["🪙 80 Coin modal awal","📅 Max 5 musim","🔄 Transfer window","📈 Lawan +2 rating/musim","🌟 Youth Chemistry","🏅 Leaderboard RTG"].map(p=>(
          <div key={p} style={{
            background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.15)",
            borderRadius:20,padding:"4px 10px",fontSize:10,color:"#92400E",
          }}>{p}</div>
        ))}
      </div>

      {/* CTA — same placement and style as Classic */}
      {!hasSavedSession&&(
        <button ref={ctaRef} onClick={()=>dispatch({type:"GO_FORMATION"})} style={{
          width:"100%",background:"linear-gradient(135deg,#92400E,#B45309)",
          color:"#FDE68A",border:"none",padding:"14px",borderRadius:10,
          fontSize:15,fontWeight:700,cursor:"pointer",
          boxShadow:"0 4px 16px rgba(146,64,14,0.5)",
        }}>
          Mulai Perjalanan, {managerName}! →
        </button>
      )}
    </div>
  );
}

// ── FORMATION SELECTOR (reused from Classic) ─────────────────────────────────
function RTGFormationSelector({state, dispatch}){
  const ctaRef = useRef(null);
  const {formation} = state;
  const bp = useBreakpoint();
  const isDesktop = bp === "desktop";

  // Use actual assigned starters for pitch preview (fix #3)
  const slots = formation
    ? FORMATIONS[formation].slots.map((pos,i)=>({
        id:i, pos,
        player: state.squad.starters[i] || null,
      }))
    : [];

  return(
    <div style={{maxWidth:isDesktop?700:520,margin:"0 auto"}}>
      <button onClick={()=>dispatch({type:"GO_STORY_INTRO"})} style={{
        background:"transparent",color:"#475569",border:"none",
        fontSize:12,cursor:"pointer",padding:"0 0 20px",display:"flex",alignItems:"center",gap:4,
      }}>← Kembali</button>

      {/* Storytelling intro */}
      <div style={{
        background:"linear-gradient(135deg,#0D1F3C,#0A1628)",
        border:"1px solid rgba(59,130,246,0.2)",
        borderRadius:14,padding:"16px 18px",marginBottom:16,
      }}>
        <div style={{fontSize:10,fontWeight:700,color:"#3B82F6",textTransform:"uppercase",
          letterSpacing:1.5,marginBottom:6}}>Kontrak Baru 📋</div>
        <div style={{fontSize:13,color:"#E2E8F0",lineHeight:1.8,marginBottom:4}}>
          Selamat datang, <span style={{color:"#FDE68A",fontWeight:700}}>{state.managerName}</span>! Kamu baru saja dikontrak oleh <span style={{color:"#3B82F6",fontWeight:700}}>Maung XI</span> dengan satu target jelas — <span style={{color:"#F59E0B",fontWeight:700}}>juara Liga Indonesia dalam 5 musim</span>.
        </div>
        <div style={{fontSize:11,color:"#64748B",lineHeight:1.7}}>
          Board sudah menunggu. Pilih formasi awal kamu untuk memulai perjalanan bersama Maung XI.
        </div>
      </div>

      <div style={{marginBottom:16}}>
        <div style={{fontSize:11,fontWeight:700,color:"#F59E0B",textTransform:"uppercase",letterSpacing:1.2,marginBottom:4}}>Story: Road to Glory</div>
        <div style={{fontSize:18,fontWeight:800,color:"#F1F5F9",marginBottom:4}}>Pilih Formasi</div>
        <div style={{fontSize:12,color:"#64748B"}}>Formasi ini akan menjadi dasar squad kamu di Musim 1.</div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:12}}>
        {Object.entries(FORMATIONS).map(([name,f])=>(
          <button key={name} onClick={()=>dispatch({type:"SET_FORMATION",payload:name})} style={{
            background:formation===name?"#92400E":"rgba(255,255,255,0.03)",
            border:`1.5px solid ${formation===name?"#F59E0B":"rgba(255,255,255,0.08)"}`,
            borderRadius:10,padding:"12px 6px",cursor:"pointer",
            color:formation===name?"#FDE68A":"#94A3B8",
            fontSize:13,fontWeight:700,
            transition:"all 0.15s",
            transform:formation===name?"scale(1.04)":"scale(1)",
          }}>{name}</button>
        ))}
      </div>

      {formation&&(
        <>
          <div style={{fontSize:12,color:"#64748B",fontStyle:"italic",textAlign:"center",marginBottom:10}}>
            {FORMATIONS[formation].desc}
          </div>
          {/* Pitch shows auto-assigned starters */}
          <Pitch formation={formation} slots={slots} readonly/>
          {/* Info: squad yang akan dimulai */}
          <div style={{marginTop:10,background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.15)",
            borderRadius:8,padding:"10px 14px",marginBottom:14}}>
            <div style={{fontSize:11,color:"#92400E",lineHeight:1.7}}>
              ⚙️ Starting 11 diisi otomatis dengan pemain <strong style={{color:"#F59E0B"}}>rating terendah</strong> yang tersedia — ini titik awal kamu. Upgrade pemain di draft awal atau transfer window.
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <button ref={ctaRef} onClick={()=>dispatch({type:"START_DRAFT"})} style={{
              width:"100%",background:"linear-gradient(135deg,#92400E,#B45309)",
              color:"#FDE68A",border:"none",padding:"13px",borderRadius:10,
              fontSize:14,fontWeight:700,cursor:"pointer",
              boxShadow:"0 4px 16px rgba(146,64,14,0.4)",
            }}>
              <FloatingCTA targetRef={ctaRef} label="Pilih Formasi"/>
      Lihat Draft Pemain & Beli →
            </button>
            <button onClick={()=>dispatch({type:"SKIP_DRAFT"})} style={{
              width:"100%",background:"transparent",
              color:"#475569",border:"1px solid rgba(255,255,255,0.08)",
              padding:"10px",borderRadius:10,fontSize:12,fontWeight:600,cursor:"pointer",
            }}>
              Mulai Langsung dengan Squad Ini
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── INITIAL DRAFT (15 kartu, sorted by role then tier) ──────────────────────
function RTGInitialDraft({state, dispatch}){
  const ctaRef = useRef(null);
  const {coins, formation, squad} = state;

  // Generate 15 cards sorted by role (GK→DEF→MID→FWD) then tier
  // Draft awal HANYA Bronze & Silver — Gold/Legenda hanya bisa di transfer window
  const [cards] = useState(()=>{
    const tierOrder = {Legenda:0, Gold:1, Silver:2, Bronze:3};
    const catOrder = {GK:0, DEF:1, MID:2, FWD:3};
    // Hanya Bronze dan Silver di draft awal
    const pool = PLAYERS.filter(p=>
      !state.ownedPlayerIds.includes(p.name) &&
      (p.tier === "Bronze" || p.tier === "Silver")
    );
    const shuffled = [...pool].sort(()=>Math.random()-0.5).slice(0,30);

    // Pick 15: ensure variety by role
    const picks = [];
    const roles = ["GK","DEF","MID","FWD"];
    const counts = {GK:2, DEF:4, MID:5, FWD:4};
    roles.forEach(role=>{
      const rolePlayers = shuffled
        .filter(p=>getPosCategory(p.pos[0])===role)
        .sort((a,b)=>tierOrder[a.tier]-tierOrder[b.tier]||b.rating-a.rating)
        .slice(0, counts[role]);
      picks.push(...rolePlayers);
    });

    return picks
      .sort((a,b)=>catOrder[getPosCategory(a.pos[0])]-catOrder[getPosCategory(b.pos[0])]||tierOrder[a.tier]-tierOrder[b.tier]);
  });

  const [cart, setCart] = useState([]); // player names to buy

  const toggleCart = (playerName) => {
    const player = cards.find(p=>p.name===playerName);
    if(!player) return;
    const cost = TIER_PRICE[player.tier];
    const inCart = cart.includes(playerName);
    if(!inCart){
      const totalCost = cart.reduce((s,n)=>s+TIER_PRICE[cards.find(p=>p.name===n)?.tier||"Bronze"],0)+cost;
      if(totalCost > coins) return;
    }
    setCart(prev=>inCart?prev.filter(x=>x!==playerName):[...prev,playerName]);
  };

  const cartCost = cart.reduce((s,n)=>s+TIER_PRICE[cards.find(p=>p.name===n)?.tier||"Bronze"],0);
  const currentOVR = (() => {
    const slots = FORMATIONS[formation]?.slots||[];
    return calcOVR(slots.map((pos,i)=>({pos, player:squad.starters[i]})));
  })();

  const handleConfirm = () => {
    const bought = cart.map(n=>cards.find(p=>p.name===n)).filter(Boolean);
    dispatch({type:"CONFIRM_INITIAL_DRAFT", payload:{players: bought, totalCost: cartCost}});
  };

  return(
    <div>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:"#F59E0B",textTransform:"uppercase",letterSpacing:1}}>Musim {state.currentSeason}</div>
          <div style={{fontSize:18,fontWeight:800,color:"#F1F5F9"}}>Transfer Market</div>
        </div>
        <CoinDisplay coins={coins-cartCost}/>
      </div>

      {/* Story context — white background for readability */}
      <div style={{background:"rgba(255,255,255,0.92)",borderRadius:10,padding:"12px 14px",marginBottom:10}}>
        <div style={{fontSize:11,color:"#1E293B",lineHeight:1.7}}>
          Tim kamu dimulai dengan pemain rating terendah yang tersedia. OVR saat ini: <span style={{fontWeight:700,color:"#003DA5"}}>{currentOVR.toFixed(1)}</span>.{" "}
          Draft awal hanya tersedia <strong style={{color:"#7C4A1E"}}>Bronze</strong> dan <strong style={{color:"#64748B"}}>Silver</strong> — player Gold & Legenda baru tersedia di transfer window musim berikutnya.
        </div>
      </div>

      {/* Formation slot guide */}
      {formation && FORMATIONS[formation] && (
        <div style={{background:"rgba(59,130,246,0.06)",border:"1px solid rgba(59,130,246,0.15)",
          borderRadius:8,padding:"9px 12px",marginBottom:12}}>
          <div style={{fontSize:9,fontWeight:700,color:"#3B82F6",textTransform:"uppercase",
            letterSpacing:1,marginBottom:5}}>Formasi {formation} — Slot yang Perlu Diisi</div>
          <div style={{fontSize:11,color:"#94A3B8",lineHeight:1.8,wordBreak:"break-word"}}>
            {FORMATIONS[formation].slots.map((pos,i)=>(
              <span key={i}>
                <span style={{
                  color:CAT_COLOR[getPosCategory(pos)],fontWeight:600,
                }}>{pos}</span>
                {i < FORMATIONS[formation].slots.length-1 &&
                  <span style={{color:"#334155",margin:"0 3px"}}>·</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Price guide */}
      <div style={{display:"flex",gap:10,marginBottom:12,flexWrap:"wrap"}}>
        {[["🟤","Bronze","8🪙"],["⚪","Silver","15🪙"],["🟡","Gold","28🪙"],["🔴","Legenda","50🪙"]].map(([e,tier,price])=>(
          <div key={tier} style={{fontSize:10,color:"#64748B",background:"rgba(255,255,255,0.03)",padding:"4px 8px",borderRadius:6}}>
            {e} {tier} = <span style={{color:"#F59E0B",fontWeight:700}}>{price}</span>
          </div>
        ))}
        <div style={{marginLeft:"auto",fontSize:10,color:"#64748B"}}>
          Dipilih: <span style={{color:"#22C55E",fontWeight:700}}>{cart.length}</span> · Total: <span style={{color:cartCost<=coins?"#22C55E":"#EF4444",fontWeight:700}}>{cartCost}🪙</span>
        </div>
      </div>

      {/* 15 cards — list style sorted by role/tier */}
      <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:14}}>
        {["GK","DEF","MID","FWD"].map(cat=>{
          const catCards = cards.filter(p=>getPosCategory(p.pos[0])===cat);
          if(!catCards.length) return null;
          return(
            <div key={cat}>
              <div style={{fontSize:9,fontWeight:700,color:"#334155",textTransform:"uppercase",letterSpacing:1.5,padding:"6px 0 3px"}}>{cat}</div>
              {catCards.map(p=>{
                const inCart = cart.includes(p.name);
                const tc = TIER_COLOR[p.tier];
                const cost = TIER_PRICE[p.tier];
                const wouldExceed = !inCart && cartCost+cost > coins;
                const cc = CAT_COLOR[getPosCategory(p.pos[0])];
                return(
                  <div key={p.name} onClick={()=>!wouldExceed&&toggleCart(p.name)} style={{
                    display:"flex",alignItems:"center",gap:10,
                    background:inCart?"rgba(245,158,11,0.1)":"rgba(255,255,255,0.02)",
                    border:`1px solid ${inCart?"#F59E0B":wouldExceed?"rgba(255,255,255,0.03)":"rgba(255,255,255,0.07)"}`,
                    borderRadius:8,padding:"8px 12px",cursor:wouldExceed&&!inCart?"default":"pointer",
                    opacity:wouldExceed&&!inCart?0.4:1,
                    marginBottom:3,
                  }}>
                    <div style={{width:36,fontSize:14,fontWeight:800,color:tc,flexShrink:0}}>{p.rating}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,fontWeight:600,color:"#E2E8F0"}}>{p.name}</div>
                      <div style={{display:"flex",gap:3,marginTop:2}}>
                        {p.pos.map(pos=>(
                          <span key={pos} style={{fontSize:8,color:CAT_COLOR[getPosCategory(pos)],background:"rgba(255,255,255,0.06)",padding:"1px 4px",borderRadius:3}}>{pos}</span>
                        ))}
                        <span style={{fontSize:8,color:"#475569",marginLeft:2}}>{p.type}</span>
                      </div>
                    </div>
                    <div style={{fontSize:10,fontWeight:700,color:tc,flexShrink:0}}>{p.tier}</div>
                    <div style={{fontSize:11,fontWeight:700,color:"#F59E0B",flexShrink:0,minWidth:32,textAlign:"right"}}>{cost}🪙</div>
                    {inCart&&<div style={{fontSize:12,color:"#22C55E",flexShrink:0}}>✓</div>}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {cart.length>0&&(
          <button ref={ctaRef} onClick={handleConfirm} style={{
            width:"100%",background:"linear-gradient(135deg,#92400E,#B45309)",
            color:"#FDE68A",border:"none",padding:"12px",borderRadius:10,
            fontSize:13,fontWeight:700,cursor:"pointer",
            boxShadow:"0 4px 16px rgba(146,64,14,0.35)",
          }}>
            Beli {cart.length} Pemain — {cartCost}🪙 & Atur Squad →
          </button>
        )}
        <button onClick={()=>dispatch({type:"SKIP_DRAFT"})} style={{
          width:"100%",background:"transparent",
          color:"#475569",border:"1px solid rgba(255,255,255,0.08)",
          padding:"10px",borderRadius:10,fontSize:12,fontWeight:600,cursor:"pointer",
        }}>
          {cart.length===0?"Lewati — Mulai dengan Squad Ini":"Batalkan pilihan & Lewati"}
        </button>
      </div>
      <FloatingCTA targetRef={ctaRef} label="Konfirmasi Draft"/>
    </div>
  );
} 

// ── SQUAD BOARD (pitch readonly + list-first interaction) ────────────────────
function SquadBoard({state, dispatch}){
  const ctaRef = useRef(null);
  const {formation, squad, coins} = state;
  // selected: null | {type:"starter", index:N, player, slotPos} | {type:"bench", playerName:str, player}
  const [selected, setSelected] = useState(null);
  const [posWarning, setPosWarning] = useState(null);

  const starters = squad.starters;
  const slots    = FORMATIONS[formation]?.slots || [];

  // Bench = all owned players NOT in any starter slot
  const benchPlayers = state.ownedPlayerIds
    .map(id => PLAYERS.find(p => p.name === id))
    .filter(Boolean)
    .filter(p => !starters.some(s => s && s.name === p.name))
    .sort((a,b) => b.rating - a.rating);  // sort once, consistently

  const allStartersFilled = starters.every(s => s !== null);
  const ovrSlots = slots.map((pos,i) => ({id:i, pos, player: starters[i]}));

  const showWarning = (msg) => {
    setPosWarning(msg);
    setSelected(null);
    setTimeout(() => setPosWarning(null), 2500);
  };

  // ── CLICK: starter row ───────────────────────────────────────────────────
  const handleStarterClick = (starterIndex) => {
    const clickedPlayer = starters[starterIndex];
    const clickedSlotPos = slots[starterIndex];

    // Nothing selected yet → select this starter slot
    if (!selected) {
      setSelected({type:"starter", index:starterIndex, player:clickedPlayer, slotPos:clickedSlotPos});
      setPosWarning(null);
      return;
    }

    // Tap same slot → deselect
    if (selected.type === "starter" && selected.index === starterIndex) {
      setSelected(null);
      return;
    }

    // Starter selected → tap another starter = Starter ↔ Starter swap
    if (selected.type === "starter") {
      const pFrom     = selected.player;
      const pTo       = clickedPlayer;
      const slotFrom  = selected.slotPos;
      const slotTo    = clickedSlotPos;

      // Validate: pFrom must fit slotTo, pTo must fit slotFrom
      if (pFrom && !pFrom.pos.includes(slotTo)) {
        showWarning(`${pFrom.name} tidak bisa main di ${slotTo}`); return;
      }
      if (pTo && !pTo.pos.includes(slotFrom)) {
        showWarning(`${pTo.name} tidak bisa main di ${slotFrom}`); return;
      }
      dispatch({type:"SWAP_SQUAD", payload:{fromStarter:selected.index, toStarter:starterIndex}});
      setSelected(null);
      return;
    }

    // Bench player selected → tap a starter slot = Bench → Starter
    if (selected.type === "bench") {
      const benchP = selected.player;
      if (benchP && !benchP.pos.includes(clickedSlotPos)) {
        showWarning(`${benchP.name} tidak bisa main di ${clickedSlotPos}`); return;
      }
      dispatch({type:"SWAP_SQUAD", payload:{fromBenchName:benchP.name, toStarter:starterIndex}});
      setSelected(null);
    }
  };

  // ── CLICK: bench row ─────────────────────────────────────────────────────
  const handleBenchClick = (benchPlayer) => {
    // Nothing selected → select this bench player
    if (!selected) {
      setSelected({type:"bench", playerName:benchPlayer.name, player:benchPlayer});
      setPosWarning(null);
      return;
    }

    // Tap same bench player → deselect
    if (selected.type === "bench" && selected.playerName === benchPlayer.name) {
      setSelected(null);
      return;
    }

    // Another bench player selected → just re-select the new one (bench order doesn't matter)
    if (selected.type === "bench") {
      setSelected({type:"bench", playerName:benchPlayer.name, player:benchPlayer});
      return;
    }

    // Starter selected → tap bench player = Starter ↔ Bench
    if (selected.type === "starter") {
      const slotPos  = selected.slotPos;
      // Bench player must fit the starter slot being vacated
      if (benchPlayer && !benchPlayer.pos.includes(slotPos)) {
        showWarning(`${benchPlayer.name} tidak bisa main di ${slotPos}`); return;
      }
      // Dispatch: fromBenchName fills toStarter, old starter goes to bench automatically
      dispatch({type:"SWAP_SQUAD", payload:{
        fromBenchName: benchPlayer.name,
        toStarter:     selected.index,
      }});
      setSelected(null);
    }
  };

  const isSelectedStarter = (i) =>
    selected?.type === "starter" && selected?.index === i;
  const isSelectedBench = (name) =>
    selected?.type === "bench" && selected?.playerName === name;

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return(
    <div>
      {/* Header — no coin display here, it's already in the main app header */}
      <div style={{marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:700,color:"#F59E0B",textTransform:"uppercase",letterSpacing:1}}>Setup Squad</div>
        <div style={{fontSize:15,fontWeight:800,color:"#F1F5F9"}}>Atur Lineup Musim {state.currentSeason}</div>
      </div>

      {/* Selection hint / position warning */}
      {posWarning ? (
        <div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",
          borderRadius:8,padding:"7px 12px",marginBottom:10,fontSize:11,color:"#EF4444",animation:"fadeSlideIn 0.2s ease"}}>
          ⚠️ {posWarning}
        </div>
      ) : selected ? (
        <div style={{background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)",
          borderRadius:8,padding:"7px 12px",marginBottom:10,fontSize:11,color:"#F59E0B",animation:"fadeSlideIn 0.2s ease"}}>
          ✋ {selected.player
            ? `${selected.player.name} dipilih — tap posisi tujuan`
            : `Slot ${selected.slotPos||""} kosong dipilih — tap pemain dari bangku`
          }
          <span onClick={()=>setSelected(null)} style={{marginLeft:8,cursor:"pointer",color:"#475569",fontWeight:700}}>✕</span>
        </div>
      ) : (
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",
          borderRadius:8,padding:"7px 12px",marginBottom:10,fontSize:11,color:"#475569"}}>
          💡 Tap pemain di list untuk pilih, lalu tap posisi/pemain tujuan untuk swap
        </div>
      )}

      {/* Pitch — READONLY, hanya visualisasi */}
      <div style={{marginBottom:14}}>
        <Pitch formation={formation} slots={ovrSlots} readonly/>
      </div>

      {/* OVR Panel */}
      <div style={{marginBottom:16}}>
        <OvrPanel slots={ovrSlots}/>
      </div>

      {/* ── STARTING XI LIST ── */}
      <div style={{background:"#0D1828",borderRadius:10,overflow:"hidden",marginBottom:10}}>
        <div style={{padding:"10px 14px 6px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
          <div style={{fontSize:10,fontWeight:700,color:"#3B82F6",textTransform:"uppercase",letterSpacing:1.2}}>
            Starting XI · {starters.filter(Boolean).length}/11
          </div>
        </div>
        {/* Column header */}
        <div style={{display:"grid",gridTemplateColumns:"44px 1fr 48px 54px",
          padding:"5px 14px",gap:8,borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
          {["Pos","Pemain","Rating","Tier"].map(h=>(
            <div key={h} style={{fontSize:9,fontWeight:700,color:"#1E293B",textTransform:"uppercase",letterSpacing:1}}>{h}</div>
          ))}
        </div>
        {slots.map((slotPos, i) => {
          const player = starters[i];
          const isSel  = isSelectedStarter(i);
          const cat    = getPosCategory(slotPos);
          const cc     = CAT_COLOR[cat];
          const tc     = player ? TIER_COLOR[player.tier] : "#334155";
          const canReceive = selected?.type==="bench" && selected.player && selected.player.pos.includes(slotPos);
          return(
            <div key={i} onClick={()=>handleStarterClick(i)} style={{
              display:"grid",gridTemplateColumns:"44px 1fr 48px 54px",
              alignItems:"center",padding:"9px 14px",gap:8,cursor:"pointer",
              background: isSel
                ? "rgba(245,158,11,0.12)"
                : canReceive
                  ? "rgba(34,197,94,0.06)"
                  : "transparent",
              borderBottom:"1px solid rgba(255,255,255,0.03)",
              borderLeft: isSel ? "3px solid #F59E0B" : canReceive ? "3px solid #22C55E" : "3px solid transparent",
              transition:"all 0.15s",
            }}>
              {/* Col 1: Position badge */}
              <div style={{
                fontSize:9,fontWeight:800,color:cc,
                background:`${cc}18`,padding:"3px 6px",borderRadius:5,
                border:`1px solid ${cc}33`,textAlign:"center",letterSpacing:0.5,
              }}>{slotPos}</div>

              {/* Col 2: Player name */}
              <div>
                {player ? (
                  <div>
                    <div style={{fontSize:12,fontWeight:600,color:"#E2E8F0",lineHeight:1.2}}>{player.name}</div>
                    <div style={{fontSize:9,color:"#475569",marginTop:1}}>{player.type}</div>
                  </div>
                ) : (
                  <div style={{fontSize:11,color:"#1E293B",fontStyle:"italic"}}>
                    {canReceive ? <span style={{color:"#22C55E"}}>→ Tempatkan di sini</span> : "Kosong"}
                  </div>
                )}
              </div>

              {/* Col 3: Rating */}
              <div style={{fontSize:14,fontWeight:800,color:tc,textAlign:"right"}}>
                {player ? player.rating : "—"}
              </div>

              {/* Col 4: Tier */}
              <div style={{fontSize:9,fontWeight:600,color:tc,textAlign:"right"}}>
                {player ? player.tier : ""}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── BENCH LIST (unlimited) ── */}
      <div style={{background:"#0D1828",borderRadius:10,overflow:"hidden",marginBottom:14}}>
        <div style={{padding:"10px 14px 6px",borderBottom:"1px solid rgba(255,255,255,0.05)",
          display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontSize:10,fontWeight:700,color:"#475569",textTransform:"uppercase",letterSpacing:1.2}}>
            Bangku Cadangan · {benchPlayers.length} pemain
          </div>
        </div>
        {benchPlayers.length === 0 ? (
          <div style={{padding:"14px",textAlign:"center",fontSize:11,color:"#1E293B",fontStyle:"italic"}}>
            Semua pemain sudah di starting XI
          </div>
        ) : (
          <>
            {/* Column header */}
            <div style={{display:"grid",gridTemplateColumns:"44px 1fr 48px 54px",
              padding:"5px 14px",gap:8,borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
              {["Pos","Pemain","Rating","Tier"].map(h=>(
                <div key={h} style={{fontSize:9,fontWeight:700,color:"#1E293B",textTransform:"uppercase",letterSpacing:1}}>{h}</div>
              ))}
            </div>
            {benchPlayers
              .map((player) => {
                const isSel  = isSelectedBench(player.name);
                const cat    = getPosCategory(player.pos[0]);
                const cc     = CAT_COLOR[cat];
                const tc     = TIER_COLOR[player.tier];
                // Can this bench player go into the selected starter slot?
                const canFill = selected?.type==="starter" && player.pos.includes(selected.slotPos);
                return(
                  <div key={player.name} onClick={()=>handleBenchClick(player)} style={{
                    display:"grid",gridTemplateColumns:"44px 1fr 48px 54px",
                    alignItems:"center",padding:"9px 14px",gap:8,cursor:"pointer",
                    background: isSel
                      ? "rgba(245,158,11,0.12)"
                      : canFill
                        ? "rgba(34,197,94,0.06)"
                        : "transparent",
                    borderBottom:"1px solid rgba(255,255,255,0.03)",
                    borderLeft: isSel ? "3px solid #F59E0B" : canFill ? "3px solid #22C55E" : "3px solid transparent",
                    transition:"all 0.15s",
                  }}>
                    {/* Col 1: Primary position badge */}
                    <div style={{
                      fontSize:9,fontWeight:800,color:cc,
                      background:`${cc}18`,padding:"3px 6px",borderRadius:5,
                      border:`1px solid ${cc}33`,textAlign:"center",letterSpacing:0.5,
                    }}>{player.pos[0]}</div>

                    {/* Col 2: Name + all positions */}
                    <div>
                      <div style={{fontSize:12,fontWeight:600,color:"#E2E8F0",lineHeight:1.2}}>{player.name}</div>
                      <div style={{display:"flex",gap:2,marginTop:2,flexWrap:"wrap"}}>
                        {player.pos.map(p=>{
                          const pc = CAT_COLOR[getPosCategory(p)];
                          return <span key={p} style={{fontSize:8,color:pc,background:`${pc}12`,padding:"1px 4px",borderRadius:3}}>{p}</span>;
                        })}
                        {canFill && <span style={{fontSize:8,color:"#22C55E",marginLeft:2}}>→ ke {selected.slotPos}</span>}
                      </div>
                    </div>

                    {/* Col 3: Rating */}
                    <div style={{fontSize:14,fontWeight:800,color:tc,textAlign:"right"}}>
                      {player.rating}
                    </div>

                    {/* Col 4: Tier */}
                    <div style={{fontSize:9,fontWeight:600,color:tc,textAlign:"right"}}>
                      {player.tier}
                    </div>
                  </div>
                );
              })
            }
          </>
        )}
      </div>

      {/* Confirm button */}
      <FloatingCTA targetRef={ctaRef} label="Mulai Musim"/>
      <button
        disabled={!allStartersFilled}
        ref={ctaRef} onClick={()=>dispatch({type:"CONFIRM_LINEUP"})}
        style={{
          width:"100%",
          background:allStartersFilled?"linear-gradient(135deg,#003DA5,#2563EB)":"rgba(255,255,255,0.05)",
          color:allStartersFilled?"#fff":"#334155",
          border:"none",padding:"13px",borderRadius:10,
          fontSize:14,fontWeight:700,cursor:allStartersFilled?"pointer":"default",
          boxShadow:allStartersFilled?"0 4px 16px rgba(0,61,165,0.4)":"none",
        }}>
        {allStartersFilled
          ? `Mulai Musim ${state.currentSeason} →`
          : `Isi ${starters.filter(s=>!s).length} slot starter dulu`
        }
      </button>
    </div>
  );
}


// ── CLASSEMEN TABLE ───────────────────────────────────────────────────────────
function ClassemenTable({standings, matchesPlayed=999}){
  if(!standings||!standings.length) return null;

  // If no matches played yet, show all teams at zero
  const display = matchesPlayed === 0
    ? standings.map(r=>({...r, pts:0, W:0, D:0, L:0, gf:0, ga:0, gd:0, played:0}))
        .sort((a,b)=>a.name.localeCompare(b.name))
        .map((r,i)=>({...r, position:i+1}))
    : standings;

  return(
    <div style={{background:"#0A1628",borderRadius:10,overflow:"hidden"}}>
      {/* Header row — M = Menang, S = Seri, K = Kalah */}
      <div style={{display:"grid",gridTemplateColumns:"28px 1fr 32px 32px 32px 36px",
        padding:"6px 10px",gap:4,background:"rgba(255,255,255,0.03)",
        borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
        {["#","Tim","W","D","L","Pts"].map(h=>(
          <div key={h} style={{fontSize:9,fontWeight:700,color:"#334155",
            textTransform:"uppercase",letterSpacing:0.8,textAlign:h==="Tim"?"left":"center"}}>{h}</div>
        ))}
      </div>
      {/* Always show all 18 rows */}
      {display.map((row,i)=>{
        const isUser = row.isUser;
        const isTop  = row.position <= 3 && matchesPlayed > 0;
        return(
          <div key={row.name} style={{
            display:"grid",gridTemplateColumns:"28px 1fr 32px 32px 32px 36px",
            padding:"7px 10px",gap:4,alignItems:"center",
            background: isUser
              ? "rgba(0,61,165,0.2)"
              : i%2===0?"transparent":"rgba(255,255,255,0.01)",
            borderBottom:"1px solid rgba(255,255,255,0.03)",
            borderLeft: isUser?"3px solid #3B82F6":"3px solid transparent",
          }}>
            <div style={{fontSize:10,fontWeight:700,textAlign:"center",
              color:isTop?"#F59E0B":isUser?"#3B82F6":"#334155"}}>{row.position}</div>
            <div style={{fontSize:11,fontWeight:isUser?700:400,
              color:isUser?"#93C5FD":"#CBD5E1",
              whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
              {isUser?"🔵 ":""}{row.name}
            </div>
            <div style={{fontSize:10,color:row.W>0?"#22C55E":"#475569",textAlign:"center"}}>{row.W}</div>
            <div style={{fontSize:10,color:row.D>0?"#F59E0B":"#475569",textAlign:"center"}}>{row.D}</div>
            <div style={{fontSize:10,color:row.L>0?"#EF4444":"#475569",textAlign:"center"}}>{row.L}</div>
            <div style={{fontSize:11,fontWeight:700,
              color:isTop?"#F59E0B":isUser?"#93C5FD":row.pts>0?"#E2E8F0":"#334155",
              textAlign:"center"}}>{row.pts}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── RTG SEASON VIEW (simulasi musim) ─────────────────────────────────────────
function RTGSeasonView({state, dispatch}){
  const {formation, squad, currentSeason} = state;
  const slots    = FORMATIONS[formation]?.slots||[];
  const starters = squad.starters;
  const ovr      = calcOVR(slots.map((pos,i)=>({pos,player:starters[i]})));
  const opponents = getRTGOpponents(currentSeason);

  // P1 results are stored in state.currentMatchResults after HALF_DONE
  // If length >= 17, we are in Putaran 2
  const p1Results  = (state.currentMatchResults||[]).slice(0,17);
  const isP2       = p1Results.length >= 17;
  const putaranNum = isP2 ? 2 : 1;

  // Each putaran gets its own 17-match schedule (fresh, no resume complexity)
  const [schedule]        = useState(()=>buildSchedule(opponents).slice(0,17));
  const [frozenOpponents] = useState(()=>generateOpponentStandings(opponents));

  // Local results for THIS putaran only
  const [curResults, setCurResults] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isRunning, setIsRunning]   = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const intervalRef = useRef(null);

  const HALF      = 17;
  const putDone   = currentIdx >= HALF;
  const allResults = isP2 ? [...p1Results, ...curResults] : curResults;
  const standings  = computeStandings(allResults, frozenOpponents);
  const userPos    = standings.find(r=>r.isUser)?.position||18;

  const runMatch = useCallback((idx, prev)=>{
    if(idx>=schedule.length) return prev;
    const {opp}=schedule[idx];
    const r=simMatch(ovr,opp.rating);
    return [...prev,{oppName:opp.name,oppRating:opp.rating,...r,matchNum:idx+1}];
  },[schedule,ovr]);

  const startSim  = ()=>{ if(isRunning||putDone) return; setIsRunning(true); setIsSkipping(false); };
  const skipPut   = ()=>{ setIsSkipping(true); setIsRunning(false); };

  useEffect(()=>{
    if(!isRunning&&!isSkipping) return;
    if(putDone){ setIsRunning(false); setIsSkipping(false); return; }
    if(isSkipping){
      let res=curResults;
      for(let i=currentIdx;i<HALF;i++) res=runMatch(i,res);
      setCurResults(res); setCurrentIdx(HALF); setIsSkipping(false);
      return;
    }
    const delay=isP2?700:900;
    intervalRef.current=setTimeout(()=>{
      const nr=runMatch(currentIdx,curResults);
      setCurResults(nr);
      setCurrentIdx(i=>i+1);
      if(currentIdx+1>=HALF) setIsRunning(false);
    },delay);
    return ()=>clearTimeout(intervalRef.current);
  },[isRunning,isSkipping,currentIdx,curResults]);

  const W=curResults.filter(m=>m.result==="W").length;
  const D=curResults.filter(m=>m.result==="D").length;
  const L=curResults.filter(m=>m.result==="L").length;
  const pts=W*3+D;
  const last=curResults[curResults.length-1];
  const rc=last?.result==="W"?"#22C55E":last?.result==="D"?"#F59E0B":"#EF4444";

  const miniStandings=(()=>{
    if(!putDone||isRunning) return [];
    const idx=standings.findIndex(r=>r.isUser);
    return standings.slice(Math.max(0,idx-2),Math.min(standings.length,idx+3));
  })();

  return(
    <div>
      {/* Header */}
      <div style={{marginBottom:14}}>
        <div style={{fontSize:11,fontWeight:700,color:"#F59E0B",textTransform:"uppercase",letterSpacing:1}}>
          Liga Indonesia — Musim {currentSeason}
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
          <div style={{fontSize:16,fontWeight:800,color:"#F1F5F9"}}>
            Putaran {putaranNum} · {putDone?"Selesai":`Match ${currentIdx}/${HALF}`}
          </div>
          <div style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(59,130,246,0.1)",
            border:"1px solid rgba(59,130,246,0.2)",borderRadius:20,padding:"3px 10px"}}>
            <span style={{fontSize:9,color:"#475569"}}>OVR</span>
            <span style={{fontSize:12,fontWeight:800,color:"#3B82F6"}}>{ovr.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Last match ticker */}
      {last&&(
        <div style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${rc}33`,
          borderRadius:8,padding:"8px 12px",marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
          <div style={{fontSize:10,color:"#475569",flexShrink:0}}>{isRunning?"▶":"■"} P{putaranNum}</div>
          <div style={{fontSize:11,color:"#64748B",flex:1,minWidth:0,
            whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>vs {last.oppName}</div>
          <div style={{fontSize:14,fontWeight:800,color:rc,flexShrink:0}}>{last.gf}–{last.ga}</div>
          <div style={{fontSize:10,fontWeight:800,color:rc,background:`${rc}20`,
            padding:"2px 8px",borderRadius:10,flexShrink:0}}>{last.result}</div>
        </div>
      )}

      {/* W/D/L boxes */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7,marginBottom:10}}>
        {[["W",W,"#22C55E"],["D",D,"#F59E0B"],["L",L,"#EF4444"]].map(([label,val,color])=>(
          <div key={label} style={{background:"#0D1828",borderRadius:9,padding:"10px",textAlign:"center"}}>
            <div style={{fontSize:22,fontWeight:800,color}}>{val}</div>
            <div style={{fontSize:10,color:"#475569"}}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{textAlign:"center",fontSize:13,color:"#3B82F6",fontWeight:800,marginBottom:12}}>{pts} poin</div>

      {/* Match result grid */}
      <div style={{marginBottom:14}}>
        <div style={{fontSize:9,fontWeight:700,color:"#334155",textTransform:"uppercase",
          letterSpacing:1,marginBottom:5}}>Putaran {putaranNum} · {curResults.length}/{HALF} match</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
          {Array.from({length:HALF}).map((_,i)=>{
            const r=curResults[i];
            const bg=r?(r.result==="W"?"rgba(34,197,94,0.25)":r.result==="D"?"rgba(245,158,11,0.25)":"rgba(239,68,68,0.2)"):"rgba(255,255,255,0.04)";
            const col=r?(r.result==="W"?"#22C55E":r.result==="D"?"#F59E0B":"#EF4444"):"#1E293B";
            return(
              <div key={i} title={r?`vs ${r.oppName}: ${r.gf}–${r.ga}`:""} style={{
                borderRadius:4,padding:"5px 2px",textAlign:"center",background:bg,fontSize:10,fontWeight:700,color:col,
              }}>{r?r.result:"·"}</div>
            );
          })}
        </div>
      </div>

      {/* Mini standings — only when putaran done */}
      {miniStandings.length>0&&(
        <div style={{marginBottom:12}}>
          <div style={{fontSize:9,fontWeight:700,color:"#334155",textTransform:"uppercase",
            letterSpacing:1,marginBottom:5}}>Posisi kamu</div>
          <div style={{background:"#0A1628",borderRadius:10,overflow:"hidden"}}>
            {miniStandings.map((row,i)=>{
              const isUser=row.isUser;
              const showTop=i===0&&row.position>1;
              const showBot=i===miniStandings.length-1&&row.position<standings.length;
              return(
                <div key={row.name}>
                  {showTop&&<div style={{textAlign:"center",fontSize:10,color:"#1E293B",padding:"3px 0"}}>···</div>}
                  <div style={{display:"grid",gridTemplateColumns:"28px 1fr auto",alignItems:"center",
                    padding:"8px 12px",gap:8,
                    background:isUser?"rgba(0,61,165,0.2)":"transparent",
                    borderLeft:isUser?"3px solid #3B82F6":"3px solid transparent",
                    borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
                    <div style={{fontSize:11,fontWeight:700,textAlign:"center",
                      color:row.position<=3?"#F59E0B":isUser?"#3B82F6":"#475569"}}>#{row.position}</div>
                    <div style={{fontSize:11,fontWeight:isUser?700:400,color:isUser?"#93C5FD":"#CBD5E1",
                      whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                      {isUser?"🔵 ":""}{row.name}</div>
                    <div style={{fontSize:12,fontWeight:700,
                      color:row.position<=3?"#F59E0B":isUser?"#93C5FD":"#E2E8F0",flexShrink:0}}>
                      {row.pts} pts</div>
                  </div>
                  {showBot&&<div style={{textAlign:"center",fontSize:10,color:"#1E293B",padding:"3px 0"}}>···</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {!putDone&&(
          <>
            {!isRunning&&(
              <button onClick={startSim} style={{
                width:"100%",background:"linear-gradient(135deg,#003DA5,#2563EB)",
                color:"#fff",border:"none",padding:"13px",borderRadius:10,
                fontSize:14,fontWeight:700,cursor:"pointer",
                boxShadow:"0 4px 16px rgba(0,61,165,0.4)",
              }}>
                {currentIdx===0?`▶ Mulai Putaran ${putaranNum}`:"▶ Lanjutkan"}
              </button>
            )}
            {isRunning&&(
              <div style={{display:"flex",gap:8}}>
                <div style={{flex:1,background:"rgba(0,61,165,0.08)",border:"1px solid rgba(0,61,165,0.15)",
                  borderRadius:10,padding:"12px",textAlign:"center"}}>
                  <div style={{fontSize:11,color:"#3B82F6",animation:"pulse 1s infinite"}}>⚽ Sedang berlangsung...</div>
                </div>
                <button onClick={skipPut} style={{
                  background:"rgba(255,255,255,0.06)",color:"#94A3B8",
                  border:"1px solid rgba(255,255,255,0.1)",padding:"12px 16px",
                  borderRadius:10,fontSize:12,fontWeight:600,cursor:"pointer",flexShrink:0,
                }}>Skip ⏩</button>
              </div>
            )}
          </>
        )}
        {putDone&&!isRunning&&(
          putaranNum===1?(
            <button onClick={()=>dispatch({type:"HALF_DONE",payload:{matchResults:allResults,standings}})} style={{
              width:"100%",background:"linear-gradient(135deg,#92400E,#B45309)",
              color:"#FDE68A",border:"none",padding:"12px",borderRadius:10,
              fontSize:13,fontWeight:700,cursor:"pointer",
            }}>Lihat Ringkasan Putaran 1 →</button>
          ):(
            <button onClick={()=>dispatch({type:"SEASON_DONE",payload:{matchResults:allResults,standings}})} style={{
              width:"100%",background:userPos===1?"linear-gradient(135deg,#15803D,#16A34A)":"linear-gradient(135deg,#003DA5,#2563EB)",
              color:"#fff",border:"none",padding:"13px",borderRadius:10,
              fontSize:14,fontWeight:700,cursor:"pointer",
              boxShadow:`0 4px 16px ${userPos===1?"rgba(21,128,61,0.5)":"rgba(0,61,165,0.4)"}`,
            }}>
              {userPos===1?"🏆 Lihat Hasil Juara →":"Lihat Hasil Akhir →"}
            </button>
          )
        )}
      </div>
    </div>
  );
}


// ── SEASON HALF SUMMARY ───────────────────────────────────────────────────────
function SeasonHalfSummary({state, dispatch}){
  const ctaRef = useRef(null);
  const halfStandings = state._halfStandings||[];
  const halfPos       = state._halfPos||18;
  const sponsorBonus  = state._sponsorBonus||0;
  const halfResults   = state.currentMatchResults||[];
  const W = halfResults.filter(m=>m.result==="W").length;
  const D = halfResults.filter(m=>m.result==="D").length;
  const L = halfResults.filter(m=>m.result==="L").length;

  // Sponsor tier label + narrative
  const sponsorTier = halfPos<=5
    ? {label:"Sponsor Utama 🥇", tier:"1–5", color:"#F59E0B", narrative:`Posisi #${halfPos} membuat para sponsor kelas atas tertarik. Kontrak iklan berdatangan.`}
    : halfPos<=10
    ? {label:"Sponsor Menengah 🥈", tier:"6–10", color:"#94A3B8", narrative:`Di posisi #${halfPos}, visibilitas tim cukup menarik bagi sponsor menengah.`}
    : {label:"Sponsor Kecil 🥉", tier:"11–18", color:"#7C4A1E", narrative:`Posisi #${halfPos} membuat sponsor besar belum tertarik — tapi dana tetap masuk.`};

  return(
    <div>
      <div style={{fontSize:11,fontWeight:700,color:"#F59E0B",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>
        Liga Indonesia · Musim {state.currentSeason}
      </div>
      <div style={{fontSize:18,fontWeight:800,color:"#F1F5F9",marginBottom:14}}>Putaran 1 Selesai</div>

      {/* Result card */}
      <div style={{background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.25)",
        borderRadius:12,padding:"16px",marginBottom:12}}>
        <div style={{textAlign:"center",marginBottom:12}}>
          <div style={{fontSize:11,color:"#92400E",marginBottom:4}}>Posisi di Putaran 1</div>
          <div style={{fontSize:44,fontWeight:800,color:halfPos<=3?"#F59E0B":"#E2E8F0",lineHeight:1}}>
            #{halfPos}
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"center",gap:20,marginBottom:14}}>
          {[{val:W,label:"W",color:"#22C55E"},{val:D,label:"D",color:"#F59E0B"},{val:L,label:"L",color:"#EF4444"},{val:W*3+D,label:"Poin",color:"#3B82F6"}].map(({val,label,color})=>(
            <div key={label} style={{textAlign:"center"}}>
              <div style={{fontSize:18,fontWeight:800,color}}>{val}</div>
              <div style={{fontSize:9,color:"#475569"}}>{label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* Sponsor bonus storytelling */}
        <div style={{background:"rgba(0,0,0,0.25)",borderRadius:10,padding:"12px 14px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontSize:11,fontWeight:700,color:sponsorTier.color}}>{sponsorTier.label}</span>
            <span style={{fontSize:16,fontWeight:800,color:"#22C55E"}}>+{sponsorBonus}🪙</span>
          </div>
          <div style={{fontSize:11,color:"#64748B",lineHeight:1.6}}>{sponsorTier.narrative}</div>
          <div style={{marginTop:8,fontSize:10,color:"#334155",display:"flex",gap:8,flexWrap:"wrap"}}>
            <span style={{color:halfPos<=5?"#F59E0B":"#334155"}}>Pos 1–5 → +20🪙</span>
            <span>·</span>
            <span style={{color:halfPos>5&&halfPos<=10?"#94A3B8":"#334155"}}>Pos 6–10 → +12🪙</span>
            <span>·</span>
            <span style={{color:halfPos>10?"#7C4A1E":"#334155"}}>Pos 11–18 → +7🪙</span>
          </div>
        </div>
      </div>

      {/* Klasemen dihapus — cukup posisi di result card */}

      <FloatingCTA targetRef={ctaRef} label="Lanjut Putaran 2"/>
      <button ref={ctaRef} onClick={()=>dispatch({type:"CONTINUE_BABAK2"})} style={{
        width:"100%",background:"linear-gradient(135deg,#003DA5,#2563EB)",
        color:"#fff",border:"none",padding:"13px",borderRadius:10,
        fontSize:14,fontWeight:700,cursor:"pointer",
        boxShadow:"0 4px 16px rgba(0,61,165,0.4)",
      }}>
        ▶ Lanjutkan ke Putaran 2
      </button>
    </div>
  );
}

// ── SEASON END SUMMARY ────────────────────────────────────────────────────────
function SeasonEndSummary({state, dispatch}){
  const ctaRef = useRef(null);
  const finalStandings = state._finalStandings||[];
  const finalPos       = state._finalPos||18;
  const endBonus       = state._endBonus||0;
  const isChampion     = state._isChampion||false;
  const allResults     = state.currentMatchResults||[];
  const W   = allResults.filter(m=>m.result==="W").length;
  const D   = allResults.filter(m=>m.result==="D").length;
  const L   = allResults.filter(m=>m.result==="L").length;
  const pts = W*3+D;
  const canContinue = state.currentSeason < state.maxSeasons;

  // Player tier breakdown dari starting XI
  const slots    = FORMATIONS[state.formation]?.slots||[];
  const starters = state.squad?.starters||[];
  const tierCount = {Legenda:0,Gold:0,Silver:0,Bronze:0};
  starters.filter(Boolean).forEach(p=>{ if(tierCount[p.tier]!==undefined) tierCount[p.tier]++; });
  const ovr = calcOVR(slots.map((pos,i)=>({pos,player:starters[i]})));

  // Board commentary + supporter reaction per posisi
  const getBoardCommentary = (pos) => {
    if(pos === 1)   return {
      board: `Luar biasa, ${state.managerName}! Ini adalah pencapaian terbesar dalam sejarah Maung XI. Kami tidak pernah meragukan pilihan kami sejak hari pertama kamu menandatangani kontrak.`,
      supporter: "Supporter Maung XI banjir air mata kebahagiaan. Ribuan bobotoh turun ke jalan merayakan malam bersejarah ini.",
      color:"#F59E0B",bg:"rgba(245,158,11,0.08)",border:"rgba(245,158,11,0.25)"};
    if(pos <= 3)  return {
      board: `Podium! Runner-up dan peringkat ketiga memang menyakitkan, tapi kami melihat fondasi yang sangat kuat. Musim depan, kita datang untuk menang.`,
      supporter: "Supporter memberikan standing ovation panjang. Ada kekecewaan, tapi juga kebanggaan melihat tim berjuang sampai akhir.",
      color:"#94A3B8",bg:"rgba(148,163,184,0.06)",border:"rgba(148,163,184,0.2)"};
    if(pos <= 6)  return {
      board: `Papan atas — posisi ${pos}. Progres ada, tapi kami mengharapkan lebih. Evaluasi transfer window berikutnya menjadi krusial untuk menembus tiga besar.`,
      supporter: "Supporter cukup puas meski belum sepenuhnya yakin. Beberapa suara mulai bertanya-tanya soal ambisi tim ke depan.",
      color:"#3B82F6",bg:"rgba(59,130,246,0.06)",border:"rgba(59,130,246,0.2)"};
    if(pos <= 10) return {
      board: `Posisi ${pos} di papan tengah. Manajemen menilai musim ini sebagai pembelajaran. Ekspektasi naik signifikan di musim berikutnya — kami butuh lebih dari sekadar cukup.`,
      supporter: "Supporter masih setia, tapi bisik-bisik di tribun mulai terdengar. Mereka ingin melihat ambisi lebih besar dari sang manajer.",
      color:"#F97316",bg:"rgba(249,115,22,0.05)",border:"rgba(249,115,22,0.2)"};
    return {
      board: `Posisi ${pos} tidak bisa diterima. Kami menginvestasikan kepercayaan penuh, dan hasilnya jauh dari harapan. Evaluasi menyeluruh akan dilakukan sebelum musim depan dimulai.`,
      supporter: "Kekecewaan terlihat jelas di wajah supporter. Beberapa mulai meragukan apakah manajer ini benar-benar orang yang tepat.",
      color:"#EF4444",bg:"rgba(239,68,68,0.05)",border:"rgba(239,68,68,0.2)"};
  };
  const commentary = getBoardCommentary(finalPos);

  return(
    <div>
      <div style={{fontSize:11,fontWeight:700,color:isChampion?"#F59E0B":"#475569",
        textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>
        Liga Indonesia · Musim {state.currentSeason}
      </div>
      <div style={{fontSize:18,fontWeight:800,color:"#F1F5F9",marginBottom:14}}>
        {isChampion?"🏆 Musim Selesai — JUARA!":"Musim Selesai"}
      </div>

      {/* Final position + W/D/L */}
      <div style={{
        background: isChampion?"linear-gradient(135deg,rgba(245,158,11,0.15),rgba(146,64,14,0.1))":"rgba(255,255,255,0.03)",
        border:`1px solid ${isChampion?"rgba(245,158,11,0.4)":"rgba(255,255,255,0.08)"}`,
        borderRadius:12,padding:"18px",marginBottom:12,textAlign:"center",
      }}>
        <div style={{fontSize:11,color:"#64748B",marginBottom:6}}>Posisi Akhir Musim {state.currentSeason}</div>
        <div style={{fontSize:48,fontWeight:800,
          color:isChampion?"#F59E0B":finalPos<=3?"#94A3B8":"#E2E8F0",marginBottom:8}}>
          #{finalPos}
        </div>
        <div style={{display:"flex",justifyContent:"center",gap:20,fontSize:13,marginBottom:12}}>
          {[{val:W,label:"W",color:"#22C55E"},{val:D,label:"D",color:"#F59E0B"},{val:L,label:"L",color:"#EF4444"},{val:pts,label:"PTS",color:"#3B82F6"}].map(({val,label,color})=>(
            <div key={label} style={{textAlign:"center"}}>
              <div style={{fontSize:22,fontWeight:800,color}}>{val}</div>
              <div style={{fontSize:9,color:"#475569"}}>{label}</div>
            </div>
          ))}
        </div>
        {!isChampion&&endBonus>0&&(
          <div style={{background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.2)",
            borderRadius:8,padding:"8px 14px",display:"inline-flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:11,color:"#64748B"}}>Bonus akhir musim</span>
            <span style={{fontSize:15,fontWeight:800,color:"#22C55E"}}>+{endBonus}🪙</span>
          </div>
        )}
      </div>

      {/* Player tier stats — squad composition */}
      <div style={{background:"#0D1828",borderRadius:10,padding:"12px 14px",marginBottom:12}}>
        <div style={{fontSize:9,fontWeight:700,color:"#334155",textTransform:"uppercase",
          letterSpacing:1,marginBottom:8}}>Komposisi Squad</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:8}}>
          {[
            {tier:"Legenda",color:"#FF6BFF",count:tierCount.Legenda},
            {tier:"Gold",   color:"#F59E0B",count:tierCount.Gold},
            {tier:"Silver", color:"#94A3B8",count:tierCount.Silver},
            {tier:"Bronze", color:"#7C4A1E",count:tierCount.Bronze},
          ].map(({tier,color,count})=>(
            <div key={tier} style={{textAlign:"center",background:"rgba(255,255,255,0.03)",
              borderRadius:8,padding:"8px 4px"}}>
              <div style={{fontSize:18,fontWeight:800,color}}>{count}</div>
              <div style={{fontSize:8,color:"#475569"}}>{tier}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          <span style={{fontSize:10,color:"#475569"}}>OVR Tim</span>
          <span style={{fontSize:18,fontWeight:800,color:"#3B82F6"}}>{ovr.toFixed(1)}</span>
        </div>
      </div>

      {/* Top performers */}
      {state._lastSeasonRecord?.topScorer && (
        <div style={{marginBottom:12}}>
          <div style={{fontSize:9,fontWeight:700,color:"#334155",textTransform:"uppercase",
            letterSpacing:1,marginBottom:6}}>Penampil Terbaik</div>
          <RTGTopPerformers
            topScorer={state._lastSeasonRecord.topScorer}
            topAssist={state._lastSeasonRecord.topAssist}
            
          />
        </div>
      )}

      {/* Player stats table G/A/Key */}
      {state._lastSeasonRecord?.statsArr && (
        <div style={{marginBottom:12}}>
          <div style={{fontSize:9,fontWeight:700,color:"#334155",textTransform:"uppercase",
            letterSpacing:1,marginBottom:6}}>Statistik Pemain — G · A · Key</div>
          <RTGPlayerStatsTable
            statsArr={state._lastSeasonRecord.statsArr}
            starters={state.squad?.starters||[]}
            slots={slots}
          />
        </div>
      )}

      {/* Board commentary */}
      <div style={{background:commentary.bg,border:`1px solid ${commentary.border}`,
        borderRadius:10,padding:"12px 14px",marginBottom:12}}>
        <div style={{fontSize:9,fontWeight:700,color:commentary.color,textTransform:"uppercase",
          letterSpacing:1,marginBottom:6}}>📣 Pernyataan Board Maung XI</div>
        <div style={{fontSize:11,color:"#E2E8F0",lineHeight:1.7,marginBottom:8,fontStyle:"italic"}}>
          "{commentary.board}"
        </div>
        <div style={{fontSize:10,color:"#64748B",lineHeight:1.6,borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:8}}>
          👥 <span style={{color:"#475569",fontWeight:600}}>Reaksi Supporter:</span>{" "}{commentary.supporter}
        </div>
      </div>

      {/* Klasemen akhir — full 18 tim selalu tampil */}
      <div style={{marginBottom:14}}>
        <div style={{fontSize:10,fontWeight:700,color:"#334155",textTransform:"uppercase",
          letterSpacing:1,marginBottom:6}}>Klasemen Akhir Musim {state.currentSeason}</div>
        <ClassemenTable standings={finalStandings} matchesPlayed={34}/>
      </div>

      {/* CTA */}
      <FloatingCTA targetRef={ctaRef} label="Lihat Hasil"/>
      {isChampion ? (
        <button ref={ctaRef} onClick={()=>dispatch({type:"GO_COMPLETION"})} style={{
          width:"100%",background:"linear-gradient(135deg,#92400E,#B45309)",
          color:"#FDE68A",border:"none",padding:"13px",borderRadius:10,
          fontSize:14,fontWeight:700,cursor:"pointer",
          boxShadow:"0 4px 16px rgba(146,64,14,0.5)",
        }}>🏆 Lihat Hasil Akhir →</button>
      ) : canContinue ? (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <button onClick={()=>dispatch({type:"NEXT_SEASON"})} style={{
            width:"100%",background:"linear-gradient(135deg,#003DA5,#2563EB)",
            color:"#fff",border:"none",padding:"13px",borderRadius:10,
            fontSize:14,fontWeight:700,cursor:"pointer",
            boxShadow:"0 4px 16px rgba(0,61,165,0.4)",
          }}>
            Musim {state.currentSeason+1} — Transfer Window →
          </button>
          <div style={{fontSize:11,color:"#475569",textAlign:"center"}}>
            {state.maxSeasons - state.currentSeason} musim tersisa untuk meraih gelar 🏆
          </div>
        </div>
      ) : (
        <button onClick={()=>dispatch({type:"GO_COMPLETION"})} style={{
          width:"100%",background:"rgba(239,68,68,0.12)",
          color:"#EF4444",border:"1px solid rgba(239,68,68,0.3)",
          padding:"13px",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",
        }}>Lihat Hasil Akhir →</button>
      )}
    </div>
  );
}

// ── RTG TRANSFER WINDOW (antar musim) ─────────────────────────────────────────
function RTGTransferWindow({state, dispatch}){
  const ctaRef = useRef(null);
  const {coins, currentSeason, ownedPlayerIds, formation} = state;
  const [tab, setTab]       = useState("buy");
  const [buyCart, setBuyCart]   = useState([]); // player names to buy
  const [sellCart, setSellCart] = useState([]); // player names to sell

  // Market: all tiers available in transfer window (unlike initial draft)
  const [market] = useState(()=>{
    const tierOrder = {Legenda:0,Gold:1,Silver:2,Bronze:3};
    const catOrder  = {GK:0,DEF:1,MID:2,FWD:3};
    const available = PLAYERS
      .filter(p=>!ownedPlayerIds.includes(p.name))
      .sort(()=>Math.random()-0.5)
      .slice(0,50);
    const picks=[];
    const roles=["GK","DEF","MID","FWD"];
    const counts={GK:2,DEF:6,MID:8,FWD:6};
    roles.forEach(role=>{
      const rp = available
        .filter(p=>getPosCategory(p.pos[0])===role)
        .sort((a,b)=>tierOrder[a.tier]-tierOrder[b.tier]||b.rating-a.rating)
        .slice(0,counts[role]);
      picks.push(...rp);
    });
    return picks.sort((a,b)=>catOrder[getPosCategory(a.pos[0])]-catOrder[getPosCategory(b.pos[0])]||tierOrder[a.tier]-tierOrder[b.tier]);
  });

  const benchPlayers = ownedPlayerIds
    .map(id=>PLAYERS.find(p=>p.name===id))
    .filter(Boolean)
    .filter(p=>!state.squad.starters.some(s=>s&&s.name===p.name))
    .sort((a,b)=>b.rating-a.rating);

  const buyCost   = buyCart.reduce((s,n)=>{ const p=PLAYERS.find(x=>x.name===n); return s+(p?TIER_PRICE[p.tier]:0); },0);
  const sellGain  = sellCart.reduce((s,n)=>{ const p=PLAYERS.find(x=>x.name===n); return s+(p?TIER_SELL[p.tier]:0); },0);
  const netCoins  = coins + sellGain - buyCost;
  const canAffordAll = netCoins >= 0;

  const toggleBuy  = (name) => setBuyCart(c=>c.includes(name)?c.filter(x=>x!==name):[...c,name]);
  const toggleSell = (name) => setSellCart(c=>c.includes(name)?c.filter(x=>x!==name):[...c,name]);

  const handleConfirm = () => {
    if(!canAffordAll) return;
    // Process sells first (gain coins), then buys
    sellCart.forEach(name => dispatch({type:"TRANSFER_SELL", payload:{playerName:name}}));
    buyCart.forEach(name => {
      const p = PLAYERS.find(x=>x.name===name);
      if(p) dispatch({type:"TRANSFER_BUY", payload:{player:p}});
    });
    dispatch({type:"CONFIRM_TRANSFER"});
  };

  return(
    <div>
      <div style={{fontSize:11,fontWeight:700,color:"#F59E0B",textTransform:"uppercase",
        letterSpacing:1,marginBottom:4}}>Musim {currentSeason}</div>
      <div style={{fontSize:18,fontWeight:800,color:"#F1F5F9",marginBottom:4}}>Transfer Window</div>

      {/* Coin balance — real-time with cart */}
      <div style={{background:"rgba(255,255,255,0.92)",borderRadius:10,
        padding:"10px 14px",marginBottom:10,display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:20}}>🪙</span>
        <div style={{flex:1}}>
          <div style={{fontSize:11,color:"#475569"}}>Saldo Maung Coin</div>
          <div style={{display:"flex",alignItems:"baseline",gap:8}}>
            <div style={{fontSize:20,fontWeight:800,color:canAffordAll?"#003DA5":"#EF4444"}}>{netCoins}</div>
            {(buyCost>0||sellGain>0)&&(
              <div style={{fontSize:10,color:"#64748B"}}>
                {sellGain>0&&<span style={{color:"#22C55E"}}>+{sellGain} </span>}
                {buyCost>0&&<span style={{color:"#EF4444"}}>-{buyCost} </span>}
                dari {coins}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Formation slot guide */}
      {formation && FORMATIONS[formation] && (
        <div style={{background:"rgba(59,130,246,0.06)",border:"1px solid rgba(59,130,246,0.15)",
          borderRadius:8,padding:"9px 12px",marginBottom:12}}>
          <div style={{fontSize:9,fontWeight:700,color:"#3B82F6",textTransform:"uppercase",
            letterSpacing:1,marginBottom:5}}>Formasi {formation} — Slot yang Perlu Diisi</div>
          <div style={{fontSize:11,color:"#94A3B8",lineHeight:1.8,wordBreak:"break-word"}}>
            {FORMATIONS[formation].slots.map((pos,i)=>(
              <span key={i}>
                <span style={{color:CAT_COLOR[getPosCategory(pos)],fontWeight:600}}>{pos}</span>
                {i < FORMATIONS[formation].slots.length-1 &&
                  <span style={{color:"#334155",margin:"0 3px"}}>·</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Cart summary — shown when items selected */}
      {(buyCart.length>0||sellCart.length>0)&&(
        <div style={{background:canAffordAll?"rgba(34,197,94,0.08)":"rgba(239,68,68,0.08)",
          border:`1px solid ${canAffordAll?"rgba(34,197,94,0.25)":"rgba(239,68,68,0.25)"}`,
          borderRadius:10,padding:"10px 14px",marginBottom:12}}>
          <div style={{fontSize:10,fontWeight:700,color:canAffordAll?"#22C55E":"#EF4444",
            marginBottom:6}}>
            {canAffordAll?"✓ Siap konfirmasi":"✗ Saldo tidak cukup"}
          </div>
          <div style={{display:"flex",gap:12,fontSize:11,flexWrap:"wrap"}}>
            {buyCart.length>0&&<span style={{color:"#F59E0B"}}>Beli {buyCart.length} pemain (-{buyCost}🪙)</span>}
            {sellCart.length>0&&<span style={{color:"#22C55E"}}>Jual {sellCart.length} pemain (+{sellGain}🪙)</span>}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{display:"flex",gap:6,marginBottom:12}}>
        {[["buy",`🛒 Beli${buyCart.length>0?` (${buyCart.length})`:""}`,],
          ["sell",`💰 Jual${sellCart.length>0?` (${sellCart.length})`:""}`,]].map(([key,label])=>(
          <button key={key} onClick={()=>setTab(key)} style={{
            flex:1,padding:"9px",borderRadius:8,border:"none",
            background:tab===key?"#003DA5":"rgba(255,255,255,0.04)",
            color:tab===key?"#fff":"#475569",
            fontSize:12,fontWeight:700,cursor:"pointer",transition:"all 0.15s",
          }}>{label}</button>
        ))}
      </div>

      {/* Price guide */}
      {tab==="buy"&&(
        <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
          {[["Bronze","8🪙"],["Silver","15🪙"],["Gold","28🪙"],["Legenda","50🪙"]].map(([tier,price])=>(
            <div key={tier} style={{fontSize:10,color:"#64748B",background:"rgba(255,255,255,0.03)",
              padding:"3px 8px",borderRadius:6}}>
              {tier} = <span style={{color:"#F59E0B",fontWeight:700}}>{price}</span>
            </div>
          ))}
        </div>
      )}
      {tab==="sell"&&(
        <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
          {[["Bronze","4🪙"],["Silver","7🪙"],["Gold","14🪙"],["Legenda","25🪙"]].map(([tier,price])=>(
            <div key={tier} style={{fontSize:10,color:"#64748B",background:"rgba(255,255,255,0.03)",
              padding:"3px 8px",borderRadius:6}}>
              {tier} → <span style={{color:"#22C55E",fontWeight:700}}>+{price}</span>
            </div>
          ))}
        </div>
      )}

      {/* Buy list */}
      {tab==="buy"&&(
        <div style={{display:"flex",flexDirection:"column",gap:3,marginBottom:14}}>
          {["GK","DEF","MID","FWD"].map(cat=>{
            const catCards = market.filter(p=>getPosCategory(p.pos[0])===cat&&!ownedPlayerIds.includes(p.name));
            if(!catCards.length) return null;
            return(
              <div key={cat}>
                <div style={{fontSize:9,fontWeight:700,color:"#334155",textTransform:"uppercase",
                  letterSpacing:1.5,padding:"6px 0 3px"}}>{cat}</div>
                {catCards.map(p=>{
                  const tc       = TIER_COLOR[p.tier];
                  const cost     = TIER_PRICE[p.tier];
                  const inCart   = buyCart.includes(p.name);
                  const afford   = netCoins >= (inCart?0:cost); // if already in cart, removing it frees coins
                  return(
                    <div key={p.name} onClick={()=>toggleBuy(p.name)} style={{
                      display:"flex",alignItems:"center",gap:10,
                      background:inCart?"rgba(245,158,11,0.1)":"rgba(255,255,255,0.02)",
                      border:`1px solid ${inCart?"#F59E0B":afford?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.03)"}`,
                      borderRadius:8,padding:"8px 12px",marginBottom:3,
                      cursor:"pointer",opacity:(!inCart&&!afford)?0.4:1,
                      transition:"all 0.12s",
                    }}>
                      <div style={{width:34,fontSize:13,fontWeight:800,color:tc,flexShrink:0}}>{p.rating}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:11,fontWeight:600,color:"#E2E8F0"}}>{p.name}</div>
                        <div style={{display:"flex",gap:3,marginTop:2,flexWrap:"wrap"}}>
                          {p.pos.map(pos=>(
                            <span key={pos} style={{fontSize:8,color:CAT_COLOR[getPosCategory(pos)],
                              background:"rgba(255,255,255,0.06)",padding:"1px 4px",borderRadius:3}}>{pos}</span>
                          ))}
                          <span style={{fontSize:8,color:"#475569",marginLeft:2}}>{p.type}</span>
                        </div>
                      </div>
                      <div style={{fontSize:10,fontWeight:700,color:tc,flexShrink:0}}>{p.tier}</div>
                      <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                        <span style={{fontSize:11,fontWeight:700,color:"#F59E0B"}}>{cost}🪙</span>
                        <div style={{
                          width:18,height:18,borderRadius:4,
                          background:inCart?"#F59E0B":"rgba(255,255,255,0.08)",
                          border:`1px solid ${inCart?"#F59E0B":"rgba(255,255,255,0.15)"}`,
                          display:"flex",alignItems:"center",justifyContent:"center",
                          fontSize:11,color:inCart?"#000":"#475569",fontWeight:700,
                        }}>{inCart?"✓":"+"}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
          {market.filter(p=>!ownedPlayerIds.includes(p.name)).length===0&&(
            <div style={{textAlign:"center",padding:"20px",fontSize:11,color:"#334155"}}>
              Semua pemain di pasar sudah dimiliki
            </div>
          )}
        </div>
      )}

      {/* Sell list */}
      {tab==="sell"&&(
        <div style={{display:"flex",flexDirection:"column",gap:3,marginBottom:14}}>
          {benchPlayers.length===0?(
            <div style={{textAlign:"center",padding:"20px",fontSize:11,color:"#334155",fontStyle:"italic"}}>
              Tidak ada pemain di bangku untuk dijual.<br/>
              <span style={{fontSize:10}}>Pemain Starting XI tidak bisa dijual.</span>
            </div>
          ):benchPlayers.map(p=>{
            const tc     = TIER_COLOR[p.tier];
            const sell   = TIER_SELL[p.tier];
            const inCart = sellCart.includes(p.name);
            return(
              <div key={p.name} onClick={()=>toggleSell(p.name)} style={{
                display:"flex",alignItems:"center",gap:10,
                background:inCart?"rgba(34,197,94,0.1)":"rgba(255,255,255,0.02)",
                border:`1px solid ${inCart?"#22C55E":"rgba(255,255,255,0.07)"}`,
                borderRadius:8,padding:"8px 12px",marginBottom:3,cursor:"pointer",
                transition:"all 0.12s",
              }}>
                <div style={{width:34,fontSize:13,fontWeight:800,color:tc,flexShrink:0}}>{p.rating}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#E2E8F0"}}>{p.name}</div>
                  <div style={{display:"flex",gap:3,marginTop:2,flexWrap:"wrap"}}>
                    {p.pos.map(pos=>(
                      <span key={pos} style={{fontSize:8,color:CAT_COLOR[getPosCategory(pos)],
                        background:"rgba(255,255,255,0.06)",padding:"1px 4px",borderRadius:3}}>{pos}</span>
                    ))}
                    <span style={{fontSize:8,color:"#475569",marginLeft:2}}>{p.type}</span>
                  </div>
                </div>
                <div style={{fontSize:10,fontWeight:700,color:tc,flexShrink:0}}>{p.tier}</div>
                <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                  <span style={{fontSize:11,fontWeight:700,color:"#22C55E"}}>+{sell}🪙</span>
                  <div style={{
                    width:18,height:18,borderRadius:4,
                    background:inCart?"#22C55E":"rgba(255,255,255,0.08)",
                    border:`1px solid ${inCart?"#22C55E":"rgba(255,255,255,0.15)"}`,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:11,color:inCart?"#000":"#475569",fontWeight:700,
                  }}>{inCart?"✓":"−"}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm button */}
      <FloatingCTA targetRef={ctaRef} label="Konfirmasi Transfer"/>
      <button ref={ctaRef} onClick={handleConfirm} disabled={!canAffordAll} style={{
        width:"100%",
        background:canAffordAll?"linear-gradient(135deg,#003DA5,#2563EB)":"rgba(255,255,255,0.05)",
        color:canAffordAll?"#fff":"#334155",
        border:"none",padding:"13px",borderRadius:10,
        fontSize:14,fontWeight:700,cursor:canAffordAll?"pointer":"default",
        boxShadow:canAffordAll?"0 4px 16px rgba(0,61,165,0.4)":"none",
      }}>
        {buyCart.length===0&&sellCart.length===0
          ? `Lewati — Atur Lineup Musim ${currentSeason} →`
          : canAffordAll
            ? `Konfirmasi Transaksi & Atur Lineup →`
            : `Saldo Tidak Cukup (kurang ${Math.abs(netCoins)}🪙)`
        }
      </button>
    </div>
  );
}

function RTGCompletionPage({state, dispatch}){
  const ctaRef = useRef(null);
  const posterRef      = useRef(null);
  const submitLockRef  = useRef(false); // useRef kebal StrictMode double-invoke
  const [showPoster, setShowPoster]     = useState(false);
  const [savingPoster, setSavingPoster] = useState(false);
  const [lbTab, setLbTab]               = useState("fastest");
  const [lbData, setLbData]             = useState([]);
  const [lbLoading, setLbLoading]       = useState(true);
  const [submitted, setSubmitted]       = useState(false);

  const scenario    = state.completionScenario||"gagal_total";
  const SCENARIOS   = {
    glory:       {emoji:"🏆",title:"Mengukir Sejarah!",subtitle:"Kamu menjawab keraguan dengan Piala",
                  color:"#F59E0B",bg:"linear-gradient(135deg,#1a1000,#3d2200)",border:"rgba(245,158,11,0.4)"},
    gagal_total: {emoji:"💔",title:"Gagal Total!",subtitle:"Mengkhianati kepercayaan yang diberikan",
                  color:"#EF4444",bg:"linear-gradient(135deg,#1a0000,#2d0000)",border:"rgba(239,68,68,0.3)"},
  };
  const sc          = SCENARIOS[scenario]||SCENARIOS["gagal_total"];
  const seasonsPlayed = (state.seasonResults||[]).length;
  const slots         = FORMATIONS[state.formation||""]?.slots||[];
  const starters      = state.squad?.starters||[];
  const finalOVR      = (()=>{ try{ const o=Math.round(calcOVR(slots.map((pos,i)=>({pos,player:starters[i]})))*10)/10; return o||state.highestOVR||0; }catch(e){ return state.highestOVR||0; } })();

  useEffect(()=>{
    track('rtg_game_completed',{scenario,seasons_played:seasonsPlayed,total_pts:state.totalPts,total_wins:state.totalWins,ovr:finalOVR,champion:state.champion});

    // Submit guard: cek state flag DAN local ref — keduanya harus false untuk submit
    // useRef tidak di-reset saat StrictMode double-invoke, jadi hanya submit 1x
    if(!state.leaderboardSubmitted && !submitLockRef.current && seasonsPlayed>=1){
      submitLockRef.current = true; // lock langsung sebelum async call
      submitRTGScore({
        manager:         state.managerName,
        pts:             state.totalPts,
        ovr:             finalOVR,
        wins:            state.totalWins,
        seasons_played:  seasonsPlayed,
        champion:        state.champion,
        champion_season: state.championSeason,
      }).then(()=>{
        dispatch({type:"MARK_LB_SUBMITTED"});
        setSubmitted(true);
      });
    }
    fetchRTGLeaderboard(lbTab).then(d=>{ setLbData(d||[]); setLbLoading(false); });
  },[]);

  useEffect(()=>{ setLbLoading(true); fetchRTGLeaderboard(lbTab).then(d=>{ setLbData(d||[]); setLbLoading(false); }); },[lbTab]);

  // ── Poster save ──────────────────────────────────────────────────────────────
  function handleSavePoster(){
    if(!posterRef.current||savingPoster) return;
    setSavingPoster(true);
    const capture = ()=>{
      window.html2canvas(posterRef.current,{backgroundColor:"#EFF6FF",scale:2,useCORS:true,logging:false})
        .then(canvas=>{
          const a=document.createElement('a');
          a.download=`maung-xi-rtg-${state.managerName||'hasil'}.png`;
          a.href=canvas.toDataURL('image/png');
          a.click();
          track('rtg_poster_downloaded',{manager:state.managerName,scenario});
          setSavingPoster(false);
        }).catch(()=>{ alert("Screenshot gagal, gunakan screenshot manual."); setSavingPoster(false); });
    };
    if(window.html2canvas){ capture(); }
    else{
      const s=document.createElement('script');
      s.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      s.onload=capture;
      s.onerror=()=>{ alert("Load gagal, gunakan screenshot manual."); setSavingPoster(false); };
      document.head.appendChild(s);
    }
  }

  // ── Poster card — BLUE-WHITE theme ──────────────────────────────────────────
  const PosterCard = () => {
    const isGlory = scenario==="glory";
    const accentColor = isGlory ? "#1D4ED8" : "#DC2626";
    const accentLight = isGlory ? "#DBEAFE" : "#FEE2E2";

    // Accumulated top performers
    const allStats={};
    (state.seasonResults||[]).forEach(r=>(r.statsArr||[]).forEach(p=>{
      if(!allStats[p.name]) allStats[p.name]={name:p.name,goals:0,assists:0};
      allStats[p.name].goals+=p.goals; allStats[p.name].assists+=p.assists;
    }));
    const arr=Object.values(allStats);
    const topScorer = arr.length?[...arr].sort((a,b)=>b.goals-a.goals)[0]:null;
    const topAssist = arr.length?[...arr].sort((a,b)=>b.assists-a.assists)[0]:null;

    // Total earned coins
    const totalEarned = 80 + (state.coinLog||[]).filter(l=>l.delta>0).reduce((s,l)=>s+l.delta,0);

    return(
      <div ref={posterRef} style={{
        background:"#EFF6FF",borderRadius:16,padding:"18px 16px",
        width:"100%",maxWidth:"min(360px,calc(100vw - 32px))",
        border:`2px solid ${accentColor}`,boxSizing:"border-box",
      }}>
        {/* Mode label */}
        <div style={{background:accentColor,borderRadius:8,padding:"6px 10px",marginBottom:12,textAlign:"center"}}>
          <div style={{fontSize:10,fontWeight:700,color:"#fff",letterSpacing:1,textTransform:"uppercase"}}>Mode Story: Road to Glory</div>
          <div style={{fontSize:9,color:"rgba(255,255,255,0.7)",marginTop:1}}>Misi menjuarai liga dalam waktu 5 musim!</div>
        </div>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,paddingBottom:10,borderBottom:`1px solid ${accentColor}22`}}>
          <TigerBadge size={28}/>
          <div>
            <div style={{fontSize:12,fontWeight:800,color:"#1E3A5F"}}>Maung Eleven</div>
            <div style={{fontSize:9,color:"#64748B"}}>Persib All-Time Dream Team</div>
          </div>
          <div style={{marginLeft:"auto",fontSize:22}}>{isGlory?"🏆":"💔😡"}</div>
        </div>

        {/* Result */}
        <div style={{textAlign:"center",marginBottom:12,background:accentLight,borderRadius:10,padding:"12px 10px"}}>
          <div style={{fontSize:18,fontWeight:800,color:accentColor,marginBottom:2}}>{sc.title}</div>
          <div style={{fontSize:10,color:"#64748B",marginBottom:8}}>{sc.subtitle}</div>
          <div style={{fontSize:11,fontWeight:700,color:"#1E3A5F"}}>{state.managerName} · {seasonsPlayed} musim{state.champion?` · Juara M${state.championSeason}`:""}</div>
        </div>

        {/* Stats row */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,marginBottom:10}}>
          {[{val:state.totalWins,label:"W",color:"#16A34A"},{val:state.totalDraws,label:"D",color:"#D97706"},{val:state.totalLosses,label:"L",color:"#DC2626"},{val:state.totalPts,label:"Pts",color:"#1D4ED8"}].map(({val,label,color})=>(
            <div key={label} style={{background:"#fff",borderRadius:7,padding:"7px 4px",textAlign:"center",border:"1px solid #E2E8F0"}}>
              <div style={{fontSize:17,fontWeight:800,color}}>{val}</div>
              <div style={{fontSize:8,color:"#94A3B8"}}>{label}</div>
            </div>
          ))}
        </div>

        {/* OVR + Coin */}
        <div style={{display:"flex",gap:5,marginBottom:10}}>
          <div style={{flex:1,background:"#fff",borderRadius:7,padding:"7px 10px",border:"1px solid #E2E8F0"}}>
            <div style={{fontSize:8,color:"#94A3B8",marginBottom:1}}>Final OVR</div>
            <div style={{fontSize:18,fontWeight:800,color:"#1D4ED8"}}>{finalOVR}</div>
          </div>
          <div style={{flex:1,background:"#fff",borderRadius:7,padding:"7px 10px",border:"1px solid #E2E8F0"}}>
            <div style={{fontSize:8,color:"#94A3B8",marginBottom:1}}>Total Coin</div>
            <div style={{fontSize:18,fontWeight:800,color:"#D97706"}}>{totalEarned}🪙</div>
          </div>
        </div>

        {/* Per season compact */}
        {(state.seasonResults||[]).length>0&&(
          <div style={{marginBottom:10}}>
            <div style={{fontSize:8,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>Perjalanan per Musim</div>
            {(state.seasonResults||[]).map((r,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 0",borderBottom:"1px solid #E2E8F0"}}>
                <span style={{fontSize:9,fontWeight:700,color:"#64748B",width:20,flexShrink:0}}>M{r.season}</span>
                <span style={{fontSize:9,color:"#16A34A"}}>{r.W}W</span>
                <span style={{fontSize:9,color:"#D97706"}}>{r.D}D</span>
                <span style={{fontSize:9,color:"#DC2626"}}>{r.L}L</span>
                <span style={{fontSize:9,color:"#1D4ED8",fontWeight:700,flex:1}}>{r.pts}pts</span>
                <span style={{fontSize:9,fontWeight:700,color:r.isChampion?"#D97706":r.position<=3?"#64748B":"#94A3B8",flexShrink:0}}>
                  #{r.position}{r.isChampion?" 🏆":""}
                </span>
                {r.topScorer&&<span style={{fontSize:8,color:"#16A34A",flexShrink:0}}>⚽{r.topScorer.goals} {r.topScorer.name.split(" ")[0]}</span>}
              </div>
            ))}
          </div>
        )}

        {/* Top performers */}
        {(topScorer||topAssist)&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:10}}>
            {[{label:"⚽ Top Skor",p:topScorer,val:topScorer?.goals,color:"#16A34A"},{label:"🎯 Top Assist",p:topAssist,val:topAssist?.assists,color:"#1D4ED8"}].filter(x=>x.p).map(({label,p,val,color})=>(
              <div key={label} style={{background:"#fff",borderRadius:7,padding:"7px 8px",textAlign:"center",border:"1px solid #E2E8F0"}}>
                <div style={{fontSize:8,color:"#94A3B8",marginBottom:1}}>{label}</div>
                <div style={{fontSize:14,fontWeight:800,color}}>{val}</div>
                <div style={{fontSize:9,color:"#1E3A5F",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name.split(" ")[0]}</div>
              </div>
            ))}
          </div>
        )}

        {/* Starting XI */}
        <div style={{marginBottom:10}}>
          <div style={{fontSize:8,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>Starting XI · {state.formation}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"2px 8px"}}>
            {(()=>{
              const catOrder=["GK","DEF","MID","FWD"];
              const filled=slots.map((pos,i)=>({pos,player:starters[i]})).filter(s=>s.player);
              const sorted=[...filled].sort((a,b)=>catOrder.indexOf(getPosCategory(a.pos))-catOrder.indexOf(getPosCategory(b.pos)));
              const half=Math.ceil(sorted.length/2);
              const leftCol=sorted.slice(0,half), rightCol=sorted.slice(half);
              return Array.from({length:Math.max(leftCol.length,rightCol.length)},(_,i)=>[leftCol[i],rightCol[i]]).map((pair,ri)=>
                pair.map((s,ci)=>{
                  if(!s) return <div key={`e${ri}${ci}`}/>;
                  const cc=CAT_COLOR[getPosCategory(s.pos)];
                  const tc=TIER_COLOR[s.player.tier];
                  return(
                    <div key={s.player.name} style={{display:"flex",alignItems:"center",gap:3,padding:"2px 0",borderBottom:"1px solid #E2E8F0"}}>
                      <span style={{fontSize:7,fontWeight:700,color:cc,background:`${cc}18`,padding:"1px 4px",borderRadius:3,flexShrink:0,minWidth:20,textAlign:"center"}}>{s.pos}</span>
                      <span style={{fontSize:9,color:"#1E3A5F",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.player.name}</span>
                      <span style={{fontSize:9,fontWeight:700,color:tc,flexShrink:0}}>{s.player.rating}</span>
                    </div>
                  );
                })
              );
            })()}
          </div>
        </div>

        {/* Footer */}
        <div style={{paddingTop:8,borderTop:`1px solid ${accentColor}22`,textAlign:"center"}}>
          <div style={{fontSize:9,fontWeight:700,color:accentColor}}>🎮 maung-eleven.vercel.app</div>
          <div style={{fontSize:8,color:"#94A3B8",marginTop:1}}>Persib All-Time Dream Team · Story Mode</div>
        </div>
      </div>
    );
  };

  return(
    <div style={{maxWidth:520,margin:"0 auto",paddingBottom:100}}>{/* paddingBottom for floating buttons */}

      {/* Hero */}
      <div style={{background:sc.bg,border:`1px solid ${sc.border}`,borderRadius:16,padding:"28px 20px",textAlign:"center",marginBottom:16,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-20,right:-20,fontSize:80,opacity:0.08}}>{sc.emoji}</div>
        <div style={{fontSize:52,marginBottom:8}}>{sc.emoji}</div>
        <div style={{fontSize:20,fontWeight:800,color:sc.color,lineHeight:1.3,marginBottom:6}}>{sc.title}</div>
        <div style={{fontSize:12,color:"#94A3B8",marginBottom:4}}>{sc.subtitle}</div>
        <div style={{fontSize:12,color:"#64748B"}}>{state.managerName} · {seasonsPlayed} musim{state.champion?` · Juara Musim ${state.championSeason}`:""}</div>
      </div>

      {/* Stats grid */}
      <div style={{background:"#0D1828",borderRadius:12,padding:"16px",marginBottom:12}}>
        <div style={{fontSize:10,fontWeight:700,color:"#334155",textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Statistik Keseluruhan</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:12}}>
          {[{val:state.totalWins,label:"W",color:"#22C55E"},{val:state.totalDraws,label:"D",color:"#F59E0B"},{val:state.totalLosses,label:"L",color:"#EF4444"},{val:state.totalPts,label:"Poin",color:"#3B82F6"}].map(({val,label,color})=>(
            <div key={label} style={{textAlign:"center",background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"10px 6px"}}>
              <div style={{fontSize:22,fontWeight:800,color}}>{val}</div>
              <div style={{fontSize:9,color:"#475569"}}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
          <div style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"10px 12px"}}>
            <div style={{fontSize:9,color:"#475569",marginBottom:2}}>Final OVR</div>
            <div style={{fontSize:18,fontWeight:800,color:"#3B82F6"}}>{finalOVR}</div>
          </div>
          <div style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"10px 12px"}}>
            <div style={{fontSize:9,color:"#475569",marginBottom:2}}>Saldo Akhir</div>
            <div style={{fontSize:18,fontWeight:800,color:"#F59E0B"}}>{state.coins}🪙</div>
          </div>
        </div>
      </div>

      {/* Per season compact text */}
      {(state.seasonResults||[]).length>0&&(
        <div style={{background:"#0D1828",borderRadius:12,padding:"16px",marginBottom:12}}>
          <div style={{fontSize:10,fontWeight:700,color:"#334155",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Hasil Per Musim</div>
          {(state.seasonResults||[]).map((r,i)=>(
            <div key={i} style={{padding:"7px 0",borderBottom:i<(state.seasonResults||[]).length-1?"1px solid rgba(255,255,255,0.04)":"none"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:r.topScorer?3:0}}>
                <span style={{fontSize:11,fontWeight:700,color:"#475569",width:28,flexShrink:0}}>M{r.season}</span>
                <span style={{fontSize:10,color:"#22C55E"}}>{r.W}W</span>
                <span style={{fontSize:10,color:"#F59E0B"}}>{r.D}D</span>
                <span style={{fontSize:10,color:"#EF4444"}}>{r.L}L</span>
                <span style={{fontSize:10,color:"#3B82F6",fontWeight:700}}>{r.pts}pts</span>
                <span style={{flex:1}}/>
                <span style={{fontSize:11,fontWeight:700,flexShrink:0,color:r.isChampion?"#F59E0B":r.position<=3?"#94A3B8":"#475569"}}>#{r.position}{r.isChampion?" 🏆":""}</span>
              </div>
              {(r.topScorer||r.topAssist)&&(
                <div style={{paddingLeft:28,display:"flex",gap:14}}>
                  {r.topScorer&&<span style={{fontSize:10,color:"#475569"}}>⚽ <span style={{color:"#22C55E",fontWeight:600}}>{r.topScorer.goals}G</span> {r.topScorer.name.split(" ")[0]}</span>}
                  {r.topAssist&&<span style={{fontSize:10,color:"#475569"}}>🎯 <span style={{color:"#3B82F6",fontWeight:600}}>{r.topAssist.assists}A</span> {r.topAssist.name.split(" ")[0]}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Accumulated top performers */}
      {(()=>{
        const allStats={};
        (state.seasonResults||[]).forEach(r=>(r.statsArr||[]).forEach(p=>{ if(!allStats[p.name]) allStats[p.name]={name:p.name,goals:0,assists:0}; allStats[p.name].goals+=p.goals; allStats[p.name].assists+=p.assists; }));
        const arr=Object.values(allStats);
        if(!arr.length) return null;
        const topScorer=[...arr].sort((a,b)=>b.goals-a.goals)[0];
        const topAssist=[...arr].sort((a,b)=>b.assists-a.assists)[0];
        return(
          <div style={{background:"#0D1828",borderRadius:12,padding:"16px",marginBottom:12}}>
            <div style={{fontSize:10,fontWeight:700,color:"#334155",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Top Pemain — Akumulasi Semua Musim</div>
            <RTGTopPerformers topScorer={topScorer} topAssist={topAssist}/>
          </div>
        );
      })()}

      {/* Leaderboard RTG */}
      <div style={{background:"#0D1828",borderRadius:12,overflow:"hidden",marginBottom:14}}>
        <div style={{padding:"10px 14px",borderBottom:"1px solid rgba(255,255,255,0.06)",
          display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontSize:12,fontWeight:700,color:"#F59E0B"}}>🏅 Hall of Champions</div>
          <div style={{display:"flex",gap:4}}>
            {[{key:"fastest",label:"⚡ Tercepat"},{key:"ovr",label:"💪 OVR Tertinggi"}].map(t=>(
              <button key={t.key} onClick={()=>setLbTab(t.key)} style={{
                background:lbTab===t.key?"#92400E":"transparent",
                color:lbTab===t.key?"#FDE68A":"#475569",
                border:`1px solid ${lbTab===t.key?"#92400E":"rgba(255,255,255,0.08)"}`,
                padding:"3px 9px",borderRadius:20,fontSize:10,fontWeight:600,cursor:"pointer",
              }}>{t.label}</button>
            ))}
          </div>
        </div>

        {/* Column headers */}
        <div style={{display:"grid",
          gridTemplateColumns: lbTab==="fastest" ? "24px 1fr 60px 60px" : "24px 1fr 44px 60px",
          padding:"5px 14px",gap:6,borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
          {lbTab==="fastest"
            ? ["","Manager","Musim","Total Pts"].map((h,i)=>(
                <div key={i} style={{fontSize:9,fontWeight:700,color:"#334155",textTransform:"uppercase",
                  letterSpacing:0.8,textAlign:i>=2?"right":"left"}}>{h}</div>))
            : ["","Manager","M","OVR"].map((h,i)=>(
                <div key={i} style={{fontSize:9,fontWeight:700,color:"#334155",textTransform:"uppercase",
                  letterSpacing:0.8,textAlign:i>=2?"right":"left"}}>{h}</div>))
          }
        </div>

        {lbLoading?(
          <div style={{textAlign:"center",padding:"16px",fontSize:11,color:"#334155"}}>Memuat...</div>
        ):lbData.length===0?(
          <div style={{textAlign:"center",padding:"16px 14px",fontSize:11,color:"#334155"}}>
            {lbTab==="fastest"
              ? "Belum ada champion. Jadilah yang pertama menjuarai Liga!"
              : "Belum ada data OVR. Raih gelar juara untuk masuk leaderboard!"}
          </div>
        ):(
          lbData.map((row,i)=>{
            const isMe = state.managerName && row.manager?.toLowerCase()===state.managerName.toLowerCase();
            const medals = ["🥇","🥈","🥉"];
            return(
              <div key={i} style={{
                display:"grid",
                gridTemplateColumns: lbTab==="fastest" ? "24px 1fr 60px 60px" : "24px 1fr 44px 60px",
                alignItems:"center",padding:"8px 14px",gap:6,
                borderBottom:"1px solid rgba(255,255,255,0.04)",
                background:isMe?"rgba(146,64,14,0.15)":"transparent",
              }}>
                {/* Rank */}
                <div style={{fontSize:i<3?14:11,fontWeight:700,
                  color:i<3?"#F59E0B":"#334155",flexShrink:0,textAlign:"center"}}>
                  {i<3?medals[i]:`${i+1}`}
                </div>
                {/* Manager name */}
                <div style={{fontSize:11,fontWeight:isMe?700:400,
                  color:isMe?"#FDE68A":"#CBD5E1",
                  whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                  {row.manager}{isMe?" (kamu)":""}
                </div>
                {lbTab==="fastest" ? (
                  <>
                    {/* Champion season */}
                    <div style={{fontSize:12,fontWeight:700,textAlign:"right",
                      color:row.champion_season===1?"#F59E0B":row.champion_season<=2?"#94A3B8":"#475569"}}>
                      M{row.champion_season}
                    </div>
                    {/* Total pts */}
                    <div style={{fontSize:11,fontWeight:600,color:i===0?"#F59E0B":"#E2E8F0",textAlign:"right"}}>
                      {row.pts} pts
                    </div>
                  </>
                ):(
                  <>
                    {/* Seasons played */}
                    <div style={{fontSize:10,color:"#475569",textAlign:"right"}}>
                      M{row.champion_season||"?"}
                    </div>
                    {/* Final OVR */}
                    <div style={{fontSize:12,fontWeight:700,
                      color:i===0?"#F59E0B":"#E2E8F0",textAlign:"right"}}>
                      {Number(row.ovr).toFixed(1)}
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}

        {/* Footnote */}
        <div style={{padding:"8px 14px",borderTop:"1px solid rgba(255,255,255,0.04)"}}>
          <div style={{fontSize:9,color:"#334155",textAlign:"center"}}>
            🏆 Hanya champion yang masuk leaderboard
          </div>
        </div>
      </div>

      {/* ── FLOATING BUTTONS — same pattern as Classic ── */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
        width:"100%",maxWidth:600,
        background:"linear-gradient(to top, #070D1A 70%, transparent)",
        padding:"16px 16px 20px",zIndex:40,display:"flex",gap:8,
      }}>
        <button onClick={()=>setShowPoster(true)} style={{
          flex:2,background:"#003DA5",color:"#fff",border:"none",padding:"13px",
          borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",gap:6,
          boxShadow:"0 4px 20px rgba(0,61,165,0.5)",
        }}>📥 Download Poster Hasil Lengkap</button>
        <FloatingCTA targetRef={ctaRef} label="Main Lagi"/>
      <button ref={ctaRef} onClick={()=>dispatch({type:"RESTART_RTG"})} style={{
          flex:1,background:"rgba(255,255,255,0.06)",color:"#94A3B8",
          border:"1px solid rgba(255,255,255,0.12)",
          padding:"13px",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer",
        }}>Main Lagi</button>
      </div>

      {/* ── POSTER MODAL POPUP ── */}
      {showPoster&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:999,
          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
          padding:"16px",overflowY:"auto",
        }}>
          <PosterCard/>
          <div style={{width:"100%",maxWidth:"min(360px,calc(100vw - 32px))",marginTop:12,display:"flex",flexDirection:"column",gap:8}}>
            <button onClick={handleSavePoster} disabled={savingPoster} style={{
              background:"#22C55E",color:"#fff",border:"none",padding:"14px",
              borderRadius:10,fontSize:14,fontWeight:700,cursor:savingPoster?"default":"pointer",
              opacity:savingPoster?0.6:1,
            }}>
              {savingPoster?"⏳ Menyimpan...":"💾 Simpan Gambar"}
            </button>
            <button onClick={()=>setShowPoster(false)} style={{
              background:"transparent",color:"#64748B",
              border:"1px solid rgba(255,255,255,0.1)",
              padding:"12px",borderRadius:10,fontSize:13,cursor:"pointer",
            }}>Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── RTG PLAYER STATS TABLE (G / A) ───────────────────────────────────────────
function RTGPlayerStatsTable({statsArr, starters, slots}){
  if(!statsArr||!statsArr.length) return null;

  const catOrder = {GK:0,DEF:1,MID:2,FWD:3};
  const slotMap  = {};
  if(slots && starters){
    slots.forEach((pos,i)=>{ if(starters[i]) slotMap[starters[i].name] = pos; });
  }

  const sorted = [...statsArr].sort((a,b)=>{
    const posA = slotMap[a.name]||"";
    const posB = slotMap[b.name]||"";
    return (catOrder[getPosCategory(posA)]||4) - (catOrder[getPosCategory(posB)]||4);
  });

  return(
    <div style={{background:"#0A1628",borderRadius:10,overflow:"hidden"}}>
      {/* Header — only G and A */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 36px 36px",
        padding:"6px 12px",gap:4,background:"rgba(255,255,255,0.03)",
        borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
        {["Pemain","G","A"].map((h,i)=>(
          <div key={h} style={{fontSize:9,fontWeight:700,color:"#334155",
            textTransform:"uppercase",letterSpacing:0.8,
            textAlign:i===0?"left":"center"}}>{h}</div>
        ))}
      </div>
      {sorted.map((p,i)=>{
        const pos = slotMap[p.name]||"";
        const cat = getPosCategory(pos);
        const cc  = CAT_COLOR[cat]||"#475569";
        const isTop = p.goals>=3||p.assists>=3;
        return(
          <div key={p.name} style={{
            display:"grid",gridTemplateColumns:"1fr 36px 36px",
            padding:"7px 12px",gap:4,alignItems:"center",
            background:i%2===0?"transparent":"rgba(255,255,255,0.01)",
            borderBottom:"1px solid rgba(255,255,255,0.03)",
          }}>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              {pos&&<span style={{fontSize:8,fontWeight:700,color:cc,
                background:`${cc}18`,padding:"1px 4px",borderRadius:3,flexShrink:0}}>{pos}</span>}
              <span style={{fontSize:11,color:isTop?"#E2E8F0":"#94A3B8",
                fontWeight:isTop?600:400,
                whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</span>
            </div>
            <div style={{fontSize:12,fontWeight:p.goals>0?700:400,
              color:p.goals>0?"#22C55E":"#1E293B",textAlign:"center"}}>{p.goals}</div>
            <div style={{fontSize:12,fontWeight:p.assists>0?700:400,
              color:p.assists>0?"#3B82F6":"#1E293B",textAlign:"center"}}>{p.assists}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── RTG TOP PERFORMERS (G / A only) ──────────────────────────────────────────
function RTGTopPerformers({topScorer, topAssist, compact=false}){
  const items = [
    {label:"⚽ Top Skor",   player:topScorer, val:topScorer?.goals,  valLabel:"gol", color:"#22C55E"},
    {label:"🎯 Top Assist", player:topAssist, val:topAssist?.assists, valLabel:"ast", color:"#3B82F6"},
  ].filter(x=>x.player);

  if(!items.length) return null;

  return(
    <div style={{display:"grid",gridTemplateColumns:`repeat(${items.length},1fr)`,gap:6}}>
      {items.map(({label,player,val,valLabel,color})=>(
        <div key={label} style={{
          background:"rgba(255,255,255,0.03)",
          border:`1px solid ${color}22`,
          borderRadius:8,padding:compact?"6px 8px":"10px 10px",
          textAlign:"center",
        }}>
          <div style={{fontSize:compact?8:9,color:"#334155",marginBottom:3}}>{label}</div>
          <div style={{fontSize:compact?16:18,fontWeight:800,color,marginBottom:2}}>{val}</div>
          <div style={{fontSize:compact?8:9,color:"#475569",fontWeight:600}}>{valLabel}</div>
          <div style={{fontSize:compact?9:10,color:"#64748B",
            whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",marginTop:2}}>
            {player.name.split(" ")[0]}
          </div>
        </div>
      ))}
    </div>
  );
}


// ── COIN BOOSTER PAGE (musim 2 & 4) ──────────────────────────────────────────
const BOOSTER_PRIZES = [
  {amount:200, prob:0.03, label:"200🪙", color:"#FF6BFF", glow:"rgba(255,107,255,0.6)"},
  {amount:125, prob:0.07, label:"125🪙", color:"#F59E0B", glow:"rgba(245,158,11,0.5)"},
  {amount:100, prob:0.10, label:"100🪙", color:"#94A3B8", glow:"rgba(148,163,184,0.4)"},
  {amount:80,  prob:0.15, label:"80🪙",  color:"#22C55E", glow:"rgba(34,197,94,0.4)"},
  {amount:50,  prob:0.25, label:"50🪙",  color:"#3B82F6", glow:"rgba(59,130,246,0.4)"},
  {amount:30,  prob:0.40, label:"30🪙",  color:"#F97316", glow:"rgba(249,115,22,0.35)"},
];

function rollBoosterPrize(){
  const r = Math.random();
  let cumul = 0;
  for(const prize of BOOSTER_PRIZES){
    cumul += prize.prob;
    if(r < cumul) return prize;
  }
  return BOOSTER_PRIZES[BOOSTER_PRIZES.length-1];
}

function CoinBoosterPage({state, dispatch}){
  const ctaRef = useRef(null);
  const [phase, setPhase]     = useState("intro");   // intro | rolling | result
  const [slots, setSlots]     = useState([0,1,2]);   // indices into display array
  const [prize, setPrize]     = useState(null);
  const [spinCount, setSpinCount] = useState(0);
  const intervalRef = useRef(null);
  const timeoutRef  = useRef(null);

  // All labels in display order for the slot drum
  const DRUM = BOOSTER_PRIZES.map(p=>p.label);

  const startRoll = () => {
    if(phase !== "intro") return;
    setPhase("rolling");

    const won = rollBoosterPrize();
    const wonIdx = BOOSTER_PRIZES.findIndex(p=>p.amount===won.amount);

    let tick = 0;
    const totalTicks = 28 + Math.floor(Math.random()*8); // 28–35 ticks

    intervalRef.current = setInterval(()=>{
      tick++;
      // Speed: fast then slow down at end
      const progress = tick / totalTicks;
      const delay = progress > 0.7 ? 180 : progress > 0.5 ? 100 : 60;

      setSlots(prev=>[
        (prev[0]+1) % DRUM.length,
        (prev[1]+2) % DRUM.length,
        (prev[2]+3) % DRUM.length,
      ]);
      setSpinCount(tick);

      if(tick >= totalTicks){
        clearInterval(intervalRef.current);
        // Lock all 3 slots to winner
        setSlots([wonIdx, wonIdx, wonIdx]);
        timeoutRef.current = setTimeout(()=>{
          setPrize(won);
          setPhase("result");
        }, 400);
      }
    }, 60);
  };

  useEffect(()=>()=>{ clearInterval(intervalRef.current); clearTimeout(timeoutRef.current); },[]);

  const seasonLabel = state.currentSeason === 3 ? "2" : "4"; // booster triggered before S3 or S5

  return(
    <div style={{maxWidth:420,margin:"0 auto"}}>
      {/* Header */}
      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{fontSize:11,fontWeight:700,color:"#F59E0B",textTransform:"uppercase",
          letterSpacing:2,marginBottom:6}}>Sponsor Event 🎉</div>
        <div style={{fontSize:20,fontWeight:800,color:"#F1F5F9",marginBottom:8}}>
          Dana Tambahan Masuk!
        </div>
        <div style={{background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.2)",
          borderRadius:12,padding:"14px 16px",fontSize:12,color:"#94A3B8",lineHeight:1.7}}>
          Setelah musim {seasonLabel} yang penuh drama, sebuah sponsor baru melihat potensi besar dalam perjalanan Maung XI. Mereka siap menggelontorkan dana segar — tapi jumlahnya adalah kejutan!
        </div>
      </div>

      {/* Slot Machine */}
      <div style={{
        background:"#0A1020",border:"2px solid rgba(245,158,11,0.3)",
        borderRadius:16,padding:"24px 16px",marginBottom:20,
        boxShadow:"0 0 40px rgba(245,158,11,0.1)",
      }}>
        {/* Machine top label */}
        <div style={{textAlign:"center",marginBottom:16}}>
          <div style={{fontSize:10,fontWeight:700,color:"#334155",textTransform:"uppercase",
            letterSpacing:2}}>🎰 Maung Coin Spinner</div>
        </div>

        {/* Slot drums — 3 columns */}
        <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:20}}>
          {slots.map((drumIdx, i)=>{
            const isLocked = phase==="result";
            const spinColor = BOOSTER_PRIZES[drumIdx%BOOSTER_PRIZES.length]?.color||"#F59E0B";
            return(
              <div key={i} style={{
                flex:1,maxWidth:100,
                background:"#060D1A",
                border:`2px solid ${isLocked?prize?.color||"#F59E0B":"rgba(255,255,255,0.08)"}`,
                borderRadius:10,
                overflow:"hidden",
                boxShadow:isLocked?`0 0 20px ${prize?.glow||"rgba(245,158,11,0.4)"}`:"none",
                transition:"box-shadow 0.3s,border-color 0.3s",
              }}>
                {/* Slot window — shows prev/current/next */}
                {[-1,0,1].map(offset=>{
                  const idx = ((drumIdx + offset) % DRUM.length + DRUM.length) % DRUM.length;
                  const isCenter = offset===0;
                  const prize2 = BOOSTER_PRIZES[idx];
                  return(
                    <div key={offset} style={{
                      padding:"10px 4px",
                      textAlign:"center",
                      fontSize:isCenter?20:13,
                      fontWeight:isCenter?800:400,
                      color:isCenter?(prize2?.color||"#F59E0B"):"#1E293B",
                      background:isCenter?"rgba(255,255,255,0.04)":"transparent",
                      borderTop:isCenter?"1px solid rgba(255,255,255,0.06)":"none",
                      borderBottom:isCenter?"1px solid rgba(255,255,255,0.06)":"none",
                      transition:"all 0.06s",
                      opacity:isCenter?1:0.4,
                    }}>
                      {prize2?.label||"?"}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Probability guide */}
        {phase==="intro"&&(
          <div style={{marginBottom:16}}>
            <div style={{fontSize:9,fontWeight:700,color:"#1E293B",textTransform:"uppercase",
              letterSpacing:1,marginBottom:8,textAlign:"center"}}>Kemungkinan Hadiah</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:4,justifyContent:"center"}}>
              {BOOSTER_PRIZES.map(p=>(
                <div key={p.amount} style={{
                  background:"rgba(255,255,255,0.03)",border:`1px solid ${p.color}33`,
                  borderRadius:6,padding:"3px 8px",
                  display:"flex",alignItems:"center",gap:5,
                }}>
                  <span style={{fontSize:10,fontWeight:700,color:p.color}}>{p.label}</span>
                  <span style={{fontSize:9,color:"#334155"}}>{Math.round(p.prob*100)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Spin button */}
        {phase==="intro"&&(
          <>
            <FloatingCTA targetRef={ctaRef} label="Putar Sekarang"/>
            <button ref={ctaRef} onClick={startRoll} style={{
              width:"100%",
              background:"linear-gradient(135deg,#92400E,#B45309)",
              color:"#FDE68A",border:"none",padding:"14px",borderRadius:10,
              fontSize:15,fontWeight:700,cursor:"pointer",
              boxShadow:"0 4px 20px rgba(146,64,14,0.5)",
              letterSpacing:1,
            }}>
              🎰 PUTAR SEKARANG
            </button>
          </>
        )}

        {phase==="rolling"&&(
          <div style={{textAlign:"center",padding:"10px 0"}}>
            <div style={{fontSize:12,color:"#F59E0B",fontWeight:700,
              animation:"pulse 0.5s infinite"}}>
              ⚡ Berputar...
            </div>
          </div>
        )}
      </div>

      {/* Result */}
      {phase==="result"&&prize&&(
        <div style={{
          background:`linear-gradient(135deg,${prize.glow.replace("0.","0.08,").split(",")[0]+","+prize.glow.replace("0.","0.04)")})`,
          border:`2px solid ${prize.color}`,
          borderRadius:16,padding:"24px 20px",marginBottom:16,textAlign:"center",
          animation:"fadeSlideIn 0.4s ease",
        }}>
          <div style={{fontSize:42,marginBottom:4}}>🎉</div>
          <div style={{fontSize:13,color:"#94A3B8",marginBottom:4}}>Sponsor memberikan</div>
          <div style={{fontSize:52,fontWeight:800,color:prize.color,marginBottom:4,
            textShadow:`0 0 20px ${prize.glow}`}}>
            {prize.label}
          </div>
          <div style={{fontSize:12,color:"#64748B",lineHeight:1.7}}>
            Dana segar dari sponsor telah masuk ke kas Maung XI. Gunakan dengan bijak di transfer window berikutnya!
          </div>
          <div style={{marginTop:12,fontSize:11,color:"#475569"}}>
            Saldo setelah bonus: <span style={{color:prize.color,fontWeight:700}}>{state.coins + prize.amount}🪙</span>
          </div>
        </div>
      )}

      {phase==="result"&&prize&&(
        <button ref={ctaRef} onClick={()=>dispatch({type:"CLAIM_BOOSTER",payload:{amount:prize.amount}})} style={{
          width:"100%",
          background:"linear-gradient(135deg,#003DA5,#2563EB)",
          color:"#fff",border:"none",padding:"14px",borderRadius:10,
          fontSize:14,fontWeight:700,cursor:"pointer",
          boxShadow:"0 4px 16px rgba(0,61,165,0.4)",
        }}>
          Klaim & Lanjut ke Transfer Window →
        </button>
      )}
    </div>
  );
}


// ── RTG REDUCER ───────────────────────────────────────────────────────────────
function rtgReducer(state, action){
  let next;
  switch(action.type){

    case "GO_HOME":
      resetRTGState();
      return {...initialRTGState(state.managerName), gamePhase:"story_intro"};

    case "RESTART_RTG":
      // Main Lagi — kembali ke story_intro RTG, tidak keluar ke landing page
      resetRTGState();
      return initialRTGState(state.managerName);

    case "MARK_LB_SUBMITTED":
      next = {...state, leaderboardSubmitted: true};
      saveRTGState(next);
      return next;

    case "RESUME_SESSION":{
      // Restore to the phase that was saved before we redirected to story_intro
      const saved = loadRTGState();
      if (saved && saved.gamePhase !== "story_intro") {
        return saved;
      }
      // Fallback: go to formation if nothing else
      next = {...state, gamePhase:"formation"};
      saveRTGState(next);
      return next;
    }

    case "RESET_AND_START":
      resetRTGState();
      return initialRTGState(state.managerName);

    case "GO_STORY_INTRO":
      next = {...state, gamePhase:"story_intro"};
      saveRTGState(next);
      return next;

    case "GO_FORMATION":
      track('rtg_formation_started', {manager: state.managerName});
      next = {...state, gamePhase:"formation"};
      saveRTGState(next);
      return next;

    case "SET_FORMATION":{
      // Auto-assign lowest rated squad for this formation
      const autoSquad = autoAssignLowestSquad(action.payload);
      next = {
        ...state,
        formation: action.payload,
        squad: {starters: autoSquad.starters, bench: autoSquad.bench},
        ownedPlayerIds: autoSquad.ownedPlayerIds,
      };
      saveRTGState(next);
      return next;
    }

    case "START_DRAFT":
      next = {...state, gamePhase:"initial_draft"};
      saveRTGState(next);
      return next;

    case "SKIP_DRAFT":
      next = {...state, gamePhase:"assign"};
      saveRTGState(next);
      return next;

    case "CONFIRM_INITIAL_DRAFT":{
      const {players, totalCost} = action.payload;
      const newCoins = state.coins - totalCost;
      // Merge new players into existing owned (from auto-assign) + bought
      const existingIds = state.ownedPlayerIds;
      const newIds = players.map(p=>p.name).filter(n=>!existingIds.includes(n));
      const allIds = [...existingIds, ...newIds];

      let bal = state.coins;
      const log = players.map(p=>{
        bal -= TIER_PRICE[p.tier];
        return {season:state.currentSeason, event:"buy", player:p.name, tier:p.tier,
          delta:-TIER_PRICE[p.tier], balance:bal};
      });

      next = {
        ...state,
        coins: newCoins,
        coinLog: [...state.coinLog, ...log],
        ownedPlayerIds: allIds,
        gamePhase: "assign",
      };
      saveRTGState(next);
      return next;
    }

    case "SWAP_SQUAD":{
      /*
        Payload variants (use names not indices for bench — avoids sort mismatch):
        A) starter ↔ starter:   {fromStarter:i, toStarter:j}
        B) bench  → starter:    {fromBenchName:"X", toStarter:j}
        C) starter → bench:     {fromStarter:i, toBench:true}
           (starter goes to bench = just clear that slot)
        D) starter ↔ bench:     {fromStarter:i, fromBenchName:"X"}
           (swap: bench player fills starter slot, old starter goes to bench)
      */
      const {fromStarter, toStarter, fromBenchName} = action.payload;
      const newStarters = [...state.squad.starters];
      const slotsArr    = FORMATIONS[state.formation]?.slots||[];

      // Resolve players
      const benchPlayerByName = (name) =>
        PLAYERS.find(p => p.name === name) || null;

      if (fromStarter !== undefined && toStarter !== undefined) {
        // A) Starter ↔ Starter swap
        const pA = newStarters[fromStarter];
        const pB = newStarters[toStarter];
        // Validate: pA must fit toStarter slot, pB must fit fromStarter slot
        if (pA && !pA.pos.includes(slotsArr[toStarter]))   return state;
        if (pB && !pB.pos.includes(slotsArr[fromStarter])) return state;
        newStarters[toStarter]   = pA || null;
        newStarters[fromStarter] = pB || null;

      } else if (fromBenchName && toStarter !== undefined) {
        // B) Bench → Starter slot
        const benchP = benchPlayerByName(fromBenchName);
        if (!benchP) return state;
        if (!benchP.pos.includes(slotsArr[toStarter])) return state;
        // Old starter goes to bench (bench is computed, just clear the slot)
        newStarters[toStarter] = benchP;

      } else if (fromStarter !== undefined && fromBenchName) {
        // D) Starter ↔ Bench (swap starter with a specific bench player)
        const starterP = newStarters[fromStarter];
        const benchP   = benchPlayerByName(fromBenchName);
        if (!benchP) return state;
        if (!benchP.pos.includes(slotsArr[fromStarter])) return state;
        newStarters[fromStarter] = benchP;
        // old starterP automatically goes to bench (computed from ownedPlayerIds)

      } else if (fromStarter !== undefined && action.payload.toBench) {
        // C) Starter → Bench (just clear the starter slot)
        newStarters[fromStarter] = null;
      }

      next = {...state, squad:{...state.squad, starters:newStarters}};

      // Update highestOVR
      const ovr2 = calcOVR(slotsArr.map((pos,i)=>({pos,player:newStarters[i]})));
      const yc2  = newStarters.filter(p=>p&&p.type==="Youth").length;
      const finalOVR = ovr2+(yc2>=5?6:yc2>=3?3:0);
      if(finalOVR>state.highestOVR) next.highestOVR=finalOVR;

      saveRTGState(next);
      return next;
    }

    case "TRANSFER_BUY":{
      const {player} = action.payload;
      const cost = TIER_PRICE[player.tier];
      if(state.coins < cost) return state;
      if(state.ownedPlayerIds.includes(player.name)) return state;
      const log = {season:state.currentSeason, event:"buy", player:player.name,
        tier:player.tier, delta:-cost, balance:state.coins-cost};
      next = {
        ...state,
        coins: state.coins - cost,
        ownedPlayerIds: [...state.ownedPlayerIds, player.name],
        coinLog: [...state.coinLog, log],
      };
      saveRTGState(next);
      return next;
    }

    case "TRANSFER_SELL":{
      const {playerName} = action.payload;
      const player = PLAYERS.find(p=>p.name===playerName);
      if(!player) return state;
      // Cannot sell if in starting XI
      if(state.squad.starters.some(s=>s&&s.name===playerName)) return state;
      const sell = TIER_SELL[player.tier];
      const log = {season:state.currentSeason, event:"sell", player:playerName,
        tier:player.tier, delta:sell, balance:state.coins+sell};
      next = {
        ...state,
        coins: state.coins + sell,
        ownedPlayerIds: state.ownedPlayerIds.filter(n=>n!==playerName),
        soldPlayerIds: [...(state.soldPlayerIds||[]), playerName],
        coinLog: [...state.coinLog, log],
      };
      saveRTGState(next);
      return next;
    }

    case "CONFIRM_TRANSFER":
      next = {...state, gamePhase:"assign"};
      saveRTGState(next);
      return next;

    case "HALF_DONE":{
      // Called after Babak 1 (matches 1-17) completes
      // payload: {matchResults: [...17 matches], standings}
      const {matchResults: halfResults, standings: halfStandings} = action.payload;
      const halfPos = halfStandings.find(r=>r.isUser)?.position || 18;
      const sponsorBonus = SPONSOR_BONUS(halfPos);
      next = {
        ...state,
        coins: state.coins + sponsorBonus,
        currentMatchResults: halfResults,
        gamePhase: "season_half",
        _halfStandings: halfStandings,
        _halfPos: halfPos,
        _sponsorBonus: sponsorBonus,
      };
      saveRTGState(next);
      return next;
    }

    case "SEASON_DONE":{
      // Called after Babak 2 (matches 18-34) completes
      // payload: {matchResults: [...34 matches total], standings}
      const {matchResults: allResults, standings: finalStandings} = action.payload;
      const finalPos = finalStandings.find(r=>r.isUser)?.position || 18;
      const isChampion = finalPos === 1;
      const endBonus = END_BONUS(finalPos);

      const W = allResults.filter(m=>m.result==="W").length;
      const D = allResults.filter(m=>m.result==="D").length;
      const L = allResults.filter(m=>m.result==="L").length;
      const pts = W*3+D;
      const gf = allResults.reduce((s,m)=>s+m.gf,0);
      const ga = allResults.reduce((s,m)=>s+m.ga,0);

      const slots = FORMATIONS[state.formation]?.slots||[];
      const ovr = calcOVR(slots.map((pos,i)=>({pos,player:state.squad.starters[i]})));

      // Generate player stats from this season's match results
      const seasonStats = genRTGSeasonStats(
        state.squad.starters,
        slots,
        allResults
      );

      const seasonRecord = {
        season: state.currentSeason,
        W, D, L, pts, gf, ga,
        position: finalPos,
        isChampion,
        endBonus,
        ovr,
        standings: finalStandings,
        playerStats:  seasonStats.playerStats,
        statsArr:     seasonStats.statsArr,
        topScorer:    seasonStats.topScorer,
        topAssist:    seasonStats.topAssist,
        
      };

      const newSeasonResults = [...state.seasonResults, seasonRecord];
      const newCoins = isChampion ? state.coins : state.coins + endBonus;
      const newTotalPts = state.totalPts + pts;
      const newTotalWins = state.totalWins + W;
      const newTotalDraws = state.totalDraws + D;
      const newTotalLosses = state.totalLosses + L;
      const newHighestOVR = Math.max(state.highestOVR, ovr);

      track('rtg_season_completed', {
        season: state.currentSeason,
        position: finalPos,
        pts, W, D, L,
        is_champion: isChampion,
        ovr,
      });
      next = {
        ...state,                          // ← PENTING: preserve semua state existing
        coins: newCoins,
        seasonResults: newSeasonResults,
        totalPts: newTotalPts,
        totalWins: newTotalWins,
        totalDraws: newTotalDraws,
        totalLosses: newTotalLosses,
        highestOVR: newHighestOVR,
        champion: isChampion || state.champion,
        championSeason: isChampion ? state.currentSeason : state.championSeason,
        currentMatchResults: allResults,
        gamePhase: "season_end",
        _finalStandings: finalStandings,
        _finalPos: finalPos,
        _endBonus: endBonus,
        _isChampion: isChampion,
        _lastSeasonRecord: seasonRecord,
      };
      saveRTGState(next);
      return next;
    }

    case "GO_COMPLETION":{
      const isChamp = state.champion || state._isChampion;
      const scenario = isChamp ? "glory" : "gagal_total";
      // leaderboardSubmitted dipertahankan dari state — jangan reset ke false
      // supaya tidak double-submit kalau user refresh atau komponen re-mount
      next = {...state, gamePhase:"completion", completionScenario:scenario};
      saveRTGState(next);
      return next;
    }

    case "CONTINUE_BABAK2":
      // Return to season view for Babak 2 — preserve currentMatchResults
      next = {...state, gamePhase:"season"};
      saveRTGState(next);
      return next;

    case "CONFIRM_LINEUP":
      // Start a fresh season simulation (clear match results)
      track('rtg_season_started', {season: state.currentSeason, ovr: (() => {
        const sl = FORMATIONS[state.formation]?.slots||[];
        return calcOVR(sl.map((pos,i)=>({pos,player:state.squad.starters[i]})));
      })()});
      next = {...state, gamePhase:"season", currentMatchResults:[]};
      saveRTGState(next);
      return next;

    case "NEXT_SEASON":{
      const nextSeason = state.currentSeason + 1;
      if(nextSeason > state.maxSeasons){
        return rtgReducer(state, {type:"GO_COMPLETION"});
      }
      // Coin booster event: trigger after musim 2 dan 4 selesai (sebelum transfer window)
      const triggerBooster = state.currentSeason === 2 || state.currentSeason === 4;
      next = {
        ...state,
        currentSeason: nextSeason,
        currentMatchResults: [],
        gamePhase: triggerBooster ? "coin_booster" : "transfer_end",
        _halfStandings: null, _halfPos: null, _sponsorBonus: null,
        _finalStandings: null, _finalPos: null, _endBonus: null,
        _isChampion: false, _lastSeasonRecord: null,
      };
      saveRTGState(next);
      return next;
    }

    case "CLAIM_BOOSTER":{
      const {amount} = action.payload;
      next = {
        ...state,
        coins: state.coins + amount,
        gamePhase: "transfer_end",
        coinLog: [...state.coinLog, {
          season: state.currentSeason,
          event: "booster",
          player: "Sponsor Event",
          tier: "Gold",
          delta: amount,
          balance: state.coins + amount,
        }],
      };
      saveRTGState(next);
      return next;
    }

    default:
      return state;
  }
}

// ── MAIN RTG COMPONENT ───────────────────────────────────────────────────────
export default function RoadToGlory({onSwitchMode}){
  const managerName = (() => { try{ return localStorage.getItem("maung_manager")||""; }catch(e){ return ""; } })();
  const bp = useBreakpoint();
  const isDesktop = bp === "desktop";

  const [state, dispatch] = useState(()=>{
    // If user just came from landing page (pendingMode still set), always start at story_intro
    // App.js clears pendingMode in useEffect (async), so it's still present on first mount
    const isFromLanding = (() => {
      try { return !!localStorage.getItem('maung_pendingMode'); } catch(e) { return false; }
    })();

    if (isFromLanding) {
      // Fresh entry from landing — check if there's an existing session to offer resume
      const saved = loadRTGState();
      if (saved && saved.gamePhase && saved.gamePhase !== "story_intro" && saved.gamePhase !== "completion") {
        // Has active session — show story_intro with resume option
        return { ...saved, gamePhase: "story_intro", _hasSavedSession: true };
      }
      // No active session — clean slate
      return initialRTGState(managerName);
    }

    // Returning directly (page refresh mid-game) — restore exactly where they were
    const saved = loadRTGState();
    return saved || initialRTGState(managerName);
  });

  // Wrap dispatch — intercept GO_HOME to call onSwitchMode (reducer tidak bisa akses prop)
  const realDispatch = useCallback((action) => {
    if(action.type === "GO_HOME"){
      resetRTGState();
      onSwitchMode?.();
      return;
    }
    dispatch(prev => rtgReducer(prev, action));
  }, [onSwitchMode]);

  const css = `
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#070D1A;color:#E2E8F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
    .btn-p{width:100%;background:#003DA5;color:#fff;border:none;padding:12px 18px;border-radius:10px;
      font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;}
    .btn-p:disabled{opacity:0.35;cursor:not-allowed}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
    @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes fadeSlideIn{0%{opacity:0;transform:translateY(-8px)}100%{opacity:1;transform:translateY(0)}}
    @keyframes floatBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(4px)}}
  `;

  const {gamePhase} = state;

  // Auto scroll to top setiap ganti phase
  useEffect(()=>{
    window.scrollTo({top:0, behavior:'smooth'});
  }, [gamePhase]);

  return(
    <div style={{maxWidth:600,margin:"0 auto",minHeight:"100vh",background:"#070D1A"}}>
      <style>{css}</style>

      {/* Header */}
      <div style={{background:"#0D1B35",borderBottom:"1px solid rgba(255,255,255,0.07)",padding:"10px 14px",display:"flex",alignItems:"center",gap:10,minHeight:52}}>
        <TigerBadge size={32}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:800,color:"#fff",letterSpacing:-0.3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>Maung Eleven</div>
          <div style={{fontSize:10,color:"#F59E0B",fontWeight:600,whiteSpace:"nowrap"}}>📖 Road to Glory</div>
        </div>
        {/* Coin display — hidden during initial_draft which has its own real-time tracker */}
        {gamePhase !== "initial_draft" && <CoinDisplay coins={state.coins}/>}
      </div>

      {/* Season indicator — show during active game phases */}
      {["season","season_half","season_end","transfer_end","assign","coin_booster"].includes(gamePhase)&&(
        <div style={{background:"rgba(245,158,11,0.06)",borderBottom:"1px solid rgba(245,158,11,0.12)",
          padding:"6px 18px",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          <span style={{fontSize:10,color:"#475569"}}>Musim</span>
          <span style={{fontSize:13,fontWeight:800,color:"#F59E0B"}}>{state.currentSeason}</span>
          <span style={{fontSize:10,color:"#334155"}}>dari {state.maxSeasons}</span>
        </div>
      )}

      {/* Content */}
      <div style={{padding:isDesktop?"20px 28px":"12px 14px",maxWidth:isDesktop&&gamePhase==="formation"?900:600,margin:"0 auto",boxSizing:"border-box"}}>

        {gamePhase==="story_intro"&&(
          <RTGStoryIntro
            managerName={state.managerName||managerName}
            dispatch={realDispatch}
            hasSavedSession={state._hasSavedSession||false}
            savedSeason={state.currentSeason||1}
          />
        )}

        {gamePhase==="formation"&&(
          <RTGFormationSelector state={state} dispatch={realDispatch}/>
        )}

        {gamePhase==="initial_draft"&&(
          <RTGInitialDraft state={state} dispatch={realDispatch}/>
        )}

        {gamePhase==="assign"&&(
          <SquadBoard state={state} dispatch={realDispatch}/>
        )}

        {gamePhase==="season"&&(
          <RTGSeasonView state={state} dispatch={realDispatch}/>
        )}

        {gamePhase==="season_half"&&(
          <SeasonHalfSummary state={state} dispatch={realDispatch}/>
        )}

        {gamePhase==="season_end"&&(
          <SeasonEndSummary state={state} dispatch={realDispatch}/>
        )}

        {gamePhase==="coin_booster"&&(
          <CoinBoosterPage state={state} dispatch={realDispatch}/>
        )}

        {gamePhase==="transfer_end"&&(
          <RTGTransferWindow state={state} dispatch={realDispatch}/>
        )}

        {gamePhase==="completion"&&(
          <RTGCompletionPage state={state} dispatch={realDispatch}/>
        )}

      </div>

      {/* Game footer */}
      <div style={{borderTop:"1px solid rgba(255,255,255,0.04)",padding:"12px 16px",textAlign:"center",background:"#040810"}}>
        <div style={{fontSize:11,color:"#2D3748",lineHeight:1.8}}>
          <div>Story: Road to Glory · Maung Eleven</div>
          <div style={{color:"#374151"}}>dibuat oleh rakakostarian · 2026</div>
        </div>
      </div>
    </div>
  );
}
