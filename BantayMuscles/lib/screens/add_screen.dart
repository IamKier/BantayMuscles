import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/nutrition.dart';
import '../online_search.dart';
import '../store.dart';
import '../theme.dart';
import 'barcode_scanner_screen.dart';

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

  // Online (Open Food Facts) search state. A short debounce keeps us from
  // firing a request on every keystroke; a token guards against a slow early
  // response landing after a newer query.
  Timer? _debounce;
  int _searchToken = 0;
  bool _searching = false;
  String? _onlineError;
  List<Food> _online = const [];

  @override
  void didUpdateWidget(AddScreen old) {
    super.didUpdateWidget(old);
    if (old.initialMeal != widget.initialMeal) _meal = widget.initialMeal;
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  void _onQueryChanged(String value) {
    setState(() => _query = value);
    _debounce?.cancel();
    final q = value.trim();
    if (q.length < 2) {
      setState(() {
        _searching = false;
        _onlineError = null;
        _online = const [];
      });
      return;
    }
    setState(() => _searching = true);
    _debounce = Timer(const Duration(milliseconds: 400), () => _runOnline(q));
  }

  Future<void> _runOnline(String q) async {
    final token = ++_searchToken;
    final result = await searchOnline(q);
    if (!mounted || token != _searchToken) return; // a newer query superseded us
    setState(() {
      _searching = false;
      _onlineError = result.ok ? null : result.error;
      _online = result.foods;
    });
  }

  Future<void> _scanBarcode() async {
    final food = await Navigator.of(context).push<Food>(
      MaterialPageRoute(builder: (_) => const BarcodeScannerScreen()),
    );
    if (food == null || !mounted) return;
    _pick(food);
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
    final results = context.watch<AppStore>().searchCatalog(_query);

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
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        onChanged: _onQueryChanged,
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
                    ),
                    const SizedBox(width: 8),
                    // Scan a product barcode → Open Food Facts lookup.
                    Material(
                      color: colors.accentMuted,
                      borderRadius: BorderRadius.circular(14),
                      child: InkWell(
                        onTap: _scanBarcode,
                        borderRadius: BorderRadius.circular(14),
                        child: SizedBox(
                          width: 52,
                          height: 52,
                          child: Icon(Icons.qr_code_scanner, color: colors.accent),
                        ),
                      ),
                    ),
                  ],
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
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 120),
              children: [
                for (final f in results) ...[
                  _FoodRow(food: f, onTap: () => _pick(f)),
                  Divider(height: 1, color: colors.border),
                ],
                _OnlineSection(
                  query: _query,
                  searching: _searching,
                  error: _onlineError,
                  foods: _online,
                  localCount: results.length,
                  onPick: _pick,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// A single food row — shared by the local catalog and online results.
class _FoodRow extends StatelessWidget {
  final Food food;
  final VoidCallback onTap;
  final bool online;
  const _FoodRow({required this.food, required this.onTap, this.online = false});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return ListTile(
      contentPadding: EdgeInsets.zero,
      onTap: onTap,
      title: Row(children: [
        Flexible(child: Text(food.name, overflow: TextOverflow.ellipsis)),
        if (online) ...[
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: colors.accentMuted,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text('online',
                style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: colors.accent)),
          ),
        ],
      ]),
      subtitle: Text('${food.serving} · P${food.protein} C${food.carbs} F${food.fat}',
          style: TextStyle(color: colors.textSecondary)),
      trailing: Row(mainAxisSize: MainAxisSize.min, children: [
        Text('${food.calories}', style: const TextStyle(fontWeight: FontWeight.w700)),
        const SizedBox(width: 8),
        Icon(Icons.add_circle, color: colors.accent),
      ]),
    );
  }
}

/// The "Online results" block: a header, plus a spinner, error, empty note, or
/// the Open Food Facts matches.
class _OnlineSection extends StatelessWidget {
  final String query;
  final bool searching;
  final String? error;
  final List<Food> foods;
  final int localCount;
  final void Function(Food) onPick;
  const _OnlineSection({
    required this.query,
    required this.searching,
    required this.error,
    required this.foods,
    required this.localCount,
    required this.onPick,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    if (query.trim().length < 2) return const SizedBox.shrink();

    Widget body;
    if (searching) {
      body = Padding(
        padding: const EdgeInsets.symmetric(vertical: 20),
        child: Row(children: [
          const SizedBox(
              width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
          const SizedBox(width: 12),
          Text('Searching Open Food Facts…', style: TextStyle(color: colors.textSecondary)),
        ]),
      );
    } else if (error != null) {
      body = Padding(
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: Text(error!, style: TextStyle(color: colors.textSecondary)),
      );
    } else if (foods.isEmpty) {
      body = Padding(
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: Text('No online matches. Try Quick add.',
            style: TextStyle(color: colors.textSecondary)),
      );
    } else {
      body = Column(
        children: [
          for (final f in foods) ...[
            _FoodRow(food: f, online: true, onTap: () => onPick(f)),
            Divider(height: 1, color: colors.border),
          ],
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: EdgeInsets.only(top: localCount > 0 ? 20 : 8, bottom: 4),
          child: Text('ONLINE (OPEN FOOD FACTS)',
              style: TextStyle(
                  fontSize: 12, fontWeight: FontWeight.w700, color: colors.textSecondary, letterSpacing: 0.5)),
        ),
        body,
      ],
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
