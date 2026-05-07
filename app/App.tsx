import React from 'react';
import { View, Text } from 'react-native';

export default function App() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0F', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontSize: 32, fontWeight: 'bold' }}>⚡ SkillUp</Text>
      <Text style={{ color: '#888', fontSize: 16, marginTop: 8 }}>Loading...</Text>
    </View>
  );
}
