import { Food } from '@/lib/nutrition';

/**
 * Offline starter food list. Values are per the stated serving and rounded to
 * whole grams — close enough for tracking, and it keeps the app usable with no
 * network or API key. Swap in a real food API later behind the same `Food` type.
 */
export const FOODS: Food[] = [
  // Staples & grains
  { id: 'rice-white', name: 'White rice, cooked', serving: '1 cup (158g)', calories: 205, protein: 4, carbs: 45, fat: 0 },
  { id: 'rice-brown', name: 'Brown rice, cooked', serving: '1 cup (195g)', calories: 218, protein: 5, carbs: 46, fat: 2 },
  { id: 'oats', name: 'Oatmeal, cooked', serving: '1 cup (234g)', calories: 154, protein: 6, carbs: 27, fat: 3 },
  { id: 'bread-white', name: 'White bread', serving: '1 slice (28g)', calories: 75, protein: 3, carbs: 14, fat: 1 },
  { id: 'bread-wheat', name: 'Whole wheat bread', serving: '1 slice (32g)', calories: 82, protein: 4, carbs: 14, fat: 1 },
  { id: 'pandesal', name: 'Pandesal', serving: '1 piece (33g)', calories: 98, protein: 3, carbs: 18, fat: 2 },
  { id: 'pasta', name: 'Pasta, cooked', serving: '1 cup (140g)', calories: 220, protein: 8, carbs: 43, fat: 1 },
  { id: 'potato', name: 'Potato, baked', serving: '1 medium (173g)', calories: 161, protein: 4, carbs: 37, fat: 0 },
  { id: 'sweet-potato', name: 'Sweet potato (kamote)', serving: '1 medium (130g)', calories: 112, protein: 2, carbs: 26, fat: 0 },

  // Protein
  { id: 'chicken-breast', name: 'Chicken breast, grilled', serving: '100g', calories: 165, protein: 31, carbs: 0, fat: 4 },
  { id: 'chicken-thigh', name: 'Chicken thigh, roasted', serving: '100g', calories: 209, protein: 26, carbs: 0, fat: 11 },
  { id: 'pork-belly', name: 'Pork belly (liempo), grilled', serving: '100g', calories: 366, protein: 20, carbs: 0, fat: 31 },
  { id: 'pork-chop', name: 'Pork chop, lean', serving: '100g', calories: 231, protein: 26, carbs: 0, fat: 14 },
  { id: 'beef-ground', name: 'Ground beef, 85% lean', serving: '100g', calories: 250, protein: 26, carbs: 0, fat: 15 },
  { id: 'beef-sirloin', name: 'Beef sirloin, grilled', serving: '100g', calories: 206, protein: 30, carbs: 0, fat: 9 },
  { id: 'bangus', name: 'Bangus (milkfish), grilled', serving: '100g', calories: 162, protein: 21, carbs: 0, fat: 8 },
  { id: 'tilapia', name: 'Tilapia, grilled', serving: '100g', calories: 128, protein: 26, carbs: 0, fat: 3 },
  { id: 'salmon', name: 'Salmon, baked', serving: '100g', calories: 208, protein: 20, carbs: 0, fat: 13 },
  { id: 'tuna-can', name: 'Tuna, canned in water', serving: '1 can (142g)', calories: 128, protein: 29, carbs: 0, fat: 1 },
  { id: 'shrimp', name: 'Shrimp, cooked', serving: '100g', calories: 99, protein: 24, carbs: 0, fat: 0 },
  { id: 'egg', name: 'Egg, large', serving: '1 egg (50g)', calories: 72, protein: 6, carbs: 0, fat: 5 },
  { id: 'tofu', name: 'Tofu, firm', serving: '100g', calories: 144, protein: 17, carbs: 3, fat: 9 },
  { id: 'tocino', name: 'Tocino', serving: '100g', calories: 265, protein: 15, carbs: 18, fat: 14 },
  { id: 'longganisa', name: 'Longganisa', serving: '2 pieces (80g)', calories: 260, protein: 13, carbs: 6, fat: 20 },

  // Filipino dishes
  { id: 'adobo-chicken', name: 'Chicken adobo', serving: '1 cup (240g)', calories: 372, protein: 30, carbs: 8, fat: 24 },
  { id: 'sinigang-pork', name: 'Pork sinigang', serving: '1 bowl (350g)', calories: 290, protein: 22, carbs: 12, fat: 18 },
  { id: 'tinola', name: 'Chicken tinola', serving: '1 bowl (350g)', calories: 215, protein: 24, carbs: 9, fat: 9 },
  { id: 'sisig', name: 'Pork sisig', serving: '1 serving (150g)', calories: 410, protein: 22, carbs: 5, fat: 34 },
  { id: 'lumpia', name: 'Lumpiang shanghai', serving: '3 pieces (75g)', calories: 220, protein: 8, carbs: 16, fat: 14 },
  { id: 'pancit', name: 'Pancit canton', serving: '1 cup (220g)', calories: 320, protein: 12, carbs: 45, fat: 10 },

  // Vegetables & fruit
  { id: 'broccoli', name: 'Broccoli, steamed', serving: '1 cup (156g)', calories: 55, protein: 4, carbs: 11, fat: 1 },
  { id: 'spinach', name: 'Spinach, raw', serving: '1 cup (30g)', calories: 7, protein: 1, carbs: 1, fat: 0 },
  { id: 'mixed-veg', name: 'Mixed vegetables, cooked', serving: '1 cup (160g)', calories: 118, protein: 5, carbs: 24, fat: 1 },
  { id: 'banana', name: 'Banana', serving: '1 medium (118g)', calories: 105, protein: 1, carbs: 27, fat: 0 },
  { id: 'apple', name: 'Apple', serving: '1 medium (182g)', calories: 95, protein: 0, carbs: 25, fat: 0 },
  { id: 'mango', name: 'Mango', serving: '1 medium (200g)', calories: 135, protein: 2, carbs: 35, fat: 1 },
  { id: 'avocado', name: 'Avocado', serving: '1/2 fruit (100g)', calories: 160, protein: 2, carbs: 9, fat: 15 },

  // Dairy & drinks
  { id: 'milk', name: 'Milk, whole', serving: '1 cup (244g)', calories: 149, protein: 8, carbs: 12, fat: 8 },
  { id: 'milk-skim', name: 'Milk, skim', serving: '1 cup (245g)', calories: 83, protein: 8, carbs: 12, fat: 0 },
  { id: 'yogurt-greek', name: 'Greek yogurt, plain', serving: '170g cup', calories: 100, protein: 17, carbs: 6, fat: 1 },
  { id: 'cheese-cheddar', name: 'Cheddar cheese', serving: '1 slice (28g)', calories: 113, protein: 7, carbs: 0, fat: 9 },
  { id: 'coffee-black', name: 'Coffee, black', serving: '1 cup (240ml)', calories: 2, protein: 0, carbs: 0, fat: 0 },
  { id: 'coffee-latte', name: 'Café latte', serving: '1 grande (473ml)', calories: 190, protein: 13, carbs: 19, fat: 7 },
  { id: 'soda', name: 'Soft drink, regular', serving: '1 can (330ml)', calories: 139, protein: 0, carbs: 35, fat: 0 },
  { id: 'beer', name: 'Beer', serving: '1 bottle (330ml)', calories: 142, protein: 1, carbs: 11, fat: 0 },
  { id: 'whey', name: 'Whey protein shake', serving: '1 scoop (30g)', calories: 120, protein: 24, carbs: 3, fat: 1 },

  // Snacks & fast food
  { id: 'peanut-butter', name: 'Peanut butter', serving: '2 tbsp (32g)', calories: 188, protein: 8, carbs: 6, fat: 16 },
  { id: 'almonds', name: 'Almonds', serving: '28g (23 nuts)', calories: 164, protein: 6, carbs: 6, fat: 14 },
  { id: 'chips', name: 'Potato chips', serving: '28g bag', calories: 152, protein: 2, carbs: 15, fat: 10 },
  { id: 'chocolate', name: 'Milk chocolate bar', serving: '1 bar (45g)', calories: 235, protein: 3, carbs: 26, fat: 13 },
  { id: 'ice-cream', name: 'Ice cream, vanilla', serving: '1/2 cup (66g)', calories: 137, protein: 2, carbs: 16, fat: 7 },
  { id: 'burger', name: 'Cheeseburger, fast food', serving: '1 burger (120g)', calories: 303, protein: 15, carbs: 33, fat: 13 },
  { id: 'fries', name: 'French fries', serving: 'medium (117g)', calories: 365, protein: 4, carbs: 48, fat: 17 },
  { id: 'pizza', name: 'Pizza, cheese', serving: '1 slice (107g)', calories: 285, protein: 12, carbs: 36, fat: 10 },
  { id: 'fried-chicken', name: 'Fried chicken, 1 piece', serving: '1 piece (140g)', calories: 380, protein: 28, carbs: 12, fat: 24 },
];

/** Filters whichever catalog is active — bundled locally or pulled from Supabase. */
export function filterFoods(foods: Food[], query: string): Food[] {
  const q = query.trim().toLowerCase();
  if (!q) return foods;
  return foods.filter((food) => food.name.toLowerCase().includes(q));
}

export function searchFoods(query: string): Food[] {
  return filterFoods(FOODS, query);
}
