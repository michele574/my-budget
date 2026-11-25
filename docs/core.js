export const initialCategories = [
 ['personal','Spese personali',15000,'bag'],['travel','Vacanze e viaggi',12000,'plane'],['grocery','Supermercato',6000,'cart'],['food','Ristoranti e bar',6000,'cup'],['tobacco','Tabaccheria',1000,'tag'],['games','Videogiochi',0,'game'],
 ...['Carburante','Autostrade e pedaggi','Parcheggi necessari','Assicurazione','Bollo','Revisione','Manutenzione automobile','Pneumatici e tagliandi','Salute e dentista','Università','Abbonamenti','Investimenti finanziari','Fondo pensione','MD Fencing Grip'].map((n,i)=>['excluded'+i,n,0,'tag',true])
].map(([id,name,budget,icon,excluded=false])=>({id,name,budget,icon,excluded,archived:false,annual:false}));
export const monthKey=(date=new Date())=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
export const dayKey=(date=new Date())=>`${monthKey(date)}-${String(date.getDate()).padStart(2,'0')}`;
export const localTime=(date=new Date())=>`${dayKey(date)}T${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
export function createState(){return {version:1,revision:0,plans:{'2000-01':structuredClone(initialCategories)},transactions:[],merchantRules:{},settings:{theme:'system',thresholds:[50,80,90,100]},ignored:[]};}
export function planAt(s,month){const keys=Object.keys(s.plans).filter(k=>k<=month).sort();return s.plans[keys.at(-1)]||initialCategories;}
export function setPlan(s,month,plan){if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw Error('Mese non valido');s.plans[month]=structuredClone(plan);}
export function cents(value){const text=String(value).trim().replace(',','.');if(!/^\d+(\.\d{1,2})?$/.test(text))throw Error('Usa un importo positivo con massimo due decimali.');const n=Math.round(Number(text)*100);if(!Number.isSafeInteger(n)||n>1e11)throw Error('Importo troppo grande');return n;}
export const net=t=>t.amount-t.refunds.reduce((n,r)=>n+r.amount,0);
export const received=t=>t.refunds.reduce((n,r)=>n+r.amount,0);
export const pending=t=>Math.max(0,t.expected-received(t));
export const sum=(items,fn=net)=>items.reduce((n,t)=>n+fn(t),0);
export const normalize=s=>s.trim().toLocaleLowerCase('it-IT');
export function validateTransaction(t){
 if(!t||typeof t.id!=='string'||!t.id||typeof t.category!=='string'||!t.category||typeof t.excluded!=='boolean')throw Error('Movimento non valido');
 for(const k of ['amount','own','expected'])if(!Number.isSafeInteger(t[k])||t[k]<0||t[k]>1e11)throw Error('Importi non validi');
 if(t.amount<=0||t.own+t.expected!==t.amount)throw Error('La quota personale e il rimborso atteso devono uguagliare il totale.');
 if(typeof t.date!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(t.date)||!Number.isFinite(new Date(t.date).getTime())||localTime(new Date(t.date))!==t.date)throw Error('Data non valida');
 for(const k of ['merchant','description','notes','method'])if(typeof t[k]!=='string'||t[k].length>5000)throw Error('Testo non valido');
 if(!Array.isArray(t.refunds)||t.refunds.some(r=>!Number.isSafeInteger(r.amount)||r.amount<=0||!/^\d{4}-\d{2}-\d{2}$/.test(r.date)||!Number.isFinite(new Date(r.date).getTime())||dayKey(new Date(r.date+'T12:00'))!==r.date))throw Error('Rimborsi non validi');
 if(received(t)>t.expected)throw Error('Il rimborso supera quello atteso.');
 if(t.sourceId!==undefined&&(typeof t.sourceId!=='string'||t.sourceId.length>250))throw Error('Identificativo non valido');
 return t;
}
export function duplicate(s,t,excludeId){return s.transactions.find(x=>x.id!==excludeId&&((t.sourceId&&x.sourceId===t.sourceId)||(x.amount===t.amount&&normalize(x.merchant)===normalize(t.merchant)&&Math.abs(new Date(x.date)-new Date(t.date))<120000)));}
export function period(s,from,to){return s.transactions.filter(t=>t.date.slice(0,10)>=from&&t.date.slice(0,10)<=to);}
export function monthSummary(s,month){const ts=s.transactions.filter(t=>t.date.startsWith(month));const plan=planAt(s,month);return {budget:sum(plan.filter(c=>!c.excluded&&!c.archived),c=>c.budget),spent:sum(ts.filter(t=>!t.excluded)),excluded:sum(ts.filter(t=>t.excluded)),transactions:ts,plan};}
export function categorySummary(s,c,month){const prefix=c.annual?month.slice(0,4):month;const spent=sum(s.transactions.filter(t=>!t.excluded&&t.category===c.id&&t.date.startsWith(prefix)));let budget=c.budget;if(c.annual){budget=0;for(let m=1;m<=12;m++){const p=planAt(s,`${prefix}-${String(m).padStart(2,'0')}`).find(x=>x.id===c.id);if(p&&!p.archived&&!p.excluded)budget+=p.budget;}}return {spent,budget};}
export function validateState(s){
 if(!s||s.version!==1||!s.plans||!Array.isArray(s.transactions)||!s.settings||!['system','light','dark'].includes(s.settings.theme)||!Array.isArray(s.settings.thresholds)||s.settings.thresholds.some(n=>![50,80,90,100].includes(n)))throw Error('Backup non compatibile');
 if(!Object.keys(s.plans).length||Object.keys(s.plans).some(k=>!/^\d{4}-(0[1-9]|1[0-2])$/.test(k)))throw Error('Storico budget non valido');
 for(const p of Object.values(s.plans)){if(!Array.isArray(p)||new Set(p.map(c=>c.id)).size!==p.length)throw Error('Categorie duplicate');for(const c of p)if(typeof c.id!=='string'||!c.id||typeof c.name!=='string'||!c.name.trim()||c.name.length>100||!Number.isSafeInteger(c.budget)||c.budget<0||c.budget>1e11||typeof c.excluded!=='boolean'||typeof c.archived!=='boolean'||typeof c.annual!=='boolean')throw Error('Categoria non valida');}
 const ids=new Set();for(const t of s.transactions){validateTransaction(t);if(ids.has(t.id))throw Error('Movimenti duplicati');ids.add(t.id);if(!Object.values(s.plans).some(p=>p.some(c=>c.id===t.category)))throw Error('Categoria del movimento assente');}
 if(!s.merchantRules||typeof s.merchantRules!=='object'||Array.isArray(s.merchantRules)||!Array.isArray(s.ignored)||s.ignored.some(x=>typeof x!=='string'))throw Error('Preferenze non valide');return s;
}
export const csvFields=['id','date','amount','own','expected','merchant','category','excluded','description','method','notes','refunds','sourceId'];
export function exportCSV(ts){const quote=x=>'"'+String(x??'').replaceAll('"','""')+'"';return '\ufeff'+[csvFields.join(';'),...ts.map(t=>csvFields.map(k=>quote(k==='refunds'?JSON.stringify(t[k]):['amount','own','expected'].includes(k)?(t[k]/100).toFixed(2):t[k])).join(';'))].join('\r\n');}
export function parseCSV(text){text=text.replace(/^\ufeff/,'');const rows=[];let row=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===';'&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=c;}if(quoted)throw Error('CSV: virgolette non chiuse');row.push(cell);if(row.some(Boolean))rows.push(row);if(rows.shift()?.join(';')!==csvFields.join(';'))throw Error('Usa il modello CSV esportato da My Budget.');return rows.map((r,i)=>{if(r.length!==csvFields.length)throw Error(`CSV: riga ${i+2} non valida`);const t=Object.fromEntries(csvFields.map((k,j)=>[k,r[j]]));for(const k of ['amount','own','expected'])t[k]=cents(t[k]);if(!['true','false'].includes(t.excluded))throw Error('Inclusione non valida');t.excluded=t.excluded==='true';t.refunds=JSON.parse(t.refunds||'[]');return validateTransaction(t);});}
