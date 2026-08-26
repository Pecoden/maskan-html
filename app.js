const PROJECT_GAUGE_RADIUS=43,PROJECT_GAUGE_CIRCUMFERENCE=2*Math.PI*PROJECT_GAUGE_RADIUS;function projectGaugeOffset(value){const p=Math.max(0,Math.min(100,Number(value)||0));return PROJECT_GAUGE_CIRCUMFERENCE*(1-p/100)}
const KEY='maskanProjectsV1';let projects=window.TOC_EMBEDDED_EXPORT?structuredClone(MASKAN_PROJECTS):(JSON.parse(localStorage.getItem(KEY)||'null')||MASKAN_PROJECTS);const grid=document.querySelector('#grid'),details=document.querySelector('#details'),search=document.querySelector('#search'),typeFilter=document.querySelector('#typeFilter'),ownerFilter=document.querySelector('#ownerFilter');let detailsScrollY=0,detailsOpener=null;
function consolidateSandProjects(list){const source=MASKAN_PROJECTS.find(p=>p.name.includes('الرمال')),sand=list.filter(p=>p.name.includes('الرمال'));if(!source||!sand.length)return list;const combined={...structuredClone(source),id:43,code:'',name:'منازل الرمال',uploadedFiles:sand.flatMap(p=>p.uploadedFiles||[])};let inserted=false;return list.flatMap(p=>{if(!p.name.includes('الرمال'))return[p];if(inserted)return[];inserted=true;return[combined]})}projects=consolidateSandProjects(projects);localStorage.setItem(KEY,JSON.stringify(projects));
const uniq=k=>[...new Set(projects.map(p=>p[k]).filter(Boolean))].sort();function fillFilters(){uniq('type').forEach(v=>typeFilter.insertAdjacentHTML('beforeend',`<option>${v}</option>`));uniq('owner').forEach(v=>ownerFilter.insertAdjacentHTML('beforeend',`<option>${v}</option>`))}
function dashboard(){const total=projects.length||1,avg=Math.round(projects.reduce((s,p)=>s+p.progress,0)/total),done=projects.filter(p=>p.status==='مكتمل').length,active=projects.filter(p=>p.status==='قيد التنفيذ').length,early=projects.filter(p=>p.progress<25).length;document.querySelector('#radial').style.setProperty('--deg',avg*3.6+'deg');document.querySelector('#radialValue').textContent=avg+'%';document.querySelector('#portfolioLabel').textContent=avg>=80?'أداء متقدم':avg>=60?'أداء جيد':'يحتاج متابعة';document.querySelector('#completePct').textContent=Math.round(done/total*100)+'%';document.querySelector('#activePct').textContent=Math.round(active/total*100)+'%';document.querySelector('#earlyPct').textContent=Math.round(early/total*100)+'%';const hi=projects.filter(p=>p.progress>=75).length;document.querySelector('#kpis').innerHTML=[['إجمالي المشاريع',projects.length,'كامل المحفظة'],['مشاريع مكتملة',done,Math.round(done/total*100)+'% من الإجمالي'],['قيد التنفيذ',active,'مشروع نشط'],['إنجاز 75% فأكثر',hi,Math.round(hi/total*100)+'% من المحفظة']].map(x=>`<article><span>${x[0]}<i>↗</i></span><b>${x[1]}</b><small>${x[2]}</small></article>`).join('');const types={};projects.forEach(p=>types[p.type||'غير محدد']=(types[p.type||'غير محدد']||0)+1);const max=Math.max(1,...Object.values(types));document.querySelector('#typeChart').innerHTML=Object.entries(types).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="type-row"><span>${k}</span><div class="type-track"><i style="width:${v/max*100}%"></i></div><b>${v}</b></div>`).join('');const owners={};projects.forEach(p=>owners[p.owner||'مالك غير محدد']=(owners[p.owner||'مالك غير محدد']||0)+1);const ownerMax=Math.max(1,...Object.values(owners));document.querySelector('#ownerChart').innerHTML=Object.entries(owners).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k,v])=>`<div class="type-row owner-row"><span title="${k}">${k}</span><div class="type-track"><i style="width:${v/ownerMax*100}%"></i></div><b>${v}</b></div>`).join('');const stages=[['البداية','0% – 25%',p=>p.progress<=25],['التنفيذ الأولي','26% – 50%',p=>p.progress>25&&p.progress<=50],['التنفيذ المتقدم','51% – 75%',p=>p.progress>50&&p.progress<=75],['قرب التسليم','76% – 99%',p=>p.progress>75&&p.progress<100],['مكتمل','100%',p=>p.progress>=100]];document.querySelector('#stageChart').innerHTML=stages.map(([name,range,test])=>{const count=projects.filter(test).length,pct=Math.round(count/total*100);return `<div class="document-row stage-row"><div><b>${name}</b><small>${range} • ${count} مشروع</small></div><div class="document-track"><i style="width:${pct}%"></i></div><strong>${pct}%</strong></div>`}).join('')}
const DAY_MS=86400000;
const auditFieldLabels={code:'رقم المشروع',name:'اسم المشروع',owner:'المالك',manager:'مدير المشروع',location:'الموقع',type:'نوع المشروع',status:'حالة المشروع',progress:'نسبة الإنجاز',startDate:'تاريخ البداية',endDate:'تاريخ النهاية',contractEndDate:'تاريخ انتهاء العقد',missingItems:'نواقص المشروع',uploadedFiles:'الملفات المرفوعة'};
function normalizeMissingItems(value){
  if(Array.isArray(value))return value.map(item=>String(item||'').trim()).filter(Boolean);
  return String(value||'').split(/\r?\n|،|,/).map(item=>item.trim()).filter(Boolean);
}
function parseProjectDate(value){
  const raw=String(value||'').trim();
  if(!raw)return null;
  let match=raw.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/);
  let year,month,day;
  if(match){year=Number(match[1]);month=Number(match[2]);day=Number(match[3])}
  else{
    match=raw.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/);
    if(!match)return null;
    day=Number(match[1]);month=Number(match[2]);year=Number(match[3]);
  }
  const date=new Date(year,month-1,day);
  return date.getFullYear()===year&&date.getMonth()===month-1&&date.getDate()===day?date:null;
}
function startOfToday(){const now=new Date();return new Date(now.getFullYear(),now.getMonth(),now.getDate())}
function daysFromToday(date){return Math.round((date-startOfToday())/DAY_MS)}
function formatProjectDate(value){const date=parseProjectDate(value);return date?new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn',{day:'2-digit',month:'short',year:'numeric'}).format(date):(value||'—')}
function formatUpdateDate(value){const date=new Date(value);return Number.isNaN(date.getTime())?'—':new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(date)}
function safeText(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}

const CHANGE_META_KEY='maskanLastChangeV1';
function projectLastUpdateAt(project){
  const values=[];
  if(project?.lastModifiedAt)values.push(project.lastModifiedAt);
  if(Array.isArray(project?.updateLog))project.updateLog.forEach(entry=>{if(entry?.at)values.push(entry.at)});
  return values.map(value=>({value,date:new Date(value)})).filter(item=>!Number.isNaN(item.date.getTime())).sort((a,b)=>b.date-a.date)[0]?.value||'';
}
function latestProjectChangeMeta(){
  let latest=null;
  projects.forEach(project=>{
    const at=projectLastUpdateAt(project);if(!at)return;
    const date=new Date(at);if(!latest||date>new Date(latest.at))latest={at,editor:(project.updateLog||[]).slice().sort((a,b)=>new Date(b.at)-new Date(a.at))[0]?.editor||'',action:'تعديل مشروع',projectId:project.id,projectCode:project.code||'',projectName:project.name||'',details:[]};
  });
  return latest;
}
function getPlatformChangeMeta(){
  if(window.MASKAN_EXPORTED_CHANGE_META?.at)return window.MASKAN_EXPORTED_CHANGE_META;
  if(!window.TOC_EMBEDDED_EXPORT){try{const stored=JSON.parse(localStorage.getItem(CHANGE_META_KEY)||'null');if(stored?.at)return stored}catch(_){}}
  const latest=latestProjectChangeMeta();if(latest)return latest;
  const exportedAt=document.querySelector('meta[name="toc-exported-at"]')?.content;
  return exportedAt?{at:exportedAt,action:'تصدير النسخة المحدثة',details:[]}:null;
}
function formatVisibleUpdateDate(value){
  const date=new Date(value);if(Number.isNaN(date.getTime()))return 'غير مسجل';
  return new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn',{timeZone:'Asia/Riyadh',weekday:'long',day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h12'}).format(date);
}
function describePlatformChange(meta){
  if(!meta)return 'لا توجد تعديلات مسجلة بعد';
  const project=meta.projectName?`${meta.projectName}${meta.projectCode?` #${meta.projectCode}`:''}`:'';
  const details=Array.isArray(meta.details)&&meta.details.length?` — ${meta.details.slice(0,4).join('، ')}`:(meta.summary?` — ${meta.summary}`:'');
  return `${meta.action||'تحديث البيانات'}${project?` • ${project}`:''}${details}`;
}
function renderPlatformLastUpdate(){
  const dateEl=document.querySelector('#platformLastUpdate');if(!dateEl)return;
  const meta=getPlatformChangeMeta();
  dateEl.textContent=meta?.at?formatVisibleUpdateDate(meta.at):'لم يُسجّل تعديل بعد';
  dateEl.setAttribute('datetime',meta?.at||'');
}

function formatAuditValue(value){
  if(Array.isArray(value))return value.length?value.join('، '):'لا يوجد';
  if(value===null||value===undefined||String(value).trim()==='')return 'غير محدد';
  return String(value);
}
let activeStage=null;
const stageTests=[p=>p.progress<=25,p=>p.progress>25&&p.progress<=50,p=>p.progress>50&&p.progress<=75,p=>p.progress>75&&p.progress<100,p=>p.progress>=100];
function current(){const q=search.value.trim(),t=typeFilter.value,o=ownerFilter.value;return projects.filter(p=>{const stageMatch=activeStage===null||stageTests[activeStage](p);return stageMatch&&(t==='الكل'||p.type===t)&&(o==='الكل'||p.owner===o)&&(`${p.name} ${p.code} ${p.location} ${p.owner}`.includes(q))})}
function render(){
  const list=current();
  document.querySelector('#resultsCount').textContent=`${list.length} مشروع`;
  grid.innerHTML=list.map(p=>{
    const progress=Math.max(0,Math.min(100,Number(p.progress)||0));
    const missing=normalizeMissingItems(p.missingItems);
    const lastUpdated=projectLastUpdateAt(p);
    return `<article class="card"><div class="card-head"><span class="badge ${p.status==='مكتمل'?'done':''}">${p.status}</span><small>#${p.code||'—'}</small></div><div class="card-main"><div><h3>${p.name}</h3><p>⌖ ${p.location||'الموقع غير محدد'}</p></div><div class="project-gauge" data-progress="${progress}" role="img" aria-label="نسبة الإنجاز ${progress} بالمائة"><svg class="project-gauge-svg" viewBox="0 0 100 100" aria-hidden="true"><circle class="project-gauge-track" cx="50" cy="50" r="43"></circle><circle class="project-gauge-value" cx="50" cy="50" r="43" stroke-dasharray="${PROJECT_GAUGE_CIRCUMFERENCE} ${PROJECT_GAUGE_CIRCUMFERENCE}" stroke-dashoffset="${projectGaugeOffset(progress)}"></circle></svg><span><b>${progress}%</b><small>الإنجاز</small></span></div></div><div class="percent"><b>نسبة الإنجاز</b><strong>${progress}%</strong></div><div class="progress"><i style="width:${progress}%"></i></div><div class="card-meta"><span>${p.type||'غير محدد'}</span><span>${p.manager||'—'}</span></div>${lastUpdated?`<div class="card-last-update"><span>↻</span><small>آخر تحديث</small><b>${formatVisibleUpdateDate(lastUpdated)}</b></div>`:''}${missing.length?`<div class="card-missing-indicator"><span>!</span><b>${missing.length} نواقص تحتاج متابعة</b></div>`:''}<button data-id="${p.id}">عرض التفاصيل والملفات</button></article>`;
  }).join('')||'<p>لا توجد مشاريع مطابقة لخيارات البحث.</p>';
}
function renderMissingItems(project){
  const items=normalizeMissingItems(project.missingItems);
  return `<section class="project-missing-section"><div class="details-section-title"><div><span class="details-section-icon">!</span><div><small>متابعة المشروع</small><h3>نواقص المشروع</h3></div></div><b>${items.length}</b></div>${items.length?`<ul class="missing-items-list">${items.map(item=>`<li><span></span><b>${safeText(item)}</b></li>`).join('')}</ul>`:'<p class="details-empty-state">لا توجد نواقص مسجلة لهذا المشروع.</p>'}</section>`;
}
function renderUpdateLog(project){
  const log=Array.isArray(project.updateLog)?project.updateLog.slice().reverse():[];
  return `<section class="project-updates-section"><div class="details-section-title"><div><span class="details-section-icon updates-icon">↻</span><div><small>التوثيق</small><h3>سجل التحديثات</h3></div></div><b>${log.length}</b></div>${log.length?`<div class="updates-timeline">${log.slice(0,50).map(entry=>`<article class="update-entry"><div class="update-marker"></div><div class="update-entry-head"><time>${formatUpdateDate(entry.at)}</time>${entry.editor?`<span>${safeText(entry.editor)}</span>`:''}</div><div class="update-changes">${(entry.changes||[]).map(change=>`<div><b>${safeText(change.label||auditFieldLabels[change.field]||change.field||'تحديث')}</b><p><del>${safeText(formatAuditValue(change.before))}</del><span>←</span><ins>${safeText(formatAuditValue(change.after))}</ins></p></div>`).join('')}</div></article>`).join('')}</div>`:'<p class="details-empty-state">لم تُسجّل تعديلات على بيانات المشروع بعد.</p>'}</section>`;
}
function show(p){
  detailsScrollY=Math.max(0,window.scrollY||window.pageYOffset||0);
  detailsOpener=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const docs=p.docs||{},uploads=p.uploadedFiles||[];
  const projectImage=resolveProjectImage(p);
  details.classList.toggle('has-project-watermark',!!projectImage);
  if(projectImage)details.style.setProperty('--details-project-image',`url("${projectImage}")`);else details.style.removeProperty('--details-project-image');
  document.querySelector('#detailsBody').innerHTML=`<span class="eyebrow dark">لوحة المشروع</span><h2>${p.name}</h2><div class="details-list"><div><small>رقم المشروع</small><b>${p.code||'—'}</b></div><div><small>الحالة</small><b>${p.status}</b></div><div><small>نسبة الإنجاز</small><b>${p.progress}%</b></div><div><small>نوع المشروع</small><b>${p.type||'—'}</b></div><div><small>المالك</small><b>${p.owner||'—'}</b></div><div><small>مدير المشروع</small><b>${p.manager||'—'}</b></div><div><small>الموقع</small><b>${p.location||'—'}</b></div><div><small>المدة</small><b>${p.startDate||'—'} — ${p.endDate||'—'}</b></div><div><small>انتهاء العقد</small><b>${formatProjectDate(p.contractEndDate)}</b></div><div class="details-last-update"><small>آخر تحديث للمشروع</small><b>${projectLastUpdateAt(p)?formatVisibleUpdateDate(projectLastUpdateAt(p)):'غير مسجل'}</b></div></div>${renderMissingItems(p)}${renderUpdateLog(p)}<h3>روابط مجلدات المشروع</h3><div class="docs">${Object.entries(docs).map(([k,v])=>`<a class="doc" href="${v}" target="_blank"><span>▤</span><div><b>${k}</b><small>فتح المجلد ↗</small></div></a>`).join('')||'<p>لا توجد روابط مسجلة.</p>'}</div><h3>الملفات المرفوعة من الإدارة</h3><div class="docs uploaded-docs">${uploads.map(f=>`<a class="doc" href="${f.data}" download="${f.name}"><span>⇩</span><div><b>${f.name}</b><small>${formatFileSize(f.size)} • تنزيل الملف</small></div></a>`).join('')||'<p>لا توجد ملفات مرفوعة من الموقع.</p>'}</div>`;
  details.showModal();
}
grid.addEventListener('click',e=>{const id=e.target.dataset.id;if(id)show(projects.find(p=>String(p.id)===id))});[search,typeFilter,ownerFilter].forEach(x=>x.addEventListener(x.tagName==='INPUT'?'input':'change',render));document.querySelector('#reset').onclick=()=>{search.value='';typeFilter.value='الكل';ownerFilter.value='الكل';render()};fillFilters();dashboard();render();renderPlatformLastUpdate();


