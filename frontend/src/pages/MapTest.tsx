import React, { useState } from 'react';
import Map from '@/components/Map';
import { Property } from '@/data/sampleProperties';

const MapTest = () => {
  const [mapboxToken, setMapboxToken] = useState<string>(import.meta.env.VITE_MAPBOX_TOKEN || '');
  
  // Sample property for testing
  const testProperty: Property = {
    id: 'test-1',
    title: 'Test Property',
    address: '123 Test St',
    city: 'Toronto',
    state: 'ON',
    zipCode: 'M5V 3A8',
    price: 2500,
    type: 'apartment',
    bedrooms: 2,
    bathrooms: 1,
    area: 800,
    images: ['https://via.placeholder.com/400x300'],
    description: 'Test property description',
    amenities: ['Parking', 'Gym'],
    landlordId: 'landlord-1',
    landlordName: 'Test Landlord',
    landlordPhone: '416-555-0123',
    coordinates: { lat: 43.6532, lng: -79.3832 }
  };

  const handlePropertyClick = (propertyId: string) => {
    console.log('Property clicked:', propertyId);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Map Component Test</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
          <h2 className="text-lg font-semibold mb-2">Instructions:</h2>
          <ol className="list-decimal list-inside space-y-1 text-gray-600">
            <li>Enter a valid Mapbox public token</li>
            <li>Click "Load Map" to initialize the map</li>
            <li>The map should display with a marker for the test property</li>
            <li>Click the marker to see property details</li>
          </ol>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: '600px' }}>
          <Map 
            properties={[testProperty]}
            onPropertyClick={handlePropertyClick}
            mapboxToken={mapboxToken}
            onTokenSubmit={setMapboxToken}
          />
        </div>

        <div className="mt-4 bg-white rounded-lg shadow-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Debug Info:</h2>
          <div className="text-sm text-gray-600">
            <p>Token length: {mapboxToken.length}</p>
            <p>Token preview: {mapboxToken ? `${mapboxToken.substring(0, 10)}...` : 'None'}</p>
            <p>Properties count: 1</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapTest; 