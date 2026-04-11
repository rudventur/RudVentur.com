// ================================================================
//  SPLASH SPLASH — engine.js
//  Physics, input, player, enemies, bullets, camera, update loop
// ================================================================
// ── GUN DEFS ──
const GDEFS={
  pistol:{name:'PISTOL',icon:'🔫',bEmoji:'·',bColor:'#ff6644',cd:15,dmg:1,spd:15,spread:0,count:1,maxAmmo:Infinity,props:{}},
  water:{name:'WATER GUN',icon:'💧',bEmoji:'💧',bColor:'#00aaff',cd:14,dmg:1,spd:13,spread:0.08,count:2,maxAmmo:60,props:{isWater:true}},
  chem:{name:'CHEM',icon:'🧪',bEmoji:'🟢',bColor:'#00ff88',cd:35,dmg:2,spd:9,spread:0.18,count:3,maxAmmo:24,props:{toxic:true}},
  magnet:{name:'MAGNET',icon:'🧲',bEmoji:'🟣',bColor:'#aa44ff',cd:44,dmg:1,spd:8,spread:0,count:1,maxAmmo:18,props:{magnetic:true}},
  spawner:{name:'SPAWNER',icon:'🥚',bEmoji:'🥚',bColor:'#ffaa00',cd:80,dmg:0,spd:7,spread:0,count:1,maxAmmo:8,props:{spawner:true}},
  rocket:{name:'ROCKET',icon:'🚀',bEmoji:'🚀',bColor:'#ff6600',cd:60,dmg:5,spd:10,spread:0,count:1,maxAmmo:6,props:{explosive:true}},
  lightning:{name:'ZAPPER',icon:'⚡',bEmoji:'⚡',bColor:'#ffff00',cd:20,dmg:3,spd:20,spread:0.07,count:2,maxAmmo:22,props:{chain:true}},
};

// ── STATE ──
let gameRunning=false,paused=false,gameOver=false,stageComplete=false;
let camX=0,camY=0,score=0,lives=3,currentWorld='green';
let platforms=[],collectibles=[],gunPickups=[],enemies=[],friendlies=[];
let bullets=[],particles=[],waveProj=[],floatTexts=[];
let lastGenX=0,lastCollX=0,lastEnemyX=0,lastGunX=0;
let boss=null,bossActive=false;
let aiWaves=0,aiCoreHp=100;
let legPhase=0,fireCd=0;
let shipX=0,shipY=0,shipVisible=false,shipBoarding=false,shipTimer=0;
let enemiesDefeated=0,collsGrabbed=0;
let inventory=[{...GDEFS.pistol,ammo:Infinity,id:'pistol'},null,null,null];
let activeSlot=0;
// ability states
let phaseT=0,dashT=0,shellT=0,shieldT=0,squatting=false;
// world FX
let lavaBlobs=[],asteroids=[],bubbles=[],bgClouds=[];

// bg stars
const STARS=Array.from({length:160},()=>({
  x:Math.random(),y:Math.random()*0.9,sz:0.5+Math.random()*2.3,
  tw:Math.random()*Math.PI*2,sp:0.04+Math.random()*0.5,
  col:'#ffffff'
}));
const SCI=['V=IR','E=mc²','F=ma','P=VI','λ=h/p','PV=nRT','F=qvB'];
let sciFs=[],sciT_=0;

// ── PLAYER ──
let P={x:200,y:200,vx:0,vy:0,w:44,h:70,
  onGround:false,jumps:0,maxJumps:2,facing:1,walking:false,
  head:'🎃',hp:3,maxHp:3,invincible:0,
  waveCd:0,abilityCd:0,ohmActive:0,ohmTimer:0,
  flying:false,flyTimer:30,dead:false};

const HEAD_AB={
  '🐦':{name:'FLY',cd:1},'🐢':{name:'SHELL',cd:90},'🦊':{name:'DASH',cd:70},
  '💀':{name:'PHASE',cd:120},'🤡':{name:'HONK',cd:80},':@]':{name:'SPIN',cd:75},
  ':@D':{name:'LAUGH',cd:100},'😈':{name:'DARK',cd:85},'🎃':{name:'BOMB',cd:90},
  '👾':{name:'8-WAY',cd:80},'🤖':{name:'SHIELD',cd:110},
};

// ── INPUT ──
const K={},MB={};
window.addEventListener('keydown',e=>{
  K[e.code]=true;
  if(!gameRunning)return;
  if(e.code==='Escape'){togglePause();return;}
  if(e.code==='ArrowUp'&&!K._j){K._j=true;doJump();}
  if(e.code==='KeyX')doAbility();
  if(e.code==='KeyC')doWave();
  if(e.code==='Digit1')switchGun(0);if(e.code==='Digit2')switchGun(1);
  if(e.code==='Digit3')switchGun(2);if(e.code==='Digit4')switchGun(3);
  if(e.code==='KeyQ')cycleGun();
  e.preventDefault();
});
window.addEventListener('keyup',e=>{K[e.code]=false;if(e.code==='ArrowUp')K._j=false;});
function mbs(d){MB[d]=true;if(d==='u')doJump();}
function mbe(d){MB[d]=false;}

