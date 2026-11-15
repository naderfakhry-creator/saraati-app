// جسر قراءة الخطوات من Health Connect (بيشتغل جوه تطبيق أندرويد بس، وفي المتصفح مش بيتعرّف)
import { Capacitor } from '@capacitor/core';
import { Health } from '@capgo/capacitor-health';

if (Capacitor.isNativePlatform()) {
  window.NativeSteps = {
    async available() {
      try { const a = await Health.isAvailable(); return !!(a && a.available); } catch (e) { return false; }
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
    }
  };
}
