'use strict';
const KEY = 'saraati.v1';
const BASE_MEALS = ['فطار', 'غدا', 'عشا', 'سناكس'];
const RAMADAN_MEALS = ['فطار', 'عشا', 'سحور', 'سناكس'];
const MEAL_LABEL = (m, S) => (S.settings.ramadan && m === 'فطار' ? 'إفطار' : m === 'عشا' && S.settings.ramadan ? 'عشاء (بعد التراويح)' : m);
const DAYS = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
const ACT = [['قليل الحركة (مكتبي)', 1.2], ['نشاط خفيف (1-3 مرات أسبوعيا)', 1.375], ['نشاط متوسط (3-5 مرات)', 1.55], ['نشاط عالي (6-7 مرات)', 1.725]];
const RATES = [['نزول سريع (0.75 كجم/أسبوع)', -0.75], ['نزول (0.5 كجم/أسبوع)', -0.5], ['نزول بطيء (0.25 كجم/أسبوع)', -0.25], ['ثبات الوزن', 0], ['زيادة بطيئة (0.25 كجم/أسبوع)', 0.25], ['زيادة (0.5 كجم/أسبوع)', 0.5]];
const ICON = {
  today: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>',
  plan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>',
  progress: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18l5-6 4 3 7-9"/><path d="M15 6h5v5"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'
};
const NAV = [['today', 'اليوم', ICON.today], ['plan', 'خطتي', ICON.plan], ['progress', 'تقدمي', ICON.progress]];

let S = load();
let tab = 'today', date = today(), planDay = 0, ctx = {};
const byName = {}; FOODS.forEach(f => byName[f.name] = f);

function load() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  s = Object.assign({ profile: null, log: {}, plan: {}, weights: [], custom: [], meals: [], water: {}, waterMigrated: false, steps: {}, adaptive: null, prefs: { like: [], dislike: [] }, barcodes: {}, train: {}, fast: { start: null, goal: 16, hist: [] }, settings: { ramadan: false, waterGoal: 8, trainDays: [], stepGoal: 10000, cupMl: 250, waterGoalMl: null, stepsAsked: false, lang: 'ar', mealTimes: { on: true, t: {}, touched: false } } }, s || {});
  s.settings = Object.assign({ ramadan: false, waterGoal: 8, trainDays: [], stepGoal: 10000, cupMl: 250, waterGoalMl: null, stepsAsked: false, lang: 'ar', mealTimes: { on: true, t: {}, touched: false } }, s.settings);
  if (!s.waterMigrated) { const had = Object.keys(s.water).length > 0; for (const k in s.water) s.water[k] = s.water[k] * 250; s.waterMigrated = true; if (had && !s.settings.waterGoalMl) s.settings.waterGoalMl = (s.settings.waterGoal || 8) * 250; } // المياه بقت بالمللي
  if (!s.settings.stepGoalTouched && s.settings.stepGoal === 8000) s.settings.stepGoal = 10000; // الافتراضي القديم
  s.settings.mealTimes = Object.assign({ on: true, t: {}, touched: false }, s.settings.mealTimes);
  if (!s.settings.mealTimes.touched) s.settings.mealTimes.on = true; // افتراضي: شغّال لحد ما المستخدم يقفله
  if (s.profile && s.profile.rate === undefined) { s.profile.rate = Math.round((s.profile.adj || 0) * 7 / 7700 * 4) / 4; delete s.profile.adj; }
  return s;
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
function today(d = new Date()) { return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); }
const $ = s => document.querySelector(s);
const r = n => Math.round(n);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function sum(items) { return items.reduce((a, i) => ({ kcal: a.kcal + i.kcal, p: a.p + i.p, c: a.c + i.c, f: a.f + i.f }), { kcal: 0, p: 0, c: 0, f: 0 }); }
function allFoods() { return FOODS.concat(S.custom); }
function findFood(n) { return byName[n] || S.custom.find(f => f.name === n); }
function visibleMeals(items) {
  const base = S.settings.ramadan ? RAMADAN_MEALS : BASE_MEALS;
  const orphans = [...new Set(items.map(i => i.meal))].filter(m => !base.includes(m));
  // لو المواعيد شغالة: رتّب الوجبات حسب وقتها (اللي ملهاش وقت في الآخر)
  const ordered = mtOn() ? base.slice().sort((x, y) => { const a = mealRange(x), b = mealRange(y); return (a ? toMin(a.a) : 9999) - (b ? toMin(b.a) : 9999); }) : base;
  return ordered.concat(orphans);
}

// ---------- الهيكل ----------
function dayLabel(d) {
  if (d === today()) return 'النهاردة';
  if (d === today(new Date(Date.now() - 864e5))) return 'إمبارح';
  return new Date(d).toLocaleDateString(isEN() ? 'en-US' : 'ar-EG', { weekday: 'long', day: 'numeric', month: 'short' });
}
function renderHeader() {
  const h = $('#hdr');
  if (!S.profile) { h.innerHTML = `<b class="brand">سعراتي</b><button class="sec sm" onclick="setLang('${isEN() ? 'ar' : 'en'}')">${isEN() ? 'العربية' : 'English'}</button>`; return; }
  const away = tab === 'me' || tab === 'prefs';
  const gear = `<button class="ico" aria-label="${away ? 'رجوع' : 'المزيد'}" onclick="tab='${away ? 'today' : 'me'}';render();scrollTo(0,0)">${away ? ICON.close : ICON.gear}</button>`;
  if (tab === 'today') h.innerHTML = `<div class="dnav"><button class="ico" aria-label="اليوم اللي قبله" onclick="shift(-1)">${isEN() ? '‹' : '›'}</button><b>${dayLabel(date)}</b><button class="ico" aria-label="اليوم اللي بعده" onclick="shift(1)">${isEN() ? '›' : '‹'}</button></div>${gear}`;
  else h.innerHTML = `<b class="brand">${{ plan: 'خطتي', progress: 'تقدمي', me: 'المزيد', prefs: 'تفضيلاتي' }[tab]}</b>${gear}`;
}
function render() {
  renderHeader();
  $('#nav').style.display = S.profile ? '' : 'none';
  $('#nav').innerHTML = NAV.map(([k, l, ic]) => `<button class="${tab === k ? 'on' : ''}" onclick="tab='${k}';render();scrollTo(0,0)">${ic}${l}</button>`).join('');
  if (!S.profile) return renderSetup();
  ({ today: renderToday, plan: renderPlan, progress: renderProgress, me: renderSetup, prefs: renderPrefs })[tab]();
}

function ring(eaten, goal) {
  const R = 100, C = 2 * Math.PI * R, pct = Math.min(1, eaten / goal), over = eaten > goal;
  return `<svg viewBox="0 0 236 236" role="img" aria-label="${r(Math.abs(goal - eaten))} سعرة ${over ? 'زيادة' : 'متبقية'}"><circle cx="118" cy="118" r="${R}" fill="none" stroke="var(--bar)" stroke-width="14"/>
  <circle cx="118" cy="118" r="${R}" fill="none" stroke="${over ? 'var(--saf)' : 'var(--hib)'}" stroke-width="14" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}" transform="rotate(-90 118 118)"/>
  <text x="118" y="130" text-anchor="middle" style="font-size:62px;font-weight:900;fill:var(--ink)">${r(Math.abs(goal - eaten))}</text>
  <text x="118" y="158" text-anchor="middle" style="font-size:15px;font-weight:700">${over ? 'سعرة زيادة' : 'سعرة متبقية'}</text>
  <text x="118" y="182" text-anchor="middle" style="font-size:12px">الهدف ${goal}</text></svg>`;
}
function macroRow(t, s) {
  const m = (l, v, g, c) => `<div><span>${l}</span><b>${r(v)}<span> / ${g}</span></b><div class="bar"><i style="width:${Math.min(100, v / g * 100)}%;background:${c}"></i></div></div>`;
  return `<div class="macros">${m('بروتين', s.p, t.p, 'var(--hib)')}${m('كارب', s.c, t.c, 'var(--saf)')}${m('دهون', s.f, t.f, 'var(--ind)')}</div>`;
}
// ---------- تحذيرات هدف الوجبة ----------
function mealItemsOf(target, meal) { return (target === 'log' ? (S.log[date] || []) : (S.plan[planDay] || [])).filter(x => x.meal === meal); }
function mealTgt(target, meal) { return mealTarget(targets(S, target === 'plan' ? { idx: planDay } : date), meal, S.settings.ramadan); }
function mealWarns(items, mt) {
  const s = sum(items), w = [];
  if (s.kcal <= 0) return w;
  if (s.kcal > Math.max(mt.kcal * 1.1, mt.kcal + 30)) w.push(`زودت ${r(s.kcal - mt.kcal)} سعرة عن المطلوب (${r(mt.kcal)})`);
  if (mt.p >= 10 && s.p < mt.p * 0.85) w.push(`ناقص بروتين ${r(mt.p - s.p)} جم عن المطلوب (${r(mt.p)})`);
  if (mt.c >= 15 && s.c < mt.c * 0.8) w.push(`ناقص كارب ${r(mt.c - s.c)} جم عن المطلوب (${r(mt.c)})`);
  return w;
}
function quickItem(f, g) { const q = g / 100; return { name: f.name + ' (' + g + 'ج)', base: f.name, g, role: roleOf(f.name) || undefined, kcal: f.kcal * q, p: f.p * q, c: f.c * q, f: f.f * q }; }
function fillChips(list, onclickFn) {
  if (!list.length) return '';
  const lbl = x => x.kind === 'protein' ? `+${r(x.add.p)} جم بروتين` : x.kind === 'carb' ? `+${r(x.add.c)} جم كارب` : `+${r(x.add.kcal)} سعرة`;
  return `<div class="fill"><div class="mu">💡 عشان تكمّل الوجبة:</div><div class="chips">${list.map(x => `<span class="chip" onclick="${onclickFn(x)}">${x.g}ج ${esc(x.name)} (${lbl(x)})</span>`).join('')}</div></div>`;
}
function fillPick(target, meal, name, g) { ctx = { target, meal }; pickFood(name, g); }
function addFillOpt(oi, name, g) { ctx.opts[oi].items.push(quickItem(findFood(name), g)); search(); }
const warnList = w => w.map(x => `<div class="warn">⚠ ${x}</div>`).join('');
function mealCards(list, delFn, target) {
  return '<div class="panel">' + visibleMeals(list).map(m => {
    const its = list.map((x, i) => ({ ...x, i })).filter(x => x.meal === m), ms = sum(its), mt = mealTarget(targets(S, target === 'plan' ? { idx: planDay } : date), m, S.settings.ramadan), w = mealWarns(its, mt);
    return `<section class="meal"><div class="hd"><div><b>${MEAL_LABEL(m, S)}</b>${mealClock(m)}</div><span class="mu">${its.length ? r(ms.kcal) + ' / ' + r(mt.kcal) + ' سعرة' : 'المطلوب ' + r(mt.kcal) + ' سعرة'}</span></div>
    <div class="mu" style="margin:2px 0 4px">المطلوب: بروتين ${r(mt.p)} جم · كارب ${r(mt.c)} جم</div>${its.length ? (w.length ? warnList(w) : (mt.kcal - ms.kcal > mt.kcal * 0.15 ? `<span class="badge" style="background:var(--warnbg);color:var(--ink)">ناقص ${r(mt.kcal - ms.kcal)} سعرة</span>` : '<span class="badge">على الهدف</span>')) : ''}${fillChips(fillSuggestions(its, mt, mealType(m, S.settings.ramadan), S.prefs, byName), x => `fillPick('${target}','${m}','${esc(x.name)}',${x.g})`)}
    ${its.map(x => `<div class="mrow"><div onclick="swapOpen('${target}',${x.i})" style="flex:1;cursor:pointer">${esc(x.name)}<small>${r(x.kcal)} سعرة · بروتين ${r(x.p)} · كارب ${r(x.c)} · دهون ${r(x.f)} جم</small></div>${x.base ? `<button class="x" aria-label="بدّل أو عدّل" onclick="swapOpen('${target}',${x.i})">⇄</button>` : ''}<button class="x" aria-label="امسح" onclick="${delFn}(${x.i})">✕</button></div>`).join('')}
    <div class="between"><button class="addbtn" onclick="openAdd('${target}','${m}')"><i>+</i>${its.length ? 'أضف' : 'أضف أكل'}</button>${its.length ? `<button class="x" aria-label="احفظ كوجبة" onclick="saveMeal('${target}','${m}')">☆</button>` : ''}</div></section>`;
  }).join('') + '</div>';
}

