import { useState, useEffect } from 'react';
import { ArrowLeft, Target, Save, AlertCircle } from 'lucide-react';
import { supabase, MachineTarget } from '../lib/supabase';

interface MachineTargetsProps {
  onBack: () => void;
}

export function MachineTargets({ onBack }: MachineTargetsProps) {
  const [machines, setMachines] = useState<MachineTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadMachines();
  }, []);

  const loadMachines = async () => {
    try {
      const { data, error } = await supabase
        .from('machine_targets')
        .select('*')
        .order('machine_name');

      if (error) throw error;

      setMachines(data || []);
    } catch (error) {
      console.error('Error loading machines:', error);
      setMessage({ type: 'error', text: 'Fehler beim Laden der Maschinen' });
    } finally {
      setLoading(false);
    }
  };

  const handleTargetChange = (machineId: string, newTarget: string) => {
    const targetValue = parseFloat(newTarget);
    if (isNaN(targetValue) || targetValue < 0) return;

    setMachines(prev =>
      prev.map(machine =>
        machine.id === machineId
          ? { ...machine, target_hours_14d: targetValue }
          : machine
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      for (const machine of machines) {
        const { error } = await supabase
          .from('machine_targets')
          .update({
            target_hours_14d: machine.target_hours_14d,
            updated_at: new Date().toISOString(),
          })
          .eq('id', machine.id!);

        if (error) throw error;
      }

      setMessage({ type: 'success', text: 'Zielstunden erfolgreich gespeichert' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving targets:', error);
      setMessage({ type: 'error', text: 'Fehler beim Speichern der Zielstunden' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      <header className="p-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg"
        >
          <ArrowLeft size={20} />
          Zurück
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={20} />
          {saving ? 'Speichern...' : 'Speichern'}
        </button>
      </header>

      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Target size={32} className="text-slate-700" />
            <h1 className="text-4xl font-bold text-slate-800">Maschinenziele verwalten</h1>
          </div>

          {message && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                message.type === 'success'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              <AlertCircle size={20} />
              {message.text}
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <p className="text-slate-600">Lade Maschinen...</p>
            </div>
          ) : machines.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <p className="text-slate-600">
                Keine Maschinen gefunden. Maschinen werden automatisch beim Import von Excel-Dateien angelegt.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <p className="text-slate-600 mb-6">
                Legen Sie die Zielstunden für jede Maschine für einen Zeitraum von 14 Tagen fest.
              </p>

              <div className="space-y-4">
                {machines.map((machine) => (
                  <div
                    key={machine.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-800 text-lg">
                        {machine.machine_name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="text-slate-600">Zielstunden (14 Tage):</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={machine.target_hours_14d}
                        onChange={(e) => handleTargetChange(machine.id!, e.target.value)}
                        className="w-32 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <span className="text-slate-600">h</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
