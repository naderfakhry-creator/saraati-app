'use strict';
// ترجمة التطبيق: المصدر عربي، والإنجليزي بيتطبّق على النص الظاهر (مع إعادة ترتيب الجمل الديناميكية).
// {n} = رقم، {*} = أي نص. في الإنجليزي: $1 $2 ...
const AR_RE = /[؀-ۿ]/;
const lang = () => (typeof S !== 'undefined' && S && S.settings && S.settings.lang) || 'ar';
const isEN = () => lang() === 'en';

// ---------- أسماء الأكل ----------
const FOOD_EN = {
  'عيش بلدي': 'Baladi bread', 'عيش فينو': 'Fino bread (white roll)', 'عيش شامي': 'Shami (pita) bread', 'عيش توست': 'Toast bread',
  'أرز أبيض مطبوخ': 'Cooked white rice', 'أرز بالشعرية': 'Rice with vermicelli', 'مكرونة مطبوخة': 'Cooked pasta', 'مكرونة بالبشاميل': 'Béchamel pasta',
  'كشري': 'Koshary', 'شوفان خام': 'Raw oats', 'كورن فليكس': 'Corn flakes', 'بطاطس مسلوقة': 'Boiled potatoes', 'بطاطس مقلية': 'French fries',
  'بطاطا مشوية': 'Baked sweet potato', 'ذرة مشوية': 'Grilled corn', 'فول مدمس': 'Ful medames (fava beans)', 'طعمية': "Ta'ameya (falafel)",
  'عدس مطبوخ': 'Cooked lentils', 'شوربة عدس': 'Lentil soup', 'حمص مطبوخ': 'Cooked chickpeas', 'ملوخية': 'Molokhia', 'بامية بالصلصة': 'Okra in tomato sauce',
  'بسلة بالجزر': 'Peas and carrots', 'فاصوليا بالصلصة': 'White beans in tomato sauce', 'محشي ورق عنب': 'Stuffed grape leaves', 'محشي كوسة': 'Stuffed zucchini',
  'صدور فراخ مشوية': 'Grilled chicken breast', 'فراخ مشوية بالجلد': 'Grilled chicken with skin', 'فراخ بانيه': 'Breaded fried chicken',
  'لحمة بقري مشوية': 'Grilled beef', 'لحمة مفرومة مطبوخة': 'Cooked ground beef', 'كفتة مشوية': 'Grilled kofta', 'كبدة': 'Liver', 'سمك مشوي': 'Grilled fish (mullet)',
  'جمبري مطبوخ': 'Cooked shrimp', 'تونة معلبة (ماء)': 'Canned tuna (in water)', 'صدور ديك رومي': 'Turkey breast', 'سجق': 'Sausage', 'بيض مسلوق': 'Boiled egg',
  'أومليت': 'Omelet', 'لبن كامل': 'Whole milk', 'لبن خالي الدسم': 'Skim milk', 'زبادي طبيعي': 'Plain yogurt', 'زبادي يوناني': 'Greek yogurt',
  'جبنة قريش': 'Cottage cheese', 'جبنة رومي': 'Roumy cheese', 'جبنة بيضاء': 'White cheese (feta-style)', 'جبنة مثلثات': 'Cheese triangles',
  'جبنة شيدر': 'Cheddar cheese', 'لبنة': 'Labneh', 'رز بلبن': 'Rice pudding', 'موز': 'Banana', 'تفاح': 'Apple', 'برتقال': 'Orange', 'تمر': 'Dates',
  'عنب': 'Grapes', 'مانجو': 'Mango', 'بطيخ': 'Watermelon', 'فراولة': 'Strawberries', 'جوافة': 'Guava', 'رمان': 'Pomegranate', 'تين': 'Figs',
  'خيار': 'Cucumber', 'طماطم': 'Tomato', 'جزر': 'Carrot', 'سلطة خضراء': 'Green salad', 'بروكلي': 'Broccoli', 'كوسة': 'Zucchini',
  'باذنجان مشوي': 'Grilled eggplant', 'سلطة زبادي بالخيار': 'Yogurt cucumber salad', 'سلطة طحينة': 'Tahini salad', 'لوز': 'Almonds',
  'فول سوداني': 'Peanuts', 'جوز': 'Walnuts', 'زيت زيتون': 'Olive oil', 'زيت': 'Oil', 'زبدة': 'Butter', 'سمنة': 'Ghee', 'طحينة': 'Tahini',
  'زبدة فول سوداني': 'Peanut butter', 'عسل': 'Honey', 'سكر': 'Sugar', 'شيكولاتة داكنة': 'Dark chocolate', 'بسكويت': 'Biscuits', 'بسبوسة': 'Basbousa',
  'بقلاوة': 'Baklava', 'مهلبية': 'Muhallabia', 'أم علي': 'Om Ali', 'حلاوة طحينية': 'Halva', 'آيس كريم': 'Ice cream', 'بيتزا': 'Pizza',
  'ساندوتش شاورما فراخ': 'Chicken shawarma sandwich', 'ساندوتش برجر': 'Burger sandwich', 'شاي سادة': 'Plain tea', 'قهوة سادة': 'Black coffee',
  'عصير برتقال': 'Orange juice', 'عصير قصب': 'Sugarcane juice', 'مشروب غازي': 'Soft drink', 'بروتين واي': 'Whey protein',
  'فتة بالأرز واللحمة': 'Fatta with rice and meat', 'مسقعة': 'Moussaka', 'حواوشي': 'Hawawshi', 'فطير مشلتت': 'Feteer meshaltet', 'رز معمّر': 'Baked creamy rice (roz mo\'ammar)',
  'مكرونة بالصلصة': 'Pasta with tomato sauce', 'بابا غنوج': 'Baba ghanoush', 'فول بالزيت': 'Ful with oil', 'ساندوتش فلافل': 'Falafel sandwich',
  'بيض مقلي': 'Fried egg', 'حمص بالطحينة': 'Hummus with tahini'
};
// وحدات الحصص
const SERV_EN = {
  'رغيف': 'loaf', 'نص رغيف': 'half loaf', 'كوب': 'cup', 'ملعقة كبيرة': 'tbsp', 'ملعقة صغيرة': 'tsp', 'ملعقة': 'spoon', 'طبق': 'plate', 'طبق صغير': 'small plate',
  'طبق وسط': 'medium plate', 'طبق كبير': 'large plate', 'ساندوتش': 'sandwich', 'قرص': 'piece', 'حبة': 'piece', 'شريحة': 'slice', 'علبة': 'pack', 'قطعة': 'piece',
  'صدر': 'breast', 'ورك': 'thigh', 'نص فرخة': 'half chicken', 'سمكة': 'fish', 'بيضة': 'egg', 'بيضتين': '2 eggs', 'كوباية': 'glass', 'فنجان': 'cup', 'كورة': 'scoop',
  'سكوب': 'scoop', 'مثلث': 'triangle', 'كوز': 'cob', 'حفنة': 'handful', 'نص كوب': 'half cup', 'مربع': 'square', 'حصة': 'serving'
};

