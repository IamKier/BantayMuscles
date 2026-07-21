import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme.dart';

/// Animated progress ring showing calories remaining, with the count in the
/// center. Turns red when over the goal. Mirrors the Expo CalorieRing.
class CalorieRing extends StatelessWidget {
  final int consumed;
  final int goal;
  final int burned;
  final double size;
  final double strokeWidth;

  const CalorieRing({
    super.key,
    required this.consumed,
    required this.goal,
    this.burned = 0,
    this.size = 200,
    this.strokeWidth = 16,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final effectiveGoal = goal + burned;
    final remaining = effectiveGoal - consumed;
    final over = remaining < 0;
    final target = effectiveGoal > 0 ? (consumed / effectiveGoal).clamp(0.0, 1.0) : 0.0;
    final ringColor = over ? colors.danger : colors.accent;

    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0, end: target),
            duration: const Duration(milliseconds: 600),
            curve: Curves.easeOutCubic,
            builder: (context, value, _) => CustomPaint(
              size: Size(size, size),
              painter: _RingPainter(
                progress: value,
                strokeWidth: strokeWidth,
                track: colors.track,
                color: ringColor,
              ),
            ),
          ),
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                remaining.abs().toString(),
                style: TextStyle(
                  fontSize: 46,
                  height: 1.05,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -1.5,
                  color: over ? colors.danger : colors.text,
                ),
              ),
              Text(over ? 'kcal over' : 'kcal left',
                  style: TextStyle(fontSize: 14, color: colors.textSecondary)),
              const SizedBox(height: 2),
              Text('$consumed of $effectiveGoal',
                  style: TextStyle(fontSize: 13, color: colors.textSecondary)),
              if (burned > 0)
                Text('$goal + $burned burned',
                    style: TextStyle(fontSize: 13, color: colors.accent)),
            ],
          ),
        ],
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  final double progress;
  final double strokeWidth;
  final Color track;
  final Color color;

  _RingPainter({
    required this.progress,
    required this.strokeWidth,
    required this.track,
    required this.color,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;

    final trackPaint = Paint()
      ..color = track
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;
    canvas.drawCircle(center, radius, trackPaint);

    final arcPaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2, // start at 12 o'clock
      2 * math.pi * progress,
      false,
      arcPaint,
    );
  }

  @override
  bool shouldRepaint(_RingPainter old) =>
      old.progress != progress || old.color != color || old.track != track;
}
