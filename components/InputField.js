import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing, borderRadius } from '../styles';

const InputField = ({
  value,
  onChangeText,
  placeholder,
  onSend,
  onAttach,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity onPress={onAttach} style={styles.attachButton}>
        <Icon name="attach-file" size={24} color={colors.primary} />
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.gray}
        multiline
      />
      <TouchableOpacity
        onPress={onSend}
        style={[
          styles.sendButton,
          { backgroundColor: value ? colors.primary : colors.light },
        ]}
        disabled={!value}
      >
        <Icon
          name="send"
          size={24}
          color={value ? colors.white : colors.gray}
        />
      </TouchableOpacity>
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
    borderTopWidth: 1,
    borderTopColor: colors.light,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: colors.light,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.sm,
    fontSize: 16,
  },
  attachButton: {
    padding: spacing.sm,
  },
  sendButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.round,
  },
});

export default InputField; 