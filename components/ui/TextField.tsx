import { useState, type ReactNode } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import Text from '@/components/ui/Text';
import { color } from '@/constants/Colors';

export interface TextFieldProps extends Omit<TextInputProps, 'style' | 'placeholderTextColor'> {
  label: string;
  error?: string;
  hint?: string;
  accessory?: ReactNode;
  className?: string;
}

export default function TextField({
  label,
  error,
  hint,
  accessory,
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
      <View>
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
          className={`rounded-md border bg-surface-raised py-3 pl-4 font-epilogue text-body text-content ${accessory ? 'pr-14' : 'pr-4'} ${multiline ? 'min-h-28' : 'min-h-14'} ${border}`}
          {...props}
        />
        {accessory ? <View className="absolute right-2 top-2">{accessory}</View> : null}
      </View>
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
