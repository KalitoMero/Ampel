import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { getScrapMachinesForWeek, ScrapMachineData } from '../utils/scrapQueries';

interface ScrapMachineListProps {
  onSelectMachine: (machineName: string) => void;
}

export function ScrapMachineList({ onSelectMachine }: ScrapMachineListProps) {
  const [machines, setMachines] = useState<ScrapMachineData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMachines();
  }, []);

  const loadMachines = async () => {
    try {
      const data = await getScrapMachinesForWeek();
      setMachines(data);
    } catch (error) {
      console.error('Error loading machine scrap data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-slate-600">Lädt...</div>
      </div>
    );
  }

  if (machines.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-slate-600">Keine Ausschuss-Daten für diese Woche</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Maschinen mit Ausschuss</h2>
      <div className="space-y-3">
        {machines.map((machine) => (
          <div
            key={machine.machine_name}
            onClick={() => onSelectMachine(machine.machine_name)}
            className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-800 mb-1">
                  {machine.machine_name}
                </h3>
                <p className="text-slate-600">
                  Ausschuss: <span className="font-bold text-slate-900">{machine.total_scrap}</span> Teile
                </p>
              </div>
              <ChevronRight
                size={24}
                className="text-slate-400 group-hover:text-slate-600 transition-colors"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
