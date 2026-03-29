/** Typed route-param definitions for every screen in the app.
 *
 * Usage in a screen component:
 *   import type { NativeStackScreenProps } from '@react-navigation/native-stack'
 *   import type { TodayStackParamList } from '@/types/navigation'
 *   type Props = NativeStackScreenProps<TodayStackParamList, 'TodayScreen'>
 */

import type { NavigatorScreenParams } from '@react-navigation/native'
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { CompositeScreenProps } from '@react-navigation/native'

// ── Onboarding stack ──────────────────────────────────────────────────────────
export type OnboardingStackParamList = {
  Splash:              undefined
  Onboarding1:         undefined
  Onboarding2:         undefined
  Onboarding3:         undefined
  Onboarding4:         undefined
  OnboardingComplete:  undefined
}

// ── Auth stack ────────────────────────────────────────────────────────────────
export type AuthStackParamList = {
  Login:           undefined
  SignUp:          undefined
  ForgotPassword:  undefined
  ResetPassword:   { token?: string }
}

// ── Tab stacks ────────────────────────────────────────────────────────────────
export type TodayStackParamList = {
  TodayScreen:       undefined
  ActivityDetail:    { activityId: string }
  ActivityComplete:  { activityId: string; childId: string }
}

export type LibraryStackParamList = {
  LibraryScreen: undefined
}

export type ProgressStackParamList = {
  ProgressScreen:   undefined
  ProgressHistory:  { childId: string }
}

export type ProfileStackParamList = {
  ProfileScreen:  undefined
  EditProfile:    undefined
  AddChild:       undefined
  EditChild:      { childId: string }
  Subscription:   undefined
  Help:           undefined
}

// ── App tab navigator ─────────────────────────────────────────────────────────
export type AppTabParamList = {
  TodayTab:    NavigatorScreenParams<TodayStackParamList>
  LibraryTab:  NavigatorScreenParams<LibraryStackParamList>
  ProgressTab: NavigatorScreenParams<ProgressStackParamList>
  ProfileTab:  NavigatorScreenParams<ProfileStackParamList>
}

// ── Root navigator ────────────────────────────────────────────────────────────
export type RootStackParamList = {
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>
  Auth:       NavigatorScreenParams<AuthStackParamList>
  App:        NavigatorScreenParams<AppTabParamList>
}

// ── Convenience navigation prop aliases ──────────────────────────────────────
export type OnboardingNavProp  = NativeStackNavigationProp<OnboardingStackParamList>
export type AuthNavProp        = NativeStackNavigationProp<AuthStackParamList>
export type TodayNavProp       = NativeStackNavigationProp<TodayStackParamList>
export type LibraryNavProp     = NativeStackNavigationProp<LibraryStackParamList>
export type ProgressNavProp    = NativeStackNavigationProp<ProgressStackParamList>
export type ProfileNavProp     = NativeStackNavigationProp<ProfileStackParamList>

// ── Screen props aliases ──────────────────────────────────────────────────────
export type SplashScreenProps             = NativeStackScreenProps<OnboardingStackParamList, 'Splash'>
export type Onboarding1Props              = NativeStackScreenProps<OnboardingStackParamList, 'Onboarding1'>
export type Onboarding2Props              = NativeStackScreenProps<OnboardingStackParamList, 'Onboarding2'>
export type Onboarding3Props              = NativeStackScreenProps<OnboardingStackParamList, 'Onboarding3'>
export type Onboarding4Props              = NativeStackScreenProps<OnboardingStackParamList, 'Onboarding4'>
export type OnboardingCompleteProps       = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingComplete'>

export type LoginScreenProps              = NativeStackScreenProps<AuthStackParamList, 'Login'>
export type SignUpScreenProps             = NativeStackScreenProps<AuthStackParamList, 'SignUp'>
export type ForgotPasswordScreenProps     = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>
export type ResetPasswordScreenProps      = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>

export type TodayScreenProps              = NativeStackScreenProps<TodayStackParamList, 'TodayScreen'>
export type ActivityDetailScreenProps     = NativeStackScreenProps<TodayStackParamList, 'ActivityDetail'>
export type ActivityCompleteScreenProps   = NativeStackScreenProps<TodayStackParamList, 'ActivityComplete'>

export type LibraryScreenProps            = NativeStackScreenProps<LibraryStackParamList, 'LibraryScreen'>

export type ProgressScreenProps           = NativeStackScreenProps<ProgressStackParamList, 'ProgressScreen'>
export type ProgressHistoryScreenProps    = NativeStackScreenProps<ProgressStackParamList, 'ProgressHistory'>

export type ProfileScreenProps            = NativeStackScreenProps<ProfileStackParamList, 'ProfileScreen'>
export type EditProfileScreenProps        = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>
export type AddChildScreenProps           = NativeStackScreenProps<ProfileStackParamList, 'AddChild'>
export type EditChildScreenProps          = NativeStackScreenProps<ProfileStackParamList, 'EditChild'>
export type SubscriptionScreenProps       = NativeStackScreenProps<ProfileStackParamList, 'Subscription'>
export type HelpScreenProps               = NativeStackScreenProps<ProfileStackParamList, 'Help'>
