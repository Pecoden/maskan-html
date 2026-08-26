const KEY='maskanProjectsV1';
const login=document.querySelector('#login'),app=document.querySelector('#adminApp'),editor=document.querySelector('#editor'),form=document.querySelector('#editForm');
let projects=JSON.parse(localStorage.getItem(KEY)||'null')||structuredClone(MASKAN_PROJECTS),editingFiles=[];
const ADMIN_EDITOR_NAME='Ali Mohammed';

const CHANGE_META_KEY='maskanLastChangeV1';
let lastChangeMeta=null;
try{lastChangeMeta=JSON.parse(localStorage.getItem(CHANGE_META_KEY)||'null')}catch(_){lastChangeMeta=null}
function projectLatestAt(project){const values=[project?.lastModifiedAt,...((project?.updateLog||[]).map(entry=>entry?.at))].filter(Boolean).map(value=>({value,date:new Date(value)})).filter(item=>!Number.isNaN(item.date.getTime())).sort((a,b)=>b.date-a.date);return values[0]?.value||''}
function deriveLatestProjectMeta(){let latest=null;projects.forEach(project=>{const at=projectLatestAt(project);if(at&&(!latest||new Date(at)>new Date(latest.at)))latest={at,editor:ADMIN_EDITOR_NAME,action:'تعديل مشروع',projectId:project.id,projectCode:project.code||'',projectName:project.name||'',details:[]}});return latest}
if(!lastChangeMeta?.at)lastChangeMeta=deriveLatestProjectMeta();
function formatAdminUpdateDate(value){const date=new Date(value);return Number.isNaN(date.getTime())?'غير مسجل':new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn',{timeZone:'Asia/Riyadh',weekday:'long',day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h12'}).format(date)}
function describeAdminChange(meta){if(!meta)return 'لا توجد تعديلات مسجلة بعد';const project=meta.projectName?`${meta.projectName}${meta.projectCode?` #${meta.projectCode}`:''}`:'';const details=Array.isArray(meta.details)&&meta.details.length?` — ${meta.details.slice(0,4).join('، ')}`:(meta.summary?` — ${meta.summary}`:'');return `${meta.action||'تحديث البيانات'}${project?` • ${project}`:''}${details}`}
function renderAdminLastUpdate(){const dateEl=document.querySelector('#adminLastUpdate');if(!dateEl)return;dateEl.textContent=lastChangeMeta?.at?formatAdminUpdateDate(lastChangeMeta.at):'لم يُسجّل تعديل بعد'}
function makeChangeMeta(action,project=null,changes=[],at=new Date().toISOString()){const details=(changes||[]).map(change=>change.label||auditFieldLabels[change.field]||change.field).filter(Boolean);return{at,editor:ADMIN_EDITOR_NAME,action,projectId:project?.id||'',projectCode:project?.code||'',projectName:project?.name||'',details,summary:details.join('، ')}}
function persistChangeMeta(meta){if(!meta?.at)return;lastChangeMeta=meta;localStorage.setItem(CHANGE_META_KEY,JSON.stringify(meta));renderAdminLastUpdate()}

const trackedFields=['code','name','owner','manager','location','type','status','progress','startDate','endDate','contractEndDate','missingItems'];
const auditFieldLabels={code:'رقم المشروع',name:'اسم المشروع',owner:'المالك',manager:'مدير المشروع',location:'الموقع',type:'نوع المشروع',status:'حالة المشروع',progress:'نسبة الإنجاز',startDate:'تاريخ البداية',endDate:'تاريخ النهاية',contractEndDate:'تاريخ انتهاء العقد',missingItems:'نواقص المشروع',uploadedFiles:'الملفات المرفوعة'};
function normalizeMissingItems(value){if(Array.isArray(value))return value.map(item=>String(item||'').trim()).filter(Boolean);return String(value||'').split(/\r?\n|،|,/).map(item=>item.trim()).filter(Boolean)}
function comparableValue(value){if(Array.isArray(value))return value.map(item=>String(item)).join(' | ');return String(value??'').trim()}
function fileNames(files){return (files||[]).map(file=>file.name).sort()}
function buildChanges(before,after){
  const changes=[];
  trackedFields.forEach(field=>{const oldValue=field==='missingItems'?normalizeMissingItems(before?.[field]):before?.[field];const newValue=field==='missingItems'?normalizeMissingItems(after?.[field]):after?.[field];if(comparableValue(oldValue)!==comparableValue(newValue))changes.push({field,label:auditFieldLabels[field],before:oldValue,after:newValue})});
  const oldFiles=fileNames(before?.uploadedFiles),newFiles=fileNames(after?.uploadedFiles);
  if(comparableValue(oldFiles)!==comparableValue(newFiles))changes.push({field:'uploadedFiles',label:auditFieldLabels.uploadedFiles,before:oldFiles,after:newFiles});
  return changes;
}
function appendUpdateLog(project,changes,at=new Date().toISOString()){if(!changes.length)return;const existing=Array.isArray(project.updateLog)?project.updateLog:[];project.updateLog=[...existing,{at,editor:ADMIN_EDITOR_NAME,changes}].slice(-50)}
function consolidateSandProjects(list){const source=MASKAN_PROJECTS.find(p=>p.name.includes('الرمال')),sand=list.filter(p=>p.name.includes('الرمال'));if(!source||!sand.length)return list;const combined={...structuredClone(source),id:43,code:'',name:'منازل الرمال',uploadedFiles:sand.flatMap(p=>p.uploadedFiles||[])};let inserted=false;return list.flatMap(p=>{if(!p.name.includes('الرمال'))return[p];if(inserted)return[];inserted=true;return[combined]})}projects=consolidateSandProjects(projects);localStorage.setItem(KEY,JSON.stringify(projects));
function save(changeMeta=null){try{localStorage.setItem(KEY,JSON.stringify(projects));if(changeMeta)persistChangeMeta(changeMeta);return true}catch(e){alert('مساحة التخزين ممتلئة. احذف بعض الملفات الكبيرة أو استخدم ملفات أصغر.');return false}}
function enter(){login.hidden=true;login.style.display='none';app.hidden=false;app.style.display='block';render()}
login.querySelector('form').onsubmit=e=>{e.preventDefault();const user=document.querySelector('#username').value.trim().toLowerCase(),pass=document.querySelector('#password').value.trim(),error=document.querySelector('#loginError');if((user==='ali mohammed'||user==='ali mohamed')&&pass==='1234'){error.hidden=true;enter()}else{error.hidden=false;document.querySelector('#password').focus()}};
document.querySelector('#logout').onclick=()=>location.reload();
function render(){renderAdminLastUpdate();const adminProjectsCount=document.querySelector('#adminProjectsCount');if(adminProjectsCount)adminProjectsCount.textContent=projects.length;const q=document.querySelector('#search').value;document.querySelector('#grid').innerHTML=projects.filter(p=>`${p.name} ${p.code} ${p.location}`.includes(q)).map(p=>{const missing=normalizeMissingItems(p.missingItems);return `<article class="card"><div class="card-head"><span class="badge ${p.status==='مكتمل'?'done':''}">${p.status}</span><small>#${p.code||'—'}</small></div><h3>${p.name}</h3><p>${p.location||'الموقع غير محدد'}</p><div class="percent"><b>الإنجاز</b><strong>${p.progress}%</strong></div><div class="progress"><i style="width:${p.progress}%"></i></div><div class="file-count">▤ ${(p.uploadedFiles||[]).length} ملفات مرفوعة</div>${missing.length?`<div class="admin-missing-count">! ${missing.length} نواقص مسجلة</div>`:''}<button class="edit" data-id="${p.id}">تعديل المشروع وإدارة ملفاته</button></article>`}).join('')}
function renderFiles(){document.querySelector('#currentFiles').innerHTML=editingFiles.length?editingFiles.map((f,i)=>`<div class="file-chip"><span><b>${f.name}</b><small>${formatSize(f.size)}</small></span><button type="button" data-remove-file="${i}">حذف</button></div>`).join(''):'<small>لا توجد ملفات مرفوعة من الموقع.</small>'}
function openEdit(p){for(const el of form.elements)if(el.name&&el.type!=='file'&&el.name!=='missingItemsText')el.value=p?.[el.name]??'';form.elements.missingItemsText.value=normalizeMissingItems(p?.missingItems).join('\n');editingFiles=structuredClone(p?.uploadedFiles||[]);document.querySelector('#projectFiles').value='';renderFiles();editor.showModal()}
document.querySelector('#grid').onclick=e=>{const id=e.target.dataset.id;if(id)openEdit(projects.find(p=>String(p.id)===id))};
document.querySelector('#add').onclick=()=>openEdit({id:'',name:'',code:'',owner:'',manager:'م/ محمد أحمد',location:'',type:'سكني',status:'قيد التنفيذ',progress:0,startDate:'',endDate:'',uploadedFiles:[]});
editor.querySelector('.close').onclick=()=>editor.close();
document.querySelector('#currentFiles').onclick=e=>{const i=e.target.dataset.removeFile;if(i!==undefined){editingFiles.splice(Number(i),1);renderFiles()}};
const readFile=file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve({name:file.name,type:file.type||'application/octet-stream',size:file.size,data:reader.result,addedAt:new Date().toISOString()});reader.onerror=reject;reader.readAsDataURL(file)});
form.onsubmit=async e=>{
  e.preventDefault();
  const selected=[...document.querySelector('#projectFiles').files];
  if(selected.some(f=>f.size>3*1024*1024)){alert('الحد الأقصى للملف الواحد في نسخة HTML هو 3 ميجابايت.');return}
  const button=form.querySelector('button.primary');button.disabled=true;button.textContent='جارٍ حفظ الملفات...';
  try{
    const added=await Promise.all(selected.map(readFile));
    const d=Object.fromEntries(new FormData(form));delete d.projectFiles;
    d.missingItems=normalizeMissingItems(d.missingItemsText);delete d.missingItemsText;
    d.progress=Number(d.progress)||0;d.uploadedFiles=[...editingFiles,...added];
    let changeMeta=null;
    if(d.id){
      const i=projects.findIndex(p=>String(p.id)===String(d.id));
      const previous=structuredClone(projects[i]);
      d.docs=previous.docs||{};d.updateLog=Array.isArray(previous.updateLog)?previous.updateLog:[];d.lastModifiedAt=previous.lastModifiedAt||'';
      const changes=buildChanges(previous,d);
      if(changes.length){const at=new Date().toISOString();d.lastModifiedAt=at;appendUpdateLog(d,changes,at);changeMeta=makeChangeMeta('تعديل مشروع',d,changes,at)}
      projects[i]=d;
    }else{
      const at=new Date().toISOString();d.id=Date.now();d.docs={};d.updateLog=[];d.lastModifiedAt=at;
      const changes=[{field:'created',label:'إنشاء المشروع',before:'غير موجود',after:'تم إنشاء المشروع'}];appendUpdateLog(d,changes,at);changeMeta=makeChangeMeta('إضافة مشروع',d,changes,at);projects.unshift(d);
    }
    if(save(changeMeta)){render();editor.close()}
  }finally{button.disabled=false;button.textContent='حفظ'}
};
document.querySelector('#delete').onclick=()=>{const id=form.elements.id.value;if(id&&confirm('حذف المشروع؟')){const removed=projects.find(p=>String(p.id)===String(id));projects=projects.filter(p=>String(p.id)!==String(id));const meta=makeChangeMeta('حذف مشروع',removed,[{field:'deleted',label:'حذف المشروع'}]);if(save(meta)){render();editor.close()}}};
document.querySelector('#search').oninput=render;
document.querySelector('#reset').onclick=()=>{if(confirm('استعادة بيانات Excel الأصلية؟ سيتم حذف التعديلات والملفات المحلية.')){projects=consolidateSandProjects(structuredClone(MASKAN_PROJECTS));save(makeChangeMeta('استعادة البيانات الأصلية',null,[{field:'reset',label:'إعادة ضبط جميع المشاريع'}]));render()}};
document.querySelector('#export').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(projects,null,2)],{type:'application/json'}));a.download='maskan-projects-backup.json';a.click()};
function formatSize(n){return n<1024?n+' B':n<1048576?(n/1024).toFixed(1)+' KB':(n/1048576).toFixed(1)+' MB'}
document.head.insertAdjacentHTML('beforeend','<link rel="stylesheet" href="logo-transparent.css">');
document.title='إدارة سحابة المكتب الفني | TOC';
const loginPlatformName=document.querySelector('#login form p');
if(loginPlatformName)loginPlatformName.textContent='سحابة المكتب الفني — Technical Office Cloud (TOC)';
const adminBrand=document.querySelector('#adminApp .header-brand');
if(adminBrand){adminBrand.querySelector('b').textContent='سحابة المكتب الفني';adminBrand.querySelector('small').textContent='TOC • لوحة الإدارة • Ali Mohammed'}

