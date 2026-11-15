'use strict';
// مولّد الوجبات: بيركّب وجبة من أدوار (بروتين + نشويات + خضار...) حسب تفضيلاتك، ويضبط الجرامات على سعراتك وماكروزك

const P_MAIN = ['صدور فراخ مشوية', 'فراخ مشوية بالجلد', 'لحمة بقري مشوية', 'لحمة مفرومة مطبوخة', 'كفتة مشوية', 'كبدة', 'سمك مشوي', 'جمبري مطبوخ', 'تونة معلبة (ماء)', 'صدور ديك رومي', 'فراخ بانيه', 'سجق'];
const P_SAV = ['فول مدمس', 'فول بالزيت', 'بيض مقلي', 'طعمية', 'بيض مسلوق', 'أومليت', 'جبنة قريش', 'جبنة بيضاء', 'جبنة رومي', 'لبنة', 'تونة معلبة (ماء)', 'عدس مطبوخ'];
const P_SWEET = ['زبادي يوناني', 'زبادي طبيعي', 'لبن كامل', 'لبن خالي الدسم', 'بروتين واي'];
const P_LIGHT = ['تونة معلبة (ماء)', 'جبنة قريش', 'بيض مسلوق', 'أومليت', 'صدور فراخ مشوية', 'صدور ديك رومي', 'جبنة بيضاء', 'فول مدمس', 'عدس مطبوخ'];
const C_MAIN = ['أرز أبيض مطبوخ', 'أرز بالشعرية', 'مكرونة مطبوخة', 'بطاطس مسلوقة', 'بطاطا مشوية', 'عيش بلدي', 'عيش شامي', 'ذرة مشوية'];
const C_LIGHT = ['عيش بلدي', 'عيش شامي', 'عيش توست', 'بطاطا مشوية', 'بطاطس مسلوقة'];
const C_BREAD = ['عيش بلدي', 'عيش فينو', 'عيش شامي', 'عيش توست'];
const C_CEREAL = ['شوفان خام', 'كورن فليكس'];
const VEG = ['مسقعة', 'سلطة خضراء', 'بروكلي', 'كوسة', 'باذنجان مشوي', 'خيار', 'طماطم', 'جزر', 'سلطة زبادي بالخيار', 'ملوخية', 'بامية بالصلصة'];
const FRUIT = ['موز', 'تفاح', 'برتقال', 'عنب', 'مانجو', 'بطيخ', 'فراولة', 'جوافة', 'رمان', 'تين', 'تمر'];
const SNACKP = ['زبادي يوناني', 'جبنة قريش', 'بروتين واي', 'لبن خالي الدسم', 'لبن كامل', 'زبادي طبيعي', 'لوز', 'فول سوداني', 'جوز', 'زبدة فول سوداني', 'بيض مسلوق'];
const DISHES = ['فتة بالأرز واللحمة', 'حواوشي', 'مكرونة بالصلصة', 'ساندوتش فلافل', 'كشري', 'مكرونة بالبشاميل', 'محشي ورق عنب', 'ساندوتش شاورما فراخ', 'ساندوتش برجر', 'بيتزا'];
const uniq = a => [...new Set(a)];

// بدائل كل دور (للتبديل)
const ROLE_POOLS = {
  protein: uniq([...P_MAIN, ...P_SAV, ...P_SWEET]),
  carb: uniq([...C_MAIN, ...C_BREAD, ...C_CEREAL]),
  veg: VEG,
  fruit: FRUIT,
  snack: SNACKP,
  dish: DISHES,
  fat: ['زيت زيتون', 'زبدة', 'طحينة', 'زبدة فول سوداني']
};
function roleOf(name) { for (const r of ['dish', 'protein', 'carb', 'veg', 'fruit', 'snack', 'fat']) if (ROLE_POOLS[r].includes(name)) return r; return null; }

// الأقسام اللي بتظهر في شاشة التفضيلات
const PREF_GROUPS = [
  ['🍗 بروتين', uniq([...P_MAIN, ...P_SAV])],
  ['🍚 نشويات', uniq([...C_MAIN, ...C_BREAD, ...C_CEREAL])],
  ['🥗 خضار', VEG],
  ['🍎 فاكهة', FRUIT],
  ['🥛 ألبان وسناكس', uniq([...P_SWEET, ...SNACKP]).filter(n => !P_MAIN.includes(n) && !P_SAV.includes(n))],
  ['🍽️ أكلات كاملة', DISHES]
];

