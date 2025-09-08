// Web-specific location handling
export const webLocationFallback = {
  async getCurrentPosition(): Promise<{ latitude: number; longitude: number; address?: string } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.log('Geolocation is not supported by this browser');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Try to get address using a free geocoding service
          let address: string | undefined;
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
              {
                headers: {
                  'User-Agent': 'CameraApp/1.0'
                }
              }
            );
            
            if (response.ok) {
              const data = await response.json();
              console.log('Nominatim response:', data);
              
              if (data.address) {
                const addr = data.address;
                const parts = [];
                
                // Build address from components
                if (addr.house_number) parts.push(addr.house_number);
                if (addr.road || addr.street) parts.push(addr.road || addr.street);
                if (addr.suburb || addr.neighbourhood) parts.push(addr.suburb || addr.neighbourhood);
                if (addr.city || addr.town || addr.village) parts.push(addr.city || addr.town || addr.village);
                if (addr.state || addr.province) parts.push(addr.state || addr.province);
                if (addr.postcode) parts.push(addr.postcode);
                if (addr.country) parts.push(addr.country);
                
                address = parts.filter(Boolean).join(', ');
                
                // Use display_name as fallback
                if (!address || address.length < 10) {
                  address = data.display_name;
                }
              }
            }
          } catch (error) {
            console.log('Could not fetch address from Nominatim:', error);
          }
          
          resolve({
            latitude,
            longitude,
            address,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 1000,
        }
      );
    });
  },
};
