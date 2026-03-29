import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { ProgressStackParamList } from '@/types/navigation'

import ProgressScreen        from '@/screens/progress/ProgressScreen'
import ProgressHistoryScreen from '@/screens/progress/ProgressHistoryScreen'

const Stack = createNativeStackNavigator<ProgressStackParamList>()

export default function ProgressStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle:      { backgroundColor: '#FFFFFF' },
        headerTintColor:  '#9C51B6',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen
        name="ProgressScreen"
        component={ProgressScreen}
        options={{ title: 'Progress' }}
      />
      <Stack.Screen
        name="ProgressHistory"
        component={ProgressHistoryScreen}
        options={{ title: 'History' }}
      />
    </Stack.Navigator>
  )
}
