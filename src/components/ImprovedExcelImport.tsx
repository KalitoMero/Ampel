import React, { useState } from 'react';
import { FileUploadStep } from './FileUploadStep';
import { ColumnMappingStep } from './ColumnMappingStep';
import { ValidationStep } from './ValidationStep';
import { ArrowLeft } from 'lucide-react';
import { ParsedFileData } from '../utils/fileParser';
import { ColumnMapping, ValidatedRow } from '../utils/validation';
import { supabase, getUserId } from '../lib/supabase';
import { parseDate } from '../utils/fileParser';

type Step = 'upload' | 'mapping' | 'validation' | 'complete';

const REQUIRED_FIELDS = [
  { key: 'machine_name', label: 'Maschinenname', required: true },
  { key: 'date', label: 'Datum', required: true },
  { key: 'setup_time', label: 'Rüstzeit (Minuten)', required: true },
  { key: 'production_time', label: 'Serienzeit (Minuten)', required: true },
  { key: 'scrap_amount', label: 'Ausschussmenge', required: true },
  { key: 'bab_number', label: 'Betriebsauftrag', required: true },
  { key: 'order_number', label: 'Auftragsnummer', required: true },
  { key: 'afo_nummer', label: 'AFO-Nummer', required: false },
  { key: 'good_quantity', label: 'Menge gut', required: false },
];

const FIELD_TYPES: { [key: string]: 'number' | 'string' | 'date' } = {
  machine_name: 'string',
  date: 'date',
  setup_time: 'number',
  production_time: 'number',
  scrap_amount: 'number',
  bab_number: 'string',
  order_number: 'string',
  afo_nummer: 'string',
  good_quantity: 'number',
};

