import { useState, useEffect } from 'react';
import { Home, ArrowLeft, Lock, FileSpreadsheet, Settings as SettingsIcon, LogOut, Database } from 'lucide-react';
import { ExcelImport } from './components/ExcelImport';
import { SettingsPage } from './components/SettingsPage';
import { MachineTargets } from './components/MachineTargets';
import { HoursTrafficLight } from './components/HoursTrafficLight';
import { MachineHoursDetail, PeriodType } from './components/MachineHoursDetail';
import { ScrapOverview } from './components/ScrapOverview';
import { ScrapSettings } from './components/ScrapSettings';
import { ScrapMachineList } from './components/ScrapMachineList';
import { ScrapMachineDetail } from './components/ScrapMachineDetail';
import { getTrafficLightDataForPeriod, TrafficLightColor } from './utils/machineHoursQueries';
import { getScrapDataForWeek } from './utils/scrapQueries';
import { useAuth } from './contexts/AuthContext';
import AuthForm from './components/AuthForm';

type Page = 'home' | 'hours-overview' | 'department' | 'admin' | 'excel-import' | 'settings' | 'machine-targets' | 'machine-detail' | 'scrap-overview' | 'scrap-settings' | 'scrap-machines' | 'scrap-machine-detail';

function TrafficLight({ color, onClick }: { color: 'red' | 'yellow' | 'green'; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-gray-800 rounded-3xl p-8 shadow-2xl cursor-pointer hover:scale-105 transition-transform duration-200"
    >
      <div className="flex flex-col gap-6">
        <div className={`w-32 h-32 rounded-full ${color === 'green' ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-gray-700'}`} />
        <div className={`w-32 h-32 rounded-full ${color === 'yellow' ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50' : 'bg-gray-700'}`} />
        <div className={`w-32 h-32 rounded-full ${color === 'red' ? 'bg-red-500 shadow-lg shadow-red-500/50' : 'bg-gray-700'}`} />
      </div>
    </div>
  );
}

function HomePage({ onNavigate, onSignOut }: { onNavigate: (page: Page) => void; onSignOut: () => void }) {
  const [trafficLightColor, setTrafficLightColor] = useState<TrafficLightColor>('gray');

  useEffect(() => {
    loadTrafficLightColor();
  }, []);

  const loadTrafficLightColor = async () => {
    try {
      const data = await getTrafficLightDataForPeriod('14days');
      setTrafficLightColor(data.color);
    } catch (error) {
      console.error('Error loading traffic light color:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      <header className="p-6 flex justify-between">
        <button
          onClick={onSignOut}
          className="flex items-center gap-2 px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors shadow-lg"
        >
          <LogOut size={20} />
          Abmelden
        </button>
        <button
          onClick={() => onNavigate('admin')}
          className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg"
        >
          <Lock size={20} />
          Admin
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 pb-20">
        <TrafficLight color={trafficLightColor === 'gray' ? 'yellow' : trafficLightColor} onClick={() => onNavigate('hours-overview')} />
        <h1 className="text-5xl font-bold text-slate-800">Dreherei</h1>
      </div>
    </div>
  );
}

function HoursOverviewPage({ onBack, onNavigate }: { onBack: () => void; onNavigate: (page: Page) => void }) {
  const [trafficLightColor, setTrafficLightColor] = useState<TrafficLightColor>('gray');
  const [scrapColor, setScrapColor] = useState<TrafficLightColor>('gray');

  useEffect(() => {
    loadTrafficLightColor();
  }, []);

  const loadTrafficLightColor = async () => {
    try {
      const [hoursData, scrapData] = await Promise.all([
        getTrafficLightDataForPeriod('14days'),
        getScrapDataForWeek(),
      ]);
      setTrafficLightColor(hoursData.color);
      setScrapColor(scrapData.color);
    } catch (error) {
      console.error('Error loading traffic light color:', error);
    }
  };

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

      <div className="flex-1 flex items-center justify-center pb-20">
        <div className="flex gap-16 items-center flex-wrap justify-center max-w-6xl">
          <div className="flex flex-col items-center gap-8 cursor-pointer hover:scale-105 transition-transform" onClick={() => onNavigate('department')}>
            <TrafficLight color={trafficLightColor === 'gray' ? 'yellow' : trafficLightColor} onClick={() => {}} />
            <h1 className="text-3xl font-bold text-slate-800 text-center">Geleistete Stunden</h1>
          </div>

          <div className="flex flex-col items-center gap-8 cursor-pointer hover:scale-105 transition-transform" onClick={() => onNavigate('scrap-overview')}>
            <TrafficLight color={scrapColor === 'gray' ? 'yellow' : scrapColor} onClick={() => {}} />
            <h1 className="text-3xl font-bold text-slate-800 text-center">Ausschuss</h1>
          </div>
        </div>
      </div>
    </div>
  );
}

function DepartmentPage({ onBack, onNavigate, onNavigateWithPeriod }: { onBack: () => void; onNavigate: (page: Page) => void; onNavigateWithPeriod: (page: Page, period: PeriodType) => void }) {
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
        <h1 className="text-5xl font-bold text-slate-800 mb-12 text-center">Abteilung Dreherei</h1>

        <div className="max-w-4xl mx-auto">
          <HoursTrafficLight onNavigateToMachineDetails={(period) => onNavigateWithPeriod('machine-detail', period)} />
        </div>
      </div>
    </div>
  );
}

