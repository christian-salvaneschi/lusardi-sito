/* =========================================================
   LUSARDI CALCESTRUZZI — script condiviso
   =========================================================
   1) SHEET_CSV_URL: URL del Foglio Google pubblicato in CSV.
   2) FORM_ENDPOINT: invio del form tramite FormSubmit.
   Istruzioni complete nel file ISTRUZIONI.txt.
   ========================================================= */
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRO61M4is-HQLUM7ejfXmIalrY6VIAG2alCVq79tHAxuF5ls9H9uTXTfJsQEfrdDgX2ExDgjYOw8ErV/pub?output=csv";
const FORM_ENDPOINT = "https://formsubmit.co/ajax/chrjs75@gmail.com";

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
  const iSezione=idx("sezione"), iCategoria=idx("categoria"), iElemento=idx("elemento"), iTipo=idx("tipo"),
    iCert=idx("certif"), iSito=idx("sito"), iEnte=idx("ente"),
    iNum=idx("numero"), iRif=idx("riferimento"), iVal=idx("valid"),
    iStato=idx("stato"), iLink=idx("link");
  return rows.slice(1).map(r=>({
    sezione:(iSezione>=0?r[iSezione]:"").trim(),
    categoria:(iCategoria>=0?r[iCategoria]:"").trim(),
    certificazione:(iElemento>=0?r[iElemento]:(iCert>=0?r[iCert]:"")).trim(),
    sito:(iSito>=0?r[iSito]:"").trim(),
    tipo:(iTipo>=0?r[iTipo]:"").trim(),
    ente:(iEnte>=0?r[iEnte]:"").trim(),
    numero:(iRif>=0?r[iRif]:(iNum>=0?r[iNum]:"")).trim(),
    validita:(iStato>=0?r[iStato]:(iVal>=0?r[iVal]:"")).trim(),
    link:(iLink>=0?r[iLink]:"").trim()
  })).filter(o=>o.certificazione);
}

function esc(s){return (s||"").replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

function renderCerts(list){
  const box=document.getElementById("certContent");
  if(!box)return;
  if(!list.length){box.innerHTML='<div class="cert-state">Nessuna certificazione presente al momento.</div>';return;}
  let html='', sezioneCorrente=null;
  for(const c of list){
    const sezione=c.sezione||'Certificazioni';
    if(sezione!==sezioneCorrente){
      if(sezioneCorrente!==null)html+='</div></section>';
      html+='<section class="cert-section"><h3>'+esc(sezione)+'</h3><div class="cert-list">';
      sezioneCorrente=sezione;
    }
    const linkUrl=c.link.replace('export=download','export=view');
    const tipo=(c.tipo||'Certificato').toLowerCase();
    const label=tipo==='dop'?'Vai alla DOP':tipo.includes('marcatura ce')?'Vai alla CE':'Vai al certificato';
    const meta=[c.tipo,c.ente,c.numero,c.validita].filter(Boolean).map(esc).join(' · ');
    const linkCell=linkUrl?'<a class="cert-link" href="'+esc(linkUrl)+'" target="_blank" rel="noopener">'+label+' ↗</a>':'';
    html+='<article class="cert-item"><div class="cert-copy">'
      +'<h4>'+esc(c.certificazione)+'</h4>'
      +(meta?'<p>'+meta+'</p>':'')
      +'</div>'+linkCell+'</article>';
  }
  if(sezioneCorrente!==null)html+='</div></section>';
  box.innerHTML=html;
}

async function loadCerts(){
  const box=document.getElementById("certContent");
  if(!box)return;
  if(!SHEET_CSV_URL){box.innerHTML='<div class="cert-state err">Registro certificazioni non configurato.</div>';return;}
  try{
    const res=await fetch(SHEET_CSV_URL,{cache:"no-store"});
    if(!res.ok)throw new Error("HTTP "+res.status);
    renderCerts(rowsToObjects(parseCSV(await res.text())));
  }catch(e){
    box.innerHTML='<div class="cert-state err">Certificazioni temporaneamente non disponibili.</div>';
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
    const button=form.querySelector('button[type="submit"]');
    button.disabled=true;
    button.textContent="Invio in corso…";
    msg.className="form-msg";
    msg.textContent="";
    try{
      const r=await fetch(FORM_ENDPOINT,{method:"POST",body:new FormData(form),headers:{Accept:"application/json"}});
      const data=await r.json().catch(()=>({}));
      if(!r.ok||data.success===false)throw new Error(data.message||"Invio non riuscito");
      form.reset();
      msg.className="form-msg ok";msg.textContent="Grazie, messaggio inviato. Ti risponderemo il prima possibile.";
    }catch(_){
      msg.className="form-msg ko";msg.textContent="Invio non riuscito. Riprova oppure scrivi a lusardicls@gmail.com.";
    }finally{
      button.disabled=false;
      button.textContent="Invia richiesta";
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
