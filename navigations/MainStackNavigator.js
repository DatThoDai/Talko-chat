import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MessageScreen from '../screens/MessageScreen';
import FriendDetailsScreen from '../screens/FriendDetailsScreen';
import MemberScreen from '../screens/MemberScreen';
import ConversationOptionsScreen from '../screens/ConversationOptionsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import NewConversationScreen from '../screens/NewConversationScreen';
import FriendSuggestionsScreen from '../screens/FriendSuggestionsScreen';
import FriendRequestsScreen from '../screens/FriendRequestsScreen';

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
      
      {/* Màn hình chuyển hướng từ các tabs */}
      <Stack.Screen name="NewConversation" component={NewConversationScreen} />
      <Stack.Screen name="Message" component={MessageScreen} />
      <Stack.Screen name="FriendDetails" component={FriendDetailsScreen} />
      <Stack.Screen name="Member" component={MemberScreen} />
      
      {/* Màn hình quản lý bạn bè */}
      <Stack.Screen name="FriendSuggestions" component={FriendSuggestionsScreen} />
      <Stack.Screen name="FriendRequests" component={FriendRequestsScreen} />
      
      {/* Màn hình khác */}
      <Stack.Screen 
        name="ConversationOptions" 
        component={ConversationOptionsScreen}
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
    </Stack.Navigator>
  );
};

export default MainStackNavigator;
