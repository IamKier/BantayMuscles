import 'package:flutter/material.dart';

import 'theme.dart';

void main() => runApp(const BantayMusclesApp());

class BantayMusclesApp extends StatelessWidget {
  const BantayMusclesApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'BantayMuscles',
      debugShowCheckedModeBanner: false,
      theme: buildTheme(Brightness.light),
      darkTheme: buildTheme(Brightness.dark),
      themeMode: ThemeMode.system,
      home: const HomeShell(),
    );
  }
}

/// Bottom-tab shell with a floating "island" nav bar, mirroring the Expo app.
class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  static const _tabs = [
    _TabDef('Today', Icons.today_outlined, Icons.today),
    _TabDef('Add', Icons.add_circle_outline, Icons.add_circle),
    _TabDef('Progress', Icons.bar_chart_outlined, Icons.bar_chart),
    _TabDef('Profile', Icons.person_outline, Icons.person),
  ];

  final _pages = const [
    _Placeholder('Today'),
    _Placeholder('Add food'),
    _Placeholder('Progress'),
    _Placeholder('Profile'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      body: _pages[_index],
      bottomNavigationBar: _IslandNav(
        tabs: _tabs,
        index: _index,
        onSelect: (i) => setState(() => _index = i),
      ),
    );
  }
}

class _TabDef {
  final String label;
  final IconData icon;
  final IconData activeIcon;
  const _TabDef(this.label, this.icon, this.activeIcon);
}

class _IslandNav extends StatelessWidget {
  final List<_TabDef> tabs;
  final int index;
  final ValueChanged<int> onSelect;

  const _IslandNav({required this.tabs, required this.index, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final bottomInset = MediaQuery.of(context).padding.bottom;

    return Padding(
      padding: EdgeInsets.fromLTRB(24, 8, 24, bottomInset > 0 ? bottomInset : 24),
      child: Container(
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: BorderRadius.circular(36),
          border: Border.all(color: colors.border),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.14),
              blurRadius: 14,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
        child: Row(
          children: [
            for (var i = 0; i < tabs.length; i++)
              Expanded(child: _NavItem(def: tabs[i], selected: i == index, onTap: () => onSelect(i))),
          ],
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final _TabDef def;
  final bool selected;
  final VoidCallback onTap;

  const _NavItem({required this.def, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final fg = selected ? colors.accent : colors.textSecondary;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 56,
              height: 30,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: selected ? colors.accentMuted : Colors.transparent,
                borderRadius: BorderRadius.circular(15),
              ),
              child: Icon(selected ? def.activeIcon : def.icon, size: 22, color: fg),
            ),
            const SizedBox(height: 2),
            Text(
              def.label,
              style: TextStyle(
                fontSize: 11,
                height: 1.2,
                color: fg,
                fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Placeholder extends StatelessWidget {
  final String title;
  const _Placeholder(this.title);

  @override
  Widget build(BuildContext context) {
    return SafeAreaWidget(
      child: Center(
        child: Text(
          '$title\n(coming soon)',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: context.colors.text),
        ),
      ),
    );
  }
}

/// Small alias so screens don't repeat SafeArea boilerplate.
class SafeAreaWidget extends StatelessWidget {
  final Widget child;
  const SafeAreaWidget({super.key, required this.child});
  @override
  Widget build(BuildContext context) => SafeArea(bottom: false, child: child);
}
