import { supabase } from '../lib/supabase';

export type TrafficLightColor = 'red' | 'yellow' | 'green' | 'gray';

export interface MachineHoursSummary {
  machine: string;
  hours: number;
  targetHours: number;
  percentage: number;
}

export interface PeriodSummary {
  totalHours: number;
  totalTargetHours: number;
  machineData: MachineHoursSummary[];
  startDate: string;
  endDate: string;
}

export interface TrafficLightData {
  totalHours: number;
  targetHours: number;
  color: TrafficLightColor;
  percentage: number;
  daysCount: number;
  startDate: string;
  endDate: string;
}

function getDateRange(periodType: '14days' | 'week3and4' | '8weeks') {
  const now = new Date();
  now.setHours(23, 59, 59, 999);

  let startDate: Date;
  let endDate: Date;

  if (periodType === '14days') {
    endDate = now;
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 14);
    startDate.setHours(0, 0, 0, 0);
  } else if (periodType === 'week3and4') {
    endDate = new Date(now);
    endDate.setDate(now.getDate() - 14);
    endDate.setHours(23, 59, 59, 999);
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 28);
    startDate.setHours(0, 0, 0, 0);
  } else {
    endDate = now;
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 56);
    startDate.setHours(0, 0, 0, 0);
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    startDateFormatted: startDate.toLocaleDateString('de-DE'),
    endDateFormatted: endDate.toLocaleDateString('de-DE'),
  };
}

export async function getMachineHoursSummary(
  periodType: '14days' | 'week3and4' | '8weeks'
): Promise<PeriodSummary> {
  const { startDate, endDate, startDateFormatted, endDateFormatted } = getDateRange(periodType);

  const { data, error } = await supabase
    .from('machine_hours')
    .select('machine_name, hours_worked, date')
    .gte('date', startDate)
    .lte('date', endDate);

  if (error) {
    console.error('Error fetching machine hours:', error);
    return {
      totalHours: 0,
      totalTargetHours: 0,
      machineData: [],
      startDate: startDateFormatted,
      endDate: endDateFormatted,
    };
  }

  const { data: machineTargets } = await supabase
    .from('machine_targets')
    .select('machine_name, target_hours_14d');

  const targetsMap = new Map<string, number>();
  if (machineTargets) {
    for (const target of machineTargets) {
      let targetHours = target.target_hours_14d;
      if (periodType === '8weeks') {
        targetHours = targetHours * 4;
      }
      targetsMap.set(target.machine_name, targetHours);
    }
  }

  if (!data || data.length === 0) {
    return {
      totalHours: 0,
      totalTargetHours: 0,
      machineData: [],
      startDate: startDateFormatted,
      endDate: endDateFormatted,
    };
  }

  const machineMap = new Map<string, number>();

  for (const row of data) {
    const existing = machineMap.get(row.machine_name) || 0;
    machineMap.set(row.machine_name, existing + row.hours_worked);
  }

  let totalHours = 0;
  let totalTargetHours = 0;

  const machineData: MachineHoursSummary[] = Array.from(machineMap.entries())
    .map(([machine, hours]) => {
      const targetHours = targetsMap.get(machine) || 0;
      totalHours += hours;
      totalTargetHours += targetHours;

      return {
        machine,
        hours,
        targetHours,
        percentage: targetHours > 0 ? (hours / targetHours) * 100 : 0,
      };
    })
    .sort((a, b) => b.hours - a.hours);

  return {
    totalHours,
    totalTargetHours,
    machineData,
    startDate: startDateFormatted,
    endDate: endDateFormatted,
  };
}

async function getTrafficLightSettings() {
  const { data: settings } = await supabase
    .from('traffic_light_settings')
    .select('*')
    .eq('setting_key', 'hours_14d')
    .maybeSingle();

  return {
    targetHours14d: settings?.target_hours_14d ?? 450,
    greenMinRatio: settings?.green_min_ratio ?? 0.95,
    yellowMinRatio: settings?.yellow_min_ratio ?? 0.80,
  };
}

function calculateTrafficLightColor(
  totalHours: number,
  targetHours: number,
  greenMinRatio: number,
  yellowMinRatio: number
): TrafficLightColor {
  if (targetHours === 0) return 'gray';

  if (totalHours >= targetHours * greenMinRatio) {
    return 'green';
  } else if (totalHours >= targetHours * yellowMinRatio) {
    return 'yellow';
  }
  return 'red';
}

export async function getTrafficLightDataForPeriod(
  periodType: '14days' | 'week3and4' | '8weeks'
): Promise<TrafficLightData> {
  const { startDate, endDate, startDateFormatted, endDateFormatted } = getDateRange(periodType);

  const settings = await getTrafficLightSettings();

  const daysCount = periodType === '14days' ? 14 : periodType === 'week3and4' ? 14 : 56;
  const targetHours = periodType === '14days'
    ? settings.targetHours14d
    : periodType === 'week3and4'
    ? settings.targetHours14d
    : settings.targetHours14d * 4;

  const { data, error } = await supabase
    .from('machine_hours')
    .select('hours_worked')
    .gte('date', startDate)
    .lte('date', endDate);

  if (error || !data || data.length === 0) {
    return {
      totalHours: 0,
      targetHours,
      color: 'gray',
      percentage: 0,
      daysCount,
      startDate: startDateFormatted,
      endDate: endDateFormatted,
    };
  }

  let totalHours = 0;

  for (const row of data) {
    totalHours += row.hours_worked;
  }

  const percentage = targetHours > 0 ? (totalHours / targetHours) * 100 : 0;
  const color = calculateTrafficLightColor(
    totalHours,
    targetHours,
    settings.greenMinRatio,
    settings.yellowMinRatio
  );

  return {
    totalHours,
    targetHours,
    color,
    percentage,
    daysCount,
    startDate: startDateFormatted,
    endDate: endDateFormatted,
  };
}
