import { REACTION_TYPES } from '../styles';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Alert } from 'react-native';

/**
 * Get color for a user's avatar based on their name or ID
 * @param {string} identifier - User's name or ID
 * @returns {string} Hex color code
 */
export const generateAvatarColor = (identifier) => {
  if (!identifier) return '#6E6E6E';
  
  // Generate a hash from the identifier
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convert hash to a color
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFBE0B',
    '#FB5607', '#8338EC', '#3A86FF', '#06D6A0',
    '#EF476F', '#118AB2', '#073B4C', '#A5BE00',
    '#F15BB5', '#9B5DE5', '#00BBF9', '#00F5D4'
  ];
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

/**
 * Format file size in a human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get file extension from a file name or URL
 * @param {string} fileName - File name or URL
 * @returns {string} File extension (without dot)
 */
export const getFileExtension = (fileName) => {
  if (!fileName) return '';
  
  return fileName.split('.').pop().toLowerCase();
};

/**
 * Check if file is an image based on extension
 * @param {string} fileName - File name or URL
 * @returns {boolean} True if file is an image
 */
export const isImageFile = (fileName) => {
  const ext = getFileExtension(fileName);
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext);
};

/**
 * Check if file is a video based on extension
 * @param {string} fileName - File name or URL
 * @returns {boolean} True if file is a video
 */
export const isVideoFile = (fileName) => {
  const ext = getFileExtension(fileName);
  return ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext);
};

/**
 * Check if file is an audio based on extension
 * @param {string} fileName - File name or URL
 * @returns {boolean} True if file is an audio
 */
export const isAudioFile = (fileName) => {
  const ext = getFileExtension(fileName);
  return ['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(ext);
};

/**
 * Format reaction counts for display
 * @param {Array} reactions - Array of reactions
 * @returns {Object} Object with counts by reaction type
 */
export const formatReactionCounts = (reactions) => {
  if (!reactions || reactions.length === 0) {
    return {};
  }
  
  // Count reactions by type
  const counts = {};
  
  reactions.forEach(reaction => {
    if (counts[reaction.type]) {
      counts[reaction.type]++;
    } else {
      counts[reaction.type] = 1;
    }
  });
  
  return counts;
};

/**
 * Get reaction emoji by type
 * @param {string} type - Reaction type
 * @returns {string} Emoji for the reaction type
 */
export const getReactionEmoji = (type) => {
  const reactionMap = {
    [REACTION_TYPES.LIKE]: '👍',
    [REACTION_TYPES.LOVE]: '❤️',
    [REACTION_TYPES.HAHA]: '😂',
    [REACTION_TYPES.WOW]: '😮',
    [REACTION_TYPES.SAD]: '😢',
    [REACTION_TYPES.ANGRY]: '😡',
  };
  
  return reactionMap[type] || '👍';
};

/**
 * Check if the user has already reacted with a specific type
 * @param {Array} reactions - Array of reactions
 * @param {string} userId - User ID
 * @param {string} type - Reaction type
 * @returns {boolean} True if user has reacted with the specified type
 */
export const hasUserReacted = (reactions, userId, type = null) => {
  if (!reactions || reactions.length === 0 || !userId) {
    return false;
  }
  
  // If type is specified, check if user has reacted with that type
  if (type) {
    return reactions.some(reaction => 
      reaction.user === userId && reaction.type === type
    );
  }
  
  // Otherwise, check if user has reacted at all
  return reactions.some(reaction => reaction.user === userId);
};

/**
 * Get the user's reaction type for a message
 * @param {Array} reactions - Array of reactions
 * @param {string} userId - User ID
 * @returns {string|null} Reaction type or null if not found
 */
export const getUserReactionType = (reactions, userId) => {
  if (!reactions || reactions.length === 0 || !userId) {
    return null;
  }
  
  const userReaction = reactions.find(reaction => reaction.user === userId);
  return userReaction ? userReaction.type : null;
};

/**
 * Truncate a string to a specific length
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
export const truncateString = (str, maxLength = 50) => {
  if (!str || str.length <= maxLength) {
    return str;
  }
  
  return str.substring(0, maxLength) + '...';
};

/**
 * Save a file to device (for downloading images, videos, or files)
 * @param {string} fileUri - File URI
 * @param {string} fileName - File name
 * @returns {Promise<Object>} Result of save operation
 */
export const saveFileToDevice = async (fileUri, fileName = 'download') => {
  try {
    // Request permissions
    const { status } = await MediaLibrary.requestPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'You need to grant permission to save files');
      return { success: false, error: 'Permission denied' };
    }
    
    // Create a local file URI if it's a remote URL
    if (fileUri.startsWith('http')) {
      const downloadResumable = FileSystem.createDownloadResumable(
        fileUri,
        FileSystem.documentDirectory + fileName,
        {}
      );
      
      const { uri } = await downloadResumable.downloadAsync();
      fileUri = uri;
    }
    
    // Save the file to media library
    if (isImageFile(fileName) || isVideoFile(fileName)) {
      const asset = await MediaLibrary.createAssetAsync(fileUri);
      await MediaLibrary.createAlbumAsync('Talko', asset, false);
      return { success: true, assetId: asset.id };
    } else {
      // For other file types, just save them to documents directory
      // This is platform-specific and may require additional handling
      return { success: true, uri: fileUri };
    }
  } catch (error) {
    console.error('Error saving file:', error);
    Alert.alert('Error', 'Failed to save file: ' + error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Get file info from a local URI
 * @param {string} uri - File URI
 * @returns {Promise<Object>} File info
 */
export const getFileInfo = async (uri) => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    
    return {
      uri,
      name: uri.split('/').pop(),
      size: fileInfo.size,
      type: getFileExtension(uri),
      isImage: isImageFile(uri),
      isVideo: isVideoFile(uri),
      isAudio: isAudioFile(uri)
    };
  } catch (error) {
    console.error('Error getting file info:', error);
    return null;
  }
};

