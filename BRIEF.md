# Project: Nashtahi (نشتهي) — "What are we craving?" dessert picker
Phase 1: clickable web prototype

Ash's brief, received 12 Nov 2026. Verbatim. The single source of truth for scope, text and build order.

## About me
I'm Ash, a filmmaker in Riyadh. I have ZERO coding experience and work in plain English.
- Explain every step in one or two plain sentences.
- When I need to run something in Terminal, give me ONE command at a time, say what it does, and wait for my confirmation before the next.
- Spell out every acronym in full the first time (e.g. RTL (right-to-left)).
- Don't ask me technical questions. Make the expert call, tell me in one line what you chose, and keep going.

## What we're building
A mobile web app that ends the "what dessert should we get?" debate after dinner.
Two people answer 4 quick tap questions each, and the app gives ONE dessert pick that fits both of them, plus one backup.
Dessert only for now. This is a prototype to test with friends, so speed and feel matter more than features.

## Hard rules
1. Plain HTML, CSS and JavaScript only. No frameworks, no build step, no backend, no database, no accounts, no API keys, no AI calls. Must work if I just open index.html.
2. Files: index.html, styles.css, app.js, dishes.js (the dessert data, kept separate so I can edit it later without touching code).
3. Mobile-first (iPhone size), but fine on desktop.
4. Bilingual: Arabic is the default and fully RTL (right-to-left); English via a toggle in the corner. Every piece of text exists in both languages. Arabic must be correct Modern Standard Arabic. Use the Arabic text I give below exactly as written.
5. Font: IBM Plex Sans Arabic from Google Fonts, with a system fallback.
6. Emoji for dessert visuals (no photos yet).

## The flow
Home screen:
- App name + one line: "ماذا نشتهي الليلة؟" / "What are we craving tonight?"
- Two big buttons: "أنا فقط" / "Just me" and "نحن الاثنان" / "Both of us"

Solo mode: 4 questions → result.

Couple mode, two ways (offer both on one screen):
A) Same phone: Person 1 answers → "مرّر الجوال" / "Pass the phone" screen → Person 2 answers → result.
B) Two phones: Person 1 answers → app creates a share link with their answers encoded inside the URL (no server). Share it with the native share sheet (Web Share API (Application Programming Interface)), with a copy-link fallback. Person 2 opens the link, sees "Your partner already answered", answers, and gets the result. Person 2 can share the result link back.

Each question is one screen of large tap cards. Tapping a card moves to the next question automatically. Show a small progress indicator (1/4). Back button available.

## The 4 questions (use this text exactly)
Q1. دافئ أم بارد؟ / Warm or cold?
- دافئ / Warm
- بارد / Cold
- لا يهم / Either

Q2. أي قوام تريد؟ / What texture?
- كريمي / Creamy
- مقرمش / Crunchy
- طري وهشّ / Soft & fluffy
- ذائب / Melty & gooey

Q3. أي نكهة تناديك؟ / Which flavor is calling you?
- شوكولاتة / Chocolate
- فواكه / Fruity
- عربي بالزعفران والهيل / Arabic (saffron & cardamom)
- كراميل ومكسرات / Caramel & nuts
- جبن / Cheese

Q4. ما مقدار رغبتك في الحلوى؟ / How big is the craving?
- لقمة خفيفة / A light bite
- حلوى كاملة / A proper dessert
- شيء ثقيل / Go big

## Dessert list (dishes.js)
Each dish has: id, name_ar, name_en, emoji, temperature (warm/cold/room), textures (one or more), flavors (one or more), size (light/medium/heavy), and a one-line description in both languages. Tag each one accurately from your own food knowledge.

كنافة / Kunafa
تشيز كيك سان سيباستيان / San Sebastián cheesecake
لقيمات / Luqaimat
جيلاتو / Gelato
فوندان الشوكولاتة / Chocolate lava cake
كيكة الحليب بالزعفران / Saffron milk cake
أم علي / Umm Ali
بسبوسة / Basbousa
تيراميسو / Tiramisu
كريب / Crêpe
تشوروز / Churros
كوكيز / Warm cookies
براونيز / Brownies
لفائف القرفة / Cinnamon rolls
شوكولاتة دبي / Dubai chocolate
وعاء الأساي / Açaí bowl
سلطة فواكه بالقشطة / Fruit salad with cream
مهلبية / Muhallabia
بان كيك / Pancakes
وافل / Waffles
كرواسون بالفستق / Pistachio croissant
كيكة العسل / Honey cake
كيكة التمر بالتوفي / Date toffee cake
قطايف / Qatayef
بروفيترول / Profiteroles
موتشي / Mochi
دونات / Donuts
كريم بروليه / Crème brûlée
فراولة بالشوكولاتة / Chocolate strawberries
ميلك شيك / Milkshake

## Matching logic
- Score every dish for each person. Flavor match is worth the most, then texture, then temperature, then size. "Either" is neutral (no points lost).
- Couple mode must be FAIR: rank dishes by the LOWER of the two people's scores (so neither person is left unhappy), then break ties by the total score.
- Result = top dish. Backup = second dish, which should differ in flavor from the top pick when possible.
- One-line reason under the pick, generated from the shared answers, e.g. "كلاكما أراد شيئًا باردًا وكريميًا" / "You both wanted something cold and creamy". If they disagreed, say it's the best middle ground.

## Result screen
- Big reveal animation of the emoji + dish name (make this moment feel satisfying, it's the payoff).
- Description line + reason line.
- Button: "ابحث عنها بالقرب منك" / "Find it nearby" → opens Google Maps search for the dish in English + "Riyadh" using the official link format: https://www.google.com/maps/search/?api=1&query=...
- Button: "اقتراح آخر" / "Show me another" → next best dish, never repeating in this session.
- Small backup pick card underneath.
- "ابدأ من جديد" / "Start over".

## Design direction
Act as a senior product designer. Warm, premium, appetizing. Think late-night dessert café, not a generic quiz.
- Rich warm palette (cream, caramel, deep chocolate) with one bright accent. Support both light and dark mode automatically.
- Big rounded tap cards, generous spacing, thumb-friendly.
- Smooth, quick transitions between questions. No clutter, no ads, no sign-up.

## Build order (check in with me after each step)
1. Set up the files and show me the home screen working in my browser.
2. Questions + solo mode result.
3. Couple mode: same phone, then share link.
4. Polish: animations, dark mode, Arabic/English check on every screen.
5. Put it online for free so I can send the link to friends: create a PUBLIC GitHub repository called "nashtahi" under my account (the gh tool is already logged in) and turn on GitHub Pages. Give me the final link.

## Done when
I can send the link to my fiancée, we both answer on our own phones, and we get one dessert pick in under 30 seconds.
