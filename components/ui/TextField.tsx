import { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import Text from '@/components/ui/Text';
import { color } from '@/constants/Colors';

export interface TextFieldProps extends Omit<TextInputProps, 'style' | 'placeholderTextColor'> {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
}

export default function TextField({
  label,
  error,
  hint,
  multiline,
  className = '',
  onFocus,
  onBlur,
  ...props
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const border = error ? 'border-danger' : focused ? 'border-primary' : 'border-line-strong';

  return (
    <View className={`gap-2 ${className}`}>
      <Text variant="caption" weight="semibold" tone="muted">
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error ?? hint}
        placeholderTextColor={color.contentMuted}
        selectionColor={color.primary}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        className={`rounded-md border bg-surface-raised px-4 py-3 font-epilogue text-body text-content ${multiline ? 'min-h-28' : 'min-h-14'} ${border}`}
        {...props}
      />
      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
