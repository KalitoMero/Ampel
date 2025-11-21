import { useState, useEffect } from 'react';
import { getScrapDataForWeek, getScrapDataForMonth, ScrapPeriodData, TrafficLightColor } from '../utils/scrapQueries';

interface ScrapOverviewProps {
  onNavigateToMachineList: () => void;
}

function TrafficLightCard({
  title,
  data,
  onClick
}: {
  title: string;
  data: ScrapPeriodData;
  onClick: () => void;
}) {
  const getColorClasses = (color: TrafficLightColor) => {
    switch (color) {
      case 'green':
        return 'bg-green-500 shadow-green-500/50';
      case 'yellow':
        return 'bg-yellow-400 shadow-yellow-400/50';
      case 'red':
        return 'bg-red-500 shadow-red-500/50';
      default:
        return 'bg-gray-700';
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all cursor-pointer"
    >
      <div className="flex items-start gap-6">
        <div className="bg-gray-800 rounded-2xl p-4 flex-shrink-0">
          <div className="flex flex-col gap-3">
            <div className={`w-16 h-16 rounded-full transition-all ${data.color === 'green' ? getColorClasses('green') : 'bg-gray-700'}`} />
            <div className={`w-16 h-16 rounded-full transition-all ${data.color === 'yellow' ? getColorClasses('yellow') : 'bg-gray-700'}`} />
            <div className={`w-16 h-16 rounded-full transition-all ${data.color === 'red' ? getColorClasses('red') : 'bg-gray-700'}`} />
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-2xl font-bold text-slate-800 mb-2">{title}</h3>
          <p className="text-sm text-slate-500 mb-4">{data.dateRange}</p>
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-slate-900">{data.totalScrap}</span>
              <span className="text-slate-600">Teile</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Ziel:</span>
                <span className="font-medium text-slate-700">{data.target} Teile</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Toleranz:</span>
                <span className="font-medium text-slate-700">{data.tolerance} Teile</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ScrapOverview({ onNavigateToMachineList }: ScrapOverviewProps) {
  const [weekData, setWeekData] = useState<ScrapPeriodData>({
    totalScrap: 0,
    target: 0,
    tolerance: 0,
    color: 'gray',
    dateRange: '',
  });
  const [monthData, setMonthData] = useState<ScrapPeriodData>({
    totalScrap: 0,
    target: 0,
    tolerance: 0,
    color: 'gray',
    dateRange: '',
  });

  useEffect(() => {
    loadScrapData();
  }, []);

  const loadScrapData = async () => {
    try {
      const [week, month] = await Promise.all([
        getScrapDataForWeek(),
        getScrapDataForMonth(),
      ]);
      setWeekData(week);
      setMonthData(month);
    } catch (error) {
      console.error('Error loading scrap data:', error);
    }
  };

  return (
    <div className="space-y-6">
      <TrafficLightCard
        title="Diese Woche"
        data={weekData}
        onClick={onNavigateToMachineList}
      />
      <TrafficLightCard
        title="Dieser Monat"
        data={monthData}
        onClick={() => {}}
      />
    </div>
  );
}
