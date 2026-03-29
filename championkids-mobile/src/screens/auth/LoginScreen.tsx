import React, { useState } from 'react'
import {
  View, Text, TextInput, Pressable, SafeAreaView,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { LoginScreenProps } from '@/types/navigation'
import { signIn } from '@/api/auth'

const schema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
type FormData = z.infer<typeof schema>

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [loading, setLoading] = useState(false)

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      await signIn(data)
      // RootNavigator will switch to App tabs automatically on auth state change
    } catch (err: any) {
      Alert.alert('Sign In Failed', err?.message ?? 'Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="flex-1 px-6 pt-12 pb-8 justify-center">
            <View className="mb-8">
              <Text className="text-3xl font-bold text-gray-900 mb-2">Welcome back</Text>
              <Text className="text-gray-500">Sign in to continue</Text>
            </View>

            {/* Email */}
            <View className="mb-4">
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
                    autoComplete="email"
                    placeholder="you@example.com"
                  />
                )}
              />
              {errors.email && <Text className="text-red-500 text-xs mt-1">{errors.email.message}</Text>}
            </View>

            {/* Password */}
            <View className="mb-6">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-sm font-medium text-gray-700">Password</Text>
                <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text className="text-sm text-ck-primary-600">Forgot password?</Text>
                </Pressable>
              </View>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    className={`border rounded-xl px-4 py-3 text-gray-900 ${errors.password ? 'border-red-400' : 'border-gray-300'}`}
                    onChangeText={onChange}
                    value={value}
                    secureTextEntry
                    autoComplete="current-password"
                    placeholder="••••••••"
                  />
                )}
              />
              {errors.password && <Text className="text-red-500 text-xs mt-1">{errors.password.message}</Text>}
            </View>

            <Pressable
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
              className={`bg-ck-primary-500 rounded-2xl py-4 items-center mb-4 ${loading ? 'opacity-60' : ''}`}
            >
              <Text className="text-white font-bold text-base">
                {loading ? 'Signing in…' : 'Sign In'}
              </Text>
            </Pressable>

            <View className="flex-row justify-center gap-1">
              <Text className="text-gray-500">Don't have an account?</Text>
              <Pressable onPress={() => navigation.navigate('SignUp')}>
                <Text className="text-ck-primary-600 font-semibold">Sign up</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
