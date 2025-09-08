import React, { useEffect, useRef, useState } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View, Text, TouchableOpacity, Image, PermissionsAndroid, Platform, TextInput, ActivityIndicator, ScrollView, Animated, Dimensions } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  CameraAI: undefined;
};
const Stack = createStackNavigator<RootStackParamList>();

type User = {
  name: string;
  license: string;
  profileIcon: string | null;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';
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
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            <Stack.Screen name="Login">
              {() => <LoginScreen onLogin={handleLogin} />}
            </Stack.Screen>
          ) : (
            <>
              <Stack.Screen name="Home">
                {({ navigation }: { navigation: StackNavigationProp<RootStackParamList, 'Home'> }) => (
                  <AppContent user={user} navigation={navigation} />
                )}
              </Stack.Screen>
              <Stack.Screen name="CameraAI" component={CameraAIScreen} />
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
};
function AppContent({ user, navigation }: AppContentProps) {
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const camera = useRef<any>(null);
  const devices = useCameraDevices();
  const device = Array.isArray(devices)
    ? devices.find((d) => d.position === 'back') || devices[0]
    : undefined;

  // Request camera permission on mount
  useEffect(() => {
    async function requestCameraPermission() {
      let granted = false;
      if (Platform.OS === 'android') {
        try {
          const result = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA,
            {
              title: 'Camera Permission',
              message: 'This app needs access to your camera to take photos.',
              buttonPositive: 'OK',
            }
          );
          granted = result === PermissionsAndroid.RESULTS.GRANTED;
        } catch (e) {
          granted = false;
        }
      } else {
        // iOS: use react-native-vision-camera API
        try {
          // @ts-ignore
          const status = await Camera.requestCameraPermission();
          granted = status === 'authorized';
        } catch (e) {
          granted = false;
        }
      }
      setHasPermission(granted);
      setPermissionRequested(true);
    }
    requestCameraPermission();
  }, []);

  const takePhoto = async () => {
    if (camera.current == null) return;
    // @ts-ignore
    const photo = await camera.current.takePhoto({ flash: 'off' });
    setPhotoUri('file://' + photo.path);
    setShowCamera(false);
  };

  if (!showCamera) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
        <AppHeader user={user} onBack={() => navigation.goBack()} onSignOut={() => { setIsAuthenticated(false); setUser(null); }} />
        <View style={{ width: '100%', alignItems: 'flex-start', paddingLeft: 28, marginTop: 10, marginBottom: 8 }}>
          <Text style={{ color: '#64748b', fontSize: 15, fontWeight: '600', letterSpacing: 0.5 }}>
            Home
          </Text>
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingVertical: 24,
            paddingHorizontal: 0,
            alignItems: 'center',
            justifyContent: 'flex-start',
            minHeight: '100%',
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.header, { maxWidth: 420, width: '95%' }]}> 
            <View style={styles.profileIcon}>
              <Text style={{ fontSize: 32 }}>🧑‍🚚</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { maxWidth: 200 }]} numberOfLines={1} ellipsizeMode="tail">Hi, {user?.name || 'Driver'} 👋</Text>
              <Text style={[styles.userLicense, { maxWidth: 200 }]} numberOfLines={1} ellipsizeMode="tail">License: {user?.license || 'ABC123456'}</Text>
            </View>
          </View>
          <View style={[styles.locationCard, { maxWidth: 420, width: '95%' }]}> 
            <View style={styles.locationIconContainer}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationLabel}>Current Location</Text>
            </View>
            <View style={styles.locationTextContainer}>
              <Text style={[styles.locationText, { maxWidth: 220 }]} numberOfLines={1} ellipsizeMode="tail">123 Main Street, City, Country</Text>
            </View>
          </View>
          <View style={[styles.captureCard, { maxWidth: 420, width: '95%' }]}> 
            <View style={styles.cameraIconContainer}>
              <Text style={styles.cameraIcon}>🤖</Text>
            </View>
            <Text style={[styles.captureTitle, { textAlign: 'center', maxWidth: 260, alignSelf: 'center' }]}>Camera & AI Classification</Text>
            <TouchableOpacity
              style={styles.takePhotoButton}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('CameraAI')}
            >
              <Text style={styles.takePhotoButtonText}>Open Camera & AI</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.centered}>
        <Text>Loading camera...</Text>
      </View>
    );
  }
  if (!hasPermission && permissionRequested) {
    return (
      <View style={styles.centered}>
        <Text>No camera permission. Please enable camera access in your device settings.</Text>
      </View>
    );
  }
  if (!hasPermission && !permissionRequested) {
    return (
      <View style={styles.centered}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      {photoUri ? (
        <View style={[styles.previewContainer, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}> 
          <Image
            source={{ uri: photoUri || undefined }}
            style={{ width: '100%', height: '100%', flex: 1, resizeMode: 'contain', borderRadius: 18, borderWidth: 2, borderColor: '#2196F3', backgroundColor: '#222', alignSelf: 'center' }}
          />
          <TouchableOpacity style={styles.button} onPress={() => setPhotoUri(null)}>
            <Text style={styles.buttonText}>Take Another</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Camera
            ref={camera}
            style={styles.camera}
            device={device}
            isActive={true}
            photo={true}
          />
          <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
            <Text style={styles.captureText}>📸</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

type LoginScreenProps = {
  onLogin: (username: string, password: string) => void;
};
function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  return (
    <View style={loginStyles.gradientBg}>
      <View style={loginStyles.loginCard}>
        <Text style={loginStyles.avatar}>🧑‍🚚</Text>
        <Text style={loginStyles.title}>Welcome, Driver!</Text>
        <Text style={loginStyles.subtitle}>Sign in to continue</Text>
        <View style={loginStyles.inputContainer}>
          <Text style={loginStyles.label}>Username</Text>
          <TextInput
            style={loginStyles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Enter username"
            autoCapitalize="none"
            placeholderTextColor="#aaa"
          />
        </View>
        <View style={loginStyles.inputContainer}>
          <Text style={loginStyles.label}>Password</Text>
          <TextInput
            style={loginStyles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            secureTextEntry
            placeholderTextColor="#aaa"
          />
        </View>
        {error ? <Text style={loginStyles.error}>{error}</Text> : null}
        <TouchableOpacity
          style={loginStyles.button}
          activeOpacity={0.8}
          onPress={() => {
            if (!username || !password) {
              setError('Please enter username and password');
              return;
            }
            setError('');
            onLogin(username, password);
          }}
        >
          <Text style={loginStyles.buttonText}>Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
// Login screen styles
const loginStyles = StyleSheet.create({
  gradientBg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'linear-gradient(135deg, #2196F3 0%, #6DD5FA 100%)', // fallback for now
    paddingHorizontal: 24,
  },
  loginCard: {
    width: '100%',
    maxWidth: 370,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  avatar: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 18,
  },
  label: {
    fontSize: 15,
    color: '#2196F3',
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
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
  button: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  error: {
    color: 'red',
    marginBottom: 8,
    fontSize: 14,
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

// Move Header to top-level and use on all screens
function AppHeader({ onBack, onSignOut, user }: { onBack?: () => void; onSignOut?: () => void; user?: User | null }) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      paddingVertical: 14,
      paddingHorizontal: 18,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.10,
      shadowRadius: 12,
      elevation: 8,
      marginBottom: 8,
    }}>
      {onBack ? (
        <TouchableOpacity
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: '#f1f5f9',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 10,
          }}
          onPress={onBack}
        >
          <Text style={{ fontSize: 22, color: '#2563eb', fontWeight: 'bold' }}>←</Text>
        </TouchableOpacity>
      ) : <View style={{width: 38, marginRight: 10}} />}
      {/* Profile Icon/Logo */}
      <View style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#e0e7ef',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 4,
      }}>
        {/* Replace emoji with your logo if available */}
        <Text style={{ fontSize: 26 }}>🧑‍🚚</Text>
      </View>
      {/* Name and License, responsive */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            color: '#0f172a',
            fontWeight: 'bold',
            fontSize: SCREEN_WIDTH < 350 ? 13 : SCREEN_WIDTH < 400 ? 15 : 17,
            maxWidth: SCREEN_WIDTH < 350 ? 80 : SCREEN_WIDTH < 400 ? 120 : 160,
          }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {user?.name || 'Driver'}
        </Text>
        <Text
          style={{
            color: '#2563eb',
            fontSize: SCREEN_WIDTH < 350 ? 10 : SCREEN_WIDTH < 400 ? 12 : 13,
            maxWidth: SCREEN_WIDTH < 350 ? 80 : SCREEN_WIDTH < 400 ? 120 : 160,
            fontWeight: '600',
            marginTop: 1,
          }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {user?.license || 'ABC123456'}
        </Text>
      </View>
      <TouchableOpacity
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: '#f1f5f9',
          justifyContent: 'center',
          alignItems: 'center',
          marginLeft: 10,
        }}
        onPress={onSignOut}
        accessibilityLabel="Sign out"
      >
        <Text style={{ fontSize: 20, color: '#ef4444', fontWeight: 'bold' }}>⎋</Text>
      </TouchableOpacity>
    </View>
  );
}

// Camera & AI Classification Screen
type CameraAIScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'CameraAI'>;
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
      {/* Constant header at top */}
      {/* <AppHeader user={user} onSignOut={onSignOut} /> */}
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

function CameraAIScreen({ navigation, user, onSignOut }) {
  const [photoUri, setPhotoUri] = useState<string | null>(null); // Only set after confirmation
  const [isClassifying, setIsClassifying] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showVolumeForm, setShowVolumeForm] = useState(false);
  const [result, setResult] = useState<string>('');
  const [showConfirmPhoto, setShowConfirmPhoto] = useState(false);
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null); // Holds photo before confirmation
  const [showSuccess, setShowSuccess] = useState(false);
  const [submittedInfo, setSubmittedInfo] = useState<Record<string, string>>({});

  // Manual form state
  const [manualWasteType, setManualWasteType] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  // Volume/weight form state
  const [volume, setVolume] = useState('');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  // Dropdown state
  const [showVolumeDropdown, setShowVolumeDropdown] = useState(false);
  const volumeDropdownAnim = useRef(new Animated.Value(0)).current;
  // Manual dimensions
  const [height, setHeight] = useState('');
  const [width, setWidth] = useState('');
  const [breadth, setBreadth] = useState('');
  // Animate dropdown open/close
  useEffect(() => {
    if (showVolumeDropdown) {
      Animated.timing(volumeDropdownAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(volumeDropdownAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }
  }, [showVolumeDropdown]);

  // Auto-suggest weight when volume changes
  useEffect(() => {
    const found = VOLUME_OPTIONS.find(opt => opt.value === volume);
    if (found) setWeight(found.weight);
  }, [volume]);

  const camera = useRef<any>(null);
  const devices = useCameraDevices();
  const device = Array.isArray(devices)
    ? devices.find((d) => d.position === 'back') || devices[0]
    : undefined;
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (!isClassifying && photoUri) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [isClassifying, photoUri]);

  const takePhoto = async () => {
    if (camera.current == null) return;
    // @ts-ignore
    const photo = await camera.current.takePhoto({ flash: 'off' });
    setPendingPhotoUri('file://' + photo.path);
    setShowConfirmPhoto(true);
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
  const handleShowSuccess = (info: Record<string, string>) => {
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

  return (
    <View style={{ flex: 1, backgroundColor: '#10131a' }}>
      <AppHeader user={user} onBack={() => navigation.goBack()} onSignOut={onSignOut} />
      <View style={{ width: '100%', alignItems: 'flex-start', paddingLeft: 28, marginTop: 10, marginBottom: 8 }}>
        <Text style={{ color: '#64748b', fontSize: 15, fontWeight: '600', letterSpacing: 0.5 }}>
          Camera & AI Classification
        </Text>
      </View>
      {/* Success Screen */}
      {showSuccess && (
        <SuccessScreen
          info={submittedInfo}
          onBackToHome={handleBackToHome}
          photoUri={photoUri}
          user={user}
          onSignOut={onSignOut}
        />
      )}
      {/* Show camera first, only show forms/classification after photo is taken */}
      {!showSuccess && !pendingPhotoUri && !photoUri && !isClassifying && !showManualForm && !showVolumeForm && device && !showConfirmPhoto && (
        <>
          <Camera
            ref={camera}
            style={{ flex: 1, borderRadius: 24, margin: 16, overflow: 'hidden' }}
            device={device}
            isActive={true}
            photo={true}
          />
          <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
            <Text style={styles.captureText}>📸</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, { marginTop: 24 }]} onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
        </>
      )}
      {/* Photo confirmation screen (separate step, only before classification) */}
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
              onPress={() => setShowVolumeDropdown(true)}
            >
              <Text style={{ color: volume ? '#222' : '#aaa', fontSize: 16 }}>
                {VOLUME_OPTIONS.find(opt => opt.value === volume)?.label || 'Select volume'}
              </Text>
              <Text style={{ fontSize: 18, color: '#2563eb', marginLeft: 8 }}>▼</Text>
            </TouchableOpacity>
            {showVolumeDropdown && (
              <Animated.View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 180,
                  zIndex: 100,
                  backgroundColor: '#fff',
                  borderRadius: 12,
                  marginHorizontal: 24,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.13,
                  shadowRadius: 12,
                  elevation: 8,
                  opacity: volumeDropdownAnim,
                  transform: [{ scale: volumeDropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) }],
                }}
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
                      setVolume(opt.value);
                      setShowVolumeDropdown(false);
                    }}
                  >
                    <Text style={{ color: '#222', fontWeight: volume === opt.value ? 'bold' : 'normal', fontSize: 16 }}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </Animated.View>
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
        <ScrollView contentContainerStyle={[styles.resultScrollContent, { paddingTop: 10, alignItems: 'center' }]}> 
          <Text style={styles.verifyHeading}>Volume & Weight Estimation</Text>
          <View style={styles.sectionDivider} />
          <View style={{ width: '100%', aspectRatio: 1, maxWidth: 500, marginBottom: 24, alignSelf: 'center', backgroundColor: '#222', borderRadius: 22, borderWidth: 2, borderColor: '#2196F3', overflow: 'hidden' }}>
            <Image source={{ uri: photoUri || undefined }} style={{ width: '100%', height: '100%', resizeMode: 'contain', borderRadius: 22 }} />
          </View>
          <View style={styles.sectionDivider} />
          <View style={{ width: SCREEN_WIDTH > 420 ? 400 : '100%' }}>
            <Text style={styles.classificationLabel}>Volume</Text>
            <TouchableOpacity
              style={[styles.formInput, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 }]}
              activeOpacity={0.8}
              onPress={() => setShowVolumeDropdown(true)}
            >
              <Text style={{ color: volume ? '#222' : '#aaa', fontSize: 16 }}>
                {VOLUME_OPTIONS.find(opt => opt.value === volume)?.label || 'Select volume'}
              </Text>
              <Text style={{ fontSize: 18, color: '#2563eb', marginLeft: 8 }}>▼</Text>
            </TouchableOpacity>
            {showVolumeDropdown && (
              <Animated.View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 180,
                  zIndex: 100,
                  backgroundColor: '#fff',
                  borderRadius: 12,
                  marginHorizontal: 24,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.13,
                  shadowRadius: 12,
                  elevation: 8,
                  opacity: volumeDropdownAnim,
                  transform: [{ scale: volumeDropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) }],
                }}
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
                      setVolume(opt.value);
                      setShowVolumeDropdown(false);
                    }}
                  >
                    <Text style={{ color: '#222', fontWeight: volume === opt.value ? 'bold' : 'normal', fontSize: 16 }}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </Animated.View>
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
                  'Submission Type': 'Volume & Weight Estimation',
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
            <TouchableOpacity style={styles.manualButton} activeOpacity={0.85} onPress={() => setShowVolumeForm(false)}>
              <Text style={styles.manualButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
      {/* ...existing classification UI, with button handlers: */}
      {!showSuccess && !showManualForm && !showVolumeForm && photoUri && !isClassifying && (
        <>
          {/* ...classification UI... */}
          <Animated.ScrollView contentContainerStyle={styles.resultScrollContent} showsVerticalScrollIndicator={false} style={{ opacity: fadeAnim }}>
            <Text style={styles.verifyHeading}>Verify Classification</Text>
            <View style={styles.sectionDivider} />
            <View style={{ width: '100%', aspectRatio: 1, maxWidth: 500, marginBottom: 24, alignSelf: 'center', backgroundColor: '#222', borderRadius: 22, borderWidth: 2, borderColor: '#2196F3', overflow: 'hidden' }}>
              <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%', resizeMode: 'contain', borderRadius: 22 }} />
            </View>
            <View style={styles.sectionDivider} />
            <View style={styles.classificationBlock}>
              <View style={styles.classificationIconRow}>
                <Text style={styles.classificationMainIcon}>🛋️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.classificationTitleLabel}>Waste Type</Text>
                  <Text style={styles.classificationTitle}>{result || 'Bulk Items (Furniture, appliances)'}</Text>
                </View>
              </View>
              <View style={styles.classificationRow}>
                <Text style={styles.classificationRowIcon}>📈</Text>
                <View>
                  <Text style={styles.classificationLabel}>Confidence</Text>
                  <Text style={styles.confidenceText}><Text style={{ color: '#43e97b', fontWeight: 'bold' }}>94%</Text></Text>
                </View>
              </View>
              <View style={styles.classificationRow}>
                <Text style={styles.classificationRowIcon}>📝</Text>
                <View style={styles.classificationDescContainer}>
                  <Text style={styles.classificationLabel}>Description</Text>
                  <Text style={styles.classificationDesc}>Large furniture item.</Text>
                </View>
              </View>
            </View>
            <View style={styles.sectionDivider} />
            <TouchableOpacity style={styles.correctButton} activeOpacity={0.85} onPress={() => setShowVolumeForm(true)}>
              <Text style={styles.correctButtonText}>✅ Correct Classification</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.manualButton} activeOpacity={0.85} onPress={() => setShowManualForm(true)}>
              <Text style={styles.manualButtonText}>🛠️ Manually verify</Text>
            </TouchableOpacity>
          </Animated.ScrollView>
        </>
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
  );
}

const VOLUME_OPTIONS = [
  { label: 'Small (Bag/Box)', value: 'small', weight: '5' },
  { label: 'Medium (Cart/Chair)', value: 'medium', weight: '15' },
  { label: 'Large (Sofa/Fridge)', value: 'large', weight: '40' },
  { label: 'Extra Large (Bulk)', value: 'xlarge', weight: '80' },
];
