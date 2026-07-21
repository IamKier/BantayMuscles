import 'package:flutter/material.dart';

import '../theme.dart';

/// Labeled progress bar for a single macro, animating its fill.
class MacroBar extends StatelessWidget {
  final String label;
  final int value;
  final int goal;
  final Color color;

  const MacroBar({
    super.key,
    required this.label,
    required this.value,
    required this.goal,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final over = goal > 0 && value > goal;
    final target = goal > 0 ? (value / goal).clamp(0.0, 1.0) : 0.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
            Text('$value / ${goal}g',
                style: TextStyle(fontSize: 14, color: over ? colors.danger : colors.textSecondary)),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(3),
          child: Stack(
            children: [
              Container(height: 6, color: colors.track),
              TweenAnimationBuilder<double>(
                tween: Tween(begin: 0, end: target),
                duration: const Duration(milliseconds: 500),
                curve: Curves.easeOutCubic,
                builder: (context, v, _) => FractionallySizedBox(
                  widthFactor: v,
                  child: Container(height: 6, color: over ? colors.danger : color),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
