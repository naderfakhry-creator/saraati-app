'use strict';
// تسجيل بالكتابة بالعامية: "رغيفين فول وبيضتين وشاي" → أكلات وكميات وسعرات. بيشتغل أوفلاين من غير أي خدمة خارجية.
const norm = s => String(s).toLowerCase().replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
  .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/\s+/g, ' ').trim();
const QTY_WORDS = { 'واحد': 1, 'واحده': 1, 'اتنين': 2, 'تنين': 2, 'تلاته': 3, 'تلات': 3, 'ثلاثه': 3, 'اربعه': 4, 'اربع': 4, 'خمسه': 5, 'خمس': 5, 'سته': 6, 'ست': 6, 'سبعه': 7, 'تمنيه': 8, 'تسعه': 9, 'عشره': 10, 'نص': 0.5, 'نصف': 0.5, 'ربع': 0.25, 'تلت': 0.33 };
const DUAL = { 'رغيفين': 'رغيف', 'بيضتين': 'بيضه', 'كوبايتين': 'كوبايه', 'كوبين': 'كوب', 'حبتين': 'حبه', 'ملعقتين': 'ملعقه', 'شريحتين': 'شريحه', 'طبقين': 'طبق', 'علبتين': 'علبه', 'قطعتين': 'قطعه', 'سكوبين': 'سكوب', 'ساندوتشين': 'ساندوتش', 'فنجانين': 'فنجان', 'قرصين': 'قرص', 'حفنتين': 'حفنه' };
const ALIAS = { 'عيش': 'عيش بلدي', 'رز': 'أرز أبيض مطبوخ', 'ارز': 'أرز أبيض مطبوخ', 'فراخ': 'صدور فراخ مشوية', 'بيض': 'بيض مسلوق', 'بيضه': 'بيض مسلوق', 'لحمه': 'لحمة بقري مشوية', 'لحم': 'لحمة بقري مشوية', 'فلافل': 'طعمية', 'تونه': 'تونة معلبة (ماء)', 'جبنه': 'جبنة قريش', 'قريش': 'جبنة قريش', 'فول': 'فول مدمس', 'مكرونه': 'مكرونة مطبوخة', 'بطاطس': 'بطاطس مسلوقة', 'بطاطا': 'بطاطا مشوية', 'شوفان': 'شوفان خام', 'سمك': 'سمك مشوي', 'كبده': 'كبدة', 'زبادي': 'زبادي طبيعي', 'عدس': 'عدس مطبوخ', 'لبن': 'لبن كامل', 'شاي': 'شاي سادة', 'قهوه': 'قهوة سادة', 'كفته': 'كفتة مشوية', 'جمبري': 'جمبري مطبوخ', 'موز': 'موز', 'تفاح': 'تفاح', 'خيار': 'خيار', 'طماطم': 'طماطم', 'سلطه': 'سلطة خضراء', 'كشري': 'كشري', 'زيت': 'زيت', 'عسل': 'عسل', 'سكر': 'سكر', 'لوز': 'لوز', 'تمر': 'تمر', 'برجر': 'ساندوتش برجر', 'شاورما': 'ساندوتش شاورما فراخ', 'بيتزا': 'بيتزا', 'ملوخيه': 'ملوخية', 'عصير': 'عصير برتقال', 'واي': 'بروتين واي', 'فته': 'فتة بالأرز واللحمة', 'فطير': 'فطير مشلتت', 'معمر': 'رز معمّر', 'مسقعه': 'مسقعة', 'غنوج': 'بابا غنوج', 'حواوشي': 'حواوشي', 'بروتين': 'بروتين واي' };