// ── JUMP ──
function doJump(){
  if(P.dead||paused||stageComplete)return;
  onJump();// ⚡ quest hook
  const wd=WORLDS[currentWorld];
  if(P.head==='🐦'&&wd.float){P.vy=-5;P.flyTimer=30;P.flying=true;SFX.jump();return;}
  if(wd.swim){P.vy=-6;SFX.jump();burst(P.x+P.w/2,P.y,'#00aaff',5);return;}
  if(P.jumps<P.maxJumps){
    P.vy=-13*(P.jumps===1?0.82:1)*(wd.lowGrav?0.6:1);
    P.jumps++;P.onGround=false;SFX.jump();
    burst(P.x+P.w/2,P.y+P.h,P.ohmActive?'#ffff00':'#00ff41',7);
  }
}

// ── WAVE ──
function doWave(){
  if(P.waveCd>0||P.dead||paused)return;
  P.waveCd=55;SFX.wave();
  waveProj.push({x:P.x+P.w/2,y:P.y+P.h/2,vx:P.facing*13,vy:0,life:45,
    color:P.ohmActive?'#ffff00':'#00ff41',dmg:P.ohmActive?3:1});
  burst(P.x+P.w/2,P.y+P.h/2,'#00ff41',5);
}

// ── ABILITY ──
function doAbility(){
  if(P.abilityCd>0||P.dead||paused)return;
  const ab=HEAD_AB[P.head];if(!ab)return;
  P.abilityCd=ab.cd;SFX.ability();
  switch(P.head){
    case '🐢':shellT=40;burst(P.x+P.w/2,P.y+P.h/2,'#88ff00',12);break;
    case '🦊':dashT=22;P.vx=P.facing*18;break;
    case '💀':phaseT=80;break;
    case '🤡':case ':@]':
      [-1,1].forEach(d=>waveProj.push({x:P.x+P.w/2,y:P.y+P.h/2,vx:d*14,vy:0,life:35,color:'#ff44ff',dmg:2}));
      burst(P.x+P.w/2,P.y+P.h/2,'#ff44ff',15);break;
    case ':@D':enemies.forEach(e=>e.stunned=(e.stunned||0)+90);burst(P.x+P.w/2,P.y+P.h/2,'#ffff00',22);break;
    case '🎃':for(let i=0;i<8;i++){const a=(i/8)*Math.PI*2;mkBullet(P.x+P.w/2,P.y+P.h/2,Math.cos(a)*9,Math.sin(a)*9,'🎃','#ff8800',2,{});}shake(8);break;
    case '👾':for(let i=0;i<8;i++){const a=(i/8)*Math.PI*2;mkBullet(P.x+P.w/2,P.y+P.h/2,Math.cos(a)*12,Math.sin(a)*12,'⬛','#00ffff',2,{});}break;
    case '🤖':shieldT=150;break;
  }
  showFloat(`✨ ${ab.name}!`,P.x+P.w/2,P.y-28,'#e879f9');
}

// ── FIRE GUN ──
function mkBullet(x,y,vx,vy,em,col,dmg,props){
  bullets.push({x,y,vx,vy,em,col,dmg,life:55,trail:[],
    explosive:!!props.explosive,magnetic:!!props.magnetic,
    spawner:!!props.spawner,toxic:!!props.toxic,
    isWater:!!props.isWater,chain:!!props.chain,
    bouncy:!!props.bouncy,bounces:props.bouncy?3:0,
    isBossAtk:!!props.isBossAtk});
}
function fireGun(){
  if(!gameRunning||paused||P.dead||stageComplete)return;
  const gun=inventory[activeSlot];if(!gun)return;
  if(fireCd>0)return;
  if(gun.ammo!==Infinity&&gun.ammo<=0){SFX.noAmmo();return;}
  fireCd=gun.cd;if(gun.ammo!==Infinity)gun.ammo--;
  // sfx
  gun.id==='water'?(SFX.water(),onWaterShot()):SFX.shoot();
  burst(P.x+(P.facing>0?P.w:0),P.y+P.h*0.35,gun.bColor,4);
  for(let i=0;i<gun.count;i++){
    const sa=(Math.random()-0.5)*gun.spread;
    mkBullet(
      P.x+(P.facing>0?P.w:0),
      P.y+(squatting?P.h*0.65:P.h*0.3),
      Math.cos(sa)*gun.spd*P.facing,
      Math.sin(sa)*gun.spd,
      gun.bEmoji,gun.bColor,gun.dmg,gun.props);
  }
  if(gun.props.explosive)shake(10);
  updateGunHUD();
}

// ── GUN INVENTORY ──
function switchGun(s){if(s<0||s>3||!inventory[s])return;activeSlot=s;updateGunHUD();SFX.ability();showFloat(`🔫 ${inventory[s].name}`,P.x+P.w/2,P.y-28,'#ffaa00');}
function cycleGun(){for(let i=1;i<=4;i++){const n=(activeSlot+i)%4;if(inventory[n]){switchGun(n);return;}}}
function pickupGun(pu){
  if(pu.ammoSet){for(const s of inventory){if(s&&s.id===pu.id){s.ammo=Math.min(s.maxAmmo,s.ammo+pu.ammo);showPP(`📦 +${pu.ammo} ${pu.name}`);SFX.pickup();return;}}}
  let slot=-1;for(let i=1;i<4;i++){if(!inventory[i]){slot=i;break;}}
  if(slot===-1)slot=activeSlot===1?2:1;
  inventory[slot]={...GDEFS[pu.id],ammo:pu.ammo,id:pu.id};
  showPP(`🔫 ${pu.name}!`);SFX.pickup();updateGunHUD();
}
function showPP(t){const el=document.getElementById('pickPop');el.textContent=t;el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),1800);}

