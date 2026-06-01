import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from './app/screens/LoginScreen';
import DashboardScreen from './app/screens/DashboardScreen';
import LearnScreen from './app/screens/LearnScreen';
import HelpScreen from './app/screens/HelpScreen';
import SettingsScreen from './app/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [user, setUser] = useState(null);

  if (!user) return <LoginScreen onLogin={setUser} />;

  const logout = () => setUser(null);

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
              Learn:     focused ? 'book' : 'book-outline',
              Help:      focused ? 'help-circle' : 'help-circle-outline',
              Settings:  focused ? 'settings' : 'settings-outline',
            };
            return <Ionicons name={icons[route.name]} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Dashboard">
          {() => <DashboardScreen user={user} onLogout={logout} />}
        </Tab.Screen>
        <Tab.Screen name="Learn">
          {() => <LearnScreen onLogout={logout} />}
        </Tab.Screen>
        <Tab.Screen name="Help">
          {() => <HelpScreen onLogout={logout} />}
        </Tab.Screen>
        <Tab.Screen name="Settings">
          {() => <SettingsScreen onLogout={logout} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}