// ---------- جمل ديناميكية (فيها أرقام) ----------
const EN_PATTERNS = [
  ['المقترح لوزنك: {n} لتر (حوالي 33 مل لكل كجم).', 'Suggested for your weight: $1 L (about 33 ml per kg).'],
  ['إنجاز يوم {*}', 'Progress for $1'],
  ['اشرب {n} لتر كمان', 'Drink $1 L more'],
  ['زودت {n} سعرة عن الهدف', 'Over by $1 kcal'],
  ['ناقص بروتين {n} جم', 'Short on protein by $1 g'],
  ['امشي {n} خطوة كمان', 'Walk $1 more steps'],
  ['بتنزل {n} كجم/أسبوع، قريب من هدفك. كمّل كده', "You're losing $1 kg/week, close to your goal. Keep it up"],
  ['بتزيد {n} كجم/أسبوع، قريب من هدفك. كمّل كده', "You're gaining $1 kg/week, close to your goal. Keep it up"],
  ['بتزيد {n} كجم/أسبوع، وجزء كبير منها غالبا دهون. قلّل السعرات شوية', "You're gaining $1 kg/week, and much of it is probably fat. Cut calories a little"],
  ['بتنزل {n} كجم/أسبوع، وده ممكن يخسّرك عضل. زوّد سعراتك شوية وخلي بروتينك عالي', "You're losing $1 kg/week, which may cost you muscle. Raise your calories a bit and keep protein high"],
  ['زيادتك {n} كجم/أسبوع. زوّد سناكس عالية السعرات (مكسرات، زبدة فول سوداني، شيك لبن وموز) وسجّل كل وجباتك', 'Your gain is $1 kg/week. Add calorie-dense snacks (nuts, peanut butter, a milk-and-banana shake) and log all your meals'],
  ['نزولك {n} كجم/أسبوع. تأكد إنك بتسجل كل حاجة، خصوصا الزيوت والسناكس، والمدرب هيظبط هدفك', 'Your loss is $1 kg/week. Make sure you log everything, especially oils and snacks, and the coach will adjust your goal'],
  ['التغير {n} كجم في الأسبوع. لو مش ده المطلوب، عدّل أكلك شوية', 'The change is $1 kg per week. If that is not what you want, adjust your eating a bit'],
  ['متوسطك أعلى من هدفك بـ {n} سعرة. جرّب تقلل سناكس أو الزيوت', 'Your average is $1 kcal above your goal. Try cutting snacks or oils'],
  ['زودت {n} سعرة عن المطلوب ({n})', 'Over by $1 kcal (target $2)'],
  ['ناقص بروتين {n} جم عن المطلوب ({n})', 'Short on protein by $1 g (target $2)'],
  ['ناقص كارب {n} جم عن المطلوب ({n})', 'Short on carbs by $1 g (target $2)'],
  ['ناقص {n} سعرة', 'Short by $1 kcal'],
  ['المطلوب: بروتين {n} جم · كارب {n} جم', 'Target: protein $1 g · carbs $2 g'],
  ['المطلوب {n} سعرة', 'Target $1 kcal'],
  ['{n} / {n} سعرة', '$1 / $2 kcal'],
  ['كمّل يومك (متبقي {n} سعرة)', 'Finish your day ($1 kcal left)'],
  ['(+{n} سعرة عن الأصلي)', '(+$1 kcal vs. original)'],
  ['({n} سعرة عن الأصلي)', '($1 kcal vs. original)'],
  ['{n} سعرة عن الأصلي', '$1 kcal vs. original'],
  ['الإجمالي {n} سعرة · الحصة ≈ {n} سعرة', 'Total $1 kcal · serving ≈ $2 kcal'],
  ['حرقك التقديري {n} سعرة (من بياناتك)', 'Your estimated burn: $1 kcal (from your data)'],
  ['حرقك التقديري {n} سعرة (من معادلة، وهيتظبط من بياناتك)', 'Your estimated burn: $1 kcal (from a formula, it will adjust to your data)'],
  ['حرقك التقديري {n} سعرة', 'Your estimated burn: $1 kcal'],
  ['التحديث الجاي بعد {n} أيام', 'Next update in $1 days'],
  ['الهدف {n} ساعة', 'Goal: $1 hours'],
  ['صايم من {*}', 'Fasting for $1'],
  ['{n} س {n} د', '$1 h $2 min'],
  ['آخر صيام: {*}', 'Last fast: $1'],
  ['{n} ساعة', '$1 hours'],
  ['كارب أعلى النهاردة ({n} جم) لطاقة التمرين والاستشفاء.', 'Higher carbs today ($1 g) to fuel training and recovery.'],
  ['كارب أقل النهاردة ({n} جم). البروتين والدهون ثابتين.', 'Lower carbs today ($1 g). Protein and fat stay the same.'],
  ['يوم تمرين: كارب أعلى ({n} جم)', 'Training day: higher carbs ($1 g)'],
  ['يوم راحة: كارب أقل ({n} جم)', 'Rest day: lower carbs ($1 g)'],
  ['الوجبة الجاية: {*} الساعة {*}', 'Next meal: $1 at $2'],
  ['دلوقتي وقت {*} ({*})', "It's time for $1 ($2)"],
  ['لسه ما سجلتش: {*}', 'Not logged yet: $1'],
  ['تم التحديث: الحرق من {n} إلى {n} سعرة. هدفك الجديد {n} سعرة.', 'Updated: burn from $1 to $2 kcal. Your new goal is $3 kcal.'],
  ['آخر مرة {n}ج', 'Last time $1 g'],
  ['{n} جم · {n} سعرة', '$1 g · $2 kcal'],
  ['هدف المياه بالأكواب (الكوب 250 مل) · المقترح لوزنك {n} كوب', 'Water goal in cups (1 cup = 250 ml) · suggested for your weight: $1 cups'],
  ['المياه (كوب = 250 مل)', 'Water (cup = 250 ml)'],
  ['{n} من {n}', '$1 of $2'],
  ['من {n} سعرة', 'of $1 kcal'],
  ['الهدف {n}', 'Goal $1'],
  ['{n} سعرة · بروتين {n} · كارب {n} · دهون {n} جم', '$1 kcal · protein $2 · carbs $3 · fat $4 g'],
  ['{n} ج · {n} سعرة', '$1 g · $2 kcal'],
  ['خطوات {*}', 'Steps for $1'],
  ['صباحي (فطار 7:30 – 9)', 'Early (breakfast 7:30 – 9)'],
  ['المعتاد (فطار 10 – 12)', 'Usual (breakfast 10 – 12)']
];