// ── WORLD GEN ──
function groundY(x){
  const w=WORLDS[currentWorld];
  return H*0.72+Math.sin(x*w.gFreq)*w.gAmp+Math.sin(x*w.gFreq*0.35)*25;
}
function genPlats(fx){
  while(lastGenX<fx+W*3){
    const x=lastGenX,y=H*0.34+Math.sin(lastGenX*0.004)*150+Math.random()*95;
    const pw=48*(2.5+Math.random()*4.5);
    const r=Math.random();
    const type=r<0.1?'bounce':r<0.18?'slip':r<0.27?'ohm':'solid';
    platforms.push({x,y,w:pw,h:22,type,pulse:0,claimed:false});
    lastGenX+=pw+48*(1.5+Math.random()*3.2);
  }
}
function spawnColls(fx){
  const ems=['⚡','💚','🎃','💜','✨','🔋','⚗️','🌊','⭐'];
  while(lastCollX<fx+W*3){
    collectibles.push({x:lastCollX+Math.random()*80,y:H*0.18+Math.random()*(H*0.42),
      e:ems[Math.floor(Math.random()*ems.length)],collected:false,bob:Math.random()*Math.PI*2});
    lastCollX+=120+Math.random()*170;
  }
}
function spawnEns(fx){
  if(WORLDS[currentWorld].defend)return;
  const byW={
    green:[{e:'👿',hp:1,spd:1.4,col:'#ff4444',pts:20},{e:'🌱',hp:2,spd:0.7,col:'#88ff00',pts:28}],
    sky:  [{e:'🦅',hp:1,spd:2.0,col:'#ffee88',pts:22},{e:'⛈️',hp:2,spd:0.6,col:'#aaaaff',pts:30}],
    water:[{e:'🦈',hp:2,spd:1.6,col:'#0088ff',pts:28},{e:'🐙',hp:3,spd:0.8,col:'#aa44ff',pts:40}],
    volcano:[{e:'🔥',hp:1,spd:1.9,col:'#ff4400',pts:25},{e:'🫨',hp:3,spd:0.7,col:'#ff8800',pts:48}],
    space:[{e:'👾',hp:2,spd:1.5,col:'#00ffff',pts:30},{e:'🛸',hp:3,spd:1.0,col:'#9b30ff',pts:52}],
    ai:   [{e:'🤖',hp:2,spd:1.4,col:'#ff4444',pts:20},{e:'💻',hp:3,spd:0.8,col:'#ff0000',pts:35}],
  };
  const types=byW[currentWorld]||byW.green;
  while(lastEnemyX<fx+W*3){
    const t=types[Math.floor(Math.random()*types.length)];
    const gy=groundY(lastEnemyX+400);
    enemies.push({x:lastEnemyX+400+Math.random()*280,y:gy-50,
      vx:-t.spd,vy:0,w:40,h:50,...t,maxHp:t.hp,onGround:false,stunned:0,hitFlash:0});
    lastEnemyX+=240+Math.random()*380;
  }
}
function spawnGuns(fx){
  const types=Object.keys(GDEFS).filter(k=>k!=='pistol');
  while(lastGunX<fx+W*3.5){
    if(Math.random()<0.55){
      let gid=types[Math.floor(Math.random()*types.length)];
      if(currentWorld==='water'&&Math.random()<0.5)gid='water';
      const g=GDEFS[gid];
      const gy=groundY(lastGunX)-62;
      gunPickups.push({x:lastGunX,y:gy,id:gid,icon:g.icon,name:g.name,
        color:g.bColor,ammo:g.maxAmmo,bob:Math.random()*Math.PI*2,collected:false,ammoSet:false});
      if(Math.random()<0.4)gunPickups.push({x:lastGunX+85,y:gy-26,id:gid,icon:'📦',
        name:gid.toUpperCase()+' AMMO',color:g.bColor,ammo:Math.floor(g.maxAmmo*0.5),
        bob:Math.random()*Math.PI*2,collected:false,ammoSet:true});
    }
    lastGunX+=500+Math.random()*800;
  }
}

// ── SHIP ──
function placeShip(){
  shipX=P.x+W*1.4+400;// world X ahead of player
  shipVisible=true;shipBoarding=false;shipTimer=0;
  SFX.shipArrive();
  showFloat('🛸 SHIP AHEAD! REACH IT!',P.x+W/2,P.y-80,'#00ff41');
  burst(P.x+W*0.5,P.y,'#00ff41',28);
}

function getShipScreenX(){return shipX;}
function getShipScreenY(){
  const gy=groundY(shipX);
  return gy-110+Math.sin(Date.now()*0.002)*7;
}

function checkShipBoard(){
  if(!shipVisible||shipBoarding||stageComplete)return;
  const sx=getShipScreenX(), sy=getShipScreenY();// both world coords now
  if(Math.abs(P.x-(sx+30))<65&&Math.abs((P.y+P.h/2)-(sy+55))<70){
    stageComplete=true;shipBoarding=true;shipTimer=0;SFX.shipLaunch();shake(8);
    showFloat('🚀 BOARDING!',P.x+P.w/2,P.y-30,'#00ff41');
  }
}