function renderAlertCenter(){
  const delayedContainer=document.querySelector('#delayedProjects');
  const endingContainer=document.querySelector('#endingProjects');
  if(!delayedContainer||!endingContainer)return;
  const isOpenProject=project=>project.status!=='مكتمل'&&Number(project.progress)<100;
  const withDays=(project,field)=>{const date=parseProjectDate(project[field]);return date?{project,date,days:daysFromToday(date)}:null};
  const delayed=projects.map(project=>withDays(project,'endDate')).filter(item=>item&&isOpenProject(item.project)&&item.days<0).map(item=>({...item,days:Math.abs(item.days)})).sort((a,b)=>b.days-a.days);
  const ending=projects.map(project=>withDays(project,'endDate')).filter(item=>item&&isOpenProject(item.project)&&item.days>=0&&item.days<=30).sort((a,b)=>a.days-b.days);
  const empty=message=>`<div class="alert-empty"><span>✓</span><p>${message}</p></div>`;
  const remainingLabel=days=>days===0?'ينتهي اليوم':`متبقي ${days} ${days===1?'يوم':'يومًا'}`;
  delayedContainer.innerHTML=delayed.length?delayed.map(({project,days})=>`<button type="button" class="alert-item delayed" data-alert-project="${project.id}"><span class="alert-item-code">#${project.code||'—'}</span><div><b>${safeText(project.name)}</b><small>${safeText(project.location||'الموقع غير محدد')}</small></div><strong>متأخر ${days} ${days===1?'يوم':'يومًا'}</strong></button>`).join(''):empty('لا توجد مشاريع متأخرة وفق التواريخ المسجلة.');
  endingContainer.innerHTML=ending.length?ending.map(({project,days})=>`<button type="button" class="alert-item ending" data-alert-project="${project.id}"><span class="alert-item-code">#${project.code||'—'}</span><div><b>${safeText(project.name)}</b><small>تاريخ النهاية ${formatProjectDate(project.endDate)} • الإنجاز ${Math.max(0,Math.min(100,Number(project.progress)||0))}%</small></div><strong>${remainingLabel(days)}</strong></button>`).join(''):empty('لا توجد مشاريع قريبة من الانتهاء خلال الثلاثين يومًا القادمة.');
  document.querySelector('#delayedCount').textContent=delayed.length;
  document.querySelector('#endingCount').textContent=ending.length;
  document.querySelector('#alertsTotal').textContent=delayed.length+ending.length;
}
document.querySelector('#alerts')?.addEventListener('click',event=>{
  const target=event.target.closest('[data-alert-project]');
  if(!target)return;
  const project=projects.find(item=>String(item.id)===String(target.dataset.alertProject));
  if(project)show(project);
});
renderAlertCenter();

