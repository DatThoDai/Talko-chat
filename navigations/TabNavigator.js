import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ProfileScreen from '../screens/ProfileScreen';
import ConversationsScreen from '../screens/ConversationsScreen';
import { colors } from '../styles';
import { useSelector } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';

const Tab = createMaterialTopTabNavigator();

// Sử dụng createSelector đúng cách để tránh re-render không cần thiết
// Lưu ý: cần sử dụng các input selector đơn giản
// không trả về các object/array mới
const selectChat = state => state.chat;
const selectChatConversations = createSelector(
  [selectChat],
  (chat) => (chat && chat.conversations) || []
);

export default function TabNavigator() {
  // Sử dụng selector cố định thay vì tạo mới inline function mỗi lần
  const conversations = useSelector(selectChatConversations);
  
  // Tính toán unreadCount đơn giản
  const unreadCount = conversations.reduce((sum, conversation) => sum + (conversation.unreadCount || 0), 0);
  
  return (
    <Tab.Navigator
      tabBarPosition="bottom"
      screenOptions={({ route }) => ({
        tabBarLabelStyle: { fontSize: 12 },
        tabBarItemStyle: { height: 50 },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray,
        swipeEnabled: false,
        
        tabBarLabel: ({ focused, color }) => {
          return <Text style={{ color }}>{route.name}</Text>;
        },
        
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          
          if (route.name === 'Tin nhắn') {
            iconName = 'chat';
          } else if (route.name === 'Cá nhân') {
            iconName = 'person';
          }
          
          return (
            <View style={styles.iconContainer}>
              <Icon name={iconName} size={24} color={color} />
              
              {/* Hiển thị số lượng tin nhắn chưa đọc */}
              {route.name === 'Tin nhắn' && unreadCount > 0 && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          );
        },
      })}
    >
      <Tab.Screen 
        name="Tin nhắn" 
        component={ConversationsScreen} 
      />
      <Tab.Screen 
        name="Cá nhân" 
        component={ProfileScreen} 
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
});