function updateShip(){
  if(!shipBoarding)return;
  shipTimer++;
  // Phase 1: 0-60 = ship rises + spins
  // Phase 2: 60-120 = accelerate upward
  // Phase 3: 120+ = trigger warp/tally
  if(shipTimer===60){shake(6);SFX.shipLaunch&&SFX.shipLaunch();}
  if(shipTimer>130)showTally();
}

function showTally(){
  saveScore(score);
  markBeaten(currentWorld);
  gameRunning=false;// stop the game loop
  document.getElementById('tW').textContent=WORLDS[currentWorld].name;
  document.getElementById('tS').textContent=score;
  document.getElementById('tE').textContent=enemiesDefeated;
  document.getElementById('tC').textContent=collsGrabbed;
  document.getElementById('tL').textContent=lives;
  document.getElementById('tallyScreen').classList.remove('hidden');
  // Hide game HUD
  ['hud','prog','gunHud','abilityBar','headPicker','mob','bossBar'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.style.display='none';});
}
function launchChem(){window.open('https://rudventur.com/chemventur','_blank');}

// ── BOSS ──
function spawnBoss(id){
  const D={
    ohmKing:{name:'⚡ OHM KING',e:'⚡',hp:80,maxHp:80,
      x:camX+W*0.82,y:H*0.3,w:82,h:102,vx:-1.5,vy:0,col:'#ffff00',atT:0,inv:false,
      atk(){if(this.atT-->0)return;this.atT=55;
        const a=Math.atan2(P.y-this.y,P.x-(this.x-camX));
        for(let k=0;k<3;k++)setTimeout(()=>{if(!boss)return;
          mkBullet(boss.x+boss.w/2,boss.y+boss.h/2,
            Math.cos(a+(k-1)*0.3)*8,Math.sin(a+(k-1)*0.3)*8,'⚡','#ffff00',1,{isBossAtk:true});
        },k*130);SFX.boss();}},
    magnetMonster:{name:'🧲 MAGNET MONSTER',e:'🧲',hp:65,maxHp:65,
      x:camX+W*0.82,y:H*0.38,w:72,h:92,vx:-1,vy:0,col:'#aa44ff',atT:0,pull:0,inv:false,
      atk(){if(this.atT-->0)return;this.atT=70;this.pull=55;
        SFX.boss();burst(this.x-camX+this.w/2,this.y+this.h/2,'#aa44ff',12);}},
    aiCore:{name:'🤖 AI CORE',e:'🤖',hp:9999,maxHp:9999,
      x:80,y:H*0.3,w:110,h:110,vx:0,vy:0,col:'#ff0000',atT:0,inv:true,
      atk(){if(this.atT-->0)return;this.atT=40;
        const gy=groundY(camX+200);
        enemies.push({x:camX+200,y:gy-50,vx:3+Math.random()*2,vy:0,w:36,h:46,hp:2,maxHp:2,
          e:['👾','🤖','💻'][Math.floor(Math.random()*3)],col:'#ff4444',pts:15,
          onGround:false,stunned:0,hitFlash:0,isAiMinion:true});
        aiWaves++;document.getElementById('aiW').textContent=aiWaves;}},
    pumpking:{name:'🎃 PUMPKING',e:'🎃',hp:160,maxHp:160,
      x:camX+W*0.82,y:H*0.28,w:98,h:118,vx:-0.8,vy:0,col:'#ff8800',atT:0,inv:false,
      atk(){if(this.atT-->0)return;this.atT=44;
        for(let k=0;k<6;k++){const a=(k/6)*Math.PI*2;
          mkBullet(this.x-camX+this.w/2,this.y+this.h/2,Math.cos(a)*8,Math.sin(a)*8,'🎃','#ff8800',1,{isBossAtk:true});}
        SFX.boss();}},
  };
  if(!D[id])return;
  boss={...D[id],id};bossActive=true;
  document.getElementById('bossBar').style.display='';
  document.getElementById('bossName').textContent=boss.name;
  document.getElementById('bossFill').style.width='100%';
  SFX.boss();showFloat(`⚠️ ${boss.name}!`,camX+W/2,camY+H*0.35,'#ff4444');
  burst(boss.x+boss.w/2,boss.y+boss.h/2,'#ff0000',30);shake(14);
}
function killBoss(){
  score+=500;enemiesDefeated+=5;SFX.ohm();shake(22);
  burst(boss.x+boss.w/2,boss.y+boss.h/2,'#ffff00',55);
  showFloat('💥 BOSS DOWN! +500',camX+W/2,camY+H*0.35,'#ffff00');
  boss=null;bossActive=false;
  document.getElementById('bossBar').style.display='none';
  if(!window._bk)window._bk=0;window._bk++;
  if(window._bk>=2)setTimeout(()=>spawnBoss('pumpking'),3500);
}
function updateBoss(){
  if(!boss||!bossActive)return;
  if(boss.id==='aiCore'){
    boss.atk();
    for(let i=enemies.length-1;i>=0;i--){
      const e=enemies[i];
      if(e.isAiMinion&&e.x>W*0.83){
        aiCoreHp=Math.max(0,aiCoreHp-5);enemies.splice(i,1);
        document.getElementById('aiC').textContent=aiCoreHp+'%';
        burst(W*0.83,H*0.5,'#ff0000',10);SFX.hit();shake(7);}
    }return;
  }
  boss.x+=boss.vx;boss.vy+=0.28;boss.y+=boss.vy;
  const bgy=groundY(boss.x);if(boss.y+boss.h>bgy){boss.y=bgy-boss.h;boss.vy=0;}
  if(boss.x<camX+W*0.15||boss.x>camX+W*0.9)boss.vx*=-1;
  // magnet pull
  if(boss.pull>0){boss.pull--;
    const dx=boss.x-P.x,dy=boss.y-P.y,d=Math.sqrt(dx*dx+dy*dy)||1;
    P.vx+=dx/d*1.7;P.vy+=dy/d*0.9;}
  boss.atk();
  const bsx=boss.x;
  if(P.invincible<=0&&shieldT<=0&&P.x<bsx+boss.w&&P.x+P.w>bsx&&P.y<boss.y+boss.h&&P.y+P.h>boss.y){
    P.invincible=120;P.hp--;SFX.hit();shake(10);
    burst(P.x+P.w/2,P.y+P.h/2,'#ff0000',10);if(P.hp<=0)killPlayer();
  }
}

