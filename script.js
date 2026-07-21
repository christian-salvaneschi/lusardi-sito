/* =========================================================
   LUSARDI CALCESTRUZZI — script condiviso
   =========================================================
   1) SHEET_CSV_URL: incolla qui l'URL del Foglio Google pubblicato in CSV.
      Finché è vuoto, la sezione Certificazioni mostra i dati di esempio
      (che sono i certificati reali già inseriti qui sotto).
   2) FORM_ENDPOINT: opzionale, per attivare l'invio del form (Web3Forms).
   Istruzioni complete nel file ISTRUZIONI.txt.
   ========================================================= */
const SHEET_CSV_URL = ""; // es: "https://docs.google.com/spreadsheets/d/e/XXXX/pub?gid=0&single=true&output=csv"
const FORM_ENDPOINT = ""; // es: "https://api.web3forms.com/submit"

/* Certificati reali dell'azienda — usati finché il foglio non è collegato.
   Sono anche il modello esatto delle colonne del foglio. */
const DEMO = [
  {certificazione:"Calcestruzzo CAM — Casarza Ligure",          ente:"ICMQ",  numero:"P854",           validita:"In corso di validità", link:""},
  {certificazione:"Calcestruzzo CAM — Mezzanego",               ente:"ICMQ",  numero:"P855",           validita:"In corso di validità", link:""},
  {certificazione:"Controllo produzione FPC — CLS preconfezionato", ente:"ICMQ", numero:"ICMQ-CLS00880", validita:"In corso di validità", link:""},
  {certificazione:"Sistema Qualità UNI EN ISO 9001:2015",       ente:"—",     numero:"22576",          validita:"In corso di validità", link:""},
  {certificazione:"ISO 9001 — IQNet",                           ente:"IQNet", numero:"IT-104827",      validita:"In corso di validità", link:""},
  {certificazione:"Aggregati per calcestruzzo e ingegneria",    ente:"—",     numero:"1305-CPR-1406",  validita:"In corso di validità", link:""}
];

/* ---------- parser CSV (gestisce virgole tra virgolette) ---------- */
function parseCSV(text){
  const rows=[]; let row=[], field="", q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i], n=text[i+1];
    if(q){
      if(c==='"'&&n==='"'){field+='"';i++;}
      else if(c==='"'){q=false;}
      else field+=c;
    }else{
      if(c==='"')q=true;
      else if(c===','){row.push(field);field="";}
      else if(c==='\n'){row.push(field);rows.push(row);row=[];field="";}
      else if(c==='\r'){/* skip */}
      else field+=c;
    }
  }
  if(field.length||row.length){row.push(field);rows.push(row);}
  return rows.filter(r=>r.some(x=>x.trim()!==""));
}

function rowsToObjects(rows){
  if(!rows.length)return[];
  const head=rows[0].map(h=>h.trim().toLowerCase());
  const idx=k=>head.findIndex(h=>h.startsWith(k));
  const iCert=idx("certif"), iEnte=idx("ente"), iNum=idx("numero"), iVal=idx("valid"), iLink=idx("link");
  return rows.slice(1).map(r=>({
    certificazione:(iCert>=0?r[iCert]:"").trim(),
    ente:(iEnte>=0?r[iEnte]:"").trim(),
    numero:(iNum>=0?r[iNum]:"").trim(),
    validita:(iVal>=0?r[iVal]:"").trim(),
    link:(iLink>=0?r[iLink]:"").trim()
  })).filter(o=>o.certificazione);
}

function esc(s){return (s||"").replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

function renderCerts(list){
  const box=document.getElementById("certContent");
  if(!box)return;
  if(!list.length){box.innerHTML='<div class="cert-state">Nessuna certificazione presente al momento.</div>';return;}
  let html='<table class="cert-table"><thead><tr><th>Certificazione</th><th>Ente</th><th>Numero</th><th>Validità</th><th></th></tr></thead><tbody>';
  for(const c of list){
    const linkCell=c.link?'<a class="cert-link" href="'+esc(c.link)+'" target="_blank" rel="noopener">documento ↗</a>':'';
    html+='<tr>'
      +'<td data-l="Certificazione" class="c-nome">'+esc(c.certificazione)+'</td>'
      +'<td data-l="Ente" class="c-ente">'+(esc(c.ente)||'—')+'</td>'
      +'<td data-l="Numero" class="c-num">'+(esc(c.numero)||'—')+'</td>'
      +'<td data-l="Validità" class="c-val">'+(c.validita?'<span class="badge">'+esc(c.validita)+'</span>':'')+'</td>'
      +'<td data-l="Documento">'+linkCell+'</td>'
      +'</tr>';
  }
  html+='</tbody></table>';
  box.innerHTML=html;
}

async function loadCerts(){
  const box=document.getElementById("certContent");
  if(!box)return;
  const demoNote=document.getElementById("demoNote");
  if(!SHEET_CSV_URL){ if(demoNote)demoNote.hidden=false; renderCerts(DEMO); return; }
  try{
    const res=await fetch(SHEET_CSV_URL,{cache:"no-store"});
    if(!res.ok)throw new Error("HTTP "+res.status);
    renderCerts(rowsToObjects(parseCSV(await res.text())));
  }catch(e){
    if(demoNote){demoNote.hidden=false;demoNote.textContent="◆ Foglio non raggiungibile ora — mostrati i certificati salvati nel sito";}
    renderCerts(DEMO);
    console.warn("Certificazioni:",e);
  }
}

/* ---------- form contatti ---------- */
function initForm(){
  const form=document.getElementById("contactForm");
  if(!form)return;
  form.addEventListener("submit",async function(ev){
    ev.preventDefault();
    const msg=document.getElementById("formMsg");
    if(!FORM_ENDPOINT){
      msg.className="form-msg ok";
      msg.textContent="Modulo non ancora collegato. Per ora scrivici a lusardicls@gmail.com o chiama lo 0185 46266.";
      return;
    }
    try{
      const r=await fetch(FORM_ENDPOINT,{method:"POST",body:new FormData(form),headers:{Accept:"application/json"}});
      if(!r.ok)throw 0;
      form.reset();
      msg.className="form-msg ok";msg.textContent="Grazie, messaggio inviato. Ti risponderemo il prima possibile.";
    }catch(_){
      msg.className="form-msg ko";msg.textContent="Errore durante l'invio. Riprova o scrivici a lusardicls@gmail.com.";
    }
  });
}

/* ---------- menu mobile + anno ---------- */
function initChrome(){
  const btn=document.getElementById("menuBtn"), menu=document.getElementById("menu");
  if(btn&&menu){
    btn.addEventListener("click",()=>menu.classList.toggle("open"));
    menu.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>menu.classList.remove("open")));
  }
  const y=document.getElementById("year"); if(y)y.textContent=new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded",()=>{initChrome();initForm();loadCerts();});