// ---------- حسابات ----------
const SHARE = { normal: { 'فطار': .25, 'غدا': .35, 'عشا': .25, 'سناكس': .15 }, ramadan: { 'فطار': .4, 'عشا': .3, 'سحور': .2, 'سناكس': .1 } };
function mealShare(meal, ram) { return (ram ? SHARE.ramadan : SHARE.normal)[meal] || .2; }
function mealType(meal, ram) {
  const m = ram ? { 'فطار': 'main', 'عشا': 'light', 'سحور': 'bf', 'سناكس': 'snack' } : { 'فطار': 'bf', 'غدا': 'main', 'عشا': 'light', 'سناكس': 'snack' };
  return m[meal] || 'main';
}
function mealTarget(t, meal, ram) { const s = mealShare(meal, ram); return { kcal: t.kcal * s, p: t.p * s, c: t.c * s, f: t.f * s }; }
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const sumI = items => items.reduce((a, i) => ({ kcal: a.kcal + i.kcal, p: a.p + i.p, c: a.c + i.c, f: a.f + i.f }), { kcal: 0, p: 0, c: 0, f: 0 });
function capOf(f) { const m = Math.max(0, ...(f.serv || []).map(s => s.g)); return m ? Math.max(m * 2, 40) : 300; }

function wOf(n, pr) { if (pr.dislike.includes(n)) return 0; return pr.like.includes(n) ? 4 : 1; }
function pickW(pool, pr, avoid = []) {
  const c = pool.filter(n => !avoid.includes(n)).map(n => [n, wOf(n, pr)]).filter(x => x[1] > 0);
  if (!c.length) return null;
  let r = Math.random() * c.reduce((a, x) => a + x[1], 0);
  for (const [n, w] of c) { if ((r -= w) <= 0) return n; }
  return c[c.length - 1][0];
}

// تركيبة وجبة (من غير جرامات)
function candidate(type, pr) {
  const parts = [], add = (n, role) => { if (n) parts.push({ name: n, role }); };
  const P = pool => pickW(pool, pr);
  if (type === 'bf') {
    if (Math.random() < 0.65) {
      const p = P(P_SAV), c = P(C_BREAD); if (!p || !c) return null;
      add(p, 'protein'); add(c, 'carb'); add(P(['طماطم', 'خيار', 'سلطة خضراء', 'جزر']), 'veg');
    } else {
      const p = P(['زبادي يوناني', 'زبادي طبيعي', 'لبن كامل', 'بروتين واي']), c = P(C_CEREAL); if (!p || !c) return null;
      add(p, 'protein'); add(c, 'carb'); add(P(FRUIT), 'fruit');
    }
  } else if (type === 'snack') {
    const f = P(FRUIT), s = P(SNACKP); if (!f && !s) return null;
    add(f, 'fruit'); add(s, 'snack');
  } else {
    const dishes = DISHES.filter(d => pr.like.includes(d));
    if (dishes.length && Math.random() < 0.3) { add(pickW(dishes, pr), 'dish'); add(P(VEG), 'veg'); }
    else {
      const p = P(type === 'light' ? P_LIGHT : P_MAIN), c = P(type === 'light' ? C_LIGHT : C_MAIN); if (!p || !c) return null;
      add(p, 'protein'); add(c, 'carb'); add(P(VEG), 'veg');
      if (Math.random() < 0.4) add(P(['زيت زيتون']), 'fat');
    }
  }
  return parts.length >= 2 ? parts : null;
}

