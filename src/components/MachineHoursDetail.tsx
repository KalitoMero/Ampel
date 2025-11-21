import { useState, useEffect } from 'react';
import { ArrowLeft, Activity } from 'lucide-react';
import { getMachineHoursSummary } from '../utils/machineHoursQueries';

interface MachineHours {
  machine: string;
  hours: number;
  percentage: number;
  targetHours: number;
  targetPercentage: number;
}

export type PeriodType = '14days' | 'week3and4' | '8weeks';

interface MachineHoursDetailProps {
  onBack: () => void;
  periodType: PeriodType;
}

export function MachineHoursDetail({ onBack, periodType }: MachineHoursDetailProps) {
  const [machineData, setMachineData] = useState<MachineHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalHours, setTotalHours] = useState(0);
  const [totalTargetHours, setTotalTargetHours] = useState(0);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    loadMachineData();
  }, [periodType]);

  const loadMachineData = async () => {
    try {
      const summary = await getMachineHoursSummary(periodType);

      const machineArray: MachineHours[] = summary.machineData.map((item) => ({
        machine: item.machine,
        hours: item.hours,
        percentage: summary.totalHours > 0 ? (item.hours / summary.totalHours) * 100 : 0,
        targetHours: item.targetHours,
        targetPercentage: item.percentage,
      }));

      setMachineData(machineArray);
      setTotalHours(summary.totalHours);
      setTotalTargetHours(summary.totalTargetHours);
      setDateRange({
        start: summary.startDate,
        end: summary.endDate,
      });
    } catch (error) {
      console.error('Error loading machine data:', error);
    } finally {
      setLoading(false);
    }
  };

  const maxHours = machineData.length > 0 ? machineData[0].hours : 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      <header className="p-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg"
        >
          <ArrowLeft size={20} />
          Zurück
        </button>
      </header>

      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Activity size={32} className="text-slate-700" />
            <h1 className="text-4xl font-bold text-slate-800">
              Maschinenstunden {periodType === '14days' ? '(14 Tage)' : periodType === 'week3and4' ? '(Woche 3 + 4)' : '(8 Wochen)'}
            </h1>
          </div>

          {dateRange.start && dateRange.end && (
            <p className="text-lg text-slate-600 mb-8">
              Zeitraum: {dateRange.start} - {dateRange.end}
            </p>
          )}

          {loading ? (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <p className="text-slate-600">Lade Daten...</p>
            </div>
          ) : machineData.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <p className="text-slate-600">Keine Daten verfügbar</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Geleistete Stunden</h2>
                  <p className="text-4xl font-bold text-slate-900">{totalHours.toFixed(1)}h</p>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Sollstunden</h2>
                  <p className="text-4xl font-bold text-slate-900">{totalTargetHours.toFixed(1)}h</p>
                  {totalTargetHours > 0 && (
                    <p className={`text-lg font-semibold mt-2 ${
                      (totalHours / totalTargetHours) * 100 >= 100
                        ? 'text-green-600'
                        : (totalHours / totalTargetHours) * 100 >= 80
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      {((totalHours / totalTargetHours) * 100).toFixed(1)}% erreicht
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Stunden pro Maschine</h2>
                <div className="space-y-6">
                  {machineData.map((item, index) => (
                    <div key={index} className="space-y-3 pb-6 border-b border-slate-200 last:border-b-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 text-lg">{item.machine}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-slate-600 font-medium">{item.hours.toFixed(1)}h / {item.targetHours.toFixed(1)}h</span>
                          {item.targetHours > 0 && (
                            <span className={`text-sm font-bold min-w-[4rem] text-right ${
                              item.targetPercentage >= 100
                                ? 'text-green-600'
                                : item.targetPercentage >= 80
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}>
                              {item.targetPercentage.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-600 w-16">Ist:</span>
                          <div className="relative flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden">
                            <div
                              className="absolute h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg transition-all"
                              style={{ width: `${(item.hours / maxHours) * 100}%` }}
                            />
                          </div>
                        </div>

                        {item.targetHours > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-600 w-16">Soll:</span>
                            <div className="relative flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden">
                              <div
                                className="absolute h-full bg-gradient-to-r from-slate-400 to-slate-500 rounded-lg transition-all"
                                style={{ width: `${(item.targetHours / maxHours) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
