import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { ProfileStackParamList } from '@/types/navigation'

import ProfileScreen       from '@/screens/profile/ProfileScreen'
import EditProfileScreen   from '@/screens/profile/EditProfileScreen'
import AddChildScreen      from '@/screens/profile/AddChildScreen'
import EditChildScreen     from '@/screens/profile/EditChildScreen'
import SubscriptionScreen  from '@/screens/profile/SubscriptionScreen'
import HelpScreen          from '@/screens/profile/HelpScreen'

const Stack = createNativeStackNavigator<ProfileStackParamList>()

export default function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle:      { backgroundColor: '#FFFFFF' },
        headerTintColor:  '#9C51B6',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="EditProfile"  component={EditProfileScreen}  options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="AddChild"     component={AddChildScreen}     options={{ title: 'Add Child' }} />
      <Stack.Screen name="EditChild"    component={EditChildScreen}    options={{ title: 'Edit Child' }} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} options={{ title: 'Subscription' }} />
      <Stack.Screen name="Help"         component={HelpScreen}         options={{ title: 'Help & Support' }} />
    </Stack.Navigator>
  )
}
