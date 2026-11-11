// Headless check of the shared right-click explanations (embed/rxplanation.js) on rudventur.com and the linked pages.
// Every visible button has its own explanation, right-click on a button shows the popup, right-click on links and
// text fields keeps the browser menu, a long press works on a phone, and no page throws a script error.
// Serves local clones that sit next to each other (RudVentur.com, windows13, LuxWin13, map-merger-venti) in RC_ROOT.
// Run: CHROME_PATH=/usr/bin/google-chrome RC_ROOT=/path/to/clones/ node embed/tests/rxplanation-headless.mjs
import puppeteer from 'puppeteer-core'; import fs from 'fs'; import path from 'path';
const mode='local';
const ROOT = (process.env.RC_ROOT || new URL('../../../', import.meta.url).pathname).replace(/\/?$/,'/'); const SHOTS = process.env.SHOTS || '/tmp';
const MAP = { 'https://rudventur.github.io/map-merger-venti/': ROOT+'map-merger-venti/', 'https://rudventur.github.io/RudVentur.com/': ROOT+'RudVentur.com/',
  'https://rudventur.com/': ROOT+'RudVentur.com/', 'https://rudventur.github.io/windows13/': ROOT+'windows13/', 'https://rudventur.github.io/LuxWin13/': ROOT+'LuxWin13/' };
const TY={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/json'};
const PAGES=[['home','https://rudventur.com/'],['w13master','https://rudventur.github.io/windows13/WINDOWS13-MASTER.html'],['w13index','https://rudventur.github.io/windows13/'],
 ['luxwin13','https://rudventur.github.io/LuxWin13/'],['translator','https://rudventur.github.io/map-merger-venti/translator_v7.html'],['globalchat','https://rudventur.github.io/map-merger-venti/global-chat.html']];
const b=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox']});
let failed=0; const sleep=ms=>new Promise(r=>setTimeout(r,ms)); const report={};
for (const [name,u] of PAGES) for (const w of [1440,1024,390]) {
  const p=await b.newPage(); const errs=[];
  p.on('pageerror',e=>errs.push(e.message)); p.on('dialog',d=>d.accept().catch(()=>{}));
  if (mode==='local') { await p.setRequestInterception(true);
    p.on('request',r=>{ const url=r.url().split('?')[0].split('#')[0]; const k=Object.keys(MAP).find(k=>url.startsWith(k));
      if(k){ let f=MAP[k]+url.slice(k.length); if(f.endsWith('/'))f+='index.html';
        if(fs.existsSync(f)) return r.respond({status:200,contentType:TY[path.extname(f)]||'application/octet-stream',body:fs.readFileSync(f)});
        return r.respond({status:404,body:''}); } r.continue(); }); }
  await p.setViewport({width:w,height:w>500?(w>1100?900:768):844});
  await p.goto(u,{waitUntil:'load',timeout:60000}); await sleep(3500);
  if (name==='w13master'||name==='luxwin13') { await p.evaluate(n=>{ const c=document.getElementById('channelInput'); if(c)c.value='overlap-test';
      if(n==='w13master'){ showLoginPath('local'); document.getElementById('localName').value='tester'; document.getElementById('localPass').value='tester-pass-1'; }
      document.getElementById('enterBtn').click(); }, name); await sleep(3000); }

  const r=await p.evaluate(async()=>{
    const out={missing:[],shown:null,link:null,input:null,generic:0,total:0};
    if(!window.rvExplain) return {noScript:true};
    const vis=e=>{const c=getComputedStyle(e),b=e.getBoundingClientRect();return c.display!=='none'&&c.visibility!=='hidden'&&b.width>2&&b.height>2;};
    const btns=[...document.querySelectorAll('button,[role=button],input[type=button],input[type=submit],[data-explain]')].filter(vis).filter(e=>!e.closest('#rv-explain,.leaflet-control-attribution'));
    out.total=btns.length;
    for(const b of btns){ const t=rvExplain.text(b); if(/runs this action on the page/.test(t)){out.generic++; out.missing.push((b.id?'#'+b.id:b.className.toString().split(' ')[0])+' "'+(b.innerText||'').trim().slice(0,20)+'"');} }
    const ev=(el)=>{const b=el.getBoundingClientRect();const e=new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:b.left+4,clientY:b.top+4,button:2});el.dispatchEvent(e);return e.defaultPrevented;};
    const first=btns.find(b=>b.tagName==='BUTTON')||btns[0];
    if(first){ev(first); const x=document.getElementById('rv-explain'); out.shown=x&&x.classList.contains('open')?x.innerText.slice(0,120):null;}
    const a=[...document.querySelectorAll('a[href]')].find(vis); if(a) out.link=ev(a);
    const i=[...document.querySelectorAll('input[type=text],textarea,input:not([type])')].find(vis); if(i) out.input=ev(i);
    return out;});
  // long-press on a phone
  let lp=null;
  if(w===390 && !r.noScript){ lp=await p.evaluate(async()=>{ rvExplain.hide(); const b=[...document.querySelectorAll('button')].find(e=>e.getBoundingClientRect().width>2&&getComputedStyle(e).visibility!=='hidden');
      if(!b) return null; const R=b.getBoundingClientRect(); const t=new Touch({identifier:1,target:b,clientX:R.left+3,clientY:R.top+3});
      b.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,cancelable:true,touches:[t],changedTouches:[t]}));
      await new Promise(z=>setTimeout(z,800)); return document.getElementById('rv-explain')?.classList.contains('open')||false; }); }
  console.log(name,w,'buttons',r.total,'without own text',r.generic,'popup',JSON.stringify(r.shown),'link blocked',r.link,'input blocked',r.input,'longpress',lp,'errors',errs.length, r.noScript?'NO SCRIPT':'');
  if(r.noScript||r.generic||!r.shown||r.link||r.input||lp===false||errs.length) failed++;
  if(w===1440) r.missing.forEach(m=>console.log('    generic:',m)); errs.forEach(x=>console.log('   ERROR',x.slice(0,150)));
  await p.evaluate(()=>{const b=[...document.querySelectorAll('[data-explain]')].find(e=>{const r=e.getBoundingClientRect();return r.width>2&&r.top>0&&r.top<innerHeight-120&&getComputedStyle(e).visibility!=='hidden'});
     if(b&&window.rvExplain){ const r=b.getBoundingClientRect(); b.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:r.left+r.width/2,clientY:r.top+r.height/2,button:2})); }});
  await sleep(300); await p.screenshot({path:`${SHOTS}/rightclick-${name}-${w}.png`});
  await p.close(); }
await b.close(); console.log(failed?failed+' failed':'all passed'); process.exit(failed?1:0);
