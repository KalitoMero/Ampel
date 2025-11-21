import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ColumnMapping {
  id?: string;
  user_id?: string;
  mapping_name: string;
  ruestzeit: string | null;
  serienzeit: string | null;
  ausschussmenge: string | null;
  datum: string | null;
  auftragsnummer: string | null;
  ressource: string | null;
  menge_gut: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TrafficLightSettings {
  id?: string;
  user_id?: string;
  setting_key: string;
  target_hours_14d: number;
  green_min_ratio: number;
  yellow_min_ratio: number;
  created_at?: string;
  updated_at?: string;
}

export interface ExcelData {
  id?: string;
  user_id?: string;
  mapping_id: string;
  file_name: string;
  row_data: Record<string, any>;
  uploaded_at?: string;
  created_at?: string;
}

export interface UserPreferences {
  id?: string;
  user_id?: string;
  last_datum_column: string | null;
  last_ruestzeit_column: string | null;
  last_serienzeit_column: string | null;
  last_schicht_column: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface MachineTarget {
  id?: string;
  user_id?: string;
  machine_name: string;
  target_hours_14d: number;
  created_at?: string;
  updated_at?: string;
}

export interface MachineHours {
  id?: string;
  user_id?: string;
  machine_name: string;
  date: string;
  hours_worked: number;
  target_hours: number;
  created_at?: string;
  updated_at?: string;
}

export async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  return user.id;
}
