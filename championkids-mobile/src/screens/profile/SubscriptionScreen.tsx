import React, { useRef } from 'react'
import {
  View, Text, ScrollView, Pressable, SafeAreaView, Alert, Linking,
} from 'react-native'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import type { SubscriptionScreenProps } from '@/types/navigation'
import { useEntitlement, useSubscription, useCheckoutSession, useCancelSubscription } from '@/hooks/useSubscription'
import PaywallSheet from '@/components/PaywallSheet'
import LoadingState from '@/components/LoadingState'

export default function SubscriptionScreen({ navigation: _ }: SubscriptionScreenProps) {
  const paywallRef = useRef<BottomSheetModal>(null)

  const { data: entitlement, isLoading } = useEntitlement()
  const { data: subscription }           = useSubscription()
  const checkoutMutation                 = useCheckoutSession()
  const cancelMutation                   = useCancelSubscription()

  if (isLoading) return <LoadingState />

  async function handleSelectPlan(planType: string) {
    paywallRef.current?.dismiss()
    if (planType === 'free') return

    try {
      const url = await checkoutMutation.mutateAsync(planType)
      await Linking.openURL(url)
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not start checkout.')
    }
  }

  function handleCancel() {
    Alert.alert(
      'Cancel Subscription',
      'You will keep access until the end of the current billing period.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => cancelMutation.mutate(),
        },
      ],
    )
  }

  const isFree    = !entitlement?.hasFullAccess
  const isActive  = entitlement?.status === 'active'
  const isGrace   = entitlement?.status === 'grace'
  const isTrial   = entitlement?.isInTrial

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        {/* Current plan card */}
        <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <Text className="text-sm text-gray-500 mb-1">Current Plan</Text>
          <Text className="text-2xl font-bold text-gray-900 capitalize mb-2">
            {entitlement?.planType ?? 'Free'}
          </Text>

          {isTrial && entitlement?.trialDaysRemaining != null && (
            <View className="bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2 mb-3">
              <Text className="text-yellow-700 text-sm font-medium">
                {entitlement.trialDaysRemaining} days left in trial
              </Text>
            </View>
          )}

          {isGrace && (
            <View className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-3">
              <Text className="text-red-700 text-sm font-medium">
                Payment issue — please update your payment method.
              </Text>
            </View>
          )}

          {entitlement?.currentPeriodEnd && !isFree && (
            <Text className="text-sm text-gray-500">
              {subscription?.cancelAtPeriodEnd ? 'Ends' : 'Renews'} on{' '}
              {new Date(entitlement.currentPeriodEnd).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
              })}
            </Text>
          )}
        </View>

        {/* Actions */}
        {isFree ? (
          <Pressable
            onPress={() => paywallRef.current?.present()}
            className="bg-ck-primary-500 rounded-2xl py-4 items-center mb-3"
          >
            <Text className="text-white font-bold text-base">Upgrade Plan</Text>
          </Pressable>
        ) : (
          <>
            {isActive && !subscription?.cancelAtPeriodEnd && (
              <Pressable
                onPress={handleCancel}
                disabled={cancelMutation.isPending}
                className="border border-red-300 rounded-2xl py-4 items-center mb-3"
              >
                <Text className="text-red-500 font-semibold">
                  {cancelMutation.isPending ? 'Cancelling…' : 'Cancel Subscription'}
                </Text>
              </Pressable>
            )}
          </>
        )}
      </ScrollView>

      <PaywallSheet ref={paywallRef} onSelectPlan={handleSelectPlan} />
    </SafeAreaView>
  )
}