function AdminPage({ onBack, onNavigate }: { onBack: () => void; onNavigate: (page: Page) => void }) {
  const [backfilling, setBackfilling] = useState(false);
  const [backfillMessage, setBackfillMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleBackfill = async () => {
    setBackfilling(true);
    setBackfillMessage(null);

    try {
      const { backfillMachineHoursFromExcelData } = await import('./utils/backfillMachineHours');
      const result = await backfillMachineHoursFromExcelData();

      if (result.success) {
        setBackfillMessage({
          type: 'success',
          text: `Erfolgreich ${result.recordsProcessed} Datensätze verarbeitet`,
        });
      } else {
        setBackfillMessage({
          type: 'error',
          text: result.error || 'Fehler beim Verarbeiten',
        });
      }
    } catch (error) {
      setBackfillMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unbekannter Fehler',
      });
    } finally {
      setBackfilling(false);
      setTimeout(() => setBackfillMessage(null), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      <header className="p-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg"
        >
          <Home size={20} />
          Startseite
        </button>
      </header>

      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-2xl w-full px-8">
          <h1 className="text-5xl font-bold text-slate-800 mb-12 text-center">Admin-Bereich</h1>

          {backfillMessage && (
            <div className={`mb-6 p-4 rounded-lg ${backfillMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {backfillMessage.text}
            </div>
          )}

          <div className="grid gap-6">
            <button
              onClick={() => onNavigate('excel-import')}
              className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow flex items-center gap-6 group"
            >
              <div className="bg-slate-100 rounded-full p-4 group-hover:bg-slate-200 transition-colors">
                <FileSpreadsheet size={32} className="text-slate-700" />
              </div>
              <div className="text-left">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Excel importieren & Spalten zuordnen</h2>
                <p className="text-slate-600">Excel-Dateien hochladen und Spaltenmapping konfigurieren</p>
              </div>
            </button>

            <button
              onClick={() => onNavigate('settings')}
              className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow flex items-center gap-6 group"
            >
              <div className="bg-slate-100 rounded-full p-4 group-hover:bg-slate-200 transition-colors">
                <SettingsIcon size={32} className="text-slate-700" />
              </div>
              <div className="text-left">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Einstellungen: Geleistete Stunden</h2>
                <p className="text-slate-600">Zielwerte und Grenzwerte für Ampel-Berechnung konfigurieren</p>
              </div>
            </button>

            <button
              onClick={handleBackfill}
              disabled={backfilling}
              className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow flex items-center gap-6 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="bg-slate-100 rounded-full p-4 group-hover:bg-slate-200 transition-colors">
                <Database size={32} className="text-slate-700" />
              </div>
              <div className="text-left">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">
                  {backfilling ? 'Verarbeite...' : 'Maschinenstunden aktualisieren'}
                </h2>
                <p className="text-slate-600">Maschinenstunden aus vorhandenen Excel-Daten neu berechnen</p>
              </div>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}

function ExcelImportPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      <header className="p-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg"
        >
          <ArrowLeft size={20} />
          Zurück zum Admin-Bereich
        </button>
      </header>

      <ExcelImport />
    </div>
  );
}

function SettingsPageWrapper({ onBack, onNavigate }: { onBack: () => void; onNavigate: (page: Page) => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      <header className="p-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg"
        >
          <ArrowLeft size={20} />
          Zurück zum Admin-Bereich
        </button>

        <div className="flex gap-3">
          <button
            onClick={() => onNavigate('scrap-settings')}
            className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors shadow-lg"
          >
            <SettingsIcon size={20} />
            Ausschuss-Einstellungen
          </button>
          <button
            onClick={() => onNavigate('machine-targets')}
            className="flex items-center gap-2 px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors shadow-lg"
          >
            <SettingsIcon size={20} />
            Maschinenziele
          </button>
        </div>
      </header>

      <SettingsPage />
    </div>
  );
}

function ScrapOverviewPage({ onBack, onNavigate }: { onBack: () => void; onNavigate: (page: Page) => void }) {
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
        <h1 className="text-5xl font-bold text-slate-800 mb-12 text-center">Ausschuss</h1>
        <div className="max-w-2xl mx-auto">
          <ScrapOverview onNavigateToMachineList={() => onNavigate('scrap-machines')} />
        </div>
      </div>
    </div>
  );
}

function ScrapSettingsPage({ onBack }: { onBack: () => void }) {
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

      <ScrapSettings />
    </div>
  );
}

function ScrapMachineListPage({ onBack, onNavigate }: { onBack: () => void; onNavigate: (page: Page, machineName: string) => void }) {
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
        <h1 className="text-5xl font-bold text-slate-800 mb-12 text-center">Ausschuss nach Maschine</h1>
        <div className="max-w-4xl mx-auto">
          <ScrapMachineList onSelectMachine={(machineName) => onNavigate('scrap-machine-detail', machineName)} />
        </div>
      </div>
    </div>
  );
}


function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('14days');
  const [selectedMachineName, setSelectedMachineName] = useState<string>('');
  const { user, loading, signOut } = useAuth();

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
  };

  const handleNavigateWithMachine = (page: Page, machineName: string) => {
    setSelectedMachineName(machineName);
    setCurrentPage(page);
  };

  const handleSignOut = async () => {
    await signOut();
    setCurrentPage('home');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-lg text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onAuthSuccess={() => {}} />;
  }

  return (
    <>
      {currentPage === 'home' && <HomePage onNavigate={handleNavigate} onSignOut={handleSignOut} />}
      {currentPage === 'hours-overview' && <HoursOverviewPage onBack={() => setCurrentPage('home')} onNavigate={setCurrentPage} />}
      {currentPage === 'department' && (
        <DepartmentPage
          onBack={() => setCurrentPage('hours-overview')}
          onNavigate={setCurrentPage}
          onNavigateWithPeriod={(page, period) => {
            setSelectedPeriod(period);
            setCurrentPage(page);
          }}
        />
      )}
      {currentPage === 'admin' && <AdminPage onBack={() => setCurrentPage('home')} onNavigate={setCurrentPage} />}
      {currentPage === 'excel-import' && <ExcelImportPage onBack={() => setCurrentPage('admin')} />}
      {currentPage === 'settings' && <SettingsPageWrapper onBack={() => setCurrentPage('admin')} onNavigate={setCurrentPage} />}
      {currentPage === 'machine-targets' && <MachineTargets onBack={() => setCurrentPage('settings')} />}
      {currentPage === 'machine-detail' && <MachineHoursDetail periodType={selectedPeriod} onBack={() => setCurrentPage('department')} />}
      {currentPage === 'scrap-overview' && <ScrapOverviewPage onBack={() => setCurrentPage('hours-overview')} onNavigate={setCurrentPage} />}
      {currentPage === 'scrap-settings' && <ScrapSettingsPage onBack={() => setCurrentPage('settings')} />}
      {currentPage === 'scrap-machines' && <ScrapMachineListPage onBack={() => setCurrentPage('scrap-overview')} onNavigate={handleNavigateWithMachine} />}
      {currentPage === 'scrap-machine-detail' && <ScrapMachineDetail machineName={selectedMachineName} onBack={() => setCurrentPage('scrap-machines')} />}
    </>
  );
}

export default App;
