import React, { useEffect } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { StopCircle } from 'lucide-react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface Props {
  onStop: () => void;
  size?: number;
  iconSize?: number;
}

export default function PulsingMic({ onStop, size = 80, iconSize = 32 }: Props) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.5, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: interpolate(pulse.value, [1, 1.5], [0.35, 0]),
  }));

  const radius = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          ringStyle,
          {
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: '#EF4444',
          },
        ]}
      />
      <TouchableOpacity
        onPress={onStop}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: '#EF4444',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <StopCircle size={iconSize} color="white" />
      </TouchableOpacity>
    </View>
  );
}
