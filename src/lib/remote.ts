/**
 * Supabase data access.
 *
 * The diary and profile live entirely on the device — the only thing fetched
 * remotely is the shared food catalog, which is world-readable and needs no
 * account. Returns null on any failure so the caller falls back to the bundled
 * list rather than surfacing an error.
 */

import { Food } from '@/lib/nutrition';
import { supabase } from '@/lib/supabase';

type FoodRow = {
  id: string;
  name: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export async function fetchFoods(): Promise<Food[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('foods')
    .select('id,name,serving,calories,protein,carbs,fat')
    .order('name');
  if (error || !data) return null;
  return data as FoodRow[];
}
