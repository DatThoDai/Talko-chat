import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomAvatar from '../components/CustomAvatar';
import InputField from '../components/InputField';
import { fetchMessages, sendMessage } from '../redux/chatSlice';
import { colors, spacing, borderRadius } from '../styles';

const MessageItem = ({ message, isGroup }) => {
  const isMe = message.sender === 'me';
  
  return (
    <View
      style={[
        styles.messageContainer,
        isMe ? styles.myMessageContainer : styles.otherMessageContainer,
      ]}
    >
      {!isMe && !message.isSystemMessage && (
        <CustomAvatar
          size={36}
          name={isGroup && message.senderName ? message.senderName : 'User'}
          style={styles.avatar}
        />
      )}
      
      {message.isSystemMessage ? (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{message.text}</Text>
        </View>
      ) : (
        <View
          style={[
            styles.messageBubble,
            isMe ? styles.myBubble : styles.otherBubble,
          ]}
        >
          {isGroup && !isMe && message.senderName && (
            <Text style={styles.senderName}>{message.senderName}</Text>
          )}
          <Text style={isMe ? styles.myMessageText : styles.otherMessageText}>
            {message.text}
          </Text>
          <Text style={isMe ? styles.myTimeText : styles.otherTimeText}>
            {message.timestamp}
          </Text>
        </View>
      )}
    </View>
  );
};

const MessageScreen = ({ route, navigation }) => {
  const { conversationId, name, isGroup } = route.params || {};
  const [inputText, setInputText] = useState('');
  const dispatch = useDispatch();
  const { messages, isLoading } = useSelector((state) => state.chat);
  const flatListRef = useRef(null);
  
  useEffect(() => {
    if (conversationId) {
      dispatch(fetchMessages(conversationId));
    }
  }, [dispatch, conversationId]);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [messages]);
  
  const handleSend = () => {
    if (inputText.trim() !== '') {
      dispatch(sendMessage({ conversationId, text: inputText.trim() }));
      setInputText('');
    }
  };
  
  const handleBack = () => {
    navigation.goBack();
  };
  
  const handleOptionsPress = () => {
    navigation.navigate('ConversationOptions', { 
      conversationId, 
      name,
      isGroup 
    });
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.white} barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.profileSection}
          onPress={() => isGroup ? 
            navigation.navigate('Member', { conversationId, name }) : 
            navigation.navigate('FriendDetails', { conversationId, name })
          }
        >
          <CustomAvatar size={40} name={name} />
          <Text style={styles.headerTitle} numberOfLines={1}>
            {name}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuButton} onPress={handleOptionsPress}>
          <Icon name="more-vert" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({ item }) => (
            <MessageItem message={item} isGroup={isGroup} />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          inverted
          ListEmptyComponent={
            !isLoading && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  Chưa có tin nhắn nào. Hãy gửi tin nhắn để bắt đầu cuộc trò chuyện!
                </Text>
              </View>
            )
          }
        />
        
        <InputField
          value={inputText}
          onChangeText={setInputText}
          placeholder="Nhập tin nhắn..."
          onSend={handleSend}
          onAttach={() => {}}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  backButton: {
    padding: spacing.sm,
  },
  profileSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: spacing.md,
    color: colors.dark,
  },
  menuButton: {
    padding: spacing.sm,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesList: {
    padding: spacing.md,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    maxWidth: '80%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  avatar: {
    marginRight: spacing.sm,
    alignSelf: 'flex-end',
  },
  messageBubble: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  myBubble: {
    backgroundColor: colors.primary,
  },
  otherBubble: {
    backgroundColor: colors.light,
  },
  senderName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  myMessageText: {
    fontSize: 16,
    color: colors.white,
  },
  otherMessageText: {
    fontSize: 16,
    color: colors.dark,
  },
  myTimeText: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.8,
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
  },
  otherTimeText: {
    fontSize: 12,
    color: colors.gray,
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
  },
  systemMessageContainer: {
    backgroundColor: colors.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignSelf: 'center',
    marginVertical: spacing.md,
  },
  systemMessageText: {
    fontSize: 14,
    color: colors.gray,
    fontStyle: 'italic',
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.gray,
    fontSize: 14,
  },
});

export default MessageScreen;
