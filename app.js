const $=id=>document.getElementById(id);
let currency=localStorage.getItem('pocket-ledger-currency')||'USD',iqdRate=Number(localStorage.getItem('pocket-ledger-iqd-rate'))||1460;
const usdFmt=new Intl.NumberFormat(undefined,{style:'currency',currency:'USD'});
const iqdFmt=new Intl.NumberFormat(undefined,{maximumFractionDigits:0});
const fmt={format:amt=>currency==='IQD'?`${iqdFmt.format(amt*iqdRate)} IQD`:usdFmt.format(amt)};
const categories={expense:['Food','Transport','Shopping','Bills','Other'],income:['Salary','Freelance','Gift','Other'],rent:['Rent']};
const categoryLabels={ku:{Food:'خۆراک',Transport:'گواستنەوە',Shopping:'کڕین',Bills:'پسوولەکان',Other:'هیتر',Salary:'موچە',Freelance:'کاری ئازاد',Gift:'دیاری',Rent:'کرێ'}};
const categoryLabel=x=>lang==='ku'&&categoryLabels.ku[x]?categoryLabels.ku[x]:x;
const weekdayLabels={en:['S','M','T','W','T','F','S'],ku:['ی','د','س','چ','پ','هـ','ش']};
const labels={en:{balance:'Current balance',income:'Income',spent:'Spent',statistics:'Monthly statistics',show:'Show calendar',hide:'Hide calendar',add:'Add transaction',description:'Description',amount:'Amount',category:'Category',repeat:'Repeat',date:'Date',listings:'Listings',clear:'Clear all',expense:'Expense',rent:'Rent income',once:'One time',daily:'Daily',monthly:'Monthly',yearly:'Yearly',empty:'No transactions yet.',emptyDay:'No transactions on this day.',chart:'Income vs. spending',exportCsv:'Export CSV',exportPdf:'Export PDF',confirmClear:'Delete all transactions?',noDataToExport:'No transactions to export yet.',pdfTitle:'Transaction report',pdfDate:'Date',pdfType:'Type',pdfCategory:'Category',pdfDescription:'Description',pdfAmount:'Amount',pdfTotalIncome:'Total income',pdfTotalExpense:'Total spent',pdfBalance:'Balance'},ku:{balance:'باڵانسی ئێستا',income:'داهات',spent:'خەرجکراو',statistics:'ئاماری مانگانە',show:'پیشاندانی ڕۆژژمێر',hide:'شاردنەوەی ڕۆژژمێر',add:'زیادکردنی مامەڵە',description:'وەسف',amount:'بڕ',category:'پۆل',repeat:'دووبارەکردنەوە',date:'بەروار',listings:'لیستەکان',clear:'هەمووی بسڕەوە',expense:'خەرجی',rent:'کرێی خانوو',once:'یەکجار',daily:'ڕۆژانە',monthly:'مانگانە',yearly:'ساڵانە',empty:'هیچ مامەڵەیەک نییە.',emptyDay:'لەم ڕۆژەدا هیچ مامەڵەیەک نییە.',chart:'داهات بەراورد بە خەرجی',exportCsv:'هەناردەکردنی CSV',exportPdf:'هەناردەکردنی PDF',confirmClear:'دڵنیایت لە سڕینەوەی هەموو مامەڵەکان؟',noDataToExport:'هیچ مامەڵەیەک نییە بۆ هەناردەکردن.',pdfTitle:'ڕاپۆرتی مامەڵەکان',pdfDate:'بەروار',pdfType:'جۆر',pdfCategory:'پۆل',pdfDescription:'وەسف',pdfAmount:'بڕ',pdfTotalIncome:'کۆی داهات',pdfTotalExpense:'کۆی خەرجی',pdfBalance:'باڵانس'}};
let entries=JSON.parse(localStorage.getItem('pocket-ledger-entries')||'[]'),mode='expense',lang=localStorage.getItem('pocket-ledger-language')||'en',isDark=localStorage.getItem('pocket-ledger-dark')==='true',calendarOpen=false,month=new Date();month.setDate(1);let selectedDay=null;
const t=(key)=>labels[lang][key];const kind=()=>mode==='expense'?'expense':'income';const repeatName=x=>t(x||'once');
function save(){localStorage.setItem('pocket-ledger-entries',JSON.stringify(entries))}function populate(){const current=$('category').value;$('category').innerHTML=categories[mode].map(x=>`<option value="${x}">${categoryLabel(x)}</option>`).join('');if(current&&categories[mode].includes(current))$('category').value=current}
function valueInMonth(e,y,m){const start=new Date(`${e.date}T12:00:00`),end=new Date(y,m+1,0),r=e.repeat||'once';if(start>end)return 0;if(r==='once')return start.getFullYear()===y&&start.getMonth()===m?e.amount:0;if(r==='yearly')return start.getMonth()===m?e.amount:0;if(r==='monthly')return e.amount;const first=start.getFullYear()===y&&start.getMonth()===m?start.getDate():1;return e.amount*(end.getDate()-first+1)}
function render(){let totalIn=entries.filter(x=>x.type==='income').reduce((s,x)=>s+x.amount,0),totalOut=entries.filter(x=>x.type==='expense').reduce((s,x)=>s+x.amount,0);$('incomeTotal').textContent=fmt.format(totalIn);$('expenseTotal').textContent=fmt.format(totalOut);$('balance').textContent=fmt.format(totalIn-totalOut);const list=$('transactions');list.replaceChildren();const visible=selectedDay?entries.filter(x=>x.date===selectedDay):entries;updateListingsHeading();if(!visible.length){list.textContent=selectedDay?t('emptyDay'):t('empty');renderMonth();renderChart();return}[...visible].sort((a,b)=>b.date.localeCompare(a.date)).forEach(e=>{const n=$('transactionTemplate').content.firstElementChild.cloneNode(true);n.querySelector('.transaction-icon').textContent=e.mode==='rent'?'🏠':e.type==='income'?'💰':'🛒';n.querySelector('.transaction-details b').textContent=e.description;n.querySelector('.transaction-details small').textContent=`${categoryLabel(e.category)} · ${e.date} · ${repeatName(e.repeat)}`;n.querySelector('.transaction-value b').textContent=`${e.type==='income'?'+':'−'}${fmt.format(e.amount)}`;n.querySelector('button').onclick=()=>{entries=entries.filter(x=>x.id!==e.id);save();render()};list.append(n)});renderMonth();renderChart()}
function updateListingsHeading(){const h=$('listingsHeading');if(!h)return;h.textContent=selectedDay?`${t('listings')} · ${selectedDay}`:t('listings');const c=$('dayFilterClear');if(c)c.style.display=selectedDay?'inline':'none'}
function renderMonth(){const y=month.getFullYear(),m=month.getMonth(),prefix=`${y}-${String(m+1).padStart(2,'0')}`,income=entries.filter(x=>x.type==='income').reduce((s,x)=>s+valueInMonth(x,y,m),0),expense=entries.filter(x=>x.type==='expense').reduce((s,x)=>s+valueInMonth(x,y,m),0);$('monthIncome').textContent=fmt.format(income);$('monthExpense').textContent=fmt.format(expense);$('monthBalance').textContent=fmt.format(income-expense);$('calendarTitle').textContent=month.toLocaleDateString(lang==='ku'?'ckb-IQ':undefined,{month:'long',year:'numeric'});const box=$('calendarDays');box.replaceChildren();for(let i=0;i<new Date(y,m,1).getDay();i++)box.append(document.createElement('span'));for(let d=1;d<=new Date(y,m+1,0).getDate();d++){const date=`${prefix}-${String(d).padStart(2,'0')}`,b=document.createElement('button');b.type='button';b.textContent=d;b.className='calendar-day';if(entries.some(x=>x.date===date))b.classList.add('has-entry');if(selectedDay===date)b.classList.add('selected');b.onclick=()=>{$('date').value=date;selectedDay=selectedDay===date?null:date;render()};box.append(b)}}