// ---------- كلمات وعبارات ثابتة ----------
const EN_PHRASES = Object.assign({}, FOOD_EN, {
  // عام
  'سعراتي': 'My Calories', 'اليوم': 'Today', 'خطتي': 'My plan', 'تقدمي': 'Progress', 'المزيد': 'More', 'تفضيلاتي': 'My preferences', 'النهاردة': 'Today', 'إمبارح': 'Yesterday',
  'التنقل': 'Navigation', 'اليوم اللي قبله': 'Previous day', 'اليوم اللي بعده': 'Next day', 'إغلاق': 'Close', 'رجوع': 'Back', 'إعدادات': 'Settings', 'حفظ': 'Save', 'تطبيق': 'Apply',
  'إضافة': 'Add', 'أضف': 'Add', 'أضف أكل': 'Add food', 'امسح': 'Delete', 'شيل': 'Remove', 'بحث': 'Search', 'الكل': 'All', 'الأخيرة': 'Recent', 'اقتراحات': 'Suggestions', 'وجباتي': 'My meals',
  'سجّل': 'Log', 'عدّل': 'Edit', 'تعديل': 'Edit', 'الاسم': 'Name', 'من': 'From', 'إلى': 'To', 'أو': 'or', 'جرام': 'grams', 'جم': 'g', 'كجم': 'kg', 'كجم/يوم': 'kg/day', 'الكمية': 'Amount', 'الوحدة': 'Unit', 'التاريخ': 'Date',
  'الكمية بالجرام': 'Amount in grams', 'الكمية (جرام)': 'Amount (grams)', 'الساعة': 'at', 'ص': 'AM', 'م': 'PM',
  // الأيام والوجبات
  'السبت': 'Saturday', 'الأحد': 'Sunday', 'الاثنين': 'Monday', 'الثلاثاء': 'Tuesday', 'الأربعاء': 'Wednesday', 'الخميس': 'Thursday', 'الجمعة': 'Friday',
  'فطار': 'Breakfast', 'غدا': 'Lunch', 'عشا': 'Dinner', 'سناكس': 'Snack', 'سحور': 'Suhoor', 'إفطار': 'Iftar', 'عشاء': 'Dinner', 'عشاء (بعد التراويح)': 'Dinner (after Taraweeh)',
  // التغذية
  'سعرة': 'kcal', 'سعرات': 'calories', 'السعرات': 'Calories', 'بروتين': 'protein', 'كارب': 'carbs', 'كربوهيدرات': 'carbs', 'دهون': 'fat', 'الهدف': 'goal', 'هدفك': 'your goal',
  'سعرة متبقية': 'Calories left', 'سعرة زيادة': 'Calories over', 'متبقي': 'left', 'سعرة/100ج': 'kcal/100g', 'كوب': 'cup', 'خطوة': 'steps',
  // اليوم
  'اكتب اللي أكلته: رغيفين فول وبيضتين': 'Type what you ate: 2 eggs and a cup of milk', 'سجّل أكلك بالكتابة': 'Log your food by typing',
  'يوم تمرين': 'Training day', 'يوم راحة': 'Rest day', 'اختار يوم تمرين لو هتتمرن، والكارب هيزيد.': 'Pick training day if you will work out, and carbs will go up.',
  'المدرب جاهز يحدّث هدفك': 'The coach is ready to update your goal', 'حلّل وزنك وأكلك وعنده تقدير جديد لحرقك.': 'It analyzed your weight and food and has a new estimate of your burn.', 'شوف التحديث': 'See the update',
  'الوجبة الجاية': 'Next meal', 'خلصت وجبات النهاردة.': "You're done with today's meals.", 'على الهدف': 'On target', 'احفظ كوجبة': 'Save as meal', 'بدّل أو عدّل': 'Swap or edit',
  'المياه': 'Water', 'خطوات المشي': 'Steps', 'شيل كوب': 'Remove a cup', '+ كوب': '+ cup', 'سجّل الخطوات': 'Log steps', 'عدّل الخطوات': 'Edit steps', 'عدد الخطوات': 'Number of steps', 'مثلا 6500': 'e.g. 6500',
  'اقرأ الرقم من تطبيق الصحة في موبايلك (Google Fit أو Samsung Health أو Apple Health) واكتبه هنا. التطبيق مش بيقدر يقرا عدّاد الخطوات لوحده.': 'Read the number from the health app on your phone (Google Fit, Samsung Health or Apple Health) and type it here. The app cannot read the step counter by itself.',
  // تسجيل سريع
  'تأكيد التسجيل': 'Confirm logging', 'مفهمتش أي أكلة من اللي كتبته.': "I didn't recognize any food in what you typed.", 'على أنهي وجبة؟': 'Which meal?', 'أضف للوجبة': 'Add to meal',
  'جرّب اسم تاني، أو ضيفها بزرار + تحت الوجبة.': 'Try another name, or add it with the + button under the meal.', 'مفهمتش:': "Didn't understand:",
  // إضافة أكل
  'إضافة إلى': 'Add to', 'اقتراحات تانية': 'More suggestions', 'إضافة الوجبة دي': 'Add this meal', 'إدخال يدوي': 'Manual entry', 'باركود': 'Barcode', 'نسخ وجبة أمس': "Copy yesterday's meal",
  'اضغط على أي مكوّن عشان تبدّله أو تعدّل كميته.': "Tap any ingredient to swap it or change its amount.", 'ابحث عن أكلة...': 'Search for a food...',
  'مفيش نتائج. جرّب الإدخال اليدوي.': 'No results. Try manual entry.', 'مفيش وجبات محفوظة. اضغط ☆ على أي وجبة.': 'No saved meals. Tap ☆ on any meal.', 'مفيش بدائل': 'No alternatives',
  'معرفتش أركّب وجبة بتفضيلاتك. خفّف اللي مش بتحبه من "تفضيلاتي".': 'I could not build a meal with your preferences. Relax your dislikes in "My preferences".',
  'إدخال يدوي (سعرات وماكروز)': 'Manual entry (calories and macros)', 'الاسم (اختياري)': 'Name (optional)', 'السعرات': 'Calories', 'أكلة': 'Food',
  'بدّل بـ': 'Swap with', 'نفس السعرات': 'Same calories', 'نفس الجرامات': 'Same grams', 'عشان تكمّل الوجبة': 'To complete the meal',
  'دي أكلة يدوية. امسحها وضيفها تاني بالكمية الجديدة.': 'This is a manual entry. Delete it and add it again with the new amount.',
  // الخطة
  'اقترح لي اليوم ده': 'Suggest this day for me', 'الأسبوع كله': 'Whole week', 'المشتريات': 'Shopping list', 'انسخ اليوم ده ليوم تاني': 'Copy this day to another day',
  'مشتريات الأسبوع': "This week's shopping", 'الجدول فاضي': 'The plan is empty', 'هيتم استبدال اليوم الحالي. تكمل؟': 'This will replace the current day. Continue?', 'هيتم استبدال الأسبوع كله. تكمل؟': 'This will replace the whole week. Continue?',
  'اليوم ده فاضي': 'This day is empty', 'انسخ ليوم رقم؟': 'Copy to which day number?', 'اسم الوجبة؟': 'Meal name?', 'اتحفظت في وجباتي ✅': 'Saved to My meals ✅',
  'الكميات للأكل النيّ/المطبوخ حسب الجرامات المسجلة.': 'Amounts follow the grams logged (raw/cooked as entered).', 'إدخال يدوي:': 'Manual entries:', 'كجم': 'kg',
  // التقدم
  'ماشي صح': 'On track', 'أبطأ من هدفك': 'Slower than your goal', 'أسرع من اللازم': 'Faster than needed', 'وزنك بيزيد': 'Your weight is rising', 'وزنك بينزل': 'Your weight is falling',
  'وزنك ثابت تقريبا زي هدفك.': 'Your weight is about steady, like your goal.', 'بنتابع تقدمك': "We're tracking your progress",
  'هدفك اليومي': 'Your daily goal', 'حدّث هدفي من بياناتي': 'Update my goal from my data', 'وزنك': 'Your weight', 'سجّل الوزن': 'Log weight', 'سجل الوزن': 'Weight history', 'الوزن': 'Weight', 'كجم)': 'kg)',
  'سجّل أول وزن عشان يظهر الرسم.': 'Log your first weight to see the chart.', 'آخر 7 أيام': 'Last 7 days', 'الخطوات آخر 7 أيام': 'Steps, last 7 days', 'تقرير الأسبوع': 'Weekly report', 'لا يوجد': 'None',
  'سجّل وزنك 3 مرات على الأقل خلال أسبوع، وسجّل أكلك، وهقولك لو ماشي صح.': "Log your weight at least 3 times in a week, log your food, and I'll tell you if you're on track.",
  'محتاج 3 قياسات وزن على الأقل خلال آخر 3 أسابيع.': 'Needs at least 3 weigh-ins in the last 3 weeks.', 'محتاج قياسات وزن موزعة على 7 أيام على الأقل.': 'Needs weigh-ins spread over at least 7 days.',
  'سجّل أكلك 5 أيام على الأقل (أكتر من 800 سعرة في اليوم).': 'Log your food on at least 5 days (over 800 kcal per day).',
  'استمر! الالتزام هو سر النتيجة.': 'Keep going! Consistency is the key to results.', 'ممتاز! التزامك عالي الأسبوع ده 👏': 'Excellent! Your consistency was high this week 👏',
  'بتاكل أقل بكتير من هدفك. الأكل القليل جدا بيبطّأ الحرق ويصعّب الالتزام.': "You're eating far below your goal. Eating too little slows your metabolism and makes sticking to it harder.",
  'بروتينك أقل من هدفك. زوّد صدور فراخ أو تونة أو زبادي يوناني أو بيض.': 'Your protein is below your goal. Add chicken breast, tuna, Greek yogurt or eggs.',
  'سجّل أكلك كام يوم عشان يظهر التقرير.': 'Log your food for a few days to see the report.', 'أيام مسجّلة': 'Days logged', 'متوسط السعرات': 'Average calories', 'متوسط البروتين': 'Average protein',
  'أيام على الهدف (±10%)': 'Days on target (±10%)', 'متوسط المياه': 'Average water', 'متوسط الخطوات': 'Average steps', 'تغير الوزن': 'Weight change', 'الترند (بيتجاهل تذبذب الماء اليومي)': 'Trend (ignores daily water swings)',
  // ملفي / الإعدادات
  'أهلا! خلينا نحسب سعراتك 🥗': "Welcome! Let's work out your calories 🥗", 'بياناتي وهدفي': 'My details and goal', 'النوع': 'Sex', 'ذكر': 'Male', 'أنثى': 'Female', 'السن': 'Age', 'الطول (سم)': 'Height (cm)', 'الوزن (كجم)': 'Weight (kg)',
  'مستوى النشاط': 'Activity level', 'الهدف': 'Goal', 'حفظ وحساب': 'Save and calculate', 'اكتب السن والطول والوزن صح': 'Enter a valid age, height and weight',
  'قليل الحركة (مكتبي)': 'Sedentary (desk job)', 'نشاط خفيف (1-3 مرات أسبوعيا)': 'Lightly active (1-3 times a week)', 'نشاط متوسط (3-5 مرات)': 'Moderately active (3-5 times)', 'نشاط عالي (6-7 مرات)': 'Very active (6-7 times)',
  'نزول سريع (0.75 كجم/أسبوع)': 'Fast loss (0.75 kg/week)', 'نزول (0.5 كجم/أسبوع)': 'Loss (0.5 kg/week)', 'نزول بطيء (0.25 كجم/أسبوع)': 'Slow loss (0.25 kg/week)', 'ثبات الوزن': 'Maintain weight',
  'زيادة بطيئة (0.25 كجم/أسبوع)': 'Slow gain (0.25 kg/week)', 'زيادة (0.5 كجم/أسبوع)': 'Gain (0.5 kg/week)',
  'أهدافك اليومية': 'Your daily targets', 'اللغة': 'Language', 'اللغة / Language': 'Language', 'العربية': 'العربية', 'مواعيد الوجبات': 'Meal times', 'فعّل المواعيد': 'Enable meal times',
  'مواعيد مقترحة وتقدر تغيرها. الميعاد بيظهر جنب كل وجبة وبيقولك الوجبة الجاية.': 'Suggested times that you can change. The time shows next to each meal and tells you the next meal.',
  'رمضان': 'Ramadan', 'أيام التمرين': 'Training days', 'في يوم التمرين الكارب بيزيد، وفي الراحة بيقل، ومتوسط الأسبوع ثابت.': 'On training days carbs go up, on rest days they go down, and the weekly average stays the same.',
  'الصيام المتقطع': 'Intermittent fasting', 'ابدأ صيام': 'Start fasting', 'أنهي الصيام': 'End fast', 'ساعة': 'hours',
  'تفضيلاتي الغذائية': 'My food preferences', 'تعديل التفضيلات': 'Edit preferences', 'وجباتي المحفوظة': 'My saved meals', 'اضغط ☆ على أي وجبة عشان تحفظها.': 'Tap ☆ on any meal to save it.',
  'أطعمتي': 'My foods', '+ أكلة جديدة': '+ New food', '🍲 وصفة من مكوّنات': '🍲 Recipe from ingredients', 'أكلة جديدة': 'New food', 'البيانات': 'Data',
  'كل بياناتك محفوظة على جهازك فقط. القيم الغذائية تقريبية وليست نصيحة طبية.': 'All your data is stored on your device only. Nutrition values are approximate and not medical advice.',
  'تصدير نسخة احتياطية': 'Export backup', 'استيراد': 'Import', 'الملف مش صالح': 'Invalid file', 'إعدادات': 'Settings',
  'وضع رمضان (إفطار / عشاء / سحور)': 'Ramadan mode (iftar / dinner / suhoor)', 'الهدف اليومي للخطوات': 'Daily step goal',
  // تفضيلات
  'إيه الأكل اللي بتفضله؟': 'What foods do you prefer?', 'تم': 'Done', 'تخطي': 'Skip', 'يلا نبدأ': "Let's start",
  'اضغط على الأكلة: مرة = ❤️ بحبها، مرتين = 🚫 مش بحبها، تالت مرة = محايد. هنركّب لك وجبات من اللي بتحبه ومضبوطة على سعراتك وماكروزك، ومش هنقترح عليك اللي مش بتحبه.': "Tap a food: once = ❤️ I like it, twice = 🚫 I dislike it, third time = neutral. We'll build meals from what you like, matched to your calories and macros, and won't suggest what you dislike.",
  '🍗 بروتين': '🍗 Protein', '🍚 نشويات': '🍚 Starches', '🥗 خضار': '🥗 Vegetables', '🍎 فاكهة': '🍎 Fruit', '🥛 ألبان وسناكس': '🥛 Dairy and snacks', '🍽️ أكلات كاملة': '🍽️ Complete dishes',
  // وصفات وباركود وتبديل
  'وصفة جديدة': 'New recipe', '🍲 وصفة جديدة': '🍲 New recipe', 'اسم الوصفة': 'Recipe name', 'عدد الحصص': 'Number of servings', 'مكوّن': 'Ingredient', '+ مكوّن': '+ Ingredient', 'حفظ الوصفة': 'Save recipe', 'حصة': 'serving', 'وصفة': 'Recipe',
  'اكتب اسم الوصفة وضيف مكوّن واحد على الأقل': 'Enter a recipe name and add at least one ingredient',
  'مسح باركود': 'Scan barcode', '📷 مسح باركود': '📷 Scan barcode', '📷 باركود': '📷 Barcode', 'أو اكتب رقم الباركود': 'Or type the barcode number', 'رقم الباركود': 'Barcode number',
  'أول مرة تمسح منتج بتدخل بياناته من العبوة، وبعدها التطبيق يتعرف عليه لوحده. كله محفوظ على جهازك.': 'The first time you scan a product, you enter its details from the package; after that the app recognizes it on its own. Everything stays on your device.',
  'المسح بالكاميرا مش متاح على المتصفح ده. اكتب الرقم يدويا.': 'Camera scanning is not available in this browser. Type the number manually.', 'معرفتش أفتح الكاميرا. اكتب الرقم يدويا.': "I couldn't open the camera. Type the number manually.",
  'منتج جديد · باركود': 'New product · barcode', '(القيم لكل 100 جم)': '(values per 100 g)', 'أكلة جديدة (القيم لكل 100 جم)': 'New food (values per 100 g)',
  '🔄': '🔄', 'تأكد': 'Confirm',
  // مواعيد
  'المعتاد (فطار 10 – 12)': 'Usual (breakfast 10 – 12)', 'صباحي (فطار 7:30 – 9)': 'Early (breakfast 7:30 – 9)',
  // نسخ احتياطي/تقني
  'الأخضر': 'Green',
  'لتر': 'L', 'مل': 'ml', 'كمية المياه اللي عايز تشربها يوميا (لتر)': 'How much water you want to drink daily (liters)', 'حجم الكوب': 'Cup size',
  'بتتحسب تلقائي في تطبيق أندرويد': 'Counted automatically in the Android app', 'محتاج Health Connect': 'Needs Health Connect', 'اضغط لتفعيل الخطوات': 'Tap to enable steps', 'تلقائي من Health Connect': 'Automatic via Health Connect', 'اضغط للتفاصيل': 'Tap for details',
  'بتتحسب تلقائي في تطبيق أندرويد بس.': 'Counted automatically in the Android app only.', 'متصل بـ Health Connect ✓': 'Connected to Health Connect ✓', 'Health Connect مش متاح على موبايلك.': 'Health Connect is not available on your phone.',
  'محتاج صلاحية قراءة الخطوات.': 'Needs permission to read steps.', 'بنتأكد من الاتصال…': 'Checking the connection…', 'اسمح بالوصول للخطوات': 'Allow access to steps', 'نزّل Health Connect': 'Get Health Connect', 'حدّث الآن': 'Refresh now',
  'متصل، لكن مفيش خطوات متسجلة النهاردة في Health Connect. لازم Google Fit أو Samsung Health يكون بيسجل خطواتك.': 'Connected, but no steps are recorded today in Health Connect. Google Fit or Samsung Health must be recording your steps.',
  'الخطوات بتتحسب لوحدها من Health Connect. محتاج تطبيق بيسجّل خطواتك فيه (Google Fit أو Samsung Health).': 'Steps are counted automatically from Health Connect. You need an app that records your steps there (Google Fit or Samsung Health).',
  'هدف المياه والخطوات بتعدّله من شاشة اليوم: اضغط على مربع المياه أو الخطوات.': 'Edit your water and step goals from the Today screen: tap the water or steps tile.',
  'الخطوات': 'Steps', 'الأكل': 'Food', 'إنجاز النهاردة': "Today's progress", 'يوم ممتاز: المياه والأكل والخطوات على الهدف تقريبا.': 'Excellent day: water, food and steps are about on target.',
  'كويس، لسه فيه حاجات ناقصة:': 'Good, a few things are still missing:', 'لسه قدامك شوية النهاردة:': 'You still have some way to go today:',
  'مياه': 'Water',
  'تحديث': 'Refresh', 'الخطوات بتتحدّث تلقائي من Health Connect. تقدر تكتب رقم يدوي لو عايز.': 'Steps update automatically from Health Connect. You can type a number manually if you like.',
  'سجّله في': 'Log it to', 'اليوم المعروض': 'the displayed day', 'هدف الوجبة ≈': 'Meal target ≈', 'الوجبة بعد الإضافة': 'Meal after adding', 'الوجبة كلها': 'Whole meal', 'بعد الإضافة': 'after adding',
  'آخر وزن': 'Last weight', 'الترند': 'Trend', 'الحرق': 'Burn', 'صايم من': 'Fasting for', 'بحبها': 'liked', 'مش بحبها': 'disliked', 'الاقتراحات والجدول بيتبنوا عليها': 'Suggestions and your plan are built on these', 'خطوات': 'Steps for'
});

