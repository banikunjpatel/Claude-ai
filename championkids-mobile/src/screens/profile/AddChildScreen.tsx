import React, { useState } from 'react'
import { View, Text, TextInput, Pressable, SafeAreaView, Alert, Platform } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { AddChildScreenProps } from '@/types/navigation'
import { useCreateChild } from '@/hooks/useChildren'

const schema = z.object({
  name:        z.string().min(1, 'Name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
})
type FormData = z.infer<typeof schema>

export default function AddChildScreen({ navigation }: AddChildScreenProps) {
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedDate, setSelectedDate]     = useState(new Date())
  const createChild = useCreateChild()

  const { control, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  function handleDateChange(_: unknown, date?: Date) {
    setShowDatePicker(Platform.OS === 'ios')
    if (date) {
      setSelectedDate(date)
      setValue('dateOfBirth', date.toISOString().split('T')[0])
    }
  }

  async function onSubmit(data: FormData) {
    try {
      await createChild.mutateAsync(data)
      navigation.goBack()
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to add child.')
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-6">
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Child's Name</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className={`border rounded-xl px-4 py-3 text-gray-900 ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
                onChangeText={onChange}
                value={value}
                autoCapitalize="words"
                placeholder="e.g. Emma"
              />
            )}
          />
          {errors.name && <Text className="text-red-500 text-xs mt-1">{errors.name.message}</Text>}
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-1">Date of Birth</Text>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            className={`border rounded-xl px-4 py-3 ${errors.dateOfBirth ? 'border-red-400' : 'border-gray-300'}`}
          >
            <Text className={selectedDate ? 'text-gray-900' : 'text-gray-400'}>
              {selectedDate
                ? selectedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                : 'Select date of birth'}
            </Text>
          </Pressable>
          {errors.dateOfBirth && <Text className="text-red-500 text-xs mt-1">{errors.dateOfBirth.message}</Text>}

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>

        <Pressable
          onPress={handleSubmit(onSubmit)}
          disabled={createChild.isPending}
          className={`bg-ck-primary-500 rounded-2xl py-4 items-center ${createChild.isPending ? 'opacity-60' : ''}`}
        >
          <Text className="text-white font-bold text-base">
            {createChild.isPending ? 'Adding…' : 'Add Child'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
