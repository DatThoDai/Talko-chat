import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { colors, spacing, borderRadius } from '../styles';

const CustomAvatar = ({ 
  size = 40, 
  source, 
  imageUrl,
  name = '',
  color,
  avatarColor,
  online = false,
  style 
}) => {
  // Debug avatar info
  console.log(`CustomAvatar - name: ${name}, imageUrl type: ${typeof imageUrl}`);
  
  // Get initials from name (maximum 2 characters)
  const initials = name
    ?.split(' ')
    .map(word => word && word[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  // Determine the background color
  const backgroundColor = avatarColor || color || '#2196F3';

  // Create a safe image source
  let imageSource = null;
  
  // First check explicit source prop
  if (source) {
    imageSource = source;
  } 
  // Then check imageUrl string
  else if (typeof imageUrl === 'string' && imageUrl.trim() !== '') {
    imageSource = { uri: imageUrl };
    console.log('Using imageUrl as source:', imageUrl);
  }
  
  // Determine if we should show an image
  const hasImage = imageSource !== null;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {hasImage ? (
        <Image
          source={imageSource}
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

CustomAvatar.propTypes = {
  size: PropTypes.number,
  source: PropTypes.oneOfType([PropTypes.object, PropTypes.number]),
  imageUrl: PropTypes.string,
  name: PropTypes.string,
  color: PropTypes.string,
  avatarColor: PropTypes.string,
  online: PropTypes.bool,
  style: PropTypes.object,
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
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
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});

export default CustomAvatar;