/* Nashtahi — app logic. Plain JavaScript, no build step.
   Part 1: the engine (pure functions, also used by tests/run.js).
   Part 2: the screens (only runs in a browser). */

// =====================================================================
// Part 1 — Engine
// =====================================================================

const QUESTIONS = [
  {
    id: "temp",
    text: { ar: "دافئ أم بارد؟", en: "Warm or cold?" },
    options: [
      { v: "warm",   emoji: "🔥", ar: "دافئ",  en: "Warm" },
      { v: "cold",   emoji: "🧊", ar: "بارد",  en: "Cold" },
      { v: "either", emoji: "🤷", ar: "لا يهم", en: "Either" }
    ]
  },
  {
    id: "texture",
    text: { ar: "أي قوام تريد؟", en: "What texture?" },
    options: [
      { v: "creamy",  emoji: "🍮", ar: "كريمي",     en: "Creamy" },
      { v: "crunchy", emoji: "🥐", ar: "مقرمش",     en: "Crunchy" },
      { v: "fluffy",  emoji: "☁️", ar: "طري وهشّ",  en: "Soft & fluffy" },
      { v: "melty",   emoji: "🫠", ar: "ذائب",      en: "Melty & gooey" }
    ]
  },
  {
    id: "flavor",
    text: { ar: "أي نكهة تناديك؟", en: "Which flavor is calling you?" },
    options: [
      { v: "chocolate",    emoji: "🍫", ar: "شوكولاتة",              en: "Chocolate" },
      { v: "fruity",       emoji: "🍓", ar: "فواكه",                 en: "Fruity" },
      { v: "arabic",       emoji: "🌼", ar: "عربي بالزعفران والهيل", en: "Arabic (saffron & cardamom)" },
      { v: "caramel_nuts", emoji: "🥜", ar: "كراميل ومكسرات",        en: "Caramel & nuts" },
      { v: "cheese",       emoji: "🧀", ar: "جبن",                   en: "Cheese" }
    ]
  },
  {
    id: "size",
    text: { ar: "ما مقدار رغبتك في الحلوى؟", en: "How big is the craving?" },
    options: [
      { v: "light",  emoji: "🍬", ar: "لقمة خفيفة", en: "A light bite" },
      { v: "medium", emoji: "🍰", ar: "حلوى كاملة", en: "A proper dessert" },
      { v: "heavy",  emoji: "🎂", ar: "شيء ثقيل",   en: "Go big" }
    ]
  }
];

const WEIGHTS = { flavor: 4, texture: 3, temp: 2, size: 1 };
const SIZE_ORDER = { light: 0, medium: 1, heavy: 2 };

// One letter per answer keeps share links short: #p=wcfl
const CODES = {
  temp:    { warm: "w", cold: "c", either: "e" },
  texture: { creamy: "c", crunchy: "r", fluffy: "f", melty: "m" },
  flavor:  { chocolate: "c", fruity: "f", arabic: "a", caramel_nuts: "n", cheese: "h" },
  size:    { light: "l", medium: "m", heavy: "h" }
};

function scoreDish(dish, a) {
  let s = 0;
  if (dish.flavors.includes(a.flavor)) s += WEIGHTS.flavor;
  if (dish.textures.includes(a.texture)) s += WEIGHTS.texture;
  if (a.temp === "either" || dish.temperature === a.temp) s += WEIGHTS.temp;
  else if (dish.temperature === "room") s += WEIGHTS.temp / 2;
  const gap = Math.abs(SIZE_ORDER[dish.size] - SIZE_ORDER[a.size]);
  if (gap === 0) s += WEIGHTS.size;
  else if (gap === 1) s += WEIGHTS.size / 2;
  return s;
}

// people: array of 1 or 2 answer objects. Returns dishes ranked best first.
function rankDishes(dishes, people) {
  const scored = dishes.map((d, i) => {
    const scores = people.map((p) => scoreDish(d, p));
    return { dish: d, scores, min: Math.min(...scores), sum: scores.reduce((x, y) => x + y, 0), i };
  });
  scored.sort((a, b) => (b.min - a.min) || (b.sum - a.sum) || (a.i - b.i));
  return scored;
}