// ---------- اليوم ----------
function renderToday() {
  const t = targets(S, date), log = S.log[date] || [], s = sum(log);
  const est = estimateTdee(S, today()), due = est.measured && (!S.adaptive || dayDiff(S.adaptive.date, today()) >= 7);
  $('#app').innerHTML = `
  <div class="hero">${ring(s.kcal, t.kcal)}</div>
  ${macroRow(t, s)}
  ${trainToggle(t)}
  ${nextMealLine()}
  <form class="qlog" onsubmit="quickLog(event)"><input id="ql" placeholder="اكتب اللي أكلته: رغيفين فول وبيضتين" autocomplete="off" aria-label="سجّل أكلك بالكتابة"><button aria-label="سجّل">+</button></form>
  ${habitsRow()}
  ${dayScoreCard(t, s)}
  ${due ? `<div class="banner" style="margin:0 0 14px"><b>المدرب جاهز يحدّث هدفك</b><div class="mu" style="margin:2px 0 8px">حلّل وزنك وأكلك وعنده تقدير جديد لحرقك.</div><button class="pri sm" onclick="tab='progress';render()">شوف التحديث</button></div>` : ''}
  ${mealCards(log, 'delLog', 'log')}`;
}
function trainToggle(t) {
  const tr = isTrain(S, date);
  return `<div class="tabs" style="margin:0 0 6px"><button class="sec sm ${tr ? 'on' : ''}" onclick="setTrain(true)">يوم تمرين</button><button class="sec sm ${!tr ? 'on' : ''}" onclick="setTrain(false)">يوم راحة</button></div>
  <div class="mu" style="margin-bottom:14px">${t.cycled ? (tr ? 'كارب أعلى النهاردة (' + t.c + ' جم) لطاقة التمرين والاستشفاء.' : 'كارب أقل النهاردة (' + t.c + ' جم). البروتين والدهون ثابتين.') : 'اختار يوم تمرين لو هتتمرن، والكارب هيزيد.'}</div>`;
}
function setTrain(v) { S.train[date] = v; save(); render(); }
function toggleTrainDay(i) {
  const a = S.settings.trainDays, k = a.indexOf(i); if (k >= 0) a.splice(k, 1); else a.push(i);
  save(); render();
}
// ---------- إنجاز اليوم: مياه + أكل + خطوات ----------
function dayScoreCard(t, s) {
  const w = S.water[date] || 0, wg = waterGoalMl(), st = S.steps[date] || 0, sg = S.settings.stepGoal;
  const water = Math.min(1, w / wg);
  const kc = Math.max(0, 1 - Math.abs(s.kcal - t.kcal) / t.kcal * 2), pr = Math.min(1, s.p / t.p);
  const food = s.kcal ? 0.6 * kc + 0.4 * pr : 0;
  const useSteps = !!window.NativeSteps && stepsInfo.state === 'ok';
  const parts = [['المياه', water, 'var(--w)'], ['الأكل', food, 'var(--hib)']].concat(useSteps ? [['الخطوات', Math.min(1, st / sg), 'var(--leaf)']] : []);
  const total = Math.round(parts.reduce((a, p) => a + p[1], 0) / parts.length * 100);
  const missing = [];
  if (wg - w > wg * 0.15) missing.push(`اشرب ${lit(wg - w)} لتر كمان`);
  if (s.kcal < t.kcal * 0.9) missing.push(`ناقص ${r(t.kcal - s.kcal)} سعرة`); else if (s.kcal > t.kcal * 1.1) missing.push(`زودت ${r(s.kcal - t.kcal)} سعرة عن الهدف`);
  if (s.p < t.p * 0.9) missing.push(`ناقص بروتين ${r(t.p - s.p)} جم`);
  if (useSteps && sg - st > sg * 0.15) missing.push(`امشي ${nf(sg - st)} خطوة كمان`);
  const verdict = total >= 85 ? 'يوم ممتاز: المياه والأكل والخطوات على الهدف تقريبا.' : (total >= 60 ? 'كويس، لسه فيه حاجات ناقصة:' : 'لسه قدامك شوية النهاردة:');
  return `<div class="card"><div class="between"><h3 style="margin:0">${date === today() ? 'إنجاز النهاردة' : 'إنجاز يوم ' + dayLabel(date)}</h3><span class="big">${total}%</span></div>
  ${parts.map(p => `<div class="between" style="margin-top:8px"><span class="mu">${p[0]}</span><b>${Math.round(p[1] * 100)}%</b></div><div class="bar" style="margin:2px 0 0"><i style="width:${Math.round(p[1] * 100)}%;background:${p[2]}"></i></div>`).join('')}
  <div style="margin-top:10px">${total >= 85 ? verdict : verdict + '<br>' + missing.map(m => '• ' + m).join('<br>')}</div></div>`;
}
function setLang(l) { S.settings.lang = l; save(); closeModal(); startTranslator(); render(); scrollTo(0, 0); }
function shift(n) { const d = new Date(date); d.setDate(d.getDate() + n); date = today(d); render(); syncSteps(date); }
function delLog(i) { S.log[date].splice(i, 1); save(); render(); }
const nf = n => Number(n).toLocaleString('en');
const lit = ml => String(Math.round(ml / 10) / 100); // 1250 -> 1.25
function suggestedWaterMl() { return Math.min(4500, Math.max(1500, Math.round(S.profile.kg * 33 / 50) * 50)); }
const cupMl = () => S.settings.cupMl || 250;
const waterGoalMl = () => S.settings.waterGoalMl || suggestedWaterMl();
let stepsInfo = { state: 'init', empty: false, err: '' }; // init | ok | needs | unavailable | web

// ---------- مربعات المياه والخطوات ----------
function habitsRow() {
  const w = S.water[date] || 0, wg = waterGoalMl(), st = S.steps[date] || 0, sg = S.settings.stepGoal;
  const native = !!window.NativeSteps, i = stepsInfo;
  const sub = !native ? 'بتتحسب تلقائي في تطبيق أندرويد' : i.state === 'ok' ? 'تلقائي من Health Connect' : i.state === 'unavailable' ? 'محتاج Health Connect' : i.state === 'needs' ? 'اضغط لتفعيل الخطوات' : 'اضغط للتفاصيل';
  const tile = (title, valTxt, goalTxt, pct, color, extra, click) => `<div class="tile" onclick="${click}" role="button" tabindex="0"><div class="mu">${title}</div><b>${valTxt}<span> / ${goalTxt}</span></b><div class="bar"><i style="width:${Math.min(100, pct)}%;background:${color}"></i></div>${extra}</div>`;
  return `<div class="habits">
  ${tile('المياه', lit(w), lit(wg) + ' لتر', w / wg * 100, 'var(--w)', `<div class="row"><button class="sec sm" aria-label="شيل كوب" onclick="event.stopPropagation();setWater(${Math.max(0, w - cupMl())})">−</button><button class="pri sm" onclick="event.stopPropagation();setWater(${w + cupMl()})">+ كوب</button></div>`, 'openWater()')}
  ${tile('خطوات المشي', nf(st), nf(sg) + ' خطوة', st / sg * 100, 'var(--leaf)', `<div class="mu">${sub}</div>`, 'openSteps()')}</div>`;
}
function setWater(ml) { S.water[date] = Math.max(0, ml); save(); render(); }

// ---------- إعدادات المياه ----------
function openWater() {
  const w = S.water[date] || 0, wg = waterGoalMl(), c = cupMl();
  modal(`<div class="between"><h3>المياه · ${dayLabel(date)}</h3><button class="x" aria-label="إغلاق" onclick="closeModal()">✕</button></div>
  <div class="big" style="margin:4px 0">${lit(w)} <span class="mu">/ ${lit(wg)} لتر</span></div>
  <div class="bar"><i style="width:${Math.min(100, w / wg * 100)}%;background:var(--w)"></i></div>
  <div class="row" style="margin-bottom:14px"><button class="sec" onclick="setWaterM(${Math.max(0, w - c)})">− ${c} مل</button><button class="pri" onclick="setWaterM(${w + c})">+ ${c} مل</button></div>
  <label>كمية المياه اللي عايز تشربها يوميا (لتر)</label>
  <input type="number" step="0.25" min="0.5" max="8" value="${lit(wg)}" onchange="setWaterGoal(this.value)">
  <div class="mu" style="margin:-4px 0 10px">المقترح لوزنك: ${lit(suggestedWaterMl())} لتر (حوالي 33 مل لكل كجم).</div>
  <label>حجم الكوب</label>
  <select onchange="setCup(this.value)">${[150, 200, 250, 330, 500].map(v => `<option value="${v}" ${v === c ? 'selected' : ''}>${v} مل</option>`).join('')}</select>
  <button class="pri full" onclick="closeModal()">تم</button>`);
}
function setWaterM(ml) { S.water[date] = Math.max(0, ml); save(); render(); openWater(); }
function setWaterGoal(l) { const v = Math.round((+l || 0) * 1000); if (v >= 500) S.settings.waterGoalMl = Math.min(8000, v); save(); render(); openWater(); }
function setCup(v) { S.settings.cupMl = +v; save(); render(); openWater(); }

