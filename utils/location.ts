import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { webLocationFallback } from './webLocationPolyfill';

export const LocationService = {
  // Request location permissions
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  },

  // Get current location
  async getCurrentLocation() {
    try {
      // For web platform, use native browser API
      if (Platform.OS === 'web') {
        console.log('Using web location API');
        const webLocation = await webLocationFallback.getCurrentPosition();
        if (webLocation) {
          console.log('Web location received:', webLocation);
          return {
            latitude: webLocation.latitude,
            longitude: webLocation.longitude,
            address: webLocation.address || `${webLocation.latitude.toFixed(6)}, ${webLocation.longitude.toFixed(6)}`,
          };
        }
        return null;
      }

      // For mobile platforms, use expo-location
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('Location permission denied');
        return null;
      }

      console.log('Getting current location...');
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 10000, // 10 second timeout
        maximumAge: 1000, // Accept cached position up to 1 second old
      });

      if (!location) {
        console.log('No location received');
        return null;
      }

      console.log('Location received:', location.coords);

      // Try to get address from coordinates
      let address = undefined;
      try {
        console.log('Attempting reverse geocoding for:', location.coords);
        const reverseGeocodeResults = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        console.log('Reverse geocode results:', reverseGeocodeResults);
        
        if (reverseGeocodeResults && reverseGeocodeResults.length > 0) {
          const result = reverseGeocodeResults[0];
          
          // Build a comprehensive address string
          const addressParts = [];
          
          // Add street number and name
          if (result.streetNumber) addressParts.push(result.streetNumber);
          if (result.street) addressParts.push(result.street);
          else if (result.name) addressParts.push(result.name);
          
          // Add district/sublocality if available
          if (result.district) addressParts.push(result.district);
          else if (result.subregion) addressParts.push(result.subregion);
          
          // Add city
          if (result.city) addressParts.push(result.city);
          
          // Add region/state
          if (result.region) addressParts.push(result.region);
          
          // Add postal code
          if (result.postalCode) addressParts.push(result.postalCode);
          
          // Add country
          if (result.country) addressParts.push(result.country);
          
          address = addressParts.filter(Boolean).join(', ');
          
          // If we still don't have a good address, try alternative formatting
          if (!address || address.length < 10) {
            address = [
              result.name,
              result.city || result.subregion,
              result.region,
              result.country,
            ].filter(Boolean).join(', ');
          }
          
          console.log('Formatted address:', address);
        }
      } catch (e) {
        console.log('Could not get address:', e);
      }
      
      // Only use coordinates as last resort
      if (!address || address.length < 10) {
        address = `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`;
      }

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address,
      };
    } catch (error) {
      console.error('Error getting location:', error);
      
      // Try web fallback as last resort
      if (Platform.OS === 'web') {
        console.log('Trying web fallback after error');
        const webLocation = await webLocationFallback.getCurrentPosition();
        if (webLocation) {
          return {
            latitude: webLocation.latitude,
            longitude: webLocation.longitude,
            address: webLocation.address || `${webLocation.latitude.toFixed(6)}, ${webLocation.longitude.toFixed(6)}`,
          };
        }
      }
      
      return null;
    }
  },

  // Format location for display
  formatLocation(location: { latitude: number; longitude: number; address?: string }) {
    if (location.address && location.address.length > 10 && !location.address.match(/^\d+\.\d+,\s*\d+\.\d+$/)) {
      // Return address if it's not just coordinates
      return location.address;
    }
    // Fall back to coordinates
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  },
  
  // Get short location for display
  getShortLocation(location: { latitude: number; longitude: number; address?: string }) {
    if (location.address && location.address.length > 10 && !location.address.match(/^\d+\.\d+,\s*\d+\.\d+$/)) {
      // Extract city and country if possible
      const parts = location.address.split(',').map(s => s.trim());
      if (parts.length >= 2) {
        // Try to get city and country (usually last 2 parts)
        return parts.slice(-2).join(', ');
      }
      return location.address;
    }
    return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  }
};