const ownerRows=[...document.querySelectorAll('#ownerChart .owner-row')];
const stageRows=[...document.querySelectorAll('#stageChart .stage-row')];
function clearDashboardSelection(){ownerRows.forEach(row=>row.classList.remove('selected'));stageRows.forEach(row=>row.classList.remove('selected'))}
function showFilteredProjects(){render();document.querySelector('#projects').scrollIntoView({behavior:'smooth',block:'start'})}
ownerRows.forEach(row=>{row.setAttribute('role','button');row.setAttribute('tabindex','0');const selectOwner=()=>{activeStage=null;search.value='';typeFilter.value='الكل';ownerFilter.value=row.querySelector('span').textContent.trim();clearDashboardSelection();row.classList.add('selected');showFilteredProjects()};row.addEventListener('click',selectOwner);row.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectOwner()}})});
stageRows.forEach((row,index)=>{row.setAttribute('role','button');row.setAttribute('tabindex','0');const selectStage=()=>{activeStage=index;search.value='';typeFilter.value='الكل';ownerFilter.value='الكل';clearDashboardSelection();row.classList.add('selected');showFilteredProjects()};row.addEventListener('click',selectStage);row.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectStage()}})});
document.querySelector('#reset').addEventListener('click',()=>{activeStage=null;clearDashboardSelection();render()});

