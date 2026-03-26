import React, { useState } from 'react'
import {
  View, Text, TextInput, Pressable, SafeAreaView, Alert,
} from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ForgotPasswordScreenProps } from '@/types/navigation'
import { sendPasswordResetEmail } from '@/api/auth'

const schema = z.object({
  email: z.string().email('Invalid email'),
})
type FormData = z.infer<typeof schema>

export default function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const [loading, setLoading] = useState(false)

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit({ email }: FormData) {
    setLoading(true)
    try {
      await sendPasswordResetEmail(email)
      Alert.alert(
        'Email Sent',
        'Check your inbox for a password reset link.',
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
        <Pressable onPress={() => navigation.goBack()} className="mb-8">
          <Text className="text-ck-primary-600 text-base">← Back</Text>
        </Pressable>

        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900 mb-2">Forgot password</Text>
          <Text className="text-gray-500">We'll send a reset link to your email.</Text>
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className={`border rounded-xl px-4 py-3 text-gray-900 ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
                onChangeText={onChange}
                value={value}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="you@example.com"
              />
            )}
          />
          {errors.email && <Text className="text-red-500 text-xs mt-1">{errors.email.message}</Text>}
        </View>

        <Pressable
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
          className={`bg-ck-primary-500 rounded-2xl py-4 items-center ${loading ? 'opacity-60' : ''}`}
        >
          <Text className="text-white font-bold text-base">
            {loading ? 'Sending…' : 'Send Reset Link'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
