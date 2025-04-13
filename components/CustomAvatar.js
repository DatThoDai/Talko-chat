import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../styles';

const CustomAvatar = ({ 
  size = 40, 
  source, 
  imageUrl,
  name = '',
  color,
  online = false,
  style 
}) => {
  // Get initials from name (maximum 2 characters)
  const initials = name
    ?.split(' ')
    .map(word => word && word[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  // Determine the background color
  const backgroundColor = color || colors.primary;

  // Determine if we should show an image
  const hasImage = source || imageUrl;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {hasImage ? (
        <Image
          source={source || { uri: imageUrl }}
          style={[styles.image, { borderRadius: size / 2 }]}
          defaultSource={require('../assets/default-avatar.png')}
        />
      ) : (
        <View
          style={[
            styles.initialsContainer,
            { backgroundColor, borderRadius: size / 2 },
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