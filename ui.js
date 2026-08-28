function dawnPick(rows){
  const hits=[];
  for(const r of rows){
    const hrs=(r.next||[]).filter(h=>{
      const hr=hourMvt(h.ms);
      return hr>=6&&hr<=11 && ["offshore","cross-off","glassy"].includes(h.rel) && h.flow!=="follow" && h.score>=5.0;
    });
    if(!hrs.length) continue;
    const b=hrs.reduce((a,h)=>h.score>a.score?h:a);
    hits.push({row:r,h:b});
  }
  return hits.sort((a,b)=>b.h.score-a.h.score);
}
function verdict(best, dawn){
  if(!best) return {tag:"HOLD", cls:"ok", line:"Models still spinning up."};
  const n=best.now;
  const d=dawn[0];
  if(n.score>=7 && ["offshore","cross-off","glassy"].includes(n.rel) && n.flow!=="follow")
    return {tag:"GO", cls:"good", line:best.spot.n+" is on \u00b7 "+rangeFt(n.Hb)+" \u00b7 "+n.rel+" "+Math.round(n.wkn)+" kn \u00b7 "+n.tb+" tide. Leave now."};
  if(d && d.h.score>=6.5)
    return {tag:"DAWN", cls:"good", line:"Best pulse is morning. "+d.row.spot.n+" "+fmt(d.h.ms,{weekday:"short",hour:"2-digit",minute:"2-digit",hour12:false})+" \u00b7 "+rangeFt(d.h.Hb)+" \u00b7 "+d.h.rel+". Jetty 06:15."};
  if(n.score>=5.2 && n.rel!=="onshore")
    return {tag:"HOLD", cls:"ok", line:best.spot.n+" is Fun, not clean. "+rangeFt(n.Hb)+" \u00b7 "+n.rel+" \u00b7 wait ~"+n.wait+" min."};
  return {tag:"SKIP", cls:"bad", line:"No clean Fun window on the board. "+(best?best.spot.n+" "+best.now.label+" \u00b7 "+best.now.rel:"Flat chain")+"."};
}
function rangeFt(Hb){
  const a=Math.max(0.5, ft(Hb*0.82)), b=ft(Hb*1.12);
  return (a===b?a:a+"\u2013"+b)+" ft";
}
function dots(score){
  const n=Math.max(0,Math.min(5,Math.round(score/2)));
  return "<div class=\"dots\">"+[1,2,3,4,5].map(i=>{
    const cls=i<=n?(score>=7?"on":"mid"):"";
    return "<i class=\""+cls+"\"></i>";
  }).join("")+"</div>";
}
function spark(vals,w,h,color){
  w=w||160; h=h||36; color=color||"#00e8c4";
  if(!vals.length) return "";
  const mx=Math.max(...vals,0.2), mn=0;
  const pts=vals.map((v,i)=>{
    const x=(vals.length===1?w/2:i/(vals.length-1)*w);
    const y=h-3-((v-mn)/(mx-mn||1))*(h-6);
    return x.toFixed(1)+","+y.toFixed(1);
  }).join(" ");
  return "<svg class=\"chart\" width=\""+w+"\" height=\""+h+"\" viewBox=\"0 0 "+w+" "+h+"\" preserveAspectRatio=\"none\"><polyline fill=\"none\" stroke=\""+color+"\" stroke-width=\"1.8\" points=\""+pts+"\"/></svg>";
}
function dualChart(hours){
  const w=320,h=88;
  if(!hours.length) return "";
  const hs=hours.map(x=>x.Hb||0), wn=hours.map(x=>x.wkn||0), td=hours.map(x=>x.th||0);
  const mxH=Math.max(...hs,0.4), mxW=Math.max(...wn,8);
  const line=(arr,mx,col,w2)=>{
    const pts=arr.map((v,i)=>{
      const x=i/(arr.length-1||1)*w;
      const y=h-8-(Math.max(0,v)/mx)*(h-16);
      return x.toFixed(1)+","+y.toFixed(1);
    }).join(" ");
    return "<polyline fill=\"none\" stroke=\""+col+"\" stroke-width=\""+w2+"\" points=\""+pts+"\"/>";
  };
  const tide=td.map((v,i)=>{
    const x=i/(td.length-1||1)*w;
    const y=h/2-(v/0.6)*(h/3);
    return x.toFixed(1)+","+y.toFixed(1);
  }).join(" ");
  return "<svg class=\"chart\" viewBox=\"0 0 "+w+" "+h+"\" preserveAspectRatio=\"none\">"+
    line(hs,mxH,"#00e8c4",2)+
    line(wn,mxW,"#d4a84b",1.2)+
    "<polyline fill=\"none\" stroke=\"#6d9a93\" stroke-dasharray=\"3 3\" stroke-width=\"1\" points=\""+tide+"\"/>"+
    "</svg><p class=\"legend\"><span style=\"color:var(--acc)\">Face ft</span><span style=\"color:var(--ok)\">Wind kn</span><span>Tide</span></p>";
}
function swellRows(p){
  const mx=Math.max(p.Hs,p.s2||0,p.s3||0,p.ww||0,0.4);
  const row=(lab,H,T,D,op)=> !H||H<0.08?"":"<div class=\"swellrow\"><span>"+lab+"</span><div class=\"trk\"><b style=\"width:"+Math.min(100,H/mx*100)+"%;opacity:"+(op||1)+"\"></b></div><span class=\"num\">"+ft(H)+"ft \u00b7 "+Math.round(T||0)+"s "+card(D||0)+"</span></div>";
  return row("Primary",p.Hs,p.T,p.dir,1)+row("Secondary",p.s2,p.s2t,p.s2d,.7)+row("Tertiary",p.s3,p.s3t,p.s3d,.45)+row("Windsea",p.ww,p.wwp,p.wwd,.6);
}
function dayStrip(hours){
  const days={};
  for(const h of hours){const d=h.iso.slice(0,10); if(!days[d]||h.score>days[d].score) days[d]=h;}
  return Object.keys(days).sort().slice(0,7).map((k,i)=>{
    const d=days[k];
    const conf=i<=1?"call":i<=3?"lean":"hint";
    return "<div class=\"d\"><div class=\"k\">"+fmt(d.ms,{weekday:"short"})+"</div><div class=\"sz "+tone(d.label)+"\">"+ft(d.Hb||d.Hs)+"</div><div class=\"mut\">"+Math.round(d.T)+"s</div><div class=\"mut\">"+conf+"</div></div>";
  }).join("");
}
function render(){
  const rows=ranked();
  const q=state.q.trim().toLowerCase();
  const vis=rows.filter(r=>{
    if(state.atoll && r.spot.a!==state.atoll) return false;
    if(!q) return true;
    return r.spot.n.toLowerCase().includes(q)||r.spot.isl.toLowerCase().includes(q)||r.spot.a.includes(q)||r.spot.brk.includes(q);
  });
  const best=rows[0];
  const dawn=dawnPick(rows);
  const v=verdict(best, dawn);
  const home=rows.find(r=>r.spot.slug===state.sel)||best;
  const show=home||best;
  if(show){
    const p=show.now;
    const hrs=show.next.slice(0,24);
    document.getElementById("call").innerHTML=
      '<p class="k">'+show.spot.n+' \u00b7 '+show.spot.isl+' \u00b7 '+show.spot.brk+' \u00b7 '+fmt(Date.now(),{weekday:"short",hour:"2-digit",minute:"2-digit",hour12:false})+' MVT</p>'+
      '<p class="hero-ft '+tone(p.label)+'">'+rangeFt(p.Hb)+'<small>'+p.label+'</small></p>'+
      dots(p.score)+
      '<p class="'+v.cls+'" style="margin:0">'+v.tag+' \u00b7 '+v.line+'</p>'+
      '<div class="meta"><div class="b"><p class="k">Swell</p><p class="num">'+ft(p.Hs)+' ft \u00b7 '+Math.round(p.T)+'s '+card(p.dir)+'</p><p class="mut">'+p.src+'</p></div>'+
      '<div class="b"><p class="k">Wind</p><p class="num">'+Math.round(p.wkn)+' kn '+card(p.wdir)+'</p><p class="mut">'+p.rel+(p.rain>0.2?' \u00b7 rain':'')+'</p></div>'+
      '<div class="b"><p class="k">Tide / flow</p><p class="num">'+p.tb+' '+(p.th>=0?'+':'')+p.th.toFixed(2)+'m</p><p class="mut">'+p.flow+' '+p.ckn.toFixed(1)+' kn</p></div></div>'+
      '<p class="k" style="margin-top:14px">24 h \u00b7 face / wind / tide</p>'+dualChart(hrs)+
      '<p class="k" style="margin-top:12px">Swell split</p>'+swellRows(p)+
      '<p class="k" style="margin-top:12px">7-day \u00b7 best hour \u00b7 ft face</p>'+
      '<div class="daystrip">'+dayStrip(show.next.concat((state.gfs[show.spot.fk]||[]).map(x=>({...x,Hb:x.Hs,score:x.Hs*3,label:x.Hs>1.2?"Fun":"Small",iso:x.iso,ms:x.ms,T:x.T}))))+'</div>';
  } else {
    document.getElementById("call").innerHTML='<p class="mut">Waiting on first cell\u2026</p>';
  }
  if(best){
    const chop=best.now.ww/Math.max(best.now.Hs,0.2);
    const mon=best.now.wkn>=12 && inArc(best.now.wdir,200,280);
    const atAvg=AT.map(([id,lab])=>{
      const list=rows.filter(r=>r.spot.a===id);
      const avg=list.length?list.reduce((s,r)=>s+r.now.score,0)/list.length:0;
      return {id,lab,avg};
    }).sort((a,b)=>b.avg-a.avg);
    const fun48=rows.reduce((n,r)=>n+(r.sessions[0]?1:0),0);
    document.getElementById("brief").innerHTML=
      '<p class="k">Analyst note</p>'+
      '<p style="margin:8px 0 0">'+show.now.src+'. '+(mon?'SW monsoon is filling in \u2014 east-facing and sheltered rights first.':'Lighter wind layer \u2014 glass-off possible 06\u201309.')+' Chop '+chop.toFixed(2)+' \u00b7 '+(chop>0.55?'windsea on the face':'groundswell holding')+'.</p>'+
      '<p class="mut" style="margin:8px 0 0">'+atAvg[0].lab+' leads the chain ('+atAvg[0].avg.toFixed(1)+'). '+fun48+' reefs hold a Fun block in 48h. Day 1\u20132 is the call; after that it is a lean.</p>';
  }
  document.getElementById("boat").innerHTML=dawn.length?dawn.slice(0,6).map(d=>
    '<div class="scard" data-slug="'+d.row.spot.slug+'">'+ 
    '<div><b>'+d.row.spot.n+'</b><br><span class="mut">'+fmt(d.h.ms,{weekday:"short",hour:"2-digit",hour12:false})+' \u00b7 '+d.h.rel+' \u00b7 '+d.h.flow+'</span></div>'+
    '<div class="num '+tone(d.h.label)+'" style="text-align:right">'+rangeFt(d.h.Hb)+'<br>'+d.h.score.toFixed(1)+'</div></div>'
  ).join(""):'<p class="mut">No clean 06\u201311 window. Stay in or wait the next pulse.</p>';
  const sess=rows.flatMap(r=>r.sessions.slice(0,1).map(s=>({...s,name:r.spot.n,slug:r.spot.slug,row:r}))).sort((a,b)=>b.score-a.score).slice(0,6);
  document.getElementById("sessions").innerHTML=sess.length?sess.map(s=>
    '<div class="scard" data-slug="'+s.slug+'"><div><b>'+s.name+'</b><br><span class="mut">'+fmt(Date.parse(s.start+"+05:00"),{weekday:"short",hour:"2-digit",hour12:false})+' \u00b7 '+s.hrs+'h</span></div><div class="num good" style="text-align:right">'+s.score.toFixed(1)+'</div></div>'
  ).join(""):'<p class="mut">No Fun-or-better block in 48h.</p>';
  document.getElementById("atolls").innerHTML='<span class="chip '+(state.atoll===""?"on":"")+'" data-at="">All</span>'+AT.map(([id,lab])=>{
    const list=rows.filter(r=>r.spot.a===id);
    const avg=list.length?list.reduce((s,r)=>s+r.now.score,0)/list.length:0;
    return '<span class="chip '+(state.atoll===id?"on":"")+'" data-at="'+id+'">'+lab+' '+avg.toFixed(1)+'</span>';
  }).join("");
  document.querySelectorAll("#atolls .chip").forEach(ch=>ch.onclick=()=>{state.atoll=ch.dataset.at;render();});
  document.getElementById("tbl").innerHTML=vis.map(r=>{
    const p=r.now;
    const sp=spark(r.next.slice(0,24).map(h=>h.Hb),140,32);
    return '<div class="scard '+(r.spot.slug===state.sel?"sel":"")+'" data-slug="'+r.spot.slug+'">'+ 
      '<div><b>'+r.spot.n+'</b> <span class="mut">'+r.spot.brk+(r.spot.chan?' \u00b7 kandu':'')+'</span><br>'+
      '<span class="mut">'+p.rel+' \u00b7 '+Math.round(p.wkn)+' kn \u00b7 '+p.tb+' \u00b7 '+p.flow+'</span><br>'+sp+'</div>'+
      '<div style="text-align:right"><div class="num '+tone(p.label)+'" style="font-size:20px">'+rangeFt(p.Hb)+'</div>'+
      '<div class="mut">'+p.label+' \u00b7 '+Math.round(p.T)+'s '+card(p.dir)+'</div></div></div>';
  }).join("");
  document.querySelectorAll(".scard[data-slug]").forEach(el=>el.onclick=()=>{
    state.sel=el.dataset.slug; try{localStorage.setItem("kandu:sel",state.sel)}catch(e){}
    showTab("spot"); render();
  });
  const sel=show;
  if(sel){
    const strip=sel.next.slice(0,24);
    const longHours=(state.gfs[sel.spot.fk]||[]).map(p0=>{
      const wx=nearest(state.wind[sel.spot.fk],p0.ms);
      const c=nearest(state.cur[sel.spot.fk],p0.ms);
      const wkn=wx?wx.kn:8, wdir=wx?wx.dir:p0.wwd;
      const th=tideH(p0.ms,sel.spot.lat)+(c?c.slAn*0.35:0);
      const ckn=c?c.kn:0, crel=c?currentRel(p0.dir,c.dir):"slack";
      const rr=rate(sel.spot,{h:p0.Hs,dir:p0.dir,T:p0.T,wkn,wdir,tb:band(th),hour:hourMvt(p0.ms),ckn,crel,ww:p0.ww});
      return Object.assign({},p0,rr,{Hb:wrapHb(sel.spot,p0.Hs,ckn,crel,p0.T),ms:p0.ms,iso:p0.iso});
    });
    const useLong=longHours.length?longHours:sel.next;
    const specHrs=sel.next.slice(0,36);
    const specRows=BANDS.map((b,bi)=>{
      const cells=specHrs.map(h=>{
        const e=specEnergy(h)[bi];
        return '<i style="background:var(--acc);opacity:'+(0.12+e*0.88)+'"></i>';
      }).join("");
      return '<div class="lab">'+b[0]+'\u2013'+(b[1]<22?b[1]+'s':b[0]+'+')+'</div><div class="lane">'+cells+'</div>';
    }).join("");
    document.getElementById("detail").innerHTML=
      '<p class="k">'+sel.spot.n+' \u00b7 '+sel.spot.isl+' \u00b7 '+sel.spot.skill+' \u00b7 wrap '+sel.spot.wrap+'</p>'+
      '<p class="hero-ft '+tone(sel.now.label)+'">'+rangeFt(sel.now.Hb)+'<small>'+sel.now.label+'</small></p>'+
      dots(sel.now.score)+
      '<p class="mut">'+sel.now.src+' \u00b7 wait '+sel.now.wait+' min to two walls \u00b7 '+sel.now.kw+' kW/m \u00b7 48h Fun '+Math.round(sel.cons*100)+'%</p>'+
      '<p class="k" style="margin-top:14px">24 h forecast</p>'+dualChart(strip)+
      '<p class="k" style="margin-top:12px">Components</p>'+swellRows(sel.now)+
      '<p class="k" style="margin-top:14px">Period energy</p><div class="spec">'+specRows+'</div>'+
      '<p class="k" style="margin-top:14px">Outlook</p><div class="daystrip">'+dayStrip(useLong)+'</div>';
  }
}
function seedDemo(){
  const now=Date.now();
  const start=now-now%3600000;
  ids().forEach((id,ix)=>{
    const cell=[], wind=[], cur=[], gfs=[];
    for(let i=0;i<192;i++){
      const ms=start+i*3600000;
      const iso=new Date(ms+5*3600000).toISOString().slice(0,16);
      const day=i/24;
      const Hs=0.55+0.35*Math.sin(day*0.55+ix*0.2)+0.18*Math.sin(i/9);
      const T=8.2+2.4*Math.sin(day*0.3+1)+(ix>5?1.2:0);
      const dir=175+18*Math.sin(day*0.4);
      cell.push({iso,ms,Hs:Math.max(0.2,Hs),dir,T,ww:0.25+0.2*Math.sin(i/7),wwd:240,wwp:5.5,s2:0.22,s2d:210,s2t:11.5,s3:0.12,s3d:160,s3t:14,sea:Hs+0.2,sst:29});
      wind.push({iso,kn:8+6*Math.sin(i/11+ix),dir:250+30*Math.sin(i/13),gust:12,cloud:40,rain:0});
      cur.push({iso,ms,kn:0.4+0.35*Math.sin(i/6+ix*0.4),dir:70+40*Math.sin(i/8),sl:0.55,slAn:0.08*Math.sin(i/6.2)});
      gfs.push({iso,ms,Hs:Math.max(0.2,Hs-0.08),dir,T:T-0.4,ww:0.3,wwd:240,wwp:5,s2:0.18,s2d:200,s2t:10,s3:0.14,s3d:155,s3t:15,sea:Hs+0.15,sst:29});
    }
    state.cells[id]=cell; state.wind[id]=wind; state.cur[id]=cur; state.gfs[id]=gfs;
  });
}
function ingestChunk(keys, marineRaw, windRaw, curRaw){
  const ml=marineRaw?asList(marineRaw):null;
  const wl=windRaw?asList(windRaw):null;
  const cl=curRaw?asList(curRaw):null;
  keys.forEach((id,i)=>{
    if(ml && (ml[i]||ml[0]) && (ml[i]||ml[0]).hourly) state.cells[id]=parseCell(ml[i]||ml[0]);
    if(wl && (wl[i]||wl[0]) && (wl[i]||wl[0]).hourly) state.wind[id]=windParse(wl[i]||wl[0]);
    if(cl && (cl[i]||cl[0]) && (cl[i]||cl[0]).hourly) state.cur[id]=parseCur(cl[i]||cl[0]);
  });
}
async function load(){
  const st=document.getElementById("status");
  st.textContent="Booting HUD\u2026";
  seedDemo();
  render();
  st.textContent="HUD up \u00b7 pulling live models in small batches\u2026";
  let live=0, lastErr="";
  const parts=[["north-male","south-male"],["meemu","thaa","laamu"],["gaafu-north","gaafu-east","gaafu-west","gaafu-south","addu"]];
  for(const keys of parts){
    try{
      const m=await getCached("m:"+keys.join(","), marineURL(keys));
      await ingestChunk(keys, m.data, null, null);
      live++;
      render();
      const w=await getCached("w:"+keys.join(","), windURL(keys));
      await ingestChunk(keys, null, w.data, null);
      const c=await getCached("c:"+keys.join(","), currentURL(keys));
      await ingestChunk(keys, null, null, c.data);
      live++;
      document.getElementById("src").textContent="LIVE \u00b7 MFWAM + SMOC + wind";
      st.textContent="Live cells "+Object.keys(state.cells).length+" \u00b7 "+fmt(Date.now(),{weekday:"short",hour:"2-digit",minute:"2-digit",hour12:false})+" MVT";
      render();
    }catch(e){ lastErr=e.message||String(e); }
  }
  if(!live){
    document.getElementById("src").textContent="DEMO physics \u00b7 models blocked";
    st.innerHTML='<span class="error">Live models failed ('+(lastErr||"network")+'). Board is on climatology demo \u2014 tap Refresh.</span>';
    render();
    return;
  }
  try{
    const gkeys=ids().slice(0,5);
    const g=await getCached("gfs", marineURL(gkeys,"ncep_gfswave025","swell_wave_height,swell_wave_direction,swell_wave_period,wind_wave_height,wind_wave_direction,wind_wave_period,secondary_swell_wave_height,secondary_swell_wave_direction,secondary_swell_wave_period,tertiary_swell_wave_height,tertiary_swell_wave_direction,tertiary_swell_wave_period,wave_height",null,192));
    const gl=asList(g.data);
    gkeys.forEach((id,i)=>{ state.gfs[id]=parseCell(gl[i]||gl[0]); });
    document.getElementById("src").textContent="LIVE ensemble \u00b7 MFWAM + GFS + SMOC";
    render();
  }catch(e){}
  try{
    const ekeys=ids().slice(0,5);
    const e=await getCached("ecm", marineURL(ekeys,"ecmwf_wam025","wave_height,wave_period,wave_direction",8));
    const el=asList(e.data);
    ekeys.forEach((id,i)=>{ state.ecm[id]=parseCell(el[i]||el[0]); });
    document.getElementById("src").textContent="LIVE ensemble \u00b7 MFWAM + GFS + ECMWF + SMOC";
    st.textContent="Full ensemble live \u00b7 "+fmt(Date.now(),{weekday:"short",hour:"2-digit",minute:"2-digit",hour12:false})+" MVT \u00b7 "+SPOTS.length+" reefs";
    render();
  }catch(e){}
}
window.onerror=function(msg,src,line){
  const el=document.getElementById("status");
  if(el) el.innerHTML='<span class="error">JS '+msg+' @'+line+'</span>';
};
function showTab(id){
  document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("on", t.id==="tab-"+id));
  document.querySelectorAll("#nav button").forEach(b=>b.classList.toggle("on", b.dataset.tab===id));
}
document.getElementById("nav").onclick=e=>{
  const b=e.target.closest("button[data-tab]");
  if(!b) return;
  showTab(b.dataset.tab);
};
document.getElementById("reload").onclick=()=>load();
document.getElementById("q").oninput=e=>{state.q=e.target.value;render()};
if("serviceWorker" in navigator){
  navigator.serviceWorker.register("./sw.js").catch(()=>{});
}
let deferredPrompt=null;
window.addEventListener("beforeinstallprompt", e=>{
  e.preventDefault();
  deferredPrompt=e;
  const btn=document.getElementById("install");
  if(btn) btn.classList.add("on");
});
document.getElementById("install").onclick=async()=>{
  if(deferredPrompt){
    deferredPrompt.prompt();
    await deferredPrompt.userChoice.catch(()=>{});
    deferredPrompt=null;
    document.getElementById("install").classList.remove("on");
    return;
  }
  alert("iPhone: Share \u2192 Add to Home Screen.\nAndroid: menu \u2192 Install app.\nOpen https://quantumride.github.io/ in Safari or Chrome.");
};
try{ load(); }catch(e){
  document.getElementById("status").innerHTML='<span class="error">Boot error: '+e.message+'</span>';
  try{ seedDemo(); render(); }catch(_){}
}
