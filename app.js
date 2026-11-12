/* Nashtahi — app logic. Plain JavaScript, no build step.
   Screens render into #app. Arabic is the default and RTL; English via the corner toggle. */

(function () {
  "use strict";

  // ---------- Text in both languages ----------
  const T = {
    ar: {
      appName: "نشتهي",
      tagline: "ماذا نشتهي الليلة؟",
      justMe: "أنا فقط",
      bothOfUs: "نحن الاثنان",
      justMeSub: "4 أسئلة سريعة",
      bothOfUsSub: "4 أسئلة لكل واحد منكما",
      footnote: "حلوى فقط، في الوقت الحالي",
      langToggle: "English",
      back: "رجوع"
    },
    en: {
      appName: "Nashtahi",
      tagline: "What are we craving tonight?",
      justMe: "Just me",
      bothOfUs: "Both of us",
      justMeSub: "4 quick taps",
      bothOfUsSub: "4 taps each",
      footnote: "Dessert only, for now",
      langToggle: "العربية",
      back: "Back"
    }
  };

  // ---------- State ----------
  const state = {
    lang: loadLang(),
    screen: "home"
  };

  function loadLang() {
    try {
      const saved = localStorage.getItem("nashtahi.lang");
      if (saved === "ar" || saved === "en") return saved;
    } catch (e) { /* private mode etc. */ }
    return "ar";
  }

  function t(key) {
    return (T[state.lang] && T[state.lang][key]) || T.ar[key] || key;
  }

  // ---------- DOM ----------
  const app = document.getElementById("app");
  const backBtn = document.getElementById("backBtn");
  const progress = document.getElementById("progress");
  const langBtn = document.getElementById("langBtn");

  function applyLang() {
    document.documentElement.lang = state.lang;
    document.documentElement.dir = state.lang === "ar" ? "rtl" : "ltr";
    document.title = t("appName");
    langBtn.textContent = t("langToggle");
    backBtn.setAttribute("aria-label", t("back"));
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // ---------- Screens ----------
  function renderHome() {
    return `
      <section class="screen home">
        <div class="hero">
          <div class="hero-emoji" aria-hidden="true"><span>🍫</span><span>🍰</span><span>🍓</span></div>
          <h1 class="brand">${esc(t("appName"))}<span class="brand-dot" aria-hidden="true"></span></h1>
          <p class="tagline">${esc(t("tagline"))}</p>
        </div>
        <div class="choices">
          <button class="big-btn" type="button" data-action="solo">
            <span class="big-emoji" aria-hidden="true">🙋</span>
            <span class="big-label">${esc(t("justMe"))}<span class="big-sub">${esc(t("justMeSub"))}</span></span>
          </button>
          <button class="big-btn primary" type="button" data-action="couple">
            <span class="big-emoji" aria-hidden="true">💑</span>
            <span class="big-label">${esc(t("bothOfUs"))}<span class="big-sub">${esc(t("bothOfUsSub"))}</span></span>
          </button>
        </div>
        <p class="footnote">${esc(t("footnote"))}</p>
      </section>`;
  }

  function render() {
    applyLang();
    backBtn.hidden = state.screen === "home";
    progress.hidden = true;

    let html = "";
    switch (state.screen) {
      case "home":
      default:
        html = renderHome();
    }
    app.innerHTML = html;
  }

  // ---------- Events ----------
  langBtn.addEventListener("click", () => {
    state.lang = state.lang === "ar" ? "en" : "ar";
    try { localStorage.setItem("nashtahi.lang", state.lang); } catch (e) { /* ignore */ }
    render();
  });

  app.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    // Step 1: home screen only. Solo and couple flows arrive in steps 2 and 3.
    if (action === "solo" || action === "couple") {
      btn.animate([{ transform: "scale(1)" }, { transform: "scale(0.97)" }, { transform: "scale(1)" }], { duration: 220, easing: "ease-out" });
    }
  });

  // ---------- Go ----------
  render();
})();
