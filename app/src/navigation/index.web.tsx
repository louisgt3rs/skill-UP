import React, { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';

type ScreenName = 'Login' | 'Signup';

export function RootNavigator() {
  const [current, setCurrent] = useState<ScreenName>('Login');

  const makeNav = () => ({
    navigate: (target: string) => setCurrent(target as ScreenName),
    goBack: () => setCurrent('Login'),
    replace: (target: string) => setCurrent(target as ScreenName),
    push: (target: string) => setCurrent(target as ScreenName),
    setOptions: () => {},
    addListener: () => () => {},
    isFocused: () => true,
    canGoBack: () => current !== 'Login',
  });

  const route = { key: current, name: current, params: undefined } as any;

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        {current === 'Login' && (
          <LoginScreen navigation={makeNav() as any} route={route} />
        )}
        {current === 'Signup' && (
          <SignupScreen navigation={makeNav() as any} route={route} />
        )}
      </View>
    </SafeAreaProvider>
  );
}
