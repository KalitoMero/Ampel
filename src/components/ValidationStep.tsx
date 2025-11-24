import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { ParsedFileData } from '../utils/fileParser';
import { ColumnMapping, validateAndParseData, getValidationSummary, ValidatedRow } from '../utils/validation';

interface ValidationStepProps {
  fileData: ParsedFileData;
  mapping: ColumnMapping;
  fieldTypes: { [key: string]: 'number' | 'string' | 'date' };
  onValidationComplete: (validatedData: ValidatedRow[]) => void;
  onBack: () => void;
}

export function ValidationStep({
  fileData,
  mapping,
  fieldTypes,
  onValidationComplete,
  onBack,
}: ValidationStepProps) {
  const [validatedData, setValidatedData] = useState<ValidatedRow[]>([]);
  const [summary, setSummary] = useState<ReturnType<typeof getValidationSummary> | null>(null);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const validate = async () => {
      setIsValidating(true);

      await new Promise((resolve) => setTimeout(resolve, 500));

      const validated = validateAndParseData(fileData.allRows, mapping, fieldTypes);
      const validationSummary = getValidationSummary(validated);

      setValidatedData(validated);
      setSummary(validationSummary);
      setIsValidating(false);
    };

    validate();
  }, [fileData, mapping, fieldTypes]);

  const handleContinue = () => {
    const validRows = validatedData.filter((row) => row._validationErrors.length === 0);
    onValidationComplete(validRows);
  };

  const handleContinueWithErrors = () => {
    onValidationComplete(validatedData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Datenvalidierung</h2>
          <p className="text-gray-600">Überprüfung der Datenqualität und Formatierung</p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
        >
          Zurück
        </button>
      </div>

      {isValidating ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Daten werden validiert...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Zeilen gesamt</span>
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{summary?.totalRows || 0}</div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Gültige Zeilen</span>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-600">{summary?.validRows || 0}</div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Fehlerhafte Zeilen</span>
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-3xl font-bold text-red-600">{summary?.invalidRows || 0}</div>
            </div>
          </div>

          {summary && summary.invalidRows > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start space-x-3 mb-4">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-900">Validierungsfehler gefunden</h3>
                  <p className="text-sm text-red-700 mt-1">
                    {summary.invalidRows} von {summary.totalRows} Zeilen enthalten Fehler
                  </p>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 mt-4">
                {summary.errors.slice(0, 20).map((error, index) => (
                  <div key={index} className="text-sm text-red-700 bg-white rounded px-3 py-2">
                    {error}
                  </div>
                ))}
                {summary.errors.length > 20 && (
                  <div className="text-sm text-red-700 italic px-3 py-2">
                    ... und {summary.errors.length - 20} weitere Fehler
                  </div>
                )}
              </div>
            </div>
          )}

          {summary && summary.invalidRows === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-green-900">Alle Daten sind gültig</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Alle {summary.totalRows} Zeilen wurden erfolgreich validiert und können
                    importiert werden.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="font-medium text-gray-900 mb-4">Validierte Datenvorschau</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Zeile</th>
                    {Object.keys(mapping).map((fieldKey) => (
                      <th key={fieldKey} className="px-4 py-2 text-left font-medium text-gray-700">
                        {fieldKey}
                      </th>
                    ))}
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {validatedData.slice(0, 10).map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-900">{row._rowIndex}</td>
                      {Object.keys(mapping).map((fieldKey) => (
                        <td key={fieldKey} className="px-4 py-2 text-gray-700">
                          {row[fieldKey] !== null && row[fieldKey] !== undefined
                            ? String(row[fieldKey])
                            : '-'}
                        </td>
                      ))}
                      <td className="px-4 py-2">
                        {row._validationErrors.length === 0 ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {validatedData.length > 10 && (
                <p className="text-sm text-gray-600 mt-4 text-center">
                  ... und {validatedData.length - 10} weitere Zeilen
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            {summary && summary.invalidRows > 0 && (
              <button
                onClick={handleContinueWithErrors}
                className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
              >
                Trotzdem fortfahren ({summary.validRows} gültige Zeilen)
              </button>
            )}
            <button
              onClick={handleContinue}
              disabled={summary?.validRows === 0}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                summary && summary.validRows > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {summary && summary.invalidRows > 0
                ? `Nur gültige Zeilen importieren (${summary.validRows})`
                : 'Weiter zum Import'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
