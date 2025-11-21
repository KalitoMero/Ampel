import { supabase, ColumnMapping, ExcelData, TrafficLightSettings } from '../lib/supabase';

export type TrafficLightColor = 'red' | 'yellow' | 'green' | 'gray';

export interface HoursData {
  totalHours: number;
  targetHours: number;
  color: TrafficLightColor;
  percentage: number;
  daysCount: number;
  startDate: string;
  endDate: string;
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

function isWithinLast14Days(date: Date): boolean {
  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  return date >= fourteenDaysAgo && date <= now;
}

function isWithinDateRange(date: Date, daysBack: number, daysForward: number = 0): boolean {
  const now = new Date();
  const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  const endDate = new Date(now.getTime() - daysForward * 24 * 60 * 60 * 1000);
  return date >= startDate && date <= endDate;
}

async function calculateHoursForPeriod(
  daysBack: number,
  daysForward: number = 0,
  targetHoursMultiplier: number = 1,
  settingKey: string = 'hours_14d'
): Promise<HoursData> {
  const now = new Date();
  const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  const endDate = new Date(now.getTime() - daysForward * 24 * 60 * 60 * 1000);
  try {
    const { data: mappings } = await supabase
      .from('column_mappings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (!mappings || mappings.length === 0) {
      return {
        totalHours: 0,
        targetHours: 450 * targetHoursMultiplier,
        color: 'gray',
        percentage: 0,
        daysCount: daysBack - daysForward,
        startDate: startDate.toLocaleDateString('de-DE'),
        endDate: endDate.toLocaleDateString('de-DE'),
      };
    }

    const mapping: ColumnMapping = mappings[0];

    const { data: excelRows } = await supabase
      .from('excel_data')
      .select('*')
      .eq('mapping_id', mapping.id!);

    if (!excelRows || excelRows.length === 0) {
      return {
        totalHours: 0,
        targetHours: 450 * targetHoursMultiplier,
        color: 'gray',
        percentage: 0,
        daysCount: daysBack - daysForward,
        startDate: startDate.toLocaleDateString('de-DE'),
        endDate: endDate.toLocaleDateString('de-DE'),
      };
    }

    const hoursColumn = mapping.stunden_teg;
    const dateColumn = mapping.datum;

    if (!hoursColumn || !dateColumn) {
      return {
        totalHours: 0,
        targetHours: 450 * targetHoursMultiplier,
        color: 'gray',
        percentage: 0,
        daysCount: daysBack - daysForward,
        startDate: startDate.toLocaleDateString('de-DE'),
        endDate: endDate.toLocaleDateString('de-DE'),
      };
    }

    let totalHours = 0;
    const uniqueRows = new Map<string, Record<string, any>>();

    for (const row of excelRows) {
      const rowData = row.row_data as Record<string, any>;
      const ressourceValue = mapping.ressource ? rowData[mapping.ressource] : '';
      const auftragValue = mapping.auftragsnummer ? rowData[mapping.auftragsnummer] : '';
      const uniqueKey = rowData['lfd_nr'] || `${rowData[dateColumn]}_${rowData[hoursColumn]}_${ressourceValue}_${auftragValue}`;

      if (!uniqueRows.has(uniqueKey)) {
        uniqueRows.set(uniqueKey, rowData);
      }
    }

    for (const rowData of uniqueRows.values()) {
      const dateValue = rowData[dateColumn];
      const hoursValue = rowData[hoursColumn];

      const date = parseDate(dateValue);

      if (date && isWithinDateRange(date, daysBack, daysForward)) {
        const hours = parseFloat(hoursValue);
        if (!isNaN(hours)) {
          totalHours += hours;
        }
      }
    }

    const { data: settings } = await supabase
      .from('traffic_light_settings')
      .select('*')
      .eq('setting_key', 'hours_14d')
      .maybeSingle();

    const baseTargetHours = settings?.target_hours_14d ?? 450;
    const actualTargetHours = baseTargetHours * targetHoursMultiplier;
    const greenMinRatio = settings?.green_min_ratio ?? 0.95;
    const yellowMinRatio = settings?.yellow_min_ratio ?? 0.80;

    const percentage = (totalHours / actualTargetHours) * 100;

    let color: TrafficLightColor = 'red';
    if (totalHours >= actualTargetHours * greenMinRatio) {
      color = 'green';
    } else if (totalHours >= actualTargetHours * yellowMinRatio) {
      color = 'yellow';
    }

    return {
      totalHours,
      targetHours: actualTargetHours,
      color,
      percentage,
      daysCount: daysBack - daysForward,
      startDate: startDate.toLocaleDateString('de-DE'),
      endDate: endDate.toLocaleDateString('de-DE'),
    };
  } catch (error) {
    console.error('Error calculating hours:', error);
    return {
      totalHours: 0,
      targetHours: 450 * targetHoursMultiplier,
      color: 'gray',
      percentage: 0,
      daysCount: daysBack - daysForward,
      startDate: startDate.toLocaleDateString('de-DE'),
      endDate: endDate.toLocaleDateString('de-DE'),
    };
  }
}

export async function calculateHours14Days(): Promise<HoursData> {
  return calculateHoursForPeriod(14, 0, 1, 'hours_14d');
}

export async function calculateHoursWeek3And4(): Promise<HoursData> {
  return calculateHoursForPeriod(28, 14, 1, 'hours_week_3_4');
}

export async function calculateHours8Weeks(): Promise<HoursData> {
  return calculateHoursForPeriod(56, 0, 4, 'hours_8_weeks');
}