function formatFileSize(n){return n<1024?n+' B':n<1048576?(n/1024).toFixed(1)+' KB':(n/1048576).toFixed(1)+' MB'}

document.title='سحابة المكتب الفني | Technical Office Cloud (TOC)';
const publicBrand=document.querySelector('.header-brand');
if(publicBrand){publicBrand.querySelector('b').textContent='سحابة المكتب الفني';publicBrand.querySelector('small').textContent='Technical Office Cloud (TOC)'}
const platformEyebrow=document.querySelector('.hero-copy .eyebrow');
if(platformEyebrow)platformEyebrow.textContent='سحابة المكتب الفني • TOC';

const folderIcons={'بيانات المشروع':'📊','المخططات':'📐','الموازنة':'💰','العقود':'📜','الجدول الزمني':'📅','أرشيف المشروع':'📁','الضمانات':'🛡️'};
const iconObserver=new MutationObserver(()=>document.querySelectorAll('.docs:not(.uploaded-docs) .doc').forEach(link=>{const label=link.querySelector('b')?.textContent.trim(),icon=link.querySelector(':scope>span');if(icon)icon.dataset.icon=folderIcons[label]||'📂'}));
const detailsBodyForIcons=document.querySelector('#detailsBody');
if(detailsBodyForIcons)iconObserver.observe(detailsBodyForIcons,{childList:true,subtree:true});

const projectBackgrounds={
  '88':'project-images/p88.webp','90':'project-images/p90.webp','92':'project-images/p92.webp','96':'project-images/p96.webp','98':'project-images/p98.webp','100':'project-images/p100.webp','102':'project-images/p102.webp',
  '104':'project-images/p104.webp','106':'project-images/p106.webp','108':'project-images/p108.webp','110':'project-images/p110.webp','112':'project-images/p112.webp','114':'project-images/p114.webp','116':'project-images/p116.webp','118':'project-images/p118.webp',
  '120':'project-images/p120.webp','122':'project-images/p122.webp','124':'project-images/p124.webp','126':'project-images/p126.webp',
  '128':'project-images/p128.webp','130':'project-images/p130.webp','132':'project-images/p132.webp','136':'project-images/p136.webp','138':'project-images/p138.webp','140':'project-images/p140.webp',
  '142':'project-images/p142.webp','144':'project-images/p144.webp','146':'project-images/p146.webp','148':'project-images/p148.webp','150':'project-images/p150.webp',
  '152':'project-images/p152.webp','154':'project-images/p154.webp','156':'project-images/p156.webp','158':'project-images/p158.webp','160':'project-card-bg.webp'
};
const namedProjectBackgrounds=[
  ['العقيق (3) فلتين تجارية','project-images/p98-commercial.webp'],
  ['العقيق (3) فلة خاصة','project-images/p98-private.webp'],
  ['مقر الشركة','project-images/head-office.webp'],
  ['المعيزيلة','project-images/al-muaizilah.webp'],
  ['الملز كدا الاعمار','project-images/al-malaz-kada.webp'],
  ['الملز بلوك شرقي','project-images/al-malaz-east.webp'],
  ['الملز بلوك غربي','project-images/al-malaz-west.webp'],
  ['منازل الرمال','project-images/sand-homes.webp']
];
function resolveProjectImage(project){
  if(!project)return '';
  const name=String(project.name||'').trim();
  const code=String(project.code||'').replace(/\D/g,'');
  const named=namedProjectBackgrounds.find(([label])=>name.includes(label));
  return named?.[1]||projectBackgrounds[code]||'';
}

function applyProjectCardBackground(){document.querySelectorAll('#grid .card').forEach(card=>{const code=(card.querySelector('.card-head small')?.textContent||'').replace(/\D/g,''),name=card.querySelector('h3')?.textContent.trim()||'';const named=namedProjectBackgrounds.find(([label])=>name.includes(label));const image=named?.[1]||projectBackgrounds[code]||'';if(!image){card.classList.remove('project-image-card','image-loading','image-ready');card.style.removeProperty('--project-card-image');delete card.dataset.bgImage;return}card.classList.add('project-image-card');if(card.dataset.bgImage===image)return;card.dataset.bgImage=image;card.classList.remove('image-ready');card.classList.add('image-loading');const loader=new Image();loader.onload=()=>{if(card.dataset.bgImage!==image)return;card.style.setProperty('--project-card-image',`url("${image}")`);card.classList.remove('image-loading');requestAnimationFrame(()=>card.classList.add('image-ready'))};loader.onerror=()=>{card.classList.remove('image-loading');card.style.removeProperty('--project-card-image')};loader.src=image})}
const projectGridObserver=new MutationObserver(applyProjectCardBackground);
if(grid){projectGridObserver.observe(grid,{childList:true});applyProjectCardBackground()}

