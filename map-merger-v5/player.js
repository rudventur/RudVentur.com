// ═══════════════════════════════════════════════════════════════
//  player.js — All vehicle sprites
// ═══════════════════════════════════════════════════════════════

function drawPlayer() {
  const px = cv.width / 2, py = cv.height / 2;
  const moving = Object.values(G.keys).some(Boolean);
  const bob = moving ? Math.sin(G.frameN * 0.18) * 2 : 0;

  // ── UFO ──
  if (G.veh === 'ufo') {
    ctx.fillStyle = '#cc44ff'; ctx.beginPath(); ctx.ellipse(px, py + bob, 22, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(200,100,255,0.35)'; ctx.beginPath(); ctx.ellipse(px, py + bob - 8, 11, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ff44ff'; ctx.lineWidth = 2; ctx.shadowColor = '#ff44ff'; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.ellipse(px, py + bob, 22, 9, 0, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0;
    if (moving) { ctx.fillStyle = 'rgba(255,200,50,0.12)'; ctx.beginPath(); ctx.moveTo(px-9,py+bob+9); ctx.lineTo(px+9,py+bob+9); ctx.lineTo(px+17,py+bob+38); ctx.lineTo(px-17,py+bob+38); ctx.closePath(); ctx.fill(); }
    return;
  }

  // ── PLANE (faces heading, shows aircraft type) ──
  if (G.veh === 'plane') {
    const altOff = planeAirborne ? -10 : 0;
    const headRad = (planeHeading - 90) * Math.PI / 180;
    const ac = curAircraft;
    ctx.save(); ctx.translate(px, py + altOff);
    if (planeAirborne) { ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(0, 22, 16, 4, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.rotate(headRad);
    // Fuselage
    ctx.fillStyle = '#e0e8f0'; ctx.beginPath(); ctx.ellipse(0, 0, 22, 7, 0, 0, Math.PI * 2); ctx.fill();
    // Wings
    ctx.fillStyle = '#b8c4d0';
    ctx.beginPath(); ctx.moveTo(-2,-3); ctx.lineTo(5,-28); ctx.lineTo(9,-25); ctx.lineTo(5,-3); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-2,3); ctx.lineTo(5,28); ctx.lineTo(9,25); ctx.lineTo(5,3); ctx.closePath(); ctx.fill();
    // Tail
    ctx.fillStyle = '#9aa8b8';
    ctx.beginPath(); ctx.moveTo(-16,-2); ctx.lineTo(-22,-12); ctx.lineTo(-24,-10); ctx.lineTo(-20,-2); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-16,2); ctx.lineTo(-22,12); ctx.lineTo(-24,10); ctx.lineTo(-20,2); ctx.closePath(); ctx.fill();
    // Tail fin (aircraft color)
    ctx.fillStyle = ac.color;
    ctx.beginPath(); ctx.moveTo(-16,0); ctx.lineTo(-22,0); ctx.lineTo(-24,-7); ctx.lineTo(-18,-2); ctx.closePath(); ctx.fill();
    // Cockpit
    ctx.fillStyle = '#00bfff'; ctx.beginPath(); ctx.ellipse(16, 0, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
    // Engines when airborne
    if (planeAirborne && moving) {
      const f = 0.4 + Math.random() * 0.3;
      ctx.fillStyle = 'rgba(255,140,0,' + f + ')';
      ctx.beginPath(); ctx.ellipse(-8, -16, 6 + Math.random() * 3, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(-8, 16, 6 + Math.random() * 3, 3, 0, 0, Math.PI * 2); ctx.fill();
      // Afterburner for fast aircraft
      if (ac.kmh > 2000) {
        ctx.fillStyle = 'rgba(255,60,0,' + (f * 0.8) + ')';
        ctx.beginPath(); ctx.ellipse(-14, -16, 10 + Math.random() * 5, 2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(-14, 16, 10 + Math.random() * 5, 2, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
    // Glow outline in aircraft color
    ctx.strokeStyle = planeAirborne ? ac.color + '88' : 'rgba(0,255,65,0.25)';
    ctx.lineWidth = 1; ctx.shadowColor = ac.color; ctx.shadowBlur = planeAirborne ? 12 : 3;
    ctx.beginPath(); ctx.ellipse(0, 0, 22, 7, 0, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0;
    ctx.restore();
    // Status HUD
    if (planeAirborne) {
      ctx.font = "8px 'Press Start 2P'"; ctx.fillStyle = ac.color; ctx.textAlign = 'center';
      ctx.fillText(ac.name, px, py + altOff - 32);
      ctx.font = "6px 'Press Start 2P'"; ctx.fillStyle = 'rgba(0,191,255,0.5)';
      ctx.fillText(Math.floor(planeAltitude) + ' ft \u00B7 ' + ac.kmh + ' km/h \u00B7 HDG ' + Math.round((planeHeading + 360) % 360) + '\u00B0', px, py + altOff - 22);
    } else if (nearAirport) {
      ctx.font = "7px 'Press Start 2P'"; ctx.fillStyle = '#ffe600'; ctx.textAlign = 'center';
      ctx.fillText(ac.name + ' @ AIRPORT', px, py - 30);
    }
    return;
  }

  // ── TRAIN ──
  if (G.veh === 'train') {
    if (moving) { ctx.strokeStyle='rgba(255,102,0,0.15)';ctx.lineWidth=1;for(let i=-30;i<=30;i+=10){const o=(G.frameN*2+i)%60-30;ctx.beginPath();ctx.moveTo(px-18,py+bob+o);ctx.lineTo(px+18,py+bob+o);ctx.stroke()}ctx.strokeStyle='rgba(255,102,0,0.25)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px-10,py-30);ctx.lineTo(px-10,py+30);ctx.stroke();ctx.beginPath();ctx.moveTo(px+10,py-30);ctx.lineTo(px+10,py+30);ctx.stroke(); }
    ctx.fillStyle='#cc4400';ctx.beginPath();ctx.moveTo(px-16,py+bob-8);ctx.lineTo(px-12,py+bob-12);ctx.lineTo(px+12,py+bob-12);ctx.lineTo(px+16,py+bob-8);ctx.lineTo(px+16,py+bob+12);ctx.lineTo(px-16,py+bob+12);ctx.closePath();ctx.fill();
    ctx.fillStyle='#ffcc00';ctx.fillRect(px-11,py+bob-7,8,7);ctx.fillRect(px+3,py+bob-7,8,7);
    ctx.fillStyle='#ffe600';ctx.shadowColor='#ffe600';ctx.shadowBlur=8;ctx.beginPath();ctx.arc(px,py+bob-13,3,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    ctx.fillStyle='#333';ctx.beginPath();ctx.arc(px-9,py+bob+14,5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(px+9,py+bob+14,5,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#ff6600';ctx.lineWidth=2;ctx.shadowColor='#ff6600';ctx.shadowBlur=9;ctx.strokeRect(px-16,py+bob-12,32,24);ctx.shadowBlur=0;
    if(moving){for(let i=0;i<3;i++){const age=(G.frameN*0.05+i*0.3)%1,sx=px+Math.sin(G.frameN*0.1+i)*4,sy=py+bob-16-age*25;ctx.fillStyle='rgba(180,180,180,'+(0.3-age*0.3)+')';ctx.beginPath();ctx.arc(sx,sy,3+age*6,0,Math.PI*2);ctx.fill()}}
    return;
  }

  // ── BOAT (wave animation) ──
  if (G.veh === 'boat') {
    const w=Math.sin(G.frameN*0.08)*2;
    ctx.fillStyle='#4488ff';ctx.beginPath();ctx.moveTo(px-16,py+w);ctx.lineTo(px+16,py+w);ctx.lineTo(px+10,py+w+14);ctx.lineTo(px-10,py+w+14);ctx.closePath();ctx.fill();
    ctx.fillStyle='#fff';ctx.fillRect(px-1,py+w-14,3,16);
    ctx.fillStyle='rgba(255,255,255,0.45)';ctx.beginPath();ctx.moveTo(px+2,py+w-14);ctx.lineTo(px+14,py+w-4);ctx.lineTo(px+2,py+w+2);ctx.closePath();ctx.fill();
    if(moving){ctx.strokeStyle='rgba(100,180,255,0.2)';ctx.lineWidth=1;for(let i=1;i<=3;i++){ctx.beginPath();ctx.arc(px,py+w+14,8+i*6,0.2,Math.PI-0.2);ctx.stroke()}}
    // Water indicator
    if (boatNearWater) { ctx.font="7px 'Press Start 2P'";ctx.fillStyle='#4488ff';ctx.textAlign='center';ctx.fillText('ON WATER',px,py+w-20); }
    else { ctx.font="7px 'Press Start 2P'";ctx.fillStyle='#ff4444';ctx.textAlign='center';ctx.fillText('FIND WATER',px,py+w-20); }
    return;
  }

  // ── CAR ──
  if (G.veh === 'car') {
    ctx.fillStyle='#3366ff';ctx.fillRect(px-17,py+bob-6,34,15);ctx.fillStyle='rgba(150,220,255,0.65)';ctx.fillRect(px-9,py+bob-10,18,9);
    ctx.fillStyle='#222';ctx.beginPath();ctx.arc(px-9,py+bob+11,5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(px+9,py+bob+11,5,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#6688ff';ctx.lineWidth=1.5;ctx.shadowColor='#4466ff';ctx.shadowBlur=7;ctx.strokeRect(px-17,py+bob-6,34,15);ctx.shadowBlur=0;return;
  }

  // ── BUS ──
  if (G.veh === 'bus') {
    ctx.fillStyle='#ff4400';ctx.fillRect(px-21,py+bob-13,42,24);ctx.fillStyle='#cc3300';ctx.fillRect(px-21,py+bob+2,42,3);
    ctx.fillStyle='rgba(150,220,255,0.55)';for(let i=-13;i<16;i+=10)ctx.fillRect(px+i,py+bob-9,7,9);
    ctx.fillStyle='rgba(255,255,255,0.2)';ctx.fillRect(px+15,py+bob-9,5,18);
    ctx.fillStyle='#ffe600';ctx.font="6px 'Press Start 2P'";ctx.textAlign='center';ctx.fillText('42',px-14,py+bob-4);
    ctx.fillStyle='#222';ctx.beginPath();ctx.arc(px-12,py+bob+13,5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(px+12,py+bob+13,5,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#ff6622';ctx.lineWidth=2;ctx.shadowColor='#ff4400';ctx.shadowBlur=8;ctx.strokeRect(px-21,py+bob-13,42,24);ctx.shadowBlur=0;return;
  }

  // ── WALK / BIKE / SCOOTER ──
  const step=moving?Math.sin(G.frameN*0.22)*4:0;
  ctx.fillStyle='rgba(0,0,0,0.35)';ctx.beginPath();ctx.ellipse(px,py+12,7,3,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#1a1a22';ctx.fillRect(px-5,py+bob+2,4,8+step);ctx.fillRect(px+1,py+bob+2,4,8-step);
  if(G.veh==='bike'||G.veh==='scooter'){ctx.strokeStyle=G.veh==='scooter'?'#ff6600':'#888';ctx.lineWidth=2;ctx.beginPath();ctx.arc(px-11,py+bob+14,6,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(px+11,py+bob+14,6,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(px-11,py+bob+14);ctx.lineTo(px,py+bob+4);ctx.lineTo(px+11,py+bob+14);ctx.stroke()}
  ctx.fillStyle='#ffe600';ctx.fillRect(px-6,py+bob-9,12,11);
  ctx.fillStyle='#ffcc88';ctx.fillRect(px-4,py+bob-17,8,8);
  ctx.fillStyle='#000';
  if(G.dir==='down'){ctx.fillRect(px-2,py+bob-14,2,2);ctx.fillRect(px+1,py+bob-14,2,2)}
  if(G.dir==='up'){ctx.fillRect(px-2,py+bob-11,2,2);ctx.fillRect(px+1,py+bob-11,2,2)}
  if(G.dir==='left')ctx.fillRect(px-3,py+bob-13,2,2);
  if(G.dir==='right')ctx.fillRect(px+2,py+bob-13,2,2);
  ctx.strokeStyle='#00ff41';ctx.lineWidth=1;ctx.shadowColor='#00ff41';ctx.shadowBlur=7;ctx.strokeRect(px-6,py+bob-17,12,26);ctx.shadowBlur=0;
}
