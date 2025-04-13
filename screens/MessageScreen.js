import React, {useEffect, useRef, useState} from 'react';
import {
  BackHandler,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TouchableWithoutFeedback,
  StyleSheet,
  Text,
  View,
  Alert,
} from 'react-native';
import {useSelector} from 'react-redux';
import AnimatedEllipsis from '../components/AnimatedEllipsis';
import ChatMessage from '../components/message/ChatMessage';
import MessageBottomBar from '../components/message/MessageBottomBar';
import MessageHeaderLeft from '../components/message/MessageHeaderLeft';
import PinnedMessage from '../components/message/PinnedMessage';
import MessageDivider from '../components/message/MessageDivider';
import {colors, spacing} from '../styles';
import {
  initiateSocket,
  joinConversation,
  emitTyping,
  disconnectSocket,
} from '../utils/socketService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useDispatch} from 'react-redux';
import {addNewMessage, updateMessage} from '../redux/chatSlice';
import { conversationService } from '../api';

// Constants for default values - matching zelo_mobile implementation
const DEFAULT_MESSAGE_MODAL_VISIBLE = {
  isVisible: false,
  isRecall: false,
  isMyMessage: false,
  messageId: '',
  messageContent: '',
  type: '',
};

const DEFAULT_REACTION_MODAL_VISIBLE = {
  isVisible: false,
  messageId: '',
  reactions: [],
};

const DEFAULT_MESSAGE_DETAIL_MODAL = {
  isVisible: false,
  message: null,
};

const DEFAULT_IMAGE_MODAL = {
  isVisible: false,
  imageUrl: '',
  imageUrls: [],
};

const DEFAULT_REPLY_MESSAGE = {
  isReply: false,
  message: null,
};

const DEFAULT_PAGE = 0;
const DEFAULT_PAGE_SIZE = 30;

