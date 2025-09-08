import React, { useEffect } from 'react';
import { View, Text, Pressable, ViewStyle, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  ZoomIn,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, Shadows, Typography, Animations } from '../constants/theme';
import { BlurView } from 'expo-blur';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

interface AnimatedButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'glass' | 'outline';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  disabled?: boolean;
  haptic?: boolean;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  onPress,
  children,
  variant = 'primary',
  size = 'medium',
  style,
  disabled = false,
  haptic = true,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    'worklet';
    scale.value = withSpring(0.95, Animations.spring.default);
    opacity.value = withTiming(0.8, { duration: Animations.timing.fast });
  };

  const handlePressOut = () => {
    'worklet';
    scale.value = withSpring(1, Animations.spring.bouncy);
    opacity.value = withTiming(1, { duration: Animations.timing.fast });
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BorderRadius.lg,
    };

    const sizeStyles = {
      small: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
      },
      medium: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
      },
      large: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.lg,
      },
    };

    const variantStyles = {
      primary: {
        backgroundColor: Colors.primary,
        ...Shadows.md,
      },
      secondary: {
        backgroundColor: Colors.secondary,
        ...Shadows.md,
      },
      glass: {
        backgroundColor: Colors.glass,
        borderWidth: 1,
        borderColor: Colors.glassLight,
        ...Shadows.lg,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: Colors.primary,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(disabled && { opacity: 0.5 }),
      ...style,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle = {
      ...Typography.bodyBold,
      color: variant === 'outline' ? Colors.primary : Colors.textPrimary,
    };

    const sizeStyles = {
      small: { fontSize: 14 },
      medium: { fontSize: 16 },
      large: { fontSize: 18 },
    };

    return { ...baseStyle, ...sizeStyles[size] };
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[getButtonStyle(), animatedStyle]}
    >
      {typeof children === 'string' ? (
        <Text style={getTextStyle()}>{children}</Text>
      ) : (
        children
      )}
    </AnimatedPressable>
  );
};

interface AnimatedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
  variant?: 'glass' | 'solid' | 'gradient';
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  style,
  delay = 0,
  variant = 'glass',
}) => {
  const translateY = useSharedValue(50);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withSpring(0, Animations.spring.default)
    );
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: Animations.timing.normal })
    );
    scale.value = withDelay(
      delay,
      withSpring(1, Animations.spring.bouncy)
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      padding: Spacing.lg,
      borderRadius: BorderRadius.xl,
      ...Shadows.lg,
    };

    const variantStyles = {
      glass: {
        backgroundColor: Colors.glass,
        borderWidth: 1,
        borderColor: Colors.glassLight,
      },
      solid: {
        backgroundColor: Colors.darkSecondary,
      },
      gradient: {
        backgroundColor: Colors.darkSecondary,
        borderWidth: 1,
        borderColor: Colors.primary,
      },
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
      ...style,
    };
  };

  return (
    <Animated.View style={[getCardStyle(), animatedStyle]}>
      {children}
    </Animated.View>
  );
};

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
}

export const FadeInView: React.FC<FadeInViewProps> = ({
  children,
  delay = 0,
  duration = 500,
  style,
}) => {
  return (
    <Animated.View
      entering={FadeIn.delay(delay).duration(duration)}
      exiting={FadeOut.duration(300)}
      style={style}
    >
      {children}
    </Animated.View>
  );
};

interface ScaleInViewProps {
  children: React.ReactNode;
  delay?: number;
  style?: ViewStyle;
}

export const ScaleInView: React.FC<ScaleInViewProps> = ({
  children,
  delay = 0,
  style,
}) => {
  return (
    <Animated.View
      entering={ZoomIn.delay(delay).springify()}
      style={style}
    >
      {children}
    </Animated.View>
  );
};

interface GlassmorphicCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
}

export const GlassmorphicCard: React.FC<GlassmorphicCardProps> = ({
  children,
  style,
  intensity = 50,
  tint = 'dark',
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedBlurView
      intensity={intensity}
      tint={tint}
      style={[
        {
          padding: Spacing.lg,
          borderRadius: BorderRadius.xl,
          overflow: 'hidden',
          ...Shadows.xl,
        },
        animatedStyle,
        style,
      ]}
    >
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: Colors.glass,
        }}
      />
      {children}
    </AnimatedBlurView>
  );
};

interface AnimatedIconProps {
  icon: React.ReactNode;
  size?: number;
  color?: string;
  animated?: boolean;
}

export const AnimatedIcon: React.FC<AnimatedIconProps> = ({
  icon,
  size = 24,
  color = Colors.primary,
  animated = true,
}) => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (animated) {
      rotation.value = withSequence(
        withTiming(10, { duration: 100 }),
        withTiming(-10, { duration: 100 }),
        withTiming(0, { duration: 100 })
      );
      scale.value = withSequence(
        withTiming(1.2, { duration: 150 }),
        withSpring(1, Animations.spring.bouncy)
      );
    }
  }, [animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={animatedStyle}>
      {icon}
    </Animated.View>
  );
};

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = BorderRadius.md,
  style,
}) => {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withSequence(
      ...Array(100).fill(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.3, 0.8]),
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: Colors.gray[700],
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

export const AnimatedText = Animated.Text;
export const AnimatedView = Animated.View;
export const AnimatedImage = Animated.Image;
export const AnimatedScrollView = Animated.ScrollView;