function sharesFlavor(a, b) {
  return a.flavors.some((f) => b.flavors.includes(f));
}

// Backup = next best dish, preferring one with a different flavor
// as long as it stays within one flavor-weight of the pick (so it is still a fair choice).
function pickBackup(ranked, top, excludeIds) {
  const pool = ranked.filter((r) => r.dish.id !== top.dish.id && !excludeIds.has(r.dish.id));
  if (!pool.length) return null;
  const different = pool.find((r) => !sharesFlavor(r.dish, top.dish) && r.min >= top.min - WEIGHTS.flavor);
  return different || pool[0];
}

function encodeAnswers(a) {
  return CODES.temp[a.temp] + CODES.texture[a.texture] + CODES.flavor[a.flavor] + CODES.size[a.size];
}

function decodeAnswers(code) {
  if (typeof code !== "string" || code.length !== 4) return null;
  const keys = ["temp", "texture", "flavor", "size"];
  const out = {};
  for (let i = 0; i < 4; i++) {
    const map = CODES[keys[i]];
    const found = Object.keys(map).find((k) => map[k] === code[i]);
    if (!found) return null;
    out[keys[i]] = found;
  }
  return out;
}

// ----- Reason line -----
const WORDS = {
  ar: {
    temp:    { warm: "دافئًا", cold: "باردًا" },
    texture: { creamy: "كريميًا", crunchy: "مقرمشًا", fluffy: "طريًا وهشًّا", melty: "ذائبًا" },
    flavor:  { chocolate: "بالشوكولاتة", fruity: "بالفواكه", arabic: "بالزعفران والهيل", caramel_nuts: "بالكراميل والمكسرات", cheese: "بالجبن" },
    // Same words after "شيء" (no tanween fatha in undiacritised text)
    tempG:    { warm: "دافئ", cold: "بارد" },
    textureG: { creamy: "كريمي", crunchy: "مقرمش", fluffy: "طري وهشّ", melty: "ذائب" },
    dim:      { temp: "الحرارة", texture: "القوام", flavor: "النكهة" }
  },
  en: {
    temp:    { warm: "warm", cold: "cold" },
    texture: { creamy: "creamy", crunchy: "crunchy", fluffy: "soft and fluffy", melty: "melty" },
    flavor:  { chocolate: "with chocolate", fruity: "with fruit", arabic: "with saffron and cardamom", caramel_nuts: "with caramel and nuts", cheese: "with cheese" },
    dim:     { temp: "temperature", texture: "texture", flavor: "flavor" }
  }
};

function joinAr(parts) {
  return parts.join(" و");
}
function joinEn(parts) {
  if (parts.length <= 1) return parts.join("");
  return parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1];
}

// Describe a set of answers: "باردًا وكريميًا بالشوكولاتة" / "cold and creamy with chocolate"
function describe(lang, a, genitive) {
  const w = WORDS[lang];
  const adj = [];
  if (a.temp && a.temp !== "either") adj.push(lang === "ar" && genitive ? w.tempG[a.temp] : w.temp[a.temp]);
  if (a.texture) adj.push(lang === "ar" && genitive ? w.textureG[a.texture] : w.texture[a.texture]);
  let s = lang === "ar" ? joinAr(adj) : joinEn(adj);
  if (a.flavor) s = (s ? s + " " : "") + w.flavor[a.flavor];
  return s;
}

