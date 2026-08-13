const $=id=>document.getElementById(id);
let currency=localStorage.getItem('pocket-ledger-currency')||'USD',iqdRate=Number(localStorage.getItem('pocket-ledger-iqd-rate'))||1460,isDark=localStorage.getItem('pocket-ledger-dark')==='true';
const usdFmt=new Intl.NumberFormat(undefined,{style:'currency',currency:'USD'});
const iqdFmtN=new Intl.NumberFormat(undefined,{maximumFractionDigits:0});
const money=amt=>currency==='IQD'?`${iqdFmtN.format(amt*iqdRate)} IQD`:usdFmt.format(amt);

// ---------- header ----------
document.body.classList.toggle('dark',isDark);$('themeButton').textContent=isDark?'☀':'☾';
$('themeButton').onclick=()=>{isDark=!isDark;localStorage.setItem('pocket-ledger-dark',isDark);document.body.classList.toggle('dark',isDark);$('themeButton').textContent=isDark?'☀':'☾'};
$('currencyButton').textContent=currency;
$('currencyButton').onclick=()=>{currency=currency==='USD'?'IQD':'USD';localStorage.setItem('pocket-ledger-currency',currency);$('currencyButton').textContent=currency};
$('iqdRateInput').value=iqdRate;
$('saveRateButton').onclick=()=>{const v=Number($('iqdRateInput').value);if(v>0){iqdRate=v;localStorage.setItem('pocket-ledger-iqd-rate',v);$('saveRateButton').textContent='Saved ✓';setTimeout(()=>$('saveRateButton').textContent='Save rate',1200)}};

// ---------- dashboard <-> tool navigation ----------
document.querySelectorAll('.tool-card').forEach(b=>b.onclick=()=>showTool(b.dataset.view));
$('backToDashboard').onclick=()=>{$('toolView').style.display='none';$('dashboardView').style.display='block'};
function showTool(view){$('dashboardView').style.display='none';$('toolView').style.display='block';document.querySelectorAll('.tool-panel').forEach(p=>p.hidden=p.id!==view)}

// ---------- Saved projects (shared store) ----------
function loadProjects(){return JSON.parse(localStorage.getItem('engineer-tools-projects')||'[]')}
function saveProjects(list){localStorage.setItem('engineer-tools-projects',JSON.stringify(list))}
function addProject(name,detail){const list=loadProjects();list.unshift({id:Date.now(),name,detail,date:new Date().toISOString().slice(0,10)});saveProjects(list);renderSavedProjects()}
function renderSavedProjects(){const list=loadProjects(),box=$('spList');box.replaceChildren();if(!list.length){box.textContent='No saved projects yet.';return}list.forEach(p=>{const row=document.createElement('div');row.className='material-row';row.innerHTML=`<div><b>${p.name}</b><br><small>${p.detail} · ${p.date}</small></div>`;const del=document.createElement('button');del.textContent='×';del.className='mat-del';del.onclick=()=>{saveProjects(loadProjects().filter(x=>x.id!==p.id));renderSavedProjects()};row.append(del);box.append(row)})}
renderSavedProjects();

// ---------- 1. Project Cost Calculator ----------
$('pcCalc').onclick=()=>{
  const area=Number($('pcArea').value)||0,rate=Number($('pcRate').value)||0,labor=Number($('pcLabor').value)||0,misc=Number($('pcMisc').value)||0;
  const base=area*rate,laborCost=base*labor/100,miscCost=base*misc/100,total=base+laborCost+miscCost;
  $('pcResult').innerHTML=`<div class="result-row"><span>Base material cost</span><b>${money(base)}</b></div><div class="result-row"><span>Labor (${labor}%)</span><b>${money(laborCost)}</b></div><div class="result-row"><span>Contingency (${misc}%)</span><b>${money(miscCost)}</b></div><div class="result-row total"><span>Total project cost</span><b>${money(total)}</b></div>`;
  $('pcSave').style.display='inline';
  $('pcSave').onclick=()=>addProject('Project Cost Estimate',`${area} m² · Total ${money(total)}`);
};

