import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { getScrapSettings, updateScrapSettings, ScrapSettings as ScrapSettingsType } from '../utils/scrapQueries';

export function ScrapSettings() {
  const [settings, setSettings] = useState<ScrapSettingsType>({
    week_target: 100,
    week_tolerance: 150,
    month_target: 400,
    month_tolerance: 600,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getScrapSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading scrap settings:', error);
      setMessage({
        type: 'error',
        text: 'Fehler beim Laden der Einstellungen',
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      await updateScrapSettings(settings);
      setMessage({
        type: 'success',
        text: 'Einstellungen erfolgreich gespeichert',
      });
    } catch (error) {
      console.error('Error saving scrap settings:', error);
      setMessage({
        type: 'error',
        text: 'Fehler beim Speichern der Einstellungen',
      });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleChange = (field: keyof ScrapSettingsType, value: string) => {
    const numValue = parseFloat(value) || 0;
    setSettings(prev => ({ ...prev, [field]: numValue }));
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold text-slate-800 mb-8">Ausschuss-Einstellungen</h1>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Wochenziele</h2>
          <div className="grid gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Zielwert (Grün)
              </label>
              <input
                type="number"
                value={settings.week_target}
                onChange={(e) => handleChange('week_target', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="100"
              />
              <p className="mt-1 text-sm text-slate-500">
                Ausschuss bis zu diesem Wert zeigt grün
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Toleranzwert (Gelb)
              </label>
              <input
                type="number"
                value={settings.week_tolerance}
                onChange={(e) => handleChange('week_tolerance', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="150"
              />
              <p className="mt-1 text-sm text-slate-500">
                Ausschuss zwischen Zielwert und diesem Wert zeigt gelb
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Monatsziele</h2>
          <div className="grid gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Zielwert (Grün)
              </label>
              <input
                type="number"
                value={settings.month_target}
                onChange={(e) => handleChange('month_target', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="400"
              />
              <p className="mt-1 text-sm text-slate-500">
                Ausschuss bis zu diesem Wert zeigt grün
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Toleranzwert (Gelb)
              </label>
              <input
                type="number"
                value={settings.month_tolerance}
                onChange={(e) => handleChange('month_tolerance', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="600"
              />
              <p className="mt-1 text-sm text-slate-500">
                Ausschuss zwischen Zielwert und diesem Wert zeigt gelb
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
          >
            <Save size={24} />
            {saving ? 'Speichern...' : 'Einstellungen speichern'}
          </button>
        </div>
      </div>
    </div>
  );
}
