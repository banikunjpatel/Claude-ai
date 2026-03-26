/** Navigation ref for use outside of React components (e.g. Axios interceptor).
 *
 * Usage:
 *   import { navigationRef } from '@/navigation/navigationRef'
 *   navigationRef.navigate('Login')       // outside a component
 *
 * Pass this ref to <NavigationContainer ref={navigationRef}> in RootNavigator.
 */

import { createNavigationContainerRef } from '@react-navigation/native'
import type { RootStackParamList } from '@/types/navigation'

export const navigationRef = createNavigationContainerRef<RootStackParamList>()