// ---------- 2. Concrete Calculator ----------
$('ccCalc').onclick=()=>{
  const L=Number($('ccLength').value)||0,W=Number($('ccWidth').value)||0,D=Number($('ccDepth').value)||0;
  const volume=L*W*D;
  const ratio=$('ccMix').value.split(':').map(Number);
  const sum=ratio.reduce((a,b)=>a+b,0);
  const dryVolume=volume*1.54; // bulking + wastage factor
  const cementVol=dryVolume*ratio[0]/sum, sandVol=dryVolume*ratio[1]/sum, aggVol=dryVolume*ratio[2]/sum;
  const cementBags=(cementVol*1440)/50; // 1440 kg/m³ density, 50kg bags
  $('ccResult').innerHTML=`<div class="result-row"><span>Wet volume</span><b>${volume.toFixed(2)} m³</b></div><div class="result-row"><span>Cement</span><b>${cementVol.toFixed(2)} m³ (~${Math.ceil(cementBags)} bags)</b></div><div class="result-row"><span>Sand</span><b>${sandVol.toFixed(2)} m³</b></div><div class="result-row"><span>Aggregate</span><b>${aggVol.toFixed(2)} m³</b></div>`;
};

// ---------- 3. Steel / Rebar Calculator ----------
$('stCalc').onclick=()=>{
  const d=Number($('stDia').value)||0,L=Number($('stLength').value)||0,n=Number($('stCount').value)||0,price=Number($('stPrice').value)||0;
  const unitWeight=(d*d)/162; // kg per meter, standard steel formula
  const totalWeight=unitWeight*L*n;
  const cost=totalWeight*price;
  $('stResult').innerHTML=`<div class="result-row"><span>Unit weight</span><b>${unitWeight.toFixed(3)} kg/m</b></div><div class="result-row"><span>Total weight</span><b>${totalWeight.toFixed(2)} kg</b></div><div class="result-row total"><span>Total cost</span><b>${money(cost)}</b></div>`;
};

// ---------- 4. Unit Converter ----------
const units={
  Length:{base:'m',factors:{mm:0.001,cm:0.01,m:1,km:1000,in:0.0254,ft:0.3048,yd:0.9144,mile:1609.34}},
  Area:{base:'m²',factors:{'mm²':1e-6,'cm²':1e-4,'m²':1,'km²':1e6,'ft²':0.092903,'yd²':0.836127,acre:4046.86,hectare:10000}},
  Volume:{base:'m³',factors:{'mm³':1e-9,'cm³':1e-6,'m³':1,liter:0.001,'ft³':0.0283168,gallon:0.00378541}},
  Weight:{base:'kg',factors:{mg:1e-6,g:0.001,kg:1,ton:1000,lb:0.453592,oz:0.0283495}},
  Pressure:{base:'Pa',factors:{Pa:1,kPa:1000,MPa:1e6,bar:1e5,psi:6894.76,atm:101325}}
};
Object.keys(units).forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;$('ucCategory').append(o)});
function populateUnitSelects(){const cat=units[$('ucCategory').value];[$('ucFromUnit'),$('ucToUnit')].forEach(sel=>{sel.innerHTML=Object.keys(cat.factors).map(u=>`<option value="${u}">${u}</option>`).join('')});$('ucToUnit').selectedIndex=1%Object.keys(cat.factors).length}
function convert(){const cat=units[$('ucCategory').value],from=$('ucFromUnit').value,to=$('ucToUnit').value,val=Number($('ucFromValue').value)||0;const base=val*cat.factors[from];$('ucToValue').value=(base/cat.factors[to]).toFixed(6).replace(/\.?0+$/,'')}
$('ucCategory').onchange=()=>{populateUnitSelects();convert()};
[$('ucFromValue'),$('ucFromUnit'),$('ucToUnit')].forEach(el=>el.addEventListener('input',convert));
populateUnitSelects();convert();