function reasonText(lang, people) {
  const w = WORDS[lang];
  if (people.length === 1) {
    const d = describe(lang, people[0], false);
    return lang === "ar" ? `اخترت شيئًا ${d}` : `You wanted something ${d}`;
  }
  const [a, b] = people;
  const agreed = {};
  const disagreed = [];
  // temperature: "either" goes along with anything
  if (a.temp === b.temp) { if (a.temp !== "either") agreed.temp = a.temp; }
  else if (a.temp === "either") agreed.temp = b.temp;
  else if (b.temp === "either") agreed.temp = a.temp;
  else disagreed.push("temp");
  if (a.texture === b.texture) agreed.texture = a.texture; else disagreed.push("texture");
  if (a.flavor === b.flavor) agreed.flavor = a.flavor; else disagreed.push("flavor");

  const agreedCount = Object.keys(agreed).length;
  if (disagreed.length === 0) {
    const d = describe(lang, agreed, false);
    if (!d) return lang === "ar" ? "اتفقتما على كل شيء، وهذا أفضل ما يناسبكما" : "You agreed on everything, and this fits you both best";
    return lang === "ar" ? `كلاكما أراد شيئًا ${d}` : `You both wanted something ${d}`;
  }
  if (agreedCount === 0) {
    return lang === "ar"
      ? "ذوقاكما مختلفان الليلة، وهذا أفضل حلّ وسط يرضيكما معًا"
      : "Different cravings tonight, so this is the best middle ground for you both";
  }
  const d = describe(lang, agreed, true);
  const dims = disagreed.map((k) => w.dim[k]);
  return lang === "ar"
    ? `اتفقتما على شيء ${d}، واختلفتما في ${joinAr(dims)}، وهذا أفضل حلّ وسط لكما`
    : `You agreed on something ${d} but not on ${joinEn(dims)}, so this is the best middle ground`;
}

const Engine = { QUESTIONS, WEIGHTS, scoreDish, rankDishes, pickBackup, encodeAnswers, decodeAnswers, reasonText, describe };
if (typeof module !== "undefined") module.exports = Engine;

// =====================================================================
// Part 2 — Screens
// =====================================================================

