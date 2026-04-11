// ================================================================
//  SPLASH SPLASH — worlds.js
//  ✏️  ADD NEW WORLDS: extend WORLDS{}, PLANETS[], WORLD_QUESTS{}
//  Everything self-contained — no other file needs to change!
// ================================================================
'use strict';

// ── SHAKE ──
let shakeX=0,shakeY=0,shakeMag=0;
function shake(m){shakeMag=Math.max(shakeMag,m);}
function tickShake(){if(shakeMag>0.3){shakeX=(Math.random()-0.5)*shakeMag;shakeY=(Math.random()-0.5)*shakeMag;shakeMag*=0.74;}else{shakeX=0;shakeY=0;shakeMag=0;}}

// ── AUDIO ──
let AC=null;
function ga(){if(!AC)AC=new(window.AudioContext||window.webkitAudioContext)();return AC;}
function beep(f,d,t='square',v=0.1){try{const a=ga(),o=a.createOscillator(),g=a.createGain();o.connect(g);g.connect(a.destination);o.type=t;o.frequency.value=f;g.gain.setValueAtTime(v,a.currentTime);g.gain.exponentialRampToValueAtTime(0.001,a.currentTime+d);o.start();o.stop(a.currentTime+d);}catch(e){}}
const SFX={
  jump:()=>{beep(300,0.07,'square',0.09);setTimeout(()=>beep(500,0.06),50);},
  squat:()=>{beep(120,0.06,'sine',0.06);},
  shoot:()=>{beep(900,0.03,'square',0.1);},
  water:()=>{beep(500,0.05,'sine',0.09);setTimeout(()=>beep(700,0.04,'sine'),40);},
  steam:()=>{beep(250,0.14,'sawtooth',0.08);beep(350,0.1,'sawtooth',0.05);},
  hit:()=>{beep(80,0.18,'square',0.13);},
  collect:()=>{beep(800,0.04,'sine');setTimeout(()=>beep(1200,0.07,'sine'),50);},
  ohm:()=>{[300,500,800,1100,1500].forEach((f,i)=>setTimeout(()=>beep(f,0.1,'sine',0.1),i*50));},
  boss:()=>{beep(55,0.3,'sawtooth',0.17);},
  pickup:()=>{[400,700,1000].forEach((f,i)=>setTimeout(()=>beep(f,0.06,'sine',0.1),i*50));},
  wave:()=>{beep(180,0.1,'sawtooth',0.1);},
  ability:()=>{beep(600,0.05,'sine');setTimeout(()=>beep(900,0.05,'sine'),55);setTimeout(()=>beep(1400,0.09,'sine'),110);},
  noAmmo:()=>{beep(180,0.05,'square',0.06);},
  shipArrive:()=>{[200,400,700,1100,1600].forEach((f,i)=>setTimeout(()=>beep(f,0.14,'sine',0.12),i*80));},
  shipLaunch:()=>{for(let i=0;i<10;i++)setTimeout(()=>beep(200+i*120,0.1,'sine',0.1),i*55);},
  worldChange:()=>{[200,350,550,800].forEach((f,i)=>setTimeout(()=>beep(f,0.09,'sine',0.09),i*65));},
};

