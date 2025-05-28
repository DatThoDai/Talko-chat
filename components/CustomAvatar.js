import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { colors, spacing, borderRadius } from '../styles';

// Global avatar cache
const avatarCache = {};

const CustomAvatar = ({ 
  size = 40, 
  source, 
  imageUrl,
  avatar, // Avatar prop for compatibility
  name = '',
  color,
  avatarColor,
  online = false,
  style 
}) => {
  const [imageError, setImageError] = useState(false);
  
  // Use avatar if imageUrl doesn't exist
  const actualImageUrl = imageUrl || avatar;
  
  // Log info for debugging
  console.log(`CustomAvatar - name: ${name}, imageUrl: ${actualImageUrl}`);
  
  // Get initials from name (maximum 2 characters)
  const initials = name
    ?.split(' ')
    .map(word => word && word[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  // Determine background color
  const backgroundColor = avatarColor || color || '#2196F3';

  // Create a safe image source
  let imageSource = null;
  
  // First check explicit source prop
  if (source) {
    imageSource = source;
  } 
  // Then check actual image URL
  else if (typeof actualImageUrl === 'string' && actualImageUrl && !imageError) {
    try {
      // Clean up the URL
      let cleanUrl = actualImageUrl;
      
      // Remove any double extensions
      cleanUrl = cleanUrl.replace(/\.jpg\.jpg$/, '.jpg');
      cleanUrl = cleanUrl.replace(/\.jpeg\.jpeg$/, '.jpeg');
      cleanUrl = cleanUrl.replace(/\.png\.png$/, '.png');
      
      // Fix S3 URL if needed
      if (cleanUrl.includes('nodejs-s3-nvdat.s3.amazonaws.com')) {
        // Keep the original S3 URL format
        cleanUrl = cleanUrl.replace(/\.jpg\.jpg$/, '.jpg')
                          .replace(/\.jpeg\.jpeg$/, '.jpeg')
                          .replace(/\.png\.png$/, '.png');
      }
      
      // Validate URL format
      if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
        // Add timestamp to URL to prevent caching
        const timestamp = new Date().getTime();
        const separator = cleanUrl.includes('?') ? '&' : '?';
        cleanUrl = `${cleanUrl}${separator}t=${timestamp}`;
        
        imageSource = { 
          uri: cleanUrl,
          // Add cache control headers
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          // Force cache reload
          cache: 'reload'
        };
      }
    } catch (error) {
      console.error('Error processing image URL:', error);
      setImageError(true);
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
          // Add default fallback
          defaultSource={require('../assets/default-avatar.png')}
          // Force image reload
          key={actualImageUrl}
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
  avatar: PropTypes.string,
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