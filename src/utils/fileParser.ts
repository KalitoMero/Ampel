import * as XLSX from 'xlsx';

export interface ParsedFileData {
  headers: string[];
  columnLetters: string[];
  previewRows: any[][];
  allRows: any[][];
}

function getColumnLetter(index: number): string {
  let letter = '';
  while (index >= 0) {
    letter = String.fromCharCode(65 + (index % 26)) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
}

export function parseNumber(value: any): number | null {
  if (value === null || value === undefined) return null;

  if (typeof value === 'number') return value;

  const s = String(value).trim();
  if (!s) return null;

  const normalized = s
    .replace(/\s+/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '.');

  const n = Number(normalized);
  return isNaN(n) ? null : n;
}

export function parseDate(value: any): Date | null {
  if (!value) return null;

  if (value instanceof Date) return value;

  if (typeof value === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + value * 86400000);
  }

  const dateStr = String(value).trim();

  const formats = [
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/,
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      if (format.source.startsWith('^(\\d{4})')) {
        const [, year, month, day] = match;
        return new Date(Number(year), Number(month) - 1, Number(day));
      } else {
        const [, day, month, year] = match;
        return new Date(Number(year), Number(month) - 1, Number(day));
      }
    }
  }

  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export async function parseFile(file: File): Promise<ParsedFileData> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();

  if (fileExtension === 'csv') {
    return parseCSVFile(file);
  } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
    return parseExcelFile(file);
  } else {
    throw new Error('Nicht unterstütztes Dateiformat. Bitte .xlsx, .xls oder .csv verwenden.');
  }
}

function parseCSVFile(file: File): Promise<ParsedFileData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length === 0) {
          reject(new Error('CSV-Datei ist leer'));
          return;
        }

        const detectDelimiter = (line: string): string => {
          const delimiters = [';', ',', '\t', '|'];
          let maxCount = 0;
          let bestDelimiter = ';';

          for (const delimiter of delimiters) {
            const count = line.split(delimiter).length;
            if (count > maxCount) {
              maxCount = count;
              bestDelimiter = delimiter;
            }
          }

          return bestDelimiter;
        };

        const delimiter = detectDelimiter(lines[0]);

        const parseCSVLine = (line: string): string[] => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;

          for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === delimiter && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }

          result.push(current.trim());
          return result;
        };

        const allRows = lines.map(line => parseCSVLine(line));
        const headers = allRows[0];
        const dataRows = allRows.slice(1);

        const columnLetters = headers.map((_, index) => getColumnLetter(index));

        resolve({
          headers,
          columnLetters,
          previewRows: dataRows.slice(0, 5),
          allRows: dataRows,
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Fehler beim Lesen der CSV-Datei'));
    reader.readAsText(file, 'UTF-8');
  });
}

function parseExcelFile(file: File): Promise<ParsedFileData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
          header: 1,
          raw: false,
          dateNF: 'dd.mm.yyyy'
        }) as any[][];

        if (jsonData.length === 0) {
          reject(new Error('Excel-Datei ist leer'));
          return;
        }

        const headers = jsonData[0].map(h => String(h || '').trim());
        const dataRows = jsonData.slice(1).filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''));

        const columnLetters = headers.map((_, index) => getColumnLetter(index));

        resolve({
          headers,
          columnLetters,
          previewRows: dataRows.slice(0, 5),
          allRows: dataRows,
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Fehler beim Lesen der Excel-Datei'));
    reader.readAsBinaryString(file);
  });
}
