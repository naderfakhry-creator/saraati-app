// جسر قراءة الخطوات من Health Connect (بيشتغل جوه تطبيق أندرويد بس، وفي المتصفح مش بيتعرّف)
import { Capacitor } from '@capacitor/core';
import { Health } from '@capgo/capacitor-health';

if (Capacitor.isNativePlatform()) {
  const avail = async () => {
    try { return await Health.isAvailable(); } catch (e) { return { available: false, reason: String((e && e.message) || e) }; }
  };
  window.NativeSteps = {
    // state: ok | denied | unknown | unavailable
    async status() {
      const a = await avail();
      if (!a || !a.available) return { state: 'unavailable', reason: (a && a.reason) || '' };
      try {
        const r = await Health.checkAuthorization({ read: ['steps'] });
        const ok = (r && (r.readAuthorized || r.authorizedRead)) || [];
        const no = (r && (r.readDenied || r.deniedRead)) || [];
        if (Array.isArray(ok) && ok.includes('steps')) return { state: 'ok' };
        if (Array.isArray(no) && no.includes('steps')) return { state: 'denied' };
      } catch (e) { /* مش قادر يتأكد: هنجرّب القراءة */ }
      return { state: 'unknown' };
    },
    async authorize() {
      await Health.requestAuthorization({ read: ['steps'] });
    },
    // إجمالي خطوات يوم محلي (التاريخ بصيغة YYYY-MM-DD)
    async stepsFor(dateStr) {
      const [y, m, d] = dateStr.split('-').map(Number);
      const start = new Date(y, m - 1, d, 0, 0, 0), end = new Date(y, m - 1, d + 1, 0, 0, 0);
      const res = await Health.queryAggregated({ dataType: 'steps', startDate: start.toISOString(), endDate: end.toISOString(), bucket: 'day', aggregation: 'sum' });
      return (res.samples || []).reduce((a, s) => a + (s.value || 0), 0);
    },
    installHealthConnect() {
      window.open('https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata', '_system');
    }
  };
}
