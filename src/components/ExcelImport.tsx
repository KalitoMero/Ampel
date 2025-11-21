import { useState, useEffect } from 'react';
import { Upload, Save, CheckCircle, Database, Download } from 'lucide-react';
import { parseExcelFileWithData, autoMapColumns } from '../utils/excelParser';
import { generateExcelTemplate } from '../utils/excelTemplate';
import { supabase, ColumnMapping, ExcelData, UserPreferences, getUserId } from '../lib/supabase';

export function ExcelImport() {
  const [fileName, setFileName] = useState<string>('');
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [mappingName, setMappingName] = useState<string>('Standard Mapping');
  const [mapping, setMapping] = useState({
    stunden_teg: '',
    ausschussmenge: '',
    datum: '',
    auftragsnummer: '',
    ressource: '',
    menge_gut: '',
  });
  const [isSaved, setIsSaved] = useState(false);
  const [isDataSaved, setIsDataSaved] = useState(false);
  const [error, setError] = useState<string>('');
  const [savedMappingId, setSavedMappingId] = useState<string>('');
  const [previewData, setPreviewData] = useState<Record<string, any>[]>([]);

  useEffect(() => {
    loadSavedPreferences();
  }, []);

  const loadSavedPreferences = async () => {
    try {
      const { data } = await supabase
        .from('user_preferences')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setMapping(prev => ({
          ...prev,
          datum: data.last_datum_column || prev.datum,
          stunden_teg: data.last_stunden_teg_column || prev.stunden_teg,
          ausschussmenge: data.last_schicht_column || prev.ausschussmenge,
        }));
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setIsSaved(false);
    setIsDataSaved(false);
    setCurrentFile(file);
    setPreviewData([]);

    try {
      const { headers, rows } = await parseExcelFileWithData(file);
      setColumns(headers);
      setFileName(file.name);
      setPreviewData(rows.slice(0, 10));

      const { data: savedPrefs } = await supabase
        .from('user_preferences')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (savedPrefs && savedPrefs.last_datum_column && savedPrefs.last_stunden_teg_column) {
        setMapping(prev => ({
          ...prev,
          datum: headers.includes(savedPrefs.last_datum_column!) ? savedPrefs.last_datum_column! : prev.datum,
          stunden_teg: headers.includes(savedPrefs.last_stunden_teg_column!) ? savedPrefs.last_stunden_teg_column! : prev.stunden_teg,
          ausschussmenge: savedPrefs.last_schicht_column && headers.includes(savedPrefs.last_schicht_column) ? savedPrefs.last_schicht_column : prev.ausschussmenge,
        }));
      } else {
        const autoMapping = autoMapColumns(headers);
        setMapping(autoMapping);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Lesen der Excel-Datei');
    }
  };

  const handleSaveMapping = async () => {
    setError('');

    if (!mapping.stunden_teg || !mapping.ausschussmenge || !mapping.datum || !mapping.auftragsnummer || !mapping.ressource) {
      setError('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    try {
      const userId = await getUserId();
      const mappingData: ColumnMapping = {
        user_id: userId,
        mapping_name: mappingName,
        stunden_teg: mapping.stunden_teg,
        ausschussmenge: mapping.ausschussmenge,
        datum: mapping.datum,
        auftragsnummer: mapping.auftragsnummer,
        ressource: mapping.ressource,
        menge_gut: mapping.menge_gut || null,
      };

      const { data, error: saveError } = await supabase
        .from('column_mappings')
        .insert(mappingData)
        .select()
        .single();

      if (saveError) throw saveError;

      if (data?.id) {
        setSavedMappingId(data.id);
      }

      const { data: existingPrefs } = await supabase
        .from('user_preferences')
        .select('id')
        .limit(1)
        .maybeSingle();

      const prefsData: Omit<UserPreferences, 'id' | 'created_at' | 'updated_at'> = {
        user_id: userId,
        last_datum_column: mapping.datum,
        last_stunden_teg_column: mapping.stunden_teg,
        last_schicht_column: mapping.ausschussmenge,
      };

      if (existingPrefs?.id) {
        await supabase
          .from('user_preferences')
          .update({ ...prefsData, updated_at: new Date().toISOString() })
          .eq('id', existingPrefs.id);
      } else {
        await supabase
          .from('user_preferences')
          .insert(prefsData);
      }

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern des Mappings');
    }
  };

  const handleSaveData = async () => {
    if (!currentFile) {
      setError('Bitte laden Sie zuerst eine Excel-Datei hoch');
      return;
    }

    if (!savedMappingId) {
      setError('Bitte speichern Sie zuerst das Mapping');
      return;
    }

    setError('');

    try {
      const userId = await getUserId();
      const { rows } = await parseExcelFileWithData(currentFile);

      const dataToInsert: Omit<ExcelData, 'id' | 'created_at'>[] = rows.map(row => ({
        user_id: userId,
        mapping_id: savedMappingId,
        file_name: fileName,
        row_data: row,
        uploaded_at: new Date().toISOString(),
      }));

      const { error: insertError } = await supabase
        .from('excel_data')
        .insert(dataToInsert);

      if (insertError) throw insertError;

      await discoverAndSaveMachines(rows);
      await processAndSaveMachineHours(rows, userId);
      await processAndSaveScrapData(rows, userId);

      setIsDataSaved(true);
      setTimeout(() => setIsDataSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern der Excel-Daten');
    }
  };

  const parseDate = (dateValue: any): Date | null => {
    if (!dateValue) return null;

    if (dateValue instanceof Date) return dateValue;

    if (typeof dateValue === 'number') {
      const excelEpoch = new Date(1899, 11, 30);
      return new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
    }

    if (typeof dateValue === 'string') {
      const germanDatePattern = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
      const match = dateValue.match(germanDatePattern);

      if (match) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1;
        const year = parseInt(match[3], 10);
        const date = new Date(year, month, day);

        if (!isNaN(date.getTime())) {
          return date;
        }
      }

      const parsed = new Date(dateValue);
      if (!isNaN(parsed.getTime())) return parsed;
    }

    return null;
  };

  const processAndSaveMachineHours = async (rows: Record<string, any>[], userId: string) => {
    if (!mapping.ressource || !mapping.datum || !mapping.stunden_teg) return;

    try {
      const { data: targets } = await supabase
        .from('machine_targets')
        .select('machine_name, target_hours_14d');

      const targetsMap = new Map<string, number>();
      if (targets) {
        targets.forEach((target) => {
          targetsMap.set(target.machine_name, target.target_hours_14d);
        });
      }

      const machineHoursMap = new Map<string, Map<string, number>>();

      for (const row of rows) {
        const dateValue = row[mapping.datum];
        const hoursValue = row[mapping.stunden_teg];
        const machineValue = row[mapping.ressource];

        const date = parseDate(dateValue);
        if (!date) continue;

        const hours = parseFloat(hoursValue);
        if (isNaN(hours)) continue;

        const machineName = machineValue?.toString().trim() || 'Unbekannt';
        if (machineName === 'Unbekannt') continue;

        const dateKey = date.toISOString().split('T')[0];

        if (!machineHoursMap.has(machineName)) {
          machineHoursMap.set(machineName, new Map());
        }

        const dateMap = machineHoursMap.get(machineName)!;
        dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + hours);
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
        const { error: insertError } = await supabase
          .from('machine_hours')
          .upsert(machineHoursToInsert, {
            onConflict: 'user_id,machine_name,date',
            ignoreDuplicates: false,
          });

        if (insertError) {
          console.error('Error saving machine hours:', insertError);
        }
      }
    } catch (err) {
      console.error('Error processing machine hours:', err);
    }
  };

  const processAndSaveScrapData = async (rows: Record<string, any>[], userId: string) => {
    if (!mapping.ressource || !mapping.datum || !mapping.ausschussmenge || !mapping.auftragsnummer) return;

    try {
      const scrapDataToInsert = [];

      for (const row of rows) {
        const dateValue = row[mapping.datum];
        const scrapValue = row[mapping.ausschussmenge];
        const machineValue = row[mapping.ressource];
        const babValue = row[mapping.auftragsnummer];

        const date = parseDate(dateValue);
        if (!date) continue;

        const scrapAmount = parseFloat(scrapValue);
        if (isNaN(scrapAmount) || scrapAmount <= 0) continue;

        const machineName = machineValue?.toString().trim() || 'Unbekannt';
        if (machineName === 'Unbekannt') continue;

        const babNumber = babValue?.toString().trim() || 'Unbekannt';

        const dateKey = date.toISOString().split('T')[0];

        scrapDataToInsert.push({
          user_id: userId,
          machine_name: machineName,
          bab_number: babNumber,
          scrap_amount: scrapAmount,
          scrap_date: dateKey,
        });
      }

      if (scrapDataToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('scrap_data')
          .insert(scrapDataToInsert);

        if (insertError) {
          console.error('Error saving scrap data:', insertError);
        }
      }
    } catch (err) {
      console.error('Error processing scrap data:', err);
    }
  };

  const discoverAndSaveMachines = async (rows: Record<string, any>[]) => {
    if (!mapping.ressource) return;

    try {
      const machineNames = new Set<string>();

      for (const row of rows) {
        const machineValue = row[mapping.ressource];
        if (machineValue) {
          const machineName = machineValue.toString().trim();
          if (machineName && machineName !== 'Unbekannt') {
            machineNames.add(machineName);
          }
        }
      }

      const { data: existingMachines } = await supabase
        .from('machine_targets')
        .select('machine_name');

      const existingMachineNames = new Set(existingMachines?.map(m => m.machine_name) || []);

      const userId = await getUserId();
      const newMachines = Array.from(machineNames)
        .filter(name => !existingMachineNames.has(name))
        .map(name => ({
          user_id: userId,
          machine_name: name,
          target_hours_14d: 0,
        }));

      if (newMachines.length > 0) {
        const { error: insertError } = await supabase
          .from('machine_targets')
          .insert(newMachines);

        if (insertError) {
          console.error('Error saving machines:', insertError);
        }
      }
    } catch (err) {
      console.error('Error discovering machines:', err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800">Excel importieren & Spalten zuordnen</h2>
          <button
            onClick={generateExcelTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
          >
            <Download size={20} />
            Vorlage herunterladen
          </button>
        </div>

        <div className="space-y-8">
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-slate-400 transition-colors">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              id="excel-upload"
            />
            <label htmlFor="excel-upload" className="cursor-pointer">
              <Upload className="mx-auto mb-4 text-slate-400" size={48} />
              <p className="text-lg text-slate-600 mb-2">
                {fileName || 'Excel-Datei hochladen'}
              </p>
              <p className="text-sm text-slate-400">
                Klicken Sie hier oder ziehen Sie eine .xlsx/.xls Datei
              </p>
            </label>
          </div>

          {columns.length > 0 && (
            <>
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-slate-800">Spalten zuordnen</h3>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Name des Mappings
                  </label>
                  <input
                    type="text"
                    value={mappingName}
                    onChange={(e) => setMappingName(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Stunden (TEG) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={mapping.stunden_teg}
                      onChange={(e) => setMapping({ ...mapping, stunden_teg: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="">Bitte auswählen</option>
                      {columns.map((col, idx) => (
                        <option key={idx} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Ausschussmenge <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={mapping.ausschussmenge}
                      onChange={(e) => setMapping({ ...mapping, ausschussmenge: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="">Bitte auswählen</option>
                      {columns.map((col, idx) => (
                        <option key={idx} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Datum oder Jahr/Monat <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={mapping.datum}
                      onChange={(e) => setMapping({ ...mapping, datum: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="">Bitte auswählen</option>
                      {columns.map((col, idx) => (
                        <option key={idx} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Internes BA-Kürzel / Auftragsnummer <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={mapping.auftragsnummer}
                      onChange={(e) => setMapping({ ...mapping, auftragsnummer: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="">Bitte auswählen</option>
                      {columns.map((col, idx) => (
                        <option key={idx} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Ressource (Maschine) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={mapping.ressource}
                      onChange={(e) => setMapping({ ...mapping, ressource: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="">Bitte auswählen</option>
                      {columns.map((col, idx) => (
                        <option key={idx} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Menge gut (optional)
                    </label>
                    <select
                      value={mapping.menge_gut}
                      onChange={(e) => setMapping({ ...mapping, menge_gut: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="">Bitte auswählen</option>
                      {columns.map((col, idx) => (
                        <option key={idx} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {error}
                  </div>
                )}

                {isSaved && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2 text-green-700">
                    <CheckCircle size={20} />
                    <span>Mapping erfolgreich gespeichert!</span>
                  </div>
                )}

                {isDataSaved && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2 text-green-700">
                    <CheckCircle size={20} />
                    <span>Excel-Daten erfolgreich in Datenbank gespeichert!</span>
                  </div>
                )}

{previewData.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">Vorschau der ersten 10 Zeilen</h3>
                    <div className="overflow-x-auto border border-slate-300 rounded-lg">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                              {mapping.datum || 'Datum'}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                              {mapping.stunden_teg || 'Stunden'}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                              {mapping.ressource || 'Maschine'}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                              {mapping.ausschussmenge || 'Ausschuss'}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                              {mapping.auftragsnummer || 'Auftrag'}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          {previewData.map((row, idx) => {
                            const formatDate = (value: any) => {
                              if (!value) return '-';
                              if (typeof value === 'number') {
                                const excelEpoch = new Date(1899, 11, 30);
                                const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
                                return date.toLocaleDateString('de-DE');
                              }
                              if (typeof value === 'string' && /^\d{1,2}\.\d{1,2}\.\d{4}$/.test(value)) {
                                return value;
                              }
                              if (value instanceof Date) {
                                return value.toLocaleDateString('de-DE');
                              }
                              return value.toString();
                            };

                            return (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-sm text-slate-900">
                                  {mapping.datum ? formatDate(row[mapping.datum]) : '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-900">
                                  {mapping.stunden_teg ? row[mapping.stunden_teg]?.toString() || '-' : '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-900">
                                  {mapping.ressource ? row[mapping.ressource]?.toString() || '-' : '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-900">
                                  {mapping.ausschussmenge ? row[mapping.ausschussmenge]?.toString() || '-' : '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-900">
                                  {mapping.auftragsnummer ? row[mapping.auftragsnummer]?.toString() || '-' : '-'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={handleSaveMapping}
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-lg font-medium"
                  >
                    <Save size={24} />
                    Mapping speichern
                  </button>

                  <button
                    onClick={handleSaveData}
                    disabled={!savedMappingId}
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-lg font-medium disabled:bg-slate-300 disabled:cursor-not-allowed"
                  >
                    <Database size={24} />
                    Daten speichern
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
