import type { ReactNode } from 'react';
import { StatusBar, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { cssInterop } from 'nativewind';
import KeyboardAwareScroll from '@/components/ui/KeyboardAwareScroll';

cssInterop(SafeAreaView, { className: 'style' });

const FOLGA_DO_RODAPE = 24;

export interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  footer?: ReactNode;
  className?: string;
}

export default function Screen({ children, scroll = false, padded = true, footer, className = '' }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const padding = padded ? 'px-gutter' : '';

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-canvas">
      <StatusBar barStyle="light-content" />
      {scroll ? (
        <KeyboardAwareScroll className="flex-1" contentContainerClassName={`grow pb-section ${padding} ${className}`}>
          {children}
        </KeyboardAwareScroll>
      ) : (
        <View className={`flex-1 ${padding} ${className}`}>{children}</View>
      )}
      {footer ? (
        <View
          className="flex-row items-center gap-3 border-t border-line bg-canvas px-gutter pt-4"
          style={{ paddingBottom: Math.max(insets.bottom, FOLGA_DO_RODAPE) }}
        >
          {footer}
        </View>
      ) : null}
    </SafeAreaView>
  );
}
