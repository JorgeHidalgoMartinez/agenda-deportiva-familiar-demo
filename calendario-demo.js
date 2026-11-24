
function mergeDemoFeed(db,seed,feed,readonly){
 if(feed?.version!==1||feed.demo!==true||!Array.isArray(feed.teams)||!feed.teams.length||feed.teams.length>20||!Number.isFinite(Date.parse(feed.checked_at)))throw Error('Formato de calendario no válido');
 const next=JSON.parse(JSON.stringify(db)); let count=0; const seen=new Set();
 for(const t of feed.teams){
  if(typeof t.team!=='string'||typeof t.person!=='string'||!Array.isArray(t.fixtures)||!t.fixtures.length||t.fixtures.length>100)throw Error('Equipo o calendario no válido');
  const p=next.people.find(p=>p.id===t.person&&p.team===t.team&&p.sport==='Fútbol'&&p.active&&(!readonly||p.group==='family'));
  if(!p)continue;
  if(!readonly&&next.events.some(e=>e.person===p.id&&e.source==='Calendario de equipo'))continue;
  for(const f of t.fixtures){
   if(!Number.isInteger(f.j)||f.j<1||f.j>100||!(/^\d{4}-\d{2}-\d{2}$/.test(f.date))||!Number.isFinite(Date.parse(f.date))||new Date(f.date).toISOString().slice(0,10)!==f.date||(f.time!==null&&!(/^([01]\d|2[0-3]):[0-5]\d$/.test(f.time)))||typeof f.rival!=='string'||!f.rival.trim()||typeof f.home!=='boolean'||(f.venue!==null&&typeof f.venue!=='string'))throw Error('Partido de ejemplo no válido');
   const key=p.id+'-'+f.j;if(seen.has(key))throw Error('Jornada duplicada');seen.add(key);
   const id=f.j===12?t.legacy:'demo-feed-'+key;
   if(typeof id!=='string'||!id)throw Error('Identificador no válido');
   const old=next.events.find(e=>e.id===id),original=seed.events.find(e=>e.id===id);
   if(old&&old.source!=='Simulación de calendario'&&(!original||['person','date','time','match','place','notes','status','mode','link'].some(k=>old[k]!==original[k])))continue;
   const e={id,person:p.id,date:f.date,time:f.time||'',match:f.home?p.team+' – '+f.rival:f.rival+' – '+p.team,place:f.venue||'',link:'',notes:'Calendario ficticio de prueba · Jornada '+f.j+'. No es un horario oficial.',status:'pendiente',mode:'Presencial',source:'Simulación de calendario',attend:old?.attend||'sin_decidir'};
   if(old)next.events[next.events.indexOf(old)]=e;else next.events.push(e);count++;
  }
 }
 return {next,count};
}

(function(){
const box=document.createElement('div');box.className='panel';box.style.marginBottom='12px';
const msg=document.createElement('p');msg.className='muted';msg.setAttribute('role','status');msg.textContent='Calendario de fútbol: comprobando datos ficticios…';
const retry=document.createElement('button');retry.className='btn slim';retry.type='button';retry.textContent='Actualizar demo';box.append(msg,retry);$('#agenda').before(box);
let running=false;
async function sync(){
 if(running)return;running=true;retry.disabled=true;
 try{const res=await fetch(READONLY?'calendario-demo-familiar.json':'calendario-demo-personal.json',{cache:'no-store'});if(!res.ok)throw Error('HTTP '+res.status);const feed=await res.json(),out=mergeDemoFeed(db,seed,feed,READONLY);if(!valid(out.next))throw Error('Calendario incompatible');db=out.next;if(READONLY)render();else save();msg.textContent='Fútbol · DEMO: '+out.count+' partidos de ejemplo comprobados. No son datos oficiales.';}
 catch(err){msg.textContent='No se pudo actualizar la demo. Se conservan los partidos anteriores.';}
 finally{running=false;retry.disabled=false;}
}
retry.addEventListener('click',sync);sync();
})();
