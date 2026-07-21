import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../models/nutrition.dart';
import '../store.dart';
import '../theme.dart';
import '../widgets/app_card.dart';

const _activityLabels = {
  ActivityLevel.sedentary: ('Sedentary', 'Desk job, little exercise'),
  ActivityLevel.light: ('Light', 'Exercise 1-3 days/week'),
  ActivityLevel.moderate: ('Moderate', 'Exercise 3-5 days/week'),
  ActivityLevel.active: ('Active', 'Exercise 6-7 days/week'),
  ActivityLevel.athlete: ('Athlete', 'Hard training, physical job'),
};

const _goalLabels = {
  Goal.lose: ('Lose weight', '-500 kcal/day'),
  Goal.maintain: ('Maintain', 'Stay at your current weight'),
  Goal.gain: ('Gain muscle', '+300 kcal/day surplus'),
};

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final store = context.watch<AppStore>();
    final colors = context.colors;
    final p = store.profile;
    final goals = store.goals;

    return SafeArea(
      bottom: false,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
        children: [
          const Text('Profile', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w700)),
          const SizedBox(height: 16),
          // Target
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Daily target', style: TextStyle(fontSize: 14, color: colors.textSecondary)),
                Text('${goals.calories} kcal',
                    style: TextStyle(fontSize: 34, fontWeight: FontWeight.w700, color: colors.accent)),
                const SizedBox(height: 4),
                Row(children: [
                  Text('${goals.protein}g protein', style: const TextStyle(color: MacroColors.protein)),
                  const SizedBox(width: 16),
                  Text('${goals.carbs}g carbs', style: const TextStyle(color: MacroColors.carbs)),
                  const SizedBox(width: 16),
                  Text('${goals.fat}g fat', style: const TextStyle(color: MacroColors.fat)),
                ]),
                const SizedBox(height: 8),
                Text('BMR ${bmr(p).round()} · maintenance ${tdee(p).round()} kcal · BMI ${bmi(p).toStringAsFixed(1)} (${bmiCategory(bmi(p))})',
                    style: TextStyle(fontSize: 13, color: colors.textSecondary)),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // About you
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('About you', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                const SizedBox(height: 12),
                Row(children: [
                  for (final s in Sex.values)
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: _Chip(
                          label: s.name[0].toUpperCase() + s.name.substring(1),
                          selected: p.sex == s,
                          onTap: () => store.updateProfile(p.copyWith(sex: s)),
                        ),
                      ),
                    ),
                ]),
                const SizedBox(height: 12),
                Row(children: [
                  Expanded(child: _NumberField(label: 'Age', unit: 'yrs', value: p.age, onChanged: (v) => store.updateProfile(p.copyWith(age: v)))),
                  const SizedBox(width: 12),
                  Expanded(child: _NumberField(label: 'Height', unit: 'cm', value: p.heightCm, onChanged: (v) => store.updateProfile(p.copyWith(heightCm: v)))),
                  const SizedBox(width: 12),
                  Expanded(child: _NumberField(label: 'Weight', unit: 'kg', value: p.weightKg.round(), onChanged: (v) => store.updateProfile(p.copyWith(weightKg: v.toDouble())))),
                ]),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Activity
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Activity level', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                for (final a in ActivityLevel.values)
                  _OptionRow(
                    label: _activityLabels[a]!.$1,
                    hint: _activityLabels[a]!.$2,
                    selected: p.activity == a,
                    onTap: () => store.updateProfile(p.copyWith(activity: a)),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Goal
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Goal', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                for (final g in Goal.values)
                  _OptionRow(
                    label: _goalLabels[g]!.$1,
                    hint: _goalLabels[g]!.$2,
                    selected: p.goal == g,
                    onTap: () => store.updateProfile(p.copyWith(goal: g)),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Appearance
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Appearance', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                const SizedBox(height: 12),
                Row(children: [
                  for (final m in ThemeMode.values)
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: _Chip(
                          label: switch (m) {
                            ThemeMode.system => 'System',
                            ThemeMode.light => 'Light',
                            ThemeMode.dark => 'Dark',
                          },
                          selected: store.themeMode == m,
                          onTap: () => store.setThemeMode(m),
                        ),
                      ),
                    ),
                ]),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _NumberField extends StatelessWidget {
  final String label;
  final String unit;
  final int value;
  final ValueChanged<int> onChanged;
  const _NumberField({required this.label, required this.unit, required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontSize: 14, color: colors.textSecondary)),
        const SizedBox(height: 4),
        TextFormField(
          initialValue: '$value',
          keyboardType: TextInputType.number,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
          decoration: InputDecoration(
            suffixText: unit,
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: colors.border),
            ),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
          onChanged: (t) {
            final n = int.tryParse(t);
            if (n != null && n > 0) onChanged(n);
          },
        ),
      ],
    );
  }
}

class _Chip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _Chip({required this.label, required this.selected, required this.onTap});

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
          color: selected ? colors.accentMuted : Colors.transparent,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: selected ? colors.accent : colors.border),
        ),
        child: Text(label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: selected ? colors.accent : colors.textSecondary,
            )),
      ),
    );
  }
}

class _OptionRow extends StatelessWidget {
  final String label;
  final String hint;
  final bool selected;
  final VoidCallback onTap;
  const _OptionRow({required this.label, required this.hint, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: TextStyle(fontSize: 14, fontWeight: selected ? FontWeight.w700 : FontWeight.w500)),
                  Text(hint, style: TextStyle(fontSize: 14, color: colors.textSecondary)),
                ],
              ),
            ),
            Icon(selected ? Icons.radio_button_checked : Icons.radio_button_off,
                size: 20, color: selected ? colors.accent : colors.textSecondary),
          ],
        ),
      ),
    );
  }
}
