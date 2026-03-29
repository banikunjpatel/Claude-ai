import React from 'react'
import { View, Text, Pressable, ScrollView, SafeAreaView, Linking } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { HelpScreenProps } from '@/types/navigation'

const FAQ = [
  {
    q: 'How are activities selected each day?',
    a: 'Our algorithm picks an activity matched to your child\'s age band and skill profile, rotating across 7 developmental areas to ensure balanced growth.',
  },
  {
    q: 'Can I add more than one child?',
    a: 'Yes! Individual plans support 1 child and Family plans support up to 5 children.',
  },
  {
    q: 'What age ranges do you support?',
    a: 'ChampionKids supports children aged 1–12, grouped into 6 age bands: 1–2, 3–4, 5–6, 7–8, 9–10, and 11–12.',
  },
  {
    q: 'How do I cancel my subscription?',
    a: 'Go to Profile → Subscription and tap "Cancel Subscription". You\'ll keep access until the end of your billing period.',
  },
]

export default function HelpScreen({ navigation: _ }: HelpScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        {/* Contact */}
        <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">Contact Us</Text>
          <Pressable
            onPress={() => Linking.openURL('mailto:support@championkids.app')}
            className="flex-row items-center gap-3 py-2"
          >
            <Ionicons name="mail-outline" size={20} color="#9C51B6" />
            <Text className="text-ck-primary-600">support@championkids.app</Text>
          </Pressable>
        </View>

        {/* FAQ */}
        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
          Frequently Asked Questions
        </Text>
        {FAQ.map((item, i) => (
          <View key={i} className="bg-white rounded-2xl p-4 shadow-sm mb-3">
            <Text className="text-base font-semibold text-gray-900 mb-2">{item.q}</Text>
            <Text className="text-sm text-gray-600 leading-relaxed">{item.a}</Text>
          </View>
        ))}

        {/* Privacy / Terms */}
        <View className="flex-row justify-center gap-4 mt-2">
          <Pressable onPress={() => Linking.openURL('https://championkids.app/privacy')}>
            <Text className="text-sm text-ck-primary-600">Privacy Policy</Text>
          </Pressable>
          <Text className="text-gray-300">|</Text>
          <Pressable onPress={() => Linking.openURL('https://championkids.app/terms')}>
            <Text className="text-sm text-ck-primary-600">Terms of Service</Text>
          </Pressable>
        </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  )
}
