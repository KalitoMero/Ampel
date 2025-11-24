import { supabase } from '../lib/supabase';

export type TrafficLightColor = 'red' | 'yellow' | 'green' | 'gray';

export interface ScrapSettings {
  week_target: number;
  week_tolerance: number;
  month_target: number;
  month_tolerance: number;
}

export interface ScrapPeriodData {
  totalScrap: number;
  target: number;
  tolerance: number;
  color: TrafficLightColor;
  dateRange: string;
}

export interface ScrapMachineData {
  machine_name: string;
  total_scrap: number;
}

export interface ScrapDetailData {
  bab_number: string;
  scrap_amount: number;
  scrap_date: string;
}

export async function getScrapSettings(): Promise<ScrapSettings> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('scrap_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    const defaultSettings: ScrapSettings = {
      week_target: 100,
      week_tolerance: 150,
      month_target: 400,
      month_tolerance: 600,
    };

    const { data: newSettings, error: insertError } = await supabase
      .from('scrap_settings')
      .insert([{ user_id: user.id, ...defaultSettings }])
      .select()
      .single();

    if (insertError) throw insertError;
    return newSettings;
  }

  return data;
}

export async function updateScrapSettings(settings: ScrapSettings): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('scrap_settings')
    .update({ ...settings, updated_at: new Date().toISOString() })
    .eq('user_id', user.id);

  if (error) throw error;
}

function calculateScrapColor(totalScrap: number, target: number, tolerance: number): TrafficLightColor {
  if (totalScrap <= target) return 'green';
  if (totalScrap <= tolerance) return 'yellow';
  return 'red';
}

export async function getScrapDataForWeek(): Promise<ScrapPeriodData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const settings = await getScrapSettings();

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const startDate = new Date(yesterday);
  startDate.setDate(yesterday.getDate() - 6);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(yesterday);
  endDate.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('scrap_data')
    .select('scrap_amount')
    .eq('user_id', user.id)
    .gte('scrap_date', startDate.toISOString().split('T')[0])
    .lte('scrap_date', endDate.toISOString().split('T')[0]);

  if (error) throw error;

  const totalScrap = data?.reduce((sum, record) => sum + Number(record.scrap_amount), 0) || 0;

  const formatDate = (date: Date) => {
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.`;
  };

  const dateRange = `${formatDate(startDate)} - ${formatDate(endDate)}${endDate.getFullYear()}`;

  return {
    totalScrap,
    target: settings.week_target,
    tolerance: settings.week_tolerance,
    color: calculateScrapColor(totalScrap, settings.week_target, settings.week_tolerance),
    dateRange,
  };
}

export async function getScrapDataForMonth(): Promise<ScrapPeriodData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const settings = await getScrapSettings();

  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const { data, error } = await supabase
    .from('scrap_data')
    .select('scrap_amount')
    .eq('user_id', user.id)
    .gte('scrap_date', startOfMonth.toISOString().split('T')[0]);

  if (error) throw error;

  const totalScrap = data?.reduce((sum, record) => sum + Number(record.scrap_amount), 0) || 0;

  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];

  const dateRange = `${monthNames[today.getMonth()]} ${today.getFullYear()}`;

  return {
    totalScrap,
    target: settings.month_target,
    tolerance: settings.month_tolerance,
    color: calculateScrapColor(totalScrap, settings.month_target, settings.month_tolerance),
    dateRange,
  };
}

export async function getScrapMachinesForWeek(): Promise<ScrapMachineData[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const startDate = new Date(yesterday);
  startDate.setDate(yesterday.getDate() - 6);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(yesterday);
  endDate.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('scrap_data')
    .select('machine_name, scrap_amount')
    .eq('user_id', user.id)
    .gte('scrap_date', startDate.toISOString().split('T')[0])
    .lte('scrap_date', endDate.toISOString().split('T')[0]);

  if (error) throw error;

  const machineMap = new Map<string, number>();
  data?.forEach(record => {
    const current = machineMap.get(record.machine_name) || 0;
    machineMap.set(record.machine_name, current + Number(record.scrap_amount));
  });

  return Array.from(machineMap.entries())
    .map(([machine_name, total_scrap]) => ({ machine_name, total_scrap }))
    .sort((a, b) => b.total_scrap - a.total_scrap);
}

export async function getScrapDetailsForMachine(machineName: string): Promise<ScrapDetailData[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const startDate = new Date(yesterday);
  startDate.setDate(yesterday.getDate() - 6);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(yesterday);
  endDate.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('scrap_data')
    .select('bab_number, scrap_amount, scrap_date')
    .eq('user_id', user.id)
    .eq('machine_name', machineName)
    .gte('scrap_date', startDate.toISOString().split('T')[0])
    .lte('scrap_date', endDate.toISOString().split('T')[0])
    .order('scrap_date', { ascending: false });

  if (error) throw error;

  return data || [];
}
