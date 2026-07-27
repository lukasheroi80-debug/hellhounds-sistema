import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const $ = id => document.getElementById(id);
const $$ = s => [...document.querySelectorAll(s)];
const roleNames = { leader:"Líder", manager:"Gerente", member:"Membro" };
let user = null, profile = null, unsubs = [];
const cache = { members:[], partnerships:[], notices:[], users:[], history:[] };

const passportEmail = value => {
  const id = String(value).trim().toLowerCase().replace(/[^a-z0-9_-]/g,"");
  return id ? `${id}@hellhounds.local` : "";
};
const safe = (v="") => String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const formatDate = ts => {
  if(!ts) return "Agora";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"});
};
function toast(msg,bad=false){const el=$("toast");el.textContent=msg;el.className=`toast show${bad?" error":""}`;clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>el.className="toast",3000)}
const isLeader = () => profile?.role === "leader";
const canManage = () => ["leader","manager"].includes(profile?.role);

async function logAction(action,target,details=""){
  if(!user||!profile)return;
  await addDoc(collection(db,"history"),{action,target,details,userName:profile.name,userId:user.uid,createdAt:serverTimestamp()});
}

$("loginForm").addEventListener("submit",async e=>{
  e.preventDefault();
  $("loginError").textContent="";
  const email=passportEmail($("loginPassport").value);
  if(!email){$("loginError").textContent="Digite um passaporte válido.";return}
  try{await signInWithEmailAndPassword(auth,email,$("loginPassword").value)}
  catch(err){console.error(err);$("loginError").textContent="Passaporte ou senha incorretos."}
});
$("logoutBtn").addEventListener("click",()=>signOut(auth));

onAuthStateChanged(auth,async u=>{
  stopListeners();
  if(!u){
    user=profile=null;
    $("loginView").classList.remove("hidden");
    $("appView").classList.add("hidden");
    return;
  }
  user=u;
  try{
    profile=await ensureProfile(u);
    if(profile.active===false){toast("Esta conta está bloqueada.",true);await signOut(auth);return}
    openApp();
    startListeners();
  }catch(err){
    console.error(err);
    toast("Erro ao carregar o perfil.",true);
    await signOut(auth);
  }
});

async function ensureProfile(u){
  const ref=doc(db,"users",u.uid);
  const snap=await getDoc(ref);
  if(snap.exists()) return {id:snap.id,...snap.data()};
  const usersSnap=await getDocs(collection(db,"users"));
  const first=usersSnap.empty;
  const passport=u.email.split("@")[0];
  const p={name:passport,passport,email:u.email,role:first?"leader":"member",active:true,createdAt:serverTimestamp()};
  await setDoc(ref,p);
  if(first)$("bootstrapBanner").classList.remove("hidden");
  return {id:u.uid,...p};
}
function openApp(){
  $("loginView").classList.add("hidden");
  $("appView").classList.remove("hidden");
  const name=profile.name||profile.passport;
  const role=roleNames[profile.role]||"Membro";
  $("sidebarUserName").textContent=name;
  $("sidebarUserRole").textContent=role;
  $("topUserName").textContent=name;
  $("topUserBadge").textContent=role;
  $("welcomeName").textContent=name.split(" ")[0];
  $("userInitial").textContent=name[0].toUpperCase();
  $$(".leader-only").forEach(el=>el.classList.toggle("hidden",!isLeader()));
  $$(".manager-only").forEach(el=>el.classList.toggle("hidden",!canManage()));
  switchPage("dashboard");
}
function stopListeners(){unsubs.forEach(fn=>fn());unsubs=[]}
function startListeners(){
  unsubs.push(onSnapshot(collection(db,"members"),s=>{cache.members=s.docs.map(d=>({id:d.id,...d.data()}));renderMembers();renderDashboard()}));
  unsubs.push(onSnapshot(collection(db,"partnerships"),s=>{cache.partnerships=s.docs.map(d=>({id:d.id,...d.data()}));renderPartnerships();renderDashboard()}));
  unsubs.push(onSnapshot(query(collection(db,"notices"),orderBy("createdAt","desc")),s=>{cache.notices=s.docs.map(d=>({id:d.id,...d.data()}));renderNotices();renderDashboard()}));
  unsubs.push(onSnapshot(collection(db,"users"),s=>{cache.users=s.docs.map(d=>({id:d.id,...d.data()}));renderUsers();renderDashboard()}));
  if(isLeader()) unsubs.push(onSnapshot(query(collection(db,"history"),orderBy("createdAt","desc"),limit(100)),s=>{cache.history=s.docs.map(d=>({id:d.id,...d.data()}));renderHistory();renderDashboard()}));
}
function switchPage(page){
  const titles={dashboard:"Dashboard",members:"Membros",partnerships:"Parcerias",notices:"Avisos",users:"Acessos",history:"Histórico"};
  $$(".page").forEach(el=>el.classList.remove("active"));
  $$(".nav-item").forEach(el=>el.classList.toggle("active",el.dataset.page===page));
  $(`${page}Page`).classList.add("active");
  $("pageTitle").textContent=titles[page];
  $("sidebar").classList.remove("open");
}
$("mainNav").addEventListener("click",e=>{const b=e.target.closest("[data-page]");if(b)switchPage(b.dataset.page)});
$("menuBtn").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
$$("[data-open-modal]").forEach(b=>b.addEventListener("click",()=>$(b.dataset.openModal).showModal()));
$$("[data-close-modal]").forEach(b=>b.addEventListener("click",()=>b.closest("dialog").close()));

