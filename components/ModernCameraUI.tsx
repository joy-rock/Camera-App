import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors, Spacing, BorderRadius, Shadows, Typography, Animations } from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

interface CameraControlsProps {
  onCapture: () => void;
  onFlipCamera?: () => void;
  onFlashToggle?: () => void;
  flashMode?: 'on' | 'off' | 'auto';
  isCapturing?: boolean;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  onCapture,
  onFlipCamera,
  onFlashToggle,
  flashMode = 'off',
  isCapturing = false,
}) => {
  const captureScale = useSharedValue(1);
  const captureRotation = useSharedValue(0);
  const controlsOpacity = useSharedValue(1);

  const handleCapture = () => {
    'worklet';
    captureScale.value = withSequence(
      withSpring(0.8, { damping: 8, stiffness: 100 }),
      withSpring(1.2, { damping: 5, stiffness: 150 }),
      withSpring(1, Animations.spring.bouncy)
    );
    captureRotation.value = withSequence(
      withTiming(360, { duration: 800, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 0 })
    );
    if (!isCapturing) {
      runOnJS(onCapture)();
    }
  };

  const captureButtonStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: captureScale.value },
      { rotate: `${captureRotation.value}deg` },
    ],
  }));

  const controlsStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
  }));

  return (
    <Animated.View style={[styles.controlsContainer, controlsStyle]} entering={FadeIn.delay(300)}>
      {/* Top Controls */}
      <View style={styles.topControls}>
        {onFlashToggle && (
          <TouchableOpacity
            style={styles.controlButton}
            onPress={onFlashToggle}
            activeOpacity={0.7}
          >
            <BlurView intensity={60} tint="dark" style={styles.controlBlur}>
              <Text style={styles.controlIcon}>
                {flashMode === 'on' ? '⚡' : flashMode === 'auto' ? '🔦' : '🚫'}
              </Text>
            </BlurView>
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Gallery Button */}
        <TouchableOpacity style={styles.sideButton} activeOpacity={0.7}>
          <BlurView intensity={60} tint="dark" style={styles.sideButtonBlur}>
            <Text style={styles.sideButtonIcon}>🖼️</Text>
          </BlurView>
        </TouchableOpacity>

        {/* Capture Button */}
        <Animated.View style={captureButtonStyle}>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleCapture}
            activeOpacity={0.9}
            disabled={isCapturing}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={styles.captureGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.captureInner}>
                {isCapturing ? (
                  <ActivityIndicator color={Colors.textPrimary} />
                ) : (
                  <View style={styles.captureCenter} />
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Flip Camera Button */}
        {onFlipCamera && (
          <TouchableOpacity
            style={styles.sideButton}
            onPress={onFlipCamera}
            activeOpacity={0.7}
          >
            <BlurView intensity={60} tint="dark" style={styles.sideButtonBlur}>
              <Text style={styles.sideButtonIcon}>🔄</Text>
            </BlurView>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

interface PhotoPreviewProps {
  photoUri: string;
  onConfirm: () => void;
  onRetake: () => void;
}

export const PhotoPreview: React.FC<PhotoPreviewProps> = ({
  photoUri,
  onConfirm,
  onRetake,
}) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, Animations.spring.bouncy);
    opacity.value = withTiming(1, { duration: 300 });
  }, []);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.previewContainer}>
      <Animated.Image
        source={{ uri: photoUri }}
        style={[styles.previewImage, imageStyle]}
        resizeMode="cover"
      />
      
      <LinearGradient
        colors={['transparent', Colors.dark + '80']}
        style={styles.previewGradient}
      />
      
      <View style={styles.previewActions}>
        <TouchableOpacity
          style={styles.previewButton}
          onPress={onRetake}
          activeOpacity={0.8}
        >
          <BlurView intensity={80} tint="dark" style={styles.previewButtonBlur}>
            <Text style={styles.previewButtonIcon}>↺</Text>
            <Text style={styles.previewButtonText}>Retake</Text>
          </BlurView>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.previewButton, styles.confirmButton]}
          onPress={onConfirm}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[Colors.accent, Colors.accentDark]}
            style={styles.previewButtonGradient}
          >
            <Text style={styles.previewButtonIcon}>✓</Text>
            <Text style={styles.previewButtonText}>Use Photo</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface AIProcessingProps {
  progress?: number;
}

export const AIProcessing: React.FC<AIProcessingProps> = ({ progress = 0 }) => {
  const rotation = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    rotation.value = withSequence(
      ...Array(100).fill(
        withTiming(360, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      )
    );
    
    pulseScale.value = withSequence(
      ...Array(100).fill([
        withTiming(1.2, { duration: 1000 }),
        withTiming(1, { duration: 1000 }),
      ]).flat()
    );
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: pulseScale.value },
    ],
  }));

  return (
    <BlurView intensity={90} tint="dark" style={styles.processingContainer}>
      <Animated.View style={[styles.processingIcon, iconStyle]}>
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          style={styles.processingGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.processingEmoji}>🤖</Text>
        </LinearGradient>
      </Animated.View>
      
      <Text style={styles.processingTitle}>AI Processing</Text>
      <Text style={styles.processingSubtitle}>Analyzing furniture...</Text>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryLight]}
            style={[styles.progressFill, { width: `${progress * 100}%` }]}
          />
        </View>
      </View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  controlsContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 30,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.lg,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    marginHorizontal: Spacing.xs,
  },
  controlBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlIcon: {
    fontSize: 20,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  sideButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  sideButtonBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideButtonIcon: {
    fontSize: 24,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    ...Shadows.xl,
  },
  captureGradient: {
    flex: 1,
    padding: 4,
  },
  captureInner: {
    flex: 1,
    backgroundColor: Colors.dark,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureCenter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.textPrimary,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  previewImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  previewGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  previewActions: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.xl,
  },
  previewButton: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  previewButtonBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  previewButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  confirmButton: {
    minWidth: 140,
  },
  previewButtonIcon: {
    fontSize: 20,
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  previewButtonText: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  processingIcon: {
    width: 120,
    height: 120,
    marginBottom: Spacing.xl,
  },
  processingGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.xl,
  },
  processingEmoji: {
    fontSize: 60,
  },
  processingTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  processingSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  progressContainer: {
    width: '80%',
    maxWidth: 300,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.darkTertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
});
