/** Onboarding step 2 — parent name input. */

import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import type { Onboarding2Props } from '@/types/navigation'
import { useAppStore } from '@/store/useAppStore'

export default function OnboardingScreen2({ navigation }: Onboarding2Props) {
  const storedName   = useAppStore((s) => s.onboardingData.parentName)
  const setParentName = useAppStore((s) => s.setParentName)

  const [name, setName]   = useState(storedName)
  const [touched, setTouched] = useState(false)

  const trimmed = name.trim()
  const error =
    touched && (trimmed.length < 2 || trimmed.length > 30)
      ? 'Please enter a name between 2 and 30 characters.'
      : null
  const canContinue = trimmed.length >= 2 && trimmed.length <= 30

  function handleChange(value: string) {
    setName(value)
    setParentName(value)
  }

  function handleNext() {
    setTouched(true)
    if (!canContinue) return
    navigation.navigate('Onboarding3')
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 px-6 pt-8 pb-8 justify-between">
          {/* Progress dots */}
          <View className="flex-row justify-center gap-2 mb-8">
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                className={`w-2 h-2 rounded-full ${i === 1 ? 'bg-ck-primary-500' : 'bg-gray-200'}`}
              />
            ))}
          </View>

          <View className="flex-1 gap-6">
            <View className="gap-2">
              <Text className="text-2xl font-bold text-gray-900">
                What should we call you?
              </Text>
              <Text className="text-gray-500 text-base leading-relaxed">
                We'll personalise your experience using your name.
              </Text>
            </View>

            <View className="gap-1.5">
              <Text className="text-sm font-medium text-gray-700">Your name</Text>
              <TextInput
                value={name}
                onChangeText={handleChange}
                onBlur={() => setTouched(true)}
                placeholder="e.g. Sarah"
                placeholderTextColor="#9CA3AF"
                autoFocus
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={handleNext}
                className={`border rounded-xl px-4 py-3.5 text-base text-gray-900 ${
                  error ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'
                }`}
              />
              {error && (
                <Text className="text-sm text-red-500">{error}</Text>
              )}
            </View>
          </View>

          <View className="flex-row gap-3 mt-6">
            <Pressable
              onPress={() => navigation.goBack()}
              className="flex-1 border border-gray-200 rounded-2xl py-4 items-center"
            >
              <Text className="text-gray-600 font-semibold">Back</Text>
            </Pressable>
            <Pressable
              onPress={handleNext}
              className={`flex-1 rounded-2xl py-4 items-center ${
                canContinue ? 'bg-ck-primary-500' : 'bg-ck-primary-200'
              }`}
            >
              <Text className="text-white font-bold">Next</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