document.head.insertAdjacentHTML('beforeend','<link rel="stylesheet" href="logo-transparent.css">');
const intro=document.createElement('div');
intro.className='toc-intro';
intro.setAttribute('aria-label','جاري تحميل سحابة المكتب الفني');
intro.innerHTML=`<div class="toc-intro-inner">
  <div class="toc-intro-emblem" aria-hidden="true">
    <span class="toc-intro-orbit"></span>
    <i class="toc-intro-spark s1"></i><i class="toc-intro-spark s2"></i><i class="toc-intro-spark s3"></i><i class="toc-intro-spark s4"></i>
    <span class="toc-intro-logo-shell"><span class="toc-intro-logo"><img src="maskan-logo.png" alt=""></span></span>
  </div>
  <div class="toc-intro-title"><b>سحابة المكتب الفني</b><strong>Technical Office Cloud <em>(TOC)</em></strong></div>
  <i class="toc-intro-divider" aria-hidden="true"></i>
  <div class="toc-intro-loader" role="progressbar" aria-label="تحميل المنصة" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
    <div class="toc-intro-track"><i data-intro-bar></i></div>
    <div class="toc-intro-loader-meta"><span>جاري تجهيز المنصة</span><b data-intro-percent>0%</b></div>
  </div>
</div>`;
document.body.appendChild(intro);
document.body.classList.add('intro-playing');
{
  const totalDuration=4000;
  const progressDuration=3300;
  const bar=intro.querySelector('[data-intro-bar]');
  const percent=intro.querySelector('[data-intro-percent]');
  const progress=intro.querySelector('[role="progressbar"]');
  const started=performance.now();
  const updateIntroProgress=now=>{
    const elapsed=Math.max(0,now-started);
    const eased=1-Math.pow(1-Math.min(1,elapsed/progressDuration),3);
    const value=Math.min(100,Math.round(eased*100));
    bar.style.width=value+'%';
    percent.textContent=value+'%';
    progress.setAttribute('aria-valuenow',String(value));
    if(value<100)requestAnimationFrame(updateIntroProgress);
    else intro.classList.add('is-complete');
  };
  requestAnimationFrame(updateIntroProgress);
  window.setTimeout(()=>{
    intro.remove();
    document.body.classList.remove('intro-playing');
  },totalDuration);
}
const aboutSection=document.querySelector('#about');
if(aboutSection){const aboutObserver=new IntersectionObserver(entries=>{const entry=entries[0];if(entry.isIntersecting){aboutSection.classList.remove('values-visible');requestAnimationFrame(()=>requestAnimationFrame(()=>aboutSection.classList.add('values-visible')))}else{aboutSection.classList.remove('values-visible')}},{threshold:.3});aboutObserver.observe(aboutSection)}
const liveBadge=document.querySelector('#analytics .live');
if(liveBadge){
  const status=document.createElement('div');status.className='analytics-status';
  const clock=document.createElement('div');clock.className='performance-clock';clock.innerHTML='<time aria-label="الوقت الحالي"></time><span></span>';
  liveBadge.before(status);status.append(liveBadge,clock);
  const updateClock=()=>{const now=new Date();clock.querySelector('time').textContent=new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn',{timeZone:'Asia/Riyadh',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(now);clock.querySelector('span').textContent=new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn',{timeZone:'Asia/Riyadh',weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(now)};
  updateClock();setInterval(updateClock,1000);
}

document.head.insertAdjacentHTML('beforeend','<link rel="stylesheet" href="professional-animations.css">');

const motionReduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const easeOut=t=>1-Math.pow(1-t,3);
function tweenNumber(element,target,duration=950,suffix=''){
  if(!element)return;
  if(motionReduced){element.textContent=target+suffix;return}
  const start=performance.now();
  const tick=now=>{const p=Math.min(1,(now-start)/duration);element.textContent=Math.round(target*easeOut(p))+suffix;if(p<1)requestAnimationFrame(tick)};
  requestAnimationFrame(tick);
}

/* 2 — عمق بصري هادئ للواجهة الرئيسية */
const hero=document.querySelector('.hero');
if(hero&&!motionReduced){
  hero.addEventListener('pointermove',event=>{if(event.pointerType==='touch')return;const r=hero.getBoundingClientRect(),x=(event.clientX-r.left)/r.width-.5,y=(event.clientY-r.top)/r.height-.5;hero.style.setProperty('--hero-x',x.toFixed(3));hero.style.setProperty('--hero-y',y.toFixed(3))});
  hero.addEventListener('pointerleave',()=>{hero.style.setProperty('--hero-x',0);hero.style.setProperty('--hero-y',0)});
}

/* 3 — عدادات ورسوم لوحة الأداء */
const analytics=document.querySelector('#analytics');
function resetAnalyticsMotion(){if(!analytics)return;analytics.classList.remove('analytics-in-view');analytics.querySelectorAll('.type-track i,.document-track i').forEach(bar=>{if(!bar.dataset.targetWidth)bar.dataset.targetWidth=bar.style.width;bar.style.width='0'});const radial=document.querySelector('#radial');if(radial){if(!radial.dataset.targetDeg)radial.dataset.targetDeg=radial.style.getPropertyValue('--deg');radial.style.setProperty('--deg','0deg')}}
function playAnalyticsMotion(){if(!analytics)return;resetAnalyticsMotion();requestAnimationFrame(()=>{analytics.classList.add('analytics-in-view');analytics.querySelectorAll('.type-track i,.document-track i').forEach((bar,index)=>setTimeout(()=>bar.style.width=bar.dataset.targetWidth||'0%',80+index*42));const kpis=[...analytics.querySelectorAll('#kpis article>b')];kpis.forEach((b,index)=>{const value=parseInt(b.textContent)||0;b.textContent='0';setTimeout(()=>tweenNumber(b,value,800),index*90)});const radial=document.querySelector('#radial'),radialValue=document.querySelector('#radialValue');if(radial&&radialValue){const value=parseInt(radialValue.textContent)||0;radialValue.textContent='0%';setTimeout(()=>{radial.style.setProperty('--deg',radial.dataset.targetDeg||value*3.6+'deg');tweenNumber(radialValue,value,1050,'%')},130)};['completePct','activePct','earlyPct'].forEach((id,index)=>{const el=document.getElementById(id),value=parseInt(el?.textContent)||0;if(el){el.textContent='0%';setTimeout(()=>tweenNumber(el,value,800,'%'),220+index*100)}})})}
if(analytics){resetAnalyticsMotion();const analyticsObserver=new IntersectionObserver(entries=>{const entry=entries[0];if(entry.isIntersecting)playAnalyticsMotion();else resetAnalyticsMotion()},{threshold:.18});analyticsObserver.observe(analytics)}

/* 4 و9 — كشف البطاقات، تحريك مؤشرات الإنجاز، وتحميل الصور بهيكل لامع */
const observedCards=new WeakSet();
const cardObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
  const card=entry.target;
  const gauge=card.querySelector('.project-gauge');
  const circle=gauge?.querySelector('.project-gauge-value');
  const number=gauge?.querySelector('b');
  const progress=Math.max(0,Math.min(100,Number(gauge?.dataset.progress)||0));
  if(entry.isIntersecting){
    card.classList.add('motion-visible');
    if(circle) requestAnimationFrame(()=>{circle.style.strokeDashoffset=String(projectGaugeOffset(progress))});
    if(number){number.textContent='0%';setTimeout(()=>tweenNumber(number,progress,850,'%'),140)}
  }else{
    card.classList.remove('motion-visible');
    if(circle) circle.style.strokeDashoffset=String(projectGaugeOffset(progress));
  }
}),{threshold:.16,rootMargin:'0px 0px -4%'});
function prepareProjectCards(){
  document.querySelectorAll('#grid .card').forEach((card,index)=>{
    if(observedCards.has(card))return;
    observedCards.add(card);
    card.classList.add('motion-pending');
    card.style.setProperty('--card-delay',Math.min(index%6,5)*70+'ms');
    const circle=card.querySelector('.project-gauge-value');
    if(circle){
      const gauge=card.querySelector('.project-gauge');
      const progress=Math.max(0,Math.min(100,Number(gauge?.dataset.progress)||0));
      circle.style.strokeDashoffset=String(projectGaugeOffset(progress));
    }
    cardObserver.observe(card);
  })
}
if(grid){new MutationObserver(prepareProjectCards).observe(grid,{childList:true});prepareProjectCards()}

