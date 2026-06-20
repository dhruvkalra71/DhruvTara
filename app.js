/* ============================================================
   DhruvTara Home Kitchen — app.js
   Reads menu.json (config + items) and builds the page.
   ============================================================ */

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const wait = ms => new Promise(r => setTimeout(r, ms));
const esc  = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]));
const STAR = '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true"><path d="M12 1.5l2.6 6.6L21.5 9l-5.2 4.5L18 20.5 12 16.6 6 20.5l1.7-7L2.5 9l6.9-.9z"/></svg>';

function priceStr(p, unit){
  let txt;
  if (typeof p === "number") txt = "₹" + p;
  else if (/\d/.test(p) && !/request/i.test(p)) txt = "₹" + esc(p);   // e.g. "20 / 25"
  else txt = esc(p);                                                   // e.g. "On request"
  const showUnit = unit && !/request/i.test(String(p));
  return txt + (showUnit ? ` <span class="u">/ ${esc(unit)}</span>` : "");
}

/* ---------- loader ---------- */
function hideLoader(){
  const l = document.getElementById("loader");
  if (!l) return;
  l.classList.add("done");
  document.body.classList.remove("no-scroll");
  setTimeout(() => l.remove(), 800);
}

/* ---------- render ---------- */
function wireContacts(cfg){
  const phone = cfg.phone || "";
  const wa    = cfg.whatsapp || "";
  const text  = cfg.whatsappText || "Hi DhruvTara Home Kitchen!";
  const telHref = "tel:" + phone;
  const waHref  = "https://wa.me/" + wa + "?text=" + encodeURIComponent(text);
  const pretty  = phone.replace(/^\+91/, "").replace(/(\d{5})(\d{5})/, "$1 $2").trim();

  [["nav-call",telHref],["mm-call",telHref],["foot-call",telHref],["float-call",telHref]]
    .forEach(([id,h]) => { const e = document.getElementById(id); if (e) e.href = h; });
  [["nav-wa",waHref],["mm-wa",waHref],["hero-wa",waHref],["treasure-wa",waHref],
   ["foot-wa",waHref],["float-wa",waHref],["social-wa",waHref]]
    .forEach(([id,h]) => { const e = document.getElementById(id); if (e) e.href = h; });

  const fp = document.getElementById("foot-phone");
  if (fp) fp.textContent = pretty ? ("+91 " + pretty) : "Call us";
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
}

function renderFavorites(items){
  const grid = document.getElementById("favGrid");
  if (!grid) return;
  const favs = items.filter(i => i.bestseller);
  grid.innerHTML = favs.map(f => {
    const thumb = f.image
      ? `<div class="fav-thumb"><img src="${esc(f.image)}" alt="${esc(f.name)}" loading="lazy"></div>`
      : `<div class="fav-thumb"><span class="ring"></span><span class="mono">${esc((f.name.trim()[0])||"☆")}</span></div>`;
    return `<article class="fav-card reveal"><span class="badge">${STAR} Bestseller</span>${thumb}
      <div class="fav-body"><span class="cat">${esc(f.section||"")}</span><h3>${esc(f.name)}</h3></div></article>`;
  }).join("");
}

function renderTreasures(items){
  const grid = document.getElementById("treasureGrid");
  if (!grid) return;
  const tr = items.filter(i => i.section === "Traditional Delicacies");
  grid.innerHTML = tr.map((t,i) =>
    `<article class="treasure reveal"><div class="treasure-num">№ ${String(i+1).padStart(2,"0")}</div>
      <h3>${esc(t.name)}</h3><p>${esc(t.details||"")}</p></article>`
  ).join("");
}

