import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../styles';

const CustomAvatar = ({ 
  size = 40, 
  source, 
  name, 
  online = false,
  style 
}) => {
  const initials = name
    ?.split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {source ? (
        <Image
          source={source}
          style={[styles.image, { borderRadius: size / 2 }]}
        />
      ) : (
        <View
          style={[
            styles.initialsContainer,
            { backgroundColor: colors.primary, borderRadius: size / 2 },
          ]}
        >
          <Text
            style={[
              styles.initials,
              { fontSize: size * 0.4 },
            ]}
          >
            {initials}
          </Text>
        </View>
      )}
      {online && (
        <View style={styles.onlineIndicator} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  initialsContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: colors.white,
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
  },
});

export default CustomAvatar; 