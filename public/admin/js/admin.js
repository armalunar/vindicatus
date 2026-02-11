const $ = (s) => document.querySelector(s);

async function api(path, opts={}){
  const r = await fetch(path, opts);
  if (r.status === 401) location.href = "/admin/login.html";
  return r;
}

function toast(msg, type="ok"){
  const wrap = $("#toast");
  const el = document.createElement("div");
  el.className = `t ${type}`;
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// ===== Base64 helpers =====
const MAX_IMAGE_MB = 2.5; // ajuste aqui (recomendo baixo enquanto é base64)
const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;

function fileToDataUrl(file){
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("no_file"));
    if (file.size > MAX_IMAGE_BYTES) {
      return reject(new Error(`Arquivo grande demais (${(file.size/1024/1024).toFixed(2)}MB). Limite: ${MAX_IMAGE_MB}MB`));
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read_error"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

// Quill editor
const quill = new Quill("#editor", {
  theme: "snow",
  modules: {
    toolbar: [
      [{ header: [1,2,3,false] }],
      ["bold","italic","underline","strike"],
      [{ list: "ordered" }, { list:"bullet" }],
      ["blockquote","code-block"],
      ["link","image"],
      [{ color: [] }, { background: [] }],
      ["clean"]
    ]
  }
});

// toolbar image -> base64 insert
quill.getModule("toolbar").addHandler("image", async () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.click();

  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    try{
      const dataUrl = await fileToDataUrl(file);
      const range = quill.getSelection(true);
      quill.insertEmbed(range.index, "image", dataUrl, "user");
      quill.setSelection(range.index + 1);
      toast("Imagem inserida (base64).", "ok");
    } catch (e) {
      toast(e?.message || "Falha ao inserir imagem.", "bad");
    }
  };
});

// paste image -> base64 insert
quill.root.addEventListener("paste", async (e) => {
  const items = e.clipboardData?.items || [];
  for (const it of items){
    if (it.type?.startsWith("image/")){
      e.preventDefault();
      const file = it.getAsFile();
      try{
        const dataUrl = await fileToDataUrl(file);
        const range = quill.getSelection(true);
        quill.insertEmbed(range.index, "image", dataUrl, "user");
        quill.setSelection(range.index + 1);
        toast("Imagem colada (base64).", "ok");
      } catch (err) {
        toast(err?.message || "Imagem colada grande demais.", "bad");
      }
      break;
    }
  }
});

/* ===== Perfil ===== */
let me = null;
let mePhotoUrl = null;

async function loadMe(){
  const r = await api("/api/admin/me");
  if (!r.ok) return;
  const j = await r.json();
  me = j.me;

  $("#meName").value = me?.name || "";
  $("#meInfo").textContent = `Logado como: ${me?.username} • role: ${me?.role}`;

  if (me?.role === "supreme") {
    $("#curatorsCard").style.display = "block";
    loadCurators();
  } else {
    $("#curatorsCard").style.display = "none";
  }
}

$("#mePhotoFile").addEventListener("change", async () => {
  const file = $("#mePhotoFile").files?.[0];
  if (!file) return;

  try{
    mePhotoUrl = await fileToDataUrl(file);
    $("#mePhotoUrl").textContent = `Foto definida (base64)`;
    toast("Foto pronta. Clique em Salvar para aplicar.", "ok");
  } catch (e) {
    toast(e?.message || "Falha ao carregar foto.", "bad");
  }
});

$("#saveMe").addEventListener("click", async () => {
  const name = $("#meName").value.trim();
  const photo_url = mePhotoUrl || (me?.photo_url || null);

  const r = await api("/api/admin/me/profile", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ name, photo_url })
  });

  if (!r.ok) { toast("Falha ao salvar perfil.", "bad"); return; }

  toast("Perfil salvo.", "ok");
  mePhotoUrl = null;
  $("#mePhotoFile").value = "";
  $("#mePhotoUrl").textContent = "";
  loadMe();
});

/* ===== Editor state (create vs edit) ===== */
let editingId = null;
let coverUrl = null;       // agora pode ser dataURL base64
let galleryUrls = [];      // agora são dataURL base64