/* 5 — انتقال نافذة التفاصيل مع إغلاق موثوق والحفاظ على موضع الصفحة */
const originalShow=show;
show=function(project){
  originalShow(project);
  details.classList.remove('details-animate','details-closing');
  requestAnimationFrame(()=>requestAnimationFrame(()=>details.classList.add('details-animate')));
};
let detailsCloseTimer=0;
let detailsShouldRestore=false;
function restoreDetailsScrollPosition(){
  const targetY=Math.max(0,Number(detailsScrollY)||0);
  const rootElement=document.documentElement;
  const previousScrollBehavior=rootElement.style.scrollBehavior;
  rootElement.style.scrollBehavior='auto';
  const restore=()=>window.scrollTo(0,targetY);
  restore();
  requestAnimationFrame(()=>{
    restore();
    if(detailsOpener&&detailsOpener.isConnected){
      try{detailsOpener.focus({preventScroll:true})}catch(_){/* متصفح قديم */}
    }
    requestAnimationFrame(()=>{rootElement.style.scrollBehavior=previousScrollBehavior});
  });
}
function closeDetailsAnimated(event){
  if(event){event.preventDefault();event.stopPropagation()}
  if(!details?.open||details.classList.contains('details-closing'))return;
  detailsShouldRestore=true;
  details.classList.add('details-closing');
  clearTimeout(detailsCloseTimer);
  detailsCloseTimer=window.setTimeout(()=>{
    if(details.open)details.close();
    details.classList.remove('details-closing','details-animate');
  },motionReduced?0:240);
}
const closeButton=details?.querySelector('.close');
if(closeButton){
  closeButton.type='button';
  closeButton.onclick=null;
  closeButton.addEventListener('click',closeDetailsAnimated);
}
if(details){
  details.addEventListener('cancel',event=>{event.preventDefault();closeDetailsAnimated(event)});
  details.addEventListener('close',()=>{
    clearTimeout(detailsCloseTimer);
    details.classList.remove('details-closing','details-animate');
    if(detailsShouldRestore){detailsShouldRestore=false;restoreDetailsScrollPosition()}
  });
}

/* 8 — مؤشر التنقل الذهبي بحسب القسم الظاهر */
const navLinks=[...document.querySelectorAll('header nav a[href^="#"]')];
const navSections=navLinks.map(link=>[link,document.querySelector(link.getAttribute('href'))]).filter(([,section])=>section);
const navObserver=new IntersectionObserver(entries=>{const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];if(!visible)return;navLinks.forEach(link=>link.classList.toggle('nav-active',link.getAttribute('href')==='#'+visible.target.id))},{rootMargin:'-25% 0px -55%',threshold:[0,.1,.3,.6]});
navSections.forEach(([,section])=>navObserver.observe(section));

