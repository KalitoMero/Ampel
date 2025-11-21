import { supabase } from '../lib/supabase';

export type TrafficLightColor = 'red' | 'yellow' | 'green' | 'gray';

export interface OEESettings {
  default_planned_production_time: number;
  default_ideal_cycle_time: number;
  default_target_oee: number;
  green_min_oee: number;
  yellow_min_oee: number;
}

export interface OEEData {
  id: string;
  machine_name: string;
  date: string;
  planned_production_time: number;
  downtime: number;
  good_pieces: number;
  total_pieces: number;
  ideal_cycle_time: number;
  availability: number;
  performance: number;
  quality: number;
  oee: number;
}

export interface OEEMachineSummary {
  machine_name: string;
  avg_oee: number;
  avg_availability: number;
  avg_performance: number;
  avg_quality: number;
  total_good_pieces: number;
  total_pieces: number;
  color: TrafficLightColor;
}

export interface OEEPeriodSummary {
  avg_oee: number;
  avg_availability: number;
  avg_performance: number;
  avg_quality: number;
  target_oee: number;
  color: TrafficLightColor;
  machines: OEEMachineSummary[];
  startDate: string;
  endDate: string;
}

export async function getOEESettings(): Promise<OEESettings> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('oee_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    const defaultSettings: OEESettings = {
      default_planned_production_time: 16,
      default_ideal_cycle_time: 1.0,
      default_target_oee: 85,
      green_min_oee: 85,
      yellow_min_oee: 70,
    };

    const { data: newSettings, error: insertError } = await supabase
      .from('oee_settings')
      .insert([{ user_id: user.id, ...defaultSettings }])
      .select()
      .single();

    if (insertError) throw insertError;
    return newSettings;
  }

  return data;
}

export async function updateOEESettings(settings: OEESettings): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('oee_settings')
    .update({ ...settings, updated_at: new Date().toISOString() })
    .eq('user_id', user.id);

  if (error) throw error;
}

export function calculateOEE(
  plannedProductionTime: number,
  downtime: number,
  goodPieces: number,
  totalPieces: number,
  idealCycleTime: number
): {
  availability: number;
  performance: number;
  quality: number;
  oee: number;
} {
  const runTime = plannedProductionTime - downtime;
  const availability = plannedProductionTime > 0 ? (runTime / plannedProductionTime) * 100 : 0;

  const idealProductionTime = (totalPieces * idealCycleTime) / 60;
  const performance = runTime > 0 && idealProductionTime > 0 ? (idealProductionTime / runTime) * 100 : 0;

  const quality = totalPieces > 0 ? (goodPieces / totalPieces) * 100 : 0;

  const oee = (availability * performance * quality) / 10000;

  return {
    availability: Math.min(availability, 100),
    performance: Math.min(performance, 100),
    quality: Math.min(quality, 100),
    oee: Math.min(oee, 100),
  };
}

export async function saveOEEData(data: {
  machine_name: string;
  date: string;
  planned_production_time: number;
  downtime: number;
  good_pieces: number;
  total_pieces: number;
  ideal_cycle_time: number;
}): Promise<OEEData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const metrics = calculateOEE(
    data.planned_production_time,
    data.downtime,
    data.good_pieces,
    data.total_pieces,
    data.ideal_cycle_time
  );

  const { data: existing, error: fetchError } = await supabase
    .from('oee_data')
    .select('id')
    .eq('user_id', user.id)
    .eq('machine_name', data.machine_name)
    .eq('date', data.date)
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from('oee_data')
      .update({
        ...data,
        ...metrics,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (updateError) throw updateError;
    return updated;
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from('oee_data')
      .insert([{
        user_id: user.id,
        ...data,
        ...metrics,
      }])
      .select()
      .single();

    if (insertError) throw insertError;
    return inserted;
  }
}

