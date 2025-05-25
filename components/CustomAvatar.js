import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { colors, spacing, borderRadius } from '../styles';

// Thêm cache toàn cục cho avatar URLs
const avatarCache = {};

const CustomAvatar = ({ 
  size = 40, 
  source, 
  imageUrl,
  avatar, // Thêm prop avatar để tương thích với nhiều component
  name = '',
  color,
  avatarColor,
  online = false,
  style 
}) => {
  const [imageError, setImageError] = useState(false);
  
  // Sử dụng avatar nếu imageUrl không tồn tại
  const actualImageUrl = imageUrl || avatar;
  
  // Log thông tin cho debugging
  console.log(`CustomAvatar - name: ${name}, imageUrl: ${ actualImageUrl}`);
  
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
  // Then check actual image URL
  else if (typeof actualImageUrl === 'string' && actualImageUrl && !imageError) {
    // Validate URL format
    if (actualImageUrl.startsWith('http://') || actualImageUrl.startsWith('https://')) {
      imageSource = { uri: actualImageUrl };
      
      // Cache valid URLs 
      if (!avatarCache[actualImageUrl]) {
        avatarCache[actualImageUrl] = true;
      }
    } else {
      // Thêm base URL nếu là URL tương đối
      const fullUrl = actualImageUrl.startsWith('/') 
        ? `https://talko.s3.ap-southeast-1.amazonaws.com${actualImageUrl}`
        : actualImageUrl;
        
      imageSource = { uri: fullUrl };
      
      // Cache full URL
      if (!avatarCache[fullUrl]) {
        avatarCache[fullUrl] = true;
      }
    }
  }
  
  // Determine if we should show an image
  const hasImage = imageSource !== null;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {hasImage ? (
        <Image
          source={imageSource}
          style={[styles.image, { borderRadius: size / 2 }]}
          onError={(e) => {
            console.log('Avatar image error:', e.nativeEvent);
            setImageError(true); // Switch to initials on error
          }}
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
  avatar: PropTypes.string, // Thêm prop avatar vào propTypes
  name: PropTypes.string,
  color: PropTypes.string,
  avatarColor: PropTypes.string,
  online: PropTypes.bool,
  style: PropTypes.object,
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  initialsContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: colors.primary,
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
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: colors.white,
  },
});

export default CustomAvatar;