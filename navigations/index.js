import React from 'react';
import { useSelector } from 'react-redux';
import MainStackNavigator from './MainStackNavigator';
import AuthStackNavigator from './AuthStackNavigator';
import SplashScreen from '../screens/SplashScreen';

const AppNavigator = () => {
  const { isAuthenticated } = useSelector(state => state.auth);
  const { isLoading } = useSelector(state => state.global);

  if (isLoading) {
    return <SplashScreen />;
  }

  return isAuthenticated ? <MainStackNavigator /> : <AuthStackNavigator />;
};

export default AppNavigator;
