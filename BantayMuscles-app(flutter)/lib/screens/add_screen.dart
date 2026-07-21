import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../foods.dart';
import '../models/nutrition.dart';
import '../store.dart';
import '../theme.dart';

class AddScreen extends StatefulWidget {
  final MealType initialMeal;
  final VoidCallback onAdded;
  const AddScreen({super.key, required this.initialMeal, required this.onAdded});

  @override
  State<AddScreen> createState() => _AddScreenState();
}

class _AddScreenState extends State<AddScreen> {
  late MealType _meal = widget.initialMeal;
  String _query = '';

  @override
  void didUpdateWidget(AddScreen old) {
    super.didUpdateWidget(old);
    if (old.initialMeal != widget.initialMeal) _meal = widget.initialMeal;
  }

  void _pick(Food food) async {
    final servings = await showModalBottomSheet<double>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _ServingSheet(food: food, meal: _meal),
    );
    if (servings == null || !mounted) return;
    final store = context.read<AppStore>();
    final scaled = food.scaled(servings);
    store.addEntry(Entry(
      id: createId(),
      date: store.selectedDate,
      meal: _meal,
      name: food.name,
      serving: food.serving,
      servings: servings,
      calories: scaled.calories,
      protein: scaled.protein,
      carbs: scaled.carbs,
      fat: scaled.fat,
    ));
    widget.onAdded();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final results = searchFoods(_query);

    return SafeArea(
      bottom: false,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: Text('Add food', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w700)),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                TextField(
                  onChanged: (v) => setState(() => _query = v),
                  decoration: InputDecoration(
                    hintText: 'Search foods',
                    prefixIcon: const Icon(Icons.search),
                    filled: true,
                    fillColor: colors.surface,
                    contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 12),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide(color: colors.border),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide(color: colors.border),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    for (final m in MealType.values)
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: _MealChip(
                            meal: m,
                            selected: m == _meal,
                            onTap: () => setState(() => _meal = m),
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 120),
              itemCount: results.length,
              separatorBuilder: (_, __) => Divider(height: 1, color: colors.border),
              itemBuilder: (context, i) {
                final f = results[i];
                return ListTile(
                  contentPadding: EdgeInsets.zero,
                  onTap: () => _pick(f),
                  title: Text(f.name),
                  subtitle: Text('${f.serving} · P${f.protein} C${f.carbs} F${f.fat}',
                      style: TextStyle(color: colors.textSecondary)),
                  trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                    Text('${f.calories}', style: const TextStyle(fontWeight: FontWeight.w700)),
                    const SizedBox(width: 8),
                    Icon(Icons.add_circle, color: colors.accent),
                  ]),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _MealChip extends StatelessWidget {
  final MealType meal;
  final bool selected;
  final VoidCallback onTap;
  const _MealChip({required this.meal, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: Container(
        alignment: Alignment.center,
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: selected ? colors.accentMuted : colors.surface,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: selected ? colors.accent : colors.border),
        ),
        child: Text(
          meal.label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: selected ? colors.accent : colors.textSecondary,
          ),
        ),
      ),
    );
  }
}

class _ServingSheet extends StatefulWidget {
  final Food food;
  final MealType meal;
  const _ServingSheet({required this.food, required this.meal});

  @override
  State<_ServingSheet> createState() => _ServingSheetState();
}

class _ServingSheetState extends State<_ServingSheet> {
  double _servings = 1;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final scaled = widget.food.scaled(_servings);

    return Container(
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        border: Border.all(color: colors.border),
      ),
      padding: EdgeInsets.fromLTRB(24, 12, 24, 24 + MediaQuery.of(context).viewInsets.bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: colors.track, borderRadius: BorderRadius.circular(2)))),
          const SizedBox(height: 16),
          Text(widget.food.name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
          Text('${widget.food.serving} · ${widget.meal.label}',
              style: TextStyle(color: colors.textSecondary)),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _StepButton(icon: Icons.remove, onTap: () => setState(() => _servings = (_servings - 0.5).clamp(0.5, 99))),
              const SizedBox(width: 24),
              Column(children: [
                Text(_trim(_servings), style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w700)),
                Text(_servings == 1 ? 'serving' : 'servings', style: TextStyle(color: colors.textSecondary)),
              ]),
              const SizedBox(width: 24),
              _StepButton(icon: Icons.add, onTap: () => setState(() => _servings = (_servings + 0.5).clamp(0.5, 99))),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _Pill(label: 'kcal', value: '${scaled.calories}', color: colors.accent),
              _Pill(label: 'protein', value: '${scaled.protein}g', color: MacroColors.protein),
              _Pill(label: 'carbs', value: '${scaled.carbs}g', color: MacroColors.carbs),
              _Pill(label: 'fat', value: '${scaled.fat}g', color: MacroColors.fat),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: colors.accent,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              onPressed: () => Navigator.of(context).pop(_servings),
              child: const Text('Add to diary', style: TextStyle(color: Color(0xFF04120A), fontWeight: FontWeight.w700)),
            ),
          ),
        ],
      ),
    );
  }

  String _trim(double v) => v == v.roundToDouble() ? v.toInt().toString() : v.toString();
}

class _StepButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _StepButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: Container(
        width: 48,
        height: 48,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: colors.border),
        ),
        child: Icon(icon, color: colors.text),
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _Pill({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: color)),
      Text(label, style: TextStyle(fontSize: 13, color: context.colors.textSecondary)),
    ]);
  }
}