function renderMenu(cfg, items){
  const order = cfg.sectionOrder && cfg.sectionOrder.length
    ? cfg.sectionOrder
    : [...new Set(items.map(i => i.section))];

  const grid   = document.getElementById("menuGrid");
  const empty  = document.getElementById("menuEmpty");
  const tabsEl = document.getElementById("tabs");
  const search = document.getElementById("search");

  const cardsHTML = items.map((d,i) => {
    const note = d.details
      ? `<span class="dish-note">${esc(d.details)}</span>` : "";
    const sig  = d.signature
      ? `<span class="chefpick">${STAR} Chef's Signature</span>` : "";
    const best = d.bestseller
      ? `<span class="tag-best">${STAR} Bestseller</span>` : "";
    return `
      <article class="dish${d.signature?" is-star":""}"
        data-tab="${esc(d.section)}"
        data-search="${esc((d.name+" "+(d.section||"")+" "+(d.details||"")).toLowerCase())}"
        style="animation-delay:${Math.min(i,10)*20}ms">
        <div class="dish-line">
          <span class="dish-name">${esc(d.name)}</span>
          <span class="leader"></span>
          <span class="dish-price">${priceStr(d.price, d.unit)}</span>
        </div>
        <div class="dish-meta">
          <span class="dish-cat">${esc(d.section||"")}</span>
          ${note}${sig}${best}
        </div>
      </article>`;
  }).join("");
  grid.insertAdjacentHTML("afterbegin", cardsHTML);
  const cards = [...grid.querySelectorAll(".dish")];

  tabsEl.innerHTML = order.map((t,i) =>
    `<button class="tab${i===0?" active":""}" data-tab="${esc(t)}">${esc(t)}</button>`).join("");
  let activeTab = order[0];

  function render(){
    const q = search.value.trim().toLowerCase();
    let shown = 0;
    cards.forEach(c => {
      const matchText = !q || c.dataset.search.includes(q);
      const matchTab  = q ? true : (c.dataset.tab === activeTab);
      const show = matchText && matchTab;
      c.classList.toggle("hidden", !show);
      if (show) shown++;
    });
    empty.classList.toggle("show", shown === 0);
    tabsEl.style.opacity = q ? .5 : 1;
  }
  tabsEl.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => {
      activeTab = btn.dataset.tab;
      tabsEl.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b === btn));
      if (search.value) search.value = "";
      render();
    });
  });
  search.addEventListener("input", render);
  render();
}

function setupInteractions(){
  const ham = document.getElementById("hamburger");
  const mm  = document.getElementById("mobileMenu");
  if (ham && mm){
    ham.addEventListener("click", () => { const o = mm.classList.toggle("open"); ham.setAttribute("aria-expanded", o); });
    mm.querySelectorAll("a").forEach(a => a.addEventListener("click", () => { mm.classList.remove("open"); ham.setAttribute("aria-expanded", false); }));
  }
  const nav = document.getElementById("nav");
  if (nav){
    const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 12);
    onScroll(); window.addEventListener("scroll", onScroll, { passive:true });
  }
  const io = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold:.12 });
  window.__observeReveals = () => document.querySelectorAll(".reveal:not(.in)").forEach(el => io.observe(el));
  window.__observeReveals();
}

function showLoadError(){
  const msg = `<div class="load-error">
    The menu couldn't load. If you opened <code>index.html</code> by double-clicking it,
    browsers block reading <code>menu.json</code> from a local file.<br>
    Run a quick local server — <code>python -m http.server</code> — and open
    <code>http://localhost:8000</code>, or just deploy the folder to your host. See <code>README.txt</code>.
  </div>`;
  ["menuGrid","favGrid","treasureGrid"].forEach(id => {
    const el = document.getElementById(id);
    if (el && id === "menuGrid") el.insertAdjacentHTML("afterbegin", msg);
  });
}

/* ---------- boot ---------- */
async function boot(){
  setupInteractions();

  const dataReady = fetch("menu.json", { cache: "no-store" })
    .then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });

  const minTime = REDUCED ? 300 : 3400;          // let the intro play
  const [result] = await Promise.allSettled([dataReady, wait(minTime)]);

  if (result.status === "fulfilled"){
    const data = result.value;
    const cfg  = data.config || {};
    const items = data.items || [];
    wireContacts(cfg);
    renderFavorites(items);
    renderTreasures(items);
    renderMenu(cfg, items);
    if (window.__observeReveals) window.__observeReveals();   // hook up newly added cards
  } else {
    console.error("menu.json failed to load:", result.reason);
    showLoadError();
  }
  hideLoader();
}

document.addEventListener("DOMContentLoaded", boot);