function setModeCreate(){
  editingId = null;
  $("#editMode").textContent = "Modo: Criar";
  $("#publish").style.display = "";
  $("#update").style.display = "none";
  $("#cancelEdit").style.display = "none";

  $("#title").value = "";
  $("#coverFile").value = "";
  $("#galleryFiles").value = "";
  $("#coverUrl").textContent = "";
  $("#galleryCount").textContent = "";
  coverUrl = null;
  galleryUrls = [];
  quill.setContents([]);
}

function setModeEdit(id){
  editingId = id;
  $("#editMode").textContent = `Modo: Editar (#${id})`;
  $("#publish").style.display = "none";
  $("#update").style.display = "";
  $("#cancelEdit").style.display = "";
}

$("#cancelEdit").addEventListener("click", () => {
  setModeCreate();
  toast("Edição cancelada.", "ok");
});

// Cover & gallery (base64)
$("#coverFile").addEventListener("change", async () => {
  const file = $("#coverFile").files?.[0];
  if (!file) return;
  try{
    coverUrl = await fileToDataUrl(file);
    $("#coverUrl").textContent = `Capa definida (base64)`;
    toast("Capa carregada.", "ok");
  } catch (e) {
    toast(e?.message || "Falha ao carregar capa.", "bad");
  }
});

$("#galleryFiles").addEventListener("change", async () => {
  const files = [...($("#galleryFiles").files || [])].slice(0, 50);
  galleryUrls = [];

  try{
    for (const f of files){
      const dataUrl = await fileToDataUrl(f);
      galleryUrls.push(dataUrl);
    }
    $("#galleryCount").textContent = `${galleryUrls.length} arquivo(s) na galeria (base64)`;
    toast("Galeria carregada.", "ok");
  } catch (e) {
    toast(e?.message || "Falha ao carregar galeria.", "bad");
  }
});

/* ===== Publish & Update ===== */
$("#publish").addEventListener("click", async () => {
  $("#err").textContent = "";

  const title = $("#title").value.trim();
  const html = quill.root.innerHTML;

  if (title.length < 3) { $("#err").textContent = "Título muito curto."; toast("Título muito curto.", "bad"); return; }
  if (html.replace(/<[^>]*>/g,"").trim().length < 10) { $("#err").textContent = "Conteúdo muito curto."; toast("Conteúdo muito curto.", "bad"); return; }

  const r = await api("/api/admin/posts", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({
      title,
      cover_url: coverUrl,       // base64
      content_html: html,        // pode conter <img src="data:...">
      images: galleryUrls        // base64
    })
  });

  if (!r.ok) { $("#err").textContent = "Falha ao publicar (conteúdo grande demais?)"; toast("Falha ao publicar.", "bad"); return; }

  toast("Post publicado.", "ok");
  setModeCreate();
  await loadPosts();
});

$("#update").addEventListener("click", async () => {
  if (!editingId) return;

  $("#err").textContent = "";

  const title = $("#title").value.trim();
  const html = quill.root.innerHTML;

  if (title.length < 3) { $("#err").textContent = "Título muito curto."; toast("Título muito curto.", "bad"); return; }
  if (html.replace(/<[^>]*>/g,"").trim().length < 10) { $("#err").textContent = "Conteúdo muito curto."; toast("Conteúdo muito curto.", "bad"); return; }

  const r = await api(`/api/admin/posts/${editingId}`, {
    method:"PUT",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({
      title,
      cover_url: coverUrl,
      content_html: html,
      images: galleryUrls
    })
  });

  if (!r.ok) { toast("Falha ao atualizar (conteúdo grande demais?)", "bad"); return; }

  toast("Post atualizado.", "ok");
  setModeCreate();
  await loadPosts();
});

