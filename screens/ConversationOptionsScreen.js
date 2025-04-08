import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing, typography, borderRadius } from '../styles';

const OptionItem = ({ icon, title, onPress, color = colors.dark }) => {
  return (
    <TouchableOpacity style={styles.optionItem} onPress={onPress}>
      <Icon name={icon} size={24} color={color} style={styles.optionIcon} />
      <Text style={[styles.optionText, { color }]}>{title}</Text>
    </TouchableOpacity>
  );
};

const ConversationOptionsScreen = ({ route, navigation }) => {
  const { conversationId, name, type = 'private' } = route.params || {};

  const handleClose = () => {
    navigation.goBack();
  };

  const handleViewMembers = () => {
    navigation.navigate('Member', { conversationId, name });
    navigation.goBack();
  };

  const handleViewMedia = () => {
    // In a real app, navigate to media gallery
    Alert.alert('Tính năng đang phát triển', 'Tính năng này sẽ sớm được cập nhật');
    navigation.goBack();
  };

  const handleNotifications = () => {
    // In a real app, toggle or configure notifications
    Alert.alert('Tính năng đang phát triển', 'Tính năng này sẽ sớm được cập nhật');
    navigation.goBack();
  };

  const LEAVE_GROUP_MESSAGE = 'Bạn có chắc chắn muốn rời khỏi nhóm không?';
  const DELETE_GROUP_MESSAGE = 'Bạn có chắc chắn muốn xóa cuộc trò chuyện này không? Hành động này không thể hoàn tác.';

  const handleLeaveGroup = () => {
    Alert.alert(
      'Rời nhóm',
      LEAVE_GROUP_MESSAGE,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Rời nhóm',
          style: 'destructive',
          onPress: () => {
            // In a real app, make API call to leave group
            navigation.goBack();
            // Không navigate to Home ở đây, chỉ cần goBack
          }
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Xóa cuộc trò chuyện',
      DELETE_GROUP_MESSAGE,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            // In a real app, make API call to delete conversation
            navigation.goBack();
            // Không navigate to Home ở đây, chỉ cần goBack
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.lightGray} barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tùy chọn</Text>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={handleClose}
        >
          <Icon name="close" size={24} color={colors.dark} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {type === 'group' && (
          <OptionItem
            icon="people"
            title="Xem thành viên"
            onPress={handleViewMembers}
          />
        )}
        
        <OptionItem
          icon="photo-library"
          title="Xem ảnh, video và files"
          onPress={handleViewMedia}
        />
        
        <OptionItem
          icon="notifications"
          title="Thông báo"
          onPress={handleNotifications}
        />
        
        {type === 'group' && (
          <OptionItem
            icon="exit-to-app"
            title="Rời nhóm"
            onPress={handleLeaveGroup}
            color={colors.danger}
          />
        )}
        
        <OptionItem
          icon="delete"
          title="Xóa cuộc trò chuyện"
          onPress={handleDelete}
          color={colors.danger}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.dark,
  },
  closeButton: {
    position: 'absolute',
    right: spacing.md,
    padding: spacing.sm,
  },
  content: {
    backgroundColor: colors.white,
    marginTop: spacing.md,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  optionIcon: {
    marginRight: spacing.md,
  },
  optionText: {
    ...typography.body,
  },
});

export default ConversationOptionsScreen;
