import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/nutrition.dart';
import '../store.dart';
import '../theme.dart';
import '../widgets/app_card.dart';
import '../widgets/calorie_ring.dart';
import '../widgets/macro_bar.dart';

const _mealIcons = {
  MealType.breakfast: Icons.wb_sunny_outlined,
  MealType.lunch: Icons.restaurant_outlined,
  MealType.dinner: Icons.nightlight_outlined,
  MealType.snack: Icons.cookie_outlined,
};

String formatDateLabel(String key) {
  final today = toDateKey(DateTime.now());
  if (key == today) return 'Today';
  if (key == shiftDateKey(today, -1)) return 'Yesterday';
  if (key == shiftDateKey(today, 1)) return 'Tomorrow';
  final p = key.split('-').map(int.parse).toList();
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  final d = DateTime(p[0], p[1], p[2]);
  return '${days[d.weekday - 1]}, ${months[d.month - 1]} ${d.day}';
}

class TodayScreen extends StatelessWidget {
  final void Function(MealType meal) onAddFood;
  const TodayScreen({super.key, required this.onAddFood});

  @override
  Widget build(BuildContext context) {
    final store = context.watch<AppStore>();
    final colors = context.colors;
    final date = store.selectedDate;
    final totals = store.totalsForDate(date);
    final goals = store.goals;
    final grouped = store.groupedForDate(date);
    final entries = store.entriesForDate(date);
    final isToday = date == toDateKey(DateTime.now());

    return SafeArea(
      bottom: false,
      child: Column(
        children: [
          // Date header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                IconButton(
                  onPressed: () => store.shiftDate(-1),
                  icon: Icon(Icons.chevron_left, color: colors.textSecondary),
                ),
                GestureDetector(
                  onTap: () => store.setSelectedDate(toDateKey(DateTime.now())),
                  child: Text(formatDateLabel(date),
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                ),
                IconButton(
                  onPressed: isToday ? null : () => store.shiftDate(1),
                  icon: Icon(Icons.chevron_right, color: isToday ? colors.track : colors.textSecondary),
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 120),
              children: [
                // Summary
                AppCard(
                  padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
                  child: Column(
                    children: [
                      CalorieRing(consumed: totals.calories, goal: goals.calories),
                      const SizedBox(height: 24),
                      Row(
                        children: [
                          Expanded(child: MacroBar(label: 'Protein', value: totals.protein, goal: goals.protein, color: MacroColors.protein)),
                          const SizedBox(width: 16),
                          Expanded(child: MacroBar(label: 'Carbs', value: totals.carbs, goal: goals.carbs, color: MacroColors.carbs)),
                          const SizedBox(width: 16),
                          Expanded(child: MacroBar(label: 'Fat', value: totals.fat, goal: goals.fat, color: MacroColors.fat)),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                if (entries.isEmpty) ...[
                  AppCard(
                    child: Column(
                      children: [
                        Icon(Icons.restaurant_outlined, size: 28, color: colors.accent),
                        const SizedBox(height: 8),
                        const Text('Nothing logged yet',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 4),
                        Text('Add what you ate and the ring fills up.',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 13, color: colors.textSecondary)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                for (final meal in MealType.values) ...[
                  _MealSection(meal: meal, entries: grouped[meal]!, onAdd: () => onAddFood(meal)),
                  const SizedBox(height: 16),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MealSection extends StatelessWidget {
  final MealType meal;
  final List<Entry> entries;
  final VoidCallback onAdd;
  const _MealSection({required this.meal, required this.entries, required this.onAdd});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final store = context.read<AppStore>();
    final kcal = entries.fold<int>(0, (s, e) => s + e.calories);

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(children: [
                Icon(_mealIcons[meal], size: 18, color: colors.textSecondary),
                const SizedBox(width: 8),
                Text(meal.label, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
              ]),
              Text(kcal > 0 ? '$kcal kcal' : '—',
                  style: TextStyle(fontSize: 14, color: colors.textSecondary)),
            ],
          ),
          for (final e in entries)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(e.name, maxLines: 1, overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 14)),
                        Text(e.servings == 1 ? e.serving : '${_trim(e.servings)} × ${e.serving}',
                            style: TextStyle(fontSize: 14, color: colors.textSecondary)),
                      ],
                    ),
                  ),
                  Text('${e.calories}',
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                  IconButton(
                    onPressed: () => store.removeEntry(e.id),
                    icon: Icon(Icons.close, size: 18, color: colors.textSecondary),
                  ),
                ],
              ),
            ),
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: InkWell(
              onTap: onAdd,
              child: Row(
                children: [
                  Icon(Icons.add, size: 18, color: colors.accent),
                  const SizedBox(width: 4),
                  Text('Add food',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: colors.accent)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _trim(double v) => v == v.roundToDouble() ? v.toInt().toString() : v.toString();
}
