/** Paywall bottom sheet using @gorhom/bottom-sheet.
 *
 * Presents 3 plan options: free, individual, family.
 * Calls `onSelectPlan(planType)` when the user taps a plan CTA.
 *
 * Requires `GestureHandlerRootView` and `BottomSheetModalProvider`
 * to be present in the component tree (added in App.tsx).
 *
 * Usage:
 *   const sheetRef = useRef<BottomSheetModal>(null)
 *   sheetRef.current?.present()
 *   <PaywallSheet ref={sheetRef} onSelectPlan={handleSelectPlan} onDismiss={...} />
 */

import React, { forwardRef, useCallback } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet'
import { Ionicons } from '@expo/vector-icons'

const PLANS = [
  {
    type:        'free',
    label:       'Free',
    price:       '$0',
    period:      'forever',
    maxChildren: 1,
    features:    ['1 child profile', 'Daily activity card', 'Basic progress tracking'],
    cta:         'Continue Free',
    highlight:   false,
  },
  {
    type:        'individual',
    label:       'Individual',
    price:       '$4.99',
    period:      '/month',
    maxChildren: 1,
    features:   ['1 child profile', 'Unlimited activity library', 'Full progress history', 'Audio coaching prompts'],
    cta:         'Start Free Trial',
    highlight:   true,
  },
  {
    type:        'family',
    label:       'Family',
    price:       '$9.99',
    period:      '/month',
    maxChildren: 5,
    features:   ['Up to 5 children', 'Unlimited activity library', 'Full progress history', 'Audio coaching prompts', 'Priority support'],
    cta:         'Start Free Trial',
    highlight:   false,
  },
]

interface Props {
  onSelectPlan: (planType: string) => void
  onDismiss?:   () => void
}

const PaywallSheet = forwardRef<BottomSheetModal, Props>(
  ({ onSelectPlan, onDismiss }, ref) => {
    const snapPoints = ['85%']

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
      ),
      [],
    )

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        onDismiss={onDismiss}
        handleIndicatorStyle={{ backgroundColor: '#D1D5DB' }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.content}>
          <Text className="text-2xl font-bold text-gray-900 text-center mb-1">
            Unlock ChampionKids
          </Text>
          <Text className="text-gray-500 text-center mb-6">
            Choose a plan that works for your family
          </Text>

          {PLANS.map((plan) => (
            <View
              key={plan.type}
              className={`rounded-2xl p-4 mb-3 border-2 ${
                plan.highlight
                  ? 'border-ck-primary-500 bg-ck-primary-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {plan.highlight && (
                <View className="bg-ck-primary-500 rounded-full px-3 py-0.5 self-start mb-2">
                  <Text className="text-white text-xs font-bold">MOST POPULAR</Text>
                </View>
              )}

              <View className="flex-row items-baseline justify-between mb-3">
                <Text className="text-lg font-bold text-gray-900">{plan.label}</Text>
                <View className="flex-row items-baseline gap-0.5">
                  <Text className="text-2xl font-bold text-gray-900">{plan.price}</Text>
                  <Text className="text-gray-500 text-sm">{plan.period}</Text>
                </View>
              </View>

              {plan.features.map((f) => (
                <View key={f} className="flex-row items-center gap-2 mb-1">
                  <Ionicons name="checkmark-circle" size={16} color="#9C51B6" />
                  <Text className="text-sm text-gray-700">{f}</Text>
                </View>
              ))}

              <Pressable
                onPress={() => onSelectPlan(plan.type)}
                className={`rounded-xl py-3 items-center mt-4 ${
                  plan.highlight ? 'bg-ck-primary-500' : 'bg-gray-100'
                }`}
              >
                <Text
                  className={`font-semibold ${
                    plan.highlight ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  {plan.cta}
                </Text>
              </Pressable>
            </View>
          ))}

          <Text className="text-xs text-gray-400 text-center mt-2 mb-4">
            Cancel anytime. 14-day free trial for paid plans.
          </Text>
        </BottomSheetScrollView>
      </BottomSheetModal>
    )
  },
)

PaywallSheet.displayName = 'PaywallSheet'
export default PaywallSheet

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
})