function splitText(text) {
  return String(text).split(/\n|،|,|\+|\s+مع\s+|\s+و(?!رق)(?=\S)|\s+و\s+/).map(s => s.trim()).filter(Boolean);
}
function findFoodIn(t, foods) {
  const toks = t.split(' ').filter(Boolean);
  const byLen = foods.map(f => ({ f, n: norm(f.name) })).sort((a, b) => b.n.length - a.n.length);
  for (const x of byLen) if (t.includes(x.n)) return x.f;
  for (const w of toks) if (ALIAS[w]) { const f = foods.find(f => f.name === ALIAS[w]); if (f) return f; }
  let best = null, score = 0;
  for (const x of byLen) {
    const ft = x.n.replace(/[()]/g, '').split(' ').filter(w => w.length >= 3);
    const hit = ft.filter(w => toks.includes(w)).length;
    const s = hit / (ft.length || 1);
    if (hit && (s > score || (s === score && best && x.n.length < norm(best.name).length))) { best = x.f; score = s; }
  }
  return best;
}
function parseChunk(raw, foods) {
  let t = norm(raw); if (!t) return null;
  let qty = null, unitWord = null, grams = null, m;
  m = t.match(/(\d+(?:\.\d+)?)\s*(جرام|جم|غرام|g)(?=\s|$)/); if (m) { grams = +m[1]; t = t.replace(m[0], ' '); }
  for (const [d, u] of Object.entries(DUAL)) { const re = new RegExp('(^| )' + d + '( |$)'); if (re.test(t)) { qty = 2; unitWord = u; t = t.replace(re, ' ' + u + ' '); break; } }
  if (qty === null) { m = t.match(/(\d+(?:\.\d+)?)/); if (m) { qty = +m[1]; t = t.replace(m[0], ' '); } }
  if (qty === null) for (const w of t.split(' ')) if (QTY_WORDS[w] !== undefined) { qty = QTY_WORDS[w]; t = t.replace(new RegExp('(^| )' + w + '( |$)'), ' '); break; }
  t = t.replace(/\s+/g, ' ').trim();
  const f = findFoodIn(t, foods); if (!f) return null;
  let g, label;
  if (grams !== null) { g = grams; label = Math.round(g) + 'ج'; }
  else {
    const toks = t.split(' ');
    const cands = (f.serv || []).filter(s => { const ln = norm(s.label); return unitWord ? (ln === unitWord || ln.split(' ')[0] === unitWord) : (t.includes(ln) || toks.includes(ln.split(' ')[0])); });
    let serv = cands.find(s => norm(s.label).includes('وسط')) || cands[0];
    if (!serv && unitWord === 'رغيف') serv = (f.serv || []).find(s => s.label === 'ساندوتش'); // "رغيفين فول" = ساندوتش فول
    if (serv) { const n = qty === null ? 1 : qty; g = n * serv.g; label = n + ' × ' + serv.label; }
    else if (qty !== null && qty >= 20) { g = qty; label = Math.round(g) + 'ج'; }
    else if (f.serv && f.serv.length) { const s = f.serv[0], n = qty === null ? 1 : qty; g = n * s.g; label = n + ' × ' + s.label; }
    else { g = (qty || 1) * 100; label = Math.round(g) + 'ج'; }
  }
  const q = g / 100;
  return { name: f.name + ' (' + label + ')', base: f.name, g: Math.round(g), role: roleOf(f.name) || undefined, kcal: f.kcal * q, p: f.p * q, c: f.c * q, f: f.f * q };
}
// ---------- كتابة بالإنجليزي: بنحوّلها لكلمات عربي عشان نستخدم نفس المحلل ----------
const EN_UNITS = { cup: 'كوب', cups: 'كوب', glass: 'كوباية', glasses: 'كوباية', loaf: 'رغيف', loaves: 'رغيف', plate: 'طبق', plates: 'طبق', bowl: 'طبق', bowls: 'طبق', slice: 'شريحة', slices: 'شريحة', tablespoon: 'ملعقة', tablespoons: 'ملعقة', tbsp: 'ملعقة', spoon: 'ملعقة', spoons: 'ملعقة', piece: 'قطعة', pieces: 'قطعة', can: 'علبة', pack: 'علبة', sandwich: 'ساندوتش', sandwiches: 'ساندوتش', scoop: 'سكوب', scoops: 'سكوب', handful: 'حفنة' };
const EN_FOODS = { bread: 'عيش', rice: 'رز', chicken: 'فراخ', beef: 'لحمة', meat: 'لحمة', tuna: 'تونة', cheese: 'جبنة', cottage: 'قريش', ful: 'فول', fava: 'فول', beans: 'فول', lentils: 'عدس', lentil: 'عدس', pasta: 'مكرونة', macaroni: 'مكرونة', potato: 'بطاطس', potatoes: 'بطاطس', oats: 'شوفان', oatmeal: 'شوفان', fish: 'سمك', liver: 'كبدة', yogurt: 'زبادي', yoghurt: 'زبادي', milk: 'لبن', tea: 'شاي', coffee: 'قهوة', banana: 'موز', bananas: 'موز', apple: 'تفاح', apples: 'تفاح', orange: 'برتقال', oranges: 'برتقال', dates: 'تمر', date: 'تمر', almonds: 'لوز', falafel: 'فلافل', koshary: 'كشري', kushari: 'كشري', hummus: 'حمص', pizza: 'بيتزا', burger: 'برجر', shawarma: 'شاورما', honey: 'عسل', sugar: 'سكر', oil: 'زيت', shrimp: 'جمبري', salad: 'سلطة', cucumber: 'خيار', tomato: 'طماطم', tomatoes: 'طماطم', molokhia: 'ملوخية', whey: 'واي', egg: 'بيض', eggs: 'بيض', omelet: 'أومليت', omelette: 'أومليت', walnuts: 'جوز', peanuts: 'فول سوداني', juice: 'عصير', fries: 'بطاطس مقلية' };
const EN_QTY = { a: '1', an: '1', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10', half: 'نص', quarter: 'ربع' };
const EN_PHRASES2 = [['falafel sandwich', 'ساندوتش فلافل'], ['sandwich falafel', 'ساندوتش فلافل'], ['chicken shawarma', 'شاورما'], ['cottage cheese', 'قريش'], ['olive oil', 'زيت زيتون'], ['peanut butter', 'زبدة فول سوداني'], ['sweet potato', 'بطاطا'], ['ice cream', 'آيس كريم'], ['orange juice', 'عصير برتقال'], ['boiled egg', 'بيض'], ['fried egg', 'بيض مقلي'], ['white rice', 'رز'], ['baladi bread', 'عيش بلدي'], ['greek yogurt', 'زبادي يوناني'], ['whole milk', 'لبن كامل'], ['skim milk', 'لبن خالي الدسم']];
function enToAr(chunk) {
  let t = chunk.toLowerCase().replace(/(\d+(?:\.\d+)?)\s*(?:g|gr|gram|grams)(?![a-z])/g, '$1 جم');
  EN_PHRASES2.forEach(([a, b]) => { t = t.split(a).join(' ' + b + ' '); });
  const words = t.match(/[a-z]+|\d+(?:\.\d+)?|[؀-ۿ]+/g) || [];
  const hasQty = words.some(w => /^\d/.test(w) || (EN_QTY[w] && w !== 'a' && w !== 'an'));
  return words.map(w => (w === 'a' || w === 'an') ? (hasQty ? '' : '1') : (EN_QTY[w] || EN_UNITS[w] || EN_FOODS[w] || (/^[\d؀-ۿ]/.test(w) ? w : ''))).filter(Boolean).join(' ');
}
function parseMealText(text, foods) {
  if (/[a-z]/i.test(text)) { // إنجليزي
    const items = [], failed = [];
    String(text).split(/\n|,|;|\+|&|\s+and\s+|\s+with\s+/i).map(s => s.trim()).filter(Boolean).forEach(c => { const it = parseChunk(enToAr(c), foods); if (it) items.push(it); else failed.push(c); });
    return { items, failed };
  }
  const items = [], failed = [];
  splitText(text).forEach(c => { const it = parseChunk(c, foods); if (it) items.push(it); else failed.push(c); });
  return { items, failed };
}
