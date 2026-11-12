// Nashtahi engine tests. Run: node tests/run.js
"use strict";
const path = require("path");
const { DISHES } = require(path.join(__dirname, "..", "dishes.js"));
const E = require(path.join(__dirname, "..", "app.js"));

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  ok   " + name); }
  catch (e) { failed++; console.log("  FAIL " + name + "\n       " + e.message); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || "assertion failed"); }
function eq(a, b, msg) { if (a !== b) throw new Error((msg || "") + ` expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

const TEMPS = ["warm", "cold", "room"];
const TEXTURES = ["creamy", "crunchy", "fluffy", "melty"];
const FLAVORS = ["chocolate", "fruity", "arabic", "caramel_nuts", "cheese"];
const SIZES = ["light", "medium", "heavy"];

console.log("dishes.js");
test("30 dishes with unique ids", () => {
  eq(DISHES.length, 30);
  eq(new Set(DISHES.map((d) => d.id)).size, 30);
});
test("every dish is fully tagged and bilingual", () => {
  for (const d of DISHES) {
    assert(TEMPS.includes(d.temperature), d.id + " temperature");
    assert(d.textures.length >= 1 && d.textures.every((x) => TEXTURES.includes(x)), d.id + " textures");
    assert(d.flavors.length >= 1 && d.flavors.every((x) => FLAVORS.includes(x)), d.id + " flavors");
    assert(SIZES.includes(d.size), d.id + " size");
    for (const k of ["name_ar", "name_en", "emoji", "desc_ar", "desc_en"]) assert(d[k] && d[k].length, d.id + " " + k);
  }
});
test("every flavor, texture and temperature has at least two dishes", () => {
  for (const f of FLAVORS) assert(DISHES.filter((d) => d.flavors.includes(f)).length >= 2, f);
  for (const x of TEXTURES) assert(DISHES.filter((d) => d.textures.includes(x)).length >= 2, x);
  for (const tmp of ["warm", "cold"]) assert(DISHES.filter((d) => d.temperature === tmp).length >= 2, tmp);
});

console.log("scoring");
const choc = { temp: "warm", texture: "melty", flavor: "chocolate", size: "medium" };
test("warm + melty + chocolate + proper dessert picks the lava cake", () => {
  const r = E.rankDishes(DISHES, [choc]);
  eq(r[0].dish.id, "lava_cake");
  eq(r[0].scores[0], 10);
});
test("flavor outweighs texture outweighs temperature outweighs size", () => {
  assert(E.WEIGHTS.flavor > E.WEIGHTS.texture && E.WEIGHTS.texture > E.WEIGHTS.temp && E.WEIGHTS.temp > E.WEIGHTS.size);
});
test("'Either' loses no points", () => {
  const a = { temp: "either", texture: "creamy", flavor: "fruity", size: "light" };
  for (const d of DISHES) {
    const withEither = E.scoreDish(d, a);
    const best = Math.max(E.scoreDish(d, { ...a, temp: "warm" }), E.scoreDish(d, { ...a, temp: "cold" }));
    assert(withEither >= best, d.id);
  }
});
test("a room-temperature dish earns partial credit for warm or cold", () => {
  const d = DISHES.find((x) => x.id === "basbousa");
  const warm = E.scoreDish(d, { temp: "warm", texture: "fluffy", flavor: "arabic", size: "light" });
  const cold = E.scoreDish(d, { temp: "cold", texture: "fluffy", flavor: "arabic", size: "light" });
  eq(warm, cold);
  eq(warm, 4 + 3 + 1 + 1);
});

console.log("couple fairness");
const chocLover = { temp: "warm", texture: "melty", flavor: "chocolate", size: "medium" };
const fruitLover = { temp: "cold", texture: "creamy", flavor: "fruity", size: "light" };
test("ranked by the lower score first, then the total", () => {
  const r = E.rankDishes(DISHES, [chocLover, fruitLover]);
  for (let i = 1; i < r.length; i++) {
    const a = r[i - 1], b = r[i];
    assert(a.min > b.min || (a.min === b.min && a.sum >= b.sum), `order broke at ${a.dish.id} -> ${b.dish.id}`);
  }
});
test("chocolate lover + fruit lover get a dish that carries both flavors", () => {
  const r = E.rankDishes(DISHES, [chocLover, fruitLover]);
  const top = r[0].dish;
  assert(top.flavors.includes("chocolate") && top.flavors.includes("fruity"), "top was " + top.id);
});
test("nobody is left with a zero when a shared dish exists", () => {
  const r = E.rankDishes(DISHES, [chocLover, fruitLover]);
  assert(r[0].scores.every((s) => s >= E.WEIGHTS.flavor), JSON.stringify(r[0].scores));
});
test("identical answers in couple mode equal the solo pick", () => {
  eq(E.rankDishes(DISHES, [choc, choc])[0].dish.id, E.rankDishes(DISHES, [choc])[0].dish.id);
});

console.log("backup and 'show me another'");
test("backup differs in flavor from the pick when possible", () => {
  const r = E.rankDishes(DISHES, [choc]);
  const backup = E.pickBackup(r, r[0], new Set([r[0].dish.id]));
  assert(backup, "no backup");
  assert(!backup.dish.flavors.some((f) => r[0].dish.flavors.includes(f)), "backup shares a flavor: " + backup.dish.id);
});
test("backup never equals the pick or an already shown dish", () => {
  const r = E.rankDishes(DISHES, [fruitLover]);
  const shown = new Set([r[0].dish.id, r[1].dish.id]);
  const backup = E.pickBackup(r, r[1], shown);
  assert(backup && !shown.has(backup.dish.id));
});
test("walking through 'show me another' never repeats and ends after 30", () => {
  const r = E.rankDishes(DISHES, [chocLover, fruitLover]);
  const seen = new Set();
  let cursor = 0;
  seen.add(r[0].dish.id);
  for (;;) {
    const next = r.findIndex((x, i) => i > cursor && !seen.has(x.dish.id));
    if (next === -1) break;
    assert(!seen.has(r[next].dish.id));
    seen.add(r[next].dish.id);
    cursor = next;
  }
  eq(seen.size, 30);
});

console.log("share links");
test("answers survive the encode/decode round trip", () => {
  for (const tmp of ["warm", "cold", "either"]) for (const tx of TEXTURES) for (const f of FLAVORS) for (const s of SIZES) {
    const a = { temp: tmp, texture: tx, flavor: f, size: s };
    const code = E.encodeAnswers(a);
    eq(code.length, 4);
    const back = E.decodeAnswers(code);
    eq(JSON.stringify(back), JSON.stringify(a));
  }
});
test("garbage in the link is rejected", () => {
  eq(E.decodeAnswers("zzzz"), null);
  eq(E.decodeAnswers("wc"), null);
  eq(E.decodeAnswers(undefined), null);
  eq(E.decodeAnswers("wcf"), null);
});

console.log("reason line");
test("solo reason, Arabic and English", () => {
  const a = { temp: "cold", texture: "creamy", flavor: "chocolate", size: "light" };
  eq(E.reasonText("ar", [a]), "اخترت شيئًا باردًا وكريميًا بالشوكولاتة");
  eq(E.reasonText("en", [a]), "You wanted something cold and creamy with chocolate");
});
test("couple fully agreed", () => {
  const a = { temp: "cold", texture: "creamy", flavor: "chocolate", size: "light" };
  eq(E.reasonText("ar", [a, { ...a, size: "heavy" }]), "كلاكما أراد شيئًا باردًا وكريميًا بالشوكولاتة");
  eq(E.reasonText("en", [a, a]), "You both wanted something cold and creamy with chocolate");
});
test("'either' goes along with the partner's temperature", () => {
  const a = { temp: "either", texture: "creamy", flavor: "chocolate", size: "light" };
  const b = { temp: "cold", texture: "creamy", flavor: "chocolate", size: "light" };
  eq(E.reasonText("en", [a, b]), "You both wanted something cold and creamy with chocolate");
});
test("partial agreement names what they disagreed on", () => {
  const a = { temp: "cold", texture: "creamy", flavor: "chocolate", size: "light" };
  const b = { temp: "cold", texture: "crunchy", flavor: "chocolate", size: "light" };
  eq(E.reasonText("ar", [a, b]), "اتفقتما على شيء بارد بالشوكولاتة، واختلفتما في القوام، وهذا أفضل حلّ وسط لكما");
  eq(E.reasonText("en", [a, b]), "You agreed on something cold with chocolate but not on texture, so this is the best middle ground");
});
test("no agreement at all", () => {
  eq(E.reasonText("ar", [chocLover, fruitLover]), "ذوقاكما مختلفان الليلة، وهذا أفضل حلّ وسط يرضيكما معًا");
  eq(E.reasonText("en", [chocLover, fruitLover]), "Different cravings tonight, so this is the best middle ground for you both");
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