const exportDialog=document.querySelector('#exportDialog');
const exportHtmlButton=document.querySelector('#exportHtml');
const exportForm=document.querySelector('#exportForm');

if(exportHtmlButton){
  exportHtmlButton.onclick=()=>{
    if(typeof exportDialog.showModal==='function') exportDialog.showModal();
    else exportDialog.setAttribute('open','');
  };
}
if(exportDialog){
  const closeExport=()=>{
    if(typeof exportDialog.close==='function') exportDialog.close();
    else exportDialog.removeAttribute('open');
  };
  const closeBtn=exportDialog.querySelector('.close');
  if(closeBtn) closeBtn.onclick=closeExport;
  const cancelBtn=document.querySelector('#cancelExport');
  if(cancelBtn) cancelBtn.onclick=closeExport;
  exportDialog.addEventListener('cancel',e=>{e.preventDefault();closeExport()});
}

function exportUpdatedHTML(meta={}){
  if(!window.TOC_EXPORT_TEMPLATE){
    alert('تعذر تحميل قالب التصدير. تأكد من وجود ملف export-template.js بجانب صفحة الإدارة.');
    return;
  }
  const safeJson=JSON.stringify(projects)
    .replace(/</g,'\\u003c')
    .replace(/>/g,'\\u003e')
    .replace(/&/g,'\\u0026');
  const safeCompanyStats=JSON.stringify(companyStats).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
  const exportChangeMeta=lastChangeMeta||deriveLatestProjectMeta()||makeChangeMeta('تحديث النظام',null,[{field:'system',label:'إصدار النسخة المحدثة'}]);
  const safeChangeMeta=JSON.stringify(exportChangeMeta).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
  let html=window.TOC_EXPORT_TEMPLATE.replace('__TOC_PROJECTS_JSON__',safeJson).replace('__TOC_COMPANY_STATS_JSON__',safeCompanyStats).replace('__TOC_CHANGE_META_JSON__',safeChangeMeta);
  const version=String(meta.version||'V35.1').replace(/"/g,'&quot;');
  const updatedBy=String(meta.updatedBy||'غير محدد').replace(/"/g,'&quot;');
  const exportedAt=new Date().toISOString();
  const exportInfo=`<meta name="toc-version" content="${version}"><meta name="toc-last-editor" content="${updatedBy}"><meta name="toc-exported-at" content="${exportedAt}">`;
  html=html.replace('</head>',exportInfo+'</head>');
  const blob=new Blob([html],{type:'text/html;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  const stamp=exportedAt.slice(0,19).replace(/[:T]/g,'-');
  a.href=url;
  a.download=`TOC-${version.replace(/[^A-Za-z0-9._-]/g,'-')}-UPDATED-${stamp}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
  alert('تم إنشاء ملف HTML محدث يحتوي على آخر التعديلات. أرسل الملف الذي تم تنزيله.');
}

if(exportForm){
  exportForm.onsubmit=e=>{
    e.preventDefault();
    const data=Object.fromEntries(new FormData(e.currentTarget));
    exportUpdatedHTML(data);
    if(typeof exportDialog.close==='function') exportDialog.close();
    else exportDialog.removeAttribute('open');
  };
}


/* أرقام وإنجازات الشركة — حفظ محلي وتضمينها في التصدير */
const COMPANY_STATS_KEY='maskanCompanyStatsV1';
let companyStats={experienceYears:'',executedArea:'',commitment:''};
try{companyStats={...companyStats,...(JSON.parse(localStorage.getItem(COMPANY_STATS_KEY)||'null')||{})}}catch(_){}
function renderCompanyStatsAdmin(){
  const statsForm=document.querySelector('#companyStatsForm');
  if(!statsForm)return;
  statsForm.elements.experienceYears.value=companyStats.experienceYears??'';
  statsForm.elements.executedArea.value=companyStats.executedArea??'';
  statsForm.elements.commitment.value=companyStats.commitment??'';
  const count=document.querySelector('#adminProjectsCount');if(count)count.textContent=projects.length;
}
document.querySelector('#companyStatsForm')?.addEventListener('submit',event=>{
  event.preventDefault();
  const data=Object.fromEntries(new FormData(event.currentTarget));
  const previousStats={...companyStats};
  companyStats={
    experienceYears:data.experienceYears===''?'':Math.max(0,Number(data.experienceYears)||0),
    executedArea:data.executedArea===''?'':Math.max(0,Number(data.executedArea)||0),
    commitment:data.commitment===''?'':Math.max(0,Math.min(100,Number(data.commitment)||0))
  };
  localStorage.setItem(COMPANY_STATS_KEY,JSON.stringify(companyStats));
  const statLabels={experienceYears:'سنوات الخبرة',executedArea:'المساحات المنفذة',commitment:'نسبة الالتزام'};
  const statChanges=Object.keys(companyStats).filter(key=>String(previousStats[key]??'')!==String(companyStats[key]??'')).map(key=>({field:key,label:statLabels[key]}));
  if(statChanges.length)persistChangeMeta(makeChangeMeta('تعديل أرقام وإنجازات الشركة',null,statChanges));
  const feedback=document.querySelector('#companyStatsFeedback');
  if(feedback){feedback.textContent='تم حفظ أرقام وإنجازات الشركة.';setTimeout(()=>feedback.textContent='',2200)}
});
renderCompanyStatsAdmin();
