import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged,
  sendPasswordResetEmail, createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc,
  deleteDoc, onSnapshot, query, orderBy, limit, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const roleLabels = { owner: "Dono", manager: "Gerente", member: "Membro" };
let currentUser = null;
let currentProfile = null;
let cache = { members: [], partnerships: [], notices: [], users: [], history: [] };
let unsubscribers = [];

const $ = (id) => document.getElementById(id);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function toast(message, error = false) {
  const el = $("toast");
  el.textContent = message;
  el.className = `toast show${error ? " error" : ""}`;
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => el.className = "toast", 3000);
}
function formatDate(ts) {
  if (!ts) return "Agora";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function canManage() { return ["owner", "manager"].includes(currentProfile?.role); }
function isOwner() { return currentProfile?.role === "owner"; }

async function logAction(action, target, details = "") {
  if (!currentUser || !currentProfile) return;
  await addDoc(collection(db, "history"), {
    action, target, details,
    userId: currentUser.uid,
    userName: currentProfile.name || currentUser.email,
    createdAt: serverTimestamp()
  });
}

$("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  $("loginError").textContent = "";
  try {
    await signInWithEmailAndPassword(auth, $("loginEmail").value.trim(), $("loginPassword").value);
  } catch (error) {
    $("loginError").textContent = "E-mail ou senha incorretos.";
  }
});
$("forgotPasswordBtn").addEventListener("click", async () => {
  const email = $("loginEmail").value.trim();
  if (!email) return toast("Digite seu e-mail primeiro.", true);
  try {
    await sendPasswordResetEmail(auth, email);
    toast("E-mail de recuperação enviado.");
  } catch {
    toast("Não foi possível enviar a recuperação.", true);
  }
});
$("logoutBtn").addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, async (user) => {
  clearListeners();
  if (!user) {
    currentUser = currentProfile = null;
    $("loginView").classList.remove("hidden");
    $("appView").classList.add("hidden");
    return;
  }
  currentUser = user;
  try {
    currentProfile = await ensureUserProfile(user);
    applyPermissions();
    openApp();
    startListeners();
  } catch (error) {
    console.error(error);
    toast("Erro ao carregar o perfil do usuário.", true);
    await signOut(auth);
  }
});

async function ensureUserProfile(user) {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) return { id: snap.id, ...snap.data() };

  const usersSnap = await getDocs(collection(db, "users"));
  const firstUser = usersSnap.empty;
  const profile = {
    name: user.displayName || user.email.split("@")[0],
    email: user.email,
    role: firstUser ? "owner" : "member",
    active: true,
    createdAt: serverTimestamp()
  };
  await setDoc(userRef, profile);
  if (firstUser) $("bootstrapBanner").classList.remove("hidden");
  return { id: user.uid, ...profile };
}

function openApp() {
  $("loginView").classList.add("hidden");
  $("appView").classList.remove("hidden");
  const name = currentProfile.name || currentUser.email;
  const role = roleLabels[currentProfile.role] || "Membro";
  $("sidebarUserName").textContent = name;
  $("sidebarUserRole").textContent = role;
  $("topUserName").textContent = name;
  $("topUserBadge").textContent = role;
  $("welcomeName").textContent = name.split(" ")[0];
  $("userInitial").textContent = name[0].toUpperCase();
  switchPage("dashboard");
}
function applyPermissions() {
  $$(".admin-only").forEach(el => el.classList.toggle("hidden", !isOwner()));
  $$(".manager-only").forEach(el => el.classList.toggle("hidden", !canManage()));
}
function clearListeners() {
  unsubscribers.forEach(fn => fn());
  unsubscribers = [];
}
function startListeners() {
  unsubscribers.push(onSnapshot(collection(db, "members"), snap => {
    cache.members = snap.docs.map(d => ({ id:d.id, ...d.data() }));
    renderMembers(); renderDashboard();
  }));
  unsubscribers.push(onSnapshot(collection(db, "partnerships"), snap => {
    cache.partnerships = snap.docs.map(d => ({ id:d.id, ...d.data() }));
    renderPartnerships(); renderDashboard();
  }));
  unsubscribers.push(onSnapshot(query(collection(db, "notices"), orderBy("createdAt","desc")), snap => {
    cache.notices = snap.docs.map(d => ({ id:d.id, ...d.data() }));
    renderNotices(); renderDashboard();
  }));
  unsubscribers.push(onSnapshot(collection(db, "users"), snap => {
    cache.users = snap.docs.map(d => ({ id:d.id, ...d.data() }));
    renderUsers(); renderDashboard();
  }));
  if (isOwner()) unsubscribers.push(onSnapshot(query(collection(db, "history"), orderBy("createdAt","desc"), limit(100)), snap => {
    cache.history = snap.docs.map(d => ({ id:d.id, ...d.data() }));
    renderHistory(); renderDashboard();
  }));
}
function switchPage(page) {
  const titles = {dashboard:"Dashboard",members:"Membros",partnerships:"Parcerias",notices:"Avisos",users:"Usuários",history:"Histórico"};
  $$(".page").forEach(el => el.classList.remove("active"));
  $$(".nav-item").forEach(el => el.classList.toggle("active", el.dataset.page === page));
  $(`${page}Page`).classList.add("active");
  $("pageTitle").textContent = titles[page];
  $("sidebar").classList.remove("open");
}
$("mainNav").addEventListener("click", e => {
  const btn = e.target.closest("[data-page]");
  if (btn) switchPage(btn.dataset.page);
});
$("menuBtn").addEventListener("click", () => $("sidebar").classList.toggle("open"));

