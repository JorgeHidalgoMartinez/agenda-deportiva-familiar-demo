'use strict';
// A public team feed is configured locally. No names or personal mappings are shipped.
function mergeTeamFeed(current, personId, feed, config, expectedOrigin) {
 const p=current.people.find(x=>x.id===personId&&x.sport==='Fútbol'&&x.active);
 if(!p)throw Error('Seguimiento no activo');
 if(!feed||typeof feed.scope!=='string'||feed.scope.trim()!==config.scope.trim()||!Number.isFinite(Date.parse(feed.checked_at))||Date.parse(feed.checked_at)>Date.now()+300000||!Array.isArray(feed.fixtures)||feed.fixtures.length<1||feed.fixtures.length>100)throw Error('Fuente incompatible o equipo incorrecto');
 const next=JSON.parse(JSON.stringify(current)), seen=new Set(), rows=[];
 for(const f of feed.fixtures){
  if(!Number.isInteger(f.j)||f.j<1||f.j>100||seen.has(f.j)||typeof f.rival!=='string'||!f.rival.trim()||typeof f.home!=='boolean'||(f.gf==null)!==(f.gc==null)||[f.gf,f.gc].some(v=>v!=null&&(!Number.isInteger(v)||v<0||v>60)))throw Error('Jornada o marcador no válido');
  seen.add(f.j);
  if(f.date===null)continue;
  if(typeof f.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(f.date)||!Number.isFinite(Date.parse(f.date))||new Date(f.date).toISOString().slice(0,10)!==f.date)throw Error('Fecha no válida');
  let time=''; if(f.time!=null&&f.time!==''){let m=String(f.time).match(/^([01]?\d|2[0-3]):([0-5]\d)h?$/);if(!m)throw Error('Hora no válida');time=m[1].padStart(2,'0')+':'+m[2];}
  if(f.venue!=null&&typeof f.venue!=='string')throw Error('Campo no válido');
  const id='live-'+personId+'-'+encodeURIComponent(config.scope)+'-'+f.j, old=next.events.find(e=>e.id===id);
  const match=f.home?config.team+' – '+f.rival:f.rival+' – '+config.team;
  const score=f.gf==null?'':` · Resultado del equipo: ${f.gf}–${f.gc}`;
  rows.push({id,person:personId,date:f.date,time,match,place:f.venue||'',link:'',notes:'Jornada '+f.j+score+'. Fuente pública de equipo; no acredita convocatoria. Consulta de origen: '+feed.checked_at,source:'Calendario de equipo',status:'pendiente',mode:'Presencial',attend:old?.attend||'sin_decidir'});
 }
 if(!rows.length)throw Error('Sin fechas disponibles');
 const prefix='live-'+personId+'-'+encodeURIComponent(config.scope)+'-';
 // Retain earlier entries missing from the new feed, flag rather than infer cancellation.
 next.events=next.events.map(e=>e.id.startsWith(prefix)&&!rows.some(r=>r.id===e.id)?{...e,notes:'No figura con fecha en la última consulta. Verificar con la fuente.',status:'pendiente'}:e);
 for(const row of rows){const i=next.events.findIndex(e=>e.id===row.id); if(i>=0)next.events[i]=row;else next.events.push(row);}
 // The fictitious sample for this tracking must not be mixed with real fixtures.
 next.events=next.events.filter(e=>e.person!==personId||!['Simulación de calendario','Demostración'].includes(e.source));
 return {next,count:rows.length,checkedAt:feed.checked_at};
}
if(typeof module!=='undefined'&&module.exports)module.exports={mergeTeamFeed};
if(typeof document!=='undefined'&&!READONLY){(()=>{
 const configKey='agenda-demo-v13-source-config';let cfg={};try{cfg=JSON.parse(localStorage.getItem(configKey)||'{}')||{};}catch{}
 // Same-origin only; never transmit a person name, ID, or notes in requests.
 function sourceUrl(v){let u=new URL(v,location.href);if(u.protocol!=='https:'||u.origin!==location.origin||u.username||u.password||u.search||u.hash||!u.pathname.endsWith('.json'))throw Error('Usa una URL HTTPS del mismo origen, terminada en .json y sin parámetros');return u.href;}
 const box=document.createElement('div');box.className='panel';box.style.marginBottom='12px';
 const heading=document.createElement('h3');heading.textContent='Fuentes de fútbol · prueba técnica';
 const desc=document.createElement('p');desc.className='muted';desc.textContent='Conecta un calendario público de equipo. Configuración local; no introduzcas datos personales reales. La vista familiar pública sigue siendo ficticia.';
 const select=document.createElement('select');select.setAttribute('aria-label','Seguimiento de fútbol');
 const fields={};for(const [k,label] of [['url','URL JSON del calendario'],['scope','Identificador exacto (scope) de la fuente'],['team','Nombre público del equipo']]){const l=document.createElement('label');l.textContent=label;const input=document.createElement('input');input.type='text';input.style.width='100%';input.setAttribute('aria-label',label);l.append(input);fields[k]=input;box.append(l);}
 const saveBtn=document.createElement('button');saveBtn.className='btn primary';saveBtn.textContent='Conectar fuente'; const remove=document.createElement('button');remove.className='btn slim';remove.textContent='Desconectar';const report=document.createElement('p');report.setAttribute('role','status');report.className='muted';
 const detail=document.createElement('details');const summary=document.createElement('summary');summary.textContent='Configurar conexión (opcional)';detail.append(summary,select);for(const field of Object.values(fields))detail.append(field.parentElement);detail.append(saveBtn,remove);box.replaceChildren(heading,desc,report,detail);$('#agenda').before(box);
 let running=false;
 function choices(){const prior=select.value;select.replaceChildren();for(const p of db.people.filter(x=>x.active&&x.sport==='Fútbol'&&x.group===scope)){const o=document.createElement('option');o.value=p.id;o.textContent=p.name+' · '+p.team;select.append(o);}if([...select.options].some(o=>o.value===prior))select.value=prior;loadFields();}
 function loadFields(){const c=cfg[select.value]||{};for(const k of Object.keys(fields))fields[k].value=c[k]||'';}
 select.addEventListener('change',loadFields);document.addEventListener('click',e=>{if(e.target.closest('[data-scope],[data-tab]'))choices();});choices();
 function persistConfig(){localStorage.setItem(configKey,JSON.stringify(cfg));}
 async function sync(){if(running)return;running=true;saveBtn.disabled=remove.disabled=true;const results=[];try{for(const [id,c] of Object.entries(cfg)){if(!db.people.some(p=>p.id===id&&p.active&&p.sport==='Fútbol'))continue;try{const r=await fetch(sourceUrl(c.url),{cache:'no-store',credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('HTTP '+r.status);const f=await r.json();if(c.lastChecked&&Date.parse(f.checked_at)<Date.parse(c.lastChecked))throw Error('Copia anterior a la última válida');const out=mergeTeamFeed(db,id,f,c,location.origin);if(!valid(out.next))throw Error('Datos incompatibles');db=out.next;c.lastChecked=out.checkedAt;persistConfig();save();const age=(Date.now()-Date.parse(out.checkedAt))/3600000;results.push(c.team+': '+out.count+' fechas · fuente '+new Date(out.checkedAt).toLocaleString('es-ES')+(age>48?' (antigua: verificar)':''));}catch(e){results.push(c.team+': actualización fallida; se conservan los datos anteriores'+(c.lastChecked?' · última válida '+new Date(c.lastChecked).toLocaleString('es-ES'):''));}}report.textContent=results.join(' | ')||'Ninguna fuente real configurada. Se muestra el calendario ficticio.';}finally{running=false;saveBtn.disabled=remove.disabled=false;}}
 saveBtn.addEventListener('click',()=>{try{const id=select.value;if(!id)throw Error('Selecciona un seguimiento');const c={url:sourceUrl(fields.url.value),scope:fields.scope.value.trim(),team:fields.team.value.trim()};if(!c.scope||!c.team)throw Error('Completa todos los campos');const previous=cfg[id];if(previous&&(previous.scope!==c.scope||previous.url!==c.url)){if(!confirm('¿Cambiar fuente? Se borrarán sus partidos sincronizados anteriores.'))return;db.events=db.events.filter(e=>!(e.person===id&&e.source==='Calendario de equipo'));save();}else if(previous)c.lastChecked=previous.lastChecked;cfg[id]=c;persistConfig();sync();}catch(e){report.textContent=e.message;}});
 remove.addEventListener('click',()=>{const id=select.value;if(!cfg[id])return;if(!confirm('¿Desconectar y eliminar los encuentros de esta fuente?'))return;delete cfg[id];persistConfig();db.events=db.events.filter(e=>!(e.person===id&&e.source==='Calendario de equipo'));save();loadFields();sync();});
 sync();window.addEventListener('pageshow',e=>{if(e.persisted)sync();});
})();}
