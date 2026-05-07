import React, { Suspense } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

const RootNavigator = React.lazy(() =>
  import('./src/navigation').then(m => ({ default: m.RootNavigator })).catch(e => ({
    default: () => (
      <View style={{ flex: 1, backgroundColor: '#0A0A0F', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: '#ff4444', fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>
          Erreur au chargement :
        </Text>
        <Text style={{ color: '#fff', fontSize: 12 }}>{e?.message ?? String(e)}</Text>
      </View>
    )
  }))
);

export default function App() {
  return (
    <Suspense fallback={
      <View style={{ flex: 1, backgroundColor: '#0A0A0F', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#7C3AED" size="large" />
      </View>
    }>
      <RootNavigator />
    </Suspense>
  );
}
