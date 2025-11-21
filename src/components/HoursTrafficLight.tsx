import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { getTrafficLightDataForPeriod, TrafficLightData, TrafficLightColor } from '../utils/machineHoursQueries';
import { PeriodType } from './MachineHoursDetail';

interface HoursTrafficLightProps {
  onNavigateToMachineDetails: (periodType: PeriodType) => void;
}

export function HoursTrafficLight({ onNavigateToMachineDetails }: HoursTrafficLightProps) {
  const [hoursData14Days, setHoursData14Days] = useState<TrafficLightData>({
    totalHours: 0,
    targetHours: 450,
    color: 'gray',
    percentage: 0,
    daysCount: 14,
    startDate: '',
    endDate: '',
  });
  const [hoursDataWeek3And4, setHoursDataWeek3And4] = useState<TrafficLightData>({
    totalHours: 0,
    targetHours: 450,
    color: 'gray',
    percentage: 0,
    daysCount: 14,
    startDate: '',
    endDate: '',
  });
  const [hoursData8Weeks, setHoursData8Weeks] = useState<TrafficLightData>({
    totalHours: 0,
    targetHours: 1800,
    color: 'gray',
    percentage: 0,
    daysCount: 56,
    startDate: '',
    endDate: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHoursData();
  }, []);

  const loadHoursData = async () => {
    try {
      const [data14Days, dataWeek3And4, data8Weeks] = await Promise.all([
        getTrafficLightDataForPeriod('14days'),
        getTrafficLightDataForPeriod('week3and4'),
        getTrafficLightDataForPeriod('8weeks'),
      ]);
      setHoursData14Days(data14Days);
      setHoursDataWeek3And4(dataWeek3And4);
      setHoursData8Weeks(data8Weeks);
    } catch (error) {
      console.error('Error loading hours data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrafficLightDisplay = (color: TrafficLightColor) => {
    return (
      <div className="flex flex-col gap-3">
        <div
          className={`w-16 h-16 rounded-full transition-all ${
            color === 'green' ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-gray-700'
          }`}
        />
        <div
          className={`w-16 h-16 rounded-full transition-all ${
            color === 'yellow' ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50' : 'bg-gray-700'
          }`}
        />
        <div
          className={`w-16 h-16 rounded-full transition-all ${
            color === 'red' ? 'bg-red-500 shadow-lg shadow-red-500/50' : 'bg-gray-700'
          }`}
        />
      </div>
    );
  };

  const renderPeriodCard = (data: TrafficLightData, title: string, showTrafficLight: boolean = false, periodType?: PeriodType) => (
    <div className={`flex items-start gap-6 ${periodType ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`} onClick={periodType ? () => onNavigateToMachineDetails(periodType) : undefined}>
      {showTrafficLight && (
        <div className="bg-gray-800 rounded-2xl p-4">
          {getTrafficLightDisplay(data.color)}
        </div>
      )}

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={24} className="text-slate-700" />
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
        </div>

        {loading ? (
          <p className="text-slate-600">Lade Daten...</p>
        ) : (
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">
                {data.totalHours.toFixed(1)}h
              </span>
              <span className="text-slate-600">/ {data.targetHours}h</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    data.color === 'green'
                      ? 'bg-green-500'
                      : data.color === 'yellow'
                      ? 'bg-yellow-400'
                      : data.color === 'red'
                      ? 'bg-red-500'
                      : 'bg-gray-400'
                  }`}
                  style={{ width: `${Math.min(data.percentage, 100)}%` }}
                />
              </div>
              <span className="text-sm font-medium text-slate-700 min-w-[3rem] text-right">
                {data.percentage.toFixed(0)}%
              </span>
            </div>

            <p className="text-sm text-slate-500">
              {data.startDate} - {data.endDate}
            </p>

            <p className="text-sm text-slate-500">
              Ziel: {data.targetHours}h für {data.daysCount} Tage
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
        {renderPeriodCard(hoursData14Days, 'Geleistete Stunden (14 Tage)', true, '14days')}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
          {renderPeriodCard(hoursDataWeek3And4, 'Woche 3 + 4', true, 'week3and4')}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
          {renderPeriodCard(hoursData8Weeks, 'Letzte 8 Wochen', true, '8weeks')}
        </div>
      </div>

    </div>
  );
}