// ضبط الجرامات على هدف الوجبة (سعرات + بروتين + كارب + دهون) بتحسين فعلي، مش تقدير
const ROUND_UNIT = { 'بيض مسلوق': 50, 'أومليت': 60 };
const maxServ = f => Math.max(0, ...(f.serv || []).map(s => s.g));
const minPortion = f => Math.max(20, Math.round(maxServ(f) * 0.5 / 5) * 5); // أقل كمية منطقية (نص حصة)
const ROLE_BOUNDS = {
  protein: f => [Math.max(30, minPortion(f)), Math.min(450, capOf(f))],
  carb: f => [minPortion(f), Math.min(450, capOf(f))],
  dish: f => [Math.max(100, minPortion(f)), Math.min(450, Math.max(capOf(f), 300))],
  snack: f => [10, Math.min(450, Math.max(40, Math.round((maxServ(f) || 150) * 1.5)))],
  veg: f => [40, 150], fruit: f => [60, 250], fat: f => [3, 12]
};
function rawTotals(items) {
  const t = { kcal: 0, p: 0, c: 0, f: 0 };
  items.forEach(i => { const q = i.g / 100; t.kcal += i.f.kcal * q; t.p += i.f.p * q; t.c += i.f.c * q; t.f += i.f.f * q; });
  return t;
}
// الخسارة: النقص في البروتين والكارب بيتعاقب أكتر من الزيادة
function lossOf(items, mt) {
  const t = rawTotals(items), rel = (v, tg, floor) => (v - tg) / Math.max(tg, floor);
  const k = rel(t.kcal, mt.kcal, 50), p = rel(t.p, mt.p, 10), c = rel(t.c, mt.c, 20), f = rel(t.f, mt.f, 8);
  return 1.5 * k * k + (p < 0 ? 2.5 : 0.6) * p * p + (c < 0 ? 1.6 : 0.8) * c * c + 0.25 * f * f;
}
function optimizeGrams(items, mt) {
  items.forEach(i => { const [lo, hi] = (ROLE_BOUNDS[i.role] || ROLE_BOUNDS.carb)(i.f); i.lo = lo; i.hi = hi; i.g = clamp(i.g || lo, lo, hi); });
  for (const step of [40, 20, 10, 5]) {
    for (let pass = 0; pass < 40; pass++) {
      let improved = false;
      for (const i of items) {
        const u = ROUND_UNIT[i.f.name] || 5, s = Math.max(u, Math.round(step / u) * u), cur = lossOf(items, mt);
        for (const d of [s, -s]) {
          const ng = clamp(i.g + d, i.lo, i.hi); if (ng === i.g) continue;
          const old = i.g; i.g = ng;
          if (lossOf(items, mt) < cur - 1e-6) { improved = true; break; }
          i.g = old;
        }
      }
      if (!improved) break;
    }
  }
}
// الوجبة "مظبوطة" لو السعرات ±10% والبروتين ≥ 90% والكارب ≥ 85% من المطلوب
function mealOk(tot, mt) {
  return tot.kcal >= mt.kcal * 0.9 && tot.kcal <= Math.max(mt.kcal * 1.1, mt.kcal + 30) && (mt.p < 10 || tot.p >= mt.p * 0.9) && (mt.c < 15 || tot.c >= mt.c * 0.85);
}
function sizeParts(parts, T, byName, type, pr) {
  const items = parts.map(x => ({ f: byName[x.name], role: x.role, g: 0 }));
  items.forEach(i => {
    i.g = i.role === 'veg' ? (i.f.kcal > 60 ? 60 : 120) : i.role === 'fruit' ? ((i.f.serv[0] && i.f.serv[0].g) || 120) : i.role === 'fat' ? 5 : i.role === 'protein' ? 120 : 150;
  });
  optimizeGrams(items, T);
  // لو لسه ناقص بروتين أو كارب: ضيف مكوّن يسدّ النقص وأعد الضبط
  for (let k = 0; k < 3 && type && pr; k++) {
    const tot = rawTotals(items);
    if (mealOk(tot, T)) break;
    const asItems = items.map(i => { const q = i.g / 100; return { base: i.f.name, kcal: i.f.kcal * q, p: i.f.p * q, c: i.f.c * q, f: i.f.f * q }; });
    const sug = fillSuggestions(asItems, T, type, pr, byName)[0];
    if (!sug) break;
    items.push({ f: byName[sug.name], role: sug.kind === 'protein' ? 'protein' : sug.kind === 'carb' ? 'carb' : 'snack', g: sug.g });
    optimizeGrams(items, T);
  }
  return items.map(i => {
    const u = ROUND_UNIT[i.f.name] || 5, g = Math.max(u, Math.round(i.g / u) * u), q = g / 100;
    return { name: i.f.name + ' (' + g + 'ج)', base: i.f.name, g, role: i.role, kcal: i.f.kcal * q, p: i.f.p * q, c: i.f.c * q, f: i.f.f * q };
  });
}

// اقتراحات وجبة: بتولّد مرشحين، وتفضّل المظبوطين على احتياجاتك، وبتنوّع بينهم
function suggestMeals(meal, t, pr, byName, n = 3, ram = false) {
  const type = mealType(meal, ram), mt = mealTarget(t, meal, ram), seen = new Set(), cands = [];
  for (let k = 0; k < 90 && cands.length < 24; k++) {
    const parts = candidate(type, pr); if (!parts) continue;
    const key = parts.map(p => p.name).join('|'); if (seen.has(key)) continue; seen.add(key);
    const items = sizeParts(parts, mt, byName, type, pr), tot = sumI(items), ok = mealOk(tot, mt);
    const dist = Math.abs(tot.kcal - mt.kcal) / mt.kcal + Math.abs(tot.p - mt.p) / Math.max(mt.p, 15) * .7 + Math.abs(tot.c - mt.c) / Math.max(mt.c, 25) * .4 + Math.abs(tot.f - mt.f) / Math.max(mt.f, 8) * .3;
    cands.push({ items, tot, ok, score: dist + (ok ? 0 : 5) - parts.filter(p => pr.like.includes(p.name)).length * .08 });
  }
  cands.sort((a, b) => a.score - b.score);
  const out = [], used = new Set();
  for (const c of cands) { if (out.length >= n) break; if (!used.has(c.items[0].base)) { used.add(c.items[0].base); out.push(c); } }
  for (const c of cands) { if (out.length >= n) break; if (!out.includes(c)) out.push(c); }
  return out;
}

