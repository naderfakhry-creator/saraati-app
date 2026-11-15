// بيبني ملف APK للتجربة (debug) بأمر واحد: npm run apk
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const run = (cmd, cwd) => execSync(cmd, { stdio: 'inherit', cwd: cwd || root, shell: true });

if (!fs.existsSync(path.join(root, 'android'))) run('npx cap add android');
run('node scripts/build-web.js');
run('npx cap sync android');
const win = process.platform === 'win32';
run(win ? 'gradlew.bat assembleDebug' : './gradlew assembleDebug', path.join(root, 'android'));

const apk = path.join(root, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
console.log(fs.existsSync(apk) ? '\nالـ APK جاهز: ' + apk : '\nالبناء خلص لكن مش لاقي الـ APK. راجع الرسايل اللي فوق.');
