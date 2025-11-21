import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { getScrapDetailsForMachine, ScrapDetailData } from '../utils/scrapQueries';

interface ScrapMachineDetailProps {
  machineName: string;
  onBack: () => void;
}

export function ScrapMachineDetail({ machineName, onBack }: ScrapMachineDetailProps) {
  const [details, setDetails] = useState<ScrapDetailData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetails();
  }, [machineName]);

  const loadDetails = async () => {
    try {
      const data = await getScrapDetailsForMachine(machineName);
      setDetails(data);
    } catch (error) {
      console.error('Error loading scrap details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const totalScrap = details.reduce((sum, item) => sum + Number(item.scrap_amount), 0);

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
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-800 mb-2">{machineName}</h1>
            <p className="text-xl text-slate-600">
              Gesamt Ausschuss: <span className="font-bold text-slate-900">{totalScrap}</span> Teile
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-lg text-slate-600">Lädt...</div>
            </div>
          ) : details.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-slate-600">Keine Ausschuss-Details für diese Maschine</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200">
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">
                        BAB-Nummer
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">
                        Ausschussmenge
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">
                        Datum
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.map((detail, index) => (
                      <tr
                        key={index}
                        className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-slate-800 font-medium">
                          {detail.bab_number}
                        </td>
                        <td className="px-6 py-4 text-slate-800">
                          <span className="font-bold">{detail.scrap_amount}</span> Teile
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {formatDate(detail.scrap_date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
