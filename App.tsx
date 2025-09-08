import React, { useEffect, useRef, useState } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View, Text, TouchableOpacity, Image, Platform, TextInput, ActivityIndicator, ScrollView, Dimensions, Alert, Pressable, RefreshControl } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import './utils/webPolyfills';
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
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors, Spacing, BorderRadius, Shadows, Typography, Animations } from './constants/theme';
import { 
  AnimatedButton, 
  AnimatedCard, 
  FadeInView, 
  ScaleInView, 
  GlassmorphicCard,
  AnimatedIcon,
  SkeletonLoader,
  AnimatedText,
  AnimatedView,
  AnimatedImage,
  AnimatedScrollView
} from './components/AnimatedComponents';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { StorageService, CapturedItem } from './utils/storage';
import { LocationService } from './utils/location';

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  CameraAI: undefined;
  ItemsList: undefined;
};
const Stack = createStackNavigator<RootStackParamList>();

type User = {
  name: string;
  license: string;
  profileIcon: string | null;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Simulate login
  const handleLogin = (username: string, password: string) => {
    setUser({
      name: username || 'John Doe',
      license: 'ABC123456',
      profileIcon: null,
    });
    setIsAuthenticated(true);
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={Colors.dark} />
      <NavigationContainer>
        <Stack.Navigator 
          screenOptions={{ 
            headerShown: false,
            // animation: 'slide_from_right',
            presentation: 'card',
          }}
        >
          {!isAuthenticated ? (
            <Stack.Screen name="Login">
              {() => <LoginScreen onLogin={handleLogin} />}
            </Stack.Screen>
          ) : (
            <>
              <Stack.Screen name="Home">
                {({ navigation }: { navigation: StackNavigationProp<RootStackParamList, 'Home'> }) => (
                  <AppContent user={user} navigation={navigation} setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
                )}
              </Stack.Screen>
              <Stack.Screen name="CameraAI">
                {({ navigation }: { navigation: StackNavigationProp<RootStackParamList, 'CameraAI'> }) => (
                  <CameraAIScreen navigation={navigation} user={user} setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
                )}
              </Stack.Screen>
              <Stack.Screen name="ItemsList">
                {({ navigation }: { navigation: StackNavigationProp<RootStackParamList, 'ItemsList'> }) => (
                  <ItemsListScreen navigation={navigation} user={user} setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
                )}
              </Stack.Screen>
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

type AppContentProps = {
  user: User | null;
  navigation: StackNavigationProp<RootStackParamList, 'Home'>;
  setIsAuthenticated: (value: boolean) => void;
  setUser: (value: User | null) => void;
};

function AppContent({ user, navigation, setIsAuthenticated, setUser }: AppContentProps) {
  const scrollY = useSharedValue(0);
  const headerScale = useSharedValue(1);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const handleScroll = (event: any) => {
    'worklet';
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollY.value = offsetY;
    headerScale.value = interpolate(offsetY, [0, 100], [1, 0.9], Extrapolate.CLAMP);
  };

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
    opacity: interpolate(scrollY.value, [0, 100], [1, 0.8], Extrapolate.CLAMP),
  }));

  const updateLocation = async () => {
    setLocationLoading(true);
    try {
      const location = await LocationService.getCurrentLocation();
      if (location) {
        setUserLocation(location);
        Alert.alert('Success', 'Location updated successfully');
      } else {
        Alert.alert('Error', 'Could not get location. Please ensure location permissions are enabled.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get location');
      console.error('Location error:', error);
    } finally {
      setLocationLoading(false);
    }
  };

    return (
    <LinearGradient
      colors={[Colors.dark, Colors.darkSecondary]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View>
          <AnimatedView style={[headerAnimatedStyle]}>
            <AppHeader 
              user={user} 
              onBack={() => navigation.goBack()} 
              onSignOut={() => { setIsAuthenticated(false); setUser(null); }} 
            />
          </AnimatedView>
        </View>
        
        <AnimatedScrollView
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: Spacing.md,
            paddingBottom: Spacing.xxl,
            paddingHorizontal: Spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome Section */}
          <FadeInView delay={200}>
            <View style={homeStyles.welcomeSection}>
              <AnimatedText 
                style={homeStyles.welcomeText}
                entering={FadeInDown.delay(300).springify()}
              >
                Welcome back,
              </AnimatedText>
              <AnimatedText 
                style={homeStyles.userName}
                entering={FadeInDown.delay(400).springify()}
              >
                {user?.name || 'Driver'} 👋
              </AnimatedText>
            </View>
          </FadeInView>

          {/* Stats Cards */}
          <View style={homeStyles.statsContainer}>
            <AnimatedCard delay={500} variant="glass" style={homeStyles.statCard}>
              <View style={homeStyles.statIconContainer}>
                <Text style={homeStyles.statIcon}>📦</Text>
            </View>
              <Text style={homeStyles.statNumber}>24</Text>
              <Text style={homeStyles.statLabel}>Deliveries Today</Text>
            </AnimatedCard>

            <AnimatedCard delay={600} variant="glass" style={homeStyles.statCard}>
              <View style={homeStyles.statIconContainer}>
                <Text style={homeStyles.statIcon}>🎯</Text>
          </View>
              <Text style={homeStyles.statNumber}>98%</Text>
              <Text style={homeStyles.statLabel}>Success Rate</Text>
            </AnimatedCard>
            </View>

          {/* Location Card */}
          <AnimatedCard delay={700} variant="gradient" style={homeStyles.locationCard}>
            <LinearGradient
              colors={[Colors.primary + '20', Colors.primaryDark + '10']}
              style={homeStyles.gradientOverlay}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={homeStyles.locationHeader}>
              <View style={homeStyles.locationIconWrapper}>
                <Text style={homeStyles.locationIcon}>📍</Text>
            </View>
              <View style={{ flex: 1 }}>
                <Text style={homeStyles.locationTitle}>Current Location</Text>
                {locationLoading ? (
                  <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 4 }} />
                ) : (
                  <Text style={homeStyles.locationText}>
                    {userLocation ? LocationService.formatLocation(userLocation) : 'Tap to set location'}
                  </Text>
                )}
          </View>
            </View>
            <AnimatedButton
              onPress={updateLocation}
              variant="glass"
              size="small"
              style={{ marginTop: Spacing.md }}
              disabled={locationLoading}
            >
              <Text style={{ color: Colors.primary }}>
                {locationLoading ? 'Getting Location...' : 'Update Location'}
              </Text>
            </AnimatedButton>
          </AnimatedCard>

          {/* Main Action Card */}
          <AnimatedCard delay={800} variant="solid" style={homeStyles.mainActionCard}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={homeStyles.gradientBackground}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <ScaleInView delay={900}>
              <View style={homeStyles.actionIconContainer}>
                <Text style={homeStyles.actionIcon}>📸</Text>
              </View>
            </ScaleInView>
            <Text style={homeStyles.actionTitle}>Furniture Detection AI</Text>
            <Text style={homeStyles.actionDescription}>
              Use advanced AI to identify and classify furniture items instantly
            </Text>
            <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg, width: '100%' }}>
              <AnimatedButton
              onPress={() => navigation.navigate('CameraAI')}
                variant="glass"
                size="large"
                style={{ flex: 1 }}
            >
                <View style={homeStyles.buttonContent}>
                  <Text style={homeStyles.buttonIcon}>🤖</Text>
                  <Text style={homeStyles.actionButtonText}>Start Scanning</Text>
          </View>
              </AnimatedButton>
              <AnimatedButton
                onPress={() => navigation.navigate('ItemsList')}
                variant="glass"
                size="medium"
                style={{ paddingHorizontal: Spacing.lg }}
              >
                <Ionicons name="list" size={24} color={Colors.gray[50]} />
              </AnimatedButton>
      </View>
          </AnimatedCard>

          {/* Quick Actions */}
          <FadeInView delay={900}>
            <Text style={homeStyles.sectionTitle}>Quick Actions</Text>
          </FadeInView>
          
          <View style={homeStyles.quickActionsContainer}>
            {[
              { icon: '📋', title: 'History', color: Colors.secondary },
              { icon: '⚙️', title: 'Settings', color: Colors.accent },
              { icon: '📊', title: 'Reports', color: Colors.warning },
              { icon: '❓', title: 'Help', color: Colors.info },
            ].map((action, index) => (
              <AnimatedCard
                key={action.title}
                delay={1000 + index * 100}
                variant="glass"
                style={homeStyles.quickActionCard}
              >
                <TouchableOpacity style={homeStyles.quickActionContent}>
                  <View style={[homeStyles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
                    <Text style={{ fontSize: 24 }}>{action.icon}</Text>
      </View>
                  <Text style={homeStyles.quickActionText}>{action.title}</Text>
          </TouchableOpacity>
              </AnimatedCard>
            ))}
        </View>
        </AnimatedScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

type LoginScreenProps = {
  onLogin: (username: string, password: string) => void;
};

function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const iconRotation = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, Animations.spring.bouncy);
    scale.value = withSpring(1, Animations.spring.bouncy);
    iconRotation.value = withSequence(
      withTiming(360, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      withTiming(0, { duration: 0 })
    );
  }, []);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotation.value}deg` }],
  }));

  const handleLogin = () => {
    if (!username || !password) {
      setError('Please enter username and password');
      return;
    }
    setError('');
    onLogin(username, password);
  };

  return (
    <LinearGradient
      colors={[Colors.dark, Colors.darkSecondary, Colors.primary]}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={loginStyles.container}>
          {/* Animated background elements */}
          <Animated.View
            style={[
              loginStyles.backgroundCircle,
              { top: -100, right: -100, backgroundColor: Colors.primaryLight + '20' },
            ]}
            entering={FadeIn.delay(200).duration(1000)}
          />
          <Animated.View
            style={[
              loginStyles.backgroundCircle,
              { bottom: -150, left: -150, backgroundColor: Colors.secondary + '15' },
            ]}
            entering={FadeIn.delay(400).duration(1000)}
          />
          
          <AnimatedView 
            style={[loginStyles.loginCard, cardAnimatedStyle]}
          >
            <BlurView intensity={30} tint="dark" style={loginStyles.blurContainer}>
              <View style={loginStyles.cardContent}>
                <AnimatedView style={iconAnimatedStyle}>
                  <View style={loginStyles.iconContainer}>
                    <Text style={loginStyles.avatar}>🚚</Text>
                  </View>
                </AnimatedView>
                
                <AnimatedText 
                  style={loginStyles.title}
                  entering={FadeInDown.delay(500).duration(600)}
                >
                  Welcome Back!
                </AnimatedText>
                
                <AnimatedText 
                  style={loginStyles.subtitle}
                  entering={FadeInDown.delay(600).duration(600)}
                >
                  Sign in to manage your deliveries
                </AnimatedText>
                
                <FadeInView delay={700} style={loginStyles.inputContainer}>
          <Text style={loginStyles.label}>Username</Text>
                  <View style={loginStyles.inputWrapper}>
          <TextInput
            style={loginStyles.input}
            value={username}
            onChangeText={setUsername}
                      placeholder="Enter your username"
            autoCapitalize="none"
                      placeholderTextColor={Colors.textTertiary}
          />
                    <View style={loginStyles.inputIcon}>
                      <Text>👤</Text>
        </View>
                  </View>
                </FadeInView>
                
                <FadeInView delay={800} style={loginStyles.inputContainer}>
          <Text style={loginStyles.label}>Password</Text>
                  <View style={loginStyles.inputWrapper}>
          <TextInput
            style={loginStyles.input}
            value={password}
            onChangeText={setPassword}
                      placeholder="Enter your password"
                      secureTextEntry={!showPassword}
                      placeholderTextColor={Colors.textTertiary}
                    />
        <TouchableOpacity
                      style={loginStyles.inputIcon}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Text>{showPassword ? '👁️' : '🔒'}</Text>
        </TouchableOpacity>
      </View>
                </FadeInView>
                
                {error ? (
                  <AnimatedText 
                    style={loginStyles.error}
                    entering={FadeIn.duration(300)}
                  >
                    {error}
                  </AnimatedText>
                ) : null}
                
                <FadeInView delay={900} style={{ width: '100%', marginTop: Spacing.lg }}>
                  <AnimatedButton
                    onPress={handleLogin}
                    variant="primary"
                    size="large"
                    style={{ width: '100%' }}
                  >
                    <LinearGradient
                      colors={[Colors.primary, Colors.primaryDark]}
                      style={loginStyles.gradientButton}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={loginStyles.buttonText}>Sign In</Text>
                    </LinearGradient>
                  </AnimatedButton>
                </FadeInView>
                
                <FadeInView delay={1000}>
                  <TouchableOpacity style={{ marginTop: Spacing.md }}>
                    <Text style={loginStyles.forgotPassword}>Forgot Password?</Text>
                  </TouchableOpacity>
                </FadeInView>
    </View>
            </BlurView>
          </AnimatedView>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// Login screen styles
const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  backgroundCircle: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
  },
  loginCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    ...Shadows.xl,
  },
  blurContainer: {
    width: '100%',
    borderRadius: BorderRadius.xxl,
  },
  cardContent: {
    padding: Spacing.xl,
    alignItems: 'center',
    backgroundColor: Colors.glass,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.lg,
  },
  avatar: {
    fontSize: 48,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.bodyBold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkTertiary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.glassLight,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  inputIcon: {
    paddingHorizontal: Spacing.md,
  },
  gradientButton: {
    width: '100%',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    fontSize: 18,
    letterSpacing: 1,
  },
  error: {
    ...Typography.caption,
    color: Colors.error,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  forgotPassword: {
    ...Typography.caption,
    color: Colors.primaryLight,
    textAlign: 'center',
  },
});

// Home screen styles
const homeStyles = StyleSheet.create({
  welcomeSection: {
    marginBottom: Spacing.xl,
  },
  welcomeText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  userName: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.lg,
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statIcon: {
    fontSize: 24,
  },
  statNumber: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  locationCard: {
    marginBottom: Spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  locationIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  locationIcon: {
    fontSize: 20,
  },
  locationTitle: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  locationText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  mainActionCard: {
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.9,
  },
  actionIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.glass,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.lg,
  },
  actionIcon: {
    fontSize: 48,
  },
  actionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  actionDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  buttonIcon: {
    fontSize: 20,
  },
  actionButtonText: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '45%',
    padding: 0,
  },
  quickActionContent: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  quickActionText: {
    ...Typography.caption,
    color: Colors.textPrimary,
  },
});

const styles = StyleSheet.create({
  formInput: {
    backgroundColor: '#f5f7fa',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#b3e0fc',
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 16,
    color: '#222',
    width: '100%',
    marginBottom: 8,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    paddingTop: 32,
    paddingHorizontal: 0,
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginHorizontal: 12,
    marginBottom: 18,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  profileIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#d1d5db',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  userLicense: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  locationCard: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    marginHorizontal: 12,
    marginBottom: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  locationIconContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 14,
  },
  locationIcon: {
    fontSize: 28,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 16,
    color: '#888',
    fontWeight: '600',
    marginBottom: 2,
  },
  locationText: {
    fontSize: 16,
    color: '#222',
    fontWeight: '500',
  },
  captureCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  cameraIconContainer: {
    marginBottom: 10,
  },
  cameraIcon: {
    fontSize: 36,
  },
  captureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 18,
  },
  takePhotoButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
    alignItems: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  takePhotoButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  captureButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 40,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  button: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    alignSelf: 'center',
    margin: 16,
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  previewContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  preview: { width: '95%', maxWidth: 400, height: 260, borderRadius: 18, marginBottom: 24, borderWidth: 2, borderColor: '#2196F3', backgroundColor: '#222', alignSelf: 'center' },
  captureText: { fontSize: 36 },
  classifyingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#10131a',
    paddingHorizontal: 24,
  },
  classifyingHeading: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  classifyingText: {
    fontSize: 18,
    color: '#b3e0fc',
    marginTop: 16,
    textAlign: 'center',
  },
  verifyHeading: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 18,
    letterSpacing: 0.5,
    textAlign: 'center',
    marginTop: 8,
  },
  classificationBlock: {
    backgroundColor: 'rgba(33,150,243,0.13)',
    borderColor: '#2196F3',
    borderWidth: 2,
    borderRadius: 22,
    padding: 28,
    marginTop: 8,
    marginBottom: 22,
    alignItems: 'flex-start',
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    flexWrap: 'wrap',
  },
  classificationTextHeading: {
    marginBottom: 12,
    alignSelf: 'center',
  },
  classificationIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    width: '100%',
    flexWrap: 'wrap',
    gap: 8,
  },
  classificationMainIcon: {
    fontSize: 30
  },
  confidenceText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
    textAlign: 'left',
    flexWrap: 'wrap',
    maxWidth: '100%',
  },
  classificationDescContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start'
  },
  classificationDesc: {
    fontSize: 14,
    color: '#b3e0fc',
    textAlign: 'left',
    marginBottom: 2,
    flexWrap: 'wrap',
    maxWidth: '100%',
  },
  correctButton: {
    backgroundColor: '#43e97b',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 10,
    marginTop: 8,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    shadowColor: '#43e97b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  correctButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  manualButton: {
    backgroundColor: '#fff',
    borderColor: '#2196F3',
    borderWidth: 2,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 10,
    marginTop: 16,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  manualButtonText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#10131a',
    paddingTop: 18,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
    zIndex: 10,
  },
  headerBackBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(33,150,243,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBackText: {
    color: '#2196F3',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  headerUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    flex: 1,
    minWidth: 0,
  },
  headerUserIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerUserName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    maxWidth: 120,
  },
  headerUserLicense: {
    color: '#b3e0fc',
    fontSize: 12,
    maxWidth: 120,
  },
  resultScrollContent: {
    paddingBottom: 40,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 28,
    minHeight: '100%',
    backgroundColor: '#10131a',
  },
  sectionDivider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginVertical: 16,
    alignSelf: 'center',
  },
  classificationTitleLabel: {
    color: '#b3e0fc',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  classificationLabel: {
    color: '#b3e0fc',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  classificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  classifyingShadow: {
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  classificationTitle: {
    fontSize: 18,
    color: '#2196F3',
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'left',
    flexWrap: 'wrap',
    maxWidth: '100%',
  },
  classificationRowIcon: {
    fontSize: 22,
    marginRight: 6,
  },
});

// Modern App Header Component
function AppHeader({ onBack, onSignOut, user }: { onBack?: () => void; onSignOut?: () => void; user?: User | null }) {
  const scaleAnim = useSharedValue(1);
  
  const handlePressIn = () => {
    'worklet';
    scaleAnim.value = withSpring(0.95, Animations.spring.default);
  };
  
  const handlePressOut = () => {
    'worklet';
    scaleAnim.value = withSpring(1, Animations.spring.bouncy);
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  return (
    <BlurView intensity={80} tint="dark" style={headerStyles.container}>
      <View style={headerStyles.content}>
      {onBack ? (
          <AnimatedButton
          onPress={onBack}
            variant="glass"
            size="small"
            style={headerStyles.backButton}
          >
            <Text style={headerStyles.backIcon}>←</Text>
          </AnimatedButton>
        ) : <View style={headerStyles.placeholder} />}
        
        <View style={headerStyles.userInfo}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            style={headerStyles.avatarContainer}
          >
            <Text style={headerStyles.avatar}>🚚</Text>
          </LinearGradient>
          
          <View style={headerStyles.userDetails}>
            <Text style={headerStyles.userName} numberOfLines={1}>
          {user?.name || 'Driver'}
        </Text>
            <Text style={headerStyles.userLicense} numberOfLines={1}>
          {user?.license || 'ABC123456'}
        </Text>
      </View>
        </View>
        
        {onSignOut && (
          <AnimatedButton
        onPress={onSignOut}
            variant="glass"
            size="small"
            style={headerStyles.signOutButton}
      >
            <Text style={headerStyles.signOutIcon}>↗</Text>
          </AnimatedButton>
        )}
    </View>
    </BlurView>
  );
}

// Header styles
const headerStyles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight || 0,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassLight,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    height: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  backIcon: {
    fontSize: 20,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    ...Shadows.md,
  },
  avatar: {
    fontSize: 24,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  userLicense: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  signOutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  signOutIcon: {
    fontSize: 18,
    color: Colors.error,
    fontWeight: 'bold',
  },
});

// Camera & AI Classification Screen
type CameraAIScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'CameraAI'>;
  user?: User | null;
  setIsAuthenticated?: (value: boolean) => void;
  setUser?: (value: User | null) => void;
};

function SuccessScreen({
  info,
  onBackToHome,
  photoUri,
  user,
  onSignOut,
}: {
  info: Record<string, string>;
  onBackToHome: () => void;
  photoUri?: string | null;
  user?: User | null;
  onSignOut?: () => void;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: '#10131a' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 0 }}>
        <View style={{ width: '100%', maxWidth: 440, flex: 1, justifyContent: 'center', alignItems: 'center', alignSelf: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 28, paddingHorizontal: 0, paddingVertical: 0, alignItems: 'center', shadowColor: '#2196F3', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.13, shadowRadius: 16, elevation: 8, width: '100%', maxWidth: 420, flex: 1, marginVertical: 24 }}>
            <ScrollView
              style={{ width: '100%', borderRadius: 28 }}
              contentContainerStyle={{ alignItems: 'center', padding: 28, paddingBottom: 32 }}
              showsVerticalScrollIndicator={false}
            >
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🎉</Text>
              <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#2196F3', marginBottom: 8, textAlign: 'center' }}>Submission Successful!</Text>
              <Text style={{ fontSize: 16, color: '#666', marginBottom: 18, textAlign: 'center' }}>Your information has been submitted.</Text>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={{ width: 180, height: 180, borderRadius: 18, marginBottom: 18, borderWidth: 2, borderColor: '#2196F3', backgroundColor: '#e0e7ef' }} />
              ) : null}
              <View style={{ width: '100%' }}>
                {Object.entries(info).map(([key, value]) => (
                  <View key={key} style={{ marginBottom: 10, width: '100%' }}>
                    <Text style={{ color: '#2196F3', fontWeight: 'bold', fontSize: 15 }}>{key}</Text>
                    <Text style={{ color: '#222', fontSize: 16, marginTop: 2 }}>{value || '-'}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={{ backgroundColor: '#43e97b', paddingHorizontal: 36, paddingVertical: 16, borderRadius: 12, marginTop: 18, width: '100%', alignItems: 'center', shadowColor: '#43e97b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 4 }}
                activeOpacity={0.85}
                onPress={onBackToHome}
              >
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 }}>⬅️ Back to Home</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </View>
    </View>
  );
}

// Items List Screen
interface ItemsListScreenProps {
  navigation: StackNavigationProp<RootStackParamList, 'ItemsList'>;
  user: User | null;
  setIsAuthenticated?: (isAuthenticated: boolean) => void;
  setUser?: (user: User | null) => void;
}

function ItemsListScreen({ navigation, user, setIsAuthenticated, setUser }: ItemsListScreenProps) {
  const [items, setItems] = useState<CapturedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadItems = async () => {
    try {
      const storedItems = await StorageService.getItems();
      setItems(storedItems);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadItems();
  };

  const handleDeleteItem = async (id: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.deleteItem(id);
              loadItems();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  const renderItem = (item: CapturedItem) => (
    <FadeInView key={item.id}>
      <AnimatedCard
        variant="glass"
        style={{
          marginHorizontal: Spacing.lg,
          marginBottom: Spacing.md,
          padding: Spacing.lg,
        }}
      >
        <View style={{ flexDirection: 'row', gap: Spacing.md }}>
          {item.photoUri && (
            <Image
              source={{ uri: item.photoUri }}
              style={{
                width: 80,
                height: 80,
                borderRadius: BorderRadius.md,
                backgroundColor: Colors.darkSecondary,
              }}
            />
          )}
          <View style={{ flex: 1 }}>
            <Text style={[Typography.h4, { color: Colors.textPrimary, marginBottom: Spacing.xs, fontSize: 18, fontWeight: '600' }]}>
              {item.wasteType}
            </Text>
            {item.description && (
              <Text style={[Typography.body, { color: Colors.textSecondary, marginBottom: Spacing.xs, fontSize: 15 }]}>
                {item.description}
              </Text>
            )}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }}>
              {item.volume && (
                <View style={itemStyles.tag}>
                  <Text style={itemStyles.tagText}>📦 {item.volume}</Text>
                </View>
              )}
              {item.weight && (
                <View style={itemStyles.tag}>
                  <Text style={itemStyles.tagText}>⚖️ {item.weight}</Text>
                </View>
              )}
              {item.location && (
                <View style={itemStyles.tag}>
                  <Text style={itemStyles.tagText}>📍 {LocationService.formatLocation(item.location).substring(0, 20)}...</Text>
                </View>
              )}
            </View>
            <Text style={[Typography.caption, { color: Colors.textTertiary, marginTop: Spacing.xs, fontSize: 13 }]}>
              {new Date(item.capturedAt).toLocaleString()}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => handleDeleteItem(item.id)}
            style={{ padding: Spacing.sm }}
          >
            <Ionicons name="trash-outline" size={20} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </AnimatedCard>
    </FadeInView>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.dark }}>
      <LinearGradient
        colors={[Colors.primaryDark, Colors.dark]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <AppHeader
          user={user}
          onBack={() => navigation.goBack()}
          onSignOut={() => {
            if (setIsAuthenticated && setUser) {
              setIsAuthenticated(false);
              setUser(null);
            }
          }}
        />
        
        <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm }}>
          <Text style={[Typography.h1, { color: Colors.gray[50] }]}>Captured Items</Text>
          <Text style={[Typography.body, { color: Colors.textSecondary }]}>
            {items.length} {items.length === 1 ? 'item' : 'items'} captured
          </Text>
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : items.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl }}>
            <Text style={homeStyles.actionIcon}>📸</Text>
            <Text style={[Typography.h2, { color: Colors.gray[50], textAlign: 'center', marginTop: Spacing.lg }]}>
              No items captured yet
            </Text>
            <Text style={[Typography.body, { color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm }]}>
              Start capturing furniture items to build your inventory
            </Text>
            <AnimatedButton
              onPress={() => navigation.navigate('CameraAI')}
              variant="primary"
              size="large"
              style={{ marginTop: Spacing.xl }}
            >
              <Text style={{ color: Colors.gray[50], fontWeight: '600' }}>Start Capturing</Text>
            </AnimatedButton>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingBottom: Spacing.xl }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.primary}
              />
            }
          >
            {items.map(renderItem)}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const itemStyles = StyleSheet.create({
  tag: {
    backgroundColor: Colors.darkTertiary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.darkTertiary,
  },
  tagText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});

const formStyles = StyleSheet.create({
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.darkSecondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.darkTertiary,
  },
  inputContainer: {
    backgroundColor: Colors.darkSecondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.darkTertiary,
  },
  input: {
    fontSize: 16,
    color: Colors.textPrimary,
    padding: 0,
    margin: 0,
  },
  inputLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
});

function CameraAIScreen({ navigation, user, setIsAuthenticated, setUser }: CameraAIScreenProps) {
  // All state declarations must come first, before any conditions
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showVolumeForm, setShowVolumeForm] = useState(false);
  const [result, setResult] = useState<string>('');
  const [showConfirmPhoto, setShowConfirmPhoto] = useState(false);
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submittedInfo, setSubmittedInfo] = useState<Record<string, string>>({});

  // Camera permissions
  const [permission, requestPermission] = useCameraPermissions();
  const [type, setType] = useState<CameraType>('back');

  // Manual form state
  const [manualWasteType, setManualWasteType] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  // Volume/weight form state
  const [volume, setVolume] = useState('');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  // Dropdown state
  const [showVolumeDropdown, setShowVolumeDropdown] = useState(false);
  const volumeDropdownAnim = useSharedValue(0);
  // Manual dimensions
  const [height, setHeight] = useState('');
  const [width, setWidth] = useState('');
  const [breadth, setBreadth] = useState('');

  // All refs must come before any conditions
  const camera = useRef<CameraView>(null);
  const fadeAnim = useSharedValue(0);

  // Location state
  const [captureLocation, setCaptureLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // Animated styles - must be defined before any conditions
  const dropdownAnimatedStyle = useAnimatedStyle(() => ({
    opacity: volumeDropdownAnim.value,
    transform: [{ scale: interpolate(volumeDropdownAnim.value, [0, 1], [0.98, 1]) }],
  }));

  const fadeAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value
  }));

  // Removed duplicate animation logic - handled in onPress handlers

  // Auto-suggest weight when volume changes
  useEffect(() => {
    const found = VOLUME_OPTIONS.find(opt => opt.value === volume);
    if (found) setWeight(found.weight);
  }, [volume]);

  useEffect(() => {
    if (!isClassifying && photoUri) {
      fadeAnim.value = withTiming(1, { duration: 500 });
    } else {
      fadeAnim.value = 0;
    }
  }, [isClassifying, photoUri]);

  const takePhoto = async () => {
    if (camera.current) {
      try {
        // Start capturing location in background
        setLocationLoading(true);
        LocationService.getCurrentLocation().then(location => {
          setCaptureLocation(location);
          setLocationLoading(false);
        }).catch(err => {
          console.log('Location error:', err);
          setLocationLoading(false);
        });

        const photo = await camera.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        setPendingPhotoUri(photo.uri);
    setShowConfirmPhoto(true);
      } catch (error) {
        Alert.alert('Error', 'Failed to take photo');
        console.error('Camera error:', error);
      }
    }
  };

  const handleConfirmPhoto = () => {
    setShowConfirmPhoto(false);
    setPhotoUri(pendingPhotoUri);
    setPendingPhotoUri(null);
    setIsClassifying(true);
    setTimeout(() => {
      setIsClassifying(false);
      setResult('Bulk Items (Furniture, appliances)');
    }, 5000);
  };

  const handleRetakePhoto = () => {
    setPendingPhotoUri(null);
    setShowConfirmPhoto(false);
  };

  // Success screen handlers
  const handleShowSuccess = async (info: Record<string, string>) => {
    // Save item to storage
    const item: CapturedItem = {
      id: Date.now().toString(),
      photoUri: photoUri || '',
      wasteType: info['Item Type'] || result || 'Unknown',
      description: info['Description'] || manualDescription,
      volume: info['Volume'] || volume,
      weight: info['Weight'] || weight,
      dimensions: (height || width || breadth) ? {
        height: info['Height'] || height,
        width: info['Width'] || width,
        breadth: info['Depth'] || breadth,
      } : undefined,
      notes: info['Notes'] || notes,
      location: captureLocation || undefined,
      capturedAt: new Date().toISOString(),
      capturedBy: user?.name || 'Unknown',
    };

    try {
      await StorageService.saveItem(item);
      console.log('Item saved successfully');
    } catch (error) {
      console.error('Error saving item:', error);
    }

    setSubmittedInfo(info);
    setShowManualForm(false);
    setShowVolumeForm(false);
    setShowSuccess(true);
  };

  const handleBackToHome = () => {
    setShowSuccess(false);
    setPhotoUri(null);
    setResult('');
    setManualWasteType('');
    setManualDescription('');
    setVolume('');
    setWeight('');
    setNotes('');
    setHeight('');
    setWidth('');
    setBreadth('');
    navigation.popToTop();
  };

  if (!permission) {
  return (
      <View style={styles.centered}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text>No access to camera. Please enable camera permissions in settings.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.dark }}>
      <SafeAreaView style={{ flex: 1 }}>
        <AppHeader 
          user={user} 
          onBack={() => navigation.goBack()} 
          onSignOut={() => { 
            if (setIsAuthenticated && setUser) {
              setIsAuthenticated(false); 
              setUser(null);
            }
          }} 
        />
        <View style={{ flex: 1 }}>
      
      {/* Success Screen */}
      {showSuccess && (
        <SuccessScreen
          info={submittedInfo}
          onBackToHome={handleBackToHome}
          photoUri={photoUri}
          user={user}
          onSignOut={() => { 
            if (setIsAuthenticated && setUser) {
              setIsAuthenticated(false); 
              setUser(null);
            }
          }}
        />
      )}

          {/* Camera View */}
          {!showSuccess && !pendingPhotoUri && !photoUri && !isClassifying && !showManualForm && !showVolumeForm && !showConfirmPhoto && (
            <View style={{ flex: 1 }}>
              <CameraView
            ref={camera}
                style={{ flex: 1 }}
                facing={type}
              />
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 40, alignItems: 'center' }}>
          <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
            <Text style={styles.captureText}>📸</Text>
          </TouchableOpacity>
              </View>
            </View>
          )}

      {/* Photo confirmation screen */}
      {!showSuccess && showConfirmPhoto && pendingPhotoUri && !isClassifying && !showManualForm && !showVolumeForm && (
        <ScrollView
          style={{ flex: 1, backgroundColor: '#10131a' }}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
            minHeight: '100%',
          }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={{ color: '#fff', fontSize: 26, fontWeight: 'bold', marginBottom: 22, letterSpacing: 0.5, textAlign: 'center' }}>Confirm Photo</Text>
          <View style={{ width: '100%', aspectRatio: 1, maxWidth: 500, marginBottom: 36, alignSelf: 'center', backgroundColor: '#222', borderRadius: 22, borderWidth: 2, borderColor: '#2196F3', overflow: 'hidden', shadowColor: '#2196F3', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 16 }}>
            <Image
              source={{ uri: pendingPhotoUri }}
              style={{ width: '100%', height: '100%', resizeMode: 'contain', borderRadius: 22 }}
            />
          </View>
          <View style={{ width: '100%', maxWidth: 420, alignItems: 'center', marginTop: 8 }}>
            <TouchableOpacity
              style={{
                backgroundColor: '#43e97b',
                paddingVertical: 20,
                borderRadius: 14,
                width: '100%',
                alignItems: 'center',
                marginBottom: 20,
                shadowColor: '#43e97b',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.18,
                shadowRadius: 8,
                elevation: 4,
              }}
              activeOpacity={0.85}
              onPress={handleConfirmPhoto}
            >
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', letterSpacing: 1 }}>✅ Confirm & Continue</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: '#fff',
                borderColor: '#ef4444',
                borderWidth: 2,
                paddingVertical: 20,
                borderRadius: 14,
                width: '100%',
                alignItems: 'center',
                marginBottom: 8,
                shadowColor: '#ef4444',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.13,
                shadowRadius: 6,
                elevation: 2,
              }}
              activeOpacity={0.85}
              onPress={handleRetakePhoto}
            >
              <Text style={{ color: '#ef4444', fontSize: 20, fontWeight: 'bold', letterSpacing: 1 }}>↺ Retake Photo</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Manual Verification Form */}
      {!showSuccess && showManualForm && photoUri && (
        <ScrollView contentContainerStyle={[styles.resultScrollContent, { paddingTop: 10, alignItems: 'center' }]}> 
          <Text style={styles.verifyHeading}>Manual Verification</Text>
          <View style={styles.sectionDivider} />
          <View style={{ width: '100%', aspectRatio: 1, maxWidth: 500, marginBottom: 24, alignSelf: 'center', backgroundColor: '#222', borderRadius: 22, borderWidth: 2, borderColor: '#2196F3', overflow: 'hidden' }}>
            <Image source={{ uri: photoUri || undefined }} style={{ width: '100%', height: '100%', resizeMode: 'contain', borderRadius: 22 }} />
          </View>
          <View style={styles.sectionDivider} />
          <View style={{ width: SCREEN_WIDTH > 420 ? 400 : '100%' }}>
            <Text style={styles.classificationLabel}>Waste Type</Text>
            <TextInput
              style={[styles.formInput, { marginBottom: 12 }]}
              value={manualWasteType}
              onChangeText={setManualWasteType}
              placeholder="Enter waste type"
              placeholderTextColor="#aaa"
            />
            <Text style={styles.classificationLabel}>Description</Text>
            <TextInput
              style={[styles.formInput, { marginBottom: 12 }]}
              value={manualDescription}
              onChangeText={setManualDescription}
              placeholder="Enter description"
              placeholderTextColor="#aaa"
              multiline
            />
            <Text style={styles.classificationLabel}>Volume</Text>
            <TouchableOpacity
              style={[styles.formInput, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 }]}
              activeOpacity={0.8}
              onPress={() => {
                if (!showVolumeDropdown) {
                  setShowVolumeDropdown(true);
                  volumeDropdownAnim.value = withTiming(1, { duration: 200 });
                } else {
                  setShowVolumeDropdown(false);
                  volumeDropdownAnim.value = withTiming(0, { duration: 200 });
                }
              }}
            >
              <Text style={{ color: volume ? '#222' : '#aaa', fontSize: 16 }}>
                {VOLUME_OPTIONS.find(opt => opt.value === volume)?.label || 'Select volume'}
              </Text>
              <Text style={{ fontSize: 18, color: '#2563eb', marginLeft: 8 }}>▼</Text>
            </TouchableOpacity>
            {showVolumeDropdown && (
              <AnimatedView
                style={[{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 235,
                  zIndex: 100,
                  backgroundColor: '#fff',
                  borderRadius: 12,
                  marginHorizontal: 24,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.13,
                  shadowRadius: 12,
                  elevation: 8,
                }, dropdownAnimatedStyle]}
              >
                {VOLUME_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={{
                      paddingVertical: 16,
                      paddingHorizontal: 18,
                      backgroundColor: volume === opt.value ? '#e0e7ef' : '#fff',
                      borderBottomWidth: 1,
                      borderBottomColor: '#f1f5f9',
                    }}
                    onPress={() => {
                      console.log('Selected from old dropdown:', opt.value);
                      setVolume(opt.value);
                      setTimeout(() => {
                      setShowVolumeDropdown(false);
                        volumeDropdownAnim.value = withTiming(0, { duration: 200 });
                      }, 100);
                    }}
                  >
                    <Text style={{ color: '#222', fontWeight: volume === opt.value ? 'bold' : 'normal', fontSize: 16 }}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </AnimatedView>
            )}
            <Text style={styles.classificationLabel}>Weight (kg)</Text>
            <TextInput
              style={[styles.formInput, { marginBottom: 12 }]}
              value={weight}
              onChangeText={setWeight}
              placeholder="Estimate weight"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
            />
            <Text style={styles.classificationLabel}>Height (cm)</Text>
            <TextInput
              style={[styles.formInput, { marginBottom: 12 }]}
              value={height}
              onChangeText={setHeight}
              placeholder="Enter height"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
            />
            <Text style={styles.classificationLabel}>Width (cm)</Text>
            <TextInput
              style={[styles.formInput, { marginBottom: 12 }]}
              value={width}
              onChangeText={setWidth}
              placeholder="Enter width"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
            />
            <Text style={styles.classificationLabel}>Breadth (cm)</Text>
            <TextInput
              style={[styles.formInput, { marginBottom: 12 }]}
              value={breadth}
              onChangeText={setBreadth}
              placeholder="Enter breadth"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
            />
            <Text style={styles.classificationLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.formInput, { marginBottom: 18 }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional details (optional)"
              placeholderTextColor="#aaa"
              multiline
            />
            <TouchableOpacity
              style={styles.correctButton}
              activeOpacity={0.85}
              onPress={() =>
                handleShowSuccess({
                  'Submission Type': 'Manual Verification',
                  'Waste Type': manualWasteType,
                  'Description': manualDescription,
                  'Volume': VOLUME_OPTIONS.find(opt => opt.value === volume)?.label || volume,
                  'Weight (kg)': weight,
                  'Height (cm)': height,
                  'Width (cm)': width,
                  'Breadth (cm)': breadth,
                  'Notes': notes,
                })
              }
            >
              <Text style={styles.correctButtonText}>Submit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.manualButton} activeOpacity={0.85} onPress={() => setShowManualForm(false)}>
              <Text style={styles.manualButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Volume/Weight Form for Correct Classification */}
      {!showSuccess && showVolumeForm && photoUri && (
        <View style={{ flex: 1, backgroundColor: Colors.dark }}>
          <AnimatedScrollView
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
          >
            {/* Modern Header */}
            <LinearGradient
              colors={[Colors.primaryDark, Colors.dark]}
              style={{ paddingTop: 20, paddingBottom: 30 }}
            >
              <Text style={[Typography.h1, { color: Colors.gray[50], textAlign: 'center', marginBottom: 8 }]}>
                Item Details
              </Text>
              <Text style={[Typography.body, { color: Colors.textSecondary, textAlign: 'center' }]}>
                Add information about this {result || 'furniture item'}
              </Text>
            </LinearGradient>
            
            <View style={{ paddingHorizontal: Spacing.lg }}>
              {/* Photo Preview Card */}
              <AnimatedCard
                variant="glass"
                style={{
                  marginTop: -20,
                  marginBottom: Spacing.lg,
                  padding: Spacing.md,
                }}
              >
                <View style={{ aspectRatio: 16/9, backgroundColor: Colors.darkSecondary, borderRadius: BorderRadius.lg, overflow: 'hidden' }}>
                  <Image source={{ uri: photoUri || undefined }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 80,
                      justifyContent: 'flex-end',
                      padding: Spacing.md,
                    }}
                  >
                    <Text style={[Typography.h4, { color: Colors.gray[50], fontSize: 18, fontWeight: '600' }]}>
                      {result || 'Bulk Items (Furniture, appliances)'}
                    </Text>
                  </LinearGradient>
          </View>
                
                {/* Location Card */}
                <View style={{ marginTop: Spacing.md }}>
                  <GlassmorphicCard style={{ padding: Spacing.md }}>
                    {locationLoading ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <ActivityIndicator size="small" color={Colors.primary} />
                        <Text style={[Typography.body, { color: Colors.textSecondary, marginLeft: Spacing.sm }]}>
                          Getting location...
                        </Text>
                      </View>
                    ) : captureLocation ? (
                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: Colors.primary + '20',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: Spacing.md,
                          }}>
                            <Ionicons name="location" size={20} color={Colors.primary} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[Typography.body, { color: Colors.textSecondary, fontSize: 14 }]}>Location</Text>
                            <Text style={[Typography.bodyBold, { color: Colors.textPrimary, fontSize: 16 }]}>
                              {LocationService.formatLocation(captureLocation)}
                            </Text>
                          </View>
                        </View>
                        <AnimatedButton
                          variant="outline"
                          size="small"
                          onPress={async () => {
                            setLocationLoading(true);
                            const newLocation = await LocationService.getCurrentLocation();
                            if (newLocation) {
                              setCaptureLocation(newLocation);
                            }
                            setLocationLoading(false);
                          }}
                          style={{ marginTop: Spacing.sm, alignSelf: 'flex-end' }}
                        >
                          <Text style={[Typography.caption, { color: Colors.primary }]}>Update</Text>
                        </AnimatedButton>
                      </View>
                    ) : (
            <TouchableOpacity
                        onPress={async () => {
                          setLocationLoading(true);
                          const location = await LocationService.getCurrentLocation();
                          if (location) {
                            setCaptureLocation(location);
                          }
                          setLocationLoading(false);
                        }}
                        style={{ alignItems: 'center', paddingVertical: Spacing.md }}
                      >
                        <View style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          backgroundColor: Colors.primary + '20',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: Spacing.sm,
                        }}>
                          <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
                        </View>
                        <Text style={[Typography.body, { color: Colors.primary }]}>Add Location</Text>
                      </TouchableOpacity>
                    )}
                  </GlassmorphicCard>
                </View>
              </AnimatedCard>

              {/* Form Fields */}
              <View style={{ gap: Spacing.lg }}>
                {/* Volume Selection */}
                <AnimatedCard variant="glass" style={{ padding: Spacing.lg }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md }}>
                    <View style={formStyles.iconContainer}>
                      <Text style={{ fontSize: 20 }}>📦</Text>
                    </View>
                    <View>
                      <Text style={[Typography.h4, { color: Colors.textPrimary, fontSize: 18 }]}>Volume</Text>
                      <Text style={[Typography.body, { color: Colors.textSecondary, fontSize: 14 }]}>Estimated size</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={formStyles.selectButton}
                    activeOpacity={0.8}
                    onPress={() => {
                      console.log('Volume button pressed, current state:', showVolumeDropdown);
                      setShowVolumeDropdown(!showVolumeDropdown);
                      volumeDropdownAnim.value = withTiming(showVolumeDropdown ? 0 : 1, { duration: 200 });
                    }}
                  >
                    <Text style={[Typography.bodyBold, { color: volume ? Colors.textPrimary : Colors.textTertiary, fontSize: 16 }]}>
                      {VOLUME_OPTIONS.find(opt => opt.value === volume)?.label || 'Select volume'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                </AnimatedCard>

                {/* Weight and Dimensions */}
                <AnimatedCard variant="glass" style={{ padding: Spacing.lg }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md }}>
                    <View style={formStyles.iconContainer}>
                      <Text style={{ fontSize: 20 }}>⚖️</Text>
                    </View>
                    <Text style={[Typography.h4, { color: Colors.textPrimary, fontSize: 18 }]}>Weight & Dimensions</Text>
                  </View>
                  
                  {/* Weight Input */}
                  <View style={[formStyles.inputContainer, { marginBottom: Spacing.md }]}>
                    <Text style={formStyles.inputLabel}>Weight (kg)</Text>
            <TextInput
                      style={formStyles.input}
              value={weight}
              onChangeText={setWeight}
                      placeholder="Estimated weight"
                      placeholderTextColor={Colors.textSecondary}
              keyboardType="numeric"
            />
                  </View>
                  
                  {/* Dimensions Inputs */}
                  <Text style={[Typography.body, { color: Colors.textSecondary, marginBottom: Spacing.sm, fontSize: 14 }]}>
                    Dimensions (cm)
                  </Text>
                  <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                    <View style={[formStyles.inputContainer, { flex: 1 }]}>
                      <Text style={formStyles.inputLabel}>Height</Text>
            <TextInput
                        style={formStyles.input}
              value={height}
              onChangeText={setHeight}
                        placeholder="0"
                        placeholderTextColor={Colors.textSecondary}
              keyboardType="numeric"
            />
                    </View>
                    <View style={[formStyles.inputContainer, { flex: 1 }]}>
                      <Text style={formStyles.inputLabel}>Width</Text>
            <TextInput
                        style={formStyles.input}
              value={width}
              onChangeText={setWidth}
                        placeholder="0"
                        placeholderTextColor={Colors.textSecondary}
              keyboardType="numeric"
            />
                    </View>
                    <View style={[formStyles.inputContainer, { flex: 1 }]}>
                      <Text style={formStyles.inputLabel}>Depth</Text>
            <TextInput
                        style={formStyles.input}
              value={breadth}
              onChangeText={setBreadth}
                        placeholder="0"
                        placeholderTextColor={Colors.textSecondary}
              keyboardType="numeric"
            />
                    </View>
                  </View>
                </AnimatedCard>

                {/* Notes */}
                <AnimatedCard variant="glass" style={{ padding: Spacing.lg }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md }}>
                    <View style={formStyles.iconContainer}>
                      <Text style={{ fontSize: 20 }}>📝</Text>
                    </View>
                    <Text style={[Typography.h4, { color: Colors.textPrimary, fontSize: 18 }]}>Additional Notes</Text>
                  </View>
                  <View style={formStyles.inputContainer}>
            <TextInput
                      style={[formStyles.input, { minHeight: 80, textAlignVertical: 'top' }]}
              value={notes}
              onChangeText={setNotes}
                      placeholder="Any additional details about the item..."
                      placeholderTextColor={Colors.textSecondary}
              multiline
                      numberOfLines={3}
                    />
                  </View>
                </AnimatedCard>

                {/* Action Buttons */}
                <View style={{ gap: Spacing.md, marginTop: Spacing.lg }}>
                  <AnimatedButton
                    variant="primary"
                    size="large"
              onPress={() =>
                handleShowSuccess({
                  'Submission Type': 'Volume & Weight Estimation',
                        'Item Type': result || 'Bulk Items',
                  'Volume': VOLUME_OPTIONS.find(opt => opt.value === volume)?.label || volume,
                  'Weight (kg)': weight,
                  'Height (cm)': height,
                  'Width (cm)': width,
                        'Depth (cm)': breadth,
                  'Notes': notes,
                })
              }
                    style={{ width: '100%' }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="checkmark-circle" size={20} color={Colors.gray[50]} />
                      <Text style={[Typography.bodyBold, { color: Colors.gray[50], marginLeft: Spacing.sm }]}>
                        Submit Details
                      </Text>
          </View>
                  </AnimatedButton>
                  
                  <AnimatedButton
                    variant="outline"
                    size="large"
                    onPress={() => setShowVolumeForm(false)}
                    style={{ width: '100%' }}
                  >
                    <Text style={[Typography.bodyBold, { color: Colors.primary }]}>Back</Text>
                  </AnimatedButton>
                </View>
              </View>
            </View>
          </AnimatedScrollView>
          
          {/* Volume Dropdown Overlay */}
          {showVolumeDropdown && (
            <>
              {/* Background overlay */}
              <TouchableOpacity 
                style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  bottom: 0,
                  backgroundColor: 'rgba(0,0,0,0.3)',
                }}
                activeOpacity={1}
                onPress={() => {
                  console.log('Background overlay pressed');
                  setShowVolumeDropdown(false);
                  volumeDropdownAnim.value = withTiming(0, { duration: 200 });
                }}
              />
              
              {/* Dropdown menu */}
              <View
                style={{
                  position: 'absolute',
                  left: Spacing.lg,
                  right: Spacing.lg,
                  top: 300, // Adjust this based on where your volume button is
                  backgroundColor: Colors.darkSecondary,
                  borderRadius: BorderRadius.md,
                  borderWidth: 1,
                  borderColor: Colors.darkTertiary,
                  ...Shadows.xl,
                  elevation: 20,
                }}
              >
                {VOLUME_OPTIONS.map((opt, index) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={{
                      paddingVertical: Spacing.lg,
                      paddingHorizontal: Spacing.lg,
                      backgroundColor: volume === opt.value ? Colors.primary + '20' : 'transparent',
                      borderBottomWidth: index < VOLUME_OPTIONS.length - 1 ? 1 : 0,
                      borderBottomColor: Colors.darkTertiary,
                      minHeight: 48,
                      justifyContent: 'center',
                    }}
                    activeOpacity={0.7}
                    onPress={() => {
                      console.log('Volume option selected:', opt.value);
                      setVolume(opt.value);
                      setShowVolumeDropdown(false);
                      volumeDropdownAnim.value = withTiming(0, { duration: 200 });
                    }}
                  >
                    <Text style={[Typography.body, { 
                      color: volume === opt.value ? Colors.primary : Colors.textPrimary,
                      fontWeight: volume === opt.value ? '600' : '400',
                      fontSize: 16
                    }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>
      )}

      {/* Classification Results */}
      {!showSuccess && !showManualForm && !showVolumeForm && photoUri && !isClassifying && (
        <View style={{ flex: 1, backgroundColor: Colors.dark }}>
          <AnimatedScrollView 
            contentContainerStyle={{ paddingBottom: 40 }} 
            showsVerticalScrollIndicator={false} 
            style={[{ flex: 1 }, fadeAnimatedStyle]}
          >
            {/* Header */}
            <LinearGradient
              colors={[Colors.primaryDark, Colors.dark]}
              style={{ paddingTop: 20, paddingBottom: 30 }}
            >
              <Text style={[Typography.h2, { color: Colors.gray[50], textAlign: 'center', marginBottom: 8 }]}>
                AI Classification Result
              </Text>
              <Text style={[Typography.body, { color: Colors.textSecondary, textAlign: 'center' }]}>
                Please verify the classification
              </Text>
            </LinearGradient>
            
            <View style={{ paddingHorizontal: Spacing.lg }}>
              {/* Photo and Classification Card */}
              <AnimatedCard
                variant="glass"
                style={{
                  marginTop: -20,
                  marginBottom: Spacing.lg,
                  padding: Spacing.lg,
                }}
              >
                {/* Photo */}
                <View style={{ 
                  aspectRatio: 16/9, 
                  backgroundColor: Colors.darkSecondary, 
                  borderRadius: BorderRadius.lg, 
                  overflow: 'hidden',
                  marginBottom: Spacing.lg
                }}>
                  <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
            </View>
                
                {/* Classification Info */}
                <View style={{ gap: Spacing.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      backgroundColor: Colors.primary + '20',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: Spacing.md,
                    }}>
                      <Text style={{ fontSize: 28 }}>🛋️</Text>
                    </View>
                <View style={{ flex: 1 }}>
                      <Text style={[Typography.body, { color: Colors.textSecondary, fontSize: 14 }]}>Detected Type</Text>
                      <Text style={[Typography.h3, { color: Colors.textPrimary, fontWeight: '700', fontSize: 22 }]}>
                        {result || 'Bulk Items (Furniture, appliances)'}
                      </Text>
                </View>
              </View>
                  
                  <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                    <View style={{
                      flex: 1,
                      backgroundColor: Colors.success + '10',
                      padding: Spacing.md,
                      borderRadius: BorderRadius.md,
                      alignItems: 'center'
                    }}>
                      <Text style={[Typography.body, { color: Colors.success, fontSize: 12 }]}>Confidence</Text>
                      <Text style={[Typography.h2, { color: Colors.success, fontWeight: '800', fontSize: 20 }]}>94%</Text>
                </View>
                    <View style={{
                      flex: 2,
                      backgroundColor: Colors.darkSecondary,
                      padding: Spacing.md,
                      borderRadius: BorderRadius.md,
                    }}>
                      <Text style={[Typography.body, { color: Colors.textSecondary, fontSize: 14 }]}>Description</Text>
                      <Text style={[Typography.bodyBold, { color: Colors.textPrimary, fontSize: 16 }]}>Large furniture item</Text>
              </View>
                </View>
              </View>
              </AnimatedCard>
              
              {/* Action Buttons */}
              <View style={{ gap: Spacing.md }}>
                <AnimatedButton
                  variant="primary"
                  size="large"
                  onPress={() => setShowVolumeForm(true)}
                  style={{ width: '100%' }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.gray[50]} />
                    <Text style={[Typography.bodyBold, { color: Colors.gray[50], marginLeft: Spacing.sm }]}>
                      Correct - Add Details
                    </Text>
            </View>
                </AnimatedButton>
                
                <AnimatedButton
                  variant="outline"
                  size="large"
                  onPress={() => setShowManualForm(true)}
                  style={{ width: '100%' }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="create-outline" size={20} color={Colors.primary} />
                    <Text style={[Typography.bodyBold, { color: Colors.primary, marginLeft: Spacing.sm }]}>
                      Manual Classification
                    </Text>
                  </View>
                </AnimatedButton>
              </View>
            </View>
          </AnimatedScrollView>
        </View>
      )}

      {/* Loading state */}
      {!showSuccess && isClassifying && (
        <View style={[styles.classifyingContainer, styles.classifyingShadow]}>
          <Text style={styles.classifyingHeading}>AI classification happening</Text>
          <ActivityIndicator size="large" color="#2196F3" style={{ marginVertical: 32 }} />
          <Text style={styles.classifyingText}>AI is identifying the waste type...</Text>
        </View>
      )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const VOLUME_OPTIONS = [
  { label: 'Small (Bag/Box)', value: 'small', weight: '5' },
  { label: 'Medium (Cart/Chair)', value: 'medium', weight: '15' },
  { label: 'Large (Sofa/Fridge)', value: 'large', weight: '40' },
  { label: 'Extra Large (Bulk)', value: 'xlarge', weight: '80' },
];