// ── UPDATE PLAYER ──
function updatePlayer(){
  if(P.dead){P.vy+=0.55;P.y+=P.vy;return;}
  if(stageComplete&&shipBoarding){
    // Player rides ship upward — ship world coords
    const sx=getShipScreenX(), sy=getShipScreenY();
    P.x=sx+18; P.y=sy+35-shipTimer*0.7;
    // Camera follows player even during boarding
    camX+=(P.x-W*0.35-camX)*0.14;
    camY+=(P.y-H*0.45-camY)*0.14;
    return;
  }
  const wd=WORLDS[currentWorld];
  const goLeft =K['ArrowLeft'] ||K['KeyA']||MB['l'];
  const goRight=K['ArrowRight']||K['KeyD']||MB['r'];
  const upHeld =K['ArrowUp'];
  const dnHeld =K['ArrowDown']||MB['d'];

  if(goLeft) {P.vx-=0.33*4.8;P.facing=-1;}
  if(goRight){P.vx+=0.33*4.8;P.facing= 1;}
  if(dashT>0){P.vx=P.facing*18;dashT--;}
  P.vx*=wd.swim?0.87:0.82;
  if(Math.abs(P.vx)<0.1)P.vx=0;
  P.walking=Math.abs(P.vx)>0.5;

  // Bird fly
  if(P.head==='🐦'&&wd.float&&upHeld&&P.flyTimer>0){P.vy=-3.5;P.flyTimer=Math.max(0,P.flyTimer-1);P.flying=true;}
  else P.flying=false;

  // Down arrow
  squatting=false;
  if(dnHeld){
    if(wd.swim){P.vy=Math.min(P.vy+2,8);}           // dive down
    else if(wd.float&&!P.onGround){P.vy+=3;}         // sky dive
    else if(P.onGround){squatting=true;SFX.squat();}  // ground squat
    else P.vy+=1.8;                                    // fast fall
  }

  // Swim
  if(wd.swim){
    if(upHeld)P.vy=Math.max(P.vy-2,-6);
    P.vx*=0.88;P.vy*=0.88;
    if(Math.random()<0.12)bubbles.push({x:P.x+Math.random()*P.w,y:P.y,life:55+Math.random()*35});
  }else{
    P.vy+=wd.grav;if(P.vy>22)P.vy=22;
  }

  P.x+=P.vx;P.y+=P.vy;P.onGround=false;

  // Platform collision
  if(phaseT<=0){
    for(const p of platforms){
      const px=p.x;// world coord
      if(P.x+P.w>px&&P.x<px+p.w&&P.y+P.h>p.y&&P.y+P.h<p.y+p.h+Math.abs(P.vy)+6&&P.vy>=0){
        P.y=p.y-P.h;P.vy=p.bounce?-10:0;P.onGround=!p.bounce;P.jumps=0;p.pulse=18;
        if(p.type==='ohm'&&!p.claimed){p.claimed=true;P.ohmActive=1;P.ohmTimer=320;
          SFX.ohm();showFloat('⚡ OHM POWER!',P.x+P.w/2,P.y-30,'#ffff00');}
      }
    }
  }
  if(phaseT>0)phaseT--;

  // Ground
  const gy=groundY(P.x+P.w/2);
  if(P.y+P.h>gy&&P.vy>=0&&!wd.swim){P.y=gy-P.h;P.vy=0;P.onGround=true;P.jumps=0;if(P.flyTimer<30)P.flyTimer=30;}

  // Timers
  if(P.invincible>0)P.invincible--;
  if(P.waveCd>0)P.waveCd--;
  if(P.abilityCd>0)P.abilityCd--;
  if(fireCd>0)fireCd--;
  if(P.ohmTimer>0){P.ohmTimer--;if(P.ohmTimer<=0)P.ohmActive=0;}
  if(shellT>0){shellT--;
    for(const e of enemies){const ex=e.x;
      if(ex>P.x-65&&ex<P.x+P.w+65&&e.y>P.y-50&&e.y<P.y+P.h+50){
        e.hp-=2;e.hitFlash=14;burst(ex,e.y,'#88ff00',6);if(e.hp<=0){score+=e.pts;enemiesDefeated++;}}}}
  if(shieldT>0)shieldT--;

  // Space FIRE — held SPACE fires gun
  if((K['Space']||MB['fire'])&&fireCd<=0)fireGun();

  // Enemy collision
  if(P.invincible<=0&&shieldT<=0){
    for(const e of enemies){if(e.hp<=0)continue;
      const ex=e.x;
      if(P.x<ex+e.w&&P.x+P.w>ex&&P.y<e.y+e.h&&P.y+P.h>e.y){
        if(P.vy>0&&P.y+P.h<e.y+e.h*0.55){
          e.hp-=P.ohmActive?3:1;e.hitFlash=12;P.vy=-8;SFX.hit();
          burst(ex+e.w/2,e.y,'#ff4444',8);if(e.hp<=0){score+=e.pts;enemiesDefeated++;}
        }else{P.invincible=100;P.hp--;SFX.hit();shake(8);
          burst(P.x+P.w/2,P.y+P.h/2,'#ff0000',10);if(P.hp<=0)killPlayer();}
      }
    }
  }

  // Gun pickups
  for(const pu of gunPickups){if(pu.collected)continue;
    if(pu.x>P.x-45&&pu.x<P.x+P.w+45&&pu.y>P.y-45&&pu.y<P.y+P.h+45){pu.collected=true;pickupGun(pu);}}

  // Ship check
  checkShipBoard();

  if(P.y>H+camY+160)killPlayer();
  if(P.x<camX-10)P.x=camX-10;
  if(P.walking||P.flying)legPhase+=0.22;
  score=Math.max(score,Math.floor((P.x+camX)/8));

  // Trigger ship at 500
  if(score>=500&&!shipVisible&&!stageComplete)placeShip();
}

