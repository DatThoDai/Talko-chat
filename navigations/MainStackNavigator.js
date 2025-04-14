import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import MessageScreen from '../screens/MessageScreen';
import NewConversationScreen from '../screens/NewConversationScreen';
import HomeScreen from '../screens/HomeScreen';
import ContactScreen from '../screens/ContactScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FriendsScreen from '../screens/FriendsScreen';
import FriendDetailsScreen from '../screens/FriendDetailsScreen';
import FriendRequestsScreen from '../screens/FriendRequestsScreen';
import FriendSuggestionsScreen from '../screens/FriendSuggestionsScreen';

// Tab Navigator chính (điều hướng giữa các tab)
import TabNavigator from './TabNavigator';

const Stack = createStackNavigator();

const MainStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Main"
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* TabNavigator chứa 3 tabs chính: Tin nhắn, Bạn bè, Cá nhân */}
      <Stack.Screen name="Main" component={TabNavigator} />
      
      {/* Màn hình quản lý tài khoản */}
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      
      {/* Màn hình chat */}
      <Stack.Screen 
        name="MessageScreen" 
        component={MessageScreen} 
        options={{
          headerShown: true,
          headerBackVisible: false, // Hide the default back button
          headerTitle: () => null, // Remove default title
          headerStyle: {
            backgroundColor: '#2196F3',
            elevation: 2, // For Android shadow
            shadowOpacity: 0.2, // For iOS shadow
          },
          headerTintColor: '#fff',
          headerLeft: null, // This allows our custom MessageHeaderLeft to be used
        }}
      />
      <Stack.Screen 
        name="NewConversationScreen" 
        component={NewConversationScreen} 
        options={{
          headerShown: false, // Ẩn header mặc định để tránh trùng lặp
          headerBackTitleVisible: false
        }}
      />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Friends" component={FriendsScreen} />
      <Stack.Screen name="FriendDetails" component={FriendDetailsScreen} />
      <Stack.Screen name="FriendRequests" component={FriendRequestsScreen} />
      <Stack.Screen name="FriendSuggestions" component={FriendSuggestionsScreen} />
    </Stack.Navigator>
  );
};

export default MainStackNavigator;
