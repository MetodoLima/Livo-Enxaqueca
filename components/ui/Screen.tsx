import type { ReactNode } from 'react';
import { ScrollView, StatusBar, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cssInterop } from 'nativewind';

cssInterop(SafeAreaView, { className: 'style' });

export interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  className?: string;
}

export default function Screen({ children, scroll = false, padded = true, className = '' }: ScreenProps) {
  const padding = padded ? 'px-gutter' : '';

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-canvas">
      <StatusBar barStyle="light-content" />
      {scroll ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName={`grow pb-section ${padding} ${className}`}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View className={`flex-1 ${padding} ${className}`}>{children}</View>
      )}
    </SafeAreaView>
  );
}