// ================================================================
//  🌍 WORLD DEFINITIONS
//  Add a new world: add a key here, add a drawBgXxx() in draw.js,
//  add quests in WORLD_QUESTS below, add a planet in PLANETS.
// ================================================================
const WORLDS={
  green:{
    name:'🌿 GREEN ZONE',
    sky:['#0a1a05','#122a0a','#1a3810'],
    gc:'#1a4a1a',glow:'#00ff41',
    grav:0.55,gAmp:90,gFreq:0.006,
    swim:false,float:false,lowGrav:false,defend:false,bossId:null,
    fog:null,tint:null,bgFn:'drawBgGreen',
  },
  sky:{
    name:'☁️ SKY WORLD',
    sky:['#5599dd','#88ccee','#aaddff'],
    gc:'#6688aa',glow:'#ffffff',
    grav:0.17,gAmp:40,gFreq:0.003,
    swim:false,float:true,lowGrav:false,defend:false,bossId:null,
    fog:'rgba(200,230,255,0.12)',tint:null,bgFn:'drawBgSky',
  },
  water:{
    name:'🌊 DEEP OCEAN',
    sky:['#001525','#002a44','#003a60'],
    gc:'#002244',glow:'#00aaff',
    grav:0.15,gAmp:35,gFreq:0.004,
    swim:true,float:false,lowGrav:false,defend:false,bossId:null,
    fog:'rgba(0,60,120,0.25)',tint:'rgba(0,80,180,0.07)',
    bgFn:'drawBgWater',waterGunBonus:true,
  },
  volcano:{
    name:'🌋 VOLCANO LAIR',
    sky:['#1a0000','#380800','#280a00'],
    gc:'#4a1000',glow:'#ff4400',
    grav:0.62,gAmp:110,gFreq:0.008,
    swim:false,float:false,lowGrav:false,defend:false,bossId:'ohmKing',
    fog:'rgba(255,60,0,0.07)',tint:'rgba(255,40,0,0.04)',bgFn:'drawBgVolcano',
  },
  space:{
    name:'🌌 DEEP SPACE',
    sky:['#000000','#000008','#020010'],
    gc:'#0a0025',glow:'#9b30ff',
    grav:0.12,gAmp:28,gFreq:0.002,
    swim:false,float:false,lowGrav:true,defend:false,bossId:'magnetMonster',
    fog:null,tint:null,bgFn:'drawBgSpace',
  },
  ai:{
    name:'🤖 AI CENTRE',
    sky:['#000800','#001200','#000a00'],
    gc:'#001800',glow:'#ff0000',
    grav:0.55,gAmp:20,gFreq:0.002,
    swim:false,float:false,lowGrav:false,defend:true,bossId:'aiCore',
    fog:'rgba(0,30,0,0.2)',tint:'rgba(255,0,0,0.03)',bgFn:'drawBgAI',
  },
};

// ================================================================
//  🪐 PLANET DEFINITIONS
//  Push a new object here to add a destination to the solar map.
//  orbit   : 0–1 fraction of map radius
//  angle   : radians, position on orbit ring
//  worldId : key in WORLDS{} that loads when selected
//  unlockedBy : array of worldIds that must be beaten first
// ================================================================
const PLANETS=[
  // ── INNER ──
  {id:'earth',   emoji:'🌍',name:'EARTH',    sub:'Home Planet',
   color:'#00aaff',glow:'#44ccff',diff:1,stars:'★☆☆☆',
   orbit:0.12,angle:0.6, worldId:'green',
   desc:'Rolling hills · Green Zone · Easy start',unlockedBy:[]},

  {id:'moon',    emoji:'🌙',name:'THE MOON', sub:"Earth's Satellite",
   color:'#aaaaaa',glow:'#dddddd',diff:1,stars:'★☆☆☆',
   orbit:0.17,angle:1.9, worldId:'sky',
   desc:'Low gravity · Cloud platforms · Bird territory',unlockedBy:[]},

  {id:'venus',   emoji:'🟠',name:'VENUS',   sub:'The Hot Twin',
   color:'#ffaa44',glow:'#ffcc88',diff:2,stars:'★★☆☆',
   orbit:0.24,angle:3.4, worldId:'volcano',
   desc:'Lava flows · OHM KING rules here',unlockedBy:['earth']},

  {id:'mercury', emoji:'⚫',name:'MERCURY', sub:'Closest to the Sun',
   color:'#888888',glow:'#bbbbbb',diff:2,stars:'★★☆☆',
   orbit:0.30,angle:5.1, worldId:'ai',
   desc:'AI stations · Extreme heat · Defend the core',unlockedBy:['earth']},

  // ── OUTER ──
  {id:'mars',    emoji:'🔴',name:'MARS',    sub:'The Red Planet',
   color:'#ff4422',glow:'#ff8866',diff:3,stars:'★★★☆',
   orbit:0.38,angle:0.9, worldId:'water',
   desc:'Ancient oceans · Underground rivers · Sharks!',unlockedBy:['venus','moon']},

  {id:'jupiter', emoji:'🟤',name:'JUPITER', sub:'King of Planets',
   color:'#cc8844',glow:'#ffaa66',diff:3,stars:'★★★☆',
   orbit:0.47,angle:2.2, worldId:'space',
   desc:'Zero-G · Magnet Monster · Asteroid rings',unlockedBy:['mars','mercury']},

  // ── DEEP SPACE ──
  {id:'saturn',  emoji:'🪐',name:'SATURN',  sub:'The Ringed Giant',
   color:'#ddbb88',glow:'#ffddaa',diff:4,stars:'★★★★',
   orbit:0.56,angle:4.0, worldId:'space',
   desc:'Beat MAGNET MONSTER to unlock',unlockedBy:['jupiter']},

  // ── ADD MORE BELOW ──
  // {id:'uranus',emoji:'🔵',name:'URANUS',orbit:0.65,angle:1.2,worldId:'ice',unlockedBy:['saturn'],...},
];

