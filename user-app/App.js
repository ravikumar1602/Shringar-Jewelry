import React from 'react';
import { Provider } from 'react-redux';
import { StatusBar } from 'react-native';
import Toast from 'react-native-toast-message';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <Provider store={store}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />
      <AppNavigator />
      <Toast />
    </Provider>
  );
}
