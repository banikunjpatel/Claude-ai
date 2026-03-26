import React, { useState } from 'react'
import {
  View, Text, TextInput, Pressable, SafeAreaView, Alert,
} from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ResetPasswordScreenProps } from '@/types/navigation'
import { updatePassword } from '@/api/auth'

const schema = z.object({
  password:        z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path:    ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

export default function ResetPasswordScreen({ navigation }: ResetPasswordScreenProps) {
  const [loading, setLoading] = useState(false)

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit({ password }: FormData) {
    setLoading(true)
    try {
      await updatePassword(password)
      Alert.alert(
        'Password Updated',
        'Your password has been changed successfully.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }],
      )
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-12 pb-8">
        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900 mb-2">New password</Text>
          <Text className="text-gray-500">Choose a strong password.</Text>
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">New Password</Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className={`border rounded-xl px-4 py-3 text-gray-900 ${errors.password ? 'border-red-400' : 'border-gray-300'}`}
                onChangeText={onChange}
                value={value}
                secureTextEntry
                placeholder="At least 8 characters"
              />
            )}
          />
          {errors.password && <Text className="text-red-500 text-xs mt-1">{errors.password.message}</Text>}
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-1">Confirm Password</Text>
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className={`border rounded-xl px-4 py-3 text-gray-900 ${errors.confirmPassword ? 'border-red-400' : 'border-gray-300'}`}
                onChangeText={onChange}
                value={value}
                secureTextEntry
                placeholder="Repeat password"
              />
            )}
          />
          {errors.confirmPassword && <Text className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</Text>}
        </View>

        <Pressable
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
          className={`bg-ck-primary-500 rounded-2xl py-4 items-center ${loading ? 'opacity-60' : ''}`}
        >
          <Text className="text-white font-bold text-base">
            {loading ? 'Updating…' : 'Update Password'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
