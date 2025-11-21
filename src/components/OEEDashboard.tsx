import { useState, useEffect } from 'react';
import { Activity, TrendingUp, Clock, Target, AlertCircle } from 'lucide-react';
import { getOEEPeriodSummary, OEEPeriodSummary, TrafficLightColor } from '../utils/oeeQueries';

interface OEEDashboardProps {
  onSelectMachine?: (machineName: string) => void;
}

function TrafficLight({ color }: { color: TrafficLightColor }) {
  return (
    <div className="bg-gray-800 rounded-2xl p-4 flex-shrink-0">
      <div className="flex flex-col gap-3">
        <div className={`w-16 h-16 rounded-full transition-all ${color === 'green' ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-gray-700'}`} />
        <div className={`w-16 h-16 rounded-full transition-all ${color === 'yellow' ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50' : 'bg-gray-700'}`} />
        <div className={`w-16 h-16 rounded-full transition-all ${color === 'red' ? 'bg-red-500 shadow-lg shadow-red-500/50' : 'bg-gray-700'}`} />
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  color
}: {
  title: string;
  value: string;
  icon: any;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-600">{title}</h3>
        <Icon size={20} className={color} />
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export function OEEDashboard({ onSelectMachine }: OEEDashboardProps) {
  const [periodType, setPeriodType] = useState<'week' | '14days' | 'month'>('week');
  const [summary, setSummary] = useState<OEEPeriodSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [periodType]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getOEEPeriodSummary(periodType);
      setSummary(data);
    } catch (error) {
      console.error('Error loading OEE data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodLabel = () => {
    switch (periodType) {
      case 'week':
        return 'Diese Woche';
      case '14days':
        return 'Letzte 14 Tage';
      case 'month':
        return 'Dieser Monat';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-lg text-slate-600">Lade OEE-Daten...</div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <p className="text-slate-600">Keine OEE-Daten verfügbar</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity size={32} className="text-blue-600" />
          <h1 className="text-4xl font-bold text-slate-800">OEE Dashboard</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPeriodType('week')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              periodType === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            Woche
          </button>
          <button
            onClick={() => setPeriodType('14days')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              periodType === '14days'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            14 Tage
          </button>
          <button
            onClick={() => setPeriodType('month')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              periodType === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            Monat
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-start gap-6">
          <TrafficLight color={summary.color} />

          <div className="flex-1">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">{getPeriodLabel()}</h2>
              <p className="text-slate-600">
                {summary.startDate} - {summary.endDate}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="OEE"
                value={`${summary.avg_oee.toFixed(1)}%`}
                icon={TrendingUp}
                color="text-blue-600"
              />
              <MetricCard
                title="Verfügbarkeit"
                value={`${summary.avg_availability.toFixed(1)}%`}
                icon={Clock}
                color="text-green-600"
              />
              <MetricCard
                title="Leistung"
                value={`${summary.avg_performance.toFixed(1)}%`}
                icon={Activity}
                color="text-orange-600"
              />
              <MetricCard
                title="Qualität"
                value={`${summary.avg_quality.toFixed(1)}%`}
                icon={Target}
                color="text-purple-600"
              />
            </div>

            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Ziel-OEE:</span>
                <span className="text-lg font-bold text-slate-900">{summary.target_oee}%</span>
              </div>
              <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    summary.avg_oee >= summary.target_oee
                      ? 'bg-green-500'
                      : summary.avg_oee >= summary.target_oee * 0.85
                      ? 'bg-yellow-400'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min((summary.avg_oee / summary.target_oee) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {summary.machines.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">OEE nach Maschine</h2>
          <div className="space-y-4">
            {summary.machines.map((machine, index) => (
              <div
                key={index}
                onClick={() => onSelectMachine?.(machine.machine_name)}
                className="p-6 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-slate-800">{machine.machine_name}</h3>
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl font-bold ${
                      machine.color === 'green' ? 'text-green-600' :
                      machine.color === 'yellow' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {machine.avg_oee.toFixed(1)}%
                    </span>
                    <div className={`w-4 h-4 rounded-full ${
                      machine.color === 'green' ? 'bg-green-500' :
                      machine.color === 'yellow' ? 'bg-yellow-400' :
                      'bg-red-500'
                    }`} />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Verfügbarkeit</p>
                    <p className="text-lg font-semibold text-slate-900">{machine.avg_availability.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Leistung</p>
                    <p className="text-lg font-semibold text-slate-900">{machine.avg_performance.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Qualität</p>
                    <p className="text-lg font-semibold text-slate-900">{machine.avg_quality.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Gutteile / Gesamt</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {machine.total_good_pieces} / {machine.total_pieces}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-3 text-slate-600">
            <AlertCircle size={24} />
            <p>Keine Maschinendaten für den ausgewählten Zeitraum verfügbar.</p>
          </div>
        </div>
      )}
    </div>
  );
}