// ── Progress persistence ──
function getBeaten(){try{return JSON.parse(localStorage.getItem('ss_beaten')||'[]');}catch{return[];}}
function markBeaten(wid){const b=getBeaten();if(!b.includes(wid)){b.push(wid);localStorage.setItem('ss_beaten',JSON.stringify(b));}}
function isPlanetUnlocked(p){if(!p.unlockedBy||!p.unlockedBy.length)return true;const b=getBeaten();return p.unlockedBy.every(w=>b.includes(w));}

// ================================================================
//  🗺️  SOLAR MAP  — canvas-rendered, smooth, no DOM spam
// ================================================================
let smCanvas=null,smCtx=null,smAnim=null,smOpen=false;
let smHover=-1,smAngle=0;// smAngle slowly rotates the whole system

function openSolarMapFromIntro(){
  document.getElementById('introScreen').classList.add('hidden');
  openSolarMap();
}
function openSolarMap(){
  document.getElementById('tallyScreen').classList.add('hidden');
  smOpen=true;
  const el=document.getElementById('solarMap');
  el.classList.add('show');
  // Build canvas if not yet
  if(!smCanvas){
    smCanvas=document.getElementById('smCanvas');
    smCtx=smCanvas.getContext('2d');
  }
  resizeSolarCanvas();
  if(smAnim)cancelAnimationFrame(smAnim);
  renderSolarLoop();
}
function closeSolarMap(){
  smOpen=false;
  if(smAnim){cancelAnimationFrame(smAnim);smAnim=null;}
  document.getElementById('solarMap').classList.remove('show');
  if(!gameRunning)document.getElementById('introScreen').classList.remove('hidden');
}
function resizeSolarCanvas(){
  if(!smCanvas)return;
  smCanvas.width=smCanvas.offsetWidth||window.innerWidth;
  smCanvas.height=smCanvas.offsetHeight||window.innerHeight;
  // Wire up mouse/touch once
  if(!smCanvas._evts){
    smCanvas._evts=true;
    smCanvas.addEventListener('mousemove',smMouseMove);
    smCanvas.addEventListener('click',smClick);
    smCanvas.addEventListener('touchstart',smTouch,{passive:true});
  }
}
window.addEventListener('resize',()=>{if(smOpen)resizeSolarCanvas();});

function smCX(){return smCanvas.width/2;}
function smCY(){return smCanvas.height/2;}
function smRadius(){return Math.min(smCanvas.width,smCanvas.height)*0.44;}

function smPlanetXY(p,extraAngle=0){
  const r=p.orbit*smRadius();
  const a=p.angle+smAngle+extraAngle;
  return{x:smCX()+Math.cos(a)*r, y:smCY()+Math.sin(a)*r, r};
}

function smMouseMove(e){
  const rect=smCanvas.getBoundingClientRect();
  const mx=e.clientX-rect.left, my=e.clientY-rect.top;
  smHover=smHitTest(mx,my);
  smCanvas.style.cursor=smHover>=0?'pointer':'default';
}
function smClick(e){
  const rect=smCanvas.getBoundingClientRect();
  smSelectAt(e.clientX-rect.left,e.clientY-rect.top);
}
function smTouch(e){
  const rect=smCanvas.getBoundingClientRect();
  const t=e.touches[0];
  smSelectAt(t.clientX-rect.left,t.clientY-rect.top);
}
function smHitTest(mx,my){
  for(let i=0;i<PLANETS.length;i++){
    const {x,y}=smPlanetXY(PLANETS[i]);
    const dx=mx-x,dy=my-y;
    if(dx*dx+dy*dy<900)return i;// 30px radius
  }
  return-1;
}
function smSelectAt(mx,my){
  const i=smHitTest(mx,my);
  if(i<0)return;
  const p=PLANETS[i];
  if(!isPlanetUnlocked(p)){SFX.hit();return;}
  closeSolarMap();
  document.getElementById('tallyScreen').classList.add('hidden');
  if(p.worldId)startWarpTo(p);
  else alert(`🚀 ${p.name} — Coming Soon!`);
}

