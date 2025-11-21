import { supabase, ColumnMapping, getUserId } from '../lib/supabase';

function isExcelError(value: any): boolean {
  if (!value) return true;
  if (typeof value !== 'string') return false;

  const excelErrors = ['#NV', '#N/A', '#NAME?', '#DIV/0!', '#REF!', '#VALUE!', '#NUM!', '#NULL!'];
  const valueStr = value.toString().trim().toUpperCase();

  return excelErrors.some(error => valueStr.includes(error));
}

function isValidMachineName(value: any): boolean {
  if (!value) return false;

  const valueStr = value.toString().trim();

  if (isExcelError(valueStr)) return false;

  if (/^\d+$/.test(valueStr)) return false;

  if (!valueStr || valueStr === 'Unbekannt') return false;

  return true;
}

function parseDate(dateValue: any): Date | null {
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
}

export async function backfillMachineHoursFromExcelData(): Promise<{ success: boolean; error?: string; recordsProcessed?: number }> {
  try {
    const userId = await getUserId();

    const { data: mappings } = await supabase
      .from('column_mappings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (!mappings || mappings.length === 0) {
      return { success: false, error: 'No column mapping found' };
    }

    const mapping: ColumnMapping = mappings[0];

    if (!mapping.ressource || !mapping.datum || !mapping.ruestzeit || !mapping.serienzeit || !mapping.betriebsauftrag) {
      return { success: false, error: 'Incomplete column mapping' };
    }

    const { data: excelRows } = await supabase
      .from('excel_data')
      .select('*')
      .eq('mapping_id', mapping.id!);

    if (!excelRows || excelRows.length === 0) {
      return { success: false, error: 'No Excel data found' };
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

    const betriebsauftragMap = new Map<string, { ruestzeit: number; serienzeit: number; machine: string; date: Date }>();

    for (const row of excelRows) {
      const rowData = row.row_data as Record<string, any>;
      const dateValue = rowData[mapping.datum];
      const ruestzeitValue = rowData[mapping.ruestzeit];
      const serienzeitValue = rowData[mapping.serienzeit];
      const machineValue = rowData[mapping.ressource];
      const betriebsauftragValue = rowData[mapping.betriebsauftrag];

      const date = parseDate(dateValue);
      if (!date) continue;

      const betriebsauftrag = betriebsauftragValue?.toString().trim();
      if (!betriebsauftrag) continue;

      if (!isValidMachineName(machineValue)) continue;

      const machineName = machineValue.toString().trim();

      const ruestzeit = parseFloat(ruestzeitValue) || 0;
      const serienzeit = parseFloat(serienzeitValue) || 0;

      const key = `${betriebsauftrag}_${machineName}_${date.toISOString().split('T')[0]}`;

      if (!betriebsauftragMap.has(key)) {
        betriebsauftragMap.set(key, {
          ruestzeit: 0,
          serienzeit: 0,
          machine: machineName,
          date: date
        });
      }

      const entry = betriebsauftragMap.get(key)!;
      entry.ruestzeit += ruestzeit;
      entry.serienzeit += serienzeit;
    }

    const machineHoursMap = new Map<string, Map<string, number>>();

    for (const [, entry] of betriebsauftragMap) {
      const totalMinutes = entry.ruestzeit + entry.serienzeit;
      if (totalMinutes <= 0) continue;

      const totalHours = totalMinutes / 60;

      const dateKey = entry.date.toISOString().split('T')[0];

      if (!machineHoursMap.has(entry.machine)) {
        machineHoursMap.set(entry.machine, new Map());
      }

      const dateMap = machineHoursMap.get(entry.machine)!;
      dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + totalHours);
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
        return { success: false, error: insertError.message };
      }

      return { success: true, recordsProcessed: machineHoursToInsert.length };
    }

    return { success: true, recordsProcessed: 0 };
  } catch (err) {
    console.error('Error backfilling machine hours:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
