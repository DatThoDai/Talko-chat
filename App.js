import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigations';
import store from './redux/store';
import { colors } from './styles';

const App = () => {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar
            barStyle="dark-content"
            backgroundColor={colors.white}
          />
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </Provider>
  );
};

export default App;