// ---------- إعدادات الخطوات (بتتحسب تلقائي من Health Connect) ----------
function openSteps() {
  const st = S.steps[date] || 0, sg = S.settings.stepGoal, i = stepsInfo, native = !!window.NativeSteps;
  const state = !native ? 'بتتحسب تلقائي في تطبيق أندرويد بس.' : i.state === 'ok' ? (i.empty && !st ? 'متصل، لكن مفيش خطوات متسجلة النهاردة في Health Connect. لازم Google Fit أو Samsung Health يكون بيسجل خطواتك.' : 'متصل بـ Health Connect ✓') : i.state === 'unavailable' ? 'Health Connect مش متاح على موبايلك.' : i.state === 'needs' ? 'محتاج صلاحية قراءة الخطوات.' : 'بنتأكد من الاتصال…';
  modal(`<div class="between"><h3>خطوات ${dayLabel(date)}</h3><button class="x" aria-label="إغلاق" onclick="closeModal()">✕</button></div>
  <div class="big" style="margin:4px 0">${nf(st)} <span class="mu">/ ${nf(sg)}</span></div>
  <div class="bar"><i style="width:${Math.min(100, st / sg * 100)}%;background:var(--leaf)"></i></div>
  <div class="mu" style="margin-bottom:10px">${state}${i.err ? '<br><small dir="ltr">' + esc(i.err) + '</small>' : ''}</div>
  ${native && i.state !== 'ok' && i.state !== 'unavailable' ? '<button class="pri full" style="margin-bottom:8px" onclick="enableSteps()">اسمح بالوصول للخطوات</button>' : ''}
  ${native && i.state === 'unavailable' ? '<button class="pri full" style="margin-bottom:8px" onclick="NativeSteps.installHealthConnect()">نزّل Health Connect</button>' : ''}
  ${native ? '<button class="sec full" style="margin-bottom:12px" onclick="refreshSteps()">حدّث الآن</button>' : ''}
  <label>الهدف اليومي للخطوات</label>
  <input type="number" inputmode="numeric" value="${sg}" onchange="setStepGoal(this.value)">
  <div class="mu" style="margin-bottom:10px">الخطوات بتتحسب لوحدها من Health Connect. محتاج تطبيق بيسجّل خطواتك فيه (Google Fit أو Samsung Health).</div>
  <button class="pri full" onclick="closeModal()">تم</button>`);
}
async function enableSteps() { await syncSteps(date, true); openSteps(); }
async function refreshSteps() { await syncSteps(date, false); openSteps(); }
function setStepGoal(v) { S.settings.stepGoal = Math.max(1000, Math.round(+v || 10000)); S.settings.stepGoalTouched = true; save(); render(); openSteps(); }

// قراءة الخطوات من Health Connect (في تطبيق أندرويد بس)
async function syncSteps(d, ask) {
  if (!window.NativeSteps) { stepsInfo.state = 'web'; return; }
  d = d || date;
  const before = stepsInfo.state + '|' + S.steps[d];
  try {
    let st = await NativeSteps.status();
    if (st.state === 'unavailable') { stepsInfo = { state: 'unavailable', empty: false, err: st.reason || '' }; }
    else {
      if (st.state !== 'ok' && (ask || !S.settings.stepsAsked)) { S.settings.stepsAsked = true; save(); await NativeSteps.authorize(); st = await NativeSteps.status(); }
      const v = Math.round(await NativeSteps.stepsFor(d));
      stepsInfo = { state: st.state === 'denied' ? 'needs' : 'ok', empty: v === 0 && st.state !== 'ok', err: '' };
      if (stepsInfo.state === 'ok' && v >= 0) { S.steps[d] = v; save(); }
    }
  } catch (e) { stepsInfo = { state: 'needs', empty: false, err: String((e && e.message) || e) }; }
  if (before !== stepsInfo.state + '|' + S.steps[d] && tab === 'today') render();
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) syncSteps(); });

function stepsChart(goal) {
  const days = []; for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const k = today(d); days.push({ v: S.steps[k] || 0, n: d.getDate() }); }
  const mx = Math.max(goal * 1.2, ...days.map(d => d.v)), H = 110;
  return `<svg viewBox="0 0 320 ${H + 20}" width="100%" role="img" aria-label="الخطوات آخر 7 أيام">${days.map((d, i) => { const h = d.v / mx * H; return `<rect x="${12 + i * 44}" y="${H - h}" width="30" height="${h}" rx="5" fill="${d.v >= goal ? 'var(--leaf)' : 'var(--saf)'}" opacity="${d.v ? 1 : .2}"/><text x="${27 + i * 44}" y="${H + 14}" text-anchor="middle">${d.n}</text>${d.v ? `<text x="${27 + i * 44}" y="${H - h - 3}" text-anchor="middle">${nf(d.v)}</text>` : ''}`; }).join('')}
  <line x1="0" x2="320" y1="${H - goal / mx * H}" y2="${H - goal / mx * H}" stroke="#9ca3af" stroke-dasharray="4"/></svg>`;
}

// ---------- تسجيل سريع بالكتابة ----------
function quickLog(e) {
  e.preventDefault();
  const txt = $('#ql').value.trim(); if (!txt) return;
  ctx = { target: 'log', meal: defaultMeal(), ql: parseMealText(txt, allFoods()) };
  drawQuick();
}
function quickWarn() {
  const mt = mealTgt('log', ctx.meal), items = mealItemsOf('log', ctx.meal).concat(ctx.ql.items), tot = sum(items);
  return `<div class="mu" style="margin-bottom:6px">${MEAL_LABEL(ctx.meal, S)} بعد الإضافة: <b>${r(tot.kcal)}</b> / ${r(mt.kcal)} سعرة · بروتين ${r(tot.p)} / ${r(mt.p)}</div>` + warnList(mealWarns(items, mt));
}
function drawQuick() {
  const q = ctx.ql, ms = visibleMeals(S.log[date] || []), tot = sum(q.items);
  if (!ms.includes(ctx.meal)) ctx.meal = ms[0];
  modal(`<div class="between"><h3>تأكيد التسجيل</h3><button class="x" aria-label="إغلاق" onclick="closeModal()">✕</button></div>
  ${q.items.length ? `<div class="card">${q.items.map((x, i) => `<div class="item"><div>${esc(x.name)}<small>${r(x.kcal)} سعرة · بروتين ${r(x.p)} · كارب ${r(x.c)} · دهون ${r(x.f)} جم</small></div><button class="x" aria-label="شيل" onclick="ctx.ql.items.splice(${i},1);drawQuick()">✕</button></div>`).join('')}
  <div class="between" style="margin-top:8px"><b>${r(tot.kcal)} سعرة</b><span class="mu">بروتين ${r(tot.p)} · كارب ${r(tot.c)} · دهون ${r(tot.f)} جم</span></div></div>` : '<div class="mu" style="margin-bottom:8px">مفهمتش أي أكلة من اللي كتبته.</div>'}
  ${q.failed.length ? `<div class="mu" style="color:var(--hib);margin-bottom:10px">مفهمتش: ${q.failed.map(esc).join('، ')}. جرّب اسم تاني، أو ضيفها بزرار + تحت الوجبة.</div>` : ''}
  ${q.items.length ? quickWarn() : ''}
  <label>على أنهي وجبة؟</label><select onchange="ctx.meal=this.value;drawQuick()">${ms.map(m => `<option value="${m}" ${m === ctx.meal ? 'selected' : ''}>${MEAL_LABEL(m, S)}</option>`).join('')}</select>
  <button class="pri full" ${q.items.length ? '' : 'disabled'} onclick="put(ctx.ql.items.map(x=>({...x})))">أضف للوجبة</button>`);
}
// ---------- تعديل كمية ----------
function editItem(target, i) {
  const it = (target === 'log' ? S.log[date] : S.plan[planDay])[i];
  if (!it.base) return alert('دي أكلة يدوية. امسحها وضيفها تاني بالكمية الجديدة.');
  ctx = { target, idx: i };
  modal(`<div class="between"><h3>${esc(it.base)}</h3><button class="x" onclick="closeModal()">✕</button></div><label>الكمية بالجرام</label><input id="eg" type="number" value="${it.g}">
  <button class="pri" style="width:100%" onclick="saveEdit()">حفظ</button>`);
}
function saveEdit() {
  const it = (ctx.target === 'log' ? S.log[date] : S.plan[planDay])[ctx.idx], g = +$('#eg').value; if (!(g > 0)) return;
  const k = g / it.g; ['kcal', 'p', 'c', 'f'].forEach(x => it[x] *= k); it.g = g; it.name = it.base + ' (' + r(g) + 'ج)';
  save(); closeModal(); render();
}