function killPlayer(){
  if(P.dead)return;P.dead=true;P.vy=-8;SFX.hit();shake(14);
  onPlayerDeath();// ⚡ quest hook
  lives--;
  if(lives<=0){gameOver=true;saveScore(score);}
  else setTimeout(()=>{P.x=camX+W*0.22;P.y=camY+H*0.3;P.vx=0;P.vy=0;P.hp=3;P.dead=false;P.invincible=120;},900);
}

// ── UPDATE ENEMIES ──
function updateEnemies(){
  for(let i=enemies.length-1;i>=0;i--){
    const e=enemies[i];if(e.hp<=0){enemies.splice(i,1);continue;}
    if(e.stunned>0){e.stunned--;continue;}
    e.x+=e.vx;e.vy+=0.38;if(e.vy>14)e.vy=14;e.y+=e.vy;
    const gy=groundY(e.x);if(e.y+e.h>gy){e.y=gy-e.h;e.vy=0;}
    for(const p of platforms){const px=p.x;
      if(e.x+e.w>px&&e.x<px+p.w&&e.y+e.h>p.y&&e.y+e.h<p.y+p.h+4&&e.vy>=0){e.y=p.y-e.h;e.vy=0;}}
    const ngy=groundY(e.x+e.x*14);
    if(Math.abs(e.y+e.h-ngy)>90||e.x<camX-80||e.x>camX+W+80)e.vx*=-1;
    if(e.hitFlash>0)e.hitFlash--;
  }
}

// ── UPDATE BULLETS ──
function updateBullets(){
  for(let i=bullets.length-1;i>=0;i--){
    const b=bullets[i];
    b.trail.push({x:b.x,y:b.y});if(b.trail.length>9)b.trail.shift();
    b.x+=b.vx;b.y+=b.vy;
    if(!b.bouncy)b.vy+=0.1;
    b.life--;if(b.life<=0){bullets.splice(i,1);continue;}
    if(b.bouncy&&b.bounces>0){const gy=groundY(b.x);if(b.y>gy){b.y=gy;b.vy*=-0.7;b.bounces--;}}
    if(b.magnetic)for(const e of enemies){const ex=e.x,dx=b.x-ex,dy=b.y-e.y,d=Math.sqrt(dx*dx+dy*dy)||1;if(d<220){e.vx+=dx/d*1.3;e.vy+=dy/d*0.5;}}
    if(b.spawner){const gy=groundY(b.x);if(b.y>=gy-12||b.life<8){spawnFriendly(b.x,Math.min(b.y,gy-48));burst(b.x,b.y,'#ffaa00',16);shake(4);bullets.splice(i,1);continue;}}
    let hit=false;
    // Hit boss
    if(boss&&bossActive&&!boss.inv&&!b.isBossAtk){
      const bsx=boss.x;
      if(b.x>bsx&&b.x<bsx+boss.w&&b.y>boss.y&&b.y<boss.y+boss.h){
        let dmg=b.dmg*(P.ohmActive?2:1);
        if(b.isWater){
          // 💧 Water → STEAM on OHM KING!
          steamBurst(b.x,b.y);
          if(boss.id==='ohmKing')dmg*=3;// triple damage!
          showFloat('💨 STEAM! ×3',b.x,b.y-18,'#00aaff');
        }
        boss.hp-=dmg;
        if(b.explosive){explosion(b.x,b.y);shake(18);}
        burst(b.x,b.y,'#ff4444',7);bullets.splice(i,1);hit=true;
        document.getElementById('bossFill').style.width=Math.max(0,boss.hp/boss.maxHp*100)+'%';
        if(boss.hp<=0&&!boss.inv)killBoss();
      }
    }
    if(!hit){
      for(let j=enemies.length-1;j>=0;j--){
        const e=enemies[j];if(e.hp<=0)continue;
        const ex=e.x;
        if(b.x>ex&&b.x<ex+e.w&&b.y>e.y&&b.y<e.y+e.h){
          let dmg=b.dmg*(P.ohmActive?2:1);
          if(b.isWater){steamBurst(b.x,b.y);dmg+=1;}// water makes steam on all enemies!
          if(b.toxic){e.stunned=(e.stunned||0)+65;}
          if(b.explosive){explosion(b.x,b.y);shake(15);}
          e.hp-=dmg;e.hitFlash=12;
          burst(b.x,b.y,b.col,7);
          if(e.hp<=0){score+=e.pts;enemiesDefeated++;}
          bullets.splice(i,1);hit=true;break;
        }
      }
    }
    if(!hit&&b.isBossAtk&&P.invincible<=0&&shieldT<=0){
      if(b.x>P.x&&b.x<P.x+P.w&&b.y>P.y&&b.y<P.y+P.h){
        P.invincible=90;P.hp--;SFX.hit();shake(9);
        burst(P.x+P.w/2,P.y+P.h/2,'#ff0000',10);if(P.hp<=0)killPlayer();
        bullets.splice(i,1);
      }
    }
  }
}

