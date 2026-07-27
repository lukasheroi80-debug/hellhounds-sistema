const defaults = [
  {id:"imperio", name:"Império", category:"Lavagem", dark:"hh-imp", password:"", phone:"", status:"Ativa", notes:"Parceria responsável por serviços de lavagem."},
  {id:"redline", name:"Redline", category:"Contrabando", dark:"red-hl", password:"", phone:"", status:"Ativa", notes:"Contato para serviços de contrabando."},
  {id:"bluekills", name:"Bluekills", category:"Armas", dark:"bk-hh", password:"147", phone:"", status:"Ativa", notes:"Fornecedor parceiro de armamentos."},
  {id:"csn", name:"CSN", category:"Armas", dark:"csn-hh", password:"123", phone:"", status:"Ativa", notes:"Fornecedor parceiro de armamentos."},
  {id:"vl", name:"VL", category:"Armas", dark:"vl-hh", password:"33", phone:"", status:"Ativa", notes:"Fornecedor parceiro de armamentos."},
  {id:"bratva", name:"Bratva", category:"Colete e munições", dark:"", password:"", phone:"497-031", status:"Ativa", notes:"Utilizar apenas o número informado enquanto houver risco de assaltos de carga na cidade."}
];

let partnerships = [];
let firebaseReady = false;
let dbRef = null;

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const categoryIcon = c => ({Lavagem:"🧼",Contrabando:"📦",Armas:"🔫","Colete e munições":"🦺",Outros:"🤝"}[c] || "🤝");

function toast(message){
  const el=$("#toast"); el.textContent=message; el.classList.add("show");
  clearTimeout(window.__toast); window.__toast=setTimeout(()=>el.classList.remove("show"),2200);
}

function saveLocal(){
  localStorage.setItem("hellhounds_partnerships", JSON.stringify(partnerships));
  localStorage.setItem("hellhounds_updated", new Date().toISOString());
}

async function initData(){
  const cfg = window.HELLHOUNDS_FIREBASE_CONFIG;
  if(cfg){
    try{
      const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js");
      const { getDatabase, ref, onValue, set } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js");
      const app=initializeApp(cfg); const db=getDatabase(app); dbRef=ref(db,"partnerships");
      window.__firebaseSet=set;
      onValue(dbRef, snap=>{
        if(snap.exists()) partnerships=Object.values(snap.val());
        else { partnerships=[...defaults]; persist(); }
        render();
      });
      firebaseReady=true;
      $("#syncDot").classList.add("online");
      $("#syncLabel").textContent="Sincronizado";
      $("#syncDetail").textContent="Dados compartilhados em tempo real";
      return;
    }catch(e){ console.warn("Firebase indisponível:", e); }
  }
  partnerships=JSON.parse(localStorage.getItem("hellhounds_partnerships")||"null") || [...defaults];
  render();
}

async function persist(){
  if(firebaseReady && dbRef && window.__firebaseSet){
    const obj={}; partnerships.forEach(p=>obj[p.id]=p);
    await window.__firebaseSet(dbRef,obj);
  }else{
    saveLocal(); render();
  }
}

function updateStats(){
  $("#statTotal").textContent=partnerships.filter(p=>p.status==="Ativa").length;
  $("#statArmas").textContent=partnerships.filter(p=>p.category==="Armas"&&p.status==="Ativa").length;
  $("#statContatos").textContent=partnerships.filter(p=>p.dark||p.phone).length;
  const t=localStorage.getItem("hellhounds_updated");
  $("#statUpdate").textContent=t?new Date(t).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}):"Agora";
}

function infoRow(label,value){
  if(!value) return "";
  const safe=String(value).replaceAll('"',"&quot;");
  return `<div class="info-row"><div><small>${label}</small><b>${safe}</b></div><button class="copy-btn" data-copy="${safe}">📋</button></div>`;
}

function card(p){
  return `<article class="partner-card">
    <div class="partner-top">
      <div class="partner-icon">${categoryIcon(p.category)}</div>
      <div><h3>${p.name}</h3><span class="badge">${p.category}</span></div>
      <span class="status ${p.status==="Pausada"?"paused":""}" title="${p.status}"></span>
    </div>
    <div class="info-list">
      ${infoRow("CANAL DARK",p.dark)}
      ${infoRow("SENHA",p.password)}
      ${infoRow("TELEFONE",p.phone)}
      ${!p.dark&&!p.password&&!p.phone?'<div class="info-row"><div><small>CONTATO</small><b>Não informado</b></div></div>':""}
    </div>
    <p class="partner-notes">${p.notes||"Sem observações."}</p>
    <div class="card-actions">
      <button data-edit="${p.id}">✏️ Editar</button>
      <button class="delete" data-delete="${p.id}">🗑️ Excluir</button>
    </div>
  </article>`;
}