// ---------- اقتراحات تكمّل يومك ----------
// ---------- مواعيد الوجبات (افتراضية ويمكن تعديلها) ----------
const MEAL_PRESETS = {
  usual: ['المعتاد (فطار 10 – 12)', { 'فطار': ['10:00', '12:00'], 'غدا': ['15:30', '17:30'], 'سناكس': ['18:30', '19:30'], 'عشا': ['21:00', '22:30'] }],
  early: ['صباحي (فطار 7:30 – 9)', { 'فطار': ['07:30', '09:00'], 'سناكس': ['11:00', '11:30'], 'غدا': ['13:30', '15:00'], 'عشا': ['19:30', '21:00'] }],
  ramadan: ['رمضان', { 'فطار': ['18:00', '18:45'], 'عشا': ['21:00', '22:30'], 'سحور': ['03:00', '04:00'], 'سناكس': ['23:00', '23:59'] }]
};
const mtOn = () => S.settings.mealTimes.on;
const mtKey = () => (S.settings.ramadan ? 'ramadan' : 'usual');
function mealRange(m) {
  if (!mtOn()) return null;
  const mt = S.settings.mealTimes;
  let v = mt.t[mtKey()] && mt.t[mtKey()][m];
  if (typeof v === 'string') v = [v, ''];
  v = v || MEAL_PRESETS[mtKey()][1][m];
  return v ? { a: v[0], b: v[1] || '' } : null;
}
function fmtTime(t) { const [h, m] = t.split(':').map(Number); return ((h % 12) || 12) + ':' + String(m).padStart(2, '0') + ' ' + (h < 12 ? 'ص' : 'م'); }
function fmtRange(r) { return r.b ? fmtTime(r.a) + ' – ' + fmtTime(r.b) : fmtTime(r.a); }
function mealClock(m) { const r = mealRange(m); return r ? ` <span class="mu">· ${fmtRange(r)}</span>` : ''; }
const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
function nowMin() { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
function endMin(r) { const s = toMin(r.a); if (!r.b) return s + 30; const e = toMin(r.b); return e < s ? e + 1440 : e; }
function inRange(r, n) { const s = toMin(r.a), e = endMin(r); return (n >= s && n <= e) || (n + 1440 >= s && n + 1440 <= e); }
function mealsWithTimes() {
  return (S.settings.ramadan ? RAMADAN_MEALS : BASE_MEALS).map(m => ({ m, r: mealRange(m) })).filter(x => x.r).sort((x, y) => toMin(x.r.a) - toMin(y.r.a));
}
function defaultMeal() {
  if (mtOn()) { // الوجبة اللي وقتها دلوقتي، أو أقرب وجبة
    const n = nowMin(), L = mealsWithTimes(), cur = L.find(x => inRange(x.r, n));
    if (cur) return cur.m;
    let best = null, bd = 1e9;
    L.forEach(x => { let d = Math.abs(toMin(x.r.a) - n); d = Math.min(d, 1440 - d); if (d < bd) { bd = d; best = x.m; } });
    if (best) return best;
  }
  const h = new Date().getHours();
  return S.settings.ramadan ? (h < 5 ? 'سحور' : h < 18 ? 'سناكس' : h < 21 ? 'فطار' : 'عشا') : (h < 11 ? 'فطار' : h < 16 ? 'غدا' : h < 21 ? 'عشا' : 'سناكس');
}
function nextMealLine() {
  if (!mtOn() || date !== today()) return '';
  const log = S.log[date] || [], L = mealsWithTimes(); if (!L.length) return '';
  const n = nowMin(), pending = L.filter(x => !log.some(i => i.meal === x.m));
  const line = t => `<div class="mu" style="margin:-4px 0 12px">${t}</div>`;
  if (!pending.length) return line('خلصت وجبات النهاردة.');
  const cur = pending.find(x => inRange(x.r, n));
  if (cur) return line(`دلوقتي وقت <b>${MEAL_LABEL(cur.m, S)}</b> (${fmtRange(cur.r)})`);
  const up = pending.find(x => toMin(x.r.a) > n);
  if (up) return line(`الوجبة الجاية: <b>${MEAL_LABEL(up.m, S)}</b> الساعة ${fmtTime(up.r.a)}`);
  return line(`لسه ما سجلتش: <b>${MEAL_LABEL(pending[0].m, S)}</b>`);
}
function setMealTimes(on) { S.settings.mealTimes.on = on; S.settings.mealTimes.touched = true; save(); render(); }
function setPreset(k) { S.settings.mealTimes.t[k === 'ramadan' ? 'ramadan' : 'usual'] = JSON.parse(JSON.stringify(MEAL_PRESETS[k][1])); save(); render(); }
function setMealTime(m, i, v) {
  const t = S.settings.mealTimes.t, k = mtKey(), cur = mealRange(m) || { a: '', b: '' };
  t[k] = t[k] || {}; const arr = [cur.a, cur.b]; arr[i] = v; t[k][m] = arr; save();
}

// ---------- اقتراحات تكمّل يومك ----------
function suggestions(t, s) {
  const rem = { kcal: t.kcal - s.kcal, p: Math.max(0, t.p - s.p), c: Math.max(0, t.c - s.c), f: Math.max(0, t.f - s.f) };
  if (rem.kcal < 120) return [];
  const cap = Math.min(rem.kcal, 600), out = [];
  allFoods().forEach(f => {
    if (f.kcal < 40) return;
    const opts = (f.serv || []).map(x => x.g).concat([100]).filter(g => f.kcal * g / 100 <= cap && f.kcal * g / 100 >= 60);
    if (!opts.length) return;
    const g = Math.max(...opts), q = g / 100, kc = f.kcal * q;
    const sc = Math.min(f.p * q, rem.p) / (rem.p || 1) * 2 + Math.min(f.c * q, rem.c) / (rem.c || 1) + Math.min(f.f * q, rem.f) / (rem.f || 1) - kc / rem.kcal * 0.3;
    out.push({ f, g, kc, p: f.p * q, sc });
  });
  return out.sort((a, b) => b.sc - a.sc).slice(0, 5);
}
function suggestCard(t, s) {
  const l = suggestions(t, s); if (!l.length) return '';
  return `<div class="card"><h3>🎯 كمّل يومك (متبقي ${r(t.kcal - s.kcal)} سعرة)</h3>${l.map(x => `<div class="res" onclick="ctx={target:'log',meal:defaultMeal()};pickFood('${esc(x.f.name)}',${r(x.g)})">${esc(x.f.name)} <span class="mu">— ${r(x.g)}ج · ${r(x.kc)} سعرة · بروتين ${r(x.p)}</span></div>`).join('')}</div>`;
}

// ---------- الصيام المتقطع ----------
function fastTxt(h) { return Math.floor(h) + ' س ' + Math.floor(h % 1 * 60) + ' د'; }
function fastCard() {
  const f = S.fast;
  if (!f.start) {
    const l = f.hist[f.hist.length - 1];
    return `<div class="card"><div class="between"><b>⏱️ الصيام المتقطع</b><select style="width:auto;margin:0" onchange="S.fast.goal=+this.value;save()">${[12, 14, 16, 18, 20].map(h => `<option value="${h}" ${h === f.goal ? 'selected' : ''}>${h} ساعة</option>`).join('')}</select></div>
    <button class="pri" style="width:100%;margin-top:8px" onclick="S.fast.start=Date.now();save();render()">ابدأ صيام</button>${l ? `<div class="mu" style="margin-top:6px">آخر صيام: ${fastTxt((l.e - l.s) / 36e5)}</div>` : ''}</div>`;
  }
  const el = (Date.now() - f.start) / 36e5;
  return `<div class="card"><div class="between"><b>⏱️ صايم من <span id="fst">${fastTxt(el)}</span></b><span class="mu">الهدف ${f.goal} ساعة</span></div>
  <div class="bar" style="margin-top:8px"><i id="fbar" style="width:${Math.min(100, el / f.goal * 100)}%;background:var(--w)"></i></div>
  <button class="sec" style="width:100%" onclick="endFast()">أنهي الصيام</button></div>`;
}
function endFast() { S.fast.hist.push({ s: S.fast.start, e: Date.now() }); S.fast.hist = S.fast.hist.slice(-30); S.fast.start = null; save(); render(); }
setInterval(() => { const a = document.getElementById('fst'); if (a && S.fast.start) { const el = (Date.now() - S.fast.start) / 36e5; a.textContent = fastTxt(el); document.getElementById('fbar').style.width = Math.min(100, el / S.fast.goal * 100) + '%'; } }, 30000);

// ---------- الجدول ----------
function renderPlan() {
  const t = targets(S, { idx: planDay }), day = S.plan[planDay] || [], s = sum(day);
  $('#app').innerHTML = `
  <div class="days">${DAYS.map((d, i) => `<button class="sec ${i === planDay ? 'on' : ''}" onclick="planDay=${i};render()">${d}${(S.settings.trainDays || []).includes(i) ? ' •' : ''}</button>`).join('')}</div>
  <div class="card"><div class="between"><div><span class="big">${r(s.kcal)}</span> <span class="mu">من ${t.kcal} سعرة</span></div><span class="mu">بروتين ${r(s.p)} · كارب ${r(s.c)} · دهون ${r(s.f)} جم</span></div>
    <div class="mu">${t.cycled ? (t.train ? 'يوم تمرين: كارب أعلى (' + t.c + ' جم)' : 'يوم راحة: كارب أقل (' + t.c + ' جم)') : 'حدّد أيام تمرينك من المزيد عشان الكارب يتظبط'}</div>
    <div class="bar"><i style="width:${Math.min(100, s.kcal / t.kcal * 100)}%;background:var(--hib)"></i></div>
    <button class="pri full" onclick="genPlanDay()">اقترح لي اليوم ده</button>
    <div class="row" style="margin-top:8px"><button class="sec sm" onclick="genPlanWeek()">الأسبوع كله</button><button class="sec sm" onclick="applyPlan()">سجّله في ${date === today() ? 'النهاردة' : 'اليوم المعروض'}</button><button class="sec sm" onclick="shopping()">المشتريات</button></div></div>
  ${mealCards(day, 'delPlan', 'plan')}
  <button class="sec sm" onclick="copyDay()">انسخ اليوم ده ليوم تاني</button>`;
}
function genDayItems(idx) {
  const t = targets(S, { idx }), ram = S.settings.ramadan, out = [];
  (ram ? RAMADAN_MEALS : BASE_MEALS).forEach(m => {
    const o = suggestMeals(m, t, S.prefs, byName, 1, ram)[0];
    if (o) o.items.forEach(i => out.push({ ...i, meal: m }));
  });
  return out;
}
function genPlanDay() {
  if ((S.plan[planDay] || []).length && !confirm('هيتم استبدال اليوم الحالي. تكمل؟')) return;
  S.plan[planDay] = genDayItems(planDay); save(); render();
}
function genPlanWeek() {
  if (Object.keys(S.plan).some(k => (S.plan[k] || []).length) && !confirm('هيتم استبدال الأسبوع كله. تكمل؟')) return;
  for (let i = 0; i < 7; i++) S.plan[i] = genDayItems(i);
  save(); render();
}
function delPlan(i) { S.plan[planDay].splice(i, 1); save(); render(); }
function applyPlan() {
  const d = S.plan[planDay] || []; if (!d.length) return alert('اليوم ده فاضي');
  S.log[date] = (S.log[date] || []).concat(d.map(x => ({ ...x }))); save(); tab = 'today'; render();
}
function copyDay() {
  const n = prompt('انسخ ليوم رقم؟\n' + DAYS.map((d, i) => (i + 1) + '=' + d).join('  '));
  const i = parseInt(n) - 1; if (!(i >= 0 && i < 7)) return;
  S.plan[i] = (S.plan[planDay] || []).map(x => ({ ...x })); save(); planDay = i; render();
}
function shopping() {
  const m = {}, manual = [];
  Object.values(S.plan).flat().forEach(x => { if (x.base) m[x.base] = (m[x.base] || 0) + x.g; else manual.push(x.name); });
  const rows = Object.entries(m).sort((a, b) => b[1] - a[1]);
  modal(`<div class="between"><h3>🛒 مشتريات الأسبوع</h3><button class="x" onclick="closeModal()">✕</button></div>
  ${rows.map(([n, g]) => `<div class="item"><span>${esc(n)}</span><b>${g >= 1000 ? (g / 1000).toFixed(2) + ' كجم' : r(g) + ' جم'}</b></div>`).join('') || '<div class="mu">الجدول فاضي</div>'}
  ${manual.length ? `<div class="mu" style="margin-top:8px">إدخال يدوي: ${manual.map(esc).join('، ')}</div>` : ''}
  <div class="mu" style="margin-top:8px">الكميات للأكل النيّ/المطبوخ حسب الجرامات المسجلة.</div>`);
}

// ---------- التقدم والمدرب ----------
function goalStatus(est) {
  if (est.span < 6 || est.weighIns < 3) return null;
  const rate = S.profile.rate, sl = est.slope, a = Math.abs(sl).toFixed(2), gain = rate > 0;
  let cls = 'ok', title, msg;
  if (rate === 0) {
    if (Math.abs(sl) < 0.2) { title = 'ماشي صح'; msg = 'وزنك ثابت تقريبا زي هدفك.'; }
    else { cls = 'slow'; title = sl > 0 ? 'وزنك بيزيد' : 'وزنك بينزل'; msg = `التغير ${a} كجم في الأسبوع. لو مش ده المطلوب، عدّل أكلك شوية.`; }
  } else {
    const ratio = sl / rate;
    if (ratio < 0.4) {
      cls = 'slow'; title = 'أبطأ من هدفك';
      msg = gain ? `زيادتك ${a} كجم/أسبوع. زوّد سناكس عالية السعرات (مكسرات، زبدة فول سوداني، شيك لبن وموز) وسجّل كل وجباتك.`
        : `نزولك ${a} كجم/أسبوع. تأكد إنك بتسجل كل حاجة، خصوصا الزيوت والسناكس، والمدرب هيظبط هدفك.`;
    } else if (ratio > 1.6) {
      cls = 'fast'; title = 'أسرع من اللازم';
      msg = gain ? `بتزيد ${a} كجم/أسبوع، وجزء كبير منها غالبا دهون. قلّل السعرات شوية.`
        : `بتنزل ${a} كجم/أسبوع، وده ممكن يخسّرك عضل. زوّد سعراتك شوية وخلي بروتينك عالي.`;
    } else { title = 'ماشي صح'; msg = `${gain ? 'بتزيد' : 'بتنزل'} ${a} كجم/أسبوع، قريب من هدفك. كمّل كده.`; }
  }
  return { cls, title, msg };
}
function renderProgress() {
  const ser = trendSeries(S.weights), last = ser[ser.length - 1], est = estimateTdee(S, today()), t = targets(S);
  const due = est.measured && (!S.adaptive || dayDiff(S.adaptive.date, today()) >= 7);
  const st = goalStatus(est);
  $('#app').innerHTML = `
  ${st ? `<div class="status ${st.cls}"><h2>${st.title}</h2><div>${st.msg}</div></div>`
      : `<div class="card"><h3>بنتابع تقدمك</h3><div class="mu">سجّل وزنك 3 مرات على الأقل خلال أسبوع، وسجّل أكلك، وهقولك لو ماشي صح. ${est.weighIns < 3 ? '' : esc(est.reason)}</div></div>`}
  <div class="card"><div class="between"><span class="mu">هدفك اليومي</span><span class="big">${t.kcal}</span></div>
    <div class="mu">حرقك التقديري ${t.tdee} سعرة ${t.adaptive ? '(من بياناتك)' : '(من معادلة، وهيتظبط من بياناتك)'}</div>
    ${est.measured ? `<button class="pri full" style="margin-top:10px" ${due ? '' : 'disabled'} onclick="checkin()">${due ? 'حدّث هدفي من بياناتي' : 'التحديث الجاي بعد ' + (7 - dayDiff(S.adaptive.date, today())) + ' أيام'}</button>` : ''}</div>
  <div class="card"><h3>وزنك</h3><div class="row"><input id="wd" type="date" value="${today()}" aria-label="التاريخ"><input id="wk" type="number" step="0.1" placeholder="كجم" value="${last ? last.kg : ''}" aria-label="الوزن"></div>
    <button class="pri full" onclick="addWeight()">سجّل الوزن</button>
    <div style="margin-top:12px">${ser.length ? chart(ser) : '<div class="mu">سجّل أول وزن عشان يظهر الرسم.</div>'}</div>
    <div class="mu">${last ? 'آخر وزن: ' + last.kg + ' كجم · الترند: ' + last.trend.toFixed(1) + ' كجم' : ''}</div></div>
  <div class="card"><h3>آخر 7 أيام</h3>${weekChart(t.kcal)}</div>
  <div class="card"><h3>الخطوات آخر 7 أيام</h3>${stepsChart(S.settings.stepGoal)}</div>
  <div class="card"><h3>تقرير الأسبوع</h3>${weekReport(t)}</div>
  <div class="card"><h3>سجل الوزن</h3>${ser.slice().reverse().slice(0, 20).map(x => `<div class="item"><span>${x.d}</span><span>${x.kg} كجم <button class="x" aria-label="امسح" onclick="delWeight('${x.d}')">✕</button></span></div>`).join('') || '<div class="mu">لا يوجد</div>'}</div>`;
}
function checkin() {
  const est = estimateTdee(S, today()); if (!est.measured) return;
  const { old, next } = applyCheckin(S, est, today()); save();
  alert('تم التحديث: الحرق من ' + old + ' إلى ' + next + ' سعرة. هدفك الجديد ' + targets(S).kcal + ' سعرة.'); render();
}
function chart(ser) {
  const W = 320, H = 150, pad = 28, ks = ser.map(x => x.kg).concat(ser.map(x => x.trend)), mn = Math.min(...ks) - 1, mx = Math.max(...ks) + 1;
  const X = i => ser.length === 1 ? W / 2 : pad + i * (W - pad * 2) / (ser.length - 1), Y = v => H - 20 - (v - mn) / (mx - mn) * (H - 40);
  const pts = a => a.map((v, i) => X(i) + ',' + Y(v)).join(' ');
  return `<svg viewBox="0 0 ${W} ${H}" width="100%"><polyline fill="none" stroke="#9ca3af" stroke-width="1.5" points="${pts(ser.map(x => x.kg))}"/>
  <polyline fill="none" stroke="#16a34a" stroke-width="3" points="${pts(ser.map(x => x.trend))}"/>
  ${ser.map((x, i) => `<circle cx="${X(i)}" cy="${Y(x.kg)}" r="3" fill="#9ca3af"/>`).join('')}
  <text x="4" y="${Y(mx - 1)}">${(mx - 1).toFixed(0)}</text><text x="4" y="${Y(mn + 1)}">${(mn + 1).toFixed(0)}</text></svg>
  <div class="mu">الأخضر = الترند (بيتجاهل تذبذب الماء اليومي)</div>`;
}
function weekChart(goal) {
  const days = []; for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const k = today(d); days.push({ k, v: (S.log[k] || []).reduce((a, x) => a + x.kcal, 0), n: d.getDate() }); }
  const mx = Math.max(goal * 1.2, ...days.map(d => d.v)), H = 110;
  return `<svg viewBox="0 0 320 ${H + 20}" width="100%">${days.map((d, i) => { const h = d.v / mx * H; return `<rect x="${12 + i * 44}" y="${H - h}" width="30" height="${h}" rx="5" fill="${d.v > goal * 1.05 ? 'var(--p)' : 'var(--g)'}" opacity="${d.v ? 1 : .2}"/><text x="${27 + i * 44}" y="${H + 14}" text-anchor="middle">${d.n}</text>${d.v ? `<text x="${27 + i * 44}" y="${H - h - 3}" text-anchor="middle">${r(d.v)}</text>` : ''}`; }).join('')}
  <line x1="0" x2="320" y1="${H - goal / mx * H}" y2="${H - goal / mx * H}" stroke="#9ca3af" stroke-dasharray="4"/></svg>`;
}
function weekReport(t) {
  const days = [];
  for (let i = 0; i < 7; i++) { const k = today(new Date(Date.now() - i * 864e5)), s = sum(S.log[k] || []); days.push({ k, kc: s.kcal, p: s.p, w: S.water[k] || 0, st: S.steps[k] || 0 }); }
  const lg = days.filter(d => d.kc >= 800);
  if (!lg.length) return '<div class="mu">سجّل أكلك كام يوم عشان يظهر التقرير.</div>';
  const avg = a => a.reduce((x, y) => x + y, 0) / a.length, ak = avg(lg.map(d => d.kc)), ap = avg(lg.map(d => d.p));
  const on = lg.filter(d => Math.abs(d.kc - t.kcal) <= t.kcal * 0.1).length;
  const wk = S.weights.filter(x => x.d >= days[6].k).sort((a, b) => a.d.localeCompare(b.d));
  const wd = wk.length > 1 ? wk[wk.length - 1].kg - wk[0].kg : null;
  let tip = 'استمر! الالتزام هو سر النتيجة.';
  if (ak > t.kcal * 1.1) tip = `متوسطك أعلى من هدفك بـ ${r(ak - t.kcal)} سعرة. جرّب تقلل سناكس أو الزيوت.`;
  else if (ak < t.kcal * 0.85) tip = 'بتاكل أقل بكتير من هدفك. الأكل القليل جدا بيبطّأ الحرق ويصعّب الالتزام.';
  else if (ap < t.p * 0.85) tip = 'بروتينك أقل من هدفك. زوّد صدور فراخ أو تونة أو زبادي يوناني أو بيض.';
  else if (on >= 5) tip = 'ممتاز! التزامك عالي الأسبوع ده 👏';
  const row = (l, v) => `<div class="between item"><span class="mu">${l}</span><b>${v}</b></div>`;
  return row('أيام مسجّلة', lg.length + ' / 7') + row('متوسط السعرات', r(ak) + ' (الهدف ' + t.kcal + ')') + row('متوسط البروتين', r(ap) + ' جم (الهدف ' + t.p + ')')
    + row('أيام على الهدف (±10%)', on) + row('متوسط المياه', (avg(days.map(d => d.w)) / 1000).toFixed(1) + ' لتر') + (days.some(d => d.st) ? row('متوسط الخطوات', nf(Math.round(avg(days.filter(d => d.st).map(d => d.st))))) : '') + (wd !== null ? row('تغير الوزن', (wd > 0 ? '+' : '') + wd.toFixed(1) + ' كجم') : '')
    + `<div class="banner" style="margin:10px 0 0">💡 ${tip}</div>`;
}
function addWeight() {
  const kg = parseFloat($('#wk').value), d = $('#wd').value; if (!kg || !d) return;
  S.weights = S.weights.filter(x => x.d !== d); S.weights.push({ d, kg });
  const newest = S.weights.reduce((m, x) => x.d > m ? x.d : m, '');
  if (d === newest) S.profile.kg = kg;
  save(); render();
}
function delWeight(d) { S.weights = S.weights.filter(x => x.d !== d); save(); render(); }

