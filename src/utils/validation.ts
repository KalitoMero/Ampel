import { parseNumber, parseDate } from './fileParser';

export interface ColumnMapping {
  [key: string]: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidatedRow {
  [key: string]: any;
  _rowIndex: number;
  _validationErrors: string[];
}

export function validateColumnMapping(
  mapping: ColumnMapping,
  requiredFields: string[],
  availableColumns: number
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const field of requiredFields) {
    if (mapping[field] === undefined || mapping[field] === null || mapping[field] === -1) {
      errors.push(`Pflichtfeld "${field}" wurde nicht zugeordnet`);
    } else if (mapping[field] < 0 || mapping[field] >= availableColumns) {
      errors.push(`Ungültiger Spaltenindex für "${field}"`);
    }
  }

  const usedIndices = new Set<number>();
  for (const [field, index] of Object.entries(mapping)) {
    if (index !== undefined && index !== null && index !== -1) {
      if (usedIndices.has(index)) {
        warnings.push(`Spalte ${index} wurde mehrfach zugeordnet`);
      }
      usedIndices.add(index);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateAndParseData(
  rows: any[][],
  mapping: ColumnMapping,
  fieldTypes: { [key: string]: 'number' | 'string' | 'date' }
): ValidatedRow[] {
  const validatedRows: ValidatedRow[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const validatedRow: ValidatedRow = {
      _rowIndex: i + 2,
      _validationErrors: [],
    };

    for (const [fieldName, columnIndex] of Object.entries(mapping)) {
      if (columnIndex === undefined || columnIndex === null || columnIndex === -1) {
        continue;
      }

      const rawValue = row[columnIndex];
      const fieldType = fieldTypes[fieldName];

      if (fieldType === 'number') {
        const parsed = parseNumber(rawValue);
        if (rawValue !== null && rawValue !== undefined && rawValue !== '' && parsed === null) {
          validatedRow._validationErrors.push(
            `Zeile ${i + 2}, Feld "${fieldName}": Ungültiger Zahlenwert "${rawValue}"`
          );
        }
        validatedRow[fieldName] = parsed;
      } else if (fieldType === 'date') {
        const parsed = parseDate(rawValue);
        if (rawValue !== null && rawValue !== undefined && rawValue !== '' && parsed === null) {
          validatedRow._validationErrors.push(
            `Zeile ${i + 2}, Feld "${fieldName}": Ungültiges Datum "${rawValue}"`
          );
        }
        validatedRow[fieldName] = parsed;
      } else {
        validatedRow[fieldName] = rawValue !== null && rawValue !== undefined ? String(rawValue).trim() : '';
      }
    }

    validatedRows.push(validatedRow);
  }

  return validatedRows;
}

export function getValidationSummary(validatedRows: ValidatedRow[]): {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: string[];
} {
  const allErrors: string[] = [];
  let invalidCount = 0;

  for (const row of validatedRows) {
    if (row._validationErrors.length > 0) {
      invalidCount++;
      allErrors.push(...row._validationErrors);
    }
  }

  return {
    totalRows: validatedRows.length,
    validRows: validatedRows.length - invalidCount,
    invalidRows: invalidCount,
    errors: allErrors,
  };
}
