import * as XLSX from 'xlsx';

export function parseExcelFile(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        if (jsonData.length === 0) {
          reject(new Error('Excel-Datei ist leer'));
          return;
        }

        const headers = jsonData[0] as string[];
        resolve(headers.filter(h => h && h.trim() !== ''));
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'));
    reader.readAsBinaryString(file);
  });
}

export function parseExcelFileWithData(file: File): Promise<{ headers: string[]; rows: Record<string, any>[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        if (jsonData.length === 0) {
          reject(new Error('Excel-Datei ist leer'));
          return;
        }

        const firstRow = jsonData[0] as Record<string, any>;
        const headers = Object.keys(firstRow);

        resolve({
          headers: headers.filter(h => h && h.trim() !== ''),
          rows: jsonData as Record<string, any>[],
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'));
    reader.readAsBinaryString(file);
  });
}

export function autoDetectColumn(columns: string[], keywords: string[]): string {
  const normalizedColumns = columns.map(col => col.toLowerCase().trim());

  for (const keyword of keywords) {
    const normalizedKeyword = keyword.toLowerCase();
    const exactMatch = normalizedColumns.findIndex(col => col === normalizedKeyword);
    if (exactMatch !== -1) {
      return columns[exactMatch];
    }
  }

  for (const keyword of keywords) {
    const normalizedKeyword = keyword.toLowerCase();
    const partialMatch = normalizedColumns.findIndex(col => col.includes(normalizedKeyword));
    if (partialMatch !== -1) {
      return columns[partialMatch];
    }
  }

  return '';
}

export function autoMapColumns(columns: string[]): {
  stunden_teg: string;
  ausschussmenge: string;
  datum: string;
  auftragsnummer: string;
  ressource: string;
  menge_gut: string;
} {
  return {
    stunden_teg: autoDetectColumn(columns, ['teg [h]', 'teg', 'stunden', 'hours', 'zeit']),
    ausschussmenge: autoDetectColumn(columns, ['ausschuss', 'scrap', 'ausschussmenge']),
    datum: autoDetectColumn(columns, ['datum', 'date', 'jahr/monat', 'monat', 'periode']),
    auftragsnummer: autoDetectColumn(columns, ['auftragsnummer', 'ba-kürzel', 'auftrag', 'order', 'ba']),
    ressource: autoDetectColumn(columns, ['ressource', 'maschine', 'machine', 'resource']),
    menge_gut: autoDetectColumn(columns, ['menge gut', 'gut', 'good quantity', 'quantity']),
  };
}