$$("[data-open-modal]").forEach(btn => btn.addEventListener("click", () => {
  const modal = $(btn.dataset.openModal);
  modal.showModal();
}));
$$("[data-close-modal]").forEach(btn => btn.addEventListener("click", () => btn.closest("dialog").close()));

function renderDashboard() {
  $("membersCount").textContent = cache.members.length;
  $("partnershipsCount").textContent = cache.partnerships.filter(x => x.status !== "Encerrada").length;
  $("noticesCount").textContent = cache.notices.length;
  $("usersCount").textContent = cache.users.filter(x => x.active !== false).length;
  $("recentNotices").innerHTML = cache.notices.slice(0,4).map(n => `
    <div class="list-item"><div><strong>${escapeHtml(n.title)}</strong><p>${escapeHtml(n.message).slice(0,90)}</p></div><small>${formatDate(n.createdAt)}</small></div>
  `).join("") || `<div class="empty">Nenhum aviso publicado.</div>`;
  $("recentHistory").innerHTML = isOwner()
    ? (cache.history.slice(0,5).map(h => `<div class="list-item"><div><strong>${escapeHtml(h.action)}</strong><p>${escapeHtml(h.userName)} · ${escapeHtml(h.target)}</p></div><small>${formatDate(h.createdAt)}</small></div>`).join("") || `<div class="empty">Nenhuma alteração registrada.</div>`)
    : `<div class="empty">Disponível apenas para o Dono.</div>`;
}

function renderMembers() {
  const term = $("memberSearch")?.value.toLowerCase() || "";
  const rows = cache.members.filter(m => `${m.name} ${m.passport} ${m.rank}`.toLowerCase().includes(term));
  $("membersTable").innerHTML = rows.length ? `<table class="data-table"><thead><tr><th>Nome</th><th>Passaporte</th><th>Cargo</th><th>Status</th><th>Ações</th></tr></thead><tbody>${rows.map(m => `
    <tr><td>${escapeHtml(m.name)}</td><td>${escapeHtml(m.passport)}</td><td>${escapeHtml(m.rank)}</td><td><span class="status">${escapeHtml(m.status)}</span></td>
    <td><div class="actions">${canManage()?`<button class="icon-btn" data-edit-member="${m.id}">Editar</button><button class="icon-btn danger" data-delete-member="${m.id}">Excluir</button>`:"—"}</div></td></tr>`).join("")}</tbody></table>` : `<div class="empty">Nenhum membro encontrado.</div>`;
}
$("memberSearch").addEventListener("input", renderMembers);
$("membersTable").addEventListener("click", async e => {
  const edit = e.target.dataset.editMember, del = e.target.dataset.deleteMember;
  if (edit) {
    const m = cache.members.find(x=>x.id===edit);
    $("memberId").value=m.id;$("memberName").value=m.name;$("memberPassport").value=m.passport;$("memberRank").value=m.rank;$("memberStatus").value=m.status;$("memberNotes").value=m.notes||"";
    $("memberModalTitle").textContent="Editar membro";$("memberModal").showModal();
  }
  if (del && confirm("Excluir este membro?")) {
    const m=cache.members.find(x=>x.id===del); await deleteDoc(doc(db,"members",del)); await logAction("Membro excluído",m?.name||del); toast("Membro excluído.");
  }
});
$("memberForm").addEventListener("submit", async e => {
  e.preventDefault(); if(!canManage()) return;
  const id=$("memberId").value; const data={name:$("memberName").value.trim(),passport:$("memberPassport").value.trim(),rank:$("memberRank").value.trim(),status:$("memberStatus").value,notes:$("memberNotes").value.trim(),updatedAt:serverTimestamp()};
  if(id){await updateDoc(doc(db,"members",id),data);await logAction("Membro atualizado",data.name);}
  else{await addDoc(collection(db,"members"),{...data,createdAt:serverTimestamp()});await logAction("Membro adicionado",data.name);}
  e.target.reset();$("memberId").value="";$("memberModal").close();toast("Membro salvo.");
});

