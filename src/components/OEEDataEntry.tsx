import { useState, useEffect } from 'react';
import { Save, Plus, Calendar } from 'lucide-react';
import { saveOEEData, getOEESettings, OEESettings } from '../utils/oeeQueries';

export function OEEDataEntry() {
  const [settings, setSettings] = useState<OEESettings | null>(null);
  const [formData, setFormData] = useState({
    machine_name: '',
    date: new Date().toISOString().split('T')[0],
    planned_production_time: 16,
    downtime: 0,
    good_pieces: 0,
    total_pieces: 0,
    ideal_cycle_time: 1.0,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getOEESettings();
      setSettings(data);
      setFormData((prev) => ({
        ...prev,
        planned_production_time: data.default_planned_production_time,
        ideal_cycle_time: data.default_ideal_cycle_time,
      }));
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.machine_name.trim()) {
      setMessage({
        type: 'error',
        text: 'Bitte Maschinenname eingeben',
      });
      return;
    }

    if (formData.total_pieces < formData.good_pieces) {
      setMessage({
        type: 'error',
        text: 'Gesamtteile müssen mindestens so groß sein wie Gutteile',
      });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await saveOEEData(formData);
      setMessage({
        type: 'success',
        text: 'OEE-Daten erfolgreich gespeichert',
      });

      setFormData({
        machine_name: '',
        date: new Date().toISOString().split('T')[0],
        planned_production_time: settings?.default_planned_production_time || 16,
        downtime: 0,
        good_pieces: 0,
        total_pieces: 0,
        ideal_cycle_time: settings?.default_ideal_cycle_time || 1.0,
      });

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving OEE data:', error);
      setMessage({
        type: 'error',
        text: 'Fehler beim Speichern der Daten',
      });
    } finally {
      setSaving(false);
    }
  };

  const calculatePreview = () => {
    const runTime = formData.planned_production_time - formData.downtime;
    const availability = formData.planned_production_time > 0
      ? (runTime / formData.planned_production_time) * 100
      : 0;

    const idealProductionTime = (formData.total_pieces * formData.ideal_cycle_time) / 60;
    const performance = runTime > 0 && idealProductionTime > 0
      ? (idealProductionTime / runTime) * 100
      : 0;

    const quality = formData.total_pieces > 0
      ? (formData.good_pieces / formData.total_pieces) * 100
      : 0;

    const oee = (availability * performance * quality) / 10000;

    return {
      availability: Math.min(availability, 100),
      performance: Math.min(performance, 100),
      quality: Math.min(quality, 100),
      oee: Math.min(oee, 100),
    };
  };

  const preview = calculatePreview();

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex items-center gap-3 mb-8">
        <Plus size={32} className="text-blue-600" />
        <h1 className="text-4xl font-bold text-slate-800">OEE-Daten erfassen</h1>
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

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4">Grunddaten</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Maschine <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.machine_name}
                onChange={(e) =>
                  setFormData({ ...formData, machine_name: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="z.B. DMG 1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <span className="inline-flex items-center gap-2">
                  <Calendar size={16} />
                  Datum <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4">Zeiterfassung</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Geplante Produktionszeit (Stunden)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                value={formData.planned_production_time}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    planned_production_time: parseFloat(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Stillstandszeit (Stunden)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                value={formData.downtime}
                onChange={(e) =>
                  setFormData({ ...formData, downtime: parseFloat(e.target.value) })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                Ungeplante Stillstände, Störungen, Wartungen
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4">Produktion</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Gutteile
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.good_pieces}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    good_pieces: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Gesamtteile
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.total_pieces}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    total_pieces: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                Gutteile + Ausschuss
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Ideale Zykluszeit (Min./Stück)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.ideal_cycle_time}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ideal_cycle_time: parseFloat(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Berechnete Kennzahlen (Vorschau)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4">
              <p className="text-xs text-slate-600 mb-1">Verfügbarkeit</p>
              <p className="text-2xl font-bold text-green-600">{preview.availability.toFixed(1)}%</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-xs text-slate-600 mb-1">Leistung</p>
              <p className="text-2xl font-bold text-orange-600">{preview.performance.toFixed(1)}%</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-xs text-slate-600 mb-1">Qualität</p>
              <p className="text-2xl font-bold text-purple-600">{preview.quality.toFixed(1)}%</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-xs text-slate-600 mb-1">OEE</p>
              <p className="text-2xl font-bold text-blue-600">{preview.oee.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={20} />
            {saving ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </form>
    </div>
  );
}
