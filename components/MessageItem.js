import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Modal
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Video } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import CustomAvatar from './CustomAvatar';
import { colors, spacing, borderRadius, MESSAGE_TYPES } from '../styles';
import { formatMessageDate } from '../utils/dateUtils';

const MessageItem = ({ 
  message, 
  onLongPress, 
  onReaction,
  isOwnMessage 
}) => {
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [showReactionMenu, setShowReactionMenu] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  
  if (!message) return null;
  
  const { 
    content, 
    type, 
    sender, 
    fileUrl, 
    fileName,
    thumbnail,
    reactions = [], 
    createdAt 
  } = message;
  
  // Get formatted date
  const formattedDate = formatMessageDate(createdAt);
  
  // Check if message is pinned
  const isPinned = message.isPinned || false;
  
  // Custom styling based on message owner
  const containerStyle = isOwnMessage 
    ? styles.ownMessageContainer 
    : styles.otherMessageContainer;
  
  const bubbleStyle = isOwnMessage 
    ? [styles.ownMessageBubble, message.isPinned && styles.pinnedMessageBubble]
    : [styles.otherMessageBubble, message.isPinned && styles.pinnedMessageBubble];
  
  const textStyle = isOwnMessage 
    ? styles.ownMessageText 
    : styles.otherMessageText;
  
  // Handle image load error
  const handleImageError = () => {
    console.error('Error loading image:', fileUrl);
    setImageError(true);
  };
  
  // Handle video load error
  const handleVideoError = (error) => {
    console.error('Error loading video:', error);
    setVideoError(true);
  };
  
  // Handle downloading file
  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);
      
      // Request permissions for saving to media library
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Cần quyền truy cập bộ nhớ để tải tệp');
        setIsDownloading(false);
        return;
      }
      
      // Generate a safe filename
      const timestamp = new Date().getTime();
      const fileExt = fileName ? fileName.split('.').pop() : 'file';
      const safeFileName = `${fileName || `talko_file_${timestamp}`}`;
      
      // Set up download with progress tracking
      const downloadResumable = FileSystem.createDownloadResumable(
        fileUrl,
        FileSystem.documentDirectory + safeFileName,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          setDownloadProgress(Math.floor(progress * 100));
        }
      );
      
      const { uri } = await downloadResumable.downloadAsync();
      
      // Save different file types to appropriate places
      if (type === MESSAGE_TYPES.IMAGE) {
        await MediaLibrary.saveToLibraryAsync(uri);
        alert('Đã lưu vào thư viện ảnh');
      } else if (type === MESSAGE_TYPES.VIDEO) {
        await MediaLibrary.saveToLibraryAsync(uri);
        alert('Đã lưu vào thư viện video');
      } else {
        // Share other file types
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri);
        } else {
          alert(`Đã tải file thành công: ${uri}`);
        }
      }
      
      setIsDownloading(false);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Không thể tải tệp. Vui lòng thử lại sau.');
      setIsDownloading(false);
    }
  };
  
  // Toggle reactions menu
  const toggleReactionMenu = () => {
    setShowReactionMenu(!showReactionMenu);
  };
  
  // Send a reaction
  const sendReaction = (reaction) => {
    onReaction && onReaction(reaction);
    setShowReactionMenu(false);
  };
  
  // Render reactions display
  const renderReactions = () => {
    if (!reactions || reactions.length === 0) return null;
    
    // Count reactions by type
    const reactionCounts = reactions.reduce((counts, reaction) => {
      const type = reaction.type || reaction;
      counts[type] = (counts[type] || 0) + 1;
      return counts;
    }, {});
    
    return (
      <View style={styles.reactionsContainer}>
        {Object.entries(reactionCounts).map(([type, count]) => (
          <View key={type} style={styles.reactionBadge}>
            <Text style={styles.reactionEmoji}>{getReactionEmoji(type)}</Text>
            {count > 1 && <Text style={styles.reactionCount}>{count}</Text>}
          </View>
        ))}
      </View>
    );
  };
  
  // Get emoji for reaction type
  const getReactionEmoji = (type) => {
    const emojiMap = {
      like: '👍',
      love: '❤️',
      laugh: '😂',
      wow: '😮',
      sad: '😢',
      angry: '😡'
    };
    return emojiMap[type] || '👍';
  };
  
  // Render different components based on message type
  const renderMessageContent = () => {
    switch (type) {
      case MESSAGE_TYPES.TEXT:
        return (
          <View style={[bubbleStyle]}>
            <Text style={textStyle}>{content}</Text>
          </View>
        );
        
      case MESSAGE_TYPES.IMAGE:
        return (
          <Pressable onPress={() => setShowImage(true)}>
            <View style={[bubbleStyle, styles.mediaBubble]}>
              {imageError ? (
                <View style={styles.errorContainer}>
                  <Icon name="broken-image" size={24} color={colors.error} />
                  <Text style={styles.errorText}>Không thể tải ảnh</Text>
                </View>
              ) : (
                <Image
                  source={{ uri: fileUrl }}
                  style={styles.imageContent}
                  resizeMode="cover"
                  onError={handleImageError}
                />
              )}
              
              <TouchableOpacity 
                style={styles.downloadButton} 
                onPress={handleDownload}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <View style={styles.downloadProgressContainer}>
                    <Text style={styles.downloadProgressText}>{downloadProgress}%</Text>
                  </View>
                ) : (
                  <Icon name="file-download" size={20} color={colors.white} />
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        );
        
      case MESSAGE_TYPES.VIDEO:
        return (
          <View style={[bubbleStyle, styles.mediaBubble]}>
            {videoError ? (
              <View style={styles.errorContainer}>
                <Icon name="videocam-off" size={24} color={colors.error} />
                <Text style={styles.errorText}>Không thể tải video</Text>
              </View>
            ) : (
              <View style={styles.videoContainer}>
                {videoLoading && (
                  <ActivityIndicator 
                    size="large" 
                    color={colors.primary} 
                    style={styles.videoLoader} 
                  />
                )}
                {thumbnail ? (
                  <Image
                    source={{ uri: thumbnail }}
                    style={styles.videoThumbnail}
                    resizeMode="cover"
                  />
                ) : (
                  <Video
                    source={{ uri: fileUrl }}
                    style={styles.videoContent}
                    useNativeControls
                    resizeMode="contain"
                    onLoadStart={() => setVideoLoading(true)}
                    onLoad={() => setVideoLoading(false)}
                    onError={handleVideoError}
                  />
                )}
                
                <TouchableOpacity 
                  style={styles.playButton}
                  onPress={() => {
                    // Navigate to full-screen video player
                    // This would be implemented based on your navigation structure
                  }}
                >
                  <Icon name="play-arrow" size={40} color={colors.white} />
                </TouchableOpacity>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.downloadButton} 
              onPress={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <View style={styles.downloadProgressContainer}>
                  <Text style={styles.downloadProgressText}>{downloadProgress}%</Text>
                </View>
              ) : (
                <Icon name="file-download" size={20} color={colors.white} />
              )}
            </TouchableOpacity>
          </View>
        );
        
      case MESSAGE_TYPES.FILE:
        return (
          <View style={[bubbleStyle, styles.fileBubble]}>
            <View style={styles.fileContent}>
              <Icon name="insert-drive-file" size={24} color={colors.primary} />
              <Text style={styles.fileName} numberOfLines={1}>
                {fileName || 'Tệp tin'}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.fileDownloadButton} 
              onPress={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <View style={styles.fileDownloadProgress}>
                  <Text style={styles.fileDownloadText}>{downloadProgress}%</Text>
                </View>
              ) : (
                <Text style={styles.fileDownloadText}>Tải xuống</Text>
              )}
            </TouchableOpacity>
          </View>
        );
        
      default:
        return (
          <View style={[bubbleStyle]}>
            <Text style={textStyle}>{content || 'Tin nhắn không hỗ trợ'}</Text>
          </View>
        );
    }
  };
  
  return (
    <View style={[styles.container, containerStyle]}>
      {/* Sender's avatar for messages from others */}
      {!isOwnMessage && (
        <CustomAvatar
          size={32}
          name={sender?.name}
          avatar={sender?.avatar}
          color={sender?.avatarColor}
        />
      )}
      
      <View style={styles.messageWrapper}>
        {/* Sender's name for messages from others */}
        {!isOwnMessage && (
          <Text style={styles.senderName}>{sender?.name}</Text>
        )}
        
        {/* Message content with long press handler */}
        <Pressable
          onLongPress={() => onLongPress && onLongPress(message)}
          onPress={toggleReactionMenu}
          delayLongPress={500}
        >
          <View>
            {renderMessageContent()}
            
            {/* Timestamp */}
            <Text style={[
              styles.timestamp, 
              isOwnMessage ? styles.ownTimestamp : styles.otherTimestamp
            ]}>
              {formattedDate}
            </Text>
            
            {/* Reactions */}
            {renderReactions()}
          </View>
        </Pressable>
      </View>
      
      {/* Reaction menu */}
      {showReactionMenu && (
        <View style={[
          styles.reactionMenu,
          isOwnMessage ? styles.reactionMenuRight : styles.reactionMenuLeft
        ]}>
          <TouchableOpacity 
            style={styles.reactionButton}
            onPress={() => sendReaction('like')}
          >
            <Text style={styles.reactionEmoji}>👍</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.reactionButton}
            onPress={() => sendReaction('love')}
          >
            <Text style={styles.reactionEmoji}>❤️</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.reactionButton}
            onPress={() => sendReaction('laugh')}
          >
            <Text style={styles.reactionEmoji}>😂</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.reactionButton}
            onPress={() => sendReaction('wow')}
          >
            <Text style={styles.reactionEmoji}>😮</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.reactionButton}
            onPress={() => sendReaction('sad')}
          >
            <Text style={styles.reactionEmoji}>😢</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Full-screen image modal */}
      <Modal
        visible={showImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImage(false)}
      >
        <View style={styles.fullScreenImageContainer}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setShowImage(false)}
          >
            <Icon name="close" size={24} color={colors.white} />
          </TouchableOpacity>
          
          <Image
            source={{ uri: fileUrl }}
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
          
          <TouchableOpacity 
            style={styles.fullScreenDownloadButton}
            onPress={handleDownload}
          >
            <Icon name="file-download" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 8,
    maxWidth: '100%',
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
    marginLeft: 50,
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
    marginRight: 50,
  },
  messageWrapper: {
    maxWidth: '85%',
    marginHorizontal: 8,
  },
  senderName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.darkGray,
    marginBottom: 2,
  },
  ownMessageBubble: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    borderBottomRightRadius: 0,
    padding: spacing.md,
  },
  otherMessageBubble: {
    backgroundColor: colors.light,
    borderRadius: borderRadius.lg,
    borderBottomLeftRadius: 0,
    padding: spacing.md,
  },
  ownMessageText: {
    color: colors.white,
    fontSize: 16,
  },
  otherMessageText: {
    color: colors.dark,
    fontSize: 16,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
  },
  ownTimestamp: {
    color: colors.lightGray,
    alignSelf: 'flex-end',
  },
  otherTimestamp: {
    color: colors.gray,
    alignSelf: 'flex-start',
  },
  mediaBubble: {
    padding: 0,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  imageContent: {
    width: 200,
    height: 200,
    borderRadius: borderRadius.lg,
  },
  videoContainer: {
    width: 200,
    height: 200,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.dark,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  videoContent: {
    width: '100%',
    height: '100%',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoLoader: {
    position: 'absolute',
    zIndex: 1,
  },
  playButton: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 30,
    padding: 5,
  },
  fileBubble: {
    flexDirection: 'column',
    width: 200,
  },
  fileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  fileName: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: isOwnMessage ? colors.white : colors.dark,
  },
  fileDownloadButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: borderRadius.sm,
    padding: 6,
    alignItems: 'center',
    marginTop: 4,
  },
  fileDownloadText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: isOwnMessage ? colors.white : colors.primary,
  },
  fileDownloadProgress: {
    flex: 1,
    alignItems: 'center',
  },
  pinnedMessageBubble: {
    borderWidth: 1,
    borderColor: '#9C27B0',
    borderStyle: 'solid',
  },
  pinIndicator: {
    position: 'absolute',
    top: -10,
    right: 10,
    backgroundColor: '#9C27B0',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  errorContainer: {
    width: 200,
    height: 150,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
  },
  errorText: {
    color: colors.error,
    marginTop: 8,
    textAlign: 'center',
  },
  downloadButton: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadProgressContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadProgressText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 10,
    marginLeft: 2,
    color: colors.dark,
  },
  reactionMenu: {
    position: 'absolute',
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    top: -40,
  },
  reactionMenuLeft: {
    left: 40,
  },
  reactionMenuRight: {
    right: 10,
  },
  reactionButton: {
    marginHorizontal: 4,
    padding: 4,
  },
  fullScreenImageContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
    zIndex: 10,
  },
  fullScreenDownloadButton: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 10,
  },
});

export default MessageItem;