function steamBurst(x,y){
  SFX.steam();
  for(let i=0;i<14;i++){const a=Math.random()*Math.PI*2,s=1+Math.random()*3;
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,
      life:55+Math.random()*30,maxLife:85,col:'#aaeeff',sz:5+Math.random()*7,steam:true});}
}
function explosion(x,y){
  SFX.explosion();burst(x,y,'#ff6600',22);burst(x,y,'#ffff00',14);
  for(const e of enemies){const ex=e.x;
    if(Math.hypot(ex-x,e.y+e.h/2-y)<105){e.hp-=3;e.hitFlash=15;if(e.hp<=0){score+=e.pts;enemiesDefeated++;}}}
  if(boss&&bossActive&&!boss.inv){const bsx=boss.x;
    if(Math.hypot(bsx+boss.w/2-x,boss.y+boss.h/2-y)<125)boss.hp-=6;}
}

// ── FRIENDLIES ──
const FT=[{e:'🐣',hp:3,spd:2.5,col:'#ffff00',atk:1},{e:'🤺',hp:5,spd:1.8,col:'#00ff88',atk:2},{e:'🦾',hp:8,spd:1.2,col:'#00aaff',atk:3}];
function spawnFriendly(x,y){
  const t=FT[Math.floor(Math.random()*FT.length)];
  friendlies.push({x:x,y,vx:2,vy:0,w:36,h:46,...t,maxHp:t.hp,onGround:false,atkCd:0,hitFlash:0,life:650+Math.random()*400});
  showFloat(`🥚 ALLY ${t.e}`,x,y-28,'#ffaa00');
}
function updateFriendlies(){
  for(let i=friendlies.length-1;i>=0;i--){
    const f=friendlies[i];f.life--;if(f.life<=0){friendlies.splice(i,1);continue;}
    f.x+=f.vx;f.vy+=0.4;if(f.vy>12)f.vy=12;f.y+=f.vy;
    const gy=groundY(f.x);if(f.y+f.h>gy){f.y=gy-f.h;f.vy=0;}
    let nd=Infinity,ne=null;
    for(const e of enemies){const d=Math.abs(e.x-f.x);if(d<nd){nd=d;ne=e;}}
    if(ne){f.vx=(ne.x>f.x?1:-1)*f.spd;
      if(nd<50&&f.atkCd<=0){ne.hp-=f.atk;ne.hitFlash=10;burst(f.x,f.y+f.h/2,f.col,5);f.atkCd=40;
        if(ne.hp<=0){score+=ne.pts;enemiesDefeated++;}}}
    else f.vx=Math.sign(f.vx||1)*f.spd;
    if(f.atkCd>0)f.atkCd--;
    if(f.x<camX-400||f.x>camX+W+400)friendlies.splice(i,1);
  }
}

// ── WAVE PROJECTILES ──
function updateWaves(){
  for(let i=waveProj.length-1;i>=0;i--){
    const w=waveProj[i];w.x+=w.vx;w.y+=Math.sin(w.x*0.08)*1.5;w.life--;
    if(w.life<=0){waveProj.splice(i,1);continue;}
    if(boss&&bossActive&&!boss.inv){const bsx=boss.x;
      if(w.x>bsx&&w.x<bsx+boss.w&&w.y>boss.y&&w.y<boss.y+boss.h){
        boss.hp-=w.dmg;burst(w.x,w.y,boss.col,6);waveProj.splice(i,1);
        document.getElementById('bossFill').style.width=Math.max(0,boss.hp/boss.maxHp*100)+'%';
        if(boss.hp<=0&&!boss.inv)killBoss();continue;}}
    for(const e of enemies){if(e.hp<=0)continue;const ex=e.x;
      if(w.x>ex&&w.x<ex+e.w&&w.y>e.y&&w.y<e.y+e.h){
        e.hp-=w.dmg;e.hitFlash=12;burst(w.x,w.y,w.color,6);
        if(e.hp<=0){score+=e.pts;enemiesDefeated++;}waveProj.splice(i,1);break;}}
  }
}

