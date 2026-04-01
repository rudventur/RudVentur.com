// ================================================================
//  SPLASH SPLASH — draw.js
//  All canvas rendering — backgrounds, entities, HUD, game over
// ================================================================
// ══════════════════════════════════
function drawBG(){
  const w=WORLDS[currentWorld];
  // Sky gradient
  const bg=ctx.createLinearGradient(0,0,0,H);
  w.sky.forEach((c,i)=>bg.addColorStop(i/(w.sky.length-1),c));
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);

  // Stars (dim outside space)
  const starAlphaMul=currentWorld==='space'?1:0.25;
  STARS.forEach(s=>{
    const sx=((s.x*W*3-camX*s.sp)%(W*3)+W*3)%W,sy=s.y*H;
    ctx.globalAlpha=(0.3+0.6*Math.abs(Math.sin(s.tw+Date.now()*0.0005)))*starAlphaMul;
    ctx.fillStyle='#ffffff';ctx.beginPath();
    ctx.arc(sx,sy,s.sz*(currentWorld==='space'?1.5:0.6),0,Math.PI*2);ctx.fill();});
  ctx.globalAlpha=1;

  // World specific backgrounds
  if(currentWorld==='green'){
    // Hills in background
    ctx.globalAlpha=0.08;ctx.fillStyle='#00ff41';
    for(let i=0;i<4;i++){ctx.beginPath();
      const hx=((i/4)*W*2-camX*0.1)%(W*1.5);
      ctx.arc(hx,H*0.85,120+i*40,0,Math.PI*2);ctx.fill();}
    ctx.globalAlpha=1;
    // Butterflies
    for(let i=0;i<5;i++){
      const bx=((i*300+Date.now()*0.04*(i%2===0?1:-1))%(W*1.5)+W*1.5)%W;
      const by=H*0.3+Math.sin(Date.now()*0.002+i)*80;
      ctx.globalAlpha=0.4;ctx.font='14px serif';ctx.textAlign='center';
      ctx.fillText(['🦋','🌸','🌿'][i%3],bx,by);}
    ctx.globalAlpha=1;
  }

  if(currentWorld==='sky'){
    // Clouds
    for(const cl of bgClouds){ctx.globalAlpha=cl.alpha;ctx.fillStyle='#ffffff';
      ctx.beginPath();ctx.ellipse(cl.x,cl.y,cl.w/2,cl.h/2,0,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.ellipse(cl.x+cl.w*0.3,cl.y-cl.h*0.3,cl.w*0.4,cl.h*0.4,0,0,Math.PI*2);ctx.fill();}
    ctx.globalAlpha=1;
    // Lightning in bg
    if(Math.random()<0.003){
      ctx.globalAlpha=0.5;ctx.strokeStyle='#ffffff';ctx.lineWidth=2;
      ctx.beginPath();const lx=Math.random()*W;ctx.moveTo(lx,0);
      for(let s=0;s<8;s++)ctx.lineTo(lx+(Math.random()-0.5)*30,s*H/8);
      ctx.stroke();ctx.globalAlpha=1;}
  }

  if(currentWorld==='water'){
    // Caustics
    ctx.globalAlpha=0.05;
    for(let i=0;i<10;i++){const cx=(i/10*W+(Date.now()*0.012+i*80))%W;
      const cy=Math.sin(Date.now()*0.001+i)*H*0.15+H*0.35;
      ctx.fillStyle='#00aaff';ctx.beginPath();ctx.arc(cx,cy,22+i*3,0,Math.PI*2);ctx.fill();}
    ctx.globalAlpha=1;
    // Bubbles
    ctx.globalAlpha=0.45;ctx.strokeStyle='#88ddff';ctx.lineWidth=1;
    for(const b of bubbles){ctx.beginPath();ctx.arc(b.x,b.y,4,0,Math.PI*2);ctx.stroke();}
    ctx.globalAlpha=1;
    // Water overlay
    ctx.fillStyle='rgba(0,60,120,0.06)';ctx.fillRect(0,0,W,H);
  }

  if(currentWorld==='volcano'){
    // Heat shimmer
    ctx.globalAlpha=0.05;ctx.strokeStyle='#ff8800';ctx.lineWidth=1;
    for(let i=0;i<6;i++){const hx=((i*160+Date.now()*0.018)%W);
      ctx.beginPath();ctx.moveTo(hx,0);ctx.bezierCurveTo(hx+15,H*0.33,hx-10,H*0.66,hx+5,H);ctx.stroke();}
    ctx.globalAlpha=1;
    // Lava blobs
    for(const b of lavaBlobs){ctx.globalAlpha=Math.min(1,b.life/45);
      ctx.fillStyle='#ff4400';ctx.shadowColor='#ff8800';ctx.shadowBlur=10;
      ctx.beginPath();ctx.arc(b.x,b.y,b.sz,0,Math.PI*2);ctx.fill();}
    ctx.globalAlpha=1;ctx.shadowBlur=0;
  }

  if(currentWorld==='space'){
    // Asteroids
    for(const a of asteroids){ctx.save();ctx.translate(a.x,a.y);ctx.rotate(a.rot);
      ctx.font=`${a.sz}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText('🪨',0,0);ctx.restore();}
    // Nebula blobs
    ctx.globalAlpha=0.04;
    for(let i=0;i<4;i++){const nx=((i*300-camX*0.05)%W+W)%W;
      const c=ctx.createRadialGradient(nx,H*0.4,0,nx,H*0.4,180);
      c.addColorStop(0,['#9b30ff','#e879f9','#00aaff','#00ff41'][i]);c.addColorStop(1,'transparent');
      ctx.fillStyle=c;ctx.fillRect(0,0,W,H);}
    ctx.globalAlpha=1;
  }

  if(currentWorld==='ai'){
    // Circuit grid
    ctx.globalAlpha=0.04;ctx.strokeStyle='#00ff41';ctx.lineWidth=1;
    for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    ctx.globalAlpha=1;
    // Red warning pulses
    ctx.globalAlpha=0.03+0.02*Math.sin(Date.now()*0.004);
    ctx.fillStyle='#ff0000';ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;
  }

  // Fog overlay
  if(w.fog){const fog=ctx.createLinearGradient(0,H*0.5,0,H);
    fog.addColorStop(0,'transparent');fog.addColorStop(1,w.fog);
    ctx.fillStyle=fog;ctx.fillRect(0,0,W,H);}

  // Sci equations (faint bg)
  for(const s of sciFs){ctx.globalAlpha=Math.min(0.14,s.life/260*0.14+0.03);
    ctx.fillStyle='#00ff41';ctx.font=`${s.sz}px Courier New`;ctx.textAlign='left';
    ctx.fillText(s.txt,s.x,s.y);}
  ctx.globalAlpha=1;
}

function drawGround(){
  const w=WORLDS[currentWorld];
  // Draw in world space (camX translate already applied)
  const x0=camX, x1=camX+W;
  ctx.beginPath();ctx.moveTo(x0,camY+H);
  for(let x=x0;x<=x1+8;x+=8)ctx.lineTo(x,groundY(x));
  ctx.lineTo(x1,camY+H);ctx.closePath();
  const gg=ctx.createLinearGradient(0,camY+H*0.65,0,camY+H);
  gg.addColorStop(0,w.gc);gg.addColorStop(1,'#000');
  ctx.fillStyle=gg;ctx.fill();
  ctx.beginPath();
  for(let x=x0;x<=x1+8;x+=8){x===x0?ctx.moveTo(x,groundY(x)):ctx.lineTo(x,groundY(x));}
  ctx.strokeStyle=w.glow;ctx.lineWidth=2.5;ctx.shadowColor=w.glow;ctx.shadowBlur=12;ctx.stroke();ctx.shadowBlur=0;
}

function drawPlatforms(){
  const w=WORLDS[currentWorld];
  for(const p of platforms){const px=p.x;if(px>camX+W+80||px+p.w<camX-80)continue;
    const cs={solid:{f:'rgba(0,50,15,0.85)',s:w.glow},bounce:{f:'rgba(60,40,0,0.85)',s:'#ffaa00'},
      slip:{f:'rgba(0,20,60,0.85)',s:'#00aaff'},ohm:{f:'rgba(50,50,0,0.9)',s:'#ffff00'}};
    const c=cs[p.type]||cs.solid;
    if(p.pulse>0){ctx.shadowColor=c.s;ctx.shadowBlur=16*(p.pulse/18);p.pulse--;}
    ctx.fillStyle=c.f;ctx.strokeStyle=c.s;ctx.lineWidth=2.5;
    ctx.beginPath();ctx.roundRect(px,p.y,p.w,p.h,5);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    if(p.type==='ohm'){ctx.fillStyle='#ffff00';ctx.font='9px Courier New';ctx.textAlign='center';ctx.fillText('⚡OHM',px+p.w/2,p.y+p.h/2+3);}}
}

function drawGunPickups(){
  for(const pu of gunPickups){if(pu.collected)continue;
    const px=pu.x;if(px<camX-60||px>camX+W+60)continue;
    pu.bob+=0.06;const fy=pu.y+Math.sin(pu.bob)*5;
    ctx.fillStyle=pu.color+'22';ctx.strokeStyle=pu.color;ctx.lineWidth=2;
    ctx.shadowColor=pu.color;ctx.shadowBlur=12;
    ctx.beginPath();ctx.roundRect(px-20,fy-20,40,40,7);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    ctx.font='20px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(pu.icon,px,fy);
    ctx.font='bold 8px Courier New';ctx.fillStyle=pu.color;ctx.fillText(pu.name,px,fy+24);
    if(pu.ammoSet){ctx.font='7px Courier New';ctx.fillStyle='#ffaa00';ctx.fillText('+'+pu.ammo+' AMMO',px,fy+34);}}
}

function drawShip(){
  if(!shipVisible)return;
  const sx=getShipScreenX();
  const screenSy=getShipScreenY();       // screen-space (has -camY)
  const worldSy=screenSy+camY;           // world-space for drawing inside camY translate

  // Launch exhaust
  if(shipBoarding&&shipTimer>0){
    ctx.globalAlpha=Math.min(1,shipTimer*0.03);
    ctx.fillStyle='#00ff41';ctx.shadowColor='#00ff41';ctx.shadowBlur=30;
    ctx.beginPath();ctx.moveTo(sx+30,worldSy+110);ctx.lineTo(sx+15,worldSy+140);ctx.lineTo(sx+45,worldSy+140);ctx.closePath();
    ctx.fill();ctx.shadowBlur=0;ctx.globalAlpha=1;
    if(Math.random()<0.7)particles.push({x:sx+30+camX,y:worldSy+120,vx:(Math.random()-0.5)*3,vy:3+Math.random()*3,
      life:20+Math.random()*15,maxLife:35,col:Math.random()<0.5?'#00ff41':'#ffaa00',sz:4+Math.random()*5,steam:false});
  }
  // ▲ GREEN TRIANGLE SHIP
  const scale=shipBoarding?1+shipTimer*0.008:1;
  const spinAngle=shipBoarding?shipTimer*0.08:0;// spin during launch!
  ctx.save();ctx.translate(sx+30,worldSy+55);ctx.scale(scale,scale);ctx.rotate(spinAngle);
  ctx.fillStyle='#00aa33';ctx.strokeStyle='#00ff41';ctx.lineWidth=3;
  ctx.shadowColor='#00ff41';ctx.shadowBlur=20;
  ctx.beginPath();ctx.moveTo(0,-55);ctx.lineTo(-38,55);ctx.lineTo(38,55);ctx.closePath();
  ctx.fill();ctx.stroke();ctx.shadowBlur=0;
  ctx.fillStyle='#00ff4133';ctx.beginPath();ctx.moveTo(0,-30);ctx.lineTo(-20,30);ctx.lineTo(20,30);ctx.closePath();ctx.fill();
  ctx.fillStyle='#00ffaa';ctx.shadowColor='#00ffff';ctx.shadowBlur=12;
  ctx.beginPath();ctx.arc(0,-15,12,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  ctx.fillStyle='#008822';ctx.strokeStyle='#00ff41';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(-38,55);ctx.lineTo(-55,75);ctx.lineTo(-15,55);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(38,55);ctx.lineTo(55,75);ctx.lineTo(15,55);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.globalAlpha=0.2+0.15*Math.sin(Date.now()*0.004);
  ctx.strokeStyle='#00ff41';ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(0,0,65,0,Math.PI*2);ctx.stroke();
  ctx.globalAlpha=1;
  ctx.restore();

  // Off-screen indicator — convert to screen coords for this
  const offSx=sx-camX, offSy=screenSy;
  const offX=offSx<-30||offSx>W+30;
  const offY=offSy<-30||offSy>H+30;
  if(offX||offY){
    ctx.save();ctx.translate(camX,camY);// step out of world-space to screen-space
    const angle=Math.atan2(offSy-H/2,offSx-W/2);
    const r=Math.min(W/2-60,H/2-60);
    const ex=W/2+Math.cos(angle)*r,ey=H/2+Math.sin(angle)*r;
    ctx.save();ctx.translate(ex,ey);ctx.rotate(angle);
    ctx.fillStyle='#00ff41';ctx.shadowColor='#00ff41';ctx.shadowBlur=12;
    ctx.font='bold 11px Courier New';ctx.textAlign='center';ctx.fillText('SHIP',0,-12);
    ctx.beginPath();ctx.moveTo(26,0);ctx.lineTo(14,-6);ctx.lineTo(14,6);ctx.closePath();ctx.fill();
    ctx.shadowBlur=0;ctx.restore();
    ctx.restore();
  }
}

function drawBullets(){
  for(const b of bullets){
    // Trail
    for(let t=1;t<b.trail.length;t++){
      ctx.globalAlpha=(t/b.trail.length)*0.45;
      ctx.fillStyle=b.col;ctx.shadowColor=b.col;ctx.shadowBlur=5;
      ctx.beginPath();ctx.arc(b.trail[t].x,b.trail[t].y,3*(t/b.trail.length),0,Math.PI*2);ctx.fill();}
    ctx.globalAlpha=1;ctx.shadowBlur=0;
    ctx.font='14px serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.shadowColor=b.col;ctx.shadowBlur=10;ctx.fillText(b.em,b.x,b.y);ctx.shadowBlur=0;}
}

function drawWaves(){
  for(const w of waveProj){ctx.globalAlpha=w.life/45;
    ctx.font='18px serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.shadowColor=w.color;ctx.shadowBlur=10;ctx.fillText('〰️',w.x,w.y);ctx.shadowBlur=0;ctx.globalAlpha=1;}
}

function drawEnemies(){
  for(const e of enemies){if(e.hp<=0)continue;
    const ex=e.x;if(ex<camX-80||ex>camX+W+80)continue;
    ctx.save();if(e.hitFlash>0&&Math.floor(e.hitFlash/3)%2)ctx.globalAlpha=0.25;
    if(e.stunned>0)ctx.globalAlpha=0.5;
    ctx.fillStyle='#330000';ctx.fillRect(ex,e.y-10,e.w,5);
    ctx.fillStyle='#ff4444';ctx.fillRect(ex,e.y-10,e.w*(e.hp/e.maxHp),5);
    ctx.font='26px serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.shadowColor=e.col;ctx.shadowBlur=10;ctx.fillText(e.e,ex+e.w/2,e.y+e.h/2);
    if(e.stunned>0){ctx.font='12px serif';ctx.fillText('💫',ex+e.w/2,e.y-14);}
    ctx.shadowBlur=0;ctx.restore();}
}

function drawFriendlies(){
  for(const f of friendlies){const fx=f.x;if(fx<camX-80||fx>camX+W+80)continue;
    ctx.fillStyle='#003300';ctx.fillRect(fx,f.y-10,f.w,5);
    ctx.fillStyle='#00ff41';ctx.fillRect(fx,f.y-10,f.w*(f.hp/f.maxHp),5);
    ctx.font='22px serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.shadowColor=f.col;ctx.shadowBlur=8;ctx.fillText(f.e,fx+f.w/2,f.y+f.h/2);
    ctx.font='7px Courier New';ctx.fillStyle='#00ff41';ctx.fillText('ALLY',fx+f.w/2,f.y-14);
    ctx.shadowBlur=0;}
}

function drawBoss(){
  if(!boss||!bossActive)return;
  const bx=boss.x;
  const pulse=1+0.05*Math.sin(Date.now()*0.005);
  ctx.save();ctx.translate(bx+boss.w/2,boss.y+boss.h/2);ctx.scale(pulse,pulse);
  ctx.font=`${boss.w*0.85}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.shadowColor=boss.col;ctx.shadowBlur=28;ctx.fillText(boss.e,0,0);ctx.shadowBlur=0;
  ctx.restore();
  if(boss.id==='aiCore'){
    ctx.strokeStyle='#ff0000';ctx.lineWidth=4;ctx.shadowColor='#ff0000';ctx.shadowBlur=18;
    ctx.strokeRect(bx,boss.y,boss.w,boss.h);ctx.shadowBlur=0;
    ctx.globalAlpha=0.22;for(let y=boss.y;y<boss.y+boss.h;y+=8){ctx.fillStyle='#ff0000';ctx.fillRect(bx,y,boss.w,2);}
    ctx.globalAlpha=1;}
}

function drawColls(){
  for(const c of collectibles){if(c.collected)continue;
    const cx=c.x;if(cx<camX-60||cx>camX+W+60)continue;
    ctx.font='17px serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.shadowColor='#e879f9';ctx.shadowBlur=10;ctx.fillText(c.e,cx,c.y+Math.sin(c.bob)*5);ctx.shadowBlur=0;}
}

function drawParticles(){
  for(const p of particles){ctx.globalAlpha=p.life/p.maxLife;
    ctx.fillStyle=p.col;ctx.shadowColor=p.col;ctx.shadowBlur=7;
    ctx.beginPath();ctx.arc(p.x,p.y,p.sz*(p.life/p.maxLife),0,Math.PI*2);ctx.fill();}
  ctx.globalAlpha=1;ctx.shadowBlur=0;}

function drawFloats(){
  for(const f of floatTexts){ctx.globalAlpha=f.life/88;ctx.fillStyle=f.col;
    ctx.shadowColor=f.col;ctx.shadowBlur=8;ctx.font='bold 14px Courier New';
    ctx.textAlign='center';ctx.fillText(f.txt,f.x,f.y);}
  ctx.globalAlpha=1;ctx.shadowBlur=0;}

// ── DRAW CHARACTER ──
function drawChar(){
  const cx=P.x+P.w/2;
  
  if(P.invincible>0&&Math.floor(P.invincible/6)%2===0)return;
  ctx.save();ctx.translate(cx,P.y);ctx.scale(P.facing,1);
  const wd=WORLDS[currentWorld];
  const gc=P.ohmActive?'#ffff00':shieldT>0?'#00aaff':wd.glow;

  // Shadow
  const sh=squatting?P.h*0.55:P.h;
  ctx.globalAlpha=0.18;ctx.fillStyle=gc;
  ctx.beginPath();ctx.ellipse(0,sh+4,18,5,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;

  // Rings
  if(shieldT>0||P.ohmActive){
    ctx.globalAlpha=0.22+0.14*Math.sin(Date.now()*0.009);
    ctx.strokeStyle=P.ohmActive?'#ffff00':'#00aaff';ctx.lineWidth=3;
    ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=18;
    ctx.beginPath();ctx.arc(0,sh/2-10,42,0,Math.PI*2);ctx.stroke();
    ctx.globalAlpha=1;ctx.shadowBlur=0;}
  if(phaseT>0)ctx.globalAlpha=0.38;

  // Squatting offset
  const yOff=squatting?P.h*0.35:0;

  // HEAD
  const headBob=P.walking?Math.sin(legPhase*2)*2.5:0;
  const hY=-P.h*0.12+headBob+yOff;
  ctx.font='34px serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.shadowColor=gc;ctx.shadowBlur=16;
  const h=P.head;
  if(h===':@]'||h===':@D'){ctx.font='bold 17px Courier New';ctx.fillStyle=gc;ctx.fillText(h,0,hY-14);}
  else ctx.fillText(h,0,hY-14);
  ctx.shadowBlur=0;

  // Gun in hand
  const gun=inventory[activeSlot];
  if(gun){ctx.font='16px serif';ctx.textAlign='left';ctx.textBaseline='middle';
    ctx.shadowColor=gun.bColor;ctx.shadowBlur=8;ctx.fillText(gun.icon,12,hY+12);ctx.shadowBlur=0;}

  // Torso
  ctx.strokeStyle=gc;ctx.lineWidth=5;ctx.lineCap='round';ctx.shadowColor=gc;ctx.shadowBlur=10;
  const tT=hY,tB=squatting?hY+16:hY+28;
  ctx.beginPath();ctx.moveTo(0,tT);ctx.lineTo(0,tB);ctx.stroke();

  // Arms
  const aS=P.walking||P.flying?Math.sin(legPhase)*18:0;
  ctx.beginPath();ctx.moveTo(0,tT+4);ctx.lineTo(-16-aS,tT+18+aS*0.3);ctx.stroke();
  ctx.beginPath();ctx.moveTo(0,tT+4);ctx.lineTo(16+aS,tT+18-aS*0.3);ctx.stroke();

  // Legs (shorter if squatting)
  const lS=P.walking?Math.sin(legPhase)*14:0;
  const lL=squatting?12:22;
  const lSpread=squatting?12:6;
  ctx.beginPath();ctx.moveTo(0,tB);ctx.lineTo(-lSpread+lS,tB+lL);ctx.stroke();
  ctx.beginPath();ctx.moveTo(0,tB);ctx.lineTo(lSpread-lS,tB+lL);ctx.stroke();

  // Feet
  ctx.fillStyle=gc;ctx.shadowColor=gc;ctx.shadowBlur=7;
  ctx.beginPath();ctx.arc(-lSpread+lS,tB+lL+4,5,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(lSpread-lS,tB+lL+4,5,0,Math.PI*2);ctx.fill();

  // HP pips
  ctx.shadowBlur=0;ctx.font='11px serif';ctx.textAlign='left';ctx.textBaseline='top';
  for(let i=0;i<P.maxHp;i++){ctx.globalAlpha=i<P.hp?1:0.22;ctx.fillText('❤',i*13-P.w/2,tT-30);}
  ctx.globalAlpha=1;
  if(P.flying){ctx.font='12px serif';ctx.textAlign='center';ctx.fillText('🌬️',22,tT+5);}
  if(!P.onGround&&P.vy<-3){ctx.globalAlpha=Math.min(1,Math.abs(P.vy)/10);
    ctx.font='bold 9px Courier New';ctx.fillStyle=gc;ctx.textAlign='center';
    ctx.fillText('SPLASH!',0,tT-28);ctx.globalAlpha=1;}
  ctx.restore();
}

function drawGameOver(){
  ctx.fillStyle='rgba(0,0,0,0.84)';ctx.fillRect(0,0,W,H);
  ctx.textAlign='center';ctx.font='bold clamp(2.5rem,6vw,4rem) Courier New';
  ctx.fillStyle='#ff4444';ctx.shadowColor='#ff0000';ctx.shadowBlur=28;ctx.fillText('GAME OVER',W/2,H/2-60);
  ctx.font='clamp(1.1rem,3vw,1.6rem) Courier New';ctx.fillStyle='#00ff41';ctx.shadowColor='#00ff41';ctx.shadowBlur=14;
  ctx.fillText('SCORE: '+score,W/2,H/2);
  ctx.fillStyle='#a78bfa';ctx.font='0.95rem Courier New';ctx.shadowColor='#9b30ff';
  ctx.fillText('↑/SPACE to restart  ·  ESC for menu',W/2,H/2+50);ctx.shadowBlur=0;
}

// ── HUD UPDATES ──
function updateGunHUD(){
  for(let i=0;i<4;i++){
    const s=inventory[i];const el=document.getElementById('gs'+i);
    if(!s){el.className='gs emp';document.getElementById('gi'+i).textContent='·';
      document.getElementById('gn'+i).textContent='EMPTY';document.getElementById('ga'+i).textContent='—';continue;}
    el.className='gs'+(i===activeSlot?' act':'');
    document.getElementById('gi'+i).textContent=s.icon;
    document.getElementById('gn'+i).textContent=s.name;
    const ae=document.getElementById('ga'+i);
    if(s.ammo===Infinity){ae.textContent='∞';ae.className='ga inf';}
    else{ae.textContent=s.ammo+'/'+s.maxAmmo;ae.className='ga '+(s.ammo<=Math.ceil(s.maxAmmo*0.25)?'low':'ok');}
  }
  const ab=HEAD_AB[P.head];
  if(ab)document.getElementById('abilityBar').textContent=
    P.abilityCd>0?`✨ ${ab.name}: ${P.abilityCd}`:`✨ ${ab.name}: READY [X]`;
}
function updateHUD2(){
  document.getElementById('hSc').textContent='🎃 '+score;
  document.getElementById('hLv').textContent='💚×'+lives;
  document.getElementById('hHp').textContent='❤'.repeat(Math.max(0,P.hp));
  document.getElementById('hWr').textContent=WORLDS[currentWorld].name;
  const pct=Math.min(100,score/500*100);
  document.getElementById('progBar').style.width=pct+'%';
  document.getElementById('progTxt').textContent=score+' / 500';
}