function renderSolarLoop(){
  if(!smOpen)return;
  smAngle+=0.0008;// slow rotation
  drawSolarMap();
  smAnim=requestAnimationFrame(renderSolarLoop);
}

function drawSolarMap(){
  const c=smCtx,W=smCanvas.width,H=smCanvas.height;
  const cx=smCX(),cy=smCY(),maxR=smRadius();
  const beaten=getBeaten();
  const t=Date.now();

  // Background — deep space gradient
  const bg=c.createRadialGradient(cx,cy,0,cx,cy,maxR*1.4);
  bg.addColorStop(0,'#03001a');bg.addColorStop(1,'#000');
  c.fillStyle=bg;c.fillRect(0,0,W,H);

  // Starfield (static seed-based so no flicker)
  if(!drawSolarMap._stars){
    drawSolarMap._stars=Array.from({length:180},(_,i)=>({
      x:(Math.sin(i*137.5)*0.5+0.5)*W,
      y:(Math.cos(i*97.3)*0.5+0.5)*H,
      r:Math.random()*1.2+0.3,
      b:Math.random()
    }));
  }
  drawSolarMap._stars.forEach(s=>{
    const tw=0.5+0.5*Math.sin(t*0.001+s.b*10);
    c.globalAlpha=0.3+0.5*tw;
    c.fillStyle='#fff';
    c.beginPath();c.arc(s.x,s.y,s.r,0,Math.PI*2);c.fill();
  });
  c.globalAlpha=1;

  // Orbit rings
  PLANETS.forEach(p=>{
    const r=p.orbit*maxR;
    c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);
    c.strokeStyle='rgba(255,255,255,0.06)';c.lineWidth=1;c.stroke();
  });

  // Sun
  const sunPulse=1+0.04*Math.sin(t*0.002);
  const sunR=maxR*0.055*sunPulse;
  const sunGrd=c.createRadialGradient(cx,cy,0,cx,cy,sunR*3);
  sunGrd.addColorStop(0,'#fff8e0');sunGrd.addColorStop(0.3,'#ffcc00');
  sunGrd.addColorStop(0.7,'#ff6600');sunGrd.addColorStop(1,'rgba(255,80,0,0)');
  c.fillStyle=sunGrd;c.beginPath();c.arc(cx,cy,sunR*3,0,Math.PI*2);c.fill();
  c.fillStyle='#fff9e8';c.beginPath();c.arc(cx,cy,sunR,0,Math.PI*2);c.fill();
  // Sun label
  c.fillStyle='rgba(255,200,80,0.7)';c.font='bold 11px Courier New';
  c.textAlign='center';c.fillText('☀️',cx,cy+4);

  // Planets
  PLANETS.forEach((p,i)=>{
    const {x,y}=smPlanetXY(p);
    const unlocked=isPlanetUnlocked(p);
    const done=beaten.includes(p.worldId);
    const hover=smHover===i;
    const pulse=1+0.06*Math.sin(t*0.003+i);

    // Glow halo
    if(unlocked){
      const halo=c.createRadialGradient(x,y,0,x,y,28*pulse);
      halo.addColorStop(0,p.glow+'55');halo.addColorStop(1,'transparent');
      c.fillStyle=halo;c.beginPath();c.arc(x,y,28*pulse,0,Math.PI*2);c.fill();
    }

    // Planet circle
    const pr=hover?14:11;
    const pg=c.createRadialGradient(x-pr*0.3,y-pr*0.3,1,x,y,pr*1.5);
    pg.addColorStop(0,unlocked?p.glow:'#333');
    pg.addColorStop(1,unlocked?p.color+'88':'#111');
    c.fillStyle=pg;
    c.beginPath();c.arc(x,y,pr*pulse,0,Math.PI*2);c.fill();

    if(!unlocked){
      c.fillStyle='rgba(0,0,0,0.6)';
      c.beginPath();c.arc(x,y,pr*pulse,0,Math.PI*2);c.fill();
    }

    // Emoji
    c.font=`${hover?16:13}px serif`;c.textAlign='center';c.textBaseline='middle';
    c.globalAlpha=unlocked?1:0.3;
    c.fillText(p.emoji,x,y);
    c.globalAlpha=1;

    // Done checkmark
    if(done){
      c.fillStyle='#00ff41';c.font='bold 10px Courier New';
      c.textAlign='center';c.fillText('✓',x+12,y-10);
    }
    // Lock icon
    if(!unlocked){
      c.fillStyle='#555';c.font='10px serif';
      c.fillText('🔒',x+10,y-10);
    }

    // Label — shown always, highlighted on hover
    const labelY=y+22;
    c.font=`bold ${hover?11:9}px Courier New`;
    c.textAlign='center';c.textBaseline='top';
    c.fillStyle=unlocked?(hover?p.glow:'rgba(255,255,255,0.7)'):'rgba(255,255,255,0.2)';
    c.fillText(p.name,x,labelY);

    // Stars
    c.font='7px Courier New';
    c.fillStyle=unlocked?p.glow+'aa':'#333';
    c.fillText(p.stars,x,labelY+12);

    // Hover info box
    if(hover&&unlocked){
      const bx=x+18,by=y-48;
      const bw=130,bh=44;
      // Keep box on screen
      const fx=Math.min(Math.max(bx,4),W-bw-4);
      const fy=Math.max(by,4);
      c.fillStyle='rgba(0,0,0,0.88)';
      c.strokeStyle=p.glow;c.lineWidth=1.5;
      c.beginPath();c.roundRect(fx,fy,bw,bh,6);c.fill();c.stroke();
      c.fillStyle=p.glow;c.font='bold 9px Courier New';c.textAlign='left';c.textBaseline='top';
      c.fillText(p.sub,fx+7,fy+6);
      c.fillStyle='#aaa';c.font='8px Courier New';
      c.fillText(p.desc,fx+7,fy+20,bw-14);
      if(!unlocked){c.fillStyle='#ff4444';c.fillText('LOCKED',fx+7,fy+33);}
    }
  });

  // Title
  c.fillStyle='rgba(255,255,255,0.85)';c.font='bold 14px Courier New';
  c.textAlign='center';c.textBaseline='top';
  c.fillText('🌌  SOLAR SYSTEM  🌌',cx,12);
  c.fillStyle='rgba(80,80,100,0.9)';c.font='9px Courier New';
  c.fillText('SELECT DESTINATION  ·  LOCKED PLANETS REQUIRE PREREQUISITES',cx,30);

  // Close hint
  c.fillStyle='rgba(60,60,80,0.9)';c.font='9px Courier New';c.textBaseline='bottom';
  c.fillText('[ ESC or ✕ to close ]',cx,H-8);
}

