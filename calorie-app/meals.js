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
function capOf(f) { const m = Math.max(0, ...(f.serv || []).map(s => s.g)); return m ? Math.max(m * 2, 60) : 300; }

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

// ضبط الجرامات على هدف الوجبة
const ROUND_UNIT = { 'بيض مسلوق': 50, 'أومليت': 60 };
function sizeParts(parts, T, byName) {
  const items = parts.map(x => ({ f: byName[x.name], role: x.role, g: 0 }));
  items.forEach(i => {
    if (i.role === 'veg') i.g = i.f.kcal > 60 ? 60 : 120;
    if (i.role === 'fruit') i.g = (i.f.serv[0] && i.f.serv[0].g) || 120;
    if (i.role === 'fat') i.g = 5;
  });
  const kc = a => a.reduce((s, i) => s + i.f.kcal * i.g / 100, 0), pr = a => a.reduce((s, i) => s + i.f.p * i.g / 100, 0);
  const prot = items.find(i => i.role === 'protein'), fill = items.filter(i => ['carb', 'dish', 'snack'].includes(i.role)), rest = items.filter(i => !fill.includes(i));
  fill.forEach(i => i.g = 100);
  for (let k = 0; k < 3; k++) {
    if (prot) { prot.g = 0; prot.g = clamp(Math.max(0, T.p - pr(items)) / (prot.f.p / 100 || 1), 30, capOf(prot.f)); }
    const room = Math.max(0, T.kcal - kc(rest));
    fill.forEach(i => { i.g = clamp(room / fill.length / (i.f.kcal / 100), 20, capOf(i.f)); });
  }
  return items.map(i => {
    const u = ROUND_UNIT[i.f.name] || 5, g = Math.max(u, Math.round(i.g / u) * u), q = g / 100;
    return { name: i.f.name + ' (' + g + 'ج)', base: i.f.name, g, role: i.role, kcal: i.f.kcal * q, p: i.f.p * q, c: i.f.c * q, f: i.f.f * q };
  });
}

// اقتراحات وجبة: بتولّد مرشحين وتختار الأقرب لهدفك والمختلفين عن بعض
function suggestMeals(meal, t, pr, byName, n = 3, ram = false) {
  const type = mealType(meal, ram), mt = mealTarget(t, meal, ram), seen = new Set(), cands = [];
  for (let k = 0; k < 60 && cands.length < 16; k++) {
    const parts = candidate(type, pr); if (!parts) continue;
    const key = parts.map(p => p.name).join('|'); if (seen.has(key)) continue; seen.add(key);
    const items = sizeParts(parts, mt, byName), tot = sumI(items);
    const dist = Math.abs(tot.kcal - mt.kcal) / mt.kcal + Math.abs(tot.p - mt.p) / Math.max(mt.p, 15) * .7 + Math.abs(tot.c - mt.c) / Math.max(mt.c, 25) * .4 + Math.abs(tot.f - mt.f) / Math.max(mt.f, 8) * .3;
    cands.push({ items, tot, score: dist - parts.filter(p => pr.like.includes(p.name)).length * .08 });
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
  const s = sumI(items), gap = { kcal: mt.kcal - s.kcal, p: mt.p - s.p, c: mt.c - s.c }, have = new Set(items.map(i => i.base));
  const needP = mt.p >= 10 && gap.p > mt.p * 0.15, needC = mt.c >= 15 && gap.c > mt.c * 0.2, needK = gap.kcal > mt.kcal * 0.15;
  if (!items.length || (!needP && !needC && !needK)) return [];
  const room = Math.max(0, mt.kcal * 1.1 - s.kcal);
  const POOL = {
    protein: { bf: uniq([...P_SAV, 'زبادي يوناني', 'بروتين واي']), main: uniq([...P_MAIN, ...P_LIGHT]), light: P_LIGHT, snack: SNACKP },
    carb: { bf: uniq([...C_BREAD, ...C_CEREAL, 'موز', 'تمر']), main: C_MAIN, light: C_LIGHT, snack: FRUIT },
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