function renderPartnerships() {
  const term=$("partnershipSearch")?.value.toLowerCase()||"";
  const rows=cache.partnerships.filter(p=>`${p.organization} ${p.responsible}`.toLowerCase().includes(term));
  $("partnershipsTable").innerHTML=rows.length?`<table class="data-table"><thead><tr><th>Organização</th><th>Responsável</th><th>Contato</th><th>Status</th><th>Ações</th></tr></thead><tbody>${rows.map(p=>`
    <tr><td>${escapeHtml(p.organization)}</td><td>${escapeHtml(p.responsible)}</td><td>${escapeHtml(p.discord||"—")}</td><td><span class="status">${escapeHtml(p.status)}</span></td>
    <td><div class="actions">${canManage()?`<button class="icon-btn" data-edit-partner="${p.id}">Editar</button><button class="icon-btn danger" data-delete-partner="${p.id}">Excluir</button>`:"—"}</div></td></tr>`).join("")}</tbody></table>`:`<div class="empty">Nenhuma parceria encontrada.</div>`;
}
$("partnershipSearch").addEventListener("input",renderPartnerships);
$("partnershipsTable").addEventListener("click",async e=>{
  const edit=e.target.dataset.editPartner,del=e.target.dataset.deletePartner;
  if(edit){const p=cache.partnerships.find(x=>x.id===edit);$("partnershipId").value=p.id;$("partnerOrganization").value=p.organization;$("partnerResponsible").value=p.responsible;$("partnerDiscord").value=p.discord||"";$("partnerStatus").value=p.status;$("partnerNotes").value=p.notes||"";$("partnershipModalTitle").textContent="Editar parceria";$("partnershipModal").showModal();}
  if(del&&confirm("Excluir esta parceria?")){const p=cache.partnerships.find(x=>x.id===del);await deleteDoc(doc(db,"partnerships",del));await logAction("Parceria excluída",p?.organization||del);toast("Parceria excluída.");}
});
$("partnershipForm").addEventListener("submit",async e=>{
  e.preventDefault();if(!canManage())return;
  const id=$("partnershipId").value;const data={organization:$("partnerOrganization").value.trim(),responsible:$("partnerResponsible").value.trim(),discord:$("partnerDiscord").value.trim(),status:$("partnerStatus").value,notes:$("partnerNotes").value.trim(),updatedAt:serverTimestamp()};
  if(id){await updateDoc(doc(db,"partnerships",id),data);await logAction("Parceria atualizada",data.organization);}
  else{await addDoc(collection(db,"partnerships"),{...data,createdAt:serverTimestamp()});await logAction("Parceria criada",data.organization);}
  e.target.reset();$("partnershipId").value="";$("partnershipModal").close();toast("Parceria salva.");
});