// ── ESC closes solar map ──
document.addEventListener('keydown',e=>{
  if(e.code==='Escape'&&smOpen)closeSolarMap();
});

// ================================================================
//  🚀 WARP CINEMATIC
// ================================================================
let warpAnim=null,warpPhase=0,warpTarget=null;
let WC,WX,CC,CX;

function initWarpCanvases(){
  WC=document.getElementById('warpCanvas');
  if(WC&&!WX)WX=WC.getContext('2d');
  CC=document.getElementById('cockpitStars');
  if(CC&&!CX)CX=CC.getContext('2d');
  if(WC){WC.width=window.innerWidth;WC.height=window.innerHeight;}
  if(CC&&CC.parentElement){CC.width=CC.parentElement.offsetWidth||400;CC.height=CC.parentElement.offsetHeight||260;}
}
window.addEventListener('resize',initWarpCanvases);

const wStars=Array.from({length:220},()=>({
  angle:Math.random()*Math.PI*2,dist:Math.random()*0.8+0.1,speed:0,len:0,alpha:0
}));

function startWarpTo(planet){
  initWarpCanvases();
  warpTarget=planet;warpPhase=0;
  const ws=document.getElementById('warpScreen');
  ws.classList.add('show');
  document.getElementById('cockpitView').classList.remove('show');
  document.getElementById('planetCutscene').classList.remove('show');
  document.getElementById('cockpitChar').textContent=typeof P!=='undefined'?P?.head||'🎃':'🎃';
  document.getElementById('destLabel').textContent=planet.name;
  document.getElementById('cutscenePlanet').textContent=planet.emoji;
  document.getElementById('cutscenePlanet').style.setProperty('--pglow',planet.glow);
  document.getElementById('cutsceneName').textContent=planet.name;
  document.getElementById('cutsceneName').style.color=planet.glow;
  document.getElementById('cutsceneDesc').textContent=planet.desc;
  const diff=document.getElementById('cutsceneDiff');
  diff.textContent=planet.stars;diff.style.borderColor=planet.glow;diff.style.color=planet.glow;
  SFX.shipLaunch&&SFX.shipLaunch();
  if(warpAnim)cancelAnimationFrame(warpAnim);
  animWarp();
}

