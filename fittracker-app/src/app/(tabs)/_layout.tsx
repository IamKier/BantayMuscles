import { Tabs } from 'expo-router';

import { AppTabBar } from '@/components/app-tab-bar';

const TABS = [
  { name: 'index', title: 'Today' },
  { name: 'add', title: 'Add food' },
  { name: 'progress', title: 'Progress' },
  { name: 'profile', title: 'Profile' },
];

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <AppTabBar {...props} />}>
      {TABS.map(({ name, title }) => (
        <Tabs.Screen key={name} name={name} options={{ title }} />
      ))}
    </Tabs>
  );
}