// ---------- 5. Material Cost Tracker ----------
function loadMaterials(){return JSON.parse(localStorage.getItem('engineer-tools-materials')||'[]')}
function saveMaterials(l){localStorage.setItem('engineer-tools-materials',JSON.stringify(l))}
function renderMaterials(){const list=loadMaterials(),box=$('matList');box.replaceChildren();let total=0;list.forEach(m=>{total+=m.cost;const row=document.createElement('div');row.className='material-row';row.innerHTML=`<div><b>${m.name}</b><br><small>${m.qty} ${m.unit} · ${money(m.cost)}</small></div>`;const del=document.createElement('button');del.textContent='×';del.className='mat-del';del.onclick=()=>{saveMaterials(loadMaterials().filter(x=>x.id!==m.id));renderMaterials()};row.append(del);box.append(row)});$('matTotal').innerHTML=`<div class="result-row total"><span>Total material cost</span><b>${money(total)}</b></div>`}
$('matAdd').onclick=()=>{const name=$('matName').value.trim();if(!name)return;const qty=Number($('matQty').value)||0,unit=$('matUnit').value.trim()||'units',cost=Number($('matCost').value)||0;const list=loadMaterials();list.unshift({id:Date.now(),name,qty,unit,cost});saveMaterials(list);$('matName').value='';$('matQty').value='';$('matUnit').value='';$('matCost').value='';renderMaterials()};
renderMaterials();

// ---------- 6. Quotation Generator ----------
function addQuoteRow(desc='',qty=1,price=0){const row=document.createElement('div');row.className='q-item-row';row.innerHTML=`<input class="q-desc" placeholder="Item description" value="${desc}"><input class="q-qty" type="number" min="0" step="1" value="${qty}"><input class="q-price" type="number" min="0" step="0.01" value="${price}"><button type="button" class="mat-del">×</button>`;row.querySelector('.mat-del').onclick=()=>row.remove();$('qItems').append(row)}
$('qAddItem').onclick=()=>addQuoteRow();
addQuoteRow();
$('qGenerate').onclick=()=>{
  const name=$('qName').value.trim()||'Untitled project';
  const rows=[...document.querySelectorAll('.q-item-row')].map(r=>({desc:r.querySelector('.q-desc').value||'Item',qty:Number(r.querySelector('.q-qty').value)||0,price:Number(r.querySelector('.q-price').value)||0}));
  let total=0;
  const lines=rows.map(r=>{const sub=r.qty*r.price;total+=sub;return `<div class="result-row"><span>${r.desc} (${r.qty} × ${money(r.price)})</span><b>${money(sub)}</b></div>`}).join('');
  $('qResult').innerHTML=`<h3>${name}</h3>${lines}<div class="result-row total"><span>Grand total</span><b>${money(total)}</b></div><small>Date: ${new Date().toLocaleDateString()}</small>`;
  $('qPrint').style.display='inline';
  $('qPrint').onclick=()=>window.print();
};

// ---------- 7. Engineering Calculator ----------
const engButtons=['C','←','%','/','7','8','9','*','4','5','6','-','1','2','3','+','0','.','√','='];
engButtons.forEach(b=>{const btn=document.createElement('button');btn.textContent=b;btn.type='button';btn.className='eng-key';btn.onclick=()=>engPress(b);$('engPad').append(btn)});
function engPress(v){
  let cur=$('engDisplay').value;
  if(v==='C'){$('engDisplay').value='0';return}
  if(v==='←'){$('engDisplay').value=cur.length>1?cur.slice(0,-1):'0';return}
  if(v==='√'){try{$('engDisplay').value=String(Math.sqrt(Function('return '+cur)()))}catch(e){$('engDisplay').value='Error'}return}
  if(v==='='){try{$('engDisplay').value=String(Function('return '+cur.replace(/%/g,'/100'))())}catch(e){$('engDisplay').value='Error'}return}
  $('engDisplay').value=(cur==='0'&&!'.'.includes(v))?v:cur+v;
}