function animWarp(){
  if(!WX){warpAnim=requestAnimationFrame(animWarp);return;}
  const W2=WC.width,H2=WC.height,cx=W2/2,cy=H2/2;
  warpPhase++;
  WX.clearRect(0,0,W2,H2);
  if(warpPhase<=160){
    WX.fillStyle='#000';WX.fillRect(0,0,W2,H2);
    const progress=Math.min(1,warpPhase/80);
    const grd=WX.createRadialGradient(cx,cy,0,cx,cy,Math.min(W2,H2)*0.5);
    grd.addColorStop(0,`rgba(100,160,255,${0.12*progress})`);
    grd.addColorStop(0.5,`rgba(50,80,200,${0.08*progress})`);
    grd.addColorStop(1,'transparent');
    WX.fillStyle=grd;WX.fillRect(0,0,W2,H2);
    wStars.forEach(s=>{
      s.speed=Math.min(0.08,s.speed+0.0005*progress+0.001);
      s.dist=Math.max(0.01,s.dist-s.speed);
      s.len=Math.min(0.25,s.speed*8);
      s.alpha=Math.min(1,progress*1.5);
      if(s.dist<0.02){s.dist=0.6+Math.random()*0.35;s.speed=0;s.len=0;}
      const R=Math.min(W2,H2)*0.55;
      const sx=cx+Math.cos(s.angle)*s.dist*R,sy=cy+Math.sin(s.angle)*s.dist*R;
      const ex=cx+Math.cos(s.angle)*(s.dist+s.len)*R,ey=cy+Math.sin(s.angle)*(s.dist+s.len)*R;
      WX.globalAlpha=s.alpha*(1-s.dist);
      WX.strokeStyle=`hsl(${200+s.angle*30},80%,80%)`;
      WX.lineWidth=1+s.speed*8;
      WX.beginPath();WX.moveTo(sx,sy);WX.lineTo(ex,ey);WX.stroke();
    });
    WX.globalAlpha=1;
    if(warpPhase===80){document.getElementById('cockpitView').classList.add('show');animCockpitStars();}
  }else if(warpPhase<=260){
    WX.fillStyle=`rgba(0,0,0,${Math.min(1,(warpPhase-160)/60)})`;WX.fillRect(0,0,W2,H2);
    if(warpPhase===161){
      document.getElementById('cockpitView').classList.remove('show');
      document.getElementById('planetCutscene').classList.add('show');
    }
  }else{
    WX.fillStyle='rgba(0,0,0,0.06)';WX.fillRect(0,0,W2,H2);
    if(warpPhase>300){
      document.getElementById('warpScreen').classList.remove('show');
      document.getElementById('cockpitView').classList.remove('show');
      document.getElementById('planetCutscene').classList.remove('show');
      if(warpTarget&&warpTarget.worldId)startGame(warpTarget.worldId);
      warpTarget=null;return;
    }
  }
  warpAnim=requestAnimationFrame(animWarp);
}

function animCockpitStars(){
  if(!CX)return;
  const cw=CC.width,ch=CC.height;
  CX.fillStyle='rgba(0,5,20,0.18)';CX.fillRect(0,0,cw,ch);
  for(let i=0;i<3;i++){
    CX.fillStyle=`rgba(${180+Math.random()*75},${180+Math.random()*75},255,${0.4+Math.random()*0.6})`;
    CX.beginPath();CX.arc(Math.random()*cw,Math.random()*ch,Math.random()*1.5,0,Math.PI*2);CX.fill();
  }
  if(document.getElementById('cockpitView').classList.contains('show'))
    requestAnimationFrame(animCockpitStars);
}

