import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import AddEventScreen from '../screens/AddEventScreen';
import SearchEventScreen from '../screens/SearchEventScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen 
        name="HomeScreen" 
        component={HomeScreen} 
        options={{ 
          title: 'Ekran Główny',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          )
        }}
      />
      <Tab.Screen 
        name="AddEventScreen" 
        component={AddEventScreen} 
        options={{ 
          title: 'Dodaj Wydarzenie',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="plus-circle" color={color} size={size} />
          )
        }}
      />
      <Tab.Screen 
        name="SearchEventScreen" 
        component={SearchEventScreen} 
        options={{ 
          title: 'Lista Wydarzeń',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="magnify" color={color} size={size} />
          )
        }}
      />
      <Tab.Screen 
        name="ProfileScreen" 
        component={ProfileScreen} 
        options={{ 
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="head" color={color} size={size} />
          )
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;