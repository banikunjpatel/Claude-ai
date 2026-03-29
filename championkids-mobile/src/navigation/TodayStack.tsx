import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { TodayStackParamList } from '@/types/navigation'

import TodayScreen           from '@/screens/today/TodayScreen'
import ActivityDetailScreen  from '@/screens/today/ActivityDetailScreen'
import ActivityCompleteScreen from '@/screens/today/ActivityCompleteScreen'

const Stack = createNativeStackNavigator<TodayStackParamList>()

export default function TodayStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle:      { backgroundColor: '#FFFFFF' },
        headerTintColor:  '#9C51B6',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen
        name="TodayScreen"
        component={TodayScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ActivityDetail"
        component={ActivityDetailScreen}
        options={{ title: 'Activity' }}
      />
      <Stack.Screen
        name="ActivityComplete"
        component={ActivityCompleteScreen}
        options={{ title: 'Complete Activity', headerBackVisible: false }}
      />
    </Stack.Navigator>
  )
}
