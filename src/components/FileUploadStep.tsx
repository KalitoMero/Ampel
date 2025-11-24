import React, { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { parseFile, ParsedFileData } from '../utils/fileParser';

interface FileUploadStepProps {
  onFileUploaded: (data: ParsedFileData) => void;
}

export function FileUploadStep({ onFileUploaded }: FileUploadStepProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ParsedFileData | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setIsLoading(true);

    try {
      const parsedData = await parseFile(file);
      setPreview(parsedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Lesen der Datei');
      setPreview(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleContinue = () => {
    if (preview) {
      onFileUploaded(preview);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Datei hochladen</h2>
        <p className="text-gray-600">Laden Sie eine Excel- oder CSV-Datei hoch, um zu beginnen</p>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Upload className="w-8 h-8 text-blue-600" />
          </div>

          <div>
            <p className="text-lg font-medium text-gray-900 mb-1">
              Datei hierher ziehen oder
            </p>
            <label className="inline-block">
              <span className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
                durchsuchen
              </span>
              <input
                type="file"
                className="hidden"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileInput}
                disabled={isLoading}
              />
            </label>
          </div>

          <p className="text-sm text-gray-500">
            Unterstützte Formate: .xlsx, .xls, .csv
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Datei wird gelesen...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-900">Fehler</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {preview && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileSpreadsheet className="w-5 h-5 text-gray-600" />
              <div>
                <h3 className="font-medium text-gray-900">Vorschau</h3>
                <p className="text-sm text-gray-600">
                  {preview.headers.length} Spalten, {preview.allRows.length} Zeilen
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    Spalte
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    Header
                  </th>
                  {preview.previewRows.length > 0 &&
                    Array.from({ length: Math.min(5, preview.previewRows.length) }).map(
                      (_, i) => (
                        <th
                          key={i}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b"
                        >
                          Zeile {i + 1}
                        </th>
                      )
                    )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {preview.headers.map((header, colIndex) => (
                  <tr key={colIndex} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {preview.columnLetters[colIndex]}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {header || <span className="text-gray-400 italic">(leer)</span>}
                    </td>
                    {preview.previewRows.slice(0, 5).map((row, rowIndex) => (
                      <td key={rowIndex} className="px-4 py-3 text-sm text-gray-700">
                        {row[colIndex] !== null && row[colIndex] !== undefined
                          ? String(row[colIndex])
                          : <span className="text-gray-400">-</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button
              onClick={handleContinue}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Weiter zur Spaltenzuordnung
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
