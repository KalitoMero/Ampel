import { useState, useEffect } from 'react';
import { Save, Settings } from 'lucide-react';
import { getOEESettings, updateOEESettings, OEESettings as IOEESettings } from '../utils/oeeQueries';

export function OEESettings() {
  const [settings, setSettings] = useState<IOEESettings>({
    default_planned_production_time: 16,
    default_ideal_cycle_time: 1.0,
    default_target_oee: 85,
    green_min_oee: 85,
    yellow_min_oee: 70,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getOEESettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({
        type: 'error',
        text: 'Fehler beim Laden der Einstellungen',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      await updateOEESettings(settings);
      setMessage({
        type: 'success',
        text: 'Einstellungen erfolgreich gespeichert',
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({
        type: 'error',
        text: 'Fehler beim Speichern der Einstellungen',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-lg text-slate-600">Lade Einstellungen...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex items-center gap-3 mb-8">
        <Settings size={32} className="text-blue-600" />
        <h1 className="text-4xl font-bold text-slate-800">OEE Einstellungen</h1>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4">Standardwerte</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Geplante Produktionszeit (Stunden/Tag)
              </label>
              <input
                type="number"
                step="0.1"
                value={settings.default_planned_production_time}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    default_planned_production_time: parseFloat(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                Standard: 16 Stunden (2 Schichten)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Ideale Zykluszeit (Minuten/Stück)
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.default_ideal_cycle_time}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    default_ideal_cycle_time: parseFloat(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                Zeit, die eine Maschine idealerweise pro Teil benötigt
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4">Zielvorgaben & Ampel</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Ziel-OEE (%)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={settings.default_target_oee}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    default_target_oee: parseFloat(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                Ziel-OEE für alle Maschinen
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <span className="inline-flex items-center gap-2">
                  Grün ab (%)
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                </span>
              </label>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={settings.green_min_oee}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    green_min_oee: parseFloat(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                Mindest-OEE für grünen Status
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <span className="inline-flex items-center gap-2">
                  Gelb ab (%)
                  <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                </span>
              </label>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={settings.yellow_min_oee}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    yellow_min_oee: parseFloat(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                Mindest-OEE für gelben Status
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">OEE Berechnung</h3>
          <p className="text-sm text-blue-800 leading-relaxed">
            <strong>OEE = Verfügbarkeit × Leistung × Qualität</strong><br />
            • <strong>Verfügbarkeit:</strong> (Laufzeit / Geplante Produktionszeit) × 100<br />
            • <strong>Leistung:</strong> (Ideale Produktionszeit / Laufzeit) × 100<br />
            • <strong>Qualität:</strong> (Gutteile / Gesamtteile) × 100
          </p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={20} />
            {saving ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  );
}