function renderDashboard(){
  $("membersCount").textContent=cache.members.length;
  $("partnershipsCount").textContent=cache.partnerships.filter(x=>x.status!=="Encerrada").length;
  $("noticesCount").textContent=cache.notices.length;
  $("usersCount").textContent=cache.users.filter(x=>x.active!==false).length;
  $("recentNotices").innerHTML=cache.notices.slice(0,4).map(n=>`<div class="list-item"><div><strong>${safe(n.title)}</strong><p>${safe(n.message).slice(0,90)}</p></div><small>${formatDate(n.createdAt)}</small></div>`).join("")||`<div class="empty">Nenhum aviso publicado.</div>`;
  $("recentHistory").innerHTML=isLeader()?(cache.history.slice(0,5).map(h=>`<div class="list-item"><div><strong>${safe(h.action)}</strong><p>${safe(h.userName)} · ${safe(h.target)}</p></div><small>${formatDate(h.createdAt)}</small></div>`).join("")||`<div class="empty">Nenhuma alteração registrada.</div>`):`<div class="empty">Disponível apenas para Líder.</div>`;
}
function renderMembers(){
  const term=($("memberSearch")?.value||"").toLowerCase();
  const rows=cache.members.filter(m=>`${m.name} ${m.passport} ${m.rank}`.toLowerCase().includes(term));
  $("membersTable").innerHTML=rows.length?`<table class="data-table"><thead><tr><th>Nome</th><th>Passaporte</th><th>Cargo</th><th>Status</th><th>Ações</th></tr></thead><tbody>${rows.map(m=>`<tr><td>${safe(m.name)}</td><td>${safe(m.passport)}</td><td>${safe(m.rank)}</td><td><span class="status">${safe(m.status)}</span></td><td>${canManage()?`<div class="actions"><button class="icon-btn" data-edit-member="${m.id}">Editar</button><button class="icon-btn danger" data-delete-member="${m.id}">Excluir</button></div>`:"—"}</td></tr>`).join("")}</tbody></table>`:`<div class="empty">Nenhum membro encontrado.</div>`;
}
$("memberSearch").addEventListener("input",renderMembers);
$("membersTable").addEventListener("click",async e=>{
  const edit=e.target.dataset.editMember,del=e.target.dataset.deleteMember;
  if(edit){
    const m=cache.members.find(x=>x.id===edit);
    $("memberId").value=m.id;$("memberName").value=m.name;$("memberPassport").value=m.passport;$("memberRank").value=m.rank;$("memberStatus").value=m.status;$("memberNotes").value=m.notes||"";
    $("memberModalTitle").textContent="Editar membro";$("memberModal").showModal();
  }
  if(del&&confirm("Excluir este membro?")){
    const m=cache.members.find(x=>x.id===del);await deleteDoc(doc(db,"members",del));await logAction("Membro excluído",m?.name||del);toast("Membro excluído.");
  }
});
$("memberForm").addEventListener("submit",async e=>{
  e.preventDefault();if(!canManage())return;
  const id=$("memberId").value;
  const data={name:$("memberName").value.trim(),passport:$("memberPassport").value.trim(),rank:$("memberRank").value.trim(),status:$("memberStatus").value,notes:$("memberNotes").value.trim(),updatedAt:serverTimestamp()};
  if(id){await updateDoc(doc(db,"members",id),data);await logAction("Membro atualizado",data.name)}
  else{await addDoc(collection(db,"members"),{...data,createdAt:serverTimestamp()});await logAction("Membro adicionado",data.name)}
  e.target.reset();$("memberId").value="";$("memberModal").close();toast("Membro salvo.");
});