// ---------- الملف ----------
function renderSetup() {
  const p = S.profile || { sex: 'm', age: 25, cm: 170, kg: 75, act: 1.375, rate: -0.5 };
  const t = S.profile ? targets(S) : null;
  $('#app').innerHTML = `<div class="card"><h3>${S.profile ? 'بياناتي وهدفي' : 'أهلا! خلينا نحسب سعراتك 🥗'}</h3>
  <label>النوع</label><select id="sex"><option value="m" ${p.sex === 'm' ? 'selected' : ''}>ذكر</option><option value="f" ${p.sex === 'f' ? 'selected' : ''}>أنثى</option></select>
  <div class="row"><div><label>السن</label><input id="age" type="number" value="${p.age}"></div><div><label>الطول (سم)</label><input id="cm" type="number" value="${p.cm}"></div><div><label>الوزن (كجم)</label><input id="kg" type="number" step="0.1" value="${p.kg}"></div></div>
  <label>مستوى النشاط</label><select id="act">${ACT.map(a => `<option value="${a[1]}" ${a[1] === p.act ? 'selected' : ''}>${a[0]}</option>`).join('')}</select>
  <label>الهدف</label><select id="rate">${RATES.map(g => `<option value="${g[1]}" ${g[1] === p.rate ? 'selected' : ''}>${g[0]}</option>`).join('')}</select>
  <button class="pri" style="width:100%" onclick="saveProfile()">حفظ وحساب</button></div>
  ${t ? `<div class="card"><h3>أهدافك اليومية</h3><div class="big" style="color:var(--g)">${t.kcal} <span class="mu">سعرة</span></div>
  <div class="mu">BMR ${t.bmr} · الحرق ${t.tdee}</div><div class="mu" style="margin-top:6px">بروتين ${t.p}ج · كارب ${t.c}ج · دهون ${t.f}ج</div></div>
  <div class="card"><h3>إعدادات</h3>
  <div class="between" style="margin-bottom:10px"><span>🌙 وضع رمضان (إفطار / عشاء / سحور)</span><input type="checkbox" style="width:auto;margin:0" ${S.settings.ramadan ? 'checked' : ''} onchange="S.settings.ramadan=this.checked;save();render()"></div>
  <div class="mu">هدف المياه والخطوات بتعدّله من شاشة اليوم: اضغط على مربع المياه أو الخطوات.</div></div>
  <div class="card"><h3>اللغة / Language</h3><div class="chips"><span class="chip ${!isEN() ? 'l' : ''}" onclick="setLang('ar')">العربية</span><span class="chip ${isEN() ? 'l' : ''}" onclick="setLang('en')">English</span></div></div>
  <div class="card"><div class="between"><h3 style="margin:0">مواعيد الوجبات</h3><input type="checkbox" style="width:auto;margin:0" aria-label="فعّل المواعيد" ${mtOn() ? 'checked' : ''} onchange="setMealTimes(this.checked)"></div>
  <div class="mu" style="margin:6px 0 ${mtOn() ? 10 : 0}px">مواعيد مقترحة وتقدر تغيرها. الميعاد بيظهر جنب كل وجبة وبيقولك الوجبة الجاية.</div>
  ${mtOn() ? `<div class="chips" style="margin-bottom:10px">${Object.entries(MEAL_PRESETS).map(([k, v]) => `<span class="chip" onclick="setPreset('${k}')">${v[0]}</span>`).join('')}</div>
  ${(S.settings.ramadan ? RAMADAN_MEALS : BASE_MEALS).map(m => { const r = mealRange(m) || { a: '', b: '' }; return `<div class="between" style="margin-bottom:8px"><span style="min-width:70px">${MEAL_LABEL(m, S)}</span><div class="row" style="flex:1"><input type="time" aria-label="من" value="${r.a}" style="margin:0" onchange="setMealTime('${m}',0,this.value);render()"><input type="time" aria-label="إلى" value="${r.b}" style="margin:0" onchange="setMealTime('${m}',1,this.value);render()"></div></div>`; }).join('')}` : ''}</div>
  <div class="card"><h3>أيام التمرين</h3><div class="mu" style="margin-bottom:8px">في يوم التمرين الكارب بيزيد، وفي الراحة بيقل، ومتوسط الأسبوع ثابت.</div>
  <div class="chips">${DAYS.map((d, i) => `<span class="chip ${S.settings.trainDays.includes(i) ? 'l' : ''}" onclick="toggleTrainDay(${i})">${d}</span>`).join('')}</div></div>
  ${fastCard()}
  <div class="card"><h3>🍽️ تفضيلاتي الغذائية</h3><div class="mu" style="margin-bottom:8px">❤️ ${S.prefs.like.length} بحبها · 🚫 ${S.prefs.dislike.length} مش بحبها. الاقتراحات والجدول بيتبنوا عليها.</div>
  <button class="sec" onclick="prefsBack='me';tab='prefs';render()">تعديل التفضيلات</button></div>
  <div class="card"><h3>وجباتي المحفوظة</h3>${S.meals.map((m, i) => `<div class="item"><div>${esc(m.name)}<small>${r(sum(m.items).kcal)} سعرة</small></div><button class="x" onclick="S.meals.splice(${i},1);save();render()">✕</button></div>`).join('') || '<div class="mu">اضغط ⭐ على أي وجبة عشان تحفظها.</div>'}</div>
  <div class="card"><h3>أطعمتي</h3><div class="row"><button class="sec" onclick="openCustom()">+ أكلة جديدة</button><button class="sec" onclick="openRecipe()">🍲 وصفة من مكوّنات</button></div>
  ${S.custom.map((f, i) => `<div class="item"><div>${esc(f.name)}<small>${f.kcal} سعرة</small></div><button class="x" onclick="S.custom.splice(${i},1);save();render()">✕</button></div>`).join('')}</div>
  <div class="card"><h3>البيانات</h3><div class="mu" style="margin-bottom:8px">كل بياناتك محفوظة على جهازك فقط. القيم الغذائية تقريبية وليست نصيحة طبية.</div>
  <div class="row"><button class="sec" onclick="exportData()">تصدير نسخة احتياطية</button><button class="sec" onclick="$('#imp').click()">استيراد</button></div>
  <input type="file" id="imp" accept=".json" style="display:none" onchange="importData(this.files[0])"></div>` : ''}`;
}
function saveProfile() {
  const p = { sex: $('#sex').value, age: +$('#age').value, cm: +$('#cm').value, kg: +$('#kg').value, act: +$('#act').value, rate: +$('#rate').value };
  if (!(p.age > 0 && p.cm > 0 && p.kg > 0)) return alert('اكتب السن والطول والوزن صح');
  const first = !S.profile, o = S.profile;
  if (first) S.settings.waterGoalMl = Math.min(4500, Math.max(1500, Math.round(p.kg * 33 / 50) * 50));
  if (o && (o.sex !== p.sex || o.age !== p.age || o.cm !== p.cm || o.act !== p.act)) S.adaptive = null; // المعادلة اتغيرت
  S.profile = p;
  if (first) S.weights.push({ d: today(), kg: p.kg });
  save();
  if (first) { prefsBack = 'today'; tab = 'prefs'; } else tab = 'me';
  render();
}

