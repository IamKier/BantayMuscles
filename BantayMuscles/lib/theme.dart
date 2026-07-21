import 'package:flutter/material.dart';

/// App color tokens, mirroring the Expo app's theme. Exposed as a ThemeExtension
/// so widgets read them via `Theme.of(context).extension<AppColors>()`.
class AppColors extends ThemeExtension<AppColors> {
  final Color text;
  final Color background;
  final Color surface;
  final Color surfaceSelected;
  final Color textSecondary;
  final Color border;
  final Color accent;
  final Color accentMuted;
  final Color track;
  final Color danger;

  const AppColors({
    required this.text,
    required this.background,
    required this.surface,
    required this.surfaceSelected,
    required this.textSecondary,
    required this.border,
    required this.accent,
    required this.accentMuted,
    required this.track,
    required this.danger,
  });

  static const light = AppColors(
    text: Color(0xFF0A0C0F),
    background: Color(0xFFF4F6F8),
    surface: Color(0xFFFFFFFF),
    surfaceSelected: Color(0xFFEBEEF2),
    textSecondary: Color(0xFF697586),
    border: Color(0xFFEDEFF3),
    accent: Color(0xFF10B981),
    accentMuted: Color(0xFFD6F5E6),
    track: Color(0xFFEAEDF1),
    danger: Color(0xFFEF4444),
  );

  static const dark = AppColors(
    text: Color(0xFFF4F6FA),
    background: Color(0xFF0A0B0E),
    surface: Color(0xFF15171B),
    surfaceSelected: Color(0xFF24272E),
    textSecondary: Color(0xFF98A0AD),
    border: Color(0xFF22252B),
    accent: Color(0xFF34D399),
    accentMuted: Color(0xFF0D2B20),
    track: Color(0xFF22252B),
    danger: Color(0xFFF87171),
  );

  @override
  AppColors copyWith({
    Color? text,
    Color? background,
    Color? surface,
    Color? surfaceSelected,
    Color? textSecondary,
    Color? border,
    Color? accent,
    Color? accentMuted,
    Color? track,
    Color? danger,
  }) =>
      AppColors(
        text: text ?? this.text,
        background: background ?? this.background,
        surface: surface ?? this.surface,
        surfaceSelected: surfaceSelected ?? this.surfaceSelected,
        textSecondary: textSecondary ?? this.textSecondary,
        border: border ?? this.border,
        accent: accent ?? this.accent,
        accentMuted: accentMuted ?? this.accentMuted,
        track: track ?? this.track,
        danger: danger ?? this.danger,
      );

  @override
  AppColors lerp(AppColors? other, double t) {
    if (other == null) return this;
    return AppColors(
      text: Color.lerp(text, other.text, t)!,
      background: Color.lerp(background, other.background, t)!,
      surface: Color.lerp(surface, other.surface, t)!,
      surfaceSelected: Color.lerp(surfaceSelected, other.surfaceSelected, t)!,
      textSecondary: Color.lerp(textSecondary, other.textSecondary, t)!,
      border: Color.lerp(border, other.border, t)!,
      accent: Color.lerp(accent, other.accent, t)!,
      accentMuted: Color.lerp(accentMuted, other.accentMuted, t)!,
      track: Color.lerp(track, other.track, t)!,
      danger: Color.lerp(danger, other.danger, t)!,
    );
  }
}

/// Macro colors — scheme-independent so charts stay recognizable.
class MacroColors {
  static const protein = Color(0xFF3B82F6);
  static const carbs = Color(0xFFF59E0B);
  static const fat = Color(0xFFEC4899);
}

ThemeData buildTheme(Brightness brightness) {
  final c = brightness == Brightness.dark ? AppColors.dark : AppColors.light;
  return ThemeData(
    useMaterial3: true,
    brightness: brightness,
    scaffoldBackgroundColor: c.background,
    colorScheme: ColorScheme.fromSeed(
      seedColor: c.accent,
      brightness: brightness,
    ).copyWith(surface: c.surface),
    fontFamily: 'Roboto',
    extensions: [c],
  );
}

/// Convenience getter: `context.colors.accent`
extension AppColorsContext on BuildContext {
  AppColors get colors => Theme.of(this).extension<AppColors>()!;
}
