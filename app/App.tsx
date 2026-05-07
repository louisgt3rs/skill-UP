import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

interface State {
  Nav: React.ComponentType | null;
  error: string | null;
}

export default class App extends React.Component<{}, State> {
  state: State = { Nav: null, error: null };

  componentDidMount() {
    try {
      const { RootNavigator } = require('./src/navigation');
      this.setState({ Nav: RootNavigator });
    } catch (e: any) {
      this.setState({ error: e?.message ?? String(e) });
    }
  }

  render() {
    const { Nav, error } = this.state;

    if (error) {
      return (
        <View style={{ flex: 1, backgroundColor: '#0A0A0F', justifyContent: 'center', padding: 24 }}>
          <Text style={{ color: '#ff4444', fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>
            Erreur :
          </Text>
          <Text style={{ color: '#fff', fontSize: 12 }}>{error}</Text>
        </View>
      );
    }

    if (!Nav) {
      return (
        <View style={{ flex: 1, backgroundColor: '#0A0A0F', justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#7C3AED" size="large" />
        </View>
      );
    }

    return <Nav />;
  }
}
