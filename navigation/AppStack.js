import * as React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TabNavigator from './TabNavigator';
import EventDetailsScreen from '../screens/EventDetailsScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createStackNavigator();

export const AppStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="EventDetailsScreen" component={EventDetailsScreen} options={{ title: 'Szczegóły Wydarzenia' }}/>
      <Stack.Screen name="UserProfileScreen" component={UserProfileScreen} options={{ title: 'Dane Użytkownika' }}/>
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ title: 'Profil' }}/>
    </Stack.Navigator>
  );
};