// ---------- اقتراحات تكميل وجبة ناقصة ----------
// بتقترح أكلات + جرامات تسدّ النقص في البروتين أو الكارب (أو السعرات لو الباقي تمام)، من غير ما تعدّي سعرات الوجبة، وبتحترم تفضيلاتك
function fillSuggestions(items, mt, type, pr, byName) {
  if (type === 'bf' && items.some(i => P_SWEET.includes(i.base) || C_CEREAL.includes(i.base))) type = 'bfsweet'; // فطار حلو: ما نضيفش فول عليه
  const s = sumI(items), gap = { kcal: mt.kcal - s.kcal, p: mt.p - s.p, c: mt.c - s.c }, have = new Set(items.map(i => i.base));
  [C_BREAD, C_CEREAL].forEach(fam => { if (items.some(i => fam.includes(i.base))) fam.forEach(n => have.add(n)); }); // ما نضيفش نوع تاني من نفس العيلة (عيش على عيش)
  const needP = mt.p >= 10 && gap.p > mt.p * 0.15, needC = mt.c >= 15 && gap.c > mt.c * 0.2, needK = gap.kcal > mt.kcal * 0.15;
  if (!items.length || (!needP && !needC && !needK)) return [];
  const room = Math.max(0, mt.kcal * 1.1 - s.kcal);
  const POOL = {
    protein: { bf: P_SAV, bfsweet: ['زبادي يوناني', 'زبادي طبيعي', 'بروتين واي'], main: uniq([...P_MAIN, ...P_LIGHT]), light: P_LIGHT, snack: SNACKP },
    carb: { bf: uniq([...C_BREAD, 'موز', 'تمر', 'عسل']), bfsweet: uniq([...C_CEREAL, 'موز', 'تمر', 'عسل']), main: C_MAIN, light: C_LIGHT, snack: uniq([...FRUIT, 'عسل']) },
    kcal: ['لوز', 'فول سوداني', 'جوز', 'زبدة فول سوداني', 'تمر', 'عسل', 'زيت زيتون', 'طحينة', 'موز', 'لبن كامل']
  };
  const build = (kind, n) => {
    const names = kind === 'kcal' ? POOL.kcal : (POOL[kind][type] || POOL[kind].main);
    const g0 = kind === 'protein' ? gap.p : kind === 'carb' ? gap.c : gap.kcal, res = [];
    names.forEach(nm => {
      const f = byName[nm]; if (!f || have.has(nm) || pr.dislike.includes(nm)) return;
      const dens = kind === 'protein' ? f.p / 100 : kind === 'carb' ? f.c / 100 : f.kcal / 100;
      if (kind === 'protein' && f.p * 4 / f.kcal < 0.25) return;   // لازم يكون غني بالبروتين فعلا
      if (kind === 'protein' && f.p < 8) return;                    // مش هنقترح 400 جم فول عشان 30 جم بروتين
      if (kind === 'carb' && f.c * 4 / f.kcal < 0.5) return;       // لازم يكون كارب فعلا
      const u = ROUND_UNIT[nm] || 5;
      let g = clamp(g0 / dens, kind === 'kcal' ? 5 : 20, Math.min(250, Math.max(60, Math.max(0, ...(f.serv || []).map(x => x.g)) * 1.5 || 200))); g = Math.max(u, Math.round(g / u) * u);
      const q = g / 100, add = { kcal: f.kcal * q, p: f.p * q, c: f.c * q, f: f.f * q };
      const got = kind === 'protein' ? add.p : kind === 'carb' ? add.c : add.kcal;
      const cover = Math.min(got, g0) / g0, over = Math.max(0, add.kcal - room) / mt.kcal;
      res.push({ name: nm, g, kind, add, score: cover - over * 1.5 + (pr.like.includes(nm) ? 0.15 : 0) });
    });
    return res.sort((a, b) => b.score - a.score).slice(0, n);
  };
  let out = [];
  if (needP) out = out.concat(build('protein', 2));
  if (needC) out = out.concat(build('carb', 2));
  if (!needP && !needC) out = build('kcal', 3);
  return out;
}
