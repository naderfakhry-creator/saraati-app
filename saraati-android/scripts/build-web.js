// بيجمّع ملفات تطبيق الويب (من مجلد calorie-app) في مجلد www، ويضيف جسر الخطوات (Health Connect)
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const src = process.env.WEB_SRC || path.resolve(root, '..', 'calorie-app');
const out = path.join(root, 'www');

if (!fs.existsSync(path.join(src, 'index.html'))) {
  console.error('مش لاقي تطبيق الويب في: ' + src + '\nحط مجلد calorie-app جنب saraati-android، أو حدّد المسار: WEB_SRC=<المسار>');
  process.exit(1);
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const keep = /\.(html|js|css|json|svg)$/i;
let n = 0;
for (const f of fs.readdirSync(src)) {
  if (!keep.test(f) || f.includes('.bak') || f === 'sw.js') continue; // الـ service worker مش لازم جوه التطبيق
  fs.copyFileSync(path.join(src, f), path.join(out, f));
  n++;
}

// سياسة الخصوصية (مطلوبة لـ Health Connect)
fs.copyFileSync(path.join(root, 'native', 'privacypolicy.html'), path.join(out, 'privacypolicy.html'));

// جسر الخطوات
require('esbuild').buildSync({
  entryPoints: [path.join(root, 'native', 'steps-bridge.js')],
  bundle: true,
  format: 'iife',
  minify: true,
  outfile: path.join(out, 'steps-bridge.js')
});

// ضيف الجسر قبل app.js
const idx = path.join(out, 'index.html');
let html = fs.readFileSync(idx, 'utf8');
if (!html.includes('steps-bridge.js')) html = html.replace(/<script src="app\.js/, '<script src="steps-bridge.js"></script>\n<script src="app.js');
fs.writeFileSync(idx, html);

console.log('تم: ' + n + ' ملف اتنسخوا من ' + src + ' إلى ' + out);