function getDateRange(periodType: 'week' | '14days' | 'month') {
  const now = new Date();
  now.setHours(23, 59, 59, 999);

  let startDate: Date;
  let endDate: Date = now;

  if (periodType === 'week') {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - now.getDay() + 1);
    startDate.setHours(0, 0, 0, 0);
  } else if (periodType === '14days') {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 14);
    startDate.setHours(0, 0, 0, 0);
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    startDate.setHours(0, 0, 0, 0);
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    startDateFormatted: startDate.toLocaleDateString('de-DE'),
    endDateFormatted: endDate.toLocaleDateString('de-DE'),
  };
}

function calculateColor(oee: number, greenMin: number, yellowMin: number): TrafficLightColor {
  if (oee >= greenMin) return 'green';
  if (oee >= yellowMin) return 'yellow';
  return 'red';
}

export async function getOEEPeriodSummary(periodType: 'week' | '14days' | 'month'): Promise<OEEPeriodSummary> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { startDate, endDate, startDateFormatted, endDateFormatted } = getDateRange(periodType);
  const settings = await getOEESettings();

  const { data, error } = await supabase
    .from('oee_data')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  if (error) throw error;

  if (!data || data.length === 0) {
    return {
      avg_oee: 0,
      avg_availability: 0,
      avg_performance: 0,
      avg_quality: 0,
      target_oee: settings.default_target_oee,
      color: 'gray',
      machines: [],
      startDate: startDateFormatted,
      endDate: endDateFormatted,
    };
  }

  const machineMap = new Map<string, {
    oee_sum: number;
    availability_sum: number;
    performance_sum: number;
    quality_sum: number;
    count: number;
    good_pieces: number;
    total_pieces: number;
  }>();

  let totalOEE = 0;
  let totalAvailability = 0;
  let totalPerformance = 0;
  let totalQuality = 0;

  for (const row of data) {
    totalOEE += row.oee;
    totalAvailability += row.availability;
    totalPerformance += row.performance;
    totalQuality += row.quality;

    const existing = machineMap.get(row.machine_name) || {
      oee_sum: 0,
      availability_sum: 0,
      performance_sum: 0,
      quality_sum: 0,
      count: 0,
      good_pieces: 0,
      total_pieces: 0,
    };

    existing.oee_sum += row.oee;
    existing.availability_sum += row.availability;
    existing.performance_sum += row.performance;
    existing.quality_sum += row.quality;
    existing.count += 1;
    existing.good_pieces += row.good_pieces;
    existing.total_pieces += row.total_pieces;

    machineMap.set(row.machine_name, existing);
  }

  const avg_oee = totalOEE / data.length;
  const avg_availability = totalAvailability / data.length;
  const avg_performance = totalPerformance / data.length;
  const avg_quality = totalQuality / data.length;

  const machines: OEEMachineSummary[] = Array.from(machineMap.entries())
    .map(([machine_name, stats]) => ({
      machine_name,
      avg_oee: stats.oee_sum / stats.count,
      avg_availability: stats.availability_sum / stats.count,
      avg_performance: stats.performance_sum / stats.count,
      avg_quality: stats.quality_sum / stats.count,
      total_good_pieces: stats.good_pieces,
      total_pieces: stats.total_pieces,
      color: calculateColor(
        stats.oee_sum / stats.count,
        settings.green_min_oee,
        settings.yellow_min_oee
      ),
    }))
    .sort((a, b) => b.avg_oee - a.avg_oee);

  return {
    avg_oee,
    avg_availability,
    avg_performance,
    avg_quality,
    target_oee: settings.default_target_oee,
    color: calculateColor(avg_oee, settings.green_min_oee, settings.yellow_min_oee),
    machines,
    startDate: startDateFormatted,
    endDate: endDateFormatted,
  };
}

export async function getOEEMachineData(machineName: string, periodType: 'week' | '14days' | 'month'): Promise<OEEData[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { startDate, endDate } = getDateRange(periodType);

  const { data, error } = await supabase
    .from('oee_data')
    .select('*')
    .eq('user_id', user.id)
    .eq('machine_name', machineName)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  if (error) throw error;

  return data || [];
}