function render(){
  updateStats();
  const q=($("#searchInput")?.value||"").toLowerCase();
  const cat=$("#categoryFilter")?.value||"";
  const filtered=partnerships.filter(p=>{
    const hay=[p.name,p.category,p.dark,p.password,p.phone,p.notes].join(" ").toLowerCase();
    return (!q||hay.includes(q))&&(!cat||p.category===cat);
  });
  if($("#partnershipGrid")){
    $("#partnershipGrid").innerHTML=filtered.map(card).join("");
    $("#emptyState").classList.toggle("hidden",filtered.length>0);
  }
  $("#recentList").innerHTML=partnerships.slice(-5).reverse().map(p=>`
    <div class="recent-item"><div class="recent-icon">${categoryIcon(p.category)}</div>
    <div><b>${p.name}</b><small>${p.category}</small></div><span class="badge">${p.status}</span></div>`).join("");
}

function showSection(name){
  $$(".page-section").forEach(s=>s.classList.add("hidden"));
  $("#"+name+"Section").classList.remove("hidden");
  $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.section===name));
  $("#pageTitle").textContent={dashboard:"Visão geral",parcerias:"Parcerias",avisos:"Avisos"}[name];
  $(".sidebar").classList.remove("open");
  if(name==="parcerias") render();
}

function openModal(p=null){
  $("#partnershipForm").reset();
  $("#editId").value=p?.id||"";
  $("#modalTitle").textContent=p?"Editar parceria":"Nova parceria";
  if(p){
    $("#name").value=p.name; $("#category").value=p.category; $("#dark").value=p.dark||"";
    $("#password").value=p.password||""; $("#phone").value=p.phone||"";
    $("#status").value=p.status||"Ativa"; $("#notes").value=p.notes||"";
  }
  $("#modal").classList.remove("hidden");
}

function closeModal(){ $("#modal").classList.add("hidden"); }

$("#togglePassword").onclick=()=>{ const i=$("#loginPassword"); i.type=i.type==="password"?"text":"password"; };
$("#loginForm").onsubmit=e=>{
  e.preventDefault();
  sessionStorage.setItem("hh_user",$("#loginId").value.trim());
  $("#userIdLabel").textContent="ID "+$("#loginId").value.trim();
  $("#loginView").classList.add("hidden"); $("#appView").classList.remove("hidden");
  initData();
};
$("#logoutBtn").onclick=()=>{ sessionStorage.removeItem("hh_user"); location.reload(); };
$("#menuBtn").onclick=()=>$(".sidebar").classList.toggle("open");
$$(".nav-item").forEach(b=>b.onclick=()=>showSection(b.dataset.section));
$$("[data-go]").forEach(b=>b.onclick=()=>showSection(b.dataset.go));
$("#searchInput").oninput=render; $("#categoryFilter").onchange=render;
$("#addBtn").onclick=()=>openModal();
$("#closeModal").onclick=closeModal; $("#cancelModal").onclick=closeModal;
$("#modal").onclick=e=>{ if(e.target.id==="modal") closeModal(); };

$("#partnershipGrid").onclick=async e=>{
  const copy=e.target.closest("[data-copy]");
  if(copy){ await navigator.clipboard.writeText(copy.dataset.copy); toast("Copiado!"); return; }
  const edit=e.target.closest("[data-edit]");
  if(edit){ openModal(partnerships.find(p=>p.id===edit.dataset.edit)); return; }
  const del=e.target.closest("[data-delete]");
  if(del && confirm("Excluir esta parceria?")){
    partnerships=partnerships.filter(p=>p.id!==del.dataset.delete); await persist(); toast("Parceria excluída.");
  }
};

$("#partnershipForm").onsubmit=async e=>{
  e.preventDefault();
  const editId=$("#editId").value;
  const obj={
    id:editId||crypto.randomUUID(),
    name:$("#name").value.trim(), category:$("#category").value, dark:$("#dark").value.trim(),
    password:$("#password").value.trim(), phone:$("#phone").value.trim(), status:$("#status").value,
    notes:$("#notes").value.trim()
  };
  if(editId) partnerships=partnerships.map(p=>p.id===editId?obj:p);
  else partnerships.push(obj);
  await persist(); closeModal(); toast("Parceria salva.");
};

const existing=sessionStorage.getItem("hh_user");
if(existing){
  $("#userIdLabel").textContent="ID "+existing;
  $("#loginView").classList.add("hidden"); $("#appView").classList.remove("hidden");
  initData();
}
