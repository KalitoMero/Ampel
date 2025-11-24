import React, { useState, useEffect } from 'react';
import { ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { ParsedFileData } from '../utils/fileParser';
import { validateColumnMapping, ColumnMapping } from '../utils/validation';

interface ColumnMappingStepProps {
  fileData: ParsedFileData;
  requiredFields: {
    key: string;
    label: string;
    required: boolean;
  }[];
  onMappingComplete: (mapping: ColumnMapping) => void;
  onBack: () => void;
}

export function ColumnMappingStep({
  fileData,
  requiredFields,
  onMappingComplete,
  onBack,
}: ColumnMappingStepProps) {
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [validation, setValidation] = useState<ReturnType<typeof validateColumnMapping> | null>(
    null
  );

  useEffect(() => {
    const initialMapping: ColumnMapping = {};

    requiredFields.forEach((field) => {
      const autoDetected = autoDetectColumn(fileData.headers, field.key);
      if (autoDetected !== -1) {
        initialMapping[field.key] = autoDetected;
      }
    });

    setMapping(initialMapping);
  }, [fileData, requiredFields]);

  useEffect(() => {
    const requiredFieldKeys = requiredFields.filter((f) => f.required).map((f) => f.key);
    const result = validateColumnMapping(mapping, requiredFieldKeys, fileData.headers.length);
    setValidation(result);
  }, [mapping, requiredFields, fileData]);

  const autoDetectColumn = (headers: string[], fieldKey: string): number => {
    const keywords: { [key: string]: string[] } = {
      machine_name: ['maschine', 'machine', 'ressource', 'resource'],
      scrap_amount: ['ausschuss', 'scrap', 'ausschussmenge', 'menge'],
      date: ['datum', 'date', 'jahr/monat', 'monat', 'periode'],
      bab_number: ['bab', 'betriebsauftrag', 'ba', 'work order', 'auftrag'],
      setup_time: ['rüstzeit', 'ruestzeit', 'setup time', 'rüsten'],
      production_time: ['serienzeit', 'zeit pro stück', 'production time', 'cycle time'],
      good_quantity: ['menge gut', 'gut', 'good quantity', 'quantity'],
      betriebsauftrag: ['betriebsauftrag', 'ba-kürzel', 'internal order'],
      afo_nummer: ['afo', 'afo-nummer', 'arbeitsfolge', 'operation'],
    };

    const fieldKeywords = keywords[fieldKey] || [];
    const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());

    for (const keyword of fieldKeywords) {
      const exactMatch = normalizedHeaders.findIndex((h) => h === keyword);
      if (exactMatch !== -1) return exactMatch;
    }

    for (const keyword of fieldKeywords) {
      const partialMatch = normalizedHeaders.findIndex((h) => h.includes(keyword));
      if (partialMatch !== -1) return partialMatch;
    }

    return -1;
  };

  const handleMappingChange = (fieldKey: string, columnIndex: number) => {
    setMapping((prev) => ({
      ...prev,
      [fieldKey]: columnIndex,
    }));
  };

  const handleContinue = () => {
    if (validation?.isValid) {
      onMappingComplete(mapping);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Spaltenzuordnung</h2>
          <p className="text-gray-600">
            Ordnen Sie die Spalten aus Ihrer Datei den entsprechenden Feldern zu
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
        >
          Zurück
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-200">
          {requiredFields.map((field) => (
            <div key={field.key} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <label className="text-sm font-medium text-gray-900">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                </div>
                {mapping[field.key] !== undefined && mapping[field.key] !== -1 && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
              </div>

              <div className="flex items-center space-x-4">
                <select
                  value={mapping[field.key] ?? -1}
                  onChange={(e) => handleMappingChange(field.key, Number(e.target.value))}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={-1}>-- Spalte wählen --</option>
                  {fileData.headers.map((header, index) => (
                    <option key={index} value={index}>
                      {fileData.columnLetters[index]} - {header || '(ohne Name)'}
                    </option>
                  ))}
                </select>

                {mapping[field.key] !== undefined &&
                  mapping[field.key] !== -1 &&
                  fileData.previewRows.length > 0 && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <ArrowRight className="w-4 h-4" />
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                        {fileData.previewRows[0]?.[mapping[field.key]] !== undefined
                          ? String(fileData.previewRows[0][mapping[field.key]])
                          : '-'}
                      </span>
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {validation && validation.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-900">Warnungen</h3>
              <ul className="mt-2 space-y-1 text-sm text-yellow-700">
                {validation.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {validation && validation.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900">Fehler</h3>
              <ul className="mt-2 space-y-1 text-sm text-red-700">
                {validation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleContinue}
          disabled={!validation?.isValid}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            validation?.isValid
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Weiter zur Validierung
        </button>
      </div>
    </div>
  );
}