const MessageScreen = ({navigation, route}) => {
  // Props and Redux state
  const {conversationId, conversationName, participants, avatar, avatarColor, isGroupChat} = route.params || {};
  const {user} = useSelector((state) => state.auth);
  const {keyboardHeight} = useSelector((state) => state.global || {keyboardHeight: 0});

  // State variables
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [modalVisible, setModalVisible] = useState(DEFAULT_MESSAGE_MODAL_VISIBLE);
  const [reactProps, setReactProps] = useState(DEFAULT_REACTION_MODAL_VISIBLE);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [stickyBoardVisible, setStickyBoardVisible] = useState(false);
  const [imageProps, setImageProps] = useState(DEFAULT_IMAGE_MODAL);
  const [messageDetailProps, setMessageDetailProps] = useState(DEFAULT_MESSAGE_DETAIL_MODAL);
  const [replyMessage, setReplyMessage] = useState(DEFAULT_REPLY_MESSAGE);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [typingUsers, setTypingUsers] = useState({});

  // References
  const flatListRef = useRef(null);

  // Setup socket connection when conversation changes
  useEffect(() => {
    if (conversationId && user?._id) {
      // Initialize socket connection
      initiateSocket(user?._id, conversationId);
      
      // Load initial messages
      loadMessages();
      
      // Track previous screen for navigation
      navigation.setOptions({
        headerLeft: () => (
          <MessageHeaderLeft
            conversationName={conversationName}
            avatar={avatar}
            avatarColor={avatarColor}
            onBack={() => handleGoBack()}
            onPress={() => handleGoToOptionScreen()}
          />
        ),
      });
    }
    
    // Cleanup socket when unmounting
    return () => {
      disconnectSocket();
    };
  }, [conversationId, user?._id]);

  // Handle back button
  useEffect(() => {
    const backAction = () => {
      handleGoBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, []);

  // Handle go back
  const handleGoBack = () => {
    navigation.goBack();
    return true;
  };

  // Handle navigation to conversation details
  const handleGoToOptionScreen = () => {
    navigation.navigate('ConversationDetails', {
      conversationId,
      conversationName,
      avatar,
      avatarColor,
      isGroupChat,
    });
  };

  // Handle reply to message
  const handleOnReplyMessagePress = messageId => {
    const messageToReply = messages.find(msg => msg._id === messageId);
    if (messageToReply) {
      setReplyMessage({
        isReply: true,
        message: messageToReply,
      });
    }
  };

  // Load messages
  const loadMessages = async (refresh = false) => {
    setLoading(true);
    const newPage = refresh ? 0 : page;
    try {
      const response = await conversationService.getMessages(conversationId, newPage, DEFAULT_PAGE_SIZE);
      if (refresh) {
        setMessages(response.data);
      } else {
        setMessages([...messages, ...response.data]);
      }
      setHasMoreMessages(response.data.length === DEFAULT_PAGE_SIZE);
      setPage(newPage);
    } catch (error) {
      console.error('Error fetching messages:', error);
      Alert.alert('Lỗi', 'Không thể tải tin nhắn. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Load more messages
  const goToNextPage = () => {
    if (loading || !hasMoreMessages) return;
    
    const nextPage = page + 1;
    loadMessages();
  };

  // Handle showing last viewers
  const handleShowLastView = async messageId => {
    try {
      const response = await conversationService.getLastViewers(conversationId, messageId);
      console.log(response.data);
    } catch (error) {
      console.error('Error fetching last viewers:', error);
    }
  };

  // Handle send text message
  const handleSendMessage = async (content) => {
    if (!content || !content.trim()) return;

    try {
      const messageData = {
        conversationId,
        content,
        replyToId: replyMessage.isReply ? replyMessage.message._id : null,
      };

      // Reset reply state
      setReplyMessage(DEFAULT_REPLY_MESSAGE);

      // Send message through API
      await conversationService.sendTextMessage(messageData);
      
      // Scroll to bottom after sending
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn. Vui lòng thử lại sau.');
    }
  };

  // Handle send file message
  const handleSendFileMessage = async (files, type) => {
    try {
      // Create FormData
      const formData = new FormData();
      
      // Append files
      files.forEach((file, index) => {
        const fileUri = file.uri;
        const fileType = file.type || 'image/jpeg';
        const fileName = fileUri.split('/').pop();
        
        formData.append('files', {
          uri: fileUri,
          type: fileType,
          name: fileName,
        });
      });
      
      // Add attachment info
      const attachInfo = {
        type,
        conversationId,
      };
      
      // Send file message
      await conversationService.sendFileThroughMessage(
        formData, 
        attachInfo, 
        (progress) => console.log('Upload progress:', progress)
      );
      
      // Scroll to bottom after sending
      scrollToBottom();
    } catch (error) {
      console.error('Error sending file message:', error);
      Alert.alert('Lỗi', 'Không thể gửi tập tin. Vui lòng thử lại sau.');
    }
  };

  // Handle delete message
  const handleDeleteMessage = async (messageId) => {
    try {
      await conversationService.redoMessage(messageId);
      
      // Update local messages list
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg._id === messageId 
            ? { ...msg, isDeleted: true, content: 'Tin nhắn đã bị xóa' } 
            : msg
        )
      );
      
      // Close modal
      setModalVisible(DEFAULT_MESSAGE_MODAL_VISIBLE);
    } catch (error) {
      console.error('Error deleting message:', error);
      Alert.alert('Lỗi', 'Không thể xóa tin nhắn. Vui lòng thử lại sau.');
    }
  };

  // Handle add reaction
  const handleAddReaction = async (messageId, type) => {
    try {
      await conversationService.dropReaction(messageId, type);
      
      // Update local messages list
      setMessages(prevMessages => 
        prevMessages.map(msg => {
          if (msg._id === messageId) {
            // Check if user already reacted with this type
            const existingReactionIndex = msg.reactions?.findIndex(
              r => r.userId === user._id && r.type === type
            );
            
            let updatedReactions = [...(msg.reactions || [])];
            
            if (existingReactionIndex >= 0) {
              // Remove existing reaction
              updatedReactions.splice(existingReactionIndex, 1);
            } else {
              // Add new reaction
              updatedReactions.push({ 
                userId: user._id, 
                type,
                createdAt: new Date().toISOString()
              });
            }
            
            return { ...msg, reactions: updatedReactions };
          }
          return msg;
        })
      );
      
      // Close reaction modal
      setReactProps(DEFAULT_REACTION_MODAL_VISIBLE);
    } catch (error) {
      console.error('Error adding reaction:', error);
      Alert.alert('Lỗi', 'Không thể thêm biểu cảm. Vui lòng thử lại sau.');
    }
  };

  // Render message item
  const renderMessage = (message, index) => {
    const isMyMessage = message.sender?._id === user?._id;
    const isLastMessage = index === messages.length - 1;

    return (
      <ChatMessage
        key={message._id}
        message={message}
        isMyMessage={isMyMessage}
        currentUserId={user?._id}
        isLastMessage={isLastMessage}
        setModalVisible={setModalVisible}
        showReactDetails={setReactProps}
        setImageProps={setImageProps}
        onLastView={handleShowLastView}
        navigation={navigation}
      />
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : null}
          style={{flex: 1}}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
            
          {conversationService.getPinnedMessages(conversationId)?.length > 0 && (
            <PinnedMessage
              pinnedMessages={conversationService.getPinnedMessages(conversationId)}
              onViewDetail={setMessageDetailProps}
              onViewImage={setImageProps}
            />
          )}
          
          <FlatList
            ref={flatListRef}
            onEndReached={goToNextPage}
            data={messages}
            keyExtractor={item => item._id}
            renderItem={({item, index}) => renderMessage(item, index)}
            initialNumToRender={20}
            ListFooterComponent={() =>
              loading ? <MessageDivider isLoading={true} /> : null
            }
            inverted
            contentContainerStyle={{paddingBottom: 15}}
          />

          {typingUsers[conversationId]?.length > 0 && (
            <View style={styles.typingContainer}>
              <View style={styles.typingWrap}>
                <Text style={styles.typingText}>
                  {`${typingUsers[conversationId][0].name} đang nhập `}
                </Text>
                <AnimatedEllipsis style={styles.dot} />
              </View>
            </View>
          )}
          
          <MessageBottomBar
            conversationId={conversationId}
            showStickyBoard={setStickyBoardVisible}
            showImageModal={setImageModalVisible}
            stickyBoardVisible={stickyBoardVisible}
            members={participants?.map(member => {
              return {...member, id: member._id};
            })}
            type={isGroupChat ? 'group' : 'individual'}
            replyMessage={replyMessage}
            setReplyMessage={setReplyMessage}
            handleSendMessage={handleSendMessage}
            handleSendFileMessage={handleSendFileMessage}
          />

          <StickyBoard
            height={keyboardHeight}
            visible={stickyBoardVisible}
            setVisible={setStickyBoardVisible}
          />
          
          <ReactionModal
            reactProps={reactProps}
            setReactProps={setReactProps}
            handleAddReaction={handleAddReaction}
          />
          
          <ImagePickerModal
            modalVisible={imageModalVisible}
            setModalVisible={setImageModalVisible}
            conversationId={conversationId}
          />
          
          <MessageModal
            modalVisible={modalVisible}
            setModalVisible={setModalVisible}
            navigation={navigation}
            handleOnReplyMessagePress={handleOnReplyMessagePress}
            handleDeleteMessage={handleDeleteMessage}
          />
          
          {imageProps.isVisible && (
            <ViewImageModal
              imageProps={imageProps}
              setImageProps={setImageProps}
            />
          )}
          
          {messageDetailProps.isVisible && (
            <MessageDetailModal
              modalVisible={messageDetailProps}
              setModalVisible={setMessageDetailProps}
            />
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: '#E2E9F1'
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
  },
  headerSubTitle: {
    color: '#fff',
    fontSize: 12,
  },
  typingContainer: {
    width: '100%', 
    flexDirection: 'row'
  },
  typingWrap: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    justifyContent: 'flex-start',
    marginTop: -10,
    paddingTop: 5,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderTopColor: '#E5E6E7',
    borderRightColor: '#E5E6E7',
    borderTopRightRadius: 10,
  },
  typingText: {
    fontSize: 14,
  },
  dot: {
    fontSize: 18,
    color: '#aaa',
    padding: 0,
  },
});

export default MessageScreen;