if (typeof document !== "undefined") (function () {
  "use strict";

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
      back: "رجوع",
      coupleTitle: "كيف تجيبان؟",
      samePhone: "جوال واحد",
      samePhoneSub: "جاوبا بالتناوب على هذا الجوال",
      twoPhones: "جوالان",
      twoPhonesSub: "أرسل رابطًا، ويجيب شريكك على جواله",
      person1: "الشخص الأول",
      person2: "الشخص الثاني",
      passTitle: "مرّر الجوال",
      passSub: "حان دور الشخص الثاني",
      ready: "جاهز، لنبدأ",
      shareTitle: "أرسل الرابط لشريكك",
      shareSub: "عندما يجيب على الأسئلة الأربعة تظهر النتيجة لكما",
      shareBtn: "مشاركة الرابط",
      copyBtn: "نسخ الرابط",
      copied: "تم نسخ الرابط",
      shareText: "جاوبت على أسئلة نشتهي، دورك الآن 🍰",
      partnerTitle: "شريكك أجاب مسبقًا",
      partnerSub: "دورك الآن: 4 أسئلة سريعة ثم النتيجة",
      start: "ابدأ",
      pickingSolo: "نختار لك…",
      pickingCouple: "نختار لكما…",
      kicker: "اختيار الليلة",
      findNearby: "ابحث عنها بالقرب منك",
      another: "اقتراح آخر",
      noMore: "هذه كل اقتراحاتنا الليلة",
      backupLabel: "الخيار الاحتياطي",
      startOver: "ابدأ من جديد",
      shareResult: "أرسل النتيجة لشريكك",
      resultShareText: "هذا ما نشتهيه الليلة: {name} {emoji}"
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
      back: "Back",
      coupleTitle: "How will you answer?",
      samePhone: "One phone",
      samePhoneSub: "Take turns on this phone",
      twoPhones: "Two phones",
      twoPhonesSub: "Send a link, your partner answers on theirs",
      person1: "Person 1",
      person2: "Person 2",
      passTitle: "Pass the phone",
      passSub: "Person 2, it's your turn",
      ready: "Ready, let's go",
      shareTitle: "Send the link to your partner",
      shareSub: "Once they answer the 4 questions, you both get the result",
      shareBtn: "Share link",
      copyBtn: "Copy link",
      copied: "Link copied",
      shareText: "I answered Nashtahi's 4 questions, your turn 🍰",
      partnerTitle: "Your partner already answered",
      partnerSub: "Your turn: 4 quick questions, then the result",
      start: "Start",
      pickingSolo: "Picking for you…",
      pickingCouple: "Picking for you both…",
      kicker: "Tonight's pick",
      findNearby: "Find it nearby",
      another: "Show me another",
      noMore: "That's every pick we have tonight",
      backupLabel: "Backup pick",
      startOver: "Start over",
      shareResult: "Send the result back",
      resultShareText: "Tonight we're craving: {name} {emoji}"
    }
  };

  // ---------- State ----------
  const state = {
    lang: loadLang(),
    screen: "home",     // home | couple | question | pass | share | partner | result
    mode: "solo",       // solo | same | link
    person: 1,
    step: 0,
    answers: { 1: {}, 2: {} },
    partnerAnswers: null,  // decoded from a share link (person 1's answers)
    ranked: [],
    cursor: 0,
    shownMain: new Set(),
    exhausted: false
  };

  function loadLang() {
    try {
      const saved = localStorage.getItem("nashtahi.lang");
      if (saved === "ar" || saved === "en") return saved;
    } catch (e) { /* private mode */ }
    return "ar";
  }

  function t(key) {
    return (T[state.lang] && T[state.lang][key]) || T.ar[key] || key;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // ---------- DOM ----------
  const app = document.getElementById("app");
  const backBtn = document.getElementById("backBtn");
  const progress = document.getElementById("progress");
  const langBtn = document.getElementById("langBtn");
  const toast = document.getElementById("toast");

  function applyLang() {
    document.documentElement.lang = state.lang;
    document.documentElement.dir = state.lang === "ar" ? "rtl" : "ltr";
    document.title = t("appName");
    langBtn.textContent = t("langToggle");
    backBtn.setAttribute("aria-label", t("back"));
  }

  function people() {
    if (state.mode === "solo") return [state.answers[1]];
    return [state.answers[1], state.answers[2]];
  }

  function isCouple() {
    return state.mode !== "solo";
  }

  // ---------- Links ----------
  function baseUrl() {
    return location.origin + location.pathname;
  }
  function inviteLink() {
    return `${baseUrl()}#p=${encodeAnswers(state.answers[1])}&l=${state.lang}`;
  }
  function resultLink() {
    return `${baseUrl()}#p=${encodeAnswers(state.answers[1])}&q=${encodeAnswers(state.answers[2])}&l=${state.lang}`;
  }
  function parseHash() {
    const h = location.hash.replace(/^#/, "");
    if (!h) return null;
    const params = {};
    h.split("&").forEach((kv) => {
      const [k, v] = kv.split("=");
      if (k) params[k] = decodeURIComponent(v || "");
    });
    return params;
  }
  function clearHash() {
    if (location.hash) history.replaceState(null, "", baseUrl());
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

  function renderCouple() {
    return `
      <section class="screen couple">
        <div class="hero small">
          <div class="hero-emoji" aria-hidden="true"><span>💑</span></div>
          <h2 class="title">${esc(t("coupleTitle"))}</h2>
        </div>
        <div class="choices">
          <button class="big-btn" type="button" data-action="same">
            <span class="big-emoji" aria-hidden="true">📱</span>
            <span class="big-label">${esc(t("samePhone"))}<span class="big-sub">${esc(t("samePhoneSub"))}</span></span>
          </button>
          <button class="big-btn primary" type="button" data-action="link">
            <span class="big-emoji" aria-hidden="true">🔗</span>
            <span class="big-label">${esc(t("twoPhones"))}<span class="big-sub">${esc(t("twoPhonesSub"))}</span></span>
          </button>
        </div>
      </section>`;
  }

  function renderQuestion() {
    const q = QUESTIONS[state.step];
    const current = state.answers[state.person][q.id];
    const who = isCouple() ? `<p class="who">${esc(state.person === 1 ? t("person1") : t("person2"))}</p>` : "";
    const cards = q.options.map((o) => `
        <button class="card${current === o.v ? " selected" : ""}" type="button" data-answer="${o.v}">
          <span class="card-emoji" aria-hidden="true">${o.emoji}</span>
          <span class="card-label">${esc(o[state.lang])}</span>
        </button>`).join("");
    return `
      <section class="screen question" data-step="${state.step}">
        ${who}
        <h2 class="q">${esc(q.text[state.lang])}</h2>
        <div class="cards cards-${q.options.length}">${cards}</div>
      </section>`;
  }

  function renderPass() {
    return `
      <section class="screen notice">
        <div class="hero">
          <div class="hero-emoji" aria-hidden="true"><span class="swing">📲</span></div>
          <h2 class="title">${esc(t("passTitle"))}</h2>
          <p class="tagline">${esc(t("passSub"))}</p>
        </div>
        <div class="choices">
          <button class="btn primary" type="button" data-action="ready">${esc(t("ready"))}</button>
        </div>
      </section>`;
  }

  function renderShare() {
    const canShare = typeof navigator.share === "function";
    return `
      <section class="screen notice">
        <div class="hero">
          <div class="hero-emoji" aria-hidden="true"><span>💌</span></div>
          <h2 class="title">${esc(t("shareTitle"))}</h2>
          <p class="tagline">${esc(t("shareSub"))}</p>
        </div>
        <div class="choices">
          ${canShare ? `<button class="btn primary" type="button" data-action="share-invite">${esc(t("shareBtn"))}</button>` : ""}
          <button class="btn${canShare ? "" : " primary"}" type="button" data-action="copy-invite">${esc(t("copyBtn"))}</button>
          <input class="link-field" type="text" readonly value="${esc(inviteLink())}" aria-label="link">
        </div>
      </section>`;
  }

  function renderPartner() {
    return `
      <section class="screen notice">
        <div class="hero">
          <div class="hero-emoji" aria-hidden="true"><span>💌</span></div>
          <h2 class="title">${esc(t("partnerTitle"))}</h2>
          <p class="tagline">${esc(t("partnerSub"))}</p>
        </div>
        <div class="choices">
          <button class="btn primary" type="button" data-action="partner-start">${esc(t("start"))}</button>
        </div>
      </section>`;
  }

  function currentPick() {
    return state.ranked[state.cursor];
  }

  function renderResult() {
    const top = currentPick();
    const dish = top.dish;
    const backup = pickBackup(state.ranked, top, state.shownMain);
    const lang = state.lang;
    const name = lang === "ar" ? dish.name_ar : dish.name_en;
    const desc = lang === "ar" ? dish.desc_ar : dish.desc_en;
    const reason = reasonText(lang, people());
    const maps = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(dish.name_en + " Riyadh");
    const canShareBack = state.mode === "link" && typeof navigator.share === "function";
    const backupHtml = backup ? `
        <div class="backup">
          <span class="backup-label">${esc(t("backupLabel"))}</span>
          <div class="backup-card">
            <span class="backup-emoji" aria-hidden="true">${backup.dish.emoji}</span>
            <span class="backup-name">${esc(lang === "ar" ? backup.dish.name_ar : backup.dish.name_en)}</span>
          </div>
        </div>` : "";
    return `
      <section class="screen result">
        <p class="kicker">${esc(t("kicker"))}</p>
        <div class="reveal">
          <div class="glow" aria-hidden="true"></div>
          <div class="sparks" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
          <div class="reveal-emoji">${dish.emoji}</div>
        </div>
        <h2 class="dish-name">${esc(name)}</h2>
        <p class="dish-desc">${esc(desc)}</p>
        <p class="reason">${esc(reason)}</p>
        <div class="actions">
          <a class="btn primary" href="${maps}" target="_blank" rel="noopener">${esc(t("findNearby"))}</a>
          <button class="btn" type="button" data-action="another"${state.exhausted ? " disabled" : ""}>${esc(state.exhausted ? t("noMore") : t("another"))}</button>
          ${state.mode === "link" ? `<button class="btn ghost" type="button" data-action="share-result">${esc(canShareBack ? t("shareResult") : t("copyBtn"))}</button>` : ""}
        </div>
        ${backupHtml}
        <button class="link-btn" type="button" data-action="restart">${esc(t("startOver"))}</button>
      </section>`;
  }

  function renderPicking() {
    return `
      <section class="screen picking">
        <div class="hero">
          <div class="hero-emoji shuffle" aria-hidden="true"><span>🍫</span><span>🍰</span><span>🍓</span></div>
          <p class="tagline">${esc(isCouple() ? t("pickingCouple") : t("pickingSolo"))}</p>
        </div>
      </section>`;
  }

  function render() {
    applyLang();
    const showBack = ["couple", "question", "pass", "share"].includes(state.screen);
    backBtn.hidden = !showBack;
    progress.hidden = state.screen !== "question";
    if (state.screen === "question") progress.textContent = `${state.step + 1}/4`;

    let html = "";
    switch (state.screen) {
      case "couple":   html = renderCouple(); break;
      case "question": html = renderQuestion(); break;
      case "pass":     html = renderPass(); break;
      case "share":    html = renderShare(); break;
      case "partner":  html = renderPartner(); break;
      case "picking":  html = renderPicking(); break;
      case "result":   html = renderResult(); break;
      default:         html = renderHome();
    }
    app.innerHTML = html;
    window.scrollTo(0, 0);
  }

  // Leave the current screen with a short fade, then render the next one.
  function go(update) {
    const cur = app.querySelector(".screen");
    if (cur) cur.classList.add("leaving");
    setTimeout(() => { update(); render(); }, cur ? 160 : 0);
  }

  // ---------- Flow ----------
  function startQuestions(person) {
    state.person = person;
    state.step = 0;
    state.answers[person] = {};
    state.screen = "question";
  }

  function finishQuestions() {
    if (state.mode === "solo") return showResult();
    if (state.mode === "same") {
      if (state.person === 1) { state.screen = "pass"; return; }
      return showResult();
    }
    if (state.mode === "link") {
      if (state.person === 1) { state.screen = "share"; return; }
      return showResult();
    }
  }

  function showResult() {
    state.ranked = rankDishes(DISHES, people());
    state.cursor = 0;
    state.shownMain = new Set([state.ranked[0].dish.id]);
    state.exhausted = false;
    state.screen = "picking";
    setTimeout(() => go(() => { state.screen = "result"; }), 900);
  }

  function showAnother() {
    const next = state.ranked.findIndex((r, i) => i > state.cursor && !state.shownMain.has(r.dish.id));
    if (next === -1) { state.exhausted = true; render(); return; }
    state.cursor = next;
    state.shownMain.add(state.ranked[next].dish.id);
    if (!state.ranked.some((r) => !state.shownMain.has(r.dish.id))) state.exhausted = true;
    go(() => {});
  }

  function restart() {
    clearHash();
    state.mode = "solo";
    state.person = 1;
    state.step = 0;
    state.answers = { 1: {}, 2: {} };
    state.partnerAnswers = null;
    state.ranked = [];
    state.cursor = 0;
    state.shownMain = new Set();
    state.exhausted = false;
    go(() => { state.screen = "home"; });
  }

  function goBack() {
    if (state.screen === "couple") return go(() => { state.screen = "home"; });
    if (state.screen === "pass" || state.screen === "share") {
      return go(() => { state.person = 1; state.step = 3; state.screen = "question"; });
    }
    if (state.screen === "question") {
      if (state.step > 0) return go(() => { state.step -= 1; });
      if (state.mode === "solo") return go(() => { state.screen = "home"; });
      if (state.person === 1) return go(() => { state.screen = "couple"; });
      if (state.mode === "same") return go(() => { state.screen = "pass"; });
      return go(() => { state.screen = "partner"; });
    }
  }

  // ---------- Share helpers ----------
  let toastTimer = null;
  function showToast(msg) {
    toast.textContent = msg;
    toast.hidden = false;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.classList.remove("show"); toast.hidden = true; }, 1800);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(t("copied"));
      return true;
    } catch (e) {
      const field = app.querySelector(".link-field");
      if (field) { field.hidden = false; field.focus(); field.select(); }
      return false;
    }
  }

  async function shareOrCopy(text, url) {
    if (typeof navigator.share === "function") {
      try { await navigator.share({ title: t("appName"), text, url }); return; }
      catch (e) { if (e && e.name === "AbortError") return; }
    }
    copyText(url);
  }

  // ---------- Events ----------
  langBtn.addEventListener("click", () => {
    state.lang = state.lang === "ar" ? "en" : "ar";
    try { localStorage.setItem("nashtahi.lang", state.lang); } catch (e) { /* ignore */ }
    render();
  });

  backBtn.addEventListener("click", goBack);

  app.addEventListener("click", (ev) => {
    const card = ev.target.closest("[data-answer]");
    if (card) {
      const q = QUESTIONS[state.step];
      state.answers[state.person][q.id] = card.dataset.answer;
      app.querySelectorAll(".card").forEach((c) => c.classList.toggle("selected", c === card));
      card.classList.add("picked");
      setTimeout(() => {
        if (state.step < QUESTIONS.length - 1) go(() => { state.step += 1; });
        else go(finishQuestions);
      }, 220);
      return;
    }

    const btn = ev.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    switch (action) {
      case "solo":
        state.mode = "solo";
        go(() => startQuestions(1));
        break;
      case "couple":
        go(() => { state.screen = "couple"; });
        break;
      case "same":
        state.mode = "same";
        go(() => startQuestions(1));
        break;
      case "link":
        state.mode = "link";
        go(() => startQuestions(1));
        break;
      case "ready":
        go(() => startQuestions(2));
        break;
      case "partner-start":
        go(() => startQuestions(2));
        break;
      case "share-invite":
        shareOrCopy(t("shareText"), inviteLink());
        break;
      case "copy-invite":
        copyText(inviteLink());
        break;
      case "share-result": {
        const dish = currentPick().dish;
        const name = state.lang === "ar" ? dish.name_ar : dish.name_en;
        const text = t("resultShareText").replace("{name}", name).replace("{emoji}", dish.emoji);
        shareOrCopy(text, resultLink());
        break;
      }
      case "another":
        showAnother();
        break;
      case "restart":
        restart();
        break;
    }
  });

  // ---------- Boot: did someone open a share link? ----------
  function boot() {
    const params = parseHash();
    if (params && (params.l === "ar" || params.l === "en")) {
      state.lang = params.l;
    }
    const p = params && decodeAnswers(params.p);
    const q = params && decodeAnswers(params.q);
    if (p && q) {
      // A result link: both answered, show the pick straight away.
      state.mode = "link";
      state.answers = { 1: p, 2: q };
      state.ranked = rankDishes(DISHES, people());
      state.cursor = 0;
      state.shownMain = new Set([state.ranked[0].dish.id]);
      state.screen = "picking";
      render();
      setTimeout(() => go(() => { state.screen = "result"; }), 900);
      return;
    }
    if (p) {
      // An invite: person 1 answered, this phone is person 2.
      state.mode = "link";
      state.answers[1] = p;
      state.partnerAnswers = p;
      state.screen = "partner";
      render();
      return;
    }
    render();
  }

  boot();
  // A share link opened while the app is already on screen (same tab) must boot again.
  window.addEventListener("hashchange", () => { if (location.hash) boot(); });
})();
