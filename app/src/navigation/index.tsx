import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { theme } from '../theme';

import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { CreateMatchScreen } from '../screens/CreateMatchScreen';
import { MatchDetailScreen } from '../screens/MatchDetailScreen';
import { SubmitResultScreen } from '../screens/SubmitResultScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { session, loading, setSession } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.text,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        {!session ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={HomeScreen} options={{ title: 'SkillUp ⚡' }} />
            <Stack.Screen name="CreateMatch" component={CreateMatchScreen} options={{ title: 'Create Match' }} />
            <Stack.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }} />
            <Stack.Screen name="MatchDetail" component={MatchDetailScreen} options={{ title: 'Match Details' }} />
            <Stack.Screen name="SubmitResult" component={SubmitResultScreen} options={{ title: 'Submit Result' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
