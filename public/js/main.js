(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

  $("#year").textContent = String(new Date().getFullYear());

  const KEY = "vindicatus_public_state";
  const state = { reduced:false };
  try{
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved && typeof saved === "object") Object.assign(state, saved);
  } catch {}
  const save = () => { try{ localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };

  function setReduced(on){
    state.reduced = !!on;
    document.documentElement.classList.toggle("reduced", state.reduced);
    $("#reduceMotion")?.setAttribute("aria-pressed", String(state.reduced));
    save();
  }
  setReduced(state.reduced);

  $("#reduceMotion")?.addEventListener("click", () => setReduced(!state.reduced));

  const quickExit = () => { window.location.href = "https://www.google.com/"; };
  $("#quickExit")?.addEventListener("click", quickExit);
  $("#quickExit2")?.addEventListener("click", quickExit);

  // Mobile menu
  const mobile = $("#mobile");
  const menuBtn = $("#menu");
  const closeMobile = $("#closeMobile");
  const backdrop = $("#mobileBackdrop");

  function openMobile(){
    mobile.classList.add("is-open");
    mobile.setAttribute("aria-hidden","false");
    menuBtn?.setAttribute("aria-expanded","true");
  }
  function closeMobileMenu(){
    mobile.classList.remove("is-open");
    mobile.setAttribute("aria-hidden","true");
    menuBtn?.setAttribute("aria-expanded","false");
  }
  menuBtn?.addEventListener("click", openMobile);
  closeMobile?.addEventListener("click", closeMobileMenu);
  backdrop?.addEventListener("click", closeMobileMenu);
  $$(".mobile__link").forEach(a => a.addEventListener("click", closeMobileMenu));

  // Smooth scroll
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const target = document.querySelector(id);
      if (target){
        e.preventDefault();
        target.scrollIntoView({ behavior: state.reduced ? "auto" : "smooth", block:"start" });
      }
    });
  });

  // Overlays
  function openOverlay(el){
    el.classList.add("is-open");
    el.setAttribute("aria-hidden","false");
  }
  function closeOverlay(el){
    el.classList.remove("is-open");
    el.setAttribute("aria-hidden","true");
  }

  // Contact
  const contact = $("#contact");
  const openContact = () => { openOverlay(contact); setTimeout(() => $("#name")?.focus(), 50); };
  const closeContact = () => closeOverlay(contact);

  $("#openContact")?.addEventListener("click", openContact);
  $("#openContact2")?.addEventListener("click", () => { closeMobileMenu(); openContact(); });
  $("#openContact3")?.addEventListener("click", openContact);
  $("#openContact4")?.addEventListener("click", openContact);
  $("#closeContact")?.addEventListener("click", closeContact);
  $("#contactBackdrop")?.addEventListener("click", closeContact);

  // Post modal
  const postModal = $("#postModal");
  const closePost = () => closeOverlay(postModal);
  $("#closePost")?.addEventListener("click", closePost);
  $("#postBackdrop")?.addEventListener("click", closePost);

  // ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape"){
      closeContact();
      closeMobileMenu();
      closePost();
    }
  });

  // Helpers
  function fmtDate(iso){
    try{ return new Date(iso).toLocaleString(); } catch { return ""; }
  }
  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, (m) => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[m]));
  }

  // Curator
  async function loadCurator(){
  try{
    const r = await fetch("/api/curators");
    if (!r.ok) return;
    const list = await r.json();
    const line = document.querySelector("#curatorLine");
    if (!line) return;

    if (!Array.isArray(list) || list.length === 0){
      line.innerHTML = ` • curadoria: <b>equipe</b>`;
      return;
    }

    const names = list.slice(0, 3).map(c => c?.name).filter(Boolean);
    const extra = list.length > 3 ? ` +${list.length - 3}` : "";
    line.innerHTML = ` • curadoria: <b>${names.join(", ")}${extra}</b>`;
  } catch {}
}


  // Posts
  const postsWrap = $("#posts");
  const hint = $("#postsHint");

  async function loadPosts(){
    postsWrap.innerHTML = "";
    hint.textContent = "Carregando…";

    try{
      const r = await fetch(`/api/posts`);
      if (!r.ok) throw new Error("bad");
      const list = await r.json();

      if (!Array.isArray(list) || list.length === 0){
        postsWrap.innerHTML = `<div class="post__empty">Ainda não há postagens expostas.</div>`;
        hint.textContent = "";
        return;
      }

      for (const p of list){
        const card = document.createElement("article");
        card.className = "post";
        card.tabIndex = 0;

        const cover = p.cover_url
          ? `<img class="post__cover" src="${p.cover_url}" alt="" />`
          : `<div class="post__cover" style="display:grid;place-items:center;color:rgba(255,255,255,.55)">Sem capa</div>`;

        card.innerHTML = `
          ${cover}
          <div class="post__body">
            <h3 class="post__title">${escapeHtml(p.title)}</h3>
            <div class="post__meta">${escapeHtml(fmtDate(p.created_at))}</div>
          </div>
        `;

        card.addEventListener("click", () => openPost(p.id));
        card.addEventListener("keydown", (e) => { if (e.key === "Enter") openPost(p.id); });
        postsWrap.appendChild(card);
      }

      hint.textContent = "Clique em uma postagem para abrir.";
    } catch {
      postsWrap.innerHTML = `<div class="post__empty">Erro ao carregar postagens.</div>`;
      hint.textContent = "";
    }
  }

  async function openPost(id){
    try{
      const r = await fetch(`/api/posts/${id}`);
      if (!r.ok) throw new Error("notfound");
      const p = await r.json();

      $("#modalTitle").textContent = p.title || "—";
      $("#modalDates").textContent = `publicado: ${fmtDate(p.created_at)} • atualizado: ${fmtDate(p.updated_at)}`;

      const cover = $("#modalCover");
      if (p.cover_url){
        cover.src = p.cover_url;
        cover.style.display = "block";
      } else {
        cover.removeAttribute("src");
        cover.style.display = "none";
      }

      $("#modalContent").innerHTML = p.content_html || "";

      const g = $("#modalGallery");
      g.innerHTML = "";
      if (Array.isArray(p.images) && p.images.length){
        for (const url of p.images){
          const img = document.createElement("img");
          img.src = url;
          img.alt = "";
          g.appendChild(img);
        }
      }

      openOverlay(postModal);
    } catch {}
  }

  // Contact send
  const form = $("#contactForm");
  const packet = $("#packet");
  const errName = $("#errName");
  const errMessage = $("#errMessage");

  function clearErr(){ errName.textContent=""; errMessage.textContent=""; }
  function validate(fd){
    clearErr();
    let ok = true;
    const name = String(fd.get("name")||"").trim();
    const message = String(fd.get("message")||"").trim();
    if (name.length < 2){ errName.textContent = "Informe um nome ou apelido."; ok=false; }
    if (message.length < 10){ errMessage.textContent = "Mensagem muito curta (mín. 10)."; ok=false; }
    return ok;
  }
  function buildPreview(fd){
    const now = new Date().toISOString().replace("T"," ").slice(0,19);
    return [
      "=== VINDICATUS — PRÉVIA DO CONTATO ===",
      `DATA: ${now}`,
      `NOME/APELIDO: ${String(fd.get("name")||"").trim()}`,
      `RETORNO: ${String(fd.get("contact")||"").trim() || "não informado"}`,
      `TEMA: ${String(fd.get("topic")||"").trim()}`,
      "",
      String(fd.get("message")||"").trim()
    ].join("\n");
  }

  $("#preview")?.addEventListener("click", () => {
    const fd = new FormData(form);
    packet.textContent = buildPreview(fd);
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    if (!validate(fd)) return;

    const body = {
      name: String(fd.get("name")||"").trim(),
      contact: String(fd.get("contact")||"").trim(),
      topic: String(fd.get("topic")||"").trim(),
      message: String(fd.get("message")||"").trim()
    };

    $("#sendContact").disabled = true;
    try{
      const r = await fetch("/api/contact", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(body)
      });
      if (!r.ok) throw new Error("fail");

      packet.textContent = "Mensagem enviada com sucesso. Se você deixou um contato, a equipe pode responder por lá.";
      form.reset();
    } catch {
      packet.textContent = "Falha ao enviar agora. Tente novamente mais tarde.";
    } finally {
      $("#sendContact").disabled = false;
    }
  });

  loadCurator();
  loadPosts();
})();
