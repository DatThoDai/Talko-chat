import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';
import ConversationsScreen from '../screens/ConversationsScreen';
import FriendsScreen from '../screens/FriendsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../styles';

const Tab = createMaterialTopTabNavigator();

export default function TabNavigator() {
  const { conversations } = useSelector(state => state.chat);
  const { user } = useSelector(state => state.auth);
  
  // Hàm tính tổng số tin nhắn chưa đọc
  const getTotalUnreadCount = () => {
    if (!conversations || !Array.isArray(conversations)) {
      return 0;
    }
    
    return conversations.reduce((total, conversation) => {
      return total + (conversation.unreadCount || 0);
    }, 0);
  };
  
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
          let count = 0;
          
          switch (route.name) {
            case 'Tin nhắn': {
              iconName = 'chat';
              count = getTotalUnreadCount();
              break;
            }
            case 'Bạn bè': {
              iconName = 'people';
              // Số lời mời kết bạn (trong ứng dụng thực tế sẽ lấy từ state)
              count = 0;
              break;
            }
            case 'Cá nhân': {
              iconName = 'person';
              count = 0;
              break;
            }
            default:
              iconName = 'chat';
              count = 0;
              break;
          }
          
          return (
            <View style={{ flex: 1 }}>
              <Icon name={iconName} size={24} color={color} />
              {count > 0 && (
                <View style={styles.iconBadge}>
                  <Text style={styles.badgeElement}>
                    {count > 99 ? '99+' : count}
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
  badgeElement: { 
    color: 'white', 
    fontSize: 10 
  },
  iconBadge: {
    color: 'white',
    fontSize: 10,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    position: 'absolute',
    top: -5,
    right: -5,
  },
});
