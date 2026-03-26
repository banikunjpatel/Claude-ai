import React, { useState } from 'react'
import { View, Text, TextInput, Pressable, SafeAreaView, Alert, Platform } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { EditChildScreenProps } from '@/types/navigation'
import { useChild, useUpdateChild, useDeleteChild } from '@/hooks/useChildren'
import LoadingState from '@/components/LoadingState'

const schema = z.object({
  name:        z.string().min(1, 'Name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
})
type FormData = z.infer<typeof schema>

export default function EditChildScreen({ route, navigation }: EditChildScreenProps) {
  const { childId } = route.params
  const { data: child, isLoading } = useChild(childId)
  const updateChild = useUpdateChild(childId)
  const deleteChild = useDeleteChild()
  const [showDatePicker, setShowDatePicker] = useState(false)

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    values: {
      name:        child?.name ?? '',
      dateOfBirth: child?.dateOfBirth ?? '',
    },
  })

  const dobValue = watch('dateOfBirth')

  function handleDateChange(_: unknown, date?: Date) {
    setShowDatePicker(Platform.OS === 'ios')
    if (date) setValue('dateOfBirth', date.toISOString().split('T')[0])
  }

  async function onSubmit(data: FormData) {
    try {
      await updateChild.mutateAsync(data)
      navigation.goBack()
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to update child.')
    }
  }

  function handleDelete() {
    Alert.alert(
      'Remove Child',
      `Are you sure you want to remove ${child?.name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await deleteChild.mutateAsync(childId)
            navigation.goBack()
          },
        },
      ],
    )
  }

  if (isLoading || !child) return <LoadingState />

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-6">
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Name</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className={`border rounded-xl px-4 py-3 text-gray-900 ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
                onChangeText={onChange}
                value={value}
                autoCapitalize="words"
              />
            )}
          />
          {errors.name && <Text className="text-red-500 text-xs mt-1">{errors.name.message}</Text>}
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-1">Date of Birth</Text>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            className="border border-gray-300 rounded-xl px-4 py-3"
          >
            <Text className="text-gray-900">
              {dobValue
                ? new Date(dobValue).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                : 'Select date'}
            </Text>
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={dobValue ? new Date(dobValue) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>

        <Pressable
          onPress={handleSubmit(onSubmit)}
          disabled={updateChild.isPending}
          className={`bg-ck-primary-500 rounded-2xl py-4 items-center mb-4 ${updateChild.isPending ? 'opacity-60' : ''}`}
        >
          <Text className="text-white font-bold text-base">
            {updateChild.isPending ? 'Saving…' : 'Save Changes'}
          </Text>
        </Pressable>

        <Pressable onPress={handleDelete} className="py-4 items-center">
          <Text className="text-red-500 font-medium">Remove Child</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
