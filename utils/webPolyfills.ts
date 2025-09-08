// Web polyfills for React Native components
import { Platform } from 'react-native';

// Polyfill for web platform to avoid prototype errors
if (Platform.OS === 'web') {
  // Add any necessary web polyfills here
  if (typeof global !== 'undefined') {
    global.navigator = global.navigator || {};
    global.navigator.userAgent = global.navigator.userAgent || 'Mozilla/5.0';
  }
}

export {};