// ================================================================
//  ⚡ OHM QUEST SYSTEM — "THINGS TO FIX"
//  Add a new world's quests: add a key to WORLD_QUESTS below.
//  Each quest runs check(stats) every frame. Sequential order.
// ================================================================
const WORLD_QUESTS={

  green:[
    {id:'gq1',icon:'⚡',title:'Ground the Circuit',
     hint:'V=IR · Kill 5 enemies (discharge the nodes)',
     check:s=>s.enemiesDefeated>=5, reward:'OHM power',ohm:'V=IR ✓'},
    {id:'gq2',icon:'🔋',title:'Charge the Battery',
     hint:'Collect 8 power-ups (⚡ collectibles)',
     check:s=>s.collsGrabbed>=8, reward:'+1 Max Jump',ohm:'Q=CV ✓'},
    {id:'gq3',icon:'💡',title:'Close the Loop',
     hint:'Reach score 300 (current flows!)',
     check:s=>s.score>=300, reward:'Ship appears early!',ohm:'P=VI ✓'},
  ],

  sky:[
    {id:'sq1',icon:'🌩️',title:'Discharge Storm Clouds',
     hint:'Kill 6 sky enemies (release static charge)',
     check:s=>s.enemiesDefeated>=6, reward:'OHM power',ohm:'E=Q/C ✓'},
    {id:'sq2',icon:'📡',title:'Fix the Antenna',
     hint:'Jump 10 times (signal strength!)',
     check:s=>s.jumpCount>=10, reward:'Double jump boost',ohm:'f=1/T ✓'},
    {id:'sq3',icon:'⚙️',title:'Regulate the Voltage',
     hint:'Score 400 without dying (stable output)',
     check:s=>s.score>=400&&s.deathsThisRun===0, reward:'Full HP restore',ohm:'Vout=Vin·R2/(R1+R2) ✓'},
  ],

  water:[
    {id:'wq1',icon:'🌊',title:'Fix Saltwater Corrosion',
     hint:'Defeat 5 ocean enemies (electrolysis reversed!)',
     check:s=>s.enemiesDefeated>=5, reward:'Water gun ammo x2',ohm:'σ=nqμ ✓'},
    {id:'wq2',icon:'🔵',title:'Cool the Overloaded Cable',
     hint:'Use water gun 10 times (thermal management!)',
     check:s=>s.waterShotsFired>=10, reward:'Steam mode unlocked',ohm:'P=I²R ✓'},
    {id:'wq3',icon:'🧲',title:'Align the Magnetic Field',
     hint:'Collect 6 power-ups (flux alignment)',
     check:s=>s.collsGrabbed>=6, reward:'OHM power',ohm:'Φ=BA ✓'},
  ],

  volcano:[
    {id:'vq1',icon:'🌋',title:'Quench the Short Circuit',
     hint:'Defeat 8 volcano enemies (current spike tamed!)',
     check:s=>s.enemiesDefeated>=8, reward:'+50 score',ohm:'R=ρL/A ✓'},
    {id:'vq2',icon:'🔥',title:'Replace the Fuse',
     hint:'Survive 90 seconds without dying',
     check:s=>s.timeAlive>=90, reward:'OHM KING -20HP',ohm:'Ifuse=P/V ✓'},
    {id:'vq3',icon:'⚡',title:'Defeat OHM KING',
     hint:'Beat the boss (main circuit restored!)',
     check:s=>s.bossesKilled>=1, reward:'Ship unlocked!',ohm:'V=IR · KING=0 ✓'},
  ],

  space:[
    {id:'spq1',icon:'🛸',title:'Repair Zero-G Wiring',
     hint:'Collect 5 power-ups (capacitors recharged)',
     check:s=>s.collsGrabbed>=5, reward:'Gravity reduced',ohm:'Xc=1/2πfC ✓'},
    {id:'spq2',icon:'🧲',title:'Demagnetise the Hull',
     hint:'Defeat 6 space enemies (field neutralised)',
     check:s=>s.enemiesDefeated>=6, reward:'Magnet gun ammo',ohm:'F=qv×B ✓'},
    {id:'spq3',icon:'🔌',title:'Defeat MAGNET MONSTER',
     hint:'Kill the boss (magnetic monopole destroyed!)',
     check:s=>s.bossesKilled>=1, reward:'Saturn UNLOCKED 🪐',ohm:'∇·B=0 · SOLVED ✓'},
  ],

  ai:[
    {id:'aq1',icon:'🤖',title:'Patch the Power Grid',
     hint:'Destroy 10 AI minions (rogue current cut)',
     check:s=>s.enemiesDefeated>=10, reward:'Core HP +20%',ohm:'I=ΔQ/Δt ✓'},
    {id:'aq2',icon:'💻',title:'Reboot the Transformer',
     hint:'Survive 3 AI waves (voltage stepped down)',
     check:s=>s.aiWaves>=3, reward:'OHM shield',ohm:'Ns/Np=Vs/Vp ✓'},
    {id:'aq3',icon:'📡',title:'Kill the Feedback Loop',
     hint:'Keep core above 60% HP (gain < 1)',
     check:s=>s.aiCoreHp>=60, reward:'AI CORE vulnerable!',ohm:'A=−Rf/Rin ✓'},
  ],
};