/* V35 — صور المشاريع المتتابعة في مقدمة المنصة (3 ثوانٍ لكل صورة) */
function resolveHeroProjectImage(project){
  const projectName=String(project?.name||'').trim();
  const named=namedProjectBackgrounds.find(([label])=>projectName.includes(label));
  return named?.[1]||projectBackgrounds[String(project?.code||'').trim()]||'';
}
function initHeroProjectSlideshow(){
  if(!hero||hero.querySelector('.hero-project-slideshow'))return;
  const images=[...new Set(projects.map(resolveHeroProjectImage).filter(Boolean))];
  /* تبدأ المقدمة من الصورة الثانية بدل الصورة السابقة، ثم تستمر بالتتابع الطبيعي */
  if(images.length>1)images.push(images.shift());
  if(!images.length)return;
  const stage=document.createElement('div');
  stage.className='hero-project-slideshow';
  stage.setAttribute('aria-hidden','true');
  stage.dataset.slideDuration='3000';
  stage.innerHTML='<div class="hero-project-slide"></div><div class="hero-project-slide"></div>';
  hero.prepend(stage);
  const slides=[...stage.children];
  let activeLayer=0,currentIndex=0,intervalId=0,startDelayId=0;
  const assignImage=(layer,source)=>{layer.style.backgroundImage=`url("${source}")`};
  const preload=index=>{if(images[index]){const image=new Image();image.src=images[index]}};
  assignImage(slides[0],images[0]);
  slides[0].classList.add('is-active');
  preload(images.length>1?1:0);
  if(images.length===1||motionReduced)return;
  const showNext=()=>{
    const nextIndex=(currentIndex+1)%images.length;
    const nextLayer=1-activeLayer;
    assignImage(slides[nextLayer],images[nextIndex]);
    requestAnimationFrame(()=>{
      slides[nextLayer].classList.add('is-active');
      slides[activeLayer].classList.remove('is-active');
      activeLayer=nextLayer;
      currentIndex=nextIndex;
      preload((currentIndex+1)%images.length);
    });
  };
  const start=()=>{
    clearInterval(intervalId);
    intervalId=window.setInterval(showNext,3000);
  };
  const stop=()=>{clearTimeout(startDelayId);clearInterval(intervalId)};
  /* يبدأ العد بعد انتهاء أنميشن الدخول، حتى تظهر أول صورة ثلاث ثوانٍ كاملة */
  startDelayId=window.setTimeout(start,4000);
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)stop();
    else{clearTimeout(startDelayId);startDelayId=window.setTimeout(start,3000)}
  });
}
initHeroProjectSlideshow();



/* V35 — معرض المشاريع المتحرك في القسم السفلي */
function initProjectShowcase(){
  const shell=document.querySelector('#projectShowcase');
  if(!shell||shell.dataset.ready==='1')return;
  const slides=projects.map(project=>({project,image:resolveHeroProjectImage(project)})).filter(item=>item.image);
  if(!slides.length)return;
  shell.dataset.ready='1';
  const layers=[...shell.querySelectorAll('.showcase-image-layer')];
  const currentEl=document.querySelector('#showcaseCurrent');
  const totalEl=document.querySelector('#showcaseTotal');
  const codeEl=document.querySelector('#showcaseCode');
  const statusEl=document.querySelector('#showcaseStatus');
  const nameEl=document.querySelector('#showcaseName');
  const locationEl=document.querySelector('#showcaseLocation');
  const sideNameEl=document.querySelector('#showcaseSideName');
  const sideLocationEl=document.querySelector('#showcaseSideLocation');
  const typeEl=document.querySelector('#showcaseType');
  const managerEl=document.querySelector('#showcaseManager');
  const progressEl=document.querySelector('#showcaseProgress');
  const meterEl=document.querySelector('#showcaseMeter');
  const dotsEl=document.querySelector('#showcaseDots');
  const openEl=document.querySelector('#showcaseOpen');
  let index=0,activeLayer=0,timer=0,paused=false;
  totalEl.textContent=String(slides.length).padStart(2,'0');
  dotsEl.innerHTML=slides.map((_,i)=>`<button type="button" aria-label="المشروع ${i+1}"></button>`).join('');
  const dots=[...dotsEl.children];
  const restartLine=()=>{shell.classList.remove('is-running');void shell.offsetWidth;if(!motionReduced)shell.classList.add('is-running')};
  const setLayer=(layer,src)=>{layer.style.backgroundImage=`url("${src}")`};
  const update=(nextIndex,instant=false)=>{
    index=(nextIndex+slides.length)%slides.length;
    const item=slides[index],project=item.project;
    const nextLayer=instant?activeLayer:1-activeLayer;
    setLayer(layers[nextLayer],item.image);
    requestAnimationFrame(()=>{
      layers[nextLayer].classList.add('is-active');
      if(nextLayer!==activeLayer)layers[activeLayer].classList.remove('is-active');
      activeLayer=nextLayer;
    });
    currentEl.textContent=String(index+1).padStart(2,'0');
    codeEl.textContent='#'+(project.code||'—');
    statusEl.textContent=project.status||'—';
    nameEl.textContent=project.name||'مشروع';
    locationEl.textContent='⌖ '+(project.location||'الموقع غير محدد');
    sideNameEl.textContent=project.name||'مشروع';
    sideLocationEl.textContent=project.location||'—';
    typeEl.textContent=project.type||'—';
    managerEl.textContent=project.manager||'—';
    progressEl.textContent=(Number(project.progress)||0)+'%';
    meterEl.style.width=Math.max(0,Math.min(100,Number(project.progress)||0))+'%';
    dots.forEach((dot,i)=>dot.classList.toggle('is-active',i===index));
    restartLine();
    const preload=slides[(index+1)%slides.length]?.image;if(preload){const img=new Image();img.src=preload}
  };
  const stop=()=>{clearInterval(timer);timer=0};
  const start=()=>{stop();if(slides.length>1&&!motionReduced&&!paused)timer=window.setInterval(()=>update(index+1),3000)};
  const navigate=next=>{update(next);start()};
  document.querySelector('#showcasePrev')?.addEventListener('click',()=>navigate(index-1));
  document.querySelector('#showcaseNext')?.addEventListener('click',()=>navigate(index+1));
  dots.forEach((dot,i)=>dot.addEventListener('click',()=>navigate(i)));
  openEl?.addEventListener('click',()=>{
    const project=slides[index].project;
    activeStage=null;
    typeFilter.value='الكل';
    ownerFilter.value='الكل';
    search.value=project.name||project.code||'';
    clearDashboardSelection();
    render();
    document.querySelector('#projects')?.scrollIntoView({behavior:'smooth',block:'start'});
  });
  shell.addEventListener('mouseenter',()=>{paused=true;stop();shell.classList.remove('is-running')});
  shell.addEventListener('mouseleave',()=>{paused=false;restartLine();start()});
  shell.addEventListener('focusin',()=>{paused=true;stop();shell.classList.remove('is-running')});
  shell.addEventListener('focusout',()=>{paused=false;restartLine();start()});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else start()});
  update(0,true);
  start();
}
initProjectShowcase();


