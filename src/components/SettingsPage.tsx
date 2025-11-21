import { useState, useEffect } from 'react';
import { Save, CheckCircle, Settings as SettingsIcon } from 'lucide-react';
import { supabase, TrafficLightSettings, getUserId } from '../lib/supabase';

export function SettingsPage() {
  const [settings, setSettings] = useState<TrafficLightSettings>({
    setting_key: 'hours_14d',
    target_hours_14d: 450,
    green_min_ratio: 0.95,
    yellow_min_ratio: 0.80,
  });
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('traffic_light_settings')
        .select('*')
        .eq('setting_key', 'hours_14d')
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        setSettings(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Einstellungen');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError('');
    setIsSaved(false);

    if (settings.target_hours_14d <= 0) {
      setError('Zielstunden müssen größer als 0 sein');
      return;
    }

    if (settings.green_min_ratio < 0 || settings.green_min_ratio > 1) {
      setError('Grenzwert Grün muss zwischen 0 und 1 liegen');
      return;
    }

    if (settings.yellow_min_ratio < 0 || settings.yellow_min_ratio > 1) {
      setError('Grenzwert Gelb muss zwischen 0 und 1 liegen');
      return;
    }

    if (settings.yellow_min_ratio >= settings.green_min_ratio) {
      setError('Grenzwert Gelb muss kleiner als Grenzwert Grün sein');
      return;
    }

    try {
      const userId = await getUserId();
      const updateData = {
        user_id: userId,
        setting_key: 'hours_14d',
        target_hours_14d: settings.target_hours_14d,
        green_min_ratio: settings.green_min_ratio,
        yellow_min_ratio: settings.yellow_min_ratio,
        updated_at: new Date().toISOString(),
      };

      const { error: saveError } = await supabase
        .from('traffic_light_settings')
        .upsert(updateData, { onConflict: 'setting_key' });

      if (saveError) throw saveError;

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern der Einstellungen');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <p className="text-slate-600">Lade Einstellungen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-3 mb-8">
          <SettingsIcon size={32} className="text-slate-700" />
          <h2 className="text-3xl font-bold text-slate-800">Einstellungen: Geleistete Stunden</h2>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Ampellogik für 14-Tage-Zeitraum
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Die Ampelfarbe wird basierend auf dem Verhältnis der tatsächlichen zu den Zielstunden berechnet.
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Zielstunden für 14 Tage
                </label>
                <input
                  type="number"
                  value={settings.target_hours_14d}
                  onChange={(e) =>
                    setSettings({ ...settings, target_hours_14d: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                  step="1"
                  min="1"
                />
                <p className="mt-1 text-sm text-slate-500">
                  Beispiel: 450 Stunden für 14 Tage
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Grenzwert Grün (Mindestquote)
                  </label>
                  <input
                    type="number"
                    value={settings.green_min_ratio}
                    onChange={(e) =>
                      setSettings({ ...settings, green_min_ratio: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                    step="0.01"
                    min="0"
                    max="1"
                  />
                  <p className="mt-1 text-sm text-slate-500">
                    Beispiel: 0.95 = 95% (≥{(settings.green_min_ratio * settings.target_hours_14d).toFixed(0)}h → Grün)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Grenzwert Gelb (Mindestquote)
                  </label>
                  <input
                    type="number"
                    value={settings.yellow_min_ratio}
                    onChange={(e) =>
                      setSettings({ ...settings, yellow_min_ratio: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                    step="0.01"
                    min="0"
                    max="1"
                  />
                  <p className="mt-1 text-sm text-slate-500">
                    Beispiel: 0.80 = 80% (≥{(settings.yellow_min_ratio * settings.target_hours_14d).toFixed(0)}h → Gelb, darunter → Rot)
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-6">
            <h4 className="font-semibold text-slate-800 mb-3">Ampellogik Übersicht:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500"></div>
                <span className="text-slate-700">
                  <strong>Grün:</strong> Tatsächliche Stunden ≥ {(settings.green_min_ratio * 100).toFixed(0)}% vom Ziel
                  (≥ {(settings.green_min_ratio * settings.target_hours_14d).toFixed(0)}h)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-yellow-400"></div>
                <span className="text-slate-700">
                  <strong>Gelb:</strong> Tatsächliche Stunden ≥ {(settings.yellow_min_ratio * 100).toFixed(0)}% vom Ziel
                  (≥ {(settings.yellow_min_ratio * settings.target_hours_14d).toFixed(0)}h)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-red-500"></div>
                <span className="text-slate-700">
                  <strong>Rot:</strong> Tatsächliche Stunden &lt; {(settings.yellow_min_ratio * 100).toFixed(0)}% vom Ziel
                  (&lt; {(settings.yellow_min_ratio * settings.target_hours_14d).toFixed(0)}h)
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          {isSaved && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2 text-green-700">
              <CheckCircle size={20} />
              <span>Einstellungen erfolgreich gespeichert!</span>
            </div>
          )}

          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-lg font-medium"
          >
            <Save size={24} />
            Einstellungen speichern
          </button>
        </div>
      </div>
    </div>
  );
}