/**
 * Format a username for display
 * @param {string} username - User's username (often an email)
 * @returns {string} Formatted username
 */
export const formatUsername = (username) => {
  if (!username) return '';
  
  // If it's an email, return only the part before @
  if (username.includes('@')) {
    return username.split('@')[0];
  }
  
  return username;
};

/**
 * Get initials from a name
 * @param {string} name - Full name
 * @returns {string} Initials (max 2 characters)
 */
export const getInitials = (name) => {
  if (!name) return '';
  
  const parts = name.split(' ').filter(part => part.length > 0);
  
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Format timestamp for seen status
 * @param {Date|string} timestamp - Timestamp to format
 * @returns {string} Formatted timestamp
 */
export const formatLastSeen = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMinutes = Math.floor((now - date) / (1000 * 60));
  
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return `${Math.floor(diffDays / 7)}w ago`;
};

/**
 * Create a FormData object from a file object for uploads
 * @param {Object} file - File object
 * @param {string} fieldName - Form field name
 * @returns {FormData} FormData object
 */
export const createFormData = (file, fieldName = 'file') => {
  const formData = new FormData();
  
  const fileType = Platform.OS === 'android' ? file.type : 'image/jpeg';
  const fileName = file.uri.split('/').pop();
  
  formData.append(fieldName, {
    uri: file.uri,
    name: fileName,
    type: fileType,
  });
  
  return formData;
};

export default {
  generateAvatarColor,
  formatFileSize,
  getFileExtension,
  isImageFile,
  isVideoFile,
  isAudioFile,
  formatReactionCounts,
  getReactionEmoji,
  hasUserReacted,
  getUserReactionType,
  truncateString,
  saveFileToDevice,
  getFileInfo,
  formatUsername,
  getInitials,
  formatLastSeen,
  createFormData,
};
