import React from 'react'
import { View, Text, ScrollView, Pressable, SafeAreaView, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { ProfileScreenProps } from '@/types/navigation'
import { useAuth } from '@/auth/useAuth'
import { useChildren } from '@/hooks/useChildren'
import { useEntitlement } from '@/hooks/useSubscription'
import ChildAvatar from '@/components/ChildAvatar'

interface MenuItemProps {
  icon:    React.ComponentProps<typeof Ionicons>['name']
  label:   string
  badge?:  string
  onPress: () => void
  danger?: boolean
}

function MenuItem({ icon, label, badge, onPress, danger }: MenuItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-4 py-4 bg-white border-b border-gray-50 active:bg-gray-50"
    >
      <Ionicons name={icon} size={20} color={danger ? '#EF4444' : '#9C51B6'} />
      <Text className={`flex-1 ml-3 text-base ${danger ? 'text-red-600' : 'text-gray-900'}`}>
        {label}
      </Text>
      {badge && (
        <View className="bg-ck-primary-100 rounded-full px-2 py-0.5 mr-2">
          <Text className="text-xs text-ck-primary-700 font-semibold">{badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
    </Pressable>
  )
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { user, signOut }           = useAuth()
  const { data: children }          = useChildren()
  const { data: entitlement }       = useEntitlement()

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ])
  }

  const planLabel = entitlement?.planType
    ? entitlement.planType.charAt(0).toUpperCase() + entitlement.planType.slice(1)
    : undefined

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* User header */}
        <View className="bg-white px-5 py-6 items-center gap-3 border-b border-gray-100">
          <View className="w-20 h-20 bg-ck-primary-100 rounded-full items-center justify-center">
            <Ionicons name="person" size={36} color="#9C51B6" />
          </View>
          <View className="items-center">
            <Text className="text-xl font-bold text-gray-900">
              {user?.user_metadata?.full_name ?? 'Parent'}
            </Text>
            <Text className="text-gray-500 text-sm">{user?.email}</Text>
          </View>
          {planLabel && (
            <View className="bg-ck-primary-50 border border-ck-primary-200 rounded-full px-3 py-1">
              <Text className="text-xs text-ck-primary-700 font-semibold">{planLabel} Plan</Text>
            </View>
          )}
        </View>

        {/* Children */}
        {children && children.length > 0 && (
          <View className="mt-4 mb-1">
            <Text className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Children
            </Text>
            <View className="bg-white overflow-hidden rounded-2xl mx-4 shadow-sm">
              {children.map((child) => (
                <Pressable
                  key={child.id}
                  onPress={() => navigation.navigate('EditChild', { childId: child.id })}
                  className="flex-row items-center px-4 py-3 border-b border-gray-50 last:border-b-0"
                >
                  <ChildAvatar name={child.name} avatarUrl={child.avatarUrl} size={36} />
                  <View className="flex-1 ml-3">
                    <Text className="text-base font-medium text-gray-900">{child.name}</Text>
                    <Text className="text-sm text-gray-500">{child.ageBand?.label}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                </Pressable>
              ))}
              <Pressable
                onPress={() => navigation.navigate('AddChild')}
                className="flex-row items-center px-4 py-3"
              >
                <View className="w-9 h-9 bg-ck-primary-50 rounded-full items-center justify-center">
                  <Ionicons name="add" size={20} color="#9C51B6" />
                </View>
                <Text className="ml-3 text-ck-primary-600 font-medium">Add child</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Account section */}
        <View className="mt-4 mb-1">
          <Text className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Account
          </Text>
          <View className="bg-white overflow-hidden rounded-2xl mx-4 shadow-sm">
            <MenuItem icon="person-outline"      label="Edit Profile"    onPress={() => navigation.navigate('EditProfile')} />
            <MenuItem icon="card-outline"        label="Subscription"    badge={planLabel} onPress={() => navigation.navigate('Subscription')} />
            <MenuItem icon="help-circle-outline" label="Help & Support"  onPress={() => navigation.navigate('Help')} />
            <MenuItem icon="log-out-outline"     label="Sign Out"        onPress={handleSignOut} danger />
          </View>
        </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  )
}