// ---------- تفضيلات الأكل ----------
let prefsBack = 'me';
function renderPrefs() {
  const st = n => S.prefs.like.includes(n) ? 'l' : S.prefs.dislike.includes(n) ? 'd' : '';
  const em = n => S.prefs.like.includes(n) ? '❤️ ' : S.prefs.dislike.includes(n) ? '🚫 ' : '';
  $('#app').innerHTML = `<div class="card"><h3>🍽️ إيه الأكل اللي بتفضله؟</h3>
  <div class="mu">اضغط على الأكلة: مرة = ❤️ بحبها، مرتين = 🚫 مش بحبها، تالت مرة = محايد. هنركّب لك وجبات من اللي بتحبه ومضبوطة على سعراتك وماكروزك، ومش هنقترح عليك اللي مش بتحبه.</div></div>
  ${PREF_GROUPS.map(([title, list]) => `<div class="card"><h3>${title}</h3><div class="chips">${list.map(n => `<span class="chip ${st(n)}" data-n="${esc(n)}" onclick="cyclePref(this)">${em(n)}${esc(n)}</span>`).join('')}</div></div>`).join('')}
  <button class="pri" style="width:100%" onclick="finishPrefs()">${prefsBack === 'today' ? 'يلا نبدأ' : 'تم'}</button>
  ${prefsBack === 'today' ? '<button class="sec" style="width:100%;margin-top:8px" onclick="finishPrefs()">تخطي</button>' : ''}`;
}
function cyclePref(el) {
  const n = el.dataset.n, L = S.prefs.like, D = S.prefs.dislike;
  if (L.includes(n)) { L.splice(L.indexOf(n), 1); D.push(n); el.className = 'chip d'; el.textContent = '🚫 ' + n; }
  else if (D.includes(n)) { D.splice(D.indexOf(n), 1); el.className = 'chip'; el.textContent = n; }
  else { L.push(n); el.className = 'chip l'; el.textContent = '❤️ ' + n; }
  save();
}
function finishPrefs() { tab = prefsBack; render(); }