// ---------- تجهيز الأنماط ----------
const esc_ = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function compilePattern(src) {
  let re = esc_(src).replace(/\\\{n\\\}/g, '([\\d.,+\\-−]+)').replace(/\\\{\*\\\}$/, '(.+)').replace(/\\\{\*\\\}/g, '(.+?)');
  re = re.replace(/\s+/g, '\\s+');
  return new RegExp(re, 'g');
}
const PAT = EN_PATTERNS.map(([a, e]) => [compilePattern(a), e]).sort((x, y) => y[0].source.length - x[0].source.length);
// تعبيرات "× وحدة" عشان الحصة تبقى مفردة
const SERV_EN_PAT = Object.entries(SERV_EN).sort((a, b) => b[0].length - a[0].length).map(([a, e]) => [new RegExp('×\\s*' + esc_(a) + '(?![\\u0600-\\u06FF])', 'g'), '× ' + e]);
const PHR = Object.entries(Object.assign({}, EN_PHRASES, SERV_EN, FOOD_EN))
  .sort((a, b) => b[0].length - a[0].length)
  .map(([a, e]) => [new RegExp('(?<![\\u0600-\\u06FF])' + esc_(a).replace(/\s+/g, '\\s+') + '(?![\\u0600-\\u06FF])', 'g'), e]);