function renderChart(){
  const canvas=$('incomeExpenseChart');if(!canvas)return;
  const cssWidth=canvas.clientWidth||600,cssHeight=canvas.clientHeight||220;
  const dpr=window.devicePixelRatio||1;
  canvas.width=cssWidth*dpr;canvas.height=cssHeight*dpr;
  const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,cssWidth,cssHeight);
  const style=getComputedStyle(document.body);
  const inkColor=style.getPropertyValue('--ink').trim()||'#102b25';
  const mutedColor=style.getPropertyValue('--muted').trim()||'#6a7b76';
  const lineColor=style.getPropertyValue('--line').trim()||'#e4e9e4';
  const incomeColor='#3fa66b',expenseColor=style.getPropertyValue('--expense').trim()||'#dd6352';
  const months=[];for(let i=5;i>=0;i--){const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-i);months.push(d)}
  const data=months.map(d=>{const y=d.getFullYear(),m=d.getMonth();const income=entries.filter(x=>x.type==='income').reduce((s,x)=>s+valueInMonth(x,y,m),0);const expense=entries.filter(x=>x.type==='expense').reduce((s,x)=>s+valueInMonth(x,y,m),0);return{label:d.toLocaleDateString(lang==='ku'?'ckb-IQ':undefined,{month:'short'}),income,expense}});
  const maxVal=Math.max(1,...data.map(d=>Math.max(d.income,d.expense)));
  const padLeft=8,padRight=8,padTop=14,padBottom=26;
  const chartW=cssWidth-padLeft-padRight,chartH=cssHeight-padTop-padBottom;
  const gridLines=4;
  ctx.strokeStyle=lineColor;ctx.lineWidth=1;ctx.font='10px system-ui,sans-serif';ctx.fillStyle=mutedColor;
  for(let i=0;i<=gridLines;i++){const y=padTop+chartH-(chartH/gridLines)*i;ctx.beginPath();ctx.moveTo(padLeft,y);ctx.lineTo(cssWidth-padRight,y);ctx.stroke()}
  const groupW=chartW/data.length,barW=Math.min(20,groupW/4),gap=6;
  data.forEach((d,i)=>{
    const groupX=padLeft+groupW*i+groupW/2;
    const incH=(d.income/maxVal)*chartH,expH=(d.expense/maxVal)*chartH;
    ctx.fillStyle=incomeColor;
    ctx.fillRect(groupX-barW-gap/2,padTop+chartH-incH,barW,incH);
    ctx.fillStyle=expenseColor;
    ctx.fillRect(groupX+gap/2,padTop+chartH-expH,barW,expH);
    ctx.fillStyle=mutedColor;ctx.textAlign='center';
    ctx.fillText(d.label,groupX,cssHeight-8);
  });
}
window.addEventListener('resize',()=>renderChart());