// ---------- اقتراحات الوجبات ----------
function ideasHtml() {
  const t = targets(S, ctx.target === 'plan' ? { idx: planDay } : date), ram = S.settings.ramadan;
  if (!ctx.opts || ctx.optsMeal !== ctx.meal) { ctx.opts = suggestMeals(ctx.meal, t, S.prefs, byName, 3, ram); ctx.optsMeal = ctx.meal; }
  const mt = mealTarget(t, ctx.meal, ram);
  if (!ctx.opts.length) return '<div class="mu" style="padding:10px">معرفتش أركّب وجبة بتفضيلاتك. خفّف اللي مش بتحبه من "تفضيلاتي".</div>';
  return `<div class="mu" style="margin-bottom:6px">هدف الوجبة ≈ ${r(mt.kcal)} سعرة · بروتين ${r(mt.p)} · كارب ${r(mt.c)} · دهون ${r(mt.f)} جم</div>`
    + ctx.opts.map((o, oi) => {
      const s = sum(o.items);
      return `<div class="card" style="margin:0 0 10px">${o.items.map((x, ii) => `<div class="item"><div onclick="swapOpen('opt',${oi},${ii})" style="flex:1;cursor:pointer">${esc(x.name)}<small>${r(x.kcal)} سعرة · بروتين ${r(x.p)} · كارب ${r(x.c)} · دهون ${r(x.f)} جم</small></div><button class="x" onclick="swapOpen('opt',${oi},${ii})">🔄</button></div>`).join('')}
      <div class="between" style="margin-top:8px"><b>${r(s.kcal)} سعرة</b><span class="mu">بروتين ${r(s.p)} · كارب ${r(s.c)} · دهون ${r(s.f)} جم</span></div>
      ${warnList(mealWarns(o.items, mt))}${fillChips(fillSuggestions(o.items, mt, mealType(ctx.meal, ram), S.prefs, byName), x => `addFillOpt(${oi},'${esc(x.name)}',${x.g})`)}
      <button class="pri" style="width:100%;margin-top:8px" onclick="addOpt(${oi})">إضافة الوجبة دي</button></div>`;
    }).join('')
    + '<button class="sec" style="width:100%" onclick="ctx.opts=null;search()">🎲 اقتراحات تانية</button><div class="mu" style="margin-top:6px">اضغط على أي مكوّن عشان تبدّله أو تعدّل كميته.</div>';
}
function addOpt(oi) { put(ctx.opts[oi].items.map(x => ({ ...x }))); }

// ---------- تبديل / تعديل مكوّن ----------
function swapItem(s) { return s.where === 'opt' ? ctx.opts[s.a].items[s.b] : s.where === 'log' ? S.log[date][s.a] : S.plan[planDay][s.a]; }
function swapOpen(where, a, b) {
  const it = swapItem({ where, a, b }), role = it.base && (it.role || roleOf(it.base));
  if (!role) { if (where !== 'opt') return editItem(where, a); return; }
  ctx.swap = { where, a, b, role, food: it.base, g: it.g, keep: 'kcal', orig: { kcal: it.kcal, p: it.p, c: it.c, f: it.f, g: it.g, base: it.base } };
  drawSwap();
}
function swapGrams(f) { const s = ctx.swap; return s.keep === 'kcal' ? clamp(Math.round(s.orig.kcal / f.kcal * 100 / 5) * 5, 5, capOf(f)) : s.orig.g; }
function drawSwap() {
  const s = ctx.swap;
  const pool = (ROLE_POOLS[s.role] || []).filter(n => n !== s.food && !S.prefs.dislike.includes(n) && findFood(n)).sort((a, b) => S.prefs.like.includes(b) - S.prefs.like.includes(a));
  modal(`<div class="between"><h3>🔄 ${esc(s.food)}</h3><button class="x" onclick="swapClose()">✕</button></div>
  <label>الكمية (جرام)</label><input id="sg" type="number" value="${r(s.g)}" oninput="ctx.swap.g=+this.value;swapPrev()">
  <div id="sp" class="mu" style="margin-bottom:8px"></div>
  <button class="pri" style="width:100%;margin-bottom:12px" onclick="applySwap()">تطبيق</button>
  <div class="between" style="margin-bottom:6px"><b>بدّل بـ</b><div class="tabs" style="margin:0"><button class="sec sm ${s.keep === 'kcal' ? 'on' : ''}" onclick="setKeep('kcal')">نفس السعرات</button><button class="sec sm ${s.keep === 'g' ? 'on' : ''}" onclick="setKeep('g')">نفس الجرامات</button></div></div>
  ${pool.map(n => { const f = findFood(n), g = swapGrams(f); return `<div class="res" onclick="pickAlt('${esc(n)}')">${esc(n)} <span class="mu">— ${g}ج ≈ ${r(f.kcal * g / 100)} سعرة · بروتين ${r(f.p * g / 100)} · كارب ${r(f.c * g / 100)} · دهون ${r(f.f * g / 100)} جم</span></div>`; }).join('') || '<div class="mu">مفيش بدائل</div>'}`);
  swapPrev();
}
function swapPrev() {
  const s = ctx.swap, f = findFood(s.food), q = (+s.g || 0) / 100, k = f.kcal * q, d = k - s.orig.kcal;
  const it = swapItem(s), nw = { kcal: k, p: f.p * q, c: f.c * q, f: f.f * q };
  let items, meal, tgt;
  if (s.where === 'opt') { items = ctx.opts[s.a].items.map(x => x === it ? nw : x); meal = ctx.meal; tgt = ctx.target; }
  else { meal = it.meal; items = (s.where === 'log' ? S.log[date] : S.plan[planDay]).filter(x => x.meal === meal).map(x => x === it ? nw : x); tgt = s.where; }
  const tot = sum(items);
  $('#sp').innerHTML = esc(`${s.food}: ${r(k)} سعرة · بروتين ${r(f.p * q)} · كارب ${r(f.c * q)} · دهون ${r(f.f * q)} جم  (${d >= 0 ? '+' : ''}${r(d)} سعرة عن الأصلي)`)
    + `<div style="margin-top:4px">الوجبة كلها: <b>${r(tot.kcal)}</b> / ${r(mealTgt(tgt, meal).kcal)} سعرة · بروتين ${r(tot.p)} · كارب ${r(tot.c)}</div>` + warnList(mealWarns(items, mealTgt(tgt, meal)));
}
function setKeep(k) { const s = ctx.swap; s.keep = k; if (s.food !== s.orig.base) s.g = swapGrams(findFood(s.food)); drawSwap(); }
function pickAlt(n) { ctx.swap.food = n; ctx.swap.g = swapGrams(findFood(n)); drawSwap(); }
function swapClose() { if (ctx.swap.where === 'opt') drawAdd(); else closeModal(); }
function applySwap() {
  const s = ctx.swap, f = findFood(s.food), g = +s.g; if (!(g > 0)) return;
  const it = swapItem(s), q = g / 100;
  Object.assign(it, { base: f.name, name: f.name + ' (' + r(g) + 'ج)', g: r(g), role: s.role, kcal: f.kcal * q, p: f.p * q, c: f.c * q, f: f.f * q });
  save();
  if (s.where === 'opt') drawAdd(); else { closeModal(); render(); }
}

