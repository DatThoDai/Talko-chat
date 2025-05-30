import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Clipboard,
  ToastAndroid,
  Platform,
  Alert,
  Vibration,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { messageType, MESSAGE_RECALL_TEXT, MESSAGE_DELETE_TEXT } from '../../constants';
import MessageActions from './MessageActions';
import CustomAvatar from '../CustomAvatar';
import { downloadFile, openFile } from '../../utils/downloadUtils';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import MessageReactionModal from '../modal/MessageReactionModal';

function ReceiverMessage({
  message = {},
  isMessageRecalled = false,
  onPressEmoji = null,
  handleShowReactDetails = null,
  onReply = () => {},
  previewImage = null,
  onPressRecall = () => {},
  scrollToMessage = null,
  navigation,
  conversationId, // Tham số này đã tồn tại
}) {
  // Trích xuất trường dữ liệu từ message để tương thích với code cũ
  const content = message?.content || '';
  const time = message?.createdAt ? new Date(message.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
  const reactLength = message?.reactions?.length || 0;
  const reactVisibleInfo = reactLength > 0 ? `${reactLength}` : '';
  // Xóa hoặc đổi tên dòng này để tránh trùng lặp
  const msgConversationId = message?.conversationId; // Đổi tên từ conversationId thành msgConversationId
  const currentUserId = message?.sender?._id;
  const isLastMessage = false; // Giả định không phải tin nhắn cuối
  const onLastView = null;
  const handleViewImage = previewImage || (() => {});
  
  // Make sure we have message
  if (!message) {
    console.warn('ReceiverMessage received null message');
    return null;
  }
  
  // State cho modal
  const [reactionModalVisible, setReactionModalVisible] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [menuPosition, setMenuPosition] = useState(null);

  const { type, fileUrl, _id, sender = {} } = message;
  
  // Ensure we display a valid sender name
  const senderName = sender?.name || 
                     sender?.username ||
                     (sender?.email && sender.email.includes('@') 
                      ? sender.email.split('@')[0] 
                      : sender?._id || 'Người dùng'); // Sử dụng ID nếu không có tên hoặc email

  // Thêm hàm formatFileSize
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  // Thêm hàm này vào sau dòng 'const senderName = ...'
  const getFileIcon = (message) => {
    // Xác định icon dựa trên loại file và phần mở rộng
    const fileName = message.fileName || '';
    const fileType = message.fileType || '';
    const extension = fileName.split('.').pop().toLowerCase();
    
    // Kiểm tra các loại file phổ biến
    if (fileType === 'PDF' || extension === 'pdf') {
      return "document-text-outline";
    } else if (['DOC', 'DOCX'].includes(fileType) || ['doc', 'docx'].includes(extension)) {
      return "document-text-outline";
    } else if (['XLS', 'XLSX', 'EXCEL'].includes(fileType) || ['xls', 'xlsx'].includes(extension)) {
      return "document-outline";
    } else if (['PPT', 'PPTX'].includes(fileType) || ['ppt', 'pptx'].includes(extension)) {
      return "document-outline";
    } else if (['ZIP', 'RAR'].includes(fileType) || ['zip', 'rar'].includes(extension)) {
      return "archive-outline";
    } else if (['TXT'].includes(fileType) || ['txt'].includes(extension)) {
      return "document-text-outline";
    }
    
    // Mặc định
    return "document-outline";
  };

  // Cập nhật renderFile method trong ReceiverMessage.js
  const renderFile = () => {
    // Thêm console log để debug
    console.log('Rendering file with data:', {
      fileUrl: message.fileUrl || 'missing',
      fileName: message.fileName || 'unnamed',
      fileSize: message.fileSize
    });
    
    // Lấy fileUrl từ các thuộc tính có thể có
    const actualFileUrl = message.fileUrl || message.url || message.content;
    
    return (
      <TouchableOpacity 
        style={styles.fileContainer}
        onPress={() => {
          console.log('File clicked! URL:', actualFileUrl);
          
          if (actualFileUrl) {
            Alert.alert(
              'Tệp đính kèm',
              `Bạn muốn làm gì với file ${message.fileName || 'này'}?`,
              [
                { text: 'Hủy', style: 'cancel' },
                { 
                  text: 'Tải xuống', 
                  onPress: () => {
                    try {
                      console.log('Downloading file from:', actualFileUrl);
                      downloadFile(actualFileUrl, message.fileName, message.type);
                    } catch (error) {
                      console.error('Download error:', error);
                      Alert.alert('Lỗi', 'Không thể tải file. Chi tiết: ' + error.message);
                    }
                  }
                },
                { 
                  text: 'Mở', 
                  onPress: () => {
                    try {
                      console.log('Opening file from:', actualFileUrl);
                      openFile(actualFileUrl, message.fileName);
                    } catch (error) {
                      console.error('Open error:', error);
                      Alert.alert('Lỗi', 'Không thể mở file. Chi tiết: ' + error.message);
                    }
                  }
                },
                { 
                  text: 'Chia sẻ', 
                  onPress: async () => {
                    try {
                      const canShare = await Sharing.isAvailableAsync();
                      if (canShare) {
                        // Hiển thị thông báo đang tải về để chia sẻ
                        Alert.alert('Đang chuẩn bị chia sẻ...', 'Vui lòng đợi trong giây lát');
                        
                        // Tải file về bộ nhớ tạm trước khi chia sẻ
                        const fileUri = FileSystem.documentDirectory + (message.fileName || 'file');
                        
                        const downloadResumable = FileSystem.createDownloadResumable(
                          actualFileUrl,
                          fileUri
                        );
                        
                        const { uri } = await downloadResumable.downloadAsync();
                        await Sharing.shareAsync(uri);
                      } else {
                        Alert.alert('Lỗi', 'Thiết bị không hỗ trợ chia sẻ');
                      }
                    } catch (error) {
                      console.error('Share error:', error);
                      Alert.alert('Lỗi', 'Không thể chia sẻ file. Chi tiết: ' + error.message);
                    }
                  }
                }
              ]
            );
          } else {
            // Thông báo khi URL không có
            Alert.alert('Lỗi', 'Không thể truy cập file. URL không hợp lệ.');
          }
        }}
      >
        <View style={styles.fileIconContainer}>
          <Icon 
            name={getFileIcon(message)}
            size={24} 
            color="#2196F3" 
          />
        </View>
        <View style={styles.fileInfoContainer}>
          <Text style={styles.fileName} numberOfLines={1}>
            {message.fileName || 'Tệp đính kèm'}
          </Text>
          {message.fileSize && (
            <Text style={styles.fileSize}>
              {formatFileSize(message.fileSize)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Hiển thị tin nhắn hình ảnh
  const renderImage = () => {
    // Lấy URL hình ảnh từ message
    const imageUrl = message.fileUrl || message.content;
    
    if (!imageUrl) {
      return <Text style={styles.content}>Hình ảnh không khả dụng</Text>;
    }
    
    return (
      <TouchableOpacity 
        onPress={() => handleViewImage(imageUrl)}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  };

  // Hiển thị tin nhắn video
  const renderVideo = () => {
    const videoUrl = message.fileUrl || message.content;
    const thumbnailUrl = message.thumbnail || null;
    
    if (!videoUrl) {
      return <Text style={styles.content}>Video không khả dụng</Text>;
    }
    
    return (
      <TouchableOpacity 
        style={styles.videoContainer}
        onPress={() => {
          if (videoUrl) {
            Alert.alert(
              'Video đính kèm',
              `Bạn muốn làm gì với video này?`,
              [
                { text: 'Hủy', style: 'cancel' },
                { 
                  text: 'Xem', 
                  onPress: () => openFile(videoUrl, message.fileName || 'video.mp4') 
                },
                { 
                  text: 'Tải xuống', 
                  onPress: () => downloadFile(videoUrl, message.fileName || 'video.mp4', 'VIDEO')
                },
                { 
                  text: 'Chia sẻ', 
                  onPress: async () => {
                    const canShare = await Sharing.isAvailableAsync();
                    if (canShare) {
                      Alert.alert('Đang chuẩn bị chia sẻ...', 'Vui lòng đợi trong giây lát');
                      
                      const fileUri = FileSystem.documentDirectory + (message.fileName || 'video.mp4');
                      
                      const downloadResumable = FileSystem.createDownloadResumable(
                        videoUrl,
                        fileUri
                      );
                      
                      const { uri } = await downloadResumable.downloadAsync();
                      await Sharing.shareAsync(uri);
                    } else {
                      Alert.alert('Lỗi', 'Thiết bị không hỗ trợ chia sẻ');
                    }
                  }
                }
              ]
            );
          }
        }}
      >
        <Image 
          source={{ uri: thumbnailUrl || 'https://via.placeholder.com/200x150?text=Video' }} 
          style={styles.videoThumbnail}
        />
        <View style={styles.playButton}>
          <Icon name="play" size={30} color="#fff" />
        </View>
      </TouchableOpacity>
    );
  };

  // Thêm hàm renderSticker()
  const renderSticker = () => {
    const stickerUrl = message.stickerUrl || message.fileUrl || message.content;
    
    if (!stickerUrl) {
      return <Text style={styles.content}>Sticker không khả dụng</Text>;
    }
    
    return (
      <TouchableWithoutFeedback
        onPress={() => {
          // Có thể thêm xem sticker full size nếu cần
          console.log('Sticker pressed:', stickerUrl);
        }}
      >
        <Image
          source={{ uri: stickerUrl }}
          style={styles.stickerImage}
          resizeMode="contain"
          onError={(e) => console.log('Sticker load error:', e.nativeEvent.error)}
          onLoad={() => console.log('Sticker loaded successfully:', stickerUrl)}
        />
      </TouchableWithoutFeedback>
    );
  };

  // Render appropriate message content based on type
  const renderContent = () => {
    switch (type) {
      case messageType.IMAGE:
        return renderImage();
      
      case messageType.FILE:
        return renderFile();
      
      case messageType.VIDEO:
        return renderVideo();
      
      case 'STICKER':
        return renderSticker();
      
      default:
        return <Text style={styles.content}>{content}</Text>;
    }
  };

  // Close the message actions
  const handleCloseActions = () => {
    console.log('Closing only action modal');
    setShowActions(false);
    // Chú ý: KHÔNG thiết lập setMenuPosition(null) ở đây
    // vì ReactionModal có thể vẫn đang sử dụng menuPosition
  };

  // Handle text selection for copy
  const handleCopyText = (text) => {
    // Đảm bảo sao chép được nội dung tin nhắn dù nó ở đâu
    let textToCopy = text || '';
    
    // Thử lấy nội dung từ message nếu text không có giá trị
    if (!textToCopy && message) {
      textToCopy = message.content || message.text || '';
    }
    
    // Ghi log để debug
    console.log('[ReceiverMessage] Sao chép nội dung:', { 
      textParameter: text,
      messageContent: message?.content,
      finalTextToCopy: textToCopy
    });
    
    if (textToCopy) {
      // Sao chép vào clipboard
      Clipboard.setString(textToCopy);
      
      // Thông báo thành công dựa trên nền tảng
      if (Platform.OS === 'android') {
        ToastAndroid.show('Đã sao chép văn bản', ToastAndroid.SHORT);
      } else {
        Alert.alert('Thông báo', 'Đã sao chép văn bản');
      }
    } else {
      // Thông báo lỗi nếu không có nội dung để sao chép
      console.warn('[ReceiverMessage] Không có nội dung để sao chép');
      Alert.alert('Thông báo', 'Không có nội dung để sao chép');
    }
  };

  // Check if message is recalled or deleted
  const isRecalled = message.manipulatedUserIds?.includes(message.userId);
  const isDeleted = message.isDeleted;
  
  // Kiểm tra xem tin nhắn có phải là tin nhắn được chuyển tiếp hay không
  // Sử dụng nhiều cách khác nhau để xác định tin nhắn chuyển tiếp
  const isForwarded = 
    message.metadata?.isForwarded === true || 
    message.forwardedMessage === true ||
    message.content?.startsWith('📤 Tin nhắn được chuyển tiếp:') ||
    (typeof message.forwardedMessage === 'string' && message.forwardedMessage === 'true');
  
  // Log thông tin để debug
  console.log('[ReceiverMessage] Trạng thái chuyển tiếp:', {
    messageId: message._id,
    metadata_isForwarded: message.metadata?.isForwarded,
    forwardedMessage: message.forwardedMessage,
    content_start: message.content?.substring(0, 30),
    final_isForwarded: isForwarded
  });
  
  // Modified message style if recalled or deleted
  const messageStyle = isRecalled || isDeleted 
    ? {...styles.messageContent, backgroundColor: '#a0a0a0'} 
    : styles.messageContent;

  // Add new function to render reply preview
  const renderReplyPreview = () => {
    // Kiểm tra chặt chẽ hơn về dữ liệu tin nhắn trả lời
    // - replyToMessage phải tồn tại và có _id
    // - hoặc replyTo phải tồn tại và có _id
    // - hoặc replyMessage phải tồn tại và có _id
    
    const hasValidReplyToMessage = 
      message.replyToMessage && 
      message.replyToMessage._id && 
      typeof message.replyToMessage._id === 'string';
      
    const hasValidReplyTo = 
      message.replyTo && 
      message.replyTo._id && 
      typeof message.replyTo._id === 'string';
      
    const hasValidReplyMessage = 
      message.replyMessage && 
      message.replyMessage._id && 
      typeof message.replyMessage._id === 'string';
    
    // Nếu không có dữ liệu tin nhắn trả lời hợp lệ, không hiển thị gì cả
    if (!hasValidReplyToMessage && !hasValidReplyTo && !hasValidReplyMessage) {
      return null;
    }
    
    // Lấy dữ liệu tin nhắn trả lời từ nguồn hợp lệ đầu tiên
    const replyData = 
      (hasValidReplyToMessage ? message.replyToMessage : null) || 
      (hasValidReplyTo ? message.replyTo : null) || 
      (hasValidReplyMessage ? message.replyMessage : null);
    
    // Đảm bảo content và sender tồn tại
    if (!replyData || (!replyData.content && !replyData.type)) {
      return null;
    }
    
    // Format the sender name - support different formats (sender vs user)
    const replySenderName = 
      (replyData.sender?.name) || 
      (replyData.user?.name) || 
      'Người dùng';
    
    // Format the content based on message type
    let replyContent = replyData.content || '';
    if (replyData.type === 'IMAGE') {
      replyContent = '[Hình ảnh]';
    } else if (replyData.type === 'FILE') {
      replyContent = `[Tệp: ${replyData.fileName || 'Tệp đính kèm'}]`;
    } else if (replyData.type === 'VIDEO') {
      replyContent = '[Video]';
    }
    
    // Handle tap on reply preview to scroll to original message
    const handleReplyPreviewPress = () => {
      if (scrollToMessage && replyData._id) {
        scrollToMessage(replyData._id);
      }
    };
    
    return (
      <TouchableOpacity 
        style={styles.replyPreviewContainer}
        onPress={handleReplyPreviewPress}
        activeOpacity={0.7}
      >
        <View style={styles.replyPreviewBar} />
        <View style={styles.replyPreviewContent}>
          <Text style={styles.replyPreviewSender}>{replySenderName}</Text>
          <Text style={styles.replyPreviewText} numberOfLines={1}>{replyContent}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Hàm xử lý nhấn giữ để hiển thị modal
  const handleLongPress = (event) => {
    console.log('Long press detected on message:', message._id);
    
    if (Platform.OS === 'android') {
      Vibration.vibrate(50);
    }
    
    // Lấy tọa độ nhấn giữ
    const position = {
      x: event.nativeEvent.pageX,
      y: event.nativeEvent.pageY
    };
    
    console.log('Touch position:', position);
    
    // Chỉ hiển thị MessageActions trước, không hiển thị ReactionModal
    setMenuPosition(position);
    setShowActions(true);
    // Không mở ReactionModal ngay - setReactionModalVisible(false);
  };

  // Hàm đóng modal
  const handleCloseModals = () => {
    console.log('Closing all modals');
    setReactionModalVisible(false);
    setShowActions(false);
    setMenuPosition(null); // Chỉ reset position khi đóng cả hai modal
  };

  // Hàm hiển thị modal biểu cảm
  const handleShowReactions = () => {
    console.log('Show reactions button pressed');
    
    // Đóng MessageActions trước khi hiển thị ReactionModal
    setShowActions(false);
    
    // Đợi một chút để MessageActions biến mất, sau đó mới hiển thị ReactionModal
    setTimeout(() => {
      setReactionModalVisible(true);
    }, 150);
  };

  // Hàm xử lý khi chọn reaction
  const handleReactionSelected = (emoji) => {
    console.log('Reaction selected:', emoji, 'for message:', message._id);
    if (onPressEmoji) {
      onPressEmoji(message._id, emoji);
    }
    // Chỉ đóng reaction modal
    setReactionModalVisible(false);
    // Sau khi chọn reaction, nên đóng tất cả để UX tốt hơn
    setTimeout(() => setMenuPosition(null), 200);
  };

  // Thay thế hàm groupReactions hiện tại
  const groupReactions = () => {
    // Ưu tiên sử dụng reactions đã được chuẩn hóa, fallback về reacts
    const reactsArray = message.reactions || message.reacts || [];
    if (reactsArray.length === 0) return [];
    
    // ✅ BẢNG ÁNH XẠ từ số sang emoji - GIỐNG NHAU KHẮP NƠI
    const EMOJI_MAP = {
      1: '👍', // Like
      2: '❤️', // Love
      3: '😂', // Laugh
      4: '😮', // Wow
      5: '😢', // Sad
      6: '😡'  // Angry
    };
    
    console.log('🔍 ReceiverMessage - Processing reactions:', {
      messageId: message._id?.substring(0, 8),
      hasReactions: !!message.reactions,
      hasReacts: !!message.reacts,
      reactsLength: reactsArray.length,
      firstReactType: reactsArray[0]?.type,
      firstReactTypeOf: typeof reactsArray[0]?.type
    });
    
    const grouped = {};
    reactsArray.forEach((reaction, index) => {
      let emojiType;
      
      // ✅ CHUYỂN ĐỔI từ type số sang emoji
      if (reaction.type !== undefined && typeof reaction.type === 'number') {
        emojiType = EMOJI_MAP[reaction.type] || '👍';
        console.log(`🔄 ReceiverMessage - Converting reaction ${index}: number ${reaction.type} → emoji ${emojiType}`);
      } else if (reaction.type && typeof reaction.type === 'string') {
        // ✅ KIỂM TRA nếu type là số dưới dạng string
        const numericType = parseInt(reaction.type);
        if (!isNaN(numericType) && EMOJI_MAP[numericType]) {
          emojiType = EMOJI_MAP[numericType];
          console.log(`🔄 ReceiverMessage - Converting reaction ${index}: string number "${reaction.type}" → emoji ${emojiType}`);
        } else {
          // Nếu đã là emoji string
          emojiType = reaction.type;
          console.log(`✅ ReceiverMessage - Using existing emoji ${index}: ${emojiType}`);
        }
      } else {
        // Fallback
        emojiType = '👍';
        console.log(`⚠️ ReceiverMessage - Fallback emoji for reaction ${index}: ${emojiType}`);
      }
      
      if (!grouped[emojiType]) {
        grouped[emojiType] = {
          type: emojiType,
          count: 0,
          users: []
        };
      }
      
      grouped[emojiType].count++;
      
      // Thêm thông tin user
      const user = reaction.user || {};
      grouped[emojiType].users.push({
        id: user._id || reaction.userId,
        name: user.name || reaction.userName || 'Người dùng',
        avatar: user.avatar || reaction.userAvatar
      });
    });
    
    console.log('✅ ReceiverMessage - Final grouped reactions:', Object.keys(grouped));
    return Object.values(grouped);
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <CustomAvatar
          size={36}
          name={senderName}
          avatar={sender?.avatar}
          imageUrl={sender?.avatar}
          color={sender?.avatarColor}
        />
      </View>

      <View style={styles.messageContainer}>
        <Text style={styles.senderName}>{senderName}</Text>
        
        <TouchableWithoutFeedback onLongPress={handleLongPress} delayLongPress={500}>
          <View style={messageStyle}>
            {isRecalled ? (
              <Text style={styles.recalledText}>{MESSAGE_RECALL_TEXT}</Text>
            ) : isDeleted ? (
              <Text style={styles.recalledText}>{MESSAGE_DELETE_TEXT}</Text>
            ) : (
              <>
                {isForwarded && (
                  <Text style={styles.forwardedLabel}>Đã chuyển tiếp tin nhắn</Text>
                )}
                {renderReplyPreview()}
                {renderContent()}
              </>
            )}
            <View style={styles.timeContainer}>
              <Text style={styles.time}>{time}</Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
        
        {reactLength > 0 && !isDeleted && !isRecalled && (
          <TouchableOpacity
            style={styles.reactContainer}
            onPress={handleShowReactDetails}>
            <View style={styles.reactionsRow}>
              {groupReactions().map((reaction, index) => (
                <View key={`reaction-${index}`} style={styles.reactionItem}>
                  <Text style={styles.reactionEmoji}>{reaction.type}</Text>
                  {reaction.count > 1 && (
                    <Text style={styles.reactionCount}>{reaction.count}</Text>
                  )}
                </View>
              ))}
            </View>
          </TouchableOpacity>
        )}
      </View>
      
      {/* MessageActions */}
      <MessageActions
        visible={showActions}
        onClose={handleCloseActions}
        message={message}
        currentUserId={currentUserId}
        onReply={(msg) => {
          if (typeof onReply === 'function') {
            // Thực hiện hành động trước
            onReply(msg);
            // Trì hoãn đóng modal để hành động hoàn thành
            setTimeout(() => handleCloseActions(), 300);
          }
        }}
        onSelect={(text) => {
          handleCopyText(text);
          // Trì hoãn đóng modal
          setTimeout(() => handleCloseActions(), 300);
        }}
        navigation={navigation}
        conversationId={conversationId}
        position={menuPosition}
        showCopyOption={true}
        showRecallOption={false}
        onShowReactions={handleShowReactions} // Thêm prop này để xử lý nút thêm biểu cảm
      />
      
      {/* MessageReactionModal */}
      <MessageReactionModal
        visible={reactionModalVisible}
        position={{
          x: menuPosition?.x || 0,
          y: (menuPosition?.y || 0) + 90 // Hiển thị bên dưới menu actions
        }}
        onClose={() => setReactionModalVisible(false)} // Chỉ đóng reaction modal
        onReactionSelected={handleReactionSelected}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: 10,
    marginBottom: 15,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    width: '100%',
  },
  avatarContainer: {
    marginRight: 8,
  },
  messageContainer: {
    maxWidth: '75%',
    alignItems: 'flex-start',
  },
  messageContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
    alignSelf: 'flex-start',
  },
  senderName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 4,
  },
  content: {
    fontSize: 15,
    color: '#333',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 5,
  },
  time: {
    fontSize: 11,
    color: '#888',
  },
  seenButton: {
    marginLeft: 5,
  },
  seenText: {
    fontSize: 11,
    color: '#888',
  },
  reactContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
    marginLeft: 8,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  reactionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
  },
  image: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginVertical: 4,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF4FB', // Thay đổi backgroundColor để giống với SenderMessage
    padding: 10,
    borderRadius: 8,
    marginVertical: 4,
    width: 200, // Thêm chiều rộng cố định như SenderMessage
  },
  fileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfoContainer: {
    flex: 1,
    marginLeft: 8,
  },
  fileName: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  fileSize: {
    color: '#78909c',
    fontSize: 12,
    marginTop: 2,
  },
  videoContainer: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginVertical: 4,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  playButton: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recalledText: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
  forwardedLabel: {
    fontSize: 12,
    color: '#2196F3',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  replyPreviewContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    marginBottom: 6,
    padding: 8,
    paddingLeft: 6,
    minWidth: '90%',
    maxWidth: '95%',
  },
  replyPreviewBar: {
    width: 3,
    backgroundColor: '#2196F3',
    borderRadius: 3,
    marginRight: 6,
    flexShrink: 0,
  },
  replyPreviewContent: {
    flex: 1,
    marginRight: 4,
  },
  replyPreviewSender: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 2,
  },
  replyPreviewText: {
    fontSize: 12,
    color: '#666',
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  stickerImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginVertical: 4,
  },
});

// Keep PropTypes for documentation purposes, but actual default values
// are now defined in the function parameters above
ReceiverMessage.propTypes = {
  message: PropTypes.object,
  handleShowReactDetails: PropTypes.func,
  content: PropTypes.string,
  time: PropTypes.string,
  reactVisibleInfo: PropTypes.string,
  reactLength: PropTypes.number,
  handleViewImage: PropTypes.func,
  isLastMessage: PropTypes.bool,
  onLastView: PropTypes.func,
  navigation: PropTypes.object,
  conversationId: PropTypes.string,
  currentUserId: PropTypes.string,
  onReply: PropTypes.func,
  onPressRecall: PropTypes.func,
  scrollToMessage: PropTypes.func,
};

export default ReceiverMessage;