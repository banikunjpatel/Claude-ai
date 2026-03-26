import React, { useState } from 'react'
import { View, Text, TextInput, Pressable, SafeAreaView, Alert } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { EditProfileScreenProps } from '@/types/navigation'
import { useAuth } from '@/auth/useAuth'
import { supabase } from '@/auth/supabaseClient'

const schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
})
type FormData = z.infer<typeof schema>

export default function EditProfileScreen({ navigation }: EditProfileScreenProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver:      zodResolver(schema),
    defaultValues: { fullName: user?.user_metadata?.full_name ?? '' },
  })

  async function onSubmit({ fullName }: FormData) {
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      })
      if (error) throw error
      navigation.goBack()
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to update profile.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-6">
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-1">Full Name</Text>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className={`border rounded-xl px-4 py-3 text-gray-900 ${errors.fullName ? 'border-red-400' : 'border-gray-300'}`}
                onChangeText={onChange}
                value={value}
                autoCapitalize="words"
              />
            )}
          />
          {errors.fullName && <Text className="text-red-500 text-xs mt-1">{errors.fullName.message}</Text>}
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3 text-gray-400 bg-gray-50"
            value={user?.email ?? ''}
            editable={false}
          />
          <Text className="text-xs text-gray-400 mt-1">Email cannot be changed here.</Text>
        </View>

        <Pressable
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
          className={`bg-ck-primary-500 rounded-2xl py-4 items-center ${loading ? 'opacity-60' : ''}`}
        >
          <Text className="text-white font-bold text-base">
            {loading ? 'Saving…' : 'Save Changes'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
