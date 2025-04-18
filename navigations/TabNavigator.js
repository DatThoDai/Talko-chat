import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ProfileScreen from '../screens/ProfileScreen';
import ConversationsScreen from '../screens/ConversationsScreen';
import { colors } from '../styles';
import { useSelector } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';
import FriendsScreen from '../screens/FriendsScreen';

// Tiếp tục sử dụng Material Top Tabs nhưng sửa lại cách triển khai
const Tab = createMaterialTopTabNavigator();

// Sử dụng createSelector đúng cách để tránh re-render không cần thiết
const selectChat = state => state.chat;
const selectChatConversations = createSelector(
  [selectChat],
  (chat) => (chat && chat.conversations) || []
);

// Tạo component riêng cho từng tab để tránh lỗi key prop
function TabIcon({ iconName, focused, unreadCount }) {
  return (
    <View style={styles.iconContainer}>
      <Icon 
        name={iconName} 
        size={24} 
        color={focused ? colors.primary : colors.gray}
      />
      
      {iconName === 'chat' && unreadCount > 0 && (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </View>
  );
}

function TabLabel({ label, focused }) {
  return (
    <Text style={[
      styles.tabText, 
      { color: focused ? colors.primary : colors.gray }
    ]}>
      {label}
    </Text>
  );
}

function MyTabBar({ state, descriptors, navigation }) {
  const conversations = useSelector(selectChatConversations);
  const unreadCount = conversations.reduce((sum, conversation) => sum + (conversation.unreadCount || 0), 0);

  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel !== undefined
          ? options.tabBarLabel
          : options.title !== undefined
          ? options.title
          : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Determine which icon to show
        let iconName;
        if (route.name === 'Tin nhắn') {
          iconName = 'chat';
        } else if (route.name === 'Bạn bè') {
          iconName = 'people';
        } else if (route.name === 'Cá nhân') {
          iconName = 'person';
        }

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={styles.tabButton}
          >
            <TabIcon 
              iconName={iconName} 
              focused={isFocused} 
              unreadCount={route.name === 'Tin nhắn' ? unreadCount : 0} 
            />
            <TabLabel label={label} focused={isFocused} />
            
            {/* Indicator for the active tab */}
            {isFocused && <View style={styles.indicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={props => <MyTabBar {...props} />}
      tabBarPosition="bottom"
      screenOptions={{
        swipeEnabled: false,
        tabBarIndicatorStyle: { height: 0 }, // Hide default indicator
      }}
    >
      <Tab.Screen 
        name="Tin nhắn" 
        component={ConversationsScreen} 
      />
      <Tab.Screen 
        name="Bạn bè" 
        component={FriendsScreen}
      />
      <Tab.Screen 
        name="Cá nhân" 
        component={ProfileScreen}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.light,
    height: 60,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 12,
    marginTop: 4,
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
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    width: '50%',
    backgroundColor: colors.primary,
  },
});