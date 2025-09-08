# Camera Furniture Detection App 
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


npm start          # Start development server
npm run web        # Run on web browser
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
```
