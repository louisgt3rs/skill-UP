import { registerRootComponent } from 'expo';

try {
  const App = require('./App').default;
  registerRootComponent(App);
} catch (e) {
  const { View, Text } = require('react-native');
  const React = require('react');
  function ErrorApp() {
    return React.createElement(View, {
      style: { flex: 1, backgroundColor: '#0A0A0F', justifyContent: 'center', padding: 24 }
    },
      React.createElement(Text, { style: { color: '#ff4444', fontSize: 16, fontWeight: 'bold', marginBottom: 12 } }, 'Erreur module :'),
      React.createElement(Text, { style: { color: '#fff', fontSize: 12 } }, e.message || String(e))
    );
  }
  registerRootComponent(ErrorApp);
}
