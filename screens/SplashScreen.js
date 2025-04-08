import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useDispatch } from 'react-redux';
import { checkAuth } from '../redux/authSlice';
import { colors, typography } from '../styles';

const SplashScreen = () => {
  const dispatch = useDispatch();
  
  useEffect(() => {
    const checkUserAuth = async () => {
      await dispatch(checkAuth());
    };
    
    checkUserAuth();
  }, [dispatch]);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Talko</Text>
      <ActivityIndicator 
        size="large" 
        color={colors.primary} 
        style={styles.loader} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: 20,
  },
  loader: {
    marginTop: 20,
  },
});

export default SplashScreen;
