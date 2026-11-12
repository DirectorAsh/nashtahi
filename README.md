# نشتهي · Nashtahi

**What are we craving tonight?** A tiny web app that ends the after-dinner dessert debate.

Two people answer 4 quick tap questions each, and Nashtahi picks ONE dessert that fits both of them, plus a backup. Arabic first (right-to-left), English with one tap.

**Try it:** https://directorash.github.io/nashtahi/

## How it works
- **Just me:** 4 questions, one pick.
- **Both of us, one phone:** person 1 answers, passes the phone, person 2 answers.
- **Both of us, two phones:** person 1 answers and shares a link. The answers travel inside the link itself, so there is no server, no account and nothing stored.

Fairness: every dessert is scored for each person (flavor counts most, then texture, temperature, size). In couple mode, desserts are ranked by the **lower** of the two scores first, so nobody is left unhappy.

## Files
- `index.html`, `styles.css`, `app.js` — the app. Open `index.html` directly, no build step.
- `dishes.js` — the 30 desserts with their tags and bilingual descriptions. Edit this to change the menu.
- `tests/run.js` — engine tests: `node tests/run.js`.

Dessert only, for now.
