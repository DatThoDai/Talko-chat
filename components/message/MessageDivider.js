import React from 'react';
import {StyleSheet, Text, View, ActivityIndicator} from 'react-native';

const MessageDivider = ({text, isLoading}) => {
  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="small" color="#007AFF" />
      ) : (
        <View style={styles.divider}>
          {text && <Text style={styles.text}>{text}</Text>}
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
