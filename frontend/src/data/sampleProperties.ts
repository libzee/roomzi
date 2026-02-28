export interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  price: number;
  type: 'room' | 'apartment' | 'house' | 'condo';
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string[];
  description: string;
  amenities: string[];
  landlord_id: string;
  landlord_name: string;
  landlord_phone: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  available: boolean;
  lease_type: 'short-term' | 'long-term';
  requirements: string[];
  house_rules: string[];
}

export const sampleProperties: Property[] = [
  {
    id: '1',
    title: 'Modern Studio in Kensington Market',
    address: '123 Augusta Ave',
    city: 'Toronto',
    state: 'ON',
    zip_code: 'M5T 2L4',
    price: 1800,
    type: 'room',
    bedrooms: 1,
    bathrooms: 1,
    area: 450,
    images: [
      'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg',
      'https://images.pexels.com/photos/1571453/pexels-photo-1571453.jpeg'
    ],
    description: 'Bright studio apartment in the heart of Kensington Market. Walking distance to TTC and local restaurants.',
    amenities: ['WiFi', 'Kitchen', 'Laundry', 'Street Parking'],
    landlord_id: 'df9c9599-347f-4ca5-88f5-81c5e7493025',
    landlord_name: 'Alex Rodriguez',
    landlord_phone: '(416) 555-0123',
    coordinates: { lat: 43.6544, lng: -79.4047 },
    available: true,
    lease_type: 'long-term',
    requirements: ['Credit check', 'Income verification', 'Security deposit'],
    house_rules: ['No smoking', 'No pets', 'Quiet hours 10pm-7am']
  },
  {
    id: '2',
    title: '2BR Apartment in Queen West',
    address: '456 Queen St W',
    city: 'Toronto',
    state: 'ON',
    zip_code: 'M5V 2B2',
    price: 2800,
    type: 'apartment',
    bedrooms: 2,
    bathrooms: 1,
    area: 850,
    images: [
      'https://images.pexels.com/photos/1571458/pexels-photo-1571458.jpeg',
      'https://images.pexels.com/photos/1571459/pexels-photo-1571459.jpeg'
    ],
    description: 'Spacious 2-bedroom apartment in Queen West. Recently renovated with modern appliances.',
    amenities: ['WiFi', 'Dishwasher', 'In-unit laundry', 'Bike storage'],
    landlord_id: '2',
    landlord_name: 'Maria Garcia',
    landlord_phone: '(416) 555-0456',
    coordinates: { lat: 43.6487, lng: -79.3975 },
    available: true,
    lease_type: 'long-term',
    requirements: ['Credit score 650+', 'Income 3x rent', 'References'],
    house_rules: ['No smoking', 'Pets considered', 'Renters insurance required']
  },
  {
    id: '3',
    title: '3BR House in Leslieville',
    address: '789 Queen St E',
    city: 'Toronto',
    state: 'ON',
    zip_code: 'M4M 1H8',
    price: 3800,
    type: 'house',
    bedrooms: 3,
    bathrooms: 2,
    area: 1600,
    images: [
      'https://images.pexels.com/photos/1571461/pexels-photo-1571461.jpeg',
      'https://images.pexels.com/photos/1571462/pexels-photo-1571462.jpeg'
    ],
    description: 'Charming Victorian house in Leslieville. Large backyard and updated kitchen.',
    amenities: ['WiFi', 'Washer/Dryer', 'Parking', 'Garden'],
    landlord_id: '3',
    landlord_name: 'David Kim',
    landlord_phone: '(416) 555-0789',
    coordinates: { lat: 43.6617, lng: -79.3407 },
    available: true,
    lease_type: 'long-term',
    requirements: ['Credit check', 'Income verification', 'Security deposit'],
    house_rules: ['No smoking', 'Pets allowed with deposit', 'Garden maintenance']
  }
];