function renderPartnerships(){
  const term=($("partnershipSearch")?.value||"").toLowerCase();
  const rows=cache.partnerships.filter(p=>`${p.organization} ${p.responsible}`.toLowerCase().includes(term));
  $("partnershipsTable").innerHTML=rows.length?`<table class="data-table"><thead><tr><th>Organização</th><th>Responsável</th><th>Contato</th><th>Status</th><th>Ações</th></tr></thead><tbody>${rows.map(p=>`<tr><td>${safe(p.organization)}</td><td>${safe(p.responsible)}</td><td>${safe(p.discord||"—")}</td><td><span class="status">${safe(p.status)}</span></td><td>${canManage()?`<div class="actions"><button class="icon-btn" data-edit-partner="${p.id}">Editar</button><button class="icon-btn danger" data-delete-partner="${p.id}">Excluir</button></div>`:"—"}</td></tr>`).join("")}</tbody></table>`:`<div class="empty">Nenhuma parceria encontrada.</div>`;
}
$("partnershipSearch").addEventListener("input",renderPartnerships);
$("partnershipsTable").addEventListener("click",async e=>{
  const edit=e.target.dataset.editPartner,del=e.target.dataset.deletePartner;
  if(edit){
    const p=cache.partnerships.find(x=>x.id===edit);
    $("partnershipId").value=p.id;$("partnerOrganization").value=p.organization;$("partnerResponsible").value=p.responsible;$("partnerDiscord").value=p.discord||"";$("partnerStatus").value=p.status;$("partnerNotes").value=p.notes||"";
    $("partnershipModalTitle").textContent="Editar parceria";$("partnershipModal").showModal();
  }
  if(del&&confirm("Excluir esta parceria?")){
    const p=cache.partnerships.find(x=>x.id===del);await deleteDoc(doc(db,"partnerships",del));await logAction("Parceria excluída",p?.organization||del);toast("Parceria excluída.");
  }
});
$("partnershipForm").addEventListener("submit",async e=>{
  e.preventDefault();if(!canManage())return;
  const id=$("partnershipId").value;
  const data={organization:$("partnerOrganization").value.trim(),responsible:$("partnerResponsible").value.trim(),discord:$("partnerDiscord").value.trim(),status:$("partnerStatus").value,notes:$("partnerNotes").value.trim(),updatedAt:serverTimestamp()};
  if(id){await updateDoc(doc(db,"partnerships",id),data);await logAction("Parceria atualizada",data.organization)}
  else{await addDoc(collection(db,"partnerships"),{...data,createdAt:serverTimestamp()});await logAction("Parceria criada",data.organization)}
  e.target.reset();$("partnershipId").value="";$("partnershipModal").close();toast("Parceria salva.");
});

function renderNotices(){
  $("noticesList").innerHTML=cache.notices.length?cache.notices.map(n=>`<article class="notice-card priority-${safe(n.priority)}"><span class="eyebrow">${safe(n.priority)}</span><h4>${safe(n.title)}</h4><p>${safe(n.message)}</p><footer><span>${safe(n.authorName||"Liderança")}</span><span>${formatDate(n.createdAt)}</span></footer>${canManage()?`<button class="icon-btn danger" data-delete-notice="${n.id}">Excluir</button>`:""}</article>`).join(""):`<div class="empty">Nenhum aviso publicado.</div>`;
}
$("noticesList").addEventListener("click",async e=>{
  const id=e.target.dataset.deleteNotice;
  if(id&&confirm("Excluir este aviso?")){
    const n=cache.notices.find(x=>x.id===id);await deleteDoc(doc(db,"notices",id));await logAction("Aviso excluído",n?.title||id);toast("Aviso excluído.");
  }
});
$("noticeForm").addEventListener("submit",async e=>{
  e.preventDefault();if(!canManage())return;
  const data={title:$("noticeTitle").value.trim(),message:$("noticeMessage").value.trim(),priority:$("noticePriority").value,authorId:user.uid,authorName:profile.name,createdAt:serverTimestamp()};
  await addDoc(collection(db,"notices"),data);await logAction("Aviso publicado",data.title);e.target.reset();$("noticeModal").close();toast("Aviso publicado.");
});

