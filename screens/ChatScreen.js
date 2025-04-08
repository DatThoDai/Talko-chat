import React, { useState } from 'react';
import {
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomAvatar from '../components/CustomAvatar';
import InputField from '../components/InputField';
import { colors, spacing } from '../styles';

const ChatScreen = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: 'Hello!',
      sender: 'other',
      time: '10:00 AM',
    },
    {
      id: '2',
      text: 'Hi there!',
      sender: 'me',
      time: '10:01 AM',
    },
  ]);

  const handleSend = () => {
    if (message.trim()) {
      setMessages([
        ...messages,
        {
          id: Date.now().toString(),
          text: message,
          sender: 'me',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setMessage('');
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender === 'me';
    return (
      <View
        style={[
          styles.messageContainer,
          isMe ? styles.myMessage : styles.otherMessage,
        ]}
      >
        {!isMe && (
          <CustomAvatar
            size={32}
            name="John Doe"
            style={styles.avatar}
          />
        )}
        <View
          style={[
            styles.messageBubble,
            isMe ? styles.myBubble : styles.otherBubble,
          ]}
        >
          <Text style={isMe ? styles.myMessageText : styles.otherMessageText}>{item.text}</Text>
          <Text style={isMe ? styles.myTimeText : styles.otherTimeText}>{item.time}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          inverted
        />
        <InputField
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
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
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesList: {
    padding: spacing.md,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  avatar: {
    marginRight: spacing.sm,
  },
  messageBubble: {
    padding: spacing.sm,
    borderRadius: spacing.md,
  },
  myBubble: {
    backgroundColor: colors.primary,
  },
  otherBubble: {
    backgroundColor: colors.light,
  },
  messageText: {
    fontSize: 16,
  },
  myMessageText: {
    color: colors.white,
  },
  otherMessageText: {
    color: colors.dark,
  },
  timeText: {
    fontSize: 12,
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
  },
  myTimeText: {
    color: colors.white,
  },
  otherTimeText: {
    color: colors.gray,
  },
});

export default ChatScreen; 