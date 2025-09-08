# Camera Furniture Detection App - Expo Migration

This React Native camera app has been successfully migrated from React Native CLI to Expo. The app allows users to capture photos of furniture items and uses AI classification to identify and categorize them.

## 🚀 Features

- **Camera Integration**: Take photos using Expo Camera
- **AI Classification**: Simulated AI detection for furniture items
- **Manual Verification**: Users can manually verify and correct AI classifications
- **Volume & Weight Estimation**: Input dimensions and weight for detected items
- **User Authentication**: Simple login system
- **Cross-Platform**: Runs on iOS, Android, and Web

## 📱 Migration Changes

### Major Changes Made:

1. **Camera Library**: Replaced `react-native-vision-camera` with `expo-camera`
2. **Permissions**: Updated to use Expo's permission system
3. **Dependencies**: Updated all packages to Expo-compatible versions
4. **Configuration**: Replaced React Native CLI config with Expo app.json
5. **Build System**: Now uses Expo build system instead of native builds

### Key Dependencies:

- `expo`: ~53.0.0
- `expo-camera`: ~16.1.11 (Updated to use CameraView API)
- `expo-media-library`: ~17.1.7
- `@react-navigation/native`: ^6.1.9
- `@react-navigation/stack`: ^6.3.20
- `react`: 19.0.0
- `react-native`: 0.79.5

## 🛠️ Setup Instructions

### Prerequisites

- Node.js (18+)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   # or
   expo start
   ```

3. **Run on specific platforms:**
   ```bash
   # iOS Simulator
   npm run ios
   
   # Android Emulator
   npm run android
   
   # Web Browser
   npm run web
   ```

### Testing on Device

1. **Install Expo Go** on your mobile device
2. **Scan QR code** displayed in terminal/browser
3. **Grant camera permissions** when prompted

## 📋 App Structure

```
├── App.tsx                 # Main application component
├── app.json               # Expo configuration
├── package.json           # Dependencies and scripts
├── babel.config.js        # Babel configuration for Expo
├── metro.config.js        # Metro bundler configuration
├── index.js              # App entry point
└── assets/               # App icons and splash screens
    ├── icon.png
    ├── adaptive-icon.png
    ├── splash.png
    └── favicon.png
```

## 🎯 Key Components

### 1. Login Screen
- Simple username/password authentication
- Responsive design with driver-focused UI

### 2. Home Screen
- User profile display
- Location information
- Camera access button

### 3. Camera AI Screen
- Camera capture functionality
- Photo confirmation
- AI classification simulation
- Manual verification forms
- Volume/weight estimation

## 📸 Camera Functionality

The app uses `expo-camera` (SDK 53) with the following features:

- **Photo Capture**: High-quality image capture using CameraView API
- **Permission Handling**: Modern permission handling with useCameraPermissions hook
- **Cross-Platform**: Works on iOS, Android, and Web
- **Error Handling**: Graceful error handling for camera failures
- **New Architecture**: Compatible with React Native's New Architecture (enabled by default in SDK 53)

## 🤖 AI Classification

Currently implements a simulated AI classification system:

- **Mock Detection**: Returns "Bulk Items (Furniture, appliances)"
- **Confidence Score**: Shows 94% confidence
- **Classification Time**: 5-second simulation delay
- **Extensible**: Ready for integration with real AI services

## 🔧 Customization

### Adding Real AI Classification

Replace the simulated classification in `CameraAIScreen`:

```typescript
// Replace this simulation:
setTimeout(() => {
  setIsClassifying(false);
  setResult('Bulk Items (Furniture, appliances)');
}, 5000);

// With actual AI service call:
const classifyImage = async (imageUri: string) => {
  try {
    const response = await fetch('YOUR_AI_ENDPOINT', {
      method: 'POST',
      body: formData,
    });
    const result = await response.json();
    setResult(result.classification);
  } catch (error) {
    console.error('Classification error:', error);
  }
};
```

### Updating App Icons

Replace placeholder files in `assets/` with actual images:

- `icon.png`: 1024x1024px app icon
- `adaptive-icon.png`: 1024x1024px Android adaptive icon
- `splash.png`: Splash screen image
- `favicon.png`: 48x48px web favicon

## 🚀 Building for Production

### Using Expo Application Services (EAS)

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Configure EAS:**
   ```bash
   eas build:configure
   ```

3. **Build for app stores:**
   ```bash
   # iOS
   npm run build:ios
   
   # Android
   npm run build:android
   ```

4. **Submit to app stores:**
   ```bash
   # iOS App Store
   npm run submit:ios
   
   # Google Play Store
   npm run submit:android
   ```

## 📱 Permissions

The app requires the following permissions:

### iOS (Info.plist)
- `NSCameraUsageDescription`: Camera access for furniture detection
- `NSPhotoLibraryUsageDescription`: Photo library access

### Android (AndroidManifest.xml)
- `android.permission.CAMERA`: Camera access
- `android.permission.WRITE_EXTERNAL_STORAGE`: Save photos
- `android.permission.READ_EXTERNAL_STORAGE`: Read photos

## 🐛 Troubleshooting

### Common Issues:

1. **Camera not working:**
   - Check permissions in device settings
   - Restart the Expo development server
   - Clear Expo Go app cache

2. **Build errors:**
   - Run `expo doctor` to check for issues
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`

3. **Metro bundler issues:**
   - Clear Metro cache: `expo start -c`
   - Reset Expo cache: `expo start --clear`

## 📞 Support

For issues and questions:

1. Check Expo documentation: https://docs.expo.dev/
2. Visit Expo forums: https://forums.expo.dev/
3. Check React Navigation docs: https://reactnavigation.org/

## 🎉 Migration Complete!

Your React Native camera app has been successfully migrated to Expo! The app now benefits from:

- ✅ Simplified development workflow
- ✅ Easy over-the-air updates
- ✅ Cross-platform compatibility (iOS, Android, Web)
- ✅ Streamlined build process
- ✅ Better developer experience
- ✅ Web support with react-native-web
- ✅ Latest Expo SDK 53 features
- ✅ React Native 0.79 with New Architecture support

**✨ Ready to Use:**
- All dependencies upgraded to Expo SDK 53
- Camera functionality updated to use CameraView API
- Web support enabled with required dependencies
- EAS Build configuration ready for production
- New Architecture compatible (React Native 0.79)

## 🚀 **Recent Upgrade to SDK 53:**

Your app has been upgraded from Expo SDK 50 to SDK 53, bringing:

- **React Native 0.79**: Latest React Native version with performance improvements
- **New Architecture**: Enabled by default for better performance and future-proofing
- **Updated Camera API**: Using the modern CameraView component with useCameraPermissions hook
- **Enhanced Build Performance**: Up to 25% faster Android builds with prebuilt Expo modules
- **Improved Edge-to-Edge Support**: Better Android layout handling

Start developing with `npm start` and enjoy the improved Expo workflow!

**🚀 Quick Start:**
```bash
npm start          # Start development server
npm run web        # Run on web browser
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
```