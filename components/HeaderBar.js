import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomAvatar from './CustomAvatar';
import { colors, spacing, borderRadius } from '../styles';

const HeaderBar = ({
  title,
  subtitle,
  showBack = false,
  showInfo = false,
  onBackPress,
  onInfoPress,
  avatar,
  avatarColor,
  rightComponent,
}) => {
  return (
    <View style={styles.container}>
      {/* Left section - Back button */}
      <View style={styles.leftContainer}>
        {showBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackPress}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Icon name="arrow-back" size={24} color={colors.dark} />
          </TouchableOpacity>
        )}
      </View>

      {/* Middle section - Title and avatar */}
      <TouchableOpacity
        style={styles.centerContainer}
        onPress={showInfo ? onInfoPress : null}
        disabled={!showInfo}
      >
        {avatar || avatarColor ? (
          <CustomAvatar
            size={40}
            name={title}
            avatar={avatar}
            color={avatarColor}
          />
        ) : null}
        
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {/* Right section - Custom components or Info button */}
      <View style={styles.rightContainer}>
        {rightComponent || (
          showInfo && (
            <TouchableOpacity
              style={styles.infoButton}
              onPress={onInfoPress}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Icon name="info-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          )
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
    height: Platform.OS === 'ios' ? 60 : 56,
    justifyContent: 'space-between',
  },
  leftContainer: {
    minWidth: 40,
    alignItems: 'flex-start',
  },
  centerContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightContainer: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  backButton: {
    padding: spacing.xs,
  },
  titleContainer: {
    marginLeft: spacing.sm,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
  },
  subtitle: {
    fontSize: 12,
    color: colors.gray,
  },
  infoButton: {
    padding: spacing.xs,
  },
});

export default HeaderBar;