// ---------- إضافة أكل ----------
function modal(html) { const m = $('#modal'); m.style.display = 'flex'; m.innerHTML = `<div>${html}</div>`; m.onclick = e => { if (e.target === m) closeModal(); }; }
function closeModal() { stopCam(); ctx.code = null; $('#modal').style.display = 'none'; }
function recentFoods() {
  const seen = {}, out = [];
  Object.keys(S.log).sort().reverse().forEach(d => S.log[d].slice().reverse().forEach(it => {
    if (it.base && !seen[it.base] && findFood(it.base)) { seen[it.base] = 1; out.push({ food: it.base, g: it.g }); }
  }));
  return out.slice(0, 15);
}
function openAdd(target, meal) { ctx = { target, meal, mode: 'ideas' }; drawAdd(); }
function drawAdd() {
  const tabs = (ctx.target === 'recipe' ? [] : [['ideas', '✨ اقتراحات']]).concat([['recent', 'الأخيرة'], ['all', 'الكل'], ['meals', 'وجباتي']]);
  const canCopy = ctx.target === 'log' && (S.log[today(new Date(new Date(date) - 864e5))] || []).some(x => x.meal === ctx.meal);
  modal(`<div class="between"><h3>إضافة إلى ${MEAL_LABEL(ctx.meal, S)}</h3><button class="x" onclick="closeModal()">✕</button></div>
  <div class="tabs">${tabs.map(([k, l]) => `<button class="sec sm ${ctx.mode === k ? 'on' : ''}" onclick="ctx.mode='${k}';drawAdd()">${l}</button>`).join('')}</div>
  ${ctx.mode === 'meals' || ctx.mode === 'ideas' ? '' : '<input id="q" placeholder="ابحث عن أكلة..." oninput="search()">'}
  <div id="res"></div>
  <div class="row" style="margin-top:8px"><button class="sec sm" onclick="openManual()">إدخال يدوي</button><button class="sec sm" onclick="openScan()">📷 باركود</button>${canCopy ? '<button class="sec sm" onclick="copyYesterday()">نسخ وجبة أمس</button>' : ''}</div>`);
  search();
}
function search() {
  const q = ($('#q') ? $('#q').value : '').trim(), res = $('#res'), all = allFoods();
  if (ctx.mode === 'ideas') { res.innerHTML = ideasHtml(); return; }
  if (ctx.mode === 'meals') {
    res.innerHTML = S.meals.map((m, i) => `<div class="res" onclick="addSavedMeal(${i})">${esc(m.name)} <span class="mu">— ${r(sum(m.items).kcal)} سعرة</span></div>`).join('') || '<div class="mu" style="padding:10px">مفيش وجبات محفوظة. اضغط ⭐ على أي وجبة.</div>';
    return;
  }
  if (ctx.mode === 'recent' && !q) {
    res.innerHTML = recentFoods().map(x => `<div class="res" onclick="pickFood('${esc(x.food).replace(/'/g, '')}',${x.g})">${esc(x.food)} <span class="mu">— آخر مرة ${x.g}ج</span></div>`).join('');
    return;
  }
  const lk = n => S.prefs.like.includes(n) ? 1 : 0;
  const l = all.filter(f => (!q || f.name.includes(q)) && !S.prefs.dislike.includes(f.name)).sort((a, b) => lk(b.name) - lk(a.name)).slice(0, 50);
  res.innerHTML = l.map(f => `<div class="res" onclick="pickFood('${esc(f.name).replace(/'/g, '')}')">${esc(f.name)} <span class="mu">— ${f.kcal} سعرة/100ج${f.src && f.src !== 'usda' ? ' ≈' : ''}</span></div>`).join('') || '<div class="mu" style="padding:10px">مفيش نتائج. جرّب الإدخال اليدوي.</div>';
}
function pickFood(name, g) {
  const f = findFood(name); if (!f) return; ctx.food = f;
  const units = [{ label: 'جرام', g: 1 }].concat((f.serv || []).map(s => ({ label: s.label, g: s.g })));
  ctx.units = units;
  const useServ = !g && units.length > 1, ui = useServ ? 1 : 0;
  modal(`<h3>${esc(f.name)}</h3><div class="row"><div><label>الكمية</label><input id="qty" type="number" step="any" value="${useServ ? 1 : (g || 100)}" oninput="prev()"></div>
  <div><label>الوحدة</label><select id="unit" onchange="prev()">${units.map((u, i) => `<option value="${i}" ${i === ui ? 'selected' : ''}>${u.label}${u.g > 1 ? ' (' + u.g + 'ج)' : ''}</option>`).join('')}</select></div></div>
  <div id="pv" class="mu" style="margin-bottom:8px"></div><button class="pri" style="width:100%" onclick="confirmFood()">إضافة</button>`);
  prev();
}
function curGrams() { return (+$('#qty').value || 0) * ctx.units[+$('#unit').value].g; }
function mkItem(f, g) {
  const q = g / 100, u = ctx.units[+$('#unit').value], n = +$('#qty').value;
  const label = u.g === 1 ? r(g) + 'ج' : n + ' × ' + u.label;
  return { name: f.name + ' (' + label + ')', base: f.name, g: r(g), kcal: f.kcal * q, p: f.p * q, c: f.c * q, f: f.f * q };
}
function prev() {
  const x = mkItem(ctx.food, curGrams());
  let h = esc(`${r(curGrams())}ج = ${r(x.kcal)} سعرة · بروتين ${r(x.p)} · كارب ${r(x.c)} · دهون ${r(x.f)}`);
  if (ctx.target !== 'recipe' && ctx.meal) {
    const mt = mealTgt(ctx.target, ctx.meal), items = mealItemsOf(ctx.target, ctx.meal).concat([x]), tot = sum(items);
    h += `<div style="margin-top:4px">الوجبة بعد الإضافة: <b>${r(tot.kcal)}</b> / ${r(mt.kcal)} سعرة · بروتين ${r(tot.p)} / ${r(mt.p)}</div>` + warnList(mealWarns(items, mt));
  }
  $('#pv').innerHTML = h;
}
function confirmFood() { const g = curGrams(); if (g > 0) put([mkItem(ctx.food, g)]); }
function openManual() {
  modal(`<h3>إدخال يدوي</h3><input id="mn" placeholder="الاسم"><input id="mk" type="number" placeholder="السعرات">
  <div class="row"><input id="mp" type="number" placeholder="بروتين"><input id="mc" type="number" placeholder="كارب"><input id="mf" type="number" placeholder="دهون"></div>
  <button class="pri" style="width:100%" onclick="confirmManual()">إضافة</button>`);
}
function confirmManual() {
  if ($('#mk').value === '') return;
  put([{ name: $('#mn').value.trim() || 'أكلة', kcal: +$('#mk').value, p: +$('#mp').value || 0, c: +$('#mc').value || 0, f: +$('#mf').value || 0 }]);
}
function put(items) {
  if (ctx.target === 'recipe') { ctx.recipe.items.push(...items.map(x => ({ ...x, g: x.g || 0 }))); drawRecipe(); return; }
  const dst = ctx.target === 'log' ? (S.log[date] = S.log[date] || []) : (S.plan[planDay] = S.plan[planDay] || []);
  items.forEach(i => dst.push({ ...i, meal: ctx.meal }));
  save(); closeModal(); render();
}
function copyYesterday() {
  const y = today(new Date(new Date(date) - 864e5));
  put((S.log[y] || []).filter(x => x.meal === ctx.meal));
}
function saveMeal(target, meal) {
  const list = target === 'log' ? (S.log[date] || []) : (S.plan[planDay] || []);
  const items = list.filter(x => x.meal === meal).map(({ meal, ...x }) => x);
  const name = prompt('اسم الوجبة؟', MEAL_LABEL(meal, S)); if (!name) return;
  S.meals.push({ name, items }); save(); alert('اتحفظت في وجباتي ✅');
}
function addSavedMeal(i) { put(S.meals[i].items.map(x => ({ ...x }))); }
function openCustom(code) {
  ctx.code = code || null;
  modal(`<h3>${code ? 'منتج جديد · باركود ' + esc(code) : 'أكلة جديدة'} (القيم لكل 100 جم)</h3><input id="cn" placeholder="الاسم"><input id="ck" type="number" placeholder="سعرات">
  <div class="row"><input id="cp" type="number" placeholder="بروتين"><input id="cc" type="number" placeholder="كارب"><input id="cf" type="number" placeholder="دهون"></div>
  <button class="pri" style="width:100%" onclick="saveCustom()">حفظ</button>`);
}
function saveCustom() {
  const name = $('#cn').value.trim().replace(/'/g, ''); if (!name || $('#ck').value === '') return;
  S.custom.push(F(name, +$('#ck').value, +$('#cp').value || 0, +$('#cc').value || 0, +$('#cf').value || 0));
  const code = ctx.code; if (code) S.barcodes[code] = name;
  save();
  if (code && ctx.target) { ctx.code = null; pickFood(name); } else { closeModal(); render(); }
}

// ---------- باركود (بيحفظ منتجاتك على جهازك، من غير أي خدمة خارجية) ----------
let camStream = null, scanRaf = 0;
function stopCam() { if (scanRaf) cancelAnimationFrame(scanRaf); scanRaf = 0; if (camStream) camStream.getTracks().forEach(t => t.stop()); camStream = null; }
function openScan() {
  modal(`<div class="between"><h3>📷 مسح باركود</h3><button class="x" onclick="closeModal()">✕</button></div>
  <video id="cam" playsinline muted style="width:100%;border-radius:12px;background:#000;display:none;margin-bottom:8px"></video><div id="scanmsg" class="mu" style="margin-bottom:8px"></div>
  <label>أو اكتب رقم الباركود</label><input id="bc" type="number" placeholder="رقم الباركود"><button class="pri" style="width:100%" onclick="gotCode($('#bc').value)">بحث</button>
  <div class="mu" style="margin-top:8px">أول مرة تمسح منتج بتدخل بياناته من العبوة، وبعدها التطبيق يتعرف عليه لوحده. كله محفوظ على جهازك.</div>`);
  startCam();
}
async function startCam() {
  if (!('BarcodeDetector' in window) || !navigator.mediaDevices) { $('#scanmsg').textContent = 'المسح بالكاميرا مش متاح على المتصفح ده. اكتب الرقم يدويا.'; return; }
  try {
    camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    const v = $('#cam'); if (!v) { stopCam(); return; }
    v.srcObject = camStream; v.style.display = 'block'; await v.play();
    const det = new BarcodeDetector();
    const loop = async () => {
      if (!camStream) return;
      try { const c = await det.detect(v); if (c.length) { const code = c[0].rawValue; stopCam(); gotCode(code); return; } } catch (e) {}
      scanRaf = requestAnimationFrame(loop);
    };
    loop();
  } catch (e) { const m = $('#scanmsg'); if (m) m.textContent = 'معرفتش أفتح الكاميرا. اكتب الرقم يدويا.'; }
}
function gotCode(code) {
  code = String(code || '').trim(); if (!code) return; stopCam();
  const n = S.barcodes[code];
  if (n && findFood(n)) pickFood(n); else openCustom(code);
}

// ---------- وصفات ----------
function openRecipe() { ctx = { recipe: { name: '', n: 4, items: [] } }; drawRecipe(); }
function drawRecipe() {
  const R = ctx.recipe, tot = sum(R.items);
  modal(`<div class="between"><h3>🍲 وصفة جديدة</h3><button class="x" onclick="closeModal()">✕</button></div>
  <input placeholder="اسم الوصفة" value="${esc(R.name)}" oninput="ctx.recipe.name=this.value"><label>عدد الحصص</label><input type="number" value="${R.n}" oninput="ctx.recipe.n=Math.max(1,+this.value||1)">
  ${R.items.map((x, i) => `<div class="item"><div>${esc(x.name)}<small>${r(x.kcal)} سعرة</small></div><button class="x" onclick="ctx.recipe.items.splice(${i},1);drawRecipe()">✕</button></div>`).join('')}
  <button class="sec" style="width:100%;margin:8px 0" onclick="ctx.target='recipe';ctx.meal='وصفة';ctx.mode='all';drawAdd()">+ مكوّن</button>
  <div class="mu" style="margin-bottom:8px">الإجمالي ${r(tot.kcal)} سعرة · الحصة ≈ ${r(tot.kcal / R.n)} سعرة</div>
  <button class="pri" style="width:100%" onclick="saveRecipe()">حفظ الوصفة</button>`);
}
function saveRecipe() {
  const R = ctx.recipe, name = R.name.trim().replace(/'/g, ''); if (!name || !R.items.length) return alert('اكتب اسم الوصفة وضيف مكوّن واحد على الأقل');
  const t = sum(R.items), w = R.items.reduce((a, i) => a + i.g, 0) || 100 * R.n, k = 100 / w;
  S.custom.push(F(name, t.kcal * k, t.p * k, t.c * k, t.f * k, [['حصة', r(w / R.n)]]));
  save(); closeModal(); render();
}

// ---------- نسخ احتياطي ----------
function exportData() {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(S)], { type: 'application/json' }));
  a.download = 'saraati-backup-' + today() + '.json'; a.click();
}
function importData(f) {
  if (!f) return; const rd = new FileReader();
  rd.onload = () => { try { const d = JSON.parse(rd.result); if (!d.log || !d.weights) throw 0; localStorage.setItem(KEY, JSON.stringify(d)); S = load(); render(); } catch (e) { alert('الملف مش صالح'); } };
  rd.readAsText(f);
}

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
render();
startTranslator();
syncSteps();