/* ===== Posts list + Edit button ===== */
async function loadPosts(){
  const wrap = $("#posts");
  wrap.innerHTML = "";

  const r = await fetch(`/api/posts`);
  const list = await r.json();

  if (!Array.isArray(list) || list.length === 0){
    wrap.innerHTML = `<div class="muted small">Ainda não há postagens.</div>`;
    return;
  }

  list.forEach(p => {
    const row = document.createElement("div");
    row.className = "postRow";
    row.innerHTML = `
      <div>
        <div class="title">${p.title}</div>
        <div class="muted small">${new Date(p.created_at).toLocaleString()} • por ${p.author_name || "—"}</div>
      </div>
      <div class="row" style="margin:0;">
        <button data-edit="${p.id}">Editar</button>
        <button data-del="${p.id}">Remover</button>
      </div>
    `;
    wrap.appendChild(row);
  });

  wrap.querySelectorAll("button[data-del]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-del");
      if (!confirm("Remover esta postagem?")) return;
      const r = await api(`/api/admin/posts/${id}`, { method:"DELETE" });
      if (!r.ok) { toast("Sem permissão para remover.", "bad"); return; }
      toast("Post removido.", "ok");
      await loadPosts();
    });
  });

  wrap.querySelectorAll("button[data-edit]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-edit");
      const rr = await fetch(`/api/posts/${id}`);
      if (!rr.ok) { toast("Falha ao carregar post.", "bad"); return; }
      const post = await rr.json();

      $("#title").value = post.title || "";
      coverUrl = post.cover_url || null;
      $("#coverUrl").textContent = coverUrl ? `Capa definida (base64)` : "";
      galleryUrls = Array.isArray(post.images) ? post.images.slice() : [];
      $("#galleryCount").textContent = galleryUrls.length ? `${galleryUrls.length} arquivo(s) na galeria (base64)` : "";

      quill.root.innerHTML = post.content_html || "";
      setModeEdit(Number(id));
      toast("Post carregado para edição.", "ok");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

$("#refresh").addEventListener("click", loadPosts);

$("#logout").addEventListener("click", async () => {
  await api("/api/admin/logout", { method:"POST" });
  location.href = "/admin/login.html";
});

/* ===== Curators (supreme) ===== */
async function loadCurators(){
  const hint = $("#curatorsHint");
  const listEl = $("#curatorsList");
  hint.textContent = "Carregando…";
  listEl.innerHTML = "";

  const r = await api("/api/admin/curators");
  if (!r.ok) { hint.textContent = "Falha ao carregar."; return; }
  const list = await r.json();

  if (!Array.isArray(list) || list.length === 0){
    hint.textContent = "Nenhum curador criado ainda.";
    return;
  }

  hint.textContent = `${list.length} curador(es).`;
  list.forEach(u => {
    const row = document.createElement("div");
    row.className = "postRow";
    row.innerHTML = `
      <div>
        <div class="title">${u.name} <span class="muted small">(@${u.username})</span></div>
        <div class="muted small">criado: ${new Date(u.created_at).toLocaleString()}</div>
      </div>
      <button data-delcur="${u.id}">Remover</button>
    `;
    listEl.appendChild(row);
  });

  listEl.querySelectorAll("button[data-delcur]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-delcur");
      if (!confirm("Remover este curador?")) return;
      const r = await api(`/api/admin/curators/${id}`, { method:"DELETE" });
      if (!r.ok) { toast("Falha ao remover curador.", "bad"); return; }
      toast("Curador removido.", "ok");
      loadCurators();
    });
  });
}

$("#reloadCurators")?.addEventListener("click", loadCurators);

$("#createCurator")?.addEventListener("click", async () => {
  const username = $("#newUser").value.trim();
  const password = $("#newPass").value;
  const name = $("#newName").value.trim();

  const r = await api("/api/admin/curators", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ username, password, name })
  });

  if (!r.ok) {
    let msg = "Falha ao criar curador.";
    try{
      const j = await r.json();
      if (j?.error) msg = `Falha: ${j.error}`;
    } catch {}
    toast(msg, "bad");
    return;
  }

  toast("Curador criado.", "ok");
  $("#newUser").value = "";
  $("#newPass").value = "";
  $("#newName").value = "";
  loadCurators();
});

// boot
setModeCreate();
loadMe();
loadPosts();
