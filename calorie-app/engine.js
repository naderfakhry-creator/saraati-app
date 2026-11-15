'use strict';
// محرك الحساب: معادلات + مدرب تكيّفي بيتعلم الحرق الحقيقي من وزنك وأكلك
const KCAL_PER_KG = 7700;
const DAY = 864e5;
const dayDiff = (a, b) => Math.round((new Date(b) - new Date(a)) / DAY);

function formulaTdee(p) {
  const bmr = 10 * p.kg + 6.25 * p.cm - 5 * p.age + (p.sex === 'm' ? 5 : -161); // Mifflin-St Jeor
  return { bmr, tdee: bmr * p.act };
}

// متوسط وزن "ترند" بيتجاهل تذبذب الماء اليومي
function trendSeries(weights) {
  const w = weights.slice().sort((a, b) => a.d.localeCompare(b.d));
  let t = null, prev = null;
  return w.map(x => {
    if (t === null) t = x.kg;
    else { const gap = Math.max(1, dayDiff(prev, x.d)); const a = 1 - Math.pow(0.9, gap); t += a * (x.kg - t); }
    prev = x.d;
    return { d: x.d, kg: x.kg, trend: t };
  });
}

function dayKcal(log, d) { return (log[d] || []).reduce((a, i) => a + i.kcal, 0); }

// تقدير الحرق الفعلي = متوسط الأكل - (تغير الوزن × 7700)
function estimateTdee(S, endDate) {
  const f = formulaTdee(S.profile).tdee;
  const start = new Date(new Date(endDate) - 20 * DAY).toISOString().slice(0, 10);
  const ser = trendSeries(S.weights).filter(x => x.d >= start && x.d <= endDate);
  let valid = 0, total = 0;
  for (let i = 0; i < 21; i++) {
    const d = new Date(new Date(endDate) - i * DAY).toISOString().slice(0, 10);
    const k = dayKcal(S.log, d);
    if (k >= 800) { valid++; total += k; }
  }
  const out = { formula: Math.round(f), measured: null, tdee: Math.round(f), conf: 0, valid, weighIns: ser.length, span: 0, slope: 0, reason: '' };
  if (ser.length < 3) { out.reason = 'محتاج 3 قياسات وزن على الأقل خلال آخر 3 أسابيع.'; return out; }
  const span = dayDiff(ser[0].d, ser[ser.length - 1].d);
  out.span = span;
  if (span < 6) { out.reason = 'محتاج قياسات وزن موزعة على 7 أيام على الأقل.'; return out; }
  // ميل أقل مربعات على الأوزان الخام (بيتجنب تأخر الترند في أول الفترة)
  const xs = ser.map(x => dayDiff(ser[0].d, x.d)), mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ser.reduce((a, b) => a + b.kg, 0) / ser.length;
  const slope = xs.reduce((a, x, i) => a + (x - mx) * (ser[i].kg - my), 0) / xs.reduce((a, x) => a + (x - mx) ** 2, 0); // كجم/يوم
  out.slope = slope * 7;
  if (valid < 5) { out.reason = 'سجّل أكلك 5 أيام على الأقل (أكتر من 800 سعرة في اليوم).'; return out; }
  let m = total / valid - slope * KCAL_PER_KG;
  m = Math.min(f * 1.3, Math.max(f * 0.7, m));
  out.measured = Math.round(m);
  out.conf = Math.min(1, valid / 14) * Math.min(1, span / 14);
  out.tdee = Math.round(f * (1 - out.conf) + m * out.conf);
  return out;
}

// يوم تمرين ولا راحة؟ opt = تاريخ (نص) أو { idx } لرقم اليوم في الجدول (0 = السبت)
function isTrain(S, opt) {
  const days = (S.settings && S.settings.trainDays) || [];
  if (opt && typeof opt === 'object') return days.includes(opt.idx);
  if (S.train && S.train[opt] !== undefined) return S.train[opt];
  return days.includes((new Date(opt).getDay() + 1) % 7);
}
function targets(S, opt) {
  const t = baseTargets(S);
  if (opt === undefined || opt === null) return t;
  const n = ((S.settings && S.settings.trainDays) || []).length, tr = isTrain(S, opt);
  if (!n && !tr) return { ...t, train: false, cycled: false };
  // تدوير الكارب: يوم التمرين كارب أعلى، والراحة أقل، ومتوسط الأسبوع ثابت. البروتين والدهون ثابتين.
  const delta = Math.round(t.kcal * 0.12), floor = S.profile.sex === 'm' ? 1500 : 1200;
  const adj = tr ? delta : -Math.round(delta * Math.min(Math.max(n, 1), 6) / (7 - Math.min(Math.max(n, 1), 6)));
  const kcal = Math.max(floor, t.kcal + adj);
  const c = Math.max(0, Math.round((kcal - t.p * 4 - t.f * 9) / 4));
  return { ...t, kcal, c, train: tr, cycled: true };
}
function baseTargets(S) {
  const p = S.profile, fm = formulaTdee(p);
  const tdee = S.adaptive && S.adaptive.tdee ? S.adaptive.tdee : Math.round(fm.tdee);
  const adj = Math.round(p.rate * KCAL_PER_KG / 7);
  const floor = p.sex === 'm' ? 1500 : 1200;
  const kcal = Math.max(floor, Math.round(tdee + adj));
  const prot = Math.round(p.kg * (p.rate < 0 ? 2 : 1.8));
  const fat = Math.round(kcal * 0.25 / 9);
  const carb = Math.max(0, Math.round((kcal - prot * 4 - fat * 9) / 4));
  return { bmr: Math.round(fm.bmr), tdee, kcal, p: prot, c: carb, f: fat, adaptive: !!(S.adaptive && S.adaptive.tdee) };
}

// تحديث الهدف الأسبوعي (مع حد أقصى للتغيير عشان ما يتنططش)
function applyCheckin(S, est, endDate) {
  const old = S.adaptive && S.adaptive.tdee ? S.adaptive.tdee : est.formula;
  const next = Math.min(old + 250, Math.max(old - 250, est.tdee));
  const hist = (S.adaptive && S.adaptive.hist) || [];
  hist.push({ d: endDate, tdee: next });
  S.adaptive = { tdee: next, date: endDate, hist: hist.slice(-30) };
  return { old, next };
}

