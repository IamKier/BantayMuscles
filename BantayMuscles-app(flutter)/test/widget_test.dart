import 'package:flutter_test/flutter_test.dart';

import 'package:bantaymuscles/main.dart';

void main() {
  testWidgets('app shell builds with the four tabs', (tester) async {
    await tester.pumpWidget(const BantayMusclesApp());
    expect(find.text('Today'), findsWidgets);
    expect(find.text('Add'), findsWidgets);
    expect(find.text('Progress'), findsWidgets);
    expect(find.text('Profile'), findsWidgets);
  });
}