// ── COLLECTIBLES ──
function updateColls(){
  for(const c of collectibles){if(c.collected)continue;c.bob+=0.07;
    if(c.x>P.x-40&&c.x<P.x+P.w+40&&c.y>P.y-40&&c.y<P.y+P.h+40){
      c.collected=true;SFX.collect();score+=10;collsGrabbed++;
      if(c.e==='⚡'){P.ohmTimer+=220;P.ohmActive=1;SFX.ohm();showFloat('⚡ OHM!',c.x,c.y-20,'#ffff00');}
      burst(c.x,c.y,'#e879f9',8);}}
}

// ── CAMERA ── (smooth follow, player at ~30% from left)
function updateCamera(){
  const wd=WORLDS[currentWorld];
  // X follow — player stays ~35% from left
  const tx=wd.defend ? P.x-W*0.5 : P.x-W*0.35;
  camX+=(tx-camX)*0.14;
  if(camX<0)camX=0;
  // Y follow — player stays ~45% from top (tight)
  const ty=P.y-H*0.45;
  camY+=(ty-camY)*0.14;
  if(camY<0)camY=0; // don't scroll above world top
}

// ── PARTICLES / FLOATS ──
function burst(x,y,col,n=12){
  for(let i=0;i<n;i++){const a=(i/n)*Math.PI*2,s=2+Math.random()*4;
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,life:42+Math.random()*22,maxLife:64,col,sz:3+Math.random()*5,steam:false});}}
function showFloat(txt,x,y,col){floatTexts.push({txt,x,y,life:88,col});}

// ── WORLD FX ──
function updateWorldFX(){
  // Lava blobs
  if(currentWorld==='volcano'&&Math.random()<0.035){
    const x=Math.random()*W;const gy=groundY(x);
    lavaBlobs.push({x,y:gy,vy:-4-Math.random()*5,life:45+Math.random()*20,sz:4+Math.random()*7});}
  for(let i=lavaBlobs.length-1;i>=0;i--){lavaBlobs[i].y+=lavaBlobs[i].vy;lavaBlobs[i].vy+=0.3;lavaBlobs[i].life--;if(lavaBlobs[i].life<=0)lavaBlobs.splice(i,1);}
  // Asteroids
  if(currentWorld==='space'&&Math.random()<0.008)
    asteroids.push({x:W+50,y:Math.random()*H*0.72,spd:1+Math.random()*2.5,sz:8+Math.random()*22,rot:0,rs:(Math.random()-0.5)*0.04});
  for(let i=asteroids.length-1;i>=0;i--){asteroids[i].x-=asteroids[i].spd;asteroids[i].rot+=asteroids[i].rs;if(asteroids[i].x<-80)asteroids.splice(i,1);}
  // Bubbles
  for(let i=bubbles.length-1;i>=0;i--){bubbles[i].y-=0.9;bubbles[i].life--;if(bubbles[i].life<=0)bubbles.splice(i,1);}
  // Sky clouds
  if(currentWorld==='sky'&&bgClouds.length<8)
    bgClouds.push({x:W+60,y:H*0.1+Math.random()*H*0.5,w:80+Math.random()*140,h:30+Math.random()*50,spd:0.4+Math.random()*0.8,alpha:0.15+Math.random()*0.25});
  for(let i=bgClouds.length-1;i>=0;i--){bgClouds[i].x-=bgClouds[i].spd;if(bgClouds[i].x<-200)bgClouds.splice(i,1);}
  // Sci equations
  sciT_++;if(sciT_%175===0)sciFs.push({txt:SCI[Math.floor(Math.random()*SCI.length)],x:Math.random()*W,y:H*0.12+Math.random()*H*0.5,life:260,sz:11+Math.random()*9});
  for(let i=sciFs.length-1;i>=0;i--){sciFs[i].life--;sciFs[i].y-=0.14;if(sciFs[i].life<=0)sciFs.splice(i,1);}
}

// ── MAIN UPDATE ──
function update(){
  if(!gameRunning||paused||gameOver)return;
  tickShake();
  updatePlayer();updateEnemies();updateFriendlies();
  updateWaves();updateBullets();updateColls();
  updateCamera();updateBoss();updateShip();updateWorldFX();updateQuests();
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];
    p.x+=p.vx;p.y+=p.vy;p.vy+=p.steam?-0.04:0.12;if(p.steam)p.vx*=0.97;p.life--;if(p.life<=0)particles.splice(i,1);}
  for(let i=floatTexts.length-1;i>=0;i--){const f=floatTexts[i];f.y-=0.75;f.life--;if(f.life<=0)floatTexts.splice(i,1);}
  genPlats(camX);spawnColls(camX);spawnEns(camX);spawnGuns(camX);
  const edge=camX-W*0.5;
  platforms=platforms.filter(p=>p.x>edge);
  collectibles=collectibles.filter(c=>c.x>edge);
  gunPickups=gunPickups.filter(g=>g.x>edge);
  enemies=enemies.filter(e=>e.x>camX-400);
  friendlies=friendlies.filter(f=>f.x>camX-400);
  if(!bossActive&&!boss){const bid=WORLDS[currentWorld].bossId;
    if(bid&&score>200&&Math.random()<0.0007)spawnBoss(bid);}
  updateGunHUD();updateHUD2();
}

// ══════════════════════════════════
//  DRAW
