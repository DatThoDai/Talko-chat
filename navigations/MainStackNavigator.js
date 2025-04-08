import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import MessageScreen from '../screens/MessageScreen';
import ContactScreen from '../screens/ContactScreen';
import FriendDetailsScreen from '../screens/FriendDetailsScreen';
import MemberScreen from '../screens/MemberScreen';
import AddNewFriendScreen from '../screens/AddNewFriendScreen';
import ConversationOptionsScreen from '../screens/ConversationOptionsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';

const Stack = createStackNavigator();

const MainStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Message" component={MessageScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
      <Stack.Screen name="FriendDetails" component={FriendDetailsScreen} />
      <Stack.Screen name="Member" component={MemberScreen} />
      <Stack.Screen name="AddNewFriend" component={AddNewFriendScreen} />
      <Stack.Screen 
        name="ConversationOptions" 
        component={ConversationOptionsScreen}
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
    </Stack.Navigator>
  );
};

export default MainStackNavigator;