function toCsvField(v){return `"${String(v==null?'':v).replace(/"/g,'""')}"`}
function exportCSV(){
  if(!entries.length){alert(t('noDataToExport'));return}
  const header=[t('pdfDate'),t('pdfType'),t('pdfCategory'),t('pdfDescription'),t('pdfAmount'),t('repeat')];
  const rows=[...entries].sort((a,b)=>a.date.localeCompare(b.date)).map(e=>[e.date,e.type==='income'?t('income'):t('spent'),categoryLabel(e.category),e.description,e.amount,repeatName(e.repeat)]);
  const csv=[header,...rows].map(r=>r.map(toCsvField).join(',')).join('\r\n');
  const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=`transactions-${new Date().toISOString().slice(0,10)}.csv`;document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);
}
function exportPDF(){
  if(!entries.length){alert(t('noDataToExport'));return}
  const sorted=[...entries].sort((a,b)=>b.date.localeCompare(a.date));
  const totalIn=entries.filter(x=>x.type==='income').reduce((s,x)=>s+x.amount,0);
  const totalOut=entries.filter(x=>x.type==='expense').reduce((s,x)=>s+x.amount,0);
  const dir=lang==='ku'?'rtl':'ltr';
  const rowsHtml=sorted.map(e=>`<tr><td>${e.date}</td><td>${e.type==='income'?t('income'):t('spent')}</td><td>${categoryLabel(e.category)}</td><td>${(e.description||'').replace(/</g,'&lt;')}</td><td>${e.type==='income'?'+':'−'}${fmt.format(e.amount)}</td></tr>`).join('');
  const html=`<!doctype html><html lang="${lang==='ku'?'ckb':'en'}" dir="${dir}"><head><meta charset="utf-8"><title>${t('pdfTitle')}</title>
  <style>body{font-family:system-ui,sans-serif;padding:24px;color:#102b25}h1{font-size:20px;margin-bottom:2px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{padding:8px 6px;border-bottom:1px solid #e4e9e4;font-size:12px;text-align:${dir==='rtl'?'right':'left'}}th{color:#6a7b76;font-weight:700}.totals{margin-top:18px;font-size:13px}.totals div{display:flex;justify-content:space-between;padding:4px 0;max-width:280px}.totals b{font-weight:800}</style></head>
  <body><h1>${t('pdfTitle')}</h1><small>${new Date().toLocaleDateString(lang==='ku'?'ckb-IQ':undefined)}</small>
  <table><thead><tr><th>${t('pdfDate')}</th><th>${t('pdfType')}</th><th>${t('pdfCategory')}</th><th>${t('pdfDescription')}</th><th>${t('pdfAmount')}</th></tr></thead><tbody>${rowsHtml}</tbody></table>
  <div class="totals"><div><span>${t('pdfTotalIncome')}</span><b>${fmt.format(totalIn)}</b></div><div><span>${t('pdfTotalExpense')}</span><b>${fmt.format(totalOut)}</b></div><div><span>${t('pdfBalance')}</span><b>${fmt.format(totalIn-totalOut)}</b></div></div>
  <script>window.onload=()=>{setTimeout(()=>window.print(),200)}<\/script></body></html>`;
  const win=window.open('','_blank');
  if(!win){alert(t('noDataToExport'));return}
  win.document.open();win.document.write(html);win.document.close();
}