// ── Quest runtime ──
let activeQuests=[],questStats={};

function initQuests(worldId){
  const defs=WORLD_QUESTS[worldId];
  if(!defs){activeQuests=[];renderQuestPanel();return;}
  activeQuests=defs.map(q=>({...q,done:false}));
  questStats={enemiesDefeated:0,collsGrabbed:0,score:0,jumpCount:0,
    deathsThisRun:0,bossesKilled:0,waterShotsFired:0,timeAlive:0,aiWaves:0,aiCoreHp:100};
  document.getElementById('questPanel').style.display='';
  renderQuestPanel();
}

function renderQuestPanel(){
  const list=document.getElementById('questList');if(!list)return;
  list.innerHTML='';
  activeQuests.forEach((q,i)=>{
    const prev=i===0||activeQuests[i-1].done;
    const active=!q.done&&prev;
    const div=document.createElement('div');
    div.className='qitem'+(q.done?' done':active?' active':'');
    div.innerHTML=`<span class="qi">${q.icon}</span>
      <span class="qtext">${q.title}
        <span class="qhint">${q.done?'✓ '+q.ohm:q.hint}</span>
      </span>`;
    list.appendChild(div);
  });
  const done=activeQuests.filter(q=>q.done).length,total=activeQuests.length;
  document.getElementById('qDone').textContent=done;
  document.getElementById('qTotal').textContent=total;
  document.getElementById('qFill').style.width=(total?done/total*100:0)+'%';
}

function updateQuests(){
  if(!activeQuests.length)return;
  questStats.enemiesDefeated=enemiesDefeated;
  questStats.collsGrabbed=collsGrabbed;
  questStats.score=score;
  questStats.bossesKilled=window._bk||0;
  questStats.aiWaves=aiWaves;
  questStats.aiCoreHp=aiCoreHp;
  questStats.timeAlive=(questStats.timeAlive||0)+1/60;
  let changed=false;
  activeQuests.forEach((q,i)=>{
    if(q.done)return;
    if(i>0&&!activeQuests[i-1].done)return;
    if(q.check(questStats)){q.done=true;changed=true;questComplete(q);}
  });
  if(changed)renderQuestPanel();
}

function questComplete(q){
  const fl=document.getElementById('questFlash');
  fl.classList.add('pop');setTimeout(()=>fl.classList.remove('pop'),350);
  spawnOhmFloat(q.ohm);
  SFX.ohm&&SFX.ohm();shake(6);
  applyQuestReward(q);
  showFloat(`⚡ FIXED: ${q.title}`,P.x+P.w/2,P.y-50,'#ffff00');
}

function applyQuestReward(q){
  const r=q.reward||'';
  if(r.includes('OHM power')){P.ohmActive=1;P.ohmTimer=480;}
  if(r.includes('Full HP')){P.hp=P.maxHp;}
  if(r.includes('+1 Max Jump')){P.maxJumps=Math.min(3,P.maxJumps+1);}
  if(r.includes('weakened')&&boss){boss.hp=Math.max(1,boss.hp-20);}
  if(r.includes('Ship unlocked')||r.includes('appears early')){if(!shipVisible&&!stageComplete)placeShip();}
  if(r.includes('UNLOCKED'))markBeaten('space');
  if(r.includes('vulnerable')&&boss)boss.inv=false;
  score+=50;
}

function spawnOhmFloat(txt){
  const el=document.createElement('div');
  el.className='ohm-float';el.textContent=txt;
  el.style.left=Math.random()*60+20+'%';
  el.style.top=Math.random()*30+30+'%';
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),2600);
}

function onJump(){questStats.jumpCount=(questStats.jumpCount||0)+1;}
function onWaterShot(){questStats.waterShotsFired=(questStats.waterShotsFired||0)+1;}
function onPlayerDeath(){questStats.deathsThisRun=(questStats.deathsThisRun||0)+1;}
