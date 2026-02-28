import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

// Parse coordinates from string (format: "lat,lon")
export function parseCoordinates(coords: string): { lat: number; lon: number } | null {
  try {
    const [lat, lon] = coords.split(',').map(Number);
    if (isNaN(lat) || isNaN(lon)) return null;
    return { lat, lon };
  } catch {
    return null;
  }
}

// Simple geocoding function using a free geocoding service
export async function geocodeAddress(address: string): Promise<{ lat: number; lon: number } | null> {
  if (!address) {
    console.log('❌ No address provided for geocoding');
    return null;
  }
  
  try {
    console.log(`🌍 Geocoding address: "${address}"`);
    
    // Use OpenStreetMap Nominatim API (free, no API key required)
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    console.log(`🔗 Geocoding URL: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn('❌ Geocoding failed:', response.statusText);
      return null;
    }
    
    const data = await response.json();
    console.log('📡 Geocoding response:', data);
    
    if (data && data.length > 0) {
      const result = data[0];
      const coords = {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon)
      };
      console.log(`✅ Geocoded "${address}" to:`, coords);
      return coords;
    }
    
    console.log(`❌ No results found for address: "${address}"`);
    return null;
  } catch (error) {
    console.warn('❌ Geocoding error:', error);
    return null;
  }
}