function localize(){document.documentElement.lang=lang==='ku'?'ckb':'en';document.documentElement.dir=lang==='ku'?'rtl':'ltr';document.querySelectorAll('[data-t]').forEach(n=>n.textContent=t(n.dataset.t));$('languageButton').textContent=lang==='en'?'کوردی':'EN';$('calendarToggle').textContent=t(calendarOpen?'hide':'show');$('tabName').textContent=mode==='rent'?t('rent'):mode==='income'?t('income'):t('expense');[...$('repeat').options].forEach(o=>o.textContent=t(o.value));const wd=$('calendarWeekdays');if(wd)[...wd.children].forEach((s,i)=>s.textContent=weekdayLabels[lang][i]);render()}
document.querySelectorAll('.type-option').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;document.querySelectorAll('.type-option').forEach(x=>x.classList.toggle('active',x===b));populate();localize()});$('transactionForm').onsubmit=e=>{e.preventDefault();entries.push({id:Date.now(),mode,type:kind(),description:$('description').value.trim(),amount:Number($('amount').value),category:$('category').value,repeat:$('repeat').value,date:$('date').value});save();e.target.reset();$('date').value=new Date().toISOString().slice(0,10);populate();render()};$('calendarToggle').onclick=()=>{calendarOpen=!calendarOpen;$('calendarPanel').classList.toggle('open',calendarOpen);localize()};$('previousMonth').onclick=()=>{month.setMonth(month.getMonth()-1);renderMonth()};$('nextMonth').onclick=()=>{month.setMonth(month.getMonth()+1);renderMonth()};$('clearButton').onclick=()=>{if(confirm(t('confirmClear'))){entries=[];save();render()}};$('dayFilterClear').onclick=()=>{selectedDay=null;render()};$('languageButton').onclick=()=>{lang=lang==='en'?'ku':'en';localStorage.setItem('pocket-ledger-language',lang);populate();localize()};$('themeButton').onclick=()=>{isDark=!isDark;localStorage.setItem('pocket-ledger-dark',isDark);document.body.classList.toggle('dark',isDark);$('themeButton').textContent=isDark?'☀':'☾';renderChart()};$('currencyButton').textContent=currency;$('currencyButton').onclick=()=>{currency=currency==='USD'?'IQD':'USD';localStorage.setItem('pocket-ledger-currency',currency);$('currencyButton').textContent=currency;render()};$('exportCsvButton').onclick=exportCSV;$('exportPdfButton').onclick=exportPDF;document.body.classList.toggle('dark',isDark);$('themeButton').textContent=isDark?'☀':'☾';$('date').value=new Date().toISOString().slice(0,10);populate();localize();
