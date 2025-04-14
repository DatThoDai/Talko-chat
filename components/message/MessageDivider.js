import React from 'react';
import {StyleSheet, Text, View, ActivityIndicator} from 'react-native';
import { isToday, isYesterday, format } from 'date-fns';
import { vi } from 'date-fns/locale';

const MessageDivider = ({text, isLoading, date}) => {
  // Format date for display in divider
  const getFormattedDate = (date) => {
    if (!date) return '';
    
    try {
      const messageDate = new Date(date);
      
      // Check if date is valid
      if (isNaN(messageDate.getTime())) {
        return text || '';
      }
      
      // If the message is from today
      if (isToday(messageDate)) {
        return 'Hôm nay';
      }
      
      // If the message is from yesterday
      if (isYesterday(messageDate)) {
        return 'Hôm qua';
      }
      
      // If the message is from this year
      const now = new Date();
      if (messageDate.getFullYear() === now.getFullYear()) {
        return format(messageDate, 'd MMMM', { locale: vi });
      }
      
      // If the message is from a different year
      return format(messageDate, 'd MMMM yyyy', { locale: vi });
    } catch (error) {
      console.error('Error formatting date for divider:', error);
      return text || '';
    }
  };
  
  const displayText = date ? getFormattedDate(date) : text;
  
  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="small" color="#007AFF" />
      ) : (
        <View style={styles.divider}>
          <Text style={styles.text}>{displayText}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  divider: {
    backgroundColor: 'rgba(228, 233, 242, 0.7)',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  text: {
    fontSize: 12,
    color: '#636366',
  },
});

export default MessageDivider;