function renderNotices(){
  $("noticesList").innerHTML=cache.notices.length?cache.notices.map(n=>`<article class="notice-card priority-${n.priority}"><span class="eyebrow">${escapeHtml(n.priority)}</span><h4>${escapeHtml(n.title)}</h4><p>${escapeHtml(n.message)}</p><footer><span>${escapeHtml(n.authorName||"Liderança")}</span><span>${formatDate(n.createdAt)}</span></footer>${canManage()?`<button class="icon-btn danger" data-delete-notice="${n.id}">Excluir</button>`:""}</article>`).join(""):`<div class="empty">Nenhum aviso publicado.</div>`;
}
$("noticesList").addEventListener("click",async e=>{const id=e.target.dataset.deleteNotice;if(id&&confirm("Excluir este aviso?")){const n=cache.notices.find(x=>x.id===id);await deleteDoc(doc(db,"notices",id));await logAction("Aviso excluído",n?.title||id);toast("Aviso excluído.");}});
$("noticeForm").addEventListener("submit",async e=>{
  e.preventDefault();if(!canManage())return;
  const data={title:$("noticeTitle").value.trim(),message:$("noticeMessage").value.trim(),priority:$("noticePriority").value,authorId:currentUser.uid,authorName:currentProfile.name,createdAt:serverTimestamp()};
  await addDoc(collection(db,"notices"),data);await logAction("Aviso publicado",data.title);e.target.reset();$("noticeModal").close();toast("Aviso publicado.");
});

function renderUsers(){
  if(!isOwner())return;
  $("usersTable").innerHTML=cache.users.length?`<table class="data-table"><thead><tr><th>Nome</th><th>E-mail</th><th>Cargo</th><th>Status</th><th>Ações</th></tr></thead><tbody>${cache.users.map(u=>`
  <tr><td>${escapeHtml(u.name)}</td><td>${escapeHtml(u.email)}</td><td><select data-role-user="${u.id}" ${u.id===currentUser.uid?"disabled":""}><option value="member" ${u.role==="member"?"selected":""}>Membro</option><option value="manager" ${u.role==="manager"?"selected":""}>Gerente</option><option value="owner" ${u.role==="owner"?"selected":""}>Dono</option></select></td><td><span class="status">${u.active===false?"Bloqueado":"Ativo"}</span></td><td>${u.id!==currentUser.uid?`<button class="icon-btn" data-toggle-user="${u.id}">${u.active===false?"Ativar":"Bloquear"}</button>`:"Conta atual"}</td></tr>`).join("")}</tbody></table>`:`<div class="empty">Nenhum usuário.</div>`;
}
$("usersTable").addEventListener("change",async e=>{
  const id=e.target.dataset.roleUser;if(!id||!isOwner())return;
  await updateDoc(doc(db,"users",id),{role:e.target.value,updatedAt:serverTimestamp()});await logAction("Cargo alterado",cache.users.find(x=>x.id===id)?.email||id,roleLabels[e.target.value]);toast("Cargo atualizado.");
});
$("usersTable").addEventListener("click",async e=>{
  const id=e.target.dataset.toggleUser;if(!id||!isOwner())return;
  const u=cache.users.find(x=>x.id===id);await updateDoc(doc(db,"users",id),{active:u.active===false,updatedAt:serverTimestamp()});await logAction(u.active===false?"Usuário ativado":"Usuário bloqueado",u.email);toast("Status atualizado.");
});
$("userForm").addEventListener("submit",async e=>{
  e.preventDefault();if(!isOwner())return;
  const secondaryName=`secondary-${Date.now()}`;
  const secondaryApp=initializeApp(firebaseConfig,secondaryName);
  const secondaryAuth=getAuth(secondaryApp);
  try{
    const cred=await createUserWithEmailAndPassword(secondaryAuth,$("newUserEmail").value.trim(),$("newUserPassword").value);
    await setDoc(doc(db,"users",cred.user.uid),{name:$("newUserName").value.trim(),email:$("newUserEmail").value.trim(),role:$("newUserRole").value,active:true,createdAt:serverTimestamp()});
    await signOut(secondaryAuth);await logAction("Usuário criado",$("newUserEmail").value.trim(),roleLabels[$("newUserRole").value]);
    e.target.reset();$("userModal").close();toast("Usuário criado com sucesso.");
  }catch(error){console.error(error);toast("Não foi possível criar o usuário. Verifique o e-mail e a senha.",true);}
});

function renderHistory(){
  if(!isOwner())return;
  $("historyList").innerHTML=cache.history.length?cache.history.map(h=>`<div class="list-item"><div><strong>${escapeHtml(h.action)}</strong><p>${escapeHtml(h.userName)} · ${escapeHtml(h.target)} ${h.details?`· ${escapeHtml(h.details)}`:""}</p></div><small>${formatDate(h.createdAt)}</small></div>`).join(""):`<div class="empty">Nenhum registro.</div>`;
}
