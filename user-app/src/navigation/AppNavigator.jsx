import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { View, ActivityIndicator } from 'react-native';
import { loadUserFromStorage } from '../store/slices/authSlice';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { COLORS } from '../utils/helpers';

export default function AppNavigator() {
  const dispatch = useDispatch();
  const { isAuthenticated, bootstrapped } = useSelector((s) => s.auth);

  useEffect(() => { dispatch(loadUserFromStorage()); }, [dispatch]);

  if (!bootstrapped) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A1A2E' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