/* V35 — أرقام وإنجازات الشركة */
function initCompanyAchievements(){
  const section=document.querySelector('#achievements');
  if(!section)return;
  const defaults={experienceYears:'',executedArea:'',commitment:''};
  let stored={};
  try{stored=JSON.parse(localStorage.getItem('maskanCompanyStatsV1')||'null')||{}}catch(_){stored={}}
  const stats={...defaults,...(window.MASKAN_EXPORTED_COMPANY_STATS||{}),...stored};
  const values={
    achievementProjects:projects.length,
    achievementYears:stats.experienceYears,
    achievementArea:stats.executedArea,
    achievementCommitment:stats.commitment
  };
  const formatValue=(value,suffix)=>{
    if(value===null||value===undefined||String(value).trim()==='')return '—';
    const numeric=Number(String(value).replace(/,/g,''));
    if(!Number.isFinite(numeric))return String(value);
    return new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(numeric)+suffix;
  };
  Object.entries(values).forEach(([id,value])=>{
    const el=document.getElementById(id);if(!el)return;
    const suffix=el.dataset.suffix||'';
    el.dataset.value=String(value??'');
    el.textContent=formatValue(value,suffix);
  });
  section.querySelectorAll('.achievement-card').forEach((card,index)=>card.style.setProperty('--achievement-delay',index*90+'ms'));
  const reveal=()=>{
    section.classList.add('is-visible');
    section.querySelectorAll('.achievement-value').forEach((el,index)=>{
      const raw=el.dataset.value;
      const target=Number(String(raw).replace(/,/g,''));
      if(!Number.isFinite(target)||String(raw).trim()==='')return;
      const suffix=el.dataset.suffix||'';
      el.textContent='0'+suffix;
      setTimeout(()=>{
        if(typeof tweenNumber==='function')tweenNumber(el,target,1000,suffix);
        else el.textContent=formatValue(target,suffix);
      },130+index*100);
    });
  };
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){reveal();return}
  let played=false;
  const observer=new IntersectionObserver(entries=>{
    if(entries[0].isIntersecting&&!played){played=true;reveal();observer.disconnect()}
  },{threshold:.22});
  observer.observe(section);
}
initCompanyAchievements();


/* V35 — أنميشن الإغلاق الاحترافي (3 ثوانٍ) */
function initPlatformClosingAnimation(){
  const trigger=document.getElementById('closePlatform');
  if(!trigger||trigger.dataset.outroReady==='1')return;
  trigger.dataset.outroReady='1';
  let closing=false;
  let savedScrollY=0;
  const totalDuration=3000;
  const progressDuration=2550;

  const restorePlatform=(overlay)=>{
    overlay?.remove();
    document.body.classList.remove('outro-playing');
    trigger.disabled=false;
    closing=false;
    requestAnimationFrame(()=>window.scrollTo({top:savedScrollY,left:0,behavior:'auto'}));
  };

  const showCloseFallback=(overlay)=>{
    if(!document.body.contains(overlay))return;
    overlay.className='toc-intro toc-outro outro-blocked';
    overlay.innerHTML=`<div class="toc-outro-fallback" role="dialog" aria-modal="true" aria-label="تم إنهاء جلسة المنصة">
      <img src="maskan-logo.png" alt="شعار مسكن الكيان للمقاولات">
      <h2>تم إنهاء جلسة المنصة</h2>
      <p>يمكنك الآن إغلاق النافذة. منع المتصفح الإغلاق التلقائي حفاظًا على الأمان.</p>
      <button type="button" class="toc-outro-return" data-outro-return>العودة للمنصة</button>
    </div>`;
    overlay.querySelector('[data-outro-return]')?.addEventListener('click',()=>restorePlatform(overlay),{once:true});
  };

  trigger.addEventListener('click',()=>{
    if(closing||document.body.classList.contains('intro-playing'))return;
    closing=true;
    savedScrollY=window.scrollY||document.documentElement.scrollTop||0;
    trigger.disabled=true;

    const overlay=document.createElement('div');
    overlay.className='toc-intro toc-outro';
    overlay.setAttribute('aria-label','جاري إغلاق سحابة المكتب الفني');
    overlay.innerHTML=`<div class="toc-intro-inner">
      <div class="toc-intro-emblem" aria-hidden="true">
        <span class="toc-intro-orbit"></span>
        <i class="toc-intro-spark s1"></i><i class="toc-intro-spark s2"></i><i class="toc-intro-spark s3"></i><i class="toc-intro-spark s4"></i>
        <span class="toc-intro-logo-shell"><span class="toc-intro-logo"><img src="maskan-logo.png" alt=""></span></span>
      </div>
      <div class="toc-intro-title"><b>شكرًا لاستخدام سحابة المكتب الفني</b><strong>Technical Office Cloud <em>(TOC)</em></strong></div>
      <i class="toc-intro-divider" aria-hidden="true"></i>
      <div class="toc-intro-loader" role="progressbar" aria-label="إغلاق المنصة" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100">
        <div class="toc-intro-track"><i data-outro-bar></i></div>
        <div class="toc-intro-loader-meta"><span>جاري إغلاق المنصة</span><b data-outro-percent>100%</b></div>
      </div>
    </div>`;
    document.body.appendChild(overlay);
    document.body.classList.add('outro-playing');

    const bar=overlay.querySelector('[data-outro-bar]');
    const percent=overlay.querySelector('[data-outro-percent]');
    const progress=overlay.querySelector('[role="progressbar"]');
    const started=performance.now();
    const update=now=>{
      const elapsed=Math.max(0,now-started);
      const ratio=Math.min(1,elapsed/progressDuration);
      const eased=ratio*ratio*(3-2*ratio);
      const value=Math.max(0,100-Math.round(eased*100));
      bar.style.width=value+'%';
      percent.textContent=value+'%';
      progress.setAttribute('aria-valuenow',String(value));
      if(value>0)requestAnimationFrame(update);
    };
    requestAnimationFrame(update);

    window.setTimeout(()=>{
      try{window.close()}catch(_){/* الإغلاق قد يمنعه المتصفح */}
      window.setTimeout(()=>showCloseFallback(overlay),260);
    },totalDuration);
  });
}
initPlatformClosingAnimation();
