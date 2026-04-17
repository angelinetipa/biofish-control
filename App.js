import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from './app/screens/LoginScreen';
import DashboardScreen from './app/screens/DashboardScreen';
import HelpScreen from './app/screens/HelpScreen';
import SettingsScreen from './app/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [user, setUser] = useState(null);

  if (!user) return <LoginScreen onLogin={setUser} />;

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0a2a3a',
            borderTopColor: 'rgba(255,255,255,0.1)',
            height: 60,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: '#1ab5d4',
          tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
          tabBarIcon: ({ focused, color, size }) => {
            const icons = {
              Dashboard: focused ? 'radio-button-on' : 'radio-button-off',
              Help:      focused ? 'help-circle' : 'help-circle-outline',
              Settings:  focused ? 'settings' : 'settings-outline',
            };
            return <Ionicons name={icons[route.name]} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Dashboard">
          {() => <DashboardScreen user={user} onLogout={() => setUser(null)} />}
        </Tab.Screen>
        <Tab.Screen name="Help" component={HelpScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}