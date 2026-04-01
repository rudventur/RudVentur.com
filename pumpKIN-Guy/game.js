// ================================================================
//  SPLASH SPLASH — game.js
//  Game init, world loading, main loop, leaderboard
// ================================================================
const CV = document.querySelector('canvas');
const ctx = CV.getContext('2d');
let W = CV.width = window.innerWidth;
let H = CV.height = window.innerHeight;

// Canvas resize handler (prevents distortion on mobile/resize)
window.addEventListener('resize', () => {
  W = CV.width = window.innerWidth;
  H = CV.height = window.innerHeight;
});

// Mobile/touch perf: Prevent zoom/scroll
document.addEventListener('touchstart', e => { e.preventDefault(); }, { passive: false });
document.addEventListener('touchmove', e => { e.preventDefault(); }, { passive: false });
document.addEventListener('gesturestart', e => { e.preventDefault(); });
// ── LEADERBOARD ──
function getScores(){try{return JSON.parse(localStorage.getItem('ss4')||'[]');}catch{return[];}}
function saveScore(s){const sc=getScores();sc.push({score:s,world:currentWorld,date:new Date().toLocaleDateString()});sc.sort((a,b)=>b.score-a.score);localStorage.setItem('ss4',JSON.stringify(sc.slice(0,10)));}
function showLB(){const sc=getScores();alert('🏆 TOP SCORES:\n\n'+(sc.length?sc.map((s,i)=>`${i+1}. ${s.score} pts – ${s.world} (${s.date})`).join('\n'):'No scores yet! Play first 🎃'));}

// ── GAME INIT ──
function initWorld(wid){
  currentWorld=wid;
  platforms=[];collectibles=[];gunPickups=[];enemies=[];friendlies=[];
  bullets=[];particles=[];waveProj=[];floatTexts=[];sciFs=[];
  lavaBlobs=[];asteroids=[];bubbles=[];bgClouds=[];
  lastGenX=0;lastCollX=0;lastEnemyX=600;lastGunX=400;
  camX=0;camY=0;score=0;lives=3;gameOver=false;stageComplete=false;
  bossActive=false;boss=null;aiWaves=0;aiCoreHp=100;
  legPhase=0;fireCd=0;sciT_=0;
  phaseT=0;dashT=0;shellT=0;shieldT=0;squatting=false;
  shipVisible=false;shipBoarding=false;shipTimer=0;
  enemiesDefeated=0;collsGrabbed=0;window._bk=0;
  inventory=[{...GDEFS.pistol,ammo:Infinity,id:'pistol'},null,null,null];
  activeSlot=0;
  P={x:180,y:H*0.4,vx:0,vy:0,w:44,h:70,onGround:false,jumps:0,maxJumps:2,
    facing:1,walking:false,head:P?.head||'🎃',hp:3,maxHp:3,
    invincible:60,waveCd:0,abilityCd:0,ohmActive:0,ohmTimer:0,flying:false,flyTimer:30,dead:false};
  platforms.push({x:80,y:H*0.62,w:360,h:22,type:'solid',pulse:0,claimed:false});
  genPlats(0);spawnColls(0);spawnGuns(0);
  // AI world setup
  document.getElementById('aiHud').style.display=WORLDS[wid].defend?'':'none';
  if(WORLDS[wid].defend)spawnBoss('aiCore');
  else if(WORLDS[wid].bossId)setTimeout(()=>spawnBoss(WORLDS[wid].bossId),2500);
  // World title flash
  const wt=document.getElementById('wTitle');
  wt.textContent=WORLDS[wid].name;wt.style.color=WORLDS[wid].glow;wt.style.opacity='1';
  setTimeout(()=>wt.style.opacity='0',2500);
  SFX.worldChange();updateGunHUD();
  initQuests(wid);// ⚡ start Ohm missions!
}

function startGame(wid){
  document.getElementById('introScreen').classList.add('hidden');
  ['hud','prog','gunHud','abilityBar','headPicker','mob'].forEach(id=>document.getElementById(id).style.display='');
  initWorld(wid);gameRunning=true;
}
function goIntro(){
  gameRunning=false;paused=false;bossActive=false;boss=null;stageComplete=false;
  if(warpAnim){cancelAnimationFrame(warpAnim);warpAnim=null;}
  document.getElementById('pauseOv').classList.add('hidden');
  document.getElementById('tallyScreen').classList.add('hidden');
  document.getElementById('solarMap').classList.remove('show');
  document.getElementById('warpScreen').classList.remove('show');
  document.getElementById('cockpitView').classList.remove('show');
  document.getElementById('planetCutscene').classList.remove('show');
  document.getElementById('introScreen').classList.remove('hidden');
  ['hud','prog','gunHud','abilityBar','headPicker','mob','bossBar','aiHud','questPanel'].forEach(id=>document.getElementById(id).style.display='none');
}
function togglePause(){if(!gameRunning)return;paused=!paused;document.getElementById('pauseOv').classList.toggle('hidden',!paused);}
function ph(el){document.querySelectorAll('.hopt').forEach(e=>e.classList.remove('sel'));el.classList.add('sel');P.head=el.dataset.e;burst(P.x+P.w/2,P.y+P.h/2,'#e879f9',12);updateGunHUD();}

window.addEventListener('keydown',e=>{
  if(gameOver&&(e.code==='ArrowUp'||e.code==='Space')){initWorld(currentWorld);gameOver=false;}
  if(gameOver&&e.code==='Escape')goIntro();
});
CV.addEventListener('touchstart',()=>{if(gameOver){initWorld(currentWorld);gameOver=false;}},{passive:true});

// ── MAIN LOOP ──
function loop(){
  ctx.clearRect(0,0,W,H);
  if(gameRunning||gameOver){
    ctx.save();ctx.translate(shakeX,shakeY);
    drawBG();
    ctx.save();ctx.translate(-camX,-camY);
    drawGround();drawPlatforms();
    drawGunPickups();drawColls();drawShip();
    drawWaves();drawBullets();drawEnemies();drawFriendlies();
    drawBoss();drawParticles();
    drawChar();drawFloats();
    ctx.restore();
    ctx.restore();
    update();if(gameOver)drawGameOver();
  }
  requestAnimationFrame(loop);
}
loop();