function renderUsers(){
  if(!isLeader())return;
  $("usersTable").innerHTML=cache.users.length?`<table class="data-table"><thead><tr><th>Nome</th><th>Passaporte</th><th>Cargo</th><th>Status</th><th>Ações</th></tr></thead><tbody>${cache.users.map(u=>`<tr><td>${safe(u.name)}</td><td>${safe(u.passport)}</td><td><select data-role-user="${u.id}" ${u.id===user.uid?"disabled":""}><option value="member" ${u.role==="member"?"selected":""}>Membro</option><option value="manager" ${u.role==="manager"?"selected":""}>Gerente</option><option value="leader" ${u.role==="leader"?"selected":""}>Líder</option></select></td><td><span class="status">${u.active===false?"Bloqueado":"Ativo"}</span></td><td>${u.id!==user.uid?`<button class="icon-btn" data-toggle-user="${u.id}">${u.active===false?"Ativar":"Bloquear"}</button>`:"Conta atual"}</td></tr>`).join("")}</tbody></table>`:`<div class="empty">Nenhum usuário.</div>`;
}
$("usersTable").addEventListener("change",async e=>{
  const id=e.target.dataset.roleUser;if(!id||!isLeader())return;
  await updateDoc(doc(db,"users",id),{role:e.target.value,updatedAt:serverTimestamp()});await logAction("Cargo alterado",cache.users.find(x=>x.id===id)?.passport||id,roleNames[e.target.value]);toast("Cargo atualizado.");
});
$("usersTable").addEventListener("click",async e=>{
  const id=e.target.dataset.toggleUser;if(!id||!isLeader())return;
  const u=cache.users.find(x=>x.id===id);
  await updateDoc(doc(db,"users",id),{active:u.active===false,updatedAt:serverTimestamp()});
  await logAction(u.active===false?"Usuário ativado":"Usuário bloqueado",u.passport);toast("Status atualizado.");
});
$("userForm").addEventListener("submit",async e=>{
  e.preventDefault();if(!isLeader())return;
  const passport=$("newUserPassport").value.trim().toLowerCase().replace(/[^a-z0-9_-]/g,"");
  if(!passport){toast("Passaporte inválido.",true);return}
  const secondary=initializeApp(firebaseConfig,`secondary-${Date.now()}`);
  const secondaryAuth=getAuth(secondary);
  try{
    const cred=await createUserWithEmailAndPassword(secondaryAuth,passportEmail(passport),$("newUserPassword").value);
    await setDoc(doc(db,"users",cred.user.uid),{name:$("newUserName").value.trim(),passport,email:passportEmail(passport),role:$("newUserRole").value,active:true,createdAt:serverTimestamp()});
    await signOut(secondaryAuth);await deleteApp(secondary);
    await logAction("Usuário criado",passport,roleNames[$("newUserRole").value]);
    e.target.reset();$("userModal").close();toast("Usuário criado.");
  }catch(err){console.error(err);try{await deleteApp(secondary)}catch{}toast("Não foi possível criar. O passaporte pode já existir.",true)}
});

function renderHistory(){
  if(!isLeader())return;
  $("historyList").innerHTML=cache.history.length?cache.history.map(h=>`<div class="list-item"><div><strong>${safe(h.action)}</strong><p>${safe(h.userName)} · ${safe(h.target)} ${h.details?`· ${safe(h.details)}`:""}</p></div><small>${formatDate(h.createdAt)}</small></div>`).join(""):`<div class="empty">Nenhum registro.</div>`;
}