function trText(s) {
  if (!AR_RE.test(s)) return s;
  for (const [re, e] of PAT) s = s.replace(re, e);
  for (const [re, e] of SERV_EN_PAT) s = s.replace(re, e);
  s = s.replace(/(\d)\s*كوب(?![؀-ۿ])/g, '$1 cups');
  for (const [re, e] of PHR) s = s.replace(re, e);
  s = s.replace(/(\d)ج(?![؀-ۿ])/g, '$1 g').replace(/(\d) g\b/g, '$1 g');
  return s.replace(/^((?:[^\sA-Za-z0-9؀-ۿ]{1,4}\s)?)([a-z])/, (m, a, b) => a + b.toUpperCase());
}
const tr = s => (isEN() ? trText(String(s)) : s);

// نوافذ alert/confirm/prompt
(function () {
  const a = window.alert.bind(window), c = window.confirm.bind(window), p = window.prompt.bind(window);
  window.alert = m => a(tr(m)); window.confirm = m => c(tr(m)); window.prompt = (m, d) => p(tr(m), d === undefined ? d : tr(d));
})();

// ترجمة الـ DOM
const TR_ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
function trNode(n) {
  if (n.nodeType === 3) { const v = n.nodeValue; if (AR_RE.test(v)) { const t = trText(v); if (t !== v) n.nodeValue = t; } return; }
  if (n.nodeType !== 1 || n.tagName === 'SCRIPT' || n.tagName === 'STYLE') return;
  for (const a of TR_ATTRS) { const v = n.getAttribute(a); if (v && AR_RE.test(v)) n.setAttribute(a, trText(v)); }
  n.childNodes.forEach(trNode);
}
let trObs = null;
function applyDir() {
  const en = isEN(), h = document.documentElement;
  h.lang = en ? 'en' : 'ar'; h.dir = en ? 'ltr' : 'rtl';
  document.title = en ? 'My Calories' : 'سعراتي';
  const tc = document.querySelector('meta[name=theme-color]'); if (tc) tc.content = '#10231F';
}
function startTranslator() {
  applyDir();
  if (!trObs) {
    trObs = new MutationObserver(recs => {
      if (!isEN()) return;
      recs.forEach(r => { r.addedNodes.forEach(trNode); if (r.type === 'characterData') trNode(r.target); });
      trObs.takeRecords();
    });
    trObs.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  if (isEN()) trNode(document.body);
}
