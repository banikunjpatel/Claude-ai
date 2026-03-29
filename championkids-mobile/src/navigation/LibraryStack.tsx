import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { LibraryStackParamList } from '@/types/navigation'

import LibraryScreen from '@/screens/library/LibraryScreen'

const Stack = createNativeStackNavigator<LibraryStackParamList>()

export default function LibraryStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle:      { backgroundColor: '#FFFFFF' },
        headerTintColor:  '#9C51B6',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen
        name="LibraryScreen"
        component={LibraryScreen}
        options={{ title: 'Activity Library' }}
      />
    </Stack.Navigator>
  )
}
