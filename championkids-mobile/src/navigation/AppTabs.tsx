import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { AppTabParamList } from '@/types/navigation'

import TodayStack    from './TodayStack'
import LibraryStack  from './LibraryStack'
import ProgressStack from './ProgressStack'
import ProfileStack  from './ProfileStack'

const Tab = createBottomTabNavigator<AppTabParamList>()

const PRIMARY = '#9C51B6'

type IoniconsName = React.ComponentProps<typeof Ionicons>['name']

function tabIcon(
  focused: boolean,
  activeIcon: IoniconsName,
  inactiveIcon: IoniconsName,
  color: string,
) {
  return <Ionicons name={focused ? activeIcon : inactiveIcon} size={24} color={color} />
}

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown:     false,
        tabBarActiveTintColor:   PRIMARY,
        tabBarInactiveTintColor: '#A3A3A3',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor:  '#E8E8E8',
          borderTopWidth:  1,
          height:          Platform.OS === 'ios' ? 84 : 64,
          paddingBottom:   Platform.OS === 'ios' ? 28 : 8,
          paddingTop:      8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        // 44pt minimum touch target (Apple HIG)
        tabBarItemStyle: { minHeight: 44 },
      }}
    >
      <Tab.Screen
        name="TodayTab"
        component={TodayStack}
        options={{
          tabBarLabel: 'Today',
          tabBarIcon: ({ focused, color }) =>
            tabIcon(focused, 'today', 'today-outline', color),
        }}
      />
      <Tab.Screen
        name="LibraryTab"
        component={LibraryStack}
        options={{
          tabBarLabel: 'Library',
          tabBarIcon: ({ focused, color }) =>
            tabIcon(focused, 'library', 'library-outline', color),
        }}
      />
      <Tab.Screen
        name="ProgressTab"
        component={ProgressStack}
        options={{
          tabBarLabel: 'Progress',
          tabBarIcon: ({ focused, color }) =>
            tabIcon(focused, 'bar-chart', 'bar-chart-outline', color),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused, color }) =>
            tabIcon(focused, 'person-circle', 'person-circle-outline', color),
        }}
      />
    </Tab.Navigator>
  )
}
