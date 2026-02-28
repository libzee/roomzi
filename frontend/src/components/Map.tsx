import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Property } from '@/data/sampleProperties';
import { Card } from '@/components/ui/card';
import { MapPin, Home } from 'lucide-react';

interface MapProps {
  properties: Property[];
  onPropertyClick: (propertyId: string) => void;
  mapboxToken?: string;
  onTokenSubmit?: (token: string) => void;
  showUserLocation?: boolean;
}

const Map: React.FC<MapProps> = ({ properties, onPropertyClick, mapboxToken, onTokenSubmit, showUserLocation = true }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Function to get user's current location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationError(null);
        console.log('📍 User location obtained:', { lat: latitude, lng: longitude });
        
        // Center map based on context (property location vs user location)
        if (map.current) {
          const validProperties = properties.filter(p => p.coordinates && p.coordinates.lat && p.coordinates.lng);
          
          // If there's only one property, center on the property instead of user location
          if (validProperties.length === 1) {
            const property = validProperties[0];
            map.current.setCenter([property.coordinates.lng, property.coordinates.lat]);
            map.current.setZoom(16);
            console.log('📍 Map centered on individual property location after getting user position');
          } else {
            // Otherwise, center on user location
            map.current.setCenter([longitude, latitude]);
            map.current.setZoom(14);
            console.log('📍 Map centered on user location after getting position');
          }
        }
      },
      (error) => {
        console.error('Location error:', error);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access denied. Please enable location services.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out.');
            break;
          default:
            setLocationError('An unknown error occurred getting location.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Get user location on component mount if enabled
  useEffect(() => {
    if (showUserLocation) {
      getUserLocation();
    }
  }, [showUserLocation]);

  // Update map center when user location changes (prioritize property location for single property)
  useEffect(() => {
    if (map.current && userLocation) {
      const validProperties = properties.filter(p => p.coordinates && p.coordinates.lat && p.coordinates.lng);
      
      // If there's only one property, center on the property instead of user location
      if (validProperties.length === 1) {
        const property = validProperties[0];
        map.current.setCenter([property.coordinates.lng, property.coordinates.lat]);
        map.current.setZoom(16);
        console.log('📍 Map centered on individual property location');
      } else {
        // Otherwise, center on user location
        map.current.setCenter([userLocation.lng, userLocation.lat]);
        map.current.setZoom(14);
        console.log('📍 Map centered on user location');
      }
    }
  }, [userLocation, properties]);

  // Debug: Log properties received
  console.log('Map component received properties:', properties.length);
  console.log('Properties with valid coordinates:', properties.filter(p => p.coordinates && p.coordinates.lat && p.coordinates.lng).length);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    try {
      mapboxgl.accessToken = mapboxToken;
      
      // Initialize map with a neutral center and reasonable zoom
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-79.3832, 43.6532], // Toronto as initial center
        zoom: 10, // Reasonable initial zoom
        maxZoom: 18,
        minZoom: 8, // Prevent zooming out too much
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

              // Wait for map to load before adding markers
        map.current.on('load', () => {
          console.log('Map loaded, adding markers for properties:', properties.length);
          
          // Collect all valid properties for bounds calculation
          const validProperties = properties.filter(p => p.coordinates && p.coordinates.lng && p.coordinates.lat);
          const bounds = new mapboxgl.LngLatBounds();
          
          validProperties.forEach((property) => {
            console.log('Property coordinates:', property.id, property.coordinates);
            
            const markerElement = document.createElement('div');
            markerElement.className = 'map-marker';
            markerElement.innerHTML = `
              <div class="bg-blue-600 text-white px-2 py-1 rounded-lg shadow-lg text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors">
                $${property.price.toLocaleString()}
              </div>
            `;

            markerElement.addEventListener('click', () => setSelectedProperty(property));

            new mapboxgl.Marker(markerElement)
              .setLngLat([property.coordinates.lng, property.coordinates.lat])
              .addTo(map.current!);
              
            // Extend bounds to include this property
            bounds.extend([property.coordinates.lng, property.coordinates.lat]);
          });
          
          // Center on property location if single property, or user location if available
          if (validProperties.length === 1) {
            // Single property: center on property location
            const property = validProperties[0];
            map.current!.setCenter([property.coordinates.lng, property.coordinates.lat]);
            map.current!.setZoom(16);
            console.log('📍 Map centered on individual property location on load');
          } else if (userLocation) {
            // Multiple properties or no properties: center on user location
            map.current!.setCenter([userLocation.lng, userLocation.lat]);
            map.current!.setZoom(14);
            console.log('📍 Map centered on user location on load');
          }
          
          // Add user location marker if available
          if (userLocation) {
            // Create a custom user location marker
            const userMarkerElement = document.createElement('div');
            userMarkerElement.className = 'user-location-marker';
            userMarkerElement.innerHTML = `
              <div class="w-6 h-6 bg-blue-500 border-2 border-white rounded-full shadow-lg flex items-center justify-center">
                <div class="w-2 h-2 bg-white rounded-full"></div>
              </div>
            `;
            
            new mapboxgl.Marker(userMarkerElement)
              .setLngLat([userLocation.lng, userLocation.lat])
              .addTo(map.current!);
              
            console.log('📍 User location marker added');
          }
          
          // Fit map to show all properties if there are multiple
          if (validProperties.length > 1) {
            // Check if bounds are reasonable (not too far apart)
            const boundsWidth = bounds.getWest() - bounds.getEast();
            const boundsHeight = bounds.getNorth() - bounds.getSouth();
            
            // If bounds are too large (more than 10 degrees), don't fit bounds
            if (Math.abs(boundsWidth) < 10 && Math.abs(boundsHeight) < 10) {
              map.current!.fitBounds(bounds, {
                padding: 50, // Add some padding around the bounds
                maxZoom: 15, // Don't zoom in too much
                minZoom: 8, // Don't zoom out too much
                duration: 1000 // Smooth animation
              });
            } else {
              // If bounds are too large, just center on the first property
              const firstProperty = validProperties[0];
              map.current!.setCenter([firstProperty.coordinates.lng, firstProperty.coordinates.lat]);
              map.current!.setZoom(12);
            }
          }
        });

      // Handle map errors
      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
      });

    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => map.current?.remove();
  }, [properties, mapboxToken]);

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput.trim() && onTokenSubmit) {
      onTokenSubmit(tokenInput.trim());
    }
  };

  if (!mapboxToken) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-50 p-8">
        <MapPin className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Map View Requires Mapbox Token</h3>
        <p className="text-gray-500 text-center mb-4">
          To use the map functionality, please enter your Mapbox public token below.
          Get one free at <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">mapbox.com</a>
        </p>
        <form onSubmit={handleTokenSubmit} className="w-full max-w-md">
          <input
            type="text"
            placeholder="Enter your Mapbox public token..."
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 mb-2"
          />
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Load Map
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Location Controls */}
      {showUserLocation && (
        <div className="absolute top-4 right-4 z-10 space-y-2">
          {/* Location Error Alert */}
          {locationError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-md text-sm max-w-xs">
              <div className="flex items-center">
                <span className="mr-2">⚠️</span>
                <span>{locationError}</span>
              </div>
            </div>
          )}
          
          {/* Location Button */}
          <button
            onClick={getUserLocation}
            className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg p-2 shadow-md transition-colors"
            title="Get my location"
          >
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </button>
        </div>
      )}
      
      {selectedProperty && (
        <div className="absolute top-4 left-4 z-10">
          <Card className="p-4 bg-white shadow-lg max-w-sm">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-900 line-clamp-1">{selectedProperty.title}</h3>
              <button
                onClick={() => setSelectedProperty(null)}
                className="text-gray-400 hover:text-gray-600 ml-2"
              >
                ×
              </button>
            </div>
            
            <div className="flex items-center text-gray-600 mb-2">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="text-sm">{selectedProperty.city}</span>
            </div>

            <div className="flex items-center text-gray-600 mb-3">
              <Home className="w-4 h-4 mr-1" />
              <span className="text-sm">
                {selectedProperty.bedrooms} bed • {selectedProperty.bathrooms} bath
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-lg font-bold text-blue-600">
                ${selectedProperty.price.toLocaleString()}
                <span className="text-sm font-normal text-gray-500">/month</span>
              </div>
              <button
                onClick={() => onPropertyClick(selectedProperty.id)}
                className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
              >
                View Details
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Map;
