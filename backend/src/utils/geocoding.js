/**
 * Geocoding utility using Nominatim (OpenStreetMap)
 * Free service, no API key required
 */

export const geocodeAddress = async (address, city, state, zipCode) => {
  try {
    // Construct the full address
    const fullAddress = `${address}, ${city}, ${state} ${zipCode}`;
    
    // Use Nominatim geocoding service
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`;
    
    console.log('🔍 Geocoding address:', fullAddress);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Roomzi-App/1.0' // Required by Nominatim terms of service
      }
    });
    
    if (!response.ok) {
      throw new Error(`Geocoding request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];
      const coordinates = {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon)
      };
      
      console.log('✅ Geocoding successful:', coordinates);
      return JSON.stringify(coordinates);
    } else {
      console.log('⚠️ No geocoding results found for:', fullAddress);
      return null;
    }
  } catch (error) {
    console.error('❌ Geocoding error:', error);
    return null;
  }
};

/**
 * Fallback coordinates for common cities when geocoding fails
 */
export const getFallbackCoordinates = (city, state) => {
  const fallbackCoords = {
    'Toronto': { lat: 43.6532, lng: -79.3832 },
    'San Francisco': { lat: 37.7749, lng: -122.4194 },
    'New York': { lat: 40.7128, lng: -74.0060 },
    'Los Angeles': { lat: 34.0522, lng: -118.2437 },
    'Chicago': { lat: 41.8781, lng: -87.6298 },
    'Vancouver': { lat: 49.2827, lng: -123.1207 },
    'Montreal': { lat: 45.5017, lng: -73.5673 },
    'Calgary': { lat: 51.0447, lng: -114.0719 },
    'Edmonton': { lat: 53.5461, lng: -113.4938 },
    'Ottawa': { lat: 45.4215, lng: -75.6972 }
  };
  
  const key = `${city}, ${state}`.toLowerCase();
  for (const [cityKey, coords] of Object.entries(fallbackCoords)) {
    if (key.includes(cityKey.toLowerCase())) {
      console.log(`📍 Using fallback coordinates for ${cityKey}:`, coords);
      return JSON.stringify(coords);
    }
  }
  
  // Default to Toronto if no match
  console.log('📍 Using default coordinates (Toronto)');
  return JSON.stringify({ lat: 43.6532, lng: -79.3832 });
}; 