export function ImprovedExcelImport() {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [fileData, setFileData] = useState<ParsedFileData | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [validatedData, setValidatedData] = useState<ValidatedRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(
    null
  );

  const handleFileUploaded = (data: ParsedFileData) => {
    setFileData(data);
    setCurrentStep('mapping');
  };

  const handleMappingComplete = (columnMapping: ColumnMapping) => {
    setMapping(columnMapping);
    setCurrentStep('validation');
  };

  const handleValidationComplete = async (validated: ValidatedRow[]) => {
    setValidatedData(validated);
    await importData(validated);
  };

  const importData = async (data: ValidatedRow[]) => {
    setIsImporting(true);
    try {
      const userId = await getUserId();

      await Promise.all([
        saveMachineHoursData(data, userId),
        saveScrapData(data, userId),
        discoverAndSaveMachines(data, userId),
      ]);

      setImportResult({
        success: true,
        message: `${data.length} Zeilen erfolgreich importiert`,
      });
      setCurrentStep('complete');
    } catch (error) {
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : 'Fehler beim Import',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const saveMachineHoursData = async (data: ValidatedRow[], userId: string) => {
    const machineHoursMap = new Map<string, Map<string, number>>();

    for (const row of data) {
      if (row._validationErrors.length > 0) continue;

      const machineName = row.machine_name;
      const date = row.date instanceof Date ? row.date : parseDate(row.date);
      const setupTime = row.setup_time || 0;
      const productionTime = row.production_time || 0;

      if (!machineName || !date) continue;

      const totalHours = (setupTime + productionTime) / 60;
      const dateKey = date.toISOString().split('T')[0];

      if (!machineHoursMap.has(machineName)) {
        machineHoursMap.set(machineName, new Map());
      }

      const dateMap = machineHoursMap.get(machineName)!;
      dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + totalHours);
    }

    const { data: targets } = await supabase
      .from('machine_targets')
      .select('machine_name, target_hours_14d');

    const targetsMap = new Map<string, number>();
    if (targets) {
      targets.forEach((target) => {
        targetsMap.set(target.machine_name, target.target_hours_14d);
      });
    }

    const machineHoursToInsert = [];
    for (const [machineName, dateMap] of machineHoursMap.entries()) {
      const targetHours = targetsMap.get(machineName) || 0;

      for (const [dateKey, hours] of dateMap.entries()) {
        machineHoursToInsert.push({
          user_id: userId,
          machine_name: machineName,
          date: dateKey,
          hours_worked: hours,
          target_hours: targetHours,
        });
      }
    }

    if (machineHoursToInsert.length > 0) {
      const { error } = await supabase.from('machine_hours').upsert(machineHoursToInsert, {
        onConflict: 'user_id,machine_name,date',
        ignoreDuplicates: false,
      });

      if (error) throw error;
    }
  };

  const saveScrapData = async (data: ValidatedRow[], userId: string) => {
    const scrapMap = new Map<string, { machine: string; bab: string; amount: number; date: string }>();

    for (const row of data) {
      if (row._validationErrors.length > 0) continue;

      const machineName = row.machine_name;
      const date = row.date instanceof Date ? row.date : parseDate(row.date);
      const scrapAmount = row.scrap_amount || 0;
      const babNumber = row.bab_number || 'Unbekannt';

      if (!machineName || !date || scrapAmount <= 0) continue;

      const dateKey = date.toISOString().split('T')[0];
      const key = `${babNumber}_${machineName}_${dateKey}`;

      if (!scrapMap.has(key)) {
        scrapMap.set(key, {
          machine: machineName,
          bab: babNumber,
          amount: 0,
          date: dateKey,
        });
      }

      const entry = scrapMap.get(key)!;
      entry.amount += scrapAmount;
    }

    const scrapDataToInsert = Array.from(scrapMap.values()).map((entry) => ({
      user_id: userId,
      machine_name: entry.machine,
      bab_number: entry.bab,
      scrap_amount: entry.amount,
      scrap_date: entry.date,
    }));

    if (scrapDataToInsert.length > 0) {
      const { error } = await supabase.from('scrap_data').insert(scrapDataToInsert);

      if (error) throw error;
    }
  };

  const discoverAndSaveMachines = async (data: ValidatedRow[], userId: string) => {
    const machineNames = new Set<string>();

    for (const row of data) {
      if (row._validationErrors.length === 0 && row.machine_name) {
        machineNames.add(row.machine_name);
      }
    }

    const { data: existingMachines } = await supabase
      .from('machine_targets')
      .select('machine_name');

    const existingMachineNames = new Set(existingMachines?.map((m) => m.machine_name) || []);

    const newMachines = Array.from(machineNames)
      .filter((name) => !existingMachineNames.has(name))
      .map((name) => ({
        user_id: userId,
        machine_name: name,
        target_hours_14d: 0,
      }));

    if (newMachines.length > 0) {
      const { error } = await supabase.from('machine_targets').insert(newMachines);

      if (error) throw error;
    }
  };

  const handleStartOver = () => {
    setCurrentStep('upload');
    setFileData(null);
    setMapping({});
    setValidatedData([]);
    setImportResult(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            {['upload', 'mapping', 'validation', 'complete'].map((step, index) => (
              <React.Fragment key={step}>
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-medium ${
                    currentStep === step
                      ? 'bg-blue-600 text-white'
                      : ['upload', 'mapping', 'validation', 'complete'].indexOf(currentStep) >
                        index
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index + 1}
                </div>
                {index < 3 && (
                  <div
                    className={`flex-1 h-1 ${
                      ['upload', 'mapping', 'validation', 'complete'].indexOf(currentStep) > index
                        ? 'bg-green-600'
                        : 'bg-gray-200'
                    }`}
                  ></div>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-4 text-center text-sm">
            <span className={currentStep === 'upload' ? 'font-medium text-blue-600' : 'text-gray-600'}>
              Upload
            </span>
            <span className={currentStep === 'mapping' ? 'font-medium text-blue-600' : 'text-gray-600'}>
              Zuordnung
            </span>
            <span className={currentStep === 'validation' ? 'font-medium text-blue-600' : 'text-gray-600'}>
              Validierung
            </span>
            <span className={currentStep === 'complete' ? 'font-medium text-blue-600' : 'text-gray-600'}>
              Fertig
            </span>
          </div>
        </div>

        {currentStep === 'upload' && <FileUploadStep onFileUploaded={handleFileUploaded} />}

        {currentStep === 'mapping' && fileData && (
          <ColumnMappingStep
            fileData={fileData}
            requiredFields={REQUIRED_FIELDS}
            onMappingComplete={handleMappingComplete}
            onBack={() => setCurrentStep('upload')}
          />
        )}

        {currentStep === 'validation' && fileData && (
          <ValidationStep
            fileData={fileData}
            mapping={mapping}
            fieldTypes={FIELD_TYPES}
            onValidationComplete={handleValidationComplete}
            onBack={() => setCurrentStep('mapping')}
          />
        )}

        {currentStep === 'complete' && (
          <div className="text-center py-12">
            {isImporting ? (
              <>
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-lg text-gray-700">Daten werden importiert...</p>
              </>
            ) : importResult ? (
              <>
                {importResult.success ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <svg
                        className="w-8 h-8 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Import erfolgreich</h3>
                    <p className="text-gray-600">{importResult.message}</p>
                    <button
                      onClick={handleStartOver}
                      className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center space-x-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Neue Datei importieren</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                      <svg
                        className="w-8 h-8 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Import fehlgeschlagen</h3>
                    <p className="text-red-600">{importResult.message}</p>
                    <button
                      onClick={handleStartOver}
                      className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center space-x-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Erneut versuchen</span>
                    </button>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
